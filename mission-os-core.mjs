export const MISSION_OS_SCHEMA_VERSION = 1;

export const MISSION_STATES = Object.freeze([
  "draft",
  "planning",
  "awaiting_approval",
  "running",
  "paused",
  "blocked",
  "completed",
  "failed",
  "cancelled",
]);

export const AUTONOMY_LEVELS = Object.freeze({
  observe: { label: "Observe", rank: 0, description: "Somente leitura." },
  suggest: { label: "Suggest", rank: 1, description: "Planeja e recomenda." },
  approval: { label: "Act with approval", rank: 2, description: "Age depois de aprovação humana." },
  bounded: {
    label: "Autonomous within limits",
    rank: 3,
    description: "Age somente dentro de limites explícitos.",
  },
});

const TRANSITIONS = Object.freeze({
  draft: ["planning", "cancelled"],
  planning: ["awaiting_approval", "running", "paused", "cancelled"],
  awaiting_approval: ["running", "blocked", "cancelled"],
  running: ["paused", "blocked", "completed", "failed", "cancelled"],
  paused: ["running", "cancelled"],
  blocked: ["planning", "running", "failed", "cancelled"],
  completed: [],
  failed: ["planning", "cancelled"],
  cancelled: [],
});

const SENSITIVE_CAPABILITIES = new Set([
  "write_repository",
  "deploy_preview",
  "send_message",
  "spend_money",
  "control_device",
]);

export function createId(prefix = "item") {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

export function nowIso(clock = Date) {
  return new clock().toISOString();
}

export function createMission(input = {}, clock = Date) {
  const now = nowIso(clock);
  const title = cleanText(input.title, "Missão sem título", 140);
  const objective = cleanText(input.objective, title, 800);
  const autonomy = AUTONOMY_LEVELS[input.autonomy] ? input.autonomy : "approval";
  const budgetLimit = finiteNumber(input.budgetLimit, 25, 0, 1_000_000);
  const owner = normalizeParticipant(input.owner || {
    id: "human_founder",
    name: "Lucas",
    type: "human",
    role: "Mission owner",
    presence: "online",
  });

  const mission = {
    schemaVersion: MISSION_OS_SCHEMA_VERSION,
    id: input.id || createId("mission"),
    title,
    objective,
    description: cleanText(input.description, "Objetivo persistente coordenado pelo Mission OS.", 1600),
    state: MISSION_STATES.includes(input.state) ? input.state : "draft",
    priority: ["normal", "high", "critical"].includes(input.priority) ? input.priority : "normal",
    estimatedDuration: cleanText(input.estimatedDuration, "2–4 horas", 80),
    createdAt: input.createdAt || now,
    updatedAt: now,
    owner,
    participants: uniqueParticipants([owner, ...(input.participants || [])]),
    agents: uniqueParticipants(input.agents || []),
    budget: {
      currency: input.currency || "BRL",
      limit: budgetLimit,
      spent: finiteNumber(input.spent, 0, 0, budgetLimit),
    },
    capabilities: uniqueStrings(input.capabilities || ["read_repository", "run_tests"]),
    autonomy,
    approvalPolicy: cleanText(
      input.approvalPolicy,
      "Ações externas, mutações, publicação e gastos exigem aprovação humana.",
      400
    ),
    planVersion: 0,
    plan: [],
    planHistory: [],
    events: [],
    memories: [],
    approvals: [],
    results: [],
    risks: normalizeRisks(input.risks || []),
    metrics: {
      progress: 0,
      trust: finiteNumber(input.trust, 92, 0, 100),
      elapsedMinutes: 0,
      actions: 0,
      memories: 0,
    },
    nextAction: "Gerar plano vivo",
    mode: input.mode || "functional-local",
  };

  return appendEvent(mission, {
    actor: owner.name,
    type: "state",
    summary: "Missão criada",
    details: `Objetivo registrado: ${objective}`,
    risk: "low",
    consequence: "A missão está pronta para planejamento.",
  }, clock);
}

export function generatePlan(mission, clock = Date) {
  assertMission(mission);
  const timestamp = nowIso(clock);
  const plan = [
    createStep("Entender objetivo e restrições", "Cortex", [], "low", false),
    createStep("Mapear contexto, código e dependências", "Atlas Research", [0], "low", false),
    createStep("Preparar alterações em ambiente isolado", "Forge Engineer", [1], "medium", false),
    createStep("Executar testes e revisão de confiança", "Sentinel QA", [2], "medium", false),
    createStep("Autorizar publicação da versão", mission.owner.name, [3], "high", true),
    createStep("Registrar resultado e aprendizado", "Cortex", [4], "low", false),
  ].map((step, index, steps) => ({
    ...step,
    dependencies: step.dependencies.map((dependencyIndex) => steps[dependencyIndex]?.id).filter(Boolean),
  }));

  const next = cloneMission(mission);
  if (next.plan.length) {
    next.planHistory.push({
      version: next.planVersion,
      archivedAt: timestamp,
      steps: next.plan,
    });
  }
  next.planVersion += 1;
  next.plan = plan;
  next.nextAction = "Iniciar execução supervisionada";
  next.state = "planning";
  next.updatedAt = timestamp;
  return appendEvent(next, {
    actor: "Mission Cortex",
    type: "plan",
    summary: `Plano vivo v${next.planVersion} criado`,
    details: `${plan.length} etapas coordenadas com dependências e um checkpoint humano.`,
    risk: "low",
    consequence: "A missão pode iniciar sem depender de uma API paga.",
  }, clock);
}

export function transitionMission(mission, targetState, actor = "Human supervisor", clock = Date) {
  assertMission(mission);
  if (!MISSION_STATES.includes(targetState)) throw new Error(`Estado inválido: ${targetState}`);
  if (!TRANSITIONS[mission.state]?.includes(targetState)) {
    throw new Error(`Transição inválida: ${mission.state} → ${targetState}`);
  }

  const next = cloneMission(mission);
  const previous = next.state;
  next.state = targetState;
  next.updatedAt = nowIso(clock);
  next.nextAction = nextActionForState(next);
  if (targetState === "completed") next.metrics.progress = 100;
  return appendEvent(next, {
    actor,
    type: "state",
    summary: `${stateLabel(previous)} → ${stateLabel(targetState)}`,
    details: `Estado alterado por ${actor}.`,
    risk: targetState === "cancelled" || targetState === "failed" ? "medium" : "low",
    consequence: next.nextAction,
  }, clock);
}

export function executeNextStep(mission, actor = "Mission Cortex", clock = Date) {
  assertMission(mission);
  if (mission.state !== "running") throw new Error("A missão precisa estar em execução.");
  const next = cloneMission(mission);
  const step = next.plan.find((candidate) => candidate.state === "pending" || candidate.state === "running");
  if (!step) return transitionMission(next, "completed", actor, clock);

  if (step.requiresApproval && !approvedForStep(next, step.id)) {
    step.state = "waiting";
    const approval = createApproval(step, actor, clock);
    next.approvals.push(approval);
    next.state = "awaiting_approval";
    next.nextAction = `Aprovar: ${step.title}`;
    return appendEvent(next, {
      actor,
      type: "approval",
      summary: "Aprovação humana solicitada",
      details: step.title,
      risk: step.risk,
      approval: approval.id,
      consequence: "Execução pausada no checkpoint de confiança.",
    }, clock);
  }

  step.state = "completed";
  step.startedAt ||= nowIso(clock);
  step.completedAt = nowIso(clock);
  step.actualResult = `Etapa concluída em modo local seguro por ${actor}.`;
  next.metrics.actions += 1;
  next.metrics.progress = Math.round((next.plan.filter((item) => item.state === "completed").length / next.plan.length) * 100);
  next.metrics.elapsedMinutes += 4;
  next.budget.spent = Math.min(next.budget.limit, Number((next.budget.spent + 0.18).toFixed(2)));
  next.updatedAt = nowIso(clock);
  next.nextAction = next.plan.some((item) => item.state !== "completed")
    ? "Executar próxima etapa"
    : "Concluir missão";
  return appendEvent(next, {
    actor,
    type: "action",
    summary: step.title,
    details: step.actualResult,
    risk: step.risk,
    consequence: `${next.metrics.progress}% do plano concluído.`,
  }, clock);
}

export function decideApproval(mission, approvalId, decision, actor, justification = "", clock = Date) {
  assertMission(mission);
  if (!["approved", "denied"].includes(decision)) throw new Error("Decisão de aprovação inválida.");
  const next = cloneMission(mission);
  const approval = next.approvals.find((item) => item.id === approvalId);
  if (!approval || approval.status !== "pending") throw new Error("Aprovação pendente não encontrada.");
  approval.status = decision;
  approval.decidedAt = nowIso(clock);
  approval.decidedBy = cleanText(actor, "Human supervisor", 120);
  approval.justification = cleanText(justification, decision === "approved" ? "Aprovado após revisão humana." : "Risco não aceito.", 500);
  const step = next.plan.find((item) => item.id === approval.stepId);
  if (step) step.state = decision === "approved" ? "pending" : "blocked";
  next.state = decision === "approved" ? "running" : "blocked";
  next.nextAction = decision === "approved" ? "Continuar execução" : "Replanejar etapa bloqueada";
  return appendEvent(next, {
    actor: approval.decidedBy,
    type: "approval",
    summary: decision === "approved" ? "Ação aprovada" : "Ação negada",
    details: approval.justification,
    risk: approval.risk,
    approval: approval.id,
    consequence: next.nextAction,
  }, clock);
}

export function addMemory(mission, input = {}, clock = Date) {
  assertMission(mission);
  const next = cloneMission(mission);
  const memory = {
    id: createId("memory"),
    content: cleanText(input.content, "", 1600),
    source: cleanText(input.source, "human_observation", 100),
    author: cleanText(input.author, next.owner.name, 120),
    createdAt: nowIso(clock),
    confidence: finiteNumber(input.confidence, 90, 0, 100),
    visibility: ["private", "mission", "team", "organization"].includes(input.visibility)
      ? input.visibility
      : "mission",
    type: ["decision", "fact", "preference", "lesson", "constraint"].includes(input.type) ? input.type : "lesson",
    scope: ["mission", "agent", "team", "organization"].includes(input.scope) ? input.scope : "mission",
    relationId: input.relationId || next.id,
  };
  if (!memory.content) throw new Error("A memória precisa de conteúdo.");
  next.memories.unshift(memory);
  next.metrics.memories = next.memories.length;
  next.updatedAt = memory.createdAt;
  return appendEvent(next, {
    actor: memory.author,
    type: "memory",
    summary: "Memória viva criada",
    details: memory.content,
    risk: "low",
    consequence: `Conhecimento disponível no escopo ${memory.scope}.`,
  }, clock);
}

export function registerCapabilityUse(mission, capabilityId, actor = "Mission Cortex", clock = Date) {
  assertMission(mission);
  const capability = cleanText(capabilityId, "", 100);
  if (!capability) throw new Error("Capacidade inválida.");
  const needsApproval = SENSITIVE_CAPABILITIES.has(capability);
  if (needsApproval && mission.autonomy !== "bounded") {
    const next = cloneMission(mission);
    const pseudoStep = { id: `capability:${capability}`, title: capability, risk: "high" };
    const approval = createApproval(pseudoStep, actor, clock);
    next.approvals.push(approval);
    next.state = "awaiting_approval";
    next.nextAction = `Aprovar capacidade: ${capability}`;
    return appendEvent(next, {
      actor,
      type: "tool",
      summary: "Capacidade bloqueada pelo Trust Kernel",
      details: capability,
      risk: "high",
      approval: approval.id,
      consequence: "Nenhuma ação externa foi executada.",
    }, clock);
  }
  return appendEvent(cloneMission(mission), {
    actor,
    type: "tool",
    summary: "Capacidade utilizada",
    details: capability,
    risk: "low",
    consequence: "Uso registrado na auditoria append-only.",
  }, clock);
}

export function createDemoMission(clock = Date) {
  let mission = createMission({
    id: "mission_demo_release",
    title: "Preparar e lançar uma nova versão segura do Mission",
    objective: "Planejar, validar e preparar uma versão demonstrável sem publicar em produção.",
    description: "Demonstração guiada da coordenação entre fundador, agentes e ferramentas de software.",
    state: "draft",
    priority: "critical",
    estimatedDuration: "3 horas",
    budgetLimit: 40,
    autonomy: "approval",
    mode: "simulated-demo",
    participants: [
      { id: "human_reviewer", name: "Product reviewer", type: "human", role: "Reviewer", presence: "away" },
    ],
    agents: [
      { id: "agent_atlas", name: "Atlas Research", type: "agent", role: "Context & planning", presence: "online" },
      { id: "agent_forge", name: "Forge Engineer", type: "agent", role: "Implementation", presence: "online" },
      { id: "agent_sentinel", name: "Sentinel QA", type: "agent", role: "Trust & validation", presence: "online" },
    ],
    capabilities: ["read_repository", "write_repository", "run_tests", "deploy_preview"],
    risks: [
      { title: "Regressão no produto atual", severity: "high", mitigation: "Branch isolada e testes antes de qualquer publicação." },
      { title: "Confundir simulação com ação real", severity: "medium", mitigation: "Badges explícitos de estado operacional." },
    ],
  }, clock);
  mission = generatePlan(mission, clock);
  mission = addMemory(mission, {
    content: "Preservar Inspector, Replay, Universe, Stripe, Enterprise e conectores existentes.",
    source: "product_spec",
    author: "Lucas",
    confidence: 100,
    visibility: "team",
    type: "constraint",
    scope: "organization",
  }, clock);
  mission.results.push({
    id: createId("result"),
    status: "expected",
    title: "Release candidate validado",
    details: "Código preparado, testes executados e publicação mantida sob aprovação humana.",
  });
  return mission;
}

export function createInitialMissionOsState(clock = Date) {
  const demo = createDemoMission(clock);
  return {
    schemaVersion: MISSION_OS_SCHEMA_VERSION,
    selectedMissionId: demo.id,
    missions: [demo],
    capabilities: createCapabilityCatalog(clock),
    devices: createRealityMesh(clock),
    updatedAt: nowIso(clock),
  };
}

export function migrateMissionOsState(value, clock = Date) {
  if (!value || !Array.isArray(value.missions)) return createInitialMissionOsState(clock);
  return {
    schemaVersion: MISSION_OS_SCHEMA_VERSION,
    selectedMissionId: value.selectedMissionId || value.missions[0]?.id || null,
    missions: value.missions.map((mission) => ({
      ...createMission(mission, clock),
      ...mission,
      schemaVersion: MISSION_OS_SCHEMA_VERSION,
      events: Array.isArray(mission.events) ? mission.events : [],
      memories: Array.isArray(mission.memories) ? mission.memories : [],
      approvals: Array.isArray(mission.approvals) ? mission.approvals : [],
      plan: Array.isArray(mission.plan) ? mission.plan : [],
      planHistory: Array.isArray(mission.planHistory) ? mission.planHistory : [],
    })),
    capabilities: Array.isArray(value.capabilities) ? value.capabilities : createCapabilityCatalog(clock),
    devices: Array.isArray(value.devices) ? value.devices : createRealityMesh(clock),
    updatedAt: nowIso(clock),
  };
}

export function replaceMission(state, mission) {
  return {
    ...state,
    selectedMissionId: mission.id,
    missions: state.missions.map((item) => (item.id === mission.id ? mission : item)),
    updatedAt: mission.updatedAt,
  };
}

export function missionSummary(mission) {
  return {
    progress: mission.metrics.progress,
    pendingApprovals: mission.approvals.filter((item) => item.status === "pending").length,
    activeParticipants: [...mission.participants, ...mission.agents].filter((item) => item.presence === "online").length,
    memoryCount: mission.memories.length,
    riskCount: mission.risks.filter((risk) => risk.severity === "high").length,
    spent: mission.budget.spent,
    limit: mission.budget.limit,
  };
}

function createStep(title, owner, dependencies, risk, requiresApproval) {
  return {
    id: createId("step"),
    title,
    description: `${owner} executa esta etapa e registra o resultado no Replay.`,
    owner,
    dependencies,
    state: "pending",
    risk,
    requiresApproval,
    expectedResult: "Resultado verificável e auditável.",
    actualResult: null,
    startedAt: null,
    completedAt: null,
  };
}

function createApproval(step, requestedBy, clock) {
  return {
    id: createId("approval"),
    stepId: step.id,
    title: step.title,
    risk: step.risk || "high",
    requestedBy,
    requestedAt: nowIso(clock),
    status: "pending",
    decidedAt: null,
    decidedBy: null,
    justification: "",
  };
}

function appendEvent(mission, event, clock = Date) {
  const next = mission === undefined ? mission : cloneMission(mission);
  const item = {
    id: createId("event"),
    createdAt: nowIso(clock),
    actor: cleanText(event.actor, "Mission OS", 120),
    type: event.type || "system",
    summary: cleanText(event.summary, "Evento registrado", 240),
    details: cleanText(event.details, "", 1800),
    risk: ["low", "medium", "high"].includes(event.risk) ? event.risk : "low",
    approval: event.approval || null,
    consequence: cleanText(event.consequence, "Sem consequência externa.", 600),
  };
  next.events.unshift(item);
  next.updatedAt = item.createdAt;
  return next;
}

function createCapabilityCatalog(clock) {
  const timestamp = nowIso(clock);
  return [
    capability("agents", "AI agent workforce", "agent", "functional", "suggest", "medium", "Mission"),
    capability("github", "GitHub repository", "connector", "pilot", "approval", "high", "Connector runtime"),
    capability("openrouter", "OpenRouter models", "api", "pilot", "suggest", "medium", "Server"),
    capability("files", "Workspace files", "filesystem", "functional", "approval", "high", "Local runtime"),
    capability("tests", "Test runner", "infrastructure", "functional", "approval", "medium", "Local runtime"),
    capability("robot-arm", "Robot arm", "robot", "planned", "observe", "high", "Reality Mesh"),
  ].map((item) => ({ ...item, lastUsedAt: timestamp }));
}

function createRealityMesh(clock) {
  const timestamp = nowIso(clock);
  return [
    device("workstation", "Mission workstation", "computer", "connected", "functional", timestamp),
    device("founder-phone", "Current browser device", "phone", "connected", "browser-api", timestamp),
    device("build-sensor", "Build health sensor", "sensor", "simulated", "simulated", timestamp),
    device("qa-camera", "Device camera", "camera", "approval_required", "browser-api", timestamp),
    device("robot-01", "General robot", "robot", "planned", "planned", timestamp),
    device("cloud-runtime", "Mission Cloud", "cloud", "approval_required", "pilot", timestamp),
  ];
}

function capability(id, name, type, readiness, permission, risk, origin) {
  return { id, name, type, readiness, permission, risk, origin };
}

function device(id, name, type, state, readiness, lastSeenAt) {
  return { id, name, type, state, readiness, lastSeenAt, permissions: ["observe"], risk: type === "robot" ? "high" : "low" };
}

function normalizeParticipant(participant = {}) {
  return {
    id: participant.id || createId(participant.type === "agent" ? "agent" : "human"),
    name: cleanText(participant.name, "Participant", 120),
    type: participant.type === "agent" ? "agent" : "human",
    role: cleanText(participant.role, "Collaborator", 120),
    presence: ["online", "away", "offline", "simulated"].includes(participant.presence)
      ? participant.presence
      : "simulated",
  };
}

function uniqueParticipants(items) {
  const seen = new Set();
  return items.map(normalizeParticipant).filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function uniqueStrings(items) {
  return [...new Set(items.map((item) => cleanText(item, "", 100)).filter(Boolean))];
}

function normalizeRisks(items) {
  return items.map((risk) => ({
    id: risk.id || createId("risk"),
    title: cleanText(risk.title, "Risco operacional", 200),
    severity: ["low", "medium", "high"].includes(risk.severity) ? risk.severity : "medium",
    mitigation: cleanText(risk.mitigation, "Revisão humana antes da execução.", 500),
  }));
}

function nextActionForState(mission) {
  return {
    draft: "Gerar plano vivo",
    planning: "Revisar e iniciar plano",
    awaiting_approval: "Revisar aprovação pendente",
    running: "Executar próxima etapa",
    paused: "Continuar ou cancelar missão",
    blocked: "Replanejar bloqueio",
    completed: "Revisar resultado e memórias",
    failed: "Investigar falha",
    cancelled: "Nenhuma ação pendente",
  }[mission.state];
}

function approvedForStep(mission, stepId) {
  return mission.approvals.some((item) => item.stepId === stepId && item.status === "approved");
}

function stateLabel(state) {
  return state.replaceAll("_", " ");
}

function cleanText(value, fallback, maxLength) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  return (normalized || fallback).slice(0, maxLength);
}

function finiteNumber(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function cloneMission(mission) {
  return structuredClone(mission);
}

function assertMission(mission) {
  if (!mission || !MISSION_STATES.includes(mission.state) || !Array.isArray(mission.events)) {
    throw new Error("Missão inválida.");
  }
}
