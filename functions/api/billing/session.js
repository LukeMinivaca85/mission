import { billingOptions, retrieveStripeCheckoutSession } from "../_billing.mjs";

export function onRequestOptions() {
  return billingOptions();
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  return retrieveStripeCheckoutSession(context.env, url.searchParams.get("session_id"));
}
