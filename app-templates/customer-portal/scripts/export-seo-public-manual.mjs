import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { generateSeoPublic, generateSeoPublicStaging, generateSeoPublicTest } from "./generate-seo-public.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const defaultProductionOutputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-seo-public");
const defaultReferenceOutputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-seo-public-reference");
const defaultStagingOutputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-seo-public-staging");
const styleFiles = ["tokens.css", "base.css", "components.css", "seo.css"];
const baseOutputFiles = [
  "README.md",
  "cms-family.payload.json",
  "composition.resolved.json",
  "head.html",
  "html.html",
  "javascript.js",
  "manual-export-manifest.json",
  "page-context.source.json",
  "parameters.json",
  "preview.html",
  "root/css.css",
  "root/head.html",
  "root/html.html",
  "root/javascript.js",
  "root/parameters.json",
  "root/template.json",
];

export async function exportSeoPublicManual(options = {}) {
  const inputPath = requiredPath(options.inputPath, "Manual public SEO export requires inputPath");
  const mode = normalizeMode(options.mode);
  const launchState = mode === "staging" ? "staging-only" : options.launchState === "concept" ? "concept" : "review-required";
  const outputDir = path.resolve(options.outputDir || defaultOutputDir(mode));
  assertSafeOutputDir(outputDir, mode);
  const assets = await normalizeAssets(options.assets || []);
  const catalogSnapshot = options.catalogSnapshotPath ? await normalizeCatalogSnapshot(options.catalogSnapshotPath) : null;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "customer-portal-seo-manual-"));
  const documentPath = path.join(tempDir, "document.html");
  try {
    const result = mode === "test"
      ? await generateSeoPublicTest({ inputPath, outputPath: documentPath })
      : mode === "staging"
        ? await generateSeoPublicStaging({ inputPath, outputPath: documentPath })
        : await generateSeoPublic({ inputPath, outputPath: documentPath });
    const sourcePayload = JSON.parse(await fs.readFile(inputPath, "utf8"));
    const css = await readStyles();
    const enhancement = await manualEnhancement(result.model.vertical.slug);
    const parts = splitDocument(result.html, result.model.vertical.slug, result.model.classification);
    const template = rootTemplate(parts.head, parts.html, css, enhancement);
    assertAssetsMatchModel(assets, result.model);
    if (mode === "staging" && result.model.pricing.rows.length && !catalogSnapshot) {
      throw new Error("Staging public SEO package with prices requires catalogSnapshotPath");
    }
    const preview = previewDocument(parts.head, parts.html, css, enhancement, result.model.vertical.slug, assets);
    const manifest = buildManifest({ inputPath, mode, model: result.model, template, css, enhancement, preview, assets, catalogSnapshot, launchState });

    await writePackage(outputDir, {
      sourcePayload,
      template,
      preview,
      manifest,
      mode,
      inputPath,
      parts,
      css,
      enhancement,
      assets,
      catalogSnapshot,
      launchState,
    });
    return { outputDir, manifest };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function writePackage(outputDir, packageData) {
  const tx = crypto.randomBytes(8).toString("hex");
  const staging = path.join(path.dirname(outputDir), "." + path.basename(outputDir) + ".staging-" + tx);
  const backup = path.join(path.dirname(outputDir), "." + path.basename(outputDir) + ".backup-" + tx);
  await fs.mkdir(path.join(staging, "root"), { recursive: true });
  try {
    await writeJson(path.join(staging, "cms-family.payload.json"), packageData.template);
    await writeJson(path.join(staging, "parameters.json"), []);
    await writeJson(path.join(staging, "composition.resolved.json"), composition(packageData.template.code));
    await writeJson(path.join(staging, "page-context.source.json"), packageData.sourcePayload);
    if (packageData.catalogSnapshot) await writeText(path.join(staging, "catalog-snapshot.source.json"), packageData.catalogSnapshot.text);
    await writeJson(path.join(staging, "manual-export-manifest.json"), packageData.manifest);
    await writeText(path.join(staging, "head.html"), packageData.template.head);
    await writeText(path.join(staging, "html.html"), packageData.template.html);
    await writeText(path.join(staging, "root/css.css"), packageData.css);
    await writeText(path.join(staging, "javascript.js"), packageData.enhancement);
    await writeText(path.join(staging, "preview.html"), packageData.preview);
    await writeText(path.join(staging, "README.md"), readme(packageData));
    await splitTemplate(path.join(staging, "root"), packageData.template);
    await writeAssets(staging, packageData.assets);
    await assertExactOutput(staging, expectedOutputFiles(packageData.assets, packageData.catalogSnapshot));
    await replaceDirectory(outputDir, staging, backup);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    await restoreBackup(outputDir, backup);
    throw error;
  }
}

function rootTemplate(head, html, css, javascript) {
  return {
    code: "CUSTOMER_PORTAL_SEO_PUBLIC",
    nls: { en: { NAME: "Customer Portal - Public SEO Landing" } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head,
    html,
    css,
    javascript,
    parameters: [],
  };
}

function composition(code) {
  return {
    schemaVersion: 1,
    family: code,
    kind: "single-server-authored-root",
    children: [],
    reason: "Canonical metadata, visible FAQ, and FAQ JSON-LD are emitted from one validated authored document.",
  };
}

function buildManifest({ inputPath, mode, model, template, css, enhancement, preview, assets, catalogSnapshot, launchState }) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    mode,
    input: path.relative(process.cwd(), inputPath),
    classification: model.classification,
    vertical: model.vertical.slug,
    canonical: model.meta.canonicalUrl,
    contentAuthority: "validated CMS-authored public document",
    launchState: launchState,
    package: {
      code: template.code,
      templateLanguage: template.templateLanguage,
      parameters: template.parameters.length,
      sha256: {
        head: sha256(template.head),
        html: sha256(template.html),
        css: sha256(css),
        javascript: sha256(enhancement),
        preview: sha256(preview),
      },
    },
    assets: assets.map(function (asset) {
      return { outputPath: asset.outputPath, publicUrl: asset.publicUrl, sha256: asset.sha256 };
    }),
    catalogSnapshot: catalogSnapshot ? {
      source: path.relative(process.cwd(), catalogSnapshot.sourcePath),
      sha256: catalogSnapshot.sha256,
      organization: catalogSnapshot.value.organization,
      organizationId: catalogSnapshot.value.organizationId,
      currency: catalogSnapshot.value.currency,
      productCodes: catalogSnapshot.value.products.map(function (product) { return product.code; }),
    } : null,
  };
}

function splitDocument(documentHtml, vertical, classification) {
  const head = match(documentHtml, /<head>([\s\S]*?)<\/head>/i, "head");
  const body = match(documentHtml, /<body[^>]*>([\s\S]*?)<\/body>/i, "body")
    .replace(/\s*<script type="module"[^>]*><\/script>\s*/gi, "\n")
    .trim();
  const cleanHead = head
    .replace(/^\s*<link rel="stylesheet"[^>]*>\s*$/gim, "")
    .replace(/^\s*<script type="module"[^>]*><\/script>\s*$/gim, "")
    .trim();
  return {
    head: cleanHead,
    html: '<div class="seo-public seo-manual-root" data-theme="' + escapeAttr(vertical) + '" data-mode="light" data-content-authority="' + escapeAttr(classification) + '">\n' + body + "\n</div>",
  };
}

async function readStyles() {
  const files = await Promise.all(styleFiles.map(async (name) => {
    const text = await fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8");
    return "/* manual export source: runtime/styles/" + name + " */\n" + text.trim();
  }));
  return files.join("\n\n") + "\n";
}

async function manualEnhancement(vertical) {
  const source = await fs.readFile(path.join(portalRoot, "public/src/seo-public.js"), "utf8");
  return "/* manual export source: public/src/seo-public.js */\n" +
    "document.documentElement.setAttribute(\"data-theme\", " + JSON.stringify(vertical) + ");\n" +
    "document.documentElement.setAttribute(\"data-mode\", \"light\");\n" +
    source.replace('document.getElementById("seo-public-root")', 'document.querySelector(".seo-manual-root #seo-public-root")');
}

function previewDocument(head, html, css, javascript, vertical, assets) {
  const previewHtml = assets.reduce(function (value, asset) {
    return value.replaceAll(asset.publicUrl, "assets/" + asset.outputPath);
  }, html);
  return "<!doctype html>\n<html lang=\"en\" data-theme=\"" + escapeAttr(vertical) + "\" data-mode=\"light\">\n<head>\n" + head + "\n<style>\n" + css + "</style>\n</head>\n<body>\n" + previewHtml + "\n<script>\n" + javascript + "</script>\n</body>\n</html>\n";
}

function readme(packageData) {
  const isTest = packageData.mode === "test";
  const isStaging = packageData.mode === "staging";
  const assets = packageData.assets;
  const assetUploadStep = assets.length === 0
    ? "1. Create a root template with code `CUSTOMER_PORTAL_SEO_PUBLIC` and language `JTE`.\n"
    : "1. Upload every file in `assets/` to the matching `publicUrl` in `assets-manifest.json`. Verify each final HTTPS URL returns the intended image.\n" +
      "2. Create a root template with code `CUSTOMER_PORTAL_SEO_PUBLIC` and language `JTE`.\n";
  const templateUploadStep = assets.length === 0 ? "2." : "3.";
  const verifyStep = assets.length === 0 ? "3." : "4.";
  return "# Manual upload: customer-portal-seo-public\n\n" +
    "This is one public, server-authored JTE root template. It intentionally has no child blocks: the canonical URL, visible FAQ, and FAQ JSON-LD were produced from the same validated input document and must remain atomic.\n\n" +
    "## Upload order\n\n" +
    assetUploadStep +
    templateUploadStep + " Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the matching CMS fields. `root/template.json` is the complete import record.\n" +
    verifyStep + " Publish only after checking the canonical, meta description, visible FAQ, FAQ JSON-LD, CTA destinations, and uploaded media on the deployed URL.\n\n" +
    "## Content authority\n\n" +
    "`page-context.source.json` is the exact validated source used for this package. Do not edit rendered HTML to change business content. Update the authored input and regenerate the package so HTML and structured data stay aligned.\n\n" +
    "Regenerate a package with:\n\n" +
    "```bash\n" +
    "node app-templates/customer-portal/scripts/export-seo-public-manual.mjs \\\n" +
    "  --input /absolute/path/to/public-authored-landing.json \\\n" +
    "  --mode staging\n" +
    "```\n\n" +
    "Staging writes `dist/manual-upload/customer-portal-seo-public-staging`; production writes `dist/manual-upload/customer-portal-seo-public`; test input writes the separate `*-reference` path. Modes are isolated and cannot overwrite one another.\n\n" +
    (packageData.catalogSnapshot
      ? "`catalog-snapshot.source.json` is the PIM snapshot used to author the displayed prices. It is not a browser-side Core integration. Regenerate after a catalog change. Do not add an unverified CMS price or a client-side authenticated API call.\n\n"
      : "If prices are added later, keep their authoritative source with the package. Do not add an unverified CMS price or a client-side authenticated API call.\n\n") +
    (isTest
      ? "## Test-only package\n\nThis package was generated from `public-authored-test` content. It contains `noindex,nofollow` and is reference proof only. It must never be uploaded or published.\n"
      : isStaging
        ? "## Staging-only package\n\nThis package contains `noindex,nofollow` and an explicit staging banner. Upload it only to staging. It must not be promoted or published to a production domain; regenerate in `production` mode after customer facts, public URLs, and live catalog ownership are verified.\n"
      : packageData.launchState === "concept"
        ? "## Concept case: publication blocked\n\nThis package uses an invented brand, domain, contacts, and booking endpoints. Do not upload or publish it. Replace those values with verified customer data and a live booking integration in the authored source, then regenerate a review-required package.\n"
      : "## Production package\n\nThis package was generated from a `public-authored` payload. It still requires operator review of the target URL before publishing.\n");
}

async function splitTemplate(root, template) {
  await writeJson(path.join(root, "template.json"), template);
  await writeText(path.join(root, "head.html"), template.head);
  await writeText(path.join(root, "html.html"), template.html);
  await writeText(path.join(root, "css.css"), template.css);
  await writeText(path.join(root, "javascript.js"), template.javascript);
  await writeJson(path.join(root, "parameters.json"), template.parameters);
}

async function writeAssets(root, assets) {
  if (assets.length === 0) return;
  await fs.mkdir(path.join(root, "assets"), { recursive: true });
  await writeJson(path.join(root, "assets-manifest.json"), assets.map(function (asset) {
    return { outputPath: asset.outputPath, publicUrl: asset.publicUrl, sha256: asset.sha256 };
  }));
  await Promise.all(assets.map(function (asset) {
    return fs.copyFile(asset.sourcePath, path.join(root, "assets", asset.outputPath));
  }));
}

function assertAssetsMatchModel(assets, model) {
  if (assets.length === 0) return;
  const mediaUrl = model.hero.media && model.hero.media.url;
  if (!mediaUrl || assets.length !== 1 || assets[0].publicUrl !== mediaUrl) {
    throw new Error("Manual SEO assets must contain exactly the authored hero media URL");
  }
}

function expectedOutputFiles(assets, catalogSnapshot) {
  return baseOutputFiles.concat(assets.length === 0
    ? []
    : ["assets-manifest.json"].concat(assets.map(function (asset) { return "assets/" + asset.outputPath; }))).concat(catalogSnapshot ? ["catalog-snapshot.source.json"] : []).sort();
}

async function assertExactOutput(root, expectedFiles) {
  const files = (await listFiles(root)).sort();
  if (JSON.stringify(files) !== JSON.stringify(expectedFiles.slice().sort())) {
    throw new Error("Manual SEO output inventory is not exact: " + files.join(", "));
  }
}

async function replaceDirectory(outputDir, staging, backup) {
  const hadOutput = await exists(outputDir);
  let movedPrevious = false;
  let movedStaging = false;
  try {
    if (hadOutput) {
      await fs.rename(outputDir, backup);
      movedPrevious = true;
    }
    await fs.rename(staging, outputDir);
    movedStaging = true;
    if (movedPrevious) await fs.rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (movedStaging) await fs.rm(outputDir, { recursive: true, force: true });
    if (movedPrevious && await exists(backup)) await fs.rename(backup, outputDir);
    throw error;
  }
}

async function restoreBackup(outputDir, backup) {
  if (!(await exists(backup))) return;
  if (await exists(outputDir)) await fs.rm(outputDir, { recursive: true, force: true });
  await fs.rename(backup, outputDir);
}

async function listFiles(root, relative = "") {
  const target = path.join(root, relative);
  const names = (await fs.readdir(target)).sort();
  const result = [];
  for (const name of names) {
    const item = path.join(relative, name);
    const stat = await fs.stat(path.join(root, item));
    if (stat.isDirectory()) result.push(...await listFiles(root, item));
    else result.push(item);
  }
  return result;
}

function assertSafeOutputDir(outputDir, mode) {
  const manualRoot = path.join(portalRoot, "dist/manual-upload");
  const temporary = path.dirname(outputDir) === portalRoot && path.basename(outputDir).startsWith(".seo-public-manual-");
  if (!outputDir.startsWith(manualRoot + path.sep) && !temporary) {
    throw new Error("Manual SEO export output must stay in customer-portal/dist/manual-upload or an internal .seo-public-manual-* directory");
  }
  if (mode === "test" && outputDir === defaultProductionOutputDir) throw new Error("Test input must not write the production manual package path");
  if (mode === "production" && outputDir === defaultReferenceOutputDir) throw new Error("Production input must not overwrite the reference package path");
  if (mode === "staging" && (outputDir === defaultProductionOutputDir || outputDir === defaultReferenceOutputDir)) throw new Error("Staging input must not overwrite the production or reference manual package path");
  if (mode === "production" && outputDir === defaultStagingOutputDir) throw new Error("Production input must not overwrite the staging manual package path");
}

function normalizeMode(value) {
  if (value === undefined || value === "production") return "production";
  if (value === "test" || value === "staging") return value;
  throw new Error("Manual SEO mode must be test, staging, or production");
}

function defaultOutputDir(mode) {
  if (mode === "test") return defaultReferenceOutputDir;
  if (mode === "staging") return defaultStagingOutputDir;
  return defaultProductionOutputDir;
}

function requiredPath(value, message) {
  if (!value) throw new Error(message);
  return path.resolve(value);
}

function match(value, expression, label) {
  const result = expression.exec(value);
  if (!result) throw new Error("Could not extract public SEO " + label);
  return result[1];
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function exists(target) {
  try { await fs.access(target); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function writeJson(target, value) {
  await writeText(target, JSON.stringify(value, null, 2) + "\n");
}

async function writeText(target, value) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, String(value).replace(/\n*$/, "\n"), "utf8");
}

function parseArgs(argv) {
  const result = { assets: [] };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") result.inputPath = argv[++index];
    else if (argv[index] === "--output-dir") result.outputDir = argv[++index];
    else if (argv[index] === "--mode") result.mode = argv[++index];
    else if (argv[index] === "--catalog-snapshot") result.catalogSnapshotPath = argv[++index];
    else if (argv[index] === "--asset") result.assets.push({ sourcePath: argv[++index], outputPath: argv[++index], publicUrl: argv[++index] });
    else throw new Error("Unknown argument: " + argv[index]);
  }
  return result;
}

async function normalizeAssets(rawAssets) {
  if (!Array.isArray(rawAssets)) throw new Error("Manual SEO assets must be an array");
  const normalized = await Promise.all(rawAssets.map(async function (raw, index) {
    if (!raw || typeof raw !== "object") throw new Error("Manual SEO asset[" + index + "] must be an object");
    const sourcePath = requiredPath(raw.sourcePath, "Manual SEO asset[" + index + "] requires sourcePath");
    const outputPath = String(raw.outputPath || "");
    const publicUrl = String(raw.publicUrl || "");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:avif|gif|jpe?g|png|webp)$/i.test(outputPath)) {
      throw new Error("Manual SEO asset[" + index + "] outputPath must be a single image filename");
    }
    let parsed;
    try { parsed = new URL(publicUrl); } catch (_) { throw new Error("Manual SEO asset[" + index + "] publicUrl must be an absolute HTTPS URL"); }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) {
      throw new Error("Manual SEO asset[" + index + "] publicUrl must be an absolute credential-free HTTPS URL without a fragment");
    }
    const data = await fs.readFile(sourcePath);
    return { sourcePath, outputPath, publicUrl: parsed.href, sha256: sha256(data) };
  }));
  const names = normalized.map(function (asset) { return asset.outputPath; });
  if (new Set(names).size !== names.length) throw new Error("Manual SEO asset outputPath values must be unique");
  return normalized.sort(function (a, b) { return a.outputPath.localeCompare(b.outputPath); });
}

async function normalizeCatalogSnapshot(value) {
  const sourcePath = requiredPath(value, "Manual SEO catalog snapshot requires a source path");
  const text = await fs.readFile(sourcePath, "utf8");
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) { throw new Error("Manual SEO catalog snapshot must be valid JSON"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Manual SEO catalog snapshot must be an object");
  if (typeof parsed.organization !== "string" || !Number.isInteger(parsed.organizationId) || typeof parsed.currency !== "string" || !Array.isArray(parsed.products)) {
    throw new Error("Manual SEO catalog snapshot requires organization, organizationId, currency, and products");
  }
  if (parsed.products.some(function (product) { return !product || typeof product.code !== "string"; })) {
    throw new Error("Manual SEO catalog snapshot products require codes");
  }
  return { sourcePath, text, value: parsed, sha256: sha256(text) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportSeoPublicManual(parseArgs(process.argv));
  console.log("export-seo-public-manual ok: " + path.relative(process.cwd(), result.outputDir) + " upload=false");
}
