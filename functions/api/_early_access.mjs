import { json, options } from "./_openrouter.js";

export function earlyAccessOptions() {
  return options();
}

export async function earlyAccessStart(request) {
  const body = await request.json().catch(() => ({}));
  const anonymousUserId = String(body.anonymousUserId || "").trim() || `anon_${crypto.randomUUID()}`;
  return json({
    ok: true,
    plan: "early_access",
    anonymousUserId,
    startedAt: new Date().toISOString(),
    message: "Free Early Access ativado sem conta, cartão ou aprovação.",
  });
}

export function earlyAccessStats() {
  return json({
    ok: true,
    stats: {
      mode: "open",
      approvalRequired: false,
      cardRequired: false,
      loginRequired: false,
      plan: "Free Early Access",
    },
  });
}

export function earlyAccessGone() {
  return json(
    {
      ok: false,
      error: "O Early Access agora é aberto. Use POST /api/early-access/start.",
    },
    { status: 410 }
  );
}
