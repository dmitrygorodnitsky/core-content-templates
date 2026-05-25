import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  --out docs/cms-components/lab-ui/dist/field-service \\
  --file preview.html`;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const valueToString = (value, locale = "en") => {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return value[locale] ?? value.en ?? Object.values(value)[0] ?? "";
  }
  return String(value);
};

const renderPlaceholders = (html, values, locale) =>
  String(html || "").replace(/\$\{([A-Z0-9_]+)@([A-Z0-9_]+)\}/g, (_, code) =>
    escapeHtml(valueToString(values[code], locale)),
  );

const slotFor = (template) => {
  if (template.code === "FEATURES") return "FEATURE_COLUMNS";
  if (template.code.startsWith("FEATURE_COL_")) return "FEATURE_ITEMS";
  if (template.code === "COMPARISON") return "COMPARE_ROWS";
  if (template.code === "FAQ") return "FAQ_GROUPS";
  if (template.code.startsWith("FAQ_GROUP_")) return "FAQ_ITEMS";
  return "ROOT_SECTIONS";
};

const renderTemplate = (template, values, locale) => {
  let html = renderPlaceholders(template.html, values, locale);
  if (template.children?.length) {
    const childrenHtml = template.children.map((child) => renderTemplate(child, values, locale)).join("\n");
    html = html.replace(new RegExp(`<!--\\s*cms-child-slot:${slotFor(template)}\\s*-->`, "g"), childrenHtml);
  }
  return html.replace(/<!--\s*cms-child-slot:[A-Z0-9_]+\s*-->/g, "");
};

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
  const css = payload.root.css || "";
  const js = payload.root.javascript || "";
  const file = join(args.out, args.file || "preview.html");
  const html = `<!doctype html>
<html lang="${locale}">
<head>
${head}
<style>
${css}
</style>
</head>
<body>
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
