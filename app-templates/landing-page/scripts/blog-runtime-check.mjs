import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../blocks/15-blog/_shared/blog-runtime.js", import.meta.url), "utf8");

function runtime(pathname = "/fr/blog") {
  const window = {
    location: { pathname },
    __swLocale: null,
  };
  const context = {
    window,
    document: { documentElement: { lang: "en" } },
    Intl,
    Number,
    Promise,
    URL,
    console,
  };
  vm.runInNewContext(source, context);
  return window.LabBlog;
}

const blog = runtime();
assert.equal(blog.getLocale(), "fr");
assert.equal(blog.localizedText({ fr: "Titre", en: "Title" }, "fr", ""), "Titre");
assert.equal(blog.localizedText({ en: "Title" }, "fr", ""), "Title");
assert.equal(blog.localizedText("Plain title", "fr", ""), "Plain title");

const localized = blog.normalizePost({
  code: "INTERNAL_PRODUCT_CODE",
  permalink: "routing-guide",
  metadata: { TITLE: { en: "Routing guide" } },
}, "fr");
assert.equal(localized.title, "Routing guide");

assert.equal(
  blog.normalizePost({ permalink: "p", heroImage: { id: "abc-123" } }, "en").imageUrl,
  "/core/image/abc-123/get",
);
assert.equal(
  blog.normalizePost({ permalink: "p", heroImage: "https://cdn.example.com/hero.png" }, "en").imageUrl,
  "https://cdn.example.com/hero.png",
);
assert.equal(
  blog.normalizePost({ permalink: "p", heroImage: { id: "x" }, metadata: { HERO_IMAGE_URL: "/явный.png" } }, "en").imageUrl,
  "/явный.png",
);

const hydratable = blog.normalizePost({ code: "INTERNAL_CODE", permalink: "internal-code" }, "fr");
assert.equal(hydratable.title, "");
assert.equal(hydratable.permalink, "internal-code");
assert.match(source, /return Boolean\(post\.title\);/);
assert.equal(blog.normalizePost({ code: "INTERNAL_CODE" }, "fr"), null);
const config = { locale: "fr", basePath: "/blog", postPath: "/post" };
assert.equal(blog.buildIndexUrl(config), "/fr/blog");
assert.equal(blog.buildPostUrl({ permalink: "routing-guide" }, config), "/fr/post/routing-guide");
assert.equal(blog.currentPermalink(config), "");
assert.equal(runtime("/fr/post/routing-guide").currentPermalink(config), "routing-guide");
assert.equal(runtime("/fr/post/news/my-post").currentPermalink(config), "news/my-post");
assert.equal(runtime("/pages/SERVICEWAND/blog.html/routing-guide").currentPermalink(config), "routing-guide");

console.log("blog-runtime-check ok");
