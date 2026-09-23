import { attributeEntry, attributeNumber, attributeText, latestStateCode, positiveInteger, text } from "./core-record.js";
import { geoPoint } from "./property-map.js";

export var QUOTE_ORDER_TYPES = Object.freeze(["FIELD_SERVICE_ORDER", "WINTER_SERVICES_ORDER"]);

export var CUSTOMER_ORDER_STATUS = Object.freeze({
  CLIENT_APPROVED: "approved",
  CUSTOMER_CHANGES_REQUESTED: "revision",
  DECLINED: "declined",
  QUOTE_SENT: "unseen",
  QUOTE_VIEWED: "viewed",
});

export var OPERATOR_ORDER_STATES = Object.freeze(["CHANGES_REQUESTED", "INITIAL", "QUOTE_APPROVED_INTERNALLY", "QUOTE_PREPARED"]);

export var PRICING_MODELS = Object.freeze({
  PER_SERVICE: "Per service",
  MONTHLY: "Monthly",
  SEASONAL: "Seasonal",
});

export var CLIENT_TYPES = Object.freeze({
  INDIVIDUAL: "Individual",
  ORGANIZATION: "Organization",
});

export var SCOPE_MODES = Object.freeze(["server-scoped", "browser-filtered", "unscoped"]);

var ORDER_ACTIONS = { unseen: ["view"], viewed: ["approve", "decline"] };
var PRICING_MODEL_RANK = ["PER_SERVICE", "MONTHLY", "SEASONAL"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var SCHEMATIC_X = [18, 82];
var SCHEMATIC_Y = [24, 76];
var SCHEMATIC_MIN_SPAN = 0.01;
var STAGE_ORDER = ["approval", "review", "details", "drafting", "approved", "active", "suspended", "expired", "archived", "canceled"];
var QUOTE_STAGES = ["preparing", "review"];
var APPROVED_SERVICE_STAGES = ["details", "drafting", "approval", "approved", "active", "suspended", "expired", "archived"];
var TERMS_DEPTH_LIMIT = 4;
var HEADING_LINE = /^#{1,6}\s+(.+)$/;
var ITEM_LINE = /^[-*•]\s+(.+)$/;
var NUMBERED_LINE = /^(\d+(?:\.\d+)+[.)]?|\d+[.)])\s+(.+)$/;

var PREPARING = agreementStage("preparing", "", "");
var DRAFTING = agreementStage("drafting", "Agreement in preparation", "scheduled");
var APPROVED = agreementStage("approved", "Approved", "ok");

export var AGREEMENT_STAGES = Object.freeze({
  QUOTATION: PREPARING,
  QUOTATION_SEND_FAILED: PREPARING,
  QUOTATION_SENT: agreementStage("review", "Awaiting your decisions", "info"),
  AWAITING_CLIENT_DETAILS: agreementStage("details", "Contract details needed", "warn"),
  CLIENT_DETAILS_RECEIVED: DRAFTING,
  DRAFT: DRAFTING,
  PENDING_MANAGEMENT_APPROVAL: DRAFTING,
  INTERNALLY_APPROVED: DRAFTING,
  AGREEMENT_SEND_FAILED: DRAFTING,
  SENT_TO_CLIENT: agreementStage("approval", "Ready for your approval", "warn"),
  CLIENT_APPROVED: APPROVED,
  ACTIVATION_FAILED: APPROVED,
  ACTIVE: agreementStage("active", "Active", "ok"),
  SUSPENDED: agreementStage("suspended", "Suspended", "warn"),
  EXPIRED: agreementStage("expired", "Expired", "scheduled"),
  ARCHIVED: agreementStage("archived", "Archived", "scheduled"),
  CANCELED: agreementStage("canceled", "Cancelled", "scheduled"),
});

export function normalizeContracts(raw) {
  var source = raw && typeof raw === "object" ? raw : {};
  var reads = source.reads && typeof source.reads === "object" ? source.reads : {};
  var catalog = {
    orderItems: readRows(source.orderItems),
    productPrices: readRows(source.productPrices),
    products: readRows(source.products),
  };
  var quotes = normalizeQuoteOrders(source.quoteOrders, catalog);
  var agreementRows = readRows(source.agreements);
  var agreements = (agreementRows || []).map(function (row) { return normalizeServiceAgreement(row, source.client); }).filter(Boolean);
  var orderRows = readRows(source.quoteOrders);
  return {
    accountId: positiveInteger(source.accountId),
    scopeMode: scopeModeOf(source.scopeMode),
    reads: readSummaries(reads),
    agreements: agreements,
    orders: quotes.orders,
    withheldBackendIds: quotes.withheldBackendIds,
    preparing: quotes.preparing || agreements.some(function (agreement) { return agreement.stage === "preparing"; }),
    sources: {
      agreements: agreementRows ? "ready" : failedRead(reads.agreements),
      orders: orderRows ? "ready" : failedRead(reads.orders),
      lines: catalog.orderItems ? "ready" : failedRead(reads.orderItems),
      prices: catalog.productPrices ? "ready" : failedRead(reads.productPrices),
      products: catalog.products ? "ready" : failedRead(reads.products),
    },
    truncated: Object.keys(reads).some(function (key) { return !!(reads[key] && reads[key].truncated); }),
  };
}

export function normalizeQuoteOrders(payload, catalog) {
  var lines = lineCatalog(catalog);
  var orders = [];
  var withheld = [];
  var preparing = false;
  listRows(payload).forEach(function (row) {
    if (!row || typeof row !== "object") return;
    if (QUOTE_ORDER_TYPES.indexOf(text(row.type && row.type.code)) === -1) return;
    var backendId = positiveInteger(row.id);
    if (!backendId) return;
    var stateCode = latestStateCode(row);
    var status = own(CUSTOMER_ORDER_STATUS, stateCode);
    if (!status) {
      if (OPERATOR_ORDER_STATES.indexOf(stateCode) !== -1) {
        preparing = true;
        withheld.push(backendId);
      }
      return;
    }
    var model = attributeText(row, "PRICING_MODEL");
    var label = own(PRICING_MODELS, model);
    var currency = currencyCode(row.currency);
    var total = orderTotal(row.grandTotal, row.currency);
    var quoteLines = linesOf(row, backendId, currency, lines);
    orders.push({
      id: "quote-core-" + backendId,
      backendId: backendId,
      propertyBackendId: attributeNumber(row, "SERVICE_PROPERTY"),
      serviceAddress: attributeString(row, "SERVICE_ADDRESS"),
      stateCode: stateCode,
      status: status,
      pricingModel: label ? { code: model, label: label } : null,
      total: total,
      money: total ? {
        subtotal: formatMoney(row.totalCharges, currency),
        taxes: formatMoney(row.totalTaxes, currency),
        total: formatMoney(row.grandTotal, currency),
      } : null,
      lines: quoteLines.lines,
      linesState: quoteLines.state,
      servicePeriod: datePeriod(attributeText(row, "SERVICE_PERIOD_START"), attributeText(row, "SERVICE_PERIOD_END")),
      allowedActions: (ORDER_ACTIONS[status] || []).slice(),
    });
  });
  return { orders: orders, preparing: preparing, withheldBackendIds: withheld };
}

export function normalizeServiceAgreement(document, client) {
  if (!document || typeof document !== "object") return null;
  if (text(document.type && document.type.code) !== "SERVICE_AGREEMENT") return null;
  var backendId = positiveInteger(document.id);
  var stateCode = latestStateCode(document);
  var stage = own(AGREEMENT_STAGES, stateCode);
  if (!backendId || !stage) return null;
  return {
    id: "agreement-core-" + backendId,
    backendId: backendId,
    stateCode: stateCode,
    stage: stage.stage,
    label: stage.label,
    tone: stage.tone,
    orderBackendIds: attributeIds(document, "ORDERS"),
    effectiveDate: isoDate(attributeText(document, "EFFECTIVE_DATE")),
    term: datePeriod(attributeText(document, "TERM_START_DATE"), attributeText(document, "TERM_END_DATE")),
    parties: agreementParties(document, client),
    terms: termsBlocks(attributeString(document, "CONTRACT_TERMS")),
    allowedActions: stateCode === "SENT_TO_CLIENT" ? ["approve"] : [],
  };
}

export function contractsPackage(source, properties) {
  var data = source && typeof source === "object" ? source : {};
  var orders = Array.isArray(data.orders) ? data.orders : [];
  var agreements = Array.isArray(data.agreements) ? data.agreements.filter(Boolean) : [];
  var byProperty = propertyIndex(properties);
  var packageOf = packageIndex(agreements);
  var readable = new Set(orders.map(function (order) { return order.backendId; }).concat(data.withheldBackendIds || []));

  var quoted = orders.filter(function (order) {
    var owner = packageOf.get(order.backendId);
    return isOpen(order) || !owner || QUOTE_STAGES.indexOf(owner.stage) !== -1;
  });
  var groups = quoteGroups(quoted, packageOf, byProperty);
  var counts = { orders: quoted.length, properties: 0, decided: 0, approved: 0, revision: 0, declined: 0, open: 0 };
  groups.forEach(function (group) {
    if (!group.propertyBackendId) return;
    counts.properties += 1;
    if (group.decision === "approved" || group.decision === "declined") counts.decided += 1;
  });
  quoted.forEach(function (order) {
    if (isOpen(order)) counts.open += 1;
    else counts[order.status] += 1;
  });

  var rows = agreements
    .filter(function (agreement) { return agreement.stage !== "preparing"; })
    .map(function (agreement) { return agreementRow(agreement, orders, readable, byProperty); })
    .sort(byStage);

  return {
    agreements: rows,
    groups: groups,
    counts: counts,
    deciding: counts.open > 0,
    preparing: !!data.preparing,
    servicePeriod: sharedPeriod(quoted),
    sources: data.sources || {},
    truncated: !!data.truncated,
    scopeMode: data.scopeMode || null,
    partial: partialOf(data, orders, rows),
  };
}

export function groupDecision(orders) {
  var list = orders || [];
  if (list.some(hasStatus("approved"))) return "approved";
  if (list.length && list.every(hasStatus("declined"))) return "declined";
  if (list.some(hasStatus("revision"))) return "revision";
  return "open";
}

export function groupStatus(orders) {
  var decision = groupDecision(orders);
  if (decision !== "open") return decision;
  return (orders || []).some(hasStatus("viewed")) ? "viewed" : "unseen";
}

export function findQuote(pkg, backendId) {
  var groups = pkg && Array.isArray(pkg.groups) ? pkg.groups : [];
  for (var index = 0; index < groups.length; index += 1) {
    var found = groups[index].orders.find(function (order) { return order.backendId === backendId; });
    if (found) return found;
  }
  var rows = pkg && Array.isArray(pkg.agreements) ? pkg.agreements : [];
  for (var position = 0; position < rows.length; position += 1) {
    var listed = rows[position].orders.find(function (order) { return order.backendId === backendId; });
    if (listed) return listed;
  }
  return null;
}

export function findAgreement(pkg, backendId) {
  var rows = pkg && Array.isArray(pkg.agreements) ? pkg.agreements : [];
  return rows.find(function (row) { return row.agreement.backendId === backendId; }) || null;
}

export function termsBlocks(value) {
  var source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
  if (!source.trim()) return [];
  if (/<\/?[a-z][^>]*>/i.test(source)) source = htmlToText(source);
  var blocks = [];
  var section = 0;
  var outline = 0;
  source.split(/\n[ \t]*\n+/).forEach(function (chunk) {
    var paragraph = [];
    function flush() {
      if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n"), depth: section });
      paragraph = [];
    }
    chunk.split("\n").forEach(function (line) {
      var trimmed = line.replace(/\s+/g, " ").trim();
      if (!trimmed) return;
      var heading = HEADING_LINE.exec(trimmed);
      var numbered = NUMBERED_LINE.exec(trimmed);
      var item = ITEM_LINE.exec(trimmed);
      if (heading) {
        flush();
        section = 0;
        outline = 0;
        blocks.push({ kind: "heading", text: heading[1] });
      } else if (numbered) {
        flush();
        var segments = numbered[1].split(/[.)]/).filter(Boolean).length;
        var nested = /\)$/.test(numbered[1]) && segments === 1;
        section = Math.min(nested ? outline + 1 : segments, TERMS_DEPTH_LIMIT);
        if (!nested) outline = section;
        blocks.push({ kind: "numbered", marker: numbered[1], text: numbered[2], depth: section });
      } else if (item) {
        flush();
        blocks.push({ kind: "item", text: item[1], depth: section });
      } else {
        paragraph.push(trimmed);
      }
    });
    flush();
  });
  return blocks;
}

export function schematicPositions(points) {
  var valid = (points || []).map(function (point) { return point ? geoPoint(point.lat, point.lon) : null; });
  var placed = valid.filter(Boolean);
  if (!placed.length) return valid;
  var box = placed.reduce(function (bounds, point) {
    return {
      north: Math.max(bounds.north, point.lat),
      south: Math.min(bounds.south, point.lat),
      east: Math.max(bounds.east, point.lon),
      west: Math.min(bounds.west, point.lon),
    };
  }, { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity });
  var latSpan = Math.max(box.north - box.south, SCHEMATIC_MIN_SPAN);
  var lonSpan = Math.max(box.east - box.west, SCHEMATIC_MIN_SPAN);
  var midLat = (box.north + box.south) / 2;
  var midLon = (box.east + box.west) / 2;
  return valid.map(function (point) {
    if (!point) return null;
    return {
      x: tenths(50 + ((point.lon - midLon) / lonSpan) * (SCHEMATIC_X[1] - SCHEMATIC_X[0])),
      y: tenths(50 - ((point.lat - midLat) / latSpan) * (SCHEMATIC_Y[1] - SCHEMATIC_Y[0])),
    };
  });
}

export function formatOrderTotal(total) {
  if (!total) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: total.currency }).format(total.amount);
  } catch (_) {
    return "";
  }
}

export function formatMoney(value, currency) {
  var number = finiteNumber(value);
  if (number === null) return "";
  var code = /^[A-Z]{3}$/.test(text(currency)) ? text(currency) : "";
  try {
    if (code) return new Intl.NumberFormat("en-US", { style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(number);
  } catch (_) {
    code = "";
  }
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(number);
}

export function formatIsoDate(value) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
  return match ? MONTHS[Number(match[2]) - 1] + " " + Number(match[3]) + ", " + match[1] : "";
}

export function formatDatePeriod(period) {
  return period ? formatIsoDate(period.start) + " – " + formatIsoDate(period.end) : "";
}

function quoteGroups(orders, packageOf, byProperty) {
  var groups = [];
  var keyed = new Map();
  orders.forEach(function (order) {
    var owner = packageOf.get(order.backendId) || null;
    var agreementId = owner ? owner.backendId : 0;
    var propertyId = order.propertyBackendId || 0;
    var key = agreementId + "-" + propertyId;
    var group = keyed.get(key);
    if (!group) {
      var property = propertyId ? byProperty.get(propertyId) || null : null;
      group = {
        id: "quote-" + key,
        property: property,
        propertyBackendId: propertyId || null,
        agreement: owner,
        agreementBackendId: agreementId || null,
        orders: [],
        decision: "open",
        title: "",
        address: "",
      };
      keyed.set(key, group);
      groups.push(group);
    }
    group.orders.push(order);
  });
  groups.forEach(function (group) {
    group.orders.sort(byPricingModel);
    group.decision = groupDecision(group.orders);
    group.status = groupStatus(group.orders);
    var serviceAddress = firstServiceAddress(group.orders);
    group.title = propertyTitle(group.propertyBackendId, group.property, serviceAddress);
    group.address = propertyAddress(group.property, serviceAddress, group.title);
    group.servicePeriod = sharedPeriod(group.orders);
  });
  return groups.sort(function (left, right) {
    return stageRank(left.agreement) - stageRank(right.agreement) || (right.agreementBackendId || 0) - (left.agreementBackendId || 0);
  });
}

function agreementRow(agreement, orders, readable, byProperty) {
  var listed = orders.filter(function (order) { return agreement.orderBackendIds.indexOf(order.backendId) !== -1; });
  var services = APPROVED_SERVICE_STAGES.indexOf(agreement.stage) !== -1 ? listed.filter(hasStatus("approved")) : listed;
  var properties = [];
  var keyed = new Map();
  services.forEach(function (order) {
    var key = order.propertyBackendId || 0;
    var entry = keyed.get(key);
    if (!entry) {
      var property = key ? byProperty.get(key) || null : null;
      entry = { key: "property-" + key, propertyBackendId: key || null, property: property, orders: [], title: "", address: "" };
      keyed.set(key, entry);
      properties.push(entry);
    }
    entry.orders.push(order);
  });
  properties.forEach(function (entry) {
    entry.orders.sort(byPricingModel);
    var serviceAddress = firstServiceAddress(entry.orders);
    entry.title = propertyTitle(entry.propertyBackendId, entry.property, serviceAddress);
    entry.address = propertyAddress(entry.property, serviceAddress, entry.title);
  });
  var named = [];
  listed.forEach(function (order) {
    var property = order.propertyBackendId ? byProperty.get(order.propertyBackendId) : null;
    var name = property && property.name ? property.name : order.serviceAddress;
    if (name && named.indexOf(name) === -1) named.push(name);
  });
  var propertyIds = [];
  listed.forEach(function (order) {
    if (order.propertyBackendId && propertyIds.indexOf(order.propertyBackendId) === -1) propertyIds.push(order.propertyBackendId);
  });
  return {
    id: agreement.id,
    agreement: agreement,
    orders: listed,
    properties: properties,
    servicesScope: APPROVED_SERVICE_STAGES.indexOf(agreement.stage) !== -1 ? "approved" : "listed",
    propertyNames: named,
    propertyCount: propertyIds.length,
    quoteCount: listed.length,
    unreadableOrders: agreement.orderBackendIds.filter(function (id) { return !readable.has(id); }).length,
    servicePeriod: sharedPeriod(listed),
  };
}

function partialOf(data, orders, rows) {
  var sources = data.sources || {};
  var lines = orders.some(function (order) { return order.linesState !== "ready"; });
  var unreadableOrders = rows.reduce(function (sum, row) { return sum + row.unreadableOrders; }, 0);
  return {
    agreements: !!sources.agreements && sources.agreements !== "ready",
    orders: !!sources.orders && sources.orders !== "ready",
    lines: lines,
    unreadableOrders: unreadableOrders,
    truncated: !!data.truncated,
  };
}

function agreementParties(document, client) {
  var owner = document.organization;
  var first = attributeString(document, "REPRESENTATIVE_FIRST_NAME");
  var last = attributeString(document, "REPRESENTATIVE_LAST_NAME");
  return {
    provider: {
      legalName: attributeString(document, "PROVIDER_LEGAL_NAME") || localizedName(owner && owner.nls),
      representativeName: attributeString(document, "PROVIDER_REPRESENTATIVE_NAME"),
      representativeJobTitle: attributeString(document, "PROVIDER_REPRESENTATIVE_JOB_TITLE"),
    },
    client: {
      legalName: attributeString(document, "LEGAL_NAME") || text(client && typeof client.displayName === "string" ? client.displayName : ""),
      clientType: own(CLIENT_TYPES, attributeString(document, "CLIENT_TYPE")) || "",
      billingAddress: attributeString(document, "BILLING_ADDRESS"),
      representativeName: [first, last].filter(Boolean).join(" "),
      representativeJobTitle: attributeString(document, "REPRESENTATIVE_JOB_TITLE"),
      email: attributeString(document, "REPRESENTATIVE_EMAIL"),
      phone: attributeString(document, "REPRESENTATIVE_PHONE"),
    },
  };
}

function linesOf(row, backendId, currency, catalog) {
  if (!catalog.items) return { state: "unavailable", lines: [] };
  var found = (catalog.byOrder.get(backendId) || []).slice();
  var listed = idList(row.items);
  var missing = listed.filter(function (id) { return !found.some(function (line) { return line.backendId === id; }); }).length;
  var incomplete = false;
  var lines = found
    .sort(function (left, right) { return rankOf(left) - rankOf(right) || left.position - right.position; })
    .map(function (entry) {
      var line = entry.row;
      var priceId = positiveInteger(line.itemPrice && line.itemPrice.id);
      var price = priceId && catalog.prices ? catalog.prices.get(priceId) || null : null;
      var productId = positiveInteger(price && price.product && price.product.id);
      var product = productId && catalog.products ? catalog.products.get(productId) || null : null;
      if ((priceId && !price) || (productId && !product)) incomplete = true;
      return {
        key: "line-" + entry.backendId,
        product: localizedName(product && product.nls),
        quantity: formatQuantity(line.itemCount),
        unitPrice: formatMoney(line.amount, currency),
        total: formatMoney(line.grandTotal, currency),
      };
    });
  return { state: missing || incomplete ? "partial" : "ready", lines: lines };
}

function lineCatalog(catalog) {
  var source = catalog || {};
  var items = source.orderItems ? [] : null;
  var byOrder = new Map();
  (source.orderItems || []).forEach(function (row, position) {
    var backendId = positiveInteger(row && row.id);
    var orderId = positiveInteger(row && row.order && row.order.id);
    if (!backendId || !orderId) return;
    var entry = { backendId: backendId, position: position, row: row };
    items.push(entry);
    var list = byOrder.get(orderId);
    if (!list) byOrder.set(orderId, list = []);
    if (!list.some(function (known) { return known.backendId === backendId; })) list.push(entry);
  });
  return {
    items: items,
    byOrder: byOrder,
    prices: source.productPrices ? rowsById(source.productPrices) : null,
    products: source.products ? rowsById(source.products) : null,
  };
}

function rankOf(entry) {
  var rank = finiteNumber(entry.row.sortOrder);
  return rank === null ? Number.MAX_SAFE_INTEGER : rank;
}

function readRows(value) {
  if (Array.isArray(value)) return value;
  return value && Array.isArray(value.result) ? value.result : null;
}

function readSummaries(reads) {
  var summary = {};
  Object.keys(reads).forEach(function (key) {
    var read = reads[key] || {};
    summary[key] = { state: text(read.state) || "ready", scopeMode: scopeModeOf(read.scopeMode), truncated: !!read.truncated };
  });
  return summary;
}

function failedRead(read) {
  var state = read && text(read.state);
  return state === "unauthorized" ? "unauthorized" : "error";
}

function scopeModeOf(value) {
  return SCOPE_MODES.indexOf(value) === -1 ? null : value;
}

function rowsById(rows) {
  var found = new Map();
  (Array.isArray(rows) ? rows : []).forEach(function (row) {
    var id = positiveInteger(row && row.id);
    if (id && !found.has(id)) found.set(id, row);
  });
  return found;
}

function propertyIndex(properties) {
  var index = new Map();
  (properties || []).forEach(function (property) {
    var backendId = positiveInteger(property && property.backendId);
    if (backendId && !index.has(backendId)) index.set(backendId, property);
  });
  return index;
}

function packageIndex(agreements) {
  var index = new Map();
  agreements.forEach(function (agreement) {
    agreement.orderBackendIds.forEach(function (id) {
      var current = index.get(id);
      if (!current || current.backendId < agreement.backendId) index.set(id, agreement);
    });
  });
  return index;
}

function propertyTitle(propertyBackendId, property, serviceAddress) {
  if (property && property.name) return property.name;
  if (serviceAddress) return serviceAddress;
  return propertyBackendId ? "Property details unavailable" : "No property on this quote";
}

function propertyAddress(property, serviceAddress, title) {
  var address = serviceAddress || (property && property.address) || "";
  return address && address !== title ? address : "";
}

function firstServiceAddress(orders) {
  var found = orders.find(function (order) { return !!order.serviceAddress; });
  return found ? found.serviceAddress : "";
}

function byStage(left, right) {
  return stageRank(left.agreement) - stageRank(right.agreement) || right.agreement.backendId - left.agreement.backendId;
}

function stageRank(agreement) {
  if (!agreement) return STAGE_ORDER.length + 1;
  var index = STAGE_ORDER.indexOf(agreement.stage);
  return index === -1 ? STAGE_ORDER.length : index;
}

function htmlToText(source) {
  return decodeEntities(source
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*h[1-6](\s[^>]*)?>/gi, "\n\n# ")
    .replace(/<\s*li(\s[^>]*)?>/gi, "\n- ")
    .replace(/<\s*\/\s*(p|div|h[1-6]|ul|ol|li|section|article|blockquote|table|tr)\s*>/gi, "\n\n")
    .replace(/<\s*(p|div|ul|ol|section|article|blockquote|table|tr)(\s[^>]*)?>/gi, "\n\n")
    .replace(/<[^>]*>/g, ""));
}

function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function (match, name) {
    var lower = name.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    if (lower === "quot") return "\"";
    if (lower === "apos") return "'";
    if (lower === "nbsp") return " ";
    var point = lower.charAt(1) === "x" ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
    return Number.isFinite(point) && point > 0 && point <= 1114111 ? String.fromCodePoint(point) : match;
  });
}

function agreementStage(stage, label, tone) {
  return Object.freeze({ stage: stage, label: label, tone: tone });
}

function listRows(payload) {
  if (Array.isArray(payload)) return payload;
  return payload && Array.isArray(payload.result) ? payload.result : [];
}

function attributeString(row, code) {
  var entry = attributeEntry(row, code);
  return entry && typeof entry.value === "string" ? entry.value.trim() : "";
}

function attributeIds(row, code) {
  var entry = attributeEntry(row, code);
  return idList(entry ? entry.value : null);
}

function idList(value) {
  var parts = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : value == null ? [] : [value];
  var ids = [];
  parts.forEach(function (part) {
    var id = positiveInteger(part && typeof part === "object" ? part.id : part);
    if (id && ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  var name = localized && (localized.NAME || localized.name);
  return typeof name === "string" ? name.trim() : "";
}

function currencyCode(currency) {
  var code = text(currency && currency.code);
  return /^[A-Z]{3}$/.test(code) ? code : "";
}

function orderTotal(amount, currency) {
  var value = finiteNumber(amount);
  var code = currencyCode(currency);
  return value !== null && value > 0 && code ? { amount: value, currency: code } : null;
}

function formatQuantity(value) {
  var number = finiteNumber(value);
  return number === null ? "" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(number);
}

function finiteNumber(value) {
  var number = typeof value === "number" ? value
    : typeof value === "string" && value.trim() !== "" ? Number(value)
    : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function isoDate(value) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
  if (!match) return null;
  var year = Number(match[1]);
  var month = Number(match[2]);
  var day = Number(match[3]);
  var date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? match[0] : null;
}

function datePeriod(start, end) {
  var from = isoDate(start);
  var to = isoDate(end);
  return from && to && from <= to ? { start: from, end: to } : null;
}

function sharedPeriod(orders) {
  var first = orders.length ? orders[0].servicePeriod : null;
  if (!first) return null;
  return orders.every(function (order) {
    return !!order.servicePeriod && order.servicePeriod.start === first.start && order.servicePeriod.end === first.end;
  }) ? first : null;
}

function byPricingModel(left, right) {
  return pricingRank(left) - pricingRank(right) || left.backendId - right.backendId;
}

function pricingRank(order) {
  var index = order.pricingModel ? PRICING_MODEL_RANK.indexOf(order.pricingModel.code) : -1;
  return index === -1 ? PRICING_MODEL_RANK.length : index;
}

function isOpen(order) {
  return order.status === "unseen" || order.status === "viewed";
}

function hasStatus(status) {
  return function (order) { return order.status === status; };
}

function own(map, key) {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

function tenths(value) {
  return Math.round(value * 10) / 10;
}
