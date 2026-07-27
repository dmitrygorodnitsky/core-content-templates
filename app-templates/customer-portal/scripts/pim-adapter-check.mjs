import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { corePimAdapter } from "../runtime/src/adapters/core-pim-adapter.js";
import { normalizePricing, normalizeProducts } from "../runtime/src/normalizers/index.js";

const fixturePath = path.resolve("docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json");

globalThis.window = {
  fetch: globalThis.fetch.bind(globalThis),
};

const server = http.createServer(async (req, res) => {
  if (req.url !== "/saas.json") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const body = await fs.readFile(fixturePath);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(body);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const fixtureUrl = `http://127.0.0.1:${address.port}/saas.json`;

try {
  const context = {
    config: {
      dataMode: "live",
      pimFixtureUrl: fixtureUrl,
      pimCurrency: "CAD",
      pimProductTypeCode: "SERVICEWAND_SAAS",
    },
  };
  const pricingRaw = await corePimAdapter.load("pricing", context);
  const pricing = normalizePricing(pricingRaw);
  if (!pricing.plans.length || pricing.source !== "core-pim") {
    throw new Error("Pricing PIM normalization failed");
  }

  const productsRaw = await corePimAdapter.load("products", context);
  const products = normalizeProducts(productsRaw);
  if (!products.items.length || products.source !== "core-pim") {
    throw new Error("Products PIM normalization failed");
  }

  console.log(`pim-adapter ok: ${pricing.plans.length} plans`);
} finally {
  await new Promise((resolve) => server.close(resolve));
}

// ---------------------------------------------------------------------------
// Sellability from inventory (W4 / C2)
//
// Three products, three stock cases, one rule: only a `SPA_STOCK` inventory row
// may say a product is buyable.
//   CHS_BODY_001  inventory count 12  -> sellable,     cart.addItem open
//   CHS_SKIN_002  inventory count 0   -> out-of-stock, cart.addItem closed
//   CHS_BODY_002  no inventory row    -> unknown,      cart.addItem closed
// All three carry a published price, so a price can never be mistaken for the
// reason one of them is buyable.
//
// This check is the ONLY guard on the zero-stock case. Verified live on staging
// 2026-07-28: `POST /api/cart/current/items.json` with `CHS_SKIN_002` — count 0
// — returns `200` and Core creates the line. The cart API does not consult
// inventory, so nothing downstream will catch an out-of-stock add. Read the
// assertions below as a product guarantee, not as belt-and-braces over a
// server that would refuse anyway.
//
// Unknown stock is also the dominant live case, not an edge: the staging
// catalog publishes 12 `SPA_RETAIL` products and inventory holds two rows.
// ---------------------------------------------------------------------------

const PRODUCT_IDS = { CHS_BODY_001: 5, CHS_BODY_002: 7, CHS_SKIN_002: 9 };

const stocked = await loadWithInventory([
  inventoryRow(41, PRODUCT_IDS.CHS_BODY_001, "CHS_BODY_001", 12),
  inventoryRow(42, PRODUCT_IDS.CHS_SKIN_002, "CHS_SKIN_002", 0),
]);
const bySellability = stocked.products;

assert.equal(bySellability.CHS_BODY_001.sellability, "sellable", "count 12 is in stock");
assert.ok(bySellability.CHS_BODY_001.allowedActions.includes("cart.addItem"), "an in-stock product can be bought");

assert.equal(bySellability.CHS_SKIN_002.sellability, "out-of-stock", "count 0 is out of stock, and Core said so");
assert.ok(
  !bySellability.CHS_SKIN_002.allowedActions.includes("cart.addItem"),
  "a zero-stock product must be unbuyable — the cart API returns 200 for it, so this is the only refusal",
);

assert.equal(bySellability.CHS_BODY_002.sellability, "unknown", "no inventory row is unknown stock, not in stock");
assert.notEqual(bySellability.CHS_BODY_002.sellability, "out-of-stock", "unknown stock must not claim the shelf is empty");
assert.ok(!bySellability.CHS_BODY_002.allowedActions.includes("cart.addItem"), "unknown stock leaves the buy action closed");

assert.deepEqual(stocked.enrichment, { models: "ready", reviews: "ready", inventory: "ready" });

// Sellability is not inferred from anything the catalog says. All three rows
// carry a finite price and the same product state; only stock separates them.
const priced = Object.values(bySellability).every((product) => Number.isFinite(product.priceNum) && product.priceNum > 0);
assert.ok(priced, "every fixture product is priced, so price presence cannot explain the three outcomes");
assert.equal(new Set(Object.values(bySellability).map((product) => product.sellability)).size, 3, "three distinct outcomes from stock alone");

// The inventory read must narrow by `type.code` — a real relation column Core
// filters on. A filter on `attributes.*` returns 200 with zero rows, which
// would silently read as "nothing is in stock".
const inventoryRequests = stocked.requests.filter((request) => request.url.endsWith("/api/inventory/list.json"));
assert.equal(inventoryRequests.length, 1, "inventory is read exactly once per catalog load");
const inventoryPayload = JSON.parse(inventoryRequests[0].options.body || "{}");
assert.deepEqual(inventoryPayload.filters, [{ type: "STRING", operator: "=", property: "type.code", value: "SPA_STOCK" }]);
assert.ok(!JSON.stringify(inventoryPayload.filters).includes("attributes."), "Core cannot filter dynamic attributes and fails silently");
assert.ok(inventoryPayload.mappings.some((mapping) => mapping.name === "count"), "the stock count must be requested");
assert.deepEqual(
  inventoryPayload.mappings.find((mapping) => mapping.name === "product"),
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "product", type: "identifier" },
  "the join key is the product relation id, requested in the identifier form",
);
assert.equal(inventoryRequests[0].options.headers.Authorization, "Bearer test-token");
assert.equal(inventoryRequests[0].options.headers["X-Organization-Code"], "CALM_HARBOR_SPA_STAGING");

// A foreign inventory type must not lend its stock to a spa product, and a row
// whose count Core did not return says nothing at all.
const ignored = await loadWithInventory([
  Object.assign(inventoryRow(43, PRODUCT_IDS.CHS_BODY_002, "CHS_BODY_002", 99), { type: { id: 3, code: "WAREHOUSE_STOCK" } }),
  { id: 44, product: { id: PRODUCT_IDS.CHS_SKIN_002, code: "CHS_SKIN_002" }, type: { id: 2, code: "SPA_STOCK" } },
]);
assert.equal(ignored.products.CHS_BODY_002.sellability, "unknown", "a non-SPA_STOCK row is not this catalogue's stock");
assert.equal(ignored.products.CHS_SKIN_002.sellability, "unknown", "a row without a count carries no stock truth");

// When inventory cannot be read, nothing is sellable. Never assume availability.
const failed = await loadWithInventory(null);
assert.equal(failed.enrichment.inventory, "error");
Object.values(failed.products).forEach((product) => {
  assert.equal(product.sellability, "unknown", "a failed inventory read leaves every product unknown");
  assert.ok(!product.allowedActions.includes("cart.addItem"), "a failed inventory read closes every buy action");
});

// Enrichment closed: no inventory call at all, and still nothing claimed.
const closed = await loadProducts({ pimEnrichmentMode: "closed" }, () => response({}, 404));
assert.equal(closed.enrichment.inventory, "unavailable");
assert.ok(!closed.requests.some((request) => request.url.includes("/api/inventory/")), "closed enrichment must not call the inventory API");
Object.values(closed.products).forEach((product) => {
  assert.equal(product.sellability, "unknown");
  assert.ok(!product.allowedActions.includes("cart.addItem"));
});

console.log("pim-adapter sellability ok: in-stock buyable, zero-stock unbuyable, no-row unknown and closed");

async function loadWithInventory(rows) {
  return loadProducts({ pimEnrichmentMode: "current-api" }, (url) => {
    if (!String(url).endsWith("/api/inventory/list.json")) return response({ result: [] });
    if (rows === null) return response({}, 500);
    return response({ result: rows });
  });
}

async function loadProducts(configOverrides, privateHandler) {
  const requests = [];
  globalThis.window = {
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      if (String(url).includes("/public/")) {
        return response({ prices: [
          pimPrice(PRODUCT_IDS.CHS_BODY_001, "CHS_BODY_001", "Harbor body oil", 42),
          pimPrice(PRODUCT_IDS.CHS_BODY_002, "CHS_BODY_002", "Restorative body cream", 36),
          pimPrice(PRODUCT_IDS.CHS_SKIN_002, "CHS_SKIN_002", "Sea mineral serum", 58),
        ] });
      }
      return privateHandler(url, options);
    },
  };
  const raw = await corePimAdapter.load("products", {
    config: Object.assign({
      dataMode: "live",
      pimApiBase: "/core-pim/api",
      pimOrganization: "CALM_HARBOR_SPA_STAGING",
      pimProductsProductTypeCodes: ["SPA_RETAIL"],
      pimCurrency: "USD",
    }, configOverrides),
    state: { session: { accessToken: "test-token", tokenType: "Bearer" } },
  });
  const normalized = normalizeProducts(raw);
  const products = {};
  normalized.items.forEach((product) => { products[product.code] = product; });
  return { products, enrichment: normalized.enrichment, requests };
}

function inventoryRow(id, productId, productCode, count) {
  return { id, count, product: { id: productId, code: productCode }, type: { id: 2, code: "SPA_STOCK" } };
}

function pimPrice(id, code, name, amount) {
  return {
    price: { display: { amount, currency: "USD", intervalLabel: "ONE_TIME" } },
    product: { product: { id, code, nls: { en: { NAME: name } }, attributes: {} }, type: { code: "SPA_RETAIL" } },
  };
}

function response(json, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return json; } };
}
