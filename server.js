require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const Stripe = require("stripe");
const { createEnterpriseStore } = require("./enterprise-store");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const enterpriseStore = createEnterpriseStore();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const FREE_MODEL_ALIAS = "openrouter/free";
const STRIPE_API_VERSION = "2026-02-25.clover";
const STRIPE_PRICE_ENV = {
  pro: "STRIPE_PRICE_PRO",
  business: "STRIPE_PRICE_BUSINESS",
};
const BUILT_IN_FREE_MODELS = [
  "poolside/laguna-xs-2.1:free",
  "cohere/north-mini-code:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
const FALLBACK_MODELS = uniqueList([
  DEFAULT_MODEL,
  ...String(process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);
const rateLimitBuckets = new Map();

app.use(cors());
app.use(securityHeaders);
app.use("/api", apiRateLimit);

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const stripe = getStripeClient();
    const signature = req.headers["stripe-signature"];
    let event;

    if (stripe && process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString("utf8"));
    }

    res.json({
      ok: true,
      received: true,
      type: event.type,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: "Webhook Stripe inválido.",
      details: error.message,
    });
  }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    model: DEFAULT_MODEL,
    fallback_models: expandModelAliases(FALLBACK_MODELS),
    billing: getStripeBillingStatus(),
    enterprise: {
      enabled: true,
      storage: "file-backed-json",
      sso: "pilot",
      scim: "pilot",
    },
  });
});

app.get("/api/enterprise/context", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.getContext(req));
});

app.post("/api/enterprise/members", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.inviteMember(req, req.body));
});

app.patch("/api/enterprise/members/:memberId", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.updateMember(req, req.params.memberId, req.body));
});

app.delete("/api/enterprise/members/:memberId", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.removeMember(req, req.params.memberId));
});

app.post("/api/enterprise/policies", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.updatePolicies(req, req.body));
});

app.post("/api/enterprise/approvals", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.requestApproval(req, req.body));
});

app.post("/api/enterprise/approvals/:approvalId/decision", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.decideApproval(req, req.params.approvalId, req.body));
});

app.post("/api/enterprise/api-keys", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.createApiKey(req, req.body));
});

app.delete("/api/enterprise/api-keys/:keyId", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.revokeApiKey(req, req.params.keyId));
});

app.get("/api/enterprise/usage.csv", (req, res) => {
  const result = enterpriseStore.exportUsageCsv(req);
  if (!result.ok) {
    return sendEnterpriseResult(res, result);
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="lukintosh-enterprise-usage.csv"');
  res.send(result.csv);
});

app.post("/api/enterprise/sales-leads", (req, res) => {
  sendEnterpriseResult(res, enterpriseStore.createSalesLead(req, req.body));
});

app.post("/api/billing/checkout", async (req, res) => {
  try {
    const planId = normalizeCheckoutPlan(req.body?.planId);
    const priceId = process.env[STRIPE_PRICE_ENV[planId]];
    const stripe = getStripeClient();

    if (!stripe || !priceId) {
      return res.status(400).json({
        ok: false,
        fallback: true,
        error: "Stripe ainda não está configurado.",
        details: `Configure STRIPE_SECRET_KEY e ${STRIPE_PRICE_ENV[planId]} no servidor para ativar checkout real.`,
      });
    }

    const origin = resolveRequestOrigin(req, req.body?.origin);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success&plan=${encodeURIComponent(planId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled&plan=${encodeURIComponent(planId)}`,
      client_reference_id: String(req.body?.workspaceId || "local-workspace"),
      metadata: {
        plan: planId,
        product: "lukintosh-mission-control",
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    res.json({
      ok: true,
      provider: "stripe",
      plan: planId,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: "Falha ao criar checkout do Stripe.",
      details: error.message,
    });
  }
});

app.get("/api/billing/session", async (req, res) => {
  try {
    const stripe = getStripeClient();
    const sessionId = req.query.session_id;

    if (!stripe) {
      return res.status(400).json({
        ok: false,
        error: "Stripe ainda não está configurado.",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: "session_id é obrigatório.",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const plan = normalizeCheckoutPlan(session.metadata?.plan || "pro");
    const active = session.payment_status === "paid" || session.status === "complete";

    res.json({
      ok: true,
      provider: "stripe",
      plan,
      status: session.status,
      payment_status: session.payment_status,
      active,
      customer: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
      subscription: typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: "Falha ao confirmar checkout do Stripe.",
      details: error.message,
    });
  }
});

app.get("/api/mcp", (_req, res) => {
  res.json({
    ok: true,
    name: "Lukintosh Mission Control MCP",
    version: "0.1.0",
    transport: "http-readonly",
    guarded: true,
    capabilities: {
      tools: ["connector.status", "mission.audit", "agent.inspect"],
      resources: ["mission://logs", "mission://agents", "mission://connectors"],
      prompts: ["mission.safe-plan"],
    },
    message: "MCP local de desenvolvimento ativo. Ações mutáveis exigem aprovação humana.",
  });
});

app.get("/api/connectors", async (_req, res) => {
  try {
    const { listConnectors } = await import("./functions/api/_connectors.mjs");
    res.json({
      connectors: listConnectors(process.env),
      runtime: "express-local",
    });
  } catch (error) {
    res.status(500).json({
      error: "Falha ao carregar conectores.",
      details: error.message,
    });
  }
});

app.post("/api/connectors", async (req, res) => {
  try {
    const { testConnector } = await import("./functions/api/_connectors.mjs");
    const result = await testConnector(process.env, req.body?.id);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      state: "error",
      error: "Falha ao testar conector.",
      message: error.message,
    });
  }
});

app.post("/api/connectors/action", async (req, res) => {
  try {
    const { runConnectorAction } = await import("./functions/api/_connectors.mjs");
    const result = await runConnectorAction(process.env, req.body?.id, req.body?.action || "preview");
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      state: "error",
      error: "Falha ao executar ação do conector.",
      message: error.message,
    });
  }
});

app.get("/api/models", async (_req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.json({
      configured_model: DEFAULT_MODEL,
      fallback_models: expandModelAliases(FALLBACK_MODELS),
      models: expandModelAliases(FALLBACK_MODELS).map((model) => ({
        id: model,
        name: model,
        pricing: null,
        context_length: null,
      })),
    });
  }

  try {
    const headers = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    };

    const response = await fetch(OPENROUTER_MODELS_URL, { headers });
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Não foi possível carregar os modelos do OpenRouter.",
        details: await safeResponseText(response),
        configured_model: DEFAULT_MODEL,
        fallback_models: FALLBACK_MODELS,
      });
    }

    const payload = await response.json();
    const models = Array.isArray(payload.data) ? payload.data : [];
    res.json({
      configured_model: DEFAULT_MODEL,
      fallback_models: expandModelAliases(FALLBACK_MODELS),
      models: withFreeAlias(models).map((model) => ({
        id: model.id,
        name: model.name || model.id,
        pricing: model.pricing || null,
        context_length: model.context_length || null,
      })),
    });
  } catch (error) {
    res.status(502).json({
      error: "Falha ao consultar modelos do OpenRouter.",
      details: error.message,
      configured_model: DEFAULT_MODEL,
      fallback_models: FALLBACK_MODELS,
    });
  }
});

app.post("/api/agent-run", async (req, res) => {
  const { agentName, agentRole, task, tools, model } = req.body || {};

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(400).json({
      error: "OPENROUTER_API_KEY não está configurada no servidor.",
      details: "Crie um arquivo .env com OPENROUTER_API_KEY=sua_chave_aqui e reinicie o servidor.",
    });
  }

  if (!agentName || !agentRole || !task) {
    return res.status(400).json({
      error: "Campos obrigatórios ausentes.",
      details: "Envie agentName, agentRole, task e tools.",
    });
  }

  const normalizedTools = Array.isArray(tools) ? tools.join(", ") : String(tools || "nenhuma");
  const candidateModels = uniqueList(expandModelAliases([model, ...FALLBACK_MODELS].filter(Boolean)));
  const errors = [];

  for (const candidateModel of candidateModels) {
    try {
      const startedAt = Date.now();
      const aiPayload = await callOpenRouter({
        model: candidateModel,
        agentName,
        agentRole,
        task,
        tools: normalizedTools,
      });
      const latency_ms = Date.now() - startedAt;
      const content = aiPayload?.choices?.[0]?.message?.content;
      const parsed = normalizeAgentJson(parseJsonFromText(content));

      return res.json({
        model: candidateModel,
        latency_ms,
        usage: aiPayload.usage || null,
        prompt: buildMessages({ agentName, agentRole, task, tools: normalizedTools }),
        raw_model_response: content,
        result: parsed,
      });
    } catch (error) {
      errors.push({ model: candidateModel, message: error.message });
    }
  }

  res.status(502).json({
    error: "A IA não retornou um JSON válido ou os modelos testados falharam.",
    details: errors,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Lukintosh Mission Control rodando em http://localhost:${PORT}`);
  console.log(`Modelo OpenRouter padrão: ${DEFAULT_MODEL}`);
});

server.on("error", (error) => {
  console.error(`Falha ao iniciar servidor na porta ${PORT}:`, error.message);
  process.exitCode = 1;
});

async function callOpenRouter({ model, agentName, agentRole, task, tools }) {
  const messages = buildMessages({ agentName, agentRole, task, tools });
  const body = {
    model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Lukintosh Mission Control",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await safeResponseText(response)}`);
  }

  return response.json();
}

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function apiRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.get("x-forwarded-for") || "local";
  const current = rateLimitBuckets.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  current.count += 1;
  rateLimitBuckets.set(key, current);
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, RATE_LIMIT_MAX - current.count)));
  if (current.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ ok: false, error: "Muitas requisições. Tente novamente em instantes." });
  }
  next();
}

function buildMessages({ agentName, agentRole, task, tools }) {
  return [
    {
      role: "system",
      content:
        "Você é um agente da Lukintosh Mission Control. Planeje tarefas com segurança. Nunca execute ações externas diretamente. Avalie risco, peça aprovação para ações sensíveis e responda somente em JSON válido, sem Markdown, sem blocos de código e sem texto fora do JSON.",
    },
    {
      role: "user",
      content: `Agente: ${agentName}\nFunção: ${agentRole}\nFerramentas permitidas: ${tools}\nTarefa: ${task}\n\nResponda somente em JSON válido neste formato exato:\n{\n  "summary": "string curta",\n  "steps": ["passo 1", "passo 2"],\n  "risk_level": "low|medium|high",\n  "required_approval": true,\n  "suggested_actions": ["acao"]\n}`,
    },
  ];
}

function parseJsonFromText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Resposta vazia da IA.");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Não foi possível encontrar JSON na resposta da IA.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function expandModelAliases(models) {
  return uniqueList(
    models.flatMap((model) => {
      if (!model || model === FREE_MODEL_ALIAS) return BUILT_IN_FREE_MODELS;
      return [model];
    })
  );
}

function withFreeAlias(models) {
  const freeAlias = {
    id: FREE_MODEL_ALIAS,
    name: "OpenRouter Free Auto (alias local)",
    pricing: { prompt: "0", completion: "0" },
    context_length: null,
  };
  return [freeAlias, ...models];
}

function normalizeAgentJson(value) {
  const risk = String(value.risk_level || "medium").toLowerCase();
  const riskLevel = ["low", "medium", "high"].includes(risk) ? risk : "medium";
  const steps = Array.isArray(value.steps)
    ? value.steps.map((step) => String(step)).filter(Boolean)
    : String(value.steps || "")
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean);
  const suggestedActions = Array.isArray(value.suggested_actions)
    ? value.suggested_actions.map((action) => String(action)).filter(Boolean)
    : String(value.suggested_actions || "")
        .split("\n")
        .map((action) => action.trim())
        .filter(Boolean);

  return {
    summary: String(value.summary || "Plano recebido da IA."),
    steps: steps.length ? steps : ["Revisar a tarefa", "Planejar execução segura", "Registrar resultado"],
    risk_level: riskLevel,
    required_approval: Boolean(value.required_approval) || riskLevel !== "low",
    suggested_actions: suggestedActions,
  };
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function getStripeBillingStatus() {
  return {
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
    prices: {
      pro: Boolean(process.env.STRIPE_PRICE_PRO),
      business: Boolean(process.env.STRIPE_PRICE_BUSINESS),
    },
    mode: process.env.STRIPE_SECRET_KEY ? "stripe" : "local-development",
  };
}

function normalizeCheckoutPlan(planId) {
  const normalized = String(planId || "pro").toLowerCase();
  if (normalized === "business") return "business";
  return "pro";
}

function resolveRequestOrigin(req, explicitOrigin) {
  const explicit = safeOrigin(explicitOrigin);
  if (explicit) return explicit;

  const headerOrigin = safeOrigin(req.get("origin"));
  if (headerOrigin) return headerOrigin;

  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("host") || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

function sendEnterpriseResult(res, result) {
  if (!result.ok) {
    return res.status(result.status || 400).json({
      ok: false,
      error: result.error || "Operação Enterprise falhou.",
    });
  }
  return res.json({
    ok: true,
    ...(result.data || {}),
  });
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

async function safeResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "Sem detalhes disponíveis.";
  }
}
