import { earlyAccessGone, earlyAccessOptions } from "../_early_access.mjs";

export function onRequestOptions() {
  return earlyAccessOptions();
}

export function onRequestPost() {
  return earlyAccessGone();
}
