import assert from "node:assert/strict";
import { createCoreAccountAdapter, coreAccountContract } from "../runtime/src/adapters/core-account-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: {
    origin,
    organization: "CALM_HARBOR_SPA_STAGING",
    coreApiBase: "/core",
    accountApiBase: "/core-acct",
    accountTypeCode: "SPA_CUSTOMER",
  },
  state: { session: { accessToken: "test-token", tokenType: "Bearer" } },
};

{
  const calls = [];
  const adapter = createCoreAccountAdapter({ origin, fetch: successfulFetch(calls) });
  const result = await adapter.resolve(context);
  assert.equal(result.state, "ready");
  assert.deepEqual(result.organization, { code: "CALM_HARBOR_SPA_STAGING" });
  assert.deepEqual(result.user, { id: 42, displayName: "Elena Rios" });
  assert.deepEqual(result.account, {
    id: 1042, code: "CHS_STG_ELENA_RIOS", displayName: "Elena Rios", optimistic: 3, typeCode: "SPA_CUSTOMER",
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, origin + "/core/api/user/basic-info.json");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], undefined, "basic-info must not receive an organization header");
  assert.deepEqual(JSON.parse(calls[0].options.body), coreAccountContract.basicInfoMappings);
  assert.equal(calls[1].url, origin + "/core-acct/api/account/list.json");
  assert.equal(calls[1].options.headers["X-Organization-Code"], "CALM_HARBOR_SPA_STAGING");
  const accountRequest = JSON.parse(calls[1].options.body);
  assert.deepEqual(accountRequest.filters, [
    { type: "INTEGER", operator: "=", property: "user.id", value: "42" },
    { type: "STRING", operator: "=", property: "type.code", value: "SPA_CUSTOMER" },
  ]);
  assert.equal(accountRequest.offset, 0);
  assert.equal(accountRequest.pageSize, 2);
  assert.deepEqual(accountRequest.mappings, coreAccountContract.accountMappings);
}

await rejectsWith("customer-not-linked", async () => {
  await createCoreAccountAdapter({ origin, fetch: responseSequence([basicInfo(), json({ result: [], resultSize: 0 })]) }).resolve(context);
});

await rejectsWith("customer-account-ambiguous", async () => {
  await createCoreAccountAdapter({ origin, fetch: responseSequence([basicInfo(), json({ result: [{ id: 1 }, { id: 2 }], resultSize: 2 })]) }).resolve(context);
});

await rejectsWith("organization-forbidden", async () => {
  const forbiddenContext = structuredClone(context);
  forbiddenContext.config.organization = "SYSTEM";
  await createCoreAccountAdapter({ origin, fetch: responseSequence([basicInfo()]) }).resolve(forbiddenContext);
});

await rejectsWith("session-expired", async () => {
  await createCoreAccountAdapter({ origin, fetch: async () => ({ ok: false, status: 401, async json() { return {}; } }) }).resolve(context);
});

await rejectsWith("customer-forbidden", async () => {
  await createCoreAccountAdapter({ origin, fetch: responseSequence([basicInfo(), { ok: false, status: 403, async json() { return {}; } }]) }).resolve(context);
});

await rejectsWith("cross-origin-service", async () => {
  const crossOriginContext = structuredClone(context);
  crossOriginContext.config.accountApiBase = "https://other.example/core-acct";
  await createCoreAccountAdapter({ origin, fetch: successfulFetch([]) }).resolve(crossOriginContext);
});

console.log("core-account-adapter-check ok: Core basic-info -> user-scoped SPA_CUSTOMER Account, fail-closed states");

function successfulFetch(calls) {
  return responseSequence([basicInfo(), json({
    resultSize: 1,
    result: [{ id: 1042, optimistic: 3, code: "CHS_STG_ELENA_RIOS", nls: { en: { NAME: "Elena Rios" } }, user: { id: 42 } }],
  })], calls);
}

function basicInfo() {
  return json({
    authenticatedUserId: 42,
    authenticatedUserName: "Elena Rios",
    organizationCode: "CALM_HARBOR_SPA_STAGING",
    authorizedOrganizations: [{ code: "CALM_HARBOR_SPA_STAGING" }],
  });
}

function responseSequence(responses, calls = []) {
  let index = 0;
  return async function fetch(url, options) {
    calls.push({ url, options });
    const response = responses[index++];
    if (!response) throw new Error("Unexpected fetch call " + url);
    return response;
  };
}

function json(value) {
  return { ok: true, status: 200, async json() { return structuredClone(value); } };
}

async function rejectsWith(code, operation) {
  await assert.rejects(operation, function (error) { return error && error.code === code; });
}
