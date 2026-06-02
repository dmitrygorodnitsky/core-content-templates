import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SLOT_MARKERS } from "./cms-family-contract.mjs";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") out.out = args[++i];
    else if (arg === "--file") out.file = args[++i];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
node docs/cms-components/lab-ui/scripts/render-cms-family-preview.mjs \\
  --out docs/cms-components/lab-ui/dist/<slug> \\
  --file preview.html`;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* Some parameter values contain pre-rendered inline HTML produced by the
 * markdown parser — most commonly `<ul>` / `<ol>` / `<li>` from list
 * blocks, occasionally `<strong>` / `<em>` for emphasis. We escape
 * everything first (defense in depth against any user-supplied content),
 * then re-allow a small whitelist of inline tags so lists actually
 * render in the preview instead of showing as `&lt;ul&gt;` text. */
const SAFE_INLINE_TAGS = new Set(["ul", "ol", "li", "strong", "em", "br", "p", "a"]);
const renderSafeInline = (value) => {
  let escaped = escapeHtml(value);
  escaped = escaped.replace(
    /&lt;(\/?)([a-zA-Z][a-zA-Z0-9]*)([^&]*?)&gt;/g,
    (match, slash, tag, rest) => {
      if (!SAFE_INLINE_TAGS.has(tag.toLowerCase())) return match;
      const safeRest = rest.replace(/&quot;/g, '"');
      return `<${slash}${tag}${safeRest}>`;
    },
  );
  return escaped;
};

const valueToString = (value, locale = "en") => {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return value[locale] ?? value.en ?? Object.values(value)[0] ?? "";
  }
  return String(value);
};

const renderPlaceholders = (html, values, locale) =>
  String(html || "")
    .replace(/\$\{([A-Z0-9_]+)@([A-Z0-9_]+)\}/g, (_, code) =>
      renderSafeInline(valueToString(values[code], locale)),
    )
    .replace(/\bsrc="\/core\/image\/\/get\/[^"]*"/g, 'src=""');

const slotFor = (template) => {
  if (template.code === "FEATURES") return SLOT_MARKERS.featureColumns;
  if (template.code.startsWith("FEATURE_COL_")) return SLOT_MARKERS.featureItems;
  if (template.code === "COMPARISON") return SLOT_MARKERS.compareRows;
  if (template.code === "FAQ") return SLOT_MARKERS.faqGroups;
  if (template.code.startsWith("FAQ_GROUP_")) return SLOT_MARKERS.faqItems;
  return SLOT_MARKERS.rootSections;
};

const renderTemplate = (template, values, locale) => {
  let html = renderPlaceholders(template.html, values, locale);
  if (template.children?.length) {
    const childrenHtml = template.children.map((child) => renderTemplate(child, values, locale)).join("\n");
    html = html.replace(new RegExp(`<!--\\s*cms-child-slot:${slotFor(template)}\\s*-->`, "g"), childrenHtml);
  }
  return html.replace(/<!--\s*cms-child-slot:[A-Z0-9_]+\s*-->/g, "");
};

const flattenTemplates = (templates) => templates.flatMap((template) => [template, ...flattenTemplates(template.children || [])]);

const main = () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.out) throw new Error(usage());
  const payloadFile = join(args.out, "cms-family.payload.json");
  const pageContextFile = join(args.out, "page-context.sample.json");
  if (!existsSync(payloadFile)) throw new Error(`Missing ${payloadFile}`);
  if (!existsSync(pageContextFile)) throw new Error(`Missing ${pageContextFile}`);

  const payload = readJson(payloadFile);
  const pageContext = readJson(pageContextFile);
  const locale = payload.root?.parameters?.find((param) => param.value?.en)?.value ? "en" : "en";
  const values = pageContext.values || {};
  const body = renderTemplate(
    {
      ...payload.root,
      children: payload.children || [],
    },
    values,
    locale,
  );
  const head = renderPlaceholders(payload.root.head, values, locale);
  const allTemplates = [payload.root, ...flattenTemplates(payload.children || [])];
  const css = allTemplates
    .map((template) => template?.css || "")
    .filter((value) => value.trim())
    .join("\n\n");
  const js = allTemplates
    .map((template) => template?.javascript || "")
    .filter((value) => value.trim())
    .join("\n\n");
  // Pick up the theme color from page context so the right
  // [data-theme="…"] overlay activates from tokens.css.
  const theme = pageContext.theme || "";
  const bodyAttrs = theme ? ` data-theme="${theme}"` : "";

  const file = join(args.out, args.file || "preview.html");
  const html = `<!doctype html>
<html lang="${locale}">
<head>
${head}
<style>
${css}
</style>
</head>
<body${bodyAttrs}>
${body}
<script>
${js}
</script>
</body>
</html>
`;
  writeFileSync(file, html);
  console.log(`Preview written to ${file}`);
};

main();
