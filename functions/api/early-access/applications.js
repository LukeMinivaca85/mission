import { earlyAccessGone, earlyAccessOptions } from "../_early_access.mjs";

export function onRequestOptions() {
  return earlyAccessOptions();
}

export function onRequestGet() {
  return earlyAccessGone();
}

export function onRequestPost() {
  return earlyAccessGone();
}
