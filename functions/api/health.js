import { getDefaultModel, getFallbackModels, json, options } from "./_openrouter.js";
import { getStripeBillingStatus } from "./_billing.mjs";

export function onRequestOptions() {
  return options();
}

export function onRequestGet(context) {
  return json({
    ok: true,
    configured: Boolean(context.env.OPENROUTER_API_KEY),
    model: getDefaultModel(context.env),
    fallback_models: getFallbackModels(context.env),
    billing: getStripeBillingStatus(context.env),
    runtime: "cloudflare-pages-functions",
  });
}
