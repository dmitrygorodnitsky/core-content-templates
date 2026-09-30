import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { exportSeoPublicManual } from "./export-seo-public-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const fixture = path.join(root, "scripts/fixtures/seo-public-authored.test.json");
const outputDir = await fs.mkdtemp(path.join(root, ".seo-public-manual-check-"));
const productionInput = path.join(root, ".seo-public-manual-production-input.json");
const productionOutput = path.join(root, ".seo-public-manual-production-package");
const productionAsset = path.join(root, ".seo-public-manual-production-hero.png");
const stagingOutput = path.join(root, ".seo-public-manual-staging-package");
const stagingCatalogSnapshot = path.join(root, ".seo-public-manual-staging-catalog.json");

try {
  const result = await exportSeoPublicManual({ inputPath: fixture, outputDir, mode: "test" });
  const expected = [
    "README.md", "cms-family.payload.json", "composition.resolved.json", "head.html", "html.html", "javascript.js",
    "manual-export-manifest.json", "page-context.source.json", "parameters.json", "preview.html",
    "root/css.css", "root/head.html", "root/html.html", "root/javascript.js", "root/parameters.json", "root/template.json",
  ];
  assert.deepEqual(await files(outputDir), expected, "manual package inventory is exact");

  const template = JSON.parse(await fs.readFile(path.join(outputDir, "root/template.json"), "utf8"));
  const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manual-export-manifest.json"), "utf8"));
  const preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");
  const readme = await fs.readFile(path.join(outputDir, "README.md"), "utf8");
  assert.equal(template.code, "CUSTOMER_PORTAL_SEO_PUBLIC");
  assert.equal(template.templateLanguage, "JTE");
  assert.deepEqual(template.parameters, []);
  assert.match(template.head, /<link rel="canonical" href="https:\/\/seo-public\.test\/hvac\/austin-test-district">/);
  assert.match(template.head, /noindex,nofollow/);
  assert.match(template.head, /FAQPage/);
  assert.match(template.html, /data-module="seo-public-header"/);
  assert.match(template.html, /data-module="seo-faq"/);
  assert.match(template.html, /data-content-authority="public-authored-test"/);
  assert.match(template.html, /Why Northstar Home Test Fixture/);
  assert.doesNotMatch(template.html, /Why Aircove|photo report/);
  assert.doesNotMatch(template.head, /runtime\/styles|public\/src\/seo-public\.js/);
  assert.match(template.css, /manual export source: runtime\/styles\/seo\.css/);
  assert.match(template.javascript, /data-seo-enhanced/);
  assert.match(preview, /data-theme="hvac"/);
  assert.match(readme, /must never be uploaded or published/);
  assert.equal(manifest.uploadPerformed, false);
  assert.equal(manifest.mode, "test");
  assert.equal(manifest.classification, "public-authored-test");
  assert.equal(manifest.launchState, "review-required");
  assert.ok(Object.values(manifest.package.sha256).every((value) => /^[a-f0-9]{64}$/.test(value)));
  await assert.rejects(
    () => exportSeoPublicManual({ inputPath: fixture, outputDir: path.join(root, ".seo-public-manual-production-reject"), mode: "production" }),
    /classification/,
  );
  await assert.rejects(
    () => exportSeoPublicManual({ inputPath: fixture, outputDir: path.join(root, "dist/manual-upload/customer-portal-seo-public"), mode: "test" }),
    /must not write the production manual package path/,
  );
  const productionPayload = JSON.parse((await fs.readFile(fixture, "utf8")).replaceAll("seo-public.test", "northstar-portal.dev"));
  productionPayload.classification = "public-authored";
  productionPayload.content.hero.media = {
    url: "https://northstar-portal.dev/assets/customer-portal/hero.png",
    alt: "Production export asset check",
  };
  await fs.writeFile(productionInput, JSON.stringify(productionPayload, null, 2) + "\n", "utf8");
  await fs.writeFile(productionAsset, "asset-check", "utf8");
  await fs.writeFile(stagingCatalogSnapshot, JSON.stringify({
    organization: "NORTHSTAR_STAGING",
    organizationId: 42,
    currency: "USD",
    products: [{ code: "NORTHSTAR_SERVICE" }],
  }, null, 2) + "\n", "utf8");
  await exportSeoPublicManual({
    inputPath: productionInput,
    outputDir: productionOutput,
    mode: "production",
    assets: [{ sourcePath: productionAsset, outputPath: "hero.png", publicUrl: "https://northstar-portal.dev/assets/customer-portal/hero.png" }],
  });
  const productionTemplate = JSON.parse(await fs.readFile(path.join(productionOutput, "root/template.json"), "utf8"));
  const productionPreview = await fs.readFile(path.join(productionOutput, "preview.html"), "utf8");
  const productionAssets = JSON.parse(await fs.readFile(path.join(productionOutput, "assets-manifest.json"), "utf8"));
  assert.doesNotMatch(productionTemplate.head, /noindex,nofollow/);
  assert.match(productionTemplate.html, /data-content-authority="public-authored"/);
  assert.match(productionTemplate.html, /https:\/\/northstar-portal\.dev\/assets\/customer-portal\/hero\.png/);
  assert.match(productionPreview, /src="assets\/hero\.png"/);
  assert.equal(productionAssets[0].publicUrl, "https://northstar-portal.dev/assets/customer-portal/hero.png");
  assert.equal((await fs.readFile(path.join(productionOutput, "assets/hero.png"), "utf8")), "asset-check");
  assert.equal((JSON.parse(await fs.readFile(path.join(productionOutput, "manual-export-manifest.json"), "utf8"))).launchState, "review-required");
  await exportSeoPublicManual({
    inputPath: productionInput,
    outputDir: stagingOutput,
    mode: "staging",
    assets: [{ sourcePath: productionAsset, outputPath: "hero.png", publicUrl: "https://northstar-portal.dev/assets/customer-portal/hero.png" }],
    catalogSnapshotPath: stagingCatalogSnapshot,
  });
  const stagingTemplate = JSON.parse(await fs.readFile(path.join(stagingOutput, "root/template.json"), "utf8"));
  const stagingManifest = JSON.parse(await fs.readFile(path.join(stagingOutput, "manual-export-manifest.json"), "utf8"));
  const stagingReadme = await fs.readFile(path.join(stagingOutput, "README.md"), "utf8");
  assert.match(stagingTemplate.head, /noindex,nofollow/);
  assert.match(stagingTemplate.html, /Staging preview - not for indexing or production publication/);
  assert.equal(stagingManifest.mode, "staging");
  assert.equal(stagingManifest.launchState, "staging-only");
  assert.equal(stagingManifest.catalogSnapshot.organization, "NORTHSTAR_STAGING");
  assert.match(await fs.readFile(path.join(stagingOutput, "catalog-snapshot.source.json"), "utf8"), /NORTHSTAR_SERVICE/);
  assert.match(stagingReadme, /Upload it only to staging/);
  await assert.rejects(
    () => exportSeoPublicManual({ inputPath: productionInput, outputDir: path.join(root, "dist/manual-upload/customer-portal-seo-public"), mode: "staging" }),
    /must not overwrite the production or reference manual package path/,
  );
  await assert.rejects(
    () => exportSeoPublicManual({ inputPath: productionInput, outputDir: path.join(root, "dist/manual-upload/customer-portal-seo-public-reference"), mode: "production" }),
    /must not overwrite the reference package path/,
  );
  console.log("seo-public-manual-check ok: exact package, isolated assets, and test/staging/production boundary");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.rm(path.join(root, ".seo-public-manual-production-reject"), { recursive: true, force: true });
  await fs.rm(productionInput, { force: true });
  await fs.rm(productionAsset, { force: true });
  await fs.rm(stagingCatalogSnapshot, { force: true });
  await fs.rm(productionOutput, { recursive: true, force: true });
  await fs.rm(stagingOutput, { recursive: true, force: true });
}

async function files(directory, relative = "") {
  const target = path.join(directory, relative);
  const result = [];
  for (const name of (await fs.readdir(target)).sort()) {
    const item = path.join(relative, name);
    const stat = await fs.stat(path.join(directory, item));
    if (stat.isDirectory()) result.push(...await files(directory, item));
    else result.push(item);
  }
  return result;
}
