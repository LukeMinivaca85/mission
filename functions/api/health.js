import { getDefaultModel, getFallbackModels, json, options } from "./_openrouter.js";

export function onRequestOptions() {
  return options();
}

export function onRequestGet(context) {
  return json({
    ok: true,
    configured: Boolean(context.env.OPENROUTER_API_KEY),
    model: getDefaultModel(context.env),
    fallback_models: getFallbackModels(context.env),
    runtime: "cloudflare-pages-functions",
  });
}
