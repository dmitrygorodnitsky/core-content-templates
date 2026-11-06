import assert from "node:assert/strict";
import { resolveCoreAccount } from "../runtime/src/adapters/core-account-adapter.js";
import { loadCustomerAccountProfile } from "../runtime/src/adapters/core-account-profile-adapter.js";
import { createCoreSnowPropertiesAdapter, createCoreSnowQuotesAdapter } from "../runtime/src/adapters/core-snow-adapter.js";

const origin = "https://portal.example.test";
const user = 42;
const account = 62;
const config = { vertical: "snow", origin, organization: "SNOWLIMITLESS", accountTypeCode: "CUSTOMER" };
const context = { config, state: { session: { accessToken: "test-token", tokenType: "Bearer", userId: user }, customerAccount: { id: account } } };
const row = { id: account, user: { id: user }, nls: {}, contacts: [], addresses: [] };
const json = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => structuredClone(value) });
const basicInfo = { authenticatedUserId: user, organizationCode: config.organization, authorizedOrganizations: [{ code: config.organization }] };
const ordinaryPrivate = /\/api\/(?:account|resource|order(?:-item)?|document)\//;
const reject = (operation, code) => assert.rejects(operation, { code });

{
  const calls = [];
  await resolveCoreAccount(context, async (url) => {
    calls.push(new URL(url).pathname);
    return json(url.includes("basic-info") ? basicInfo : { resultSize: 1, result: [row] });
  });
  assert.deepEqual(calls, ["/core/api/user/basic-info.json", "/core-acct/api/tagged/account/list.json"]);

  for (const status of [401, 403, 404, 500]) {
    const failed = [];
    await assert.rejects(() => resolveCoreAccount(context, async (url) => {
      failed.push(new URL(url).pathname);
      return url.includes("basic-info") ? json(basicInfo) : json({}, status);
    }));
    assert.deepEqual(failed, calls, `tagged Account HTTP ${status} never triggers ordinary CRUD fallback`);
  }
  await reject(() => resolveCoreAccount(context, async (url) => json(url.includes("basic-info") ? basicInfo : { resultSize: 1, result: [{ ...row, user: null }] })), "customer-scope-mismatch");
}

{
  const calls = [];
  const result = await loadCustomerAccountProfile(context, async (url, options) => {
    calls.push({ path: new URL(url).pathname, options });
    return json({ resultSize: 1, result: [row] });
  });
  assert.equal(result.account.id, account);
  assert.equal(calls[0].path, "/core-acct/api/tagged/account/list.json");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], config.organization);
  for (const status of [401, 403, 404, 500]) {
    const failed = [];
    await assert.rejects(() => loadCustomerAccountProfile(context, async (url) => { failed.push(new URL(url).pathname); return json({}, status); }));
    assert.deepEqual(failed, ["/core-acct/api/tagged/account/list.json"]);
  }
  const spaCalls = [];
  const spa = { ...context, config: { ...config, vertical: "beauty" } };
  await resolveCoreAccount(spa, async (url) => { spaCalls.push(new URL(url).pathname); return json(url.includes("basic-info") ? basicInfo : { resultSize: 1, result: [row] }); });
  await loadCustomerAccountProfile(spa, async (url) => { spaCalls.push(new URL(url).pathname); return json({ resultSize: 1, result: [{ ...row, user: null }] }); });
  assert.deepEqual(spaCalls, ["/core/api/user/basic-info.json", "/core-acct/api/account/list.json", "/core-acct/api/account/list.json"], "shared adapters preserve the existing Spa transport and projection semantics");
}

{
  const calls = [];
  const properties = createCoreSnowPropertiesAdapter({ fetch: async (url) => {
    calls.push(new URL(url).pathname);
    return json({ resultSize: 1, result: [{ id: 8, attributes: { 153: { ACCOUNT: { value: account } } } }] });
  } });
  const result = await properties.load("properties", context);
  assert.equal(result.items.length, 1);
  assert.equal(result.scopeMode, "server-scoped", "a tagged Resource list retains an independent Account relation check");
  assert.deepEqual(calls, ["/core-rm/api/tagged/resource/list.json"]);
  const failed = [];
  await reject(() => createCoreSnowPropertiesAdapter({ fetch: async (url) => { failed.push(new URL(url).pathname); return json({}, 403); } }).load("properties", context), "customer-forbidden");
  assert.deepEqual(failed, calls);
}

{
  const property = { id: 8, attributes: { 153: { ACCOUNT: { value: account }, ADDRESS: { value: 1008 } } } };
  const linked = { id: account, user: { id: user }, addresses: [{ address: { id: 1008, address1: "12 Test Walk" } }, { address: { id: 999, address1: "Unrelated billing address" } }] };
  const read = async (accountReply, calls, status = 200, ctx = context) => createCoreSnowPropertiesAdapter({ fetch: async (url, options) => {
    const path = new URL(url).pathname;
    calls.push(path);
    assert.equal(ordinaryPrivate.test(path) || path.includes("/api/address/"), false, "property addresses come through the tagged Account relation only");
    if (path === "/core-rm/api/tagged/resource/list.json") return json({ resultSize: 1, result: [property] });
    assert.equal(path, "/core-acct/api/tagged/account/get.json");
    assert.equal(new URL(url).searchParams.get("id"), String(account));
    const mappings = JSON.parse(options.body);
    assert.ok(Array.isArray(mappings) && mappings.some((mapping) => mapping.name === "user") && mappings.some((mapping) => mapping.name === "addresses"));
    return json(accountReply, status);
  } }).load("properties", ctx);
  const calls = [];
  const ready = await read(linked, calls);
  assert.equal(ready.items[0].address, "12 Test Walk");
  assert.deepEqual(calls, ["/core-rm/api/tagged/resource/list.json", "/core-acct/api/tagged/account/get.json"]);
  assert.equal((await read({ ...linked, addresses: [] }, [])).items[0].address, "", "missing Account address relation stays missing");
  assert.equal((await read({ ...linked, addresses: [{ address: { id: 999, address1: "Unrelated" } }] }, [])).items[0].address, "", "only addresses named by owned property ADDRESS IDs can be joined");
  for (const invalid of [{ ...linked, id: 999 }, { ...linked, user: { id: 999 } }, { ...linked, user: null }]) {
    await reject(() => read(invalid, []), "customer-forbidden");
  }
  const denied = [];
  await reject(() => read({}, denied, 403), "customer-forbidden");
  assert.deepEqual(denied, calls, "a denied Account relation never falls back to global Address reads");
  await reject(() => read(linked, [], 200, { ...context, state: { ...context.state, session: { ...context.state.session, userId: null } } }), "session-user-required");
}

{
  const calls = [];
  const order = { id: 91, account: { id: account }, type: { code: "WINTER_SERVICES_ORDER" }, states: [{ code: "QUOTE_SENT" }], items: [] };
  let denyLines = false;
  const adapter = createCoreSnowQuotesAdapter({ fetch: async (url, options) => {
    const path = new URL(url).pathname;
    calls.push(path);
    assert.equal(ordinaryPrivate.test(path), false, "Snow private transport never falls back to an ordinary endpoint");
    if (path === "/core/api/document-type/list.json") return json({ resultSize: 1, result: [{ id: 17, code: "SERVICE_AGREEMENT" }] });
    if (path === "/core/api/tagged/document/list.json") return json({ resultSize: 0, result: [] });
    if (path === "/core-bill/api/tagged/order/list.json") return json({ resultSize: 1, result: [order] });
    if (path === "/core-bill/api/tagged/order-item/list.json") {
      assert.equal(JSON.parse(options.body).filters.find((filter) => filter.property === "order.id").value, "91");
      return denyLines ? json({}, 403) : json({ resultSize: 0, result: [] });
    }
    if (path === "/core-bill/api/tagged/order/get.json") return json({ ...order, account: { id: 999 } });
    if (path === "/core/api/tagged/document/get.json") return json({ id: 17, type: { code: "SERVICE_AGREEMENT" }, attributes: { 17: { CLIENT: { value: 999 } } } });
    if (path.endsWith("/send-event.json")) return json({}, 403);
    throw new Error("Unexpected request " + path);
  } });
  const result = await adapter.load("proposals", context);
  assert.deepEqual(result.orderItems, [], "authorized parent Orders do not synthesize access to individually denied OrderItems");
  assert.equal(calls.some((path) => path.includes("/core-pim/")), false, "omitted lines never cause catalog or generic OrderItem fallback");
  denyLines = true;
  const denied = await adapter.load("proposals", context);
  assert.equal(denied.orderItems, null, "an unauthorized line read stays unavailable rather than becoming an empty successful read");
  assert.equal(denied.reads.orderItems.state, "unauthorized");
  await reject(() => adapter.readOrder(91, context), "customer-forbidden");
  await reject(() => adapter.readAgreement(17, context), "customer-forbidden");
  await reject(() => adapter.sendOrderEvent(91, "QUOTE_SENT-QUOTE_VIEWED", context), "customer-forbidden");
  await reject(() => adapter.sendAgreementEvent(17, "SENT_TO_CLIENT-CLIENT_APPROVED", context), "customer-forbidden");
  assert.equal(calls.filter((path) => path.endsWith("/send-event.json")).length, 2, "refused commands are sent once, without automatic retry or ordinary event fallback");
}

console.log("snow-tagged-api-check ok: tagged private bootstrap/profile/resources/quotes/events, independent line authorization, foreign/missing-user guards, refusal without CRUD fallback, and unchanged Spa transport");
