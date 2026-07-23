const STORAGE_KEY = "lukintoshMissionControlState";
const API_BASE_URL = "https://mission-qnfa.onrender.com";
const DAY_913_STORAGE_KEY = "lukintoshDay913Feedback";
const FOUNDER_MODE_KEY = "lukintoshFounderMode";
const ANONYMOUS_USER_KEY = "lukintoshAnonymousUserId";
const EARLY_ACCESS_PROFILE_KEY = "lukintoshEarlyAccessProfile";
const FUNNEL_EVENTS_KEY = "lukintoshMissionFunnelEvents";
const FUNNEL_ONCE_KEY = "lukintoshMissionFunnelOnce";
const RISKY_ACTIONS = new Set(["enviar_email", "excluir_arquivo", "gastar_dinheiro"]);
const SENSITIVE_ACTIONS = new Set([
  "enviar_email",
  "criar_agente",
  "excluir_agente",
  "gastar_dinheiro",
  "excluir_arquivo",
  "modificar_banco",
]);

const TOOL_CATALOG = [
  "pesquisar_web",
  "ler_arquivo",
  "escrever_arquivo",
  "editar_documento",
  "executar_script",
  "usar_terminal",
  "usar_git",
  "acessar_api",
  "enviar_email",
  "criar_agente",
  "excluir_agente",
  "gastar_dinheiro",
  "excluir_arquivo",
  "modificar_banco",
  "gerar_relatorio",
];

const CONNECTORS = [
  {
    id: "github",
    name: "GitHub",
    description: "Repos, issues, pull requests, commits e revisões.",
    category: "Código",
    status: "planejado",
    permissions: ["repos", "issues", "pull_requests"],
    logo: "github",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Ler threads, preparar respostas e solicitar aprovação antes de enviar.",
    category: "Comunicação",
    status: "planejado",
    permissions: ["read_mail", "draft_mail", "send_requires_approval"],
    logo: "gmail",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Canais, mensagens, triagem e handoffs entre times.",
    category: "Comunicação",
    status: "planejado",
    permissions: ["channels", "messages", "threads"],
    logo: "slack",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Documentos, planilhas, PDFs e contexto compartilhado.",
    category: "Arquivos",
    status: "planejado",
    permissions: ["read_files", "export_docs", "write_requires_approval"],
    logo: "drive",
  },
  {
    id: "google-calendar",
    name: "Google Agenda",
    description: "Eventos, disponibilidade, compromissos e planejamento temporal.",
    category: "Calendário",
    status: "planejado",
    permissions: ["read_events", "create_requires_approval", "schedule"],
    logo: "calendar",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Planilhas, métricas, bases operacionais e relatórios.",
    category: "Dados",
    status: "planejado",
    permissions: ["read_sheets", "append_requires_approval", "reports"],
    logo: "sheets",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Páginas, bases de conhecimento, tarefas e documentação.",
    category: "Conhecimento",
    status: "planejado",
    permissions: ["pages", "databases", "comments"],
    logo: "notion",
  },
  {
    id: "http-api",
    name: "APIs HTTP",
    description: "Chamadas REST/JSON com política de risco e auditoria.",
    category: "Automação",
    status: "planejado",
    permissions: ["get", "post_requires_approval", "webhooks"],
    logo: "api",
  },
  {
    id: "local-files",
    name: "Arquivos locais",
    description: "Ler, resumir e preparar alterações em arquivos do computador.",
    category: "Local",
    status: "planejado",
    permissions: ["read_files", "write_requires_approval"],
    logo: "folder",
  },
  {
    id: "sql",
    name: "Banco de dados SQL",
    description: "Consultas, diagnósticos e relatórios sem mutação automática.",
    category: "Dados",
    status: "planejado",
    permissions: ["select", "explain", "mutations_require_approval"],
    logo: "sql",
  },
  {
    id: "mcp",
    name: "MCP Servers",
    description: "Ferramentas externas padronizadas e auditáveis para agentes.",
    category: "Agentes",
    status: "planejado",
    permissions: ["tools", "resources", "prompts"],
    logo: "mcp",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Webhooks, alertas e handoffs para comunidades ou times.",
    category: "Comunicação",
    status: "planejado",
    permissions: ["webhook_read", "send_requires_approval"],
    logo: "discord",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Times, issues, ciclos e planejamento de produto.",
    category: "Produto",
    status: "planejado",
    permissions: ["read_issues", "create_requires_approval"],
    logo: "linear",
  },
  {
    id: "trello",
    name: "Trello",
    description: "Boards, listas, cartões e acompanhamento visual.",
    category: "Projeto",
    status: "planejado",
    permissions: ["read_boards", "card_write_requires_approval"],
    logo: "trello",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM, contatos, empresas e contexto comercial.",
    category: "CRM",
    status: "planejado",
    permissions: ["read_crm", "write_requires_approval"],
    logo: "hubspot",
  },
];

const MISSION_TEMPLATES = [
  {
    name: "Pesquisar concorrentes",
    description: "Mapear competidores, diferenciais, riscos e oportunidades.",
    category: "Pesquisa",
    averageTime: "8 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Entregar uma análise objetiva de concorrentes com tabela comparativa e próximos passos.",
  },
  {
    name: "Revisar código",
    description: "Encontrar bugs, regressões, riscos e melhorias prioritárias.",
    category: "Programação",
    averageTime: "10 min",
    risk: "medium",
    model: "openrouter/free",
    objective: "Gerar uma revisão de código com achados, severidade, arquivos impactados e checklist.",
  },
  {
    name: "Auditoria de segurança",
    description: "Identificar permissões sensíveis, exposição de segredos e superfície de ataque.",
    category: "DevOps",
    averageTime: "12 min",
    risk: "high",
    model: "openrouter/free",
    objective: "Produzir relatório de segurança com riscos, evidências, correções sugeridas e próximos passos.",
  },
  {
    name: "Planejar estudos",
    description: "Criar trilha prática com metas, materiais e rotina semanal.",
    category: "Estudos",
    averageTime: "5 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Entregar um plano de estudos com cronograma, checkpoints e revisão.",
  },
  {
    name: "Criar apresentação",
    description: "Estruturar narrativa, slides, pontos-chave e chamada final.",
    category: "Conteúdo",
    averageTime: "7 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Gerar roteiro de apresentação com seções, mensagens principais e checklist visual.",
  },
  {
    name: "Criar relatório",
    description: "Transformar dados ou contexto em relatório executivo pronto para enviar.",
    category: "Financeiro",
    averageTime: "9 min",
    risk: "medium",
    model: "openrouter/free",
    objective: "Criar relatório com resumo executivo, achados, recomendações e ações.",
  },
  {
    name: "Preparar reunião",
    description: "Definir pauta, perguntas, contexto e critérios de decisão.",
    category: "Vendas",
    averageTime: "4 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Entregar pauta de reunião com objetivos, riscos, perguntas e follow-up.",
  },
  {
    name: "Criar roadmap",
    description: "Organizar prioridades, marcos, riscos e entregas por fase.",
    category: "Produto",
    averageTime: "11 min",
    risk: "medium",
    model: "openrouter/free",
    objective: "Gerar roadmap com fases, dependências, critérios de sucesso e tradeoffs.",
  },
  {
    name: "Planejar sprint",
    description: "Quebrar objetivos em histórias, prioridades e etapas executáveis.",
    category: "DevOps",
    averageTime: "8 min",
    risk: "medium",
    model: "openrouter/free",
    objective: "Criar plano de sprint com backlog, capacidade, riscos e definição de pronto.",
  },
  {
    name: "Preparar post para LinkedIn",
    description: "Criar uma publicação clara, útil e com bom gancho.",
    category: "Marketing",
    averageTime: "5 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Gerar post com gancho, corpo, CTA e variações de tom.",
  },
  {
    name: "Gerar documentação",
    description: "Explicar arquitetura, uso, decisões e manutenção.",
    category: "Programação",
    averageTime: "9 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Criar documentação técnica com visão geral, setup, fluxos e troubleshooting.",
  },
  {
    name: "Explicar código",
    description: "Transformar um trecho técnico em explicação simples e auditável.",
    category: "Programação",
    averageTime: "6 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Explicar o código por blocos, entradas, saídas, riscos e exemplos.",
  },
  {
    name: "Resumir PDF",
    description: "Extrair resumo, pontos-chave, dúvidas e próximos passos.",
    category: "Pesquisa",
    averageTime: "7 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Gerar resumo estruturado com decisões, citações curtas e checklist.",
  },
  {
    name: "Traduzir documento",
    description: "Traduzir preservando intenção, terminologia e estrutura.",
    category: "Conteúdo",
    averageTime: "6 min",
    risk: "low",
    model: "openrouter/free",
    objective: "Entregar tradução revisada com termos importantes e observações.",
  },
  {
    name: "Escrever e-mail",
    description: "Criar e-mail claro, seguro e pronto para revisão humana.",
    category: "Suporte",
    averageTime: "4 min",
    risk: "medium",
    model: "openrouter/free",
    objective: "Gerar e-mail com assunto, corpo, tom adequado e alerta para aprovação antes de enviar.",
  },
];

const FREE_TEMPLATE_NAMES = new Set([
  "Planejar estudos",
  "Resumir PDF",
  "Criar relatório",
  "Preparar post para LinkedIn",
  "Explicar código",
]);

const MARKETPLACE_AGENTS = [
  {
    name: "React Expert",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Programação",
    version: "1.0.0",
    updatedAt: "2026-07-04",
    compatibility: "Mission Control 1.x",
    downloads: 12840,
    rating: 4.9,
    description: "Especialista em interfaces, revisão de componentes e padrões de front-end.",
    tools: ["ler_arquivo", "escrever_arquivo", "editar_documento", "usar_git"],
    screenshots: ["UI audit", "Component diff"],
    changelog: ["Adicionou revisão de acessibilidade", "Melhorou checklist de componentes"],
  },
  {
    name: "Security Reviewer",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "DevOps",
    version: "1.1.0",
    updatedAt: "2026-07-04",
    compatibility: "Mission Control 1.x",
    downloads: 9420,
    rating: 4.8,
    description: "Audita permissões, riscos, segredos e ações sensíveis antes da execução.",
    tools: ["ler_arquivo", "pesquisar_web", "acessar_api"],
    screenshots: ["Risk map", "Approval gate"],
    changelog: ["Novo detector de ações sensíveis", "Relatórios com severidade"],
  },
  {
    name: "Cost Sentinel",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Financeiro",
    version: "0.9.4",
    updatedAt: "2026-07-03",
    compatibility: "Mission Control 1.x",
    downloads: 6180,
    rating: 4.7,
    description: "Compara modelos, estima custo e recomenda rotas de execução econômicas.",
    tools: ["acessar_api", "gerar_relatorio"],
    screenshots: ["Cost ranking", "Model compare"],
    changelog: ["Ranking por latência", "Suporte a modelos grátis"],
  },
  {
    name: "Memory Curator",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Automação",
    version: "1.0.2",
    updatedAt: "2026-07-02",
    compatibility: "Mission Control 1.x",
    downloads: 7215,
    rating: 4.9,
    description: "Resume histórico, fixa aprendizados e limpa contexto obsoleto.",
    tools: ["ler_arquivo", "editar_documento"],
    planRequired: "free",
    screenshots: ["Memory lanes", "Context pins"],
    changelog: ["Memória permanente editável", "Resumo de histórico"],
  },
  {
    name: "Campaign Strategist",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Marketing",
    version: "1.0.0",
    updatedAt: "2026-07-04",
    compatibility: "Mission Control 1.x",
    downloads: 5312,
    rating: 4.8,
    description: "Planeja campanhas, segmenta mensagens e exige aprovação antes de qualquer envio.",
    tools: ["pesquisar_web", "gerar_relatorio", "enviar_email"],
    screenshots: ["Campaign plan", "Approval copy"],
    changelog: ["Bloqueio de envio automático", "Variações de tom"],
  },
  {
    name: "Legal Radar",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Jurídico",
    version: "0.8.0",
    updatedAt: "2026-07-01",
    compatibility: "Mission Control 1.x",
    downloads: 2890,
    rating: 4.6,
    description: "Organiza riscos legais, perguntas para revisão humana e trilhas de auditoria.",
    tools: ["ler_arquivo", "pesquisar_web", "gerar_relatorio"],
    screenshots: ["Legal checklist", "Audit trail"],
    changelog: ["Perguntas para advogado", "Matriz de risco"],
  },
  {
    name: "Study Tutor",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Estudos",
    version: "1.0.0",
    updatedAt: "2026-07-05",
    compatibility: "Mission Control 1.x",
    downloads: 4840,
    rating: 4.8,
    description: "Cria trilhas de estudo, revisões, flashcards e explicações simples.",
    tools: ["gerar_relatorio"],
    planRequired: "free",
    screenshots: ["Study path", "Review cards"],
    changelog: ["Novo modo revisão", "Checkpoints semanais"],
  },
  {
    name: "Product Manager",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Produto",
    version: "1.0.1",
    updatedAt: "2026-07-05",
    compatibility: "Mission Control 1.x",
    downloads: 8044,
    rating: 4.9,
    description: "Transforma objetivos em roadmap, PRDs, critérios de sucesso e tradeoffs.",
    tools: ["pesquisar_web", "gerar_relatorio"],
    screenshots: ["Roadmap", "PRD"],
    changelog: ["Priorização RICE", "Critérios de aceite"],
  },
  {
    name: "Launch Planner",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "Growth",
    version: "0.9.8",
    updatedAt: "2026-07-05",
    compatibility: "Mission Control 1.x",
    downloads: 5730,
    rating: 4.7,
    description: "Orquestra checklist de lançamento, mensagens, riscos e canais.",
    tools: ["pesquisar_web", "gerar_relatorio", "enviar_email"],
    screenshots: ["Launch checklist", "Channel plan"],
    changelog: ["Roteiro de go-to-market", "Aprovação para envios"],
  },
  {
    name: "DevOps Assistant",
    author: "Lukintosh",
    company: "Lukintosh Labs",
    category: "DevOps",
    version: "1.0.0",
    updatedAt: "2026-07-05",
    compatibility: "Mission Control 1.x",
    downloads: 6942,
    rating: 4.8,
    description: "Analisa deploys, logs, incidentes e automações com aprovação humana.",
    tools: ["usar_terminal", "usar_git", "gerar_relatorio"],
    screenshots: ["Deploy review", "Incident notes"],
    changelog: ["Checklist de rollback", "Resumo de incidentes"],
  },
];

const statusLabels = {
  idle: "ocioso",
  running: "executando",
  pending: "aguardando aprovação",
  failed: "falhou",
  completed: "concluído",
  blocked: "bloqueada",
  queued: "queued",
  approved: "approved",
  denied: "denied",
};

const riskLabels = {
  low: "baixo",
  medium: "médio",
  high: "alto",
};

const defaultSettings = {
  costPerStep: 0,
  stepDelay: 700,
  autoScrollLogs: true,
  primaryProvider: "openrouter",
  favoriteModels: "openrouter/free",
  dailyCostLimit: 0,
  autoApproval: false,
  strictMode: true,
  persistentMemory: true,
  memoryRetentionDays: 30,
  webhookUrl: "",
  universeZoom: 100,
  connectors: {},
};

let state = loadState();
let selectedInspectorAgentId = null;
let expandedInspectorEvents = new Set();
let replayTimer = null;
let replayCursor = -1;
let replaySpeed = 850;
let replayPaused = false;
let memorySearch = "";
let enterpriseContext = null;
let funnelSummary = null;

const elements = {
  metricGrid: document.querySelector("#metric-grid"),
  recentTasks: document.querySelector("#recent-tasks"),
  pendingApprovals: document.querySelector("#pending-approvals"),
  agentsTable: document.querySelector("#agents-table"),
  taskAgentSelect: document.querySelector("#task-agent-select"),
  tasksList: document.querySelector("#tasks-list"),
  logsTable: document.querySelector("#logs-table"),
  inspector: document.querySelector("#agent-inspector"),
  activityBoard: document.querySelector("#activity-board"),
  heatmapBoard: document.querySelector("#heatmap-board"),
  universe: document.querySelector("#agent-universe"),
  marketplaceGrid: document.querySelector("#marketplace-grid"),
  pricingGrid: document.querySelector("#pricing-grid"),
  planComparisonTable: document.querySelector("#plan-comparison-table"),
  teamSummary: document.querySelector("#team-summary"),
  teamMembers: document.querySelector("#team-members"),
  governanceSummary: document.querySelector("#governance-summary"),
  governanceReadiness: document.querySelector("#governance-readiness"),
  enterpriseRuntime: document.querySelector("#enterprise-runtime"),
  billingPanel: document.querySelector("#billing-panel"),
  settingsBillingSummary: document.querySelector("#settings-billing-summary"),
  templateGrid: document.querySelector("#template-grid"),
  connectorGrid: document.querySelector("#connector-grid"),
  day913Checklist: document.querySelector("#day-913-checklist"),
  day913FeedbackForm: document.querySelector("#day-913-feedback-form"),
  earlyAccessPlanLabel: document.querySelector("#early-access-plan-label"),
  earlyAccessPlanDetail: document.querySelector("#early-access-plan-detail"),
  earlyAccessAnalytics: document.querySelector("#early-access-analytics"),
  upgradeDialog: document.querySelector("#upgrade-dialog"),
  upgradeContent: document.querySelector("#upgrade-content"),
  checkoutDialog: document.querySelector("#checkout-dialog"),
  checkoutContent: document.querySelector("#checkout-content"),
  investigationDialog: document.querySelector("#investigation-dialog"),
  investigationContent: document.querySelector("#investigation-content"),
  viewTitle: document.querySelector("#view-title"),
  viewSubtitle: document.querySelector("#view-subtitle"),
  systemStatusTitle: document.querySelector("#system-status-title"),
  systemStatusDetail: document.querySelector("#system-status-detail"),
  toast: document.querySelector("#toast"),
};

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll("[data-switch-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.switchView));
});

document.querySelector("#agent-form").addEventListener("submit", handleAgentSubmit);
document.querySelector("#task-form").addEventListener("submit", handleTaskSubmit);
document.querySelector("#settings-form").addEventListener("submit", handleSettingsSubmit);
document.querySelector("#workspace-form")?.addEventListener("submit", handleWorkspaceSubmit);
document.querySelector("#team-member-form")?.addEventListener("submit", handleTeamMemberSubmit);
document.querySelector("#team-business-button")?.addEventListener("click", () => openCheckout("business"));
document.querySelector("#business-governance-form")?.addEventListener("submit", handleBusinessGovernanceSubmit);
document.querySelector("#enterprise-controls-form")?.addEventListener("submit", handleEnterpriseControlsSubmit);
document.querySelector("#governance-business-button")?.addEventListener("click", () => openCheckout("business"));
document.querySelector("#governance-enterprise-button")?.addEventListener("click", () => openCheckout("enterprise"));
document.querySelector("#export-governance-button")?.addEventListener("click", exportGovernanceAudit);
document.querySelector("#refresh-enterprise-button")?.addEventListener("click", loadEnterpriseContext);
document.querySelector("#sales-lead-form")?.addEventListener("submit", handleSalesLeadSubmit);
document.querySelectorAll("[data-settings-tab]").forEach((button) => {
  button.addEventListener("click", () => switchSettingsPane(button.dataset.settingsTab));
});
document.querySelector("#clear-data-button").addEventListener("click", clearData);
document.querySelector("#seed-demo-button").addEventListener("click", restoreDemo);
document.querySelector("#day-913-demo-button")?.addEventListener("click", prepareDay913Demo);
document.querySelector("#day-913-copy-button")?.addEventListener("click", copyDay913Invite);
document.querySelector("#day-913-feedback-form")?.addEventListener("submit", handleDay913Feedback);
document.querySelector("#early-access-start-button")?.addEventListener("click", () => activateFreeEarlyAccess("landing_cta"));
document.querySelector("#early-access-run-first-button")?.addEventListener("click", () => activateFreeEarlyAccess("first_mission_cta"));
document.querySelector("#early-access-pro-button")?.addEventListener("click", () => openCheckout("pro"));
document.querySelector("#early-access-business-button")?.addEventListener("click", () => openCheckout("business"));
document.querySelector("#early-access-action-button")?.addEventListener("click", () => {
  activateFreeEarlyAccess("see_mission_in_action");
});
document.querySelector("#early-access-feedback-button")?.addEventListener("click", () => {
  switchView("dashboard");
  const feedback = document.querySelector("#day-913-feedback-form");
  feedback?.scrollIntoView({ behavior: "smooth", block: "center" });
  feedback?.querySelector("textarea")?.focus({ preventScroll: true });
  showToast("Conte o que ficou claro ou confuso. Isso vira melhoria do Mission.");
});
document.querySelector("#export-logs-button").addEventListener("click", exportLogs);
document.querySelector("#close-investigation-button").addEventListener("click", () => elements.investigationDialog.close());
document.querySelector("[data-close-upgrade]")?.addEventListener("click", () => elements.upgradeDialog.close());
document.querySelector("[data-close-checkout]")?.addEventListener("click", () => elements.checkoutDialog.close());
window.addEventListener("billing:upgrade", (event) => showUpgradeModal(event.detail?.feature));
document.querySelector("#pulse-universe-button")?.addEventListener("click", () => {
  renderUniverse(true);
  showToast("Pulso enviado ao Agent Universe.");
});
document.querySelector("#universe-zoom")?.addEventListener("input", (event) => {
  state.settings.universeZoom = Number(event.target.value);
  saveState();
  renderUniverse();
});
document.querySelectorAll("#log-filter-agent, #log-filter-task, #log-filter-tool, #log-filter-status").forEach((field) => {
  field.addEventListener("input", renderLogs);
  field.addEventListener("change", renderLogs);
});

handleCheckoutReturn();
render();
if (["/early-access", "/early-access/"].includes(window.location.pathname)) {
  switchView("early-access");
}
loadOpenRouterModels();
loadConnectors();
loadEnterpriseContext();
loadSystemStatus();
loadFunnelSummary();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createSeedState();

  try {
    const parsed = JSON.parse(stored);
    return migrateState({
      agents: parsed.agents || [],
      tasks: parsed.tasks || [],
      logs: parsed.logs || [],
      openRouter: parsed.openRouter || { configuredModel: "openrouter/free", models: [] },
      connectorRuntime: parsed.connectorRuntime || { connectors: [], lastLoadedAt: null },
      team: parsed.team || null,
      governance: parsed.governance || null,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
    });
  } catch {
    return createSeedState();
  }
}

function migrateState(nextState) {
  nextState.agents = nextState.agents.map((agent) => ({
    objective: agent.role || "Executar missões com segurança e auditabilidade.",
    description: agent.description || "Agente local supervisionado pela Lukintosh Mission Control.",
    memory: createAgentMemory(agent),
    dna: agent.dna || createAgentDna(agent),
    trustScore: Number(agent.trustScore || 86),
    confidence: Number(agent.confidence || 82),
    createdAt: agent.createdAt || Date.now(),
    ...agent,
  }));
  nextState.tasks = nextState.tasks.map((task) => ({
    objective: task.objective || task.title || "Executar missão com segurança.",
    priority: task.priority || "normal",
    progress: task.progress ?? progressForStatus(task.status),
    expected: task.expected || createSimulationForecast(task),
    communications: task.communications || createMissionConversation(task),
    benchmark: task.benchmark || createBenchmark(task),
    timeMachine: task.timeMachine || createTimeMachine(task),
    result: task.result || createMissionResult(task),
    latencyMs: task.latencyMs || 0,
    tokenUsage: task.tokenUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    observability: task.observability || null,
    events: task.events || task.steps || [],
    ...task,
  }));
  nextState.openRouter = nextState.openRouter || { configuredModel: "openrouter/free", models: [] };
  nextState.connectorRuntime = nextState.connectorRuntime || { connectors: [], lastLoadedAt: null };
  nextState.team = migrateTeam(nextState.team);
  nextState.governance = migrateGovernance(nextState.governance);
  nextState.settings = { ...defaultSettings, ...(nextState.settings || {}) };
  return nextState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createSeedState() {
  const now = Date.now();
  return {
    settings: { ...defaultSettings },
    openRouter: { configuredModel: "openrouter/free", models: [] },
    connectorRuntime: { connectors: [], lastLoadedAt: null },
    team: createDefaultTeam(now),
    governance: createDefaultGovernance(),
    agents: [
      {
        id: crypto.randomUUID(),
        name: "Atlas Research",
        role: "Analista de sinais",
        objective: "Transformar missões ambíguas em planos auditáveis e seguros.",
        description: "Especialista em decompor missões, reduzir risco e pedir aprovação no momento certo.",
        model: "openrouter/free",
        tools: ["pesquisar_web", "ler_arquivo", "enviar_email"],
        memory: createAgentMemory({ role: "Analista de sinais" }),
        dna: { precision: 91, creativity: 68, speed: 74, autonomy: 72, reliability: 94, cost: 96 },
        trustScore: 94,
        confidence: 91,
        createdAt: now - 1000 * 60 * 90,
        status: "idle",
      },
      {
        id: crypto.randomUUID(),
        name: "Nova Ops",
        role: "Operadora de automações",
        objective: "Supervisionar automações locais com tolerância zero para ações não aprovadas.",
        description: "Observa ações sensíveis, bloqueia risco e mantém trilha de auditoria.",
        model: "openrouter/free",
        tools: ["ler_arquivo", "excluir_arquivo", "gastar_dinheiro"],
        memory: createAgentMemory({ role: "Operadora de automações" }),
        dna: { precision: 84, creativity: 55, speed: 81, autonomy: 66, reliability: 88, cost: 92 },
        trustScore: 88,
        confidence: 86,
        createdAt: now - 1000 * 60 * 84,
        status: "idle",
      },
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        agentId: null,
        title: "Auditar missões locais",
        objective: "Demonstrar execução auditável sem ação externa real.",
        priority: "normal",
        progress: 100,
        status: "completed",
        cost: 0,
        riskLevel: "low",
        requiredApproval: false,
        summary: "Experiência guiada concluída. Crie uma nova missão para chamar IA real via OpenRouter.",
        result: {
          summary: "Experiência guiada concluída com trilha de auditoria, timeline e saída pronta para revisão.",
          analyzedFiles: ["index.html", "app.js", "style.css"],
          suggestedFixes: ["Conectar IA real", "Manter aprovação humana para ações sensíveis", "Registrar logs de cada decisão"],
          generatedCode: "Nenhum código executado automaticamente.",
          checklist: ["Logs registrados", "Risco baixo", "Nenhuma ação externa executada"],
          nextSteps: ["Criar um agente real", "Executar uma missão com OpenRouter", "Abrir o Agent Inspector"],
        },
        modelUsed: "mission-cloud",
        latencyMs: 64,
        tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        observability: {
          prompt: [],
          response: "Execução guiada Mission Cloud.",
          tools: ["ler_contexto"],
          input: "Auditar missões locais",
          output: "Missão guiada concluída.",
        },
        createdAt: now - 1000 * 60 * 22,
        startedAt: now - 1000 * 60 * 22,
        completedAt: now - 1000 * 60 * 19,
        steps: [
          makeStep("planejar", "completed", "Plano de execução criado."),
          makeStep("ler_contexto", "completed", "Contexto local carregado."),
          makeStep("registrar_resultado", "completed", "Resultado persistido no histórico."),
        ],
        suggestedActions: [],
        expected: { successChance: 96, estimatedMs: 180000, estimatedCost: 0, predictedTools: ["ler_contexto"], risk: "low" },
        communications: [],
        benchmark: [],
        timeMachine: [],
      },
    ],
    logs: [],
  };
}

function createAgentMemory(agent = {}) {
  return {
    recent: [`Agente criado para atuar como ${agent.role || "operador de IA"}.`],
    permanent: ["Nunca executar ações externas sem aprovação humana."],
    context: ["Ambiente local do Lukintosh Mission Control."],
    learned: ["Registrar decisões, riscos, entradas e saídas em logs auditáveis."],
  };
}

function makeStep(action, status, message, requiresApproval = false) {
  return {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    action,
    status,
    message,
    requiresApproval,
    decision: null,
  };
}

function handleAgentSubmit(event) {
  event.preventDefault();
  if (!Billing.canCreateAgent(state.agents.length)) {
    showUpgradeModal("agentLimit");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const tools = data.getAll("tools");

  const agent = {
    id: crypto.randomUUID(),
    name: data.get("name").trim(),
    role: data.get("role").trim(),
    description: "Agente criado localmente para executar missões sob supervisão humana.",
    objective: data.get("role").trim(),
    model: data.get("model"),
    tools,
    memory: createAgentMemory({ role: data.get("role").trim() }),
    dna: createAgentDna({ tools }),
    trustScore: 82,
    confidence: 80,
    createdAt: Date.now(),
    status: "idle",
  };

  state.agents.push(agent);
  logAction(agent.id, null, "criar_agente", "completed", `Agente ${agent.name} criado.`);
  trackFunnelOnce("first_agent_created", { agentRole: agent.role });
  saveState();
  form.reset();
  render();
  showToast("Agente criado.");
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  if (!Billing.canRunMission()) {
    showUpgradeModal("missionLimit");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const agent = getAgent(data.get("agentId"));

  if (!agent) {
    showToast("Crie um agente antes de iniciar missões.");
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    agentId: agent.id,
    title: data.get("title").trim(),
    objective: data.get("objective")?.trim() || data.get("title").trim(),
    priority: data.get("priority"),
    progress: 8,
    status: "running",
    cost: 0,
    riskLevel: "medium",
    requiredApproval: false,
    summary: "Chamando IA real via OpenRouter...",
    modelUsed: agent.model || state.openRouter.configuredModel || "openrouter/free",
    latencyMs: 0,
    tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    observability: null,
    expected: createSimulationForecast({
      title: data.get("title").trim(),
      riskLevel: data.get("scenario") === "safe" ? "low" : "medium",
      agentTools: agent.tools,
    }),
    communications: createMissionConversation({ title: data.get("title").trim() }),
    benchmark: createBenchmark({ modelUsed: agent.model }),
    timeMachine: [],
    result: createMissionResult({
      title: data.get("title").trim(),
      objective: data.get("objective")?.trim() || data.get("title").trim(),
      summary: "Aguardando resultado da IA.",
      riskLevel: "medium",
      suggestedActions: [],
      steps: [],
    }),
    createdAt: Date.now(),
    startedAt: Date.now(),
    completedAt: null,
    steps: [makeStep("chamar_openrouter", "running", "Solicitando plano seguro ao OpenRouter.")],
    suggestedActions: [],
  };

  state.tasks.unshift(task);
  Billing.incrementMissionUsage();
  agent.status = "running";
  logAction(agent.id, task.id, "criar_missao", "running", `Missão "${task.title}" enviada para IA real.`);
  trackFunnelOnce("first_mission_started", { plan: Billing.getCurrentPlan().id });
  saveState();
  render();

  try {
    const aiPlan = await requestAgentRun(agent, task.title);
    applyAiPlan(task, agent, aiPlan);
    form.reset();
    showToast(aiPlan.result.required_approval ? "IA pediu aprovação manual." : "Plano da IA concluído.");
  } catch (error) {
    task.status = "failed";
    task.completedAt = Date.now();
    task.progress = 100;
    task.steps.push(makeStep("erro_openrouter", "failed", error.message));
    task.timeMachine = createTimeMachine(task);
    agent.status = "failed";
    evolveTrust(agent, task, "failed");
    logAction(agent.id, task.id, "erro_openrouter", "failed", error.message);
    showToast("Falha ao chamar OpenRouter. Veja os logs.");
  }

  saveState();
  render();
}

async function requestAgentRun(agent, taskTitle) {
  const response = await fetch(`${API_BASE_URL}/api/agent-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentName: agent.name,
      agentRole: agent.role,
      task: taskTitle,
      tools: agent.tools,
      model: agent.model,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(payload.details)
      ? payload.details.map((item) => `${item.model}: ${item.message}`).join(" | ")
      : payload.details;
    throw new Error(payload.error || details || "Erro inesperado ao chamar OpenRouter.");
  }

  return payload;
}

function applyAiPlan(task, agent, aiPlan) {
  const result = aiPlan.result;
  const requiresApproval = Boolean(result.required_approval);
  const riskySuggestedAction = result.suggested_actions.find((action) => RISKY_ACTIONS.has(action));
  const approvalAction = riskySuggestedAction || (requiresApproval ? "aprovar_plano_ia" : null);

  task.modelUsed = aiPlan.model;
  task.latencyMs = aiPlan.latency_ms || 0;
  task.tokenUsage = aiPlan.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  task.observability = {
    prompt: aiPlan.prompt || [],
    response: aiPlan.raw_model_response || "",
    tools: agent.tools,
    input: task.title,
    output: result.summary,
  };
  task.summary = result.summary;
  task.result = createMissionResult(task, result);
  task.riskLevel = result.risk_level;
  task.requiredApproval = requiresApproval;
  task.suggestedActions = result.suggested_actions;
  task.progress = requiresApproval ? 62 : 100;
  task.expected = createSimulationForecast({ ...task, riskLevel: result.risk_level, agentTools: agent.tools });
  task.benchmark = createBenchmark({ modelUsed: aiPlan.model, latencyMs: aiPlan.latency_ms, riskLevel: result.risk_level });
  task.communications = createMissionConversation(task, result);
  task.steps = [
    makeStep("chamar_openrouter", "completed", `Plano recebido do modelo ${aiPlan.model}.`),
    ...result.steps.map((step, index) =>
      makeStep(`passo_${index + 1}`, requiresApproval ? "queued" : "completed", String(step))
    ),
  ];
  task.timeMachine = createTimeMachine(task);
  task.result = createMissionResult(task, result);
  rememberAgentLearning(agent, task, result);
  evolveTrust(agent, task, "plan");

  if (requiresApproval) {
    task.status = "pending";
    agent.status = "pending";
    task.steps.push(
      makeStep(
        approvalAction,
        "pending",
        `A IA classificou risco ${riskLabels[result.risk_level] || result.risk_level} e pediu aprovação manual.`,
        true
      )
    );
    logAction(agent.id, task.id, approvalAction, "pending", "Plano da IA pausado para aprovação humana.");
    return;
  }

  task.status = "completed";
  task.completedAt = Date.now();
  task.progress = 100;
  agent.status = "completed";
  evolveTrust(agent, task, "completed");
  logAction(agent.id, task.id, "plano_ia", "completed", result.summary);
  trackFunnelOnce("first_mission_completed", { plan: Billing.getCurrentPlan().id });
}

function decideApproval(taskId, stepId, approved) {
  const task = getTask(taskId);
  if (!task) return;

  const step = task.steps.find((item) => item.id === stepId);
  const agent = getAgent(task.agentId);
  if (!step || step.status !== "pending") return;

  step.decision = approved ? "approved" : "denied";
  step.status = approved ? "approved" : "denied";
  step.time = new Date().toISOString();

  if (approved) {
    task.status = "completed";
    task.completedAt = Date.now();
    task.progress = 100;
    task.steps
      .filter((item) => item.status === "queued")
      .forEach((item) => {
        item.status = "completed";
        item.time = new Date().toISOString();
      });
    if (agent) agent.status = "completed";
    if (agent) {
      agent.memory.recent.unshift(`Aprovado: ${step.action} em "${task.title}".`);
      agent.memory.recent = agent.memory.recent.slice(0, 8);
      evolveTrust(agent, task, "approved");
    }
    logAction(task.agentId, task.id, step.action, "approved", `Usuário aprovou ${step.action}. Nenhuma ação real foi executada.`);
    trackFunnelOnce("first_mission_completed", { plan: Billing.getCurrentPlan().id, approval: "approved" });
    saveState();
    render();
    showToast("Plano aprovado e registrado.");
    return;
  }

  task.status = "blocked";
  task.completedAt = Date.now();
  task.progress = 62;
  if (agent) agent.status = "failed";
  if (agent) {
    agent.memory.recent.unshift(`Negado: ${step.action} em "${task.title}".`);
    agent.memory.recent = agent.memory.recent.slice(0, 8);
    evolveTrust(agent, task, "denied");
  }
  logAction(task.agentId, task.id, step.action, "denied", `Usuário negou ${step.action}. Missão bloqueada.`);
  saveState();
  render();
  showToast("Ação negada. Missão bloqueada.");
}

function render() {
  updateInternalVisibility();
  renderDay913Panel();
  renderMetrics();
  renderDashboardExtras();
  renderAgents();
  renderTasks();
  renderApprovals();
  renderLogs();
  renderSettings();
  renderInspector();
  renderUniverse();
  renderMarketplace();
  renderPricing();
  renderTeams();
  renderGovernance();
  renderEnterpriseRuntime();
  renderEarlyAccess();
  renderBillingPanel();
  renderSettingsBilling();
  renderTemplates();
  renderConnectors();
  saveState();
}

function isFounderMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("founder") === "1") {
    localStorage.setItem(FOUNDER_MODE_KEY, "true");
    return true;
  }
  if (params.get("founder") === "0") {
    localStorage.removeItem(FOUNDER_MODE_KEY);
    return false;
  }
  return localStorage.getItem(FOUNDER_MODE_KEY) === "true";
}

function updateInternalVisibility() {
  const panel = document.querySelector("#day-913-panel");
  if (panel) panel.hidden = !isFounderMode();
}

function migrateTeam(team) {
  const now = Date.now();
  const fallback = createDefaultTeam(now);
  const nextTeam = team && typeof team === "object" ? team : fallback;
  const workspaces = Array.isArray(nextTeam.workspaces) && nextTeam.workspaces.length ? nextTeam.workspaces : fallback.workspaces;
  const activeWorkspaceId = nextTeam.activeWorkspaceId || workspaces[0]?.id || fallback.activeWorkspaceId;
  return {
    activeWorkspaceId,
    workspaces: workspaces.map((workspace) => ({
      id: workspace.id || crypto.randomUUID(),
      name: workspace.name || "Lukintosh Mission Team",
      purpose: workspace.purpose || "Testar agentes com auditoria e controle humano.",
      createdAt: workspace.createdAt || now,
      members: Array.isArray(workspace.members) && workspace.members.length ? workspace.members.map(normalizeTeamMember) : fallback.workspaces[0].members,
      invites: Array.isArray(workspace.invites) ? workspace.invites : [],
    })),
  };
}

function createDefaultTeam(now = Date.now()) {
  const workspaceId = crypto.randomUUID();
  return {
    activeWorkspaceId: workspaceId,
    workspaces: [
      {
        id: workspaceId,
        name: "Lukintosh Mission Team",
        purpose: "Validar agentes com logs, replay, aprovações e feedback externo.",
        createdAt: now,
        members: [
          {
            id: crypto.randomUUID(),
            name: "Lucas Correa",
            email: "owner@lukintosh.com",
            role: "owner",
            status: "active",
            joinedAt: now,
            lastSeenAt: now,
          },
        ],
        invites: [],
      },
    ],
  };
}

function normalizeTeamMember(member) {
  return {
    id: member.id || crypto.randomUUID(),
    name: member.name || "Membro",
    email: member.email || "membro@empresa.com",
    role: member.role || "viewer",
    status: member.status || "invited",
    joinedAt: member.joinedAt || Date.now(),
    lastSeenAt: member.lastSeenAt || null,
  };
}

function createDefaultGovernance() {
  return {
    business: {
      monthlyBudget: 500,
      auditRetentionDays: 90,
      approvalPolicy: "strict",
      incidentChannel: "#agent-incidents",
      requireReview: true,
      teamConnectors: true,
    },
    enterprise: {
      ssoProvider: "off",
      allowedDomain: "",
      byokAlias: "",
      dataRegion: "global",
      privateDeployment: "cloudflare",
      slaTier: "standard",
      enforceSso: false,
      complianceMode: false,
    },
    updatedAt: null,
  };
}

function migrateGovernance(governance) {
  const fallback = createDefaultGovernance();
  return {
    business: { ...fallback.business, ...(governance?.business || {}) },
    enterprise: { ...fallback.enterprise, ...(governance?.enterprise || {}) },
    updatedAt: governance?.updatedAt || null,
  };
}

function renderMetrics() {
  const metrics = [
    ["Total de agentes", state.agents.length, "Frota cadastrada"],
    ["Em execução", state.agents.filter((agent) => agent.status === "running").length, "Agentes trabalhando"],
    ["Com falha", state.agents.filter((agent) => agent.status === "failed").length, "Precisam atenção"],
    ["Custo estimado total", formatCurrency(totalCost()), "Controle operacional"],
    ["Missões concluídas", state.tasks.filter((task) => task.status === "completed").length, "Histórico finalizado"],
    ["Aguardando aprovação", pendingSteps().length, "Ações pausadas"],
  ];

  elements.metricGrid.innerHTML = metrics
    .map(
      ([label, value, helper]) => `
        <article class="metric-card">
          <p>${label}</p>
          <strong>${value}</strong>
          <span>${helper}</span>
        </article>
      `
    )
    .join("");
}

function renderDashboardExtras() {
  if (elements.activityBoard) {
    const days = buildDailyActivity();
    const max = Math.max(1, ...days.map((day) => day.count));
    elements.activityBoard.innerHTML = `
      <div class="activity-chart">
        ${days
          .map(
            (day) => `
              <div class="activity-bar" style="--bar-height:${Math.max(10, Math.round((day.count / max) * 100))}%">
                <span>${day.count}</span>
                <small>${day.label}</small>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="cost-grid">
        ${detailBlock("Tokens totais", totalTokens().toLocaleString("pt-BR"))}
        ${detailBlock("Tempo médio", formatDuration(averageMissionDuration()))}
        ${detailBlock("Latência média", `${averageLatency()}ms`)}
        ${detailBlock("Sucesso x falha", `${successRate()}% sucesso`)}
      </div>
    `;
  }

  if (elements.heatmapBoard) {
    const heatmap = buildHeatmap();
    elements.heatmapBoard.innerHTML = heatmap
      .map(
        (item) => `
          <article class="heatmap-item ${item.tone}">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(String(item.value))}</strong>
          </article>
        `
      )
      .join("");
  }
}

function renderAgents() {
  elements.taskAgentSelect.innerHTML = state.agents
    .map((agent) => `<option value="${agent.id}">${escapeHtml(agent.name)} · ${escapeHtml(agent.role)}</option>`)
    .join("");

  const agentModelSelect = document.querySelector('#agent-form select[name="model"]');
  const currentModelValue = agentModelSelect.value || state.openRouter.configuredModel;
  const modelOptions = uniqueList([
    state.openRouter.configuredModel,
    "openrouter/free",
    ...state.openRouter.models.map((model) => model.id),
  ]);
  agentModelSelect.innerHTML = modelOptions
    .map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`)
    .join("");
  agentModelSelect.value = modelOptions.includes(currentModelValue) ? currentModelValue : state.openRouter.configuredModel;

  elements.agentsTable.innerHTML = state.agents.length
    ? state.agents
        .map(
          (agent) => `
          <tr class="clickable-row" data-agent-id="${agent.id}" title="Abrir Agent Inspector">
            <td><strong>${escapeHtml(agent.name)}</strong></td>
            <td>${escapeHtml(agent.role)}</td>
            <td>${escapeHtml(agent.model)}</td>
            <td>${statusBadge(agent.status)}</td>
            <td><div class="tool-list">${agent.tools.map((tool) => `<span class="tool-chip">${tool}</span>`).join("")}</div></td>
            <td>
              <div class="row-actions">
                <button class="mini-button" data-edit-agent="${agent.id}" type="button">Editar</button>
                <button class="mini-button" data-duplicate-agent="${agent.id}" type="button">Duplicar</button>
                <button class="mini-button deny" data-delete-agent="${agent.id}" type="button">Excluir</button>
              </div>
            </td>
          </tr>
        `
        )
        .join("")
    : `<tr><td colspan="6">Nenhum agente criado.</td></tr>`;

  document.querySelectorAll("[data-agent-id]").forEach((row) => {
    row.addEventListener("click", () => openAgentInspector(row.dataset.agentId));
  });

  document.querySelectorAll("[data-edit-agent], [data-duplicate-agent], [data-delete-agent]").forEach((button) => {
    button.addEventListener("click", (event) => event.stopPropagation());
  });

  document.querySelectorAll("[data-edit-agent]").forEach((button) => {
    button.addEventListener("click", () => editAgent(button.dataset.editAgent));
  });

  document.querySelectorAll("[data-duplicate-agent]").forEach((button) => {
    button.addEventListener("click", () => duplicateAgent(button.dataset.duplicateAgent));
  });

  document.querySelectorAll("[data-delete-agent]").forEach((button) => {
    button.addEventListener("click", () => deleteAgent(button.dataset.deleteAgent));
  });
}

function renderTasks() {
  const html = state.tasks.length
    ? state.tasks.map(renderTaskCard).join("")
    : `<div class="empty-state">Nenhuma missão criada ainda.</div>`;

  elements.tasksList.innerHTML = html;
  elements.recentTasks.innerHTML = state.tasks.length
    ? state.tasks.slice(0, 4).map(renderTaskCard).join("")
    : `<div class="empty-state">Crie uma missão para iniciar a IA real.</div>`;

  document.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => decideApproval(button.dataset.taskId, button.dataset.stepId, true));
  });

  document.querySelectorAll("[data-deny]").forEach((button) => {
    button.addEventListener("click", () => decideApproval(button.dataset.taskId, button.dataset.stepId, false));
  });

  document.querySelectorAll("[data-open-agent]").forEach((button) => {
    button.addEventListener("click", () => button.dataset.openAgent && openAgentInspector(button.dataset.openAgent));
  });

  document.querySelectorAll("[data-replay-task]").forEach((button) => {
    button.addEventListener("click", () => replayMission(button.dataset.replayTask));
  });

  document.querySelectorAll("[data-investigate-task]").forEach((button) => {
    button.addEventListener("click", () => openTaskInvestigation(button.dataset.investigateTask));
  });

  document.querySelectorAll("[data-copy-result]").forEach((button) => {
    button.addEventListener("click", () => copyMissionResult(button.dataset.copyResult));
  });

  document.querySelectorAll("[data-export-md]").forEach((button) => {
    button.addEventListener("click", () => exportMissionMarkdown(button.dataset.exportMd));
  });

  document.querySelectorAll("[data-export-pdf]").forEach((button) => {
    button.addEventListener("click", () => exportMissionPdf(button.dataset.exportPdf));
  });

  document.querySelectorAll("[data-save-template]").forEach((button) => {
    button.addEventListener("click", () => saveMissionAsTemplate(button.dataset.saveTemplate));
  });

  document.querySelectorAll("[data-share-result]").forEach((button) => {
    button.addEventListener("click", () => shareMissionResult(button.dataset.shareResult));
  });

  document.querySelectorAll("[data-rerun-mission]").forEach((button) => {
    button.addEventListener("click", () => rerunMission(button.dataset.rerunMission));
  });
}

function renderTaskCard(task) {
  const agent = getAgent(task.agentId);
  const duration = task.startedAt ? formatDuration((task.completedAt || Date.now()) - task.startedAt) : "0s";
  const pending = task.steps.find((step) => step.status === "pending");

  return `
    <article class="task-card">
      <div class="task-card-header">
        <div>
          <h4>${escapeHtml(task.title)}</h4>
          <p class="meta-line">${escapeHtml(agent?.name || "Agente")} · ${escapeHtml(task.priority || "normal")} · ${escapeHtml(task.modelUsed || "openrouter/free")} · ${formatCurrency(task.cost)} · ${duration}</p>
        </div>
        ${statusBadge(task.status)}
      </div>
      <div class="mission-progress">
        <span style="width:${Math.min(100, Math.max(0, Number(task.progress || progressForStatus(task.status))))}%"></span>
      </div>
      <div class="ai-summary">
        <strong>Objetivo</strong>
        <p>${escapeHtml(task.objective || task.summary || "Aguardando plano da IA.")}</p>
        <span class="risk-pill ${task.riskLevel || "medium"}">risco ${riskLabels[task.riskLevel] || task.riskLevel || "médio"}</span>
      </div>
      ${renderSimulation(task)}
      ${task.suggestedActions?.length ? `<div class="tool-list">${task.suggestedActions.map((action) => `<span class="tool-chip">${escapeHtml(action)}</span>`).join("")}</div>` : ""}
      ${renderMissionResult(task)}
      ${
        pending
          ? `<div class="approval-actions">
              <button class="mini-button" data-approve="true" data-task-id="${task.id}" data-step-id="${pending.id}" title="Autoriza a continuação simulada e registra a aprovação." type="button">Aprovar</button>
              <button class="mini-button deny" data-deny="true" data-task-id="${task.id}" data-step-id="${pending.id}" title="Bloqueia a missão e registra a negativa nos logs." type="button">Negar</button>
            </div>`
          : ""
      }
      <div class="task-actions">
        <button class="mini-button" data-open-agent="${agent?.id || ""}" title="Mostra tudo que o agente viu, pensou e fez." type="button">Inspector</button>
        <button class="mini-button" data-replay-task="${task.id}" title="Reproduz toda a execução da missão passo a passo." type="button">Replay</button>
        <button class="mini-button" data-investigate-task="${task.id}" title="Abre informações técnicas completas da execução." type="button">Investigar</button>
      </div>
      ${renderBenchmark(task)}
      <div class="timeline">
        ${task.steps
          .map(
            (step) => `
              <div class="timeline-row">
                <span>${formatTime(step.time)}</span>
                <strong>${escapeHtml(step.action)}</strong>
                <span>${statusBadge(step.status)}</span>
                <span>${escapeHtml(step.message)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderMissionResult(task) {
  const result = task.result || createMissionResult(task);
  const isReady = ["completed", "pending", "blocked", "failed"].includes(task.status);
  const auditTrail = missionAuditTrail(task);
  const usedTools = missionTools(task, result);
  const producedFiles = result.producedFiles || result.analyzedFiles || [];
  if (!isReady) {
    return `
      <section class="mission-result pending-result">
        <div class="mission-result-header">
          <div>
            <p class="section-label">Resultado final da missão</p>
            <h5>Preparando entrega</h5>
          </div>
          <span class="status running">gerando</span>
        </div>
        <p>A IA está estruturando uma saída pronta para uso, com resumo, checklist e próximos passos.</p>
      </section>
    `;
  }

  return `
    <section class="mission-result">
      <div class="mission-result-header">
        <div>
          <p class="section-label">Resultado final da missão</p>
          <h5>Entrega pronta para usar</h5>
        </div>
        <div class="result-actions">
          <button class="mini-button" data-copy-result="${task.id}" title="Copia o resultado completo da missão para a área de transferência." type="button">Copiar</button>
          <button class="mini-button" data-share-result="${task.id}" title="Compartilha o resultado final da missão quando o navegador permitir." type="button">Compartilhar</button>
          <button class="mini-button" data-export-md="${task.id}" title="Exporta o resultado da missão em Markdown." type="button">Exportar Markdown</button>
          <button class="mini-button" data-export-pdf="${task.id}" title="Abre uma versão de impressão para salvar como PDF." type="button">Exportar PDF</button>
          <button class="mini-button" data-save-template="${task.id}" title="Transforma esta missão em um template reutilizável." type="button">Salvar como Template</button>
          <button class="mini-button" data-rerun-mission="${task.id}" title="Preenche o formulário para executar esta missão novamente." type="button">Executar novamente</button>
          <button class="mini-button" data-replay-task="${task.id}" title="Abre o Replay desta missão." type="button">Abrir Replay</button>
          <button class="mini-button" data-open-agent="${task.agentId || ""}" title="Abre o Inspector do agente responsável." type="button">Abrir Inspector</button>
        </div>
      </div>
      <div class="result-overview">
        ${detailBlock("Objetivo", task.objective || task.title)}
        ${detailBlock("Status", statusLabels[task.status] || task.status)}
        ${detailBlock("Tempo", formatDuration((task.completedAt || Date.now()) - (task.startedAt || task.createdAt || Date.now())))}
        ${detailBlock("Modelo utilizado", task.modelUsed || "sem dados")}
        ${detailBlock("Custo", formatCurrency(task.cost || 0))}
        ${detailBlock("Ferramentas utilizadas", usedTools.join(", ") || "sem ferramentas externas")}
        ${detailBlock("Arquivos produzidos", producedFiles.length ? `${producedFiles.length} arquivo(s)` : "nenhum arquivo")}
      </div>
      <div class="result-grid">
        <div class="result-section result-summary">
          <span>Resumo executivo</span>
          <p>${escapeHtml(result.summary)}</p>
        </div>
        <div class="result-section result-summary">
          <span>Resposta final</span>
          <p>${escapeHtml(result.readyAnswer || result.summary)}</p>
        </div>
        ${resultList("Ferramentas utilizadas", usedTools)}
        ${resultList("Arquivos produzidos", producedFiles)}
        ${resultList("Checklist", result.checklist)}
        ${resultList("Próximos passos", result.nextSteps)}
        ${resultList("Trilha de auditoria", auditTrail)}
        ${resultList("Correções sugeridas", result.suggestedFixes)}
        <div class="result-section">
          <span>Conclusão</span>
          <p>${escapeHtml(result.conclusion || "Missão registrada, auditável e pronta para revisão humana.")}</p>
        </div>
        <div class="result-section code-result">
          <span>Código gerado</span>
          <pre>${escapeHtml(result.generatedCode || "Nenhum código foi executado automaticamente.")}</pre>
        </div>
      </div>
    </section>
  `;
}

function resultList(title, items = []) {
  return `
    <div class="result-section">
      <span>${title}</span>
      <ul>${(items.length ? items : ["sem dados"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function missionTools(task, result = {}) {
  return uniqueList([
    ...(task.suggestedActions || []),
    ...(task.steps || []).map((step) => step.action),
    ...(result.tools || []),
  ])
    .filter((item) => item && !["planejar", "registrar_resultado", "responder"].includes(item))
    .slice(0, 8);
}

function missionAuditTrail(task) {
  const trail = (task.steps || []).map((step) => `${formatTime(step.time)} · ${step.action} · ${statusLabels[step.status] || step.status}`);
  const relatedLogs = state.logs
    .filter((log) => log.taskTitle === task.title)
    .slice(-4)
    .map((log) => `${formatTime(log.time)} · ${log.action} · ${statusLabels[log.status] || log.status}`);
  return uniqueList([...trail, ...relatedLogs]).slice(0, 10);
}

function renderSimulation(task) {
  const expected = task.expected || createSimulationForecast(task);
  return `
    <div class="simulation-grid">
      ${detailBlock("Chance de sucesso", `${expected.successChance}%`)}
      ${detailBlock("Tempo esperado", formatDuration(expected.estimatedMs))}
      ${detailBlock("Custo esperado", formatCurrency(expected.estimatedCost))}
      ${detailBlock("Ferramentas previstas", expected.predictedTools.join(", ") || "nenhuma")}
    </div>
  `;
}

function renderBenchmark(task) {
  const benchmark = task.benchmark || [];
  if (!benchmark.length) return "";
  return `
    <div class="benchmark-strip">
      <strong>Benchmark</strong>
      ${benchmark
        .map(
          (item, index) => `
            <span title="latência ${item.latency}ms · ${item.tokens} tokens · ${formatCurrency(item.cost)}">
              #${index + 1} ${escapeHtml(item.model)} · ${item.score}
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function renderApprovals() {
  const approvals = pendingSteps();
  elements.pendingApprovals.innerHTML = approvals.length
    ? approvals
        .map(({ task, step }) => {
          const agent = getAgent(task.agentId);
          return `
            <article class="approval-card">
              <h4>${escapeHtml(step.action)}</h4>
              <p class="meta-line">${escapeHtml(agent?.name || "Agente")} · ${escapeHtml(task.title)}</p>
              <p>${escapeHtml(step.message)}</p>
              <div class="approval-actions">
                <button class="mini-button" data-approve="true" data-task-id="${task.id}" data-step-id="${step.id}" title="Autoriza a continuação simulada e registra a aprovação." type="button">Aprovar</button>
                <button class="mini-button deny" data-deny="true" data-task-id="${task.id}" data-step-id="${step.id}" title="Bloqueia a missão e registra a negativa nos logs." type="button">Negar</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">Nenhuma ação arriscada aguardando decisão.</div>`;
}

function renderInspector() {
  if (!elements.inspector) return;
  const agent = getAgent(selectedInspectorAgentId);

  if (!agent) {
    elements.inspector.innerHTML = `<div class="empty-state">Selecione um agente na tabela para abrir o Agent Inspector.</div>`;
    return;
  }

  const profile = buildAgentProfile(agent);
  const replayClass = replayCursor >= 0 ? " replaying" : "";

  elements.inspector.innerHTML = `
    <div class="inspector-shell">
      <section class="panel inspector-hero">
        <div>
          <p class="section-label">Agent Inspector</p>
          <h3 id="inspector-title">${escapeHtml(agent.name)}</h3>
          <p class="meta-line">${escapeHtml(agent.role)} · ${escapeHtml(agent.description || agent.objective || agent.role)}</p>
        </div>
        <div class="inspector-actions">
          <button class="ghost-button" data-explain-agent title="A IA explica em linguagem simples por que tomou determinada decisão." type="button">✨ Explique</button>
          <button class="ghost-button" data-propose-agent title="Permite que um agente solicite outro especialista, sempre com aprovação humana." type="button">Criar especialista</button>
          <button class="ghost-button" data-open-investigation title="Abre informações técnicas completas da execução." type="button">Investigar</button>
          <button class="primary-button" data-replay-agent title="Reproduz toda a execução da missão passo a passo." type="button">▶ Reproduzir execução</button>
        </div>
      </section>

      <section class="inspector-grid">
        ${metricTile("Estado atual", statusLabels[agent.status] || agent.status)}
        ${metricTile("Modelo utilizado", agent.model)}
        ${metricTile("Tokens consumidos", profile.tokens.toLocaleString("pt-BR"))}
        ${metricTile("Tempo de execução", formatDuration(profile.runtimeMs))}
        ${metricTile("Latência", `${profile.latencyMs}ms`)}
        ${metricTile("Nível de risco", riskLabels[profile.riskLevel] || profile.riskLevel)}
        ${metricTile("Custo acumulado", formatCurrency(profile.cost))}
        ${metricTile("Tempo médio", formatDuration(profile.averageMs))}
        ${metricTile("Confiança", `${agent.confidence || profile.confidence}%`)}
      </section>

      <div class="inspector-layout spotlight-layout">
        <section class="panel now-panel">
          <div class="panel-header">
            <div>
              <p class="section-label">O que está acontecendo agora?</p>
              <h3>${escapeHtml(agent.name)} ${agent.status === "running" ? "está pensando" : "está sob observação"}</h3>
            </div>
            <span class="live-pill">ao vivo</span>
          </div>
          ${renderNowStream(profile)}
        </section>

        <section class="panel mission-health-panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Mission Health</p>
              <h3>Saúde da missão</h3>
            </div>
            ${statusBadge(profile.status)}
          </div>
          ${renderMissionHealth(profile)}
        </section>
      </div>

      <div class="inspector-layout spotlight-layout">
        <section class="panel replay-panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Mission Replay</p>
              <h3>Replay cinematográfico</h3>
            </div>
            <div class="replay-controls">
              <button class="mini-button" data-replay-step="back" title="Volta um passo da execução." type="button">Voltar</button>
              <button class="mini-button" data-replay-toggle title="Pausa ou continua o replay da missão." type="button">${replayPaused ? "Continuar" : "Pausar"}</button>
              <button class="mini-button" data-replay-step="next" title="Avança um passo da execução." type="button">Avançar</button>
              <select data-replay-speed title="Ajusta a velocidade do replay.">
                <option value="1200" ${replaySpeed === 1200 ? "selected" : ""}>0.75x</option>
                <option value="850" ${replaySpeed === 850 ? "selected" : ""}>1x</option>
                <option value="520" ${replaySpeed === 520 ? "selected" : ""}>1.5x</option>
                <option value="320" ${replaySpeed === 320 ? "selected" : ""}>2x</option>
              </select>
            </div>
          </div>
          ${renderReplayStage(profile)}
        </section>

        <section class="panel graph-panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Agent Graph</p>
              <h3>Sistema vivo</h3>
            </div>
          </div>
          ${renderAgentGraph(profile)}
        </section>
      </div>

      <div class="inspector-layout">
        <section class="panel trust-panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Trust Score</p>
              <h3 title="Nível de confiança baseado no histórico.">Confiabilidade operacional</h3>
            </div>
            <strong class="trust-score">${profile.trustScore}</strong>
          </div>
          <div class="stars" aria-label="${profile.trustScore} pontos de confiança">${"★".repeat(Math.max(1, Math.round(profile.trustScore / 20)))}${"☆".repeat(5 - Math.max(1, Math.round(profile.trustScore / 20)))}</div>
          <p class="meta-line">Sobe quando conclui missões, evita erros e pede aprovação. Cai quando falha, bloqueia ou usa permissões sensíveis sem clareza.</p>
          ${renderTrustHistory(profile.trustHistory)}
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Agent DNA</p>
              <h3 title="Mostra a evolução e características do agente.">Perfil evolutivo</h3>
            </div>
          </div>
          <div class="dna-stack">
            ${renderDnaBars(profile.dna)}
          </div>
        </section>
      </div>

      <div class="inspector-layout">
        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Linha do tempo inteligente</p>
              <h3>Histórico completo</h3>
            </div>
            <span class="status ${profile.riskLevel === "high" ? "failed" : profile.riskLevel === "medium" ? "pending" : "completed"}">${escapeHtml(profile.nextAction)}</span>
          </div>
          <div class="smart-timeline${replayClass}">
            ${profile.timeMachine.length ? renderTimeMachine(profile.timeMachine, agent.id) : ""}
            ${profile.events
              .map((event, index) => renderSmartEvent(event, index, profile.events.length))
              .join("")}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Fluxo</p>
              <h3>Visualização do fluxo</h3>
            </div>
          </div>
          <div class="agent-flow">
            ${profile.flow
              .map(
                (node, index) => `
                  <div class="flow-node ${node.status}">
                    <span>${index + 1}</span>
                    <strong>${escapeHtml(node.label)}</strong>
                    ${statusBadge(node.status)}
                  </div>
                  ${index < profile.flow.length - 1 ? `<div class="flow-edge">↓</div>` : ""}
                `
              )
              .join("")}
          </div>
        </section>
      </div>

      <div class="inspector-layout">
        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Conversa entre agentes</p>
              <h3>Coordenação</h3>
            </div>
          </div>
          <div class="agent-chat">
            ${profile.conversation.map(renderAgentMessage).join("") || `<div class="empty-state">Nenhuma conversa entre agentes ainda.</div>`}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Prompt Diff</p>
              <h3>Mudanças de estratégia</h3>
            </div>
          </div>
          <div class="prompt-diff">
            ${renderPromptDiff(profile.lastTask)}
          </div>
        </section>
      </div>

      <div class="inspector-layout">
        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Sistema de memória</p>
              <h3>Memória do agente</h3>
            </div>
            <div class="memory-actions">
              <input data-memory-search type="search" placeholder="Pesquisar memória" value="${escapeHtml(memorySearch)}" />
              <button class="ghost-button" data-pin-memory type="button">Fixar aprendizado</button>
              <button class="ghost-button" data-export-memory type="button">Exportar memória</button>
              <button class="danger-button" data-clear-memory type="button">Apagar memória</button>
            </div>
          </div>
          <div class="memory-grid">
            ${renderMemoryEditor("recent", "Memória recente", agent.memory.recent)}
            ${renderMemoryEditor("permanent", "Memória permanente", agent.memory.permanent)}
            ${renderMemoryEditor("context", "Contexto recebido", agent.memory.context)}
            ${renderMemoryEditor("learned", "Conhecimento aprendido", agent.memory.learned)}
          </div>
          <button class="primary-button memory-save" data-save-memory type="button">Salvar memória</button>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Ferramentas</p>
              <h3>Permissões e uso</h3>
            </div>
          </div>
          <div class="table-wrap">
            <table class="tool-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Permissões</th>
                  <th>Uso</th>
                  <th>Tempo médio</th>
                  <th>Falhas</th>
                  <th>Último uso</th>
                </tr>
              </thead>
              <tbody>
                ${profile.tools.map(renderToolRow).join("")}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Decisão</p>
            <h3>Próxima ação planejada</h3>
          </div>
          ${statusBadge(profile.status)}
        </div>
        <div class="decision-grid">
          ${detailBlock("Objetivo", agent.objective || agent.role)}
          ${detailBlock("Última decisão tomada", profile.lastDecision)}
          ${detailBlock("Próxima ação planejada", profile.nextAction)}
          ${detailBlock("Ferramentas disponíveis", agent.tools.join(", ") || "nenhuma")}
        </div>
      </section>
    </div>
  `;

  elements.inspector.querySelectorAll("[data-event-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.eventIndex);
      if (expandedInspectorEvents.has(index)) {
        expandedInspectorEvents.delete(index);
      } else {
        expandedInspectorEvents.add(index);
      }
      renderInspector();
    });
  });

  elements.inspector.querySelectorAll("[data-explain-event]").forEach((button) => {
    button.addEventListener("click", () => explainInspectorEvent(agent.id, Number(button.dataset.explainEvent)));
  });

  elements.inspector.querySelector("[data-save-memory]")?.addEventListener("click", saveInspectorMemory);
  elements.inspector.querySelector("[data-clear-memory]")?.addEventListener("click", clearInspectorMemory);
  elements.inspector.querySelector("[data-export-memory]")?.addEventListener("click", exportInspectorMemory);
  elements.inspector.querySelector("[data-pin-memory]")?.addEventListener("click", pinInspectorLearning);
  elements.inspector.querySelector("[data-memory-search]")?.addEventListener("input", (event) => {
    memorySearch = event.target.value;
    renderInspector();
  });
  elements.inspector.querySelector("[data-open-investigation]")?.addEventListener("click", () => openInvestigation(agent.id));
  elements.inspector.querySelector("[data-replay-agent]")?.addEventListener("click", () => replayAgent(agent.id));
  elements.inspector.querySelector("[data-replay-toggle]")?.addEventListener("click", () => toggleReplay(agent.id));
  elements.inspector.querySelectorAll("[data-replay-step]").forEach((button) => {
    button.addEventListener("click", () => stepReplay(agent.id, button.dataset.replayStep === "next" ? 1 : -1));
  });
  elements.inspector.querySelector("[data-replay-speed]")?.addEventListener("change", (event) => {
    replaySpeed = Number(event.target.value);
    if (replayCursor >= 0 && !replayPaused) replayAgent(agent.id, replayCursor);
  });
  elements.inspector.querySelector("[data-replay-range]")?.addEventListener("input", (event) => jumpReplay(agent.id, Number(event.target.value)));
  elements.inspector.querySelectorAll("[data-replay-jump]").forEach((button) => {
    button.addEventListener("click", () => jumpReplay(agent.id, Number(button.dataset.replayJump)));
  });
  elements.inspector.querySelector("[data-explain-agent]")?.addEventListener("click", () => explainAgent(agent.id));
  elements.inspector.querySelector("[data-propose-agent]")?.addEventListener("click", () => proposeSpecialistAgent(agent.id));
  elements.inspector.querySelector("[data-time-machine]")?.addEventListener("input", (event) => {
    replayCursor = Number(event.target.value);
    expandedInspectorEvents = new Set([replayCursor]);
    renderInspector();
  });
}

function openAgentInspector(agentId) {
  if (!Billing.canUseFeature("advancedInspector")) {
    showUpgradeModal("advancedInspector");
    return;
  }
  selectedInspectorAgentId = agentId;
  expandedInspectorEvents = new Set();
  replayCursor = -1;
  stopReplay();
  trackFunnelEvent("inspector_opened", { agentId });
  switchView("inspector");
  elements.viewTitle.textContent = "Agent Inspector";
  renderInspector();
}

function buildAgentProfile(agent) {
  const tasks = state.tasks.filter((task) => task.agentId === agent.id);
  const logs = state.logs.filter((log) => log.agentName === agent.name);
  const lastTask = tasks[0] || null;
  const tokenTotal = tasks.reduce((sum, task) => sum + Number(task.tokenUsage?.total_tokens || 0), 0);
  const cost = tasks.reduce((sum, task) => sum + Number(task.cost || 0), 0);
  const latencies = tasks.map((task) => Number(task.latencyMs || 0)).filter(Boolean);
  const latencyMs = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0;
  const runtimeMs = tasks.reduce((sum, task) => sum + Math.max(0, (task.completedAt || Date.now()) - (task.startedAt || task.createdAt || Date.now())), 0);
  const averageMs = tasks.length ? Math.round(runtimeMs / tasks.length) : 0;
  const riskLevel = highestRisk(tasks.map((task) => task.riskLevel || "low"));
  const events = buildInspectorEvents(agent, tasks, logs);
  const trustScore = calculateTrustScore(agent, tasks);
  const dna = evolveAgentDna(agent, tasks);

  return {
    status: agent.status,
    tokens: tokenTotal,
    cost,
    latencyMs,
    runtimeMs,
    averageMs,
    riskLevel,
    trustScore,
    trustHistory: buildTrustHistory(agent, tasks),
    dna,
    confidence: Math.max(48, Math.min(99, Math.round((trustScore + (agent.confidence || 80)) / 2))),
    events,
    flow: buildFlow(lastTask),
    tools: buildToolStats(agent, tasks, logs),
    nextAction: nextActionFor(lastTask),
    lastDecision: lastDecisionFor(tasks, logs),
    lastTask,
    conversation: tasks.flatMap((task) => task.communications || []).slice(-12),
    timeMachine: lastTask?.timeMachine || createTimeMachine(lastTask),
  };
}

function buildInspectorEvents(agent, tasks, logs) {
  const taskEvents = tasks.flatMap((task) =>
    task.steps.map((step, index) => ({
      time: step.time || task.createdAt,
      title: step.action,
      status: step.status,
      message: step.message,
      detail: {
        missao: task.title,
        modelo: task.modelUsed,
        risco: task.riskLevel,
        ordem: index + 1,
        decisão: step.decision || "sem decisão",
      },
    }))
  );

  const logEvents = logs.map((log) => ({
    time: log.time,
    title: log.action,
    status: log.status,
    message: log.message,
    detail: {
      agente: agent.name,
      missao: log.taskTitle,
      origem: "log localStorage",
    },
  }));

  return [...taskEvents, ...logEvents]
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .slice(-80);
}

function renderNowStream(profile) {
  const baseEvents = profile.events.length
    ? profile.events.slice(-6)
    : [
        { title: "Recebeu missão", status: "completed", message: "Aguardando primeira execução.", time: Date.now() },
        { title: "Consultou memória", status: "queued", message: "Contexto pronto para próxima missão.", time: Date.now() },
        { title: "Preparando resposta", status: "queued", message: "Sem ação externa em andamento.", time: Date.now() },
      ];
  const activeIndex = replayCursor >= 0 ? Math.min(baseEvents.length - 1, replayCursor % baseEvents.length) : baseEvents.length - 1;

  return `
    <div class="now-stream">
      ${baseEvents
        .map(
          (event, index) => `
            <article class="now-step ${index === activeIndex ? "active" : ""} ${event.status}">
              <span>${formatTime(event.time)}</span>
              <strong>${escapeHtml(humanizeAction(event.title))}</strong>
              <p>${escapeHtml(event.message || explainEvent(event))}</p>
            </article>
            ${index < baseEvents.length - 1 ? `<div class="now-arrow">↓</div>` : ""}
          `
        )
        .join("")}
    </div>
  `;
}

function renderMissionHealth(profile) {
  const memoryUse = Math.min(100, Math.max(8, (profile.events.length * 7 + profile.conversation.length * 5) % 100));
  const cpuUse = profile.status === "running" ? 72 : profile.status === "pending" ? 38 : profile.status === "failed" ? 18 : 24;
  const toolUse = Math.min(100, Math.max(6, profile.tools.reduce((sum, tool) => sum + tool.useCount, 0) * 11));
  const callUse = Math.min(100, Math.max(4, profile.events.length * 5));

  return `
    <div class="health-grid">
      ${healthMeter("Memória", memoryUse, "Contexto vivo")}
      ${healthMeter("CPU", cpuUse, "Simulado")}
      ${healthMeter("Tokens", Math.min(100, Math.round(profile.tokens / 60)), profile.tokens.toLocaleString("pt-BR"))}
      ${healthMeter("Latência", Math.min(100, Math.round(profile.latencyMs / 35)), `${profile.latencyMs}ms`)}
      ${healthMeter("Ferramentas", toolUse, `${profile.tools.length} disponíveis`)}
      ${healthMeter("Chamadas", callUse, `${profile.events.length} eventos`)}
    </div>
  `;
}

function healthMeter(label, value, helper) {
  const safeValue = clamp(value);
  return `
    <div class="health-meter">
      <div>
        <span>${label}</span>
        <strong>${safeValue}%</strong>
      </div>
      <i><b style="width:${safeValue}%"></b></i>
      <em>${escapeHtml(helper)}</em>
    </div>
  `;
}

function renderReplayStage(profile) {
  const events = profile.events.length ? profile.events : [];
  if (!events.length) {
    return `<div class="empty-state">Nenhum evento para reproduzir ainda.</div>`;
  }
  const index = Math.min(events.length - 1, Math.max(0, replayCursor >= 0 ? replayCursor : events.length - 1));
  const event = events[index];
  return `
    <div class="replay-stage ${replayCursor >= 0 && !replayPaused ? "playing" : ""}">
      <div class="replay-scene">
        <span>${formatTime(event.time)}</span>
        <strong>${escapeHtml(humanizeAction(event.title))}</strong>
        <p>${escapeHtml(event.message || explainEvent(event))}</p>
        ${statusBadge(event.status)}
      </div>
      <div class="replay-filmstrip">
        ${events
          .map(
            (item, itemIndex) => `
              <button class="${itemIndex === index ? "active" : ""}" data-replay-jump="${itemIndex}" title="${escapeHtml(humanizeAction(item.title))}" type="button">
                <span style="height:${Math.max(16, Math.min(100, (itemIndex + 1) * (100 / events.length)))}%"></span>
              </button>
            `
          )
          .join("")}
      </div>
      <input class="replay-range" data-replay-range type="range" min="0" max="${events.length - 1}" value="${index}" />
    </div>
  `;
}

function renderAgentGraph(profile) {
  const nodes = profile.flow.map((node, index) => ({
    ...node,
    label: index === 0 ? "Usuário" : node.label,
    active: replayCursor >= 0 ? index <= Math.min(profile.flow.length - 1, replayCursor % profile.flow.length) : index === profile.flow.length - 1,
  }));
  return `
    <div class="agent-graph">
      ${nodes
        .map(
          (node, index) => `
            <div class="graph-node ${node.status} ${node.active ? "active" : ""}">
              <span>${escapeHtml(node.label.slice(0, 2).toUpperCase())}</span>
              <strong>${escapeHtml(node.label)}</strong>
            </div>
            ${index < nodes.length - 1 ? `<div class="graph-edge ${node.active ? "active" : ""}"></div>` : ""}
          `
        )
        .join("")}
    </div>
  `;
}

function humanizeAction(action = "") {
  const dictionary = {
    chamar_openrouter: "Chamou a IA",
    planejar: "Planejou",
    ler_contexto: "Consultou memória",
    registrar_resultado: "Registrou resultado",
    plano_ia: "Validou plano da IA",
    erro_openrouter: "Encontrou falha",
    seed_demo: "Preparou experiência",
    preparar_experiencia: "Preparou experiência",
  };
  return dictionary[action] || String(action).replace(/_/g, " ");
}

function explainEvent(event) {
  if (!event) return "Aguardando sinal do agente.";
  if (event.status === "pending") return "Aguardando aprovação humana antes de continuar.";
  if (event.status === "failed") return "A execução parou para preservar segurança e auditoria.";
  if (event.status === "completed") return "Etapa registrada e pronta para inspeção.";
  return "Evento capturado pelo Mission Control.";
}

function renderSmartEvent(event, index, totalEvents) {
  const expanded = expandedInspectorEvents.has(index);
  const active = replayCursor === index;
  return `
    <article class="smart-event ${active ? "replay-active" : ""}">
      <button class="smart-event-main" data-event-index="${index}" type="button">
        <span>${formatTime(event.time)}</span>
        <strong>${escapeHtml(event.title)}</strong>
        ${statusBadge(event.status)}
        <em>${escapeHtml(event.message || "")}</em>
      </button>
      ${
        expanded
          ? `<div class="event-expanded">
              <pre class="event-detail">${escapeHtml(JSON.stringify(event.detail, null, 2))}</pre>
              <button class="mini-button" data-explain-event="${index}" title="Explica em linguagem simples por que esta decisão aconteceu." type="button">✨ Explique esta decisão</button>
            </div>`
          : ""
      }
      ${index < totalEvents - 1 ? `<div class="timeline-arrow">↓</div>` : ""}
    </article>
  `;
}

function buildFlow(task) {
  const labels = ["Usuário", "Planner", "Research", "Code", "Review", "Resposta"];
  if (!task) {
    return labels.map((label, index) => ({ label, status: index === 0 ? "completed" : "queued" }));
  }

  const statusByTask = task.status === "failed" || task.status === "blocked" ? "failed" : task.status === "pending" ? "pending" : "completed";
  return labels.map((label, index) => ({
    label,
    status: index === labels.length - 1 ? statusByTask : task.status === "running" && index > 2 ? "queued" : "completed",
  }));
}

function buildToolStats(agent, tasks, logs) {
  return agent.tools.map((tool) => {
    const relatedSteps = tasks.flatMap((task) =>
      task.steps.filter((step) => String(step.action || "").includes(tool) || String(step.message || "").includes(tool))
    );
    const relatedLogs = logs.filter((log) => String(log.action || "").includes(tool) || String(log.message || "").includes(tool));
    const useCount = relatedSteps.length + relatedLogs.length;
    const failures = [...relatedSteps, ...relatedLogs].filter((item) => ["failed", "denied", "blocked"].includes(item.status)).length;
    const last = [...relatedSteps.map((step) => step.time), ...relatedLogs.map((log) => log.time)].filter(Boolean).sort().at(-1);

    return {
      name: tool,
      permission: RISKY_ACTIONS.has(tool) ? "sensível, aprovação obrigatória" : "permitida",
      useCount,
      averageMs: useCount ? Math.max(40, Math.round(buildAgentAverageLatency(tasks) / Math.max(1, agent.tools.length))) : 0,
      failures,
      lastUse: last ? formatDateTime(last) : "sem uso",
    };
  });
}

function renderToolRow(tool) {
  return `
    <tr>
      <td><strong>${escapeHtml(tool.name)}</strong></td>
      <td>${escapeHtml(tool.permission)}</td>
      <td>${tool.useCount}</td>
      <td>${tool.averageMs}ms</td>
      <td>${tool.failures}</td>
      <td>${escapeHtml(tool.lastUse)}</td>
    </tr>
  `;
}

function renderMemoryEditor(key, title, items) {
  const normalizedSearch = memorySearch.trim().toLowerCase();
  const visibleItems = normalizedSearch
    ? (items || []).filter((item) => item.toLowerCase().includes(normalizedSearch))
    : items || [];
  return `
    <label class="memory-editor">
      ${title}
      <textarea data-memory-key="${key}" rows="5">${escapeHtml(visibleItems.join("\n"))}</textarea>
    </label>
  `;
}

function saveInspectorMemory() {
  const agent = getAgent(selectedInspectorAgentId);
  if (!agent) return;
  if (memorySearch.trim()) {
    showToast("Limpe a busca antes de salvar a memória.");
    return;
  }
  elements.inspector.querySelectorAll("[data-memory-key]").forEach((field) => {
    agent.memory[field.dataset.memoryKey] = field.value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  });
  logAction(agent.id, null, "editar_memoria", "completed", `Memória de ${agent.name} atualizada.`);
  saveState();
  render();
  showToast("Memória salva.");
}

function clearInspectorMemory() {
  const agent = getAgent(selectedInspectorAgentId);
  if (!agent) return;
  agent.memory = { recent: [], permanent: [], context: [], learned: [] };
  logAction(agent.id, null, "apagar_memoria", "completed", `Memória de ${agent.name} apagada.`);
  saveState();
  render();
  showToast("Memória apagada.");
}

function exportInspectorMemory() {
  const agent = getAgent(selectedInspectorAgentId);
  if (!agent) return;
  downloadText(`${safeFileName(agent.name)}-memoria.json`, JSON.stringify(agent.memory, null, 2), "application/json");
  logAction(agent.id, null, "exportar_memoria", "completed", `Memória de ${agent.name} exportada.`);
  saveState();
  renderLogs();
}

function pinInspectorLearning() {
  const agent = getAgent(selectedInspectorAgentId);
  if (!agent) return;
  const latest = agent.memory.learned?.[0] || agent.memory.recent?.[0] || "Aprendizado fixado manualmente.";
  agent.memory.permanent.unshift(latest);
  agent.memory.permanent = uniqueList(agent.memory.permanent).slice(0, 12);
  logAction(agent.id, null, "fixar_memoria", "completed", `Aprendizado fixado na memória permanente de ${agent.name}.`);
  saveState();
  renderInspector();
  showToast("Aprendizado fixado.");
}

function openInvestigation(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const lastTask = state.tasks.find((task) => task.agentId === agent.id);

  elements.investigationContent.innerHTML = lastTask?.observability
    ? `
      ${investigationBlock("Prompt enviado", lastTask.observability.prompt)}
      ${investigationBlock("Resposta recebida", lastTask.observability.response)}
      ${investigationBlock("Ferramentas utilizadas", lastTask.observability.tools)}
      ${investigationBlock("Tempo gasto", `${lastTask.latencyMs || 0}ms`)}
      ${investigationBlock("Modelo utilizado", lastTask.modelUsed)}
      ${investigationBlock("Entrada", lastTask.observability.input)}
      ${investigationBlock("Saída", lastTask.observability.output)}
    `
    : `<div class="empty-state">Este agente ainda não possui uma execução real investigável.</div>`;

  elements.investigationDialog.showModal();
}

function replayAgent(agentId, startAt = 0) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const events = buildAgentProfile(agent).events;
  if (!events.length) {
    showToast("Nenhum evento para reproduzir.");
    return;
  }

  stopReplay();
  replayPaused = false;
  replayCursor = Math.min(events.length - 1, Math.max(0, startAt));
  expandedInspectorEvents = new Set([replayCursor]);
  trackFunnelEvent("replay_opened", { source: "inspector", agentId });
  renderInspector();
  replayTimer = window.setInterval(() => {
    if (replayPaused) return;
    replayCursor += 1;
    if (replayCursor >= events.length) {
      stopReplay();
      showToast("Replay finalizado.");
      renderInspector();
      return;
    }
    expandedInspectorEvents = new Set([replayCursor]);
    renderInspector();
  }, replaySpeed);
}

function toggleReplay(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  if (replayCursor < 0) {
    replayAgent(agentId);
    return;
  }
  replayPaused = !replayPaused;
  renderInspector();
}

function stepReplay(agentId, direction) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const events = buildAgentProfile(agent).events;
  if (!events.length) return;
  stopReplay();
  replayPaused = true;
  replayCursor = Math.min(events.length - 1, Math.max(0, replayCursor < 0 ? 0 : replayCursor + direction));
  expandedInspectorEvents = new Set([replayCursor]);
  renderInspector();
}

function jumpReplay(agentId, index) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const events = buildAgentProfile(agent).events;
  if (!events.length) return;
  stopReplay();
  replayPaused = true;
  replayCursor = Math.min(events.length - 1, Math.max(0, index));
  expandedInspectorEvents = new Set([replayCursor]);
  renderInspector();
}

function stopReplay() {
  if (replayTimer) window.clearInterval(replayTimer);
  replayTimer = null;
  replayPaused = false;
}

function rememberAgentLearning(agent, task, result) {
  agent.memory.recent.unshift(`Executou "${task.title}" com risco ${riskLabels[result.risk_level] || result.risk_level}.`);
  agent.memory.learned.unshift(result.summary);
  agent.memory.context.unshift(`Último modelo: ${task.modelUsed}. Latência: ${task.latencyMs || 0}ms.`);
  agent.memory.recent = agent.memory.recent.slice(0, 8);
  agent.memory.learned = agent.memory.learned.slice(0, 8);
  agent.memory.context = agent.memory.context.slice(0, 8);
}

function detailBlock(title, value) {
  return `
    <div class="detail-block">
      <span>${title}</span>
      <strong>${escapeHtml(value || "sem dados")}</strong>
    </div>
  `;
}

function metricTile(label, value) {
  return `
    <article class="metric-card inspector-metric">
      <p>${label}</p>
      <strong>${escapeHtml(value || "0")}</strong>
    </article>
  `;
}

function investigationBlock(title, value) {
  const rendered = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return `
    <section class="investigation-block">
      <h4>${title}</h4>
      <pre>${escapeHtml(rendered || "sem dados")}</pre>
    </section>
  `;
}

function highestRisk(risks) {
  if (risks.includes("high")) return "high";
  if (risks.includes("medium")) return "medium";
  return "low";
}

function nextActionFor(task) {
  if (!task) return "aguardando missão";
  const pending = task.steps.find((step) => step.status === "pending");
  if (pending) return `aguardar aprovação: ${pending.action}`;
  const queued = task.steps.find((step) => step.status === "queued" || step.status === "running");
  if (queued) return queued.action;
  if (task.status === "completed") return "aguardar nova missão";
  if (task.status === "failed" || task.status === "blocked") return "revisar falha";
  return "monitorar execução";
}

function lastDecisionFor(tasks, logs) {
  const stepDecision = tasks
    .flatMap((task) => task.steps.map((step) => ({ task, step })))
    .reverse()
    .find(({ step }) => step.decision);
  if (stepDecision) return `${stepDecision.step.decision}: ${stepDecision.step.action}`;
  const logDecision = [...logs].reverse().find((log) => ["approved", "denied", "failed"].includes(log.status));
  return logDecision ? `${logDecision.status}: ${logDecision.action}` : "nenhuma decisão registrada";
}

function buildAgentAverageLatency(tasks) {
  const latencies = tasks.map((task) => Number(task.latencyMs || 0)).filter(Boolean);
  return latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0;
}

function createAgentDna(agent = {}) {
  const toolCount = agent.tools?.length || 3;
  return {
    precision: 78 + Math.min(14, toolCount * 2),
    creativity: 62 + Math.min(18, toolCount * 3),
    speed: 70 + Math.min(16, toolCount),
    autonomy: 58 + Math.min(24, toolCount * 3),
    reliability: 82,
    cost: 94,
  };
}

function calculateTrustScore(agent, tasks) {
  const base = Number(agent.trustScore || 82);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const failed = tasks.filter((task) => ["failed", "blocked"].includes(task.status)).length;
  const approvals = tasks.flatMap((task) => task.steps || []).filter((step) => step.decision === "approved").length;
  const denials = tasks.flatMap((task) => task.steps || []).filter((step) => step.decision === "denied").length;
  return Math.max(1, Math.min(100, base + completed * 2 + approvals * 3 - failed * 6 - denials * 5));
}

function buildTrustHistory(agent, tasks) {
  let score = Math.max(1, Math.min(100, Number(agent.trustScore || 82) - Math.min(14, tasks.length * 2)));
  const ordered = [...tasks].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(-8);
  if (!ordered.length) return [{ label: "base", score: Number(agent.trustScore || 82) }];
  return ordered.map((task, index) => {
    if (task.status === "completed") score += 4;
    if (task.status === "pending") score += 1;
    if (["failed", "blocked"].includes(task.status)) score -= 7;
    if ((task.steps || []).some((step) => step.decision === "approved")) score += 3;
    if ((task.steps || []).some((step) => step.decision === "denied")) score -= 5;
    score = Math.max(1, Math.min(100, score));
    return { label: task.title || `M${index + 1}`, score };
  });
}

function renderTrustHistory(history = []) {
  const points = history.length ? history : [{ label: "base", score: 82 }];
  return `
    <div class="trust-history" title="Evolução histórica da confiança do agente.">
      ${points
        .map(
          (point) => `
            <span style="--trust:${clamp(point.score)}%" aria-label="${escapeHtml(point.label)}: ${clamp(point.score)}">
              <i></i>
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function evolveTrust(agent, task, eventType) {
  const delta = {
    plan: task.requiredApproval ? 1 : 0,
    completed: 3,
    approved: 4,
    denied: -5,
    failed: -7,
  }[eventType] || 0;
  agent.trustScore = Math.max(1, Math.min(100, Number(agent.trustScore || 82) + delta));
  agent.confidence = Math.max(30, Math.min(99, Number(agent.confidence || 80) + Math.sign(delta || 1)));
}

function evolveAgentDna(agent, tasks) {
  const dna = { ...createAgentDna(agent), ...(agent.dna || {}) };
  const completed = tasks.filter((task) => task.status === "completed").length;
  const failed = tasks.filter((task) => ["failed", "blocked"].includes(task.status)).length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  return {
    precision: clamp(dna.precision + completed * 2 - failed * 4),
    creativity: clamp(dna.creativity + Math.min(8, tasks.length)),
    speed: clamp(dna.speed + completed - Math.round(averageLatency() / 1000)),
    autonomy: clamp(dna.autonomy + completed - pending * 2),
    reliability: clamp(dna.reliability + completed * 2 - failed * 6),
    cost: clamp(dna.cost - Math.round(tasks.reduce((sum, task) => sum + Number(task.cost || 0), 0) * 10)),
  };
}

function renderDnaBars(dna) {
  const labels = {
    precision: "Precisão",
    creativity: "Criatividade",
    speed: "Velocidade",
    autonomy: "Autonomia",
    reliability: "Confiabilidade",
    cost: "Custo",
  };
  return Object.entries(labels)
    .map(
      ([key, label]) => `
        <div class="dna-row">
          <span>${label}</span>
          <div class="dna-bar"><i style="width:${clamp(dna[key])}%"></i></div>
          <strong>${clamp(dna[key])}</strong>
        </div>
      `
    )
    .join("");
}

function renderTimeMachine(snapshots, agentId) {
  const max = Math.max(0, snapshots.length - 1);
  const current = snapshots[Math.min(max, Math.max(0, replayCursor))] || snapshots[max];
  return `
    <div class="time-machine">
      <div>
        <p class="section-label">Time Machine</p>
        <strong>${escapeHtml(current?.label || "Estado atual")}</strong>
      </div>
      <input data-time-machine="${agentId}" type="range" min="0" max="${max}" value="${Math.min(max, Math.max(0, replayCursor))}" />
      <pre>${escapeHtml(JSON.stringify(current?.snapshot || {}, null, 2))}</pre>
    </div>
  `;
}

function renderAgentMessage(message) {
  return `
    <article class="agent-message">
      <strong>${escapeHtml(message.from)}</strong>
      <span>→ ${escapeHtml(message.to)}</span>
      <p>${escapeHtml(message.message)}</p>
    </article>
  `;
}

function renderPromptDiff(task) {
  if (!task?.observability?.prompt?.length) {
    return `<div class="empty-state">Nenhum prompt real registrado ainda.</div>`;
  }
  const before = task.observability.prompt[0]?.content || "";
  const after = task.observability.prompt[1]?.content || "";
  return `
    <div class="diff-grid">
      <pre><strong>ANTES</strong>${escapeHtml(before)}</pre>
      <pre><strong>DEPOIS</strong>${escapeHtml(after)}</pre>
    </div>
  `;
}

function createMissionResult(task = {}, aiResult = {}) {
  const steps = task.steps || [];
  const suggestedActions = aiResult.suggested_actions || task.suggestedActions || [];
  const riskLevel = aiResult.risk_level || task.riskLevel || "medium";
  const summary = aiResult.summary || task.summary || `Resultado estruturado para "${task.title || "missão"}".`;
  const stepTexts = aiResult.steps || steps.map((step) => step.message || step.action).filter(Boolean);
  const toolHints = uniqueList([
    ...(task.expected?.predictedTools || []),
    ...(task.observability?.tools || []),
    ...suggestedActions.filter((action) => TOOL_CATALOG.includes(action)),
  ]).slice(0, 5);

  return {
    summary,
    readyAnswer: buildReadyAnswer(task, summary, riskLevel, suggestedActions),
    analyzedFiles: inferAnalyzedFiles(task, stepTexts),
    producedFiles: inferProducedFiles(task, stepTexts),
    suggestedFixes: suggestedActions.length
      ? suggestedActions.map((action) => `Revisar e aprovar manualmente: ${action}`)
      : [
          riskLevel === "high" ? "Validar permissões e bloquear ações sensíveis sem aprovação." : "Executar os próximos passos em ambiente supervisionado.",
          "Registrar decisões e evidências antes de qualquer ação externa.",
          "Comparar a saída com os critérios de sucesso da missão.",
        ],
    generatedCode: inferGeneratedCode(task, aiResult, toolHints),
    checklist: [
      "Plano estruturado gerado antes da execução.",
      `Risco classificado como ${riskLabels[riskLevel] || riskLevel}.`,
      task.requiredApproval ? "Aprovação humana obrigatória antes de continuar." : "Nenhuma ação sensível liberada automaticamente.",
      "Logs e observabilidade registrados no Mission Control.",
    ],
    nextSteps: [
      task.requiredApproval ? "Aprovar ou negar a ação sensível pendente." : "Revisar a entrega e executar manualmente o que fizer sentido.",
      "Abrir Investigar para auditar prompt, resposta, tokens e modelo.",
      "Salvar como template se esta missão virar fluxo recorrente.",
    ],
    conclusion: task.status === "blocked"
      ? "A missão foi bloqueada com segurança porque dependia de aprovação humana."
      : "A missão terminou com trilha auditável, resultado exportável e execução reproduzível no Replay.",
  };
}

function buildReadyAnswer(task, summary, riskLevel, suggestedActions = []) {
  const actionText = suggestedActions.length ? ` Ações sugeridas: ${suggestedActions.join(", ")}.` : "";
  return `${summary} Risco ${riskLabels[riskLevel] || riskLevel}. Nenhuma ação externa foi executada automaticamente.${actionText}`;
}

function inferAnalyzedFiles(task, stepTexts = []) {
  const joined = `${task.title || ""} ${task.objective || ""} ${stepTexts.join(" ")}`;
  const matches = joined.match(/[A-Za-z0-9_.-]+\.(js|ts|tsx|jsx|html|css|json|md|py|sql|pdf|docx)/g);
  return uniqueList(matches || []).slice(0, 6);
}

function inferProducedFiles(task, stepTexts = []) {
  const files = inferAnalyzedFiles(task, stepTexts);
  if (files.length) return files.map((file) => file.replace(/(\.[^.]+)$/, "-resultado.md"));
  return [`${safeFileName(task.title || "missao") || "missao"}-resultado.md`];
}

function inferGeneratedCode(task, aiResult = {}, toolHints = []) {
  const actionList = (aiResult.suggested_actions || task.suggestedActions || []).join(", ");
  if (/c[oó]digo|script|fun[cç][aã]o|html|css|javascript|react/i.test(`${task.title || ""} ${task.objective || ""}`)) {
    return [
      "// Pseudocodigo seguro gerado pelo Mission Control",
      "const resultado = {",
      `  missao: ${JSON.stringify(task.title || "missao")},`,
      `  ferramentasPrevistas: ${JSON.stringify(toolHints)},`,
      `  acoesSugeridas: ${JSON.stringify(actionList || "revisar manualmente")},`,
      "  executarAutomaticamente: false",
      "};",
    ].join("\n");
  }
  return "Nenhum código executado automaticamente. A entrega está pronta para revisão humana.";
}

function missionResultMarkdown(task) {
  const result = task.result || createMissionResult(task);
  return [
    `# Resultado da Missão: ${task.title}`,
    "",
    `**Status:** ${statusLabels[task.status] || task.status}`,
    `**Risco:** ${riskLabels[task.riskLevel] || task.riskLevel || "sem dados"}`,
    `**Modelo:** ${task.modelUsed || "sem dados"}`,
    "",
    "## Resumo",
    result.summary,
    "",
    "## Arquivos analisados",
    markdownList(result.analyzedFiles),
    "",
    "## Correções sugeridas",
    markdownList(result.suggestedFixes),
    "",
    "## Código gerado",
    "```",
    result.generatedCode || "Nenhum código gerado.",
    "```",
    "",
    "## Checklist",
    markdownList(result.checklist),
    "",
    "## Próximos passos",
    markdownList(result.nextSteps),
  ].join("\n");
}

function markdownList(items = []) {
  return (items.length ? items : ["sem dados"]).map((item) => `- ${item}`).join("\n");
}

function createSimulationForecast(task = {}) {
  const risk = task.riskLevel || "medium";
  const tools = task.agentTools || task.predictedTools || ["pesquisar_web", "ler_arquivo"];
  const riskPenalty = risk === "high" ? 24 : risk === "medium" ? 12 : 4;
  return {
    successChance: Math.max(42, 96 - riskPenalty),
    estimatedMs: risk === "high" ? 420000 : risk === "medium" ? 240000 : 120000,
    estimatedCost: 0,
    predictedTools: tools.slice(0, 4),
    risk,
  };
}

function createMissionConversation(task = {}, result = {}) {
  const title = task.title || "Nova missão";
  return [
    { from: "Planner", to: "Research", message: `Quebrei "${title}" em etapas verificáveis.` },
    { from: "Research", to: "Reviewer", message: "Valide risco, permissões e necessidade de aprovação humana." },
    { from: "Reviewer", to: "Memory", message: result.summary || "Registrar contexto e manter histórico auditável." },
  ];
}

function createBenchmark(task = {}) {
  const baseLatency = Number(task.latencyMs || 900);
  return [
    { model: task.modelUsed || "openrouter/free", latency: baseLatency, tokens: 720, cost: 0, score: 94 },
    { model: "meta-llama/llama-3.3-70b-instruct:free", latency: baseLatency + 380, tokens: 810, cost: 0, score: 91 },
    { model: "google/gemma-4-26b-a4b-it:free", latency: Math.max(220, baseLatency - 160), tokens: 690, cost: 0, score: 88 },
  ];
}

function createTimeMachine(task) {
  if (!task) return [];
  return (task.steps || []).map((step, index) => ({
    label: `${formatTime(step.time)} · ${step.action}`,
    snapshot: {
      missao: task.title,
      status: step.status,
      progresso: `${Math.min(100, Math.round(((index + 1) / Math.max(1, task.steps.length)) * 100))}%`,
      memoria: step.message,
      ferramenta: step.action,
      risco: task.riskLevel,
    },
  }));
}

function progressForStatus(status) {
  if (status === "completed") return 100;
  if (status === "failed" || status === "blocked") return 100;
  if (status === "pending") return 62;
  if (status === "running") return 34;
  return 0;
}

function totalTokens() {
  return state.tasks.reduce((sum, task) => sum + Number(task.tokenUsage?.total_tokens || 0), 0);
}

function averageMissionDuration() {
  const durations = state.tasks
    .map((task) => (task.completedAt || Date.now()) - (task.startedAt || task.createdAt || Date.now()))
    .filter((duration) => duration > 0);
  return durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
}

function averageLatency() {
  const latencies = state.tasks.map((task) => Number(task.latencyMs || 0)).filter(Boolean);
  return latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0;
}

function successRate() {
  if (!state.tasks.length) return 100;
  const successes = state.tasks.filter((task) => task.status === "completed").length;
  return Math.round((successes / state.tasks.length) * 100);
}

function buildDailyActivity() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - offset));
    const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(day).replace(".", "");
    const count = state.tasks.filter((task) => {
      const created = new Date(task.createdAt || 0);
      return created.toDateString() === day.toDateString();
    }).length;
    return { label, count };
  });
}

function buildHeatmap() {
  const toolCounts = {};
  state.agents.forEach((agent) => agent.tools.forEach((tool) => (toolCounts[tool] = (toolCounts[tool] || 0) + 1)));
  const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "nenhuma";
  const topAgent = [...state.agents].sort((a, b) => state.tasks.filter((task) => task.agentId === b.id).length - state.tasks.filter((task) => task.agentId === a.id).length)[0];
  const slowest = [...state.tasks].sort((a, b) => Number(b.latencyMs || 0) - Number(a.latencyMs || 0))[0];
  return [
    { label: "Agente mais usado", value: topAgent?.name || "sem dados", tone: "good" },
    { label: "Ferramenta mais usada", value: topTool, tone: "info" },
    { label: "Maior latência", value: slowest ? `${slowest.latencyMs || 0}ms` : "0ms", tone: "warn" },
    { label: "Mais falhas", value: state.tasks.filter((task) => ["failed", "blocked"].includes(task.status)).length, tone: "bad" },
    { label: "Maior custo", value: formatCurrency(Math.max(0, ...state.tasks.map((task) => Number(task.cost || 0)))), tone: "info" },
    { label: "Sucesso", value: `${successRate()}%`, tone: "good" },
  ];
}

function editAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const nextName = window.prompt("Nome do agente", agent.name);
  if (!nextName) return;
  const nextRole = window.prompt("Função do agente", agent.role);
  if (!nextRole) return;
  agent.name = nextName.trim();
  agent.role = nextRole.trim();
  agent.objective = nextRole.trim();
  logAction(agent.id, null, "editar_agente", "completed", `Agente ${agent.name} atualizado.`);
  saveState();
  render();
}

function duplicateAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  if (!Billing.canCreateAgent(state.agents.length)) {
    showUpgradeModal("agentLimit");
    return;
  }
  const copy = {
    ...structuredClone(agent),
    id: crypto.randomUUID(),
    name: `${agent.name} Copy`,
    status: "idle",
    trustScore: Math.max(60, Number(agent.trustScore || 82) - 3),
    createdAt: Date.now(),
  };
  state.agents.push(copy);
  logAction(copy.id, null, "duplicar_agente", "completed", `Agente ${copy.name} criado a partir de ${agent.name}.`);
  saveState();
  render();
  showToast("Agente duplicado.");
}

function deleteAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  if (!window.confirm(`Excluir ${agent.name}? As missões históricas continuam nos logs.`)) return;
  state.agents = state.agents.filter((item) => item.id !== agent.id);
  if (selectedInspectorAgentId === agent.id) selectedInspectorAgentId = null;
  logAction(null, null, "excluir_agente", "completed", `Agente ${agent.name} removido localmente.`);
  saveState();
  render();
  showToast("Agente excluído.");
}

function replayMission(taskId) {
  if (!Billing.canUseFeature("replay")) {
    showUpgradeModal("replay");
    return;
  }
  const task = getTask(taskId);
  if (!task?.agentId) return;
  trackFunnelEvent("replay_opened", { source: "mission", taskId });
  openAgentInspector(task.agentId);
  replayAgent(task.agentId);
}

function openTaskInvestigation(taskId) {
  const task = getTask(taskId);
  const agent = getAgent(task?.agentId);
  if (!task) return;
  elements.investigationContent.innerHTML = `
    ${investigationBlock("Missão", task.title)}
    ${investigationBlock("Agente", agent?.name || "Sistema")}
    ${investigationBlock("Prompt enviado", task.observability?.prompt || "sem prompt registrado")}
    ${investigationBlock("Resposta", task.observability?.response || task.summary || "sem resposta")}
    ${investigationBlock("Ferramentas", task.observability?.tools || task.suggestedActions || [])}
    ${investigationBlock("Modelo", task.modelUsed)}
    ${investigationBlock("Latência", `${task.latencyMs || 0}ms`)}
    ${investigationBlock("Tokens", task.tokenUsage || {})}
    ${investigationBlock("Resultado", task.status)}
  `;
  elements.investigationDialog.showModal();
}

function explainAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const profile = buildAgentProfile(agent);
  elements.investigationContent.innerHTML = `
    ${investigationBlock("AI Explains AI", `${agent.name} escolheu a próxima ação "${profile.nextAction}" porque esse é o menor passo auditável a partir do estado atual. O nível de risco é ${riskLabels[profile.riskLevel] || profile.riskLevel}; por isso ações sensíveis continuam bloqueadas até aprovação humana.`)}
    ${investigationBlock("Ferramenta escolhida", profile.tools[0]?.name || "nenhuma")}
    ${investigationBlock("Última decisão", profile.lastDecision)}
  `;
  elements.investigationDialog.showModal();
}

function explainInspectorEvent(agentId, eventIndex) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const event = buildAgentProfile(agent).events[eventIndex];
  if (!event) return;
  const reason = event.status === "pending"
    ? "Solicitei aprovação porque essa etapa pode afetar algo sensível e o Mission Control nunca deve continuar sem decisão humana."
    : event.status === "failed"
      ? "Parei a execução porque havia incerteza suficiente para preservar segurança, rastreabilidade e confiança."
      : event.title.includes("openrouter")
        ? "Chamei o modelo configurado porque a missão precisava de planejamento estruturado antes de qualquer execução."
        : "Registrei esta decisão porque ela muda o estado da missão e precisa ser reproduzível no futuro.";
  elements.investigationContent.innerHTML = `
    ${investigationBlock("✨ Explique esta decisão", reason)}
    ${investigationBlock("Decisão", humanizeAction(event.title))}
    ${investigationBlock("Mensagem", event.message || explainEvent(event))}
    ${investigationBlock("Estado", event.status)}
  `;
  elements.investigationDialog.showModal();
}

function proposeSpecialistAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const specialist = {
    id: crypto.randomUUID(),
    name: `${agent.role.split(" ")[0] || "Agent"} Expert`,
    role: `Especialista auxiliar para ${agent.role}`,
    description: "Agente proposto por outro agente e aprovado manualmente pelo usuário.",
    objective: `Ajudar ${agent.name} em missões complexas.`,
    model: agent.model,
    tools: agent.tools.filter((tool) => !SENSITIVE_ACTIONS.has(tool)).slice(0, 4),
    memory: createAgentMemory({ role: `Especialista auxiliar para ${agent.role}` }),
    dna: createAgentDna(agent),
    trustScore: 70,
    confidence: 72,
    createdAt: Date.now(),
    status: "pending",
  };
  if (!window.confirm(`${agent.name} propôs criar ${specialist.name}. Aprovar criação?`)) {
    logAction(agent.id, null, "criar_agente", "denied", `Usuário negou criação de ${specialist.name}.`);
    showToast("Criação de agente negada.");
    return;
  }
  specialist.status = "idle";
  state.agents.push(specialist);
  logAction(agent.id, null, "criar_agente", "approved", `${specialist.name} criado com aprovação humana.`);
  saveState();
  render();
  showToast("Agente especialista criado.");
}

function renderUniverse(pulse = false) {
  if (!elements.universe) return;
  const agents = state.agents.length ? state.agents : createSeedState().agents;
  const zoom = Number(state.settings.universeZoom || 100) / 100;
  const teams = uniqueList(agents.map((agent) => agent.role.split(" ")[0] || "Core")).slice(0, 4);
  elements.universe.innerHTML = `
    <div class="universe-legend">
      ${teams.map((team) => `<span>${escapeHtml(team)}</span>`).join("")}
    </div>
    <div class="universe-orbit ${pulse ? "pulse" : ""}" style="--universe-zoom:${zoom}">
      ${agents
        .map((agent, index) => {
          const angle = (index / Math.max(1, agents.length)) * Math.PI * 2;
          const x = Math.round(Math.cos(angle) * 34);
          const y = Math.round(Math.sin(angle) * 30);
          const team = agent.role.split(" ")[0] || "Core";
          return `
            <button class="agent-sphere ${agent.status}" style="--x:${x}%;--y:${y}%;--delay:${index * 120}ms" data-universe-agent="${agent.id}" data-team="${escapeHtml(team)}" type="button">
              <span>${escapeHtml(agent.name.slice(0, 2).toUpperCase())}</span>
              <strong>${escapeHtml(agent.name)}</strong>
              <em>${escapeHtml(statusLabels[agent.status] || agent.status)}</em>
            </button>
          `;
        })
        .join("")}
      ${buildUniverseLinks(agents)}
      ${buildUniverseMessages(agents)}
    </div>
  `;
  elements.universe.querySelectorAll("[data-universe-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentInspector(button.dataset.universeAgent));
    enableUniverseDrag(button);
  });
}

function buildUniverseLinks(agents) {
  return agents
    .slice(0, Math.max(0, agents.length - 1))
    .map((agent, index) => `<span class="universe-link status-${agent.status}" style="--link-index:${index}"></span>`)
    .join("");
}

function buildUniverseMessages(agents) {
  return agents
    .slice(0, Math.max(0, agents.length - 1))
    .map((agent, index) => `<span class="universe-message status-${agent.status}" style="--message-index:${index};--delay:${index * 240}ms">${escapeHtml(agent.name.split(" ")[0])}</span>`)
    .join("");
}

function enableUniverseDrag(button) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseLeft = 0;
  let baseTop = 0;

  button.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    const rect = button.getBoundingClientRect();
    const parent = elements.universe.getBoundingClientRect();
    baseLeft = rect.left - parent.left + rect.width / 2;
    baseTop = rect.top - parent.top + rect.height / 2;
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const nextLeft = baseLeft + event.clientX - startX;
    const nextTop = baseTop + event.clientY - startY;
    button.style.left = `${nextLeft}px`;
    button.style.top = `${nextTop}px`;
    button.style.setProperty("--x", "0px");
    button.style.setProperty("--y", "0px");
  });

  button.addEventListener("pointerup", () => {
    dragging = false;
  });
}

function renderMarketplace() {
  if (!elements.marketplaceGrid) return;
  const categories = uniqueList(MARKETPLACE_AGENTS.map((item) => item.category));
  elements.marketplaceGrid.parentElement.querySelector(".market-categories")?.remove();
  elements.marketplaceGrid.innerHTML = MARKETPLACE_AGENTS.map(
    (item) => {
      const planRequired = item.planRequired || "pro";
      return `
      <article class="market-agent ${planRequired !== "free" ? "premium-card" : ""}">
        <div class="market-agent-top">
          <div class="market-app-icon">${escapeHtml(item.name.slice(0, 2).toUpperCase())}</div>
          <div>
            <p class="section-label">${escapeHtml(item.category)} · v${escapeHtml(item.version)}</p>
            <h4>${escapeHtml(item.name)}</h4>
          </div>
        </div>
        <span class="plan-badge ${planRequired}">${planRequired === "free" ? "Free" : planRequired === "business" ? "Business" : "Pro"}</span>
        <div>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <div class="market-meta">
          <span>${escapeHtml(item.author)} · ${escapeHtml(item.company)}</span>
          <span>${item.downloads.toLocaleString("pt-BR")} downloads</span>
          <span>${item.rating} ★</span>
          <span>Atualizado ${formatShortDate(item.updatedAt)}</span>
          <span>${escapeHtml(item.compatibility)}</span>
        </div>
        <div class="market-screenshots">
          ${(item.screenshots || []).map((shot) => `<span>${escapeHtml(shot)}</span>`).join("")}
        </div>
        <div class="market-changelog">
          <strong>Changelog</strong>
          <ul>${(item.changelog || []).map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
        </div>
        <div class="tool-list">${item.tools.map((tool) => `<span class="tool-chip">${escapeHtml(tool)}</span>`).join("")}</div>
        <button class="primary-button" data-install-agent="${escapeHtml(item.name)}" title="Instala este agente na sua frota local." type="button">Instalar</button>
      </article>
    `;
    }
  ).join("");

  elements.marketplaceGrid.insertAdjacentHTML(
    "beforebegin",
    `<div class="market-categories">${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}</div>`
  );

  elements.marketplaceGrid.querySelectorAll("[data-install-agent]").forEach((button) => {
    button.addEventListener("click", () => installMarketplaceAgent(button.dataset.installAgent));
  });
}

function installMarketplaceAgent(name) {
  const item = MARKETPLACE_AGENTS.find((agent) => agent.name === name);
  if (!item) return;
  if ((item.planRequired || "pro") !== "free" && !Billing.canUseFeature("marketplace")) {
    showUpgradeModal("marketplace");
    return;
  }
  if (!Billing.canCreateAgent(state.agents.length)) {
    showUpgradeModal("agentLimit");
    return;
  }
  const agent = {
    id: crypto.randomUUID(),
    name: item.name,
    role: item.category,
    description: item.description,
    objective: item.description,
    model: state.openRouter.configuredModel || "openrouter/free",
    tools: item.tools,
    memory: createAgentMemory({ role: item.category }),
    dna: createAgentDna({ tools: item.tools }),
    trustScore: 76,
    confidence: 78,
    createdAt: Date.now(),
    status: "idle",
  };
  state.agents.push(agent);
  logAction(agent.id, null, "instalar_marketplace", "completed", `${item.name} instalado do Marketplace.`);
  saveState();
  render();
  showToast(`${item.name} instalado.`);
}

function renderBillingPanel() {
  if (!elements.billingPanel) return;
  const summary = Billing.missionUsageSummary(state.agents.length);
  const plan = summary.plan;
  const missionLimit = formatLimit(summary.missionLimit);
  const agentLimit = formatLimit(summary.agentLimit);
  const isBusinessOrAbove = ["business", "enterprise"].includes(plan.id);
  const planDescription =
    plan.id === "early_access"
      ? "Early Access gratuito, sem login, sem cartão e sem cobrança automática."
      : isBusinessOrAbove
        ? "Governança, auditoria e colaboração para equipes."
        : "Atualize para Business para colaboração, auditoria por membro e políticas de equipe.";
  elements.billingPanel.innerHTML = `
    <div class="billing-summary plan-${escapeHtml(plan.id)} ${isBusinessOrAbove || plan.id === "early_access" ? "business-highlight" : ""}">
      <div>
        <p class="section-label">Plano atual</p>
        <h3>${escapeHtml(plan.name)}</h3>
        <p>${escapeHtml(planDescription)}</p>
      </div>
      <div class="billing-meters">
        <div>
          <span>Uso mensal</span>
          <strong>${summary.missionUsageThisMonth}/${missionLimit}</strong>
        </div>
        <div>
          <span>Missões restantes</span>
          <strong>${summary.missionsRemaining === Infinity ? "∞" : summary.missionsRemaining}</strong>
        </div>
        <div>
          <span>Agentes usados</span>
          <strong>${state.agents.length}/${agentLimit}</strong>
        </div>
      </div>
      <button class="primary-button" data-billing-upgrade type="button">Gerenciar plano</button>
    </div>
  `;
  elements.billingPanel.querySelector("[data-billing-upgrade]")?.addEventListener("click", () => switchView("pricing"));
}

function renderSettingsBilling() {
  if (!elements.settingsBillingSummary) return;
  const summary = Billing.missionUsageSummary(state.agents.length);
  elements.settingsBillingSummary.innerHTML = `
    <div class="billing-meters settings-billing-meters">
      <div>
        <span>Plano atual</span>
        <strong>${escapeHtml(summary.plan.name)}</strong>
      </div>
      <div>
        <span>Status</span>
        <strong>${escapeHtml(summary.billingStatus)}</strong>
      </div>
      <div>
        <span>Uso mensal</span>
        <strong>${summary.missionUsageThisMonth}/${formatLimit(summary.missionLimit)}</strong>
      </div>
      <div>
        <span>Agentes</span>
        <strong>${state.agents.length}/${formatLimit(summary.agentLimit)}</strong>
      </div>
    </div>
    <div class="settings-billing-actions">
      <button class="primary-button" data-settings-plan type="button">Ver planos</button>
      <button class="ghost-button" data-settings-pro type="button">Assinar Pro</button>
    </div>
  `;
  elements.settingsBillingSummary.querySelector("[data-settings-plan]")?.addEventListener("click", () => switchView("pricing"));
  elements.settingsBillingSummary.querySelector("[data-settings-pro]")?.addEventListener("click", () => openCheckout("pro"));
}

function renderPricing() {
  if (!elements.pricingGrid) return;
  const current = Billing.getCurrentPlan();
  elements.pricingGrid.innerHTML = Object.values(Billing.PLANS)
    .map(
      (plan) => `
        <article class="pricing-card ${plan.id === current.id ? "current" : ""}">
          <div>
            <p class="section-label">${plan.id === current.id ? "Plano atual" : "Upgrade"}</p>
            <h4>${escapeHtml(plan.name)}</h4>
            <p>${escapeHtml(plan.description)}</p>
          </div>
          <div class="pricing-price">
            <strong>${escapeHtml(plan.price)}</strong>
            <span>${escapeHtml(plan.cadence)}</span>
          </div>
          <ul>${plan.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
          <button class="${plan.id === current.id ? "ghost-button" : "primary-button"}" data-checkout-plan="${plan.id}" type="button">
            ${plan.id === current.id ? "Plano ativo" : plan.id === "free" ? "Começar" : plan.id === "early_access" ? "Start Free" : plan.id === "enterprise" ? "Fale conosco" : plan.id === "pro" ? "Get Pro" : "Get Business"}
          </button>
        </article>
      `
    )
    .join("");

  elements.pricingGrid.querySelectorAll("[data-checkout-plan]").forEach((button) => {
    button.addEventListener("click", () => openCheckout(button.dataset.checkoutPlan));
  });
  renderPlanComparison();
}

function renderPlanComparison() {
  if (!elements.planComparisonTable) return;
  const plans = Object.values(Billing.PLANS);
  const rows = [
    ["Agentes", "3", "Ilimitados", "Ilimitados", "Ilimitados", "Ilimitados"],
    ["Missões/mês", "10", "10", "500", "2.500", "Ilimitadas"],
    ["Workspaces", "1", "1", "1", "Ilimitados", "Ilimitados"],
    ["Membros da equipe", "Não", "Não", "Não", "Sim", "Sim + SSO"],
    ["Replay", "Limitado", "Completo no piloto", "Completo", "Completo", "Completo"],
    ["Inspector avançado", "Básico", "Completo no piloto", "Sim", "Sim", "Sim"],
    ["Exportar PDF/Markdown", "Não", "Não", "Sim", "Sim", "Sim"],
    ["Marketplace premium", "Não", "Templates selecionados", "Sim", "Sim", "Sim"],
    ["Benchmark multi-modelo", "Não", "Não", "Sim", "Sim", "Sim"],
    ["Auditoria de equipe", "Logs básicos", "Logs locais", "Local", "Por membro", "Compliance"],
    ["Integrações", "Básicas", "Marketplace gratuito", "Pessoais", "Equipe", "Privadas/BYOK"],
  ];

  elements.planComparisonTable.innerHTML = `
    <div class="plan-row plan-head">
      <strong>Recurso</strong>
      ${plans.map((plan) => `<strong>${escapeHtml(plan.name)}</strong>`).join("")}
    </div>
    ${rows
      .map(
        (row) => `
          <div class="plan-row">
            ${row.map((cell, index) => `<span class="${index > 0 && /Sim|Ilimitad|2\.500|500|Compliance|Equipe|Privadas|SSO/.test(cell) ? "positive" : ""}">${escapeHtml(cell)}</span>`).join("")}
          </div>
        `
      )
      .join("")}
  `;
}

function renderTeams() {
  if (!elements.teamSummary || !elements.teamMembers) return;
  const team = state.team || migrateTeam(null);
  const workspace = getActiveWorkspace();
  const plan = Billing.getCurrentPlan();
  const canUseTeams = Billing.canUseFeature("teamWorkspaces");
  const members = workspace.members || [];
  const invites = workspace.invites || [];

  elements.teamSummary.innerHTML = `
    <div class="team-summary-grid">
      <div>
        <span>Workspace ativo</span>
        <strong>${escapeHtml(workspace.name)}</strong>
        <small>${escapeHtml(workspace.purpose)}</small>
      </div>
      <div>
        <span>Plano</span>
        <strong>${escapeHtml(plan.name)}</strong>
        <small>${canUseTeams ? "Teams liberado" : "Requer Business"}</small>
      </div>
      <div>
        <span>Membros</span>
        <strong>${members.length}</strong>
        <small>${invites.length} convite(s) pendente(s)</small>
      </div>
      <div>
        <span>Permissões</span>
        <strong>${canUseTeams ? "Ativas" : "Somente leitura"}</strong>
        <small>owner, admin, operator, viewer</small>
      </div>
    </div>
    ${
      canUseTeams
        ? ""
        : `<div class="team-paywall"><strong>Teams é recurso Business.</strong><span>Você pode visualizar a estrutura agora. Para criar workspaces e convidar membros, assine Business.</span></div>`
    }
  `;

  elements.teamMembers.innerHTML = `
    ${members.map(teamMemberCard).join("")}
    ${invites.map(teamInviteCard).join("")}
  `;

  elements.teamMembers.querySelectorAll("[data-member-role]").forEach((select) => {
    select.addEventListener("change", () => updateTeamMemberRole(select.dataset.memberRole, select.value));
  });
  elements.teamMembers.querySelectorAll("[data-remove-member]").forEach((button) => {
    button.addEventListener("click", () => removeTeamMember(button.dataset.removeMember));
  });
}

function getActiveWorkspace() {
  state.team = migrateTeam(state.team);
  return state.team.workspaces.find((workspace) => workspace.id === state.team.activeWorkspaceId) || state.team.workspaces[0];
}

function teamMemberCard(member) {
  return `
    <article class="team-member-card">
      <div>
        <strong>${escapeHtml(member.name)}</strong>
        <span>${escapeHtml(member.email)}</span>
      </div>
      <div class="team-role-control">
        <select data-member-role="${escapeHtml(member.id)}">
          ${["owner", "admin", "operator", "viewer"]
            .map((role) => `<option value="${role}" ${member.role === role ? "selected" : ""}>${teamRoleLabel(role)}</option>`)
            .join("")}
        </select>
        <button class="mini-button deny" data-remove-member="${escapeHtml(member.id)}" type="button">Remover</button>
      </div>
      <div class="team-permission-list">
        ${teamPermissions(member.role).map((permission) => `<em>${escapeHtml(permission)}</em>`).join("")}
      </div>
    </article>
  `;
}

function teamInviteCard(invite) {
  return `
    <article class="team-member-card invited">
      <div>
        <strong>${escapeHtml(invite.name)}</strong>
        <span>${escapeHtml(invite.email)} · convite pendente</span>
      </div>
      <div class="team-role-control">
        <span class="status pending">${teamRoleLabel(invite.role)}</span>
      </div>
      <div class="team-permission-list">
        <em>link simulado</em>
        <em>aguardando aceite</em>
      </div>
    </article>
  `;
}

function handleWorkspaceSubmit(event) {
  event.preventDefault();
  if (!Billing.canUseFeature("teamWorkspaces")) {
    showUpgradeModal("teamWorkspaces");
    return;
  }

  const form = event.currentTarget;
  const workspace = {
    id: crypto.randomUUID(),
    name: form.elements.name.value.trim(),
    purpose: form.elements.purpose.value.trim() || "Workspace colaborativo para agentes de IA.",
    createdAt: Date.now(),
    members: [...getActiveWorkspace().members],
    invites: [],
  };
  state.team.workspaces.push(workspace);
  state.team.activeWorkspaceId = workspace.id;
  logAction(null, null, "criar_workspace", "completed", `Workspace ${workspace.name} criado.`);
  form.reset();
  saveState();
  render();
  showToast("Workspace criado.");
}

function handleTeamMemberSubmit(event) {
  event.preventDefault();
  if (!Billing.canUseFeature("teamWorkspaces")) {
    showUpgradeModal("teamWorkspaces");
    return;
  }

  const form = event.currentTarget;
  const workspace = getActiveWorkspace();
  const email = form.elements.email.value.trim().toLowerCase();
  const invite = {
    id: crypto.randomUUID(),
    name: form.elements.name.value.trim(),
    email,
    role: form.elements.role.value,
    status: "invited",
    invitedAt: Date.now(),
    inviteUrl: `https://mission.lukintosh.com?invite=${crypto.randomUUID()}`,
  };

  workspace.invites.unshift(invite);
  logAction(null, null, "convidar_membro", "completed", `${invite.name} convidado como ${teamRoleLabel(invite.role)} em ${workspace.name}.`);
  form.reset();
  saveState();
  render();
  showToast("Convite de equipe gerado.");
}

function updateTeamMemberRole(memberId, role) {
  if (!Billing.canUseFeature("teamWorkspaces")) {
    showUpgradeModal("teamWorkspaces");
    renderTeams();
    return;
  }

  const workspace = getActiveWorkspace();
  const member = workspace.members.find((item) => item.id === memberId);
  if (!member) return;
  member.role = role;
  logAction(null, null, "alterar_papel_membro", "completed", `${member.name} agora é ${teamRoleLabel(role)}.`);
  saveState();
  render();
  showToast("Papel atualizado.");
}

function removeTeamMember(memberId) {
  if (!Billing.canUseFeature("teamWorkspaces")) {
    showUpgradeModal("teamWorkspaces");
    return;
  }

  const workspace = getActiveWorkspace();
  const member = workspace.members.find((item) => item.id === memberId);
  if (!member || member.role === "owner") {
    showToast("Owner principal não pode ser removido no workspace atual.");
    renderTeams();
    return;
  }

  workspace.members = workspace.members.filter((item) => item.id !== memberId);
  logAction(null, null, "remover_membro", "completed", `${member.name} removido do workspace ${workspace.name}.`);
  saveState();
  render();
  showToast("Membro removido.");
}

function teamRoleLabel(role) {
  const labels = {
    owner: "Owner",
    admin: "Admin",
    operator: "Operator",
    analyst: "Analyst",
    viewer: "Viewer",
  };
  return labels[role] || role;
}

function teamPermissions(role) {
  const map = {
    owner: ["billing", "workspaces", "membros", "aprovações", "logs"],
    admin: ["membros", "agentes", "missões", "aprovações"],
    operator: ["executar missões", "usar conectores", "registrar feedback"],
    analyst: ["relatórios", "custos", "latência", "logs", "exportações"],
    viewer: ["ver dashboard", "ver logs", "ver replay"],
  };
  return map[role] || map.viewer;
}

async function activateFreeEarlyAccess(source = "manual") {
  const anonymousUserId = getOrCreateAnonymousUserId();
  const startedAt = new Date().toISOString();
  const profile = {
    anonymousUserId,
    earlyAccessStartedAt: getEarlyAccessProfile()?.earlyAccessStartedAt || startedAt,
    currentPlan: "early_access",
    missionUsage: Billing.getBillingState().missionUsageThisMonth || 0,
    agentUsage: state.agents.length,
    onboardingCompleted: false,
  };

  saveEarlyAccessProfile(profile);
  Billing.activateEarlyAccess({ anonymousUserId });
  trackFunnelEvent("start_free_clicked", { source });

  try {
    await fetch("/api/early-access/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousUserId, source }),
    });
  } catch {
    // Local Early Access keeps working even when analytics API is unavailable.
  }

  prepareEarlyAccessFirstMission();
  render();
  switchView("tasks");
  showToast("Free Early Access ativado. Sua primeira missão está pronta para inspecionar e reproduzir.");
}

function renderEarlyAccess() {
  const profile = getEarlyAccessProfile();
  const plan = Billing.getCurrentPlan();
  const isActive = plan.id === "early_access" || Boolean(profile);

  if (elements.earlyAccessPlanLabel) {
    elements.earlyAccessPlanLabel.textContent = isActive ? "Active" : "Open";
  }
  if (elements.earlyAccessPlanDetail) {
    elements.earlyAccessPlanDetail.textContent = isActive
      ? "Early Access Member ativo neste navegador. Sem login, sem cartão e sem cobrança automática."
      : "Free Early Access can be activated instantly in this browser.";
  }

  if (elements.earlyAccessAnalytics) {
    const summary = funnelSummary || summarizeLocalFunnelEvents();
    elements.earlyAccessAnalytics.innerHTML = `
      <div class="early-access-plan-grid">
        ${funnelMetric("Visitors", summary.visitors)}
        ${funnelMetric("Free users", summary.freeUsers)}
        ${funnelMetric("First mission", summary.firstMissionCompleted)}
        ${funnelMetric("Checkouts", summary.checkoutStarted)}
        ${funnelMetric("Paid", summary.checkoutCompleted)}
        ${funnelMetric("Free → Pro", summary.freeToPro)}
        ${funnelMetric("Business", summary.business)}
      </div>
      <p class="checkout-note">Métricas locais e agregadas, sem armazenar dados desnecessários.</p>
    `;
  }
}

function prepareEarlyAccessFirstMission() {
  let agent = state.agents.find((item) => item.name === "Mission Starter");
  if (!agent) {
    agent = {
      id: crypto.randomUUID(),
      name: "Mission Starter",
      role: "Onboarding agent",
      description: "Ajuda novos usuários a entender Mission, Inspector e Replay rapidamente.",
      objective: "Levar o usuário ao primeiro resultado em menos de dois minutos.",
      model: "openrouter/free",
      tools: ["pesquisar_web", "gerar_relatorio"],
      memory: createAgentMemory({ role: "Onboarding agent" }),
      dna: { precision: 88, creativity: 72, speed: 92, autonomy: 68, reliability: 90, cost: 98 },
      trustScore: 92,
      confidence: 89,
      createdAt: Date.now(),
      status: "completed",
    };
    state.agents.unshift(agent);
    logAction(agent.id, null, "criar_agente", "completed", "Mission Starter criado para onboarding Early Access.");
    trackFunnelOnce("first_agent_created", { source: "early_access" });
  }

  const existing = state.tasks.find((task) => task.title === "First Mission: Understand Mission Control");
  if (existing) {
    selectedInspectorAgentId = agent.id;
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    agentId: agent.id,
    title: "First Mission: Understand Mission Control",
    objective: "Show how Mission runs agents, records decisions, exposes Inspector and replays execution.",
    priority: "high",
    progress: 100,
    status: "completed",
    cost: 0,
    riskLevel: "low",
    requiredApproval: false,
    summary: "Mission executed a guided onboarding run with full observability, human-control checkpoints and replayable events.",
    modelUsed: agent.model,
    latencyMs: 420,
    tokenUsage: { prompt_tokens: 320, completion_tokens: 420, total_tokens: 740 },
    observability: {
      prompt: [{ role: "system", content: "Guide a new Mission user safely." }],
      response: "Generated onboarding mission, Inspector context and Replay timeline.",
      tools: agent.tools,
      input: "Start Early Access",
      output: "First mission completed with audit trail.",
    },
    expected: createSimulationForecast({ title: "First Mission: Understand Mission Control", riskLevel: "low", agentTools: agent.tools }),
    communications: createMissionConversation({ title: "First Mission: Understand Mission Control" }),
    benchmark: createBenchmark({ modelUsed: agent.model, latencyMs: 420, riskLevel: "low" }),
    timeMachine: [],
    createdAt: Date.now(),
    startedAt: Date.now() - 9000,
    completedAt: Date.now(),
    suggestedActions: ["abrir_inspector", "reproduzir_execucao", "testar_template"],
  };
  task.steps = [
    makeStep("received_mission", "completed", "Received Early Access onboarding mission."),
    makeStep("planned_execution", "completed", "Planned a safe first run with no external actions."),
    makeStep("inspected_context", "completed", "Prepared Inspector data for prompt, tools, memory and model."),
    makeStep("generated_result", "completed", "Produced an executive summary and checklist."),
    makeStep("prepared_replay", "completed", "Saved timeline events so the execution can be replayed."),
  ];
  task.result = createMissionResult(task, {
    summary: task.summary,
    risk_level: "low",
    required_approval: false,
    suggested_actions: task.suggestedActions,
    steps: task.steps.map((step) => step.message),
  });
  task.timeMachine = createTimeMachine(task);
  state.tasks.unshift(task);
  rememberAgentLearning(agent, task, { risk_level: "low", summary: task.summary });
  logAction(agent.id, task.id, "early_access_first_mission", "completed", "Primeira missão Early Access concluída com Inspector e Replay.");
  trackFunnelOnce("first_mission_started", { source: "early_access" });
  trackFunnelOnce("first_mission_completed", { source: "early_access" });
  selectedInspectorAgentId = agent.id;
  saveState();
}

function getOrCreateAnonymousUserId() {
  const current = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (current) return current;
  const next = `anon_${crypto.randomUUID()}`;
  localStorage.setItem(ANONYMOUS_USER_KEY, next);
  return next;
}

function getEarlyAccessProfile() {
  try {
    return JSON.parse(localStorage.getItem(EARLY_ACCESS_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveEarlyAccessProfile(profile) {
  localStorage.setItem(EARLY_ACCESS_PROFILE_KEY, JSON.stringify(profile));
}

async function loadFunnelSummary() {
  try {
    const response = await fetch("/api/funnel/summary");
    const payload = await response.json();
    if (response.ok && payload.ok) {
      funnelSummary = payload.summary;
      renderEarlyAccess();
    }
  } catch {
    funnelSummary = summarizeLocalFunnelEvents();
  }
}

function trackFunnelOnce(eventName, metadata = {}) {
  const seen = JSON.parse(localStorage.getItem(FUNNEL_ONCE_KEY) || "{}");
  if (seen[eventName]) return;
  seen[eventName] = new Date().toISOString();
  localStorage.setItem(FUNNEL_ONCE_KEY, JSON.stringify(seen));
  trackFunnelEvent(eventName, metadata);
}

function trackFunnelEvent(eventName, metadata = {}) {
  const event = {
    id: crypto.randomUUID(),
    event: eventName,
    anonymousUserId: getOrCreateAnonymousUserId(),
    plan: Billing.getCurrentPlan().id,
    metadata,
    createdAt: new Date().toISOString(),
  };
  const events = loadLocalFunnelEvents();
  events.push(event);
  localStorage.setItem(FUNNEL_EVENTS_KEY, JSON.stringify(events.slice(-500)));

  fetch("/api/funnel/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
}

function loadLocalFunnelEvents() {
  try {
    return JSON.parse(localStorage.getItem(FUNNEL_EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function summarizeLocalFunnelEvents() {
  const events = loadLocalFunnelEvents();
  const count = (name) => events.filter((event) => event.event === name).length;
  return {
    visitors: count("early_access_page_view"),
    freeUsers: count("start_free_clicked"),
    firstMissionCompleted: count("first_mission_completed"),
    checkoutStarted: count("checkout_started"),
    checkoutCompleted: count("checkout_completed"),
    freeToPro: events.filter((event) => event.event === "checkout_completed" && event.metadata?.plan === "pro").length,
    business: events.filter((event) => event.event === "checkout_completed" && event.metadata?.plan === "business").length,
  };
}

function funnelMetric(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${Number(value || 0).toLocaleString("pt-BR")}</strong></div>`;
}

async function loadEnterpriseContext() {
  if (!elements.enterpriseRuntime) return;
  elements.enterpriseRuntime.innerHTML = `<div class="empty-state">Carregando contexto Enterprise...</div>`;
  try {
    const response = await fetch("/api/enterprise/context", {
      headers: {
        "x-org-id": enterpriseOrganizationId(),
        "x-user-email": enterpriseUserEmail(),
      },
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "Falha ao carregar Enterprise.");
    }
    enterpriseContext = payload;
    renderEnterpriseRuntime();
  } catch (error) {
    enterpriseContext = null;
    elements.enterpriseRuntime.innerHTML = `
      <div class="empty-state">
        <strong>Enterprise indisponível neste runtime.</strong>
        <span>${escapeHtml(error.message)} Configure o servidor ou Cloudflare Functions para ativar a camada Enterprise.</span>
      </div>
    `;
  }
}

function enterpriseOrganizationId() {
  return localStorage.getItem("lukintoshEnterpriseOrgId") || "org_lukintosh";
}

function enterpriseUserEmail() {
  return localStorage.getItem("lukintoshEnterpriseUserEmail") || "owner@lukintosh.com";
}

function renderEnterpriseRuntime() {
  if (!elements.enterpriseRuntime) return;
  if (!enterpriseContext) {
    elements.enterpriseRuntime.innerHTML = `<div class="empty-state">Contexto Enterprise ainda não carregado.</div>`;
    return;
  }

  const policies = enterpriseContext.governancePolicies || {};
  const settings = enterpriseContext.enterpriseSettings || {};
  const members = enterpriseContext.members || [];
  const apiKeys = enterpriseContext.apiKeys || [];
  const auditEvents = enterpriseContext.auditEvents || [];
  const integrations = enterpriseContext.integrations || [];
  const budget = enterpriseContext.budgets?.monthly || {};
  const usage = enterpriseContext.usage || {};

  elements.enterpriseRuntime.innerHTML = `
    <div class="enterprise-kpi-grid">
      <div>
        <span>Organização</span>
        <strong>${escapeHtml(enterpriseContext.name)}</strong>
        <small>${escapeHtml(enterpriseContext.plan)} · ${escapeHtml(enterpriseContext.slug)}</small>
      </div>
      <div>
        <span>Usuário atual</span>
        <strong>${escapeHtml(teamRoleLabel(enterpriseContext.currentUser?.role))}</strong>
        <small>${escapeHtml(enterpriseContext.currentUser?.email || "")}</small>
      </div>
      <div>
        <span>Budget mensal</span>
        <strong>${formatCurrency(Number(budget.limitUsd || policies.monthlyCostLimitUsd || 0))}</strong>
        <small>${budget.blockAtLimit ? "Bloqueia no limite" : "Somente alerta"}</small>
      </div>
      <div>
        <span>Uso atual</span>
        <strong>${formatCurrency(Number(usage.monthlyCostUsd || 0))}</strong>
        <small>${Number(usage.monthlyTokens || 0).toLocaleString("pt-BR")} tokens</small>
      </div>
    </div>

    <div class="enterprise-section-grid">
      <section>
        <span>RBAC real</span>
        <strong>${members.length} membros</strong>
        <ul>${members.map((member) => `<li>${escapeHtml(member.name)} · ${escapeHtml(teamRoleLabel(member.role))} · ${escapeHtml(member.status)}</li>`).join("")}</ul>
      </section>
      <section>
        <span>Políticas de agentes</span>
        <strong>${policies.requireHumanApproval ? "Aprovação humana exigida" : "Aprovação baseada em política"}</strong>
        <ul>
          <li>Modelos permitidos: ${escapeHtml((policies.allowedModels || []).join(", ") || "Nenhum")}</li>
          <li>Ferramentas bloqueadas: ${escapeHtml((policies.blockedTools || []).join(", ") || "Nenhuma")}</li>
          <li>Retenção: ${escapeHtml(String(policies.historyRetentionDays || 0))} dias</li>
        </ul>
      </section>
      <section>
        <span>SSO / SCIM</span>
        <strong>${escapeHtml(settings.sso?.status === "pilot" ? "Disponível em piloto" : settings.sso?.status || "Não configurado")}</strong>
        <ul>
          <li>SSO: ${escapeHtml(settings.sso?.provider || "not_configured")}</li>
          <li>SCIM: ${escapeHtml(settings.scim?.status || "pilot")} · ${escapeHtml(settings.scim?.basePath || "/api/scim/v2")}</li>
          <li>Fallback Owner: ${settings.sso?.ownerFallback ? "ativo" : "desativado"}</li>
        </ul>
      </section>
      <section>
        <span>Integrações corporativas</span>
        <strong>${integrations.filter((item) => item.status === "connected").length}/${integrations.length} conectadas</strong>
        <ul>${integrations.slice(0, 7).map((item) => `<li>${escapeHtml(item.name)} · ${escapeHtml(enterpriseIntegrationLabel(item.status))}</li>`).join("")}</ul>
      </section>
      <section>
        <span>API keys</span>
        <strong>${apiKeys.length} ativas</strong>
        <ul>${apiKeys.length ? apiKeys.map((key) => `<li>${escapeHtml(key.name)} · ${escapeHtml(key.prefix)}... · ${escapeHtml((key.scopes || []).join(", "))}</li>`).join("") : "<li>Nenhuma chave criada.</li>"}</ul>
      </section>
      <section>
        <span>Auditoria imutável</span>
        <strong>${auditEvents.length} eventos</strong>
        <ul>${auditEvents.length ? auditEvents.slice(0, 5).map((event) => `<li>${escapeHtml(formatDateTime(event.at))} · ${escapeHtml(event.action)} · ${escapeHtml(event.result)}</li>`).join("") : "<li>Nenhum evento ainda.</li>"}</ul>
      </section>
    </div>
  `;
}

function enterpriseIntegrationLabel(status) {
  const labels = {
    connected: "Conectada",
    configured: "Configurada",
    not_configured: "Não configurada",
    error: "Erro",
  };
  return labels[status] || "Disponível em piloto";
}

async function handleSalesLeadSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.consent = form.elements.consent.checked;
  try {
    const response = await fetch("/api/enterprise/sales-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "Não foi possível registrar interesse.");
    }
    logAction(null, null, "lead_enterprise", "completed", `${payload.company} registrou interesse Enterprise.`);
    form.reset();
    saveState();
    renderLogs();
    showToast(result.message || "Interesse Enterprise registrado.");
  } catch (error) {
    showToast(error.message);
  }
}

function renderGovernance() {
  if (!elements.governanceSummary || !elements.governanceReadiness) return;
  state.governance = migrateGovernance(state.governance);
  const plan = Billing.getCurrentPlan();
  const canUseBusiness = Billing.canUseFeature("businessGovernance");
  const canUseEnterprise = Billing.canUseFeature("enterpriseControls");
  const { business, enterprise } = state.governance;
  const readiness = governanceReadinessItems(canUseBusiness, canUseEnterprise);

  elements.governanceSummary.innerHTML = `
    <div class="governance-summary-grid">
      <div>
        <span>Plano</span>
        <strong>${escapeHtml(plan.name)}</strong>
        <small>${canUseEnterprise ? "Enterprise ativo" : canUseBusiness ? "Business ativo" : "Requer Business"}</small>
      </div>
      <div>
        <span>Budget mensal</span>
        <strong>${formatCurrency(business.monthlyBudget)}</strong>
        <small>${business.approvalPolicy}</small>
      </div>
      <div>
        <span>SSO</span>
        <strong>${enterprise.ssoProvider === "off" ? "Off" : escapeHtml(enterprise.ssoProvider)}</strong>
        <small>${enterprise.enforceSso ? "Obrigatório" : "Opcional"}</small>
      </div>
      <div>
        <span>Compliance</span>
        <strong>${enterprise.complianceMode ? "Ativo" : "Preparado"}</strong>
        <small>${escapeHtml(enterprise.dataRegion)}</small>
      </div>
    </div>
    <div class="governance-paywall ${canUseBusiness ? "enabled" : ""}">
      <strong>${canUseBusiness ? "Governança Business liberada." : "Governança exige Business."}</strong>
      <span>${canUseEnterprise ? "Controles Enterprise liberados." : "SSO, BYOK, deployment privado e compliance completo exigem Enterprise."}</span>
    </div>
  `;

  fillGovernanceForms();

  elements.governanceReadiness.innerHTML = readiness
    .map(
      (item) => `
        <div class="readiness-item ${item.done ? "done" : ""}">
          <span>${item.done ? "✓" : "•"}</span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.detail)}</small>
          </div>
        </div>
      `
    )
    .join("");
}

function fillGovernanceForms() {
  const businessForm = document.querySelector("#business-governance-form");
  const enterpriseForm = document.querySelector("#enterprise-controls-form");
  if (businessForm) {
    const data = state.governance.business;
    businessForm.elements.monthlyBudget.value = data.monthlyBudget;
    businessForm.elements.auditRetentionDays.value = data.auditRetentionDays;
    businessForm.elements.approvalPolicy.value = data.approvalPolicy;
    businessForm.elements.incidentChannel.value = data.incidentChannel;
    businessForm.elements.requireReview.checked = data.requireReview;
    businessForm.elements.teamConnectors.checked = data.teamConnectors;
  }
  if (enterpriseForm) {
    const data = state.governance.enterprise;
    enterpriseForm.elements.ssoProvider.value = data.ssoProvider;
    enterpriseForm.elements.allowedDomain.value = data.allowedDomain;
    enterpriseForm.elements.byokAlias.value = data.byokAlias;
    enterpriseForm.elements.dataRegion.value = data.dataRegion;
    enterpriseForm.elements.privateDeployment.value = data.privateDeployment;
    enterpriseForm.elements.slaTier.value = data.slaTier;
    enterpriseForm.elements.enforceSso.checked = data.enforceSso;
    enterpriseForm.elements.complianceMode.checked = data.complianceMode;
  }
}

function handleBusinessGovernanceSubmit(event) {
  event.preventDefault();
  if (!Billing.canUseFeature("businessGovernance")) {
    showUpgradeModal("businessGovernance");
    return;
  }
  const form = event.currentTarget;
  state.governance.business = {
    monthlyBudget: Number(form.elements.monthlyBudget.value || 0),
    auditRetentionDays: Number(form.elements.auditRetentionDays.value || 90),
    approvalPolicy: form.elements.approvalPolicy.value,
    incidentChannel: form.elements.incidentChannel.value.trim(),
    requireReview: form.elements.requireReview.checked,
    teamConnectors: form.elements.teamConnectors.checked,
  };
  state.governance.updatedAt = new Date().toISOString();
  logAction(null, null, "salvar_governanca_business", "completed", "Políticas Business atualizadas.");
  saveState();
  render();
  showToast("Governança Business salva.");
}

function handleEnterpriseControlsSubmit(event) {
  event.preventDefault();
  if (!Billing.canUseFeature("enterpriseControls")) {
    showUpgradeModal("enterpriseControls");
    return;
  }
  const form = event.currentTarget;
  state.governance.enterprise = {
    ssoProvider: form.elements.ssoProvider.value,
    allowedDomain: form.elements.allowedDomain.value.trim(),
    byokAlias: form.elements.byokAlias.value.trim(),
    dataRegion: form.elements.dataRegion.value,
    privateDeployment: form.elements.privateDeployment.value,
    slaTier: form.elements.slaTier.value,
    enforceSso: form.elements.enforceSso.checked,
    complianceMode: form.elements.complianceMode.checked,
  };
  state.governance.updatedAt = new Date().toISOString();
  logAction(null, null, "salvar_controles_enterprise", "completed", "Controles Enterprise atualizados.");
  saveState();
  render();
  showToast("Controles Enterprise salvos.");
}

function governanceReadinessItems(canUseBusiness, canUseEnterprise) {
  const business = state.governance.business;
  const enterprise = state.governance.enterprise;
  return [
    { done: canUseBusiness, title: "Business ativo", detail: "Libera workspaces, membros, políticas e auditoria por papel." },
    { done: Number(business.monthlyBudget) > 0, title: "Limite de custo", detail: `${formatCurrency(business.monthlyBudget)} por mês.` },
    { done: business.requireReview, title: "Revisão crítica", detail: "Missões críticas exigem revisão humana." },
    { done: canUseEnterprise && enterprise.ssoProvider !== "off", title: "SSO configurável", detail: enterprise.ssoProvider === "off" ? "Selecione um provedor Enterprise." : enterprise.ssoProvider },
    { done: canUseEnterprise && Boolean(enterprise.byokAlias), title: "BYOK", detail: enterprise.byokAlias || "Informe alias KMS/secret." },
    { done: canUseEnterprise && enterprise.complianceMode, title: "Compliance", detail: `Região ${enterprise.dataRegion}, suporte ${enterprise.slaTier} sob contrato.` },
    { done: true, title: "Exportação de auditoria", detail: "Relatório local disponível para revisão." },
  ];
}

function exportGovernanceAudit() {
  const payload = {
    exportedAt: new Date().toISOString(),
    plan: Billing.getCurrentPlan().name,
    team: state.team,
    governance: state.governance,
    recentAuditLogs: state.logs.slice(-100),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lukintosh-governance-audit.json";
  link.click();
  URL.revokeObjectURL(url);
  logAction(null, null, "exportar_auditoria_governanca", "completed", "Auditoria Business/Enterprise exportada.");
  saveState();
  renderLogs();
  showToast("Auditoria exportada.");
}

function showUpgradeModal(feature = "premium") {
  trackFunnelEvent("upgrade_modal_opened", { feature });
  const featureLabels = {
    agentLimit: "limite de agentes do plano Free",
    missionLimit: "limite mensal de missões",
    exportPdf: "exportação PDF",
    exportMarkdown: "exportação Markdown",
    advancedInspector: "Inspector avançado",
    replay: "Replay completo",
    marketplace: "Marketplace premium",
    premiumTemplate: "templates premium",
    benchmark: "benchmark multi-modelo",
    teamWorkspaces: "workspaces e membros de equipe",
    businessGovernance: "governança Business",
    enterpriseControls: "SSO, BYOK, compliance e deployment Enterprise",
  };
  elements.upgradeContent.innerHTML = `
    <div class="paywall-hero">
      <span class="plan-badge pro">Pro</span>
      <h4>Desbloqueie o poder completo do Mission Control</h4>
      <p>Atualize para Pro para usar Replay avançado, Inspector completo, exportação, Marketplace e agentes ilimitados.</p>
    </div>
    <div class="paywall-reason">
      <strong>Recurso solicitado</strong>
      <span>${escapeHtml(featureLabels[feature] || "recurso premium")}</span>
    </div>
    <div class="paywall-actions">
      <button class="primary-button" data-paywall-plans type="button">Ver planos</button>
      <button class="ghost-button" data-paywall-free type="button">Continuar no Free</button>
    </div>
  `;
  elements.upgradeDialog.showModal();
  elements.upgradeContent.querySelector("[data-paywall-plans]")?.addEventListener("click", () => {
    elements.upgradeDialog.close();
    switchView("pricing");
  });
  elements.upgradeContent.querySelector("[data-paywall-free]")?.addEventListener("click", () => elements.upgradeDialog.close());
}

async function openCheckout(planId) {
  const plan = Billing.PLANS[planId] || Billing.PLANS.pro;
  if (["pro", "business"].includes(plan.id)) {
    trackFunnelEvent("checkout_started", { plan: plan.id });
  }
  if (plan.id === Billing.getCurrentPlan().id) {
    showToast("Este plano já está ativo.");
    return;
  }

  if (plan.id === "free") {
    Billing.setPlan("free");
    render();
    showToast("Plano Free ativado.");
    return;
  }

  if (plan.id === "early_access") {
    activateFreeEarlyAccess("pricing_card");
    return;
  }

  if (plan.id === "enterprise") {
    elements.checkoutContent.innerHTML = `
      <div class="checkout-plan">
        <span class="plan-badge enterprise">${escapeHtml(plan.name)}</span>
        <h4>Enterprise</h4>
        <p>${escapeHtml(plan.description)}</p>
        <div class="pricing-price">
          <strong>${escapeHtml(plan.price)}</strong>
          <span>${escapeHtml(plan.cadence)}</span>
        </div>
      </div>
      <p class="checkout-note">Enterprise exige validação comercial, domínio, políticas, SSO/SCIM em piloto, BYOK e implantação dedicada sob contrato. Este botão não desbloqueia recursos sem verificação do servidor.</p>
      <div class="paywall-actions">
        <button class="primary-button" data-enterprise-contact type="button">Falar com Lukintosh</button>
        <button class="ghost-button" data-enterprise-demo type="button">Ver camada Enterprise</button>
      </div>
    `;
    elements.checkoutDialog.showModal();
    elements.checkoutContent.querySelector("[data-enterprise-contact]")?.addEventListener("click", () => {
      elements.checkoutDialog.close();
      switchView("pricing");
      const salesPanel = document.querySelector("#enterprise-sales-panel");
      salesPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      salesPanel?.querySelector("input[name='name']")?.focus({ preventScroll: true });
      showToast("Preencha o formulário Enterprise para falar com vendas.");
    });
    elements.checkoutContent.querySelector("[data-enterprise-demo]")?.addEventListener("click", () => {
      elements.checkoutDialog.close();
      switchView("governance");
      loadEnterpriseContext();
      showToast("Camada Enterprise exibida em modo piloto.");
    });
    return;
  }

  elements.checkoutContent.innerHTML = `
    <div class="checkout-plan">
      <span class="plan-badge ${plan.id}">${escapeHtml(plan.name)}</span>
      <h4>${escapeHtml(plan.name)}</h4>
      <p>${escapeHtml(plan.description)}</p>
      <div class="pricing-price">
        <strong>${escapeHtml(plan.price)}</strong>
        <span>${escapeHtml(plan.cadence)}</span>
      </div>
    </div>
    <p class="checkout-note">Você será enviado para o Stripe Checkout. Nenhum dado de cartão passa pelo Mission Control.</p>
    <div class="paywall-actions">
      <button class="primary-button" data-stripe-checkout="${plan.id}" type="button">Ir para checkout seguro</button>
      <button class="ghost-button" data-close-checkout-inline type="button">Cancelar</button>
    </div>
  `;
  elements.checkoutDialog.showModal();
  elements.checkoutContent.querySelector("[data-stripe-checkout]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Abrindo Stripe...";

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          origin: window.location.origin,
          workspaceId: "local-workspace",
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      if (payload.fallback) {
        renderCheckoutFallback(plan, payload.details || payload.error);
        return;
      }

      throw new Error(payload.details || payload.error || "Não foi possível abrir o Stripe Checkout.");
    } catch (error) {
      renderCheckoutFallback(plan, error.message);
    }
  });
  elements.checkoutContent.querySelector("[data-close-checkout-inline]")?.addEventListener("click", () => elements.checkoutDialog.close());
}

function renderCheckoutFallback(plan, message) {
  elements.checkoutContent.innerHTML = `
    <div class="checkout-plan">
      <span class="plan-badge ${plan.id}">${escapeHtml(plan.name)}</span>
      <h4>Stripe precisa ser configurado</h4>
      <p>${escapeHtml(message || "Configure as variáveis de ambiente do Stripe para ativar checkout real.")}</p>
    </div>
    <p class="checkout-note">Use este fallback somente em desenvolvimento. Em produção, configure STRIPE_SECRET_KEY e o Price ID do plano no servidor.</p>
    <div class="paywall-actions">
      <button class="primary-button" data-dev-checkout="${plan.id}" type="button">Ativar fallback de desenvolvimento</button>
      <button class="ghost-button" data-close-checkout-inline type="button">Cancelar</button>
    </div>
  `;
  elements.checkoutContent.querySelector("[data-dev-checkout]")?.addEventListener("click", () => {
    Billing.simulateCheckout(plan.id);
    elements.checkoutDialog.close();
    render();
    showToast(`Plano ${plan.name} ativado localmente.`);
  });
  elements.checkoutContent.querySelector("[data-close-checkout-inline]")?.addEventListener("click", () => elements.checkoutDialog.close());
}

async function handleCheckoutReturn() {
  const url = new URL(window.location.href);
  const checkout = url.searchParams.get("checkout");
  const plan = url.searchParams.get("plan");
  const sessionId = url.searchParams.get("session_id");

  if (!checkout) return;

  url.searchParams.delete("checkout");
  url.searchParams.delete("plan");
  url.searchParams.delete("session_id");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

  if (checkout === "cancelled") {
    showToast("Checkout cancelado. Seu plano não mudou.");
    return;
  }

  if (checkout !== "success" || !sessionId) return;

  try {
    const response = await fetch(`/api/billing/session?session_id=${encodeURIComponent(sessionId)}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.active) {
      throw new Error(payload.details || payload.error || "Checkout ainda não confirmado pelo Stripe.");
    }

    Billing.activateStripeSubscription({
      planId: payload.plan || plan || "pro",
      customerId: payload.customer,
      subscriptionId: payload.subscription,
      sessionId,
    });
    trackFunnelEvent("checkout_completed", { plan: payload.plan || plan || "pro", provider: "stripe" });
    render();
    showPlanUnlockedModal(Billing.getCurrentPlan());
    showToast(`Plano ${Billing.getCurrentPlan().name} ativado. Novidades desbloqueadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível confirmar o checkout.");
  }
}

function showPlanUnlockedModal(plan) {
  const unlocked = {
    pro: ["Agentes ilimitados", "Replay completo", "Inspector avançado", "Exportação PDF/Markdown", "Marketplace premium"],
    business: ["Tudo do Pro", "Workspaces de equipe", "Auditoria avançada", "Mais missões mensais", "Governança de integrações"],
    enterprise: ["Tudo do Business", "SSO em piloto", "SCIM em piloto", "BYOK", "Auditoria avançada"],
  };
  const features = unlocked[plan.id] || unlocked.pro;

  elements.checkoutContent.innerHTML = `
    <div class="checkout-plan">
      <span class="plan-badge ${plan.id}">${escapeHtml(plan.name)}</span>
      <h4>Welcome to Mission ${escapeHtml(plan.name)}</h4>
      <p>Pagamento confirmado pelo Stripe. Seu Mission Control já está operando no plano ${escapeHtml(plan.name)}. Um link de acesso por e-mail pode ser enviado pelo fluxo de magic link quando habilitado no servidor.</p>
    </div>
    <ul class="checkout-unlocked-list">
      ${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
    </ul>
    <div class="paywall-actions">
      <button class="primary-button" data-unlocked-start type="button">Open Mission Control</button>
      <button class="ghost-button" data-unlocked-first type="button">Run your first mission</button>
      <button class="ghost-button" data-unlocked-plans type="button">Ver plano ativo</button>
    </div>
  `;
  elements.checkoutDialog.showModal();
  elements.checkoutContent.querySelector("[data-unlocked-start]")?.addEventListener("click", () => {
    elements.checkoutDialog.close();
    switchView("dashboard");
  });
  elements.checkoutContent.querySelector("[data-unlocked-first]")?.addEventListener("click", () => {
    elements.checkoutDialog.close();
    prepareEarlyAccessFirstMission();
    render();
    switchView("tasks");
  });
  elements.checkoutContent.querySelector("[data-unlocked-plans]")?.addEventListener("click", () => {
    elements.checkoutDialog.close();
    switchView("pricing");
  });
}

function formatLimit(value) {
  return value === Infinity ? "∞" : Number(value || 0).toLocaleString("pt-BR");
}

async function copyMissionResult(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const markdown = missionResultMarkdown(task);
  try {
    await navigator.clipboard.writeText(markdown);
    showToast("Resultado copiado.");
  } catch {
    downloadText(`${safeFileName(task.title)}-resultado.md`, markdown, "text/markdown");
    showToast("Clipboard indisponível. Markdown baixado.");
  }
}

function exportMissionMarkdown(taskId) {
  if (!Billing.canUseFeature("exportMarkdown")) {
    showUpgradeModal("exportMarkdown");
    return;
  }
  const task = getTask(taskId);
  if (!task) return;
  downloadText(`${safeFileName(task.title)}-resultado.md`, missionResultMarkdown(task), "text/markdown");
  logAction(task.agentId, task.id, "exportar_markdown", "completed", "Resultado da missão exportado em Markdown.");
  saveState();
  renderLogs();
}

function exportMissionPdf(taskId) {
  if (!Billing.canUseFeature("exportPdf")) {
    showUpgradeModal("exportPdf");
    return;
  }
  const task = getTask(taskId);
  if (!task) return;
  const markdown = missionResultMarkdown(task);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showToast("Pop-up bloqueado. Use Exportar Markdown.");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(task.title)} · Resultado</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; padding: 32px; line-height: 1.55; }
          pre { white-space: pre-wrap; background: #f3f4f6; border: 1px solid #d1d5db; padding: 16px; border-radius: 8px; }
        </style>
      </head>
      <body><pre>${escapeHtml(markdown)}</pre><script>window.print();</script></body>
    </html>
  `);
  printWindow.document.close();
  logAction(task.agentId, task.id, "exportar_pdf", "completed", "Resultado da missão aberto para impressão em PDF.");
  saveState();
  renderLogs();
}

async function shareMissionResult(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const text = missionResultMarkdown(task);
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Resultado da missão: ${task.title}`,
        text,
      });
      logAction(task.agentId, task.id, "compartilhar_resultado", "completed", "Resultado da missão compartilhado.");
      saveState();
      renderLogs();
      return;
    } catch {
      // Fall through to copy/download fallback.
    }
  }
  await copyMissionResult(taskId);
}

function rerunMission(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const form = document.querySelector("#task-form");
  if (!form) return;
  switchView("tasks");
  if (task.agentId && getAgent(task.agentId)) form.elements.agentId.value = task.agentId;
  form.elements.title.value = task.title;
  form.elements.objective.value = task.objective || task.title;
  form.elements.priority.value = task.priority || "normal";
  form.elements.scenario.value = task.riskLevel === "high" ? "mixed" : task.riskLevel === "medium" ? "email" : "safe";
  showToast("Missão preparada para executar novamente.");
}

function saveMissionAsTemplate(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const template = {
    name: task.title,
    description: task.objective || task.summary || "Template criado a partir de uma missão executada.",
    category: "Personalizado",
    averageTime: formatDuration((task.completedAt || Date.now()) - (task.startedAt || task.createdAt || Date.now())),
    risk: task.riskLevel || "medium",
    model: task.modelUsed || "openrouter/free",
    objective: task.objective || task.title,
  };
  const savedTemplates = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:templates`) || "[]");
  savedTemplates.unshift(template);
  localStorage.setItem(`${STORAGE_KEY}:templates`, JSON.stringify(savedTemplates.slice(0, 24)));
  logAction(task.agentId, task.id, "salvar_template", "completed", `Template "${task.title}" salvo.`);
  renderTemplates();
  renderLogs();
  showToast("Template salvo.");
}

function renderTemplates() {
  if (!elements.templateGrid) return;
  const savedTemplates = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:templates`) || "[]");
  const templates = [...savedTemplates, ...MISSION_TEMPLATES];
  elements.templateGrid.innerHTML = templates
    .map(
      (template, index) => {
        const plan = templatePlan(template);
        return `
        <button class="template-card ${plan !== "free" ? "premium-card" : ""}" data-template-index="${index}" title="Preenche a missão com este template." type="button">
          <span>${escapeHtml(template.category)} · ${escapeHtml(template.averageTime)} · risco ${escapeHtml(riskLabels[template.risk] || template.risk)}</span>
          <strong>${escapeHtml(template.name)}</strong>
          <em>${escapeHtml(template.description)}</em>
          <small>${escapeHtml(template.model)} · dificuldade ${escapeHtml(templateDifficulty(template))}</small>
          <i class="plan-badge ${plan}">${plan === "free" ? "Free" : "Pro"}</i>
          <div class="template-tools">${templateToolsFor(template).map((tool) => `<b>${escapeHtml(tool)}</b>`).join("")}</div>
        </button>
      `;
      }
    )
    .join("");

  elements.templateGrid.querySelectorAll("[data-template-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const template = templates[Number(button.dataset.templateIndex)];
      if (templatePlan(template) !== "free" && !Billing.canUseFeature("premiumTemplate")) {
        showUpgradeModal("premiumTemplate");
        return;
      }
      applyMissionTemplate(template);
    });
  });
}

function templatePlan(template) {
  if (template.category === "Personalizado") return "free";
  return FREE_TEMPLATE_NAMES.has(template.name) ? "free" : "pro";
}

function templateDifficulty(template) {
  if (template.risk === "high") return "avançada";
  if (template.risk === "medium") return "intermediária";
  return "leve";
}

function templateToolsFor(template) {
  if (template.tools?.length) return template.tools;
  const categoryTools = {
    Pesquisa: ["pesquisar_web", "gerar_relatorio"],
    Programação: ["ler_arquivo", "editar_documento"],
    DevOps: ["usar_terminal", "usar_git"],
    Marketing: ["pesquisar_web", "gerar_relatorio"],
    Conteúdo: ["gerar_relatorio"],
    Financeiro: ["consultar_api", "gerar_relatorio"],
    Vendas: ["gerar_relatorio", "enviar_email"],
    Suporte: ["gerar_relatorio", "enviar_email"],
  };
  return categoryTools[template.category] || ["gerar_relatorio"];
}

function renderConnectors() {
  if (!elements.connectorGrid) return;
  const runtimeById = new Map((state.connectorRuntime?.connectors || []).map((connector) => [connector.id, connector]));
  elements.connectorGrid.innerHTML = CONNECTORS.map((connector) => {
    const runtime = runtimeById.get(connector.id);
    const currentStatus = runtime?.state || connector.status;
    const isConnected = currentStatus === "connected";
    const isConfigured = runtime?.configured || isConnected;
    const isMissing = currentStatus === "missing_config";
    const statusLabel = connectorStatusLabel(currentStatus, isConfigured);
    const envList = [...(runtime?.requiredEnv || []), ...(runtime?.optionalEnv || [])];
    return `
      <article class="connector-card ${escapeHtml(currentStatus)} ${isConnected ? "connected" : ""}">
        <div class="connector-logo ${connector.logo}" aria-hidden="true">${connectorLogo(connector.logo)}</div>
        <div class="connector-body">
          <div>
            <span>${escapeHtml(connector.category)}</span>
            <strong>${escapeHtml(connector.name)}</strong>
          </div>
          <p>${escapeHtml(runtime?.message || connector.description)}</p>
          <div class="connector-permissions">
            ${connector.permissions.map((permission) => `<em>${escapeHtml(permission)}</em>`).join("")}
          </div>
          ${
            envList.length
              ? `<div class="connector-env">${envList.map((envName) => `<code>${escapeHtml(envName)}</code>`).join("")}</div>`
              : ""
          }
          ${connectorPreviewMarkup(runtime)}
        </div>
        <div class="connector-footer">
          <span class="connector-status">${statusLabel}</span>
          <div class="connector-actions">
            <button class="mini-button" data-connector-id="${connector.id}" type="button">${isMissing ? "Ver config" : "Testar"}</button>
            <button class="mini-button" data-connector-preview="${connector.id}" type="button" ${isMissing ? "disabled" : ""}>Prévia</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  elements.connectorGrid.querySelectorAll("[data-connector-id]").forEach((button) => {
    button.addEventListener("click", () => testConnector(button.dataset.connectorId));
  });
  elements.connectorGrid.querySelectorAll("[data-connector-preview]").forEach((button) => {
    button.addEventListener("click", () => previewConnector(button.dataset.connectorPreview));
  });
}

async function loadConnectors() {
  try {
    const response = await fetch("/api/connectors");
    const payload = await response.json();
    state.connectorRuntime = {
      connectors: Array.isArray(payload.connectors) ? payload.connectors : [],
      runtime: payload.runtime || "unknown",
      lastLoadedAt: Date.now(),
    };
    saveState();
    renderConnectors();
  } catch (error) {
    state.connectorRuntime = {
      connectors: [],
      runtime: "offline",
      lastLoadedAt: Date.now(),
      error: error.message,
    };
  }
}

async function testConnector(connectorId) {
  const connector = CONNECTORS.find((item) => item.id === connectorId);
  try {
    const response = await fetch("/api/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: connectorId }),
    });
    const result = await response.json().catch(() => ({}));
    upsertConnectorRuntime(result.id || connectorId, result);
    logAction(
      null,
      null,
      `testar_conector_${connectorId}`,
      result.ok ? "completed" : "failed",
      result.message || `${connector?.name || connectorId} testado.`
    );
    saveState();
    renderConnectors();
    renderLogs();
    showToast(result.message || (response.ok ? "Conector testado." : "Conector precisa de configuração."));
  } catch (error) {
    upsertConnectorRuntime(connectorId, {
      id: connectorId,
      state: "error",
      configured: false,
      message: error.message,
    });
    logAction(null, null, `testar_conector_${connectorId}`, "failed", error.message);
    saveState();
    renderConnectors();
    renderLogs();
    showToast("Falha ao testar conector.");
  }
}

async function previewConnector(connectorId) {
  const connector = CONNECTORS.find((item) => item.id === connectorId);
  upsertConnectorRuntime(connectorId, {
    id: connectorId,
    state: "configured",
    message: `Buscando prévia real de ${connector?.name || connectorId}...`,
  });
  renderConnectors();

  try {
    const response = await fetch("/api/connectors/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: connectorId, action: "preview" }),
    });
    const result = await response.json().catch(() => ({}));
    upsertConnectorRuntime(result.id || connectorId, result);
    logAction(
      null,
      null,
      `preview_conector_${connectorId}`,
      result.ok ? "completed" : "failed",
      result.message || `${connector?.name || connectorId} consultado.`
    );
    saveState();
    renderConnectors();
    renderLogs();
    showToast(result.message || (response.ok ? "Prévia carregada." : "Prévia indisponível."));
  } catch (error) {
    upsertConnectorRuntime(connectorId, {
      id: connectorId,
      state: "error",
      configured: true,
      message: error.message,
    });
    logAction(null, null, `preview_conector_${connectorId}`, "failed", error.message);
    saveState();
    renderConnectors();
    renderLogs();
    showToast("Falha ao carregar prévia.");
  }
}

function connectorPreviewMarkup(runtime) {
  const items = Array.isArray(runtime?.preview) ? runtime.preview.slice(0, 5) : [];
  if (!items.length) return "";

  return `
    <div class="connector-preview">
      ${items
        .map((item) => {
          const content = `
            <strong>${escapeHtml(item.title || "Item")}</strong>
            <span>${escapeHtml(item.detail || "")}</span>
          `;
          return item.url
            ? `<a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">${content}</a>`
            : `<div>${content}</div>`;
        })
        .join("")}
    </div>
  `;
}

function upsertConnectorRuntime(connectorId, result) {
  state.connectorRuntime = state.connectorRuntime || { connectors: [] };
  const connectors = state.connectorRuntime.connectors || [];
  const index = connectors.findIndex((item) => item.id === connectorId);
  if (index >= 0) {
    connectors[index] = { ...connectors[index], ...result };
  } else {
    connectors.push(result);
  }
  state.connectorRuntime.connectors = connectors;
  state.connectorRuntime.lastLoadedAt = Date.now();
}

function connectorStatusLabel(status, configured) {
  if (status === "connected") return "conectado";
  if (status === "error") return "erro";
  if (status === "configured" || configured) return "configurado";
  if (status === "missing_config") return "faltando config";
  return "planejado";
}

function switchSettingsPane(panelId) {
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTab === panelId);
  });
  document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.settingsPanel === panelId);
  });
}

function connectorLogo(type) {
  const logos = {
    github: `<svg viewBox="0 0 24 24" aria-label="GitHub"><path fill="#181717" d="M12 2.2a9.8 9.8 0 0 0-3.1 19.1c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.6 4.9.4.3.7.9.7 1.9v2.6c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.2Z"/></svg>`,
    gmail: `<svg viewBox="0 0 24 24" aria-label="Gmail"><path fill="#fff" d="M4.5 6h15v12h-15z"/><path fill="#EA4335" d="M5.8 18H4.5A1.5 1.5 0 0 1 3 16.5V7.4l2.8 2.1V18Zm14.2 0h-1.3V9.5l2.8-2.1v9.1A1.5 1.5 0 0 1 20 18Z"/><path fill="#FBBC04" d="M4.5 6h1.3l6.2 4.7L18.2 6h1.3v3.5L12 15.1 4.5 9.5V6Z"/><path fill="#34A853" d="M5.8 18V9.5l6.2 4.7 6.2-4.7V18H5.8Z" opacity=".12"/><path fill="#4285F4" d="M18.2 18V9.5l2.8-2.1V18h-2.8Z"/></svg>`,
    slack: `<svg viewBox="0 0 24 24" aria-label="Slack"><path fill="#36C5F0" d="M8.2 3a2.1 2.1 0 0 1 2.1 2.1v5.2H8.2A2.1 2.1 0 0 1 6.1 8.2V5.1A2.1 2.1 0 0 1 8.2 3Z"/><path fill="#2EB67D" d="M21 8.2a2.1 2.1 0 0 1-2.1 2.1h-5.2V8.2a2.1 2.1 0 0 1 2.1-2.1h3.1A2.1 2.1 0 0 1 21 8.2Z"/><path fill="#ECB22E" d="M15.8 21a2.1 2.1 0 0 1-2.1-2.1v-5.2h2.1a2.1 2.1 0 0 1 2.1 2.1v3.1a2.1 2.1 0 0 1-2.1 2.1Z"/><path fill="#E01E5A" d="M3 15.8a2.1 2.1 0 0 1 2.1-2.1h5.2v2.1a2.1 2.1 0 0 1-2.1 2.1H5.1A2.1 2.1 0 0 1 3 15.8Z"/><path fill="#36C5F0" d="M3 8.2a2.1 2.1 0 0 1 4.2 0v2.1H5.1A2.1 2.1 0 0 1 3 8.2Z"/><path fill="#2EB67D" d="M15.8 3a2.1 2.1 0 0 1 2.1 2.1v2.1h-2.1a2.1 2.1 0 0 1 0-4.2Z"/><path fill="#ECB22E" d="M21 15.8a2.1 2.1 0 0 1-4.2 0v-2.1h2.1a2.1 2.1 0 0 1 2.1 2.1Z"/><path fill="#E01E5A" d="M8.2 21a2.1 2.1 0 0 1-2.1-2.1v-2.1h2.1a2.1 2.1 0 0 1 0 4.2Z"/></svg>`,
    drive: `<svg viewBox="0 0 24 24" aria-label="Google Drive"><path fill="#1A73E8" d="M14.2 4 21 15.8 18.7 20 12 8.2 14.2 4Z"/><path fill="#34A853" d="M9.8 4h4.4L7.5 15.8H3.1L9.8 4Z"/><path fill="#FBBC04" d="M3.1 15.8h13.5l2.1 4.2H5.5l-2.4-4.2Z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" aria-label="Google Calendar"><path fill="#fff" d="M5 5h14v14H5z"/><path fill="#1A73E8" d="M7 2h2v3H7V2Zm8 0h2v3h-2V2ZM5 6h14v3H5V6Z"/><path fill="#34A853" d="M5 9h3v10H5V9Z"/><path fill="#FBBC04" d="M8 9h11v3H8V9Z"/><path fill="#EA4335" d="M16 12h3v7h-3v-7Z"/><path fill="#1A73E8" d="M10.6 17.4h3.8v-1.1h-2.1l.9-.8c.7-.6 1.1-1.1 1.1-1.9 0-1-.8-1.7-1.9-1.7-1 0-1.7.5-2 1.3l1 .5c.2-.5.5-.7 1-.7.5 0 .8.3.8.7 0 .4-.2.7-.8 1.2l-1.8 1.6v.9Z"/></svg>`,
    sheets: `<svg viewBox="0 0 24 24" aria-label="Google Sheets"><path fill="#0F9D58" d="M6 2h8l4 4v16H6V2Z"/><path fill="#87CEAC" d="M14 2v4h4l-4-4Z"/><path fill="#fff" d="M8 10h8v7H8v-7Zm1.2 1.2v1.5h2.1v-1.5H9.2Zm3.2 0v1.5h2.4v-1.5h-2.4Zm-3.2 2.6v1.9h2.1v-1.9H9.2Zm3.2 0v1.9h2.4v-1.9h-2.4Z"/></svg>`,
    notion: `<svg viewBox="0 0 24 24" aria-label="Notion"><path fill="#fff" stroke="#111" stroke-width="1.4" d="M4.8 4.8 16.4 4 20 6.7v12.1l-11.8.7L4 16.8V6.1l.8-1.3Z"/><path fill="#111" d="m8.5 7.6 1.6-.1 5.2 7.1V7.2l1.5-.1v9.7l-1.5.1-5.3-7.2v7.5l-1.5.1V7.6Z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" aria-label="Discord"><path fill="#5865F2" d="M7.1 5.2A15 15 0 0 1 10 4.3l.4.8a13 13 0 0 1 3.2 0l.4-.8a15 15 0 0 1 2.9.9c1.8 2.7 2.3 5.3 2.1 7.9a14.7 14.7 0 0 1-3.6 1.8l-.8-1.3c.4-.1.8-.3 1.1-.5-.1-.1-.2-.1-.3-.2a9.6 9.6 0 0 1-6.8 0l-.3.2c.4.2.7.4 1.1.5l-.8 1.3A14.7 14.7 0 0 1 5 13.1c-.2-3 .5-5.5 2.1-7.9Zm2.7 6.7c.6 0 1.1-.6 1.1-1.3s-.5-1.3-1.1-1.3-1.1.6-1.1 1.3.5 1.3 1.1 1.3Zm4.4 0c.6 0 1.1-.6 1.1-1.3s-.5-1.3-1.1-1.3-1.1.6-1.1 1.3.5 1.3 1.1 1.3Z"/></svg>`,
    linear: `<svg viewBox="0 0 24 24" aria-label="Linear"><path fill="#5E6AD2" d="M4 11.7a8 8 0 0 1 7.7-7.7L4 11.7Zm.5 3.1L14.8 4.5c.7.3 1.4.7 2 1.2L5.7 16.8a8 8 0 0 1-1.2-2Zm3 3.5L18.3 7.5c.5.6.9 1.3 1.2 2L9.5 19.5a8 8 0 0 1-2-1.2Zm5.1 1.7L20 12.6A8 8 0 0 1 12.6 20Z"/></svg>`,
    trello: `<svg viewBox="0 0 24 24" aria-label="Trello"><path fill="#0079BF" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path fill="#fff" d="M7 6h4v10H7V6Zm6 0h4v7h-4V6Z"/></svg>`,
    hubspot: `<svg viewBox="0 0 24 24" aria-label="HubSpot"><path fill="#FF7A59" d="M17.2 8.1V5.9a1.7 1.7 0 1 0-1.2 0v2.2a5 5 0 0 0-2.4 1.1L8.1 5a1.9 1.9 0 1 0-.9 1.1l5.4 4.2a5.1 5.1 0 0 0-.4 2.1 5 5 0 1 0 5-4.3Zm0 7.6a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm-8.7-2.2a2 2 0 1 0 0 1.4l3 .9a6.3 6.3 0 0 1-.3-1.5l-2.7-.8Z"/></svg>`,
    api: `<svg viewBox="0 0 24 24"><path d="M8.2 8 4 12l4.2 4 .9-1.2L6.2 12l2.9-2.8L8.2 8Zm7.6 0-.9 1.2 2.9 2.8-2.9 2.8.9 1.2L20 12l-4.2-4ZM10 17l2.7-10h1.4l-2.7 10H10Z"/></svg>`,
    folder: `<svg viewBox="0 0 24 24"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4l2 2H19a2 2 0 0 1 2 2v1H3V6.5Zm0 4h18l-1.7 7.1A3 3 0 0 1 16.4 20H6.2a3 3 0 0 1-2.9-2.4L3 10.5Z"/></svg>`,
    sql: `<svg viewBox="0 0 24 24"><path d="M12 3c4.4 0 8 1.4 8 3.2v11.6c0 1.8-3.6 3.2-8 3.2s-8-1.4-8-3.2V6.2C4 4.4 7.6 3 12 3Zm0 2C8.3 5 6 5.8 6 6.2s2.3 1.2 6 1.2 6-.8 6-1.2S15.7 5 12 5Zm6 4.2c-1.4.8-3.5 1.2-6 1.2s-4.6-.4-6-1.2v2.5c0 .4 2.3 1.2 6 1.2s6-.8 6-1.2V9.2Zm0 5.4c-1.4.8-3.5 1.2-6 1.2s-4.6-.4-6-1.2v3.2c0 .4 2.3 1.2 6 1.2s6-.8 6-1.2v-3.2Z"/></svg>`,
    mcp: `<svg viewBox="0 0 24 24"><path d="M12 4a3 3 0 0 1 2.8 2h2.7A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-2.7a3 3 0 0 1-5.6 0H6.5A2.5 2.5 0 0 1 4 15.5v-7A2.5 2.5 0 0 1 6.5 6h2.7A3 3 0 0 1 12 4Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-5.5 2a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h2.7a3 3 0 0 1 5.6 0h2.7a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-2.7a3 3 0 0 1-5.6 0H6.5Zm5.5 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>`,
  };
  return logos[type] || logos.api;
}

function applyMissionTemplate(template) {
  const form = document.querySelector("#task-form");
  if (!template || !form) return;
  form.elements.title.value = template.name;
  form.elements.objective.value = template.objective || template.description;
  form.elements.priority.value = template.risk === "high" ? "crítica" : template.risk === "medium" ? "alta" : "normal";
  form.elements.scenario.value = template.risk === "high" ? "mixed" : template.risk === "medium" ? "email" : "safe";
  showToast(`Template "${template.name}" aplicado.`);
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFileName(value) {
  return String(value || "missao").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function renderLogs() {
  const filters = {
    agent: document.querySelector("#log-filter-agent")?.value.trim().toLowerCase() || "",
    task: document.querySelector("#log-filter-task")?.value.trim().toLowerCase() || "",
    tool: document.querySelector("#log-filter-tool")?.value.trim().toLowerCase() || "",
    status: document.querySelector("#log-filter-status")?.value || "",
  };
  const filteredLogs = state.logs.filter((log) => {
    const agentOk = !filters.agent || String(log.agentName).toLowerCase().includes(filters.agent);
    const taskOk = !filters.task || String(log.taskTitle).toLowerCase().includes(filters.task);
    const toolOk = !filters.tool || `${log.action} ${log.message}`.toLowerCase().includes(filters.tool);
    const statusOk = !filters.status || log.status === filters.status;
    return agentOk && taskOk && toolOk && statusOk;
  });
  const logs = state.settings.autoScrollLogs ? [...filteredLogs].reverse() : filteredLogs;
  elements.logsTable.innerHTML = logs.length
    ? logs
        .map(
          (log) => `
          <tr>
            <td>${formatDateTime(log.time)}</td>
            <td>${escapeHtml(log.agentName)}</td>
            <td>${escapeHtml(log.taskTitle)}</td>
            <td>${escapeHtml(log.action)}</td>
            <td>${statusBadge(log.status)}</td>
            <td>${escapeHtml(log.message)}</td>
          </tr>
        `
        )
        .join("")
    : `<tr><td colspan="6">Nenhuma ação registrada.</td></tr>`;
}

function renderSettings() {
  const form = document.querySelector("#settings-form");
  if (!form) return;
  form.elements.costPerStep.value = state.settings.costPerStep;
  form.elements.stepDelay.value = state.settings.stepDelay;
  form.elements.autoScrollLogs.checked = state.settings.autoScrollLogs;
  form.elements.primaryProvider.value = state.settings.primaryProvider;
  form.elements.favoriteModels.value = state.settings.favoriteModels;
  form.elements.dailyCostLimit.value = state.settings.dailyCostLimit;
  form.elements.autoApproval.checked = state.settings.autoApproval;
  form.elements.strictMode.checked = state.settings.strictMode;
  form.elements.persistentMemory.checked = state.settings.persistentMemory;
  form.elements.memoryRetentionDays.value = state.settings.memoryRetentionDays;
  form.elements.webhookUrl.value = state.settings.webhookUrl;
  const zoom = document.querySelector("#universe-zoom");
  if (zoom) zoom.value = state.settings.universeZoom;
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  state.settings.costPerStep = Number(form.elements.costPerStep.value);
  state.settings.stepDelay = Number(form.elements.stepDelay.value);
  state.settings.autoScrollLogs = form.elements.autoScrollLogs.checked;
  state.settings.primaryProvider = form.elements.primaryProvider.value;
  state.settings.favoriteModels = form.elements.favoriteModels.value.trim();
  state.settings.dailyCostLimit = Number(form.elements.dailyCostLimit.value);
  state.settings.autoApproval = form.elements.autoApproval.checked;
  state.settings.strictMode = form.elements.strictMode.checked;
  state.settings.persistentMemory = form.elements.persistentMemory.checked;
  state.settings.memoryRetentionDays = Number(form.elements.memoryRetentionDays.value);
  state.settings.webhookUrl = form.elements.webhookUrl.value.trim();
  saveState();
  render();
  showToast("Configurações salvas.");
}

async function loadOpenRouterModels() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`);
    const payload = await response.json();
    state.openRouter.configuredModel = payload.configured_model || "openrouter/free";
    state.openRouter.models = Array.isArray(payload.models)
      ? payload.models.filter((model) => model.id).slice(0, 150)
      : [];
    saveState();
    renderAgents();
  } catch {
    state.openRouter.configuredModel = state.openRouter.configuredModel || "openrouter/free";
  }
}

async function loadSystemStatus() {
  if (!elements.systemStatusTitle || !elements.systemStatusDetail) return;
  try {
    const response = await fetch("/api/health");
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error("Health check indisponível.");
    elements.systemStatusTitle.textContent = "Mission Cloud conectado";
    elements.systemStatusDetail.textContent = payload.configured ? "Todos os serviços disponíveis" : "IA pendente de chave no servidor";
  } catch {
    elements.systemStatusTitle.textContent = "Serviços em verificação";
    elements.systemStatusDetail.textContent = "Backend não confirmado";
  }
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  const label = document.querySelector(`.nav-item[data-view="${viewId}"]`)?.dataset.label || "Dashboard";
  const subtitles = {
    "mission-os": "Coordene objetivos persistentes entre humanos, agentes, software e máquinas.",
    dashboard: "Execute, acompanhe e governe agentes de IA em um único centro de comando.",
    "early-access": "Comece sem login, rode a primeira missão e faça upgrade quando fizer sentido.",
    agents: "Configure agentes com modelos, ferramentas e permissões claras.",
    tasks: "Planeje, execute e audite missões com aprovação humana.",
    logs: "Investigue ações, custos, latência e decisões em uma trilha única.",
    universe: "Observe colaboração e estados dos agentes em tempo real.",
    marketplace: "Instale agentes e templates para acelerar operações.",
    pricing: "Compare recursos por plano e escolha o nível de governança.",
    teams: "Gerencie workspaces, membros e papéis de colaboração.",
    governance: "Controle políticas Business e prontidão Enterprise em um só lugar.",
    settings: "Conecte serviços, ajuste modelos e configure operações.",
  };
  elements.viewTitle.textContent = label;
  if (elements.viewSubtitle) {
    elements.viewSubtitle.textContent = subtitles[viewId] || "";
  }
  if (viewId === "early-access") trackFunnelEvent("early_access_page_view");
  if (viewId === "pricing") trackFunnelEvent("pricing_viewed");
}

function pendingSteps() {
  return state.tasks.flatMap((task) =>
    task.steps.filter((step) => step.status === "pending").map((step) => ({ task, step }))
  );
}

function logAction(agentId, taskId, action, status, message) {
  const agent = getAgent(agentId);
  const task = getTask(taskId);
  state.logs.push({
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    agentName: agent?.name || "Sistema",
    taskTitle: task?.title || "-",
    action,
    status,
    message,
  });
}

function totalCost() {
  return state.tasks.reduce((sum, task) => sum + Number(task.cost || 0), 0);
}

function statusBadge(status) {
  const label = statusLabels[status] || status;
  return `<span class="status ${status}">${label}</span>`;
}

function getAgent(id) {
  return state.agents.find((agent) => agent.id === id);
}

function getTask(id) {
  return state.tasks.find((task) => task.id === id);
}

function clearData() {
  selectedInspectorAgentId = null;
  expandedInspectorEvents = new Set();
  replayCursor = -1;
  stopReplay();
  state = {
    agents: [],
    tasks: [],
    logs: [],
    openRouter: { configuredModel: "openrouter/free", models: [] },
    connectorRuntime: { connectors: [], lastLoadedAt: null },
    team: createDefaultTeam(),
    governance: createDefaultGovernance(),
    settings: { ...defaultSettings },
  };
  saveState();
  render();
  loadOpenRouterModels();
  showToast("Dados locais removidos.");
}

function restoreDemo() {
  selectedInspectorAgentId = null;
  expandedInspectorEvents = new Set();
  replayCursor = -1;
  stopReplay();
  state = createSeedState();
  state.tasks[0].agentId = state.agents[0].id;
  state.tasks[0].timeMachine = createTimeMachine(state.tasks[0]);
  state.tasks[0].communications = createMissionConversation(state.tasks[0], { summary: state.tasks[0].summary });
  state.tasks[0].benchmark = createBenchmark(state.tasks[0]);
  logAction(state.agents[0].id, state.tasks[0].id, "preparar_experiencia", "completed", "Experiência guiada preparada.");
  saveState();
  render();
  loadOpenRouterModels();
  showToast("Experiência guiada preparada.");
}

function renderDay913Panel() {
  if (!elements.day913Checklist) return;
  const feedback = loadDay913Feedback();
  const hasExternalTester = feedback.length > 0;
  const checklist = [
    { label: "Produto escolhido: Mission Control", done: true },
    { label: "Experiência de 2 minutos pronta", done: state.tasks.some((task) => task.status === "completed") },
    { label: "Convite pronto para 10 pessoas", done: true },
    { label: "Feedback externo registrado", done: hasExternalTester },
  ];

  elements.day913Checklist.innerHTML = `
    ${checklist
      .map(
        (item) => `
          <div class="day913-check ${item.done ? "done" : ""}">
            <span>${item.done ? "✓" : "•"}</span>
            <strong>${escapeHtml(item.label)}</strong>
          </div>
        `
      )
      .join("")}
    <div class="day913-proof">
      <span>Feedbacks registrados</span>
      <strong>${feedback.length}</strong>
    </div>
  `;
}

function prepareDay913Demo() {
  restoreDemo();
  switchView("tasks");
  showToast("Experiência Dia 913 pronta: abra Resultado Final, Inspector e Replay.");
}

async function copyDay913Invite() {
  const message = day913InviteMessage();
  try {
    await navigator.clipboard.writeText(message);
    showToast("Convite Dia 913 copiado.");
  } catch {
    showToast("Não foi possível copiar. Use o plano em docs/day-913-outreach.md.");
  }
}

function handleDay913Feedback(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = String(form.elements.feedback.value || "").trim();
  const tester = String(form.elements.tester.value || "").trim() || "Tester externo";
  if (!feedback) return;

  const entries = loadDay913Feedback();
  entries.unshift({
    id: crypto.randomUUID(),
    tester,
    feedback,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(DAY_913_STORAGE_KEY, JSON.stringify(entries.slice(0, 25)));
  logAction(null, null, "dia_913_feedback", "completed", `${tester}: ${feedback}`);
  form.reset();
  saveState();
  render();
  renderLogs();
  showToast("Feedback Dia 913 registrado.");
}

function loadDay913Feedback() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DAY_913_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function day913InviteMessage() {
  return `Hoje é o Dia 913 da Lukintosh e estou buscando 1 pessoa de fora para testar de verdade.

Produto: Lukintosh Mission Control.
Ideia: um painel para observar, depurar e controlar agentes de IA com logs, replay, inspector, custos, aprovações e integrações.

Teste leva 2 minutos:
1. Abrir https://mission.lukintosh.com
2. Clicar em "Preparar experiência guiada" ou "Preparar demo de 2 min"
3. Ver uma missão pronta, abrir o Inspector/Replay e me dizer o que ficou claro ou confuso.

Você topa ser um dos 10 testers beta do Dia 913?`;
}

function exportLogs() {
  const blob = new Blob([JSON.stringify(state.logs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lukintosh-mission-control-logs.json";
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
  }).format(value || 0);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  const url = String(value || "");
  if (!/^https?:\/\//i.test(url)) return "#";
  return escapeHtml(url);
}
