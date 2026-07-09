// customer-portal/runtime/src/components/proposals/ProposalCard.js — production transfer module.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { computeSite, state } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";

export function ProposalCard(site) {
  var c = computeSite(site);
  var st = F.pstatus[site.status];
  var sub = site.city.split(",")[0] + " \u00b7 " + c.total.toLocaleString() + " sq ft \u00b7 " +
    (site.status === "approved" ? "chose " + F.planName(site.selected) : "3 plans offered");
  var fromPrice = site.status === "declined" ? null : "$" + c.monthly.toLocaleString();
  return h("div", { "class": "proposal-card", "data-module": "proposal-card", "data-visual-id": "proposal-card", "data-action": "proposal.open", "data-id": site.id, "data-state": site.status }, [
    h("div", { "class": "proposal-card__diamond", style: "background:" + st.dot }),
    h("div", { "class": "proposal-card__body" }, [
      h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "site.addr" }, site.addr),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, sub)
    ]),
    fromPrice ? h("div", { "class": "proposal-card__price" }, [fromPrice, h("span", null, "/mo")]) : null,
    StatusBadge({ variant: st.badge, label: st.label, bind: "site.statusLabel" }),
    h("span", { style: "font-weight:600;font-size:18px;color:#c2c7d0" }, "\u203a")
  ]);
}
