(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});
  var core = ns.core;

  var PATH = "/core-pim/public/{organization}/catalog/price-comparison.json";
  var ROOT_PRODUCT_TYPE = "SERVICEWAND_ORDERED_PRODUCT";
  var PERIODS = ["MONTHLY", "YEARLY"];
  var FEATURE_ATTRIBUTES = ["PLAN_CARD_FEATURE_01", "PLAN_CARD_FEATURE_02", "PLAN_CARD_FEATURE_03", "PLAN_CARD_FEATURE_04", "PLAN_CARD_FEATURE_05"];

  function attributes(groups) {
    var flat = {};
    if (!groups || typeof groups !== "object") return flat;
    Object.keys(groups).forEach(function (group) {
      var values = groups[group];
      if (!values || typeof values !== "object") return;
      Object.keys(values).forEach(function (code) {
        if (!(code in flat)) flat[code] = values[code];
      });
    });
    return flat;
  }

  function value(entry) {
    return entry && typeof entry === "object" && "value" in entry ? entry.value : entry;
  }

  function localized(entry, locale) {
    var raw = value(entry);
    if (typeof raw === "string") return raw;
    return core.nls(raw, locale);
  }

  function period(row) {
    var display = row.price && row.price.display;
    var label = String(display && display.intervalLabel || "").toLowerCase();
    var interval = value(attributes(row.price && row.price.attributes).INTERVAL);
    if (interval !== undefined && interval !== null && Number(interval) !== 1) return "";
    if (/\b(year|annual|annually|yearly)\b/.test(label)) return "YEARLY";
    if (/\b(month|monthly)\b/.test(label)) return "MONTHLY";
    return "";
  }

  function licensed(row) {
    var priceAttributes = attributes(row.price && row.price.attributes);
    var usage = value(priceAttributes.USAGE_TYPE);
    var fee = value(priceAttributes.FIXED_FEE);
    return (usage === undefined || usage === null || String(usage).toLowerCase() === "licensed") && !(Number(fee) > 0);
  }

  function positiveIntegerString(raw) {
    var text = typeof raw === "number" ? String(raw) : String(raw == null ? "" : raw).trim();
    return /^[1-9][0-9]{0,8}$/.test(text) ? Number(text) : null;
  }

  function idList(raw) {
    return (Array.isArray(raw) ? raw : []).map(Number).filter(function (id) { return Number.isInteger(id) && id > 0; });
  }

  function request() {
    return {
      productTypeCode: ROOT_PRODUCT_TYPE,
      includeChildProductTypes: true,
      priceTypeCode: "RECURRENT",
      includeChildPriceTypes: true,
      nlsKeys: ["NAME", "DESCRIPTION"],
    };
  }

  function url(base, organization) {
    return base + PATH.replace("{organization}", encodeURIComponent(organization || "SERVICEWAND"));
  }

  function normalize(data, rules, locale) {
    var settings = rules || {};
    var planCodes = settings.planCodes || [];
    var expansionCodes = settings.siteExpansionCodes || [];
    var weatherCode = settings.weatherCode || "";
    var maxima = settings.maximumByPlanCode || {};
    var rows = Array.isArray(data && data.prices) ? data.prices : [];
    var currency = settings.currency || "";
    var products = {};

    rows.forEach(function (row) {
      var wrapper = row && row.product;
      var product = wrapper && (wrapper.product || wrapper);
      if (!product || !Number.isInteger(product.id)) return;
      var display = row.price && row.price.display || {};
      var key = period(row);
      if (!key) return;
      if (!currency && display.currency) currency = display.currency;
      if (display.currency && currency && display.currency !== currency) return;
      var entry = products[product.id] || (products[product.id] = {
        product: product,
        type: wrapper.type && wrapper.type.code || "",
        attributes: attributes(wrapper.attributes),
        prices: {},
        custom: false,
        licensed: true,
      });
      if (display.customPrice) entry.custom = true;
      if (!licensed(row)) entry.licensed = false;
      var cents = core.toCents(display.amount);
      if (cents !== null && !display.customPrice) entry.prices[key] = cents;
    });

    var plans = [];
    var addons = {};
    Object.keys(products).forEach(function (id) {
      var entry = products[id];
      var product = entry.product;
      var attrs = entry.attributes;
      var name = core.nls(product.nls, locale) || product.code;
      var description = core.plainText(core.nls(product.nls, locale, "DESCRIPTION"));
      var order = Number(value(attrs.SORT_ORDER_PRIORITY)) || 0;
      var priced = PERIODS.every(function (key) { return typeof entry.prices[key] === "number"; });

      if (entry.type === "SERVICEWAND_SAAS" || planCodes.indexOf(product.code) !== -1) {
        var state = localized(attrs.PLAN_CARD_STATE, locale).toLowerCase();
        plans.push({
          id: product.id,
          code: product.code,
          name: name,
          kicker: localized(attrs.PLAN_KICKER, locale),
          description: description,
          features: FEATURE_ATTRIBUTES.map(function (code) { return localized(attrs[code], locale); }).filter(Boolean),
          included: positiveIntegerString(value(attrs.ACTIVE_PROPERTIES_INCLUDED)),
          maximum: Number.isInteger(maxima[product.code]) ? maxima[product.code] : null,
          compatibility: idList(value(attrs.COMPATIBILITY)),
          prices: entry.prices,
          featured: state.indexOf("featured") !== -1,
          selfService: planCodes.indexOf(product.code) !== -1 && !entry.custom && entry.licensed && priced,
          order: order,
        });
        return;
      }

      var role = expansionCodes.indexOf(product.code) !== -1 ? "SITE_EXPANSION" : product.code === weatherCode ? "WEATHER" : "";
      if (!role || !entry.licensed || entry.custom || !priced) return;
      var packSize = role === "SITE_EXPANSION" ? positiveIntegerString(value(attrs.COUNT)) : 1;
      if (!packSize) return;
      if (role === "WEATHER" && value(attrs.ENABLED) !== true) return;
      addons[product.id] = {
        id: product.id,
        code: product.code,
        role: role,
        name: name,
        description: description,
        packSize: packSize,
        prices: entry.prices,
      };
    });

    plans.sort(function (a, b) { return a.order - b.order || a.id - b.id; });
    return { currency: currency, plans: plans, addons: addons };
  }

  function load(options) {
    var base = options.apiBase;
    return core.request(options.fetch, url(base, options.organizationCode), { method: "POST", body: request() }).then(function (result) {
      if (result.status < 200 || result.status >= 300) throw core.failure("catalog", result.status, core.messageOf(result.payload));
      return normalize(result.payload, options.rules, options.locale);
    });
  }

  ns.catalog = Object.freeze({
    path: PATH,
    request: request,
    url: url,
    normalize: normalize,
    load: load,
  });
})(typeof window !== "undefined" ? window : globalThis);
