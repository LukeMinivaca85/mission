const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2026-02-25.clover";

const STRIPE_PRICE_ENV = {
  pro: "STRIPE_PRICE_PRO",
  business: "STRIPE_PRICE_BUSINESS",
};

export const BILLING_PLAN_NAMES = {
  free: "Free",
  early_access: "Free Early Access",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export function billingOptions() {
  return new Response(null, {
    status: 204,
    headers: billingCorsHeaders("GET,POST,OPTIONS"),
  });
}

export function billingJson(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...billingCorsHeaders("GET,POST,OPTIONS"),
      ...(init.headers || {}),
    },
  });
}

export function getStripeBillingStatus(env) {
  return {
    configured: Boolean(env.STRIPE_SECRET_KEY),
    prices: {
      pro: Boolean(env.STRIPE_PRICE_PRO),
      business: Boolean(env.STRIPE_PRICE_BUSINESS),
    },
    mode: env.STRIPE_SECRET_KEY ? "stripe" : "local-development",
  };
}

export async function createStripeCheckout(env, request, body = {}) {
  const planId = normalizeCheckoutPlan(body.planId);
  const priceId = env[STRIPE_PRICE_ENV[planId]];

  if (!env.STRIPE_SECRET_KEY || !priceId) {
    return billingJson(
      {
        ok: false,
        fallback: true,
        error: "Stripe ainda não está configurado.",
        details: `Configure STRIPE_SECRET_KEY e ${STRIPE_PRICE_ENV[planId]} no servidor para ativar checkout real.`,
      },
      { status: 400 }
    );
  }

  const origin = resolveOrigin(request, body.origin);
  const session = await stripeRequest(env, "/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/?checkout=success&plan=${encodeURIComponent(planId)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled&plan=${encodeURIComponent(planId)}`,
    client_reference_id: String(body.workspaceId || "local-workspace"),
    "metadata[plan]": planId,
    "metadata[product]": "lukintosh-mission-control",
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
  });

  return billingJson({
    ok: true,
    provider: "stripe",
    plan: planId,
    sessionId: session.id,
    url: session.url,
  });
}

export async function retrieveStripeCheckoutSession(env, sessionId) {
  if (!env.STRIPE_SECRET_KEY) {
    return billingJson(
      {
        ok: false,
        error: "Stripe ainda não está configurado.",
      },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return billingJson(
      {
        ok: false,
        error: "session_id é obrigatório.",
      },
      { status: 400 }
    );
  }

  const session = await stripeGet(env, `/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    expand: ["subscription"],
  });
  const plan = normalizeCheckoutPlan(session.metadata?.plan || "pro");
  const isPaid = session.payment_status === "paid" || session.status === "complete";

  return billingJson({
    ok: true,
    provider: "stripe",
    plan,
    status: session.status,
    payment_status: session.payment_status,
    active: isPaid,
    customer: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
    subscription: typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
  });
}

export async function parseStripeWebhook(env, request) {
  const event = await request.json().catch(() => null);

  if (!event?.type) {
    return billingJson({ ok: false, error: "Evento Stripe inválido." }, { status: 400 });
  }

  return billingJson({
    ok: true,
    received: true,
    type: event.type,
    note: env.STRIPE_WEBHOOK_SECRET
      ? "Webhook recebido. Validação de assinatura deve ser feita no runtime Node para eventos críticos."
      : "Webhook recebido sem STRIPE_WEBHOOK_SECRET configurado.",
  });
}

function normalizeCheckoutPlan(planId) {
  const normalized = String(planId || "pro").toLowerCase();
  if (normalized === "business") return "business";
  return "pro";
}

function resolveOrigin(request, explicitOrigin) {
  const requestedOrigin = safeOrigin(explicitOrigin);
  if (requestedOrigin) return requestedOrigin;

  const headerOrigin = safeOrigin(request.headers.get("Origin"));
  if (headerOrigin) return headerOrigin;

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function safeOrigin(value) {
  try {
    const url = new URL(String(value || ""));
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

async function stripeRequest(env, path, params = {}) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => body.append(`${key}[${index}]`, item));
      return;
    }
    if (value !== undefined && value !== null) body.append(key, String(value));
  });

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Stripe ${response.status}`);
  }
  return payload;
}

async function stripeGet(env, path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => query.append(`${key}[${index}]`, item));
      return;
    }
    if (value !== undefined && value !== null) query.append(key, String(value));
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${STRIPE_API_BASE}${path}${suffix}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": STRIPE_API_VERSION,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Stripe ${response.status}`);
  }
  return payload;
}

function billingCorsHeaders(methods) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": methods,
  };
}
