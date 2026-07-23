const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MAX_STATE_BYTES = 1_000_000;

function createMissionOsStore(options = {}) {
  const dataFile = options.dataFile || path.join(__dirname, "data", "mission-os-state.json");
  const listeners = new Set();
  const presence = new Map();
  let record = readRecord(dataFile);

  function getState() {
    return structuredClone(record);
  }

  function putState(nextState, expectedRevision, actor = "local-client") {
    validateState(nextState);
    if (expectedRevision !== undefined && expectedRevision !== null && Number(expectedRevision) !== record.revision) {
      return { ok: false, status: 409, error: "A versão do servidor mudou.", record: getState() };
    }
    record = {
      revision: record.revision + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: clean(actor, 120) || "local-client",
      state: structuredClone(nextState),
    };
    writeRecord(dataFile, record);
    broadcast({ type: "state", record: getState() });
    return { ok: true, record: getState() };
  }

  function heartbeat(client = {}) {
    const id = clean(client.id, 120) || crypto.randomUUID();
    presence.set(id, {
      id,
      name: clean(client.name, 120) || "Mission collaborator",
      missionId: clean(client.missionId, 160) || null,
      surface: clean(client.surface, 80) || "browser",
      lastSeenAt: new Date().toISOString(),
    });
    prunePresence();
    const participants = getPresence();
    broadcast({ type: "presence", participants });
    return { id, participants };
  }

  function getPresence() {
    prunePresence();
    return [...presence.values()].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function broadcast(event) {
    for (const listener of listeners) listener(event);
  }

  function prunePresence() {
    const threshold = Date.now() - 45_000;
    for (const [id, participant] of presence) {
      if (Date.parse(participant.lastSeenAt) < threshold) presence.delete(id);
    }
  }

  return { getState, putState, heartbeat, getPresence, subscribe };
}

function validateState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.missions)) {
    throw new Error("Estado Mission OS inválido.");
  }
  if (state.missions.length > 500) throw new Error("Limite de missões excedido.");
  const serialized = JSON.stringify(state);
  if (Buffer.byteLength(serialized) > MAX_STATE_BYTES) throw new Error("Estado Mission OS excede 1 MB.");
  for (const mission of state.missions) {
    if (!mission?.id || !mission?.title || !Array.isArray(mission.events)) {
      throw new Error("Missão sem campos obrigatórios.");
    }
  }
}

function readRecord(dataFile) {
  try {
    const value = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    if (Number.isInteger(value.revision) && value.state) return value;
  } catch {
    // First run: the browser seeds the server with its versioned local state.
  }
  return { revision: 0, updatedAt: null, updatedBy: null, state: null };
}

function writeRecord(dataFile, value) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, dataFile);
}

function clean(value, limit) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, limit);
}

module.exports = { createMissionOsStore, validateState };
