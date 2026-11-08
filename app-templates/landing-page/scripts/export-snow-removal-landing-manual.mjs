import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { composeCmsFamily } from "./compose-cms-family.mjs";
import { applyValues, completeMappedValues } from "./export-production-chrome-templates.mjs";
import { buildSeoGraph } from "./snow-removal-landing-seo-graph.mjs";
import { SNOW_CONTENT_DIR, snowEnvironment, snowEnvironmentArgument } from "./snow-removal-landing-environments.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const landingRoot = resolve(scriptsDir, "..");
const SPEC = join(landingRoot, "compositions", "specs", "snow-removal-software.spec.json");
const CHROME_VALUES = join(landingRoot, "content", "servicewand-production-chrome", "parameter-values.json");
const CONTENT_DIR = SNOW_CONTENT_DIR;
const CONTENT_CODE = "SNOW_REMOVAL_LANDING_CONTENT";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeText = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, String(value ?? "").replace(/\n*$/, "\n"));
};
const writeJson = (file, value) => writeText(file, JSON.stringify(value, null, 2));

export const minifyCss = (css) => String(css || "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();

const stripGeneratedHeaders = (source) => String(source || "").replace(/^\/\* generated [^*]*\*\/\n/gm, "");

const scalar = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const picked = value.en ?? Object.values(value)[0];
    return picked && typeof picked === "object" ? JSON.stringify(picked) : picked ?? "";
  }
  return value ?? "";
};

export const renderTemplate = (source, parameters) => {
  const values = new Map((parameters || []).map((parameter) => [parameter.code, scalar(parameter.value)]));
  return String(source || "").replace(/\$\{([A-Z][A-Z0-9_]*)(?:@[^}]*)?\}/g, (match, code) => (values.has(code) ? String(values.get(code)) : match));
};

const mediaValues = (block, media) => {
  const values = {};
  const codes = new Set((block.params || []).map((param) => param.code));
  for (const item of block.media || []) {
    const uploaded = media[item.file];
    if (!uploaded) continue;
    values[`SNOW_${item.code.toUpperCase()}`] = uploaded.id;
    if (codes.has(`${item.code}_name`)) values[`SNOW_${item.code.toUpperCase()}_NAME`] = uploaded.name;
  }
  return values;
};

export const applyHeaderVariant = (header, block, blockDir) => {
  const variant = block.header_variant;
  if (!variant) return header;
  const prefix = `${header.code}_`;
  const types = new Map(variant.params.map((param) => [param.code, param.type]));
  const fragment = (file) => readFileSync(join(blockDir, file), "utf8").replace(/\{\{([a-z0-9_]+)\}\}/g, (match, code) => {
    if (!types.has(code)) throw new Error(`Header variant placeholder ${code} is not declared`);
    return `\${${prefix}${code.toUpperCase()}@${types.get(code)}}`;
  });
  const item = (code, linkClass, liPattern) => new RegExp(`${liPattern}\\s*<a\\s+href="\\$\\{${prefix}${code}_HREF@STRING\\}"\\s+class="${linkClass}"[\\s\\S]*?</li>`);
  let html = header.html;
  const swap = (codes, linkClass, liPattern, file) => {
    codes.forEach((code, index) => {
      const pattern = item(code, linkClass, liPattern);
      if (!pattern.test(html)) throw new Error(`Header variant target ${code} (${linkClass}) not found`);
      html = html.replace(pattern, index === 0 ? fragment(file).trim() : "");
    });
  };
  swap(variant.replaces.desktop, "header-menu-link", '<li class="header-menu-item">', variant.desktop);
  swap(variant.replaces.mobile, "mobile-menu-link", "<li>", variant.mobile);
  const replaced = new Set(variant.replaces.desktop.flatMap((code) => [code, `${code}_HREF`]).map((code) => `${prefix}${code}`));
  const stillUsed = [...replaced].filter((code) => html.includes(`\${${code}@`));
  if (stillUsed.length) throw new Error(`Replaced header parameters are still referenced: ${stillUsed.join(", ")}`);
  const parameters = header.parameters
    .filter((param) => !replaced.has(param.code))
    .map((param) => {
      const local = param.code.slice(prefix.length);
      if (!Object.hasOwn(variant.values || {}, local)) return param;
      const value = variant.values[local];
      return { ...param, value: value && typeof value === "object" && param.value && typeof param.value === "object" ? { ...param.value, ...value } : value };
    })
    .concat(variant.params.map((param) => ({
      code: `${prefix}${param.code.toUpperCase()}`,
      type: param.type,
      nls: { en: { NAME: param.name, DESCRIPTION: param.description } },
      value: param.type.startsWith("LOCALIZED_") ? { en: param.value } : param.value,
    })));
  const css = readFileSync(join(blockDir, "header-nav.css"), "utf8");
  return { ...header, html, css: `${header.css}\n${minifyCss(css)}`, parameters };
};

const splitTemplate = (dir, template) => {
  writeJson(join(dir, "template.json"), template);
  writeText(join(dir, "head.html"), template.head || "");
  writeText(join(dir, "html.html"), template.html || "");
  writeText(join(dir, "css.css"), template.css || "");
  writeText(join(dir, "javascript.js"), template.javascript || "");
  writeJson(join(dir, "parameters.json"), template.parameters || []);
};

const previewDocument = ({ root, children, mediaById, origin }) => {
  const parameters = [root, ...children].flatMap((template) => template.parameters || []);
  const local = (id, match) => (mediaById.has(id) ? `../../../content/snow-removal-software/media/${mediaById.get(id)}` : `${origin}${match}`);
  const localMedia = (html) => html.replace(/\/core\/(?:image\/([^"'\s/]+)\/get\/[^"'\s,)]+|api\/video\/([^"'\s/]+)\/stream\/[^"'\s,)]+|api\/media-asset\/([^"'\s/]+)\/get)/g, (match, image, video, asset) => local(image || video || asset, match));
  const render = (source) => localMedia(renderTemplate(source, parameters));
  const sections = children.map((child) => `<style>${render(child.css)}</style>\n<script>${render(child.javascript)}</script>\n${render(child.html)}`).join("\n");
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
${render(root.head)}
</head>
<body>
<style>${render(root.css)}</style>
<script>${render(root.javascript)}</script>
${sections}
</body>
</html>`;
};

export const exportSnowRemovalLanding = ({ environment = snowEnvironment(), outputDir = environment.outputDir, quiet = false } = {}) => {
  const spec = readJson(SPEC);
  const pack = readJson(join(CONTENT_DIR, "parameter-values.json"));
  const { media } = environment;
  const unknown = Object.keys(environment.values).filter((code) => !Object.hasOwn(pack.valuesByParamCode, code));
  if (unknown.length) throw new Error(`Environment ${environment.name} overrides unknown parameters: ${unknown.join(", ")}`);
  const block = readJson(join(landingRoot, "blocks", "16-snow-removal", "snow-removal.page", "block.json"));
  const out = resolve(outputDir);
  const distRoot = join(landingRoot, "dist");
  const staging = join(distRoot, `.snow-removal-staging-${process.pid}`);
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  try {
    const valuesPath = join(staging, "values.json");
    const blockHtml = readFileSync(join(landingRoot, "blocks", "16-snow-removal", "snow-removal.page", "block.html"), "utf8");
    const seo = readJson(join(CONTENT_DIR, "seo-graph.json"));
    const values = { ...pack.valuesByParamCode, ...environment.values, ...mediaValues(block, media) };
    values.SEO_LD_SCHEMA = { [seo.language]: buildSeoGraph({ spec, values, blockHtml, block, media, seo, origin: environment.origin }) };
    writeJson(valuesPath, { ...pack, valuesByParamCode: values });
    const family = composeCmsFamily({ specPath: SPEC, outDir: join(staging, "build"), valuesPath });
    const mapped = completeMappedValues(readJson(CHROME_VALUES));
    const children = family.children.map((child) => {
      if (child.code === `${spec.code}_HEADER`) return applyHeaderVariant(applyValues({ template: child, values: mapped.header }), block, join(landingRoot, "blocks", "16-snow-removal", "snow-removal.page"));
      if (child.code === `${spec.code}_FOOTER`) return applyValues({ template: child, values: mapped.footer });
      if (child.code === CONTENT_CODE) return { ...child, css: minifyCss(child.css), javascript: stripGeneratedHeaders(child.javascript) };
      throw new Error(`Unexpected child template ${child.code}`);
    });
    const root = { ...family.rootTemplate, children: children.map((child) => ({ code: child.code, nls: child.nls })) };
    const lorem = children.filter((child) => /lorem ipsum/i.test(JSON.stringify(child.parameters))).map((child) => child.code);
    if (lorem.length) throw new Error(`Lorem Ipsum survived in ${lorem.join(", ")}`);

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    const payload = { schemaVersion: 1, mode: "dry-run", root, children, pageContext: family.pageContext };
    writeJson(join(out, "cms-family.payload.json"), payload);
    writeJson(join(out, "landing.spec.json"), spec);
    splitTemplate(join(out, "root"), root);
    children.forEach((child, index) => splitTemplate(join(out, "children", `${String(index + 1).padStart(2, "0")}-${child.code.toLowerCase().replaceAll("_", "-")}`), child));
    const mediaById = new Map(Object.values(media).map((item) => [item.id, item.name]));
    writeText(join(out, "preview.html"), previewDocument({ root, children, mediaById, origin: environment.origin }));
    writeText(join(out, "README.md"), `# Manual upload: ${environment.outputName}

Generated by \`scripts/export-snow-removal-landing-manual.mjs\` from
\`compositions/specs/snow-removal-software.spec.json\`, the
\`snow-removal.page\` block, \`content/snow-removal-software/**\` and the
production chrome snapshot. Do not edit by hand.

Templates: \`${root.code}\` (root), ${children.map((child) => `\`${child.code}\``).join(", ")}.
Media ids come from \`content/snow-removal-software/${environment.mediaName}\`
(\`upload-snow-removal-landing-media.mjs\`). \`preview.html\` uses the local
media and fonts.

Deploy with \`upload-cms-family.mjs\` (\`--require-missing\` the first time),
then \`wire-snow-removal-landing-page.mjs\` for the parent links, includes,
PageContext and render cache.
`);
    if (!quiet) {
      console.log(`Snow Removal landing export written: ${relative(process.cwd(), out)}`);
      console.log(`Templates: ${[root, ...children].map((template) => template.code).join(", ")}`);
      console.log(`Parameters: ${[root, ...children].reduce((sum, template) => sum + (template.parameters || []).length, 0)}`);
      console.log(`Media ids: ${Object.keys(media).length}/${(block.media || []).length}`);
    }
    return { outputDir: out, payload };
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const environment = snowEnvironmentArgument(process.argv);
  const index = process.argv.indexOf("--out");
  exportSnowRemovalLanding({ environment, outputDir: index > 0 ? process.argv[index + 1] : environment.outputDir });
}
