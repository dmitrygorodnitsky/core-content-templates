import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { SEO, SEO_FOOTER } from "../design-inbox/data/seo-fixtures.js";

const portalRoot = path.resolve("app-templates/customer-portal");
const designRoot = path.join(portalRoot, "design-inbox");
const sourcePath = path.join(portalRoot, "content/cases/calm-harbor-spa.portal-pim-staging.json");
const outputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-calm-harbor-landing-staging");
const rootCode = "CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING";
const assetPath = "/assets/customer-portal/calm-harbor-landing-staging";
let designDataPromise;

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
  const design = await readDesignData();
  const css = await readDesignCss();
  const assets = await assetsForPackage();
  const root = rootTemplate(css.root, design.seo);
  const children = childTemplates(runtime, css.sections, design);
  const payload = { schemaVersion: 1, root, children };
  const composition = {
    schemaVersion: 1,
    family: rootCode,
    kind: "root-with-independent-child-sections",
    children: children.map(function (child, index) {
      const info = CHILDREN[index];
      return { position: index + 1, code: child.code, module: info[0], authority: info[2] };
    }),
    slots: {
      ROOT_NAV: [children[0].code],
      ROOT_SECTIONS: children.slice(1).map(function (child) { return child.code; }),
    },
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
      css: digest(JSON.stringify(css)),
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
    await writeText(path.join(staging, "preview.html"), preview(root, children, assets, design));
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

function rootTemplate(css, seo) {
  const metaTitle = mergeLocality(seo.meta.seoTitle, seo.meta);
  const metaDescription = mergeLocality(seo.meta.metaDescription, seo.meta);
  return template(rootCode, "Calm Harbor Spa | Landing (staging)", null, [
    field("ROOT_META_TITLE", metaTitle),
    field("ROOT_META_DESCRIPTION", metaDescription),
    field("ROOT_FAQ_JSON_LD", faqJsonLd(seo), "LOCALIZED_JSON_OBJECT"),
  ], {
    head: '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex,nofollow">\n<title>' + ref("ROOT_META_TITLE") + '</title>\n<meta name="description" content="' + ref("ROOT_META_DESCRIPTION") + '">\n<script type="application/ld+json">' + ref("ROOT_FAQ_JSON_LD", "LOCALIZED_JSON_OBJECT") + '</script>\n<link rel="icon" href="data:,">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">',
    html: '<div class="app-shell" id="calm-harbor-landing" data-theme="beauty" data-mode="light" data-module="app-shell" data-visual-id="app-shell">\n  <!-- cms-child-slot:ROOT_NAV -->\n  <section class="page seo-page" data-route="seo.landing" data-visual-id="seo-landing" data-screen-label="SEO landing · Beauty">\n    <!-- cms-child-slot:ROOT_SECTIONS -->\n  </section>\n</div>',
    css,
    javascript: runtimeScript(),
  });
}

function childTemplates(runtime, css, design) {
  const pim = runtime.pim;
  const seo = design.seo;
  const theme = design.theme;
  return [
    template(childCode(1, "PUBLIC_NAV"), "Calm Harbor Spa | Public navigation", rootCode, [
      field("BRAND", seo.meta.brand),
    ], { html: navHtml(), css: css.publicNav, javascript: "" }),
    template(childCode(2, "HERO"), "Calm Harbor Spa | Hero", rootCode, [
      field("SERVICE_AREA", seo.meta.serviceArea), field("TITLE_PREFIX", mergeLocality(seo.meta.h1, seo.meta).split(seo.meta.locality)[0]), field("LOCALITY", seo.meta.locality), field("TITLE_SUFFIX", mergeLocality(seo.meta.h1, seo.meta).split(seo.meta.locality)[1] || ""),
      field("SERVICE", seo.hero.service),
      field("PRIMARY_LABEL", seo.meta.primaryCta.label),
      field("SECONDARY_LABEL", seo.meta.secondaryCta.label),
      field("NOTE", seo.hero.note),
      field("HERO_IMAGE_URL", assetPath + "/spa-massage-1448.webp", "STRING"),
      field("HERO_IMAGE_ALT", seo.media.hero.alt),
      field("HERO_IMAGE_FOCAL", seo.media.hero.focal, "STRING"),
    ], { html: heroHtml(), css: css.hero, javascript: "" }),
    template(childCode(3, "TRUST"), "Calm Harbor Spa | Trust strip", rootCode, trustParameters(seo), { html: trustHtml(), css: css.trust, javascript: "" }),
    template(childCode(4, "SERVICES"), "Calm Harbor Spa | Services", rootCode, servicesParameters(seo, theme), { html: servicesHtml(), css: css.services, javascript: "" }),
    template(childCode(5, "HOW"), "Calm Harbor Spa | How it works", rootCode, howParameters(seo), { html: howHtml(), css: css.how, javascript: "" }),
    template(childCode(6, "PROOF"), "Calm Harbor Spa | Proof", rootCode, proofParameters(seo), { html: proofHtml(), css: css.proof, javascript: "" }),
    template(childCode(7, "PRICING_PIM"), "Calm Harbor Spa | Live pricing", rootCode, pimParameters(pim, "PRICING", "SPA_SERVICE,SPA_MEMBERSHIP", seo), { html: pricingHtml(), css: css.pricing, javascript: "" }),
    template(childCode(8, "PRODUCTS_PIM"), "Calm Harbor Spa | Retail teaser", rootCode, pimParameters(pim, "PRODUCTS", "SPA_RETAIL", seo), { html: productsHtml(), css: css.products, javascript: "" }),
    template(childCode(9, "SERVICE_AREA"), "Calm Harbor Spa | Service area", rootCode, areaParameters(seo), { html: areaHtml(), css: css.serviceArea, javascript: "" }),
    template(childCode(10, "REVIEWS"), "Calm Harbor Spa | Reviews", rootCode, reviewsParameters(seo), { html: reviewsHtml(seo), css: css.reviews, javascript: "" }),
    template(childCode(11, "FAQ"), "Calm Harbor Spa | FAQ", rootCode, faqParameters(seo), { html: faqHtml(), css: css.faq, javascript: "" }),
    template(childCode(12, "FINAL_CTA"), "Calm Harbor Spa | Final CTA", rootCode, [
      field("TITLE", mergeLocality("Ready when you are in {locality}", seo.meta)), field("SUB", seo.finalCta.sub),
      field("PRIMARY_LABEL", seo.finalCta.primary.label),
      field("SECONDARY_LABEL", seo.finalCta.secondary.label),
    ], { html: finalHtml(), css: css.finalCta, javascript: "" }),
    template(childCode(13, "FOOTER"), "Calm Harbor Spa | Footer", rootCode, footerParameters(seo), { html: footerHtml(), css: css.footer, javascript: "" }),
  ];
}

function navHtml() {
  return '<div class="top-nav-wrap"><nav class="top-nav" data-module="public-nav" data-visual-id="public-nav"><div class="top-nav__brand" data-action="nav.landing"><div class="brand-logo"></div><span class="brand-name" data-bind="brand.name">' + ref("BRAND") + '</span></div><div class="top-nav__actions"><div class="icon-btn icon-btn--optional" data-action="ui.toggleMode" title="Toggle light/dark">☾</div><button class="btn btn--primary" data-module="action-button" data-visual-id="public-signin" data-action="auth.gotoSignin">Sign in</button></div></nav></div>';
}

function heroHtml() {
  return '<section class="seo-hero" data-module="seo-hero" data-visual-id="seo-hero"><div class="seo-hero__inner"><div class="seo-hero__copy"><span class="eyebrow seo-hero__area" data-bind="cms.meta.serviceArea">◉ Serving ' + ref("SERVICE_AREA") + '</span><h1 class="seo-hero__title" data-bind="cms.meta.h1 + cms.meta.locality">' + ref("TITLE_PREFIX") + '<span class="seo-hero__geo" data-bind="cms.meta.locality">' + ref("LOCALITY") + '</span>' + ref("TITLE_SUFFIX") + '</h1><p class="seo-hero__sub" data-bind="cms.hero.service">' + ref("SERVICE") + '</p><div class="seo-hero__ctas">' + seoCta("PRIMARY_LABEL", "btn--onaccent", "seo-hero-primary-cta", "nav.services", "cms.meta.primaryCta") + seoCta("SECONDARY_LABEL", "btn--glass-hero", "seo-hero-secondary-cta", "nav.pricing", "cms.meta.secondaryCta") + '</div><div class="seo-hero__note">' + ref("NOTE") + '</div></div><div class="seo-media-slot seo-media seo-hero__media" data-module="seo-media" data-visual-id="seo-media" data-bind="cms.media.hero" data-state="ready"><img class="seo-media__img" src="' + ref("HERO_IMAGE_URL", "STRING") + '" alt="' + ref("HERO_IMAGE_ALT") + '" loading="lazy" style="object-position:' + ref("HERO_IMAGE_FOCAL", "STRING") + '"></div></div></section>';
}

function seoCta(labelCode, variant, visualId, action, bind) {
  return '<button class="btn ' + variant + ' btn--lg seo-cta" data-module="seo-cta" data-visual-id="' + visualId + '" data-action="' + action + '" data-state="idle" data-bind="' + bind + '" aria-live="polite">' + ref(labelCode) + '</button>';
}

function trustParameters(seo) {
  const trust = seo.trust;
  return [
    field("RATING_LABEL", "Rating"), field("RATING_SLOT", "rating · from CMS"),
    field("LICENCE_LABEL", trust.licence.label), field("LICENCE_SLOT", "licence № · from CMS"),
    field("INSURANCE_LABEL", trust.insurance.label), field("INSURANCE_SLOT", "policy · from CMS"),
    field("GUARANTEE_LABEL", trust.guarantee.label), field("GUARANTEE_VALUE", trust.guarantee.value),
    field("APPOINTMENTS_LABEL", trust.response.label), field("APPOINTMENTS_VALUE", trust.response.value),
  ];
}

function trustHtml() {
  return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="ready">' + trustItem("★", "RATING_LABEL", "RATING_SLOT", "rating", true) + trustItem("⚖", "LICENCE_LABEL", "LICENCE_SLOT", "licence", true) + trustItem("✔", "INSURANCE_LABEL", "INSURANCE_SLOT", "insurance", true) + trustItem("⬚", "GUARANTEE_LABEL", "GUARANTEE_VALUE", "guarantee") + trustItem("⏱", "APPOINTMENTS_LABEL", "APPOINTMENTS_VALUE", "response") + '</section>';
}

function trustItem(icon, label, value, bind, slot) {
  return '<div class="seo-trust__item" data-bind="cms.trust.' + bind + '"><span class="seo-trust__icon">' + icon + '</span><div><div class="seo-trust__label">' + ref(label) + '</div><div class="seo-trust__value">' + (slot ? '<span class="seo-slot" data-state="no-data">' : "") + ref(value) + (slot ? "</span>" : "") + '</div></div></div>';
}

function servicesParameters(seo, theme) {
  const list = theme.svc.slice(0, 6);
  const result = [field("EYEBROW", seo.services.eyebrow), field("TITLE", seo.services.title), field("SUB", seo.services.sub)];
  list.forEach(function (item, index) {
    const n = index + 1;
    result.push(field("ITEM_" + n + "_NAME", item.name), field("ITEM_" + n + "_BENEFIT", item.tagline), field("ITEM_" + n + "_PRICE", item.price));
  });
  return result;
}

function servicesHtml() {
  let cards = "";
  const palettes = [
    ["var(--accent)", "rgba(var(--accent-rgb),.12)"],
    ["#1f8a44", "rgba(52,199,89,.16)"],
    ["#ff8a3d", "rgba(255,159,10,.16)"],
    ["#7a52e0", "rgba(122,82,224,.16)"],
  ];
  for (let index = 1; index <= 4; index += 1) {
    const palette = palettes[index - 1];
    cards += '<div class="seo-svc" data-module="seo-service-card" data-visual-id="seo-service-card" data-action="nav.pricing" data-id="' + ref("ITEM_" + index + "_NAME") + '" data-bind="cms.services[]" role="button" tabindex="0"><div class="seo-svc__icon" style="background:' + palette[1] + '"><i style="background:' + palette[0] + '"></i></div><div class="seo-svc__name">' + ref("ITEM_" + index + "_NAME") + '</div><div class="seo-svc__benefit" data-bind="cms.services[].benefit">' + ref("ITEM_" + index + "_BENEFIT") + '</div><div class="seo-svc__meta"><span data-bind="cms.services[].priceFrom">from ' + ref("ITEM_" + index + "_PRICE") + '</span><span class="seo-svc__go">Pricing →</span></div></div>';
  }
  return '<section class="seo-sec" id="seo-services" data-module="seo-services-grid" data-visual-id="seo-services-grid"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2><p class="seo-sec__sub">' + ref("SUB") + '</p></div><div class="seo-svc-grid">' + cards + '</div></section>';
}

function howParameters(seo) {
  const values = seo.how.map(function (item) { return [item.title, item.desc]; });
  const result = [field("EYEBROW", "How it works"), field("TITLE", "From request to report")];
  values.forEach(function (value, index) { const n = index + 1; result.push(field("STEP_" + n + "_TITLE", value[0]), field("STEP_" + n + "_DESC", value[1])); });
  return result;
}

function howHtml() {
  let steps = "";
  for (let index = 1; index <= 4; index += 1) steps += '<div class="seo-how__step" data-bind="cms.how[' + (index - 1) + ']"><div class="seo-how__num">' + index + '</div><div class="seo-how__title">' + ref("STEP_" + index + "_TITLE") + '</div><div class="seo-how__desc">' + ref("STEP_" + index + "_DESC") + '</div></div>';
  return '<section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-how">' + steps + '</div></section>';
}

function proofParameters(seo) {
  const values = seo.proof.items.map(function (item) { return [item.title, item.desc]; });
  const result = [field("EYEBROW", "Why " + seo.meta.brand), field("TITLE", seo.proof.title), field("IMAGE_URL", assetPath + "/spa-room-1600.webp", "STRING"), field("IMAGE_ALT", seo.media.proof.alt), field("IMAGE_FOCAL", seo.media.proof.focal, "STRING")];
  values.forEach(function (value, index) { const n = index + 1; result.push(field("ITEM_" + n + "_TITLE", value[0]), field("ITEM_" + n + "_DESC", value[1])); });
  return result;
}

function proofHtml() {
  let cards = "";
  for (let index = 1; index <= 3; index += 1) cards += '<div class="seo-proof__card" data-bind="cms.proof.items[' + (index - 1) + ']"><div class="seo-proof__glyph"><i></i></div><div class="seo-proof__title">' + ref("ITEM_" + index + "_TITLE") + '</div><div class="seo-proof__desc">' + ref("ITEM_" + index + "_DESC") + '</div></div>';
  return '<section class="seo-sec seo-sec--tint" data-module="seo-proof" data-visual-id="seo-proof"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-media-slot seo-media seo-proof__media" data-module="seo-media" data-visual-id="seo-media" data-bind="cms.media.proof" data-state="ready"><img class="seo-media__img" src="' + ref("IMAGE_URL", "STRING") + '" alt="' + ref("IMAGE_ALT") + '" loading="lazy" style="object-position:' + ref("IMAGE_FOCAL", "STRING") + '"></div><div class="seo-proof">' + cards + '</div></section>';
}

function pimParameters(pim, kind, types, seo) {
  const prefix = kind + "_";
  const teaser = seo.productsTeaser;
  return [
    field(prefix + "EYEBROW", kind === "PRICING" ? "Pricing" : teaser.eyebrow),
    field(prefix + "TITLE", kind === "PRICING" ? "What to expect" : teaser.title),
    field(prefix + "SUB", kind === "PRICING" ? seo.pricing.note : teaser.sub),
    field(prefix + "API_BASE", pim.apiBase, "STRING"), field(prefix + "ORGANIZATION", pim.organization, "STRING"),
    field(prefix + "PRODUCT_TYPE_CODES", types, "STRING"), field(prefix + "PRICE_TYPE_CODE", pim.priceTypeCode, "STRING"),
    field(prefix + "PRICE_ATTRIBUTE_CODE", pim.priceAttributeCode, "STRING"), field(prefix + "PRICE_ATTRIBUTE_VALUES", pim.priceAttributeValues.join(","), "STRING"),
    field(prefix + "CURRENCY", pim.currency, "STRING"), field(prefix + "CURRENCY_ATTRIBUTE_CODE", pim.currencyAttributeCode, "STRING"),
    field(prefix + "CURRENCY_ATTRIBUTE_VALUES", pim.currencyAttributeValues.join(","), "STRING"),
    field(prefix + "AMOUNT_ATTRIBUTE_CODE", pim.amountAttributeCode, "STRING"), field(prefix + "AMOUNT_MINOR_DIVISOR", String(pim.amountMinorDivisor), "STRING"),
    field(prefix + "EMPTY_COPY", kind === "PRICING" ? "No treatments or memberships are currently published in the public catalog — prices appear here the moment they are." : "Retail products appear here as soon as they are published in the public catalog — nothing is shown until real products exist."),
    field(prefix + "ERROR_TITLE", kind === "PRICING" ? "Live pricing is unavailable" : "The shop is unavailable"),
    field(prefix + "ERROR_COPY", "The public catalog could not be loaded. No catalog data is shown."),
    field(prefix + "RETRY_LABEL", "Try again"),
    field(prefix + "CTA_LABEL", kind === "PRICING" ? seo.pricing.cta.label : teaser.cta),
    field(prefix + "CTA_NOTE", kind === "PRODUCTS" ? teaser.note : ""),
  ];
}

function pricingHtml() {
  const p = "PRICING_";
  return '<section class="seo-sec" id="seo-pricing" data-module="seo-pricing" data-visual-id="seo-pricing" data-state="loading" data-pim-kind="pricing" ' + pimData(p) + '><div class="seo-sec__head"><span class="eyebrow">' + ref(p + "EYEBROW") + '</span><h2 class="seo-sec__title">' + ref(p + "TITLE") + '</h2></div><div class="seo-price" data-pim-body><div class="seo-price__row"><span class="seo-skel" style="width:30%"></span><span class="seo-skel" style="width:18%"></span></div><div class="seo-price__row"><span class="seo-skel" style="width:30%"></span><span class="seo-skel" style="width:18%"></span></div><div class="seo-price__row"><span class="seo-skel" style="width:30%"></span><span class="seo-skel" style="width:18%"></span></div></div><div class="seo-price__cta">' + seoCta(p + "CTA_LABEL", "btn--primary", "seo-pricing-cta", "auth.gotoSignin", "cms.pricing.cta").replace(" btn--lg", "") + '</div></section>';
}

function productsHtml() {
  const p = "PRODUCTS_";
  return '<section class="seo-sec" id="seo-products" data-module="seo-products-teaser" data-visual-id="seo-products-teaser" data-state="loading" data-pim-kind="products" ' + pimData(p) + '><div class="seo-sec__head"><span class="eyebrow">' + ref(p + "EYEBROW") + '</span><h2 class="seo-sec__title">' + ref(p + "TITLE") + '</h2><p class="seo-sec__sub">' + ref(p + "SUB") + '</p></div><div class="seo-teaser__grid" data-pim-body><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div><div class="product-card seo-teaser-card" data-state="loading"><span class="seo-skel" style="width:100%"></span><span class="seo-skel" style="width:55%"></span><span class="seo-skel" style="width:35%"></span></div></div></section>';
}

function pimData(prefix) {
  return ["api-base", "organization", "product-type-codes", "price-type-code", "price-attribute-code", "price-attribute-values", "currency", "currency-attribute-code", "currency-attribute-values", "amount-attribute-code", "amount-minor-divisor", "sub", "empty-copy", "error-title", "error-copy", "retry-label", "cta-label", "cta-note"].map(function (name) {
    const code = prefix + name.toUpperCase().replace(/-/g, "_");
    const stringConfig = ["api-base", "organization", "product-type-codes", "price-type-code", "price-attribute-code", "price-attribute-values", "currency", "currency-attribute-code", "currency-attribute-values", "amount-attribute-code", "amount-minor-divisor"];
    return 'data-pim-' + name + '="' + ref(code, stringConfig.includes(name) ? "STRING" : "LOCALIZED_STRING_SS") + '"';
  }).join(" ");
}

function areaParameters(seo) {
  const result = [field("EYEBROW", "Coverage"), field("TITLE", "Where we work"), field("REGION", seo.meta.serviceArea), field("NOTE", seo.area.note)];
  seo.area.cities.forEach(function (city, index) { result.push(field("CITY_" + (index + 1), city)); });
  return result;
}

function areaHtml() {
  let cities = "";
  for (let index = 1; index <= 5; index += 1) cities += '<span class="seo-area__chip">' + ref("CITY_" + index) + '</span>';
  return '<section class="seo-sec" data-module="seo-service-area" data-visual-id="seo-service-area" data-state="ready"><div class="seo-area"><div><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-area__region" data-bind="cms.meta.serviceArea">' + ref("REGION") + '</div><div class="seo-area__cities" data-bind="cms.area.cities">' + cities + '</div><p class="seo-area__note">' + ref("NOTE") + '</p></div><div class="seo-area__map"><svg viewBox="0 0 200 140" class="seo-area__visual"><circle cx="100" cy="70" r="64" fill="none" stroke="rgba(var(--accent-rgb),.35)" stroke-dasharray="3 5"></circle><circle cx="100" cy="70" r="42" fill="none" stroke="rgba(var(--accent-rgb),.26999999999999996)" stroke-dasharray="none"></circle><circle cx="100" cy="70" r="22" fill="rgba(var(--accent-rgb),.18)" stroke="rgba(var(--accent-rgb),.18999999999999997)" stroke-dasharray="none"></circle><circle cx="100" cy="70" r="5" fill="var(--accent)"></circle></svg><span class="seo-media-slot__label">coverage map · real map or polygon from CMS</span></div></div></section>';
}

function reviewsParameters(seo) {
  const result = [field("EYEBROW", "Reviews"), field("TITLE", "What customers say")];
  seo.reviews.forEach(function (review, index) {
    const n = index + 1;
    result.push(field("ITEM_" + n + "_TEXT", review.text), field("ITEM_" + n + "_NAME", review.name));
  });
  return result;
}

function reviewsHtml(seo) {
  let items = "";
  seo.reviews.forEach(function (review, index) {
    const n = index + 1;
    const media = review.media ? '<div class="seo-review__media"><span class="seo-media-slot__label">customer photo · media slot</span></div>' : "";
    const stars = "★★★★★".slice(0, review.rating) + "☆☆☆☆☆".slice(review.rating);
    items += '<div class="seo-review" data-bind="cms.reviews[' + index + ']">' + media + '<div class="seo-review__stars">' + stars + '</div><p class="seo-review__text">“' + ref("ITEM_" + n + "_TEXT") + '”</p><div class="seo-review__name">' + ref("ITEM_" + n + "_NAME") + '</div></div>';
  });
  return '<section class="seo-sec seo-sec--tint" data-module="seo-reviews" data-visual-id="seo-reviews" data-state="ready"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-reviews">' + items + '</div></section>';
}

function faqParameters(seo) {
  const values = seo.faq.map(function (item) { return [item.q, item.a]; });
  const result = [field("EYEBROW", "FAQ"), field("TITLE", "Common questions")];
  values.forEach(function (value, index) { const n = index + 1; result.push(field("ITEM_" + n + "_QUESTION", value[0]), field("ITEM_" + n + "_ANSWER", value[1])); });
  return result;
}

function faqHtml() {
  let items = "";
  for (let index = 1; index <= 4; index += 1) items += '<div class="seo-faq__item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" data-bind="cms.faq[' + (index - 1) + ']"><button class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + (index - 1) + '" data-faq-answer="' + ref("ITEM_" + index + "_ANSWER") + '" aria-expanded="false"><span itemprop="name">' + ref("ITEM_" + index + "_QUESTION") + '</span><span class="seo-faq__chev">+</span></button></div>';
  return '<section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq" data-state="ready"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-faq" itemscope itemtype="https://schema.org/FAQPage">' + items + '</div></section>';
}

function finalHtml() {
  return '<section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta"><h2 class="seo-final__title" data-bind="cms.meta.h1">' + ref("TITLE") + '</h2><p class="seo-final__sub">' + ref("SUB") + '</p><div class="seo-final__ctas">' + seoCta("PRIMARY_LABEL", "btn--onaccent", "seo-final-primary-cta", "nav.products", "cms.finalCta.primary") + seoCta("SECONDARY_LABEL", "btn--glass-hero", "seo-final-secondary-cta", "auth.gotoSignin", "cms.finalCta.secondary") + '</div></section>';
}

function footerParameters(seo) {
  const result = [
    field("PHONE_SLOT", "phone · from CMS"), field("EMAIL_SLOT", "email · from CMS"),
    field("SERVICE_AREA", seo.meta.serviceArea), field("CITIES", seo.area.cities.join(" · ")),
    field("BRAND", seo.meta.brand), field("CANONICAL", "canonical: " + seo.meta.canonicalPath),
  ];
  SEO_FOOTER.hours.forEach(function (row, index) { const n = index + 1; result.push(field("HOURS_" + n + "_DAYS", row.d), field("HOURS_" + n + "_VALUE", row.h)); });
  SEO_FOOTER.legal.forEach(function (row, index) { const n = index + 1; result.push(field("LEGAL_" + n + "_LABEL", row.label), field("LEGAL_" + n + "_HREF", row.href, "STRING")); });
  return result;
}

function footerHtml() {
  let hours = "";
  let legal = "";
  for (let index = 1; index <= 3; index += 1) {
    hours += '<div class="seo-footer__row" data-bind="cms.footer.hours"><span>' + ref("HOURS_" + index + "_DAYS") + '</span><span>' + ref("HOURS_" + index + "_VALUE") + '</span></div>';
    legal += '<a class="seo-footer__link" href="' + ref("LEGAL_" + index + "_HREF", "STRING") + '" data-bind="cms.footer.legal">' + ref("LEGAL_" + index + "_LABEL") + '</a>';
  }
  return '<footer class="seo-footer" data-module="seo-footer" data-visual-id="seo-footer"><div class="seo-footer__grid"><div class="seo-footer__col"><div class="seo-footer__head">Contact</div><div data-bind="cms.footer.contacts.phone"><span class="seo-slot" data-state="no-data">' + ref("PHONE_SLOT") + '</span></div><div data-bind="cms.footer.contacts.email"><span class="seo-slot" data-state="no-data">' + ref("EMAIL_SLOT") + '</span></div></div><div class="seo-footer__col"><div class="seo-footer__head">Hours</div>' + hours + '</div><div class="seo-footer__col"><div class="seo-footer__head">Service area</div><div data-bind="cms.meta.serviceArea">' + ref("SERVICE_AREA") + '</div><div class="seo-footer__muted" data-bind="cms.area.cities">' + ref("CITIES") + '</div></div><div class="seo-footer__col"><div class="seo-footer__head">Legal</div>' + legal + '</div></div><div class="seo-footer__base"><span data-bind="brand.name">' + ref("BRAND") + '</span><span class="seo-footer__muted" data-bind="cms.meta.canonicalPath">' + ref("CANONICAL") + '</span></div></footer>';
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
  function clearProductCta(root) { var cta = root.querySelector(".seo-teaser__cta"); if (cta) cta.remove(); }
  function error(root) { root.dataset.state = "error"; clearProductCta(root); var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); var block = el("div", "state-block"); block.dataset.module = "error-state"; block.dataset.visualId = "error-state"; block.dataset.state = "error"; block.append(el("div", "state-block__glyph state-block__glyph--error", "!"), el("div", "state-block__title", attr(root, "error-title")), el("div", "state-block__desc", attr(root, "error-copy"))); var retry = el("button", "btn btn--primary", attr(root, "retry-label")); retry.type = "button"; retry.addEventListener("click", function () { load(root); }); block.appendChild(retry); body.appendChild(block); }
  function empty(root) { root.dataset.state = "empty"; clearProductCta(root); var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); if (root.dataset.pimKind === "pricing") { var fallback = el("div", "seo-price__fallback", attr(root, "empty-copy")); fallback.dataset.state = "no-data"; body.appendChild(fallback); } else { var box = el("div", "seo-teaser__empty"); box.dataset.visualId = "seo-products-teaser-empty"; box.dataset.state = "no-data"; box.append(el("div", "seo-teaser__empty-title", "The shelf is being stocked"), el("div", "", attr(root, "empty-copy"))); body.appendChild(box); } }
  function pricing(root, rows) { root.dataset.state = "ready"; var head = root.querySelector(".seo-sec__head"); if (head && !head.querySelector(".seo-sec__sub")) head.appendChild(el("p", "seo-sec__sub", attr(root, "sub"))); var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); rows.forEach(function (item) { var row = el("div", "seo-price__row"); row.dataset.module = "seo-pricing-row"; row.dataset.visualId = "seo-pricing-row"; row.dataset.bind = "pim.pricing[]"; row.dataset.productCode = item.code; var name = el("span", "seo-price__name", item.name); name.dataset.bind = "pim.pricing[].name"; if (item.description) { var desc = el("span", "seo-price__desc", item.description); desc.dataset.bind = "pim.pricing[].shortDescription"; name.appendChild(desc); } var value = el("span", "seo-price__val"); var amount = el("b", "", item.displayPrice); amount.dataset.bind = "pim.pricing[].displayPrice"; value.append(amount); if (item.interval) { var unit = el("span", "seo-price__unit", " / " + item.interval); unit.dataset.bind = "pim.pricing[].interval"; value.append(unit); } row.append(name, value); body.appendChild(row); }); }
  function products(root, rows) { root.dataset.state = "ready"; clearProductCta(root); var body = root.querySelector("[data-pim-body]"); body.replaceChildren(); var tints = [["var(--accent)", "linear-gradient(160deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.32))"], ["#1f8a44", "linear-gradient(160deg,#dcf5e2,#bff0cf)"], ["#ff8a3d", "linear-gradient(160deg,#ffe9d6,#ffd3ad)"], ["#7a52e0", "linear-gradient(160deg,#eee6ff,#d8c6ff)"]]; rows.slice(0, 4).forEach(function (item, index) { var tint = tints[Number.isInteger(item.tintIndex) ? item.tintIndex % tints.length : index % tints.length]; var card = el("div", "product-card seo-teaser-card"); card.dataset.module = "seo-product-teaser-card"; card.dataset.visualId = "seo-product-teaser-card"; card.dataset.action = "nav.products"; card.dataset.bind = "pim.products[]"; card.dataset.productCode = item.code; card.setAttribute("role", "button"); card.setAttribute("tabindex", "0"); card.setAttribute("aria-label", item.name + " — open the shop"); var art = el("div", "product-card__art"); art.style.background = tint[1]; var thumb = el("div", "product-card__thumb"); var mark = el("i"); mark.style.background = tint[0]; thumb.appendChild(mark); art.appendChild(thumb); var cardName = el("div", "product-card__name", item.name); cardName.dataset.bind = "pim.products[].name"; var blurb = el("div", "product-card__blurb", item.description || item.code); blurb.dataset.bind = "pim.products[].shortDescription"; var foot = el("div", "product-card__foot"); var amount = el("div", "price-lg", item.displayPrice); amount.dataset.bind = "pim.products[].displayPrice"; foot.append(amount, el("span", "seo-teaser-card__go", "Shop →")); card.append(art, cardName, blurb, foot); body.appendChild(card); }); var cta = el("div", "seo-teaser__cta"); var button = el("button", "btn btn--primary seo-cta", attr(root, "cta-label")); button.dataset.module = "seo-cta"; button.dataset.visualId = "seo-products-teaser-cta"; button.dataset.action = "nav.products"; button.dataset.state = "idle"; button.dataset.bind = "cms.productsTeaser.cta"; button.setAttribute("aria-live", "polite"); cta.appendChild(button); if (attr(root, "cta-note")) cta.appendChild(el("span", "seo-teaser__note", attr(root, "cta-note"))); body.after(cta); }
  async function load(root) { root.dataset.state = "loading"; try { var preview = window.__CALM_HARBOR_PREVIEW_PIM && window.__CALM_HARBOR_PREVIEW_PIM[root.dataset.pimKind]; if (preview) { if (root.dataset.pimKind === "pricing") pricing(root, preview); else products(root, preview); return; } var replies = await Promise.all(values(attr(root, "product-type-codes")).map(async function (type) { var response = await fetch(endpoint(root), { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload(root, type)) }); if (!response.ok) throw new Error("Core PIM HTTP " + response.status); return response.json(); })); var rows = normalize(replies.flatMap(function (reply) { return Array.isArray(reply && reply.prices) ? reply.prices : []; }), root); if (!rows.length) empty(root); else if (root.dataset.pimKind === "pricing") pricing(root, rows); else products(root, rows); } catch (_) { error(root); } }
  function wire(root) { root.addEventListener("click", function (event) { var action = event.target.closest("[data-action]"); if (!action || !root.contains(action)) return; var name = action.dataset.action; if (name === "ui.toggleMode") { event.preventDefault(); document.documentElement.dataset.mode = document.documentElement.dataset.mode === "dark" ? "light" : "dark"; root.dataset.mode = document.documentElement.dataset.mode; } else if (name === "nav.services" || name === "nav.pricing" || name === "nav.products") { var target = document.querySelector(name === "nav.services" ? "#seo-services" : name === "nav.pricing" ? "#seo-pricing" : "#seo-products"); if (target) { event.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); } } else if (name === "seo.faq.toggle") { event.preventDefault(); var item = action.closest(".seo-faq__item"); var open = item.classList.toggle("is-open"); action.setAttribute("aria-expanded", open ? "true" : "false"); var chev = action.querySelector(".seo-faq__chev"); if (chev) chev.textContent = open ? "−" : "+"; var answer = item.querySelector(".seo-faq__a"); if (!open && answer) answer.remove(); else if (open && !answer) { answer = el("div", "seo-faq__a"); answer.setAttribute("itemscope", ""); answer.setAttribute("itemprop", "acceptedAnswer"); answer.setAttribute("itemtype", "https://schema.org/Answer"); var copy = el("p", "", action.dataset.faqAnswer || ""); copy.setAttribute("itemprop", "text"); answer.appendChild(copy); item.appendChild(answer); } } }); var apply = function () { var width = root.getBoundingClientRect().width; root.classList.toggle("vw-mobile", width <= 560); root.classList.toggle("vw-tablet", width > 560 && width <= 900); root.classList.toggle("vw-compact", width <= 1040); }; apply(); if (window.ResizeObserver) new ResizeObserver(apply).observe(root); }
  ready(function () { var root = document.querySelector("#calm-harbor-landing"); if (!root) return; document.documentElement.dataset.theme = "beauty"; document.documentElement.dataset.mode = root.dataset.mode || "light"; wire(root); root.querySelectorAll("[data-pim-kind]").forEach(load); });
})();`;
}

async function readDesignCss() {
  const read = async function (file) {
    return (await fs.readFile(path.join(designRoot, "styles", file), "utf8")).trim();
  };
  const [tokens, base, components, shell, seo, responsive, routes] = await Promise.all([
    read("tokens.css"), read("base.css"), read("components.css"), read("shell.css"), read("seo.css"), read("responsive.css"), read("routes.css"),
  ]);
  const prefix = before(seo, "/* ---------- 1 · hero ---------- */");
  const sectionResponsive = between(seo, "/* ============================================================\n   Responsive", "/* ============================================================\n   wave 11");
  const media = between(seo, "/* ============================================================\n   wave 11", "/* wave 12 · pim.pricing[] rows");
  const pricingDetails = from(seo, "/* wave 12 · pim.pricing[] rows");
  const commerceShared = between(routes, "/* ============================================================\n   WAVE 3 — Commerce", "/* ---- Pricing (data-route=\"pricing\") ---- */");
  const root = [
    annotated("tokens.css", tokens),
    annotated("base.css", base),
    annotated("components.css", components),
    annotated("shell.css", shell),
    annotated("seo.css shared scaffolding", prefix),
    annotated("routes.css shared commerce primitives", commerceShared),
    annotated("seo.css responsive", sectionResponsive),
    annotated("responsive.css", responsive),
  ].join("\n\n") + "\n";

  return {
    root,
    sections: {
      publicNav: "",
      hero: between(seo, "/* ---------- 1 · hero ---------- */", "/* ---------- 2 · trust strip ---------- */") + "\n\n" + media,
      trust: between(seo, "/* ---------- 2 · trust strip ---------- */", "/* ---------- 3 · services grid ---------- */"),
      services: between(seo, "/* ---------- 3 · services grid ---------- */", "/* ---------- 4 · how it works ---------- */"),
      how: between(seo, "/* ---------- 4 · how it works ---------- */", "/* ---------- 5 · proof ---------- */"),
      proof: between(seo, "/* ---------- 5 · proof ---------- */", "/* ---------- 6 · pricing ---------- */") + "\n\n" + media,
      pricing: between(seo, "/* ---------- 6 · pricing ---------- */", "/* ---------- 7 · service area ---------- */") + "\n\n" + pricingDetails,
      products: between(routes, "/* ---- Products (data-route=\"products\") ---- */", "/* ---- Checkout (data-route=\"checkout\") ---- */") + "\n\n" + media,
      serviceArea: between(seo, "/* ---------- 7 · service area ---------- */", "/* ---------- 8 · reviews ---------- */"),
      reviews: between(seo, "/* ---------- 8 · reviews ---------- */", "/* ---------- 9 · FAQ ---------- */"),
      faq: between(seo, "/* ---------- 9 · FAQ ---------- */", "/* ---------- 10 · final CTA ---------- */"),
      finalCta: between(seo, "/* ---------- 10 · final CTA ---------- */", "/* ---------- 11 · footer ---------- */"),
      footer: between(seo, "/* ---------- 11 · footer ---------- */", "/* ---------- dev-only CMS meta preview ---------- */"),
    },
  };
}

async function readDesignData() {
  if (!designDataPromise) {
    designDataPromise = (async function () {
      const previousWindow = globalThis.window;
      globalThis.window = {};
      try {
        const fixtureUrl = pathToFileURL(path.join(designRoot, "data/fixtures.js")).href + "?calm-harbor-export";
        const fixtureModule = await import(fixtureUrl);
        const theme = fixtureModule.F.themes.Beauty;
        const seo = SEO.Beauty;
        const productsByCode = new Map(theme.products.map(function (product) { return [product.code, product]; }));
        const previewProducts = seo.productsTeaser.codes.map(function (code) { return productsByCode.get(code); }).filter(Boolean).map(function (product) {
          return {
            code: product.code,
            name: product.name,
            description: product.blurb,
            displayPrice: product.price,
            tintIndex: Math.max(0, theme.cats.findIndex(function (category) { return category.key === product.cat; })),
          };
        });
        return {
          seo,
          footer: SEO_FOOTER,
          theme,
          preview: {
            pricing: seo.pimPricing.map(function (row) { return { code: row.code, name: row.name, description: row.shortDescription || "", displayPrice: row.displayPrice, interval: row.interval || "" }; }),
            products: previewProducts,
          },
        };
      } finally {
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
      }
    })();
  }
  return designDataPromise;
}

function annotated(name, css) { return "/* design source: design-inbox/styles/" + name + " */\n" + css.trim(); }

function before(source, marker) {
  const index = source.indexOf(marker);
  if (index < 0) throw new Error("Design CSS marker is missing: " + marker);
  return source.slice(0, index).trim();
}

function from(source, marker) {
  const index = source.indexOf(marker);
  if (index < 0) throw new Error("Design CSS marker is missing: " + marker);
  return source.slice(index).trim();
}

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error("Design CSS markers are missing or out of order: " + startMarker + " -> " + endMarker);
  return source.slice(start, end).trim();
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

function preview(root, children, assets, design) {
  const values = new Map();
  [root].concat(children).forEach(function (template) { template.parameters.forEach(function (parameter) { values.set(parameter.code + "@" + parameter.type, parameter.type.startsWith("LOCALIZED") ? parameter.value.en : parameter.value); }); });
  const resolve = function (text) { return text.replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (_, code, type) {
    const value = previewValue(values.get(code + "@" + type));
    return type === "LOCALIZED_JSON_OBJECT" ? String(value).replace(/</g, "\\u003c") : escapeHtml(value);
  }); };
  const body = resolve(root.html)
    .replace("<!-- cms-child-slot:ROOT_NAV -->", resolve(children[0].html))
    .replace("<!-- cms-child-slot:ROOT_SECTIONS -->", children.slice(1).map(function (child) { return resolve(child.html); }).join("\n"));
  const localBody = assets.reduce(function (value, asset) { return value.replaceAll(asset.publicUrl, "assets/" + asset.outputPath); }, body);
  const css = [root.css].concat(children.map(function (child) { return child.css; })).filter(Boolean).join("\n\n");
  const fixture = JSON.stringify(design.preview).replace(/</g, "\\u003c");
  return '<!doctype html>\n<html data-theme="beauty" data-mode="light"><head>\n' + resolve(root.head) + '\n<style>\n' + css + '</style></head><body>\n' + localBody + '\n<script>window.__CALM_HARBOR_PREVIEW_PIM=' + fixture + ';</script>\n<script>' + root.javascript + '</script></body></html>';
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; }); }
function previewValue(value) { return value && typeof value === "object" ? JSON.stringify(value) : value || ""; }

function mergeLocality(value, meta) { return String(value).split("{locality}").join(meta.locality); }

function faqJsonLd(seo) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faq.map(function (item) { return { "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } }; }),
  };
}

function readme(children, assets) {
  return "# Manual upload: Calm Harbor landing blocks (staging)\n\n" +
    "This package is a CMS family: one root and " + children.length + " independently editable child templates. It is staging-only and emits `noindex,nofollow`.\n\n" +
    "## Upload order\n\n" +
    "1. Upload each file under `assets/` to the exact same-origin public URL in `assets-manifest.json`. Preserve filenames.\n" +
    "2. Create the root template from `root.template.json` with code `" + rootCode + "`.\n" +
    "3. Create child templates in numeric order under `children/`. Each child records its parent as `" + rootCode + "`.\n" +
    "4. Compose `CHS_LANDING_01_PUBLIC_NAV` at `ROOT_NAV`. Compose children 02–13, in numeric order, at `ROOT_SECTIONS` inside `.page.seo-page`. The flat uploader intentionally does not create these include relationships.\n" +
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
