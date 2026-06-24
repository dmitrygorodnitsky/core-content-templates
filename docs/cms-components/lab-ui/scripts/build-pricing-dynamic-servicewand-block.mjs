import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const labRoot = resolve(scriptsDir, "..");
const outDir = join(labRoot, "14-pricing", "pricing.dynamic-servicewand");

const readText = (rel) => readFileSync(join(labRoot, rel), "utf8");
const readJson = (rel) => JSON.parse(readText(rel));
const writeText = (file, value) => writeFileSync(file, String(value ?? "").replace(/\n*$/, "\n"));
const writeJson = (file, value) => writeText(file, JSON.stringify(value, null, 2));

const children = [
  {
    prefix: "plans",
    id: "pricing.plans-flex",
    path: "14-pricing/pricing.plans-flex",
    values: {
      dynamic_pricing_enabled: "true",
      pricing_api_base: "/core-pim/api",
      pricing_organization: "SERVICEWAND",
      pricing_product_type_code: "SERVICEWAND_SAAS",
      pricing_sort_attribute_code: "SORT_ORDER_PRIORITY",
      pricing_price_type_code: "RECURRENT",
      pricing_price_attribute_code: "INTERVAL",
      pricing_price_attribute_values: "1",
      pricing_currency: "CAD",
      pricing_purchase_url: "#pricing",
      pricing_error_mode: "fallback",
    },
  },
  {
    prefix: "addons",
    id: "pricing.addons",
    path: "14-pricing/pricing.addons",
    values: {
      dynamic_pricing_enabled: "true",
      pricing_api_base: "/core-pim/api",
      pricing_organization: "SERVICEWAND",
      pricing_catalog_specs: "SERVICEWAND_SAAS_EXT|RECURRENT|INTERVAL|1 month|",
      pricing_sort_attribute_code: "SORT_ORDER_PRIORITY",
      pricing_currency: "CAD",
      pricing_purchase_url: "#pricing-addons",
      pricing_error_mode: "fallback",
    },
  },
  {
    prefix: "matrix",
    id: "pricing.matrix-collapsible",
    path: "14-pricing/pricing.matrix-collapsible",
    values: {
      dynamic_pricing_enabled: "true",
      pricing_api_base: "/core-pim/api",
      pricing_organization: "SERVICEWAND",
      pricing_product_type_code: "SERVICEWAND_SAAS",
      pricing_sort_attribute_code: "SORT_ORDER_PRIORITY",
      pricing_price_type_code: "RECURRENT",
      pricing_price_attribute_code: "INTERVAL",
      pricing_price_attribute_values: "1",
      pricing_currency: "CAD",
      pricing_purchase_url: "#pricing",
      pricing_error_mode: "fallback",
    },
  },
];

const prefixParam = (param, prefix, values) => ({
  ...param,
  code: `${prefix}_${param.code}`,
  default: Object.prototype.hasOwnProperty.call(values, param.code)
    ? values[param.code]
    : param.default,
  name: `${prefix[0].toUpperCase()}${prefix.slice(1)} · ${param.name || param.code}`,
});

const uniqueTokens = (blocks) => {
  const seen = new Set();
  const tokens = [];
  for (const block of blocks) {
    for (const token of block.depends_on?.tokens || []) {
      if (seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
  }
  return tokens;
};

const childBlocks = children.map((child) => ({
  ...child,
  json: readJson(`${child.path}/block.json`),
}));

const childByPrefix = new Map(childBlocks.map((child) => [child.prefix, child]));

const childParam = (prefix, code) => {
  const child = childByPrefix.get(prefix);
  const param = (child.json.params || []).find((candidate) => candidate.code === code);
  if (!param) throw new Error(`${child.id} is missing param ${code}`);
  return { child, param };
};

const sourceParam = (prefix, code, nextCode, values = {}) => {
  const { child, param } = childParam(prefix, code);
  const hasDefault = Object.prototype.hasOwnProperty.call(values, "default");
  const defaultValue = hasDefault
    ? values.default
    : (Object.prototype.hasOwnProperty.call(child.values, code) ? child.values[code] : param.default);
  return {
    ...param,
    ...values,
    code: nextCode,
    default: defaultValue,
    preserve_default: values.preserve_default ?? true,
    name: values.name || `ServiceWand · ${param.name || nextCode}`,
  };
};

const prefixedParam = (prefix, code, values = {}) => {
  const { child, param } = childParam(prefix, code);
  return prefixParam({ ...param, ...values }, prefix, child.values);
};

const params = [
  {
    code: "render_plans_section",
    type: "ENUM",
    options: ["false", "true"],
    default: "true",
    name: "ServiceWand · Render Plans Section",
    description: "Controls whether the plans section is visible in this monoblock.",
    preserve_default: true,
  },
  {
    code: "render_addons_section",
    type: "ENUM",
    options: ["false", "true"],
    default: "true",
    name: "ServiceWand · Render Add-ons Section",
    description: "Controls whether the dynamic add-ons section is visible in this monoblock.",
    preserve_default: true,
  },
  {
    code: "render_matrix_section",
    type: "ENUM",
    options: ["false", "true"],
    default: "true",
    name: "ServiceWand · Render Matrix Section",
    description: "Controls whether the plan comparison matrix section is visible in this monoblock.",
    preserve_default: true,
  },
  sourceParam("plans", "billing_default", "billing_default"),
  sourceParam("plans", "dynamic_pricing_enabled", "pricing_dynamic_enabled"),
  sourceParam("plans", "pricing_api_base", "pricing_api_base"),
  sourceParam("plans", "pricing_organization", "pricing_organization"),
  sourceParam("plans", "pricing_sort_attribute_code", "pricing_sort_attribute_code"),
  sourceParam("plans", "pricing_currency", "pricing_currency"),
  sourceParam("plans", "pricing_contact_label", "pricing_contact_label"),
  sourceParam("plans", "pricing_error_mode", "pricing_error_mode"),

  sourceParam("plans", "pricing_product_type_code", "saas_pricing_product_type_code"),
  sourceParam("plans", "pricing_price_type_code", "saas_pricing_price_type_code"),
  sourceParam("plans", "pricing_price_attribute_code", "saas_pricing_price_attribute_code"),
  sourceParam("plans", "pricing_price_attribute_values", "saas_pricing_price_attribute_values"),
  sourceParam("plans", "pricing_purchase_url", "saas_pricing_purchase_url"),
  sourceParam("plans", "pricing_buy_label", "saas_pricing_buy_label"),

  sourceParam("addons", "pricing_catalog_specs", "addons_pricing_catalog_specs"),
  sourceParam("addons", "pricing_purchase_url", "addons_pricing_purchase_url"),
  sourceParam("addons", "pricing_buy_label", "addons_pricing_buy_label"),

  prefixedParam("plans", "eyebrow"),
  prefixedParam("plans", "title"),
  prefixedParam("plans", "lede"),
  prefixedParam("plans", "billing_label"),
  prefixedParam("plans", "monthly_label"),
  prefixedParam("plans", "annual_label"),
  prefixedParam("plans", "billing_note"),
  prefixedParam("plans", "pricing_feature_list_label"),

  prefixedParam("addons", "eyebrow"),
  prefixedParam("addons", "title"),
  prefixedParam("addons", "lede"),
  prefixedParam("addons", "disclaimer"),
  sourceParam("addons", "collapsable", "addons_collapsable"),
  sourceParam("addons", "collapsed", "addons_collapsed"),
  sourceParam("addons", "addons_summary_addons_label", "addons_summary_addons_label"),
  sourceParam("addons", "addons_summary_categories_label", "addons_summary_categories_label"),
  sourceParam("addons", "addons_summary_from_label", "addons_summary_from_label"),
  sourceParam("addons", "addons_more_label", "addons_more_label"),
  sourceParam("addons", "addons_less_label", "addons_less_label"),

  prefixedParam("matrix", "eyebrow"),
  prefixedParam("matrix", "title"),
  prefixedParam("matrix", "lede"),
  prefixedParam("matrix", "collapsable"),
  prefixedParam("matrix", "collapsed"),
  prefixedParam("matrix", "table_label"),
  prefixedParam("matrix", "feature_column_label"),
  prefixedParam("matrix", "disclaimer"),
  prefixedParam("matrix", "state_label_yes"),
  prefixedParam("matrix", "state_label_no"),
  prefixedParam("matrix", "state_label_partial"),
  prefixedParam("matrix", "state_label_empty"),
  prefixedParam("matrix", "cta_row_label"),
];

const html = `<section class="pd-servicewand" data-block="pricing.dynamic-servicewand">
<!-- lab-ui block · pricing.dynamic-servicewand/plans -->
<section class="pf-plans" id="pricing" data-block="pricing.plans-flex" data-section-enabled="{{render_plans_section}}" data-billing="{{billing_default}}" data-pricing-period="{{billing_default}}" data-pricing-dynamic="{{pricing_dynamic_enabled}}" data-pricing-api-base="{{pricing_api_base}}" data-pricing-organization="{{pricing_organization}}" data-pricing-product-type-code="{{saas_pricing_product_type_code}}" data-pricing-sort-attribute-code="{{pricing_sort_attribute_code}}" data-pricing-price-type-code="{{saas_pricing_price_type_code}}" data-pricing-price-attribute-code="{{saas_pricing_price_attribute_code}}" data-pricing-price-attribute-values="{{saas_pricing_price_attribute_values}}" data-pricing-currency="{{pricing_currency}}" data-pricing-purchase-url="{{saas_pricing_purchase_url}}" data-pricing-buy-label="{{saas_pricing_buy_label}}" data-pricing-contact-label="{{pricing_contact_label}}" data-pricing-feature-list-label="{{plans_pricing_feature_list_label}}" data-pricing-error-mode="{{pricing_error_mode}}">
  <div class="container">
    <header class="pf-top">
      <p class="pf-eyebrow">{{plans_eyebrow}}</p>
      <h1 class="pf-title">{{plans_title}}</h1>
      <p class="pf-lede">{{plans_lede}}</p>
      <div class="pf-toggle" role="group" aria-label="{{plans_billing_label}}">
        <button class="pf-toggle-opt is-active" type="button" data-billing-option="monthly" aria-pressed="true">{{plans_monthly_label}}</button>
        <button class="pf-toggle-opt" type="button" data-billing-option="annual" aria-pressed="false">{{plans_annual_label}}</button>
      </div>
      <p class="pf-note">{{plans_billing_note}}</p>
    </header>

    <div class="pf-grid" data-plan-count="auto">
      <article class="pf-card pf-card--skeleton" aria-hidden="true" data-nosnippet>
        <span class="pf-skel pf-skel--kicker"></span>
        <span class="pf-skel pf-skel--title"></span>
        <span class="pf-skel pf-skel--text"></span>
        <span class="pf-skel pf-skel--price"></span>
        <span class="pf-skel pf-skel--button"></span>
        <span class="pf-skel pf-skel--line"></span>
        <span class="pf-skel pf-skel--line pf-skel--short"></span>
      </article>
      <article class="pf-card pf-card--skeleton" aria-hidden="true" data-nosnippet>
        <span class="pf-skel pf-skel--kicker"></span>
        <span class="pf-skel pf-skel--title"></span>
        <span class="pf-skel pf-skel--text"></span>
        <span class="pf-skel pf-skel--price"></span>
        <span class="pf-skel pf-skel--button"></span>
        <span class="pf-skel pf-skel--line"></span>
        <span class="pf-skel pf-skel--line pf-skel--short"></span>
      </article>
      <article class="pf-card pf-card--skeleton" aria-hidden="true" data-nosnippet>
        <span class="pf-skel pf-skel--kicker"></span>
        <span class="pf-skel pf-skel--title"></span>
        <span class="pf-skel pf-skel--text"></span>
        <span class="pf-skel pf-skel--price"></span>
        <span class="pf-skel pf-skel--button"></span>
        <span class="pf-skel pf-skel--line"></span>
        <span class="pf-skel pf-skel--line pf-skel--short"></span>
      </article>
      <article class="pf-card" data-plan-slot="01" data-plan-visible="hide" data-nosnippet>
        <div class="pf-card-head">
          <span class="pf-kicker"></span>
          <span class="pf-badge"></span>
        </div>
        <h2 class="pf-name"></h2>
        <p class="pf-subtitle"></p>
        <div class="pf-price" aria-label="">
          <span class="pf-currency"></span>
          <span class="pf-amount-stack">
            <span class="pf-amount" data-price-monthly></span>
            <span class="pf-amount" data-price-annual></span>
          </span>
          <span class="pf-period"></span>
          <span class="pf-card-save"></span>
        </div>
        <span class="pf-billed-stack">
          <span class="pf-billed" data-billed-monthly></span>
          <span class="pf-billed" data-billed-annual></span>
        </span>
        <a class="pf-cta" href="{{saas_pricing_purchase_url}}"></a>
        <ul class="pf-features" aria-label="{{plans_pricing_feature_list_label}}"></ul>
        <p class="pf-disclaimer"></p>
      </article>
    </div>
  </div>
</section>

<!-- lab-ui block · pricing.dynamic-servicewand/addons -->
<section class="pricing-addons" id="pricing-addons" data-block="pricing.addons" data-section-enabled="{{render_addons_section}}" data-collapsable="{{addons_collapsable}}" data-collapsed="{{addons_collapsed}}" data-summary-addons-label="{{addons_summary_addons_label}}" data-summary-categories-label="{{addons_summary_categories_label}}" data-summary-from-label="{{addons_summary_from_label}}" data-pricing-dynamic="{{pricing_dynamic_enabled}}" data-pricing-api-base="{{pricing_api_base}}" data-pricing-organization="{{pricing_organization}}" data-pricing-catalog-specs="{{addons_pricing_catalog_specs}}" data-pricing-sort-attribute-code="{{pricing_sort_attribute_code}}" data-pricing-currency="{{pricing_currency}}" data-pricing-purchase-url="{{addons_pricing_purchase_url}}" data-pricing-buy-label="{{addons_pricing_buy_label}}" data-pricing-contact-label="{{pricing_contact_label}}" data-pricing-error-mode="{{pricing_error_mode}}">
  <div class="container">
    <div class="pricing-addons-top">
      <div class="pricing-addons-top-text">
        <p class="pricing-addons-eyebrow">{{addons_eyebrow}}</p>
        <h2 class="pricing-addons-title">{{addons_title}}</h2>
        <p class="pricing-addons-lede">{{addons_lede}}</p>
        <p class="pricing-addons-summary" aria-live="polite"></p>
      </div>
      <div class="pricing-addons-top-aside">
        <button class="pricing-addons-toggle" type="button" aria-expanded="false">
          <span class="pricing-addons-toggle-label" data-label-more="{{addons_more_label}}" data-label-less="{{addons_less_label}}">{{addons_more_label}}</span>
          <span class="pricing-addons-toggle-chev" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div class="pricing-addons-body">
      <div class="pricing-addons-grid">
        <article class="pricing-addon-card pricing-addon-card--skeleton" aria-hidden="true" data-nosnippet>
          <span class="pricing-addon-skel pricing-addon-skel--pill"></span>
          <span class="pricing-addon-skel pricing-addon-skel--title"></span>
          <span class="pricing-addon-skel pricing-addon-skel--text"></span>
          <span class="pricing-addon-skel pricing-addon-skel--meter"></span>
          <span class="pricing-addon-skel pricing-addon-skel--price"></span>
        </article>
        <article class="pricing-addon-card pricing-addon-card--skeleton" aria-hidden="true" data-nosnippet>
          <span class="pricing-addon-skel pricing-addon-skel--pill"></span>
          <span class="pricing-addon-skel pricing-addon-skel--title"></span>
          <span class="pricing-addon-skel pricing-addon-skel--text"></span>
          <span class="pricing-addon-skel pricing-addon-skel--meter"></span>
          <span class="pricing-addon-skel pricing-addon-skel--price"></span>
        </article>
        <article class="pricing-addon-card pricing-addon-card--skeleton" aria-hidden="true" data-nosnippet>
          <span class="pricing-addon-skel pricing-addon-skel--pill"></span>
          <span class="pricing-addon-skel pricing-addon-skel--title"></span>
          <span class="pricing-addon-skel pricing-addon-skel--text"></span>
          <span class="pricing-addon-skel pricing-addon-skel--meter"></span>
          <span class="pricing-addon-skel pricing-addon-skel--price"></span>
        </article>
      </div>
      <p class="pricing-addons-disclaimer">{{addons_disclaimer}}</p>
    </div>
  </div>
</section>

<!-- lab-ui block · pricing.dynamic-servicewand/matrix -->
<section class="mx-matrix" id="pricing-compare" data-block="pricing.matrix-collapsible" data-section-enabled="{{render_matrix_section}}" data-collapsable="{{matrix_collapsable}}" data-collapsed="{{matrix_collapsed}}" data-columns="auto" data-pricing-period="{{billing_default}}" data-pricing-dynamic="{{pricing_dynamic_enabled}}" data-pricing-api-base="{{pricing_api_base}}" data-pricing-organization="{{pricing_organization}}" data-pricing-product-type-code="{{saas_pricing_product_type_code}}" data-pricing-sort-attribute-code="{{pricing_sort_attribute_code}}" data-pricing-price-type-code="{{saas_pricing_price_type_code}}" data-pricing-price-attribute-code="{{saas_pricing_price_attribute_code}}" data-pricing-price-attribute-values="{{saas_pricing_price_attribute_values}}" data-pricing-currency="{{pricing_currency}}" data-pricing-purchase-url="{{saas_pricing_purchase_url}}" data-pricing-buy-label="{{saas_pricing_buy_label}}" data-pricing-contact-label="{{pricing_contact_label}}" data-pricing-error-mode="{{pricing_error_mode}}" data-feature-column-label="{{matrix_feature_column_label}}" data-state-label-yes="{{matrix_state_label_yes}}" data-state-label-no="{{matrix_state_label_no}}" data-state-label-partial="{{matrix_state_label_partial}}" data-state-label-empty="{{matrix_state_label_empty}}" data-cta-row-label="{{matrix_cta_row_label}}">
  <div class="container">
    <header class="mx-top">
      <p class="mx-eyebrow">{{matrix_eyebrow}}</p>
      <h2 class="mx-title">{{matrix_title}}</h2>
      <p class="mx-lede">{{matrix_lede}}</p>
    </header>

    <div class="mx-shell mx-shell--skeleton" aria-hidden="true" data-nosnippet>
      <span class="mx-skel mx-skel--head"></span>
      <span class="mx-skel mx-skel--row"></span>
      <span class="mx-skel mx-skel--row"></span>
      <span class="mx-skel mx-skel--row"></span>
      <span class="mx-skel mx-skel--row"></span>
    </div>
    <div class="mx-shell mx-shell--table" role="table" aria-label="{{matrix_table_label}}"></div>
    <div class="mx-shell--accordion" aria-label="{{matrix_table_label}}"></div>
    <p class="mx-disclaimer">{{matrix_disclaimer}}</p>
  </div>
</section>
</section>`;

const css = `/* lab-ui block · pricing.dynamic-servicewand
   Permanent source monoblock for the dynamic ServiceWand pricing
   sections. Child section CSS/JS is pulled through depends_on.other_blocks;
   this file owns only cross-section spacing and dynamic-only fallbacks. */

.pd-servicewand {
  display: grid;
  gap: var(--composition-section-y, clamp(4rem, 7vw, 6.5rem));
}

.pd-servicewand > [data-section-enabled="false"] {
  display: none;
}

.pd-servicewand .pf-plans[data-pricing-state="fallback"] [data-plan-slot],
.pd-servicewand .mx-matrix[data-pricing-state="fallback"] .mx-shell--table,
.pd-servicewand .mx-matrix[data-pricing-state="fallback"] .mx-shell--accordion {
  display: none;
}

.pd-servicewand .pf-plans[data-pricing-state="dynamic"] .pf-card {
  display: grid;
  grid-template-rows:
    minmax(26px, auto)
    auto
    minmax(4.35rem, auto)
    minmax(4.75rem, auto)
    minmax(4.125rem, auto)
    1fr
    auto;
}

.pd-servicewand .pf-plans[data-pricing-state="dynamic"] .pf-billed-stack {
  display: none;
}

.pd-servicewand .pf-cta--primary,
.pd-servicewand .mx-cta,
.pd-servicewand .mx-acc-cta {
  background:
    linear-gradient(var(--color-white), var(--color-white)) padding-box,
    var(--gradient-cta-ring) border-box;
  border: 1px solid transparent;
  color: var(--color-heading);
}

.pd-servicewand .pf-cta--filled {
  background: var(--cta-secondary-fill);
  border: 1px solid var(--cta-secondary-border, rgba(255, 255, 255, 0.18));
  color: var(--cta-secondary-color, var(--color-white));
}

.pd-servicewand .pf-cta:hover,
.pd-servicewand .mx-cta:hover,
.pd-servicewand .mx-acc-cta:hover {
  box-shadow: 0 0 32px -4px var(--cta-accent, #6BEAF9);
}
`;

const blockJson = {
  $schema: "lab-ui/block@1",
  id: "pricing.dynamic-servicewand",
  category: "14-pricing",
  title: "Pricing · dynamic ServiceWand monoblock",
  description: "Permanent one-section wrapper for ServiceWand dynamic pricing. It renders plans, add-ons, and the comparison matrix from the shared Core PIM pricing runtime while reusing the existing pricing section adapters and styles through dependencies.",
  canonical: false,
  theme: "light",
  source: {
    primary: "docs/cms-components/lab-ui/14-pricing/_combined-preview.html",
    adapted_from: "Composes pricing.plans-flex, pricing.addons, and pricing.matrix-collapsible as one reusable CMS section.",
    decision: "Permanent template section with dynamic pricing adapters and section-level show/hide controls.",
    localScripts: ["14-pricing/_shared/pricing-runtime.js"],
  },
  depends_on: {
    tokens: uniqueTokens(childBlocks.map((child) => child.json)),
    other_blocks: childBlocks.map((child) => child.id),
  },
  params,
  notes: [
    "This block is intentionally a source-level composition. Do not paste generated dist/manual-upload CSS or JavaScript back into it.",
    "Dynamic data comes from Core PIM prices plus visible productTypes.attributeOrder attributes via the shared LabPricing runtime.",
    "Plans, add-ons, and matrix can be shown independently. Add-ons and matrix keep their own collapse behavior; plans do not collapse.",
    "The runtime is bundled once through source.localScripts before child adapters, so pricing adapters do not need to duplicate request/normalization code.",
  ],
};

const harness = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>pricing.dynamic-servicewand harness</title>
  <link rel="stylesheet" href="../../00-tokens/tokens.css">
  <link rel="stylesheet" href="../../00-tokens/composition.css">
  <link rel="stylesheet" href="../pricing.plans-flex/block.css">
  <link rel="stylesheet" href="../pricing.addons/block.css">
  <link rel="stylesheet" href="../pricing.matrix-collapsible/block.css">
  <link rel="stylesheet" href="./block.css">
</head>
<body data-theme="cyan">
  <main class="composition-section">
${renderDefaults(html, params).replace(/^/gm, "    ")}
  </main>
  <script>
    document.querySelector('[data-block="pricing.plans-flex"]').dataset.pricingFixtureUrl = "../_fixtures/saas.json";
    document.querySelector('[data-block="pricing.addons"]').dataset.pricingCatalogSpecs = "SERVICEWAND_SAAS_EXT|RECURRENT|INTERVAL|1 month|../_fixtures/sites.json";
    document.querySelector('[data-block="pricing.matrix-collapsible"]').dataset.pricingFixtureUrl = "../_fixtures/saas.json";
  </script>
  <script src="../_shared/pricing-runtime.js"></script>
  <script src="../pricing.plans-flex/block.js"></script>
  <script src="../pricing.addons/block.js"></script>
  <script src="../pricing.matrix-collapsible/block.js"></script>
</body>
</html>`;

mkdirSync(outDir, { recursive: true });
writeText(join(outDir, "block.html"), html);
writeText(join(outDir, "block.css"), css);
writeJson(join(outDir, "block.json"), blockJson);
writeText(join(outDir, "harness.html"), harness);

for (const size of ["1440", "390"]) {
  const from = join(labRoot, "14-pricing", "pricing.plans-flex", `preview-${size}.png`);
  const to = join(outDir, `preview-${size}.png`);
  if (existsSync(from) && !existsSync(to)) copyFileSync(from, to);
}

function renderDefaults(source, blockParams) {
  const paramMap = new Map(blockParams.map((param) => [param.code, param]));
  return source.replace(/\{\{([A-Za-z0-9_-]+)\}\}/g, (_, code) => {
    const value = paramMap.get(code)?.default ?? "";
    return String(value);
  });
}

console.log(`Wrote ${outDir}`);
console.log(`Params: ${params.length}`);
