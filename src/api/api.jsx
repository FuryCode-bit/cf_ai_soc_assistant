const BASE_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const api = {

  // Lists active rooms
  fetchIncidents: async () => {
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      headers: { 'x-api-key': API_KEY }
    });
    return res.json();
  },

  // Gets the memory from the Durable Object
  fetchHistory: async (incidentId) => {
    const res = await fetch(`${BASE_URL}/api/history/${incidentId}`, {
      headers: { 'x-api-key': API_KEY }
    });
    return res.json();
  },

  // Sends message to the LLM
  sendMessage: async (incidentId, message) => {
    const res = await fetch(`${BASE_URL}/api/chat/${incidentId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY 
      },
      body: JSON.stringify({ message })
    });
    return res.json();
  },

  // Remediate call
  remediate: async (incidentId) => {
    const res = await fetch(`${BASE_URL}/api/remediate/${incidentId}`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY }
    });
    return res.json();
  },

  //Incident push via webhook
  simulateWebhook: async () => {
    const res = await fetch(`${BASE_URL}/webhook/ingest`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_KEY 
      },
      body: JSON.stringify({ 
        type: "Multiple Authentication Failures", 
        severity: "critical", 
        ip: "10.0.4.22",
        target: "SSH Service"
      })
    });
    return res.json();
  }
};