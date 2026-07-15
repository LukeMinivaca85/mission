import { funnelOptions, funnelSummary } from "../_funnel.mjs";

export function onRequestOptions() {
  return funnelOptions();
}

export function onRequestGet() {
  return funnelSummary();
}
