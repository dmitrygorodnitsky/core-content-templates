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
assert.deepEqual([index.code, post.code], ["FIELD_SERVICE_BLOG_INDEX", "FIELD_SERVICE_BLOG_POST"]);
assert.deepEqual([payload.root.code, ...payload.children.map((template) => template.code)], [index.code, post.code]);
for (const template of [index, post]) {
  assert.equal(template.parent, null, `${template.code} must not change a root parent`);
  assert.deepEqual(template.children, [], `${template.code} must not change root children`);
  assert.match(template.javascript, /blog-post\/list\.json/);
  assert.doesNotMatch(template.javascript, /blog-post\/list\.json\?locale=/);
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
const SEO_METADATA_CODES = [
  "META_TITLE", "META_DESCRIPTION", "HERO_IMAGE_URL", "SEO_LD_SCHEMA",
  "AUTHOR_NAME", "AUTHOR_AVATAR", "AUTHOR_BIO",
];
const SEO_HEAD_LOCALIZED_CODES = ["META_TITLE", "META_DESCRIPTION"];
assert.ok(index.parameters.every((parameter) => parameter.code.startsWith("FIELD_SERVICE_BLOG_INDEX_")));
assert.deepEqual(
  post.parameters
    .filter((parameter) => !parameter.code.startsWith("FIELD_SERVICE_BLOG_POST_"))
    .map((parameter) => parameter.code)
    .sort(),
  [...SEO_METADATA_CODES].sort(),
);
for (const code of SEO_HEAD_LOCALIZED_CODES) {
  const parameter = post.parameters.find((entry) => entry.code === code);
  assert.equal(parameter.type, "LOCALIZED_STRING_SS");
  assert.deepEqual(parameter.value, { en: "" });
  assert.match(post.head, new RegExp(`\\$\\{${code}@LOCALIZED_STRING_SS\\}`));
}
const heroParameter = post.parameters.find((entry) => entry.code === "HERO_IMAGE_URL");
assert.equal(heroParameter.type, "STRING");
assert.equal(heroParameter.value, "");
assert.match(post.head, /\$\{HERO_IMAGE_URL\}/);
assert.doesNotMatch(post.head, /\$\{HERO_IMAGE_URL@/);
const authorBioParameter = post.parameters.find((entry) => entry.code === "AUTHOR_BIO");
assert.equal(authorBioParameter.type, "LOCALIZED_STRING_SS");
assert.deepEqual(authorBioParameter.value, { en: "" });
assert.match(post.html, /data-blog-author-bio>\$\{AUTHOR_BIO@LOCALIZED_STRING_SS\}</);
const authorNameParameter = post.parameters.find((entry) => entry.code === "AUTHOR_NAME");
assert.equal(authorNameParameter.type, "STRING");
assert.equal(authorNameParameter.value, "");
assert.match(post.html, /data-blog-author-name>\$\{AUTHOR_NAME\}</);
const authorAvatarParameter = post.parameters.find((entry) => entry.code === "AUTHOR_AVATAR");
assert.equal(authorAvatarParameter.type, "STRING");
assert.equal(authorAvatarParameter.value, "");
assert.match(post.html, /data-blog-author-avatar="\$\{AUTHOR_AVATAR\}"/);
assert.doesNotMatch(post.html, /<img[^>]*\$\{AUTHOR_AVATAR/);
assert.match(post.javascript, /renderAuthorCard\(root, post\)/);
assert.match(post.javascript, /"@type": "Person"/);
const schemaParameter = post.parameters.find((entry) => entry.code === "SEO_LD_SCHEMA");
assert.equal(schemaParameter.type, "LOCALIZED_JSON_OBJECT");
assert.deepEqual(schemaParameter.value, { en: {} });
assert.match(
  post.html,
  /<script type="application\/ld\+json" data-blog-article-schema>\$\{SEO_LD_SCHEMA@LOCALIZED_JSON_OBJECT\}<\/script>/,
);
assert.doesNotMatch(post.head, /ld\+json/);
assert.equal(post.html.match(/ld\+json/g).length, 1);
assert.match(post.javascript, /if \(node && \(clientWritten\.schema \|\| isPlaceholderSchema\(node\.textContent\)\)\)/);
assert.doesNotMatch(post.head, /<title|name="description"/);
assert.match(post.javascript, /if \(clientWritten\.title \|\| isPlaceholderValue\(document\.title\)\)/);
assert.match(post.javascript, /if \(node && !clientWritten\[selector\] && !isPlaceholderValue\(node\.getAttribute\("content"\)\)\) return;/);
assert.equal(post.parameters.some((parameter) => parameter.type === "BLOG_POST_CONTENT_SS"), false);
assert.equal(post.parameters.some((parameter) => parameter.code.endsWith("BLOG_POST_CONTENT")), false);
assert.equal(post.html.match(/\$\{POST@BLOG_POST_CONTENT_SS\}/g)?.length, 1);
assert.doesNotMatch(post.html, /FIELD_SERVICE_BLOG_POST_BLOG_POST_CONTENT/);
const postPreview = readFileSync(join(manualRoot, "post", "preview.html"), "utf8");
assert.doesNotMatch(postPreview, /\$\{POST@BLOG_POST_CONTENT_SS\}/);
assert.match(postPreview, /<h1>A practical guide to field service routing<\/h1>/);
assert.match(post.javascript, /currentPermalink/);
assert.match(post.javascript, /serverRenderedTitle/);
assert.doesNotMatch(post.javascript, /renderServerMarkdown|markdownFragment|appendInlineMarkdown/);
assert.doesNotMatch(post.javascript, /replaceChildren/);
assert.match(post.html, /data-blog-render-state="pending"/);
assert.match(post.css, /data-blog-render-state="pending"/);
assert.match(post.javascript, /documentPost\(root\)/);
assert.match(post.javascript, /setNamedMeta\("twitter:title"/);
assert.match(post.javascript, /setPropertyMeta\("og:type", "article"\)/);
assert.match(post.javascript, /data-blog-render-state", "ready"/);
assert.match(index.html, /data-blog-post-path="\$\{FIELD_SERVICE_BLOG_INDEX_BLOG_POST_PATH@STRING\}"/);
assert.match(post.html, /data-blog-post-path="\$\{FIELD_SERVICE_BLOG_POST_BLOG_POST_PATH@STRING\}"/);
assert.equal(index.parameters.find((parameter) => parameter.code.endsWith("BLOG_POST_PATH"))?.value, "/post");
assert.equal(post.parameters.find((parameter) => parameter.code.endsWith("BLOG_POST_PATH"))?.value, "/post");
assert.equal(index.parameters.some((parameter) => parameter.code.endsWith("BLOG_CATEGORY_ID")), false);
assert.doesNotMatch(index.html, /data-blog-category-id/);
assert.equal(post.parameters.find((parameter) => parameter.code.endsWith("BLOG_CATEGORY_ID"))?.value, "0");
assert.equal(index.parameters.find((parameter) => parameter.code.endsWith("BLOG_FIXTURE_URL"))?.value, "#");
assert.equal(post.parameters.find((parameter) => parameter.code.endsWith("BLOG_FIXTURE_URL"))?.value, "#");
assert.match(index.javascript, /localeFromPath/);
assert.match(index.javascript, /localizedApiBase/);
assert.match(index.javascript, /credentials:\s*"omit"/);
assert.match(index.javascript, /url === "#" \? "" : url/);
assert.match(index.javascript, /Number\(id\) > 0 \? id : ""/);
assert.match(index.javascript, /new DOMParser\(\)\.parseFromString/);
assert.match(index.javascript, /documentRoot\.querySelector\("pre code"\)/);
assert.match(index.javascript, /fetch\(buildPostUrl\(post, config\)/);
assert.match(index.javascript, /encodeURIComponent\(normalizeLocale\(config\.locale\) \|\| "en"\)/);

console.log(`blog-templates-manual-check ok: ${firstDigest.slice(0, 12)}`);
