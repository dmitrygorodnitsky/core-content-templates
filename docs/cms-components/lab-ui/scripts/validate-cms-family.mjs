import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") out.out = args[++i];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \\
  --out docs/cms-components/lab-ui/dist/<slug>`;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const listFiles = (dir, predicate) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, predicate));
    if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
};

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`FAIL ${message}`);
};

const fields = ["head", "html", "css", "javascript"];

const flatten = (templates) => templates.flatMap((template) => [template, ...flatten(template.children || [])]);

const collectPlaceholders = (template) => {
  const found = [];
  for (const field of fields) {
    const text = String(template[field] || "");
    for (const match of text.matchAll(/\$\{([A-Z0-9_]+)@([A-Z0-9_]+)\}/g)) {
      found.push({ code: match[1], type: match[2], field, template: template.code });
    }
  }
  return found;
};

const main = () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.out) throw new Error(usage());
  if (!existsSync(args.out)) throw new Error(`Output directory not found: ${args.out}`);

  const required = [
    "composition.resolved.json",
    "root.template.json",
    "cms-family.payload.json",
    "page-context.sample.json",
    "parameters.json",
    "summary.md",
  ];
  for (const file of required) {
    if (!existsSync(join(args.out, file))) fail(`missing ${file}`);
  }
  if (!existsSync(join(args.out, "landing.model.json")) && !existsSync(join(args.out, "landing.spec.json"))) {
    fail("missing landing.model.json or landing.spec.json");
  }

  const root = readJson(join(args.out, "root.template.json"));
  const payload = readJson(join(args.out, "cms-family.payload.json"));
  const parameters = readJson(join(args.out, "parameters.json"));
  const pageContext = readJson(join(args.out, "page-context.sample.json"));
  const childFiles = listFiles(join(args.out, "children"), (file) => file.endsWith("template.json"));
  const fileChildren = childFiles.map(readJson);
  const payloadChildren = flatten(payload.children || []);
  const allTemplates = [root, ...payloadChildren];

  if (!root.css || root.css.length < 1000) fail("root template must contain shared CSS infrastructure");
  if (!root.javascript || root.javascript.length < 50) fail("root template must contain shared JavaScript infrastructure");
  if (!root.head.includes("<meta")) fail("root head should contain CMS head fragment");
  if (root.html.includes("<!doctype") || root.html.includes("<html")) fail("root html must be a body fragment");
  if (root.css.includes("<style")) fail("root css must not include <style>");
  if (root.javascript.includes("<script")) fail("root javascript must not include <script>");
  if (/generated root CSS: .*\/block\.css/.test(root.css)) fail("root css must not bundle block-specific block.css files");
  if (/generated root JS: .*\/block\.js/.test(root.javascript)) fail("root javascript must not bundle block-specific block.js files");

  for (const child of payloadChildren) {
    if (child.head) fail(`${child.code}: child head must be empty`);
    if (child.css?.includes("<style")) fail(`${child.code}: child css must not include <style>`);
    if (child.javascript?.includes("<script")) fail(`${child.code}: child javascript must not include <script>`);
  }

  const declared = new Map();
  const duplicateCodes = [];
  for (const param of parameters) {
    if (declared.has(param.code)) duplicateCodes.push(param.code);
    declared.set(param.code, param.type);
    if (!param.nls?.en?.NAME || !String(param.nls.en.NAME).trim()) fail(`${param.code}: missing English parameter name`);
    if (!param.nls?.en?.DESCRIPTION || !String(param.nls.en.DESCRIPTION).trim()) fail(`${param.code}: missing English parameter description`);
    if (param.type === "STRING" && /_ICON$/.test(param.code) && (!Array.isArray(param.options) || !param.options.length)) {
      fail(`${param.code}: enum-style icon parameter must expose options metadata`);
    }
  }
  for (const code of duplicateCodes) fail(`duplicate parameter code ${code}`);

  const placeholders = allTemplates.flatMap(collectPlaceholders);
  const usedKeys = new Set(placeholders.map((item) => `${item.code}@${item.type}`));
  for (const item of placeholders) {
    if (!declared.has(item.code)) fail(`${item.template}.${item.field}: missing parameter declaration ${item.code}@${item.type}`);
    if (declared.get(item.code) !== item.type) {
      fail(`${item.template}.${item.field}: parameter ${item.code} type mismatch, placeholder ${item.type}, declared ${declared.get(item.code)}`);
    }
  }
  for (const param of parameters) {
    if (!usedKeys.has(`${param.code}@${param.type}`)) fail(`declared parameter is unused: ${param.code}@${param.type}`);
  }

  const templateCodes = new Set(allTemplates.map((template) => template.code));
  if (templateCodes.size !== allTemplates.length) fail("template codes must be unique across family");
  for (const code of templateCodes) {
    if (!pageContext.enabledTemplates?.includes(code)) fail(`page-context.sample.json missing enabled template ${code}`);
  }
  for (const code of pageContext.enabledTemplates || []) {
    if (!templateCodes.has(code)) fail(`page-context.sample.json has unknown enabled template ${code}`);
  }

  for (const template of allTemplates) {
    if (/\{\{[A-Za-z0-9_-]+\}\}/.test(`${template.head || ""}\n${template.html || ""}\n${template.css || ""}\n${template.javascript || ""}`)) {
      fail(`${template.code}: unresolved lab-ui handlebars placeholder`);
    }
    for (const match of String(template.html || "").matchAll(/<img\b[^>]*\bsrc="[^"]*\$\{([A-Z0-9_]+)@IMAGE\}[^"]*"[^>]*>/g)) {
      const tag = match[0];
      if (!/\bsrc="\/core\/image\/\$\{[A-Z0-9_]+@IMAGE\}\/get\*\*\/\$\{([A-Z0-9_]+)@STRING\}"/.test(tag)) {
        fail(`${template.code}: image ${match[1]} must use CMS image route with IMAGE NAME`);
      }
      if (!/\balt="\$\{[A-Z0-9_]+@(?:LOCALIZED_STRING_SS|STRING)\}"/.test(tag)) {
        fail(`${template.code}: image ${match[1]} must have parameterized alt text`);
      }
      if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) {
        fail(`${template.code}: image ${match[1]} must declare width and height attributes`);
      }
      const imageCode = match[1];
      if (!parameters.some((param) => param.code === imageCode && param.type === "IMAGE")) {
        fail(`${template.code}: image ${imageCode} missing IMAGE parameter declaration`);
      }
      const nameCode = tag.match(/\bsrc="\/core\/image\/\$\{[A-Z0-9_]+@IMAGE\}\/get\*\*\/\$\{([A-Z0-9_]+)@STRING\}"/)?.[1];
      if (!nameCode || !parameters.some((param) => param.code === nameCode && param.type === "STRING")) {
        fail(`${template.code}: image ${imageCode} missing IMAGE NAME parameter declaration`);
      }
    }
  }

  if (fileChildren.length !== payloadChildren.length) {
    fail(`children/**/template.json count ${fileChildren.length} does not match payload child count ${payloadChildren.length}`);
  }

  console.log(`Validated CMS family ${root.code}: ${payloadChildren.length} child templates, ${parameters.length} parameters.`);
  if (failed) process.exit(1);
};

main();
