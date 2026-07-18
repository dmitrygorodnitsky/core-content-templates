import assert from "node:assert/strict";
import { createCoreOrdersAdapter, coreOrdersContract } from "../runtime/src/adapters/core-orders-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: { origin, organization: "CALM_HARBOR_SPA_STAGING", billApiBase: "/core-bill" },
  state: { session: { accessToken: "test-token", tokenType: "Bearer" }, customerAccount: { id: 1042 } },
};

{
  const calls = [];
  const adapter = createCoreOrdersAdapter({ origin, fetch: async (url, options) => {
    calls.push({ url, options });
    return json({ resultSize: 1, result: [{
      id: 7001, optimistic: 2, notes: "CHS_STG_ORDER_1042", grandTotal: 145, totalCharges: 145, totalTaxes: 0,
      account: { id: 1042 }, currency: { id: 1, code: "USD", nls: { en: { NAME: "US Dollar" } } },
      type: { id: 3, code: "SPA_SERVICE_ORDER", nls: { en: { NAME: "Spa service order" } } },
    created: "2026-07-17T12:00:00.000Z", states: [{ id: 9, code: "OPEN", nls: { en: { NAME: "Open" } } }],
    }] });
  } });
  const result = await adapter.load("orders", context);
  assert.equal(result.state, "ready");
  assert.equal(result.accountId, 1042);
  assert.equal(result.items.length, 1);
  assert.deepEqual(result.items[0], {
    ref: "order-core-7001", reference: "order-core-7001",
    id: 7001, optimistic: 2, notes: "CHS_STG_ORDER_1042", grandTotal: 145, totalCharges: 145, totalTaxes: 0,
    currency: { code: "USD", label: "US Dollar" }, type: { code: "SPA_SERVICE_ORDER", label: "Spa service order" },
    states: [{ id: 9, code: "OPEN", label: "Open" }], statusCode: "OPEN",
    customerStatus: "OPEN", kind: "MIXED", placedAt: "Jul 17, 2026", itemSummary: "Spa service order",
    displayTotal: "$145.00", displayCurrency: "USD", attention: null, allowedActions: [], lines: [],
    money: { subtotal: "$145.00", tax: "$0.00", total: "$145.00", currency: "USD" }, paymentMode: "SIMULATED",
    fulfillment: null, relatedAppointments: [], relatedPlan: null,
  });
  assert.equal(calls[0].url, origin + "/core-bill/api/order/list.json");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], "CALM_HARBOR_SPA_STAGING");
  const request = JSON.parse(calls[0].options.body);
  assert.deepEqual(request.filters, [{ type: "INTEGER", operator: "=", property: "account.id", value: "1042" }]);
  assert.deepEqual(request.mappings, coreOrdersContract.mappings);
  assert.deepEqual(request.sorting, [{ field: "id", direction: "DESC" }]);
}

await rejectsWith("customer-account-required", async () => {
  const missing = structuredClone(context); delete missing.state.customerAccount;
  await createCoreOrdersAdapter({ origin, fetch: async () => json({}) }).load("orders", missing);
});
await rejectsWith("order-scope-mismatch", async () => {
  await createCoreOrdersAdapter({ origin, fetch: async () => json({ result: [{ id: 1, account: { id: 999 } }] }) }).load("orders", context);
});
await rejectsWith("orders-forbidden", async () => {
  await createCoreOrdersAdapter({ origin, fetch: async () => ({ ok: false, status: 403, async json() { return {}; } }) }).load("orders", context);
});

console.log("core-orders-adapter-check ok: read-only Core Bill Orders retain resolved Account scope");

function json(value) { return { ok: true, status: 200, async json() { return structuredClone(value); } }; }
async function rejectsWith(code, operation) { await assert.rejects(operation, function (error) { return error && error.code === code; }); }
