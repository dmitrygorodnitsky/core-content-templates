import { h } from "../../dom.js";
import { state } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { QUOTE_STATUS } from "./QuotePackage.js";
import { pricePeriod } from "../../normalizers/contracts.js";
import { CommandOutcome } from "./ContractStates.js";

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
  var pricing = order.pricing || { linePrices: true, total: true };
  var list = h("div", { "class": "purch-lines quote-lines", "data-module": "quote-lines", "data-visual-id": "quote-lines", "data-state": order.linesState, "data-priced": pricing.linePrices ? "true" : "false", role: "list", "aria-label": "Services" }, order.lines.map(function (line) {
    return h("div", { "class": "purch-line quote-line", "data-line": line.key, role: "listitem" }, [
      h("div", { "class": "quote-line__body" }, [
        h("div", { "class": "purch-line__title" + (line.product ? "" : " quote-line__title--unnamed") }, line.product || "Unnamed service"),
        lineDetail(line, pricing) ? h("div", { "class": "purch-line__meta" }, lineDetail(line, pricing)) : null,
      ]),
      lineSide(line, pricing) ? h("div", { "class": "purch-line__side" }, h("b", null, lineSide(line, pricing))) : null,
    ]);
  }));
  if (order.linesState !== "partial") return list;
  return h("div", null, [list, h("div", { "class": "quote-option__note", "data-state": "partial" }, "Some details of these services couldn’t be loaded.")]);
}

function lineDetail(line, pricing) {
  if (!pricing.linePrices || !pricing.total) return line.quantity && line.quantity !== "1" ? "Quantity " + line.quantity : "";
  return line.quantity && line.unitPrice ? line.quantity + " × " + line.unitPrice : line.unitPrice || (line.quantity ? "Quantity " + line.quantity : "");
}

function lineSide(line, pricing) {
  if (!pricing.linePrices) return "";
  if (!pricing.total) return line.unitPrice ? line.unitPrice + " per service" : "";
  return line.total;
}

function QuoteMoney(order) {
  var pricing = order.pricing || { total: true };
  if (!pricing.total) {
    return h("div", { "class": "quote-option__note", "data-module": "quote-totals", "data-state": "per-service" }, [
      h("div", null, "You pay the price of each service every time it is performed."),
      TaxesNote(),
    ]);
  }
  if (!order.money) {
    return h("div", { "class": "quote-option__note", "data-module": "quote-totals", "data-state": "unpriced" }, "No price is stated on this quote yet.");
  }
  var period = pricePeriod(order);
  return h("div", { "class": "money-rows quote-totals", "data-module": "quote-totals", "data-visual-id": "quote-totals" }, [
    h("div", { "class": "money-rows__row money-rows__row--total", "data-kind": "total" }, [h("span", null, "Total"), h("span", null, period ? order.money.total + " " + period : order.money.total)]),
    TaxesNote(),
  ]);
}

function TaxesNote() {
  return h("div", { "class": "quote-option__taxes", "data-kind": "taxes" }, state.config.taxesNote);
}

function QuoteDecisions(order, settings) {
  var command = state.contractCommand;
  var targeted = !!command && command.kind !== "changes" && command.targets.indexOf(order.backendId) !== -1;
  var outcome = targeted && command.phase !== "pending" ? CommandOutcome(command.phase, command.message) : null;
  var busy = !!settings.busy;
  if (order.status !== "unseen") return outcome ? h("div", { "class": "quote-option__decide" }, outcome) : null;
  var confirm = state.contractConfirm;
  var confirming = !!confirm && confirm.backendId === order.backendId && confirm.kind === "decline";
  var section = h("div", { "class": "quote-option__decide" });
  if (confirming) section.appendChild(DeclineConfirm(order, settings, targeted && command.phase === "pending"));
  else {
    section.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Approve", action: "quote.approve", id: String(order.backendId), lg: true, disabled: busy, visualId: "quote-approve" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "quote.decline", id: String(order.backendId), lg: true, disabled: busy, visualId: "quote-decline" }),
    ]));
  }
  if (outcome) section.appendChild(outcome);
  return section;
}

function DeclineConfirm(order, settings, pending) {
  var label = order.pricingModel ? order.pricingModel.label : "this option";
  var titleId = "decision-title-" + order.backendId;
  var confirmButton = ActionButton({
    variant: "btn--danger",
    label: pending ? "Sending…" : "Confirm decline",
    action: "quote.confirm", id: String(order.backendId), lg: true, disabled: pending || settings.busy, visualId: "quote-confirm",
  });
  if (pending) confirmButton.setAttribute("data-state", "pending");
  return h("div", { "class": "decision-confirm", "data-module": "decision-confirm", "data-visual-id": "decision-confirm", "data-state": pending ? "pending" : "open", "data-kind": "decline", role: "group", "aria-labelledby": titleId }, [
    h("p", { "class": "decision-confirm__title", id: titleId }, "Decline " + label + "?"),
    h("p", { "class": "decision-confirm__body" }, "A declined option can’t be approved later."),
    h("div", { "class": "proposal-actions" }, [
      confirmButton,
      ActionButton({ variant: "btn--ghost", label: "Cancel", action: "quote.cancel", lg: true, disabled: pending, visualId: "quote-cancel" }),
    ]),
  ]);
}

export function PropertyChangeRequest(group, busy) {
  var open = group.orders.filter(function (order) { return order.status === "unseen" && order.allowedActions.indexOf("changes") !== -1; });
  var command = state.contractCommand;
  var targeted = !!command && command.kind === "changes" && command.targets.some(function (backendId) { return group.orders.some(function (order) { return order.backendId === backendId; }); });
  var pending = targeted && command.phase === "pending";
  var outcome = targeted && !pending ? CommandOutcome(command.phase, command.message) : null;
  var confirm = state.contractConfirm;
  var asking = !!confirm && confirm.kind === "changes" && confirm.groupId === group.id;
  if (!open.length && !outcome && !pending) return null;
  var section = h("section", { "class": "card card--pad quote-changes", "data-module": "quote-property-actions", "data-visual-id": "quote-property-actions", "data-state": pending ? "pending" : asking ? "asking" : "idle", "aria-label": "Request changes to these quotes" });
  if (asking || pending) section.appendChild(ChangeRequest(confirm || { message: "", error: "" }, group, pending, busy));
  else if (open.length) {
    section.appendChild(h("div", { "class": "quote-changes__row" }, [
      h("div", { "class": "quote-changes__copy" }, open.length === 1 ? "Not quite right? Ask us to revise this quote." : "Not quite right? Ask us to revise the quotes for this property."),
      ActionButton({ variant: "btn--ghost", label: "Request changes", action: "quote.requestChanges", id: group.id, lg: true, disabled: busy, visualId: "quote-request-changes" }),
    ]));
  }
  if (outcome) section.appendChild(outcome);
  return section;
}

function ChangeRequest(confirm, group, pending, busy) {
  var id = "quote-changes-" + group.id;
  var titleId = id + "-title";
  var errorId = id + "-error";
  var input = h("textarea", {
    "class": "field decision-confirm__message",
    id: id,
    rows: "4",
    placeholder: "For example: add sidewalk de-icing, or quote weekly visits instead.",
    "data-quote-changes": group.id,
    "data-state": confirm.error ? "invalid" : undefined,
    "aria-labelledby": titleId,
    "aria-invalid": confirm.error ? "true" : undefined,
    "aria-describedby": confirm.error ? errorId : undefined,
    disabled: pending ? true : undefined,
  }, confirm.message || "");
  input.addEventListener("input", function () {
    if (state.contractConfirm === confirm) confirm.message = input.value;
  });
  var sendButton = ActionButton({ variant: "btn--primary", label: pending ? "Sending…" : "Send request", action: "quote.sendChanges", id: group.id, lg: true, disabled: pending || busy, visualId: "quote-send-changes" });
  if (pending) sendButton.setAttribute("data-state", "pending");
  return h("div", { "class": "decision-confirm", "data-module": "change-request", "data-visual-id": "change-request", "data-state": pending ? "pending" : confirm.error ? "invalid" : "open", "data-kind": "changes", role: "group", "aria-labelledby": titleId }, [
    h("label", { "class": "decision-confirm__title", id: titleId, "for": id }, "What should change?"),
    h("p", { "class": "decision-confirm__body" }, "Your request goes to our team for every open quote of this property, and we send you revised quotes."),
    input,
    confirm.error ? h("div", { "class": "field-error", id: errorId, role: "alert" }, confirm.error) : null,
    h("div", { "class": "proposal-actions" }, [
      sendButton,
      ActionButton({ variant: "btn--ghost", label: "Cancel", action: "quote.cancel", lg: true, disabled: pending, visualId: "quote-cancel" }),
    ]),
  ]);
}
