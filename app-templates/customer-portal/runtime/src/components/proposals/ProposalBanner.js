// customer-portal/runtime/src/components/proposals/ProposalBanner.js — production transfer module.
import { h } from "../../dom.js";
import { currentProposal, currentTheme, proposalSites } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";

export function ProposalBanner(pendingCount) {
  var v = currentTheme();
  var proposal = currentProposal();
  var siteCount = proposalSites().length;
  return h("div", {
    "class": "alert-banner alert-banner--glass", "data-module": "alert-banner", "data-visual-id": "proposal-banner",
    "data-action": "proposal.review"
  }, [
    h("div", { "class": "brand-logo brand-logo--lg" }),
    h("div", { "class": "alert-banner__body" }, [
      h("div", { "class": "alert-banner__title" }, [
        h("span", { "data-bind": "proposal.id" }, "Proposal #" + proposal.id + " is ready"),
        StatusBadge({ variant: "status-badge--warn", label: pendingCount + " awaiting you", bind: "proposal.pendingCount" })
      ]),
      h("div", { "class": "alert-banner__desc" }, v.prop.svc + " across " + siteCount + " properties \u00b7 choose a plan per site \u00b7 valid until " + proposal.validUntil)
    ]),
    h("div", { "class": "btn btn--primary btn--lg" }, "Review proposal \u203a")
  ]);
}
