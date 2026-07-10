import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { normalizeSeoPublic, normalizeSeoPublicTest, faqJsonLd } from "../runtime/src/normalizers/seo.js";
import { SeoPublicHeader, renderSeoSections } from "../runtime/src/components/seo/SeoSections.js";

const portalRoot = path.resolve("app-templates/customer-portal");
const templatePath = path.join(portalRoot, "cms/seo-public-root-template.html");

export async function generateSeoPublic(options) {
  return generate(options, false);
}

export async function generateSeoPublicTest(options) {
  return generate(options, true);
}

async function generate(options, testMode) {
  options = options || {};
  if (!options.inputPath) throw new Error("Strict public generation requires inputPath");
  if (!options.outputPath) throw new Error("Strict public generation requires outputPath");
  var payload = JSON.parse(await fs.readFile(path.resolve(options.inputPath), "utf8"));
  var model = testMode ? normalizeSeoPublicTest(payload) : normalizeSeoPublic(payload);
  var html = await renderDocument(model, { notice: testMode ? "Strict authored test fixture - not production content" : null });
  await fs.mkdir(path.dirname(path.resolve(options.outputPath)), { recursive: true });
  await fs.writeFile(path.resolve(options.outputPath), html, "utf8");
  return { outputPath: path.resolve(options.outputPath), model: model, html: html };
}

export async function renderDocument(model, options) {
  options = options || {};
  var template = await fs.readFile(templatePath, "utf8");
  var values = {
    seo_theme: model.vertical.slug,
    seo_classification: model.classification,
    seo_title: model.meta.title,
    seo_description: model.meta.description,
    seo_canonical: model.meta.canonicalUrl,
    seo_asset_base: model.deployment.assetBase,
    seo_public_script_url: model.deployment.publicScriptUrl,
    seo_faq_json_ld: JSON.stringify(faqJsonLd(model)).replace(/</g, "\\u003c"),
    seo_notice: options.notice ? '<div class="seo-reference-banner" role="note">' + escapeHtml(options.notice) + '</div>' : "",
    seo_public_header: SeoPublicHeader(model),
    seo_body: renderSeoSections(model, { dataState: "ready", parity: false }),
  };
  var html = template.replace(/\{\{([a-z0-9_]+)\}\}/g, function (_, key) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) throw new Error("Unrecognized SEO template token: " + key);
    return key === "seo_notice" || key === "seo_public_header" || key === "seo_body" || key === "seo_faq_json_ld" ? values[key] : escapeHtml(values[key]);
  });
  if (/\{\{[^}]+\}\}/.test(html)) throw new Error("Unresolved SEO template token remains");
  return html;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; });
}

function parseArgs(argv) {
  var values = {};
  for (var index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") values.inputPath = argv[++index];
    else if (argv[index] === "--output") values.outputPath = argv[++index];
    else throw new Error("Unknown argument: " + argv[index]);
  }
  return values;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  var result = await generateSeoPublic(parseArgs(process.argv));
  console.log("generate-seo-public ok: " + path.relative(process.cwd(), result.outputPath));
}
