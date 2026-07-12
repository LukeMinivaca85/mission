import { json, options } from "../_openrouter.js";
import { runConnectorAction } from "../_connectors.mjs";

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  const result = await runConnectorAction(context.env, body.id, body.action || "preview");
  return json(result, { status: result.ok ? 200 : 400 });
}
