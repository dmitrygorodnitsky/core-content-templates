// customer-portal/runtime/src/routes/ProposalsPage.js — production transfer module.
import { h } from "../dom.js";
import { currentProposal, proposalStatusMeta, quotePackage, state } from "../state.js";
import { browserStorage, createGeocodeCache } from "../adapters/google-maps-adapter.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ProposalCard } from "../components/proposals/ProposalCard.js";
import { ProposalComparison } from "../components/proposals/ProposalComparison.js";
import { AgreementList, ContractsHead, ContractsSectionTitle, PortfolioSchematic, QuoteGroups, QuotesFooter, QuotesPreparing, QuotesPreparingNotice } from "../components/proposals/QuotePackage.js";
import { ContractsListSkeleton, ContractsNotices, contractsGate } from "../components/proposals/ContractStates.js";
import { knownPlacement } from "../components/storm/PropertyMap.js";

export function proposalRollup() {
  var r = { approved: 0, revision: 0, declined: 0, unseen: 0, viewed: 0 };
  state.psites.forEach(function (p) { r[p.status]++; });
  return r;
}

/* ProposalCard (portfolio site row) */

export function ProposalsList() {
  if (state.config.dataMode === "live") return ContractsPage();
  var quotes = quotePackage();
  if (quotes) return ContractsPage();

  var proposal = currentProposal();
  var statusMeta = proposalStatusMeta();
  var r = proposalRollup();
  var decided = r.approved + r.revision + r.declined;
  var open = r.unseen + r.viewed;
  var page = h("section", { "class": "page page--narrow", "data-route": "proposals.list", "data-visual-id": "proposals-list" });

  page.appendChild(h("div", { "class": "proposals-head" }, [
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em", "data-bind": "proposal.id" }, "Proposal #" + proposal.id),
      h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, open + " property choices open · sent " + proposal.sent + " · valid until " + proposal.validUntil)
    ]),
    h("span", { "class": "proposals-head__pill" }, decided + " of " + state.psites.length + " decided")
  ]));

  if (state.view === "empty") {
    page.appendChild(EmptyState({ glyph: "📄", title: "No proposals yet", desc: "When our team sends you a multi-site proposal, it shows up here." }));
    return page;
  }

  /* portfolio map */
  var canvas = h("div", { "class": "portfolio-map__canvas" }, [
    h("span", { "class": "portfolio-map__label" }, proposal.mapLabel || "portfolio map · Port Coquitlam · Coquitlam"),
    h("div", { "class": "portfolio-map__river" })
  ]);
  state.psites.forEach(function (p) {
    var st = statusMeta[p.status];
    canvas.appendChild(h("div", { "class": "map-pin-wrap", style: "left:" + p.x + "%;top:" + p.y + "%" }, [
      h("div", { "class": "map-pin-diamond", style: "background:" + st.dot }),
      h("div", { "class": "map-pin-label" }, p.addr)
    ]));
  });
  page.appendChild(h("div", { "class": "portfolio-map", "data-module": "portfolio-map", "data-visual-id": "portfolio-map" }, canvas));

  /* rollup */
  page.appendChild(h("div", { "class": "rollup-grid", "data-module": "proposal-rollup" }, [
    rollupCard("Approved", r.approved, "var(--ok)"),
    rollupCard("Revision", r.revision, "var(--warn)"),
    rollupCard("Declined", r.declined, "var(--danger)"),
    rollupCard("Open", open, "var(--ink-3)")
  ]));

  /* site list */
  page.appendChild(h("div", { "class": "site-list", "data-module": "proposal-list", "data-visual-id": "proposal-list" }, state.psites.map(ProposalCard)));

  /* footer */
  page.appendChild(h("div", { "class": "proposal-footer" }, [
    h("div", { "class": "proposal-footer__icon" }, "✦"),
    h("div", { style: "flex:1;font-size:13px;line-height:1.5;color:var(--ink-2)" }, "Decide each site independently. Every price is derived from that site’s Beam AI measured area, so larger lots scale up automatically. Approving a plan records your decision on the quote we already prepared for that site.")
  ]));
  return page;
}

function ContractsPage() {
  var page = h("section", { "class": "page page--narrow", "data-route": "proposals.list", "data-visual-id": "proposals-list" });
  var gate = contractsGate(ContractsListSkeleton);
  if (gate) {
    page.setAttribute("data-state", gate.getAttribute("data-state") || "loading");
    page.appendChild(gate);
    return page;
  }
  var quotes = quotePackage();
  if (!quotes) {
    page.setAttribute("data-state", "unavailable");
    page.appendChild(EmptyState({ glyph: "○", title: "Contracts aren’t in the portal yet", desc: "Your quotes and service agreements can’t be shown here yet." }));
    return page;
  }
  var hasAgreements = quotes.agreements.length > 0;
  var hasQuotes = quotes.groups.length > 0;
  var partial = ContractsNotices(quotes);
  page.setAttribute("data-state", hasAgreements || hasQuotes ? (partial.length ? "partial" : "ready") : quotes.preparing ? "preparing" : "empty");
  page.appendChild(ContractsHead(quotes));

  if (!hasAgreements && !hasQuotes) {
    partial.forEach(function (notice) { page.appendChild(notice); });
    page.appendChild(quotes.preparing
      ? QuotesPreparing()
      : EmptyState({ glyph: "📄", title: "No contracts yet", desc: "When we send you a quote or a service agreement, it shows up here." }));
    return page;
  }

  if (quotes.preparing) page.appendChild(QuotesPreparingNotice());
  partial.forEach(function (notice) { page.appendChild(notice); });

  if (hasAgreements) {
    page.appendChild(h("section", { "class": "contracts-section", "data-module": "contracts-agreements", "aria-label": "Service agreements" }, [
      ContractsSectionTitle("Service agreements", quotes.agreements.length),
      AgreementList(quotes.agreements),
    ]));
  }

  if (hasQuotes) {
    var section = h("section", { "class": "contracts-section", "data-module": "contracts-quotes", "aria-label": "Quotes" }, [
      hasAgreements ? ContractsSectionTitle("Quotes", quotes.counts.orders) : null,
    ]);
    var cache = createGeocodeCache(browserStorage());
    var placements = quotes.groups.map(function (group) {
      return group.property ? knownPlacement(group.property, cache) : { point: null, reason: "no-address" };
    });
    var schematic = PortfolioSchematic(quotes.groups, placements);
    if (schematic) section.appendChild(schematic);
    section.appendChild(h("div", { "class": "rollup-grid", "data-module": "proposal-rollup", "aria-label": "Quotes by decision" }, [
      rollupCard("Approved", quotes.counts.approved, "var(--ok)"),
      rollupCard("Revision", quotes.counts.revision, "var(--warn)"),
      rollupCard("Declined", quotes.counts.declined, "var(--danger)"),
      rollupCard("Open", quotes.counts.open, "var(--ink-3)"),
    ]));
    section.appendChild(QuoteGroups(quotes.groups, placements, !!schematic));
    if (quotes.deciding) section.appendChild(QuotesFooter());
    page.appendChild(section);
  }
  return page;
}

export function rollupCard(label, num, color) {
  return h("div", { "class": "rollup-card" }, [
    h("div", { "class": "rollup-card__label" }, label),
    h("div", { "class": "rollup-card__num", style: "color:" + color }, String(num))
  ]);
}

/* ProposalComparison — pricing-from-area table */
