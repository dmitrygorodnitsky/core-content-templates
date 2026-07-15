import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const portalRoot = path.resolve("app-templates/customer-portal");
const inputPath = path.join(portalRoot, "content/cases/calm-harbor-spa.portal-pim-staging.json");
const defaultOutputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-calm-harbor-pim-staging");
const styleFiles = ["tokens.css", "base.css", "shell.css", "components.css", "routes.css", "responsive.css", "seo.css"];
const runtimePath = path.join(portalRoot, "runtime/manual/calm-harbor-pim-runtime.js");

export async function exportCalmHarborPortalManual(options = {}) {
  const sourcePath = path.resolve(options.inputPath || inputPath);
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  assertSafeOutputDir(outputDir);
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  validateSource(source);
  const css = await readStyles();
  const javascript = await fs.readFile(runtimePath, "utf8");
  const template = templateFor(source, css, javascript);
  const manifest = manifestFor(sourcePath, source, template);
  const preview = previewFor(template);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "calm-harbor-portal-manual-"));
  try {
    await writePackage(tempDir, { source, template, css, manifest, preview });
    await replaceDirectory(outputDir, tempDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, manifest };
}

function validateSource(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Calm Harbor portal source must be an object");
  if (source.schemaVersion !== 1) throw new Error("Calm Harbor portal source schemaVersion must be 1");
  if (!source.template || source.template.code !== "CUSTOMER_PORTAL_CALM_HARBOR_PIM_STAGING") throw new Error("Unexpected Calm Harbor portal template code");
  if (!source.runtime || source.runtime.dataMode !== "live") throw new Error("Manual Calm Harbor portal must use live data mode");
  if (JSON.stringify(source.runtime.enabledModules) !== JSON.stringify(["pricing", "products"])) throw new Error("Manual Calm Harbor portal may open only pricing and products");
  if (!source.pim || source.pim.organization !== "CALM_HARBOR_SPA_STAGING") throw new Error("Manual Calm Harbor portal must target CALM_HARBOR_SPA_STAGING");
  if (source.pim.apiBase !== "/core-pim/api") throw new Error("Manual Calm Harbor portal must use the same-origin Core PIM base");
  for (const key of ["pricingProductTypeCodes", "productsProductTypeCodes", "priceAttributeValues", "currencyAttributeValues"]) {
    if (!Array.isArray(source.pim[key]) || !source.pim[key].length || source.pim[key].some((value) => typeof value !== "string" || !value)) {
      throw new Error("Manual Calm Harbor portal PIM " + key + " must be a nonempty string array");
    }
  }
}

function templateFor(source, css, javascript) {
  const runtime = source.runtime;
  const pim = source.pim;
  const attributes = {
    "data-portal-vertical": runtime.vertical,
    "data-portal-profile": runtime.profile,
    "data-portal-theme": runtime.theme,
    "data-portal-default-mode": "light",
    "data-portal-router-mode": runtime.routerMode,
    "data-portal-default-route": runtime.defaultRoute,
    "data-portal-enabled-modules": runtime.enabledModules.join(","),
    "data-portal-auth-mode": runtime.authMode,
    "data-portal-error-mode": runtime.errorMode,
    "data-portal-data-mode": runtime.dataMode,
    "data-portal-case": "",
    "data-portal-pim-api-base": pim.apiBase,
    "data-portal-pim-organization": pim.organization,
    "data-portal-pim-product-type-code": pim.pricingProductTypeCodes[0],
    "data-portal-pim-pricing-product-type-codes": pim.pricingProductTypeCodes.join(","),
    "data-portal-pim-products-product-type-codes": pim.productsProductTypeCodes.join(","),
    "data-portal-pim-price-type-code": pim.priceTypeCode,
    "data-portal-pim-price-attribute-code": pim.priceAttributeCode,
    "data-portal-pim-price-attribute-values": pim.priceAttributeValues.join(","),
    "data-portal-pim-currency": pim.currency,
    "data-portal-pim-currency-attribute-code": pim.currencyAttributeCode,
    "data-portal-pim-currency-attribute-values": pim.currencyAttributeValues.join(","),
    "data-portal-pim-amount-attribute-code": pim.amountAttributeCode,
    "data-portal-pim-amount-minor-divisor": String(pim.amountMinorDivisor),
    "data-portal-pim-cta": pim.cta,
  };
  return {
    code: source.template.code,
    nls: { en: { NAME: source.template.title } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + escapeHtml(source.template.title) + '</title>\n<link rel="icon" href="data:,">',
    html: '<section id="app" ' + attrs(attributes) + '></section>',
    css,
    javascript,
    parameters: [],
  };
}

async function readStyles() {
  const parts = await Promise.all(styleFiles.map(async (name) => {
    const content = await fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8");
    return "/* manual portal source: runtime/styles/" + name + " */\n" + content.trim();
  }));
  return parts.join("\n\n") + "\n";
}

function manifestFor(sourcePath, source, template) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    mode: "staging",
    launchState: "staging-only",
    input: path.relative(process.cwd(), sourcePath),
    template: { code: template.code, templateLanguage: template.templateLanguage, parameters: [], sha256: {
      head: sha256(template.head), html: sha256(template.html), css: sha256(template.css), javascript: sha256(template.javascript),
    } },
    runtime: {
      delivery: "inline-template-javascript",
      sameOriginRequired: true,
      openedModules: source.runtime.enabledModules,
      pim: source.pim,
    },
  };
}

function previewFor(template) {
  return '<!doctype html>\n<html lang="en" data-theme="beauty" data-mode="light">\n<head>\n' + template.head + '\n<style>\n' + template.css + '</style>\n</head>\n<body>\n' + template.html + '\n<script>\n' + template.javascript + '\n</script>\n</body>\n</html>\n';
}

async function writePackage(root, packageData) {
  await fs.mkdir(path.join(root, "root"), { recursive: true });
  await writeJson(path.join(root, "cms-family.payload.json"), packageData.template);
  await writeJson(path.join(root, "composition.resolved.json"), {
    schemaVersion: 1, family: packageData.template.code, kind: "single-live-pim-root", children: [],
    reason: "Pricing and retail products are the only opened live modules; the root ships one CMS javascript field.",
  });
  await writeJson(path.join(root, "page-context.source.json"), packageData.source);
  await writeJson(path.join(root, "manual-export-manifest.json"), packageData.manifest);
  await writeJson(path.join(root, "parameters.json"), []);
  await writeText(path.join(root, "head.html"), packageData.template.head);
  await writeText(path.join(root, "html.html"), packageData.template.html);
  await writeText(path.join(root, "css.css"), packageData.template.css);
  await writeText(path.join(root, "javascript.js"), packageData.template.javascript);
  await writeText(path.join(root, "preview.html"), packageData.preview);
  await writeText(path.join(root, "README.md"), readme(packageData));
  await splitTemplate(path.join(root, "root"), packageData.template);
  await assertExactInventory(root);
}

async function splitTemplate(root, template) {
  await writeJson(path.join(root, "template.json"), template);
  await writeText(path.join(root, "head.html"), template.head);
  await writeText(path.join(root, "html.html"), template.html);
  await writeText(path.join(root, "css.css"), template.css);
  await writeText(path.join(root, "javascript.js"), template.javascript);
  await writeJson(path.join(root, "parameters.json"), template.parameters);
}

function readme(packageData) {
  return "# Manual upload: Calm Harbor Spa live PIM catalog\n\n" +
    "This is a staging-only root template. It exposes only the opened Core PIM surfaces: pricing and retail products. It is not an authenticated customer portal and must not be presented as one.\n\n" +
    "## Upload order\n\n" +
    "1. Create a root JTE template with code `" + packageData.template.code + "`.\n" +
    "2. Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the matching CMS fields. `root/template.json` is the complete reference record.\n" +
    "3. Publish the template, then open it on `dev-1.servicewand.com` at `#/pricing`, then `#/products`.\n\n" +
    "## Runtime contract\n\n" +
    "The browser sends unauthenticated same-origin POST requests to `" + publicCatalogPath(packageData.source.pim) + "`. Pricing queries `" + packageData.source.pim.pricingProductTypeCodes.join(", ") + "`; products query `" + packageData.source.pim.productsProductTypeCodes.join(", ") + "`. The runtime reads `" + packageData.source.pim.amountAttributeCode + "` with divisor `" + packageData.source.pim.amountMinorDivisor + "`.\n\n" +
    "The package is intentionally same-origin only. Do not host it on another domain: the current Core PIM CORS policy denies that path. No price, product, customer, order, appointment, or account value is authored in CMS. The runtime is self-contained in `javascript.js`; no static asset upload is required.\n\n" +
    "`preview.html` is a structural preview. It cannot validate live PIM when opened from `file://`; validate the deployed template on `dev-1` instead.\n";
}

function publicCatalogPath(pim) {
  return String(pim.apiBase).replace(/\/+$/, "").replace(/\/api$/, "") + "/public/" + pim.organization + "/catalog/price-comparison.json";
}

async function assertExactInventory(root) {
  const actual = (await filesUnderAny(root)).sort();
  const base = [
    "README.md", "cms-family.payload.json", "composition.resolved.json", "css.css", "head.html", "html.html", "javascript.js",
    "manual-export-manifest.json", "page-context.source.json", "parameters.json", "preview.html",
    "root/css.css", "root/head.html", "root/html.html", "root/javascript.js", "root/parameters.json", "root/template.json",
  ];
  const expected = base.sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Manual portal package inventory is not exact");
}

async function filesUnderAny(root, relative = "") {
  const result = [];
  for (const name of (await fs.readdir(path.join(root, relative))).sort()) {
    const item = path.join(relative, name);
    const stat = await fs.stat(path.join(root, item));
    if (stat.isDirectory()) result.push(...await filesUnderAny(root, item));
    else result.push(item.split(path.sep).join("/"));
  }
  return result;
}

async function replaceDirectory(outputDir, staging) {
  const backup = outputDir + ".backup-" + crypto.randomBytes(8).toString("hex");
  const hadOutput = await exists(outputDir);
  try {
    if (hadOutput) await fs.rename(outputDir, backup);
    await fs.rename(staging, outputDir);
    if (hadOutput) await fs.rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await exists(outputDir)) await fs.rm(outputDir, { recursive: true, force: true });
    if (hadOutput && await exists(backup)) await fs.rename(backup, outputDir);
    throw error;
  }
}

function assertSafeOutputDir(outputDir) {
  const manualRoot = path.join(portalRoot, "dist/manual-upload");
  const temporary = path.dirname(outputDir) === portalRoot && path.basename(outputDir).startsWith(".calm-harbor-portal-manual-");
  if (!outputDir.startsWith(manualRoot + path.sep) && !temporary) throw new Error("Manual Calm Harbor portal output must stay under customer-portal/dist/manual-upload");
}

function attrs(values) {
  return Object.entries(values).map(([key, value]) => key + '="' + escapeHtml(value) + '"').join(" ");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
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
  const options = {};
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") options.inputPath = argv[++index];
    else if (argv[index] === "--output-dir") options.outputDir = argv[++index];
    else throw new Error("Unknown argument: " + argv[index]);
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportCalmHarborPortalManual(parseArgs(process.argv));
  console.log("export-calm-harbor-portal-manual ok: " + path.relative(process.cwd(), result.outputDir) + " upload=false");
}
