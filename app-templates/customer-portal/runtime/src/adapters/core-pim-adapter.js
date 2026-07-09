const API_PATH = "/public/{organization}/catalog/price-comparison.json";

export const corePimAdapter = {
  supports(moduleId) {
    return moduleId === "pricing" || moduleId === "products";
  },

  async load(moduleId, context) {
    if (!this.supports(moduleId)) throw new Error("Core PIM adapter does not support " + moduleId);
    var config = context.config || {};
    var request = buildRequest(config);
    var data = await fetchPim(request);
    var plans = normalizePimRows(data, config);
    if (moduleId === "pricing") return { pimPlans: plans };
    return { pimProducts: plans };
  },
};

function buildRequest(config) {
  var payload = {
    productTypeCode: config.pimProductTypeCode || "SERVICEWAND_SAAS",
    includeChildProductTypes: true,
    priceTypeCode: "RECURRENT",
    includeChildPriceTypes: true,
    priceAttributeCode: "INTERVAL",
    priceAttributeValues: ["1"],
    currencyAttributeCode: "CURRENCY",
    currencyAttributeValues: [config.pimCurrency || "CAD"],
    nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"],
  };

  return {
    url: config.pimFixtureUrl || buildUrl(config),
    fixture: !!config.pimFixtureUrl,
    payload: payload,
  };
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
    var amount = Number(display.amount);
    var customPrice = !!display.customPrice || !Number.isFinite(amount) || amount >= 2147483647;
    return {
      id: product.code || "pim-" + index,
      code: product.code || "pim-" + index,
      name: nls.NAME || product.code || "Plan",
      description: stripHtml(nls.DESCRIPTION || ""),
      price: customPrice ? "Custom" : formatCurrency(amount, display.currency || config.pimCurrency || "CAD"),
      priceNum: customPrice ? 0 : amount,
      currency: customPrice ? "" : display.currency || config.pimCurrency || "CAD",
      interval: display.intervalLabel || "1 Month",
      cta: customPrice ? "Contact us" : "Choose plan",
      attributes: product.attributes || {},
      allowedActions: customPrice ? ["support.open"] : ["cart.addItem"],
      row: row,
    };
  });
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
