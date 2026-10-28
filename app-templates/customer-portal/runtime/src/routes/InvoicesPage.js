import { h } from "../dom.js";
import { liveInvoices, liveListStatus, state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { InvoiceRow, RecordSection } from "../components/storm/RecordRows.js";
import { findInvoice, invoiceAmount, invoiceTerms, invoiceTitle } from "../normalizers/invoices.js";
import { formatIsoDate, formatMoney } from "../normalizers/contracts.js";

export function Invoices() {
  var page = h("section", { "class": "page page--narrow", "data-route": "invoices", "data-visual-id": "invoices-page" });
  page.appendChild(PageHeader({ title: "Invoices" }));
  var status = liveListStatus("invoices");
  page.setAttribute("data-state", status);
  if (status !== "ready") {
    page.appendChild(listState(status));
    return page;
  }
  page.appendChild(RecordSection("invoice-list", "", liveInvoices().items.map(InvoiceRow)));
  return page;
}

export function InvoiceDetail() {
  var page = h("section", { "class": "page page--narrow", "data-route": "invoice.detail", "data-visual-id": "invoice-detail" });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "invoices" }, "‹ Back to invoices"));
  var status = liveListStatus("invoices");
  var invoice = status === "ready" ? findInvoice(liveInvoices(), state.invoiceId) : null;
  if (!invoice) {
    page.setAttribute("data-state", status === "ready" || status === "empty" ? "not-found" : status);
    page.appendChild(status === "ready" || status === "empty"
      ? EmptyState({ glyph: "◌", title: "Invoice not found", desc: "This invoice is not on your account." })
      : listState(status));
    return page;
  }

  page.setAttribute("data-state", invoice.stateCode.toLowerCase());
  page.appendChild(h("div", { "class": "prop-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [h("h1", { "class": "prop-head__title" }, invoiceTitle(invoice))]),
    h("span", { "class": "status-badge status-badge--" + invoice.status.tone }, invoice.status.label),
  ]));

  var facts = [
    invoice.due ? fact("due", "Due date", formatIsoDate(invoice.due)) : null,
    invoiceTerms(invoice) ? fact("terms", "Payment terms", invoiceTerms(invoice)) : null,
    invoice.issued && invoice.period ? fact("issued", "Invoice date", formatIsoDate(invoice.issued)) : null,
  ].filter(Boolean);
  if (facts.length) page.appendChild(h("div", { "class": "card card--pad prop-facts", "data-module": "invoice-facts", "data-visual-id": "invoice-facts" }, facts));

  var total = invoiceAmount(invoice);
  var rows = invoice.lines.map(function (line) {
    return h("div", { "class": "invoice__row", "data-module": "invoice-line" }, [
      h("span", null, line.quantity > 1 ? line.name + " × " + line.quantity : line.name),
      h("b", null, line.amount),
    ]);
  });
  var balance = invoice.stateCode !== "PAID" && invoice.paid > 0 && invoice.total !== null ? [
    h("div", { "class": "invoice__row", "data-module": "invoice-paid" }, [h("span", null, "Paid"), h("b", null, formatMoney(invoice.paid, invoice.currency))]),
    h("div", { "class": "invoice__row", "data-module": "invoice-balance" }, [h("span", null, "Balance"), h("b", null, formatMoney(invoice.total - invoice.paid, invoice.currency))]),
  ] : [];
  if (rows.length || total) {
    page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "invoice-lines", "data-visual-id": "invoice-lines" }, [
      h("h2", { "class": "prop-section__title" }, "Charges"),
    ].concat(rows, total ? [h("div", { "class": "invoice__total", "data-module": "invoice-total" }, [h("span", null, "Total"), h("span", null, total)])] : [], balance)));
  }
  return page;
}

function fact(key, label, value) {
  return h("div", { "class": "prop-fact", "data-fact": key }, [
    h("div", { "class": "prop-fact__label" }, label),
    h("div", { "class": "prop-fact__value" }, value),
  ]);
}

function listState(status) {
  if (status === "loading") {
    return h("div", { "data-module": "invoices-loading", "data-visual-id": "invoices-loading", "aria-busy": "true" }, [
      skel("height:72px;border-radius:16px;margin-bottom:12px"),
      skel("height:72px;border-radius:16px"),
    ]);
  }
  if (status === "unauthorized") return UnauthorizedState({ scope: "these invoices", backRoute: state.config.defaultRoute });
  if (status === "error") return ErrorState({ title: "Couldn’t load your invoices", desc: "Nothing was changed. Check your connection and try again." });
  return EmptyState({ glyph: "◌", title: "No invoices yet", desc: "Your invoices appear here once we send one." });
}
