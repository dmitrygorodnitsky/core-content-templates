import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const categoryLabels = {
  "01-header": "01 · Header",
  "02-footer": "02 · Footer",
  "03-cta": "03 · CTA",
  "04-language": "04 · Language",
  "05-hero": "05 · Hero",
  "06-features": "06 · Features",
  "07-comparison": "07 · Comparison",
  "08-faq": "08 · FAQ",
  "09-vertical-section": "09 · Vertical section",
  "10-verticals-grid": "10 · Verticals grid",
  "11-mobile-section": "11 · Mobile section",
  "12-decorative": "12 · Decorative",
  "13-signature": "13 · Signature",
};

const listBlockJsonFiles = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "scripts") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listBlockJsonFiles(full));
    if (entry.isFile() && entry.name === "block.json") out.push(full);
  }
  return out;
};

const summarizeSource = (source) => {
  if (!source) return "";
  if (typeof source === "string") return source;
  return source.primary || source.decision || "";
};

const blocks = listBlockJsonFiles(root)
  .map((file) => {
    const block = JSON.parse(readFileSync(file, "utf8"));
    const path = relative(root, file).replace(/\/block\.json$/, "");
    return {
      id: block.id,
      category: block.category,
      path,
      title: block.title || block.name || block.id,
      description: block.description || "",
      canonical: Boolean(block.canonical),
      theme: block.theme || "",
      sourceLabel: summarizeSource(block.source),
      preview: block.preview || {},
      previewVariants: block.previewVariants || [],
      background: block.background || null,
      hasJs: readdirSync(join(root, path)).includes("block.js"),
    };
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));

const categories = [...new Set(blocks.map((block) => block.category))]
  .sort()
  .map((id) => ({
    id,
    label: categoryLabels[id] || id,
    count: blocks.filter((block) => block.category === id).length,
  }));

const manifest = {
  $schema: "lab-ui/manifest@1",
  name: "lab-ui",
  mode: "normalized-block-catalog",
  source: "Generated from per-block block.json files. Do not edit block lists in gallery.html by hand.",
  categories,
  blocks,
};

writeFileSync(join(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(
  join(root, "manifest-data.js"),
  `window.LAB_UI_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`,
);
