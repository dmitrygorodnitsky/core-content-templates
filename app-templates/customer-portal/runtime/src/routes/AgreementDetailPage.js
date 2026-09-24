import { h } from "../dom.js";
import { contractAgreementFor, state } from "../state.js";
import { contractCommandsBusy } from "../actions.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { NotFoundState } from "../components/primitives/RouteStates.js";
import { agreementTitle, plural } from "../components/proposals/QuotePackage.js";
import { ContractDetailSkeleton, PartialNotice, contractsGate } from "../components/proposals/ContractStates.js";
import { AgreementApproval, AgreementOutcome, AgreementParties, AgreementServices, AgreementStageNotice, AgreementTerm, AgreementTerms } from "../components/proposals/AgreementParts.js";

export function AgreementDetail() {
  var page = h("section", { "class": "page page--narrow", "data-route": "agreement.detail", "data-visual-id": "agreement-detail" });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "agreement-back" }, "‹ Back to your contracts"));
  var gate = contractsGate(ContractDetailSkeleton);
  if (gate) {
    page.setAttribute("data-state", gate.getAttribute("data-state") || "loading");
    page.appendChild(gate);
    return page;
  }
  var row = contractAgreementFor(state.agreementId);
  if (!row) {
    page.setAttribute("data-state", "not-found");
    page.appendChild(NotFoundState({ noun: "agreement", backLabel: "contracts", backRoute: "proposals.list" }));
    return page;
  }
  var agreement = row.agreement;
  page.setAttribute("data-state", agreement.stage);

  var facts = [];
  if (row.propertyCount) facts.push(plural(row.propertyCount, "property", "properties"));
  if (row.quoteCount) facts.push(plural(row.quoteCount, "quote", "quotes"));
  var title = agreementTitle(row);
  page.appendChild(h("div", { "class": "proposal-detail-head", "data-module": "agreement-detail-head", "data-visual-id": "agreement-detail-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      row.propertyNames.length ? h("div", { "class": "agreement-detail-head__eyebrow" }, "Service agreement") : null,
      h("h1", { "class": "proposal-detail-head__title", "data-bind": "agreement.title" }, title),
      facts.length ? h("div", { "class": "proposal-detail-head__meta" }, facts.join(" · ")) : null,
    ]),
    StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }),
  ]));

  var notice = AgreementStageNotice(agreement);
  if (notice) page.appendChild(notice);
  if (row.unreadableOrders) {
    page.appendChild(PartialNotice(row.unreadableOrders === 1 ? "1 quote listed in this agreement couldn’t be loaded." : row.unreadableOrders + " quotes listed in this agreement couldn’t be loaded."));
  }
  if (row.orders.some(function (order) { return order.linesState !== "ready"; })) {
    page.appendChild(PartialNotice("Some services in this agreement couldn’t be loaded. Prices and totals shown come from our system as returned."));
  }

  page.appendChild(AgreementParties(agreement.parties));
  var term = AgreementTerm(agreement);
  if (term) page.appendChild(term);
  page.appendChild(AgreementServices(row));
  page.appendChild(AgreementTerms(agreement.terms));
  var decision = agreement.allowedActions.indexOf("approve") !== -1 ? AgreementApproval(row, contractCommandsBusy()) : AgreementOutcome(agreement);
  if (decision) page.appendChild(decision);
  return page;
}
