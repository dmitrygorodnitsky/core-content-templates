import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const casesRoot = path.resolve("app-templates/customer-portal/content/cases");
const files = ["calm-harbor-spa.catalog-concept.json", "luma-beauty-studio.catalog-concept.json"];
const expectedSeoServiceIds = {
  "calm-harbor-spa": ["chs-grounding-massage", "chs-custom-facial", "chs-harbor-reset", "chs-seasonal-body-ritual"],
  "luma-beauty-studio": ["lbs-signature-cut", "lbs-lived-in-color", "lbs-skin-reset"],
};
const publicLandingFiles = {
  "calm-harbor-spa": "calm-harbor-spa.public-authored.json",
  "luma-beauty-studio": "luma-beauty-studio.public-authored.json",
};
const forbiddenKeys = new Set(["price", "currency", "duration", "availability", "inventory", "stock", "media", "image", "images", "bookable"]);

for (const file of files) {
  const catalog = JSON.parse(await fs.readFile(path.join(casesRoot, file), "utf8"));
  assert.equal(catalog.schemaVersion, 1, file + " has schemaVersion 1");
  assert.equal(catalog.classification, "concept-catalog", file + " is a concept catalog");
  assert.equal(catalog.launchState, "concept", file + " cannot be treated as launch data");
  assert.equal(catalog.vertical, "beauty", file + " stays in the beauty vertical");
  assert.ok(Array.isArray(catalog.services) && catalog.services.length >= 4, file + " has an MVP-capable service catalog");
  assert.ok(Array.isArray(catalog.products) && catalog.products.length >= 5, file + " has retail candidates");
  assertUnique(catalog.services, "id", file + " service ids");
  assertUnique(catalog.products, "id", file + " product ids");
  assertUnique(catalog.products, "proposedSku", file + " proposed product SKUs");

  const seoIds = catalog.services.filter((service) => service.publicSurface.includes("seo")).map((service) => service.id);
  assert.deepEqual(seoIds, expectedSeoServiceIds[catalog.brandKey], file + " SEO service selection matches its public authored landing");
  const landing = JSON.parse(await fs.readFile(path.join(casesRoot, publicLandingFiles[catalog.brandKey]), "utf8"));
  assert.deepEqual(landing.content.services.map((service) => service.id), seoIds, file + " public landing uses the catalog's stable service ids");

  for (const service of catalog.services) {
    assert.match(service.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, file + " service id is stable");
    assert.ok(["mvp", "deferred"].includes(service.release), file + " service release is explicit");
    assert.ok(["single", "package", "add-on", "consultation"].includes(service.kind), file + " service kind is known");
    assert.ok(["not-listed", "booking-total", "quote"].includes(service.pricePolicy), file + " service price policy is known");
    assert.equal(service.scheduling.contractState, "not-opened", file + " does not invent scheduling integration");
    assert.deepEqual(service.allowedActions, [], file + " does not enable concept booking actions");
  }
  for (const product of catalog.products) {
    assert.equal(product.release, "deferred", file + " keeps retail products behind the PIM contract");
    assert.equal(product.pim.catalogState, "not-opened", file + " does not claim a product catalog exists");
    assert.deepEqual(product.allowedActions, [], file + " does not enable concept purchase actions");
  }
  assertNoForbiddenFacts(catalog, file);
}

console.log("catalog-concept-check ok: 2 beauty concept catalogs, 8 MVP services, and deferred PIM retail candidates");

function assertUnique(items, key, label) {
  const values = items.map((item) => item[key]);
  assert.equal(new Set(values).size, values.length, label + " are unique");
}

function assertNoForbiddenFacts(value, label, currentPath = "") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenFacts(item, label, currentPath + "[" + index + "]"));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    const itemPath = currentPath ? currentPath + "." + key : key;
    assert.equal(forbiddenKeys.has(key), false, label + " must not contain dynamic fact " + itemPath);
    assertNoForbiddenFacts(item, label, itemPath);
  }
}
