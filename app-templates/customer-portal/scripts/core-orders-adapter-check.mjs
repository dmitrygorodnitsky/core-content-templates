import assert from "node:assert/strict";
import { createCoreOrdersAdapter, coreOrdersContract } from "../runtime/src/adapters/core-orders-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: { origin, organization: "CALM_HARBOR_SPA_STAGING", billApiBase: "/core-bill" },
  state: { session: { accessToken: "test-token", tokenType: "Bearer" }, customerAccount: { id: 1042 } },
};

const usd = { id: 1, code: "USD", nls: { en: { NAME: "US Dollar" } } };
const spaOrderType = { id: 3, code: "SPA_ORDER", nls: { en: { NAME: "Spa order" } } };

const serviceOrder = {
  id: 7001, optimistic: 2, notes: "Grounding massage visit", grandTotal: 145, totalCharges: 145, totalTaxes: 0,
  account: { id: 1042 }, currency: usd, type: spaOrderType,
  created: "2026-07-17T12:00:00.000Z", states: [{ id: 9, code: "OPEN", nls: { en: { NAME: "Open" } } }],
};
const serviceLine = {
  id: 11, amount: 145, itemCount: 1, sortOrder: 1, notes: "CHS_GROUNDING_MASSAGE", order: { id: 7001 },
  itemPrice: { id: 51, product: { id: 61, code: "CHS_GROUNDING_MASSAGE", nls: { en: { NAME: "Grounding massage" } } } },
  type: { id: 14, code: "SPA_ITEM_SERVICE" },
};

function ordersFetch(table, calls) {
  return async (url, options) => {
    if (calls) calls.push({ url, options });
    if (url.includes("/order-item/list.json")) return json({ result: table.lines || [] });
    if (url.includes("/shipment/list.json")) return json({ result: table.shipments || [] });
    return json({ resultSize: (table.orders || []).length, result: table.orders || [] });
  };
}

{
  const calls = [];
  const adapter = createCoreOrdersAdapter({ origin, fetch: ordersFetch({ orders: [serviceOrder], lines: [serviceLine] }, calls) });
  const result = await adapter.load("orders", context);
  assert.equal(result.state, "ready");
  assert.equal(result.accountId, 1042);
  assert.equal(result.items.length, 1);
  const purchase = result.items[0];
  assert.equal(purchase.ref, "order-core-7001");
  assert.equal(purchase.customerStatus, "Confirmed", "OPEN maps to the approved customer vocabulary");
  assert.equal(purchase.statusCode, "OPEN");
  assert.equal(purchase.kind, "SERVICE", "kind comes from the line types, not the order type");
  assert.equal(purchase.itemSummary, "Grounding massage");
  assert.equal(purchase.displayTotal, "$145.00");
  assert.equal(purchase.fulfillment, null, "an order without a shipment has no fulfillment dimension");
  // OrderItem.amount is the unit price; Core owns the order total and exposes no
  // per-line total, so the line total is omitted rather than computed here.
  assert.deepEqual(purchase.lines, [{
    ref: "pln-core-11", kind: "SERVICE", title: "Grounding massage", variant: null,
    quantity: 1, displayUnitPrice: "$145.00", displayTotal: null,
  }]);
  assert.equal(calls[0].url, origin + "/core-bill/api/order/list.json");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], "CALM_HARBOR_SPA_STAGING");
  const request = JSON.parse(calls[0].options.body);
  assert.deepEqual(request.filters, [{ type: "INTEGER", operator: "=", property: "account.id", value: "1042" }]);
  assert.deepEqual(request.mappings, coreOrdersContract.mappings);
  assert.deepEqual(request.sorting, [{ field: "id", direction: "DESC" }]);
}

{
  // Lines of different kinds make the purchase MIXED.
  const mixed = { ...serviceOrder, id: 7002, grandTotal: 173, totalCharges: 173 };
  const retailLine = {
    id: 12, amount: 28, itemCount: 1, sortOrder: 2, notes: "CHS_BATH_001", order: { id: 7002 },
    itemPrice: { id: 52, product: { id: 62, code: "CHS_BATH_001", nls: { en: { NAME: "Mineral bath soak" } } } },
    type: { id: 15, code: "SPA_ITEM_RETAIL" },
  };
  const result = await createCoreOrdersAdapter({
    origin,
    fetch: ordersFetch({ orders: [mixed], lines: [{ ...serviceLine, order: { id: 7002 } }, retailLine] }),
  }).load("orders", context);
  assert.equal(result.items[0].kind, "MIXED");
  assert.equal(result.items[0].itemSummary, "Grounding massage · Mineral bath soak");
}

{
  // A ready pickup is a separate dimension that also drives the status shown.
  const retailOrder = { ...serviceOrder, id: 7003, grandTotal: 84, totalCharges: 84,
    states: [{ id: 10, code: "IN_PROGRESS", nls: { en: { NAME: "In progress" } } }] };
  const shipment = {
    id: 1, type: { id: 16, code: "SPA_FULFILLMENT" },
    attributes: { 16: {
      FULFILLMENT_KIND: { value: "PICKUP" }, FULFILLMENT_STATUS: { value: "READY" },
      SOURCE_ORDER: { value: 7003 }, WINDOW_END: { value: Date.parse("2026-07-29T17:00:00.000Z") },
    } },
  };
  const result = await createCoreOrdersAdapter({
    origin,
    fetch: ordersFetch({ orders: [retailOrder], lines: [{ ...serviceLine, order: { id: 7003 }, type: { id: 15, code: "SPA_ITEM_RETAIL" } }], shipments: [shipment] }),
  }).load("orders", context);
  const purchase = result.items[0];
  assert.equal(purchase.customerStatus, "Ready for pickup");
  assert.equal(purchase.statusCode, "IN_PROGRESS", "the raw order state stays visible alongside the label");
  assert.equal(purchase.attention, "Ready — please pick up by Jul 29, 2026");
  assert.deepEqual(purchase.fulfillment, {
    kind: "PICKUP", status: "READY", windowEndLabel: "Jul 29, 2026", windowStartLabel: null,
  });
}

{
  // A shipment belonging to another order must not attach to this purchase.
  const shipment = {
    id: 2, type: { id: 16, code: "SPA_FULFILLMENT" },
    attributes: { 16: { FULFILLMENT_KIND: { value: "PICKUP" }, FULFILLMENT_STATUS: { value: "READY" }, SOURCE_ORDER: { value: 9999 } } },
  };
  const result = await createCoreOrdersAdapter({
    origin,
    fetch: ordersFetch({ orders: [serviceOrder], lines: [serviceLine], shipments: [shipment] }),
  }).load("orders", context);
  assert.equal(result.items[0].fulfillment, null);
  assert.equal(result.items[0].customerStatus, "Confirmed");
}

{
  // An Order with no lines is not a purchase: excluded, but counted.
  const result = await createCoreOrdersAdapter({
    origin,
    fetch: ordersFetch({ orders: [serviceOrder, { ...serviceOrder, id: 7009 }], lines: [serviceLine] }),
  }).load("orders", context);
  assert.equal(result.items.length, 1);
  assert.equal(result.resultSize, 1);
  assert.equal(result.ordersWithoutLines, 1, "the drop is reported, never silent");
  assert.equal(result.accountResultSize, 2);
}

await rejectsWith("order-status-unmapped", async () => {
  // RETURN_REQUESTED has no approved customer label yet; it must not be guessed.
  await createCoreOrdersAdapter({
    origin,
    fetch: ordersFetch({ orders: [{ ...serviceOrder, states: [{ id: 12, code: "RETURN_REQUESTED" }] }], lines: [serviceLine] }),
  }).load("orders", context);
});

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
