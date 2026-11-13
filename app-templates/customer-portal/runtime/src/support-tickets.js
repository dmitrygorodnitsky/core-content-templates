import { liveProperties, liveVisits, state } from "./state.js";
import { positiveInteger, text } from "./normalizers/core-record.js";
import { SUPPORT_TICKET_FORM, createCoreProfileFormAdapter } from "./adapters/core-profile-form-adapter.js";
import { attachmentProblem, attachmentsValue } from "./support-attachments.js";
import { richMessageProblem } from "./support-thread.js";
import { RICH_TEXT_LIMIT } from "./rich-text.js";

export const SUPPORT_TICKET_OUTCOMES = Object.freeze(["CREATED", "REFUSED", "FAILED"]);
export const SUPPORT_TICKET_FIELDS = Object.freeze(["PROPERTY_ID", "VISIT_ID", "CONTACT_REASON", "SUBJECT", "MESSAGE", "ATTACHMENTS"]);
export const SUPPORT_SUBJECT_LIMIT = 150;
export const SUPPORT_MESSAGE_LIMIT = RICH_TEXT_LIMIT;
export const SUPPORT_TICKET_OUTCOME_TIMEOUT_MS = 60000;

export const SUPPORT_TICKET_COPY = Object.freeze({
  propertyMissing: "Choose the property this is about.",
  subjectMissing: "Add a short subject.",
  subjectLong: "Keep the subject under " + SUPPORT_SUBJECT_LIMIT + " characters.",
  messageMissing: "Tell us what happened.",
  messageLong: "Keep the message under " + SUPPORT_MESSAGE_LIMIT.toLocaleString("en-US") + " characters.",
  messageHeavy: "This message has too much formatting. Shorten it and try again.",
  notSent: "Your ticket wasn’t sent. Check your connection and try again.",
  serverError: "Your ticket wasn’t sent: our system answered with an error. Nothing was saved. Please try again in a few minutes or contact us directly.",
  failed: "We couldn’t open your ticket right now. Please try again in a few minutes.",
  refused: "We couldn’t open this ticket. Check the form and try again.",
});

const BUSY_PHASES = Object.freeze(["sending", "waiting", "checking"]);

export function supportTicketsOpen(config) {
  return !!config && config.vertical === "snow" && config.dataMode === "live" && (config.enabledModules || []).indexOf("support") !== -1;
}

export function supportTicketState() {
  if (!state.supportTicket) state.supportTicket = freshTicket(null, null);
  return state.supportTicket;
}

export function supportTicketBusy() {
  return !!state.supportTicket && BUSY_PHASES.indexOf(state.supportTicket.phase) !== -1;
}

export function startSupportTicket(propertyBackendId, visitBackendId) {
  if (supportTicketBusy()) return false;
  var visit = knownVisit(positiveInteger(visitBackendId));
  var property = knownProperty(positiveInteger(propertyBackendId) || (visit && visit.propertyBackendId));
  var only = liveProperties().length === 1 ? liveProperties()[0] : null;
  state.supportTicket = freshTicket(property || only, visit && property && visit.propertyBackendId === property.backendId ? visit : null);
  return true;
}

function freshTicket(property, visit) {
  return {
    phase: "editing",
    draft: { propertyId: property ? property.backendId : null, visitId: visit ? visit.backendId : null, reason: "", subject: "", message: "" },
    files: [],
    reading: false,
    errors: {},
    message: "",
    formId: null,
    ticketCode: "",
  };
}

function knownProperty(backendId) {
  return backendId ? liveProperties().find(function (property) { return property.backendId === backendId; }) || null : null;
}

function knownVisit(backendId) {
  var visits = liveVisits();
  if (!backendId || !visits) return null;
  return visits.upcoming.concat(visits.past, visits.cancelled || []).find(function (visit) { return visit.backendId === backendId; }) || null;
}

export function visitsOfProperty(propertyBackendId) {
  var visits = liveVisits();
  if (!visits || !propertyBackendId) return [];
  return visits.upcoming.concat(visits.past).filter(function (visit) { return visit.propertyBackendId === propertyBackendId; })
    .sort(function (left, right) { return right.start.ms - left.start.ms; });
}

export function changeSupportTicketDraft(key, value) {
  var ticket = supportTicketState();
  if (supportTicketBusy()) return false;
  if (key === "propertyId") {
    var property = knownProperty(positiveInteger(value));
    ticket.draft.propertyId = property ? property.backendId : null;
    ticket.draft.visitId = null;
    delete ticket.errors.PROPERTY_ID;
    delete ticket.errors.VISIT_ID;
    return true;
  }
  if (key === "visitId") {
    var visit = knownVisit(positiveInteger(value));
    ticket.draft.visitId = visit && visit.propertyBackendId === ticket.draft.propertyId ? visit.backendId : null;
    delete ticket.errors.VISIT_ID;
    return true;
  }
  if (key === "reason") {
    ticket.draft.reason = text(value);
    delete ticket.errors.CONTACT_REASON;
    return true;
  }
  if (key === "subject" || key === "message") {
    ticket.draft[key] = String(value == null ? "" : value);
    delete ticket.errors[key === "subject" ? "SUBJECT" : "MESSAGE"];
    return true;
  }
  return false;
}

export function supportTicketSchema(type) {
  var attributes = {};
  (Array.isArray(type && type.attributes) ? type.attributes : []).forEach(function (attribute) {
    var code = text(attribute && attribute.code);
    if (code) attributes[code] = attribute;
  });
  var reason = attributes.CONTACT_REASON || {};
  return {
    reasons: (Array.isArray(reason.options) ? reason.options : []).map(function (option) {
      var value = text(option && option.value);
      return value ? { value: value, label: localizedName(option.nls) || reasonLabel(value) } : null;
    }).filter(Boolean),
  };
}

export function reasonLabel(value, schema) {
  var code = text(value);
  var known = schema && (schema.reasons || []).find(function (reason) { return reason.value === code; });
  if (known) return known.label;
  var words = code.toLowerCase().split("_").filter(Boolean).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

function localizedName(nls) {
  return text(nls && nls.en && nls.en.NAME);
}

export function loadSupportTicketSchema(options) {
  var settings = options || {};
  var current = state.supportTicketSchema;
  if (current && current.state !== "error") return Promise.resolve(current);
  var forms = settings.forms || createCoreProfileFormAdapter();
  var loading = { state: "loading", schema: null };
  state.supportTicketSchema = loading;
  return Promise.resolve()
    .then(function () { return forms.type(SUPPORT_TICKET_FORM, { config: state.config, state: state }); })
    .then(function (type) {
      if (state.supportTicketSchema !== loading) return state.supportTicketSchema;
      state.supportTicketSchema = { state: "ready", schema: supportTicketSchema(type) };
      return state.supportTicketSchema;
    }, function (error) {
      if (state.supportTicketSchema !== loading) return state.supportTicketSchema;
      if (error && error.code === "session-expired") state.account = "session-expired";
      state.supportTicketSchema = { state: "error", schema: null };
      return state.supportTicketSchema;
    })
    .then(function (result) {
      if (settings.onChange) settings.onChange();
      return result;
    });
}

export function validateSupportTicket(draft) {
  var errors = {};
  var subject = text(draft.subject);
  if (!draft.propertyId) errors.PROPERTY_ID = SUPPORT_TICKET_COPY.propertyMissing;
  if (!subject) errors.SUBJECT = SUPPORT_TICKET_COPY.subjectMissing;
  else if (subject.length > SUPPORT_SUBJECT_LIMIT) errors.SUBJECT = SUPPORT_TICKET_COPY.subjectLong;
  var problem = richMessageProblem(draft.message, true, { empty: SUPPORT_TICKET_COPY.messageMissing, long: SUPPORT_TICKET_COPY.messageLong, heavy: SUPPORT_TICKET_COPY.messageHeavy });
  if (problem) errors.MESSAGE = problem;
  var files = attachmentProblem([], draft.files || []);
  if (files) errors.ATTACHMENTS = files;
  return errors;
}

export function supportTicketValues(draft) {
  var values = { PROPERTY_ID: draft.propertyId, SUBJECT: text(draft.subject), MESSAGE: text(draft.message) };
  if (draft.visitId) values.VISIT_ID = draft.visitId;
  if (draft.reason) values.CONTACT_REASON = draft.reason;
  var attachments = attachmentsValue(draft.files);
  if (attachments) values.ATTACHMENTS = attachments;
  return values;
}

export function submitSupportTicket(options) {
  var settings = options || {};
  var ticket = supportTicketState();
  var changed = settings.onChange || function () {};
  if (supportTicketBusy() || ticket.phase === "created") return Promise.resolve(false);
  if (ticket.reading) return Promise.resolve(false);
  var draft = Object.assign({}, ticket.draft, { files: ticket.files });
  var errors = validateSupportTicket(draft);
  if (Object.keys(errors).length) {
    ticket.errors = errors;
    ticket.message = "";
    changed("invalid");
    return Promise.resolve(false);
  }
  var forms = settings.forms || outcomeForms(settings);
  var context = { config: state.config, state: state };
  ticket.phase = "sending";
  ticket.errors = {};
  ticket.message = "";
  changed("sending");
  return Promise.resolve()
    .then(function () { return forms.submit(SUPPORT_TICKET_FORM, supportTicketValues(draft), context); })
    .then(function (formId) {
      if (state.supportTicket !== ticket) return false;
      ticket.formId = formId;
      ticket.phase = "waiting";
      changed("waiting");
      return awaitOutcome(ticket, forms, context, settings);
    }, function (error) {
      if (state.supportTicket !== ticket) return false;
      if (error && error.code === "session-expired") return sessionEnded(ticket, changed);
      ticket.phase = "editing";
      ticket.message = error && error.status >= 500 ? SUPPORT_TICKET_COPY.serverError : SUPPORT_TICKET_COPY.notSent;
      changed("not-sent");
      return false;
    });
}

export function checkSupportTicketAgain(options) {
  var settings = options || {};
  var ticket = state.supportTicket;
  if (!ticket || ticket.phase !== "slow" || !ticket.formId) return Promise.resolve(false);
  ticket.phase = "checking";
  (settings.onChange || function () {})("checking");
  return awaitOutcome(ticket, settings.forms || outcomeForms(settings), { config: state.config, state: state }, settings);
}

function outcomeForms(settings) {
  return createCoreProfileFormAdapter({ timeoutMs: SUPPORT_TICKET_OUTCOME_TIMEOUT_MS, wait: settings.wait, now: settings.now });
}

function awaitOutcome(ticket, forms, context, settings) {
  var changed = settings.onChange || function () {};
  return Promise.resolve()
    .then(function () { return forms.report(SUPPORT_TICKET_FORM, ticket.formId, context, SUPPORT_TICKET_OUTCOMES); })
    .then(function (report) {
      if (state.supportTicket !== ticket) return false;
      return settle(ticket, report, settings);
    }, function (error) {
      if (state.supportTicket !== ticket) return false;
      if (error && error.code === "session-expired") return sessionEnded(ticket, changed);
      ticket.phase = "slow";
      changed("slow");
      return false;
    });
}

function settle(ticket, report, settings) {
  var changed = settings.onChange || function () {};
  if (report.outcome === "CREATED") {
    ticket.phase = "created";
    ticket.ticketCode = text(report.ticketCode);
    ticket.ticketId = positiveInteger(report.ticketId);
    ticket.message = text(report.message);
    changed("created");
    if (settings.reload) Promise.resolve().then(function () { return settings.reload("support"); }).catch(function () { return null; });
    return true;
  }
  ticket.phase = "editing";
  ticket.formId = null;
  var field = text(report.field);
  var said = text(report.message);
  if (report.outcome === "REFUSED" && SUPPORT_TICKET_FIELDS.indexOf(field) !== -1) {
    ticket.errors = {};
    ticket.errors[field] = said || SUPPORT_TICKET_COPY.refused;
    changed("refused");
    return false;
  }
  ticket.message = report.outcome === "REFUSED" ? said || SUPPORT_TICKET_COPY.refused : SUPPORT_TICKET_COPY.failed;
  changed(report.outcome === "REFUSED" ? "refused" : "failed");
  return false;
}

function sessionEnded(ticket, changed) {
  ticket.phase = "editing";
  state.account = "session-expired";
  changed("session-expired");
  return false;
}
