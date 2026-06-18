import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const labRoot = resolve(scriptsDir, "..");
const dist = join(labRoot, "dist", "servicewand-pricing-dynamic");
const manual = join(labRoot, "dist", "manual-upload", "servicewand-pricing-dynamic");
const single = join(labRoot, "dist", "manual-upload", "servicewand-pricing-dynamic-single-block");
const childDir = join(dist, "children", "02-section-02-pricing-dynamic-servicewand");

const readText = (file) => readFileSync(file, "utf8");
const readJson = (file) => JSON.parse(readText(file));
const writeText = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, String(value ?? "").replace(/\n*$/, "\n"));
};
const writeJson = (file, value) => writeText(file, JSON.stringify(value, null, 2));

const tokensCss = readText(join(labRoot, "00-tokens", "tokens.css"));
const compositionCss = readText(join(labRoot, "00-tokens", "composition.css"));
const commonCss = [
  "/* generated common CSS: 00-tokens/tokens.css */",
  tokensCss,
  "/* generated common CSS: 00-tokens/composition.css */",
  compositionCss,
].join("\n");

function splitTemplate(dir, template) {
  writeJson(join(dir, "template.json"), template);
  writeText(join(dir, "head.html"), template.head || "");
  writeText(join(dir, "html.html"), template.html || "");
  writeText(join(dir, "css.css"), template.css || "");
  writeText(join(dir, "javascript.js"), template.javascript || "");
  writeJson(join(dir, "parameters.json"), template.parameters || []);
}

function renderDefaults(source, params) {
  const values = new Map((params || []).map((param) => [param.code, param.value ?? param.default ?? ""]));
  return String(source || "").replace(/\$\{([A-Z0-9_]+)@[^}]+\}/g, (_, code) => String(values.get(code) ?? ""));
}

function preview({ title, html, css, js }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body data-theme="cyan">
<main>
${html}
</main>
<script>${js}</script>
</body>
</html>`;
}

function exportFamilyManual() {
  rmSync(manual, { recursive: true, force: true });
  mkdirSync(manual, { recursive: true });

  for (const name of [
    "cms-family.payload.json",
    "composition.resolved.json",
    "landing.spec.json",
    "page-context.sample.json",
    "parameters.json",
    "summary.md",
  ]) {
    copyFileSync(join(dist, name), join(manual, name));
  }

  splitTemplate(join(manual, "root"), readJson(join(dist, "root.template.json")));
  for (const entry of readdirSync(join(dist, "children"))) {
    splitTemplate(join(manual, "children", entry), readJson(join(dist, "children", entry, "template.json")));
  }

  writeText(join(manual, "README.md"), `# Manual upload: servicewand-pricing-dynamic

Family export. Child section CSS is block-specific and does not include shared lab tokens/composition CSS.
`);
}

function exportSingleBlockManual() {
  rmSync(single, { recursive: true, force: true });
  mkdirSync(single, { recursive: true });

  const pricingTemplate = readJson(join(childDir, "template.json"));
  const pricingCss = pricingTemplate.css || "";
  const standaloneTemplate = {
    ...pricingTemplate,
    css: `${commonCss}\n/* generated pricing CSS: servicewand-pricing-dynamic */\n${pricingCss}`,
  };
  const pricingOnlyTemplate = {
    ...pricingTemplate,
    css: pricingCss,
  };

  splitTemplate(single, standaloneTemplate);
  writeText(join(single, "css.common.css"), commonCss);
  writeText(join(single, "css.pricing.css"), pricingCss);
  writeJson(join(single, "template.pricing-only.json"), pricingOnlyTemplate);

  const fullHtml = renderDefaults(standaloneTemplate.html, standaloneTemplate.parameters);
  const pricingOnlyHtml = renderDefaults(pricingOnlyTemplate.html, pricingOnlyTemplate.parameters);

  writeText(join(single, "preview.html"), preview({
    title: "ServiceWand Pricing Dynamic Block Preview",
    html: fullHtml,
    css: standaloneTemplate.css || "",
    js: standaloneTemplate.javascript || "",
  }));

  writeText(join(single, "preview.pricing-only.html"), preview({
    title: "ServiceWand Pricing Dynamic Block Pricing-only Preview",
    html: pricingOnlyHtml,
    css: `${commonCss}\n${pricingCss}`,
    js: pricingOnlyTemplate.javascript || "",
  }));

  const inlined = {
    ...standaloneTemplate,
    html: fullHtml,
    css: renderDefaults(standaloneTemplate.css, standaloneTemplate.parameters),
    javascript: renderDefaults(standaloneTemplate.javascript, standaloneTemplate.parameters),
    parameters: [],
  };
  writeJson(join(single, "template.inlined.json"), inlined);
  writeText(join(single, "html.inlined.html"), inlined.html);
  writeText(join(single, "css.inlined.css"), inlined.css);
  writeText(join(single, "javascript.inlined.js"), inlined.javascript);
  writeText(join(single, "preview.inlined.html"), preview({
    title: "ServiceWand Pricing Dynamic Block Inline Preview",
    html: inlined.html,
    css: inlined.css,
    js: inlined.javascript,
  }));

  writeText(join(single, "README.md"), `# Manual upload: servicewand-pricing-dynamic-single-block

- \`template.json\`, \`css.css\`: self-contained section export. Includes shared lab tokens/composition CSS plus pricing-specific CSS.
- \`template.pricing-only.json\`, \`css.pricing.css\`: pricing-only export. Use this inside a page/template where shared lab tokens/composition CSS already exists.
- \`css.common.css\`: shared lab tokens/composition CSS split out for review or manual assembly.
`);
}

exportFamilyManual();
exportSingleBlockManual();

console.log(`Manual export written:
- ${manual}
- ${single}`);
