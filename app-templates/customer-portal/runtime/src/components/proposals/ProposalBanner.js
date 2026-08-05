// customer-portal/runtime/src/components/proposals/ProposalBanner.js — production transfer module.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";

export function ProposalBanner(pendingCount) {
  var v = F.themes[state.theme];
  return h("div", {
    "class": "alert-banner alert-banner--glass", "data-module": "alert-banner", "data-visual-id": "proposal-banner",
    "data-action": "proposal.review"
  }, [
    h("div", { "class": "brand-logo brand-logo--lg" }),
    h("div", { "class": "alert-banner__body" }, [
      h("div", { "class": "alert-banner__title" }, [
        h("span", { "data-bind": "proposal.id" }, "Proposal #" + F.proposal.id + " is ready"),
        StatusBadge({ variant: "status-badge--warn", label: pendingCount + " awaiting you", bind: "proposal.pendingCount" })
      ]),
      h("div", { "class": "alert-banner__desc" }, v.prop.svc + " across 4 properties \u00b7 choose a plan per site \u00b7 valid until " + F.proposal.validUntil)
    ]),
    h("div", { "class": "btn btn--primary btn--lg" }, "Review proposal \u203a")
  ]);
}
