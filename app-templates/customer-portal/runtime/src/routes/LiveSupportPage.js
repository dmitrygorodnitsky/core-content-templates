import { h } from "../dom.js";
import { liveListStatus, liveProperties, liveTickets, liveVisits, state } from "../state.js";
import { ACTIONS, ensureSupportTicketSchema } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { PendingNote } from "../components/proposals/ContractStates.js";
import { RecordSection } from "../components/storm/RecordRows.js";
import { ticketOpened } from "../normalizers/support.js";
import { RichTextEditor } from "../components/support/RichTextEditor.js";
import { AttachmentPicker } from "../components/support/AttachmentPicker.js";
import { addAttachments } from "../support-thread.js";
import { render } from "../app.js";
import { findVisit, localDateKey, visitWhen } from "../normalizers/visits.js";
import { SUPPORT_MESSAGE_LIMIT, SUPPORT_SUBJECT_LIMIT, changeSupportTicketDraft, reasonLabel, supportTicketBusy, supportTicketState, visitsOfProperty } from "../support-tickets.js";

var PROGRESS = {
  sending: "Sending your ticket…",
  waiting: "Ticket sent. Waiting for our system to open it…",
  checking: "Checking your ticket…",
};

export function LiveSupport() {
  var page = h("section", { "class": "page page--narrow", "data-route": "support", "data-visual-id": "support" });
  page.appendChild(h("div", { "class": "detail-bar support-head", "data-module": "support-head" }, [
    h("h1", { "class": "page-header__title" }, "Support"),
    ActionButton({ variant: "btn--primary", label: "Open support ticket", action: "support.newTicket", visualId: "support-new-ticket" }),
  ]));
  var status = liveListStatus("support");
  page.setAttribute("data-state", status);
  if (status !== "ready") {
    page.appendChild(listState(status));
    return page;
  }
  var tickets = liveTickets();
  var loaded = ensureSupportTicketSchema();
  var schema = loaded && loaded.state === "ready" ? loaded.schema : null;
  var row = function (ticket) { return TicketRow(ticket, schema); };
  if (tickets.open.length) page.appendChild(RecordSection("tickets-open", "Open", tickets.open.map(row)));
  if (tickets.closed.length) page.appendChild(RecordSection("tickets-closed", "Resolved and closed", tickets.closed.map(row)));
  return page;
}

function TicketRow(ticket, schema) {
  var reason = reasonLabel(ticket.reason, schema);
  var about = ticketPlace(ticket);
  var latest = latestReply(ticket);
  return h("button", { "class": "prop-visit record-row support-ticket", type: "button", "data-module": "ticket-row", "data-visual-id": "ticket-row", "data-action": "support.openTicket", "data-id": ticket.id, "data-state": ticket.stateCode.toLowerCase(), "aria-label": "Open ticket " + ticket.subject + " — " + ticket.status.label }, [
    h("span", { "class": "record-row__main" }, [
      h("span", { "class": "prop-visit__title" }, ticket.subject),
      h("span", { "class": "prop-visit__meta", "data-module": "ticket-meta" }, [ticket.code, reason, "Opened " + ticketOpened(ticket, state.config.timeZone)].filter(Boolean).join(" · ")),
      about ? h("span", { "class": "prop-visit__meta", "data-module": "ticket-about" }, about) : null,
      latest ? h("span", { "class": "prop-visit__meta support-ticket__latest", "data-module": "ticket-latest", "data-author": latest.author.toLowerCase() }, latest.author === "STAFF" ? "Support team replied · " + ticketMoment(latest.createdMs) : "You replied · " + ticketMoment(latest.createdMs)) : null,
      !ticket.thread && ticket.message ? h("span", { "class": "record-notes support-ticket__message" }, ticket.message) : null,
    ]),
    h("span", { "class": "status-badge status-badge--" + ticket.status.tone, "data-module": "ticket-status" }, ticket.status.label),
    h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "›"),
  ]);
}

function latestReply(ticket) {
  var comments = ticket.thread ? ticket.thread.comments : [];
  return comments.length ? comments[comments.length - 1] : null;
}

export function ticketMoment(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  return new Intl.DateTimeFormat("en-US", { timeZone: state.config.timeZone || undefined, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(ms));
}

export function ticketPlace(ticket) {
  var property = liveProperties().find(function (item) { return item.backendId === ticket.propertyBackendId; });
  var visit = ticket.visitBackendId ? findVisit(liveVisits(), "visit-core-" + ticket.visitBackendId) : null;
  var today = localDateKey(new Date(), state.config.timeZone);
  return [property ? property.address || property.name : "", visit ? "Visit " + visitWhen(visit, today) : ""].filter(Boolean).join(" · ");
}

function listState(status) {
  if (status === "loading") {
    return h("div", { "data-module": "tickets-loading", "data-visual-id": "tickets-loading", "aria-busy": "true" }, [
      skel("height:88px;border-radius:16px;margin-bottom:12px"),
      skel("height:88px;border-radius:16px"),
    ]);
  }
  if (status === "unauthorized") return UnauthorizedState({ scope: "these tickets", backRoute: state.config.defaultRoute });
  if (status === "error") return ErrorState({ title: "Couldn’t load your tickets", desc: "Nothing was changed. Check your connection and try again." });
  return EmptyState({ glyph: "◌", title: "No support tickets yet", desc: "Tell us about a missed visit, a service problem or a billing question, and follow our answer here." });
}

export function SupportTicketNew() {
  var ticket = supportTicketState();
  var page = h("section", { "class": "page page--narrow support-new", "data-route": "support.new", "data-visual-id": "support-new", "data-state": ticket.phase });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "support", "data-visual-id": "support-new-back" }, "‹ Back to Support"));
  if (ticket.phase === "created") {
    page.appendChild(Outcome("created", "Ticket " + ticket.ticketCode + " is open", ticket.message || "We received your ticket and will get back to you.", false, ticket.ticketId));
    return page;
  }
  if (ticket.phase === "slow" || (ticket.phase === "checking" && ticket.formId)) {
    page.appendChild(Outcome("slow", "We’re still opening your ticket", "It’s taking longer than usual. You don’t need to send it again.", ticket.phase === "checking"));
    return page;
  }
  page.appendChild(h("div", { "class": "prop-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "prop-head__title" }, "Open a support ticket"),
      h("div", { "class": "prop-head__addr" }, "Tell us which property this is about and what happened. We answer in Support."),
    ]),
  ]));
  var envelope = state.moduleData.properties;
  if (!envelope || envelope.state === "loading") {
    page.appendChild(h("div", { "data-module": "support-new-loading", "aria-busy": "true" }, [skel("height:320px;border-radius:22px")]));
    return page;
  }
  var properties = liveProperties();
  if (!properties.length) {
    page.appendChild(EmptyState({ glyph: "◌", title: "No property to ask about yet", desc: "A ticket is about one of your properties. Request a quote to add your first one." }));
    return page;
  }
  var loaded = ensureSupportTicketSchema();
  var schema = loaded && loaded.state === "ready" ? loaded.schema : null;
  var busy = supportTicketBusy();
  var today = localDateKey(new Date(), state.config.timeZone);
  var visits = visitsOfProperty(ticket.draft.propertyId);
  var form = h("form", { "class": "card card--pad support-form", "data-module": "support-ticket-form", novalidate: true });
  form.addEventListener("submit", function (event) { event.preventDefault(); });

  form.appendChild(SelectField("PROPERTY_ID", "Property", String(ticket.draft.propertyId || ""), [{ value: "", label: "Choose a property" }].concat(properties.map(function (property) {
    return { value: String(property.backendId), label: property.address || property.name };
  })), ticket.errors.PROPERTY_ID, busy, "support.chooseProperty"));
  if (visits.length || ticket.errors.VISIT_ID) {
    form.appendChild(SelectField("VISIT_ID", "Visit (optional)", String(ticket.draft.visitId || ""), [{ value: "", label: "Not about one visit" }].concat(visits.map(function (visit) {
      return { value: String(visit.backendId), label: visitWhen(visit, today) + " · " + visit.status.label };
    })), ticket.errors.VISIT_ID, busy, "support.chooseVisit"));
  }
  if ((schema && schema.reasons.length) || ticket.errors.CONTACT_REASON) {
    form.appendChild(SelectField("CONTACT_REASON", "What is it about?", ticket.draft.reason, [{ value: "", label: "General question" }].concat(schema ? schema.reasons.filter(function (reason) {
      return reason.value !== "GENERAL_INQUIRY";
    }) : []), ticket.errors.CONTACT_REASON, busy, "support.chooseReason"));
  }
  form.appendChild(TextField("SUBJECT", "Subject", ticket.draft.subject, ticket.errors.SUBJECT, busy, SUPPORT_SUBJECT_LIMIT));
  form.appendChild(RichTextEditor({
    id: "support-ticket-message",
    module: "support-ticket-editor",
    field: "MESSAGE",
    label: "Message",
    html: ticket.draft.message,
    error: ticket.errors.MESSAGE,
    disabled: busy,
    placeholder: "What happened, where and when?",
    hint: "Up to " + SUPPORT_MESSAGE_LIMIT.toLocaleString("en-US") + " characters.",
    onChange: function (html) { changeSupportTicketDraft("message", html); },
  }));
  form.appendChild(AttachmentPicker({
    id: "support-ticket-attachments",
    module: "support-ticket-attachments",
    field: "ATTACHMENTS",
    files: ticket.files,
    reading: ticket.reading,
    error: ticket.errors.ATTACHMENTS,
    disabled: busy,
    scope: "ticket",
    removeAction: "support.removeAttachment",
    onAdd: function (files) { addAttachments(ticket, files, render); },
  }));
  page.appendChild(form);
  if (ticket.message) {
    page.appendChild(h("div", { "class": "inline-fail quote-request__message", "data-module": "support-ticket-message", role: "alert" }, [
      h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
      h("div", { "class": "decision-outcome__body" }, ticket.message),
    ]));
  }
  page.appendChild(busy
    ? h("div", { "class": "card card--pad quote-request__progress", "data-module": "support-ticket-progress", "data-state": ticket.phase, "aria-live": "polite" }, [PendingNote(PROGRESS[ticket.phase] || PROGRESS.sending)])
    : h("div", { "class": "quote-request__submit", "data-module": "support-ticket-submit" }, [
      ActionButton({ variant: "btn--primary", label: "Send ticket", action: "support.submitTicket", lg: true, visualId: "support-ticket-send" }),
    ]));
  return page;
}

function SelectField(code, label, value, options, error, busy, action) {
  var id = "support-ticket-" + code.toLowerCase().replace(/_/g, "-");
  var select = h("select", {
    "class": "field",
    id: id,
    name: code,
    "data-state": error ? "invalid" : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? id + "-error" : undefined,
    disabled: busy ? true : undefined,
  }, options.map(function (option) {
    return h("option", { value: option.value, selected: option.value === value ? true : undefined }, option.label);
  }));
  select.addEventListener("change", function () { ACTIONS[action](select.value); });
  return Field(id, label, select, error);
}

function TextField(code, label, value, error, busy, limit) {
  var id = "support-ticket-" + code.toLowerCase();
  var attributes = {
    "class": "field",
    id: id,
    name: code,
    maxlength: String(limit),
    "data-state": error ? "invalid" : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? id + "-error" : undefined,
    disabled: busy ? true : undefined,
  };
  var input = h("input", Object.assign({ type: "text", value: value || "", autocomplete: "off" }, attributes));
  input.addEventListener("input", function () { changeSupportTicketDraft("subject", input.value); });
  return Field(id, label, input, error);
}

function Field(id, label, control, error) {
  return h("div", { "class": "field-row support-form__field" }, [
    h("label", { "class": "field-label", "for": id }, label),
    control,
    error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error) : null,
  ]);
}

function Outcome(kind, title, body, checking, ticketId) {
  return h("div", { "class": "state-block quote-request__outcome", "data-module": "support-ticket-outcome", "data-state": kind, role: "status", tabindex: "-1" }, [
    h("div", { "class": "state-block__glyph" + (kind === "created" ? " quote-request__glyph--ok" : "") }, kind === "created" ? "✓" : "◔"),
    h("h1", { "class": "state-block__title" }, title),
    h("div", { "class": "state-block__desc" }, body),
    h("div", { "class": "proposal-actions quote-request__outcome-actions" }, [
      ticketId ? ActionButton({ variant: "btn--primary", label: "View ticket", action: "support.openTicket", id: "ticket-core-" + ticketId, visualId: "support-ticket-view" }) : null,
      ActionButton({ variant: ticketId ? "btn--ghost" : "btn--primary", label: "View your tickets", action: "nav.go", id: "support", visualId: "support-ticket-list" }),
      kind === "slow" ? ActionButton({ variant: "btn--ghost", label: checking ? "Checking…" : "Check again", action: "support.checkTicket", disabled: checking, visualId: "support-ticket-check-again" }) : null,
    ]),
  ]);
}
