import { billingOptions, parseStripeWebhook } from "../_billing.mjs";

export function onRequestOptions() {
  return billingOptions();
}

export async function onRequestPost(context) {
  return parseStripeWebhook(context.env, context.request);
}
