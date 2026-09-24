// Verifies the plan module wiring: the registry selects the live Core adapter,
// the fixture path stays inert, failures map to accepted states, and the page
// selector reads the live envelope instead of fixtures.
import assert from "node:assert/strict";

// The runtime is browser code; static imports are hoisted above any assignment,
// so the globals it touches are installed before the module graph is pulled in.
globalThis.window = globalThis;
globalThis.location = { origin: "https://dev-1.servicewand.com" };

const { modules, openedModuleIds } = await import("../runtime/src/modules/index.js");
const { spaPlans, state } = await import("../runtime/src/state.js");

assert.ok(openedModuleIds.includes("plan"), "plan must be a registered module");

const planModule = modules.plan;
assert.equal(planModule.id, "plan");
assert.equal(planModule.asyncOnly, true, "plans are never loaded synchronously");

{
  const live = planModule.adapter({ config: { dataMode: "live" } });
  assert.equal(typeof live.load, "function");
  // The live adapter must refuse any module but its own.
  assert.throws(() => live.load("orders", {}), (error) => error && error.code === "unsupported-module");
}

{
  // Fixture mode stays inert: no Core call, no invented plans.
  const fixture = planModule.adapter({ config: { dataMode: "fixture" } });
  assert.deepEqual(fixture.load(), { state: "ready", items: [], byRef: {} });
}

{
  assert.deepEqual(planModule.failureEnvelope({}, { code: "customer-forbidden" }),
    { state: "unauthorized", items: [], byRef: {} });
  assert.deepEqual(planModule.failureEnvelope({}, { code: "plans-unavailable" }),
    { state: "error", items: [], byRef: {} });
  const context = { state: {} };
  planModule.onError({ code: "session-expired" }, context);
  assert.equal(context.state.account, "session-expired", "an expired session surfaces on the account, not the plan list");
}

{
  // In live mode the page selector reads the module envelope, never fixtures.
  const livePlan = { ref: "plan-core-10", kind: "PACKAGE", status: "Active", title: "Harbor reset series" };
  state.config.dataMode = "live";
  state.moduleData.plan = { state: "ready", items: [livePlan], byRef: { "plan-core-10": livePlan } };
  assert.deepEqual(spaPlans(), [livePlan]);

  state.moduleData.plan = undefined;
  assert.deepEqual(spaPlans(), [], "a module that has not loaded shows nothing, never fixture plans");

  // A locally cancelled ref must not rewrite what the server returned.
  state.moduleData.plan = { state: "ready", items: [livePlan] };
  state.spaPlanCancelled["plan-core-10"] = true;
  assert.deepEqual(spaPlans(), [livePlan], "live plan status comes from readback, not local state");
}

{
  // The page's unavailable treatment is gated on the module, not on the demo
  // command mode: once plan reads are opened, "not in the current API" is false.
  // Rendering itself needs a DOM, so the page assertions live in the browser
  // suite; this pins the decision the page makes.
  const { isModuleEnabled } = await import("../runtime/src/state.js");
  state.config.enabledModules = ["plan", "account"];
  assert.equal(isModuleEnabled("plan"), true);
  state.config.enabledModules = ["account"];
  assert.equal(isModuleEnabled("plan"), false, "a deployment without the module keeps the accepted unavailable block");
}

console.log("plan-module-check ok: the plan module reads live Core and never falls back to fixtures");
