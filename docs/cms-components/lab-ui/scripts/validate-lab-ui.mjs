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
   (via #root > .composition-section). Blocks must NOT declare
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
