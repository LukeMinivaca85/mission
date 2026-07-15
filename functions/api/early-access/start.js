import { earlyAccessOptions, earlyAccessStart } from "../_early_access.mjs";

export function onRequestOptions() {
  return earlyAccessOptions();
}

export async function onRequestPost(context) {
  return earlyAccessStart(context.request);
}
