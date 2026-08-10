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
  const PRODUCT_CTA_ATTRIBUTES = {
    label: ["CTA_LABEL"],
    url: ["CTA_LINK", "CTA_URL"],
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
    const locale = normalizeLocale(
      firstValue(dataset.pricingLocale, localeCandidate(root.__swLocale), documentLocale, "en")
    );
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
      nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"],
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
      name: dynamicText(localizedField(
        product.nls,
        "NAME",
        config.locale,
        localizedScalar(product.name, config.locale)
      ), config),
      description: dynamicText(localizedField(
        product.nls,
        "DESCRIPTION",
        config.locale,
        localizedScalar(product.description, config.locale)
      ), config),
      kicker: productAttributeText(row, PLAN_MARKETING_ATTRIBUTES.kicker, config),
      badge: productAttributeText(row, PLAN_MARKETING_ATTRIBUTES.badge, config),
      cardState: normalizeCardState(productAttributeText(row, PLAN_MARKETING_ATTRIBUTES.cardState, config)),
      cardFeatures: productAttributeTexts(row, PLAN_CARD_FEATURE_ATTRIBUTES, config),
      ctaLabel: productAttributeFirstText(row, PRODUCT_CTA_ATTRIBUTES.label, config),
      ctaUrl: productAttributeFirstRawText(row, PRODUCT_CTA_ATTRIBUTES.url, config),
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
    const product = productFromRow(row);
    return safeText(product.code || "");
  }

  function productFromRow(row) {
    const productWrapper = (row && row.product) || {};
    return productWrapper.product || productWrapper;
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
    return localizedField(direct.nls, "NAME", config.locale, localizedScalar(direct.value, config.locale));
  }

  function priceUnitLabel(row, config) {
    const price = row && row.price;
    const direct = valueFor(price, { code: config.pricePeriodUnitAttributeCode });
    if (!direct) return "";
    return localizedField(direct.nls, "NAME", config.locale, localizedScalar(direct.value, config.locale));
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
            if (isProductCtaAttribute(order.attributeCode)) continue;
            if (order.visible === false) continue;
            const attr = attrs[order.attributeCode];
            if (!attr || !hasAnyValue(rows, order.typeId, order.attributeCode)) continue;
            attributes.push({
              typeId: order.typeId,
              code: order.attributeCode,
              label: dynamicText(localizedField(
                attr.nls,
                "NAME",
                config.locale,
                localizedScalar(attr.name, config.locale, order.attributeCode)
              ), config),
              description: dynamicText(localizedField(
                attr.nls,
                "DESCRIPTION",
                config.locale,
                localizedScalar(attr.description, config.locale)
              ), config),
              placeholder: dynamicText(localizedField(
                attr.nls,
                "PLACEHOLDER",
                config.locale,
                localizedScalar(attr.placeholder, config.locale)
              ), config),
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

  function isProductCtaAttribute(code) {
    const attributeCode = safeText(code).toUpperCase();
    return Object.values(PRODUCT_CTA_ATTRIBUTES).some((codes) => codes.includes(attributeCode));
  }

  function normalizeValue(raw, config) {
    if (raw == null) {
      return { state: "empty", text: "" };
    }
    if (raw.value === true || raw.value === "true") {
      return { state: "yes", text: "" };
    }
    if (raw.value === false || raw.value === "false") {
      return { state: "no", text: "" };
    }

    const fallback = localizedScalar(raw.value, config.locale);
    const value = localizedField(raw.nls, "NAME", config.locale, fallback);
    if (value == null || value === "") return { state: "empty", text: "" };
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
    const productWrapper = (row && row.product) || {};
    const product = productWrapper.product || productWrapper;
    const attributes = productWrapper.attributes || product.attributes;
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
    const value = productAttributeRawText(row, code, config);
    return dynamicText(value, config);
  }

  function productAttributeRawText(row, code, config) {
    const raw = productAttribute(row, code);
    if (!raw) return "";
    const fallback = localizedScalar(raw.value, config.locale);
    return safeText(localizedField(raw.nls, "NAME", config.locale, fallback));
  }

  function productAttributeFirstText(row, codes, config) {
    const value = productAttributeFirstRawText(row, codes, config);
    return dynamicText(value, config);
  }

  function productAttributeFirstRawText(row, codes, config) {
    for (const code of codes || []) {
      const value = productAttributeRawText(row, code, config);
      if (value) return value;
    }
    return "";
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
    const productWrapper = (row && row.product) || {};
    const product = productWrapper.product || productWrapper;
    const attributes = productWrapper.attributes || product.attributes;
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
    return localizedField(
      group && group.nls,
      "NAME",
      locale,
      localizedScalar(group && group.name, locale, groupCode)
    );
  }

  function localized(nls, locale) {
    if (!nls) return {};
    if (typeof nls !== "object") return nls;
    if (hasLocalizedFields(nls)) return nls;
    return localeValue(nls, locale)
      || nls.default
      || nls.DEFAULT
      || nls.defaultValue
      || {};
  }

  function localizedField(value, field, locale, fallback) {
    if (value == null || value === "") return localizedScalar(fallback, locale);
    if (typeof value !== "object") return value;

    const entry = localized(value, locale);
    const fallbackValue = localizedScalar(fallback, locale);
    if (entry != null && entry !== "" && typeof entry !== "object") return entry;

    const currentValue = localizedScalar(fieldValue(entry, field), locale, fallbackValue);
    if (currentValue != null && currentValue !== "") return currentValue;
    return defaultLocalizedField(value, field);
  }

  function fieldValue(entry, field) {
    if (!entry || typeof entry !== "object") return undefined;
    return entry[field]
      ?? entry[field.toLowerCase()]
      ?? entry[field[0] + field.slice(1).toLowerCase()];
  }

  function defaultLocalizedField(value, field) {
    if (!value || typeof value !== "object") return "";

    const direct = defaultScalar(fieldValue(value, field));
    if (direct !== "") return direct;

    const keys = Object.keys(value);
    const preferredEntries = ["default", "DEFAULT", "defaultValue", "en"]
      .map((key) => keys.find((candidate) => normalizeLocaleKey(candidate) === normalizeLocaleKey(key)))
      .filter(Boolean)
      .map((key) => value[key]);
    const entries = [...preferredEntries, ...Object.values(value)];
    for (const entry of entries) {
      const candidate = defaultScalar(fieldValue(entry, field));
      if (candidate !== "") return candidate;
    }
    return "";
  }

  function defaultScalar(value) {
    if (value == null || value === "") return "";
    if (typeof value !== "object") return value;

    const direct = value.NAME ?? value.name ?? value.LABEL ?? value.label ?? value.VALUE ?? value.value ?? value.text;
    if (direct != null && direct !== value) return defaultScalar(direct);

    const explicit = value.default ?? value.DEFAULT ?? value.defaultValue ?? value.fallback;
    if (explicit != null && explicit !== value) return defaultScalar(explicit);

    const keys = Object.keys(value);
    const englishKey = keys.find((key) => normalizeLocaleKey(key) === "en");
    if (englishKey) {
      const english = defaultScalar(value[englishKey]);
      if (english !== "") return english;
    }

    for (const candidate of Object.values(value)) {
      if (candidate === value) continue;
      const resolved = defaultScalar(candidate);
      if (resolved !== "") return resolved;
    }
    return "";
  }

  function localizedScalar(value, locale, fallback) {
    if (value == null || value === "") {
      return fallback == null || fallback === value ? "" : localizedScalar(fallback, locale);
    }
    if (typeof value !== "object") return value;

    const localizedValue = localeValue(value, locale);
    if (localizedValue != null && localizedValue !== value) {
      return localizedScalar(localizedValue, locale, fallback);
    }

    const direct = value.NAME ?? value.name ?? value.LABEL ?? value.label ?? value.VALUE ?? value.value ?? value.text;
    if (direct != null && direct !== value) return localizedScalar(direct, locale, fallback);

    const defaultValue = value.default ?? value.DEFAULT ?? value.defaultValue ?? value.fallback;
    if (defaultValue != null && defaultValue !== value) {
      return localizedScalar(defaultValue, locale, fallback);
    }

    return fallback == null || fallback === value ? "" : localizedScalar(fallback, locale);
  }

  function hasLocalizedFields(value) {
    return ["NAME", "name", "DESCRIPTION", "description", "PLACEHOLDER", "placeholder"]
      .some((key) => Object.prototype.hasOwnProperty.call(value, key));
  }

  function localeValue(value, locale) {
    if (!value || typeof value !== "object") return undefined;
    const normalized = normalizeLocale(locale);
    const language = normalized.split("-")[0];
    const keys = Object.keys(value);
    const exactKey = keys.find((key) => normalizeLocaleKey(key) === normalized.toLowerCase());
    if (exactKey) return value[exactKey];
    const languageKey = keys.find((key) => normalizeLocaleKey(key) === language.toLowerCase());
    return languageKey ? value[languageKey] : undefined;
  }

  function normalizeLocaleKey(value) {
    return String(value || "").trim().replace(/_/g, "-").toLowerCase();
  }

  function resolveText(value, locale, fallback) {
    return safeText(localizedScalar(value, locale, fallback));
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
    return Number(value).toLocaleString(normalizeLocale(locale) || undefined, { maximumFractionDigits: 2 });
  }

  function localeCandidate(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if (typeof value.getEffectiveLocale === "function") return value.getEffectiveLocale();
      if (typeof value.locale === "string") return value.locale;
      if (typeof value.code === "string") return value.code;
      if (typeof value.code2 === "string") return value.code2;
    }
    return "";
  }

  function normalizeLocale(value) {
    const locale = typeof value === "string" ? value.trim() : "";
    if (!locale || locale === "[object Object]") return "en";
    try {
      return Intl.getCanonicalLocales(locale)[0] || "en";
    } catch (error) {
      return "en";
    }
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

  const api = {
    ready,
    parseConfig,
    buildRequest,
    buildUrl,
    load,
    normalize,
    featureList,
    resolveText,
    safeText,
    MAX_INTEGER_PRICE,
  };

  root.LabPricing = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
