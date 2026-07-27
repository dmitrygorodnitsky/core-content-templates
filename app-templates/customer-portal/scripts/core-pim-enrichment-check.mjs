import assert from "node:assert/strict";
import { corePimAdapter } from "../runtime/src/adapters/core-pim-adapter.js";
import { normalizeProducts } from "../runtime/src/normalizers/index.js";

const requests = [];
globalThis.window = {
  fetch: async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes("/public/")) return response({ prices: [
      pimPrice(5, "CHS_BODY_001", "Harbor body oil", 42),
      pimPrice(7, "CHS_BODY_002", "Restorative body cream", 36),
    ] });
    if (String(url).endsWith("/api/product-model/list.json")) return response({ result: [{
      id: 11,
      code: "CHS_MODEL_TIDELINE_BODY",
      nls: { en: { NAME: "Tideline body collection" } },
      variants: { 2: ["FORMAT", "VOLUME_ML", "SCENT_PROFILE"] },
      products: [{ id: 5, code: "CHS_BODY_001" }, { id: 7, code: "CHS_BODY_002" }, { id: 99, code: "FOREIGN_PRODUCT" }],
    }] });
    if (String(url).endsWith("/api/product-review/list.json")) return response({ result: [
      review(101, "CHS_BODY_001", "PUBLISHED", 5, true),
      review(102, "CHS_BODY_001", "PENDING", 4, true),
      review(103, "CHS_BODY_002", "PUBLISHED", 9, false),
    ] });
    return response({}, 404);
  },
};

const raw = await corePimAdapter.load("products", {
  config: {
    dataMode: "live",
    organization: "CALM_HARBOR_SPA_STAGING",
    pimApiBase: "/core-pim/api",
    pimOrganization: "CALM_HARBOR_SPA_STAGING",
    pimEnrichmentMode: "current-api",
    pimProductsProductTypeCodes: ["SPA_RETAIL"],
    pimPriceTypeCode: "SPA_STANDARD_PRICE",
    pimPriceAttributeCode: "INTERVAL",
    pimPriceAttributeValues: ["ONE_TIME"],
    pimCurrencyAttributeCode: "CURRENCY",
    pimCurrencyAttributeValues: ["USD"],
    pimCurrency: "USD",
  },
  state: { session: { accessToken: "test-token", tokenType: "Bearer" } },
});
const normalized = normalizeProducts(raw);

assert.equal(normalized.items.length, 2);
assert.match(normalized.items[0].ref, /^product-[a-z0-9]+$/);
assert.doesNotMatch(normalized.items[0].ref, /CHS_BODY|\b5\b/);
assert.deepEqual(normalized.items[0].media, [], "current API exposes no approved media URL, so the gallery remains honestly empty");
assert.deepEqual(normalized.items[0].variantFacts, [
  { label: "Format", value: "Body oil" },
  { label: "Size", value: "100 ml" },
  { label: "Scent", value: "Cedar leaf and soft citrus" },
]);
assert.equal(normalized.models.length, 1);
assert.deepEqual(normalized.models[0].productCodes, ["CHS_BODY_001", "CHS_BODY_002"]);
assert.deepEqual(normalized.models[0].variantAttributes, ["FORMAT", "VOLUME_ML", "SCENT_PROFILE"]);
assert.equal(normalized.reviews.length, 1, "only valid PUBLISHED reviews are exposed");
assert.match(normalized.reviews[0].ref, /^product-review-[a-z0-9]+$/);
assert.doesNotMatch(normalized.reviews[0].ref, /101|CHS_REVIEW/);
assert.equal(normalized.reviews[0].verified, true);
assert.match(normalized.items[0].modelRef, /^product-model-[a-z0-9]+$/);
assert.doesNotMatch(normalized.items[0].modelRef, /11|CHS_MODEL/);
assert.equal(normalized.items[0].reviews.length, 1);
assert.deepEqual(normalized.enrichment, { models: "ready", reviews: "ready" });

const privateRequests = requests.filter((request) => request.url.includes("/api/product-"));
assert.equal(privateRequests.length, 2);
privateRequests.forEach((request) => {
  assert.equal(request.options.headers.Authorization, "Bearer test-token");
  assert.equal(request.options.headers["X-Organization-Code"], "CALM_HARBOR_SPA_STAGING");
});

const reviewPayload = JSON.parse(privateRequests.find((request) => request.url.includes("product-review"))?.options.body || "{}");
assert.ok(reviewPayload.mappings.some((mapping) => mapping.name === "states"), "review state must be requested for publication filtering");
assert.ok(reviewPayload.mappings.some((mapping) => mapping.name === "attributes"), "typed review attributes must be requested");

const privateRequestCount = privateRequests.length;
const closed = await corePimAdapter.load("products", {
  config: {
    pimApiBase: "/core-pim/api",
    pimOrganization: "CALM_HARBOR_SPA_STAGING",
    pimProductsProductTypeCodes: ["SPA_RETAIL"],
    pimEnrichmentMode: "closed",
  },
  state: { session: { accessToken: "test-token", tokenType: "Bearer" } },
});
assert.deepEqual(closed.pimEnrichment, { models: "unavailable", reviews: "unavailable" });
assert.equal(requests.filter((request) => request.url.includes("/api/product-")).length, privateRequestCount, "closed mode must not call generic private list APIs");

console.log("core-pim-enrichment-check ok: ProductModel groups products and only valid PUBLISHED ProductReview rows are exposed");

function response(json, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return json; } };
}

function pimPrice(id, code, name, amount) {
  return {
    price: { display: { amount, currency: "USD", intervalLabel: "ONE_TIME" } },
    product: { product: { id, code, nls: { en: { NAME: name } }, attributes: { 8: {
      FORMAT: { value: "Body oil" },
      VOLUME_ML: { value: 100 },
      SCENT_PROFILE: { value: "Cedar leaf and soft citrus" },
    } } }, type: { code: "SPA_RETAIL" } },
  };
}

function review(id, productCode, state, rating, verified) {
  return {
    id,
    product: { code: productCode },
    states: [{ code: state }],
    updated: "2026-07-22T10:00:00.000Z",
    attributes: { 12: {
      AUTHOR_NAME: { value: "Elena R." },
      BODY: { value: "A calm and carefully considered experience." },
      RATING: { value: rating },
      REVIEW_KEY: { value: "internal-key-must-not-leak" },
      TITLE: { value: "Quiet and thoughtful" },
      VERIFIED: { value: verified },
    } },
  };
}
