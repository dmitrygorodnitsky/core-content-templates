// customer-portal-design/src/routes/SpaPurchaseDetailPage.js — Wave 15: Purchase
// detail. Renders the customer-safe Purchase detail read model: summary header,
// line items (grouped ONLY when the source provides groups), separate sections
// for commercial totals / fulfillment / related appointments / related plan —
// absent sections are OMITTED, never guessed. Actions are capability-driven from
// `allowedActions` (openAppointment / cancelRequest / returnRequest / buyAgain)
// with the wave-13 command lifecycle per exact entity. Return and cancellation
// are REQUEST flows: the success readback is "accepted for review", never a
// guaranteed outcome, and no refund consequence is shown or calculated.
// Order, fulfillment, appointment and plan states stay separate dimensions.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, currentPurchase, spaCapability, spaRetailOpen, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { InlineFailure, NotFoundState, skel } from "../components/primitives/RouteStates.js";
import { DetailSection, KindChip, MoneyRows, SimulationBadge, purchaseStatusBadge, spaGate } from "../components/spa/CommerceBits.js";

function lineRow(l, d) {
  var retState = state.spaReturns[l.ref];
  var phase = cmdPhase("purchase.returnRequest:" + l.ref);
  var canReturn = l.returnable && d.allowedActions.indexOf("returnRequest") !== -1 && !retState;
  return h("div", { "class": "purch-line", "data-module": "purchase-line", "data-visual-id": "purchase-line", "data-line-ref": l.ref, "data-state": retState ? "return-" + retState : (phase !== "idle" ? phase : undefined) }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("div", { "class": "purch-line__title", "data-bind": "purchase.lines[].title" }, l.title + (l.variant ? " \u00b7 " + l.variant : "")),
      h("div", { "class": "purch-line__meta", "data-bind": "purchase.lines[].quantity,purchase.lines[].displayUnitPrice" }, l.quantity + " \u00d7 " + l.displayUnitPrice),
      retState === "accepted-for-review" ? h("div", { "class": "purch-line__note", "data-state": "accepted-for-review" }, "Return requested \u2014 accepted for review. We\u2019ll confirm the next step; nothing is refunded or promised yet.") : null,
      phase === "failed" ? InlineFailure({ msg: "Your return request didn\u2019t go through \u2014 nothing was requested.", retryAction: "purchase.returnRequest", retryId: l.ref, retryLabel: "Try again" }) : null,
      phase === "conflict" ? InlineFailure({ msg: "This order changed since you opened it \u2014 reload before requesting a return.", retryAction: "ui.retry", retryId: "purchase.returnRequest:" + l.ref, retryLabel: "Reload" }) : null
    ]),
    h("div", { "class": "purch-line__side" }, [
      h("b", { "data-bind": "purchase.lines[].displayTotal" }, l.displayTotal),
      canReturn ? ActionButton({ variant: "btn--ghost", label: "Request return", action: "purchase.returnRequest", id: l.ref, pending: phase === "pending", pendingLabel: "Requesting\u2026", visualId: "line-return-request" }) : null
    ])
  ]);
}

function linesBlock(d) {
  var wrap = h("div", { "class": "purch-lines", "data-module": "purchase-lines", "data-visual-id": "purchase-lines" });
  if (d.groups) {
    /* grouping is SOURCE-PROVIDED — never invented in presentation */
    d.groups.forEach(function (g) {
      wrap.appendChild(h("div", { "class": "purch-lines__group" }, g.label));
      g.lines.forEach(function (ref) {
        var l = d.lines.find(function (x) { return x.ref === ref; });
        if (l) wrap.appendChild(lineRow(l, d));
      });
    });
  } else {
    d.lines.forEach(function (l) { wrap.appendChild(lineRow(l, d)); });
  }
  return wrap;
}

export function SpaPurchaseDetail() {
  var d = currentPurchase();
  var page = h("section", { "class": "page", "data-route": "purchase.detail", "data-state": state.view, "data-visual-id": "spa-purchase-detail", "data-module": "spa-purchase-detail", "data-capability": spaCapability(), "data-purchase-ref": d ? d.ref : undefined, "data-screen-label": "Purchase detail" });

  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "account.openPurchases" }, "\u2039 All purchases")));

  var gate = spaGate({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      var w = h("div", { "data-state": "loading", "aria-busy": "true" });
      w.appendChild(skel("height:200px;border-radius:24px"));
      w.appendChild(skel("height:140px;border-radius:24px;margin-top:18px"));
      return w;
    },
    error: { title: "Couldn\u2019t load this purchase", desc: "This purchase didn\u2019t load, so nothing is shown \u2014 we never show stale records. Nothing was changed; try again.", retryId: "purchase" },
    scope: "this purchase", backRoute: "purchases.list",
    notFound: { noun: "purchase", backLabel: "purchases", backRoute: "purchases.list" },
    unavailable: { title: "Purchase details aren\u2019t available yet", desc: "The detailed view isn\u2019t connected on this portal yet. Your purchase list still shows current states." }
  });
  if (gate) { page.appendChild(gate); return page; }

  if (!d) {
    /* non-enumerating: an unknown, removed or foreign ref reads identically */
    page.appendChild(NotFoundState({ noun: "purchase", backLabel: "purchases", backRoute: "purchases.list" }));
    return page;
  }

  var cancelState = state.spaCancelReqs[d.ref];
  var cPhase = cmdPhase("purchase.cancelRequest:" + d.ref);
  var bPhase = cmdPhase("purchase.buyAgain:" + d.ref);

  /* ---- summary header: reference, placed date, kind, customer-safe status ---- */
  var head = h("div", { "class": "card card--pad purch-head", "data-module": "purchase-summary", "data-visual-id": "purchase-summary", "data-purchase-ref": d.ref }, [
    h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Purchase"),
      KindChip(d.kind),
      purchaseStatusBadge(d.customerStatus)
    ]),
    h("div", { "class": "purch-head__ref", "data-bind": "purchase.reference" }, d.reference),
    h("div", { "class": "purch-head__meta" }, [
      h("span", { "data-bind": "purchase.placedAt" }, "Placed " + d.placedAt),
      h("span", { "class": "purch-head__dot" }, "\u00b7"),
      h("span", { "data-bind": "purchase.displayTotal" }, d.money.total + " " + d.money.currency)
    ]),
    cancelState === "accepted-for-review" ? h("div", { "class": "purch-line__note", "data-state": "accepted-for-review", style: "margin-top:10px" },
      "Cancellation requested \u2014 accepted for review. The order stays as shown until the studio confirms; nothing is undone yet.") : null
  ]);
  page.appendChild(head);

  var grid = h("div", { "class": "purch-grid" });
  var left = h("div", { "class": "appt-col" });
  var right = h("div", { "class": "appt-col" });

  /* ---- items ---- */
  var itemsCard = h("div", { "class": "card card--pad", "data-module": "purchase-items", "data-visual-id": "purchase-items" }, [
    h("div", { "class": "card__title" }, "Items"),
    linesBlock(d)
  ]);
  left.appendChild(itemsCard);

  /* ---- commercial totals (separate from fulfillment/appointment state) ---- */
  var totalsCard = h("div", { "class": "card card--pad", "data-module": "purchase-totals", "data-visual-id": "purchase-totals" }, [
    h("div", { "class": "card__title" }, "Totals"),
    MoneyRows(d.money),
    h("div", { "class": "purch-paynote" }, [SimulationBadge(), h("span", { "class": "purch-paynote__txt" }, "Totals are recorded amounts \u2014 no payment was taken through this portal.")])
  ]);
  right.appendChild(totalsCard);

  /* ---- fulfillment — its OWN state dimension, omitted when absent ---- */
  if (d.fulfillment) {
    right.appendChild(h("div", { "class": "card card--pad", "data-module": "purchase-fulfillment", "data-visual-id": "purchase-fulfillment", "data-state": undefined }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, d.fulfillment.kind === "PICKUP" ? "Pickup" : d.fulfillment.kind === "ENTITLEMENT" ? "Your plan credit" : "Fulfillment"),
        StatusBadge({ variant: "status-badge--scheduled", label: d.fulfillment.status, bind: "purchase.fulfillment.status" })
      ]),
      d.fulfillment.pickupWindow ? h("div", { "class": "purch-ful__row", "data-bind": "purchase.fulfillment.pickupWindow" }, d.fulfillment.pickupWindow) : null,
      d.fulfillment.note ? h("div", { "class": "purch-ful__note" }, d.fulfillment.note) : null
    ]));
  }

  /* ---- related appointments — operational visits, not order status ---- */
  if (d.relatedAppointments && d.relatedAppointments.length) {
    var ap = h("div", { "class": "card card--pad", "data-module": "purchase-appointments", "data-visual-id": "purchase-appointments" }, [h("div", { "class": "card__title" }, "Appointment")]);
    d.relatedAppointments.forEach(function (a) {
      ap.appendChild(h("div", { "class": "purch-appt", "data-appointment-ref": a.ref }, [
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "purchase.relatedAppointments[].service" }, a.service),
          h("div", { style: "font-size:12px;color:var(--ink-3)", "data-bind": "purchase.relatedAppointments[].start" }, a.start)
        ]),
        StatusBadge({ variant: F.spa.statusBadges[a.customerStatus] || "status-badge--scheduled", label: a.customerStatus, bind: "purchase.relatedAppointments[].customerStatus" }),
        d.allowedActions.indexOf("openAppointment") !== -1
          ? h("span", { "class": "link-action", "data-action": "purchase.openAppointment", "data-id": a.ref, "data-appointment-ref": a.ref }, "View \u203a")
          : null
      ]));
    });
    right.appendChild(ap);
  }

  /* ---- related plan — entitlement created by this purchase ---- */
  if (d.relatedPlan) {
    right.appendChild(h("div", { "class": "card card--pad", "data-module": "purchase-plan", "data-visual-id": "purchase-plan", "data-plan-ref": d.relatedPlan.ref }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Your plan"),
        StatusBadge({ variant: "status-badge--ok", label: d.relatedPlan.status, bind: "purchase.relatedPlan.status" })
      ]),
      h("div", { style: "font-weight:600;font-size:13.5px;margin-top:6px", "data-bind": "purchase.relatedPlan.title" }, d.relatedPlan.title),
      h("div", { style: "margin-top:8px" }, h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203a"))
    ]));
  }

  /* ---- capability-driven commands ---- */
  var actions = h("div", { "class": "purch-actions", "data-module": "purchase-actions", "data-visual-id": "purchase-actions" });
  if (d.allowedActions.indexOf("cancelRequest") !== -1 && !cancelState) {
    if (cPhase === "failed") actions.appendChild(InlineFailure({ msg: "Your cancellation request didn\u2019t go through \u2014 the order is unchanged.", retryAction: "purchase.cancelRequest", retryId: d.ref, retryLabel: "Try again" }));
    if (cPhase === "conflict") actions.appendChild(InlineFailure({ msg: "This order changed since you opened it \u2014 reload before requesting changes.", retryAction: "ui.retry", retryId: "purchase.cancelRequest:" + d.ref, retryLabel: "Reload" }));
    actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Request cancellation", action: "purchase.cancelRequest", id: d.ref, confirm: true, pending: cPhase === "pending", pendingLabel: "Requesting\u2026", disabled: cPhase === "conflict", visualId: "purchase-cancel-request" }));
  }
  if (d.allowedActions.indexOf("buyAgain") !== -1) {
    var retailOk = spaRetailOpen() && d.kind === "RETAIL";
    if (bPhase === "failed") actions.appendChild(InlineFailure({ msg: "Couldn\u2019t add these items to your bag \u2014 your bag is unchanged.", retryAction: "purchase.buyAgain", retryId: d.ref, retryLabel: "Try again" }));
    actions.appendChild(ActionButton({
      variant: "btn--primary", label: d.kind === "RETAIL" ? "Buy again" : "Buy this plan again",
      action: "purchase.buyAgain", id: d.ref,
      pending: bPhase === "pending", pendingLabel: "Adding\u2026",
      disabled: d.kind === "RETAIL" && !retailOk, visualId: "purchase-buy-again"
    }));
    if (d.kind === "RETAIL" && !retailOk) actions.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Online shopping isn\u2019t open on this portal yet \u2014 the studio can help you reorder."));
  }
  if (actions.childNodes.length) left.appendChild(actions);

  grid.appendChild(left);
  grid.appendChild(right);
  page.appendChild(grid);
  return page;
}
