import { funnelOptions, recordFunnelEvent } from "../_funnel.mjs";

export function onRequestOptions() {
  return funnelOptions();
}

export async function onRequestPost(context) {
  return recordFunnelEvent(context.request);
}
