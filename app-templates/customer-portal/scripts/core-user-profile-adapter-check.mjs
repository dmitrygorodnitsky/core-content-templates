import assert from "node:assert/strict";
import { coreUserProfileContract, createCoreUserProfileAdapter } from "../runtime/src/adapters/core-user-profile-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = { config: { origin, coreApiBase: "/core" }, state: { session: { accessToken: "test", tokenType: "Bearer", userId: 42 } } };
const user = { id: 42, optimistic: 3, name: "elena", fullname: "Elena Rios", email: "elena@example.test", enabled: true, language: { id: 1 }, workflow: { id: 2 } };

{
  const calls = [];
  const adapter = createCoreUserProfileAdapter({ origin, fetch: sequence([json(user)], calls) });
  const result = await adapter.load("profile", context);
  assert.deepEqual(result, { state: "ready", email: "elena@example.test", phone: null, prefs: {}, optimistic: 3, allowedActions: ["edit-email"], unavailableFields: ["phone", "preferences"] });
  assert.equal(calls[0].url, origin + "/core/api/user/get.json?id=42");
  assert.deepEqual(JSON.parse(calls[0].options.body), coreUserProfileContract.mappings);
}

{
  const calls = [];
  const changed = { ...user, optimistic: 4, email: "new@example.test" };
  const adapter = createCoreUserProfileAdapter({ origin, fetch: sequence([json(user), json([42]), json(changed)], calls) });
  const result = await adapter.save({ email: "new@example.test" }, context);
  assert.equal(result.email, "new@example.test");
  const save = JSON.parse(calls[1].options.body).entities[0];
  assert.deepEqual(save, { email: "new@example.test", enabled: true, fullname: "Elena Rios", id: 42, language: { id: 1 }, name: "elena", optimistic: 3, workflow: { id: 2 } });
}

await assert.rejects(
  () => createCoreUserProfileAdapter({ origin, fetch: async () => ({ ok: false, status: 403, async json() { return {}; } }) }).load("profile", context),
  (error) => error && error.code === "customer-forbidden",
);

console.log("core-user-profile-adapter-check ok: self User email save is optimistic and confirmed by readback");

function json(value) { return { ok: true, status: 200, async json() { return structuredClone(value); } }; }
function sequence(responses, calls) { let i = 0; return async (url, options) => { calls.push({ url, options }); return responses[i++]; }; }
