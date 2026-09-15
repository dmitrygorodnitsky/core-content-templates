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

var PRICING_MODEL_RANK = ["PER_SERVICE", "MONTHLY", "SEASONAL"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var SCHEMATIC_X = [18, 82];
var SCHEMATIC_Y = [24, 76];
var SCHEMATIC_MIN_SPAN = 0.01;
var DECISION_STATES = { declined: "DECLINED", revision: "CUSTOMER_CHANGES_REQUESTED", approved: "CLIENT_APPROVED" };

var PREPARING = agreementStage("preparing", "", "");
var DRAFTING = agreementStage("drafting", "Agreement in preparation", "scheduled");

export var AGREEMENT_STAGES = Object.freeze({
  QUOTATION: PREPARING,
  QUOTATION_SEND_FAILED: PREPARING,
  QUOTATION_SENT: agreementStage("review", "Awaiting your decisions", "info"),
  AWAITING_CLIENT_DETAILS: agreementStage("details", "Contract details needed", "warn"),
  DRAFT: DRAFTING,
  PENDING_MANAGEMENT_APPROVAL: DRAFTING,
  INTERNALLY_APPROVED: DRAFTING,
  AGREEMENT_SEND_FAILED: DRAFTING,
  SENT_TO_CLIENT: agreementStage("approval", "Ready for your approval", "warn"),
  CLIENT_APPROVED: agreementStage("approved", "Approved", "ok"),
  ACTIVE: agreementStage("active", "Active", "ok"),
  SUSPENDED: agreementStage("suspended", "Suspended", "warn"),
  EXPIRED: agreementStage("expired", "Expired", "scheduled"),
  ARCHIVED: agreementStage("archived", "Archived", "scheduled"),
  CANCELED: agreementStage("canceled", "Cancelled", "scheduled"),
});

export function normalizeQuoteOrders(payload) {
  var orders = [];
  var preparing = false;
  listRows(payload).forEach(function (row) {
    if (!row || typeof row !== "object") return;
    if (QUOTE_ORDER_TYPES.indexOf(text(row.type && row.type.code)) === -1) return;
    var backendId = positiveInteger(row.id);
    if (!backendId) return;
    var stateCode = latestStateCode(row);
    var status = own(CUSTOMER_ORDER_STATUS, stateCode);
    if (!status) {
      if (OPERATOR_ORDER_STATES.indexOf(stateCode) !== -1) preparing = true;
      return;
    }
    var model = attributeText(row, "PRICING_MODEL");
    var label = own(PRICING_MODELS, model);
    orders.push({
      id: "quote-core-" + backendId,
      backendId: backendId,
      propertyBackendId: attributeNumber(row, "SERVICE_PROPERTY"),
      stateCode: stateCode,
      status: status,
      pricingModel: label ? { code: model, label: label } : null,
      total: orderTotal(row.grandTotal, row.currency),
      servicePeriod: datePeriod(attributeText(row, "SERVICE_PERIOD_START"), attributeText(row, "SERVICE_PERIOD_END")),
    });
  });
  return { orders: orders, preparing: preparing };
}

export function normalizeServiceAgreement(document) {
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
  };
}

export function contractsPackage(source, properties) {
  var agreement = (source && source.agreement) || null;
  var orders = source && Array.isArray(source.orders) ? source.orders : [];
  var byBackendId = new Map();
  (properties || []).forEach(function (property) {
    var backendId = positiveInteger(property && property.backendId);
    if (backendId && !byBackendId.has(backendId)) byBackendId.set(backendId, property);
  });

  var groups = [];
  var keyed = new Map();
  orders.forEach(function (order) {
    var key = order.propertyBackendId || 0;
    var group = keyed.get(key);
    if (!group) {
      var property = key ? byBackendId.get(key) || null : null;
      group = {
        id: property ? property.quoteSiteId || property.id : key ? "prop-core-" + key : "",
        property: property,
        propertyBackendId: key || null,
        orders: [],
        decision: "open",
      };
      keyed.set(key, group);
      groups.push(group);
    }
    group.orders.push(order);
  });

  var counts = { orders: orders.length, properties: 0, decided: 0, approved: 0, revision: 0, declined: 0, open: 0 };
  groups.forEach(function (group) {
    group.orders.sort(byPricingModel);
    group.decision = groupDecision(group.orders);
    if (!group.propertyBackendId) return;
    counts.properties += 1;
    if (group.decision === "approved" || group.decision === "declined") counts.decided += 1;
  });
  orders.forEach(function (order) {
    if (isOpen(order)) counts.open += 1;
    else counts[order.status] += 1;
  });

  return {
    agreement: agreement && agreement.stage !== "preparing" ? agreement : null,
    preparing: !!(source && source.preparing) || !!(agreement && agreement.stage === "preparing"),
    groups: groups,
    counts: counts,
    servicePeriod: sharedPeriod(orders),
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

export function quoteViewStates(orders) {
  return (orders || []).filter(hasStatus("unseen")).map(function (order) {
    return { backendId: order.backendId, codes: ["QUOTE_VIEWED"] };
  });
}

export function quoteDecisionStates(orders, decision, pricingModelCode) {
  if (!own(DECISION_STATES, decision)) throw new Error("Unsupported quote decision");
  var open = (orders || []).filter(isOpen);
  if (!open.length) throw new Error("These quotes are not waiting for a decision");
  var chosen = decision === "approved"
    ? open.find(function (order) { return !!order.pricingModel && order.pricingModel.code === pricingModelCode; }) || null
    : null;
  if (decision === "approved" && !chosen) throw new Error("The selected option has no quote waiting for a decision");
  return open.map(function (order) {
    var codes = order.status === "unseen" ? ["QUOTE_VIEWED"] : [];
    codes.push(decision === "approved" && order !== chosen ? DECISION_STATES.declined : DECISION_STATES[decision]);
    return { backendId: order.backendId, codes: codes };
  });
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

export function formatIsoDate(value) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
  return match ? MONTHS[Number(match[2]) - 1] + " " + Number(match[3]) + ", " + match[1] : "";
}

export function formatDatePeriod(period) {
  return period ? formatIsoDate(period.start) + " – " + formatIsoDate(period.end) : "";
}

function agreementStage(stage, label, tone) {
  return Object.freeze({ stage: stage, label: label, tone: tone });
}

function listRows(payload) {
  if (Array.isArray(payload)) return payload;
  return payload && Array.isArray(payload.result) ? payload.result : [];
}

function attributeIds(row, code) {
  var entry = attributeEntry(row, code);
  var value = entry ? entry.value : null;
  var parts = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [value];
  var ids = [];
  parts.forEach(function (part) {
    var id = positiveInteger(part);
    if (id && ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}

function orderTotal(amount, currency) {
  var value = typeof amount === "number" ? amount
    : typeof amount === "string" && amount.trim() !== "" ? Number(amount)
    : Number.NaN;
  var code = text(currency && currency.code);
  return Number.isFinite(value) && value > 0 && /^[A-Z]{3}$/.test(code) ? { amount: value, currency: code } : null;
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
