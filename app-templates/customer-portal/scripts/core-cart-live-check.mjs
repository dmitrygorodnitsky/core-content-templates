// Live probe for the server cart against CALM_HARBOR_SPA_STAGING.
//
// Needs a real CUSTOMER portal session: `/api/cart/current` is account-bound on
// the server, and the admin deploy key does not reproduce that binding.
//
//   SERVICEWAND_BEARER=<customer OIDC bearer> \
//     node app-templates/customer-portal/scripts/core-cart-live-check.mjs
//
// The token is read from the environment and never written anywhere. The probe
// leaves the cart as it found it: it clears what it added.
import fs from "node:fs/promises";
import process from "node:process";
import { createCoreAccountAdapter } from "../runtime/src/adapters/core-account-adapter.js";
import {
  addCoreCartItem,
  clearCoreCart,
  loadCoreCart,
  removeCoreCartItem,
  setCoreCartItemCount,
} from "../runtime/src/adapters/core-cart-adapter.js";

const accessToken = process.env.SERVICEWAND_BEARER
  || process.env.SERVICEWAND_BEARER_FILE && (await fs.readFile(process.env.SERVICEWAND_BEARER_FILE, "utf8")).trim();
if (!accessToken) throw new Error("Set SERVICEWAND_BEARER or SERVICEWAND_BEARER_FILE to a CUSTOMER OIDC bearer token");

const origin = new URL(process.env.SERVICEWAND_BASE_URL || "https://dev-1.servicewand.com").origin;
const organization = process.env.SERVICEWAND_ORG || "CALM_HARBOR_SPA_STAGING";
const productCode = process.env.SERVICEWAND_CART_PRODUCT || "CHS_BODY_001";
const foreignAccountId = Number(process.env.SERVICEWAND_FOREIGN_ACCOUNT || 2099);

const config = { billApiBase: "/core-bill", currency: "USD", organization, origin };
const transcript = [];
const note = (step, detail) => { transcript.push({ step, ...detail }); };

try {
  const account = await createCoreAccountAdapter({ origin }).resolve({
    config: { accountApiBase: "/core-acct", accountTypeCode: "SPA_CUSTOMER", coreApiBase: "/core", organization, origin },
    state: { session: { accessToken, tokenType: "Bearer" } },
  });
  note("resolve-account", { accountCode: account.account.code, accountId: account.account.id });

  const catalog = await retailCatalog();
  const target = catalog.find((row) => row.code === productCode);
  if (!target) throw new Error("Product " + productCode + " is not in the live retail catalog");
  note("resolve-product", { code: target.code, priceId: target.priceId, productId: target.productId });

  const context = {
    config,
    state: {
      customerAccount: account.account,
      moduleData: { products: { items: catalog.map((row) => ({ code: row.code, id: row.productId, name: row.name })) } },
      session: { accessToken, tokenType: "Bearer" },
    },
  };

  const before = await loadCoreCart(context, globalThis.fetch, origin);
  note("read-cart", summarize(before));

  const added = await addCoreCartItem({ count: 1, priceId: target.priceId, productId: target.productId }, context, globalThis.fetch, origin);
  note("add-item", summarize(added));

  const counted = await setCoreCartItemCount({ count: 2, priceId: target.priceId }, context, globalThis.fetch, origin);
  const line = counted.byRef["cart-line-" + target.priceId];
  note("change-count-to-2", {
    ...summarize(counted),
    // Proof the figures are Core's: the portal never multiplied anything.
    lineAmountFromServer: line && line.lineAmount,
    unitAmountFromServer: line && line.unitAmount,
  });

  const replayed = await setCoreCartItemCount({ count: 2, priceId: target.priceId }, context, globalThis.fetch, origin);
  note("replay-same-count", { ...summarize(replayed), quantityUnchanged: replayed.byRef["cart-line-" + target.priceId].qty === 2 });

  const removed = await removeCoreCartItem({ priceId: target.priceId }, context, globalThis.fetch, origin);
  note("remove-item", summarize(removed));

  const cleared = await clearCoreCart(context, globalThis.fetch, origin);
  note("clear-cart", summarize(cleared));

  // The one endpoint in this tenant with real row-level enforcement.
  const foreign = { ...context, state: { ...context.state, customerAccount: { code: "FOREIGN", id: foreignAccountId } } };
  note("foreign-account-read", await expectFailure(() => loadCoreCart(foreign, globalThis.fetch, origin)));

  const anonymous = { ...context, state: { ...context.state, customerAccount: null } };
  note("no-account-read", await expectFailure(() => loadCoreCart(anonymous, globalThis.fetch, origin)));

  console.log(JSON.stringify({ organization, origin, transcript }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    cause: error && error.cause ? String(error.cause.code || error.cause.message || error.cause) : null,
    code: error && error.code || "unknown",
    message: error instanceof Error ? error.message : String(error),
    status: error && error.status || null,
    transcript,
  }, null, 2));
  process.exitCode = 1;
}

function summarize(cart) {
  return {
    currencyCode: cart.currencyCode,
    displaySubtotal: cart.displaySubtotal,
    itemCount: cart.itemCount,
    lines: cart.lines.map((line) => ({
      displayTotal: line.displayTotal, displayUnitPrice: line.displayUnitPrice,
      lineAmount: line.lineAmount, qty: line.qty, ref: line.ref, title: line.title, unitAmount: line.unitAmount,
    })),
    scopeMode: cart.scopeMode,
    state: cart.state,
    subtotal: cart.subtotal,
  };
}

async function expectFailure(run) {
  try {
    await run();
    return { refused: false };
  } catch (error) {
    return { code: error && error.code || "unknown", refused: true, status: error && error.status || null };
  }
}

/* The public catalog is the same one the portal reads, so the ids used here are
   the ids a customer would actually be adding. */
async function retailCatalog() {
  const url = origin + "/core-pim/public/" + encodeURIComponent(organization) + "/catalog/price-comparison.json";
  const response = await fetch(url, {
    body: JSON.stringify({
      currencyAttributeCode: "CURRENCY",
      currencyAttributeValues: ["USD"],
      includeChildPriceTypes: true,
      includeChildProductTypes: true,
      nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"],
      priceTypeCode: "PRICE_CURRENCY",
      productTypeCode: "SPA_RETAIL",
    }),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error("Core PIM catalog HTTP " + response.status);
  const data = await response.json();
  // The catalog wraps both sides once more: `product.product` is the Product
  // itself and `product.type` is its SPA_* type; `price.price` is the
  // ProductPrice. `price.display.amount` is the server-formatted figure.
  return (Array.isArray(data && data.prices) ? data.prices : []).map((row) => {
    const product = (row.product && row.product.product) || {};
    return {
      code: String(product.code || ""),
      displayAmount: row.price && row.price.display && row.price.display.amount,
      name: localizedName(product.nls) || String(product.code || ""),
      priceId: Number(row.price && row.price.price && row.price.price.id),
      productId: Number(product.id),
      productTypeCode: String((row.product && row.product.type && row.product.type.code) || ""),
    };
  }).filter((row) => row.code && row.priceId && row.productId);
}

function localizedName(nls) {
  const entry = nls && (nls.en || nls["en-US"] || Object.values(nls)[0]);
  return entry && String(entry.NAME || entry.name || "") || "";
}
