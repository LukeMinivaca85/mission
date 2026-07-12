import { json, options } from "./_openrouter.js";

const ROLE_PERMISSIONS = {
  owner: ["organization:read", "billing:manage", "members:manage", "policies:manage", "integrations:manage", "audit:read", "api_keys:manage", "approvals:decide", "exports:create"],
  admin: ["organization:read", "members:manage", "agents:manage", "missions:run", "policies:manage", "integrations:manage", "audit:read", "approvals:decide", "exports:create"],
  operator: ["organization:read", "agents:manage", "missions:run", "approvals:request"],
  analyst: ["organization:read", "audit:read", "exports:create"],
  viewer: ["organization:read"],
};

export function enterpriseOptions() {
  return options();
}

export function enterpriseContext(env, request) {
  const orgId = request.headers.get("x-org-id") || env.MISSION_ORG_ID || "org_lukintosh";
  const userEmail = request.headers.get("x-user-email") || env.MISSION_OWNER_EMAIL || "owner@lukintosh.com";
  const plan = env.MISSION_PLAN || "enterprise";

  return json({
    ok: true,
    id: orgId,
    slug: env.MISSION_ORG_SLUG || "lukintosh",
    name: env.MISSION_ORG_NAME || "Lukintosh",
    plan,
    activeWorkspaceId: "wrk_cloud",
    currentUser: {
      id: "cloud-user",
      name: env.MISSION_OWNER_NAME || "Owner",
      email: userEmail,
      role: "owner",
      permissions: ROLE_PERMISSIONS.owner,
    },
    members: [
      {
        id: "cloud-owner",
        name: env.MISSION_OWNER_NAME || "Owner",
        email: userEmail,
        role: "owner",
        status: "active",
        joinedAt: null,
        lastSeenAt: null,
      },
    ],
    workspaces: [
      {
        id: "wrk_cloud",
        name: "Mission Cloud",
        purpose: "Operar agentes com auditoria, aprovação humana e governança.",
        createdAt: null,
      },
    ],
    governancePolicies: {
      allowedModels: ["openrouter/free"],
      blockedModels: [],
      missionCostLimitUsd: Number(env.MISSION_COST_LIMIT_USD || 10),
      dailyCostLimitUsd: Number(env.MISSION_DAILY_LIMIT_USD || 100),
      monthlyCostLimitUsd: Number(env.MISSION_MONTHLY_LIMIT_USD || 5000),
      allowedTools: ["pesquisar_web", "ler_arquivo", "consultar_api", "gerar_relatorio"],
      blockedTools: ["enviar_email", "excluir_arquivo", "gastar_dinheiro", "executar_codigo"],
      requireHumanApproval: true,
      historyRetentionDays: 365,
      exportPolicy: "approved_users",
      sharingPolicy: "organization_only",
      dataTrainingOptOut: true,
    },
    approvalRequests: [],
    auditEvents: [],
    integrations: ["Microsoft Teams", "Slack", "Gmail", "Google Drive", "Microsoft 365", "Webhook", "API personalizada"].map((name) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      status: "not_configured",
      scopes: [],
      connectedBy: null,
      connectedAt: null,
      lastTestAt: null,
      lastResult: null,
    })),
    apiKeys: [],
    budgets: { monthly: { limitUsd: Number(env.MISSION_MONTHLY_LIMIT_USD || 5000), alertThresholds: [50, 80, 100], blockAtLimit: true } },
    usage: { monthlyCostUsd: 0, monthlyTokens: 0, successRate: null, averageLatencyMs: null },
    enterpriseSettings: {
      sso: { status: "pilot", provider: "not_configured", domain: "", enforceSso: false, ownerFallback: true },
      scim: { status: "pilot", tokenConfigured: false, basePath: "/api/scim/v2" },
      privacy: { logRetentionDays: 365, missionRetentionDays: 365, fileRetentionDays: 90, scheduledDeletion: false, privacyNoticeAcceptedAt: null },
    },
    rolePermissions: ROLE_PERMISSIONS,
    runtime: "cloudflare-pages-functions",
    note: "Enterprise persistente exige banco/serviço de dados conectado. Esta Function expõe contexto seguro em modo piloto.",
  });
}

export async function salesLead(env, request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const company = String(body.company || "").trim();
  const consent = Boolean(body.consent);
  if (!name || !email.includes("@") || !company || !consent) {
    return json({ ok: false, error: "Nome, e-mail corporativo, empresa e consentimento são obrigatórios." }, { status: 400 });
  }
  return json({
    ok: true,
    leadId: crypto.randomUUID(),
    message: env.SALES_WEBHOOK_URL
      ? "Lead validado. Conecte SALES_WEBHOOK_URL para roteamento comercial automatizado."
      : "Lead recebido em modo piloto. Configure SALES_WEBHOOK_URL ou CRM para persistência em produção.",
  });
}
