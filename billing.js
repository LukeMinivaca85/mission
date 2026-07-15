const BILLING_STORAGE_KEY = "lukintoshMissionControlBilling";

const BILLING_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: "R$ 0",
    cadence: "para sempre",
    description: "Para testar agentes com segurança em um workspace individual.",
    agentLimit: 3,
    missionLimit: 10,
    workspaceLimit: 1,
    billingStatus: "free",
    features: ["3 agentes", "10 missões/mês", "1 workspace", "Modelos gratuitos", "Logs básicos", "Centro de comando", "Aprovação manual"],
    permissions: {
      canExportPDF: false,
      canExportMarkdown: false,
      canUseAdvancedInspector: false,
      canUseReplay: false,
      canUseMarketplace: false,
      canUseTeamWorkspaces: false,
      canUseBusinessGovernance: false,
      canUseEnterpriseControls: false,
      canUseBenchmark: false,
      canUsePremiumTemplates: false,
    },
  },
  early_access: {
    id: "early_access",
    name: "Free Early Access",
    price: "R$ 0",
    cadence: "piloto",
    description: "Acesso imediato ao piloto, sem conta, sem cartão e sem aprovação.",
    agentLimit: 3,
    missionLimit: 10,
    workspaceLimit: 1,
    billingStatus: "pilot",
    features: ["Sem login", "Sem cartão", "3 agentes", "10 missões/mês", "Inspector completo", "Replay completo", "Templates premium selecionados", "Early Access Member"],
    permissions: {
      canExportPDF: false,
      canExportMarkdown: false,
      canUseAdvancedInspector: true,
      canUseReplay: true,
      canUseMarketplace: true,
      canUseTeamWorkspaces: false,
      canUseBusinessGovernance: false,
      canUseEnterpriseControls: false,
      canUseBenchmark: false,
      canUsePremiumTemplates: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "R$ 49",
    cadence: "mês",
    description: "Para operar missões reais com replay, inspector e exportação.",
    agentLimit: Infinity,
    missionLimit: 500,
    workspaceLimit: 1,
    billingStatus: "active",
    features: ["Agentes ilimitados", "500 missões/mês", "Templates premium", "PDF/Markdown", "Replay completo", "Inspector avançado", "Marketplace", "Benchmark multi-modelo"],
    permissions: {
      canExportPDF: true,
      canExportMarkdown: true,
      canUseAdvancedInspector: true,
      canUseReplay: true,
      canUseMarketplace: true,
      canUseTeamWorkspaces: false,
      canUseBusinessGovernance: false,
      canUseEnterpriseControls: false,
      canUseBenchmark: true,
      canUsePremiumTemplates: true,
    },
  },
  business: {
    id: "business",
    name: "Business",
    price: "R$ 199",
    cadence: "mês",
    description: "Para equipes, governança, auditoria e integrações completas.",
    agentLimit: Infinity,
    missionLimit: 2500,
    workspaceLimit: Infinity,
    billingStatus: "active",
    features: ["Tudo do Pro", "Múltiplos workspaces", "Membros da equipe", "Papéis owner/admin/operator/viewer", "Auditoria por membro", "Limites de custo", "Integrações de equipe"],
    permissions: {
      canExportPDF: true,
      canExportMarkdown: true,
      canUseAdvancedInspector: true,
      canUseReplay: true,
      canUseMarketplace: true,
      canUseTeamWorkspaces: true,
      canUseBusinessGovernance: true,
      canUseEnterpriseControls: false,
      canUseBenchmark: true,
      canUsePremiumTemplates: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "Fale conosco",
    cadence: "contrato",
    description: "Para SSO, SCIM, BYOK, auditoria avançada e implantação dedicada sob contrato.",
    agentLimit: Infinity,
    missionLimit: Infinity,
    workspaceLimit: Infinity,
    billingStatus: "contact",
    features: ["Tudo do Business", "SSO em piloto", "SCIM em piloto", "Logs avançados", "BYOK", "Auditoria", "API keys", "Suporte prioritário sob contrato"],
    permissions: {
      canExportPDF: true,
      canExportMarkdown: true,
      canUseAdvancedInspector: true,
      canUseReplay: true,
      canUseMarketplace: true,
      canUseTeamWorkspaces: true,
      canUseBusinessGovernance: true,
      canUseEnterpriseControls: true,
      canUseBenchmark: true,
      canUsePremiumTemplates: true,
    },
  },
};

function billingMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeBillingState(value = {}) {
  const currentPlan = BILLING_PLANS[value.currentPlan] ? value.currentPlan : "free";
  const plan = BILLING_PLANS[currentPlan];
  const monthKey = value.monthKey === billingMonthKey() ? value.monthKey : billingMonthKey();
  const missionUsageThisMonth = value.monthKey === monthKey ? Number(value.missionUsageThisMonth || 0) : 0;

  return {
    currentPlan,
    monthKey,
    missionUsageThisMonth,
    agentLimit: plan.agentLimit,
    missionLimit: plan.missionLimit,
    billingStatus: plan.billingStatus,
    provider: value.provider || "local",
    stripeCustomerId: value.stripeCustomerId || "",
    stripeSubscriptionId: value.stripeSubscriptionId || "",
    stripeSessionId: value.stripeSessionId || "",
    earlyAccessApplicationId: "",
    earlyAccessInviteCode: "",
    earlyAccessEmail: "",
    anonymousUserId: value.anonymousUserId || "",
    earlyAccessStartedAt: value.earlyAccessStartedAt || "",
    lastCheckoutAt: value.lastCheckoutAt || "",
    ...plan.permissions,
  };
}

function getBillingState() {
  try {
    return normalizeBillingState(JSON.parse(localStorage.getItem(BILLING_STORAGE_KEY) || "{}"));
  } catch {
    return normalizeBillingState();
  }
}

function saveBillingState(nextState) {
  const normalized = normalizeBillingState(nextState);
  localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function getCurrentPlan() {
  return BILLING_PLANS[getBillingState().currentPlan] || BILLING_PLANS.free;
}

function setPlan(planId) {
  return saveBillingState({
    ...getBillingState(),
    currentPlan: BILLING_PLANS[planId] ? planId : "free",
  });
}

function canCreateAgent(currentAgentCount) {
  const billing = getBillingState();
  return billing.agentLimit === Infinity || currentAgentCount < billing.agentLimit;
}

function canRunMission() {
  const billing = getBillingState();
  return billing.missionLimit === Infinity || billing.missionUsageThisMonth < billing.missionLimit;
}

function incrementMissionUsage() {
  const billing = getBillingState();
  return saveBillingState({
    ...billing,
    missionUsageThisMonth: billing.missionUsageThisMonth + 1,
  });
}

function canUseFeature(feature) {
  const billing = getBillingState();
  const featureMap = {
    exportPdf: "canExportPDF",
    exportMarkdown: "canExportMarkdown",
    advancedInspector: "canUseAdvancedInspector",
    replay: "canUseReplay",
    marketplace: "canUseMarketplace",
    premiumTemplate: "canUsePremiumTemplates",
    benchmark: "canUseBenchmark",
    teamWorkspaces: "canUseTeamWorkspaces",
    businessGovernance: "canUseBusinessGovernance",
    enterpriseControls: "canUseEnterpriseControls",
  };
  const key = featureMap[feature];
  return key ? Boolean(billing[key]) : true;
}

function missionUsageSummary(agentCount = 0) {
  const billing = getBillingState();
  const plan = getCurrentPlan();
  return {
    ...billing,
    plan,
    agentCount,
    missionsRemaining: billing.missionLimit === Infinity ? Infinity : Math.max(0, billing.missionLimit - billing.missionUsageThisMonth),
  };
}

function simulateCheckout(planId) {
  return saveBillingState({
    ...getBillingState(),
    currentPlan: BILLING_PLANS[planId] ? planId : "free",
    provider: "local",
    billingStatus: planId === "free" ? "free" : "active",
    lastCheckoutAt: new Date().toISOString(),
  });
}

function activateEarlyAccess({ anonymousUserId } = {}) {
  return saveBillingState({
    ...getBillingState(),
    currentPlan: "early_access",
    provider: "early-access-local",
    billingStatus: "pilot",
    stripeCustomerId: "",
    stripeSubscriptionId: "",
    stripeSessionId: "",
    anonymousUserId: anonymousUserId || getBillingState().anonymousUserId || "",
    earlyAccessStartedAt: new Date().toISOString(),
    lastCheckoutAt: new Date().toISOString(),
  });
}

function activateStripeSubscription({ planId, customerId, subscriptionId, sessionId } = {}) {
  const currentPlan = BILLING_PLANS[planId] ? planId : "pro";
  return saveBillingState({
    ...getBillingState(),
    currentPlan,
    provider: "stripe",
    billingStatus: "active",
    stripeCustomerId: customerId || "",
    stripeSubscriptionId: subscriptionId || "",
    stripeSessionId: sessionId || "",
    lastCheckoutAt: new Date().toISOString(),
  });
}

function showUpgradeModal(feature) {
  window.dispatchEvent(new CustomEvent("billing:upgrade", { detail: { feature } }));
}

window.Billing = {
  PLANS: BILLING_PLANS,
  getBillingState,
  getCurrentPlan,
  setPlan,
  canCreateAgent,
  canRunMission,
  canUseFeature,
  showUpgradeModal,
  incrementMissionUsage,
  missionUsageSummary,
  simulateCheckout,
  activateEarlyAccess,
  activateStripeSubscription,
};
