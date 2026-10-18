import { h } from "../../dom.js";
import { state } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { QUOTE_STATUS } from "./QuotePackage.js";
import { CommandOutcome, DecisionFailure, PendingNote } from "./ContractStates.js";

export function QuoteOptionCard(order, options) {
  var settings = options || {};
  var meta = QUOTE_STATUS[order.status];
  var label = order.pricingModel ? order.pricingModel.label : "Quote";
  var card = h("article", {
    "class": "card card--pad quote-option",
    "data-module": "quote-option",
    "data-visual-id": "quote-option",
    "data-state": order.status,
    "aria-label": label + " — " + meta.label,
  }, [
    h("div", { "class": "quote-option__head" }, [
      h("h3", { "class": "quote-option__model" }, label),
      StatusBadge({ variant: meta.badge, label: meta.label, bind: "quote.statusLabel", state: order.status }),
    ]),
    QuoteLines(order),
    QuoteMoney(order),
  ]);
  if (settings.interactive) {
    var decisions = QuoteDecisions(order, settings);
    if (decisions) card.appendChild(decisions);
  }
  return card;
}

function QuoteLines(order) {
  if (order.linesState === "unavailable") {
    return h("div", { "class": "quote-option__note", "data-module": "quote-lines", "data-state": "unavailable" }, "The services on this quote couldn’t be loaded.");
  }
  if (!order.lines.length) {
    return h("div", { "class": "quote-option__note", "data-module": "quote-lines", "data-state": "empty" }, "No services are listed on this quote.");
  }
  var list = h("div", { "class": "purch-lines quote-lines", "data-module": "quote-lines", "data-visual-id": "quote-lines", "data-state": order.linesState, role: "list", "aria-label": "Services" }, order.lines.map(function (line) {
    var detail = line.quantity && line.unitPrice ? line.quantity + " × " + line.unitPrice : line.unitPrice || (line.quantity ? "Quantity " + line.quantity : "");
    return h("div", { "class": "purch-line quote-line", "data-line": line.key, role: "listitem" }, [
      h("div", { "class": "quote-line__body" }, [
        h("div", { "class": "purch-line__title" + (line.product ? "" : " quote-line__title--unnamed") }, line.product || "Unnamed service"),
        detail ? h("div", { "class": "purch-line__meta" }, detail) : null,
      ]),
      line.total ? h("div", { "class": "purch-line__side" }, h("b", null, line.total)) : null,
    ]);
  }));
  if (order.linesState !== "partial") return list;
  return h("div", null, [list, h("div", { "class": "quote-option__note", "data-state": "partial" }, "Some details of these services couldn’t be loaded.")]);
}

function QuoteMoney(order) {
  if (!order.money) {
    return h("div", { "class": "quote-option__note", "data-module": "quote-totals", "data-state": "unpriced" }, "No price is stated on this quote yet.");
  }
  var rows = [["Subtotal", order.money.subtotal, "subtotal"], ["Taxes", order.money.taxes, "taxes"]].filter(function (row) { return !!row[1]; });
  var wrap = h("div", { "class": "money-rows quote-totals", "data-module": "quote-totals", "data-visual-id": "quote-totals" }, rows.map(function (row) {
    return h("div", { "class": "money-rows__row", "data-kind": row[2] }, [h("span", null, row[0]), h("span", null, row[1])]);
  }));
  if (order.money.total) {
    wrap.appendChild(h("div", { "class": "money-rows__row money-rows__row--total", "data-kind": "total" }, [h("span", null, "Total"), h("span", null, order.money.total)]));
  }
  return wrap;
}

function QuoteDecisions(order, settings) {
  var command = state.contractCommand;
  var targeted = !!command && command.targets.indexOf(order.backendId) !== -1;
  var outcome = targeted && command.phase !== "pending" ? CommandOutcome(command.phase) : null;
  var busy = !!settings.busy;
  if (order.status === "unseen") {
    var view = state.quoteViews[order.backendId];
    if (view === "failed") {
      return h("div", { "class": "quote-option__decide" }, DecisionFailure(
        "We couldn’t let the provider know you opened this quote, so its decisions aren’t available yet.",
        { action: "quote.retryView", id: String(order.backendId), label: "Try again" },
      ));
    }
    return h("div", { "class": "quote-option__decide" }, PendingNote("Letting the provider know you opened this quote…"));
  }
  if (order.status !== "viewed") return outcome ? h("div", { "class": "quote-option__decide" }, outcome) : null;
  var confirm = state.contractConfirm;
  var confirming = !!confirm && confirm.backendId === order.backendId && (confirm.kind === "approve" || confirm.kind === "decline");
  var section = h("div", { "class": "quote-option__decide" });
  if (confirming) section.appendChild(DecisionConfirm(confirm.kind, order, settings, targeted && command.phase === "pending"));
  else {
    section.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Approve", action: "quote.approve", id: String(order.backendId), lg: true, disabled: busy, visualId: "quote-approve" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "quote.decline", id: String(order.backendId), lg: true, disabled: busy, visualId: "quote-decline" }),
    ]));
  }
  if (outcome) section.appendChild(outcome);
  return section;
}

function DecisionConfirm(kind, order, settings, pending) {
  var label = order.pricingModel ? order.pricingModel.label : "this option";
  var titleId = "decision-title-" + order.backendId;
  var body = kind === "approve"
    ? (settings.siblingsOpen ? "Approving it declines the other options for this property." : "")
    : "A declined option can’t be approved later.";
  var confirmButton = ActionButton({
    variant: kind === "approve" ? "btn--primary" : "btn--danger",
    label: pending ? "Sending…" : kind === "approve" ? "Confirm approval" : "Confirm decline",
    action: "quote.confirm", id: String(order.backendId), lg: true, disabled: pending || settings.busy, visualId: "quote-confirm",
  });
  if (pending) confirmButton.setAttribute("data-state", "pending");
  return h("div", { "class": "decision-confirm", "data-module": "decision-confirm", "data-visual-id": "decision-confirm", "data-state": pending ? "pending" : "open", "data-kind": kind, role: "group", "aria-labelledby": titleId }, [
    h("p", { "class": "decision-confirm__title", id: titleId }, kind === "approve" ? "Approve " + label + " for this property?" : "Decline " + label + "?"),
    body ? h("p", { "class": "decision-confirm__body" }, body) : null,
    h("div", { "class": "proposal-actions" }, [
      confirmButton,
      ActionButton({ variant: "btn--ghost", label: "Cancel", action: "quote.cancel", lg: true, disabled: pending, visualId: "quote-cancel" }),
    ]),
  ]);
}
