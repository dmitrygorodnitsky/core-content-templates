import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { SEO, SEO_FOOTER } from "../design-inbox/data/seo-fixtures.js";
import { graniteRidgeSnowFixture } from "../runtime/data/cases/granite-ridge-snow.js";
import { assertJteSafeFamily } from "./export-granite-ridge-landing-blocks-manual.mjs";
import { buildLiveLandingManual, exportLiveLandingManual, packageInventory, sourceLabel } from "./export-live-landing-manual.mjs";
import { sha256 } from "./portal-manual-package.mjs";

const root = path.resolve("app-templates/customer-portal");
const inputPath = path.join(root, "cms/granite-ridge-snow.landing-staging.json");
const packageDir = path.join(root, "dist/manual-upload/customer-portal-granite-ridge-landing-staging");
const portalSourcePath = path.join(root, "cms/granite-ridge-snow.customer-portal-staging.json");
const escapedDir = path.join(root, "runtime/escaped-landing-package");

const landingUrl = "https://dev-1.servicewand.com/pages/SNOWLIMITLESS/home";
const requestQuoteUrl = "https://dev-1.servicewand.com/pages/SNOWLIMITLESS/request-quote";
const signInUrl = "https://dev-1.servicewand.com/pages/SNOWLIMITLESS/portal#/login";
const markers = { landing: "${LANDING_URL@STRING}", "request-quote": "${REQUEST_QUOTE_URL@STRING}", "sign-in": "${SIGN_IN_URL@STRING}" };

const claimPatterns = [
  ["a review or rating", /\breviews\b|\btestimonial|\brat(?:ed|ing|ings)\b|\bstars?\b|★|☆/i],
  ["a customer count", /\b\d[\d,.]*\s*\+?\s*(?:happy\s+)?(?:customers|clients|homes|homeowners|businesses|properties|sites)\b/i],
  ["years in business", /\byears?\b|\bsince\b|\bestablished\b|\bfounded\b|\b(?:19|20)\d{2}\b/i],
  ["a certification or licence", /\bcertifi|\blicen[cs]|\binsured\b|\binsurance\b|\bbonded\b|\baccredit|\bWorkSafe|\bWCB\b|\bBBB\b/i],
  ["a guarantee", /\bguarant|\bwarrant|\bpromise|\bpledge/i],
  ["a response-time promise", /\b24\s*\/\s*7\b|\bwithin\s+\d|\bsame[- ]day\b|\bresponse time|\bSLA\b|\bon time\b|\bminutes?\b|\bhours?\b|\baround the clock\b|\bround-the-clock\b/i],
  ["a phone number", /\+?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b|\bcall us\b/i],
  ["an email address", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ["a street address", /\b\d{1,6}\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Way|Lane|Crescent|Place|Highway|Hwy|Court)\b|\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/],
  ["a price", /[$€£]|\bCA\$|\b(?:CAD|USD)\b|\bdollars?\b|\bprices?\b|\bpricing\b|\brates?\b|\bdiscount|\bper (?:visit|month|season|hour|storm)\b/i],
];

try {
  const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const built = await buildLiveLandingManual(structuredClone(source), sourceLabel(inputPath));
  const { template, manifest } = built;
  const { head, html, css, javascript } = template;

  assert.deepEqual(await filesUnder(packageDir), [...packageInventory].sort(), "the package holds exactly its inventory");
  for (const [name, content] of built.files) {
    assert.equal(await fs.readFile(path.join(packageDir, name), "utf8"), content, name + " differs from a fresh build of " + sourceLabel(inputPath) + ": regenerate it with export-live-landing-manual.mjs");
  }
  const rebuilt = await buildLiveLandingManual(structuredClone(source), sourceLabel(inputPath));
  assert.deepEqual(rebuilt.files, built.files, "two builds of one source are byte-identical");
  for (const [name, content] of built.files) {
    assert.doesNotMatch(content, /\/Users\/|\/private\/|\/var\/folders\/|[A-Z]:\\/, name + " must not carry a host path");
    assert.doesNotMatch(content, /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, name + " must not carry a timestamp");
    assert.doesNotMatch(content, /\.staging-[A-Za-z0-9]{6}|\.backup-[a-f0-9]/, name + " must not carry a scratch directory name");
  }

  const payload = JSON.parse(built.files.find(([name]) => name === "cms-family.payload.json")[1]);
  assert.equal(template.code, "CUSTOMER_PORTAL_GRANITE_RIDGE_LANDING_STAGING");
  assert.equal(template.templateLanguage, "JTE", "JTE is the only template language proven against this CMS");
  assert.equal(template.parent, null);
  assert.deepEqual(template.children, [], "one root renders every section, so CMS needs no include or enabled template");
  assert.deepEqual(payload, { schemaVersion: 1, root: template, children: [] }, "the uploader sends exactly the reference record");
  assert.doesNotThrow(() => assertJteSafeFamily([template]));

  const declared = template.parameters.map((item) => item.code);
  assert.equal(new Set(declared).size, declared.length, "every parameter code is unique");
  const referenced = new Set();
  for (const [field, value] of Object.entries({ head, html, css, javascript })) {
    assert.doesNotMatch(value, /@\{|!\{|<%|%>|@(?:param|import|template|if|elseif|else|endif|for|endfor|while|endwhile|raw|endraw)\b/, field + " must stay JTE-safe");
    assert.equal(value.replace(/\$\{[A-Z0-9_]+@[A-Z_]+\}/g, "").includes("${"), false, field + " carries a ${ opener that is not a parameter marker");
    assert.doesNotMatch(value, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f�]/, field + " must not carry a control character");
    for (const match of value.matchAll(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g)) {
      referenced.add(match[1]);
      assert.equal(match[2], template.parameters.find((item) => item.code === match[1]).type, match[1] + " is referenced with its declared type");
    }
  }
  assert.deepEqual([...referenced].sort(), [...declared].sort(), "every parameter is declared and referenced");
  assert.equal((css + javascript).includes("${"), false, "only head and html carry parameter markers");
  assert.doesNotMatch(javascript, /<\/script/i);
  assert.doesNotMatch(css, /<\/style/i);

  for (const item of template.parameters) {
    assert.ok(["LOCALIZED_STRING_SS", "STRING"].includes(item.type), item.code + " is a copy or an address parameter");
    const value = item.type === "STRING" ? item.value : item.value.en;
    if (item.type === "LOCALIZED_STRING_SS") assert.deepEqual(Object.keys(item.value), ["en"], item.code + " ships English only, the one language enabled for the tenant");
    assert.equal(typeof value, "string");
    assert.ok(value.trim().length > 0, item.code + " ships a value, because CMS creates no PageContext for a template with an empty parameter");
    assert.notEqual(value, "#", item.code + " has a real value, so no operator placeholder ships");
    assert.ok(item.nls.en.DESCRIPTION.length > 10, item.code + " tells the editor what it controls");
  }
  const addresses = Object.fromEntries(template.parameters.filter((item) => item.type === "STRING").map((item) => [item.code, item.value]));
  assert.deepEqual(addresses, { LANDING_URL: landingUrl, REQUEST_QUOTE_URL: requestQuoteUrl, SIGN_IN_URL: signInUrl }, "the three destinations are the fixed interface");
  for (const value of Object.values(addresses)) {
    const url = new URL(value);
    assert.equal(url.protocol, "https:");
    assert.equal(url.host, "dev-1.servicewand.com");
    assert.equal(url.search, "", value + " carries no query");
  }
  assert.equal(new URL(signInUrl).hash, "#/login", "Sign in opens the portal's explicit sign-in route");

  const anchors = [...html.matchAll(/<a\b([^>]*)>/g)].map((match) => attributesOf(match[1]));
  for (const anchor of anchors) {
    assert.ok(Object.hasOwn(markers, anchor["data-destination"]), "every link names its destination: " + JSON.stringify(anchor));
    assert.equal(anchor.href, markers[anchor["data-destination"]], "a " + anchor["data-destination"] + " link points at its own parameter");
  }
  const count = (destination) => anchors.filter((anchor) => anchor["data-destination"] === destination).length;
  assert.deepEqual([count("landing"), count("request-quote"), count("sign-in")], [2, 4, 5], "brand links home twice; Get a free quote sits in the hero, the no-access notice, the closing call and the footer; Sign in adds the top bar");
  assert.equal([...html.matchAll(/href="/g)].length, anchors.length, "no element but a destination link carries an href");

  const values = parameterValues(template);
  const brand = values.BRAND_NAME;
  assert.equal(brand, "Limitless Snow Removal");
  assert.ok(values.META_TITLE.includes(brand), "the browser tab names the brand");
  assert.equal((html.match(/\$\{BRAND_NAME@LOCALIZED_STRING_SS\}/g) || []).length, 2, "the brand shows in the top bar and the footer");
  const page = resolve(html, values);
  const visible = page.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const shippedCopy = template.parameters.filter((item) => item.type === "LOCALIZED_STRING_SS").map((item) => item.value.en);
  for (const text of [head, html, javascript, visible, ...shippedCopy]) {
    assert.doesNotMatch(text, /granite ridge/i, "the demonstration brand never ships in the staging landing");
  }

  assert.equal((head.match(/<meta name="robots" content="noindex,nofollow">/g) || []).length, 1, "a staging landing must not be indexable");
  assert.doesNotMatch(head, /rel="canonical"|application\/ld\+json|<script/i, "the head carries no canonical, structured data or script");
  for (const match of head.matchAll(/<link [^>]*href="([^"]+)"/g)) {
    assert.ok(match[1] === "data:," || /^https:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/|$)/.test(match[1]), "the head loads only the Manrope stylesheet: " + match[1]);
  }
  assert.equal(manifest.template.robots, "noindex,nofollow");

  assert.doesNotMatch(html, /seo-trust|seo-proof|seo-price|seo-pricing|seo-review|seo-offer|seo-media|seo-slot|no-data|from CMS|data-pim|ui\.toggleMode/, "the trust, proof, pricing, reviews and media sections are dropped, with their placeholders");
  assert.doesNotMatch(html, /<(?:img|iframe|video|form|input|script)\b|\bsrc=|\son[a-z]+=|javascript:/i, "the markup loads nothing and runs nothing inline");
  const modules = [...html.matchAll(/data-module="([^"]+)"/g)].map((match) => match[1]);
  for (const module of ["public-nav", "reason-notice", "seo-hero", "seo-services-grid", "seo-how-it-works", "seo-service-area", "seo-faq", "seo-final-cta", "seo-footer"]) {
    assert.ok(modules.includes(module), "the landing keeps its " + module + " section");
  }
  assert.deepEqual(manifest.sections, ["public-nav", "reason-notice", "hero", "services", "how-it-works", "service-area", "faq", "final-cta", "footer"]);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "the hero headline is the only h1");
  assert.doesNotMatch(html, /seo-media-slot|seo-hero__media/, "the hero shows no empty media placeholder");
  assert.match(html, /class="snow-hero-art"[^>]*aria-hidden="true"/, "the hero art is decoration that assistive technology skips");
  assert.equal((html.match(/<button\b/g) || []).length, 2, "the only buttons close the two notices; every call to action is a link that works without JavaScript");
  assert.equal((html.match(/<details class="seo-faq__item">/g) || []).length, source.copy.faq.items.length, "every FAQ answer is in the markup and opens without JavaScript");

  const noticeTags = [...html.matchAll(/<div\b([^>]*\bdata-notice="[^"]*"[^>]*)>/g)].map((match) => attributesOf(match[1]));
  assert.deepEqual(noticeTags.map((tag) => tag["data-notice"]), ["signed-out", "no-access"], "exactly the two reasons the portal sends have a notice");
  for (const tag of noticeTags) {
    assert.ok(Object.hasOwn(tag, "hidden"), "the " + tag["data-notice"] + " notice ships hidden, so a page without JavaScript shows none");
    assert.equal(tag.role, "status");
  }
  assert.match(css, /\.snow-notice\[hidden\] \{ display: none; \}/, "the notice's flex display must not override the hidden attribute");
  assert.equal((html.match(/data-notice-dismiss aria-label="\$\{NOTICE_DISMISS_LABEL@LOCALIZED_STRING_SS\}"/g) || []).length, 2, "each notice has a dismiss button with an accessible name from CMS copy");
  const noAccess = html.slice(html.indexOf('data-notice="no-access"'), html.indexOf("<section"));
  assert.match(noAccess, /\$\{NOTICE_NO_ACCESS_TITLE@LOCALIZED_STRING_SS\}[\s\S]*\$\{NOTICE_NO_ACCESS_BODY@LOCALIZED_STRING_SS\}/);
  assert.match(noAccess, /href="\$\{REQUEST_QUOTE_URL@STRING\}"[^>]*>\$\{REQUEST_QUOTE_LABEL@LOCALIZED_STRING_SS\}<\/a><a [^>]*href="\$\{SIGN_IN_URL@STRING\}"[^>]*>\$\{NOTICE_NO_ACCESS_SIGN_IN_LABEL@LOCALIZED_STRING_SS\}<\/a>/, "the no-access notice offers Get a free quote and Sign in with another account");
  assert.equal(values.NOTICE_SIGNED_OUT_TITLE, "You've signed out.");
  assert.equal(values.NOTICE_NO_ACCESS_SIGN_IN_LABEL, "Sign in with another account");
  assert.equal(values.REQUEST_QUOTE_LABEL, "Get a free quote");
  assert.equal(values.SIGN_IN_LABEL, "Sign in");

  assert.match(css, /:root:not\(\[data-theme\]\) \{[^}]*--accent:#0e8fc4/, "without JavaScript the page still wears the snow theme");
  assert.doesNotMatch(css, /url\(\s*["']?https?:|@import/i, "the stylesheet loads nothing");

  for (const [label, pattern] of claimPatterns) {
    for (const text of shippedCopy.concat([visible])) {
      assert.doesNotMatch(text, pattern, "the landing copy carries " + label + ": " + JSON.stringify(text.slice(0, 120)));
    }
  }
  for (const text of shippedCopy) assert.doesNotMatch(text, /\d/, "copy carries no figure, so no count, year, price, phone, address or promised time can hide in it: " + JSON.stringify(text));
  const claimSamples = ["Rated 4.9 by our neighbours", "Over 500 happy customers", "Serving Vancouver since 2012", "Licensed and insured crews", "Satisfaction guaranteed", "Cleared within 2 hours", "Call 604-555-0199", "Write to hello@limitless.example", "Find us at 123 Main Street", "From $99 per visit", "Read our 5-star reviews", "Crews on call around the clock"];
  for (const sample of claimSamples) {
    assert.ok(claimPatterns.some(([, pattern]) => pattern.test(sample)), "the claim scanner must flag " + JSON.stringify(sample));
  }

  const authored = new Set([...leaves(source.copy), source.brand.name, source.serviceArea.region, ...source.serviceArea.cities]);
  assert.deepEqual(new Set(shippedCopy), authored, "every shipped copy value is authored in the staging source, and every authored value ships");
  const demonstration = leaves(SEO["Snow Removal"]).concat(leaves(SEO_FOOTER), leaves(graniteRidgeSnowFixture.theme.svc)).filter((text) => text.length >= 12 && !text.includes("{"));
  assert.ok(demonstration.length > 20, "the demonstration copy was read");
  for (const text of demonstration) {
    assert.equal(visible.includes(text) || shippedCopy.some((value) => value.includes(text)), false, "demonstration copy must not reach the staging landing: " + JSON.stringify(text));
  }

  const portalSource = JSON.parse(await fs.readFile(portalSourcePath, "utf8"));
  assert.deepEqual(source.serviceArea.cities.map((city) => city.toLowerCase()).sort(), Object.keys(portalSource.serviceGeography.zones).sort(), "the landing names exactly the cities the live portal serves");
  assert.equal(source.serviceArea.region, "British Columbia");

  assert.doesNotMatch(javascript, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\.textContent\s*=|innerText\s*=|\beval\(|new Function|setTimeout\(\s*["']/, "the runtime builds no markup and runs no string as code");
  assert.doesNotMatch(javascript, /\bfetch\b|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\(|localStorage|sessionStorage|document\.cookie/, "the runtime has no network or storage path");

  const plain = runLanding(template, { search: "" });
  assert.deepEqual(plain.visibleNotices(), [], "a plain visit shows no notice");
  assert.deepEqual(plain.replaced, [], "a plain visit leaves the address alone");
  assert.deepEqual(plain.writes, [], "valid destinations are left exactly as CMS rendered them");
  assert.equal(plain.page.theme, "snow");
  assert.equal(plain.page.mode, "light");
  assert.equal(runLanding(template, { search: "", dark: true }).page.mode, "dark", "the page follows a dark system preference");
  for (const reason of ["signed-out", "no-access"]) {
    const run = runLanding(template, { search: "?portal=" + reason });
    assert.deepEqual(run.visibleNotices(), [reason], "?portal=" + reason + " shows its own notice and nothing else");
    assert.deepEqual(run.replaced, ["/pages/SNOWLIMITLESS/home"], "a shown notice drops the reason from the address, so a reload or Back does not repeat it");
    assert.deepEqual(run.writes, [], "showing a notice writes no text or attribute");
    run.notice(reason).click();
    assert.deepEqual(run.visibleNotices(), [], "the dismiss button closes the " + reason + " notice");
  }
  const refused = [
    "?portal=unknown", "?portal=", "?portal", "?Portal=signed-out", "?portal=SIGNED-OUT", "?portal=signed-out%20", "?portal=%20no-access",
    "?portal=signed-out&x=1", "?x=1&portal=no-access", "?portal=signed-out&portal=no-access", "?portal=no-access&portal=no-access",
    "?portal=signed-out;no-access", "?portal=__proto__", "?portal=constructor", "?portal=hasOwnProperty", "?utm_source=newsletter",
    "?portal=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E", "?portal=<script>alert(1)</script>", "?portal=javascript:alert(1)",
  ];
  for (const search of refused) {
    const decoys = new URLSearchParams(search).getAll("portal");
    const run = runLanding(template, { search, decoys });
    assert.deepEqual(run.visibleNotices(), [], JSON.stringify(search) + " must render nothing, even where a notice with that value exists");
    assert.deepEqual(run.replaced, [], JSON.stringify(search) + " must leave the address alone");
    assert.deepEqual(run.writes, [], JSON.stringify(search) + " must not reach the page");
  }
  const early = runLanding(template, { search: "?portal=no-access", loading: true });
  assert.equal(early.page.theme, "snow", "the theme is set before the markup that follows the script is parsed");
  assert.deepEqual(early.visibleNotices(), [], "the notice waits for the markup CMS renders after the script");
  early.domReady();
  assert.deepEqual(early.visibleNotices(), ["no-access"], "the notice appears once the markup is parsed");
  for (const [code, value] of [["REQUEST_QUOTE_URL", "#"], ["SIGN_IN_URL", "javascript:alert(1)"], ["LANDING_URL", "http://dev-1.servicewand.com/pages/SNOWLIMITLESS/home"], ["SIGN_IN_URL", ""], ["REQUEST_QUOTE_URL", "/pages/SNOWLIMITLESS/request-quote"]]) {
    const run = runLanding(template, { search: "", values: { [code]: value } });
    const destination = Object.keys(markers).find((key) => markers[key].includes(code));
    for (const anchor of run.anchors) {
      const affected = anchor.getAttribute("data-destination") === destination;
      assert.equal(anchor.getAttribute("href") === null, affected, code + "=" + JSON.stringify(value) + " disables exactly its own links");
      assert.equal(anchor.getAttribute("aria-disabled") === "true", affected, code + "=" + JSON.stringify(value) + " marks its links disabled");
    }
  }

  const refusals = [
    ["a plaintext destination", (s) => { s.destinations.requestQuote = "http://dev-1.servicewand.com/pages/SNOWLIMITLESS/request-quote"; }, /destinations\.requestQuote must be an absolute https address/],
    ["a destination on another host", (s) => { s.destinations.signIn = "https://evil.example.test/portal#/login"; }, /destinations\.signIn must be on https:\/\/dev-1\.servicewand\.com/],
    ["a relative destination", (s) => { s.destinations.landing = "/pages/SNOWLIMITLESS/home"; }, /destinations\.landing must be an absolute https address/],
    ["a javascript destination", (s) => { s.destinations.requestQuote = "javascript:alert(1)"; }, /absolute https address/],
    ["the # placeholder as a destination", (s) => { s.destinations.signIn = "#"; }, /absolute https address/],
    ["a destination with credentials", (s) => { s.destinations.landing = "https://user:secret@dev-1.servicewand.com/pages/SNOWLIMITLESS/home"; }, /credentials|canonical form/],
    ["a landing address with a query", (s) => { s.destinations.landing = landingUrl + "?portal=signed-out"; }, /must not carry a query/],
    ["a quote form address with a fragment", (s) => { s.destinations.requestQuote = requestQuoteUrl + "#top"; }, /must not carry a fragment/],
    ["a non-canonical address", (s) => { s.destinations.landing = "https://DEV-1.servicewand.com/pages/SNOWLIMITLESS/home"; }, /canonical form/],
    ["an unknown destination", (s) => { s.destinations.phone = "https://dev-1.servicewand.com/call"; }, /destinations carries keys this package does not ship: phone/],
    ["a reviews section", (s) => { s.copy.reviews = { title: "What customers say" }; }, /copy carries keys this package does not ship: reviews/],
    ["a trust strip", (s) => { s.trust = { rating: "4.9" }; }, /Landing source carries keys this package does not ship: trust/],
    ["hero media", (s) => { s.copy.hero.mediaUrl = "https://dev-1.servicewand.com/hero.jpg"; }, /copy\.hero carries keys this package does not ship: mediaUrl/],
    ["an empty copy value", (s) => { s.copy.hero.title = ""; }, /copy\.hero\.title must be a nonempty string/],
    ["markup in copy", (s) => { s.copy.hero.sub = "Free <b>quotes</b>"; }, /copy\.hero\.sub contains "<"/],
    ["a double quote in copy", (s) => { s.copy.notices.dismiss = 'Close "now"'; }, /copy\.notices\.dismiss contains/],
    ["an ampersand in copy", (s) => { s.copy.services.items[0].name = "Snow & ice"; }, /copy\.services\.items\[0\]\.name contains "&"/],
    ["a parameter opener in copy", (s) => { s.copy.faq.items[0].answer = "Yes ${SIGN_IN_URL@STRING}"; }, /contains "\$\{"/],
    ["a control character in copy", (s) => { s.copy.meta.title = "Limitless\u0007"; }, /copy\.meta\.title contains/],
    ["a line break in copy", (s) => { s.copy.area.note = "We confirm\nservice"; }, /copy\.area\.note contains/],
    ["the # placeholder as copy", (s) => { s.copy.finalCta.sub = "#"; }, /cannot hold the # placeholder/],
    ["padded copy", (s) => { s.brand.name = " Limitless Snow Removal"; }, /must not start or end with whitespace/],
    ["a missing notice", (s) => { delete s.copy.notices.noAccess; }, /copy\.notices\.noAccess is required/],
    ["an empty FAQ", (s) => { s.copy.faq.items = []; }, /copy\.faq\.items must be a nonempty list/],
    ["a city listed twice", (s) => { s.serviceArea.cities.push("vancouver"); }, /lists a city twice/],
    ["a lowercase template code", (s) => { s.template.code = "landing"; }, /upper-snake/],
    ["no constraints", (s) => { s.constraints = []; }, /must state its constraints/],
    ["another schema version", (s) => { s.schemaVersion = 2; }, /schemaVersion must be 1/],
  ];
  for (const [label, mutate, expected] of refusals) {
    const mutated = structuredClone(source);
    mutate(mutated);
    await assert.rejects(buildLiveLandingManual(mutated, sourceLabel(inputPath)), expected, "the exporter must refuse " + label);
  }
  await assert.rejects(exportLiveLandingManual({ inputPath, outputDir: escapedDir }), /dist\/manual-upload/, "the exporter writes only under dist/manual-upload");
  await assert.rejects(fs.access(escapedDir), /ENOENT/, "a refused export leaves nothing behind");

  assert.equal(manifest.uploadPerformed, false);
  assert.equal(manifest.mode, "staging");
  assert.equal(manifest.launchState, "staging-only");
  assert.equal(manifest.input, "app-templates/customer-portal/cms/granite-ridge-snow.landing-staging.json");
  assert.deepEqual(manifest.openedLiveContracts, []);
  assert.deepEqual(manifest.notices, { parameter: "portal", reasons: ["signed-out", "no-access"] }, "the landing answers exactly the two reasons the portal sends");
  assert.deepEqual(manifest.template.parameters, declared);
  for (const field of ["head", "html", "css", "javascript"]) assert.equal(manifest.template.sha256[field], sha256(template[field]), "the manifest digests the " + field + " it ships");
  assert.match(built.readme, /upsert-granite-ridge-staging-landing\.mjs/);
  assert.match(built.readme, /never creates or changes a PageContext/);
  assert.match(built.preview, /^<!doctype html>\n<html>\n<head>\n/, "the preview renders the document the way CMS does, with no theme on the html element");
  assert.ok(built.preview.indexOf("<script") < built.preview.indexOf('id="snow-landing"'), "the preview runs the script ahead of the markup, as CMS does");
  assert.equal(/\$\{[A-Z0-9_]+@[A-Z_]+\}/.test(built.preview), false, "the preview resolves every parameter marker");

  console.log("granite-ridge-staging-landing-manual-check ok: dist matches a fresh build byte for byte; one JTE root with " + declared.length + " valued parameters; " + brand + " with the three dev-1 destinations; noindex; trust, proof, pricing, reviews and media dropped; no forbidden claim or demonstration copy; notices only for the 2 exact reasons, " + refused.length + " other addresses render nothing; # and unsafe destinations disable their links; no network path; " + refusals.length + " exporter refusals");
} finally {
  await fs.rm(escapedDir, { recursive: true, force: true });
}

function runLanding(template, options) {
  const values = Object.assign(parameterValues(template), options.values || {});
  const markup = resolve(template.html, values);
  const writes = [];
  const replaced = [];
  const listeners = [];
  const blocked = (name) => function () { throw new Error("the landing runtime must not call " + name); };
  const anchors = [...markup.matchAll(/<a\b([^>]*)>/g)].map((match) => element(attributesOf(match[1]), writes));
  const notices = [...markup.matchAll(/<div\b([^>]*\bdata-notice="[^"]*"[^>]*)>/g)].map((match) => noticeElement(attributesOf(match[1]), writes))
    .concat((options.decoys || []).map((reason) => noticeElement({ "data-notice": reason, hidden: "" }, writes)));
  const classes = new Set();
  let ready = !options.loading;
  const shell = {
    getBoundingClientRect: () => ({ width: 1280 }),
    classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
    querySelectorAll(selector) {
      if (selector === "a[data-destination]") return anchors.filter((anchor) => anchor.getAttribute("data-destination") !== null);
      if (selector === "[data-notice]") return notices;
      throw new Error("unexpected selector " + selector);
    },
  };
  const documentStub = {
    get readyState() { return ready ? "complete" : "loading"; },
    documentElement: { dataset: {} },
    getElementById: (id) => (ready && id === "snow-landing" ? shell : null),
    addEventListener: (type, handler) => listeners.push([type, handler]),
    write: blocked("document.write"),
    cookie: "",
  };
  const windowStub = {
    location: { search: options.search, pathname: "/pages/SNOWLIMITLESS/home", hash: "" },
    history: { state: null, replaceState(state, title, url) { replaced.push(url); } },
    matchMedia: (query) => ({ matches: Boolean(options.dark) && query === "(prefers-color-scheme: dark)", addEventListener() {} }),
    fetch: blocked("fetch"),
    XMLHttpRequest: blocked("XMLHttpRequest"),
    WebSocket: blocked("WebSocket"),
    EventSource: blocked("EventSource"),
    navigator: { sendBeacon: blocked("navigator.sendBeacon") },
  };
  vm.runInContext(template.javascript, vm.createContext({
    window: windowStub, document: documentStub, navigator: windowStub.navigator, URL, URLSearchParams,
    fetch: windowStub.fetch, XMLHttpRequest: windowStub.XMLHttpRequest, WebSocket: windowStub.WebSocket, EventSource: windowStub.EventSource,
  }));
  return {
    anchors,
    writes,
    replaced,
    page: documentStub.documentElement.dataset,
    visibleNotices: () => notices.filter((node) => !node.hidden).map((node) => node.getAttribute("data-notice")),
    notice: (reason) => notices.find((node) => node.getAttribute("data-notice") === reason),
    domReady() {
      ready = true;
      for (const [type, handler] of listeners.splice(0)) if (type === "DOMContentLoaded") handler();
    },
  };
}

function element(attributes, writes) {
  const map = new Map(Object.entries(attributes));
  const node = {
    getAttribute: (name) => (map.has(name) ? map.get(name) : null),
    setAttribute(name, value) { map.set(name, String(value)); writes.push([name, String(value)]); },
    removeAttribute(name) { map.delete(name); writes.push([name, null]); },
    insertAdjacentHTML() { throw new Error("the landing runtime must not insert markup"); },
  };
  for (const property of ["innerHTML", "outerHTML", "textContent", "innerText"]) {
    Object.defineProperty(node, property, { get() { return ""; }, set() { throw new Error("the landing runtime must not write " + property); } });
  }
  return node;
}

function noticeElement(attributes, writes) {
  const node = element(attributes, writes);
  const handlers = [];
  node.hidden = Object.hasOwn(attributes, "hidden");
  node.querySelector = (selector) => {
    if (selector !== "[data-notice-dismiss]") throw new Error("unexpected selector " + selector);
    return { addEventListener: (type, handler) => handlers.push([type, handler]) };
  };
  node.click = () => { for (const [type, handler] of handlers) if (type === "click") handler(); };
  return node;
}

function attributesOf(text) {
  const attributes = {};
  for (const match of text.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/g)) attributes[match[1]] = match[2] === undefined ? "" : match[2];
  return attributes;
}

function parameterValues(template) {
  return Object.fromEntries(template.parameters.map((item) => [item.code, item.type === "STRING" ? item.value : item.value.en]));
}

function resolve(text, values) {
  return text.replace(/\$\{([A-Z0-9_]+)@[A-Z_]+\}/g, (marker, code) => values[code]);
}

function leaves(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (value && typeof value === "object") return Object.values(value).flatMap(leaves);
  return [];
}

async function filesUnder(directory, relative = "") {
  const result = [];
  for (const entry of await fs.readdir(path.join(directory, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(directory, name));
    else result.push(name);
  }
  return result.sort();
}
