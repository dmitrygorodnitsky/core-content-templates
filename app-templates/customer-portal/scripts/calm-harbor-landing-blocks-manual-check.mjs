import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { exportCalmHarborLandingBlocksManual } from "./export-calm-harbor-landing-blocks-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const outputDir = await fs.mkdtemp(path.join(root, "dist/manual-upload/.calm-harbor-landing-blocks-"));

try {
  await exportCalmHarborLandingBlocksManual({ outputDir });
  const payload = await readJson("cms-family.payload.json");
  const composition = await readJson("composition.resolved.json");
  const manifest = await readJson("manual-export-manifest.json");
  const readme = await fs.readFile(path.join(outputDir, "README.md"), "utf8");
  const preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");

  assert.equal(payload.root.code, "CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING");
  assert.equal(payload.root.templateLanguage, "JTE");
  assert.match(payload.root.head, /application\/ld\+json/);
  assert.ok(payload.root.parameters.some(function (parameter) { return parameter.code === "ROOT_FAQ_JSON_LD" && parameter.type === "LOCALIZED_JSON_OBJECT"; }));
  assert.equal(payload.children.length, 13);
  assert.deepEqual(composition.children.map(function (child) { return child.position; }), Array.from({ length: 13 }, function (_, index) { return index + 1; }));
  assert.deepEqual(composition.children.map(function (child) { return child.module; }), ["public-nav", "hero", "trust", "services", "how", "proof", "pricing-pim", "products-pim", "service-area", "reviews", "faq", "final-cta", "footer"]);
  for (const child of payload.children) {
    assert.equal(child.parent.code, payload.root.code, child.code + " must point at the landing root");
    assert.equal(child.templateLanguage, "JTE");
    assert.ok(child.parameters.length > 0, child.code + " must expose CMS parameters");
  }
  const pricing = payload.children.find(function (child) { return child.code === "CHS_LANDING_07_PRICING_PIM"; });
  const products = payload.children.find(function (child) { return child.code === "CHS_LANDING_08_PRODUCTS_PIM"; });
  assert.match(pricing.html, /data-pim-kind="pricing"/);
  assert.match(products.html, /data-pim-kind="products"/);
  assert.doesNotMatch(pricing.html, /\$145|\$130|CHS_GROUNDING_MASSAGE/);
  assert.doesNotMatch(products.html, /CHS_BODY_001|Gentle cleansing balm/);
  assert.match(payload.root.javascript, /credentials: "omit"/);
  assert.doesNotMatch(payload.root.javascript, /authorization|bearer|localStorage/i);
  assert.match(readme, /13 independently editable child templates/);
  assert.deepEqual((await fs.readdir(path.join(outputDir, "assets"))).sort(), ["spa-massage-1448.webp", "spa-room-1600.webp"]);
  assert.equal(manifest.assets.length, 2);
  assert.doesNotMatch(preview, /\$\{[A-Z0-9_]+@[A-Z_]+\}/, "preview must resolve every CMS parameter");
  assert.match(preview, /"@type":"FAQPage"/);
  console.log("calm-harbor-landing-blocks-manual-check ok: root, child order, assets, and live PIM boundary");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
}

async function readJson(name) {
  return JSON.parse(await fs.readFile(path.join(outputDir, name), "utf8"));
}
