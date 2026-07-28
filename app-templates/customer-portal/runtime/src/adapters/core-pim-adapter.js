const API_PATH = "/public/{organization}/catalog/price-comparison.json";

// Sellability is stock truth and nothing else.
//
// `SPA_STOCK` inventory rows are the only input. Price presence, product
// lifecycle state, whether the catalog returned a row at all, and how a
// neighbouring product looks are all irrelevant: a product is buyable when an
// inventory row says a unit exists, and in no other case.
//
// Three values, and only three:
//   `sellable`      an inventory row reports a positive count
//   `out-of-stock`  an inventory row reports zero
//   `unknown`       no inventory row exists, or inventory could not be read
//
// `unknown` is NOT `sellable`. Absence of stock data is absence of permission
// to sell — the buy action stays closed rather than assuming availability.
// It is also not `out-of-stock`: the store never said the shelf was empty, so
// the presentation must not say so either.
//
// **There is no server-side backstop.** Verified live on staging 2026-07-28:
// adding `CHS_SKIN_002` — inventory count 0 — to the cart returns `200` and
// Core creates the line. The cart API does not consult inventory and will not
// refuse an out-of-stock product. This join is therefore not a nicety layered
// over a server that would catch the mistake anyway; it is the only thing
// standing between a customer and a purchase the studio cannot fulfil.
const INVENTORY_TYPE_CODE = "SPA_STOCK";
const SELLABLE = "sellable";
const OUT_OF_STOCK = "out-of-stock";
const STOCK_UNKNOWN = "unknown";

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
    var enrichment = await loadProductEnrichment(context, plans);
    return {
      pimProducts: plans.map(function (product) {
        var model = enrichment.modelsByProductCode[product.code] || null;
        var sellability = enrichment.sellabilityByProductCode[product.code] || STOCK_UNKNOWN;
        return Object.assign({}, product, {
          ref: opaqueRef("product", product.code),
          modelRef: model && model.ref || null,
          modelName: model && model.name || null,
          media: [],
          reviews: enrichment.reviewsByProductCode[product.code] || [],
          sellability: sellability,
          allowedActions: buyActions(product.allowedActions, sellability),
        });
      }),
      pimProductModels: enrichment.models,
      pimProductReviews: enrichment.reviews,
      pimEnrichment: enrichment.state,
    };
  },
};

async function loadProductEnrichment(context, products) {
  var config = context.config || {};
  var session = context.state && context.state.session || {};
  var token = session.accessToken;
  var empty = {
    models: [], reviews: [], modelsByProductCode: {}, reviewsByProductCode: {},
    sellabilityByProductCode: unknownSellability(products),
    state: { models: "unavailable", reviews: "unavailable", inventory: "unavailable" },
  };
  if (!token || config.pimFixtureUrl || config.pimEnrichmentMode !== "current-api") return empty;

  var headers = {
    Accept: "application/json",
    Authorization: (session.tokenType || "Bearer") + " " + token,
    "Content-Type": "application/json",
    "X-Organization-Code": config.pimOrganization || config.organization || "SERVICEWAND",
  };
  var [modelResult, reviewResult, inventoryResult] = await Promise.all([
    fetchPrivateList(privateUrl(config, "product-model"), productModelRequest(), headers),
    fetchPrivateList(privateUrl(config, "product-review"), productReviewRequest(), headers),
    fetchPrivateList(privateUrl(config, "inventory"), inventoryRequest(), headers),
  ]);
  var productCodes = new Set(products.map(function (product) { return product.code; }));
  var models = modelResult.ok ? normalizeModels(modelResult.items, productCodes) : [];
  var reviews = reviewResult.ok ? normalizeReviews(reviewResult.items, productCodes) : [];
  var modelsByProductCode = {};
  models.forEach(function (model) {
    model.productCodes.forEach(function (code) { modelsByProductCode[code] = model; });
  });
  var reviewsByProductCode = {};
  reviews.forEach(function (review) {
    if (!reviewsByProductCode[review.productCode]) reviewsByProductCode[review.productCode] = [];
    reviewsByProductCode[review.productCode].push(review);
  });
  return {
    models: models,
    reviews: reviews,
    modelsByProductCode: modelsByProductCode,
    reviewsByProductCode: reviewsByProductCode,
    sellabilityByProductCode: sellabilityByProductCode(inventoryResult.ok ? inventoryResult.items : [], products),
    state: { models: modelResult.state, reviews: reviewResult.state, inventory: inventoryResult.state },
  };
}

/**
 * Asks Core for the `SPA_STOCK` inventory rows.
 *
 * The type narrowing is a filter on `type.code`, a real relation column that
 * Core does filter on — the same shape the shipment and enrolment reads use.
 * It is deliberately NOT a filter on `attributes.*`: Core cannot filter dynamic
 * attributes and fails silently when asked to, returning `200` with zero rows,
 * which would read as "nothing is in stock" instead of as an error.
 *
 * `Inventory` has no `code` column either, so the join key requested here is
 * the `product` relation's id. The row's own `RECORD_CODE` attribute is seed
 * identity, not a product reference, and `notes` is never identity at all.
 */
function inventoryRequest() {
  return {
    filters: [{ type: "STRING", operator: "=", property: "type.code", value: INVENTORY_TYPE_CODE }],
    offset: 0, pageSize: 500,
    mappings: [
      { name: "id" }, { name: "count" },
      { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "product", type: "identifier" },
      { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "type", type: "identifier" },
    ],
  };
}

/**
 * Joins inventory rows to catalog products by product id and reduces each
 * product to one sellability value.
 *
 * A product Core returned no inventory row for is `unknown`, never `sellable`
 * and never `out-of-stock`. When several rows exist for the same product, a
 * single positive count is enough to make it sellable; no count is summed,
 * because a total the store did not state is a number this adapter invented.
 */
function sellabilityByProductCode(rows, products) {
  var inStockByProductId = new Map();
  rows.forEach(function (row) {
    if (!isStockRow(row)) return;
    var productId = referenceId(row && row.product);
    if (productId === null) return;
    var count = Number(row && row.count);
    if (!Number.isFinite(count)) return;
    inStockByProductId.set(productId, inStockByProductId.get(productId) === true || count > 0);
  });
  var byProductCode = {};
  products.forEach(function (product) {
    var productId = referenceId(productFromRow(product.row));
    var inStock = productId === null ? undefined : inStockByProductId.get(productId);
    byProductCode[product.code] = inStock === undefined ? STOCK_UNKNOWN : inStock ? SELLABLE : OUT_OF_STOCK;
  });
  return byProductCode;
}

function unknownSellability(products) {
  var byProductCode = {};
  (products || []).forEach(function (product) { byProductCode[product.code] = STOCK_UNKNOWN; });
  return byProductCode;
}

function isStockRow(row) {
  var typeCode = String(row && row.type && row.type.code || "");
  return !typeCode || typeCode === INVENTORY_TYPE_CODE;
}

function referenceId(reference) {
  var id = Number(reference && reference.id);
  return Number.isInteger(id) ? id : null;
}

/**
 * The buy action is opened by an in-stock inventory row and by nothing else.
 * Zero stock and unknown stock both close it — they differ in what the design
 * is allowed to say, not in what the customer is allowed to do.
 */
function buyActions(actions, sellability) {
  var list = Array.isArray(actions) ? actions.slice() : [];
  if (sellability === SELLABLE) return list;
  return list.filter(function (action) { return action !== "cart.addItem"; });
}

async function fetchPrivateList(url, payload, headers) {
  try {
    var response = await window.fetch(url, { method: "POST", headers: headers, credentials: "include", body: JSON.stringify(payload) });
    if (!response.ok) return { ok: false, state: response.status === 401 ? "session-expired" : response.status === 403 ? "forbidden" : "error", items: [] };
    var data = await response.json();
    return { ok: true, state: "ready", items: Array.isArray(data && data.result) ? data.result : [] };
  } catch (error) {
    return { ok: false, state: "error", items: [] };
  }
}

function privateUrl(config, entity) {
  var base = String(config.pimApiBase || "/core-pim/api").trim().replace(/\/+$/, "");
  if (!/\/api$/i.test(base)) base += "/api";
  return base + "/" + entity + "/list.json";
}

function productModelRequest() {
  return {
    filters: [], offset: 0, pageSize: 200,
    mappings: [
      { name: "id" }, { name: "code" }, { name: "nls" }, { name: "variants" },
      { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "products", type: "collection" },
    ],
  };
}

function productReviewRequest() {
  return {
    filters: [], offset: 0, pageSize: 500,
    mappings: [
      { name: "id" }, { name: "attributes" }, { name: "created" }, { name: "updated" },
      { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "product", type: "identifier" },
      { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "type", type: "identifier" },
      { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "states", type: "collection" },
    ],
  };
}

function normalizeModels(rows, productCodes) {
  return rows.map(function (row) {
    var products = Array.isArray(row && row.products) ? row.products : [];
    var codes = products.map(function (product) { return String(product && product.code || ""); }).filter(function (code) { return productCodes.has(code); });
    var nls = localized(row && row.nls, "en");
    var variantAttributes = [];
    Object.values(row && row.variants || {}).forEach(function (values) {
      if (Array.isArray(values)) values.forEach(function (value) { if (!variantAttributes.includes(String(value))) variantAttributes.push(String(value)); });
    });
    return {
      ref: opaqueRef("product-model", row.code),
      code: String(row.code || ""),
      name: nls.NAME || String(row.code || "Collection"),
      description: stripHtml(nls.DESCRIPTION || ""),
      productCodes: codes,
      variantAttributes: variantAttributes,
    };
  }).filter(function (model) { return model.code && model.productCodes.length; });
}

function normalizeReviews(rows, productCodes) {
  return rows.map(function (row) {
    var states = Array.isArray(row && row.states) ? row.states.map(function (state) { return String(state && state.code || ""); }) : [];
    var productCode = String(row && row.product && row.product.code || "");
    if (!states.includes("PUBLISHED") || !productCodes.has(productCode)) return null;
    var rating = Number(reviewAttribute(row, "RATING"));
    var body = String(reviewAttribute(row, "BODY") || "").trim();
    var authorName = String(reviewAttribute(row, "AUTHOR_NAME") || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !body || !authorName) return null;
    var identity = reviewAttribute(row, "REVIEW_KEY") || [row.id, productCode, authorName, body, row.created].join("|");
    return {
      ref: opaqueRef("product-review", identity),
      productCode: productCode,
      rating: rating,
      title: String(reviewAttribute(row, "TITLE") || "").trim() || null,
      body: body,
      authorName: authorName,
      verified: reviewAttribute(row, "VERIFIED") === true || String(reviewAttribute(row, "VERIFIED")).toLowerCase() === "true",
      publishedAt: row.updated || row.created || null,
    };
  }).filter(Boolean);
}

function reviewAttribute(row, code) {
  var groups = row && row.attributes;
  if (!groups || typeof groups !== "object") return null;
  for (var group of Object.values(groups)) {
    if (group && group[code] && group[code].value !== undefined) return group[code].value;
  }
  return null;
}

function opaqueRef(prefix, value) {
  var text = String(value || prefix);
  var left = 2166136261;
  var right = 2246822507;
  for (var index = 0; index < text.length; index += 1) {
    var code = text.charCodeAt(index);
    left = Math.imul(left ^ code, 16777619);
    right = Math.imul(right ^ code, 3266489909);
  }
  return prefix + "-" + (left >>> 0).toString(36) + (right >>> 0).toString(36);
}

function buildRequest(config, productTypeCode) {
  var payload = {
    productTypeCode: productTypeCode,
    includeChildProductTypes: true,
    priceTypeCode: config.pimPriceTypeCode || "RECURRENT",
    includeChildPriceTypes: true,
    currencyAttributeCode: config.pimCurrencyAttributeCode || "CURRENCY",
    currencyAttributeValues: configuredValues(config.pimCurrencyAttributeValues, [config.pimCurrency || "CAD"]),
    nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"],
  };

  // The price-attribute filter is optional. Under the SYSTEM price types a
  // one-time price carries no INTERVAL at all, so applying the filter would drop
  // every non-recurring row; it is sent only when a deployment configures it.
  var priceAttributeCode = typeof config.pimPriceAttributeCode === "string" ? config.pimPriceAttributeCode.trim() : "";
  var priceAttributeValues = configuredValues(config.pimPriceAttributeValues, []);
  if (priceAttributeCode && priceAttributeValues.length) {
    payload.priceAttributeCode = priceAttributeCode;
    payload.priceAttributeValues = priceAttributeValues;
  }

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
        // `omit`, not `include`. This is the PUBLIC catalog endpoint and the
        // portal is same-origin with it, so `include` makes the browser attach
        // the ACCESS_TOKEN cookie; the endpoint then takes its authenticated
        // path and answers 404. Verified on staging 2026-07-28: the identical
        // POST returns 200 anonymously on both core-pim nodes and 401 with a
        // bogus ACCESS_TOKEN cookie, so the cookie alone decides the branch.
        // A public read must be anonymous.
        credentials: "omit",
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
      // The Core ids behind this catalog row. `id`/`code` above are the
      // customer-facing product code; adding to the server cart needs the real
      // Product and ProductPrice ids, and reaching into `row` for them from a
      // route or a command is exactly the brittleness this avoids.
      backendProductId: Number.isInteger(Number(product.id)) ? Number(product.id) : null,
      backendPriceId: Number.isInteger(Number(row.price && row.price.price && row.price.price.id))
        ? Number(row.price.price.id) : null,
      name: nls.NAME || product.code || "Plan",
      description: stripHtml(nls.DESCRIPTION || ""),
      price: customPrice ? "Custom" : formatCurrency(amount, currency),
      priceNum: customPrice ? 0 : amount,
      currency: customPrice ? "" : currency,
      interval: formatInterval(interval),
      cta: customPrice ? "Contact us" : config.pimCta || "Choose plan",
      attributes: product.attributes || {},
      variantFacts: variantFacts(product.attributes),
      productTypeCode: product.type && product.type.code || row.productTypeCode || row.__productTypeCode || "",
      allowedActions: customPrice ? ["support.open"] : ["cart.addItem"],
      row: row,
    };
  });
}

function variantFacts(attributes) {
  return [
    fact("Format", productAttribute(attributes, "FORMAT")),
    fact("Size", volumeLabel(productAttribute(attributes, "VOLUME_ML"))),
    fact("Scent", productAttribute(attributes, "SCENT_PROFILE")),
  ].filter(Boolean);
}

function fact(label, value) {
  if (value === undefined || value === null || value === "") return null;
  return { label: label, value: String(value) };
}

function volumeLabel(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value) + " ml";
}

function productAttribute(attributes, code) {
  if (!attributes || typeof attributes !== "object") return null;
  for (var group of Object.values(attributes)) {
    var attribute = group && group[code];
    if (attribute && attribute.value !== undefined && attribute.value !== null) return attribute.value;
  }
  return null;
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
