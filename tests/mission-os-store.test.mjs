import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createMissionOsStore, validateState } = require("../mission-os-store.js");

function state(id = "mission_1") {
  return { schemaVersion: 1, missions: [{ id, title: "Mission", events: [] }] };
}

test("persists versioned state and detects conflicts", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mission-os-store-"));
  const dataFile = path.join(directory, "state.json");
  const store = createMissionOsStore({ dataFile });
  const first = store.putState(state(), 0, "client-a");
  assert.equal(first.ok, true);
  assert.equal(first.record.revision, 1);
  assert.equal(store.putState(state("mission_2"), 0, "client-b").status, 409);
  const restored = createMissionOsStore({ dataFile });
  assert.equal(restored.getState().state.missions[0].id, "mission_1");
});

test("tracks and broadcasts active browser presence", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mission-os-store-"));
  const store = createMissionOsStore({ dataFile: path.join(directory, "state.json") });
  const events = [];
  const unsubscribe = store.subscribe((event) => events.push(event));
  const result = store.heartbeat({ id: "browser-a", name: "Lucas", missionId: "mission_1" });
  unsubscribe();
  assert.equal(result.participants[0].name, "Lucas");
  assert.equal(events[0].type, "presence");
});

test("rejects malformed or oversized mission state", () => {
  assert.throws(() => validateState({ missions: [{}] }), /campos obrigatórios/);
  assert.throws(() => validateState({ missions: Array.from({ length: 501 }, (_, index) => ({ id: `${index}`, title: "x", events: [] })) }), /Limite/);
});
