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

const scoped = {
  config: { accountApiBase: "/core-acct", coreApiBase: "/core", origin },
  state: { customerAccount: { code: "CHS_STG_ELENA_RIOS", id: 1 }, session: { accessToken: "test", tokenType: "Bearer", userId: 42 } },
};
const accountWithPhone = {
  id: 1,
  code: "CHS_STG_ELENA_RIOS",
  contacts: [{
    id: 7, firstName: "Elena", lastName: "Rios",
    contactEntries: [
      { id: 8, value: "elena@example.test", kind: { code: "HOME" }, type: { code: "EMAIL" } },
      { id: 9, value: "+1 512 555 0143", kind: { code: "MOBILE" }, type: { code: "PHONE" } },
    ],
  }],
};

{
  // With a resolved account, phone comes from the PRIMARY contact's PHONE entry.
  const calls = [];
  const adapter = createCoreUserProfileAdapter({ origin, fetch: sequence([json(user), json({ result: [accountWithPhone] })], calls) });
  const result = await adapter.load("profile", scoped);
  assert.equal(result.phone, "+1 512 555 0143");
  assert.deepEqual(result.unavailableFields, ["preferences"], "phone is no longer unavailable once it is read");
  assert.deepEqual(result.allowedActions, ["edit-email"], "phone stays read-only until a scoped contact write exists");
  assert.equal(calls[1].url, origin + "/core-acct/api/account/list.json");
  assert.deepEqual(JSON.parse(calls[1].options.body).filters, [{ type: "INTEGER", operator: "=", property: "id", value: "1" }]);
}

{
  // A contact with no phone entry yields no phone, never a placeholder.
  const withoutPhone = { ...accountWithPhone, contacts: [{ ...accountWithPhone.contacts[0], contactEntries: [accountWithPhone.contacts[0].contactEntries[0]] }] };
  const result = await createCoreUserProfileAdapter({ origin, fetch: sequence([json(user), json({ result: [withoutPhone] })]) }).load("profile", scoped);
  assert.equal(result.phone, null);
  assert.deepEqual(result.unavailableFields, ["phone", "preferences"]);
}

{
  // Another customer's account must never supply the phone.
  const foreign = { ...accountWithPhone, id: 2099 };
  const result = await createCoreUserProfileAdapter({ origin, fetch: sequence([json(user), json({ result: [foreign] })]) }).load("profile", scoped);
  assert.equal(result.phone, null);
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
function sequence(responses, calls = []) { let i = 0; return async (url, options) => { calls.push({ url, options }); return responses[i++]; }; }
