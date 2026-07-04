import { fetchModels, json, options } from "./_openrouter.js";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  return json(await fetchModels(context.env));
}
