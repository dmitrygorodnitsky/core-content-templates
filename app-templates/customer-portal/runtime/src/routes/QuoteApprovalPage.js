import { h } from "../dom.js";
import { contractsListShown, quoteGroupFor, state } from "../state.js";
import { contractCommandsBusy, ensureContractDetails } from "../actions.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { NotFoundState } from "../components/primitives/RouteStates.js";
import { QUOTE_STATUS } from "../components/proposals/QuotePackage.js";
import { ContractDetailsForm, contractDetailsLoading } from "../components/proposals/ContractDetailsForm.js";
import { CommandOutcome, ContractDetailSkeleton, contractsGate } from "../components/proposals/ContractStates.js";
import { formatOrderPrice } from "../normalizers/contracts.js";

export function QuoteApproval() {
  var page = h("section", { "class": "page page--narrow", "data-route": "proposal.approve", "data-visual-id": "quote-approval" });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "quote.backToQuote", "data-visual-id": "quote-approval-back" }, "‹ Back to the quote"));
  var gate = contractsGate(ContractDetailSkeleton);
  if (gate) {
    page.setAttribute("data-state", gate.getAttribute("data-state") || "loading");
    page.appendChild(gate);
    return page;
  }
  var group = quoteGroupFor(state.currentSiteId);
  var order = group ? group.orders.find(function (candidate) { return candidate.backendId === state.approveQuoteId; }) : null;
  if (!order) {
    page.setAttribute("data-state", "not-found");
    page.appendChild(NotFoundState({ noun: "quote", backLabel: contractsListShown() ? "orders" : "contracts", backRoute: "proposals.list" }));
    return page;
  }
  var command = state.contractCommand;
  var targeted = !!command && command.targets.indexOf(order.backendId) !== -1;
  var pending = targeted && command.phase === "pending";
  var outcome = targeted && !pending ? CommandOutcome(command.phase, command.message) : null;
  var waiting = order.status === "unseen";
  page.setAttribute("data-state", pending ? "pending" : waiting ? "open" : order.status);

  page.appendChild(h("div", { "class": "proposal-detail-head", "data-module": "quote-approval-head", "data-visual-id": "quote-approval-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "proposal-detail-head__title", tabindex: "-1" }, "Contract details"),
      h("div", { "class": "proposal-detail-head__meta" }, [group.title, group.address].filter(Boolean).join(" · ")),
    ]),
  ]));
  page.appendChild(OptionSummary(order, group, waiting));

  if (!waiting) {
    page.appendChild(h("div", { "class": "proposal-decided", "data-module": "quote-approval-closed", "data-state": order.status }, [
      h("div", { "class": "proposal-decided__icon" }, "i"),
      h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2)" }, "This option is no longer waiting for your decision."),
    ]));
    if (outcome) page.appendChild(outcome);
    page.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Back to the quote", action: "quote.backToQuote", lg: true, visualId: "quote-approval-return" }),
    ]));
    return page;
  }

  ensureContractDetails();
  var details = state.contractDetails;
  var send = ActionButton({
    variant: "btn--primary",
    label: pending ? "Sending…" : "Approve " + optionName(order),
    action: "quote.sendApproval",
    id: String(order.backendId),
    lg: true,
    disabled: pending || contractCommandsBusy() || contractDetailsLoading(details),
    visualId: "quote-approval-send",
  });
  if (pending) send.setAttribute("data-state", "pending");
  page.appendChild(h("div", { "class": "card card--pad quote-approval__form", "data-module": "quote-approval-form", "data-visual-id": "quote-approval-form" }, [
    ContractDetailsForm(details, pending),
    outcome,
    h("div", { "class": "proposal-actions" }, [
      send,
      ActionButton({ variant: "btn--ghost", label: "Back", action: "quote.backToQuote", lg: true, disabled: pending, visualId: "quote-approval-cancel" }),
    ]),
  ]));
  return page;
}

function OptionSummary(order, group, waiting) {
  var status = QUOTE_STATUS[order.status];
  var perService = !!order.pricing && !order.pricing.total;
  var price = perService ? "You pay the price of each service every time it is performed." : formatOrderPrice(order);
  var siblingsOpen = waiting && group.orders.some(function (other) { return other.backendId !== order.backendId && other.status === "unseen"; });
  return h("section", { "class": "card card--pad quote-approval__summary", "data-module": "quote-approval-summary", "data-visual-id": "quote-approval-summary", "data-state": order.status, "aria-label": "The option you are approving" }, [
    h("div", { "class": "quote-option__head" }, [
      h("h2", { "class": "quote-option__model" }, optionName(order)),
      waiting ? null : StatusBadge({ variant: status.badge, label: status.label, bind: "quote.statusLabel", state: order.status }),
    ]),
    price ? h("div", { "class": "quote-approval__price", "data-pricing": perService ? "per-service" : "total" }, price) : null,
    h("div", { "class": "quote-option__taxes", "data-kind": "taxes" }, state.config.taxesNote),
    siblingsOpen ? h("div", { "class": "quote-option__note" }, "Approving it declines the other options for this property.") : null,
  ]);
}

function optionName(order) {
  return order.pricingModel ? order.pricingModel.label : "this option";
}
