import { attributeNumber, attributeText, latestStateCode, positiveInteger, text } from "./core-record.js";

export var TICKET_TYPE = "SUPPORT_TICKET";

export var TICKET_STATUS = Object.freeze({
  NEW: Object.freeze({ label: "Open", tone: "info", open: true }),
  IN_PROGRESS: Object.freeze({ label: "In review", tone: "progress", open: true }),
  WAITING: Object.freeze({ label: "In review", tone: "progress", open: true }),
  RESOLVED: Object.freeze({ label: "Resolved", tone: "ok", open: false }),
  CLOSED: Object.freeze({ label: "Closed", tone: "scheduled", open: false }),
});

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function normalizeTickets(raw) {
  var rows = Array.isArray(raw && raw.items) ? raw.items : [];
  var tickets = rows.map(ticketRecord).filter(Boolean).sort(function (left, right) { return right.openedMs - left.openedMs; });
  return {
    state: "ready",
    truncated: !!(raw && raw.truncated),
    open: tickets.filter(function (ticket) { return ticket.open; }),
    closed: tickets.filter(function (ticket) { return !ticket.open; }),
  };
}

export function ticketCount(envelope) {
  return envelope ? (envelope.open || []).length + (envelope.closed || []).length : 0;
}

export function openTicketForProperty(envelope, propertyBackendId) {
  if (!propertyBackendId) return null;
  return ((envelope && envelope.open) || []).find(function (ticket) { return ticket.propertyBackendId === propertyBackendId; }) || null;
}

export function openTicketForVisit(envelope, visitBackendId) {
  if (!visitBackendId) return null;
  return ((envelope && envelope.open) || []).find(function (ticket) { return ticket.visitBackendId === visitBackendId; }) || null;
}

export function propertyWithTicket(property, envelope) {
  var ticket = openTicketForProperty(envelope, property.backendId);
  return Object.assign({}, property, { ticket: ticket ? { id: ticket.id, state: ticket.stateCode } : null });
}

export function supportRequests(envelope, timeZone) {
  return ((envelope && envelope.open) || []).map(function (ticket) {
    return { id: ticket.id, title: ticket.subject, status: ticket.status.label, tone: ticket.status.tone, when: ticketOpened(ticket, timeZone) };
  });
}

export function ticketOpened(ticket, timeZone) {
  if (!ticket || !Number.isFinite(ticket.openedMs)) return "";
  var parts = { year: 0, month: 1, day: 1 };
  new Intl.DateTimeFormat("en-US", { timeZone: timeZone || undefined, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(ticket.openedMs)).forEach(function (part) {
    if (Object.prototype.hasOwnProperty.call(parts, part.type)) parts[part.type] = Number(part.value);
  });
  return MONTHS[parts.month - 1] + " " + parts.day + ", " + parts.year;
}

function ticketRecord(row) {
  var backendId = positiveInteger(row && row.id);
  var stateCode = latestStateCode(row);
  var status = Object.prototype.hasOwnProperty.call(TICKET_STATUS, stateCode) ? TICKET_STATUS[stateCode] : null;
  if (!backendId || !status || text(row.type && row.type.code) !== TICKET_TYPE) return null;
  var names = row.nls && row.nls.en ? row.nls.en : {};
  var opened = typeof row.created === "number" ? row.created : Number(row.created);
  return {
    id: "ticket-core-" + backendId,
    backendId: backendId,
    code: text(row.code),
    subject: text(names.NAME) || text(row.code),
    message: text(names.DESCRIPTION),
    openedMs: Number.isFinite(opened) ? opened : 0,
    stateCode: stateCode,
    status: { label: status.label, tone: status.tone },
    open: status.open,
    propertyBackendId: attributeNumber(row, "PROPERTY"),
    visitBackendId: attributeNumber(row, "RELATED_SERVICE_VISIT"),
    reason: attributeText(row, "CONTACT_REASON"),
  };
}
