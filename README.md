<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/FuryCode-bit/cf_ai_soc_assistant">
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/94/Cloudflare_Logo.png" alt="Logo" height="60">
  </a>

  <h3 align="center">ShieldGPT: AI-Powered SOC Assistant</h3>

  <p align="center">
    Triaging SIEM alerts with Llama 3.1 and orchestrating incident remediation on the Cloudflare developer platform.
    <br />
    <a href="#architecture-flow"><strong>Explore the Architecture »</strong></a>
    <br />
    <br />
    ·
    <a href="https://github.com/FuryCode-bit/cf_ai_soc_assistant/issues">Report Bug</a>
    ·
    <a href="https://github.com/FuryCode-bit/cf_ai_soc_assistant/issues">Request Feature</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

![ShieldGPT Screenshot][project-screenshot]

### Overview

ShieldGPT is a cloud-native security assistant designed to analyze and help remediate incidents in modern SOC environments. This application leverages the full Cloudflare developer ecosystem to transform raw, technical SIEM logs into actionable intelligence.

The system ingests webhooks (compatible with modern SIEM systems), spins up stateful Incident Rooms using **Durable Objects**, and manages the lifecycle of the threat through **Cloudflare Workflows**. It provides a real-time chat interface for analysts to clarify details about the occurred incidents.

### Key Components
*   **Triage**: Uses Llama 3.1 (Workers AI) to analyze incidents (DDoS, SQLi, Brute Force).
*   **Durable Execution**: Utilizes Cloudflare Workflows to maintain incident state throughout the incident lifecycle.
*   **Stateful Memory**: Employs Durable Objects to store persistent chat history and incident metadata.
*   **Human-in-the-loop**: A specialized remediation engine that pauses automation until a human analyst grants approval.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- TECH STACK -->
### Tech Stack

*   **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
*   **AI Engine**: [Workers AI](https://developers.cloudflare.com/workers-ai/) (Model: `llama-3.1-8b-instruct`)
*   **Orchestration**: [Cloudflare Workflows](https://developers.cloudflare.com/workflows/) (Durable Execution)
*   **Database/State**: [Durable Objects](https://developers.cloudflare.com/durable-objects/) & [Cloudflare KV](https://developers.cloudflare.com/kv/)
*   **Frontend**: React (Vite)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ARCHITECTURE -->
<a name="architecture-flow"></a>
## Architecture & Flow

1.  **Ingestion**: A SIEM sends data through a webhook to the Worker.
2.  **Initialization**: The Worker generates a unique `incidentId`, stores metadata in **KV**, and initializes a **Durable Object**.
3.  **Orchestration**: A **Workflow** is triggered. It calls the Durable Object to perform an initial AI triage.
4.  **Interaction**: The analyst joins the incident room, chats with ShieldGPT to understand the threat.
5.  **Remediation**: The analyst clicks "Take Remedial Action". An event is sent to the Workflow, which wakes up and finalizes the incident (future integrations with MCP servers may enable automated remediation).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

*   Cloudflare Account with Workers/Workflows enabled.
*   `npm` & `wrangler` CLI installed.
*   Authenticated session: `npx wrangler login`.

### Installation & Deployment

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/FuryCode-bit/cf_ai_soc_assistant.git
    cd cf_ai_soc_assistant
    ```

2.  **Create KV Namespace:**
    ```bash
    wrangler kv namespace create INCIDENTS_KV
    ```
    *Copy the ID and update `wrangler.jsonc`.*

3.  **Set API Security Secret:**
    ```bash
    wrangler secret put API_KEY
    ```

4.  **Deploy Worker to Cloudflare:**
    ```bash
    wrangler deploy
    ```
5.  **Preview Frontend:**
    ```bash
    npm run preview
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->
## Usage

### Simulating a SIEM Alert
You can simulate a SIEM alert using the built-in button in the Dashboard or via `curl`:

```bash
curl -X POST https://your-worker.workers.dev/webhook/ingest \
  -H "x-api-key: API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Multiple Authentication Failures",
    "severity": "critical",
    "ip": "192.168.1.100",
    "target": "SSH Service"
  }'
```

### Remediation Flow

1.  Open the Dashboard and select the new incident.
2.  Wait for the **Deep Triage** message from the AI.
3.  Chat with the assistant if you have questions about remediation options.
4.  Click **"Take Remedial Action"** to signal the Workflow to resolve the incident.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/FuryCode-bit/cf_ai_soc_assistant.svg?style=for-the-badge
[contributors-url]: https://github.com/FuryCode-bit/cf_ai_soc_assistant/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/FuryCode-bit/cf_ai_soc_assistant.svg?style=for-the-badge
[stars-url]: https://github.com/FuryCode-bit/cf_ai_soc_assistant/stargazers
[license-shield]: https://img.shields.io/github/license/FuryCode-bit/cf_ai_soc_assistant.svg?style=for-the-badge
[license-url]: https://github.com/FuryCode-bit/cf_ai_soc_assistant/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/FuryCode-bit
[project-screenshot]: readme/dashboard_preview.png