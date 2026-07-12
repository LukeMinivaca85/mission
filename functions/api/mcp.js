import { json, options } from "./_openrouter.js";

export function onRequestOptions() {
  return options();
}

export function onRequestGet() {
  return json({
    ok: true,
    name: "Lukintosh Mission Control MCP",
    version: "0.1.0",
    transport: "http-readonly",
    guarded: true,
    capabilities: {
      tools: ["connector.status", "mission.audit", "agent.inspect"],
      resources: ["mission://logs", "mission://agents", "mission://connectors"],
      prompts: ["mission.safe-plan"],
    },
    message: "MCP remoto de desenvolvimento ativo. Ações mutáveis exigem aprovação humana.",
    runtime: "cloudflare-pages-functions",
  });
}
