import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { controlCharacterOffsets } from "./export-client-review-manual.mjs";
import { assertJteSafeFamily, between, readDesignCss } from "./export-granite-ridge-landing-blocks-manual.mjs";
import { assertExactInventory, replaceDirectory, sha256 } from "./portal-manual-package.mjs";

const repoRoot = path.resolve(".");
const portalRoot = path.join(repoRoot, "app-templates/customer-portal");
const distRoot = path.join(portalRoot, "dist/manual-upload");
const stylesRoot = path.join(portalRoot, "design-inbox/styles");

const landingOrigins = Object.freeze(["https://dev-1.servicewand.com"]);
export const landingRobots = "noindex,nofollow";
const landingShellId = "snow-landing";
const noticeParameter = "portal";
const noticeReasons = Object.freeze(["signed-out", "no-access"]);
const operatorParameterPlaceholder = "#";
const landingSections = Object.freeze(["public-nav", "reason-notice", "hero", "services", "how-it-works", "service-area", "faq", "final-cta", "footer"]);
export const packageInventory = Object.freeze([
  "README.md", "cms-family.payload.json", "manual-export-manifest.json", "preview.html",
  "root/css.css", "root/head.html", "root/html.html", "root/javascript.js", "root/parameters.json", "root/template.json",
]);

const TEXT = "text";
const sourceKeys = ["schemaVersion", "purpose", "template", "brand", "destinations", "serviceArea", "copy", "constraints"];
const destinationKeys = ["landing", "requestQuote", "signIn"];
const copyShape = {
  meta: { title: TEXT, description: TEXT },
  actions: { requestQuote: TEXT, signIn: TEXT },
  notices: { dismiss: TEXT, signedOut: { title: TEXT }, noAccess: { title: TEXT, body: TEXT, signIn: TEXT } },
  hero: { title: TEXT, sub: TEXT },
  services: { eyebrow: TEXT, title: TEXT, sub: TEXT, items: [{ name: TEXT, text: TEXT }] },
  how: { eyebrow: TEXT, title: TEXT, steps: [{ title: TEXT, text: TEXT }] },
  area: { eyebrow: TEXT, title: TEXT, note: TEXT },
  faq: { eyebrow: TEXT, title: TEXT, items: [{ question: TEXT, answer: TEXT }] },
  finalCta: { title: TEXT, sub: TEXT },
};
const servicePalettes = [
  ["var(--accent)", "rgba(var(--accent-rgb),.12)"],
  ["#1f8a44", "rgba(52,199,89,.16)"],
  ["#ff8a3d", "rgba(255,159,10,.16)"],
  ["#7a52e0", "rgba(122,82,224,.16)"],
];

export async function buildLiveLandingManual(source, input) {
  validateSource(source);
  const template = templateFor(source, await stylesheet());
  assertLandingTemplate(template);
  const manifest = manifestFor(source, template, input);
  const preview = previewFor(template);
  const readme = readmeFor(source, template, manifest);
  const files = [
    ["README.md", textFile(readme)],
    ["cms-family.payload.json", jsonFile({ schemaVersion: 1, root: template, children: [] })],
    ["manual-export-manifest.json", jsonFile(manifest)],
    ["preview.html", textFile(preview)],
    ["root/css.css", textFile(template.css)],
    ["root/head.html", textFile(template.head)],
    ["root/html.html", textFile(template.html)],
    ["root/javascript.js", textFile(template.javascript)],
    ["root/parameters.json", jsonFile(template.parameters)],
    ["root/template.json", jsonFile(template)],
  ];
  return { source, template, manifest, preview, readme, files };
}

export async function exportLiveLandingManual(options = {}) {
  if (!options.inputPath) throw new Error("--input=<source.json> is required");
  if (!options.outputDir) throw new Error("--output=<dist/manual-upload/...> is required");
  const inputPath = path.resolve(options.inputPath);
  const outputDir = path.resolve(options.outputDir);
  assertSafeOutputDir(outputDir);
  const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const built = await buildLiveLandingManual(source, sourceLabel(inputPath));
  await fs.mkdir(path.dirname(outputDir), { recursive: true });
  const staging = await fs.mkdtemp(outputDir + ".staging-");
  try {
    for (const [name, content] of built.files) {
      await fs.mkdir(path.dirname(path.join(staging, name)), { recursive: true });
      await fs.writeFile(path.join(staging, name), content, "utf8");
    }
    await assertExactInventory(staging, packageInventory);
    await replaceDirectory(outputDir, staging);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return Object.assign({ outputDir }, built);
}

export function sourceLabel(inputPath) {
  return path.relative(repoRoot, path.resolve(inputPath)).split(path.sep).join("/");
}

function validateSource(source) {
  assertKnownKeys(source, sourceKeys, "Landing source");
  for (const key of sourceKeys) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) throw new Error("Landing source is missing " + key);
  }
  if (source.schemaVersion !== 1) throw new Error("Landing source schemaVersion must be 1");
  if (typeof source.purpose !== "string" || !source.purpose.trim()) throw new Error("purpose must be a nonempty string");
  assertKnownKeys(source.template, ["code", "title"], "template");
  if (typeof source.template.code !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(source.template.code)) throw new Error("template.code must be an upper-snake code");
  assertCopyText(source.template.title, "template.title");
  assertKnownKeys(source.brand, ["name"], "brand");
  assertCopyText(source.brand.name, "brand.name");
  assertDestinations(source.destinations);
  assertKnownKeys(source.serviceArea, ["region", "cities"], "serviceArea");
  assertCopyText(source.serviceArea.region, "serviceArea.region");
  assertShape(source.serviceArea.cities, [TEXT], "serviceArea.cities");
  const cities = source.serviceArea.cities.map((city) => city.toLowerCase());
  if (new Set(cities).size !== cities.length) throw new Error("serviceArea.cities lists a city twice");
  assertShape(source.copy, copyShape, "copy");
  if (!Array.isArray(source.constraints) || !source.constraints.length || source.constraints.some((line) => typeof line !== "string" || !line.trim())) {
    throw new Error("A landing source must state its constraints");
  }
}

function assertDestinations(destinations) {
  assertKnownKeys(destinations, destinationKeys, "destinations");
  const origins = new Set();
  for (const key of destinationKeys) {
    const label = "destinations." + key;
    const value = destinations[key];
    if (typeof value !== "string") throw new Error(label + " must be an absolute https address");
    let url;
    try { url = new URL(value); } catch (_) { throw new Error(label + " must be an absolute https address"); }
    if (url.protocol !== "https:" || url.href !== value) throw new Error(label + " must be an absolute https address in canonical form, got " + JSON.stringify(value));
    if (url.username || url.password) throw new Error(label + " must not carry credentials");
    if (url.search) throw new Error(label + " must not carry a query");
    if (key !== "signIn" && url.hash) throw new Error(label + " must not carry a fragment");
    if (!landingOrigins.includes(url.origin)) throw new Error(label + " must be on " + landingOrigins.join(" or ") + ", got " + url.origin);
    origins.add(url.origin);
  }
  if (origins.size !== 1) throw new Error("Every destination must share one origin");
}

function assertShape(value, shape, label) {
  if (shape === TEXT) {
    assertCopyText(value, label);
    return;
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(value) || !value.length) throw new Error(label + " must be a nonempty list");
    value.forEach((item, index) => assertShape(item, shape[0], label + "[" + index + "]"));
    return;
  }
  assertKnownKeys(value, Object.keys(shape), label);
  for (const [key, child] of Object.entries(shape)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) throw new Error(label + "." + key + " is required");
    assertShape(value[key], child, label + "." + key);
  }
}

function assertCopyText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " must be a nonempty string");
  if (value !== value.trim()) throw new Error(label + " must not start or end with whitespace");
  if (value === operatorParameterPlaceholder) throw new Error(label + " is copy and cannot hold the " + operatorParameterPlaceholder + " placeholder");
  const unsafe = /[<>&"`]|\$\{|[\u0000-\u001f\u007f]/.exec(value);
  if (unsafe) throw new Error(label + " contains " + JSON.stringify(unsafe[0]) + ", which CMS would insert into the page unescaped");
}

function assertKnownKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be an object");
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new Error(label + " carries keys this package does not ship: " + unknown.join(", "));
}

async function stylesheet() {
  const design = await readDesignCss();
  const [tokens, seo, routes] = await Promise.all(["tokens.css", "seo.css", "routes.css"].map((name) => fs.readFile(path.join(stylesRoot, name), "utf8")));
  const snowTheme = ':root[data-theme="snow"] {';
  return [
    design.root.trim(),
    between(tokens, snowTheme, "}").replace(snowTheme, ":root:not([data-theme]) {") + "\n}",
    between(seo, "/* ---------- 1 · hero ---------- */", "/* ---------- 2 · trust strip ---------- */"),
    between(routes, "/* Banner (proposal / weather trigger) — data-module=\"alert-banner\" */", "/* TrackingCard — data-module=\"tracking-card\" */"),
    design.sections.services,
    design.sections.how,
    design.sections.serviceArea,
    design.sections.faq,
    design.sections.finalCta,
    design.sections.footer,
    landingCss(),
  ].join("\n\n") + "\n";
}

function landingCss() {
  return String.raw`.snow-main { display: flex; flex-direction: column; gap: 26px; }
.snow-landing a.btn--primary, .snow-landing a.btn--primary:hover, .snow-landing a.btn--glass-hero, .snow-landing a.btn--glass-hero:hover { color: #fff; }
.snow-landing a.btn--onaccent, .snow-landing a.btn--onaccent:hover { color: var(--accent); }
:root[data-mode="dark"] .snow-landing .btn--onaccent { background: #fff; }
.snow-landing a.btn--ghost, .snow-landing a.btn--ghost:hover, .snow-landing a.top-nav__brand, .snow-landing a.top-nav__brand:hover, .snow-landing a.snow-footer__brand, .snow-landing a.snow-footer__brand:hover { color: var(--ink); }
.snow-landing a[aria-disabled="true"] { opacity: .45; cursor: not-allowed; pointer-events: none; }
.snow-hero__inner { display: flex; align-items: center; justify-content: space-between; }
.snow-hero__inner .seo-hero__copy { flex: 1 1 auto; min-width: 0; }
.snow-hero__inner .seo-hero__title { text-wrap: pretty; }
.snow-hero-art { flex: none; display: flex; flex-direction: column; gap: 12px; width: 280px; padding: 22px; border-radius: 20px; background: linear-gradient(160deg, rgba(255,255,255,.9), rgba(255,255,255,.55)); box-shadow: 0 14px 40px rgba(8,24,60,.3); }
.snow-hero-art i { display: block; }
.snow-hero-art__head { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }
.snow-hero-art__head i { width: 120px; height: 10px; border-radius: 6px; background: rgba(var(--accent-rgb), .3); }
.snow-hero-art__field { height: 32px; border-radius: 10px; background: #fff; box-shadow: inset 0 0 0 1px rgba(13,38,76,.08); }
.snow-hero-art__field--short { width: 64%; }
.snow-hero-art__action { width: 132px; height: 34px; margin-top: 4px; border-radius: 999px; background: linear-gradient(180deg, var(--accent-2), var(--accent)); box-shadow: 0 4px 12px rgba(var(--accent-rgb), .35), inset 0 1px 0 rgba(255,255,255,.4); }
.seo-svc-grid--pair { grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
.seo-svc--static { cursor: default; }
.seo-svc--static:hover { transform: none; box-shadow: var(--shadow-card); }
.seo-how { grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); }
.snow-area__intro .seo-area__note { margin-top: 0; }
summary.seo-faq__q { list-style: none; }
summary.seo-faq__q::-webkit-details-marker { display: none; }
.seo-faq__chev::before { content: "+"; }
.seo-faq__item[open] { border-color: rgba(var(--accent-rgb), .3); }
.seo-faq__item[open] .seo-faq__chev::before { content: "−"; }
.snow-notice { margin: 0; flex-wrap: nowrap; cursor: default; }
.snow-notice[hidden] { display: none; }
.snow-notice--warn { align-items: flex-start; }
.snow-notice .alert-banner__body { min-width: 0; }
.snow-notice__icon { font-weight: 800; background: var(--info-bg); color: var(--info); }
.snow-notice--warn .snow-notice__icon { background: var(--warn-bg); color: var(--warn); }
.snow-notice__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.snow-notice__dismiss { flex: none; padding: 0; font: inherit; font-size: 18px; line-height: 1; color: var(--ink-2); }
.snow-footer__base { margin-top: 0; padding-top: 0; border-top: 0; }
.snow-footer__links { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; font-weight: 600; }
@media (max-width: 1040px) {
  .snow-hero-art { display: none; }
}
@media (max-width: 560px) {
  .snow-main { gap: 20px; }
  .top-nav { gap: 10px; }
  .top-nav__brand { flex-shrink: 1; min-width: 0; }
  .brand-name { font-size: 15px; line-height: 1.2; white-space: normal; }
  .snow-hero__inner { padding: 30px 22px; }
  .snow-hero__inner .seo-hero__title { font-size: 32px; text-wrap: balance; }
  .seo-area { grid-template-columns: 1fr; }
  .snow-notice { gap: 12px; padding: 14px; }
  .snow-notice__icon { width: 36px; height: 36px; border-radius: 11px; font-size: 16px; }
  .snow-notice__actions .btn { flex: 1 1 100%; }
}`;
}

function templateFor(source, css) {
  return {
    code: source.template.code,
    nls: { en: { NAME: source.template.title } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="robots" content="' + landingRobots + '">',
      "<title>" + ref("META_TITLE") + "</title>",
      '<meta name="description" content="' + ref("META_DESCRIPTION") + '">',
      '<link rel="icon" href="data:,">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">',
    ].join("\n"),
    html: htmlFor(source),
    css,
    javascript: runtimeScript(),
    parameters: parametersFor(source),
  };
}

function parametersFor(source) {
  const copy = source.copy;
  const destinationNote = " A value that is not an absolute https address, the " + operatorParameterPlaceholder + " placeholder included, is read as not set and these links are disabled.";
  return [
    copyParameter("META_TITLE", copy.meta.title, "Browser tab title."),
    copyParameter("META_DESCRIPTION", copy.meta.description, "Meta description. The page stays " + landingRobots + " while the tenant is on staging."),
    copyParameter("BRAND_NAME", source.brand.name, "Brand name in the top bar and the footer."),
    addressParameter("LANDING_URL", source.destinations.landing, "Absolute https address of this landing. The brand in the top bar and in the footer links to it." + destinationNote),
    addressParameter("REQUEST_QUOTE_URL", source.destinations.requestQuote, "Absolute https address of the published quote request form. Every Get a free quote link opens it." + destinationNote),
    addressParameter("SIGN_IN_URL", source.destinations.signIn, "Absolute https address of the customer portal sign-in. Every Sign in link opens it, and so does the no-access notice." + destinationNote),
    copyParameter("REQUEST_QUOTE_LABEL", copy.actions.requestQuote, "Label of every link to the quote request form: hero, no-access notice, final call to action and footer."),
    copyParameter("SIGN_IN_LABEL", copy.actions.signIn, "Label of every Sign in link: top bar, hero, final call to action and footer."),
    copyParameter("NOTICE_SIGNED_OUT_TITLE", copy.notices.signedOut.title, "Notice shown when the address carries ?" + noticeParameter + "=signed-out."),
    copyParameter("NOTICE_NO_ACCESS_TITLE", copy.notices.noAccess.title, "Notice title shown when the address carries ?" + noticeParameter + "=no-access."),
    copyParameter("NOTICE_NO_ACCESS_BODY", copy.notices.noAccess.body, "Line under the no-access notice title."),
    copyParameter("NOTICE_NO_ACCESS_SIGN_IN_LABEL", copy.notices.noAccess.signIn, "Label of the no-access notice link to the sign-in address."),
    copyParameter("NOTICE_DISMISS_LABEL", copy.notices.dismiss, "Accessible name of the button that closes a notice."),
    copyParameter("HERO_TITLE", copy.hero.title, "Hero headline, the only h1 of the page."),
    copyParameter("HERO_SUB", copy.hero.sub, "One line under the hero headline."),
    copyParameter("SERVICES_EYEBROW", copy.services.eyebrow, "Services section eyebrow."),
    copyParameter("SERVICES_TITLE", copy.services.title, "Services section title."),
    copyParameter("SERVICES_SUB", copy.services.sub, "Line under the services section title."),
    ...copy.services.items.flatMap((item, index) => [
      copyParameter("SERVICES_ITEM_" + (index + 1) + "_NAME", item.name, "Name on service card " + (index + 1) + "."),
      copyParameter("SERVICES_ITEM_" + (index + 1) + "_TEXT", item.text, "Description on service card " + (index + 1) + "."),
    ]),
    copyParameter("HOW_EYEBROW", copy.how.eyebrow, "How it works section eyebrow."),
    copyParameter("HOW_TITLE", copy.how.title, "How it works section title."),
    ...copy.how.steps.flatMap((step, index) => [
      copyParameter("HOW_STEP_" + (index + 1) + "_TITLE", step.title, "Title of step " + (index + 1) + "."),
      copyParameter("HOW_STEP_" + (index + 1) + "_TEXT", step.text, "Description of step " + (index + 1) + "."),
    ]),
    copyParameter("AREA_EYEBROW", copy.area.eyebrow, "Service area section eyebrow."),
    copyParameter("AREA_TITLE", copy.area.title, "Service area section title."),
    copyParameter("AREA_REGION", source.serviceArea.region, "Region named above the cities."),
    ...source.serviceArea.cities.map((city, index) => copyParameter("AREA_CITY_" + (index + 1), city, "City " + (index + 1) + " of the service area.")),
    copyParameter("AREA_NOTE", copy.area.note, "Line under the cities."),
    copyParameter("FAQ_EYEBROW", copy.faq.eyebrow, "FAQ section eyebrow."),
    copyParameter("FAQ_TITLE", copy.faq.title, "FAQ section title."),
    ...copy.faq.items.flatMap((item, index) => [
      copyParameter("FAQ_ITEM_" + (index + 1) + "_QUESTION", item.question, "Question " + (index + 1) + "."),
      copyParameter("FAQ_ITEM_" + (index + 1) + "_ANSWER", item.answer, "Answer to question " + (index + 1) + "."),
    ]),
    copyParameter("FINAL_TITLE", copy.finalCta.title, "Title of the closing call to action."),
    copyParameter("FINAL_SUB", copy.finalCta.sub, "Line under the closing call to action title."),
  ];
}

function copyParameter(code, value, description) {
  return { code, type: "LOCALIZED_STRING_SS", nls: { en: { NAME: code.replace(/_/g, " "), DESCRIPTION: description } }, value: { en: value } };
}

function addressParameter(code, value, description) {
  return { code, type: "STRING", nls: { en: { NAME: code.replace(/_/g, " "), DESCRIPTION: description } }, value };
}

function htmlFor(source) {
  const copy = source.copy;
  return [
    '<div class="app-shell snow-landing" id="' + landingShellId + '" data-module="app-shell" data-visual-id="app-shell">',
    navHtml(),
    '  <div class="page seo-page" data-visual-id="seo-landing">',
    '    <main class="snow-main">',
    noticesHtml(),
    heroHtml(),
    servicesHtml(copy.services.items.length),
    howHtml(copy.how.steps.length),
    areaHtml(source.serviceArea.cities.length),
    faqHtml(copy.faq.items.length),
    finalHtml(),
    "    </main>",
    footerHtml(),
    "  </div>",
    "</div>",
  ].join("\n");
}

function navHtml() {
  return [
    '  <header class="top-nav-wrap">',
    '    <nav class="top-nav" data-module="public-nav" data-visual-id="public-nav">',
    "      " + link("top-nav__brand", "landing", '<span class="brand-logo" aria-hidden="true"></span><span class="brand-name">' + ref("BRAND_NAME") + "</span>"),
    '      <div class="top-nav__actions">' + link("btn btn--ghost", "sign-in", ref("SIGN_IN_LABEL"), ' data-visual-id="public-signin"') + "</div>",
    "    </nav>",
    "  </header>",
  ].join("\n");
}

function noticesHtml() {
  const dismiss = '<button type="button" class="icon-btn snow-notice__dismiss" data-notice-dismiss aria-label="' + ref("NOTICE_DISMISS_LABEL") + '">×</button>';
  return [
    '      <div class="alert-banner alert-banner--info snow-notice" data-notice="' + noticeReasons[0] + '" data-module="reason-notice" data-visual-id="reason-notice-' + noticeReasons[0] + '" role="status" hidden>',
    '        <span class="alert-banner__icon snow-notice__icon" aria-hidden="true">✓</span>',
    '        <div class="alert-banner__body"><div class="alert-banner__title">' + ref("NOTICE_SIGNED_OUT_TITLE") + "</div></div>",
    "        " + dismiss,
    "      </div>",
    '      <div class="alert-banner alert-banner--glass snow-notice snow-notice--warn" data-notice="' + noticeReasons[1] + '" data-module="reason-notice" data-visual-id="reason-notice-' + noticeReasons[1] + '" role="status" hidden>',
    '        <span class="alert-banner__icon snow-notice__icon" aria-hidden="true">!</span>',
    '        <div class="alert-banner__body">',
    '          <div class="alert-banner__title">' + ref("NOTICE_NO_ACCESS_TITLE") + "</div>",
    '          <div class="alert-banner__desc">' + ref("NOTICE_NO_ACCESS_BODY") + "</div>",
    '          <div class="snow-notice__actions">' + link("btn btn--primary", "request-quote", ref("REQUEST_QUOTE_LABEL")) + link("btn btn--ghost", "sign-in", ref("NOTICE_NO_ACCESS_SIGN_IN_LABEL")) + "</div>",
    "        </div>",
    "        " + dismiss,
    "      </div>",
  ].join("\n");
}

function heroHtml() {
  return [
    '      <section class="seo-hero" data-module="seo-hero" data-visual-id="seo-hero">',
    '        <div class="seo-hero__inner snow-hero__inner">',
    '          <div class="seo-hero__copy">',
    '            <h1 class="seo-hero__title">' + ref("HERO_TITLE") + "</h1>",
    '            <p class="seo-hero__sub">' + ref("HERO_SUB") + "</p>",
    '            <div class="seo-hero__ctas">' + callToAction("btn--onaccent", "seo-hero-primary-cta", "request-quote", "REQUEST_QUOTE_LABEL") + callToAction("btn--glass-hero", "seo-hero-secondary-cta", "sign-in", "SIGN_IN_LABEL") + "</div>",
    "          </div>",
    '          <div class="snow-hero-art" data-visual-id="seo-hero-art" aria-hidden="true"><div class="snow-hero-art__head"><span class="brand-logo"></span><i></i></div><i class="snow-hero-art__field"></i><i class="snow-hero-art__field"></i><i class="snow-hero-art__field snow-hero-art__field--short"></i><i class="snow-hero-art__action"></i></div>',
    "        </div>",
    "      </section>",
  ].join("\n");
}

function servicesHtml(count) {
  const cards = [];
  for (let index = 1; index <= count; index += 1) {
    const palette = servicePalettes[(index - 1) % servicePalettes.length];
    cards.push('          <div class="seo-svc seo-svc--static" data-module="seo-service-card" data-visual-id="seo-service-card">'
      + '<div class="seo-svc__icon" style="background:' + palette[1] + '"><i style="background:' + palette[0] + '"></i></div>'
      + '<div class="seo-svc__name">' + ref("SERVICES_ITEM_" + index + "_NAME") + "</div>"
      + '<div class="seo-svc__benefit">' + ref("SERVICES_ITEM_" + index + "_TEXT") + "</div></div>");
  }
  return [
    '      <section class="seo-sec" data-module="seo-services-grid" data-visual-id="seo-services-grid">',
    '        <div class="seo-sec__head"><span class="eyebrow">' + ref("SERVICES_EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("SERVICES_TITLE") + '</h2><p class="seo-sec__sub">' + ref("SERVICES_SUB") + "</p></div>",
    '        <div class="seo-svc-grid' + (count === 2 ? " seo-svc-grid--pair" : "") + '">',
    ...cards,
    "        </div>",
    "      </section>",
  ].join("\n");
}

function howHtml(count) {
  const steps = [];
  for (let index = 1; index <= count; index += 1) {
    steps.push('          <div class="seo-how__step"><div class="seo-how__num">' + index + '</div><div class="seo-how__title">' + ref("HOW_STEP_" + index + "_TITLE") + '</div><div class="seo-how__desc">' + ref("HOW_STEP_" + index + "_TEXT") + "</div></div>");
  }
  return [
    '      <section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works">',
    '        <div class="seo-sec__head"><span class="eyebrow">' + ref("HOW_EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("HOW_TITLE") + "</h2></div>",
    '        <div class="seo-how">',
    ...steps,
    "        </div>",
    "      </section>",
  ].join("\n");
}

function areaHtml(count) {
  let cities = "";
  for (let index = 1; index <= count; index += 1) cities += '<span class="seo-area__chip">' + ref("AREA_CITY_" + index) + "</span>";
  return [
    '      <section class="seo-sec seo-sec--tint" data-module="seo-service-area" data-visual-id="seo-service-area">',
    '        <div class="seo-area">',
    '          <div class="snow-area__intro"><div class="seo-sec__head"><span class="eyebrow">' + ref("AREA_EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("AREA_TITLE") + '</h2></div><p class="seo-area__note">' + ref("AREA_NOTE") + "</p></div>",
    '          <div><div class="seo-area__region">' + ref("AREA_REGION") + '</div><div class="seo-area__cities">' + cities + "</div></div>",
    "        </div>",
    "      </section>",
  ].join("\n");
}

function faqHtml(count) {
  const items = [];
  for (let index = 1; index <= count; index += 1) {
    items.push('          <details class="seo-faq__item"><summary class="seo-faq__q"><span>' + ref("FAQ_ITEM_" + index + "_QUESTION") + '</span><span class="seo-faq__chev" aria-hidden="true"></span></summary><div class="seo-faq__a"><p>' + ref("FAQ_ITEM_" + index + "_ANSWER") + "</p></div></details>");
  }
  return [
    '      <section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq">',
    '        <div class="seo-sec__head"><span class="eyebrow">' + ref("FAQ_EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("FAQ_TITLE") + "</h2></div>",
    '        <div class="seo-faq">',
    ...items,
    "        </div>",
    "      </section>",
  ].join("\n");
}

function finalHtml() {
  return [
    '      <section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta">',
    '        <h2 class="seo-final__title">' + ref("FINAL_TITLE") + "</h2>",
    '        <p class="seo-final__sub">' + ref("FINAL_SUB") + "</p>",
    '        <div class="seo-final__ctas">' + callToAction("btn--onaccent", "seo-final-primary-cta", "request-quote", "REQUEST_QUOTE_LABEL") + callToAction("btn--glass-hero", "seo-final-secondary-cta", "sign-in", "SIGN_IN_LABEL") + "</div>",
    "      </section>",
  ].join("\n");
}

function footerHtml() {
  return [
    '    <footer class="seo-footer snow-footer" data-module="seo-footer" data-visual-id="seo-footer">',
    '      <div class="seo-footer__base snow-footer__base">' + link("snow-footer__brand", "landing", ref("BRAND_NAME"))
      + '<div class="snow-footer__links">' + link("seo-footer__link", "request-quote", ref("REQUEST_QUOTE_LABEL")) + link("seo-footer__link", "sign-in", ref("SIGN_IN_LABEL")) + "</div></div>",
    "    </footer>",
  ].join("\n");
}

function callToAction(variant, visualId, destination, labelCode) {
  return link("btn " + variant + " btn--lg seo-cta", destination, ref(labelCode), ' data-module="seo-cta" data-visual-id="' + visualId + '"');
}

function link(className, destination, content, extra = "") {
  const parameter = { landing: "LANDING_URL", "request-quote": "REQUEST_QUOTE_URL", "sign-in": "SIGN_IN_URL" }[destination];
  return '<a class="' + className + '" href="' + ref(parameter, "STRING") + '" data-destination="' + destination + '"' + extra + ">" + content + "</a>";
}

function runtimeScript() {
  return String.raw`(function () {
  "use strict";
  var page = document.documentElement;
  var reasons = ${JSON.stringify(noticeReasons)};
  var darkScheme = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function applyMode() { page.dataset.mode = darkScheme && darkScheme.matches ? "dark" : "light"; }
  page.dataset.theme = "snow";
  applyMode();
  if (darkScheme && typeof darkScheme.addEventListener === "function") darkScheme.addEventListener("change", applyMode);
  function safeUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    try { var url = new URL(raw); return url.protocol === "https:" ? url.href : ""; } catch (_) { return ""; }
  }
  function disableUnsetDestinations(shell) {
    shell.querySelectorAll("a[data-destination]").forEach(function (link) {
      if (safeUrl(link.getAttribute("href"))) return;
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("data-destination-state", "unset");
    });
  }
  function noticeReason(search) {
    var entries = [];
    new URLSearchParams(search).forEach(function (value, key) { entries.push([key, value]); });
    if (entries.length !== 1 || entries[0][0] !== ${JSON.stringify(noticeParameter)}) return "";
    return reasons.indexOf(entries[0][1]) === -1 ? "" : entries[0][1];
  }
  function forgetReason() {
    try { window.history.replaceState(window.history.state, "", window.location.pathname + window.location.hash); } catch (_) {}
  }
  function showNotice(shell, reason) {
    var shown = false;
    shell.querySelectorAll("[data-notice]").forEach(function (notice) {
      if (!reason || notice.getAttribute("data-notice") !== reason) return;
      notice.hidden = false;
      shown = true;
      var dismiss = notice.querySelector("[data-notice-dismiss]");
      if (dismiss) dismiss.addEventListener("click", function () { notice.hidden = true; });
    });
    if (shown) forgetReason();
  }
  function trackWidth(shell) {
    function apply() {
      var width = shell.getBoundingClientRect().width;
      shell.classList.toggle("vw-mobile", width <= 560);
      shell.classList.toggle("vw-tablet", width > 560 && width <= 900);
      shell.classList.toggle("vw-compact", width <= 1040);
    }
    apply();
    if (typeof window.ResizeObserver === "function") new window.ResizeObserver(apply).observe(shell);
  }
  function start() {
    var shell = document.getElementById(${JSON.stringify(landingShellId)});
    if (!shell) return;
    trackWidth(shell);
    disableUnsetDestinations(shell);
    showNotice(shell, noticeReason(window.location.search));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
`;
}

function assertLandingTemplate(template) {
  assertJteSafeFamily([template]);
  const fields = { head: template.head, html: template.html, css: template.css, javascript: template.javascript };
  const referenced = new Set();
  for (const [field, value] of Object.entries(fields)) {
    const directive = /@(param|import|template|if|elseif|else|endif|for|endfor|while|endwhile|raw|endraw)\b/.exec(value);
    if (directive) throw new Error("Refusing to export JTE-unsafe " + field + ": JTE directive " + JSON.stringify(directive[0]));
    const offsets = controlCharacterOffsets(value);
    if (offsets.length) throw new Error("Refusing to export " + field + ": control character " + value.charCodeAt(offsets[0]) + " at offset " + offsets[0]);
    for (const match of value.matchAll(/\$\{([A-Z0-9_]+)@[A-Z_]+\}/g)) {
      if (field === "css" || field === "javascript") throw new Error("Refusing to export " + field + ": only head and html may carry a parameter marker");
      referenced.add(match[1]);
    }
  }
  if (/<\/script/i.test(template.javascript)) throw new Error("Refusing to inline a javascript field that contains a script terminator");
  if (/<\/style/i.test(template.css)) throw new Error("Refusing to inline a css field that contains a style terminator");
  for (const item of template.parameters) {
    if (!referenced.has(item.code)) throw new Error("Parameter " + item.code + " is declared but never referenced");
    const value = item.type === "STRING" ? item.value : item.type === "LOCALIZED_STRING_SS" && item.value && Object.keys(item.value).join() === "en" ? item.value.en : null;
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("Parameter " + item.code + " must ship a nonempty " + (item.type === "STRING" ? "value" : "en value") + ": CMS creates no PageContext for a template with an empty parameter");
    }
  }
}

function manifestFor(source, template, input) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    mode: "staging",
    launchState: "staging-only",
    input,
    designSource: "app-templates/customer-portal/design-inbox",
    template: {
      code: template.code,
      templateLanguage: template.templateLanguage,
      robots: landingRobots,
      children: [],
      parameters: template.parameters.map((item) => item.code),
      sha256: { head: sha256(template.head), html: sha256(template.html), css: sha256(template.css), javascript: sha256(template.javascript) },
    },
    destinations: source.destinations,
    serviceArea: source.serviceArea,
    notices: { parameter: noticeParameter, reasons: noticeReasons.slice() },
    sections: landingSections.slice(),
    openedLiveContracts: [],
    constraints: source.constraints,
  };
}

function previewFor(template) {
  const values = new Map(template.parameters.map((item) => [item.code, item.type === "STRING" ? item.value : item.value.en]));
  const resolve = (text) => text.replace(/\$\{([A-Z0-9_]+)@[A-Z_]+\}/g, (marker, code) => values.get(code));
  return "<!doctype html>\n<html>\n<head>\n" + resolve(template.head) + "\n</head>\n<body>\n"
    + '<style type="text/css">' + template.css + "</style>\n"
    + '<script type="text/javascript" charset="utf-8">' + template.javascript + "</script>\n"
    + resolve(template.html) + "\n</body>\n</html>\n";
}

function readmeFor(source, template, manifest) {
  const copy = source.copy;
  const addresses = template.parameters.filter((item) => item.type === "STRING");
  return [
    "# " + template.nls.en.NAME,
    "",
    "Generated by `scripts/export-live-landing-manual.mjs` from `" + manifest.input + "`. Never hand-edit this directory.",
    "",
    "| field | value |",
    "| --- | --- |",
    "| template code | `" + template.code + "` |",
    "| template language | `" + template.templateLanguage + "` |",
    "| children | none: one root template renders every section |",
    "| robots | `" + landingRobots + "` |",
    "| launch state | `" + manifest.launchState + "` |",
    "| sections | " + landingSections.map((name) => "`" + name + "`").join(", ") + " |",
    "",
    "## Destinations",
    "",
    "| parameter | value |",
    "| --- | --- |",
    ...addresses.map((item) => "| `" + item.code + "` | `" + item.value + "` |"),
    "",
    "## Reason notices",
    "",
    "| address ends with | notice |",
    "| --- | --- |",
    "| `?" + noticeParameter + "=" + noticeReasons[0] + "` | " + copy.notices.signedOut.title + " |",
    "| `?" + noticeParameter + "=" + noticeReasons[1] + "` | " + copy.notices.noAccess.title + " |",
    "",
    "Any other value, and any address with another parameter, shows no notice. Without JavaScript no notice shows. A shown notice removes the parameter from the address.",
    "",
    "## Upload",
    "",
    "`scripts/upsert-granite-ridge-staging-landing.mjs` rebuilds this package, runs `granite-ridge-staging-landing-manual-check.mjs` and creates or updates the BlockTemplate by code through `app-templates/landing-page/scripts/upload-cms-family.mjs`. It is a dry run unless `--live` is passed, and it never creates or changes a PageContext.",
    "",
    "For a manual paste, copy `root/head.html`, `root/html.html`, `root/css.css` and `root/javascript.js` into the matching fields of a JTE BlockTemplate with code `" + template.code + "`, and declare the parameters of `root/parameters.json`. `root/template.json` is the complete record.",
    "",
    "`preview.html` is the document CMS renders: the head, then the stylesheet and the script ahead of the markup in the body.",
    "",
    "## Constraints",
    "",
    ...source.constraints.map((line) => "- " + line),
    "",
  ].join("\n");
}

function ref(code, type = "LOCALIZED_STRING_SS") {
  return "$" + "{" + code + "@" + type + "}";
}

function textFile(value) {
  return String(value).replace(/\n*$/, "\n");
}

function jsonFile(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function assertSafeOutputDir(outputDir) {
  const relative = path.relative(distRoot, outputDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Manual packages may only be written under dist/manual-upload/");
}

function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    const match = /^--(input|output)=(.*)$/.exec(arg);
    if (!match) throw new Error("Unsupported argument: " + arg);
    options[{ input: "inputPath", output: "outputDir" }[match[1]]] = match[2];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportLiveLandingManual(parseArgs(process.argv.slice(2)));
  console.log("export-live-landing-manual ok: " + path.relative(process.cwd(), result.outputDir) + " upload=false");
}
