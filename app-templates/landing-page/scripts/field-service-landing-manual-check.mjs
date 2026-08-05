import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { exportFieldServiceLandingManual } from "./export-field-service-landing-manual.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.resolve(scriptsDir, "..");
const manualRoot = path.join(landingRoot, "dist/manual-upload");
const expectedCodes = [
  "FIELD_SERVICE_LANDING",
  "SECTION_01_HEADER_CORPORATE_REFERENCE",
  "SECTION_02_HERO_COMPOSITE_PHOTO",
  "SECTION_03_SECTION_H2_NARRATIVE_ONLY",
  "SECTION_04_FEATURES_CARD_GRID_4",
  "SECTION_05_FEATURES_ACCORDION_2COL_NUMBERED",
  "SECTION_06_MOBILE_4_CARD_GLYPH",
  "SECTION_07_SIGNATURE_AI_SHELL",
  "SECTION_08_SECTION_STAGES_LIST",
  "SECTION_09_VERTICALS_GLYPH_GRID_20_SLOTS",
  "COMPARISON",
  "SECTION_11_SECTION_AXES_GRID",
  "SECTION_12_FAQ_BUBBLE_LIGHT_GROUPED",
  "SECTION_13_DECORATIVE_FINAL_CTA",
  "SECTION_14_FOOTER_CORPORATE_REFERENCE",
];

const readJson = async (dir, name) => JSON.parse(await fs.readFile(path.join(dir, name), "utf8"));
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

const listFiles = async (dir, prefix = "") => {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(full, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort();
};

const treeHashes = async (dir) => {
  const out = {};
  for (const file of await listFiles(dir)) out[file] = digest(await fs.readFile(path.join(dir, file)));
  return out;
};

const assertNoLocalPaths = async (dir) => {
  const forbidden = /(?:\/Users\/|Downloads|\.codex\/attachments|[A-Za-z]:\\Users\\)/;
  for (const file of await listFiles(dir)) {
    if (!/\.(?:json|md|html|css|js|mjs|txt)$/.test(file)) continue;
    const text = await fs.readFile(path.join(dir, file), "utf8");
    assert.doesNotMatch(text, forbidden, `${file} must not contain an absolute local path`);
  }
};

const first = await fs.mkdtemp(path.join(manualRoot, ".field-service-check-a-"));
const second = await fs.mkdtemp(path.join(manualRoot, ".field-service-check-b-"));

try {
  await exportFieldServiceLandingManual({ outputDir: first, quiet: true });
  await exportFieldServiceLandingManual({ outputDir: second, quiet: true });

  const payload = await readJson(first, "cms-family.payload.json");
  const manifest = await readJson(first, "manual-export-manifest.json");
  const composition = await readJson(first, "composition.resolved.json");
  const preview = await fs.readFile(path.join(first, "preview.html"), "utf8");
  const templates = [payload.root, ...(payload.children || [])];

  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.root.code, "FIELD_SERVICE_LANDING");
  assert.deepEqual(templates.map((template) => template.code), expectedCodes);
  assert.deepEqual(manifest.templateCodes, expectedCodes);
  assert.equal(payload.children.length, 14);
  assert.equal(composition.appliedContentCodes.length, 260);
  assert.equal(composition.contentSource, "content/field-service-operations/parameter-values.json");
  assert.equal((await listFiles(path.join(first, "children"))).filter((file) => file.endsWith("template.json")).length, 14);
  assert.doesNotMatch(preview, /\$\{[A-Z0-9_]+@[A-Z0-9_]+\}/, "preview must resolve every CMS marker");
  assert.doesNotMatch(JSON.stringify(payload), /\{\{[A-Za-z0-9_-]+\}\}/, "payload must resolve every block marker");
  await assertNoLocalPaths(first);
  assert.deepEqual(await treeHashes(first), await treeHashes(second), "repeat exports must be byte-for-byte deterministic");

  execFileSync(process.execPath, [path.join(scriptsDir, "upload-cms-family.mjs"), "--out", first, "--dry-run"], {
    cwd: path.resolve(landingRoot, "../.."),
    stdio: "ignore",
  });
  console.log(`field-service-landing-manual-check ok: ${expectedCodes.length} templates, 260 content values, deterministic export, dry-run payload ready`);
} finally {
  await fs.rm(first, { recursive: true, force: true });
  await fs.rm(second, { recursive: true, force: true });
}
