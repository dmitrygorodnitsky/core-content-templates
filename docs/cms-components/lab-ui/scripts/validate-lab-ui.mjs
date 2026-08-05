import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const requiredBlockFiles = [
  "block.html",
  "block.css",
  "block.json",
  "harness.html",
  "preview-1440.png",
  "preview-390.png",
];

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`FAIL ${message}`);
};
const warn = (message) => console.warn(`WARN ${message}`);

const listFiles = (dir, predicate) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, predicate));
    if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
};

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${file}: ${error.message}`);
    return null;
  }
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cssZIndexForClass = (css, className) => {
  const zIndexes = [];
  const classRe = new RegExp(`(^|[^a-zA-Z0-9_-])\\.${escapeRegExp(className)}([^a-zA-Z0-9_-]|$)`);
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1];
    const body = match[2];
    if (!classRe.test(selector)) continue;
    const zIndex = body.match(/\bz-index\s*:\s*(-?\d+)\s*;?/);
    if (zIndex) zIndexes.push(Number(zIndex[1]));
  }
  return zIndexes.length ? Math.max(...zIndexes) : 0;
};

const cssClassHasPointerEventsNone = (css, className) => {
  const classRe = new RegExp(`(^|[^a-zA-Z0-9_-])\\.${escapeRegExp(className)}([^a-zA-Z0-9_-]|$)`);
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1];
    const body = match[2];
    if (!classRe.test(selector)) continue;
    if (/\bpointer-events\s*:\s*none\s*;?/i.test(body)) return true;
  }
  return false;
};

const imageFallbackPairs = (html) => {
  const pairs = [];
  const pairRe = /<img\b[^>]*\bclass=(["'])([^"']+)\1[^>]*>\s*<[^>]+\bclass=(["'])([^"']+)\3/gi;
  for (const match of html.matchAll(pairRe)) {
    const imgClass = match[2].split(/\s+/).filter(Boolean)[0];
    const fallbackClass = match[4].split(/\s+/).filter(Boolean)[0];
    if (imgClass && fallbackClass) pairs.push({ imgClass, fallbackClass });
  }
  return pairs;
};

const manifest = readJson(join(root, "manifest.json"));
const blockJsonFiles = listFiles(root, (file) => file.endsWith("block.json")).sort();
const blockById = new Map();

for (const file of blockJsonFiles) {
  const block = readJson(file);
  if (!block) continue;
  const dir = dirname(file);
  const idFromDir = basename(dir);
  const categoryFromDir = basename(dirname(dir));

  if (block.id !== idFromDir) fail(`${file}: id ${block.id} does not match directory ${idFromDir}`);
  if (block.category !== categoryFromDir) fail(`${file}: category ${block.category} does not match directory ${categoryFromDir}`);
  if (blockById.has(block.id)) fail(`${file}: duplicate id ${block.id}`);
  blockById.set(block.id, { block, dir });

  for (const required of requiredBlockFiles) {
    if (!existsSync(join(dir, required))) fail(`${block.id}: missing ${required}`);
  }

  if (Array.isArray(block.image_slots) && block.image_slots.length) {
    const html = existsSync(join(dir, "block.html")) ? readFileSync(join(dir, "block.html"), "utf8") : "";
    const css = existsSync(join(dir, "block.css")) ? readFileSync(join(dir, "block.css"), "utf8") : "";
    for (const pair of imageFallbackPairs(html)) {
      const imageZIndex = cssZIndexForClass(css, pair.imgClass);
      const fallbackZIndex = cssZIndexForClass(css, pair.fallbackClass);
      if (fallbackZIndex > imageZIndex) {
        fail(`${block.id}: .${pair.fallbackClass} z-index (${fallbackZIndex}) must not be above .${pair.imgClass} (${imageZIndex})`);
      }
      if (cssClassHasPointerEventsNone(css, pair.imgClass)) {
        fail(`${block.id}: .${pair.imgClass} must not set pointer-events:none; put it on the fallback/placeholder instead`);
      }
    }
  }

  const paramsByCode = new Map((block.params || []).map((param) => [param.code, param]));
  for (const slot of block.image_slots || []) {
    if (!slot.id) fail(`${block.id}: image slot is missing id`);
    if (!slot.src_param) fail(`${block.id}: image slot ${slot.id || "(unknown)"} is missing src_param`);
    if (!slot.alt_param) fail(`${block.id}: image slot ${slot.id || "(unknown)"} is missing alt_param`);
    if (!slot.name_param) fail(`${block.id}: image slot ${slot.id || "(unknown)"} is missing name_param`);
    if (!slot.recommended_size && !slot.aspect_ratio) {
      fail(`${block.id}: image slot ${slot.id || "(unknown)"} must declare recommended_size or aspect_ratio`);
    }
    if (slot.recommended_size && !/^\d+\s*(?:×|x|X)\s*\d+$/.test(String(slot.recommended_size).trim())) {
      fail(`${block.id}: image slot ${slot.id || "(unknown)"} recommended_size must look like 1280 × 800`);
    }
    const src = paramsByCode.get(slot.src_param);
    const alt = paramsByCode.get(slot.alt_param);
    const name = paramsByCode.get(slot.name_param);
    if (!src || src.type !== "IMAGE") fail(`${block.id}: image slot ${slot.id || "(unknown)"} src_param must reference an IMAGE param`);
    if (!alt || !["LOCALIZED_STRING_SS", "STRING"].includes(alt.type)) {
      fail(`${block.id}: image slot ${slot.id || "(unknown)"} alt_param must reference a text param`);
    }
    if (!name || name.type !== "STRING") fail(`${block.id}: image slot ${slot.id || "(unknown)"} name_param must reference a STRING param`);
  }
}

if (manifest) {
  const manifestIds = new Set(manifest.blocks.map((block) => block.id));
  for (const id of blockById.keys()) {
    if (!manifestIds.has(id)) fail(`${id}: block.json is missing from manifest.json`);
  }
  for (const block of manifest.blocks) {
    const local = blockById.get(block.id);
    if (!local) {
      fail(`${block.id}: manifest block has no block.json`);
      continue;
    }
    if (block.path !== `${local.block.category}/${local.block.id}`) {
      fail(`${block.id}: manifest path ${block.path} does not match block directory`);
    }
    if (block.category !== local.block.category) {
      fail(`${block.id}: manifest category ${block.category} does not match block.json`);
    }
  }
}

for (const file of listFiles(root, (candidate) => candidate.endsWith("block.js"))) {
  try {
    new Function(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${file}: JS syntax error: ${error.message}`);
  }
}

const classOwners = new Map();
const classRe = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;
for (const file of listFiles(root, (candidate) => candidate.endsWith("block.css"))) {
  const blockId = basename(dirname(file));
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  let match;
  const classes = new Set();
  while ((match = classRe.exec(css))) classes.add(match[1]);
  for (const className of classes) {
    if (!classOwners.has(className)) classOwners.set(className, new Set());
    classOwners.get(className).add(blockId);
  }
}

const duplicates = [...classOwners.entries()]
  .map(([className, owners]) => [className, [...owners]])
  .filter(([, owners]) => owners.length > 1)
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

if (duplicates.length) {
  warn(`CSS collision candidates: ${duplicates.length}`);
  for (const [className, owners] of duplicates.slice(0, 30)) {
    warn(`.${className}: ${owners.join(", ")}`);
  }
}

/* ─── Guard · padding-block on root block selector ──────────
   Inter-section vertical rhythm is owned by 00-tokens/composition.css
   (via .composition-section). Blocks must NOT declare
   `padding-block` on their root class — that would stack with the
   composer-default padding and create double vertical spacing.
   Per-element paddings on inner elements (.compare-grid, .faq-item,
   etc.) are fine. */
const rootSelectorPaddingBlockRe = /(^|\n)\s*(\.[a-zA-Z][\w-]*)\s*\{[^{}]*?\bpadding-block\b/g;
for (const file of listFiles(root, (candidate) => candidate.endsWith("block.css"))) {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  let match;
  while ((match = rootSelectorPaddingBlockRe.exec(css))) {
    const selector = match[2];
    // Only top-level standalone class selectors (no descendant, no compound, no media-wrap).
    // The regex matches a single .class on its own — descendant selectors won't
    // produce a clean (^|\n)\s*\.class\s*\{ match.
    warn(`${file}: ${selector} declares padding-block on a root block selector — composer owns inter-section spacing`);
  }
}

console.log(`Validated ${blockById.size} blocks across ${manifest?.categories?.length ?? 0} categories.`);
if (failed) process.exit(1);
