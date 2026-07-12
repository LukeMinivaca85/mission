import { enterpriseOptions, salesLead } from "../_enterprise.mjs";

export function onRequestOptions() {
  return enterpriseOptions();
}

export async function onRequestPost(context) {
  return salesLead(context.env, context.request);
}
