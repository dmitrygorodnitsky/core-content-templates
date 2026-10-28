import { attributeNumber, attributeText, latestStateCode, positiveInteger, text } from "./core-record.js";
import { formatIsoDate, formatMoney } from "./contracts.js";

export var INVOICE_STATUS = Object.freeze({
  OVERDUE: Object.freeze({ label: "Overdue", tone: "danger", open: true }),
  SENT: Object.freeze({ label: "Due", tone: "info", open: true }),
  PAID: Object.freeze({ label: "Paid", tone: "ok", open: false }),
  VOID: Object.freeze({ label: "Void", tone: "scheduled", open: false }),
});

export function normalizeInvoices(raw) {
  var rows = Array.isArray(raw && raw.items) ? raw.items : [];
  return {
    state: "ready",
    truncated: !!(raw && raw.truncated),
    items: rows.map(invoiceRecord).filter(Boolean),
  };
}

export function openInvoices(envelope) {
  return ((envelope && envelope.items) || []).filter(function (invoice) { return invoice.open; }).sort(function (left, right) {
    var overdue = Number(right.stateCode === "OVERDUE") - Number(left.stateCode === "OVERDUE");
    return overdue || (left.due || "9999-99-99").localeCompare(right.due || "9999-99-99") || left.backendId - right.backendId;
  });
}

export function findInvoice(envelope, id) {
  return ((envelope && envelope.items) || []).find(function (invoice) { return invoice.id === id; }) || null;
}

export function invoiceTitle(invoice) {
  return invoice.period || formatIsoDate(invoice.issued) || "Invoice";
}

export function invoiceStatusLine(invoice) {
  if (invoice.stateCode === "SENT" && invoice.due) return "Due on " + formatIsoDate(invoice.due);
  return invoice.status.label;
}

export function invoiceAmount(invoice) {
  return formatMoney(invoice.total, invoice.currency);
}

export function invoiceTerms(invoice) {
  return invoice.netDays ? "Net " + invoice.netDays : "";
}

function invoiceRecord(row) {
  var backendId = positiveInteger(row && row.id);
  var stateCode = latestStateCode(row);
  var status = Object.prototype.hasOwnProperty.call(INVOICE_STATUS, stateCode) ? INVOICE_STATUS[stateCode] : null;
  if (!backendId || !status) return null;
  var currency = text(row.order && row.order.currency && row.order.currency.code);
  return {
    id: "invoice-core-" + backendId,
    backendId: backendId,
    stateCode: stateCode,
    status: { label: status.label, tone: status.tone },
    open: status.open,
    period: attributeText(row, "SERVICE_PERIOD"),
    issued: isoDate(attributeText(row, "DATE")),
    due: isoDate(row.dueDate),
    netDays: attributeNumber(row, "PAYMENT_NET_TERMS"),
    currency: currency,
    total: finiteNumber(row.amountDue),
    paid: finiteNumber(row.totalPaidAmount),
    lines: (Array.isArray(row.items) ? row.items : []).map(function (item) { return lineRecord(item, currency); }).filter(Boolean),
  };
}

function lineRecord(item, currency) {
  var amount = finiteNumber(item && item.amount);
  if (amount === null) return null;
  var count = finiteNumber(item.itemCount);
  var quantity = count !== null && count > 0 ? count : 1;
  var product = item.itemPrice && item.itemPrice.product;
  return {
    id: positiveInteger(item.id),
    name: localizedName(product && product.nls) || "Service",
    quantity: quantity,
    amount: formatMoney(amount * quantity, currency),
  };
}

function isoDate(value) {
  var parts = Array.isArray(value) ? value : /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
  if (!parts) return "";
  var numbers = Array.isArray(value) ? parts.slice(0, 3).map(Number) : parts.slice(1, 4).map(Number);
  var date = new Date(Date.UTC(numbers[0], numbers[1] - 1, numbers[2]));
  if (date.getUTCFullYear() !== numbers[0] || date.getUTCMonth() !== numbers[1] - 1 || date.getUTCDate() !== numbers[2]) return "";
  return numbers[0] + "-" + String(numbers[1]).padStart(2, "0") + "-" + String(numbers[2]).padStart(2, "0");
}

function finiteNumber(value) {
  var number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  return text(localized && (localized.NAME || localized.name));
}
