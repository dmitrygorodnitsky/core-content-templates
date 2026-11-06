// customer-portal-design/src/routes/SpaPlanPage.js — Wave 15: My plan (under
// Account). Customer-scoped entitlements: an ACTIVE PACKAGE (finite visit
// credits) is visually and semantically distinct from a RECURRING MEMBERSHIP.
// Renders ONLY server-provided fields: title, status, remaining/total visits
// WHEN PROVIDED (a membership without a proven balance shows no "0 visits"),
// renewal/expiry, recurring display price verbatim, and the next valid action.
// Commands (plan.bookWithCredit / plan.cancelRenewal) render ONLY when returned
// in allowedActions; cancel-renewal success is written exclusively from the
// authoritative (demo) readback. Public "Membership options" stay in the
// catalog — this page never mixes offers into enrollment.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, isModuleEnabled, spaBookingOpen, spaCapability, spaCurrentApiDemoOpen, spaPlans, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { InlineFailure, skel } from "../components/primitives/RouteStates.js";
import { spaGate } from "../components/spa/CommerceBits.js";

function usageMeter(p) {
  /* both numbers are server-provided; the meter only draws them */
  if (p.remainingUses == null || p.totalUses == null) return null;
  var pct = p.totalUses ? Math.round((p.remainingUses / p.totalUses) * 100) : 0;
  return h("div", { "class": "plan-meter", "data-module": "plan-usage", "data-visual-id": "plan-usage", "data-bind": "plan.remainingUses,plan.totalUses" }, [
    h("div", { "class": "plan-meter__bar" }, h("i", { style: "width:" + pct + "%" })),
    h("div", { "class": "plan-meter__label" }, [h("b", null, String(p.remainingUses)), " of " + p.totalUses + " visits left"])
  ]);
}

function planCard(p) {
  var isPkg = p.kind === "PACKAGE";
  var cKey = "plan.cancelRenewal:" + p.ref;
  var phase = cmdPhase(cKey);
  var badge = F.spaCommerce.plans.statusBadges[p.status] || "status-badge--scheduled";
  var card = h("div", { "class": "card card--pad plan-card", "data-module": "plan-card", "data-visual-id": "plan-card", "data-plan-ref": p.ref, "data-plan-kind": p.kind, "data-state": p.status === "Used up" ? "exhausted" : undefined }, [
    h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
      h("span", { "class": "kind-chip kind-chip--" + (isPkg ? "package" : "membership"), "data-bind": "plan.kind" }, isPkg ? "Package" : "Membership"),
      h("div", { style: "flex:1" }),
      StatusBadge({ variant: badge, label: p.status, bind: "plan.status" })
    ]),
    h("div", { "class": "plan-card__title", "data-bind": "plan.title" }, p.title),
    usageMeter(p)
  ]);
  var facts = h("div", { "class": "appt-details" });
  if (p.renewsAt) facts.appendChild(factRow("Renews", p.renewsAt, "plan.renewsAt"));
  if (p.expiresAt) facts.appendChild(factRow(p.status === "Cancelled" ? "Ends" : "Expires", p.expiresAt, "plan.expiresAt"));
  if (p.displayRecurringPrice) facts.appendChild(factRow("Price", p.displayRecurringPrice, "plan.displayRecurringPrice"));
  if (facts.childNodes.length) card.appendChild(facts);
  if (p.attention) card.appendChild(h("div", { "class": "purch-row__attention", "data-bind": "plan.attention", role: "note", style: "margin-top:10px" }, p.attention));
  if (p.note) card.appendChild(h("div", { "class": "purch-ful__note", style: "margin-top:10px" }, p.note));

  var actions = h("div", { "class": "appt-hero__actions" });
  if (p.allowedActions.indexOf("bookWithCredit") !== -1) {
    var bookOpen = spaBookingOpen();
    actions.appendChild(ActionButton({ variant: "btn--primary", label: "Book with a credit", action: "plan.bookWithCredit", id: p.ref, disabled: !bookOpen, visualId: "plan-book-credit" }));
    if (!bookOpen) card.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable", style: "margin-top:10px" }, "Online booking isn\u2019t available yet \u2014 the studio books credit visits for you."));
  }
  if (p.allowedActions.indexOf("cancelRenewal") !== -1) {
    if (phase === "failed") card.appendChild(h("div", { style: "margin-top:10px" }, InlineFailure({ msg: "Renewal wasn\u2019t cancelled \u2014 your membership is unchanged.", retryAction: "plan.cancelRenewal", retryId: p.ref, retryLabel: "Try again" })));
    if (phase === "conflict") card.appendChild(h("div", { style: "margin-top:10px" }, InlineFailure({ msg: "Your plan changed since you opened it \u2014 reload before making changes.", retryAction: "ui.retry", retryId: cKey, retryLabel: "Reload" })));
    actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Cancel renewal", action: "plan.cancelRenewal", id: p.ref, confirm: true, pending: phase === "pending", pendingLabel: "Cancelling\u2026", disabled: phase === "conflict", visualId: "plan-cancel-renewal" }));
  }
  if (p.status === "Used up") {
    actions.appendChild(ActionButton({ variant: "btn--primary", label: "Buy this package again", action: "checkout.start", id: "plan", visualId: "plan-buy-again" }));
  }
  if (actions.childNodes.length) card.appendChild(actions);
  return card;
}

function factRow(label, val, bind) {
  return h("div", { "class": "appt-details__row" }, [
    h("div", { "class": "appt-details__label" }, label),
    h("div", { "class": "appt-details__val", "data-bind": bind }, h("b", null, val))
  ]);
}

export function SpaPlan() {
  /* live plan state comes from the module, exactly as Purchases does; the
     fixture scenario view applies only when the portal is not live */
  var live = state.config.dataMode === "live";
  var source = live ? state.moduleData.plan : null;
  var view = live ? (state.moduleStatus.plan || source && source.state || "loading") : state.view;
  var page = h("section", { "class": "page", "data-route": "plan", "data-state": view, "data-visual-id": "spa-plan", "data-module": "spa-plan", "data-capability": spaCapability(), "data-screen-label": "My plan" });
  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "account.open" }, "\u2039 Account")));
  page.appendChild(PageHeader({ title: "My plan", sub: "Your packages and membership \u2014 balances and renewal, exactly as recorded." }));

  /* Plan reads are opened by the plan module. When the deployment does not
     enable it there is no customer entitlement source, and this accepted
     unavailable treatment is the truth. Once the module is on, the real plan
     list renders with its own loading / error / empty / unauthorized gates —
     saying "not in the current API" then would be false. */
  if (spaCurrentApiDemoOpen() && !isModuleEnabled("plan")) {
    page.appendChild(h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "plan-current-api-unavailable", "data-state": "unavailable" }, [
      h("div", { "class": "state-block__glyph" }, "\u2740"),
      h("div", { "class": "state-block__title" }, "Personal plan details aren\u2019t in the current API"),
      h("div", { "class": "state-block__desc" }, "You can order a published package or membership now. The resulting Core Order appears in Purchases, but visit balances and renewal controls need a customer entitlement API."),
      ActionButton({ variant: "btn--primary", label: "See membership options", action: "nav.go", id: "pricing", visualId: "plan-current-api-options" })
    ]));
    return page;
  }

  var gate = spaGate({
    view: view,
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      var w = h("div", { "class": "plan-grid", "data-state": "loading", "aria-busy": "true" });
      w.appendChild(skel("height:220px;border-radius:24px"));
      w.appendChild(skel("height:220px;border-radius:24px"));
      return w;
    },
    error: { title: "Couldn\u2019t load your plan", desc: "Your plan didn\u2019t load, so no balance is shown \u2014 we never guess remaining visits. Nothing was changed; try again.", retryId: "plan" },
    scope: "your plan", backRoute: "account",
    unavailable: { title: "My plan isn\u2019t available yet", desc: "Plan balances aren\u2019t connected on this portal yet. Published membership options are in Services & prices.",
      action: { variant: "btn--ghost", label: "Membership options", action: "nav.go", id: "pricing", visualId: "plan-unavailable-options" } }
  });
  if (gate) { page.appendChild(gate); return page; }

  var plans = view === "empty" ? [] : spaPlans();
  if (!plans.length) {
    page.appendChild(h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "plan-empty", "data-state": "empty" }, [
      h("div", { "class": "state-block__glyph" }, "\u2740"),
      h("div", { "class": "state-block__title" }, "You don\u2019t have a plan yet"),
      h("div", { "class": "state-block__desc" }, "Packages and membership you buy will live here with their balance and renewal. The published options are in the catalog."),
      ActionButton({ variant: "btn--primary", label: "See membership options", action: "nav.go", id: "pricing", visualId: "plan-empty-options" })
    ]));
    return page;
  }

  var grid = h("div", { "class": "plan-grid", "data-module": "plan-list", "data-visual-id": "plan-list" });
  plans.forEach(function (p) { grid.appendChild(planCard(p)); });
  page.appendChild(grid);
  page.appendChild(h("div", { "class": "catalog-note" }, "Balances, renewal dates and prices are shown exactly as recorded on your plan \u2014 this page never estimates or projects them."));
  return page;
}
