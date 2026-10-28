import { h } from "../dom.js";
import { contractAgreementFor, state } from "../state.js";
import { contractCommandsBusy, ensureContractDetails } from "../actions.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { NotFoundState } from "../components/primitives/RouteStates.js";
import { agreementSeason, agreementTitle } from "../components/proposals/QuotePackage.js";
import { ContractDetailSkeleton, PartialNotice, contractsGate } from "../components/proposals/ContractStates.js";
import { LocationMap, placeEach } from "../components/storm/PropertyMap.js";
import { mapViewport, usablePropertyMap } from "../property-map-session.js";
import { AgreementApproval, AgreementOutcome, AgreementParties, AgreementServices, AgreementStageNotice, AgreementTerm, AgreementTerms } from "../components/proposals/AgreementParts.js";
import { AgreementDetailsStep } from "../components/proposals/AgreementDetails.js";

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

  var season = agreementSeason(agreement);
  var title = agreementTitle(row);
  page.appendChild(h("div", { "class": "proposal-detail-head", "data-module": "agreement-detail-head", "data-visual-id": "agreement-detail-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      row.propertyNames.length ? h("div", { "class": "agreement-detail-head__eyebrow" }, "Service agreement") : null,
      h("h1", { "class": "proposal-detail-head__title", "data-bind": "agreement.title" }, title),
      season ? h("div", { "class": "proposal-detail-head__meta", "data-bind": "agreement.season" }, season) : null,
    ]),
    StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }),
  ]));

  var approvable = agreement.allowedActions.indexOf("approve") !== -1;
  var detailing = agreement.allowedActions.indexOf("details") !== -1;
  if (detailing) ensureContractDetails(agreement.backendId);
  var notice = approvable ? AgreementApproval(row, contractCommandsBusy()) : detailing ? AgreementDetailsStep(row, contractCommandsBusy()) : AgreementStageNotice(agreement);
  if (notice) page.appendChild(notice);
  if (row.unreadableOrders) {
    page.appendChild(PartialNotice(row.unreadableOrders === 1 ? "1 quote listed in this agreement couldn’t be loaded." : row.unreadableOrders + " quotes listed in this agreement couldn’t be loaded."));
  }
  if (row.orders.some(function (order) { return order.linesState !== "ready"; })) {
    page.appendChild(PartialNotice("Some services in this agreement couldn’t be loaded. Prices and totals shown come from our system as returned."));
  }

  page.appendChild(AgreementParties(agreement.parties, !detailing));
  var term = AgreementTerm(agreement);
  if (term) page.appendChild(term);
  page.appendChild(AgreementServices(row, AgreementMap(row.properties)));
  var terms = AgreementTerms(agreement.terms, state.agreementTermsOpen);
  if (terms) page.appendChild(terms);
  var outcome = approvable || detailing ? null : AgreementOutcome(agreement);
  if (outcome) page.appendChild(outcome);
  return page;
}

function AgreementMap(entries) {
  var map = usablePropertyMap();
  var located = entries.filter(function (entry) { return !!entry.property; });
  if (!map || !located.length) return null;
  var places = located.map(function (entry) { return { id: entry.key, name: entry.title }; });
  return h("div", { "class": "ov-map__stage", "data-module": "agreement-map", "data-visual-id": "agreement-map", "data-surface": "google", style: "margin-bottom:16px" }, [
    LocationMap(map, mapViewport(), places, placeEach(map, located.map(function (entry) { return entry.property; })), "Finding these properties on the map…"),
  ]);
}
