import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { generateSeoPublicTest } from "./generate-seo-public.mjs";

const baseDir = path.resolve("app-templates/customer-portal");
const defaultOutputDir = path.join(baseDir, "dist");
const defaultSeoInput = path.join(baseDir, "scripts/fixtures/seo-public-authored.test.json");

export async function exportCms(options = {}) {
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  const seoInputPath = path.resolve(options.seoInputPath || defaultSeoInput);
  assertSafeOutputDir(outputDir);
  const transactionId = process.pid + "-" + crypto.randomBytes(8).toString("hex");
  const stagingDir = path.join(path.dirname(outputDir), "." + path.basename(outputDir) + ".staging-" + transactionId);
  const backupDir = path.join(path.dirname(outputDir), "." + path.basename(outputDir) + ".backup-" + transactionId);
  const portalBlock = await readJson(path.join(baseDir, "cms/block.json"));
  const seoBlock = await readJson(path.join(baseDir, "cms/seo-public-block.json"));
  const portalTemplate = await fs.readFile(path.join(baseDir, "cms/root-template.html"), "utf8");
  const seoTemplate = await fs.readFile(path.join(baseDir, "cms/seo-public-root-template.html"), "utf8");
  const seoSchema = await readJson(path.join(baseDir, "cms/seo-public.schema.json"));
  const portalHtml = await renderPortalPreview(portalBlock, options.portalValues || {});

  let manifest;
  let artifactHashes;
  try {
    await fs.mkdir(stagingDir);
    const portalPath = path.join(stagingDir, "customer-portal-preview.html");
    const publicSeoPath = path.join(stagingDir, "public-seo-preview.html");
    const portalPackagePath = path.join(stagingDir, "portal-cms-package.json");
    const publicSeoPackagePath = path.join(stagingDir, "public-seo-cms-package.json");
    const manifestPath = path.join(stagingDir, "cms-export-manifest.json");

    await fs.writeFile(portalPath, portalHtml, "utf8");
    await generateSeoPublicTest({ inputPath: seoInputPath, outputPath: publicSeoPath });
    await fs.writeFile(portalPackagePath, JSON.stringify({ schemaVersion: 1, block: portalBlock, template: portalTemplate }, null, 2) + "\n", "utf8");
    await fs.writeFile(publicSeoPackagePath, JSON.stringify({ schemaVersion: 1, block: seoBlock, inputSchema: seoSchema, template: seoTemplate }, null, 2) + "\n", "utf8");

    const publicSeoHtml = await fs.readFile(publicSeoPath, "utf8");
    const portalPackage = await fs.readFile(portalPackagePath, "utf8");
    const publicSeoPackage = await fs.readFile(publicSeoPackagePath, "utf8");
    manifest = buildManifest({ portalBlock, seoBlock, portalHtml, publicSeoHtml, portalPackage, publicSeoPackage });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

    artifactHashes = await hashArtifactTree(stagingDir);
    assertExactArtifacts(Object.keys(artifactHashes));
    await replaceDirectory(outputDir, stagingDir, backupDir);
  } catch (error) {
    await fs.rm(stagingDir, { recursive: true, force: true });
    await restoreOrCleanBackup(outputDir, backupDir);
    throw error;
  }

  return {
    outputDir,
    portalPath: path.join(outputDir, "customer-portal-preview.html"),
    publicSeoPath: path.join(outputDir, "public-seo-preview.html"),
    portalPackagePath: path.join(outputDir, "portal-cms-package.json"),
    publicSeoPackagePath: path.join(outputDir, "public-seo-cms-package.json"),
    manifestPath: path.join(outputDir, "cms-export-manifest.json"),
    manifest,
    artifactHashes,
  };
}

function buildManifest({ portalBlock, seoBlock, portalHtml, publicSeoHtml, portalPackage, publicSeoPackage }) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    surfaces: {
      portal: {
        block: "cms/block.json", template: "cms/root-template.html", package: "portal-cms-package.json",
        preview: "customer-portal-preview.html", auth: "configured", router: "configured",
        entry: portalBlock.runtime.entry, styles: portalBlock.runtime.styles,
        sha256: sha256(portalHtml), packageSha256: sha256(portalPackage),
      },
      publicSeo: {
        block: "cms/seo-public-block.json", schema: "cms/seo-public.schema.json",
        template: "cms/seo-public-root-template.html", package: "public-seo-cms-package.json",
        preview: "public-seo-preview.html", previewClassification: "public-authored-test",
        auth: seoBlock.runtime.auth, router: seoBlock.runtime.router,
        entry: seoBlock.runtime.entry, styles: seoBlock.runtime.styles,
        sha256: sha256(publicSeoHtml), packageSha256: sha256(publicSeoPackage),
      },
    },
  };
}

async function replaceDirectory(outputDir, stagingDir, backupDir) {
  const hadOutput = await exists(outputDir);
  let previousMoved = false;
  let stagedMoved = false;
  try {
    if (hadOutput) {
      await fs.rename(outputDir, backupDir);
      previousMoved = true;
    }
    await fs.rename(stagingDir, outputDir);
    stagedMoved = true;
    if (previousMoved) {
      await fs.rm(backupDir, { recursive: true });
      previousMoved = false;
    }
  } catch (error) {
    if (stagedMoved && previousMoved) {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rename(backupDir, outputDir);
      previousMoved = false;
    } else if (!stagedMoved && previousMoved) {
      await fs.rename(backupDir, outputDir);
      previousMoved = false;
    }
    throw error;
  } finally {
    await fs.rm(stagingDir, { recursive: true, force: true });
  }
}

async function restoreOrCleanBackup(outputDir, backupDir) {
  if (!(await exists(backupDir))) return;
  if (await exists(outputDir)) await fs.rm(outputDir, { recursive: true, force: true });
  await fs.rename(backupDir, outputDir);
}

async function hashArtifactTree(directory) {
  const result = {};
  for (const name of (await fs.readdir(directory)).sort()) {
    const entry = await fs.stat(path.join(directory, name));
    if (!entry.isFile()) throw new Error("CMS export staging contains a non-file artifact: " + name);
    result[name] = sha256(await fs.readFile(path.join(directory, name)));
  }
  return result;
}

function assertExactArtifacts(names) {
  const expected = ["cms-export-manifest.json", "customer-portal-preview.html", "portal-cms-package.json", "public-seo-cms-package.json", "public-seo-preview.html"];
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error("CMS export staging artifact inventory is not exact: " + names.join(", "));
}

async function exists(target) {
  try { await fs.access(target); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function renderPortalPreview(block, overrides = {}) {
  validateParams(block.params);
  validatePortalOverrides(block.params, overrides);
  const values = Object.fromEntries(block.params.map((param) => [param.code, param.default]));
  Object.assign(values, overrides);
  validatePortalValues(block.params, values);
  let template = await fs.readFile(path.join(baseDir, "cms/root-template.html"), "utf8");
  template = template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, code) => {
    if (!Object.prototype.hasOwnProperty.call(values, code)) throw new Error("No CMS default for template token: " + code);
    return escapeHtml(values[code]);
  });
  if (/\{\{[^}]+\}\}/.test(template)) throw new Error("Unresolved portal template token remains");
  return template;
}

export async function renderPortalFromValues(values) {
  const block = await readJson(path.join(baseDir, "cms/block.json"));
  return renderPortalPreview(block, values);
}

function validateParams(params) {
  if (!Array.isArray(params) || !params.length) throw new Error("Portal CMS params are required");
  const codes = params.map((param) => param.code);
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicates.length) throw new Error("Duplicate CMS parameter codes: " + [...new Set(duplicates)].join(", "));
  for (const param of params) {
    if (!Object.prototype.hasOwnProperty.call(param, "default")) throw new Error("CMS parameter lacks a default: " + param.code);
    if (!["STRING", "URL", "ENUM"].includes(param.type)) throw new Error("Unsupported CMS parameter type: " + param.code);
    if (param.type === "ENUM" && (!Array.isArray(param.options) || !param.options.length)) throw new Error("CMS enum has no options: " + param.code);
  }
  validatePortalValues(params, Object.fromEntries(params.map((param) => [param.code, param.default])));
}

function validatePortalOverrides(params, overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) throw new Error("Portal CMS overrides must be an object");
  const known = new Set(params.map((param) => param.code));
  for (const code of Object.keys(overrides)) if (!known.has(code)) throw new Error("Unknown portal CMS override: " + code);
}

function validatePortalValues(params, values) {
  for (const param of params) {
    const value = values[param.code];
    if (typeof value !== "string") throw new Error("Portal CMS value must be a string: " + param.code);
    if (param.required && !value.trim()) throw new Error("Required portal CMS value is empty: " + param.code);
    if (param.type === "ENUM" && !param.options.includes(value)) throw new Error("Portal CMS enum value is unsupported: " + param.code + "=" + value);
  }
}

function assertSafeOutputDir(outputDir) {
  const isDist = outputDir === defaultOutputDir;
  const isInternalTestDirectory = path.dirname(outputDir) === baseDir && path.basename(outputDir).startsWith(".s6-export-");
  if (!isDist && !isInternalTestDirectory) {
    throw new Error("CMS export output must be customer-portal/dist or an internal .s6-export-* test directory");
  }
}

function parseArgs(argv) {
  const values = {};
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--output-dir") values.outputDir = argv[++index];
    else if (argv[index] === "--seo-input") values.seoInputPath = argv[++index];
    else throw new Error("Unknown argument: " + argv[index]);
  }
  return values;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportCms(parseArgs(process.argv));
  console.log("export-cms ok: portal=" + path.relative(process.cwd(), result.portalPath) + " publicSeo=" + path.relative(process.cwd(), result.publicSeoPath) + " upload=false");
}
