import { state } from "./state.js";
import { coreSessionFetch } from "./adapters/core-oidc-adapter.js";
import { readTicket, readTicketEvents, readTicketFile, sendTicketEvent } from "./adapters/core-snow-adapter.js";
import { SUPPORT_TICKET_COMMENT_FORM, createCoreProfileFormAdapter } from "./adapters/core-profile-form-adapter.js";
import { TICKET_STATUS, normalizeTicket } from "./normalizers/support.js";
import { positiveInteger, text } from "./normalizers/core-record.js";
import { ATTACHMENT_COPY, attachmentProblem, attachmentsValue, readAttachment } from "./support-attachments.js";
import { RICH_HTML_LIMIT, RICH_TEXT_LIMIT, parseRichHtml, richText } from "./rich-text.js";

export const TICKET_ACTION_NOTE = "Marked by the client in the portal.";

export const TICKET_ACTIONS = Object.freeze({
  "NEW-WAITING": Object.freeze({ label: "Put on hold", attributes: Object.freeze({ WAITING_REASON: "AWAITING_CUSTOMER" }) }),
  "IN_PROGRESS-WAITING": Object.freeze({ label: "Put on hold", attributes: Object.freeze({ WAITING_REASON: "AWAITING_CUSTOMER" }) }),
  "WAITING-IN_PROGRESS": Object.freeze({ label: "Resume", attributes: Object.freeze({}) }),
  "NEW-CLOSED": Object.freeze({ label: "Mark resolved", attributes: Object.freeze({ CLOSURE_OUTCOME: "RESOLVED", CLOSURE_COMMENT: TICKET_ACTION_NOTE }) }),
  "IN_PROGRESS-RESOLVED": Object.freeze({ label: "Mark resolved", attributes: Object.freeze({ RESOLUTION_SUMMARY: TICKET_ACTION_NOTE }) }),
  "WAITING-RESOLVED": Object.freeze({ label: "Mark resolved", attributes: Object.freeze({ RESOLUTION_SUMMARY: TICKET_ACTION_NOTE }) }),
  "RESOLVED-IN_PROGRESS": Object.freeze({ label: "Reopen", attributes: Object.freeze({ RETURN_REASON: TICKET_ACTION_NOTE }) }),
  "RESOLVED-CLOSED": Object.freeze({ label: "Close", attributes: Object.freeze({ CLOSURE_OUTCOME: "RESOLVED" }) }),
});

export const TICKET_CONFIRM = Object.freeze({
  CLOSED: "This closes the ticket. You won’t be able to add comments afterwards, and only our team can reopen it.",
  RESOLVED: "Mark this ticket resolved? You can still reopen it or close it afterwards.",
});

export const COMMENT_COPY = Object.freeze({
  empty: "Write a message or attach a file.",
  long: "Keep the message under " + RICH_TEXT_LIMIT.toLocaleString("en-US") + " characters.",
  heavy: "This message has too much formatting. Shorten it and try again.",
  notSent: "Your comment wasn’t sent. Check your connection and try again.",
  serverError: "Your comment wasn’t sent: our system answered with an error. Please try again in a few minutes.",
  failed: "We couldn’t add your comment right now. Please try again in a few minutes.",
  refused: "We couldn’t add this comment.",
  slow: "We’re still adding your comment. You don’t need to send it again.",
  closed: "This ticket is closed. Open a new ticket if you need more help.",
});

export const ACTION_COPY = Object.freeze({
  refused: "This action wasn’t accepted. Nothing was changed.",
  failed: "We couldn’t reach our system. Nothing was changed; try again in a moment.",
  unconfirmed: "We sent your request, but the ticket hasn’t changed yet. Refresh in a moment.",
});

export const COMMENT_OUTCOMES = Object.freeze(["ADDED", "REFUSED", "FAILED"]);
export const COMMENT_FIELDS = Object.freeze(["MESSAGE", "ATTACHMENTS"]);
const COMMENT_TIMEOUT_MS = 60000;
const BUSY = Object.freeze(["sending", "waiting", "checking"]);

var details = new Map();
var files = new Map();

export function ticketBackendId(routeId) {
  var match = /^ticket-core-(\d+)$/.exec(text(routeId));
  return match ? positiveInteger(match[1]) : null;
}

export function ticketAction(event) {
  var code = text(event && event.code);
  var known = Object.prototype.hasOwnProperty.call(TICKET_ACTIONS, code) ? TICKET_ACTIONS[code] : null;
  var target = code.split("-")[1] || "";
  var named = text(event && event.nls && event.nls.en && event.nls.en.NAME);
  return {
    code: code,
    label: known ? known.label : named || humanize(target),
    attributes: known ? known.attributes : {},
    confirm: TICKET_CONFIRM[target] || "",
    target: target,
  };
}

export function ticketDetail(backendId, onChange, fetchImpl) {
  var id = positiveInteger(backendId);
  if (!id) return null;
  var key = detailKey(id);
  var entry = details.get(key);
  if (entry) return entry;
  entry = { backendId: id, status: "loading", ticket: null, events: { status: "loading", list: [] }, action: null, refreshing: false };
  details.set(key, entry);
  load(entry, onChange, fetchImpl);
  return entry;
}

export function refreshTicketDetail(backendId, onChange, fetchImpl) {
  var entry = details.get(detailKey(positiveInteger(backendId)));
  if (!entry) return ticketDetail(backendId, onChange, fetchImpl) ? Promise.resolve(true) : Promise.resolve(false);
  if (entry.refreshing) return Promise.resolve(false);
  entry.refreshing = true;
  if (entry.action && entry.action.phase !== "sending") entry.action = null;
  if (onChange) onChange();
  return load(entry, onChange, fetchImpl).then(function () { return true; });
}

function load(entry, onChange, fetchImpl) {
  var context = { config: state.config, state: state };
  var fetcher = fetchImpl || coreSessionFetch;
  var ticket = readTicket(context, entry.backendId, fetcher).then(function (row) {
    var normalized = normalizeTicket(row);
    entry.ticket = normalized;
    entry.status = normalized ? "ready" : "not-found";
  }, function (error) {
    if (error && error.code === "session-expired") state.account = "session-expired";
    entry.status = error && (error.code === "not-found" || error.code === "customer-forbidden") ? "not-found" : entry.ticket ? "ready" : "error";
  });
  var events = readTicketEvents(context, entry.backendId, fetcher).then(function (rows) {
    entry.events = { status: "ready", list: rows.map(ticketAction).filter(function (action) { return !!action.code; }) };
  }, function () {
    entry.events = { status: "error", list: [] };
  });
  return Promise.all([ticket, events]).then(function () {
    entry.refreshing = false;
    if (onChange) onChange();
  });
}

export function requestTicketAction(backendId, code, onChange, fetchImpl) {
  var entry = details.get(detailKey(positiveInteger(backendId)));
  if (!entry || entry.refreshing || (entry.action && entry.action.phase === "sending")) return Promise.resolve(false);
  var action = entry.events.list.find(function (item) { return item.code === code; });
  if (!action) return Promise.resolve(false);
  if (action.confirm) {
    entry.action = { phase: "confirm", code: code, message: "" };
    if (onChange) onChange();
    return Promise.resolve(true);
  }
  return sendAction(entry, action, onChange, fetchImpl);
}

export function confirmTicketAction(backendId, onChange, fetchImpl) {
  var entry = details.get(detailKey(positiveInteger(backendId)));
  if (!entry || !entry.action || entry.action.phase !== "confirm") return Promise.resolve(false);
  var action = entry.events.list.find(function (item) { return item.code === entry.action.code; });
  if (!action) return Promise.resolve(false);
  return sendAction(entry, action, onChange, fetchImpl);
}

export function cancelTicketAction(backendId) {
  var entry = details.get(detailKey(positiveInteger(backendId)));
  if (!entry || !entry.action || entry.action.phase === "sending") return false;
  entry.action = null;
  return true;
}

function sendAction(entry, action, onChange, fetchImpl) {
  var context = { config: state.config, state: state };
  var fetcher = fetchImpl || coreSessionFetch;
  var before = entry.ticket ? entry.ticket.stateCode : "";
  var attributes = {};
  Object.keys(action.attributes).forEach(function (code) { attributes[code] = { value: action.attributes[code] }; });
  entry.action = { phase: "sending", code: action.code, message: "" };
  if (onChange) onChange();
  return sendTicketEvent(context, entry.backendId, action.code, attributes, fetcher).then(function () {
    return load(entry, null, fetchImpl).then(function () {
      var after = entry.ticket ? entry.ticket.stateCode : "";
      entry.action = after && after !== before ? { phase: "done", code: action.code, message: "" } : { phase: "unconfirmed", code: action.code, message: ACTION_COPY.unconfirmed };
      if (onChange) onChange("action-" + entry.action.phase);
      return entry.action.phase === "done";
    });
  }, function (error) {
    if (error && error.code === "session-expired") state.account = "session-expired";
    entry.action = { phase: "failed", code: action.code, message: error && (error.code === "command-refused" || error.code === "customer-forbidden" || error.status >= 500) ? ACTION_COPY.refused : ACTION_COPY.failed };
    return load(entry, null, fetchImpl).then(function () {
      if (onChange) onChange("action-failed");
      return false;
    });
  });
}

export function ticketComment(backendId) {
  var id = positiveInteger(backendId);
  if (!state.ticketComments) state.ticketComments = {};
  if (!state.ticketComments[id]) state.ticketComments[id] = freshComment();
  return state.ticketComments[id];
}

function freshComment() {
  return { html: "", files: [], errors: {}, phase: "editing", message: "", formId: null, reading: false, sentAt: 0 };
}

export function ticketCommentBusy(comment) {
  return !!comment && BUSY.indexOf(comment.phase) !== -1;
}

export function changeTicketComment(backendId, html) {
  var comment = ticketComment(backendId);
  if (ticketCommentBusy(comment)) return false;
  comment.html = String(html == null ? "" : html);
  delete comment.errors.MESSAGE;
  return true;
}

export function addAttachments(target, picked, onChange) {
  if (!target || target.reading) return Promise.resolve(false);
  target.reading = true;
  delete target.errors.ATTACHMENTS;
  if (onChange) onChange();
  return Promise.all(picked.map(readAttachment)).then(function (read) {
    target.reading = false;
    if (read.some(function (file) { return !file; })) {
      target.errors.ATTACHMENTS = ATTACHMENT_COPY.unreadable;
    } else {
      var problem = attachmentProblem(target.files, read);
      if (problem) target.errors.ATTACHMENTS = problem;
      else target.files = target.files.concat(read);
    }
    if (onChange) onChange();
    return !target.errors.ATTACHMENTS;
  });
}

export function removeAttachment(target, key) {
  if (!target || target.reading) return false;
  var before = target.files.length;
  target.files = target.files.filter(function (file) { return file.key !== key; });
  delete target.errors.ATTACHMENTS;
  return target.files.length !== before;
}

export function richMessageProblem(html, required, copy) {
  var tree = parseRichHtml(html);
  var visible = richText(tree).trim();
  if (!visible) return required ? copy.empty : "";
  if (visible.length > RICH_TEXT_LIMIT) return copy.long;
  if (String(html).length > RICH_HTML_LIMIT) return copy.heavy;
  return "";
}

export function validateTicketComment(comment) {
  var errors = {};
  var problem = richMessageProblem(comment.html, !comment.files.length, COMMENT_COPY);
  if (problem) errors.MESSAGE = problem;
  var files = attachmentProblem([], comment.files);
  if (files) errors.ATTACHMENTS = files;
  return errors;
}

export function ticketCommentValues(backendId, comment) {
  var values = { TICKET_ID: positiveInteger(backendId) };
  if (richText(parseRichHtml(comment.html)).trim()) values.MESSAGE = comment.html;
  var attachments = attachmentsValue(comment.files);
  if (attachments) values.ATTACHMENTS = attachments;
  return values;
}

export function submitTicketComment(backendId, options) {
  var settings = options || {};
  var changed = settings.onChange || function () {};
  var comment = ticketComment(backendId);
  if (ticketCommentBusy(comment) || comment.reading) return Promise.resolve(false);
  var detail = details.get(detailKey(positiveInteger(backendId)));
  if (detail && detail.ticket && detail.ticket.stateCode === "CLOSED") {
    comment.message = COMMENT_COPY.closed;
    changed("closed");
    return Promise.resolve(false);
  }
  var errors = validateTicketComment(comment);
  if (Object.keys(errors).length) {
    comment.errors = errors;
    comment.message = "";
    changed("invalid");
    return Promise.resolve(false);
  }
  var forms = settings.forms || createCoreProfileFormAdapter({ timeoutMs: COMMENT_TIMEOUT_MS, wait: settings.wait, now: settings.now });
  var context = { config: state.config, state: state };
  comment.phase = "sending";
  comment.errors = {};
  comment.message = "";
  changed("sending");
  return Promise.resolve()
    .then(function () { return forms.submit(SUPPORT_TICKET_COMMENT_FORM, ticketCommentValues(backendId, comment), context); })
    .then(function (formId) {
      if (ticketComment(backendId) !== comment) return false;
      comment.formId = formId;
      comment.phase = "waiting";
      changed("waiting");
      return awaitComment(backendId, comment, forms, context, settings);
    }, function (error) {
      if (error && error.code === "session-expired") state.account = "session-expired";
      comment.phase = "editing";
      comment.message = error && error.status >= 500 ? COMMENT_COPY.serverError : COMMENT_COPY.notSent;
      changed("not-sent");
      return false;
    });
}

export function checkTicketCommentAgain(backendId, options) {
  var settings = options || {};
  var comment = ticketComment(backendId);
  if (comment.phase !== "slow" || !comment.formId) return Promise.resolve(false);
  comment.phase = "checking";
  (settings.onChange || function () {})("checking");
  var forms = settings.forms || createCoreProfileFormAdapter({ timeoutMs: COMMENT_TIMEOUT_MS, wait: settings.wait, now: settings.now });
  return awaitComment(backendId, comment, forms, { config: state.config, state: state }, settings);
}

function awaitComment(backendId, comment, forms, context, settings) {
  var changed = settings.onChange || function () {};
  return Promise.resolve()
    .then(function () { return forms.report(SUPPORT_TICKET_COMMENT_FORM, comment.formId, context, COMMENT_OUTCOMES); })
    .then(function (report) {
      if (report.outcome === "ADDED") {
        state.ticketComments[positiveInteger(backendId)] = Object.assign(freshComment(), { sentAt: Date.now() });
        changed("added");
        return refreshTicketDetail(backendId, settings.onChange, settings.fetch).then(function () { return true; });
      }
      comment.phase = "editing";
      comment.formId = null;
      var field = text(report.field);
      var said = text(report.message);
      if (report.outcome === "REFUSED" && COMMENT_FIELDS.indexOf(field) !== -1) {
        comment.errors = {};
        comment.errors[field] = said || COMMENT_COPY.refused;
      } else {
        comment.message = report.outcome === "REFUSED" ? said || COMMENT_COPY.refused : COMMENT_COPY.failed;
      }
      changed(report.outcome === "REFUSED" ? "refused" : "failed");
      return false;
    }, function (error) {
      if (error && error.code === "session-expired") state.account = "session-expired";
      comment.phase = "slow";
      comment.message = COMMENT_COPY.slow;
      changed("slow");
      return false;
    });
}

export function ticketFile(attachment, variant, onChange, fetchImpl) {
  var key = variant + ":" + attachment.id;
  var entry = files.get(key);
  if (entry) return entry;
  entry = { status: "loading", url: "" };
  files.set(key, entry);
  readTicketFile({ config: state.config, state: state }, attachment.id, variant, fetchImpl || coreSessionFetch).then(function (blob) {
    entry.url = globalThis.URL.createObjectURL(blob);
    entry.status = "ready";
  }, function () {
    entry.status = "error";
  }).then(function () {
    if (onChange) onChange();
  });
  return entry;
}

export function openTicketFile(mediaId, fetchImpl) {
  var opened = globalThis.open ? globalThis.open("", "_blank") : null;
  var cached = files.get("file:" + mediaId);
  if (cached && cached.status === "ready") return Promise.resolve(navigate(opened, cached.url));
  if (cached && cached.status === "error") files.delete("file:" + mediaId);
  var entry = ticketFile({ id: mediaId }, "file", null, fetchImpl);
  return new Promise(function (resolve) {
    var wait = function () {
      if (entry.status === "loading") { setTimeout(wait, 100); return; }
      resolve(entry.status === "ready" ? navigate(opened, entry.url) : fail(opened));
    };
    wait();
  });
}

function navigate(tab, url) {
  if (tab && tab.location) {
    tab.location.replace(url);
    return true;
  }
  if (globalThis.location) globalThis.location.assign(url);
  return true;
}

function fail(tab) {
  if (tab && typeof tab.close === "function") tab.close();
  return false;
}

export function ticketStatus(code) {
  return Object.prototype.hasOwnProperty.call(TICKET_STATUS, code) ? TICKET_STATUS[code] : null;
}

function detailKey(backendId) {
  var account = state.customerAccount && state.customerAccount.id;
  return account + ":" + backendId;
}

function humanize(code) {
  var words = String(code || "").toLowerCase().split("_").filter(Boolean).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Update";
}
