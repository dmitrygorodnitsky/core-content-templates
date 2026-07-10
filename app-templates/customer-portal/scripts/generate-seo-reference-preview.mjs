import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeSeoReference, faqJsonLd } from "../runtime/src/normalizers/seo.js";
import { SeoPublicHeader, renderSeoSections } from "../runtime/src/components/seo/SeoSections.js";

const portalRoot = path.resolve("app-templates/customer-portal");
const runtimeRoot = path.join(portalRoot, "runtime");
const outputPath = path.join(portalRoot, "public/seo-reference-preview.html");
globalThis.window = globalThis;
const [{ F }, { SEO, SEO_FOOTER }] = await Promise.all([
  import(pathToFileURL(path.join(runtimeRoot, "data/fixtures.js"))),
  import(pathToFileURL(path.join(runtimeRoot, "data/seo-fixtures.js"))),
]);
const model = normalizeSeoReference(SEO.HVAC, F.themes.HVAC, SEO_FOOTER, "HVAC");
const body = renderSeoSections(model, { dataState: "ready", parity: false });
const jsonLd = JSON.stringify(faqJsonLd(model)).replace(/</g, "\\u003c");
const html = `<!DOCTYPE html>
<html lang="en" data-theme="hvac" data-mode="light" data-content-classification="reference-only">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[Reference fixture] ${escapeHtml(model.meta.title)}</title>
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="Reference-only fixture preview; not production content or CMS truth.">
  <link rel="canonical" href="${escapeHtml(model.meta.canonicalUrl)}">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="../runtime/styles/tokens.css">
  <link rel="stylesheet" href="../runtime/styles/base.css">
  <link rel="stylesheet" href="../runtime/styles/components.css">
  <link rel="stylesheet" href="../runtime/styles/seo.css">
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body class="seo-public" data-content-authority="reference-only">
  <div class="seo-reference-banner" role="note">Reference fixture preview - not production content or CMS truth</div>
  ${SeoPublicHeader(model)}
  <main id="seo-public-root" class="seo-page" data-route="seo.reference-preview" data-visual-id="seo-landing" data-state="ready">${body}</main>
  <script type="module" src="src/seo-public.js"></script>
</body>
</html>
`;
await fs.writeFile(outputPath, html, "utf8");
console.log("generate-seo-reference-preview ok: " + path.relative(process.cwd(), outputPath));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; });
}
