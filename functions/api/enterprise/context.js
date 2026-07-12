import { enterpriseContext, enterpriseOptions } from "../_enterprise.mjs";

export function onRequestOptions() {
  return enterpriseOptions();
}

export function onRequestGet(context) {
  return enterpriseContext(context.env, context.request);
}
