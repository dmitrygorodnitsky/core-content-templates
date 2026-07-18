const API_PATH = "/public/{organization}/catalog/price-comparison.json";

export const corePimAdapter = {
  supports(moduleId) {
    return moduleId === "services" || moduleId === "pricing" || moduleId === "products";
  },

  async load(moduleId, context) {
    if (!this.supports(moduleId)) throw new Error("Core PIM adapter does not support " + moduleId);
    var config = context.config || {};
    var requests = productTypeCodes(config, moduleId).map(function (productTypeCode) {
      return buildRequest(config, productTypeCode);
    });
    var responses = await Promise.all(requests.map(async function (request) {
      return { data: await fetchPim(request), productTypeCode: request.payload.productTypeCode };
    }));
    var plans = normalizePimRows({ prices: responses.flatMap(function (response) {
      return (Array.isArray(response.data && response.data.prices) ? response.data.prices : []).map(function (row) {
        return Object.assign({ __productTypeCode: response.productTypeCode }, row);
      });
    }) }, config);
    if (moduleId === "pricing" || moduleId === "services") return { pimPlans: plans };
    return { pimProducts: plans };
  },
};

function buildRequest(config, productTypeCode) {
  var payload = {
    productTypeCode: productTypeCode,
    includeChildProductTypes: true,
    priceTypeCode: config.pimPriceTypeCode || "RECURRENT",
    includeChildPriceTypes: true,
    priceAttributeCode: config.pimPriceAttributeCode || "INTERVAL",
    priceAttributeValues: configuredValues(config.pimPriceAttributeValues, ["1"]),
    currencyAttributeCode: config.pimCurrencyAttributeCode || "CURRENCY",
    currencyAttributeValues: configuredValues(config.pimCurrencyAttributeValues, [config.pimCurrency || "CAD"]),
    nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"],
  };

  return {
    url: config.pimFixtureUrl || buildUrl(config),
    fixture: !!config.pimFixtureUrl,
    payload: payload,
  };
}

function productTypeCodes(config, moduleId) {
  var configured = moduleId === "pricing" || moduleId === "services" ? config.pimPricingProductTypeCodes : config.pimProductsProductTypeCodes;
  var values = configuredValues(configured, [config.pimProductTypeCode || "SERVICEWAND_SAAS"]);
  return Array.from(new Set(values));
}

async function fetchPim(request) {
  if (!window.fetch) throw new Error("fetch is not available");
  var options = request.fixture
    ? { method: "GET", headers: { Accept: "application/json" } }
    : {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(request.payload),
      };
  var response = await window.fetch(request.url, options);
  if (!response.ok) throw new Error("Core PIM HTTP " + response.status);
  return response.json();
}

function buildUrl(config) {
  var organization = encodeURIComponent(config.pimOrganization || "SERVICEWAND");
  var path = API_PATH.replace("{organization}", organization);
  var base = String(config.pimApiBase || "/core-pim/api").trim().replace(/\/+$/, "");
  base = base.replace(/\/api$/, "");
  if (/^https?:\/\//i.test(base)) return base + path;
  return "/" + base.replace(/^\/+/, "") + path;
}

function normalizePimRows(data, config) {
  var rows = Array.isArray(data && data.prices) ? data.prices.slice() : [];
  rows.sort(function (left, right) {
    return sortPriority(left) - sortPriority(right);
  });
  return rows.map(function (row, index) {
    var product = productFromRow(row);
    var nls = localized(product.nls, "en");
    var display = (row.price && row.price.display) || {};
    var currency = display.currency || attributeValue(row.price, config.pimCurrencyAttributeCode || "CURRENCY") || config.pimCurrency || "CAD";
    var interval = display.intervalLabel || attributeValue(row.price, config.pimPriceAttributeCode || "INTERVAL") || "1 Month";
    var amount = displayAmount(row.price, config);
    var customPrice = !!display.customPrice || !Number.isFinite(amount) || amount >= 2147483647;
    return {
      id: product.code || "pim-" + index,
      code: product.code || "pim-" + index,
      name: nls.NAME || product.code || "Plan",
      description: stripHtml(nls.DESCRIPTION || ""),
      price: customPrice ? "Custom" : formatCurrency(amount, currency),
      priceNum: customPrice ? 0 : amount,
      currency: customPrice ? "" : currency,
      interval: formatInterval(interval),
      cta: customPrice ? "Contact us" : config.pimCta || "Choose plan",
      attributes: product.attributes || {},
      productTypeCode: product.type && product.type.code || row.productTypeCode || row.__productTypeCode || "",
      allowedActions: customPrice ? ["support.open"] : ["cart.addItem"],
      row: row,
    };
  });
}

function configuredValues(value, fallback) {
  if (Array.isArray(value) && value.length) return value.map(String);
  if (typeof value === "string" && value.trim()) return value.split(",").map(function (item) { return item.trim(); }).filter(Boolean);
  return fallback;
}

function displayAmount(price, config) {
  var display = price && price.display || {};
  var displayed = Number(display.amount);
  if (Number.isFinite(displayed)) return displayed;
  var minor = Number(attributeValue(price, config.pimAmountAttributeCode || "AMOUNT_MINOR"));
  if (!Number.isFinite(minor)) return NaN;
  var divisor = Number(config.pimAmountMinorDivisor);
  return minor / (Number.isFinite(divisor) && divisor > 0 ? divisor : 100);
}

function attributeValue(price, code) {
  var groups = price && price.attributes;
  if (!groups || typeof groups !== "object") return null;
  for (var group of Object.values(groups)) {
    var attribute = group && group[code];
    if (attribute && attribute.value !== undefined && attribute.value !== null) return attribute.value;
  }
  return null;
}

function formatInterval(value) {
  var normalized = String(value || "").toUpperCase();
  if (normalized === "ONE_TIME") return "One time";
  if (normalized === "MONTH") return "Monthly";
  return String(value || "1 Month");
}

function productFromRow(row) {
  var wrapper = (row && row.product) || {};
  return wrapper.product || wrapper;
}

function localized(nls, locale) {
  return (nls && (nls[locale] || nls.en)) || {};
}

function sortPriority(row) {
  var attributes = ((row.product || {}).attributes || {});
  for (var group of Object.values(attributes)) {
    if (group && group.SORT_ORDER_PRIORITY && Number.isFinite(Number(group.SORT_ORDER_PRIORITY.value))) {
      return Number(group.SORT_ORDER_PRIORITY.value);
    }
  }
  return 999;
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function formatCurrency(amount, currency) {
  if (!Number.isFinite(amount)) return "Custom";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "CAD",
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);
}
