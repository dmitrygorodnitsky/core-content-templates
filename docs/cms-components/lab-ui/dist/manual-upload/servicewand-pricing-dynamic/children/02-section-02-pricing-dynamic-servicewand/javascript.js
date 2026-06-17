/* generated local JS: 14-pricing/_shared/pricing-runtime.js */
// lab-ui pricing shared runtime
// Loads Core PIM price-comparison data once per request signature and exposes
// normalized plans/groups for plain DOM block adapters.

(function (root) {
  "use strict";

  const MAX_INTEGER_PRICE = 2147483647;
  const DEFAULT_ANNUAL_PERIOD_COUNT = 12;
  const API_PATH = "/public/{organization}/catalog/price-comparison.json";
  const LOREM = "Lorem ipsum";
  const PLAN_MARKETING_ATTRIBUTES = {
    kicker: "PLAN_KICKER",
    badge: "PLAN_BADGE",
    cardState: "PLAN_CARD_STATE",
  };
  const PLAN_CARD_FEATURE_ATTRIBUTES = [
    "PLAN_CARD_FEATURE_01",
    "PLAN_CARD_FEATURE_02",
    "PLAN_CARD_FEATURE_03",
    "PLAN_CARD_FEATURE_04",
    "PLAN_CARD_FEATURE_05",
  ];
  const cache = new Map();

  function ready(fn) {
    if (root.document && root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function parseConfig(section) {
    const dataset = section && section.dataset ? section.dataset : {};
    const documentLocale = root.document && root.document.documentElement
      ? root.document.documentElement.lang
      : "";
    const locale = firstValue(dataset.pricingLocale, root.__swLocale, documentLocale, "en");
    return {
      enabled: parseBoolean(dataset.pricingDynamic),
      apiBase: firstValue(dataset.pricingApiBase, "/core-pim/api"),
      organization: firstValue(dataset.pricingOrganization, "SERVICEWAND"),
      productTypeCode: firstValue(dataset.pricingProductTypeCode, "SERVICEWAND_SAAS"),
      productSortAttributeCode: firstValue(dataset.pricingSortAttributeCode, "SORT_ORDER_PRIORITY"),
      priceTypeCode: firstValue(dataset.pricingPriceTypeCode, "RECURRENT"),
      priceAttributeCode: firstValue(dataset.pricingPriceAttributeCode, "INTERVAL"),
      priceAttributeValues: splitList(firstValue(dataset.pricingPriceAttributeValues, "1")),
      pricePeriodUnitAttributeCode: firstValue(dataset.pricingPeriodUnitAttributeCode, "UNIT"),
      annualPeriodCount: numberOrNull(firstValue(dataset.pricingAnnualPeriodCount, DEFAULT_ANNUAL_PERIOD_COUNT)) || DEFAULT_ANNUAL_PERIOD_COUNT,
      currency: firstValue(dataset.pricingCurrency, "CAD"),
      purchaseUrl: firstValue(dataset.pricingPurchaseUrl, "#"),
      buyLabel: firstValue(dataset.pricingBuyLabel, ""),
      contactLabel: firstValue(dataset.pricingContactLabel, ""),
      errorMode: firstValue(dataset.pricingErrorMode, "fallback"),
      fixtureUrl: firstValue(dataset.pricingFixtureUrl, ""),
      lorem: parseBoolean(dataset.pricingLorem),
      locale,
    };
  }

  function load(section) {
    const config = parseConfig(section);
    if (!config.enabled) {
      return Promise.resolve({ ok: false, disabled: true, config, plans: [], groups: [] });
    }

    const request = buildRequest(config);
    const signature = JSON.stringify(request);
    if (!cache.has(signature)) {
      cache.set(signature, fetchData(request).then((data) => normalize(data, config)));
    }
    return cache.get(signature);
  }

  function buildRequest(config) {
    const payload = {
      productTypeCode: config.productTypeCode,
      includeChildProductTypes: true,
      priceTypeCode: config.priceTypeCode,
      includeChildPriceTypes: true,
      priceAttributeCode: config.priceAttributeCode,
      priceAttributeValues: config.priceAttributeValues,
      currencyAttributeCode: "CURRENCY",
      currencyAttributeValues: splitList(config.currency),
      nlsKeys: ["NAME", "DESCRIPTION"],
    };

    return {
      fixtureUrl: config.fixtureUrl,
      url: config.fixtureUrl || buildUrl(config),
      payload,
    };
  }

  async function fetchData(request) {
    if (!root.fetch) throw new Error("fetch is not available");

    const options = request.fixtureUrl
      ? { method: "GET", headers: { Accept: "application/json" } }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify(request.payload),
        };

    const response = await root.fetch(request.url, options);
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  function buildUrl(config) {
    const organization = encodeURIComponent(config.organization || "SERVICEWAND");
    const path = API_PATH.replace("{organization}", organization);
    let base = String(config.apiBase || "/core-pim/api").trim().replace(/\/+$/, "");
    base = base.replace(/\/api$/, "");
    if (/^https?:\/\//i.test(base)) return base + path;
    return "/" + trimSlashes(base) + path;
  }

  function normalize(data, config) {
    const rows = Array.isArray(data && data.prices) ? data.prices.slice() : [];
    rows.sort((left, right) => comparePriceRows(left, right, config));

    const planGroups = groupRowsByProduct(rows);
    const planRows = planGroups.map((group) => group.primary);
    const plans = planGroups.map((group, index) => normalizePlan(group, index, config));
    const groups = collectGroups(data && data.productTypes, planRows, plans, config);

    return {
      ok: true,
      config,
      plans,
      groups,
      rawCount: rows.length,
    };
  }

  function normalizePlan(group, index, config) {
    const row = group.primary;
    const productWrapper = (row && row.product) || {};
    const product = productWrapper.product || productWrapper;
    const nls = localized(product.nls, config.locale);
    const monthlyPrice = normalizePeriodPrice(pickPeriodRow(group.rows, 1, config) || row, config);
    const annualPrice = normalizePeriodPrice(
      pickPeriodRow(group.rows, config.annualPeriodCount, config),
      config,
      monthlyPrice
    );
    const customPrice = monthlyPrice.customPrice;

    return {
      index,
      code: safeText(product.code || "plan-" + (index + 1)),
      name: dynamicText(text(nls.NAME, product.code, "Plan"), config),
      description: dynamicText(text(nls.DESCRIPTION, "", ""), config),
      kicker: productAttributeText(row, PLAN_MARKETING_ATTRIBUTES.kicker, config),
      badge: productAttributeText(row, PLAN_MARKETING_ATTRIBUTES.badge, config),
      cardState: normalizeCardState(productAttributeText(row, PLAN_MARKETING_ATTRIBUTES.cardState, config)),
      cardFeatures: productAttributeTexts(row, PLAN_CARD_FEATURE_ATTRIBUTES, config),
      amount: monthlyPrice.amount,
      amountText: monthlyPrice.amountText,
      currency: monthlyPrice.currency,
      intervalLabel: monthlyPrice.intervalLabel,
      customPrice,
      prices: {
        monthly: monthlyPrice,
        annual: annualPrice,
      },
      sortPriority: numericProductAttributeValue(row, config.productSortAttributeCode),
      row,
    };
  }

  function groupRowsByProduct(rows) {
    const byCode = new Map();
    rows.forEach((row, index) => {
      const code = productCode(row) || "plan-" + (index + 1);
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push(row);
    });

    return Array.from(byCode.values()).map((groupRows) => ({
      rows: groupRows,
      primary: groupRows[0],
    }));
  }

  function productCode(row) {
    const productWrapper = (row && row.product) || {};
    const product = productWrapper.product || productWrapper;
    return safeText(product.code || "");
  }

  function normalizePeriodPrice(row, config, fallbackMonthly) {
    if (!row && fallbackMonthly) return annualPriceFromMonthly(fallbackMonthly, config);

    const price = (row && row.price) || {};
    const display = price.display || {};
    const amount = numberOrNull(display.amount);
    const customPrice = !!display.customPrice || (amount != null && amount >= MAX_INTEGER_PRICE);
    const intervalLabel = safeText(
      pricePeriodLabel(row, config)
      || display.intervalLabel
      || configuredPeriodLabel(config, rowPeriodCount(row, config) || 1)
    );

    return {
      amount,
      amountText: customPrice ? "" : formatNumber(amount, config.locale),
      currency: customPrice ? "" : safeText(display.currency || config.currency || ""),
      intervalLabel,
      customPrice,
      periodCount: periodCountFromText(intervalLabel),
      row,
    };
  }

  function annualPriceFromMonthly(monthlyPrice, config) {
    if (!monthlyPrice || monthlyPrice.customPrice || monthlyPrice.amount == null) {
      return monthlyPrice || {
        amount: null,
        amountText: "",
        currency: "",
        intervalLabel: "",
        customPrice: true,
        periodCount: config.annualPeriodCount,
        row: null,
      };
    }

    const amount = monthlyPrice.amount * config.annualPeriodCount;
    return {
      amount,
      amountText: formatNumber(amount, config.locale),
      currency: monthlyPrice.currency,
      intervalLabel: configuredPeriodLabel(config, config.annualPeriodCount)
        || periodLabel(config.annualPeriodCount, monthlyPrice.intervalLabel),
      customPrice: false,
      periodCount: config.annualPeriodCount,
      row: monthlyPrice.row,
    };
  }

  function pickPeriodRow(rows, count, config) {
    if (!Array.isArray(rows) || !rows.length) return null;
    return rows.find((row) => rowPeriodCount(row, config) === count) || null;
  }

  function rowPeriodCount(row, config) {
    return periodCountFromParts(row, config)
      || periodCountFromText(row && row.price && row.price.display && row.price.display.intervalLabel)
      || periodCountFromText(pricePeriodLabel(row, config))
      || periodCountFromText(priceAttributeLabel(row, config));
  }

  function priceAttributeLabel(row, config) {
    const price = row && row.price;
    const direct = valueFor(price, { code: config.priceAttributeCode });
    if (!direct) return "";
    return localizedScalar(direct.nls, config.locale) || localizedScalar(direct.value, config.locale);
  }

  function priceUnitLabel(row, config) {
    const price = row && row.price;
    const direct = valueFor(price, { code: config.pricePeriodUnitAttributeCode });
    if (!direct) return "";
    return localizedScalar(direct.nls, config.locale) || localizedScalar(direct.value, config.locale);
  }

  function pricePeriodLabel(row, config) {
    const interval = priceAttributeLabel(row, config);
    const unit = priceUnitLabel(row, config);
    if (!unit) return "";
    return [interval || "1", unit || ""].filter(Boolean).join(" ");
  }

  function periodCountFromParts(row, config) {
    const interval = numberOrNull(priceAttributeLabel(row, config)) || 1;
    const unit = priceUnitLabel(row, config).toLowerCase();
    if (!unit) return null;
    if (/\b(year|annual|annually|yearly)\b/.test(unit)) return interval * DEFAULT_ANNUAL_PERIOD_COUNT;
    if (/\b(month|monthly)\b/.test(unit)) return interval;
    return interval;
  }

  function periodCountFromText(value) {
    const text = safeText(value).toLowerCase();
    if (!text) return null;
    if (/\b(year|annual|annually|yearly)\b/.test(text)) return DEFAULT_ANNUAL_PERIOD_COUNT;

    const match = text.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return null;
    const count = Number(match[1].replace(",", "."));
    return Number.isFinite(count) ? count : null;
  }

  function periodLabel(count, sourceLabel) {
    if (!Number.isFinite(count)) return "";
    const source = safeText(sourceLabel);
    if (/\bmonth\b/i.test(source)) return count + " " + (count === 1 ? "Month" : "Months");
    if (/\byear\b/i.test(source)) return count === 12 ? "1 Year" : count + " Periods";
    return count + " " + (count === 1 ? "Period" : "Periods");
  }

  function configuredPeriodLabel(config, count) {
    const values = Array.isArray(config.priceAttributeValues) ? config.priceAttributeValues : [];
    const match = values.find((value) => periodCountFromText(value) === count);
    return match ? periodLabel(count, match) : "";
  }

  function collectGroups(productTypes, rows, plans, config) {
    const result = [];
    for (const typeInfo of Object.values(productTypes || {})) {
      const attrs = typeInfo.attributes || {};
      for (const groupDef of typeInfo.attributeOrder || []) {
        for (const groupCode of Object.keys(groupDef)) {
          const orders = groupDef[groupCode] || [];
          const attributes = [];
          for (const order of orders) {
            if (isPlanCardFeatureAttribute(order.attributeCode)) continue;
            if (order.visible === false) continue;
            const attr = attrs[order.attributeCode];
            if (!attr || !hasAnyValue(rows, order.typeId, order.attributeCode)) continue;
            const nls = localized(attr.nls, config.locale);
            attributes.push({
              typeId: order.typeId,
              code: order.attributeCode,
              label: dynamicText(text(nls.NAME, order.attributeCode, order.attributeCode), config),
              description: dynamicText(nls.DESCRIPTION || "", config),
              values: plans.map((plan) => normalizeValue(valueFor(plan.row && plan.row.product, {
                typeId: order.typeId,
                code: order.attributeCode,
              }), config)),
            });
          }
          if (attributes.length) {
            result.push({
              code: groupCode,
              label: dynamicText(groupLabel(typeInfo, groupCode, config.locale), config),
              attributes,
            });
          }
        }
      }
    }
    return result;
  }

  function isPlanCardFeatureAttribute(code) {
    const attributeCode = safeText(code).toUpperCase();
    return PLAN_CARD_FEATURE_ATTRIBUTES.includes(attributeCode);
  }

  function normalizeValue(raw, config) {
    if (raw == null || raw.value == null || raw.value === "") {
      return { state: "empty", text: "" };
    }
    if (raw.value === true || raw.value === "true") {
      return { state: "yes", text: "" };
    }
    if (raw.value === false || raw.value === "false") {
      return { state: "no", text: "" };
    }

    const nls = localized(raw.nls, config.locale);
    const value = text(nls.NAME, raw.value, raw.value);
    return { state: "text", text: dynamicText(value, config) };
  }

  function featureList(plan, groups, limit) {
    const features = [];
    for (const group of groups || []) {
      for (const attr of group.attributes || []) {
        const value = attr.values && attr.values[plan.index];
        if (!value || value.state === "no" || value.state === "empty") continue;
        features.push(value.text ? attr.label + ": " + value.text : attr.label);
        if (Number.isFinite(limit) && features.length >= limit) return features;
      }
    }
    return features;
  }

  function comparePriceRows(left, right, config) {
    const sortCode = String(config.productSortAttributeCode || "").trim();
    if (sortCode) {
      const leftPriority = numericProductAttributeValue(left, sortCode);
      const rightPriority = numericProductAttributeValue(right, sortCode);
      if (leftPriority != null || rightPriority != null) {
        return (leftPriority == null ? Number.MAX_SAFE_INTEGER : leftPriority)
          - (rightPriority == null ? Number.MAX_SAFE_INTEGER : rightPriority)
          || sortAmount(left) - sortAmount(right);
      }
    }
    return sortAmount(left) - sortAmount(right);
  }

  function numericProductAttributeValue(row, code) {
    const attributes = row && row.product && row.product.attributes;
    if (!attributes || !code) return null;
    for (const values of Object.values(attributes)) {
      const raw = values && values[code];
      if (!raw || raw.value == null || raw.value === "") continue;
      const number = Number(raw.value);
      if (Number.isFinite(number)) return number;
    }
    return null;
  }

  function productAttributeText(row, code, config) {
    const raw = productAttribute(row, code);
    if (!raw || raw.value == null || raw.value === "") return "";
    const nlsText = localizedScalar(raw.nls, config.locale);
    return dynamicText(nlsText || localizedScalar(raw.value, config.locale), config);
  }

  function productAttributeTexts(row, codes, config) {
    const result = [];
    for (const code of codes) {
      const value = productAttributeText(row, code, config);
      if (value) result.push(value);
    }
    return result;
  }

  function productAttribute(row, code) {
    const attributes = row && row.product && row.product.attributes;
    if (!attributes || !code) return null;
    for (const values of Object.values(attributes)) {
      if (values && values[code] != null) return values[code];
    }
    return null;
  }

  function normalizeCardState(value) {
    const state = safeText(value).toLowerCase();
    if (state === "featured" || state === "muted") return state;
    if (state === "custom") return "muted";
    return "standard";
  }

  function sortAmount(row) {
    const display = row && row.price && row.price.display;
    const amount = numberOrNull(display && display.amount);
    if (!display || display.customPrice || amount == null || amount >= MAX_INTEGER_PRICE) {
      return Number.MAX_SAFE_INTEGER;
    }
    return amount;
  }

  function hasAnyValue(rows, typeId, code) {
    return rows.some((row) => valueFor(row.product, { typeId, code }) != null);
  }

  function valueFor(productWrapper, attr) {
    const product = productWrapper || {};
    const attrs = product.attributes || {};
    if (attr.typeId && attrs[attr.typeId] && attrs[attr.typeId][attr.code] != null) {
      return attrs[attr.typeId][attr.code];
    }
    for (const values of Object.values(attrs)) {
      if (values && values[attr.code] != null) return values[attr.code];
    }
    return null;
  }

  function groupLabel(typeInfo, groupCode, locale) {
    const group = (typeInfo.attributeGroups || []).find((item) => item.code === groupCode);
    const nls = localized(group && group.nls, locale);
    return text(nls.NAME, groupCode, groupCode);
  }

  function localized(nls, locale) {
    if (!nls) return {};
    if (nls.NAME || nls.DESCRIPTION) return nls;
    return nls[locale] || nls.en || Object.values(nls)[0] || {};
  }

  function localizedScalar(value, locale) {
    if (value == null || value === "") return "";
    if (typeof value !== "object") return value;

    const direct = value.NAME ?? value.name ?? value.LABEL ?? value.label ?? value.VALUE ?? value.value ?? value.text;
    if (direct != null && direct !== value) return localizedScalar(direct, locale);

    const localizedValue = value[locale] ?? value.en;
    if (localizedValue != null && localizedValue !== value) return localizedScalar(localizedValue, locale);

    const first = Object.values(value).find((item) => item != null && item !== "");
    if (first != null && first !== value) return localizedScalar(first, locale);

    return "";
  }

  function safeText(value) {
    return String(value == null ? "" : value)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function dynamicText(value, config) {
    if (config && config.lorem && safeText(value)) return LOREM;
    return safeText(value);
  }

  function formatNumber(value, locale) {
    if (value == null) return "";
    return Number(value).toLocaleString(locale || undefined, { maximumFractionDigits: 2 });
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function splitList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function trimSlashes(value) {
    return String(value || "").replace(/^\/+|\/+$/g, "");
  }

  function firstValue() {
    for (const value of arguments) {
      if (value != null && String(value).trim() !== "") return String(value).trim();
    }
    return "";
  }

  function parseBoolean(value) {
    return value === true || value === "true" || value === "1" || value === "yes";
  }

  function text(value, fallback, empty) {
    return value == null || value === "" ? (fallback == null ? empty : fallback) : value;
  }

  const api = {
    ready,
    parseConfig,
    buildRequest,
    buildUrl,
    load,
    normalize,
    featureList,
    safeText,
    MAX_INTEGER_PRICE,
  };

  root.LabPricing = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);


/* generated child JS: 14-pricing/pricing.plans-flex/block.js */
// lab-ui block · pricing.plans-flex
// Local billing toggle + cross-block sync via a document-level
// CustomEvent. Any block listening for `pricing:billing` updates
// its own [data-pricing-period] attr without coupling to this block.

(() => {
  const EVENT = "pricing:billing";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const normalize = (mode) => (mode === "annual" ? "annual" : "monthly");

  const apply = (section, mode) => {
    const next = normalize(mode);
    section.dataset.billing = next;
    section.dataset.pricingPeriod = next;
    section.querySelectorAll("[data-billing-option]").forEach((button) => {
      const active = button.dataset.billingOption === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    section.querySelectorAll("[data-period-monthly], [data-period-annual]").forEach((card) => {
      setText(card, ".pf-period", next === "annual" ? card.dataset.periodAnnual : card.dataset.periodMonthly);
    });
  };

  const broadcast = (mode, source) => {
    document.dispatchEvent(new CustomEvent(EVENT, {
      detail: { period: normalize(mode), source },
    }));
  };

  const setText = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = value || "";
  };

  const setHref = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.setAttribute("href", value || "#");
  };

  const fallbackLabel = (section, key, fallback) => (
    section.dataset[key] || fallback || ""
  );

  const dynamicCtaLabel = (section, plan) => {
    const key = plan.customPrice ? "pricingContactLabel" : "pricingBuyLabel";
    const value = section.dataset[key];
    if (value) return value;
    const slotCode = String(plan.index + 1).padStart(2, "0");
    const slot = section.querySelector('[data-plan-slot="' + slotCode + '"]');
    const existing = slot && slot.querySelector(".pf-cta");
    if (existing && existing.textContent.trim()) return existing.textContent.trim();
    return "";
  };

  const periodText = (plan) => {
    if (plan.customPrice) return "";
    return plan.intervalLabel || "";
  };

  const planPrice = (plan, mode) => {
    const prices = plan.prices || {};
    return prices[mode] || prices.monthly || plan;
  };

  const amountText = (section, plan, mode) => {
    const price = planPrice(plan, mode);
    if (price.customPrice || plan.customPrice) {
      return fallbackLabel(section, "pricingContactLabel", dynamicCtaLabel(section, plan));
    }
    return price.amountText || "";
  };

  const intervalText = (plan, mode) => {
    const price = planPrice(plan, mode);
    if (price.customPrice || plan.customPrice) return "";
    return price.intervalLabel || "";
  };

  const renderDynamicPlans = (section, pricing) => {
    const plans = pricing.plans;
    const grid = section.querySelector(".pf-grid");
    if (!grid) return;

    const templates = Array.from(grid.querySelectorAll("[data-plan-slot]"))
      .map((card) => card.cloneNode(true));
    if (!templates.length) return;

    const featuresByPlan = new Map(plans.map((plan) => [
      plan.code,
      Array.isArray(plan.cardFeatures) ? plan.cardFeatures : [],
    ]));

    grid.innerHTML = "";

    plans.forEach((plan, index) => {
      const card = (templates[index] || templates[0]).cloneNode(true);
      card.dataset.planSlot = String(index + 1).padStart(2, "0");
      card.dataset.planVisible = "show";
      card.dataset.planCode = plan.code;
      card.classList.remove("pf-card--featured", "pf-card--muted");
      if (plan.cardState && plan.cardState !== "standard") {
        card.classList.add("pf-card--" + plan.cardState);
      }
      setText(card, ".pf-kicker", plan.kicker);
      setText(card, ".pf-badge", plan.badge);
      setText(card, ".pf-name", plan.name);
      setText(card, ".pf-subtitle", plan.description);
      setText(card, ".pf-currency", plan.currency);
      setText(card, "[data-price-monthly]", amountText(section, plan, "monthly"));
      setText(card, "[data-price-annual]", amountText(section, plan, "annual"));
      card.dataset.periodMonthly = intervalText(plan, "monthly");
      card.dataset.periodAnnual = intervalText(plan, "annual");
      setText(card, ".pf-period", periodText(plan));
      setText(card, ".pf-card-save", "");
      setText(card, "[data-billed-monthly]", intervalText(plan, "monthly"));
      setText(card, "[data-billed-annual]", intervalText(plan, "annual"));

      const ctaLabel = dynamicCtaLabel(section, plan);
      setText(card, ".pf-cta", ctaLabel);
      setHref(card, ".pf-cta", pricing.config.purchaseUrl);

      const price = card.querySelector(".pf-price");
      if (price) {
        price.setAttribute("aria-label", (plan.name + " " + (plan.customPrice ? ctaLabel : plan.amountText)).trim());
      }

      const list = card.querySelector(".pf-features");
      if (list) {
        const listLabel = section.dataset.pricingFeatureListLabel || list.getAttribute("aria-label") || "";
        if (listLabel) list.setAttribute("aria-label", listLabel);
        list.innerHTML = "";
        for (const feature of featuresByPlan.get(plan.code) || []) {
          const item = document.createElement("li");
          item.textContent = feature;
          list.appendChild(item);
        }
      }

      setText(card, ".pf-disclaimer", "");
      grid.appendChild(card);
    });

    if (grid) grid.dataset.planCount = String(plans.length);
    section.dataset.pricingState = plans.length ? "dynamic" : "fallback";
    apply(section, section.dataset.billing);
  };

  const loadDynamic = (section) => {
    if (!window.LabPricing) {
      section.dataset.pricingState = "fallback";
      return;
    }
    const config = window.LabPricing.parseConfig(section);
    if (!config.enabled) {
      section.dataset.pricingState = "fallback";
      return;
    }

    section.dataset.pricingState = "loading";
    window.LabPricing.load(section)
      .then((pricing) => {
        if (!pricing.ok || !pricing.plans.length) {
          section.dataset.pricingState = "fallback";
          return;
        }
        renderDynamicPlans(section, pricing);
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
      });
  };

  const init = (section) => {
    if (section.dataset.pfInit === "1") return;
    section.dataset.pfInit = "1";

    apply(section, section.dataset.billing);

    section.querySelectorAll("[data-billing-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = normalize(button.dataset.billingOption);
        apply(section, next);
        broadcast(next, section);
      });
    });

    document.addEventListener(EVENT, (event) => {
      if (!event.detail || event.detail.source === section) return;
      apply(section, event.detail.period);
    });

    loadDynamic(section);
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.plans-flex"]').forEach(init);
  });
})();


/* generated child JS: 14-pricing/pricing.credits-meter/block.js */
// lab-ui block · pricing.credits-meter
// Mirrors cross-block billing changes and can opt into the shared
// LabPricing runtime for routing-token price tiers.

(() => {
  const EVENT = "pricing:billing";
  const TOKEN_ATTRIBUTE = "ROUTING_TOKENS";
  const LOREM = "Lorem ipsum";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const apply = (section, mode) => {
    section.dataset.pricingPeriod = mode === "annual" ? "annual" : "monthly";
  };

  const setText = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = value || "";
  };

  const setHref = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.setAttribute("href", value || "#");
  };

  const text = (value) => (
    window.LabPricing ? window.LabPricing.safeText(value) : String(value == null ? "" : value).trim()
  );

  const tokenAmount = (plan) => {
    const attributes = plan && plan.row && plan.row.product && plan.row.product.attributes;
    if (!attributes) return "";

    for (const values of Object.values(attributes)) {
      const raw = values && values[TOKEN_ATTRIBUTE];
      if (raw && raw.value != null && raw.value !== "") return text(raw.value);
    }
    return "";
  };

  const formatCurrency = (plan, locale) => {
    if (!plan || plan.customPrice) return "";
    const amount = Number(plan.amount);
    if (!Number.isFinite(amount)) return plan.amountText || "";

    const currency = plan.currency || "CAD";
    try {
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount) + (currency ? " " + currency : "");
    } catch (error) {
      return ((plan.amountText || amount) + " " + currency).trim();
    }
  };

  const dynamicPriceLabel = (section, plan, locale) => {
    if (plan.customPrice) {
      return section.dataset.pricingContactLabel || "";
    }
    return formatCurrency(plan, locale);
  };

  const fallbackText = (root, selector) => {
    const node = root.querySelector(selector);
    return node ? node.textContent.trim() : "";
  };

  const planDetails = (plan, groups) => {
    const details = [];
    for (const group of groups || []) {
      for (const attr of group.attributes || []) {
        const value = attr.values && attr.values[plan.index];
        if (!value || value.state === "no" || value.state === "empty") continue;
        details.push({
          code: attr.code,
          label: attr.label,
          state: value.state,
          text: value.text || "",
        });
      }
    }
    return details;
  };

  const renderPackDetails = (pack, details) => {
    const existing = pack.querySelector(".cm-pack-details");
    if (existing) existing.remove();
    if (!details.length) return;

    const list = document.createElement("dl");
    list.className = "cm-pack-details";

    for (const detail of details) {
      const item = document.createElement("div");
      item.className = "cm-pack-detail";
      item.dataset.attributeCode = detail.code;
      item.dataset.state = detail.state;

      const label = document.createElement("dt");
      label.textContent = detail.label;
      item.appendChild(label);

      if (detail.text) {
        const value = document.createElement("dd");
        value.dataset.state = detail.state;
        value.textContent = detail.text;
        item.appendChild(value);
      }

      list.appendChild(item);
    }

    pack.appendChild(list);
  };

  const renderDynamicPacks = (section, pricing) => {
    const plans = pricing.plans;
    const packList = section.querySelector(".cm-packs");
    if (!packList) return;

    const templates = Array.from(packList.querySelectorAll(".cm-pack:not(.cm-pack--skeleton)"))
      .map((pack) => pack.cloneNode(true));
    if (!templates.length) return;

    packList.innerHTML = "";

    plans.forEach((plan, index) => {
      const pack = (templates[index] || templates[0]).cloneNode(true);
      const tokens = tokenAmount(plan);
      pack.dataset.packVisible = "show";
      pack.dataset.planCode = plan.code;
      setText(pack, ".cm-pack-badge", "");
      setText(pack, ".cm-pack-name", plan.name);
      setText(pack, ".cm-pack-amount", tokens || plan.amountText || "");

      const unit = document.createElement("span");
      unit.className = "cm-pack-unit";
      unit.textContent = tokens
        ? (section.dataset.pricingTokenUnitLabel || fallbackText(pack, ".cm-pack-unit"))
        : "";
      const amount = pack.querySelector(".cm-pack-amount");
      if (amount && unit.textContent) amount.appendChild(unit);

      setText(pack, ".cm-pack-price", dynamicPriceLabel(section, plan, pricing.config.locale));
      setText(pack, ".cm-pack-rate", pricing.config.lorem
        ? LOREM
        : (plan.customPrice
            ? (section.dataset.pricingTokenCustomRateLabel || fallbackText(pack, ".cm-pack-rate"))
            : (section.dataset.pricingTokenRateLabel || fallbackText(pack, ".cm-pack-rate"))));
      renderPackDetails(pack, planDetails(plan, pricing.groups));
      packList.appendChild(pack);
    });

    setHref(section, ".cm-packs-cta", pricing.config.purchaseUrl);
    const cta = section.querySelector(".cm-packs-cta");
    if (cta && section.dataset.pricingBuyLabel) cta.textContent = section.dataset.pricingBuyLabel;

    section.dataset.pricingState = plans.length ? "dynamic" : "fallback";
  };

  const loadDynamic = (section) => {
    if (!window.LabPricing) {
      section.dataset.pricingState = "fallback";
      return;
    }
    const config = window.LabPricing.parseConfig(section);
    if (!config.enabled) {
      section.dataset.pricingState = "fallback";
      return;
    }

    section.dataset.pricingState = "loading";
    window.LabPricing.load(section)
      .then((pricing) => {
        if (!pricing.ok || !pricing.plans.length) {
          section.dataset.pricingState = "fallback";
          return;
        }
        renderDynamicPacks(section, pricing);
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
      });
  };

  const init = (section) => {
    if (section.dataset.cmInit === "1") return;
    section.dataset.cmInit = "1";
    apply(section, section.dataset.pricingPeriod);

    document.addEventListener(EVENT, (event) => {
      if (!event.detail) return;
      apply(section, event.detail.period);
    });

    loadDynamic(section);
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.credits-meter"]').forEach(init);
  });
})();


/* generated child JS: 14-pricing/pricing.matrix-collapsible/block.js */
// lab-ui block · pricing.matrix-collapsible
// Listens for the cross-block `pricing:billing` CustomEvent and
// mirrors the period on the section root so any downstream rule
// like `.mx-matrix[data-pricing-period="annual"] [data-price-monthly]`
// can hide / show period-specific values without coupling to other blocks.

(() => {
  const EVENT = "pricing:billing";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const apply = (section, mode) => {
    section.dataset.pricingPeriod = mode === "annual" ? "annual" : "monthly";
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const append = (parent, child) => {
    parent.appendChild(child);
    return child;
  };

  const stateLabel = (section, state) => {
    const labels = {
      yes: section.dataset.stateLabelYes,
      no: section.dataset.stateLabelNo,
      partial: section.dataset.stateLabelPartial,
      empty: section.dataset.stateLabelEmpty || "",
    };
    return labels[state] || "";
  };

  const setStateA11y = (section, cell, state, valueNode) => {
    const label = stateLabel(section, state);
    if (label && valueNode && !valueNode.textContent.trim()) {
      cell.setAttribute("aria-label", label);
    }
  };

  const planCtaLabel = (section, plan) => {
    if (plan.customPrice && section.dataset.pricingContactLabel) return section.dataset.pricingContactLabel;
    if (!plan.customPrice && section.dataset.pricingBuyLabel) return section.dataset.pricingBuyLabel;
    const slot = String(plan.index + 1).padStart(2, "0");
    const existing = section.querySelector('.mx-row--cta [data-plan-col="' + slot + '"] .mx-cta');
    return existing ? existing.textContent.trim() : "";
  };

  const planCol = (index) => String(index + 1).padStart(2, "0");

  const renderHead = (section, table, plans) => {
    const row = append(table, el("div", "mx-row mx-row--head"));
    row.setAttribute("role", "row");
    const feature = append(row, el("div", "mx-cell mx-cell--feature", section.dataset.featureColumnLabel || ""));
    feature.setAttribute("role", "columnheader");

    plans.forEach((plan) => {
      const cell = append(row, el("div", "mx-cell mx-cell--plan"));
      cell.setAttribute("role", "columnheader");
      cell.dataset.planCol = planCol(plan.index);
      append(cell, el("span", "mx-plan-name", plan.name));
      append(cell, el("span", "mx-plan-tag", plan.customPrice ? (section.dataset.pricingContactLabel || "") : plan.currency));
    });
  };

  const renderTableGroup = (section, table, group, plans) => {
    const groupNode = append(table, el("div", "mx-group"));
    groupNode.setAttribute("role", "rowgroup");
    groupNode.dataset.groupVisible = "show";

    const titleRow = append(groupNode, el("div", "mx-row--group"));
    titleRow.setAttribute("role", "row");
    const title = append(titleRow, el("div", "mx-group-title", group.label));
    title.setAttribute("role", "rowheader");

    group.attributes.forEach((attr) => {
      const row = append(groupNode, el("div", "mx-row"));
      row.setAttribute("role", "row");
      row.dataset.rowVisible = "show";

      const feature = append(row, el("div", "mx-cell mx-cell--feature"));
      feature.setAttribute("role", "rowheader");
      append(feature, el("span", "mx-feature-label", attr.label));
      append(feature, el("span", "mx-feature-hint", attr.description));

      plans.forEach((plan) => {
        const value = attr.values[plan.index] || { state: "empty", text: "" };
        const cell = append(row, el("div", "mx-cell"));
        cell.setAttribute("role", "cell");
        cell.dataset.planCol = planCol(plan.index);
        cell.dataset.state = value.state;
        append(cell, el("span", "mx-mobile-plan", plan.name));
        const valueNode = append(cell, el("span", "mx-value", value.text));
        setStateA11y(section, cell, value.state, valueNode);
      });
    });
  };

  const renderCtaRow = (section, table, plans, config) => {
    const row = append(table, el("div", "mx-row mx-row--cta"));
    row.setAttribute("role", "row");
    row.dataset.rowVisible = "show";
    const feature = append(row, el("div", "mx-cell mx-cell--feature"));
    feature.setAttribute("role", "rowheader");
    append(feature, el("span", "mx-feature-label", section.dataset.ctaRowLabel || ""));

    plans.forEach((plan) => {
      const cell = append(row, el("div", "mx-cell"));
      cell.setAttribute("role", "cell");
      cell.dataset.planCol = planCol(plan.index);
      const link = append(cell, el("a", "mx-cta", planCtaLabel(section, plan)));
      link.href = config.purchaseUrl || "#";
    });
  };

  const renderAccordion = (section, accordion, groups, plans, config) => {
    plans.forEach((plan, index) => {
      const details = append(accordion, el("details", "mx-acc"));
      details.dataset.planCol = planCol(plan.index);
      if (index === 1 || (plans.length < 2 && index === 0)) details.open = true;

      const summary = append(details, el("summary", "mx-acc-summary"));
      append(summary, el("span", "mx-acc-name", plan.name));
      append(summary, el("span", "mx-acc-tag", plan.customPrice ? (section.dataset.pricingContactLabel || "") : plan.currency));
      const chev = append(summary, el("span", "mx-acc-chev"));
      chev.setAttribute("aria-hidden", "true");

      const body = append(details, el("div", "mx-acc-body"));
      groups.forEach((group) => {
        const groupNode = append(body, el("div", "mx-acc-group"));
        groupNode.dataset.groupVisible = "show";
        append(groupNode, el("p", "mx-acc-group-title", group.label));
        const list = append(groupNode, el("dl", "mx-acc-list"));

        group.attributes.forEach((attr) => {
          const value = attr.values[plan.index] || { state: "empty", text: "" };
          const item = append(list, el("div", "mx-acc-item"));
          item.dataset.rowVisible = "show";
          append(item, el("dt", "", attr.label));
          const dd = append(item, el("dd", "", value.text));
          dd.dataset.state = value.state;
          setStateA11y(section, dd, value.state, dd);
        });
      });

      const link = append(body, el("a", "mx-acc-cta", planCtaLabel(section, plan)));
      link.dataset.rowVisible = "show";
      link.href = config.purchaseUrl || "#";
    });
  };

  const renderDynamicMatrix = (section, pricing) => {
    const plans = pricing.plans;
    if (!plans.length || !pricing.groups.length) return;

    section.dataset.columns = String(plans.length);
    section.style.setProperty("--mx-plan-cols", String(plans.length));

    const table = section.querySelector(".mx-shell--table");
    if (table) {
      table.innerHTML = "";
      renderHead(section, table, plans);
      pricing.groups.forEach((group) => renderTableGroup(section, table, group, plans));
      renderCtaRow(section, table, plans, pricing.config);
    }

    const accordion = section.querySelector(".mx-shell--accordion");
    if (accordion) {
      accordion.innerHTML = "";
      renderAccordion(section, accordion, pricing.groups, plans, pricing.config);
    }

    labelStates(section);
    section.dataset.pricingState = "dynamic";
  };

  const loadDynamic = (section) => {
    if (!window.LabPricing) {
      section.dataset.pricingState = "fallback";
      return;
    }
    const config = window.LabPricing.parseConfig(section);
    if (!config.enabled) {
      section.dataset.pricingState = "fallback";
      return;
    }

    section.dataset.pricingState = "loading";
    window.LabPricing.load(section)
      .then((pricing) => {
        if (!pricing.ok || !pricing.plans.length || !pricing.groups.length) {
          section.dataset.pricingState = "fallback";
          return;
        }
        renderDynamicMatrix(section, pricing);
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
      });
  };

  // Icon-only cells (yes/no/partial with an empty value) carry their
  // meaning in CSS pseudo-elements; give them an accessible name from
  // the localized state labels on the section root.
  const labelStates = (section) => {
    const labels = {
      yes: section.dataset.stateLabelYes,
      no: section.dataset.stateLabelNo,
      partial: section.dataset.stateLabelPartial,
      empty: section.dataset.stateLabelEmpty,
    };
    section.querySelectorAll("[data-state]").forEach((el) => {
      const label = labels[el.dataset.state];
      if (!label) return;
      const value = el.matches("dd") ? el : el.querySelector(".mx-value");
      if (value && !value.textContent.trim()) el.setAttribute("aria-label", label);
    });
  };

  const init = (section) => {
    if (section.dataset.mxInit === "1") return;
    section.dataset.mxInit = "1";
    apply(section, section.dataset.pricingPeriod);
    labelStates(section);

    document.addEventListener(EVENT, (event) => {
      if (!event.detail) return;
      apply(section, event.detail.period);
    });

    loadDynamic(section);
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.matrix-collapsible"]').forEach(init);
  });
})();
