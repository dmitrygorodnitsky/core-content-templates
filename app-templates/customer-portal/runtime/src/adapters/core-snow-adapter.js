import { attributeEntry, attributeNumber, attributeText, latestStateCode, positiveInteger, text } from "../normalizers/core-record.js";
import { CUSTOMER_ORDER_STATUS, OPERATOR_ORDER_STATES, QUOTE_ORDER_TYPES } from "../normalizers/contracts.js";

const PROPERTY_TYPE = "SNOW_REMOVAL_PROPERTY";
const PROPERTY_BASE_TYPE = "PROPERTY";

const PROPERTY_PAGE_SIZE = 200;
const PROPERTY_PAGE_LIMIT = 6;

const REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];

const RESOURCE_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "id" },
  { name: "nls" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
];

const ADDRESS_MAPPINGS = [
  { name: "address1" },
  { name: "city" },
  { name: "id" },
  { name: "postalCode" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "country", type: "identifier" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "state", type: "identifier" },
];

const ORDER_MAPPINGS = [
  { name: "attributes" },
  { name: "created" },
  { name: "grandTotal" },
  { name: "id" },
  { name: "notes" },
  { key: "id", mappings: REF_MAPPINGS, name: "account", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "currency", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

export function createCoreSnowPropertiesAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "properties") throw contractError("unsupported-module", "Core snow properties adapter cannot load " + moduleId);
      return loadSnowProperties(context, fetchImpl, options.origin);
    },
  };
}

export function createCoreSnowQuotesAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "proposals") throw contractError("unsupported-module", "Core snow quotes adapter cannot load " + moduleId);
      return loadSnowQuotes(context, fetchImpl, options.origin);
    },
  };
}

export async function loadSnowProperties(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var rows = await customerProperties(api, fetchImpl);
  var addresses = await resolveAddresses(api, fetchImpl, rows.items);
  return {
    state: "ready",
    accountId: api.accountId,
    items: rows.items.map(function (row) { return propertyRecord(row, addresses); }),
    scopeMode: "browser-filtered",
    truncated: rows.truncated,
  };
}

export async function loadSnowQuotes(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var response = await requestJson(fetchImpl, api.billBase + "/api/order/list.json", readOptions(api, {
    filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(api.accountId) }],
    mappings: ORDER_MAPPINGS,
    offset: 0,
    pageSize: 100,
  }));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var quotes = rows.filter(function (row) { return QUOTE_ORDER_TYPES.indexOf(text(row.type && row.type.code)) >= 0; });
  var propertyIds = [];
  quotes.forEach(function (row) {
    var id = attributeNumber(row, "SERVICE_PROPERTY");
    if (id && propertyIds.indexOf(id) < 0) propertyIds.push(id);
  });
  var properties = await propertiesById(api, fetchImpl, propertyIds);
  var addresses = await resolveAddresses(api, fetchImpl, Object.values(properties));

  var sites = [];
  var withheld = 0;
  quotes.forEach(function (row) {
    var stateCode = latestStateCode(row);
    var status = Object.prototype.hasOwnProperty.call(CUSTOMER_ORDER_STATUS, stateCode) ? CUSTOMER_ORDER_STATUS[stateCode] : null;
    if (!status) {
      if (OPERATOR_ORDER_STATES.indexOf(stateCode) >= 0) withheld += 1;
      return;
    }
    sites.push(quoteSite(row, status, properties, addresses));
  });

  return {
    state: "ready",
    accountId: api.accountId,
    scopeMode: "server-scoped",
    sites: sites,
    unsentCount: withheld,
  };
}

async function customerProperties(api, fetchImpl) {
  var items = [];
  var truncated = false;
  for (var page = 0; page < PROPERTY_PAGE_LIMIT; page += 1) {
    var response = await requestJson(fetchImpl, api.resourceBase + "/api/resource/list.json", readOptions(api, {
      filters: [{ type: "STRING", operator: "=", property: "type.code", value: PROPERTY_TYPE }],
      mappings: RESOURCE_MAPPINGS,
      offset: page * PROPERTY_PAGE_SIZE,
      pageSize: PROPERTY_PAGE_SIZE,
    }));
    var rows = Array.isArray(response && response.result) ? response.result : [];
    rows.forEach(function (row) {
      if (attributeNumber(row, "ACCOUNT") === api.accountId) items.push(row);
    });
    if (rows.length < PROPERTY_PAGE_SIZE) return { items: items, truncated: false };
    truncated = page === PROPERTY_PAGE_LIMIT - 1;
  }
  return { items: items, truncated: truncated };
}

async function propertiesById(api, fetchImpl, ids) {
  var resolved = {};
  for (var index = 0; index < ids.length; index += 1) {
    var response = await requestJson(fetchImpl, api.resourceBase + "/api/resource/list.json", readOptions(api, {
      filters: [{ type: "INTEGER", operator: "=", property: "id", value: String(ids[index]) }],
      mappings: RESOURCE_MAPPINGS,
      offset: 0,
      pageSize: 2,
    }));
    var row = Array.isArray(response && response.result) ? response.result[0] : null;
    if (row) resolved[String(ids[index])] = row;
  }
  return resolved;
}

async function resolveAddresses(api, fetchImpl, rows) {
  var resolved = {};
  var ids = [];
  rows.forEach(function (row) {
    var id = attributeNumber(row, "ADDRESS");
    if (id && ids.indexOf(id) < 0) ids.push(id);
  });
  for (var index = 0; index < ids.length; index += 1) {
    var response = await requestJson(fetchImpl, api.coreBase + "/api/address/list.json", readOptions(api, {
      filters: [{ type: "INTEGER", operator: "=", property: "id", value: String(ids[index]) }],
      mappings: ADDRESS_MAPPINGS,
      offset: 0,
      pageSize: 2,
    }));
    var row = Array.isArray(response && response.result) ? response.result[0] : null;
    if (row) resolved[String(ids[index])] = row;
  }
  return resolved;
}

function propertyRecord(row, addresses) {
  var address = addresses[String(attributeNumber(row, "ADDRESS"))] || null;
  return {
    id: "prop-core-" + row.id,
    backendId: positiveInteger(row.id),
    name: localizedName(row.nls) || text(row.code) || "Property",
    address: formatAddress(address),
    city: address ? text(address.city) : "",
    postal: address ? text(address.postalCode) : "",
    region: address && address.state ? text(address.state.code) : "",
    country: address && address.country ? text(address.country.id || address.country.code) : "",
    category: attributeText(row, "PROPERTY_CATEGORY") || null,
    stateCode: latestStateCode(row) || null,
    lat: attributeCoordinate(row, "COORD_LAT", 90),
    lon: attributeCoordinate(row, "COORD_LNG", 180),
    zone: null,
    contract: null,
    quoteSiteId: null,
    appointment: null,
    ticket: null,
    lastService: null,
  };
}

function quoteSite(row, status, properties, addresses) {
  var propertyId = attributeNumber(row, "SERVICE_PROPERTY");
  var property = propertyId ? properties[String(propertyId)] : null;
  var address = property ? addresses[String(attributeNumber(property, "ADDRESS"))] || null : null;
  return {
    id: "quote-core-" + row.id,
    backendId: positiveInteger(row.id),
    orderTypeCode: text(row.type && row.type.code),
    stateCode: latestStateCode(row),
    status: status,
    propertyId: propertyId ? "prop-core-" + propertyId : null,
    addr: property ? localizedName(property.nls) || text(property.code) : "",
    city: address ? text(address.city) : "",
    postal: address ? text(address.postalCode) : "",
    servicePeriodStart: attributeText(row, "SERVICE_PERIOD_START") || null,
    servicePeriodEnd: attributeText(row, "SERVICE_PERIOD_END") || null,
    effectiveDate: attributeText(row, "EFFECTIVE_DATE") || null,
    lot: null,
    areas: null,
    selected: null,
    x: null,
    y: null,
  };
}

function formatAddress(address) {
  if (!address) return "";
  var region = address.state ? text(address.state.code) : "";
  var tail = [text(address.city), region].filter(Boolean).join(", ");
  return [text(address.address1), tail, text(address.postalCode)].filter(Boolean).join(", ");
}

function attributeCoordinate(row, code, limit) {
  var entry = attributeEntry(row, code);
  var value = entry ? entry.value : null;
  var number = typeof value === "number" ? value
    : typeof value === "string" && value.trim() !== "" ? Number(value)
    : Number.NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function readContext(context, explicitOrigin) {
  var config = context && context.config || {};
  var runtimeState = context && context.state || {};
  var session = runtimeState.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var account = runtimeState.customerAccount || session.account || null;
  var accountId = positiveInteger(account && account.id);
  if (!accountId) throw contractError("customer-unresolved", "A resolved customer Account is required before reading snow records");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "A portal organization code is required");
  var origin = explicitOrigin || config.origin || browserOrigin();
  return {
    accountId: accountId,
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    organization: organization,
    resourceBase: sameOriginBase(config.resourceApiBase || "/core-rm", origin, "Core Resource API base"),
  };
}

function readOptions(api, body) {
  return {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: api.authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Organization-Code": api.organization,
    },
    body: JSON.stringify(body),
  };
}

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : "core-request-failed";
    var error = contractError(code, "Core request failed with HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  var payload;
  try {
    payload = await response.json();
  } catch (_) {
    throw contractError("invalid-response", "Core response was not valid JSON");
  }
  if (typeof payload === "string") throw contractError("unprojectable-response", "Core answered with an unprojected body");
  return payload;
}

function sameOriginBase(value, origin, label) {
  if (!origin) throw contractError("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function browserOrigin() {
  return globalThis.location && globalThis.location.origin || "";
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  return text(localized && (localized.NAME || localized.name));
}

function contractError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

export const coreSnowContract = Object.freeze({
  addressMappings: ADDRESS_MAPPINGS,
  customerQuoteStatus: Object.freeze(Object.assign({}, CUSTOMER_ORDER_STATUS)),
  operatorQuoteStates: Object.freeze(OPERATOR_ORDER_STATES.slice()),
  orderMappings: ORDER_MAPPINGS,
  propertyBaseType: PROPERTY_BASE_TYPE,
  propertyPageLimit: PROPERTY_PAGE_LIMIT,
  propertyPageSize: PROPERTY_PAGE_SIZE,
  propertyType: PROPERTY_TYPE,
  quoteOrderTypes: Object.freeze(QUOTE_ORDER_TYPES.slice()),
  resourceMappings: RESOURCE_MAPPINGS,
  quoteFilters: ["account.id"],
  propertyFilters: ["type.code"],
});
