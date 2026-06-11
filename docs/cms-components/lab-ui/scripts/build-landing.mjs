/* Operator-facing wrapper for the lab-ui block composer.
 *
 *   node scripts/build-landing.mjs --request "HVAC vertical, ~2500 words"
 *   node scripts/build-landing.mjs --topic hvac --words 2500
 *
 * The only structural invariant is:
 *   a 01-header block first, a 02-footer block last.
 *
 * Everything between them is selected from manifest.json and compiled from
 * block.html / block.css / block.js / block.json. No copy.md, no hand-authored
 * HTML/CSS/JS, no upload.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const labRoot = resolve(scriptsDir, "..");
const repoRoot = resolve(labRoot, "..", "..", "..");
const generatedDir = join(labRoot, "compositions", "generated");

const RECIPE_DEFS = {
  small: {
    minWords: 700,
    maxWords: 1600,
    candidates: [
      ["hero.operational-diagram", "features.card-grid-3", "section.h2-narrative-only", "decorative.callout-band"],
      ["hero.composite-photo", "features.card-grid-3", "section.stats-strip", "decorative.callout-band"],
      ["hero.operational-diagram", "section.axes-grid", "features.card-grid-3", "decorative.cycle-strip"],
    ],
  },
  medium: {
    minWords: 1601,
    maxWords: 3200,
    candidates: [
      ["hero.operational-diagram", "section.h2-narrative-only", "features.card-grid-4", "section.axes-grid", "comparison.three-col-with-mobile-cards", "faq.bubble-light-grouped", "decorative.callout-band"],
      ["hero.composite-photo", "features.accordion-2col-numbered", "section.stages-list", "mobile.4-card-glyph", "faq.bubble-light-grouped", "decorative.callout-band"],
      ["hero.operational-diagram", "section.stats-strip", "features.card-grid-3", "verticals.glyph-grid-20-slots", "comparison.three-col-with-mobile-cards", "faq.bubble-light-grouped"],
    ],
  },
  long: {
    minWords: 3201,
    maxWords: 7000,
    candidates: [
      ["hero.composite-photo", "section.h2-narrative-only", "features.accordion-2col-numbered", "section.axes-grid", "section.stages-list", "mobile.4-card-glyph", "comparison.three-col-with-mobile-cards", "signature.ai-shell", "faq.bubble-light-grouped", "decorative.callout-band"],
      ["hero.operational-diagram", "features.card-grid-4", "section.h2-narrative-only", "verticals.glyph-grid-20-slots", "section.stats-strip", "comparison.three-col-with-mobile-cards", "faq.bubble-light-grouped", "signature.ai-shell"],
      ["hero.composite-photo", "section.axes-grid", "features.accordion-2col-numbered", "decorative.cycle-strip", "mobile.4-card-glyph", "verticals.glyph-grid-20-slots", "comparison.three-col-with-mobile-cards", "faq.bubble-light-grouped"],
    ],
  },
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--request") out.request = args[++i];
    else if (arg === "--topic") out.topic = args[++i];
    else if (arg === "--words") out.words = Number(args[++i]);
    else if (arg === "--theme") out.theme = args[++i];
    else if (arg === "--background") out.background = args[++i];
    else if (arg === "--slug") out.slug = args[++i];
    else if (arg === "--sections") out.sections = args[++i];
    else if (arg === "--spec") out.spec = args[++i];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node docs/cms-components/lab-ui/scripts/build-landing.mjs \\
    --request "HVAC vertical landing, ~2500 words"

  node docs/cms-components/lab-ui/scripts/build-landing.mjs \\
    --topic hvac \\
    --words 2500

  node docs/cms-components/lab-ui/scripts/build-landing.mjs \\
    --topic hvac \\
    --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped

Steps run in order:
  1. Write landing.spec.json with a 01-header block first and a 02-footer block last
  2. compose-cms-family.mjs --spec <spec> --out dist/<slug>
  3. validate-cms-family.mjs --out dist/<slug>
  4. render-cms-family-preview.mjs --out dist/<slug> --file preview.html`;

const fail = (message, code = 1) => {
  console.error(`build-landing: ${message}`);
  process.exit(code);
};

const runStep = (label, command, args) => {
  process.stdout.write(`> ${label}...\n`);
  try {
    execFileSync(command, args, { stdio: "inherit" });
  } catch (err) {
    fail(`step "${label}" failed (exit ${err.status ?? "?"})`, err.status || 1);
  }
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const codeSlug = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const titleize = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => (part.length <= 4 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join(" ");

const timestamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const hashString = (value) => {
  let hash = 0;
  for (const char of String(value)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
};

const inferWords = (request = "", fallback = 2500) => {
  const match = String(request).match(/~?\s*(\d{3,5})\s*(?:words?|слов|слова|word)?/i);
  return match ? Number(match[1]) : fallback;
};

const readThemes = () => JSON.parse(readFileSync(join(labRoot, "compositions", "themes.json"), "utf8"));
const readManifest = () => JSON.parse(readFileSync(join(labRoot, "manifest.json"), "utf8"));

const inferTopic = (request = "") => {
  const text = String(request).toLowerCase();
  const explicit = text.match(/\b(?:topic|vertical|theme)\s*[:=]\s*([a-z0-9 -]+)/)?.[1];
  if (explicit) return slugify(explicit);
  const themes = readThemes();
  const keys = Object.keys(themes.verticals || {}).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const loose = key.replace(/-/g, "[ -]?");
    if (new RegExp(`\\b${loose}\\b`, "i").test(text)) return key;
  }
  const firstWords = text.match(/[a-z0-9]+(?:[ -][a-z0-9]+){0,2}/)?.[0] || "landing";
  return slugify(firstWords.replace(/\b(make|build|create|landing|vertical|template|words|word|on|for|about)\b/g, ""));
};

const pickRecipe = (words) => {
  for (const [name, recipe] of Object.entries(RECIPE_DEFS)) {
    if (words >= recipe.minWords && words <= recipe.maxWords) return { name, ...recipe };
  }
  return words > RECIPE_DEFS.long.maxWords
    ? { name: "long", ...RECIPE_DEFS.long }
    : { name: "small", ...RECIPE_DEFS.small };
};

const resolveTheme = (topic, override) => {
  const themes = readThemes();
  if (override) {
    if (!themes.themes.includes(override)) fail(`unknown theme "${override}"`);
    return override;
  }
  return themes.verticals?.[topic] || themes.default || "cyan";
};

const normalizeSections = (raw, recipe, topic) => {
  const selected = raw
    ? raw.split(",").map((item) => item.trim()).filter(Boolean)
    : recipe.candidates[hashString(topic) % recipe.candidates.length];
  const categoryById = new Map(readManifest().blocks.map((block) => [block.id, block.category]));
  const isHeader = (id) => categoryById.get(id) === "01-header";
  const isFooter = (id) => categoryById.get(id) === "02-footer";
  const normalized = selected.filter((id, index) => {
    if (index === 0 && isHeader(id)) return true;
    if (index === selected.length - 1 && isFooter(id)) return true;
    return !isHeader(id) && !isFooter(id);
  });
  if (!isHeader(normalized[0])) normalized.unshift("header.default");
  if (!isFooter(normalized[normalized.length - 1])) normalized.push("footer.default");
  return normalized;
};

const prepareSpec = (args) => {
  if (args.spec) return { specAbs: resolve(args.spec), generated: false };

  const request = args.request || "";
  const words = Number.isFinite(args.words) ? args.words : inferWords(request);
  const topic = slugify(args.topic || inferTopic(request) || "landing") || "landing";
  const theme = resolveTheme(topic, args.theme);
  const recipe = pickRecipe(words);
  const slug = args.slug || `${topic}-${timestamp()}`;
  const topicName = titleize(topic || "landing") || "Landing";
  const spec = {
    $schema: "lab-ui/landing-spec@1",
    code: `${codeSlug(topic || "landing")}_LANDING`,
    name: `${topicName} Landing`,
    url: topic && topic !== "landing" ? `/verticals/${topic}` : `/${slug}`,
    locale: "en",
    topic,
    targetWords: words,
    theme,
    background: args.background || "none",
    recipe: recipe.name,
    sections: normalizeSections(args.sections, recipe, topic),
  };

  mkdirSync(generatedDir, { recursive: true });
  const specAbs = join(generatedDir, `${slug}.spec.json`);
  writeFileSync(specAbs, `${JSON.stringify(spec, null, 2)}\n`);
  return { specAbs, slug, topic, words, theme, recipeName: recipe.name, sections: spec.sections, generated: true };
};

const countWords = (value) => {
  if (value == null) return 0;
  if (typeof value === "string") return value.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (typeof value === "object") {
    return Object.values(value).reduce((sum, v) => sum + (typeof v === "string" ? countWords(v) : 0), 0);
  }
  return 0;
};

const summarize = (outDir) => {
  const payload = JSON.parse(readFileSync(join(outDir, "cms-family.payload.json"), "utf8"));
  const resolved = JSON.parse(readFileSync(join(outDir, "composition.resolved.json"), "utf8"));
  const root = payload.root || {};
  const children = payload.children || [];
  const flatten = (templates) => templates.flatMap((template) => [template, ...flatten(template.children || [])]);
  const flatChildren = flatten(children);
  const all = [root, ...flatChildren];
  const totalParams = all.reduce((sum, t) => sum + (t.parameters?.length || 0), 0);
  const totalWords = all.reduce(
    (sum, t) => sum + (t.parameters || []).reduce((paramSum, param) => paramSum + countWords(param.value), 0),
    0,
  );
  const previewPath = join(outDir, "preview.html");

  console.log("\n=== build-landing summary ===\n");
  console.log(`landing code:   ${root.code || "(unknown)"}`);
  console.log(`templates:      ${all.length} (root + ${children.length} direct / ${flatChildren.length} total children)`);
  console.log(`parameters:     ${totalParams}`);
  console.log(`total words:    ${totalWords} (placeholder values, stripped of HTML)`);
  console.log("");
  console.log("selected blocks:");
  for (const block of resolved.selectedBlocks || []) {
    console.log(`  ${String(block.index).padStart(2, "0")}. ${block.id}`);
  }
  console.log("");
  console.log(`out dir:        ${relative(repoRoot, outDir)}`);
  if (existsSync(previewPath)) {
    console.log(`preview:        file://${previewPath}`);
    console.log(`                ${formatBytes(statSync(previewPath).size)}`);
  }
  console.log("");
};

const formatBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const main = () => {
  const args = parseArgs();
  if (args.help || (!args.spec && !args.request && !args.topic)) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const prepared = prepareSpec(args);
  if (!existsSync(prepared.specAbs)) fail(`spec file not found: ${prepared.specAbs}`);
  const slug = args.slug || prepared.slug || slugify(JSON.parse(readFileSync(prepared.specAbs, "utf8")).code);
  const outAbs = resolve(repoRoot, `docs/cms-components/lab-ui/dist/${slug}`);

  const node = process.execPath;
  const composeScript = join(scriptsDir, "compose-cms-family.mjs");
  const validateScript = join(scriptsDir, "validate-cms-family.mjs");
  const previewScript = join(scriptsDir, "render-cms-family-preview.mjs");

  if (prepared.generated) {
    console.log("=== build-landing request ===");
    console.log(`topic:         ${prepared.topic}`);
    console.log(`theme:         ${prepared.theme}`);
    console.log(`recipe:        ${prepared.recipeName}`);
    console.log(`target words:  ${prepared.words}`);
    console.log(`spec:          ${relative(repoRoot, prepared.specAbs)}`);
    console.log("sections:");
    prepared.sections.forEach((id, index) => console.log(`  ${String(index + 1).padStart(2, "0")}. ${id}`));
    console.log("");
  }

  runStep("compose", node, [composeScript, "--spec", prepared.specAbs, "--out", outAbs]);
  runStep("validate", node, [validateScript, "--out", outAbs]);
  runStep("preview", node, [previewScript, "--out", outAbs, "--file", "preview.html"]);

  summarize(outAbs);
};

main();
