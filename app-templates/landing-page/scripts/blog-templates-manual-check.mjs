import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const labRoot = resolve(scriptsDir, "..");
const manualRoot = join(labRoot, "dist", "manual-upload", "servicewand-blog");
const exporter = join(scriptsDir, "export-blog-templates-manual.mjs");

function runExporter() {
  const result = spawnSync(process.execPath, [exporter], { cwd: resolve(labRoot, "..", ".."), encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Blog exporter failed");
}

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }).sort();
}

function digest() {
  const hash = createHash("sha256");
  for (const file of files(manualRoot)) {
    hash.update(file.slice(manualRoot.length));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

function readTemplate(key) {
  return JSON.parse(readFileSync(join(manualRoot, key, "template.json"), "utf8"));
}

runExporter();
const firstDigest = digest();
runExporter();
assert.equal(digest(), firstDigest, "manual export must be deterministic");

const index = readTemplate("index");
const post = readTemplate("post");
const payload = JSON.parse(readFileSync(join(manualRoot, "cms-family.payload.json"), "utf8"));
assert.deepEqual([index.code, post.code], ["SERVICEWAND_BLOG_INDEX", "SERVICEWAND_BLOG_POST"]);
assert.deepEqual([payload.root.code, ...payload.children.map((template) => template.code)], [index.code, post.code]);
for (const template of [index, post]) {
  assert.equal(template.parent, null, `${template.code} must not change a root parent`);
  assert.deepEqual(template.children, [], `${template.code} must not change root children`);
  assert.match(template.javascript, /blog-post\/list\.json\?locale=/);
  assert.doesNotMatch(template.javascript, /Untitled post|post\.slug \|\| post\.permalink/);
  assert.doesNotMatch(JSON.stringify(template), /Lorem Ipsum/i);
}

assert.match(index.html, /<h1[\s>]/);
assert.match(index.html, /<h2[\s>]/);
assert.match(index.html, /<h3[\s>]/);
assert.match(index.html, /^<section class="blog-index"/);
assert.match(post.html, /^<section class="blog-post-page"/);
assert.doesNotMatch(index.html, /composition-section/);
assert.doesNotMatch(post.html, /composition-section/);
assert.doesNotMatch(index.html, /<section[^>]*>\s*<section/i);
assert.doesNotMatch(post.html, /<section[^>]*>\s*<section/i);
assert.ok(index.parameters.every((parameter) => parameter.code.startsWith("SERVICEWAND_BLOG_INDEX_")));
assert.ok(post.parameters.every((parameter) => parameter.code.startsWith("SERVICEWAND_BLOG_POST_")));
assert.equal(post.parameters.some((parameter) => parameter.type === "BLOG_POST_CONTENT_SS"), false);
assert.equal(post.parameters.some((parameter) => parameter.code.endsWith("BLOG_POST_CONTENT")), false);
assert.equal(post.html.match(/\$\{POST@BLOG_POST_CONTENT_SS\}/g)?.length, 1);
assert.doesNotMatch(post.html, /SERVICEWAND_BLOG_POST_BLOG_POST_CONTENT/);
const postPreview = readFileSync(join(manualRoot, "post", "preview.html"), "utf8");
assert.doesNotMatch(postPreview, /\$\{POST@BLOG_POST_CONTENT_SS\}/);
assert.match(postPreview, /<h1>A practical guide to field service routing<\/h1>/);
assert.match(post.javascript, /currentPermalink/);
assert.match(post.javascript, /serverRenderedTitle/);
assert.match(index.javascript, /localeFromPath/);

console.log(`blog-templates-manual-check ok: ${firstDigest.slice(0, 12)}`);
