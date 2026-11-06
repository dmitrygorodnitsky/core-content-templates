import { h } from "../../dom.js";
import { isModuleEnabled, quotePackage, state } from "../../state.js";
import { ProviderLogo } from "../proposals/AgreementParts.js";
import { formatIsoDate, formatMoney } from "../../normalizers/contracts.js";
import { invoiceAmount, invoiceTerms } from "../../normalizers/invoices.js";

export function invoiceParties(invoice) {
  var quotes = isModuleEnabled("proposals") ? quotePackage() : null;
  var agreements = quotes ? quotes.agreements.map(function (row) { return row.agreement; }) : [];
  var own = agreements.find(function (agreement) { return !!invoice.orderBackendId && agreement.orderBackendIds.indexOf(invoice.orderBackendId) !== -1; });
  var active = agreements.filter(function (agreement) { return agreement.stage === "active"; });
  var sole = active.length === 1 ? active[0] : null;
  var named = agreements.find(function (agreement) { return !!agreement.parties.provider.legalName; });
  var profile = state.moduleData.profile;
  var provider = own || sole || named;
  var client = own || sole;
  return {
    provider: provider ? provider.parties.provider : null,
    client: client ? client.parties.client : null,
    brandName: state.config.brandName || "",
    accountName: (profile && profile.accountName) || "",
  };
}

export function InvoiceSheet(invoice) {
  var parties = invoiceParties(invoice);
  var provider = parties.provider;
  var client = parties.client;
  var providerName = (provider && provider.legalName) || parties.brandName;
  var clientName = (client && client.legalName) || parties.accountName;
  return h("article", { "class": "invoice-sheet", "data-module": "invoice-sheet", "data-visual-id": "invoice-sheet" }, [
    h("header", { "class": "invoice-sheet__head" }, [
      h("div", { "class": "invoice-sheet__brand" }, [
        provider ? ProviderLogo(provider, null) : null,
      ]),
      h("div", { "class": "invoice-sheet__title" }, [
        h("h1", { "class": "invoice-sheet__heading" }, "Invoice"),
        h("div", { "class": "invoice-sheet__number" }, "#" + invoice.backendId),
        h("div", { "class": "invoice-sheet__status", "data-state": invoice.stateCode.toLowerCase() }, invoice.status.label),
      ]),
    ]),
    h("div", { "class": "invoice-sheet__parties" }, [
      Party("From", "invoice-sheet-from", providerName, provider ? [provider.phone, provider.email] : []),
      Party("Bill to", "invoice-sheet-to", clientName, client ? [client.billingAddress, joinName(client.representativeName, client.representativeJobTitle), client.email, client.phone] : []),
    ]),
    Facts(invoice),
    Charges(invoice),
  ]);
}

function Party(label, module, name, lines) {
  var stated = lines.filter(Boolean);
  if (!name && !stated.length) return null;
  return h("section", { "class": "invoice-sheet__party", "data-module": module }, [
    h("h2", { "class": "invoice-sheet__label" }, label),
    name ? h("div", { "class": "invoice-sheet__name" }, name) : null,
  ].concat(stated.map(function (line) { return h("div", { "class": "invoice-sheet__line" }, line); })));
}

function Facts(invoice) {
  var rows = [
    ["Service period", invoice.period],
    ["Invoice date", formatIsoDate(invoice.issued)],
    ["Due date", formatIsoDate(invoice.due)],
    ["Payment terms", invoiceTerms(invoice)],
  ].filter(function (row) { return !!row[1]; });
  if (!rows.length) return null;
  return h("dl", { "class": "invoice-sheet__facts", "data-module": "invoice-sheet-facts" }, rows.map(function (row) {
    return h("div", { "class": "invoice-sheet__fact" }, [
      h("dt", { "class": "invoice-sheet__label" }, row[0]),
      h("dd", { "class": "invoice-sheet__value" }, row[1]),
    ]);
  }));
}

function Charges(invoice) {
  var total = invoiceAmount(invoice);
  if (!invoice.lines.length && !total) return null;
  var balance = invoice.stateCode !== "PAID" && invoice.paid > 0 && invoice.total !== null;
  return h("table", { "class": "invoice-sheet__charges", "data-module": "invoice-sheet-charges" }, [
    h("thead", null, h("tr", null, [
      h("th", { scope: "col" }, "Description"),
      h("th", { scope: "col", "class": "invoice-sheet__number-cell" }, "Qty"),
      h("th", { scope: "col", "class": "invoice-sheet__number-cell" }, "Amount"),
    ])),
    h("tbody", null, invoice.lines.map(function (line) {
      return h("tr", { "data-module": "invoice-sheet-line" }, [
        h("td", null, line.name),
        h("td", { "class": "invoice-sheet__number-cell" }, String(line.quantity)),
        h("td", { "class": "invoice-sheet__number-cell" }, line.amount),
      ]);
    })),
    h("tfoot", null, [
      total ? SummaryRow("Total", total, "invoice-sheet-total") : null,
      balance ? SummaryRow("Paid", formatMoney(invoice.paid, invoice.currency), "invoice-sheet-paid") : null,
      balance ? SummaryRow("Balance", formatMoney(invoice.total - invoice.paid, invoice.currency), "invoice-sheet-balance") : null,
    ]),
  ]);
}

function SummaryRow(label, value, module) {
  return h("tr", { "data-module": module }, [
    h("th", { scope: "row", colspan: "2" }, label),
    h("td", { "class": "invoice-sheet__number-cell" }, value),
  ]);
}

function joinName(name, title) {
  if (!name) return "";
  return title ? name + ", " + title : name;
}
