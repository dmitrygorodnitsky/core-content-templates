import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { exportSnowRemovalLanding, renderTemplate } from "./export-snow-removal-landing-manual.mjs";
import { SNOW_ENVIRONMENT_NAMES, snowEnvironment, snowEnvironmentForOrigin } from "./snow-removal-landing-environments.mjs";

const landingRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(landingRoot, "content", "snow-removal-software");
const contract = JSON.parse(fs.readFileSync(path.join(contentDir, "seo-contract.json"), "utf8"));
const pack = JSON.parse(fs.readFileSync(path.join(contentDir, "parameter-values.json"), "utf8")).valuesByParamCode;
const EXPECTED_CODES = ["SNOW_REMOVAL_LANDING", "SNOW_REMOVAL_LANDING_HEADER", "SNOW_REMOVAL_LANDING_CONTENT", "SNOW_REMOVAL_LANDING_FOOTER"];
const HTML_SIZE_BUDGET = 120 * 1024;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", mdash: "—", ndash: "–", hellip: "…", times: "×", copy: "©" };
const decode = (text) => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
  if (entity[0] === "#") return String.fromCodePoint(entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  return ENTITIES[entity.toLowerCase()] ?? match;
});
const plain = (html) => decode(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export const extractMain = (html) => {
  const start = html.search(/<main\b[^>]*class="[^"]*\bsnow-landing\b/);
  assert.ok(start >= 0, "the page has a main.snow-landing element");
  const end = html.indexOf("</main>", start);
  assert.ok(end > start, "main.snow-landing is closed");
  return html.slice(start, end + "</main>".length);
};

const removeSections = (html, ids) => ids.reduce((current, id) => {
  const pattern = new RegExp(`<section\\b[^>]*\\bid="${id.replace(/^#/, "")}"[\\s\\S]*?</section>`);
  assert.match(current, pattern, `section ${id} exists`);
  return current.replace(pattern, " ");
}, html);

const countPhrase = (text, phrase) => (text.match(new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")) || []).length;

export const seoReport = (main) => {
  const headings = [...main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({ level: Number(match[1]), text: plain(match[2]) }));
  const scoped = plain(removeSections(main, contract.scope.excludeSections));
  const counts = Object.fromEntries(Object.keys(contract.phraseCounts).map((phrase) => [phrase, countPhrase(scoped, phrase)]));
  const absent = Object.fromEntries(contract.absentPhrases.map((phrase) => [phrase, countPhrase(plain(main), phrase)]));
  return { headings, counts, absent };
};

export const assertSeo = (main) => {
  const report = seoReport(main);
  assert.deepEqual(report.headings, contract.headings, "headings and their levels equal the approved v4 page");
  assert.equal(report.headings.filter((heading) => heading.level === 1).length, 1, "exactly one H1");
  assert.deepEqual(report.counts, contract.phraseCounts, "keyword counts in the main content without pricing and FAQ");
  assert.deepEqual(Object.values(report.absent).filter(Boolean), [], `forbidden phrases are absent: ${JSON.stringify(report.absent)}`);
  return report;
};

export const structuredData = (html) => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  assert.equal(blocks.length, 1, "the page has one JSON-LD block");
  const nodes = blocks[0]["@graph"] || [];
  const byType = (type) => nodes.filter((node) => node["@type"] === type);
  return { nodes, byType };
};

export const assertStructuredData = (head, main) => {
  const { nodes, byType } = structuredData(head);
  const defined = [];
  const referenced = [];
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    if (value["@id"]) (Object.keys(value).length === 1 ? referenced : defined).push(value["@id"]);
    Object.values(value).forEach(walk);
  };
  walk(nodes);
  assert.equal(new Set(defined).size, defined.length, "JSON-LD node ids are unique");
  assert.deepEqual(referenced.filter((id) => !defined.includes(id)), [], "every JSON-LD reference resolves inside the graph");
  const [page] = byType("WebPage");
  assert.equal(page.name, plain(head.match(/<title>([\s\S]*?)<\/title>/)[1]), "WebPage name equals the title");
  assert.equal(page.description, plain(head.match(/<meta name="description" content="([^"]*)"/)[1]), "WebPage description equals the meta description");
  const visible = [...main.matchAll(/<details class="faq-item"[^>]*><summary><h3>([\s\S]*?)<\/h3>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div><\/details>/g)].map((match) => [plain(match[1]), plain(match[2])]);
  const [faq] = byType("FAQPage");
  assert.deepEqual(faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]), visible, "FAQPage equals the visible FAQ, in order");
  const [list] = byType("ItemList");
  for (const item of list.itemListElement) assert.match(main, new RegExp(`<section\\b[^>]*\\bid="${item.url.split("#")[1]}"`), `ItemList anchor ${item.url} exists`);
  return { nodes: nodes.length, faq: faq.mainEntity.length };
};

const valuesFor = (environment) => ({ ...pack, ...environment.values });

const expectedCtaHrefs = (values) => [...new Set(Object.keys(values)
  .filter((code) => /_CTA_\d+_URL$/.test(code))
  .map((code) => {
    const source = values[code.replace(/_URL$/, "_SOURCE")];
    const plan = values[code.replace(/_URL$/, "_PLAN")];
    const partner = values[code.replace(/_URL$/, "_CODE")];
    const href = source ? `${values[code]}?cta_source=${source}` : values[code];
    return `${href}${plan ? `&plan=${plan}` : ""}${partner ? `&code=${partner}` : ""}`;
  })
  .concat(values.SNOW_PRICING_SUBSCRIBE_URL))]
  .sort();

export const ctaHrefs = (main) => [...new Set([...main.matchAll(/<a\b[^>]*\bclass="btn\b[^"]*"[^>]*>/g)]
  .map((match) => decode((match[0].match(/\bhref="([^"]*)"/) || [])[1] || "")))]
  .sort();

export const assertCtas = (main, environment) => {
  const actual = ctaHrefs(main);
  const expected = expectedCtaHrefs(valuesFor(environment));
  assert.deepEqual(actual, expected, "the distinct CTA hrefs equal the parameter URLs with their cta_source");
  assert.equal(actual.some((href) => /^https?:/.test(href)), false, "CTAs are site-relative");
  return actual;
};

const MEDIA_ID = /\/core\/(?:image|api\/video|api\/media-asset)\/([0-9a-f-]{36})\//g;

export const assertEnvironment = (head, main, environment) => {
  const { byType } = structuredData(head);
  const [page] = byType("WebPage");
  assert.ok(page.url.startsWith(`${environment.origin}/`), `JSON-LD WebPage ${page.url} is on ${environment.origin}`);
  const [breadcrumb] = byType("BreadcrumbList");
  assert.deepEqual(breadcrumb.itemListElement.filter((item) => !item.item.startsWith(`${environment.origin}/`)), [], `JSON-LD breadcrumb stays on ${environment.origin}`);
  const [image] = byType("ImageObject");
  const ids = new Set(Object.values(environment.media).map((item) => item.id));
  const heroId = image.url.match(/\/core\/image\/([0-9a-f-]{36})\//)?.[1];
  assert.ok(image.url.startsWith(`${environment.origin}/`) && ids.has(heroId), `JSON-LD hero image ${image.url} is an ${environment.name} media id on ${environment.origin}`);
  const referenced = new Set([...main.matchAll(MEDIA_ID)].map((match) => match[1]));
  assert.deepEqual([...referenced].filter((id) => !ids.has(id)), [], `every media id in the page belongs to ${environment.mediaName}`);
  assert.ok(referenced.size > 0, "the page references media ids");
  const subscribe = valuesFor(environment).SNOW_PRICING_SUBSCRIBE_URL;
  if (!subscribe.startsWith("/subscribe.html")) assert.equal(/\/subscribe\.html/.test(main), false, `${environment.name} has no /subscribe.html link`);
  return { media: referenced.size, origin: environment.origin };
};

const treeHashes = (dir) => {
  const result = {};
  const walk = (current, prefix) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const relative = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) walk(full, relative);
      else result[relative] = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    }
  };
  walk(dir, "");
  return result;
};

const fetchPage = (url) => new Promise((resolve, reject) => {
  const started = Date.now();
  const request = https.get(url, { agent: false, timeout: 600000, headers: { Connection: "close", "Accept-Encoding": "identity", "User-Agent": "snow-removal-landing-check" } }, (response) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("error", reject);
    response.on("close", () => {
      if (response.complete) resolve({ status: response.statusCode, node: response.headers["x-node-id"] || "", html: Buffer.concat(chunks).toString(), ms: Date.now() - started });
      else reject(new Error(`connection closed after ${Buffer.concat(chunks).length} bytes`));
    });
  });
  request.on("timeout", () => request.destroy(new Error("timeout")));
  request.on("error", reject);
  request.on("close", () => setTimeout(() => reject(new Error("request closed")), 1000));
});

const fetchWithRetry = async (url) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const page = await fetchPage(url);
      if (page.status === 200 || attempt >= 6) return page;
    } catch (error) {
      if (attempt >= 6) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
};

const checkOffline = (environment) => {
  const distRoot = path.join(landingRoot, "dist");
  const first = fs.mkdtempSync(path.join(distRoot, ".snow-removal-check-a-"));
  const second = fs.mkdtempSync(path.join(distRoot, ".snow-removal-check-b-"));
  try {
    const { payload } = exportSnowRemovalLanding({ environment, outputDir: first, quiet: true });
    exportSnowRemovalLanding({ environment, outputDir: second, quiet: true });
    const hashesA = treeHashes(first);
    const hashesB = treeHashes(second);
    assert.deepEqual(hashesA, hashesB, "repeat export is byte-for-byte deterministic");
    assert.deepEqual([payload.root, ...payload.children].map((template) => template.code), EXPECTED_CODES);
    assert.equal(payload.root.parent, null);
    const templates = [payload.root, ...payload.children];
    assert.equal(templates.some((template) => /lorem ipsum/i.test(JSON.stringify(template.parameters))), false, "no Lorem Ipsum parameter values");
    assert.equal(/\/Users\/|tmp\/snow-removal-landing/.test(JSON.stringify(payload)), false, "no host paths in the package");
    const content = payload.children.find((child) => child.code === "SNOW_REMOVAL_LANDING_CONTENT");
    assert.equal(/data:image\/(png|jpe?g|webp);base64/.test(content.html), false, "no inlined raster images");
    assert.equal(/\{\{[a-z0-9_]+\}\}/.test(content.html), false, "every block placeholder became a CMS parameter");
    const codes = content.parameters.map((parameter) => parameter.code);
    assert.equal(new Set(codes).size, codes.length, "parameter codes are unique");
    const rendered = renderTemplate(content.html, payload.root.parameters.concat(content.parameters));
    const main = extractMain(rendered);
    const report = assertSeo(main);
    const ctas = assertCtas(main, environment);
    const head = renderTemplate(payload.root.head, payload.root.parameters);
    const schema = assertStructuredData(head, main);
    const target = assertEnvironment(head, main, environment);
    const lazy = [...main.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
    assert.equal(lazy.filter((tag) => !/loading="lazy"/.test(tag) && !/fetchpriority="high"/.test(tag)).length, 0, "every image below the hero is lazy-loaded");
    assert.match(main, /<video\b[^>]*preload="none"[^>]*data-poster=/, "the route replay poster is deferred");
    assert.equal(/class="weather[ "]/.test(main), false, "the separate Weather plaque is gone");
    assert.match(main, /<div class="addons" id="addons"[^>]*>[\s\S]*data-addon="expansion"[\s\S]*data-addon="routing"[\s\S]*data-addon="ai"[\s\S]*data-addon="weather"/, "Add-ons holds the four cards in order");
    assert.ok(main.indexOf('id="plan-comparison"') < main.indexOf('id="addons"'), "Add-ons follows Compare All Features");
    assert.equal((main.match(/data-expand-plan=/g) || []).length, 6, "three plan cards and three comparison cells link to Add-ons");
    assert.match(main, /Actual ServiceWand UI · Mobile Property Plan &amp; Dispatch Board/, "the routing caption is the requested text");
    assert.equal(/Supporting capabilities:/.test(main), false, "the Mobile Workforce supporting line became chips");
    assert.equal(content.javascript.includes("ns.selection = Object.freeze"), true, "the configurator ships the subscription flow's selection rules");
    const contentBytes = Buffer.byteLength(content.html) + Buffer.byteLength(content.css) + Buffer.byteLength(content.javascript);
    const media = Object.keys(environment.media).length;
    console.log(`snow-removal-landing-check ${environment.name} ok: ${target.origin}, ${target.media} media ids in the page, deterministic ${Object.keys(hashesA).length} files, ${report.headings.length} headings, ${Object.keys(report.counts).length} keyword counts, ${ctas.length} CTAs, JSON-LD ${schema.nodes} nodes with ${schema.faq} FAQ, ${codes.length} content parameters, media ids ${media}`);
    console.log(`content template weight: html ${content.html.length} + css ${content.css.length} + js ${content.javascript.length} = ${contentBytes} bytes`);
  } finally {
    fs.rmSync(first, { recursive: true, force: true });
    fs.rmSync(second, { recursive: true, force: true });
  }
};

const checkLive = async (url, rounds) => {
  const environment = snowEnvironmentForOrigin(new URL(url).origin);
  const nodes = new Map();
  for (let round = 0; round < rounds; round += 1) {
    const page = await fetchWithRetry(url);
    assert.equal(page.status, 200, `${url} answers 200`);
    const main = extractMain(page.html);
    const report = assertSeo(main);
    const ctas = assertCtas(main, environment);
    const head = page.html.slice(0, page.html.indexOf("</head>"));
    assertStructuredData(head, main);
    assertEnvironment(head, main, environment);
    assert.equal(/\$\{[A-Z][A-Z0-9_]*(?:@[A-Z_]+)?\}/.test(main), false, "no unrendered CMS placeholders in the main content");
    nodes.set(page.node || `round-${round}`, { bytes: Buffer.byteLength(page.html), ms: page.ms, ctas: ctas.length, headings: report.headings.length });
  }
  for (const [node, info] of nodes) {
    console.log(`live ${url} ${node}: ${info.bytes} bytes, ${info.ms} ms, ${info.headings} headings, ${info.ctas} CTAs${info.bytes > HTML_SIZE_BUDGET ? ` (over the ${HTML_SIZE_BUDGET}-byte target)` : ""}`);
  }
  console.log(`snow-removal-landing-check live ${environment.name} ok: ${nodes.size} node(s)`);
};

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const roundsIndex = args.indexOf("--rounds");
const envIndex = args.indexOf("--env");
if (urlIndex >= 0) await checkLive(args[urlIndex + 1], roundsIndex >= 0 ? Number(args[roundsIndex + 1]) : 4);
else for (const name of envIndex >= 0 ? [args[envIndex + 1]] : SNOW_ENVIRONMENT_NAMES) checkOffline(snowEnvironment(name));
