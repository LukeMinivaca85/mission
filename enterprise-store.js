const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "enterprise-state.json");

const ROLE_PERMISSIONS = {
  owner: [
    "organization:read",
    "organization:delete",
    "billing:manage",
    "members:manage",
    "admins:manage",
    "agents:manage",
    "missions:run",
    "policies:manage",
    "integrations:manage",
    "audit:read",
    "api_keys:manage",
    "approvals:decide",
    "exports:create",
  ],
  admin: [
    "organization:read",
    "members:manage",
    "agents:manage",
    "missions:run",
    "policies:manage",
    "integrations:manage",
    "audit:read",
    "approvals:decide",
    "exports:create",
  ],
  operator: ["organization:read", "agents:manage", "missions:run", "approvals:request"],
  analyst: ["organization:read", "audit:read", "exports:create"],
  viewer: ["organization:read"],
};

const SENSITIVE_ACTIONS = [
  "enviar_email",
  "excluir_arquivo",
  "gastar_dinheiro",
  "publicar_conteudo",
  "modificar_dados",
  "chamar_api_externa",
  "executar_codigo",
];

function createEnterpriseStore() {
  let state = readState();

  function context(req) {
    const orgId = String(req.get("x-org-id") || state.activeOrganizationId || "org_lukintosh").trim();
    const email = String(req.get("x-user-email") || "owner@lukintosh.com").toLowerCase().trim();
    const apiKey = String(req.get("x-api-key") || "").trim();
    const organization = state.organizations.find((item) => item.id === orgId);
    if (!organization) return { ok: false, status: 404, error: "Organização não encontrada." };

    const member = organization.members.find((item) => item.email.toLowerCase() === email && item.status !== "removed");
    const keyRecord = apiKey ? findApiKey(organization, apiKey) : null;
    if (!member && !keyRecord) {
      return { ok: false, status: 403, error: "Usuário não pertence a esta organização." };
    }

    if (keyRecord) {
      keyRecord.lastUsedAt = new Date().toISOString();
      writeState(state);
    }

    return {
      ok: true,
      organization,
      member: member || {
        id: keyRecord.id,
        name: keyRecord.name,
        email: "api-key@lukintosh.local",
        role: "viewer",
        scopes: keyRecord.scopes,
      },
      apiKey: keyRecord,
    };
  }

  function authorize(ctx, permission) {
    if (!ctx.ok) return ctx;
    const scopes = ctx.apiKey?.scopes || ROLE_PERMISSIONS[ctx.member.role] || [];
    if (!scopes.includes(permission)) {
      return { ok: false, status: 403, error: `Permissão necessária: ${permission}.` };
    }
    return { ok: true };
  }

  function getContext(req) {
    const ctx = context(req);
    if (!ctx.ok) return ctx;
    return {
      ok: true,
      data: publicOrganization(ctx.organization, ctx.member),
    };
  }

  function inviteMember(req, body) {
    const ctx = context(req);
    const auth = authorize(ctx, "members:manage");
    if (!auth.ok) return auth;

    const email = String(body.email || "").toLowerCase().trim();
    const name = String(body.name || "").trim();
    const role = normalizeRole(body.role);
    if (!email || !email.includes("@") || !name) {
      return { ok: false, status: 400, error: "Nome e e-mail corporativo são obrigatórios." };
    }

    if (ctx.organization.members.some((member) => member.email.toLowerCase() === email && member.status !== "removed")) {
      return { ok: false, status: 409, error: "Este membro já existe na organização." };
    }

    const invite = {
      id: crypto.randomUUID(),
      email,
      name,
      role,
      status: "invited",
      invitedBy: ctx.member.email,
      invitedAt: new Date().toISOString(),
    };
    ctx.organization.members.push({ ...invite, joinedAt: null, lastSeenAt: null });
    audit(ctx, "member.invited", "organization_member", invite.id, { email, role }, "success", req);
    writeState(state);
    return { ok: true, data: { member: invite, organization: publicOrganization(ctx.organization, ctx.member) } };
  }

  function updateMember(req, memberId, body) {
    const ctx = context(req);
    const auth = authorize(ctx, "members:manage");
    if (!auth.ok) return auth;
    const member = ctx.organization.members.find((item) => item.id === memberId);
    if (!member) return { ok: false, status: 404, error: "Membro não encontrado." };
    if (member.role === "owner" && ctx.member.id !== member.id) {
      return { ok: false, status: 403, error: "Apenas o próprio Owner pode alterar esse registro." };
    }
    member.role = normalizeRole(body.role || member.role);
    member.status = body.status === "disabled" ? "disabled" : member.status === "invited" ? "invited" : "active";
    audit(ctx, "member.updated", "organization_member", member.id, { role: member.role, status: member.status }, "success", req);
    writeState(state);
    return { ok: true, data: { member, organization: publicOrganization(ctx.organization, ctx.member) } };
  }

  function removeMember(req, memberId) {
    const ctx = context(req);
    const auth = authorize(ctx, "members:manage");
    if (!auth.ok) return auth;
    const member = ctx.organization.members.find((item) => item.id === memberId);
    if (!member) return { ok: false, status: 404, error: "Membro não encontrado." };
    if (member.role === "owner") return { ok: false, status: 403, error: "Owner principal não pode ser removido." };
    member.status = "removed";
    member.removedAt = new Date().toISOString();
    audit(ctx, "member.removed", "organization_member", member.id, { email: member.email }, "success", req);
    writeState(state);
    return { ok: true, data: { organization: publicOrganization(ctx.organization, ctx.member) } };
  }

  function updatePolicies(req, body) {
    const ctx = context(req);
    const auth = authorize(ctx, "policies:manage");
    if (!auth.ok) return auth;
    ctx.organization.governancePolicies = normalizePolicies(body);
    ctx.organization.governancePolicies.updatedAt = new Date().toISOString();
    ctx.organization.governancePolicies.updatedBy = ctx.member.email;
    audit(ctx, "policies.updated", "governance_policies", ctx.organization.id, ctx.organization.governancePolicies, "success", req);
    writeState(state);
    return { ok: true, data: { policies: ctx.organization.governancePolicies } };
  }

  function requestApproval(req, body) {
    const ctx = context(req);
    const auth = authorize(ctx, "approvals:request");
    if (!auth.ok) return auth;
    const approval = {
      id: crypto.randomUUID(),
      workspaceId: body.workspaceId || ctx.organization.activeWorkspaceId,
      missionId: String(body.missionId || ""),
      action: String(body.action || "acao_sensivel"),
      context: String(body.context || ""),
      status: "pending",
      requestedBy: ctx.member.email,
      requestedAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
      justification: "",
    };
    ctx.organization.approvalRequests.unshift(approval);
    audit(ctx, "approval.requested", "approval_request", approval.id, approval, "pending", req);
    writeState(state);
    return { ok: true, data: { approval } };
  }

  function decideApproval(req, approvalId, body) {
    const ctx = context(req);
    const auth = authorize(ctx, "approvals:decide");
    if (!auth.ok) return auth;
    const approval = ctx.organization.approvalRequests.find((item) => item.id === approvalId);
    if (!approval) return { ok: false, status: 404, error: "Solicitação de aprovação não encontrada." };
    if (approval.status !== "pending") return { ok: false, status: 409, error: "Aprovação já foi decidida." };
    approval.status = body.decision === "approved" ? "approved" : "rejected";
    approval.justification = String(body.justification || "");
    approval.decidedBy = ctx.member.email;
    approval.decidedAt = new Date().toISOString();
    audit(ctx, `approval.${approval.status}`, "approval_request", approval.id, { justification: approval.justification }, approval.status, req);
    writeState(state);
    return { ok: true, data: { approval } };
  }

  function createApiKey(req, body) {
    const ctx = context(req);
    const auth = authorize(ctx, "api_keys:manage");
    if (!auth.ok) return auth;
    const raw = `lm_${crypto.randomBytes(24).toString("base64url")}`;
    const record = {
      id: crypto.randomUUID(),
      name: String(body.name || "API Key").trim(),
      prefix: raw.slice(0, 10),
      hash: hashSecret(raw),
      scopes: normalizeScopes(body.scopes),
      createdBy: ctx.member.email,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: body.expiresAt || null,
      revokedAt: null,
    };
    ctx.organization.apiKeys.unshift(record);
    audit(ctx, "api_key.created", "api_key", record.id, { name: record.name, scopes: record.scopes }, "success", req);
    writeState(state);
    return { ok: true, data: { apiKey: sanitizeApiKey(record), secret: raw } };
  }

  function revokeApiKey(req, keyId) {
    const ctx = context(req);
    const auth = authorize(ctx, "api_keys:manage");
    if (!auth.ok) return auth;
    const record = ctx.organization.apiKeys.find((item) => item.id === keyId);
    if (!record) return { ok: false, status: 404, error: "API key não encontrada." };
    record.revokedAt = new Date().toISOString();
    audit(ctx, "api_key.revoked", "api_key", record.id, { name: record.name }, "success", req);
    writeState(state);
    return { ok: true, data: { apiKey: sanitizeApiKey(record) } };
  }

  function createSalesLead(req, body) {
    const lead = {
      id: crypto.randomUUID(),
      name: String(body.name || "").trim(),
      email: String(body.email || "").toLowerCase().trim(),
      company: String(body.company || "").trim(),
      role: String(body.role || "").trim(),
      teamSize: String(body.teamSize || "").trim(),
      useCase: String(body.useCase || "").trim(),
      message: String(body.message || "").trim(),
      consent: Boolean(body.consent),
      createdAt: new Date().toISOString(),
    };
    if (!lead.name || !lead.email.includes("@") || !lead.company || !lead.consent) {
      return { ok: false, status: 400, error: "Nome, e-mail corporativo, empresa e consentimento são obrigatórios." };
    }
    state.salesLeads.unshift(lead);
    const organization = state.organizations.find((item) => item.id === state.activeOrganizationId);
    audit({ organization, member: { email: lead.email } }, "sales_lead.created", "sales_lead", lead.id, { company: lead.company, teamSize: lead.teamSize }, "success", req);
    writeState(state);
    return { ok: true, data: { leadId: lead.id, message: "Solicitação comercial registrada." } };
  }

  function exportUsageCsv(req) {
    const ctx = context(req);
    const auth = authorize(ctx, "exports:create");
    if (!auth.ok) return auth;
    const rows = [["period", "scope", "cost_usd", "tokens", "limit_usd", "status"]];
    const budget = ctx.organization.budgets.monthly;
    rows.push([new Date().toISOString().slice(0, 7), "organization", String(ctx.organization.usage.monthlyCostUsd), String(ctx.organization.usage.monthlyTokens), String(budget.limitUsd), budget.blockAtLimit ? "block_at_limit" : "monitor"]);
    audit(ctx, "usage.exported", "usage_events", ctx.organization.id, { format: "csv" }, "success", req);
    writeState(state);
    return { ok: true, csv: rows.map((row) => row.map(csvCell).join(",")).join("\n") };
  }

  return {
    getContext,
    inviteMember,
    updateMember,
    removeMember,
    updatePolicies,
    requestApproval,
    decideApproval,
    createApiKey,
    revokeApiKey,
    createSalesLead,
    exportUsageCsv,
    ROLE_PERMISSIONS,
  };
}

function readState() {
  try {
    return migrate(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  } catch {
    const initial = migrate({});
    writeState(initial);
    return initial;
  }
}

function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function migrate(value) {
  const now = new Date().toISOString();
  const org = value.organizations?.[0] || {};
  const orgId = org.id || "org_lukintosh";
  const workspaceId = org.activeWorkspaceId || org.workspaces?.[0]?.id || "wrk_command";
  return {
    version: 1,
    activeOrganizationId: value.activeOrganizationId || orgId,
    salesLeads: Array.isArray(value.salesLeads) ? value.salesLeads : [],
    organizations: [
      {
        id: orgId,
        slug: org.slug || "lukintosh",
        name: org.name || "Lukintosh",
        plan: org.plan || "enterprise",
        ownerEmail: org.ownerEmail || "owner@lukintosh.com",
        activeWorkspaceId: workspaceId,
        createdAt: org.createdAt || now,
        members: normalizeMembers(org.members),
        workspaces: normalizeWorkspaces(org.workspaces, workspaceId, now),
        governancePolicies: normalizePolicies(org.governancePolicies),
        approvalRequests: Array.isArray(org.approvalRequests) ? org.approvalRequests : [],
        auditEvents: Array.isArray(org.auditEvents) ? org.auditEvents : [],
        integrations: normalizeIntegrations(org.integrations),
        apiKeys: Array.isArray(org.apiKeys) ? org.apiKeys : [],
        budgets: org.budgets || { monthly: { limitUsd: 5000, alertThresholds: [50, 80, 100], blockAtLimit: true } },
        usage: org.usage || { monthlyCostUsd: 0, monthlyTokens: 0, successRate: null, averageLatencyMs: null },
        enterpriseSettings: normalizeEnterpriseSettings(org.enterpriseSettings),
      },
    ],
  };
}

function normalizeMembers(members = []) {
  const base = members.length
    ? members
    : [{ id: "mem_owner", name: "Lucas Correa", email: "owner@lukintosh.com", role: "owner", status: "active" }];
  return base.map((member) => ({
    id: member.id || crypto.randomUUID(),
    name: member.name || "Membro",
    email: String(member.email || "member@company.com").toLowerCase(),
    role: normalizeRole(member.role),
    status: member.status || "active",
    joinedAt: member.joinedAt || new Date().toISOString(),
    lastSeenAt: member.lastSeenAt || null,
  }));
}

function normalizeWorkspaces(workspaces = [], workspaceId, now) {
  const base = workspaces.length
    ? workspaces
    : [{ id: workspaceId, name: "Command Center", purpose: "Operar agentes com auditoria e aprovação humana." }];
  return base.map((workspace) => ({
    id: workspace.id || crypto.randomUUID(),
    name: workspace.name || "Workspace",
    purpose: workspace.purpose || "",
    createdAt: workspace.createdAt || now,
    archivedAt: workspace.archivedAt || null,
  }));
}

function normalizePolicies(value = {}) {
  return {
    allowedModels: normalizeList(value.allowedModels || ["openrouter/free"]),
    blockedModels: normalizeList(value.blockedModels),
    missionCostLimitUsd: Number(value.missionCostLimitUsd || 10),
    dailyCostLimitUsd: Number(value.dailyCostLimitUsd || 100),
    monthlyCostLimitUsd: Number(value.monthlyCostLimitUsd || 5000),
    allowedTools: normalizeList(value.allowedTools || ["pesquisar_web", "ler_arquivo", "consultar_api", "gerar_relatorio"]),
    blockedTools: normalizeList(value.blockedTools || SENSITIVE_ACTIONS),
    requireHumanApproval: value.requireHumanApproval !== false,
    sensitiveActions: normalizeList(value.sensitiveActions || SENSITIVE_ACTIONS),
    historyRetentionDays: Number(value.historyRetentionDays || 365),
    exportPolicy: value.exportPolicy || "approved_users",
    sharingPolicy: value.sharingPolicy || "organization_only",
    dataTrainingOptOut: value.dataTrainingOptOut !== false,
    updatedAt: value.updatedAt || null,
    updatedBy: value.updatedBy || null,
  };
}

function normalizeIntegrations(items = []) {
  const names = ["Microsoft Teams", "Slack", "Gmail", "Google Drive", "Microsoft 365", "Webhook", "API personalizada"];
  return names.map((name) => {
    const current = items.find((item) => item.name === name) || {};
    return {
      id: current.id || slug(name),
      name,
      status: current.status || "not_configured",
      connectedBy: current.connectedBy || null,
      connectedAt: current.connectedAt || null,
      scopes: current.scopes || [],
      lastTestAt: current.lastTestAt || null,
      lastResult: current.lastResult || null,
    };
  });
}

function normalizeEnterpriseSettings(value = {}) {
  return {
    sso: {
      status: value.sso?.status || "pilot",
      provider: value.sso?.provider || "not_configured",
      domain: value.sso?.domain || "",
      enforceSso: Boolean(value.sso?.enforceSso),
      ownerFallback: value.sso?.ownerFallback !== false,
    },
    scim: {
      status: value.scim?.status || "pilot",
      tokenConfigured: Boolean(value.scim?.tokenConfigured),
      basePath: "/api/scim/v2",
    },
    privacy: {
      logRetentionDays: Number(value.privacy?.logRetentionDays || 365),
      missionRetentionDays: Number(value.privacy?.missionRetentionDays || 365),
      fileRetentionDays: Number(value.privacy?.fileRetentionDays || 90),
      scheduledDeletion: Boolean(value.privacy?.scheduledDeletion),
      privacyNoticeAcceptedAt: value.privacy?.privacyNoticeAcceptedAt || null,
    },
  };
}

function publicOrganization(org, member) {
  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    plan: org.plan,
    activeWorkspaceId: org.activeWorkspaceId,
    currentUser: { id: member.id, name: member.name, email: member.email, role: member.role, permissions: ROLE_PERMISSIONS[member.role] || member.scopes || [] },
    members: org.members.filter((item) => item.status !== "removed").map(({ id, name, email, role, status, joinedAt, lastSeenAt }) => ({ id, name, email, role, status, joinedAt, lastSeenAt })),
    workspaces: org.workspaces.filter((item) => !item.archivedAt),
    governancePolicies: org.governancePolicies,
    approvalRequests: org.approvalRequests.slice(0, 50),
    auditEvents: org.auditEvents.slice(0, 100),
    integrations: org.integrations,
    apiKeys: org.apiKeys.filter((item) => !item.revokedAt).map(sanitizeApiKey),
    budgets: org.budgets,
    usage: org.usage,
    enterpriseSettings: org.enterpriseSettings,
    rolePermissions: ROLE_PERMISSIONS,
  };
}

function audit(ctx, action, resource, resourceId, metadata, result, req) {
  if (!ctx?.organization) return;
  ctx.organization.auditEvents.unshift({
    id: crypto.randomUUID(),
    organizationId: ctx.organization.id,
    workspaceId: ctx.organization.activeWorkspaceId,
    userEmail: ctx.member?.email || "system",
    action,
    resource,
    resourceId,
    at: new Date().toISOString(),
    ip: req?.ip || req?.get?.("x-forwarded-for") || null,
    userAgent: req?.get?.("user-agent") || null,
    correlationId: req?.get?.("x-correlation-id") || crypto.randomUUID(),
    metadata,
    result,
  });
  ctx.organization.auditEvents = ctx.organization.auditEvents.slice(0, 5000);
}

function findApiKey(org, raw) {
  const hash = hashSecret(raw);
  const now = Date.now();
  return org.apiKeys.find((key) => key.hash === hash && !key.revokedAt && (!key.expiresAt || Date.parse(key.expiresAt) > now));
}

function sanitizeApiKey(key) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    scopes: key.scopes,
    createdBy: key.createdBy,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    revokedAt: key.revokedAt,
  };
}

function hashSecret(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalizeRole(value) {
  const role = String(value || "viewer").toLowerCase();
  return ROLE_PERMISSIONS[role] ? role : "viewer";
}

function normalizeScopes(scopes) {
  const requested = Array.isArray(scopes) ? scopes : String(scopes || "organization:read").split(",");
  const allowed = new Set(Object.values(ROLE_PERMISSIONS).flat());
  return normalizeList(requested).filter((scope) => allowed.has(scope));
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

module.exports = {
  createEnterpriseStore,
  ROLE_PERMISSIONS,
};
