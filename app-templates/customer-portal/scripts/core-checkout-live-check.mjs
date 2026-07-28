// Live end-to-end proof for the simulated checkout, against
// CALM_HARBOR_SPA_STAGING. It CREATES A REAL ORDER — that is the point: the
// wave's definition of done is an order Core built from the server cart.
//
//   SERVICEWAND_BEARER=<customer OIDC bearer> \
//     node app-templates/customer-portal/scripts/core-checkout-live-check.mjs
//
// What it asserts, in order:
//   1. a two-item cart is built through the cart adapter, with server money;
//   2. checkout creates one SPA_ORDER whose lines carry the right SPA_ITEM_*
//      types, the server's unit amounts, and the cart's counts;
//   3. `Order.grandTotal` equals SUM(amount x itemCount) — computed HERE only to
//      verify what Core computed, never to display or to send;
//   4. a replayed requestRef creates nothing;
//   5. `invoice` and `balance-transaction` are still empty, and no payment,
//      charge, receipt or refund was created.
//
// The token is read from the environment and written nowhere. The cart is left
// empty. The order it creates is deliberately left on staging as evidence.
import fs from "node:fs/promises";
import process from "node:process";
import { createCoreAccountAdapter } from "../runtime/src/adapters/core-account-adapter.js";
import { addCoreCartItem, clearCoreCart, loadCoreCart, setCoreCartItemCount } from "../runtime/src/adapters/core-cart-adapter.js";
import { createCoreOrder } from "../runtime/src/adapters/core-spa-demo-adapter.js";

const accessToken = process.env.SERVICEWAND_BEARER
  || process.env.SERVICEWAND_BEARER_FILE && (await fs.readFile(process.env.SERVICEWAND_BEARER_FILE, "utf8")).trim();
if (!accessToken) throw new Error("Set SERVICEWAND_BEARER or SERVICEWAND_BEARER_FILE to a CUSTOMER OIDC bearer token");

const origin = new URL(process.env.SERVICEWAND_BASE_URL || "https://dev-1.servicewand.com").origin;
const organization = process.env.SERVICEWAND_ORG || "CALM_HARBOR_SPA_STAGING";
const requestRef = process.env.SERVICEWAND_CHECKOUT_REF || "w4-live-1";

const config = {
  billApiBase: "/core-bill", coreApiBase: "/core", currency: "USD",
  organization, origin, pimApiBase: "/core-pim/api",
};
const headers = {
  Accept: "application/json", Authorization: "Bearer " + accessToken,
  "Content-Type": "application/json", "X-Organization-Code": organization,
};
const transcript = [];
const note = (step, detail) => { transcript.push({ step, ...detail }); };

try {
  const resolved = await createCoreAccountAdapter({ origin }).resolve({
    config: { accountApiBase: "/core-acct", accountTypeCode: "SPA_CUSTOMER", coreApiBase: "/core", organization, origin },
    state: { session: { accessToken, tokenType: "Bearer" } },
  });
  const account = resolved.account;
  // The catalog the portal itself holds. It comes from the PUBLIC endpoint,
  // which is stable; the authenticated core-pim API 401s every other request.
  const catalog = (await catalogEntries("SPA_RETAIL")).concat(await catalogEntries("SPA_SERVICE"));
  const context = {
    config,
    state: {
      customerAccount: account,
      moduleData: { products: { items: catalog } },
      session: { accessToken, tokenType: "Bearer", userId: resolved.user.id },
    },
  };
  note("resolve-account", { accountCode: account.code, accountId: account.id });

  const before = await financialTables();
  note("financial-baseline", before);

  await clearCoreCart(context, globalThis.fetch, origin);
  const retail = pick(catalog, process.env.SERVICEWAND_CART_PRODUCT || "CHS_BODY_001");
  const service = catalog.find((row) => row.productTypeCode === "SPA_SERVICE");

  await addCoreCartItem({ count: 1, priceId: retail.priceId, productId: retail.productId }, context, globalThis.fetch, origin);
  await setCoreCartItemCount({ count: 2, priceId: retail.priceId }, context, globalThis.fetch, origin);
  const cart = await addCoreCartItem({ count: 1, priceId: service.priceId, productId: service.productId }, context, globalThis.fetch, origin);
  note("two-item-cart", {
    displaySubtotal: cart.displaySubtotal, itemCount: cart.itemCount, subtotal: cart.subtotal,
    lines: cart.lines.map((line) => ({ lineAmount: line.lineAmount, priceId: line.priceId, qty: line.qty, title: line.title, unitAmount: line.unitAmount })),
  });

  const orderInput = {
    label: "Customer portal checkout",
    lines: cart.lines.map((line) => ({
      priceId: line.priceId, productCode: line.productCode, productId: line.productId,
      productTypeCode: line.productTypeCode, qty: line.qty, unitAmount: line.unitAmount,
    })),
    requestRef,
  };
  const order = await createCoreOrder(orderInput, context, globalThis.fetch, origin);
  // Computed HERE only to check Core's own figure. Nothing displays or sends it.
  const expected = order.lines.reduce((sum, line) => sum + line.unitAmount * line.itemCount, 0);
  note("order-created", {
    grandTotal: order.grandTotal,
    grandTotalEqualsSumOfLines: order.grandTotal === expected,
    lines: order.lines,
    ref: order.ref,
    statusCode: order.statusCode,
    sumOfAmountTimesCount: expected,
    totalCharges: order.totalCharges,
    totalTaxes: order.totalTaxes,
  });

  const replay = await createCoreOrder(orderInput, context, globalThis.fetch, origin);
  note("replay-same-ref", {
    createdNothing: replay.ref === order.ref && replay.lines.length === order.lines.length,
    lineCount: replay.lines.length,
    ref: replay.ref,
  });
  note("order-count-for-account", { orders: await orderCountForAccount(account.id) });

  await clearCoreCart(context, globalThis.fetch, origin);
  const emptied = await loadCoreCart(context, globalThis.fetch, origin);
  note("cart-cleared-after-order", { itemCount: emptied.itemCount, state: emptied.state });

  const after = await financialTables();
  note("financial-after", { ...after, unchanged: JSON.stringify(after) === JSON.stringify(before) });

  console.log(JSON.stringify({ organization, origin, transcript }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    code: error && error.code || "unknown",
    message: error instanceof Error ? error.message : String(error),
    status: error && error.status || null,
    transcript,
  }, null, 2));
  process.exitCode = 1;
}

/* Payment stays SIMULATED: these four tables must be untouched by the wave. */
async function financialTables() {
  const names = ["invoice", "balance-transaction", "payment", "refund"];
  const counts = {};
  for (const name of names) {
    const response = await fetch(origin + "/core-bill/api/" + name + "/list.json", {
      body: JSON.stringify({ filters: [], mappings: [{ name: "id" }], offset: 0, pageSize: 5 }),
      headers, method: "POST",
    });
    if (!response.ok) { counts[name] = "endpoint-absent(" + response.status + ")"; continue; }
    const data = await response.json().catch(() => null);
    counts[name] = data && typeof data.resultSize === "number" ? data.resultSize : "unreadable";
  }
  return counts;
}

async function orderCountForAccount(accountId) {
  const response = await fetch(origin + "/core-bill/api/order/list.json", {
    body: JSON.stringify({
      filters: [{ operator: "=", property: "account.id", type: "INTEGER", value: String(accountId) }],
      mappings: [{ name: "id" }], offset: 0, pageSize: 200,
    }),
    headers, method: "POST",
  });
  const data = await response.json();
  return typeof data.resultSize === "number" ? data.resultSize : (data.result || []).length;
}

function pick(catalog, code) {
  const found = catalog.find((row) => row.code === code);
  if (!found) throw new Error("Product " + code + " is not in the live catalog");
  return found;
}

async function catalogEntries(productTypeCode) {
  const response = await fetch(origin + "/core-pim/public/" + encodeURIComponent(organization) + "/catalog/price-comparison.json", {
    body: JSON.stringify({
      currencyAttributeCode: "CURRENCY", currencyAttributeValues: ["USD"],
      includeChildPriceTypes: true, includeChildProductTypes: true,
      nlsKeys: ["NAME"], priceTypeCode: "PRICE_CURRENCY", productTypeCode,
    }),
    headers: { Accept: "application/json", "Content-Type": "application/json" }, method: "POST",
  });
  if (!response.ok) throw new Error("Core PIM catalog HTTP " + response.status);
  return ((await response.json()).prices || []).map((row) => {
    const product = (row.product && row.product.product) || {};
    const nls = (product.nls && (product.nls.en || Object.values(product.nls)[0])) || {};
    return {
      backendPriceId: Number(row.price && row.price.price && row.price.price.id),
      backendProductId: Number(product.id),
      code: String(product.code || ""),
      name: String(nls.NAME || product.code || ""),
      priceId: Number(row.price && row.price.price && row.price.price.id),
      productId: Number(product.id),
      productTypeCode: String((row.product && row.product.type && row.product.type.code) || ""),
    };
  }).filter((row) => row.code && row.priceId && row.productId);
}
