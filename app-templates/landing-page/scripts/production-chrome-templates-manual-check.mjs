import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { exportProductionChromeTemplates } from "./export-production-chrome-templates.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.resolve(scriptsDir, "..");
const first = await fs.mkdtemp(path.join(landingRoot, "dist/.production-chrome-check-a-"));
const second = await fs.mkdtemp(path.join(landingRoot, "dist/.production-chrome-check-b-"));
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
  const result = {};
  for (const file of await listFiles(dir)) result[file] = digest(await fs.readFile(path.join(dir, file)));
  return result;
};

try {
  const a = exportProductionChromeTemplates({ codeSuffix: "BLOG", outputDir: first, quiet: true });
  const b = exportProductionChromeTemplates({ codeSuffix: "BLOG", outputDir: second, quiet: true });
  assert.deepEqual(a.codes, [
    "FIELD_SERVICE_LANDING_HEADER_BLOG",
    "FIELD_SERVICE_LANDING_FOOTER_BLOG",
  ]);
  assert.deepEqual(b.codes, a.codes);
  const payload = JSON.parse(await fs.readFile(path.join(first, "cms-family.payload.json"), "utf8"));
  const templates = [payload.root, ...payload.children];
  assert.equal(templates.length, 2);
  assert.equal(templates.every((template) => template.parent === null), true);
  assert.equal(templates.every((template) => Array.isArray(template.children) && template.children.length === 0), true);
  assert.equal(templates[0].parameters.every((parameter) => parameter.code.startsWith(`${a.codes[0]}_`)), true);
  assert.equal(templates[1].parameters.every((parameter) => parameter.code.startsWith(`${a.codes[1]}_`)), true);
  assert.doesNotMatch(JSON.stringify(payload), /lorem ipsum/i);

  const headerValues = new Map(templates[0].parameters.map((parameter) => [parameter.code, parameter.value]));
  const footerValues = new Map(templates[1].parameters.map((parameter) => [parameter.code, parameter.value]));
  assert.deepEqual(headerValues.get(`${a.codes[0]}_MENU_PLATFORM`), {
    ar: "المنصة",
    en: "Platform",
    es: "Plataforma",
    fr: "Plateforme",
    he: "פלטפורמה",
    ru: "Платформа",
    zh: "平台",
  });
  assert.equal(
    Object.values(footerValues.get(`${a.codes[1]}_COPYRIGHT_RIGHTS`)).every((value) => value === " "),
    true,
  );
  assert.deepEqual(await treeHashes(first), await treeHashes(second), "repeat export must be deterministic");

  const dryRun = execFileSync(process.execPath, [
    path.join(scriptsDir, "upload-cms-family.mjs"),
    "--out", first,
    "--base-url", "https://servicewand.com/core",
    "--org", "SYSTEM",
    "--dry-run",
  ], { encoding: "utf8" });
  assert.match(dryRun, /template count:\s+2/);
  assert.match(dryRun, /root:\s+FIELD_SERVICE_LANDING_HEADER_BLOG/);
  assert.match(dryRun, /No network writes were made/);

  assert.throws(
    () => exportProductionChromeTemplates({ codeSuffix: "bad suffix", outputDir: first, quiet: true }),
    /code-suffix/,
  );
  console.log("production-chrome-templates-manual-check ok: suffixed codes, production values, deterministic flat payload");
} finally {
  await fs.rm(first, { recursive: true, force: true });
  await fs.rm(second, { recursive: true, force: true });
}
