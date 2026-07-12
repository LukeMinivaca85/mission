import { json, options } from "./_openrouter.js";
import { listConnectors, testConnector } from "./_connectors.mjs";

export function onRequestOptions() {
  return options();
}

export function onRequestGet(context) {
  return json({
    connectors: listConnectors(context.env),
    runtime: "cloudflare-pages-functions",
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  const result = await testConnector(context.env, body.id);
  return json(result, { status: result.ok ? 200 : 400 });
}
