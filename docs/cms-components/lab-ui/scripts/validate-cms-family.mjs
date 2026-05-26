import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NESTED_CODE_PATTERNS, SLOT_MARKERS } from "./cms-family-contract.mjs";

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
  --out docs/cms-components/lab-ui/dist/sample-landing`;

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
    "landing.model.json",
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

  const root = readJson(join(args.out, "root.template.json"));
  const payload = readJson(join(args.out, "cms-family.payload.json"));
  const parameters = readJson(join(args.out, "parameters.json"));
  const pageContext = readJson(join(args.out, "page-context.sample.json"));
  const childFiles = listFiles(join(args.out, "children"), (file) => file.endsWith("template.json"));
  const fileChildren = childFiles.map(readJson);
  const payloadChildren = flatten(payload.children || []);
  const allTemplates = [root, ...payloadChildren];

  if (!root.css || root.css.length < 1000) fail("root template must own bundled CSS");
  if (!root.javascript || root.javascript.length < 50) fail("root template must own bundled JavaScript");
  if (!root.head.includes("<meta")) fail("root head should contain CMS head fragment");
  if (root.html.includes("<!doctype") || root.html.includes("<html")) fail("root html must be a body fragment");
  if (root.css.includes("<style")) fail("root css must not include <style>");
  if (root.javascript.includes("<script")) fail("root javascript must not include <script>");

  for (const child of payloadChildren) {
    if (child.head) fail(`${child.code}: child head must be empty`);
    if (child.css) fail(`${child.code}: child css must be empty; root owns CSS`);
    if (child.javascript) fail(`${child.code}: child javascript must be empty; root owns JS`);
  }

  const declared = new Map();
  const duplicateCodes = [];
  for (const param of parameters) {
    if (declared.has(param.code)) duplicateCodes.push(param.code);
    declared.set(param.code, param.type);
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

  const faq = payloadChildren.find((template) => template.code === "FAQ");
  if (!faq) fail("FAQ parent template is missing");
  if (faq && !flatten(faq.children || []).some((child) => NESTED_CODE_PATTERNS.FAQ_ITEM.test(child.code))) fail("FAQ family must contain nested FAQ_N children");
  if (faq && !faq.html.includes(`cms-child-slot:${SLOT_MARKERS.faqGroups}`)) fail("FAQ parent html must include FAQ group slot marker");
  if (
    faq &&
    !(faq.children || []).every((child) => !NESTED_CODE_PATTERNS.FAQ_GROUP.test(child.code) || child.html.includes(`cms-child-slot:${SLOT_MARKERS.faqItems}`))
  ) {
    fail("FAQ group templates must include FAQ item slot markers");
  }

  const compare = payloadChildren.find((template) => template.code === "COMPARISON");
  if (compare && !compare.children?.some((child) => NESTED_CODE_PATTERNS.COMPARE_ROW.test(child.code))) {
    fail("COMPARISON parent must contain nested COMPARE_ROW_N children");
  }

  const features = payloadChildren.find((template) => template.code === "FEATURES");
  if (features && !flatten(features.children || []).some((child) => NESTED_CODE_PATTERNS.FEATURE_ITEM.test(child.code))) {
    fail("FEATURES family must contain nested FEATURE_N children");
  }
  if (features && !features.html.includes(`cms-child-slot:${SLOT_MARKERS.featureColumns}`)) {
    fail("FEATURES parent html must include feature column slot marker");
  }
  if (
    features &&
    !(features.children || []).every((child) => !NESTED_CODE_PATTERNS.FEATURE_COL.test(child.code) || child.html.includes(`cms-child-slot:${SLOT_MARKERS.featureItems}`))
  ) {
    fail("FEATURE column templates must include feature item slot markers");
  }

  if (fileChildren.length !== payloadChildren.length) {
    fail(`children/**/template.json count ${fileChildren.length} does not match payload child count ${payloadChildren.length}`);
  }

  console.log(`Validated CMS family ${root.code}: ${payloadChildren.length} child templates, ${parameters.length} parameters.`);
  if (failed) process.exit(1);
};

main();
