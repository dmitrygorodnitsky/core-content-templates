import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { SEO, SEO_FOOTER } from "../design-inbox/data/seo-fixtures.js";
import { graniteRidgeSnowFixture } from "../runtime/data/cases/granite-ridge-snow.js";

const portalRoot = path.resolve("app-templates/customer-portal");
const designRoot = path.join(portalRoot, "design-inbox");
const defaultOutputDir = path.join(portalRoot, "dist/manual-upload/customer-portal-granite-ridge-landing");
const rootCode = "CUSTOMER_PORTAL_GRANITE_RIDGE_LANDING_FIXTURE";

const TENANT = {
  brand: "Granite Ridge Snow Removal",
  navBrand: "Granite Ridge",
  locality: "Denver, Colorado",
  localitySlug: "denver",
  serviceArea: "Denver metro and the Front Range",
  cities: ["Lakewood", "Golden", "Arvada", "Littleton", "Wheat Ridge"],
};

const CHILDREN = [
  ["public-nav", "Public navigation"],
  ["hero", "Hero"],
  ["trust", "Trust strip"],
  ["services", "Services"],
  ["how", "How it works"],
  ["proof", "Proof"],
  ["pricing", "Pricing"],
  ["service-area", "Service area"],
  ["reviews", "Reviews"],
  ["faq", "FAQ"],
  ["final-cta", "Final CTA"],
  ["footer", "Footer"],
];

export async function buildGraniteRidgeLandingFamily() {
  const seo = tenantSeo();
  const css = await readDesignCss();
  const root = rootTemplate(css.root, seo);
  const children = childTemplates(seo, css.sections);
  const payload = { schemaVersion: 1, root, children };
  const composition = {
    schemaVersion: 1,
    family: rootCode,
    kind: "root-with-independent-child-sections",
    children: children.map(function (child, index) {
      return { position: index + 1, code: child.code, module: CHILDREN[index][0], authority: "cms" };
    }),
    slots: {
      ROOT_NAV: [children[0].code],
      ROOT_SECTIONS: children.slice(1).map(function (child) { return child.code; }),
    },
    dynamicData: {},
    constraints: [
      "Every value on this landing is CMS-authored public content. No block calls a backend, and no block shows customer, session, account, payment, order, or appointment data.",
      "Portal destinations are CMS parameters. A CTA whose parameter is empty is disabled through the accepted .btn[disabled] treatment and performs no navigation, so an unconfigured package can never emit a dead link.",
      "Portal destinations must be absolute https URLs. The runtime refuses any other scheme at click time.",
      "Prices are authored per-storm rates from the accepted design contract; the seasonal contract row stays a quote, never a computed number.",
      "Hero and proof media are empty by default and render the accepted no-data slot. See design-requests/granite-ridge-landing-media.md.",
      "Granite Ridge is a demonstration organization. The package emits noindex,nofollow and must not be published to a production domain.",
    ],
  };
  const manifest = {
    schemaVersion: 1,
    uploadPerformed: false,
    mode: "fixture-demonstration",
    launchState: "demonstration-only",
    package: { code: rootCode, children: children.map(function (child) { return child.code; }) },
    designSource: "app-templates/customer-portal/design-inbox",
    contentSource: {
      copy: "design-inbox/data/seo-fixtures.js · SEO[\"Snow Removal\"]",
      services: "runtime/data/cases/granite-ridge-snow.js · theme.svc",
      tenant: TENANT,
    },
    openedLiveContracts: [],
    sha256: {
      root: digest(JSON.stringify(root)),
      children: digest(JSON.stringify(children)),
      css: digest(JSON.stringify(css)),
      javascript: digest(root.javascript),
    },
  };
  return { seo, root, children, payload, composition, manifest };
}

export async function exportGraniteRidgeLandingBlocksManual(options = {}) {
  const target = path.resolve(options.outputDir || defaultOutputDir);
  assertOutput(target);
  const { root, children, payload, composition, manifest } = await buildGraniteRidgeLandingFamily();
  assertJteSafeFamily([root].concat(children));

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
    await writeText(path.join(staging, "README.md"), readme(children));
    await writeText(path.join(staging, "preview.html"), preview(root, children));
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
    await replaceDirectory(target, staging, backup);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return { outputDir: target, root, children, manifest };
}

function tenantSeo() {
  const accepted = SEO["Snow Removal"];
  if (!accepted) throw new Error("The accepted Snow Removal SEO fixture is missing");
  const theme = graniteRidgeSnowFixture.theme;
  return {
    meta: {
      brand: TENANT.brand,
      seoTitle: accepted.meta.seoTitle.replace("Aircove", TENANT.brand),
      metaDescription: accepted.meta.metaDescription,
      h1: accepted.meta.h1,
      canonicalPath: "/snow/" + TENANT.localitySlug,
      locality: TENANT.locality,
      serviceArea: TENANT.serviceArea,
      primaryCta: accepted.meta.primaryCta,
      secondaryCta: accepted.meta.secondaryCta,
    },
    hero: accepted.hero,
    trust: accepted.trust,
    how: accepted.how,
    proof: accepted.proof,
    services: {
      eyebrow: "Services",
      title: "What a Granite Ridge visit covers",
      sub: "Every card lists what the crew does on site. Seasonal contracts are quoted from measured surface area.",
      items: theme.svc,
    },
    pricing: {
      note: accepted.pricing.note,
      rows: [
        { name: theme.svc[0].name, from: theme.svc[0].price, unit: "storm" },
        { name: theme.svc[1].name, from: theme.svc[1].price, unit: "application" },
        { name: theme.svc[3].name, from: null, reason: "Quoted from measured area and trigger level" },
      ],
      cta: { label: "Request a seasonal quote" },
    },
    area: { cities: TENANT.cities, note: accepted.area.note },
    reviews: accepted.reviews,
    faq: accepted.faq,
    finalCta: {
      title: "Set your trigger before the first front",
      sub: "Tell us the property and the surfaces. Dispatch is automatic from the first storm that meets your threshold.",
      primary: { label: accepted.meta.primaryCta.label },
      secondary: { label: "Sign in to your portal" },
    },
    footer: SEO_FOOTER,
  };
}

function rootTemplate(css, seo) {
  const parameters = [
    field("ROOT_META_TITLE", mergeLocality(seo.meta.seoTitle, seo.meta)),
    field("ROOT_META_DESCRIPTION", mergeLocality(seo.meta.metaDescription, seo.meta)),
    field("ROOT_FAQ_JSON_LD", faqJsonLd(seo), "LOCALIZED_JSON_OBJECT"),
    field("ROOT_PORTAL_URL", "", "STRING"),
    field("ROOT_PORTAL_REQUEST_URL", "", "STRING"),
    field("ROOT_PORTAL_SERVICES_URL", "", "STRING"),
  ];
  return template(rootCode, TENANT.brand + " | Landing (demonstration)", null, parameters, {
    head: '<meta charset="utf-8">\n'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
      + '<meta name="robots" content="noindex,nofollow">\n'
      + "<title>" + ref("ROOT_META_TITLE") + "</title>\n"
      + '<meta name="description" content="' + ref("ROOT_META_DESCRIPTION") + '">\n'
      + '<script type="application/ld+json">' + ref("ROOT_FAQ_JSON_LD", "LOCALIZED_JSON_OBJECT") + "</script>\n"
      + '<link rel="icon" href="data:,">\n'
      + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
      + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
      + '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">',
    html: '<div class="app-shell" id="granite-ridge-landing" data-theme="snow" data-mode="light" data-module="app-shell"'
      + ' data-portal-url="' + ref("ROOT_PORTAL_URL", "STRING") + '"'
      + ' data-portal-request-url="' + ref("ROOT_PORTAL_REQUEST_URL", "STRING") + '"'
      + ' data-portal-services-url="' + ref("ROOT_PORTAL_SERVICES_URL", "STRING") + '"'
      + ' data-visual-id="app-shell">\n'
      + "  <!-- cms-child-slot:ROOT_NAV -->\n"
      + '  <section class="page seo-page" data-route="seo.landing" data-visual-id="seo-landing" data-screen-label="SEO landing · Snow Removal">\n'
      + "    <!-- cms-child-slot:ROOT_SECTIONS -->\n"
      + "  </section>\n"
      + "</div>",
    css,
    javascript: runtimeScript(),
  });
}

function childTemplates(seo, css) {
  return [
    template(childCode(1, "PUBLIC_NAV"), TENANT.brand + " | Public navigation", rootCode, [
      field("BRAND", TENANT.navBrand),
      field("SIGNIN_LABEL", "Sign in"),
    ], { html: navHtml(), css: css.publicNav, javascript: "" }),

    template(childCode(2, "HERO"), TENANT.brand + " | Hero", rootCode, heroParameters(seo), { html: heroHtml(), css: css.hero, javascript: "" }),
    template(childCode(3, "TRUST"), TENANT.brand + " | Trust strip", rootCode, trustParameters(seo), { html: trustHtml(), css: css.trust, javascript: "" }),
    template(childCode(4, "SERVICES"), TENANT.brand + " | Services", rootCode, servicesParameters(seo), { html: servicesHtml(seo), css: css.services, javascript: "" }),
    template(childCode(5, "HOW"), TENANT.brand + " | How it works", rootCode, howParameters(seo), { html: howHtml(), css: css.how, javascript: "" }),
    template(childCode(6, "PROOF"), TENANT.brand + " | Proof", rootCode, proofParameters(seo), { html: proofHtml(), css: css.proof, javascript: "" }),
    template(childCode(7, "PRICING"), TENANT.brand + " | Pricing", rootCode, pricingParameters(seo), { html: pricingHtml(seo), css: css.pricing, javascript: "" }),
    template(childCode(8, "SERVICE_AREA"), TENANT.brand + " | Service area", rootCode, areaParameters(seo), { html: areaHtml(seo), css: css.serviceArea, javascript: "" }),
    template(childCode(9, "REVIEWS"), TENANT.brand + " | Reviews", rootCode, reviewsParameters(seo), { html: reviewsHtml(seo), css: css.reviews, javascript: "" }),
    template(childCode(10, "FAQ"), TENANT.brand + " | FAQ", rootCode, faqParameters(seo), { html: faqHtml(seo), css: css.faq, javascript: "" }),
    template(childCode(11, "FINAL_CTA"), TENANT.brand + " | Final CTA", rootCode, [
      field("TITLE", mergeLocality(seo.finalCta.title, seo.meta)),
      field("SUB", seo.finalCta.sub),
      field("PRIMARY_LABEL", seo.finalCta.primary.label),
      field("SECONDARY_LABEL", seo.finalCta.secondary.label),
    ], { html: finalHtml(), css: css.finalCta, javascript: "" }),
    template(childCode(12, "FOOTER"), TENANT.brand + " | Footer", rootCode, footerParameters(seo), { html: footerHtml(), css: css.footer, javascript: "" }),
  ];
}

function navHtml() {
  return '<div class="top-nav-wrap"><nav class="top-nav" data-module="public-nav" data-visual-id="public-nav">'
    + '<div class="top-nav__brand" data-action="nav.landing"><div class="brand-logo"></div><span class="brand-name" data-bind="brand.name">' + ref("BRAND") + "</span></div>"
    + '<div class="top-nav__actions"><div class="icon-btn icon-btn--optional" data-action="ui.toggleMode" title="Toggle light/dark">☾</div>'
    + '<button class="btn btn--primary" data-module="action-button" data-visual-id="public-signin" data-action="portal.signin" data-state="idle">' + ref("SIGNIN_LABEL") + "</button></div></nav></div>";
}

function heroParameters(seo) {
  const h1 = mergeLocality(seo.meta.h1, seo.meta);
  const parts = h1.split(seo.meta.locality);
  return [
    field("SERVICE_AREA", seo.meta.serviceArea),
    field("TITLE_PREFIX", parts[0]),
    field("LOCALITY", seo.meta.locality),
    field("TITLE_SUFFIX", parts[1] || ""),
    field("SERVICE", seo.hero.service),
    field("OFFER_TAG", seo.hero.offer.tag),
    field("OFFER_TEXT", seo.hero.offer.text),
    field("OFFER_UNTIL", seo.hero.offer.until),
    field("PRIMARY_LABEL", seo.meta.primaryCta.label),
    field("SECONDARY_LABEL", seo.meta.secondaryCta.label),
    field("NOTE", "Dispatch is automatic once your snowfall trigger is met — no phone call at 5 am."),
    field("MEDIA_URL", "", "STRING"),
    field("MEDIA_ALT", "Granite Ridge crew clearing a lot before dawn"),
    field("MEDIA_FOCAL", "50% 50%", "STRING"),
    field("MEDIA_SLOT_LABEL", "hero photo · from CMS"),
  ];
}

function heroHtml() {
  return '<section class="seo-hero" data-module="seo-hero" data-visual-id="seo-hero"><div class="seo-hero__inner"><div class="seo-hero__copy">'
    + '<span class="eyebrow seo-hero__area" data-bind="cms.meta.serviceArea">◉ Serving ' + ref("SERVICE_AREA") + "</span>"
    + '<h1 class="seo-hero__title" data-bind="cms.meta.h1 + cms.meta.locality">' + ref("TITLE_PREFIX") + '<span class="seo-hero__geo" data-bind="cms.meta.locality">' + ref("LOCALITY") + "</span>" + ref("TITLE_SUFFIX") + "</h1>"
    + '<p class="seo-hero__sub" data-bind="cms.hero.service">' + ref("SERVICE") + "</p>"
    + '<div class="seo-offer" data-module="seo-offer" data-visual-id="seo-offer" data-bind="cms.hero.offer" data-state="ready"><span class="seo-offer__tag">' + ref("OFFER_TAG") + "</span><span>" + ref("OFFER_TEXT") + '</span><span class="seo-offer__until">' + ref("OFFER_UNTIL") + "</span></div>"
    + '<div class="seo-hero__ctas">'
    + cta("PRIMARY_LABEL", "btn--onaccent", "seo-hero-primary-cta", "portal.request", "cms.meta.primaryCta", true)
    + cta("SECONDARY_LABEL", "btn--glass-hero", "seo-hero-secondary-cta", "nav.services", "cms.meta.secondaryCta", true)
    + "</div>"
    + '<div class="seo-hero__note">' + ref("NOTE") + "</div></div>"
    + mediaSlot("seo-hero__media", "cms.media.hero")
    + "</div></section>";
}

function mediaSlot(className, bind) {
  return '<div class="seo-media-slot seo-media ' + className + '" data-module="seo-media" data-visual-id="seo-media" data-bind="' + bind + '" data-state="no-data"'
    + ' data-media-url="' + ref("MEDIA_URL", "STRING") + '"'
    + ' data-media-alt="' + ref("MEDIA_ALT") + '"'
    + ' data-media-focal="' + ref("MEDIA_FOCAL", "STRING") + '">'
    + '<span class="seo-media-slot__label">' + ref("MEDIA_SLOT_LABEL") + "</span></div>";
}

function cta(labelCode, variant, visualId, action, bind, large) {
  return '<button class="btn ' + variant + (large ? " btn--lg" : "") + ' seo-cta" data-module="seo-cta" data-visual-id="' + visualId + '" data-action="' + action + '" data-state="idle" data-bind="' + bind + '" aria-live="polite">' + ref(labelCode) + "</button>";
}

function trustParameters(seo) {
  const trust = seo.trust;
  return [
    field("RATING_LABEL", "Rating"), field("RATING_SLOT", "rating · from CMS"),
    field("LICENCE_LABEL", trust.licence.label), field("LICENCE_SLOT", "licence № · from CMS"),
    field("INSURANCE_LABEL", trust.insurance.label), field("INSURANCE_SLOT", "policy · from CMS"),
    field("GUARANTEE_LABEL", trust.guarantee.label), field("GUARANTEE_VALUE", trust.guarantee.value),
    field("DISPATCH_LABEL", trust.response.label), field("DISPATCH_VALUE", trust.response.value),
  ];
}

function trustHtml() {
  return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="ready">'
    + trustItem("★", "RATING_LABEL", "RATING_SLOT", "rating", true)
    + trustItem("⚖", "LICENCE_LABEL", "LICENCE_SLOT", "licence", true)
    + trustItem("✔", "INSURANCE_LABEL", "INSURANCE_SLOT", "insurance", true)
    + trustItem("⬚", "GUARANTEE_LABEL", "GUARANTEE_VALUE", "guarantee")
    + trustItem("⏱", "DISPATCH_LABEL", "DISPATCH_VALUE", "response")
    + "</section>";
}

function trustItem(icon, label, value, bind, slot) {
  return '<div class="seo-trust__item" data-bind="cms.trust.' + bind + '"><span class="seo-trust__icon">' + icon + '</span><div><div class="seo-trust__label">' + ref(label) + '</div><div class="seo-trust__value">'
    + (slot ? '<span class="seo-slot" data-state="no-data">' : "") + ref(value) + (slot ? "</span>" : "") + "</div></div></div>";
}

function servicesParameters(seo) {
  const result = [field("EYEBROW", seo.services.eyebrow), field("TITLE", seo.services.title), field("SUB", seo.services.sub)];
  seo.services.items.forEach(function (item, index) {
    const n = index + 1;
    result.push(field("ITEM_" + n + "_NAME", item.name), field("ITEM_" + n + "_BENEFIT", item.tagline), field("ITEM_" + n + "_PRICE", item.price));
  });
  return result;
}

function servicesHtml(seo) {
  const palettes = [
    ["var(--accent)", "rgba(var(--accent-rgb),.12)"],
    ["#1f8a44", "rgba(52,199,89,.16)"],
    ["#ff8a3d", "rgba(255,159,10,.16)"],
    ["#7a52e0", "rgba(122,82,224,.16)"],
  ];
  let cards = "";
  for (let index = 1; index <= seo.services.items.length; index += 1) {
    const palette = palettes[(index - 1) % palettes.length];
    cards += '<div class="seo-svc" data-module="seo-service-card" data-visual-id="seo-service-card" data-action="nav.pricing" data-id="' + ref("ITEM_" + index + "_NAME") + '" data-bind="cms.services[]" role="button" tabindex="0">'
      + '<div class="seo-svc__icon" style="background:' + palette[1] + '"><i style="background:' + palette[0] + '"></i></div>'
      + '<div class="seo-svc__name">' + ref("ITEM_" + index + "_NAME") + "</div>"
      + '<div class="seo-svc__benefit" data-bind="cms.services[].benefit">' + ref("ITEM_" + index + "_BENEFIT") + "</div>"
      + '<div class="seo-svc__meta"><span data-bind="cms.services[].priceFrom">from ' + ref("ITEM_" + index + "_PRICE") + '</span><span class="seo-svc__go">Pricing →</span></div></div>';
  }
  return '<section class="seo-sec" id="seo-services" data-module="seo-services-grid" data-visual-id="seo-services-grid"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2><p class="seo-sec__sub">' + ref("SUB") + '</p></div><div class="seo-svc-grid">' + cards + "</div></section>";
}

function howParameters(seo) {
  const result = [field("EYEBROW", "How it works"), field("TITLE", "From measured area to compliance report")];
  seo.how.forEach(function (item, index) {
    const n = index + 1;
    result.push(field("STEP_" + n + "_TITLE", item.title), field("STEP_" + n + "_DESC", item.desc));
  });
  return result;
}

function howHtml() {
  let steps = "";
  for (let index = 1; index <= 4; index += 1) {
    steps += '<div class="seo-how__step" data-bind="cms.how[' + (index - 1) + ']"><div class="seo-how__num">' + index + '</div><div class="seo-how__title">' + ref("STEP_" + index + "_TITLE") + '</div><div class="seo-how__desc">' + ref("STEP_" + index + "_DESC") + "</div></div>";
  }
  return '<section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + "</h2></div>" + '<div class="seo-how">' + steps + "</div></section>";
}

function proofParameters(seo) {
  const result = [
    field("EYEBROW", "Why " + TENANT.brand),
    field("TITLE", seo.proof.title),
    field("MEDIA_URL", "", "STRING"),
    field("MEDIA_ALT", "Granite Ridge plow clearing a commercial lot at dawn"),
    field("MEDIA_FOCAL", "50% 50%", "STRING"),
    field("MEDIA_SLOT_LABEL", "proof photo · from CMS"),
  ];
  seo.proof.items.forEach(function (item, index) {
    const n = index + 1;
    result.push(field("ITEM_" + n + "_TITLE", item.title), field("ITEM_" + n + "_DESC", item.desc));
  });
  return result;
}

function proofHtml() {
  let cards = "";
  for (let index = 1; index <= 3; index += 1) {
    cards += '<div class="seo-proof__card" data-bind="cms.proof.items[' + (index - 1) + ']"><div class="seo-proof__glyph"><i></i></div><div class="seo-proof__title">' + ref("ITEM_" + index + "_TITLE") + '</div><div class="seo-proof__desc">' + ref("ITEM_" + index + "_DESC") + "</div></div>";
  }
  return '<section class="seo-sec seo-sec--tint" data-module="seo-proof" data-visual-id="seo-proof"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + "</h2></div>"
    + mediaSlot("seo-proof__media", "cms.media.proof")
    + '<div class="seo-proof">' + cards + "</div></section>";
}

function pricingParameters(seo) {
  const result = [
    field("EYEBROW", "Pricing"),
    field("TITLE", "What to expect"),
    field("SUB", seo.pricing.note),
    field("CTA_LABEL", seo.pricing.cta.label),
  ];
  seo.pricing.rows.forEach(function (row, index) {
    const n = index + 1;
    result.push(field("ROW_" + n + "_NAME", row.name));
    result.push(field("ROW_" + n + "_VALUE", row.from ? "from " + row.from : row.reason));
    if (row.from) result.push(field("ROW_" + n + "_UNIT", " / " + row.unit));
  });
  return result;
}

function pricingHtml(seo) {
  let rows = "";
  seo.pricing.rows.forEach(function (row, index) {
    const n = index + 1;
    const value = row.from
      ? '<span class="seo-price__val"><b>' + ref("ROW_" + n + "_VALUE") + '</b><span class="seo-price__unit">' + ref("ROW_" + n + "_UNIT") + "</span></span>"
      : '<span class="seo-price__val seo-price__val--quote">' + ref("ROW_" + n + "_VALUE") + "</span>";
    rows += '<div class="seo-price__row" data-module="seo-pricing-row" data-visual-id="seo-pricing-row" data-bind="cms.pricing.rows[' + index + ']"><span class="seo-price__name">' + ref("ROW_" + n + "_NAME") + "</span>" + value + "</div>";
  });
  return '<section class="seo-sec" id="seo-pricing" data-module="seo-pricing" data-visual-id="seo-pricing" data-state="ready"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2><p class="seo-sec__sub">' + ref("SUB") + "</p></div>"
    + '<div class="seo-price">' + rows + "</div>"
    + '<div class="seo-price__cta">' + cta("CTA_LABEL", "btn--primary", "seo-pricing-cta", "portal.request", "cms.pricing.cta", false) + "</div></section>";
}

function areaParameters(seo) {
  const result = [field("EYEBROW", "Coverage"), field("TITLE", "Where we plow"), field("REGION", seo.meta.serviceArea), field("NOTE", seo.area.note)];
  seo.area.cities.forEach(function (city, index) { result.push(field("CITY_" + (index + 1), city)); });
  return result;
}

function areaHtml(seo) {
  let cities = "";
  for (let index = 1; index <= seo.area.cities.length; index += 1) cities += '<span class="seo-area__chip">' + ref("CITY_" + index) + "</span>";
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
    items += '<div class="seo-review" data-bind="cms.reviews[' + index + ']">' + media + '<div class="seo-review__stars">' + stars + '</div><p class="seo-review__text">“' + ref("ITEM_" + n + "_TEXT") + '”</p><div class="seo-review__name">' + ref("ITEM_" + n + "_NAME") + "</div></div>";
  });
  return '<section class="seo-sec seo-sec--tint" data-module="seo-reviews" data-visual-id="seo-reviews" data-state="ready"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-reviews">' + items + "</div></section>";
}

function faqParameters(seo) {
  const result = [field("EYEBROW", "FAQ"), field("TITLE", "Common questions")];
  seo.faq.forEach(function (item, index) {
    const n = index + 1;
    result.push(field("ITEM_" + n + "_QUESTION", item.q), field("ITEM_" + n + "_ANSWER", item.a));
  });
  return result;
}

function faqHtml(seo) {
  let items = "";
  for (let index = 1; index <= seo.faq.length; index += 1) {
    items += '<div class="seo-faq__item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" data-bind="cms.faq[' + (index - 1) + ']"><button class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + (index - 1) + '" data-faq-answer="' + ref("ITEM_" + index + "_ANSWER") + '" aria-expanded="false"><span itemprop="name">' + ref("ITEM_" + index + "_QUESTION") + '</span><span class="seo-faq__chev">+</span></button></div>';
  }
  return '<section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq" data-state="ready"><div class="seo-sec__head"><span class="eyebrow">' + ref("EYEBROW") + '</span><h2 class="seo-sec__title">' + ref("TITLE") + '</h2></div><div class="seo-faq" itemscope itemtype="https://schema.org/FAQPage">' + items + "</div></section>";
}

function finalHtml() {
  return '<section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta"><h2 class="seo-final__title" data-bind="cms.meta.h1">' + ref("TITLE") + '</h2><p class="seo-final__sub">' + ref("SUB") + '</p><div class="seo-final__ctas">'
    + cta("PRIMARY_LABEL", "btn--onaccent", "seo-final-primary-cta", "portal.request", "cms.finalCta.primary", true)
    + cta("SECONDARY_LABEL", "btn--glass-hero", "seo-final-secondary-cta", "portal.signin", "cms.finalCta.secondary", true)
    + "</div></section>";
}

function footerParameters(seo) {
  const result = [
    field("PHONE_SLOT", "phone · from CMS"), field("EMAIL_SLOT", "email · from CMS"),
    field("SERVICE_AREA", seo.meta.serviceArea), field("CITIES", seo.area.cities.join(" · ")),
    field("BRAND", TENANT.brand), field("CANONICAL", "canonical: " + seo.meta.canonicalPath),
  ];
  seo.footer.hours.forEach(function (row, index) { const n = index + 1; result.push(field("HOURS_" + n + "_DAYS", row.d), field("HOURS_" + n + "_VALUE", row.h)); });
  seo.footer.legal.forEach(function (row, index) { const n = index + 1; result.push(field("LEGAL_" + n + "_LABEL", row.label), field("LEGAL_" + n + "_HREF", row.href, "STRING")); });
  return result;
}

function footerHtml() {
  let hours = "";
  let legal = "";
  for (let index = 1; index <= 3; index += 1) {
    hours += '<div class="seo-footer__row" data-bind="cms.footer.hours"><span>' + ref("HOURS_" + index + "_DAYS") + "</span><span>" + ref("HOURS_" + index + "_VALUE") + "</span></div>";
    legal += '<a class="seo-footer__link" href="' + ref("LEGAL_" + index + "_HREF", "STRING") + '" data-bind="cms.footer.legal">' + ref("LEGAL_" + index + "_LABEL") + "</a>";
  }
  return '<footer class="seo-footer" data-module="seo-footer" data-visual-id="seo-footer"><div class="seo-footer__grid"><div class="seo-footer__col"><div class="seo-footer__head">Contact</div><div data-bind="cms.footer.contacts.phone"><span class="seo-slot" data-state="no-data">' + ref("PHONE_SLOT") + '</span></div><div data-bind="cms.footer.contacts.email"><span class="seo-slot" data-state="no-data">' + ref("EMAIL_SLOT") + '</span></div></div><div class="seo-footer__col"><div class="seo-footer__head">Hours</div>' + hours + '</div><div class="seo-footer__col"><div class="seo-footer__head">Service area</div><div data-bind="cms.meta.serviceArea">' + ref("SERVICE_AREA") + '</div><div class="seo-footer__muted" data-bind="cms.area.cities">' + ref("CITIES") + '</div></div><div class="seo-footer__col"><div class="seo-footer__head">Legal</div>' + legal + '</div></div><div class="seo-footer__base"><span data-bind="brand.name">' + ref("BRAND") + '</span><span class="seo-footer__muted" data-bind="cms.meta.canonicalPath">' + ref("CANONICAL") + "</span></div></footer>";
}

function runtimeScript() {
  return String.raw`/* Granite Ridge public landing runtime. CMS-authored content only: no backend call, no customer data. */
(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function safeUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    try { var url = new URL(raw); return url.protocol === "https:" ? url.href : ""; } catch (_) { return ""; }
  }
  function destinations(root) {
    var portal = safeUrl(root.dataset.portalUrl);
    return {
      "portal.signin": portal,
      "portal.request": safeUrl(root.dataset.portalRequestUrl) || portal,
      "portal.services": safeUrl(root.dataset.portalServicesUrl) || portal
    };
  }
  function markUnavailable(root, targets) {
    root.querySelectorAll("[data-action]").forEach(function (node) {
      var action = node.dataset.action;
      if (!Object.prototype.hasOwnProperty.call(targets, action)) return;
      if (targets[action]) return;
      node.dataset.portalDestination = "unset";
      node.disabled = true;
    });
  }
  function revealMedia(root) {
    root.querySelectorAll("[data-media-url]").forEach(function (slot) {
      var url = String(slot.dataset.mediaUrl || "").trim();
      if (!url) return;
      var label = slot.querySelector(".seo-media-slot__label");
      var image = document.createElement("img");
      image.className = "seo-media__img";
      image.alt = slot.dataset.mediaAlt || "";
      image.loading = "lazy";
      image.style.objectPosition = slot.dataset.mediaFocal || "50% 50%";
      image.addEventListener("error", function () {
        if (image.parentNode) image.parentNode.removeChild(image);
        slot.dataset.state = "no-data";
        if (label && !label.parentNode) slot.appendChild(label);
      });
      image.src = url;
      if (label) label.remove();
      slot.dataset.state = "ready";
      slot.appendChild(image);
    });
  }
  function anchor(name) {
    if (name === "nav.services") return "#seo-services";
    if (name === "nav.pricing") return "#seo-pricing";
    return "";
  }
  function toggleFaq(action) {
    var item = action.closest(".seo-faq__item");
    var open = item.classList.toggle("is-open");
    action.setAttribute("aria-expanded", open ? "true" : "false");
    var chev = action.querySelector(".seo-faq__chev");
    if (chev) chev.textContent = open ? "−" : "+";
    var answer = item.querySelector(".seo-faq__a");
    if (!open) { if (answer) answer.remove(); return; }
    if (answer) return;
    answer = document.createElement("div");
    answer.className = "seo-faq__a";
    answer.setAttribute("itemscope", "");
    answer.setAttribute("itemprop", "acceptedAnswer");
    answer.setAttribute("itemtype", "https://schema.org/Answer");
    var copy = document.createElement("p");
    copy.setAttribute("itemprop", "text");
    copy.textContent = action.dataset.faqAnswer || "";
    answer.appendChild(copy);
    item.appendChild(answer);
  }
  function wire(root, targets) {
    root.addEventListener("click", function (event) {
      var action = event.target.closest("[data-action]");
      if (!action || !root.contains(action)) return;
      var name = action.dataset.action;
      if (name === "ui.toggleMode") {
        event.preventDefault();
        document.documentElement.dataset.mode = document.documentElement.dataset.mode === "dark" ? "light" : "dark";
        root.dataset.mode = document.documentElement.dataset.mode;
        return;
      }
      if (name === "seo.faq.toggle") { event.preventDefault(); toggleFaq(action); return; }
      var target = anchor(name);
      if (target) {
        var section = document.querySelector(target);
        if (section) { event.preventDefault(); section.scrollIntoView({ behavior: "smooth", block: "start" }); }
        return;
      }
      if (Object.prototype.hasOwnProperty.call(targets, name)) {
        event.preventDefault();
        if (targets[name]) window.location.assign(targets[name]);
      }
    });
    var apply = function () {
      var width = root.getBoundingClientRect().width;
      root.classList.toggle("vw-mobile", width <= 560);
      root.classList.toggle("vw-tablet", width > 560 && width <= 900);
      root.classList.toggle("vw-compact", width <= 1040);
    };
    apply();
    if (window.ResizeObserver) new ResizeObserver(apply).observe(root);
  }
  ready(function () {
    var root = document.querySelector("#granite-ridge-landing");
    if (!root) return;
    document.documentElement.dataset.theme = "snow";
    document.documentElement.dataset.mode = root.dataset.mode || "light";
    var targets = destinations(root);
    markUnavailable(root, targets);
    revealMedia(root);
    wire(root, targets);
  });
})();`;
}

export async function readDesignCss() {
  const read = async function (file) { return (await fs.readFile(path.join(designRoot, "styles", file), "utf8")).trim(); };
  const [tokens, base, components, shell, seo, responsive, routes] = await Promise.all([
    read("tokens.css"), read("base.css"), read("components.css"), read("shell.css"), read("seo.css"), read("responsive.css"), read("routes.css"),
  ]);
  const prefix = before(seo, "/* ---------- 1 · hero ---------- */");
  const sectionResponsive = between(seo, "/* ============================================================\n   Responsive", "/* ============================================================\n   wave 11");
  const media = between(seo, "/* ============================================================\n   wave 11", "/* wave 12 · pim.pricing[] rows");
  const commerceShared = between(routes, "/* ============================================================\n   WAVE 3 — Commerce", "/* ---- Pricing (data-route=\"pricing\") ---- */");
  const landingComponents = before(components, "/* ============================================================\n   Wave 13 — authenticated live-data states");
  const landingShell = before(shell, "/* ============================================================\n   Wave 14 — Calm Harbor spa shell");
  const landingResponsive = before(responsive, "/* Wave 14 — Calm Harbor spa portal */");
  const root = [
    annotated("tokens.css", tokens),
    annotated("base.css", base),
    annotated("components.css landing-safe section", landingComponents),
    annotated("shell.css landing-safe section", landingShell),
    annotated("seo.css shared scaffolding", prefix),
    annotated("routes.css shared commerce primitives", commerceShared),
    annotated("seo.css responsive", sectionResponsive),
    annotated("responsive.css landing-safe section", landingResponsive),
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
      pricing: between(seo, "/* ---------- 6 · pricing ---------- */", "/* ---------- 7 · service area ---------- */"),
      serviceArea: between(seo, "/* ---------- 7 · service area ---------- */", "/* ---------- 8 · reviews ---------- */"),
      reviews: between(seo, "/* ---------- 8 · reviews ---------- */", "/* ---------- 9 · FAQ ---------- */"),
      faq: between(seo, "/* ---------- 9 · FAQ ---------- */", "/* ---------- 10 · final CTA ---------- */"),
      finalCta: between(seo, "/* ---------- 10 · final CTA ---------- */", "/* ---------- 11 · footer ---------- */"),
      footer: between(seo, "/* ---------- 11 · footer ---------- */", "/* ---------- dev-only CMS meta preview ---------- */"),
    },
  };
}

export function assertJteSafeFamily(templates) {
  const declared = new Set();
  for (const item of templates) {
    if (item.templateLanguage !== "JTE") throw new Error(item.code + " must be a JTE template");
    for (const parameter of item.parameters) declared.add(parameter.code);
  }
  const referenced = new Set();
  for (const item of templates) {
    for (const [field, value] of Object.entries({ head: item.head, html: item.html, css: item.css, javascript: item.javascript })) {
      for (const marker of ["@{", "!{", "<%", "%>"]) {
        if (value.includes(marker)) throw new Error("Refusing to export JTE-unsafe " + item.code + "." + field + ": " + JSON.stringify(marker));
      }
      for (const match of value.matchAll(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g)) referenced.add(match[1]);
      const stray = value.replace(/\$\{[A-Z0-9_]+@[A-Z_]+\}/g, "");
      if (stray.includes("${")) throw new Error("Refusing to export " + item.code + "." + field + ": it contains a ${ opener that is not a declared parameter marker");
    }
  }
  for (const code of referenced) {
    if (!declared.has(code)) throw new Error("Parameter " + code + " is referenced but never declared");
  }
  try {
    Function(templates[0].javascript);
  } catch (error) {
    throw new Error("The landing runtime is not syntactically valid: " + error.message);
  }
}

function annotated(name, css) { return "/* design source: design-inbox/styles/" + name + " */\n" + css.trim(); }

function before(source, marker) {
  const index = source.indexOf(marker);
  if (index < 0) throw new Error("Design CSS marker is missing: " + marker);
  return source.slice(0, index).trim();
}

export function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error("Design CSS markers are missing or out of order: " + startMarker + " -> " + endMarker);
  return source.slice(start, end).trim();
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

function childCode(index, name) { return "GRS_LANDING_" + String(index).padStart(2, "0") + "_" + name; }
function field(code, value, type = "LOCALIZED_STRING_SS") { return { code, type, nls: { en: { NAME: code.replaceAll("_", " "), DESCRIPTION: "CMS-authored value for " + TENANT.brand + "." } }, value: type.startsWith("LOCALIZED") ? { en: value } : value }; }
function ref(code, type = "LOCALIZED_STRING_SS") { return "$" + "{" + code + "@" + type + "}"; }
function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function writeText(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, String(value).replace(/\n*$/, "\n"), "utf8"); }
async function writeJson(file, value) { await writeText(file, JSON.stringify(value, null, 2) + "\n"); }

function preview(root, children) {
  const values = new Map();
  [root].concat(children).forEach(function (item) {
    item.parameters.forEach(function (parameter) {
      values.set(parameter.code + "@" + parameter.type, parameter.type.startsWith("LOCALIZED") ? parameter.value.en : parameter.value);
    });
  });
  const resolve = function (text) {
    return text.replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (_, code, type) {
      const value = previewValue(values.get(code + "@" + type));
      return type === "LOCALIZED_JSON_OBJECT" ? String(value).replace(/</g, "\\u003c") : escapeHtml(value);
    });
  };
  const body = resolve(root.html)
    .replace("<!-- cms-child-slot:ROOT_NAV -->", resolve(children[0].html))
    .replace("<!-- cms-child-slot:ROOT_SECTIONS -->", children.slice(1).map(function (child) { return resolve(child.html); }).join("\n"));
  const css = [root.css].concat(children.map(function (child) { return child.css; })).filter(Boolean).join("\n\n");
  return '<!doctype html>\n<html data-theme="snow" data-mode="light"><head>\n' + resolve(root.head) + "\n<style>\n" + css + "</style></head><body>\n" + body + "\n<script>" + root.javascript + "</script></body></html>";
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

function readme(children) {
  return "# Manual upload: " + TENANT.brand + " landing blocks (demonstration)\n\n"
    + "This package is a CMS family: one root and " + children.length + " independently editable child templates. Granite Ridge is a demonstration organization, so the package emits `noindex,nofollow` and must not be published to a production domain.\n\n"
    + "## Upload order\n\n"
    + "1. Create the root template from `root.template.json` with code `" + rootCode + "`.\n"
    + "2. Create child templates in numeric order under `children/`. Each child records its parent as `" + rootCode + "`.\n"
    + "3. Compose `" + children[0].code + "` at `ROOT_NAV`. Compose children 02–" + String(children.length).padStart(2, "0") + ", in numeric order, at `ROOT_SECTIONS` inside `.page.seo-page`. The flat uploader intentionally does not create these include relationships.\n"
    + "4. Set `ROOT_PORTAL_URL` to the deployed portal document. Optionally set `ROOT_PORTAL_REQUEST_URL` and `ROOT_PORTAL_SERVICES_URL`; each falls back to `ROOT_PORTAL_URL` when empty.\n"
    + "5. Replace the phone, email, and legal placeholders with verified values before showing the page to anyone outside the team.\n\n"
    + "## Data boundary\n\n"
    + "Every block is CMS-authored public content. No block calls a backend, and none contains customer, session, account, payment, order, or appointment data. A portal CTA whose parameter is empty is disabled through the accepted `.btn[disabled]` treatment and performs no navigation, so an unconfigured package cannot emit a dead link. Portal destinations must be absolute `https` URLs; the runtime rejects anything else at click time.\n\n"
    + "## Media\n\n"
    + "`GRS_LANDING_02_HERO_MEDIA_URL` and `GRS_LANDING_06_PROOF_MEDIA_URL` are empty. Both slots render the accepted `no-data` placeholder until a URL is set. The photography brief is `design-requests/granite-ridge-landing-media.md`.\n";
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

export function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    const match = /^--output=(.*)$/.exec(arg);
    if (!match) throw new Error("Unsupported argument: " + arg);
    options.outputDir = match[1];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportGraniteRidgeLandingBlocksManual(parseArgs(process.argv.slice(2)));
  console.log("export-granite-ridge-landing-blocks-manual ok: " + path.relative(process.cwd(), result.outputDir) + " upload=false");
}
