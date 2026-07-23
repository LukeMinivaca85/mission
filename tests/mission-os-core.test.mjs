import test from "node:test";
import assert from "node:assert/strict";
import {
  addMemory,
  createDemoMission,
  createInitialMissionOsState,
  createMission,
  decideApproval,
  executeNextStep,
  generatePlan,
  migrateMissionOsState,
  missionSummary,
  registerCapabilityUse,
  replaceMission,
  transitionMission,
} from "../mission-os-core.mjs";

const FixedClock = class extends Date {
  constructor() {
    super("2026-07-23T20:00:00.000Z");
  }
};

test("creates a safe mission with append-only creation event", () => {
  const mission = createMission({ title: "Ship Mission", autonomy: "invalid" }, FixedClock);
  assert.equal(mission.state, "draft");
  assert.equal(mission.autonomy, "approval");
  assert.equal(mission.events.length, 1);
  assert.equal(mission.events[0].type, "state");
});

test("generates a deterministic plan without paid AI", () => {
  const mission = generatePlan(createMission({ title: "Ship" }, FixedClock), FixedClock);
  assert.equal(mission.state, "planning");
  assert.equal(mission.plan.length, 6);
  assert.equal(mission.plan.filter((step) => step.requiresApproval).length, 1);
});

test("rejects unsafe lifecycle transitions", () => {
  const mission = createMission({ title: "Ship" }, FixedClock);
  assert.throws(() => transitionMission(mission, "completed", "Lucas", FixedClock), /Transição inválida/);
});

test("runs steps and pauses at a human checkpoint", () => {
  let mission = createDemoMission(FixedClock);
  mission = transitionMission(mission, "running", "Lucas", FixedClock);
  for (let index = 0; index < 5; index += 1) mission = executeNextStep(mission, "Cortex", FixedClock);
  assert.equal(mission.state, "awaiting_approval");
  assert.equal(mission.approvals.at(-1).status, "pending");
  mission = decideApproval(mission, mission.approvals.at(-1).id, "approved", "Lucas", "Testes revisados.", FixedClock);
  assert.equal(mission.state, "running");
});

test("Trust Kernel blocks sensitive capabilities", () => {
  const mission = registerCapabilityUse(createDemoMission(FixedClock), "deploy_preview", "Forge", FixedClock);
  assert.equal(mission.state, "awaiting_approval");
  assert.match(mission.events[0].summary, /bloqueada/i);
});

test("adds searchable structured memory and updates summary", () => {
  const mission = addMemory(createMission({ title: "Learn" }, FixedClock), {
    content: "Nunca publicar sem aprovação.",
    scope: "organization",
    type: "constraint",
  }, FixedClock);
  assert.equal(mission.memories.length, 1);
  assert.equal(missionSummary(mission).memoryCount, 1);
});

test("migrates invalid state and replaces selected mission", () => {
  const initial = createInitialMissionOsState(FixedClock);
  const migrated = migrateMissionOsState(null, FixedClock);
  assert.equal(migrated.schemaVersion, 1);
  const newMission = createMission({ title: "Second" }, FixedClock);
  const extended = { ...initial, missions: [...initial.missions, newMission] };
  assert.equal(replaceMission(extended, newMission).selectedMissionId, newMission.id);
});
