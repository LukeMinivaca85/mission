import { billingOptions, createStripeCheckout } from "../_billing.mjs";

export function onRequestOptions() {
  return billingOptions();
}

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  return createStripeCheckout(context.env, context.request, body);
}
