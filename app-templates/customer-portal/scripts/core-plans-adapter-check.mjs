import assert from "node:assert/strict";
import { corePlansContract, loadCorePlans } from "../runtime/src/adapters/core-plans-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: {
    billApiBase: "/core-bill",
    coreApiBase: "/core",
    organization: "CALM_HARBOR_SPA_STAGING",
    origin,
    serviceApiBase: "/core-svc",
  },
  state: {
    customerAccount: { code: "CHS_STG_ELENA_RIOS", id: 1 },
    session: { accessToken: "test-token", tokenType: "Bearer", userId: 33 },
  },
};

const enrollmentType = { code: "SPA_PLAN_ENROLLMENT", id: 12 };
const activePackage = {
  attributes: {
    12: {
      CREDITS_TOTAL: { value: 5 },
      CREDITS_USED: { value: 1 },
      CUSTOMER_ACCOUNT: { value: 1 },
      SOURCE_ORDER: { value: 8 },
      VALID_UNTIL: { value: "2027-07-26" },
    },
  },
  code: "CHS_STG_ENROLLMENT_ACTIVE",
  id: 10,
  nls: { en: { NAME: "Harbor reset series" } },
  optimistic: 2,
  states: [{ code: "ACTIVE" }],
  type: enrollmentType,
};
const exhaustedPackage = {
  ...activePackage,
  attributes: {
    12: { CREDITS_TOTAL: { value: 3 }, CREDITS_USED: { value: 3 }, CUSTOMER_ACCOUNT: { value: 1 }, SOURCE_ORDER: { value: 8 } },
  },
  code: "CHS_STG_ENROLLMENT_EXHAUSTED",
  id: 11,
  nls: { en: { NAME: "Skin ritual trio" } },
  states: [{ code: "EXHAUSTED" }],
};
const foreignPackage = {
  ...activePackage,
  attributes: { 12: { CREDITS_TOTAL: { value: 5 }, CREDITS_USED: { value: 0 }, CUSTOMER_ACCOUNT: { value: 2099 } } },
  code: "CHS_STG_ENROLLMENT_FOREIGN",
  id: 12,
};
const membership = {
  account: { code: "CHS_STG_ELENA_RIOS", id: 1 },
  autoRenew: true,
  id: 5,
  optimistic: 0,
  order: { id: 9 },
  period: 1,
  startsOn: [2026, 7, 26],
  states: [{ code: "ACTIVE" }],
  unit: { code: "MONTH", id: 70 },
};
// `amount` on the line is the unit price Core multiplies by itemCount; the
// recurring rate shown on a plan comes from the catalog price behind it.
// Prices use the SYSTEM types: UNIT_PRICE is a decimal in major units (group 1
// = PER_UNIT), CURRENCY is a Dictionary reference (group 2 = PRICE_CURRENCY),
// and INTERVAL carries its own unit (group 4 = RECURRENT).
const membershipLine = {
  amount: 18,
  id: 4,
  itemPrice: {
    id: 21,
    attributes: {
      1: { UNIT_PRICE: { value: 18 } },
      2: { CURRENCY: { value: 17 } },
      4: { INTERVAL: { unit: 55, value: 1 }, USAGE_TYPE: { value: "Licensed" } },
    },
    product: { code: "CHS_HARBOR_MEMBERSHIP", id: 23, nls: { en: { NAME: "Harbor membership" } } },
  },
  order: { id: 9 },
  type: { code: "SPA_ITEM_MEMBERSHIP", id: 15 },
};
const usdDictionary = { code: "USD", id: 17 };
const monthUnit = { code: "MONTH", id: 55 };

{
  const calls = [];
  const result = await loadCorePlans(context, route(calls, {
    "/project/list.json": { result: [activePackage, exhaustedPackage, foreignPackage], resultSize: 3 },
    "/subscription/list.json": { result: [membership], resultSize: 1 },
    "/order-item/list.json": { result: [membershipLine], resultSize: 1 },
    "/dictionary/list.json": { result: [usdDictionary] },
    "/unit/list.json": { result: [monthUnit] },
  }), origin);

  assert.equal(result.state, "ready");
  assert.equal(result.scopeMode, "customer-filtered-client-side");
  assert.equal(result.items.length, 3, "two packages and one membership");

  const [active, exhausted, plan] = result.items;
  assert.equal(active.kind, "PACKAGE");
  assert.equal(active.status, "Active");
  assert.equal(active.remainingUses, 4, "remaining is total minus used, never stored twice");
  assert.equal(active.totalUses, 5);
  assert.equal(active.expiresAt, "Jul 26, 2027");
  assert.deepEqual(active.allowedActions, ["bookWithCredit"]);
  assert.equal(active.sourcePurchase, "order-core-8");

  assert.equal(exhausted.status, "Used up");
  assert.equal(exhausted.remainingUses, 0);
  assert.deepEqual(exhausted.allowedActions, [], "a used-up package offers no credit booking");
  assert.equal(exhausted.expiresAt, null, "an absent expiry is omitted, never guessed");

  assert.equal(plan.kind, "MEMBERSHIP");
  assert.equal(plan.status, "Active");
  assert.equal(plan.title, "Harbor membership", "the title comes from the product behind the price");
  assert.equal(plan.displayRecurringPrice, "$18 / month",
    "UNIT_PRICE plus the resolved Dictionary currency and the interval unit");
  assert.equal(plan.remainingUses, null, "a membership never gets a guessed visit balance");
  assert.equal(plan.totalUses, null);
  assert.equal(plan.renewsAt, null, "no nextBillingAt means no invented renewal date");
  assert.deepEqual(plan.allowedActions, ["cancelRenewal"]);

  {
    // No catalog price behind the line means no rate is shown — never a guess.
    const priceless = await loadCorePlans(context, route([], {
      "/project/list.json": { result: [] },
      "/subscription/list.json": { result: [membership] },
      "/order-item/list.json": { result: [{ ...membershipLine, itemPrice: { id: 21 } }] },
      "/dictionary/list.json": { result: [] },
      "/unit/list.json": { result: [] },
    }), origin);
    assert.equal(priceless.items[0].displayRecurringPrice, null);
  }

  assert.ok(!result.items.some((item) => item.title === activePackage.nls.en.NAME && item.ref.endsWith("-12")),
    "another customer's enrollment must not reach the UI");
  const projectBody = JSON.parse(calls.find((call) => call.url.includes("/project/list.json")).options.body);
  assert.deepEqual(projectBody.filters, [{ type: "STRING", operator: "=", property: "type.code", value: "SPA_PLAN_ENROLLMENT" }]);
  assert.deepEqual(projectBody.mappings, corePlansContract.enrollmentMappings);
}

{
  // Without a resolved customer account nothing is read and nothing is shown.
  const calls = [];
  const bare = { ...context, state: { ...context.state, customerAccount: {} } };
  const result = await loadCorePlans(bare, route(calls, {}), origin);
  assert.equal(result.state, "empty");
  assert.equal(result.items.length, 0);
  assert.equal(calls.length, 0, "no plan read may run before the customer is resolved");
}

{
  // A membership with auto-renew off offers no cancellation.
  const result = await loadCorePlans(context, route([], {
    "/project/list.json": { result: [] },
    "/subscription/list.json": { result: [{ ...membership, autoRenew: false }] },
    "/order-item/list.json": { result: [membershipLine] },
    "/dictionary/list.json": { result: [usdDictionary] },
    "/unit/list.json": { result: [monthUnit] },
  }), origin);
  assert.deepEqual(result.items[0].allowedActions, []);
}

{
  // A workflow state outside the approved vocabulary must fail loudly rather
  // than reach the UI with a guessed label.
  await assert.rejects(
    () => loadCorePlans(context, route([], {
      "/project/list.json": { result: [{ ...activePackage, states: [{ code: "EXPIRED" }] }] },
      "/subscription/list.json": { result: [] },
    }), origin),
    (error) => error && error.code === "plan-status-unmapped",
  );
}

await assert.rejects(
  () => loadCorePlans(context, async () => ({ ok: false, status: 401, async json() { return {}; } }), origin),
  (error) => error && error.code === "session-expired",
);

await assert.rejects(
  () => loadCorePlans(context, async () => ({ ok: false, status: 403, async json() { return {}; } }), origin),
  (error) => error && error.code === "customer-forbidden",
);

console.log("core-plans-adapter-check ok: packages and memberships normalize into one customer-scoped plan list");

function route(calls, table) {
  return async function (url, options) {
    if (Array.isArray(calls)) calls.push({ options, url });
    const key = Object.keys(table).find((suffix) => url.includes(suffix));
    if (!key) throw new Error("unexpected request: " + url);
    const value = table[key];
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  };
}
