import { h } from "../../dom.js";
import { visitDay, visitWhen } from "../../normalizers/visits.js";
import { invoiceAmount, invoiceStatusLine, invoiceTitle } from "../../normalizers/invoices.js";

export function VisitRow(visit, options) {
  var settings = options || {};
  var when = visitWhen(visit, settings.today);
  return h("button", {
    "class": "prop-visit record-row",
    type: "button",
    "data-module": "visit-row",
    "data-visual-id": "visit-row",
    "data-action": "appointments.openVisit",
    "data-id": visit.id,
    "data-state": visit.stateCode.toLowerCase(),
    "aria-label": [settings.label, visitDay(visit, settings.today), visit.status.label].filter(Boolean).join(" · "),
  }, [
    h("span", { "class": "record-row__main" }, [
      settings.label ? text("record-row__eyebrow", settings.label) : null,
      text("prop-visit__title", when),
      settings.place ? text("prop-visit__meta", settings.place) : null,
    ]),
    text("status-badge status-badge--" + visit.status.tone, visit.status.label),
    text("prop-visit__caret", "›"),
  ]);
}

export function InvoiceRow(invoice) {
  var title = invoiceTitle(invoice);
  var amount = invoiceAmount(invoice);
  var status = invoiceStatusLine(invoice);
  return h("button", {
    "class": "prop-visit record-row",
    type: "button",
    "data-module": "invoice-row",
    "data-visual-id": "invoice-row",
    "data-action": "invoice.open",
    "data-id": invoice.id,
    "data-state": invoice.stateCode.toLowerCase(),
    "aria-label": [title, amount, status].filter(Boolean).join(" · "),
  }, [
    h("span", { "class": "record-row__main" }, [
      text("prop-visit__title", title),
      amount ? text("prop-visit__meta record-row__amount", amount) : null,
    ]),
    text("status-badge status-badge--" + invoice.status.tone, status),
    text("prop-visit__caret", "›"),
  ]);
}

export function RecordSection(id, title, rows) {
  return h("section", { "class": "card card--pad record-section", "data-module": id, "data-visual-id": id }, [
    title ? h("h2", { "class": "prop-section__title" }, title) : null,
    h("div", { "class": "record-list" }, rows),
  ]);
}

function text(className, value) {
  return h("span", { "class": className }, value == null ? "" : String(value));
}
