import { DurableObject, WorkflowEntrypoint } from "cloudflare:workers";

/**
 * 1. THE DURABLE OBJECT (Incident Room)
 */
export class IncidentRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
  }

  async setup(alert) {
    await this.ctx.storage.put("alert", alert);
    await this.ctx.storage.put("status", "investigating");
    await this.ctx.storage.put("history", [
      { role: "assistant", content: `🚨 SIEM alert received: ${alert.type}. I am ready to investigate.` }
    ]);
  }

  async performTriage() {
    const alertData = await this.ctx.storage.get("alert");
    const prompt = `
      You are a senior SOC analyst. Your job is to analyze the following JSON security alert and provide a summary of what is happening and the likely root cause and affected resources. In the end, provide a step-by-step remediation guide to solve the problem. Follow this rules:

      Rules:
      - If data is missing, say what additional information is needed instead of guessing.
      - Be concise and actionable.

      Alert:: ${JSON.stringify(alertData)}
    `;
    return await this.chat(prompt);
  }

  async addMessage(role, content) {
    let history = await this.ctx.storage.get("history") || [];
    history.push({ role, content });
    await this.ctx.storage.put("history", history);
  }

  async setStatus(status) {
    await this.ctx.storage.put("status", status);
  }

  async getSummary() {
    const history = await this.ctx.storage.get("history") || [];
    const status = await this.ctx.storage.get("status") || "investigating";
    return { history, status };
  }

  async chat(userMessage) {
    const alertData = await this.ctx.storage.get("alert");
    let history = await this.ctx.storage.get("history") || [];
    const systemPrompt = {
      role: "system",
      content: `You are a SOC analyst, acting as a senior security analyst investigating the current incident: ${JSON.stringify(alertData)}. 
      Help the user investigate, contain, and resolve this specific alert.`
    };
    history.push({ role: "user", content: userMessage });
    const aiResponse = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [systemPrompt, ...history]
    });
    history.push({ role: "assistant", content: aiResponse.response });
    await this.ctx.storage.put("history", history);
    return aiResponse.response;
  }
}

/**
 * 2. WORKFLOW (Incident Lifecycle)
 */
export class SecurityWorkflow extends WorkflowEntrypoint {

  async run(event, step) {
    // Determine the step runner (local dev or production)
    const s = step || this.step;
    
    if (!s) {
      throw new Error("Workflow Step runner is missing. Ensure compatibility_flags include 'workflows_beta'.");
    }

    const { incidentId } = event.payload;
    const stub = this.env.INCIDENT_ROOM.get(this.env.INCIDENT_ROOM.idFromName(incidentId));

    console.log(`[Workflow] Started for incident: ${incidentId}`);

    // Step 1: AI Triage
    await s.do("Deep Triage", async () => {
       console.log("Starting Deep Triage via Durable Object...");
       return await stub.performTriage();
    });

    /**
     * Step 2: Wait for Analyst Approval
     */
    console.log(`[Workflow] Waiting for human signal`);
    await s.waitForEvent("Wait for Analyst Approval", {
        event: "remediate", 
        timeout: "15 minutes",
    });

    console.log(`[Workflow] SIGNAL RECEIVED! Moving to Finalize...`);

    // Step 3: Finalize
    await s.do("Finalize Remediation", async () => {
      await stub.setStatus("resolved");
      await stub.addMessage("assistant", "🛡️ Remediation verified. Incident has been moved to RESOLVED status.");
    });
  }
}

/**
 * 3. MAIN ROUTER
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // API Key Auth
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== env.API_KEY) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // Webhook Ingest
    if (url.pathname === "/webhook/ingest" && request.method === "POST") {
      const incidentId = crypto.randomUUID();
      const alert = await request.json();
      const stub = env.INCIDENT_ROOM.get(env.INCIDENT_ROOM.idFromName(incidentId));
      await stub.setup(alert);
      await env.INCIDENTS_KV.put(incidentId, JSON.stringify({ 
        id: incidentId, rule: alert.type, severity: alert.severity, timestamp: new Date().toLocaleTimeString() 
      }));

      // Start Workflow
      await env.SECURITY_WORKFLOW.create({ id: incidentId, params: { incidentId } });
      return Response.json({ incidentId }, { headers: corsHeaders });
    }

    // Get Incidents
    if (url.pathname === "/api/incidents") {
      const list = await env.INCIDENTS_KV.list();
      const items = await Promise.all(list.keys.map(k => env.INCIDENTS_KV.get(k.name, "json")));
      return Response.json(items.filter(i => i !== null), { headers: corsHeaders });
    }

    // Get History/Status
    if (url.pathname.startsWith("/api/history/")) {
      const id = url.pathname.split("/")[3];
      const stub = env.INCIDENT_ROOM.get(env.INCIDENT_ROOM.idFromName(id));
      const summary = await stub.getSummary();
      return Response.json(summary, { headers: corsHeaders });
    }

    // Chat
    if (url.pathname.startsWith("/api/chat/") && request.method === "POST") {
      const id = url.pathname.split("/")[3];
      const { message } = await request.json();
      const stub = env.INCIDENT_ROOM.get(env.INCIDENT_ROOM.idFromName(id));
      const response = await stub.chat(message);
      return Response.json({ response }, { headers: corsHeaders });
    }

    // Remediate (The Signal)
    if (url.pathname.startsWith("/api/remediate/")) {
      const idStr = url.pathname.split("/")[3];
      const stub = env.INCIDENT_ROOM.get(env.INCIDENT_ROOM.idFromName(idStr));
      
      try {
        const workflow = await env.SECURITY_WORKFLOW.get(idStr);
        
        // Check if the workflow instance actually exists
        if (!workflow) throw new Error("Workflow instance not found");

        // Send the event
        await workflow.sendEvent("remediate");

        await stub.setStatus("remediating");
        await stub.addMessage("assistant", "⏳ Signal received. Finalizing incident...");

        return Response.json({ success: true }, { headers: corsHeaders });
      } catch (err) {
        console.error("Workflow Signal Error:", err.message);
        
        return Response.json({ 
          success: false, 
          error: "The LLM is still performing triage. Please wait a few seconds." 
        }, { status: 422, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};