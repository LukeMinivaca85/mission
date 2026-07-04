import { options, runAgent } from "./_openrouter.js";

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  return runAgent(context.env, body);
}
