// customer-portal-design/src/routes/ProposalsPage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ProposalCard } from "../components/proposals/ProposalCard.js";
import { ProposalComparison } from "../components/proposals/ProposalComparison.js";

export function proposalRollup() {
  var r = { approved: 0, revision: 0, declined: 0, unseen: 0, viewed: 0 };
  state.psites.forEach(function (p) { r[p.status]++; });
  return r;
}

/* ProposalCard (portfolio site row) */

export function ProposalsList() {
  var r = proposalRollup();
  var decided = r.approved + r.revision + r.declined;
  var open = r.unseen + r.viewed;
  var page = h("section", { "class": "page page--narrow", "data-route": "proposals.list", "data-visual-id": "proposals-list" });

  page.appendChild(h("div", { "class": "proposals-head" }, [
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em", "data-bind": "proposal.id" }, "Proposal #" + F.proposal.id),
      h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, open + " property choices open \u00b7 sent " + F.proposal.sent + " \u00b7 valid until " + F.proposal.validUntil)
    ]),
    h("span", { "class": "proposals-head__pill" }, decided + " of " + state.psites.length + " decided")
  ]));

  if (state.view === "empty") {
    page.appendChild(EmptyState({ glyph: "\ud83d\udcc4", title: "No proposals yet", desc: "When our team sends you a multi-site proposal, it shows up here." }));
    return page;
  }

  /* portfolio map */
  var canvas = h("div", { "class": "portfolio-map__canvas" }, [
    h("span", { "class": "portfolio-map__label" }, "portfolio map \u00b7 Port Coquitlam \u00b7 Coquitlam"),
    h("div", { "class": "portfolio-map__river" })
  ]);
  state.psites.forEach(function (p) {
    var st = F.pstatus[p.status];
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
    h("div", { "class": "proposal-footer__icon" }, "\u2726"),
    h("div", { style: "flex:1;font-size:13px;line-height:1.5;color:var(--ink-2)" }, "Decide each site independently. Every price is derived from that site\u2019s Beam AI measured area, so larger lots scale up automatically. Approved lines become live orders the moment you confirm.")
  ]));
  return page;
}

export function rollupCard(label, num, color) {
  return h("div", { "class": "rollup-card" }, [
    h("div", { "class": "rollup-card__label" }, label),
    h("div", { "class": "rollup-card__num", style: "color:" + color }, String(num))
  ]);
}

/* ProposalComparison — pricing-from-area table */
