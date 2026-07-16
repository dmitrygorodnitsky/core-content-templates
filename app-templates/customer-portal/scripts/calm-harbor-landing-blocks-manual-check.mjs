import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { exportCalmHarborLandingBlocksManual } from "./export-calm-harbor-landing-blocks-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const designStyles = path.join(root, "design-inbox", "styles");
const outputDir = await fs.mkdtemp(path.join(root, "dist/manual-upload/.calm-harbor-landing-blocks-"));

try {
  await exportCalmHarborLandingBlocksManual({ outputDir });
  const payload = await readJson("cms-family.payload.json");
  const composition = await readJson("composition.resolved.json");
  const manifest = await readJson("manual-export-manifest.json");
  const readme = await fs.readFile(path.join(outputDir, "README.md"), "utf8");
  const preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");
  const sourceCss = await readSourceCss();

  assert.equal(payload.root.code, "CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING");
  assert.equal(payload.root.templateLanguage, "JTE");
  assert.match(payload.root.head, /application\/ld\+json/);
  assert.match(payload.root.head, /fonts\.googleapis\.com\/css2\?family=Manrope/);
  assert.ok(payload.root.parameters.some(function (parameter) { return parameter.code === "ROOT_FAQ_JSON_LD" && parameter.type === "LOCALIZED_JSON_OBJECT"; }));
  assert.equal(payload.children.length, 13);
  assert.match(payload.root.html, /data-module="app-shell" data-visual-id="app-shell"/);
  assert.match(payload.root.html, /cms-child-slot:ROOT_NAV[\s\S]*class="page seo-page"[\s\S]*cms-child-slot:ROOT_SECTIONS/);
  assert.ok(payload.root.css.length < 32 * 1024, "root CSS must stay below the CMS field safety budget");
  assertRootCssContract(payload.root.css, sourceCss);
  assert.deepEqual(composition.children.map(function (child) { return child.position; }), Array.from({ length: 13 }, function (_, index) { return index + 1; }));
  assert.deepEqual(composition.children.map(function (child) { return child.module; }), ["public-nav", "hero", "trust", "services", "how", "proof", "pricing-pim", "products-pim", "service-area", "reviews", "faq", "final-cta", "footer"]);
  assert.deepEqual(composition.slots.ROOT_NAV, ["CHS_LANDING_01_PUBLIC_NAV"]);
  assert.equal(composition.slots.ROOT_SECTIONS.length, 12);
  for (const child of payload.children) {
    assert.equal(child.parent.code, payload.root.code, child.code + " must point at the landing root");
    assert.equal(child.templateLanguage, "JTE");
    assert.ok(child.parameters.length > 0, child.code + " must expose CMS parameters");
  }
  for (const child of payload.children.filter(function (child) { return child.code !== "CHS_LANDING_01_PUBLIC_NAV"; })) {
    assert.ok(child.css.length > 100, child.code + " must carry its section CSS");
  }
  const pricing = payload.children.find(function (child) { return child.code === "CHS_LANDING_07_PRICING_PIM"; });
  const products = payload.children.find(function (child) { return child.code === "CHS_LANDING_08_PRODUCTS_PIM"; });
  assert.match(pricing.html, /data-pim-kind="pricing"/);
  assert.match(products.html, /data-pim-kind="products"/);
  assert.match(products.css, /\.product-card\s*\{/);
  assertDesignerMarkupContract(payload, preview);
  assertChildCssContract(payload.children, sourceCss);
  assertInlineVisualContract(payload, sourceCss);
  assert.match(payload.children.find(function (child) { return child.code === "CHS_LANDING_04_SERVICES"; }).html, /style="background:rgba\(var\(--accent-rgb\),\.12\)"/);
  assert.doesNotMatch(pricing.html, /\$145|\$130|CHS_GROUNDING_MASSAGE/);
  assert.doesNotMatch(products.html, /CHS_BODY_001|Gentle cleansing balm/);
  assert.match(payload.root.javascript, /credentials: "omit"/);
  assert.doesNotMatch(payload.root.javascript, /authorization|bearer|localStorage/i);
  assert.match(readme, /13 independently editable child templates/);
  assert.deepEqual((await fs.readdir(path.join(outputDir, "assets"))).sort(), ["spa-massage-1448.webp", "spa-room-1600.webp"]);
  assert.equal(manifest.assets.length, 2);
  assert.doesNotMatch(preview, /\$\{[A-Z0-9_]+@[A-Z_]+\}/, "preview must resolve every CMS parameter");
  assert.match(preview, /"@type":"FAQPage"/);
  console.log("calm-harbor-landing-blocks-manual-check ok: root, child order, source CSS contract, assets, and live PIM boundary");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
}

async function readJson(name) {
  return JSON.parse(await fs.readFile(path.join(outputDir, name), "utf8"));
}

async function readSourceCss() {
  const names = ["tokens.css", "base.css", "components.css", "shell.css", "seo.css", "responsive.css", "routes.css"];
  const values = await Promise.all(names.map(async function (name) {
    return [name, (await fs.readFile(path.join(designStyles, name), "utf8")).trim()];
  }));
  const source = Object.fromEntries(values);
  source.fixtures = await fs.readFile(path.join(root, "design-inbox", "data", "fixtures.js"), "utf8");
  source.seoSections = await fs.readFile(path.join(root, "design-inbox", "src", "components", "seo", "SeoSections.js"), "utf8");
  return source;
}

function assertRootCssContract(css, source) {
  ["tokens.css", "base.css", "components.css", "shell.css", "responsive.css"].forEach(function (name) {
    assert.match(css, new RegExp("/\\* design source: design-inbox/styles/" + escapeRegExp(name) + " \\*/"), "root CSS must identify " + name + " as its source");
    assert.ok(css.includes(source[name]), "root CSS must preserve " + name + " verbatim");
  });
  assert.ok(css.includes(before(source["seo.css"], "/* ---------- 1 · hero ---------- */")), "root CSS must preserve the shared SEO foundation verbatim");
  assert.ok(css.includes(between(source["seo.css"], "/* ============================================================\n   Responsive", "/* ============================================================\n   wave 11")), "root CSS must preserve SEO responsive rules verbatim");
  const commerce = between(source["routes.css"], "/* ============================================================\n   WAVE 3 — Commerce", "/* ---- Pricing (data-route=\"pricing\") ---- */");
  assert.ok(css.includes(commerce), "root CSS must preserve shared commerce primitives, including .eyebrow, verbatim");
}

function assertChildCssContract(children, source) {
  const seo = source["seo.css"];
  const routes = source["routes.css"];
  const media = between(seo, "/* ============================================================\n   wave 11", "/* wave 12 · pim.pricing[] rows");
  const pricingDetails = from(seo, "/* wave 12 · pim.pricing[] rows");
  const expected = new Map([
    ["CHS_LANDING_01_PUBLIC_NAV", ""],
    ["CHS_LANDING_02_HERO", join(between(seo, "/* ---------- 1 · hero ---------- */", "/* ---------- 2 · trust strip ---------- */"), media)],
    ["CHS_LANDING_03_TRUST", between(seo, "/* ---------- 2 · trust strip ---------- */", "/* ---------- 3 · services grid ---------- */")],
    ["CHS_LANDING_04_SERVICES", between(seo, "/* ---------- 3 · services grid ---------- */", "/* ---------- 4 · how it works ---------- */")],
    ["CHS_LANDING_05_HOW", between(seo, "/* ---------- 4 · how it works ---------- */", "/* ---------- 5 · proof ---------- */")],
    ["CHS_LANDING_06_PROOF", join(between(seo, "/* ---------- 5 · proof ---------- */", "/* ---------- 6 · pricing ---------- */"), media)],
    ["CHS_LANDING_07_PRICING_PIM", join(between(seo, "/* ---------- 6 · pricing ---------- */", "/* ---------- 7 · service area ---------- */"), pricingDetails)],
    ["CHS_LANDING_08_PRODUCTS_PIM", join(between(routes, "/* ---- Products (data-route=\"products\") ---- */", "/* ---- Checkout (data-route=\"checkout\") ---- */"), media)],
    ["CHS_LANDING_09_SERVICE_AREA", between(seo, "/* ---------- 7 · service area ---------- */", "/* ---------- 8 · reviews ---------- */")],
    ["CHS_LANDING_10_REVIEWS", between(seo, "/* ---------- 8 · reviews ---------- */", "/* ---------- 9 · FAQ ---------- */")],
    ["CHS_LANDING_11_FAQ", between(seo, "/* ---------- 9 · FAQ ---------- */", "/* ---------- 10 · final CTA ---------- */")],
    ["CHS_LANDING_12_FINAL_CTA", between(seo, "/* ---------- 10 · final CTA ---------- */", "/* ---------- 11 · footer ---------- */")],
    ["CHS_LANDING_13_FOOTER", between(seo, "/* ---------- 11 · footer ---------- */", "/* ---------- dev-only CMS meta preview ---------- */")],
  ]);
  for (const child of children) {
    assert.equal(child.css, expected.get(child.code), child.code + " CSS must be an exact design-source fragment");
  }
}

function assertInlineVisualContract(payload, source) {
  const services = payload.children.find(function (child) { return child.code === "CHS_LANDING_04_SERVICES"; });
  const servicePalette = [
    ["var(--accent)", "rgba(var(--accent-rgb),.12)"],
    ["#1f8a44", "rgba(52,199,89,.16)"],
    ["#ff8a3d", "rgba(255,159,10,.16)"],
    ["#7a52e0", "rgba(122,82,224,.16)"],
  ];
  const productTints = [
    ["var(--accent)", "linear-gradient(160deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.32))"],
    ["#1f8a44", "linear-gradient(160deg,#dcf5e2,#bff0cf)"],
    ["#ff8a3d", "linear-gradient(160deg,#ffe9d6,#ffd3ad)"],
    ["#7a52e0", "linear-gradient(160deg,#eee6ff,#d8c6ff)"],
  ];
  assert.match(source.seoSections, /SeoServicesGrid[\s\S]*style: "background:" \+ pal\[1\]/, "service palette must have a designer-owned source");
  assert.match(source.seoSections, /SeoProductsTeaser[\s\S]*style: "background:" \+ tint\[1\]/, "product palette must have a designer-owned source");
  for (const palette of servicePalette) {
    assert.ok(source.fixtures.includes(palette[0]) && source.fixtures.includes(palette[1]), "service palette must originate in design fixtures");
    assert.ok(services.html.includes('style="background:' + palette[1] + '"') && services.html.includes('style="background:' + palette[0] + '"'), "service markup must preserve the design palette");
  }
  for (const tint of productTints) {
    assert.ok(source.fixtures.includes(tint[0]) && source.fixtures.includes(tint[1]), "product tint must originate in design fixtures");
    assert.ok(payload.root.javascript.includes(tint[0]) && payload.root.javascript.includes(tint[1]), "PIM product runtime must preserve the design tint");
  }
}

function assertDesignerMarkupContract(payload, preview) {
  const previewBody = preview.slice(preview.indexOf("<body>"), preview.indexOf("<script>window.__CALM_HARBOR_PREVIEW_PIM="));
  const byCode = new Map(payload.children.map(function (child) { return [child.code, child]; }));
  const nav = byCode.get("CHS_LANDING_01_PUBLIC_NAV");
  const hero = byCode.get("CHS_LANDING_02_HERO");
  const trust = byCode.get("CHS_LANDING_03_TRUST");
  const services = byCode.get("CHS_LANDING_04_SERVICES");
  const reviews = byCode.get("CHS_LANDING_10_REVIEWS");
  const faq = byCode.get("CHS_LANDING_11_FAQ");
  const footer = byCode.get("CHS_LANDING_13_FOOTER");

  assert.match(nav.html, /class="top-nav__brand" data-action="nav\.landing"/);
  assert.doesNotMatch(nav.html, /class="nav-links"|>Services<|>Shop</);
  assert.match(hero.html, /data-module="seo-cta"[\s\S]*data-visual-id="seo-hero-primary-cta"/);
  assert.match(hero.html, /<img class="seo-media__img"[^>]+loading="lazy"/);
  assert.equal(occurrences(trust.html, 'class="seo-trust__item"'), 5, "trust strip must preserve all five designer-owned items");
  assert.equal(occurrences(services.html, 'data-module="seo-service-card"'), 4, "service grid must preserve the Beauty fixture cards");
  assert.equal(occurrences(reviews.html, 'class="seo-review"'), 3, "review collection must preserve the accepted ready state");
  assert.equal(occurrences(faq.html, 'class="seo-faq__item"'), 4, "FAQ must preserve four closed accordion items");
  assert.doesNotMatch(faq.html, /<details|<summary|\sopen(?:\s|>)/);
  assert.equal(occurrences(footer.html, 'data-bind="cms.footer.legal"'), 3, "footer must preserve all three legal links");

  assert.match(previewBody, /class="top-nav-wrap"[\s\S]*class="page seo-page"/);
  assert.doesNotMatch(previewBody, /data-module="seo-meta-preview"|data-dev-toolbar/);
  assert.match(previewBody, />Hair Styling</);
  assert.match(previewBody, />From request to report</);
  assert.match(previewBody, />Ready when you are in Miami, FL</);
  assert.match(preview, /window\.__CALM_HARBOR_PREVIEW_PIM=/);
}

function occurrences(value, needle) { return String(value).split(needle).length - 1; }

function join(left, right) { return left + "\n\n" + right; }

function before(source, marker) {
  const index = source.indexOf(marker);
  assert.ok(index >= 0, "required design CSS marker is missing: " + marker);
  return source.slice(0, index).trim();
}

function from(source, marker) {
  const index = source.indexOf(marker);
  assert.ok(index >= 0, "required design CSS marker is missing: " + marker);
  return source.slice(index).trim();
}

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, "required design CSS markers are missing or out of order: " + startMarker + " -> " + endMarker);
  return source.slice(start, end).trim();
}

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
