import { earlyAccessOptions, earlyAccessStats } from "../_early_access.mjs";

export function onRequestOptions() {
  return earlyAccessOptions();
}

export function onRequestGet() {
  return earlyAccessStats();
}
