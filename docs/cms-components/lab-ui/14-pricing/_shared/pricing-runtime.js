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
            if (isSortAttribute(order.attributeCode, config)) continue;
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

  function isSortAttribute(code, config) {
    const attributeCode = safeText(code).toUpperCase();
    const sortCode = safeText(config && config.productSortAttributeCode).toUpperCase();
    return !!attributeCode && !!sortCode && attributeCode === sortCode;
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
