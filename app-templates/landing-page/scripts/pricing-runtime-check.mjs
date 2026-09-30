import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pricing = require("../blocks/14-pricing/_shared/pricing-runtime.js");
const scriptsDir = dirname(fileURLToPath(import.meta.url));

assert.equal(pricing.resolveText("Plain text", "fr", "Default text"), "Plain text");
assert.equal(
  pricing.resolveText({ en: "English text", fr: "Texte français" }, "fr", "Default text"),
  "Texte français",
);
assert.equal(
  pricing.resolveText({ en: "English text" }, "fr", "Default text"),
  "Default text",
);
assert.equal(
  pricing.resolveText({ en: "English text", default: "Explicit default" }, "fr", "Default text"),
  "Explicit default",
);
assert.equal(
  pricing.resolveText({ "fr_CA": "Texte canadien", fr: "Texte français" }, "fr-CA", "Default text"),
  "Texte canadien",
);

const data = {
  prices: [
    {
      product: {
        product: {
          code: "PLAN_DEFAULT",
          nls: {
            en: { NAME: "English plan", DESCRIPTION: "English description" },
            fr: { DESCRIPTION: "Description française" },
          },
        },
        attributes: {
          1: {
            PLAIN_TEXT: { value: "Plain attribute" },
            VALUE_NLS: { value: { en: "English value", fr: "Valeur française" } },
            CURRENT_NLS: {
              value: "Default current attribute",
              nls: { fr: { NAME: "Attribut traduit" } },
            },
            PARTIAL_NLS: {
              value: "Default attribute",
              nls: { de: { NAME: "Deutsches Attribut" } },
            },
          },
        },
      },
      price: { display: { amount: 10, currency: "CAD", intervalLabel: "1 Month" } },
    },
    {
      product: {
        product: {
          code: "PLAN_WITHOUT_NAME",
          nls: { fr: { DESCRIPTION: "Aucun nom disponible" } },
        },
        attributes: {},
      },
      price: { display: { amount: 20, currency: "CAD", intervalLabel: "1 Month" } },
    },
  ],
  productTypes: {
    TEST: {
      attributeGroups: [{ code: "default", nls: { fr: { NAME: "Fonctions" } } }],
      attributeOrder: [{ default: [
        { typeId: 1, attributeCode: "PLAIN_TEXT", visible: true },
        { typeId: 1, attributeCode: "VALUE_NLS", visible: true },
        { typeId: 1, attributeCode: "CURRENT_NLS", visible: true },
        { typeId: 1, attributeCode: "PARTIAL_NLS", visible: true },
      ] }],
      attributes: {
        PLAIN_TEXT: { nls: { fr: { NAME: "Texte simple" } } },
        VALUE_NLS: { nls: { fr: { NAME: "Valeur NLS" } } },
        CURRENT_NLS: { nls: { fr: { NAME: "NLS courant" } } },
        PARTIAL_NLS: { nls: { fr: { NAME: "NLS partiel" } } },
      },
    },
  },
};

const result = pricing.normalize(data, {
  locale: "fr",
  currency: "CAD",
  productSortAttributeCode: "SORT_ORDER_PRIORITY",
  priceAttributeCode: "INTERVAL",
  pricePeriodUnitAttributeCode: "UNIT",
  priceAttributeValues: ["1 month"],
  annualPeriodCount: 12,
});

assert.equal(result.plans[0].name, "English plan");
assert.notEqual(result.plans[0].name, result.plans[0].code);
assert.equal(result.plans[0].description, "Description française");
assert.equal(result.plans[1].name, "Published plan");
assert.notEqual(result.plans[1].name, result.plans[1].code);
assert.deepEqual(
  result.groups[0].attributes.map((attribute) => attribute.values[0].text),
  ["Plain attribute", "Valeur française", "Attribut traduit", "Default attribute"],
);

const dynamicHtml = readFileSync(
  join(scriptsDir, "../blocks/14-pricing/pricing.dynamic-servicewand/block.html"),
  "utf8",
);
const plansRuntime = readFileSync(
  join(scriptsDir, "../blocks/14-pricing/pricing.plans-flex/block.js"),
  "utf8",
);
assert.match(dynamicHtml, /<template data-plan-card-template>/);
assert.doesNotMatch(dynamicHtml, /<article[^>]+data-plan-slot=/);
assert.doesNotMatch(dynamicHtml, /class="pf-name"/);
assert.match(plansRuntime, /inertTemplate\.content/);
assert.match(plansRuntime, /grid\.querySelectorAll\("\[data-plan-slot\]"\)/);
assert.match(plansRuntime, /document\.createElement\("h2"\)/);
assert.match(plansRuntime, /setPlanName\(card, plan\.name\)/);

console.log("pricing-runtime-check ok");
