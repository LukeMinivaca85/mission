const STORAGE_KEY = "lukintoshMissionControlState";
const API_BASE_URL = "https://mission-qnfa.onrender.com";
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

const MARKETPLACE_AGENTS = [
  {
    name: "React Expert",
    author: "Lukintosh",
    category: "Desenvolvimento",
    version: "1.0.0",
    downloads: 12840,
    rating: 4.9,
    description: "Especialista em interfaces, revisão de componentes e padrões de front-end.",
    tools: ["ler_arquivo", "escrever_arquivo", "editar_documento", "usar_git"],
  },
  {
    name: "Security Reviewer",
    author: "Lukintosh",
    category: "Segurança",
    version: "1.1.0",
    downloads: 9420,
    rating: 4.8,
    description: "Audita permissões, riscos, segredos e ações sensíveis antes da execução.",
    tools: ["ler_arquivo", "pesquisar_web", "acessar_api"],
  },
  {
    name: "Cost Sentinel",
    author: "Lukintosh",
    category: "FinOps",
    version: "0.9.4",
    downloads: 6180,
    rating: 4.7,
    description: "Compara modelos, estima custo e recomenda rotas de execução econômicas.",
    tools: ["acessar_api", "gerar_relatorio"],
  },
  {
    name: "Memory Curator",
    author: "Lukintosh",
    category: "Memória",
    version: "1.0.2",
    downloads: 7215,
    rating: 4.9,
    description: "Resume histórico, fixa aprendizados e limpa contexto obsoleto.",
    tools: ["ler_arquivo", "editar_documento"],
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
};

let state = loadState();
let selectedInspectorAgentId = null;
let expandedInspectorEvents = new Set();
let replayTimer = null;
let replayCursor = -1;

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
  investigationDialog: document.querySelector("#investigation-dialog"),
  investigationContent: document.querySelector("#investigation-content"),
  viewTitle: document.querySelector("#view-title"),
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
document.querySelector("#clear-data-button").addEventListener("click", clearData);
document.querySelector("#seed-demo-button").addEventListener("click", restoreDemo);
document.querySelector("#export-logs-button").addEventListener("click", exportLogs);
document.querySelector("#close-investigation-button").addEventListener("click", () => elements.investigationDialog.close());
document.querySelector("#pulse-universe-button")?.addEventListener("click", () => {
  renderUniverse(true);
  showToast("Pulso enviado ao Agent Universe.");
});
document.querySelectorAll("#log-filter-agent, #log-filter-task, #log-filter-tool, #log-filter-status").forEach((field) => {
  field.addEventListener("input", renderLogs);
  field.addEventListener("change", renderLogs);
});

render();
loadOpenRouterModels();

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
    latencyMs: task.latencyMs || 0,
    tokenUsage: task.tokenUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    observability: task.observability || null,
    events: task.events || task.steps || [],
    ...task,
  }));
  nextState.openRouter = nextState.openRouter || { configuredModel: "openrouter/free", models: [] };
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
        summary: "Demo local concluída. Crie uma nova missão para chamar IA real via OpenRouter.",
        modelUsed: "demo-local",
        latencyMs: 64,
        tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        observability: {
          prompt: [],
          response: "Execução demo local.",
          tools: ["ler_contexto"],
          input: "Auditar missões locais",
          output: "Demo local concluída.",
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
  saveState();
  form.reset();
  render();
  showToast("Agente criado.");
}

async function handleTaskSubmit(event) {
  event.preventDefault();
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
    createdAt: Date.now(),
    startedAt: Date.now(),
    completedAt: null,
    steps: [makeStep("chamar_openrouter", "running", "Solicitando plano seguro ao OpenRouter.")],
    suggestedActions: [],
  };

  state.tasks.unshift(task);
  agent.status = "running";
  logAction(agent.id, task.id, "criar_missao", "running", `Missão "${task.title}" enviada para IA real.`);
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
  saveState();
}

function renderMetrics() {
  const metrics = [
    ["Total de agentes", state.agents.length, "Frota cadastrada"],
    ["Em execução", state.agents.filter((agent) => agent.status === "running").length, "Agentes trabalhando"],
    ["Com falha", state.agents.filter((agent) => agent.status === "failed").length, "Precisam atenção"],
    ["Custo estimado total", formatCurrency(totalCost()), "Prioridade: modelos grátis"],
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
          <p class="meta-line">${escapeHtml(agent?.name || "Agente demo")} · ${escapeHtml(task.priority || "normal")} · ${escapeHtml(task.modelUsed || "openrouter/free")} · ${formatCurrency(task.cost)} · ${duration}</p>
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
      ${
        pending
          ? `<div class="approval-actions">
              <button class="mini-button" data-approve="true" data-task-id="${task.id}" data-step-id="${pending.id}" type="button">Aprovar</button>
              <button class="mini-button deny" data-deny="true" data-task-id="${task.id}" data-step-id="${pending.id}" type="button">Negar</button>
            </div>`
          : ""
      }
      <div class="task-actions">
        <button class="mini-button" data-open-agent="${agent?.id || ""}" type="button">Inspector</button>
        <button class="mini-button" data-replay-task="${task.id}" type="button">Replay</button>
        <button class="mini-button" data-investigate-task="${task.id}" type="button">Investigar</button>
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
                <button class="mini-button" data-approve="true" data-task-id="${task.id}" data-step-id="${step.id}" type="button">Aprovar</button>
                <button class="mini-button deny" data-deny="true" data-task-id="${task.id}" data-step-id="${step.id}" type="button">Negar</button>
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
          <button class="ghost-button" data-explain-agent type="button">✨ Explique</button>
          <button class="ghost-button" data-propose-agent type="button">Criar especialista</button>
          <button class="ghost-button" data-open-investigation type="button">Investigar</button>
          <button class="primary-button" data-replay-agent type="button">▶ Reproduzir execução</button>
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

      <div class="inspector-layout">
        <section class="panel trust-panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Trust Score</p>
              <h3>Confiabilidade operacional</h3>
            </div>
            <strong class="trust-score">${profile.trustScore}</strong>
          </div>
          <div class="stars" aria-label="${profile.trustScore} pontos de confiança">${"★".repeat(Math.max(1, Math.round(profile.trustScore / 20)))}${"☆".repeat(5 - Math.max(1, Math.round(profile.trustScore / 20)))}</div>
          <p class="meta-line">Sobe quando conclui missões, evita erros e pede aprovação. Cai quando falha, bloqueia ou usa permissões sensíveis sem clareza.</p>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="section-label">Agent DNA</p>
              <h3>Perfil evolutivo</h3>
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
            <button class="danger-button" data-clear-memory type="button">Apagar memória</button>
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

  elements.inspector.querySelector("[data-save-memory]")?.addEventListener("click", saveInspectorMemory);
  elements.inspector.querySelector("[data-clear-memory]")?.addEventListener("click", clearInspectorMemory);
  elements.inspector.querySelector("[data-open-investigation]")?.addEventListener("click", () => openInvestigation(agent.id));
  elements.inspector.querySelector("[data-replay-agent]")?.addEventListener("click", () => replayAgent(agent.id));
  elements.inspector.querySelector("[data-explain-agent]")?.addEventListener("click", () => explainAgent(agent.id));
  elements.inspector.querySelector("[data-propose-agent]")?.addEventListener("click", () => proposeSpecialistAgent(agent.id));
  elements.inspector.querySelector("[data-time-machine]")?.addEventListener("input", (event) => {
    replayCursor = Number(event.target.value);
    expandedInspectorEvents = new Set([replayCursor]);
    renderInspector();
  });
}

function openAgentInspector(agentId) {
  selectedInspectorAgentId = agentId;
  expandedInspectorEvents = new Set();
  replayCursor = -1;
  stopReplay();
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
        tarefa: task.title,
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
      tarefa: log.taskTitle,
      origem: "log localStorage",
    },
  }));

  return [...taskEvents, ...logEvents]
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .slice(-80);
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
          ? `<pre class="event-detail">${escapeHtml(JSON.stringify(event.detail, null, 2))}</pre>`
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
  return `
    <label class="memory-editor">
      ${title}
      <textarea data-memory-key="${key}" rows="5">${escapeHtml((items || []).join("\n"))}</textarea>
    </label>
  `;
}

function saveInspectorMemory() {
  const agent = getAgent(selectedInspectorAgentId);
  if (!agent) return;
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

function replayAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const events = buildAgentProfile(agent).events;
  if (!events.length) {
    showToast("Nenhum evento para reproduzir.");
    return;
  }

  stopReplay();
  replayCursor = 0;
  expandedInspectorEvents = new Set([0]);
  renderInspector();
  replayTimer = window.setInterval(() => {
    replayCursor += 1;
    if (replayCursor >= events.length) {
      stopReplay();
      showToast("Replay finalizado.");
      renderInspector();
      return;
    }
    expandedInspectorEvents = new Set([replayCursor]);
    renderInspector();
  }, 850);
}

function stopReplay() {
  if (replayTimer) window.clearInterval(replayTimer);
  replayTimer = null;
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
  const task = getTask(taskId);
  if (!task?.agentId) return;
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
  elements.universe.innerHTML = `
    <div class="universe-orbit ${pulse ? "pulse" : ""}">
      ${agents
        .map((agent, index) => {
          const angle = (index / Math.max(1, agents.length)) * Math.PI * 2;
          const x = Math.round(Math.cos(angle) * 34);
          const y = Math.round(Math.sin(angle) * 30);
          return `
            <button class="agent-sphere ${agent.status}" style="--x:${x}%;--y:${y}%;--delay:${index * 120}ms" data-universe-agent="${agent.id}" type="button">
              <span>${escapeHtml(agent.name.slice(0, 2).toUpperCase())}</span>
              <strong>${escapeHtml(agent.name)}</strong>
            </button>
          `;
        })
        .join("")}
      ${buildUniverseLinks(agents)}
    </div>
  `;
  elements.universe.querySelectorAll("[data-universe-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentInspector(button.dataset.universeAgent));
  });
}

function buildUniverseLinks(agents) {
  return agents
    .slice(0, Math.max(0, agents.length - 1))
    .map((agent, index) => `<span class="universe-link status-${agent.status}" style="--link-index:${index}"></span>`)
    .join("");
}

function renderMarketplace() {
  if (!elements.marketplaceGrid) return;
  elements.marketplaceGrid.innerHTML = MARKETPLACE_AGENTS.map(
    (item) => `
      <article class="market-agent">
        <div>
          <p class="section-label">${escapeHtml(item.category)} · v${escapeHtml(item.version)}</p>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <div class="market-meta">
          <span>${escapeHtml(item.author)}</span>
          <span>${item.downloads.toLocaleString("pt-BR")} downloads</span>
          <span>${item.rating} ★</span>
        </div>
        <div class="tool-list">${item.tools.map((tool) => `<span class="tool-chip">${escapeHtml(tool)}</span>`).join("")}</div>
        <button class="primary-button" data-install-agent="${escapeHtml(item.name)}" type="button">Instalar</button>
      </article>
    `
  ).join("");

  elements.marketplaceGrid.querySelectorAll("[data-install-agent]").forEach((button) => {
    button.addEventListener("click", () => installMarketplaceAgent(button.dataset.installAgent));
  });
}

function installMarketplaceAgent(name) {
  const item = MARKETPLACE_AGENTS.find((agent) => agent.name === name);
  if (!item) return;
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
  form.elements.costPerStep.value = state.settings.costPerStep;
  form.elements.stepDelay.value = state.settings.stepDelay;
  form.elements.autoScrollLogs.checked = state.settings.autoScrollLogs;
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  state.settings.costPerStep = Number(form.elements.costPerStep.value);
  state.settings.stepDelay = Number(form.elements.stepDelay.value);
  state.settings.autoScrollLogs = form.elements.autoScrollLogs.checked;
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

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  const label = document.querySelector(`.nav-item[data-view="${viewId}"]`)?.dataset.label || "Dashboard";
  elements.viewTitle.textContent = label;
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
  state = { agents: [], tasks: [], logs: [], openRouter: { configuredModel: "openrouter/free", models: [] }, settings: { ...defaultSettings } };
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
  logAction(state.agents[0].id, state.tasks[0].id, "seed_demo", "completed", "Dados de demonstração restaurados.");
  saveState();
  render();
  loadOpenRouterModels();
  showToast("Demo restaurada.");
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
