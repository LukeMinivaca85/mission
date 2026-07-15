import { json, options } from "./_openrouter.js";

const state = globalThis.__lukintoshFunnel || { events: [] };
globalThis.__lukintoshFunnel = state;

export function funnelOptions() {
  return options();
}

export async function recordFunnelEvent(request) {
  const body = await request.json().catch(() => ({}));
  const event = String(body.event || "").trim();
  if (!event) return json({ ok: false, error: "event é obrigatório." }, { status: 400 });
  state.events.push({
    id: String(body.id || crypto.randomUUID()),
    event,
    anonymousUserId: String(body.anonymousUserId || "").slice(0, 120),
    plan: String(body.plan || "unknown").slice(0, 40),
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    createdAt: body.createdAt || new Date().toISOString(),
  });
  if (state.events.length > 2000) state.events.splice(0, state.events.length - 2000);
  return json({ ok: true });
}

export function funnelSummary() {
  return json({ ok: true, summary: summarize() });
}

function summarize() {
  const count = (eventName) => state.events.filter((event) => event.event === eventName).length;
  return {
    visitors: count("early_access_page_view"),
    freeUsers: count("start_free_clicked"),
    firstMissionCompleted: count("first_mission_completed"),
    checkoutStarted: count("checkout_started"),
    checkoutCompleted: count("checkout_completed"),
    freeToPro: state.events.filter((event) => event.event === "checkout_completed" && event.metadata?.plan === "pro").length,
    business: state.events.filter((event) => event.event === "checkout_completed" && event.metadata?.plan === "business").length,
  };
}
