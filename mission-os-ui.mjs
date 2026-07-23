import {
  AUTONOMY_LEVELS,
  addMemory,
  createDemoMission,
  createInitialMissionOsState,
  createMission,
  decideApproval,
  executeNextStep,
  generatePlan,
  migrateMissionOsState,
  missionSummary,
  replaceMission,
  transitionMission,
} from "./mission-os-core.mjs";

const STORAGE_KEY = "lukintoshMissionOsState";
const CLIENT_KEY = "lukintoshMissionOsClientId";
const root = document.querySelector("#mission-os-root");
let state = loadState();
let activePanel = "plan";
let memoryQuery = "";
let serverRevision = null;
let syncStatus = "local";
let activePresence = [];
let syncTimer = null;
const clientId = localStorage.getItem(CLIENT_KEY) || crypto.randomUUID();
localStorage.setItem(CLIENT_KEY, clientId);

if (root) {
  bindShellActions();
  render();
  initializeSync();
}

function loadState() {
  try {
    return migrateMissionOsState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return createInitialMissionOsState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleServerSync();
}

function selectedMission() {
  return state.missions.find((mission) => mission.id === state.selectedMissionId) || state.missions[0];
}

function updateMission(mission, message) {
  state = replaceMission(state, mission);
  saveState();
  render();
  toast(message);
}

function bindShellActions() {
  document.querySelector("[data-view='mission-os']")?.addEventListener("click", render);
  document.querySelector("#mission-os-demo-button")?.addEventListener("click", () => {
    const demo = createDemoMission();
    const existing = state.missions.findIndex((mission) => mission.id === demo.id);
    state.missions = existing === -1
      ? [demo, ...state.missions]
      : state.missions.map((mission) => (mission.id === demo.id ? demo : mission));
    state.selectedMissionId = demo.id;
    saveState();
    render();
    toast("Demonstração Mission OS restaurada.");
  });
}

function render() {
  const mission = selectedMission();
  if (!mission || !root) return;
  const summary = missionSummary(mission);
  root.innerHTML = `
    <section class="mission-os-hero">
      <div>
        <div class="mission-os-kicker"><span class="live-dot"></span> Mission OS foundation · ${syncStatus === "synced" ? "server synced" : "local-first"}</div>
        <h3>One persistent goal.<br /><span>Humans, agents and machines.</span></h3>
        <p>Coordene objetivos vivos com memória, ações, confiança e Replay — sem esconder o que ainda é simulação.</p>
        <div class="mission-os-hero-actions">
          <button class="primary-button" data-os-create type="button">Criar missão viva</button>
          <button class="ghost-button" id="mission-os-demo-button" type="button">Restaurar demonstração</button>
        </div>
      </div>
      <aside class="mission-os-thesis">
        <span>PLATFORM THESIS</span>
        <strong>Apps store work.<br />Mission OS understands,<br />performs and improves it.</strong>
        <small>Coordination and trust layer</small>
      </aside>
    </section>

    <section class="os-metric-grid" aria-label="Estado da missão">
      ${metric("PROGRESS", `${summary.progress}%`, progressBar(summary.progress))}
      ${metric("ACTIVE MINDS", summary.activeParticipants, "humans + agents online")}
      ${metric("APPROVALS", summary.pendingApprovals, summary.pendingApprovals ? "human action required" : "trust kernel clear")}
      ${metric("LIVING MEMORY", summary.memoryCount, "structured records")}
      ${metric("BUDGET", money(summary.spent), `of ${money(summary.limit)}`)}
      ${metric("TRUST", `${mission.metrics.trust}%`, `${summary.riskCount} high risks tracked`)}
    </section>

    <section class="os-layout">
      <aside class="os-mission-rail panel">
        <div class="panel-header compact-header">
          <div><p class="section-label">Mission Command</p><h3>Missões vivas</h3></div>
          <button class="icon-button" data-os-create type="button" aria-label="Criar missão">+</button>
        </div>
        <div class="os-mission-list">
          ${state.missions.map(renderMissionListItem).join("")}
        </div>
        <div class="os-legend">
          <span><i class="readiness functional"></i> funcional</span>
          <span><i class="readiness simulated"></i> simulado</span>
          <span><i class="readiness pilot"></i> piloto</span>
          <span><i class="readiness planned"></i> planejado</span>
        </div>
      </aside>

      <main class="os-command">
        ${renderCommandHeader(mission)}
        ${renderApprovalBanner(mission)}
        ${renderPanelTabs(mission)}
        <section class="panel os-panel-content">${renderActivePanel(mission)}</section>
      </main>
    </section>

    <dialog class="modal os-create-dialog" id="os-create-dialog">
      <div class="modal-header">
        <div><p class="section-label">Persistent goal</p><h3>Criar missão viva</h3></div>
        <button class="ghost-button" data-os-close type="button">Fechar</button>
      </div>
      ${renderCreateForm()}
    </dialog>
  `;
  bindViewActions();
}

function renderCommandHeader(mission) {
  const allParticipants = [...mission.participants, ...mission.agents];
  return `
    <section class="panel os-command-header">
      <div class="os-command-topline">
        <div class="os-status-group">
          <span class="status-badge status-${escapeAttribute(mission.state)}">${label(mission.state)}</span>
          <span class="readiness-badge ${readinessClass(mission.mode)}">${readinessLabel(mission.mode)}</span>
          <span class="readiness-badge ${syncStatus === "synced" ? "functional" : "simulated"}">${syncStatus === "synced" ? "multiplayer synced" : "local session"}</span>
          <span class="os-priority">${mission.priority} priority</span>
        </div>
        <span class="os-id">${escapeHtml(mission.id)}</span>
      </div>
      <div class="os-title-row">
        <div>
          <h3>${escapeHtml(mission.title)}</h3>
          <p>${escapeHtml(mission.objective)}</p>
        </div>
        <div class="os-progress-ring" style="--progress:${mission.metrics.progress * 3.6}deg">
          <strong>${mission.metrics.progress}%</strong><span>complete</span>
        </div>
      </div>
      <div class="os-participants">
        <div class="avatar-stack" aria-label="Participantes">
          ${allParticipants.slice(0, 6).map((participant) => `
            <span class="os-avatar ${participant.type}" title="${escapeAttribute(`${participant.name} · ${participant.role}`)}">
              ${initials(participant.name)}<i class="${participant.presence}"></i>
            </span>
          `).join("")}
        </div>
        <div><strong>${allParticipants.length + activePresence.filter((item) => item.id !== clientId).length} participantes</strong><small>${syncStatus === "synced" ? `${activePresence.length} browsers active` : "local multiplayer preview"}</small></div>
        <div class="os-next-action"><span>PRÓXIMA AÇÃO</span><strong>${escapeHtml(mission.nextAction)}</strong></div>
      </div>
      <div class="os-controls">
        ${mission.state === "draft" ? actionButton("Gerar plano", "plan") : ""}
        ${mission.state === "planning" ? actionButton("Iniciar", "start", true) : ""}
        ${mission.state === "running" ? actionButton("Executar próxima etapa", "execute", true) : ""}
        ${mission.state === "running" ? actionButton("Pausar", "pause") : ""}
        ${mission.state === "paused" ? actionButton("Continuar", "resume", true) : ""}
        ${mission.state === "blocked" ? actionButton("Replanejar", "replan") : ""}
        ${["draft", "planning", "awaiting_approval", "running", "paused", "blocked"].includes(mission.state)
          ? actionButton("Desligar missão", "cancel", false, "danger-button")
          : ""}
      </div>
    </section>
  `;
}

function renderApprovalBanner(mission) {
  const approval = mission.approvals.find((item) => item.status === "pending");
  if (!approval) return "";
  return `
    <section class="os-approval-banner">
      <div class="approval-signal">!</div>
      <div>
        <span>TRUST KERNEL · HUMAN CHECKPOINT</span>
        <strong>${escapeHtml(approval.title)}</strong>
        <p>Risco ${approval.risk}. Nenhuma ação externa foi executada.</p>
      </div>
      <div class="os-approval-actions">
        <button class="primary-button" data-os-approve="${escapeAttribute(approval.id)}" type="button">Aprovar</button>
        <button class="danger-button" data-os-deny="${escapeAttribute(approval.id)}" type="button">Negar</button>
      </div>
    </section>
  `;
}

function renderPanelTabs(mission) {
  const tabs = [
    ["plan", "Live plan", mission.plan.length],
    ["replay", "Replay", mission.events.length],
    ["memory", "Living Memory", mission.memories.length],
    ["fabric", "Action Fabric", state.capabilities.length],
    ["reality", "Reality Mesh", state.devices.length],
    ["trust", "Trust Kernel", mission.approvals.length],
  ];
  return `<nav class="os-tabs" aria-label="Superfícies Mission OS">
    ${tabs.map(([id, text, count]) => `
      <button class="${activePanel === id ? "active" : ""}" data-os-panel="${id}" type="button">
        ${text}<span>${count}</span>
      </button>
    `).join("")}
  </nav>`;
}

function renderActivePanel(mission) {
  if (activePanel === "replay") return renderReplay(mission);
  if (activePanel === "memory") return renderMemory(mission);
  if (activePanel === "fabric") return renderFabric();
  if (activePanel === "reality") return renderReality();
  if (activePanel === "trust") return renderTrust(mission);
  return renderPlan(mission);
}

function renderPlan(mission) {
  if (!mission.plan.length) {
    return emptyState("Mission Cortex", "Ainda não existe um plano vivo.", "Gerar plano determinístico", "plan");
  }
  return `
    <div class="os-panel-heading">
      <div><p class="section-label">Mission Cortex</p><h3>Plano vivo v${mission.planVersion}</h3></div>
      <span>${mission.planHistory.length} versões arquivadas</span>
    </div>
    <div class="os-plan">
      ${mission.plan.map((step, index) => `
        <article class="os-step ${step.state}">
          <div class="os-step-index">${String(index + 1).padStart(2, "0")}</div>
          <div class="os-step-main">
            <div><span>${escapeHtml(step.owner)}</span><i class="risk-${step.risk}">${step.risk}</i></div>
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.actualResult || step.expectedResult)}</p>
          </div>
          <div class="os-step-state">
            ${step.requiresApproval ? '<span class="lock-mark">HUMAN</span>' : ""}
            <strong>${label(step.state)}</strong>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderReplay(mission) {
  return `
    <div class="os-panel-heading">
      <div><p class="section-label">Mission Replay</p><h3>Black box operacional</h3></div>
      <span>append-only · local</span>
    </div>
    <div class="os-replay">
      ${mission.events.map((event) => `
        <article>
          <div class="replay-node event-${event.type}"></div>
          <time>${formatTime(event.createdAt)}</time>
          <div>
            <span>${escapeHtml(event.actor)} · ${label(event.type)}</span>
            <strong>${escapeHtml(event.summary)}</strong>
            <p>${escapeHtml(event.details)}</p>
            <small>Consequência: ${escapeHtml(event.consequence)}</small>
          </div>
          <i class="risk-${event.risk}">${event.risk}</i>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMemory(mission) {
  const query = memoryQuery.toLowerCase();
  const memories = mission.memories.filter((memory) =>
    [memory.content, memory.author, memory.scope, memory.type].some((value) => String(value).toLowerCase().includes(query))
  );
  return `
    <div class="os-panel-heading memory-heading">
      <div><p class="section-label">Living Memory</p><h3>Conhecimento que sobrevive à execução</h3></div>
      <input data-os-memory-search type="search" value="${escapeAttribute(memoryQuery)}" placeholder="Buscar memória..." />
    </div>
    <form class="os-memory-form" data-os-memory-form>
      <input name="content" required maxlength="1600" placeholder="Registre uma decisão, restrição ou aprendizado..." />
      <select name="scope">
        <option value="mission">Missão</option><option value="agent">Agente</option>
        <option value="team">Equipe</option><option value="organization">Organização</option>
      </select>
      <select name="type">
        <option value="lesson">Aprendizado</option><option value="decision">Decisão</option>
        <option value="constraint">Restrição</option><option value="fact">Fato</option>
      </select>
      <button class="primary-button" type="submit">Memorizar</button>
    </form>
    <div class="os-memory-grid">
      ${memories.length ? memories.map((memory) => `
        <article>
          <div><span>${label(memory.scope)}</span><i>${memory.confidence}% confidence</i></div>
          <strong>${escapeHtml(memory.content)}</strong>
          <small>${escapeHtml(memory.author)} · ${formatTime(memory.createdAt)} · ${label(memory.type)}</small>
        </article>
      `).join("") : '<div class="os-empty-inline">Nenhuma memória corresponde à busca.</div>'}
    </div>
  `;
}

function renderFabric() {
  return `
    <div class="os-panel-heading">
      <div><p class="section-label">Action Fabric</p><h3>Capacidades, não aplicativos</h3></div>
      <span>ações mutáveis exigem aprovação</span>
    </div>
    <div class="os-capability-grid">
      ${state.capabilities.map((capability) => `
        <article>
          <div class="capability-icon">${iconFor(capability.type)}</div>
          <div>
            <span>${label(capability.type)} · ${escapeHtml(capability.origin)}</span>
            <strong>${escapeHtml(capability.name)}</strong>
            <small>${label(capability.permission)} · risk ${capability.risk}</small>
          </div>
          <i class="readiness-badge ${capability.readiness}">${capability.readiness}</i>
        </article>
      `).join("")}
    </div>
  `;
}

function renderReality() {
  return `
    <div class="os-panel-heading">
      <div><p class="section-label">Reality Mesh</p><h3>Physical world interface</h3></div>
      <span>registro e visualização apenas</span>
    </div>
    <div class="reality-actions">
      <button class="primary-button" data-os-camera type="button">Conectar câmera deste dispositivo</button>
      <button class="ghost-button" data-os-device-scan type="button">Detectar capacidades</button>
    </div>
    <div class="reality-grid">
      ${state.devices.map((device) => `
        <article>
          <div class="device-orbit"><span>${iconFor(device.type)}</span><i class="${device.state}"></i></div>
          <span>${label(device.type)}</span>
          <strong>${escapeHtml(device.name)}</strong>
          <small>${label(device.state)} · ${device.readiness}</small>
          <em>observe only</em>
        </article>
      `).join("")}
    </div>
    <div class="os-device-result" data-os-device-result></div>
    <p class="os-safety-note">Reality Mesh não controla hardware nesta fundação. Robôs e sensores são registros demonstrativos e qualquer ação física futura deverá passar pelo Trust Kernel.</p>
  `;
}

function renderTrust(mission) {
  const autonomy = AUTONOMY_LEVELS[mission.autonomy];
  return `
    <div class="os-panel-heading">
      <div><p class="section-label">Trust Kernel</p><h3>Autonomia com limites verificáveis</h3></div>
      <span>default safe</span>
    </div>
    <div class="trust-layout">
      <section class="trust-gauge">
        <div class="trust-score"><strong>${mission.metrics.trust}</strong><span>/100</span></div>
        <p>Trust score demonstrativo baseado em risco, aprovações e histórico local.</p>
      </section>
      <section class="trust-policy">
        <span>NÍVEL DE AUTONOMIA</span>
        <strong>${autonomy.label}</strong>
        <p>${autonomy.description}</p>
        <span>POLÍTICA ATIVA</span>
        <p>${escapeHtml(mission.approvalPolicy)}</p>
      </section>
      <section class="trust-limits">
        <div><span>Budget ceiling</span><strong>${money(mission.budget.limit)}</strong></div>
        <div><span>Current spend</span><strong>${money(mission.budget.spent)}</strong></div>
        <div><span>Capabilities</span><strong>${mission.capabilities.length}</strong></div>
        <div><span>Audit events</span><strong>${mission.events.length}</strong></div>
      </section>
    </div>
    <div class="os-risk-list">
      ${mission.risks.map((risk) => `
        <article><i class="risk-${risk.severity}">${risk.severity}</i><div><strong>${escapeHtml(risk.title)}</strong><p>${escapeHtml(risk.mitigation)}</p></div></article>
      `).join("") || '<div class="os-empty-inline">Nenhum risco específico registrado.</div>'}
    </div>
  `;
}

function bindViewActions() {
  root.querySelectorAll("[data-os-create]").forEach((button) => button.addEventListener("click", () => {
    root.querySelector("#os-create-dialog")?.showModal();
  }));
  root.querySelector("[data-os-close]")?.addEventListener("click", () => root.querySelector("#os-create-dialog")?.close());
  root.querySelector("[data-os-create-form]")?.addEventListener("submit", handleCreate);
  root.querySelectorAll("[data-os-select]").forEach((button) => button.addEventListener("click", () => {
    state.selectedMissionId = button.dataset.osSelect;
    saveState();
    render();
  }));
  root.querySelectorAll("[data-os-action]").forEach((button) => button.addEventListener("click", () => handleLifecycle(button.dataset.osAction)));
  root.querySelectorAll("[data-os-panel]").forEach((button) => button.addEventListener("click", () => {
    activePanel = button.dataset.osPanel;
    render();
  }));
  root.querySelector("[data-os-approve]")?.addEventListener("click", (event) => handleApproval(event.currentTarget.dataset.osApprove, "approved"));
  root.querySelector("[data-os-deny]")?.addEventListener("click", (event) => handleApproval(event.currentTarget.dataset.osDeny, "denied"));
  root.querySelector("[data-os-memory-form]")?.addEventListener("submit", handleMemory);
  root.querySelector("[data-os-camera]")?.addEventListener("click", connectCamera);
  root.querySelector("[data-os-device-scan]")?.addEventListener("click", detectDeviceCapabilities);
  root.querySelector("[data-os-memory-search]")?.addEventListener("input", (event) => {
    memoryQuery = event.target.value;
    const focusPosition = event.target.selectionStart;
    render();
    const field = root.querySelector("[data-os-memory-search]");
    field?.focus();
    field?.setSelectionRange(focusPosition, focusPosition);
  });
  root.querySelector("#mission-os-demo-button")?.addEventListener("click", () => {
    const demo = createDemoMission();
    state.missions = [demo, ...state.missions.filter((mission) => mission.id !== demo.id)];
    state.selectedMissionId = demo.id;
    saveState();
    render();
    toast("Demonstração restaurada sem API paga.");
  });
}

async function initializeSync() {
  try {
    const response = await fetch("/api/mission-os/state", { headers: { "x-mission-client": clientId } });
    if (!response.ok) throw new Error("sync unavailable");
    const payload = await response.json();
    serverRevision = payload.revision;
    activePresence = payload.presence || [];
    if (payload.state) {
      state = migrateMissionOsState(payload.state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      await pushState();
    }
    syncStatus = "synced";
    await sendPresence();
    connectEventStream();
    setInterval(sendPresence, 20_000);
    render();
  } catch {
    syncStatus = "local";
    render();
  }
}

function scheduleServerSync() {
  if (syncStatus !== "synced") return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushState, 180);
}

async function pushState() {
  try {
    const response = await fetch("/api/mission-os/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-mission-client": clientId },
      body: JSON.stringify({ revision: serverRevision, state }),
    });
    const payload = await response.json();
    if (response.status === 409 && payload.record?.state) {
      state = migrateMissionOsState(payload.record.state);
      serverRevision = payload.record.revision;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
      toast("Outra sessão atualizou a missão. Estado sincronizado.");
      return;
    }
    if (!response.ok) throw new Error(payload.error || "Falha de sincronização.");
    serverRevision = payload.revision;
  } catch {
    syncStatus = "local";
    render();
  }
}

async function sendPresence() {
  try {
    const response = await fetch("/api/mission-os/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mission-client": clientId },
      body: JSON.stringify({
        id: clientId,
        name: "Lucas",
        missionId: state.selectedMissionId,
        surface: navigator.userAgentData?.mobile ? "mobile-browser" : "browser",
      }),
    });
    if (response.ok) activePresence = (await response.json()).participants || [];
  } catch {
    // The local-first experience remains available when the server is offline.
  }
}

function connectEventStream() {
  const stream = new EventSource("/api/mission-os/events");
  stream.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "presence") {
      activePresence = payload.participants || [];
      render();
    }
    if (payload.type === "state" && payload.record?.updatedBy !== clientId) {
      serverRevision = payload.record.revision;
      state = migrateMissionOsState(payload.record.state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
      toast("Missão atualizada por outra sessão.");
    }
  };
  stream.onerror = () => {
    syncStatus = "local";
    stream.close();
    render();
  };
}

async function connectCamera() {
  const output = root.querySelector("[data-os-device-result]");
  if (!navigator.mediaDevices?.getUserMedia) {
    output.innerHTML = "<p>Câmera não suportada neste navegador.</p>";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    output.innerHTML = `
      <div class="camera-preview">
        <video autoplay playsinline muted></video>
        <div><strong>Câmera conectada com consentimento</strong><p>O vídeo fica neste navegador e não é enviado ao servidor.</p><button class="danger-button" data-os-camera-stop type="button">Desconectar</button></div>
      </div>`;
    output.querySelector("video").srcObject = stream;
    output.querySelector("[data-os-camera-stop]").addEventListener("click", () => {
      stream.getTracks().forEach((track) => track.stop());
      output.innerHTML = "<p>Câmera desconectada.</p>";
    });
  } catch {
    output.innerHTML = "<p>Acesso à câmera negado ou indisponível. Nenhum dado foi capturado.</p>";
  }
}

async function detectDeviceCapabilities() {
  const output = root.querySelector("[data-os-device-result]");
  const devices = await navigator.mediaDevices?.enumerateDevices?.().catch(() => []) || [];
  const capabilities = [
    ["Câmeras", devices.filter((item) => item.kind === "videoinput").length],
    ["Microfones", devices.filter((item) => item.kind === "audioinput").length],
    ["Geolocalização", "geolocation" in navigator ? "suportada" : "indisponível"],
    ["Movimento", "DeviceMotionEvent" in window ? "suportado" : "indisponível"],
    ["Orientação", "DeviceOrientationEvent" in window ? "suportada" : "indisponível"],
    ["Plataforma", navigator.userAgentData?.platform || navigator.platform || "desconhecida"],
  ];
  output.innerHTML = `<div class="device-capabilities">${capabilities.map(([name, value]) => `<div><span>${escapeHtml(name)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`;
}

function handleCreate(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const mission = createMission({
    title: data.get("title"),
    objective: data.get("objective"),
    description: data.get("description"),
    priority: data.get("priority"),
    autonomy: data.get("autonomy"),
    budgetLimit: data.get("budget"),
  });
  state = { ...state, selectedMissionId: mission.id, missions: [mission, ...state.missions] };
  saveState();
  render();
  toast("Missão viva criada.");
}

function handleLifecycle(action) {
  const mission = selectedMission();
  try {
    const operations = {
      plan: () => generatePlan(mission),
      replan: () => generatePlan(mission),
      start: () => transitionMission(mission, "running", "Lucas"),
      execute: () => executeNextStep(mission),
      pause: () => transitionMission(mission, "paused", "Lucas"),
      resume: () => transitionMission(mission, "running", "Lucas"),
      cancel: () => transitionMission(mission, "cancelled", "Lucas"),
    };
    updateMission(operations[action](), "Mission Cortex atualizou a missão.");
  } catch (error) {
    toast(error.message);
  }
}

function handleApproval(id, decision) {
  try {
    const mission = decideApproval(
      selectedMission(),
      id,
      decision,
      "Lucas",
      decision === "approved" ? "Revisado e aprovado pelo mission owner." : "Risco não aceito pelo mission owner."
    );
    updateMission(mission, decision === "approved" ? "Ação aprovada." : "Ação bloqueada.");
  } catch (error) {
    toast(error.message);
  }
}

function handleMemory(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  try {
    updateMission(addMemory(selectedMission(), {
      content: data.get("content"),
      scope: data.get("scope"),
      type: data.get("type"),
      author: "Lucas",
      confidence: 96,
    }), "Memória viva registrada.");
  } catch (error) {
    toast(error.message);
  }
}

function renderMissionListItem(mission) {
  return `
    <button class="${mission.id === state.selectedMissionId ? "active" : ""}" data-os-select="${escapeAttribute(mission.id)}" type="button">
      <div><span class="mission-state-dot ${mission.state}"></span><small>${label(mission.state)}</small><i>${mission.metrics.progress}%</i></div>
      <strong>${escapeHtml(mission.title)}</strong>
      <span>${escapeHtml(mission.nextAction)}</span>
    </button>
  `;
}

function renderCreateForm() {
  return `
    <form class="form-grid os-create-form" data-os-create-form>
      <label>Título<input name="title" required maxlength="140" placeholder="Ex: Preparar release segura" /></label>
      <label>Objetivo<input name="objective" required maxlength="800" placeholder="Resultado verificável que a missão deve alcançar" /></label>
      <label class="settings-wide-field">Descrição<textarea name="description" rows="3" maxlength="1600" placeholder="Contexto, restrições e definição de sucesso"></textarea></label>
      <label>Prioridade<select name="priority"><option value="normal">Normal</option><option value="high">Alta</option><option value="critical">Crítica</option></select></label>
      <label>Autonomia<select name="autonomy">
        <option value="observe">Observe</option><option value="suggest">Suggest</option>
        <option value="approval" selected>Act with approval</option><option value="bounded">Autonomous within limits</option>
      </select></label>
      <label>Limite de orçamento (BRL)<input name="budget" type="number" min="0" max="1000000" value="25" /></label>
      <button class="primary-button" type="submit">Criar missão</button>
    </form>
  `;
}

function metric(labelText, value, detail) {
  return `<article><span>${labelText}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function progressBar(progress) {
  return `<i class="mini-progress"><b style="width:${progress}%"></b></i>`;
}

function actionButton(text, action, primary = false, className = "") {
  const buttonClass = className || (primary ? "primary-button" : "ghost-button");
  return `<button class="${buttonClass}" data-os-action="${action}" type="button">${text}</button>`;
}

function emptyState(kicker, title, actionText, action) {
  return `<div class="os-empty"><span>${kicker}</span><strong>${title}</strong><p>O fallback local cria um plano auditável sem consumir uma API paga.</p>${actionButton(actionText, action, true)}</div>`;
}

function readinessClass(mode) {
  if (mode.includes("simulated")) return "simulated";
  if (mode.includes("pilot")) return "pilot";
  if (mode.includes("planned")) return "planned";
  return "functional";
}

function readinessLabel(mode) {
  return mode === "functional-local" ? "functional · local" : mode.replaceAll("-", " ");
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatTime(value) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function label(value) {
  return String(value || "").replaceAll("_", " ");
}

function initials(name) {
  return String(name).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function iconFor(type) {
  return { agent: "AI", connector: "↗", api: "{ }", filesystem: "▤", infrastructure: "⌁", robot: "R", computer: "⌘", phone: "▯", sensor: "∿", camera: "◉", cloud: "☁" }[type] || "◇";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function toast(message) {
  if (typeof window.showToast === "function") {
    window.showToast(message);
    return;
  }
  const element = document.querySelector("#toast");
  if (!element) return;
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 2400);
}
