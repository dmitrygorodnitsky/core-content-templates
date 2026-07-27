// Live cart adapter for the Calm Harbor staging portal.
//
// The cart is SERVER-OWNED. Every commercial figure this adapter returns —
// `subtotal`, `unitAmount`, `lineAmount`, `itemCount`, `currency` — is taken
// verbatim from the `CartView` / `CartItemView` that Core computed. Nothing
// here multiplies, sums, or rounds a money value, and where Core supplies no
// figure the field stays null so the presentation can show nothing rather than
// invent one. Core exposes no cart tax and no cart total, only a subtotal.
//
// Scope note: unlike every other read in this tenant, `/api/cart/current` is
// account-bound on the SERVER — a foreign accountId is refused with 403. The
// envelope therefore reports `scopeMode: "server-account-bound"` instead of
// `customer-filtered-client-side`; this is the one surface where the portal is
// not doing the narrowing itself.
//
// A 2xx is not success: every mutation is followed by an authoritative re-read
// of the cart, and the command fails rather than claim an effect Core did not
// report.

const LINE_REF_PREFIX = "cart-line-";

const CART_PATH = "/api/cart/current.json";
const ITEMS_PATH = "/api/cart/current/items.json";

function countPath(priceId) {
  return "/api/cart/current/items/" + priceId + "/count.json";
}

function itemPath(priceId) {
  return "/api/cart/current/items/" + priceId + ".json";
}

const flights = new Map();

export const coreCartContract = {
  cartPath: CART_PATH,
  countPath: countPath,
  itemPath: itemPath,
  itemsPath: ITEMS_PATH,
  lineRefPrefix: LINE_REF_PREFIX,
  scopeMode: "server-account-bound",
};

export function createCoreCartAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core cart adapter requires fetch");
  return {
    load(moduleId, context) {
      if (moduleId !== "cart") throw contractError("unsupported-module", "Core cart adapter cannot load " + moduleId);
      return loadCoreCart(context, fetchImpl, options.origin);
    },
    addItem(input, context) {
      return addCoreCartItem(input, context, fetchImpl, options.origin);
    },
    setItemCount(input, context) {
      return setCoreCartItemCount(input, context, fetchImpl, options.origin);
    },
    removeItem(input, context) {
      return removeCoreCartItem(input, context, fetchImpl, options.origin);
    },
    clear(context) {
      return clearCoreCart(context, fetchImpl, options.origin);
    },
  };
}

export async function loadCoreCart(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = cartContext(context, explicitOrigin);
  return readCart(api, fetchImpl);
}

/**
 * Adds a catalog price to the server cart. `count` is a quantity, not money.
 * The line the caller asked for must be present in the readback or the command
 * fails — a 2xx on the POST proves nothing on its own.
 */
export function addCoreCartItem(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = cartContext(context, explicitOrigin);
  var priceId = positiveInteger(input && input.priceId);
  if (!priceId) throw contractError("cart-price-required", "A Core price id is required to add a cart item");
  var productId = positiveInteger(input && input.productId);
  if (!productId) throw contractError("cart-product-required", "A Core product id is required to add a cart item");
  var count = positiveInteger(input && input.count) || 1;
  var requestRef = text(input && input.requestRef) || String(priceId) + "x" + count;

  return singleFlight("cart:add:" + api.accountId + ":" + priceId + ":" + requestRef, async function () {
    var before = await readCart(api, fetchImpl);
    // `CartItemRequest.currency` is the Dictionary entity id, not the code:
    // Core answers a code with `404 "No sellable price found"` wrapped in a 500.
    var currencyId = positiveInteger(input && input.currencyId)
      || await currencyIdByCode(api, fetchImpl, text(input && input.currency) || before.currencyCode || defaultCurrency(api));
    await requestJson(fetchImpl, api.billBase + ITEMS_PATH, requestOptions(api, "POST", {
      accountId: api.accountId,
      count: count,
      currency: currencyId,
      metadata: (input && input.metadata) || null,
      notes: text(input && input.notes) || null,
      priceId: priceId,
      productId: productId,
    }));
    var after = await readCart(api, fetchImpl);
    if (!after.byRef[LINE_REF_PREFIX + priceId]) {
      throw contractError("cart-add-unconfirmed", "Core did not report the item in the cart after the add");
    }
    return after;
  });
}

/**
 * Sets a line to an absolute quantity. Core's endpoint takes a delta, so the
 * delta is derived from the count Core reports right now — never from a locally
 * held cart, which may be stale. A no-op target issues no write at all, which
 * is what makes a replayed identical mutation safe.
 */
export function setCoreCartItemCount(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = cartContext(context, explicitOrigin);
  var priceId = cartPriceId(input);
  var count = finiteNumber(input && input.count, NaN);
  if (!Number.isInteger(count) || count < 0) throw contractError("cart-count-invalid", "A cart quantity must be a non-negative integer");
  if (count === 0) return removeCoreCartItem(input, context, fetchImpl, explicitOrigin);

  return singleFlight("cart:count:" + api.accountId + ":" + priceId + ":" + count, async function () {
    var before = await readCart(api, fetchImpl);
    var line = before.byRef[LINE_REF_PREFIX + priceId];
    if (!line) throw contractError("cart-line-missing", "That item is no longer in the cart");
    var delta = count - line.qty;
    if (delta === 0) return before;

    await requestJson(fetchImpl,
      api.billBase + countPath(priceId) + "?accountId=" + api.accountId + "&delta=" + delta,
      requestOptions(api, "POST", null));

    var after = await readCart(api, fetchImpl);
    var updated = after.byRef[LINE_REF_PREFIX + priceId];
    if (!updated || updated.qty !== count) {
      throw contractError("cart-count-unconfirmed", "Core did not report the requested quantity after the change");
    }
    return after;
  });
}

export function removeCoreCartItem(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = cartContext(context, explicitOrigin);
  var priceId = cartPriceId(input);

  return singleFlight("cart:remove:" + api.accountId + ":" + priceId, async function () {
    await requestJson(fetchImpl,
      api.billBase + itemPath(priceId) + "?accountId=" + api.accountId,
      requestOptions(api, "DELETE", null));

    var after = await readCart(api, fetchImpl);
    if (after.byRef[LINE_REF_PREFIX + priceId]) {
      throw contractError("cart-remove-unconfirmed", "Core still reports the item in the cart after the removal");
    }
    return after;
  });
}

export function clearCoreCart(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = cartContext(context, explicitOrigin);

  return singleFlight("cart:clear:" + api.accountId, async function () {
    await requestJson(fetchImpl,
      api.billBase + ITEMS_PATH + "?accountId=" + api.accountId,
      requestOptions(api, "DELETE", null));

    var after = await readCart(api, fetchImpl);
    if (after.lines.length) throw contractError("cart-clear-unconfirmed", "Core still reports items in the cart after the clear");
    return after;
  });
}

async function readCart(api, fetchImpl) {
  var view = await requestJson(fetchImpl,
    api.billBase + CART_PATH + "?accountId=" + api.accountId,
    requestOptions(api, "GET", null));
  // Cart rows carry their currency as a Dictionary id, so the code that formats
  // the money is resolved from Core rather than assumed from configuration.
  var codes = await currencyCodesByIds(api, fetchImpl, currencyIdsIn(view));
  return normalizeCart(view, api, codes);
}

/* Every money field below is copied, never derived. `lineAmount` is Core's own
   figure for the line; the portal does not multiply `unitAmount` by `count`
   even though it could, because a computed figure is not a server figure. */
function normalizeCart(view, api, codes) {
  var rows = Array.isArray(view && view.items) ? view.items : [];
  // `CartView` carries no currency of its own on this deployment; the cart's
  // currency is the one its lines agree on, and the configured default only
  // when there are no lines to ask.
  var lineCodes = [];
  rows.forEach(function (row) {
    var code = codes[String(row && row.currency)] || currencyOf(row && row.currency);
    if (code && lineCodes.indexOf(code) < 0) lineCodes.push(code);
  });
  var currencyCode = currencyOf(view && view.currency)
    || (lineCodes.length === 1 ? lineCodes[0] : "")
    || defaultCurrency(api);
  var lines = rows.map(function (row) { return normalizeLine(row, currencyCode, api, codes); });
  var byRef = {};
  lines.forEach(function (line) { byRef[line.ref] = line; });
  var subtotal = finiteNumber(view && view.subtotal, null);
  return {
    backendId: positiveInteger(view && view.id) || null,
    byRef: byRef,
    currencyCode: currencyCode,
    displaySubtotal: subtotal == null ? null : formatMoney(subtotal, currencyCode),
    itemCount: finiteNumber(view && view.itemCount, null),
    lines: lines,
    notes: text(view && view.notes),
    organizationCode: codeOf(view && view.organization),
    scopeMode: "server-account-bound",
    state: lines.length ? "ready" : "empty",
    subtotal: subtotal,
  };
}

function normalizeLine(row, cartCurrency, api, codes) {
  var priceId = positiveInteger(row && row.priceId);
  if (!priceId) throw contractError("invalid-cart-line", "Core cart item did not include a price id");
  var currencyCode = codes[String(row && row.currency)] || currencyOf(row && row.currency) || cartCurrency;
  var unitAmount = finiteNumber(row && row.unitAmount, null);
  var lineAmount = finiteNumber(row && row.lineAmount, null);
  var productCode = text(row && row.productCode);
  var productId = positiveInteger(row && row.productId) || null;
  return {
    backendId: positiveInteger(row && row.id) || null,
    currencyCode: currencyCode,
    displayTotal: lineAmount == null ? null : formatMoney(lineAmount, currencyCode),
    displayUnitPrice: unitAmount == null ? null : formatMoney(unitAmount, currencyCode),
    lineAmount: lineAmount,
    metadata: (row && row.metadata) || null,
    notes: text(row && row.notes),
    priceId: priceId,
    productCode: productCode,
    productId: productId,
    qty: finiteNumber(row && row.count, 0),
    ref: LINE_REF_PREFIX + priceId,
    title: catalogTitle(api, productCode, productId) || productCode || "Item",
    unitAmount: unitAmount,
    variant: null,
  };
}

/* `CartItemView` carries no display name, so the line title is joined from the
   catalog the portal already loaded. It is a label, not a figure: an unmatched
   product falls back to its code rather than to a guess. */
function catalogTitle(api, productCode, productId) {
  var items = api.catalog;
  for (var index = 0; index < items.length; index += 1) {
    var item = items[index];
    var code = text(item && (item.code || item.sku));
    if (productCode && code && code === productCode) return text(item.name || item.title);
    if (productId && positiveInteger(item && (item.backendId || item.id)) === productId) return text(item.name || item.title);
  }
  return "";
}

/* Currency crosses this boundary in both directions and in two shapes: a write
   sends the Dictionary id, a read returns it, and only its code can format
   money. Both lookups go to Core — nothing here assumes that 17 means USD. */
function currencyIdsIn(view) {
  var ids = [];
  var rows = Array.isArray(view && view.items) ? view.items : [];
  rows.concat([view || {}]).forEach(function (row) {
    var id = positiveInteger(row && row.currency);
    if (id && ids.indexOf(id) < 0) ids.push(id);
  });
  return ids;
}

async function currencyCodesByIds(api, fetchImpl, ids) {
  if (!ids.length) return {};
  var rows = await listDictionary(api, fetchImpl, ids.map(function (id) {
    return { operator: "=", property: "id", type: "INTEGER", value: String(id) };
  }));
  var byId = {};
  rows.forEach(function (row) { byId[String(row.id)] = text(row.code); });
  return byId;
}

async function currencyIdByCode(api, fetchImpl, code) {
  if (!code) throw contractError("cart-currency-missing", "A currency is required to add a cart item");
  var rows = await listDictionary(api, fetchImpl, [{ operator: "=", property: "code", type: "STRING", value: code }]);
  var id = positiveInteger(rows[0] && rows[0].id);
  if (!id) throw contractError("cart-currency-missing", "Currency " + code + " is not provisioned in this organization");
  return id;
}

async function listDictionary(api, fetchImpl, filters) {
  var response = await requestJson(fetchImpl, api.coreBase + "/api/dictionary/list.json", requestOptions(api, "POST", {
    filters: filters,
    mappings: [{ name: "id" }, { name: "code" }],
    offset: 0,
    pageSize: 50,
  }));
  return Array.isArray(response && response.result) ? response.result : [];
}

function cartPriceId(input) {
  var direct = positiveInteger(input && input.priceId);
  if (direct) return direct;
  var ref = text(input && (input.ref || input));
  if (ref.indexOf(LINE_REF_PREFIX) === 0) {
    var parsed = positiveInteger(ref.slice(LINE_REF_PREFIX.length));
    if (parsed) return parsed;
  }
  throw contractError("cart-line-ref-invalid", "A cart line reference is required");
}

function cartContext(context, explicitOrigin) {
  var config = (context && context.config) || {};
  var state = (context && context.state) || {};
  var session = (context && context.session) || state.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "Verified portal organization is required");

  // The account is resolved from the session exactly as the sibling adapters do,
  // and refused before any call rather than letting Core answer a request with
  // no accountId — which it does with a raw 500, not a 400.
  var customer = (context && context.account) || state.customerAccount || session.account || {};
  var accountId = positiveInteger(customer && customer.id);
  if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before any cart call");

  var origin = explicitOrigin || config.origin || browserOrigin();
  var products = state.moduleData && state.moduleData.products;
  return {
    accountId: accountId,
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
    catalog: (products && Array.isArray(products.items) ? products.items : []),
    config: config,
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    organization: organization,
  };
}

function defaultCurrency(api) {
  return text(api.config.currency || api.config.pimCurrency) || "USD";
}

function requestOptions(api, method, body) {
  var options = {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      Authorization: api.authorization,
      "X-Organization-Code": api.organization,
    },
    method: method,
  };
  if (body != null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  return options;
}

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core cart request returned an invalid response");
  if (!response.ok) {
    // An existing account that is not the caller's is refused with 403; an
    // accountId that does not exist at all comes back 404, which is a different
    // fault and must not be reported as someone else's cart.
    var code = response.status === 401 ? "session-expired"
      : response.status === 403 ? "cart-forbidden"
        : response.status === 404 ? "cart-account-unknown"
          : response.status === 409 || response.status === 412 ? "cart-conflict"
            : "cart-unavailable";
    var error = contractError(code, "Core cart request failed with HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  try { return await response.json(); }
  catch (_) { return null; }
}

function singleFlight(key, operation) {
  if (flights.has(key)) return flights.get(key);
  var promise = Promise.resolve().then(operation).finally(function () { flights.delete(key); });
  flights.set(key, promise);
  return promise;
}

function currencyOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return codeOf(value);
}

function codeOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return text(value.code);
}

function formatMoney(value, currency) {
  var number = Number(value);
  if (!Number.isFinite(number) || !currency) return null;
  return new Intl.NumberFormat("en-US", { currency: currency, style: "currency" }).format(number);
}

function sameOriginBase(base, origin, label) {
  var value = text(base);
  if (!value) throw contractError("api-base-required", label + " is required");
  if (/^https?:\/\//i.test(value)) {
    if (value.indexOf(origin) !== 0) throw contractError("cross-origin-base", label + " must stay same-origin");
    return value.replace(/\/$/, "");
  }
  return (origin || "").replace(/\/$/, "") + (value.charAt(0) === "/" ? value : "/" + value).replace(/\/$/, "");
}

function browserOrigin() {
  return globalThis.location && globalThis.location.origin || "";
}

function positiveInteger(value) {
  var number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function finiteNumber(value, fallback) {
  var number = Number(value);
  return value == null || value === "" || !Number.isFinite(number) ? fallback : number;
}

function text(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function contractError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}
