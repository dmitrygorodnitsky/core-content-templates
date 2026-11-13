import { h } from "../dom.js";
import { render } from "../app.js";
import { liveTickets, state } from "../state.js";
import { ensureSupportTicketSchema } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { NotFoundState, skel } from "../components/primitives/RouteStates.js";
import { PendingNote } from "../components/proposals/ContractStates.js";
import { RichTextEditor } from "../components/support/RichTextEditor.js";
import { AttachmentPicker } from "../components/support/AttachmentPicker.js";
import { RichText } from "../rich-text.js";
import { formatBytes } from "../support-attachments.js";
import { reasonLabel } from "../support-tickets.js";
import { ticketOpened } from "../normalizers/support.js";
import { addAttachments, changeTicketComment, ticketBackendId, ticketComment, ticketCommentBusy, ticketDetail, ticketFile } from "../support-thread.js";
import { ticketMoment, ticketPlace } from "./LiveSupportPage.js";

var COMMENT_PROGRESS = {
  sending: "Sending your comment…",
  waiting: "Comment sent. Waiting for our system to add it…",
  checking: "Checking your comment…",
};

export function SupportTicket() {
  var page = h("section", { "class": "page page--narrow support-ticket-page", "data-route": "support.ticket", "data-visual-id": "support-ticket" });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "support", "data-visual-id": "support-ticket-back" }, "‹ Back to Support"));
  var backendId = ticketBackendId(state.ticketId);
  var entry = backendId ? ticketDetail(backendId, render) : null;
  var listed = liveTickets() ? liveTickets().open.concat(liveTickets().closed).find(function (item) { return item.backendId === backendId; }) : null;
  var ticket = (entry && entry.ticket) || listed || null;
  if (!ticket) {
    var missing = !entry || entry.status === "not-found";
    page.setAttribute("data-state", missing ? "not-found" : entry.status);
    if (missing) page.appendChild(NotFoundState({ noun: "ticket", backLabel: "Support", backRoute: "support" }));
    else if (entry.status === "error") page.appendChild(LoadFailed());
    else page.appendChild(h("div", { "data-module": "ticket-loading", "aria-busy": "true" }, [skel("height:72px;border-radius:16px;margin-bottom:12px"), skel("height:220px;border-radius:22px")]));
    return page;
  }
  page.setAttribute("data-state", ticket.stateCode.toLowerCase());
  var loaded = ensureSupportTicketSchema();
  var schema = loaded && loaded.state === "ready" ? loaded.schema : null;
  var about = ticketPlace(ticket);
  page.appendChild(h("div", { "class": "proposal-detail-head support-ticket-head", "data-module": "ticket-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("div", { "class": "agreement-detail-head__eyebrow" }, "Support ticket" + (ticket.code ? " · " + ticket.code : "")),
      h("h1", { "class": "proposal-detail-head__title" }, ticket.subject),
      h("div", { "class": "proposal-detail-head__meta" }, [reasonLabel(ticket.reason, schema), "Opened " + ticketOpened(ticket, state.config.timeZone)].filter(Boolean).join(" · ")),
      about ? h("div", { "class": "proposal-detail-head__meta" }, about) : null,
    ]),
    h("span", { "class": "status-badge status-badge--" + ticket.status.tone, "data-module": "ticket-status" }, ticket.status.label),
  ]));
  page.appendChild(RefreshBar(entry));
  var actions = Actions(entry);
  if (actions) page.appendChild(actions);
  page.appendChild(Thread(ticket));
  page.appendChild(ticket.stateCode === "CLOSED" ? ClosedNote(ticket) : CommentBox(backendId, entry));
  return page;
}

function LoadFailed() {
  return h("div", { "class": "state-block", "data-module": "ticket-error", "data-state": "error", role: "alert" }, [
    h("div", { "class": "state-block__glyph state-block__glyph--error" }, "⚠"),
    h("div", { "class": "state-block__title" }, "Couldn’t load this ticket"),
    h("div", { "class": "state-block__desc" }, "Nothing was changed. Check your connection and try again."),
    ActionButton({ variant: "btn--primary", label: "Try again", action: "support.refreshTicket", visualId: "ticket-retry" }),
  ]);
}

function RefreshBar(entry) {
  var refreshing = !!(entry && (entry.refreshing || entry.status === "loading"));
  return h("div", { "class": "support-ticket-refresh", "data-module": "ticket-refresh", "data-state": refreshing ? "refreshing" : "idle" }, [
    h("span", { "class": "support-ticket-refresh__note" }, "Replies may take a minute to appear."),
    h("button", { "class": "link-action", type: "button", "data-action": "support.refreshTicket", "data-visual-id": "ticket-refresh", disabled: refreshing ? true : undefined }, refreshing ? "Refreshing…" : "Refresh ↻"),
  ]);
}

function Actions(entry) {
  if (!entry) return null;
  var action = entry.action;
  var sending = !!(action && action.phase === "sending");
  var wrap = h("div", { "class": "support-ticket-actions", "data-module": "ticket-actions", "data-state": entry.events.status });
  if (entry.events.status === "error") {
    wrap.appendChild(h("div", { "class": "support-ticket-actions__note", role: "status" }, ["Actions couldn’t be loaded. ", h("button", { "class": "link-action", type: "button", "data-action": "support.refreshTicket" }, "Try again ›")]));
    return wrap;
  }
  if (entry.events.status !== "ready" || !entry.events.list.length) {
    if (!action || !action.message) return null;
  }
  if (action && action.phase === "confirm") {
    var pending = entry.events.list.find(function (item) { return item.code === action.code; });
    if (pending) {
      wrap.appendChild(h("div", { "class": "card card--pad support-ticket-confirm", "data-module": "ticket-action-confirm", role: "alertdialog", "aria-labelledby": "ticket-confirm-title", "aria-describedby": "ticket-confirm-desc" }, [
        h("div", { "class": "support-ticket-confirm__title", id: "ticket-confirm-title" }, pending.label + "?"),
        h("p", { "class": "support-ticket-confirm__desc", id: "ticket-confirm-desc" }, pending.confirm),
        h("div", { "class": "proposal-actions" }, [
          ActionButton({ variant: "btn--primary", label: pending.label, action: "support.confirmTicketAction", visualId: "ticket-confirm" }),
          ActionButton({ variant: "btn--ghost", label: "Cancel", action: "support.cancelTicketAction", visualId: "ticket-confirm-cancel" }),
        ]),
      ]));
      return wrap;
    }
  }
  if (entry.events.list.length) {
    wrap.appendChild(h("div", { "class": "support-ticket-actions__buttons" }, entry.events.list.map(function (item) {
      var busy = sending && action.code === item.code;
      return h("button", { "class": "btn btn--ghost support-ticket-action", type: "button", "data-action": "support.ticketAction", "data-id": item.code, "data-visual-id": "ticket-action", "data-target": item.target.toLowerCase(), disabled: sending || entry.refreshing ? true : undefined }, busy ? item.label + "…" : item.label);
    })));
  }
  if (action && action.message) {
    wrap.appendChild(h("div", { "class": "inline-fail support-ticket-actions__outcome", "data-module": "ticket-action-outcome", "data-state": action.phase, role: "alert", tabindex: "-1" }, [
      h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
      h("div", { "class": "decision-outcome__body" }, action.message),
    ]));
  }
  return wrap;
}

function Thread(ticket) {
  var thread = ticket.thread;
  var list = h("ol", { "class": "ticket-thread", "data-module": "ticket-thread", "aria-label": "Conversation" });
  if (thread && thread.truncated) list.appendChild(h("li", { "class": "ticket-thread__note", "data-module": "ticket-thread-truncated" }, "Earlier messages aren’t shown here."));
  var opening = thread && thread.description
    ? Message({ author: "CUSTOMER", authorName: "", createdMs: ticket.openedMs, html: thread.description.html, attachments: thread.description.attachments }, "description")
    : PlainOpening(ticket);
  if (opening) list.appendChild(opening);
  (thread ? thread.comments : []).forEach(function (comment) { list.appendChild(Message(comment, "comment")); });
  return h("section", { "class": "ticket-thread-wrap", "aria-labelledby": "ticket-thread-title" }, [
    h("h2", { "class": "contracts-section__title", id: "ticket-thread-title" }, "Conversation"),
    list,
  ]);
}

function PlainOpening(ticket) {
  if (!ticket.message) return null;
  return h("li", { "class": "ticket-message", "data-module": "ticket-message", "data-author": "customer", "data-kind": "description" }, [
    MessageHead("CUSTOMER", "", ticket.openedMs),
    h("div", { "class": "ticket-message__body ticket-message__body--plain" }, ticket.message),
  ]);
}

function Message(comment, kind) {
  var staff = comment.author === "STAFF";
  return h("li", { "class": "ticket-message" + (staff ? " ticket-message--staff" : ""), "data-module": "ticket-message", "data-author": staff ? "staff" : "customer", "data-kind": kind }, [
    MessageHead(comment.author, comment.authorName, comment.createdMs),
    comment.html ? RichText(comment.html, { "class": "rich-text ticket-message__body", "data-module": "ticket-message-body" }) : null,
    comment.attachments.length ? Attachments(comment.attachments) : null,
  ]);
}

function MessageHead(author, name, createdMs) {
  var staff = author === "STAFF";
  return h("div", { "class": "ticket-message__head" }, [
    h("span", { "class": "ticket-message__author" }, staff ? (name || "Support team") : "You"),
    staff ? h("span", { "class": "ticket-message__role" }, "Support team") : null,
    createdMs ? h("time", { "class": "ticket-message__time", datetime: new Date(createdMs).toISOString() }, ticketMoment(createdMs)) : null,
  ]);
}

function Attachments(attachments) {
  return h("ul", { "class": "ticket-files", "data-module": "ticket-files", "aria-label": "Attachments" }, attachments.map(function (file) {
    var thumbnail = file.image ? ticketFile(file, "thumbnail", render) : null;
    var size = formatBytes(file.size);
    var preview = thumbnail && thumbnail.status === "ready"
      ? h("img", { "class": "ticket-file__thumb", src: thumbnail.url, alt: file.name })
      : h("span", { "class": "ticket-file__icon", "aria-hidden": "true", "data-state": thumbnail ? thumbnail.status : undefined }, file.image ? (thumbnail && thumbnail.status === "error" ? "!" : "IMG") : "PDF");
    return h("li", { "class": "ticket-file", "data-module": "ticket-file", "data-kind": file.image ? "image" : "file" }, [
      h("button", { "class": "ticket-file__open", type: "button", "data-action": "support.openFile", "data-id": file.id, "aria-label": "Open " + file.name + " in a new tab" }, [
        preview,
        h("span", { "class": "ticket-file__name" }, file.name),
        size ? h("span", { "class": "ticket-file__size" }, size) : null,
      ]),
    ]);
  }));
}

function ClosedNote(ticket) {
  return h("div", { "class": "card card--pad support-ticket-closed", "data-module": "ticket-closed", role: "status" }, [
    h("div", { "class": "support-ticket-closed__title" }, "This ticket is closed"),
    h("div", { "class": "support-ticket-closed__desc" }, "Comments are turned off. Open a new ticket if you need more help."),
    ActionButton({ variant: "btn--ghost", label: "Open support ticket", action: "support.newTicket", id: ticket.propertyBackendId ? String(ticket.propertyBackendId) : undefined, visualId: "ticket-closed-new" }),
  ]);
}

function CommentBox(backendId, entry) {
  var comment = ticketComment(backendId);
  var busy = ticketCommentBusy(comment);
  var box = h("section", { "class": "card card--pad support-form ticket-comment", "data-module": "ticket-comment", "data-state": comment.phase, "aria-labelledby": "ticket-comment-title" }, [
    h("h2", { "class": "contracts-section__title", id: "ticket-comment-title" }, "Add a comment"),
  ]);
  if (comment.sentAt && comment.phase === "editing" && !comment.html && !comment.files.length) {
    box.appendChild(h("div", { "class": "support-ticket-sent", "data-module": "ticket-comment-added", role: "status" }, "Your comment was added."));
  }
  box.appendChild(RichTextEditor({
    id: "ticket-comment-message-" + backendId,
    module: "ticket-comment-editor",
    field: "MESSAGE",
    label: "Message",
    html: comment.html,
    error: comment.errors.MESSAGE,
    disabled: busy,
    placeholder: "Write a reply…",
    onChange: function (html) { changeTicketComment(backendId, html); },
  }));
  box.appendChild(AttachmentPicker({
    id: "ticket-comment-attachments-" + backendId,
    module: "ticket-comment-attachments",
    field: "ATTACHMENTS",
    files: comment.files,
    reading: comment.reading,
    error: comment.errors.ATTACHMENTS,
    disabled: busy,
    scope: "comment-" + backendId,
    removeAction: "support.removeAttachment",
    onAdd: function (files) { addAttachments(comment, files, render); },
  }));
  if (comment.message) {
    box.appendChild(h("div", { "class": "inline-fail", "data-module": "ticket-comment-message", role: "alert", tabindex: "-1" }, [
      h("span", { "class": "inline-fail__icon", "aria-hidden": "true" }, "!"),
      h("div", { "class": "decision-outcome__body" }, comment.message),
    ]));
  }
  if (busy) box.appendChild(h("div", { "data-module": "ticket-comment-progress", "aria-live": "polite" }, [PendingNote(COMMENT_PROGRESS[comment.phase] || COMMENT_PROGRESS.sending)]));
  else box.appendChild(h("div", { "class": "proposal-actions" }, [comment.phase === "slow"
    ? ActionButton({ variant: "btn--primary", label: "Check again", action: "support.checkComment", visualId: "ticket-comment-check" })
    : ActionButton({ variant: "btn--primary", label: "Send comment", action: "support.sendComment", disabled: comment.reading || !!(entry && entry.refreshing), visualId: "ticket-comment-send" })]));
  return box;
}
