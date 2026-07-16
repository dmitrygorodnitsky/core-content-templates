import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const portalRoot = path.resolve("app-templates/customer-portal");
const designRoot = path.join(portalRoot, "design-inbox");
const sourcePath = path.join(portalRoot, "content/cases/calm-harbor-spa.portal-pim-staging.json");
const outputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-calm-harbor-landing-staging");
const rootCode = "CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING";
const assetPath = "/assets/customer-portal/calm-harbor-landing-staging";

const CHILDREN = [
  ["public-nav", "Public navigation", "public"],
  ["hero", "Hero", "cms"],
  ["trust", "Trust strip", "cms"],
  ["services", "Services", "cms"],
  ["how", "How it works", "cms"],
  ["proof", "Proof", "cms"],
  ["pricing-pim", "Live pricing", "pim"],
  ["products-pim", "Retail teaser", "pim"],
  ["service-area", "Service area", "cms"],
  ["reviews", "Reviews", "cms"],
  ["faq", "FAQ", "cms"],
  ["final-cta", "Final CTA", "cms"],
  ["footer", "Footer", "cms"],
];

export async function exportCalmHarborLandingBlocksManual(options = {}) {
  const target = path.resolve(options.outputDir || outputDir);
  assertOutput(target);
  const runtime = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const css = await readDesignCss();
  const assets = await assetsForPackage();
  const root = rootTemplate(css);
  const children = childTemplates(runtime);
  const payload = { schemaVersion: 1, root, children };
  const composition = {
    schemaVersion: 1,
    family: rootCode,
    kind: "root-with-independent-child-sections",
    children: children.map(function (child, index) {
      const info = CHILDREN[index];
      return { position: index + 1, code: child.code, module: info[0], authority: info[2] };
    }),
    dynamicData: {
      pricing: "Core public PIM, SPA_SERVICE + SPA_MEMBERSHIP only",
      products: "Core public PIM, SPA_RETAIL only",
    },
    constraints: [
      "The two PIM blocks show no CMS-authored numeric fallback.",
      "The package must be served same-origin from dev-1 while the PIM contract is limited to dev-1.",
      "No child template contains customer, session, account, payment, order, or appointment data.",
    ],
  };
  const manifest = {
    schemaVersion: 1,
    uploadPerformed: false,
    mode: "staging",
    package: { code: rootCode, children: children.map(function (child) { return child.code; }) },
    designSource: "app-templates/customer-portal/design-inbox",
    assets: assets.map(function (asset) { return { outputPath: asset.outputPath, publicUrl: asset.publicUrl, sha256: asset.sha256 }; }),
    sha256: {
      root: digest(JSON.stringify(root)),
      children: digest(JSON.stringify(children)),
      css: digest(css),
      javascript: digest(root.javascript),
    },
  };

  const staging = target + ".staging-" + crypto.randomBytes(6).toString("hex");
  const backup = target + ".backup-" + crypto.randomBytes(6).toString("hex");
  await fs.rm(staging, { recursive: true, force: true });
  await fs.mkdir(path.join(staging, "children"), { recursive: true });
  try {
    await writeJson(path.join(staging, "cms-family.payload.json"), payload);
    await writeJson(path.join(staging, "composition.resolved.json"), composition);
    await writeJson(path.join(staging, "manual-export-manifest.json"), manifest);
    await writeJson(path.join(staging, "root.template.json"), root);
    await writeText(path.join(staging, "head.html"), root.head);
    await writeText(path.join(staging, "html.html"), root.html);
    await writeText(path.join(staging, "root.css"), root.css);
    await writeText(path.join(staging, "root.js"), root.javascript);
    await writeJson(path.join(staging, "parameters.json"), root.parameters);
    await writeJson(path.join(staging, "page-context.source.json"), { runtime, rootCode, assetPath });
    await writeText(path.join(staging, "README.md"), readme(children, assets));
    await writeText(path.join(staging, "preview.html"), preview(root, children, assets));
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      const folder = path.join(staging, "children", String(index + 1).padStart(2, "0") + "-" + CHILDREN[index][0]);
      await fs.mkdir(folder, { recursive: true });
      await writeJson(path.join(folder, "template.json"), child);
      await writeText(path.join(folder, "head.html"), child.head);
      await writeText(path.join(folder, "html.html"), child.html);
      await writeText(path.join(folder, "css.css"), child.css);
      await writeText(path.join(folder, "javascript.js"), child.javascript);
      await writeJson(path.join(folder, "parameters.json"), child.parameters);
    }
    await fs.mkdir(path.join(staging, "assets"), { recursive: true });
    await writeJson(path.join(staging, "assets-manifest.json"), assets.map(function (asset) {
      return { outputPath: asset.outputPath, publicUrl: asset.publicUrl, sha256: asset.sha256 };
    }));
    await Promise.all(assets.map(function (asset) {
      return fs.copyFile(asset.sourcePath, path.join(staging, "assets", asset.outputPath));
    }));
    await replaceDirectory(target, staging, backup);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return { outputDir: target, root, children, manifest };
}

function rootTemplate(css) {
  return template(rootCode, "Calm Harbor Spa | Landing (staging)", null, [
    field("ROOT_META_TITLE", "Day spa treatments | Calm Harbor Spa"),
    field("ROOT_META_DESCRIPTION", "Calm Harbor Spa treatments, membership pricing, and spa retail products."),
    field("ROOT_FAQ_JSON_LD", faqJsonLd(), "LOCALIZED_JSON_OBJECT"),
  ], {
    head: '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex,nofollow">\n<title>' + ref("ROOT_META_TITLE") + '</title>\n<meta name="description" content="' + ref("ROOT_META_DESCRIPTION") + '">\n<script type="application/ld+json">' + ref("ROOT_FAQ_JSON_LD", "LOCALIZED_JSON_OBJECT") + '</script>\n<link rel="icon" href="data:,">',
    html: '<div class="app-shell" id="calm-harbor-landing" data-theme="beauty" data-mode="light" data-module="calm-harbor-landing">\n  <main class="page seo-page">\n    <!-- cms-child-slot:ROOT_SECTIONS -->\n  </main>\n</div>',
    css,
    javascript: runtimeScript(),
  });
}

function childTemplates(runtime) {
  const pim = runtime.pim;
  return [
    template(childCode(1, "PUBLIC_NAV"), "Calm Harbor Spa | Public navigation", rootCode, [
      field("BRAND", "Calm Harbor Spa"), field("HOME_URL", "#calm-harbor-landing", "STRING"),
      field("SIGN_IN_URL", "#", "STRING"), field("SHOP_URL", "#seo-products", "STRING"),
    ], { html: navHtml(), css: "", javascript: "" }),
    template(childCode(2, "HERO"), "Calm Harbor Spa | Hero", rootCode, [
      field("SERVICE_AREA", "Miami-Dade"), field("TITLE_PREFIX", "Unhurried spa care in "), field("LOCALITY", "Miami, FL"),
      field("SERVICE", "Hair, nails, skin and massage by licensed specialists - quiet single-guest rooms in the harbor studio, or at your place."),
      field("PRIMARY_LABEL", "Explore treatments"), field("PRIMARY_HREF", "#seo-services", "STRING"),
      field("SECONDARY_LABEL", "See pricing"), field("SECONDARY_HREF", "#seo-pricing", "STRING"),
      field("NOTE", "Prices on this page are live from the public catalog - no account needed to browse"),
      field("HERO_IMAGE_URL", assetPath + "/spa-massage-1448.webp", "STRING"),
      field("HERO_IMAGE_ALT", "Specialist smoothing a warm towel across a guest's shoulders in a daylit Calm Harbor treatment room"),
      field("HERO_IMAGE_FOCAL", "62% 40%", "STRING"),
    ], { html: heroHtml(), css: "", javascript: "" }),
    template(childCode(3, "TRUST"), "Calm Harbor Spa | Trust strip", rootCode, trustParameters(), { html: trustHtml(), css: "", javascript: "" }),
    template(childCode(4, "SERVICES"), "Calm Harbor Spa | Services", rootCode, servicesParameters(), { html: servicesHtml(), css: "", javascript: "" }),
    template(childCode(5, "HOW"), "Calm Harbor Spa | How it works", rootCode, howParameters(), { html: howHtml(), css: "", javascript: "" }),
    template(childCode(6, "PROOF"), "Calm Harbor Spa | Proof", rootCode, proofParameters(), { html: proofHtml(), css: "", javascript: "" }),
    template(childCode(7, "PRICING_PIM"), "Calm Harbor Spa | Live pricing", rootCode, pimParameters(pim, "PRICING", "SPA_SERVICE,SPA_MEMBERSHIP"), { html: pricingHtml(), css: "", javascript: "" }),
    template(childCode(8, "PRODUCTS_PIM"), "Calm Harbor Spa | Retail teaser", rootCode, pimParameters(pim, "PRODUCTS", "SPA_RETAIL"), { html: productsHtml(), css: "", javascript: "" }),
    template(childCode(9, "SERVICE_AREA"), "Calm Harbor Spa | Service area", rootCode, areaParameters(), { html: areaHtml(), css: "", javascript: "" }),
    template(childCode(10, "REVIEWS"), "Calm Harbor Spa | Reviews", rootCode, [
      field("EYEBROW", "Reviews"), field("TITLE", "What customers say"), field("EMPTY_TITLE", "Reviews appear here"),
      field("EMPTY_COPY", "Verified customer reviews are shown only when they are available."),
    ], { html: reviewsHtml(), css: "", javascript: "" }),
    template(childCode(11, "FAQ"), "Calm Harbor Spa | FAQ", rootCode, faqParameters(), { html: faqHtml(), css: "", javascript: "" }),
    template(childCode(12, "FINAL_CTA"), "Calm Harbor Spa | Final CTA", rootCode, [
      field("TITLE", "Make room for your reset"), field("SUB", "Every price on this page is live from the public catalog - browse the shop, or sign in to your routine."),
      field("PRIMARY_LABEL", "Browse the spa shop"), field("PRIMARY_HREF", "#seo-products", "STRING"),
      field("SECONDARY_LABEL", "Sign in"), field("SECONDARY_HREF", "#", "STRING"),
    ], { html: finalHtml(), css: "", javascript: "" }),
    template(childCode(13, "FOOTER"), "Calm Harbor Spa | Footer", rootCode, footerParameters(), { html: footerHtml(), css: "", javascript: "" }),
  ];
}

function navHtml() {
  return '<div class="top-nav-wrap"><nav class="top-nav" data-module="public-nav" data-visual-id="public-nav"><a class="top-nav__brand" href="' + ref("HOME_URL", "STRING") + '" aria-label="' + ref("BRAND") + '"><span class="brand-logo" aria-hidden="true"></span><span class="brand-name" data-bind="brand.name">' + ref("BRAND") + '</span></a><div class="nav-links"><a class="nav-link" href="#seo-services">Services</a><a class="nav-link" href="' + ref("SHOP_URL", "STRING") + '">Shop</a></div><div class="top-nav__actions"><button class="icon-btn" type="button" data-action="ui.toggleMode" title="Toggle light/dark" aria-label="Toggle light/dark">&#9790;</button><a class="btn btn--primary" href="' + ref("SIGN_IN_URL", "STRING") + '" data-action="auth.gotoSignin">Sign in</a></div></nav></div>';
}

function heroHtml() {
  return '<section class="seo-hero" data-module="seo-hero" data-visual-id="seo-hero"><div class="seo-hero__inner"><div class="seo-hero__copy"><span class="eyebrow seo-hero__area" data-bind="cms.meta.serviceArea">Serving ' + ref("SERVICE_AREA") + '</span><h1 class="seo-hero__title" data-bind="cms.meta.h1"><span>' + ref("TITLE_PREFIX") + '</span><span class="seo-hero__geo" data-bind="cms.meta.locality">' + ref("LOCALITY") + '</span></h1><p class="seo-hero__sub" data-bind="cms.hero.service">' + ref("SERVICE") + '</p><div class="seo-hero__ctas"><a class="btn btn--onaccent btn--lg" href="' + ref("PRIMARY_HREF", "STRING") + '" data-action="nav.services">' + ref("PRIMARY_LABEL") + '</a><a class="btn btn--glass-hero btn--lg" href="' + ref("SECONDARY_HREF", "STRING") + '" data-action="nav.pricing">' + ref("SECONDARY_LABEL") + '</a></div><div class="seo-hero__note">' + ref("NOTE") + '</div></div><div class="seo-media-slot seo-media seo-hero__media" data-module="seo-media" data-visual-id="seo-media" data-bind="cms.media.hero" data-state="ready"><img class="seo-media__img" src="' + ref("HERO_IMAGE_URL", "STRING") + '" alt="' + ref("HERO_IMAGE_ALT") + '" style="object-position:' + ref("HERO_IMAGE_FOCAL", "STRING") + '"></div></div></section>';
}

function trustParameters() {
  return [
    field("LICENCE_LABEL", "Cosmetology and massage licences"), field("LICENCE_SLOT", "Licence number - from CMS"),
    field("INSURANCE_LABEL", "Insured specialists"), field("INSURANCE_SLOT", "Policy - from CMS"),
    field("GUARANTEE_LABEL", "Guarantee"), field("GUARANTEE_VALUE", "Redo within 48 hours if you are not happy"),
    field("APPOINTMENTS_LABEL", "Appointments"), field("APPOINTMENTS_VALUE", "Evenings and weekends available"),
  ];
}

function trustHtml() {
  return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="ready">' + trustItem("&#9878;", "LICENCE_LABEL", "LICENCE_SLOT", "licence", true) + trustItem("&#10003;", "INSURANCE_LABEL", "INSURANCE_SLOT", "insurance", true) + trustItem("&#11033;", "GUARANTEE_LABEL", "GUARANTEE_VALUE", "guarantee") + trustItem("&#9201;", "APPOINTMENTS_LABEL", "APPOINTMENTS_VALUE", "appointments") + '</section>';
}

function trustItem(icon, label, value, bind, slot) {
  return '<div class="seo-trust__item" data-bind="cms.trust.' + bind + '"><span class="seo-trust__icon">' + icon + '</span><div><div class="seo-trust__label">' + ref(label) + '</div><div class="seo-trust__value">' + (slot ? '<span class="seo-slot" data-state="no-data">' : "") + ref(value) + (slot ? "</span>" : "") + '</div></div></div>';
}

function servicesParameters() {
  const list = [
    ["Grounding massage", "Release held tension with a slow full-body ritual.", "#seo-pricing"],
    ["Custom facial", "A skin-focused session shaped around your complexion today.", "#seo-pricing"],
    ["Harbor reset", "Massage and facial care in one longer visit.", "#seo-pricing"],
    ["Seasonal body ritual", "A longer seasonal treatment to slow down and reset.", "#seo-pricing"],
  ];
  const result = [field("EYEBROW", "Treatments"), field("TITLE", "The Calm Harbor menu"), field("SUB", "Every treatment card lists what's included - prices are live on this page.")];
  list.forEach(function (item, index) {
    const n = index + 1;
    result.push(field("ITEM_" + n + "_NAME", item[0]), field("ITEM_" + n + "_BENEFIT", item[1]), field("ITEM_" + n + "_HREF", item[2], "STRING"));
  });
  return result;
}

function servicesHtml() {
  let cards = "";
  for (let index = 1; index <= 4; index += 1) cards += '<a class="seo-svc" href="' + ref("ITEM_" + index + "_HREF", "STRING") + '" data-action="nav.pricing" data-bind="cms.services[]"><div class="seo-svc__icon"><i></i></div><div class="seo-svc__name">' + ref("ITEM_" + index + "_NAME") + '</div><div class="seo-svc__benefit">' + ref("ITEM_" + index + "_BENEFIT") + '</div><div class="seo-svc__meta"><span>Live price</span><span class="seo-svc__go">Pricing &rarr;</span></div></a>';
  return '<section class="seo-sec" id="seo-services" data-module="seo-services-grid" data-visual-id="seo-services-grid"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2><p class="seo-sec__sub">' + ref("SUB") + '</p></div><div class="seo-svc-grid">' + cards + '</div></section>';
}

function howParameters() {
  const values = [
    ["Choose a treatment", "Pick the kind of reset you need, from massage to a longer ritual."],
    ["Pick a time", "Choose a calm window at the harbor studio or your place."],
    ["Arrive as you are", "Your visit starts with a short conversation about comfort and focus."],
    ["Carry the calm forward", "Pressure notes and product picks support your next visit."],
  ];
  const result = [field("EYEBROW", "How it works"), field("TITLE", "Your service, step by step")];
  values.forEach(function (value, index) { const n = index + 1; result.push(field("STEP_" + n + "_TITLE", value[0]), field("STEP_" + n + "_DESC", value[1])); });
  return result;
}

function howHtml() {
  let steps = "";
  for (let index = 1; index <= 4; index += 1) steps += '<div class="seo-how__step" data-bind="cms.how[' + (index - 1) + ']"><div class="seo-how__num">' + index + '</div><div class="seo-how__title">' + ref("STEP_" + index + "_TITLE") + '</div><div class="seo-how__desc">' + ref("STEP_" + index + "_DESC") + '</div></div>';
  return '<section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-how">' + steps + '</div></section>';
}

function proofParameters() {
  const values = [
    ["Quiet by design", "Single-guest rooms, warm tables, no double-booking - the hour is yours."],
    ["Your specialist, every time", "Set a preferred specialist and make rebooking part of your routine."],
    ["Routine remembered", "Pressure notes, skin sensitivities and product picks carry over visit to visit."],
  ];
  const result = [field("EYEBROW", "Why Calm Harbor Spa"), field("TITLE", "A harbor, not an appointment mill"), field("IMAGE_URL", assetPath + "/spa-room-1600.webp", "STRING"), field("IMAGE_ALT", "Empty Calm Harbor treatment room with a linen-covered table, stone basin and folded towels by a window"), field("IMAGE_FOCAL", "50% 58%", "STRING")];
  values.forEach(function (value, index) { const n = index + 1; result.push(field("ITEM_" + n + "_TITLE", value[0]), field("ITEM_" + n + "_DESC", value[1])); });
  return result;
}

function proofHtml() {
  let cards = "";
  for (let index = 1; index <= 3; index += 1) cards += '<div class="seo-proof__card" data-bind="cms.proof.items[' + (index - 1) + ']"><div class="seo-proof__glyph"><i></i></div><div class="seo-proof__title">' + ref("ITEM_" + index + "_TITLE") + '</div><div class="seo-proof__desc">' + ref("ITEM_" + index + "_DESC") + '</div></div>';
  return '<section class="seo-sec seo-sec--tint" data-module="seo-proof" data-visual-id="seo-proof"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-media-slot seo-media seo-proof__media" data-module="seo-media" data-visual-id="seo-media" data-bind="cms.media.proof" data-state="ready"><img class="seo-media__img" src="' + ref("IMAGE_URL", "STRING") + '" alt="' + ref("IMAGE_ALT") + '" style="object-position:' + ref("IMAGE_FOCAL", "STRING") + '"></div><div class="seo-proof">' + cards + '</div></section>';
}

function pimParameters(pim, kind, types) {
  const prefix = kind + "_";
  return [
    field(prefix + "EYEBROW", kind === "PRICING" ? "Pricing" : "Spa retail"),
    field(prefix + "TITLE", kind === "PRICING" ? "What to expect" : "Take the ritual home"),
    field(prefix + "SUB", kind === "PRICING" ? "Displayed prices come from the public catalog - shown as published, never computed on the page." : "A short shelf from the public catalog - the products our specialists actually use."),
    field(prefix + "API_BASE", pim.apiBase, "STRING"), field(prefix + "ORGANIZATION", pim.organization, "STRING"),
    field(prefix + "PRODUCT_TYPE_CODES", types, "STRING"), field(prefix + "PRICE_TYPE_CODE", pim.priceTypeCode, "STRING"),
    field(prefix + "PRICE_ATTRIBUTE_CODE", pim.priceAttributeCode, "STRING"), field(prefix + "PRICE_ATTRIBUTE_VALUES", pim.priceAttributeValues.join(","), "STRING"),
    field(prefix + "CURRENCY", pim.currency, "STRING"), field(prefix + "CURRENCY_ATTRIBUTE_CODE", pim.currencyAttributeCode, "STRING"),
    field(prefix + "CURRENCY_ATTRIBUTE_VALUES", pim.currencyAttributeValues.join(","), "STRING"),
    field(prefix + "AMOUNT_ATTRIBUTE_CODE", pim.amountAttributeCode, "STRING"), field(prefix + "AMOUNT_MINOR_DIVISOR", String(pim.amountMinorDivisor), "STRING"),
    field(prefix + "EMPTY_COPY", kind === "PRICING" ? "No treatments or memberships are currently published in the public catalog - prices appear here the moment they are." : "Retail products appear here as soon as they are published in the public catalog - nothing is shown until real products exist."),
    field(prefix + "ERROR_TITLE", kind === "PRICING" ? "Live pricing is unavailable" : "The shop is unavailable"),
    field(prefix + "ERROR_COPY", "The public catalog could not be loaded. No catalog data is shown."),
    field(prefix + "RETRY_LABEL", "Try again"),
    field(prefix + "CTA_LABEL", kind === "PRICING" ? "Members - sign in to your plan" : "Visit the shop"),
    field(prefix + "CTA_HREF", "#", "STRING"),
  ];
}

function pricingHtml() {
  const p = "PRICING_";
  return '<section class="seo-sec" id="seo-pricing" data-module="seo-pricing" data-visual-id="seo-pricing" data-state="loading" data-pim-kind="pricing" ' + pimData(p) + '><div class="seo-sec__head"><span class="eyebrow">' + ref(p + "EYEBROW") + '</span><h2 class="seo-sec__title">' + ref(p + "TITLE") + '</h2><p class="seo-sec__sub">' + ref(p + "SUB") + '</p></div><div class="seo-price" data-pim-body><div class="seo-price__row"><span class="seo-skel" style="width:30%"></span><span class="seo-skel" style="width:18%"></span></div><div class="seo-price__row"><span class="seo-skel" style="width:30%"></span><span class="seo-skel" style="width:18%"></span></div><div class="seo-price__row"><span class="seo-skel" style="width:30%"></span><span class="seo-skel" style="width:18%"></span></div></div><div class="seo-price__cta"><a class="btn btn--primary" href="' + ref(p + "CTA_HREF", "STRING") + '" data-action="auth.gotoSignin">' + ref(p + "CTA_LABEL") + '</a></div></section>';
}

function productsHtml() {
  const p = "PRODUCTS_";
  return '<section class="seo-sec" id="seo-products" data-module="seo-products-teaser" data-visual-id="seo-products-teaser" data-state="loading" data-pim-kind="products" ' + pimData(p) + '><div class="seo-sec__head"><span class="eyebrow">' + ref(p + "EYEBROW") + '</span><h2 class="seo-sec__title">' + ref(p + "TITLE") + '</h2><p class="seo-sec__sub">' + ref(p + "SUB") + '</p></div><div class="seo-teaser__grid" data-pim-body><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div></div><div class="seo-teaser__cta"><a class="btn btn--primary" href="' + ref(p + "CTA_HREF", "STRING") + '" data-action="nav.products">' + ref(p + "CTA_LABEL") + '</a></div></section>';
}

function pimData(prefix) {
  return ["api-base", "organization", "product-type-codes", "price-type-code", "price-attribute-code", "price-attribute-values", "currency", "currency-attribute-code", "currency-attribute-values", "amount-attribute-code", "amount-minor-divisor", "empty-copy", "error-title", "error-copy", "retry-label", "cta-href"].map(function (name) {
    const code = prefix + name.toUpperCase().replace(/-/g, "_");
    const stringConfig = ["api-base", "organization", "product-type-codes", "price-type-code", "price-attribute-code", "price-attribute-values", "currency", "currency-attribute-code", "currency-attribute-values", "amount-attribute-code", "amount-minor-divisor", "cta-href"];
    return 'data-pim-' + name + '="' + ref(code, stringConfig.includes(name) ? "STRING" : "LOCALIZED_STRING_SS") + '"';
  }).join(" ");
}

function areaParameters() {
  const result = [field("EYEBROW", "Coverage"), field("TITLE", "Where we work"), field("REGION", "Miami-Dade"), field("NOTE", "Treatments in the harbor studio; selected rituals travel to your neighborhood.")];
  ["Miami", "Coral Gables", "Miami Beach", "Doral", "Aventura"].forEach(function (city, index) { result.push(field("CITY_" + (index + 1), city)); });
  return result;
}

function areaHtml() {
  let cities = "";
  for (let index = 1; index <= 5; index += 1) cities += '<span class="seo-area__chip">' + ref("CITY_" + index) + '</span>';
  return '<section class="seo-sec" data-module="seo-service-area" data-visual-id="seo-service-area"><div class="seo-area"><div><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-area__region">' + ref("REGION") + '</div><div class="seo-area__cities">' + cities + '</div><p class="seo-area__note">' + ref("NOTE") + '</p></div><div class="seo-area__map"><svg viewBox="0 0 200 140" class="seo-area__visual" aria-hidden="true"><circle cx="100" cy="70" r="64" fill="none" stroke="rgba(var(--accent-rgb),.35)" stroke-dasharray="3 5"></circle><circle cx="100" cy="70" r="42" fill="none" stroke="rgba(var(--accent-rgb),.27)"></circle><circle cx="100" cy="70" r="22" fill="rgba(var(--accent-rgb),.18)" stroke="rgba(var(--accent-rgb),.19)"></circle><circle cx="100" cy="70" r="5" fill="var(--accent)"></circle></svg><span class="seo-media-slot__label">coverage visualization</span></div></div></section>';
}

function reviewsHtml() {
  return '<section class="seo-sec seo-sec--tint" data-module="seo-reviews" data-visual-id="seo-reviews" data-state="empty"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-reviews__fallback" data-state="no-data"><div class="seo-reviews__fallback-title">' + ref("EMPTY_TITLE") + '</div><div>' + ref("EMPTY_COPY") + '</div></div></section>';
}

function faqParameters() {
  const values = [
    ["Studio or at home?", "Most treatments run in the harbor studio; selected hair, nail and massage rituals travel to you."],
    ["How do memberships work?", "A monthly plan from the public catalog with member pricing on treatments. Members sign in to manage their plan."],
    ["Are the shop products the ones you use?", "Yes. The retail shelf is the same public catalog our specialists use during treatments."],
    ["What if I am not happy with the result?", "Tell us within 48 hours. A redo is covered by the guarantee."],
  ];
  const result = [field("EYEBROW", "FAQ"), field("TITLE", "Common questions")];
  values.forEach(function (value, index) { const n = index + 1; result.push(field("ITEM_" + n + "_QUESTION", value[0]), field("ITEM_" + n + "_ANSWER", value[1])); });
  return result;
}

function faqHtml() {
  let items = "";
  for (let index = 1; index <= 4; index += 1) items += '<details class="seo-faq__item" data-bind="cms.faq[' + (index - 1) + ']"' + (index === 1 ? " open" : "") + '><summary class="seo-faq__q" data-action="seo.faq.toggle"><span>' + ref("ITEM_" + index + "_QUESTION") + '</span><span class="seo-faq__chev" aria-hidden="true">+</span></summary><div class="seo-faq__a"><p>' + ref("ITEM_" + index + "_ANSWER") + '</p></div></details>';
  return '<section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-faq" itemscope itemtype="https://schema.org/FAQPage">' + items + '</div></section>';
}

function finalHtml() {
  return '<section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta"><h2 class="seo-final__title">' + ref("TITLE") + '</h2><p class="seo-final__sub">' + ref("SUB") + '</p><div class="seo-final__ctas"><a class="btn btn--onaccent btn--lg" href="' + ref("PRIMARY_HREF", "STRING") + '" data-action="nav.products">' + ref("PRIMARY_LABEL") + '</a><a class="btn btn--glass-hero btn--lg" href="' + ref("SECONDARY_HREF", "STRING") + '" data-action="auth.gotoSignin">' + ref("SECONDARY_LABEL") + '</a></div></section>';
}

function footerParameters() {
  return [
    field("BRAND", "Calm Harbor Spa"), field("ADDRESS", "Miami-Dade"), field("PHONE", "", "STRING"), field("EMAIL", "", "STRING"),
    field("HOURS_1", "Weekdays: 9 AM - 7 PM"), field("HOURS_2", "Weekends: 10 AM - 5 PM"),
    field("PRIVACY_LABEL", "Privacy"), field("PRIVACY_HREF", "#", "STRING"), field("TERMS_LABEL", "Terms"), field("TERMS_HREF", "#", "STRING"), field("COPYRIGHT", "Calm Harbor Spa"),
  ];
}

function footerHtml() {
  return '<footer class="seo-footer" data-module="seo-footer" data-visual-id="seo-footer"><div class="seo-footer__grid"><div class="seo-footer__col"><div class="seo-footer__head">Spa</div><strong>' + ref("BRAND") + '</strong><span class="seo-footer__muted">' + ref("ADDRESS") + '</span></div><div class="seo-footer__col"><div class="seo-footer__head">Contact</div><a class="seo-footer__link" href="tel:' + ref("PHONE", "STRING") + '">' + ref("PHONE", "STRING") + '</a><a class="seo-footer__link" href="mailto:' + ref("EMAIL", "STRING") + '">' + ref("EMAIL", "STRING") + '</a></div><div class="seo-footer__col"><div class="seo-footer__head">Hours</div><span>' + ref("HOURS_1") + '</span><span>' + ref("HOURS_2") + '</span></div><div class="seo-footer__col"><div class="seo-footer__head">Legal</div><a class="seo-footer__link" href="' + ref("PRIVACY_HREF", "STRING") + '">' + ref("PRIVACY_LABEL") + '</a><a class="seo-footer__link" href="' + ref("TERMS_HREF", "STRING") + '">' + ref("TERMS_LABEL") + '</a></div></div><div class="seo-footer__base"><span>' + ref("COPYRIGHT") + '</span><span class="seo-footer__muted">Public catalog and member access</span></div></footer>';
}

function runtimeScript() {
  return String.raw`/* Calm Harbor public landing runtime. No private Core APIs or CMS price fallback. */
(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function values(value) { return String(value || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean); }
  function attr(root, name) { return root.getAttribute("data-pim-" + name) || ""; }
  function endpoint(root) { return attr(root, "api-base").replace(/\/+$/, "").replace(/\/api$/, "") + "/public/" + encodeURIComponent(attr(root, "organization")) + "/catalog/price-comparison.json"; }
  function payload(root, type) { return { productTypeCode: type, includeChildProductTypes: true, priceTypeCode: attr(root, "price-type-code"), includeChildPriceTypes: true, priceAttributeCode: attr(root, "price-attribute-code"), priceAttributeValues: values(attr(root, "price-attribute-values")), currencyAttributeCode: attr(root, "currency-attribute-code"), currencyAttributeValues: values(attr(root, "currency-attribute-values")), nlsKeys: ["NAME", "DESCRIPTION"] }; }
  function product(row) { var value = row && row.product || {}; return value.product || value; }
  function localized(value) { return value && (value.en || value["en-US"]) || {}; }
  function attribute(price, code) { var groups = price && price.attributes || {}; for (var key in groups) { var value = groups[key] && groups[key][code]; if (value && value.value !== undefined) return value.value; } return null; }
  function amount(price, root) { var display = price && price.display || {}; var direct = Number(display.amount); if (Number.isFinite(direct)) return direct; var minor = Number(attribute(price, attr(root, "amount-attribute-code"))); var divisor = Number(attr(root, "amount-minor-divisor")) || 100; return Number.isFinite(minor) ? minor / divisor : NaN; }
  function interval(value) { var normalized = String(value || "").toUpperCase(); if (normalized === "ONE_TIME") return "visit"; if (normalized === "MONTH") return "month"; return String(value || "").toLowerCase(); }
  function normalize(rows, root) { return rows.map(function (row, index) { var p = product(row); var nls = localized(p.nls); var price = row && row.price || {}; var display = price.display || {}; var currency = display.currency || attribute(price, attr(root, "currency-attribute-code")) || attr(root, "currency"); var raw = amount(price, root); if (!Number.isFinite(raw)) return null; return { code: p.code || "pim-" + index, name: nls.NAME || p.code || "Published item", description: String(nls.DESCRIPTION || "").replace(/<[^>]*>/g, "").trim(), displayPrice: new Intl.NumberFormat("en", { style: "currency", currency: currency, maximumFractionDigits: raw % 1 ? 2 : 0 }).format(raw), interval: interval(display.intervalLabel || attribute(price, attr(root, "price-attribute-code"))) }; }).filter(Boolean); }
  function el(name, className, text) { var node = document.createElement(name); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function error(root) { root.dataset.state = "error"; var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); var block = el("div", "state-block"); block.dataset.module = "error-state"; block.dataset.visualId = "error-state"; block.dataset.state = "error"; block.append(el("div", "state-block__glyph state-block__glyph--error", "!"), el("div", "state-block__title", attr(root, "error-title")), el("div", "state-block__desc", attr(root, "error-copy"))); var retry = el("button", "btn btn--primary", attr(root, "retry-label")); retry.type = "button"; retry.addEventListener("click", function () { load(root); }); block.appendChild(retry); body.appendChild(block); }
  function empty(root) { root.dataset.state = "empty"; var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); if (root.dataset.pimKind === "pricing") body.appendChild(el("div", "seo-price__fallback", attr(root, "empty-copy"))); else { var box = el("div", "seo-teaser__empty"); box.dataset.visualId = "seo-products-teaser-empty"; box.dataset.state = "no-data"; box.append(el("div", "seo-teaser__empty-title", "The shelf is being stocked"), document.createTextNode(attr(root, "empty-copy"))); body.appendChild(box); } }
  function pricing(root, rows) { root.dataset.state = "ready"; var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); rows.forEach(function (item) { var row = el("div", "seo-price__row"); row.dataset.module = "seo-pricing-row"; row.dataset.visualId = "seo-pricing-row"; row.dataset.bind = "pim.pricing[]"; row.dataset.productCode = item.code; var name = el("span", "seo-price__name", item.name); if (item.description) name.appendChild(el("span", "seo-price__desc", item.description)); var value = el("span", "seo-price__val"); value.append(el("b", "", item.displayPrice)); if (item.interval) value.append(el("span", "seo-price__unit", " / " + item.interval)); row.append(name, value); body.appendChild(row); }); }
  function products(root, rows) { root.dataset.state = "ready"; var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); var tints = ["#f7c6d8", "#e8c9f0", "#f7ddb2", "#cce9dd"]; rows.slice(0, 4).forEach(function (item, index) { var card = el("a", "product-card seo-teaser-card"); card.href = attr(root, "cta-href") || "#"; card.dataset.module = "seo-product-teaser-card"; card.dataset.visualId = "seo-product-teaser-card"; card.dataset.bind = "pim.products[]"; card.dataset.productCode = item.code; card.setAttribute("aria-label", item.name + " - open the shop"); var art = el("div", "product-card__art"); art.style.background = tints[index % tints.length]; var thumb = el("div", "product-card__thumb"); thumb.appendChild(el("i", "")); art.appendChild(thumb); var foot = el("div", "product-card__foot"); foot.append(el("div", "price-lg", item.displayPrice), el("span", "seo-teaser-card__go", "Shop ->")); card.append(art, el("div", "product-card__name", item.name), el("div", "product-card__blurb", item.description || item.code), foot); body.appendChild(card); }); }
  async function load(root) { root.dataset.state = "loading"; try { var replies = await Promise.all(values(attr(root, "product-type-codes")).map(async function (type) { var response = await fetch(endpoint(root), { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload(root, type)) }); if (!response.ok) throw new Error("Core PIM HTTP " + response.status); return response.json(); })); var rows = normalize(replies.flatMap(function (reply) { return Array.isArray(reply && reply.prices) ? reply.prices : []; }), root); if (!rows.length) empty(root); else if (root.dataset.pimKind === "pricing") pricing(root, rows); else products(root, rows); } catch (_) { error(root); } }
  function wire(root) { root.addEventListener("click", function (event) { var action = event.target.closest("[data-action]"); if (!action || !root.contains(action)) return; var name = action.dataset.action; if (name === "ui.toggleMode") { event.preventDefault(); document.documentElement.dataset.mode = document.documentElement.dataset.mode === "dark" ? "light" : "dark"; root.dataset.mode = document.documentElement.dataset.mode; } else if (name === "nav.services" || name === "nav.pricing" || name === "nav.products") { var target = document.querySelector(name === "nav.services" ? "#seo-services" : name === "nav.pricing" ? "#seo-pricing" : "#seo-products"); if (target) { event.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); } } }); var apply = function () { var width = root.getBoundingClientRect().width; root.classList.toggle("vw-mobile", width <= 560); root.classList.toggle("vw-tablet", width > 560 && width <= 900); root.classList.toggle("vw-compact", width <= 1040); }; apply(); if (window.ResizeObserver) new ResizeObserver(apply).observe(root); }
  ready(function () { var root = document.querySelector("#calm-harbor-landing"); if (!root) return; document.documentElement.dataset.theme = "beauty"; document.documentElement.dataset.mode = root.dataset.mode || "light"; wire(root); root.querySelectorAll("[data-pim-kind]").forEach(load); });
})();`;
}

async function readDesignCss() {
  const files = ["tokens.css", "base.css", "components.css", "shell.css", "seo.css", "responsive.css"];
  const values = await Promise.all(files.map(async function (file) {
    return "/* design source: design-inbox/styles/" + file + " */\n" + (await fs.readFile(path.join(designRoot, "styles", file), "utf8")).trim();
  }));
  return values.join("\n\n") + "\n";
}

async function assetsForPackage() {
  const values = [
    ["spa-massage-1448.webp", "spa-massage-1448.webp"],
    ["spa-room-1600.webp", "spa-room-1600.webp"],
  ];
  return Promise.all(values.map(async function (value) {
    const sourcePath = path.join(designRoot, "media", value[0]);
    const data = await fs.readFile(sourcePath);
    return { sourcePath, outputPath: value[1], publicUrl: assetPath + "/" + value[1], sha256: digest(data) };
  }));
}

function template(code, name, parent, parameters, parts) {
  const codes = new Map(parameters.map(function (parameter) { return [parameter.code, parent ? code + "_" + parameter.code : parameter.code]; }));
  const rewrite = function (value) {
    return String(value || "").replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (match, parameterCode, type) {
      return "${" + (codes.get(parameterCode) || parameterCode) + "@" + type + "}";
    });
  };
  const scopedParameters = parameters.map(function (parameter) { return Object.assign({}, parameter, { code: codes.get(parameter.code) || parameter.code }); });
  return { code, nls: { en: { NAME: name } }, templateLanguage: "JTE", parent: parent ? { code: parent } : null, children: [], head: rewrite(parts.head), html: rewrite(parts.html), css: parts.css || "", javascript: parts.javascript || "", parameters: scopedParameters };
}

function childCode(index, name) { return "CHS_LANDING_" + String(index).padStart(2, "0") + "_" + name; }
function field(code, value, type = "LOCALIZED_STRING_SS") { return { code, type, nls: { en: { NAME: code.replaceAll("_", " "), DESCRIPTION: "CMS-authored value for Calm Harbor Spa." } }, value: type.startsWith("LOCALIZED") ? { en: value } : value }; }
function ref(code, type = "LOCALIZED_STRING_SS") { return "$" + "{" + code + "@" + type + "}"; }
function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function writeText(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, String(value).replace(/\n*$/, "\n"), "utf8"); }
async function writeJson(file, value) { await writeText(file, JSON.stringify(value, null, 2) + "\n"); }

function preview(root, children, assets) {
  const values = new Map();
  [root].concat(children).forEach(function (template) { template.parameters.forEach(function (parameter) { values.set(parameter.code + "@" + parameter.type, parameter.type.startsWith("LOCALIZED") ? parameter.value.en : parameter.value); }); });
  const resolve = function (text) { return text.replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (_, code, type) {
    const value = previewValue(values.get(code + "@" + type));
    return type === "LOCALIZED_JSON_OBJECT" ? String(value).replace(/</g, "\\u003c") : escapeHtml(value);
  }); };
  const body = resolve(root.html).replace("<!-- cms-child-slot:ROOT_SECTIONS -->", children.map(function (child) { return resolve(child.html); }).join("\n"));
  const localBody = assets.reduce(function (value, asset) { return value.replaceAll(asset.publicUrl, "assets/" + asset.outputPath); }, body);
  return '<!doctype html>\n<html data-theme="beauty" data-mode="light"><head>\n' + resolve(root.head) + '\n<style>\n' + root.css + '</style></head><body>\n' + localBody + '\n<script>' + root.javascript + '</script></body></html>';
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; }); }
function previewValue(value) { return value && typeof value === "object" ? JSON.stringify(value) : value || ""; }

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Studio or at home?", acceptedAnswer: { "@type": "Answer", text: "Most treatments run in the harbor studio; selected hair, nail and massage rituals travel to you." } },
      { "@type": "Question", name: "How do memberships work?", acceptedAnswer: { "@type": "Answer", text: "A monthly plan from the public catalog with member pricing on treatments. Members sign in to manage their plan." } },
      { "@type": "Question", name: "Are the shop products the ones you use?", acceptedAnswer: { "@type": "Answer", text: "Yes. The retail shelf is the same public catalog our specialists use during treatments." } },
      { "@type": "Question", name: "What if I am not happy with the result?", acceptedAnswer: { "@type": "Answer", text: "Tell us within 48 hours. A redo is covered by the guarantee." } },
    ],
  };
}

function readme(children, assets) {
  return "# Manual upload: Calm Harbor landing blocks (staging)\n\n" +
    "This package is a CMS family: one root and " + children.length + " independently editable child templates. It is staging-only and emits `noindex,nofollow`.\n\n" +
    "## Upload order\n\n" +
    "1. Upload each file under `assets/` to the exact same-origin public URL in `assets-manifest.json`. Preserve filenames.\n" +
    "2. Create the root template from `root.template.json` with code `" + rootCode + "`.\n" +
    "3. Create child templates in numeric order under `children/`. Each child records its parent as `" + rootCode + "`.\n" +
    "4. Compose children in the exact order in `composition.resolved.json`.\n" +
    "5. Before publishing, replace every `SIGN_IN_URL`, shop URL, phone, email, and legal URL placeholder with verified staging values. A `#` sign-in URL is intentionally non-functional and must not be treated as a login flow.\n\n" +
    "## Live data boundary\n\n" +
    "Only `CHS_LANDING_07_PRICING_PIM` and `CHS_LANDING_08_PRODUCTS_PIM` fetch Core PIM. They request the public same-origin endpoint with `credentials: omit`, render loading/ready/empty/error, and never use CMS numeric prices as a fallback. All other children are CMS-authored public content.\n\n" +
    "## Included media\n\n" + assets.map(function (asset) { return "- `" + asset.outputPath + "` -> `" + asset.publicUrl + "`"; }).join("\n") + "\n";
}

function assertOutput(target) {
  const allowed = path.join(portalRoot, "dist", "manual-upload") + path.sep;
  if (!target.startsWith(allowed)) throw new Error("Landing manual output must stay under customer-portal/dist/manual-upload");
}

async function replaceDirectory(target, staging, backup) {
  const existing = await exists(target);
  try {
    if (existing) await fs.rename(target, backup);
    await fs.rename(staging, target);
    if (existing) await fs.rm(backup, { recursive: true, force: true });
  } catch (error) {
    await fs.rm(target, { recursive: true, force: true });
    if (existing) await fs.rename(backup, target);
    throw error;
  }
}

async function exists(target) { try { await fs.access(target); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; } }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportCalmHarborLandingBlocksManual();
  console.log("export-calm-harbor-landing-blocks-manual ok: " + path.relative(process.cwd(), result.outputDir) + " upload=false");
}
