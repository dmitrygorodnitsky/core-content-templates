import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { exportCalmHarborPortalManual } from "./export-calm-harbor-portal-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const outputDir = path.join(root, ".calm-harbor-portal-manual-check");

try {
  await fs.rm(outputDir, { recursive: true, force: true });
  await exportCalmHarborPortalManual({ outputDir });
  const template = JSON.parse(await fs.readFile(path.join(outputDir, "root/template.json"), "utf8"));
  const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manual-export-manifest.json"), "utf8"));
  const readme = await fs.readFile(path.join(outputDir, "README.md"), "utf8");

  assert.equal(template.code, "CUSTOMER_PORTAL_CALM_HARBOR_PIM_STAGING");
  assert.equal(template.templateLanguage, "JTE");
  assert.deepEqual(template.parameters, []);
  assert.doesNotMatch(template.head, /<script|assets\/customer-portal/);
  assert.match(template.html, /data-portal-data-mode="live"/);
  assert.match(template.html, /data-portal-enabled-modules="pricing,products"/);
  assert.match(template.html, /data-portal-pim-organization="CALM_HARBOR_SPA_STAGING"/);
  assert.doesNotMatch(template.head + template.html + template.css, /\/Users\/|\.\.\/runtime/);
  assert.equal(manifest.uploadPerformed, false);
  assert.equal(manifest.launchState, "staging-only");
  assert.equal(manifest.runtime.sameOriginRequired, true);
  assert.equal(manifest.runtime.delivery, "inline-template-javascript");
  assert.deepEqual(manifest.runtime.openedModules, ["pricing", "products"]);
  assert.match(template.javascript, /Manual CMS runtime for the Calm Harbor staging catalog/);
  assert.match(template.javascript, /catalog\/price-comparison\.json/);
  assert.match(template.javascript, /credentials: "omit"/);
  assert.doesNotMatch(template.javascript, /^\s*import\s/m);
  assert.doesNotMatch(template.javascript, /fixture|mock/i);
  assert.doesNotMatch(template.javascript, /assets\/customer-portal/);
  assert.doesNotMatch(readme, /assets-manifest|Upload every file under/);
  assert.match(readme, /no static asset upload is required/);
  assert.match(readme, /same-origin only/);
  assert.match(readme, /\/core-pim\/public\/CALM_HARBOR_SPA_STAGING\/catalog\/price-comparison\.json/);
  assert.doesNotMatch(readme, /\/core-pim\/api\/public\//);
  assert.equal(await exists(path.join(outputDir, "assets")), false);
  assert.equal(await exists(path.join(outputDir, "root/css.css")), true);
  assert.equal(await exists(path.join(outputDir, "root/javascript.js")), true);
  console.log("calm-harbor-portal-manual-check ok: JTE root, live PIM scope, and inline CMS runtime");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
}

async function exists(target) {
  try { await fs.access(target); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}
