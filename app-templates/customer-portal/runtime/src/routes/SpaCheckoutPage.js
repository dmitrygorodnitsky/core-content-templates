// customer-portal-design/src/routes/SpaCheckoutPage.js — Wave 15: SIMULATED
// checkout (route checkout, spa only). A server-priced review of a frozen
// source (cart | plan; bookings arrive through the drawer bridge): contact,
// fulfillment, order lines, server totals and policy acknowledgement. The
// payment step ALWAYS carries the explicit "Simulation — no charge will be
// made" treatment; there are no card fields, saved payment methods, PSP
// controls or redirects, and the primary command is "Confirm order" — never
// "Pay now". Blocking review states (repriced / inventory-conflict /
// slot-expired) disable confirmation until an explicit reload. The
// CONFIRMATION renders ONLY from the authoritative (demo) readback
// (state.spaResult) — copy is "Order confirmed" / "Booking confirmed" /
// "Demo checkout completed", never a payment-success claim.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, currentContact, spaCapability, spaCartLines, spaPlanOffers, spaRetailOpen, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { ConflictBanner, InlineFailure, skel } from "../components/primitives/RouteStates.js";
import { SimulationBadge, UnavailableState, spaGate } from "../components/spa/CommerceBits.js";

const LIVE_CHECKOUT = Object.freeze({
  ref: "customer-portal-checkout",
  expiresNote: "Prices and availability are re-checked when you confirm.",
  fulfillmentOptions: Object.freeze([
    Object.freeze({ ref: "ful-pickup", kind: "PICKUP", label: "Pickup at the studio", detail: "The studio confirms availability after the order is recorded" }),
  ]),
  fulfillmentNote: "Delivery isn’t offered on this portal yet — pickup only.",
  policy: "I understand this is a simulated checkout and no payment will be taken.",
});

function checkoutContract() {
  return state.config.dataMode === "live" ? LIVE_CHECKOUT : F.spaCommerce.checkout;
}

function quoteSource() {
  /* wave 16 — source `plan` is the frozen quote of ONE published offer
     (data-plan-offer-ref); packages and memberships have distinct quotes */
  if (state.spaCheckoutSource === "plan") {
    if (state.config.dataMode === "live") {
      var offer = spaPlanOffers().find(function (item) { return item.ref === state.spaPlanOffer; });
      if (!offer) return null;
      return {
        lines: [{ ref: "line-" + offer.ref, title: offer.title, variant: null, qty: 1, displayUnitPrice: offer.displayPrice, displayTotal: offer.displayPrice }],
        displayTotals: { subtotal: offer.displayPrice, tax: "$0.00", total: offer.displayPrice },
        recurringNote: offer.kind === "MEMBERSHIP" ? offer.termsSummary : null,
      };
    }
    return F.spaCommerce.checkout.planQuotes[state.spaPlanOffer || "off-pkg-4c21"] || F.spaCommerce.checkout.planQuote;
  }
  var cart = state.spaCart;
  return cart && cart.lines.length ? { lines: cart.lines, displayTotals: cart.displayTotals } : null;
}

/* ---- confirmation — authoritative readback ONLY ---- */
function Confirmation(res) {
  var card = h("div", { "class": "card card--pad co-confirm", "data-module": "spa-confirmation", "data-visual-id": "spa-confirmation", "data-state": "confirmed", "data-result-kind": res.kind }, [
    h("div", { "class": "co-confirm__glyph" }, "\u2713"),
    h("div", { "class": "co-confirm__title", "data-bind": "result.headline" }, res.headline),
    h("div", { "class": "co-confirm__sub", "data-bind": "result.sub" }, res.sub),
    SimulationBadge(true)
  ]);
  var facts = h("div", { "class": "appt-details", style: "margin-top:14px;text-align:left" });
  if (res.purchase) {
    facts.appendChild(h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, "Purchase"),
      h("div", { "class": "appt-details__val" }, [
        h("b", { "data-bind": "result.purchase.reference" }, res.purchase.reference), " \u00b7 ",
        h("span", { "class": "link-action", "data-action": "purchase.open", "data-id": res.purchase.ref, "data-purchase-ref": res.purchase.ref }, "view purchase \u203a")
      ])
    ]));
  }
  if (res.appointment) {
    facts.appendChild(h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, "Visit"),
      h("div", { "class": "appt-details__val" }, [
        h("b", { "data-bind": "result.appointment.service" }, res.appointment.service), " \u00b7 " + res.appointment.start + " \u00b7 ",
        h("span", { "class": "link-action", "data-action": "purchase.openAppointment", "data-id": res.appointment.ref, "data-appointment-ref": res.appointment.ref }, "see appointments \u203a")
      ])
    ]));
  }
  if (res.plan) {
    facts.appendChild(h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, "Plan"),
      h("div", { "class": "appt-details__val" }, [
        h("b", { "data-bind": "result.plan.title" }, res.plan.title), " \u00b7 " + res.plan.status + " \u00b7 ",
        h("span", { "class": "link-action", "data-action": "account.openPlan" }, "open My plan \u203a")
      ])
    ]));
  }
  if (res.fulfillment) {
    facts.appendChild(h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, "Pickup"),
      h("div", { "class": "appt-details__val", "data-bind": "result.fulfillment" }, res.fulfillment)
    ]));
  }
  card.appendChild(facts);
  card.appendChild(h("div", { "class": "appt-hero__actions", style: "justify-content:center" }, [
    ActionButton({ variant: "btn--primary", label: "All purchases", action: "account.openPurchases", visualId: "confirm-purchases" }),
    ActionButton({ variant: "btn--ghost", label: "Back to appointments", action: "nav.go", id: "orders.list", visualId: "confirm-home" })
  ]));
  return card;
}

export function SpaCheckout() {
  var demo = state.spaCheckoutDemo;
  var res = state.spaResult;
  var co = checkoutContract();
  var page = h("section", { "class": "page", "data-route": "checkout", "data-state": res ? "confirmed" : (state.view !== "ready" ? state.view : demo), "data-visual-id": "spa-checkout", "data-module": "spa-checkout", "data-capability": spaCapability(), "data-checkout-ref": co.ref, "data-payment-mode": "SIMULATED", "data-screen-label": "Checkout (simulated)" });

  if (res) {
    page.appendChild(h("div", { style: "max-width:560px;margin:26px auto 0" }, Confirmation(res)));
    return page;
  }

  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": state.spaCheckoutSource === "cart" ? "cart.open" : "account.openPlan" }, state.spaCheckoutSource === "cart" ? "\u2039 Back to your bag" : "\u2039 Back")));
  page.appendChild(PageHeader({ title: "Review & confirm", sub: "Check everything below \u2014 nothing is ordered until you confirm." }));

  if (!spaRetailOpen() && state.spaCheckoutSource === "cart") {
    page.appendChild(UnavailableState({ title: "Checkout isn\u2019t open yet", desc: "Online purchasing isn\u2019t enabled on this portal. Nothing can be ordered here yet.", action: { variant: "btn--ghost", label: "Browse the shop", action: "nav.products", visualId: "co-unavailable-shop" } }));
    return page;
  }

  var gate = spaGate({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      var w = h("div", { "data-state": "loading", "aria-busy": "true" });
      w.appendChild(skel("height:320px;border-radius:24px"));
      return w;
    },
    error: { title: "Couldn\u2019t prepare your checkout", desc: "The review didn\u2019t load, so nothing is shown and nothing was ordered. Try again.", retryId: "checkout" },
    scope: "checkout", backRoute: "cart",
    unavailable: { title: "Checkout isn\u2019t available right now", desc: "The store can\u2019t take orders at the moment. Your bag is safe \u2014 nothing was ordered." }
  });
  if (gate) { page.appendChild(gate); return page; }

  var q = quoteSource();
  if (!q) {
    page.appendChild(UnavailableState({ title: "There\u2019s nothing to check out", desc: "Your bag is empty, so there\u2019s nothing to review here.", action: { variant: "btn--ghost", label: "Browse the shop", action: "nav.products", visualId: "co-empty-shop" } }));
    return page;
  }

  var key = "checkout.confirm:" + co.ref;
  var phase = cmdPhase(key);
  var blocked = demo !== "ready";
  var contact = currentContact();

  var grid = h("div", { "class": "purch-grid" });
  var left = h("div", { "class": "appt-col" });
  var right = h("div", { "class": "appt-col" });

  /* ---- blocking review states (server-reported; confirm stays disabled) ---- */
  if (demo === "repriced") left.appendChild(ConflictBanner({ noun: "quote", desc: "Prices changed while you were reviewing. Load the latest quote and check the new totals \u2014 nothing was ordered.", retryId: "checkout-quote" }));
  if (demo === "inventory-conflict") left.appendChild(ConflictBanner({ noun: "quote", desc: "Something in your order just went out of stock. Go back to your bag to fix it \u2014 nothing was ordered.", retryId: "checkout-quote" }));
  if (demo === "slot-expired") left.appendChild(ConflictBanner({ noun: "held time", desc: "Your held appointment time expired during review. Pick a new time to continue \u2014 nothing was booked or ordered.", retryId: "checkout-quote" }));

  /* ---- contact (least data, read-only here) ---- */
  left.appendChild(h("div", { "class": "card card--pad", "data-module": "checkout-contact", "data-visual-id": "checkout-contact" }, [
    h("div", { "class": "card__title" }, "Contact"),
    h("div", { "class": "co-contact" }, [
      h("div", { "data-bind": "session.displayName" }, state.sessionName || "Customer"),
      h("div", { style: "color:var(--ink-2)", "data-bind": "profile.email,profile.phone" }, contact.email + " \u00b7 " + contact.phone)
    ]),
    h("div", { "class": "purch-ful__note" }, "We use these only to tell you about this order.")
  ]));

  /* ---- fulfillment selection (allowed options only) ---- */
  var fulCard = h("div", { "class": "card card--pad", "data-module": "checkout-fulfillment", "data-visual-id": "checkout-fulfillment" }, [h("div", { "class": "card__title" }, "How you\u2019ll get it")]);
  co.fulfillmentOptions.forEach(function (o) {
    fulCard.appendChild(h("label", { "class": "co-ful" + (o.ref === "ful-pickup" ? " co-ful--on" : ""), "data-action": "checkout.selectFulfillment", "data-id": o.ref, "data-fulfillment-ref": o.ref, "data-state": "active" }, [
      h("i", { "class": "co-ful__dot" }),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "checkout.fulfillment.label" }, o.label),
        h("div", { style: "font-size:12px;color:var(--ink-3)", "data-bind": "checkout.fulfillment.detail" }, o.detail)
      ])
    ]));
  });
  fulCard.appendChild(h("div", { "class": "purch-ful__note" }, co.fulfillmentNote));
  left.appendChild(fulCard);

  /* ---- order lines (frozen server quote) ---- */
  var linesCard = h("div", { "class": "card card--pad", "data-module": "checkout-lines", "data-visual-id": "checkout-lines" }, [h("div", { "class": "card__title" }, "Your order")]);
  q.lines.forEach(function (l) {
    linesCard.appendChild(h("div", { "class": "co-line", "data-line-ref": l.ref }, [
      h("span", { style: "flex:1;min-width:0", "data-bind": "checkout.lines[].title" }, l.title + (l.variant ? " \u00b7 " + l.variant : "") + " \u00d7 " + l.qty),
      h("b", { "data-bind": "checkout.lines[].displayTotal" }, l.displayTotal)
    ]));
  });
  linesCard.appendChild(h("div", { "class": "purch-ful__note" }, co.expiresNote));
  if (q.recurringNote) linesCard.appendChild(h("div", { "class": "purch-row__attention", "data-bind": "checkout.recurringNote", role: "note", style: "margin-top:8px" }, q.recurringNote));
  left.appendChild(linesCard);

  /* ---- server totals + THE payment step (simulation treatment) ---- */
  var t = q.displayTotals;
  var payCard = h("div", { "class": "card card--pad", "data-module": "checkout-payment", "data-visual-id": "checkout-payment", "data-payment-mode": "SIMULATED" }, [
    h("div", { "class": "card__title" }, "Totals & confirmation"),
    h("div", { "class": "money-rows" }, [
      h("div", { "class": "money-rows__row" }, [h("span", null, "Subtotal"), h("span", { "data-bind": "checkout.displayTotals.subtotal" }, t.subtotal)]),
      h("div", { "class": "money-rows__row" }, [h("span", null, "Tax"), h("span", { "data-bind": "checkout.displayTotals.tax" }, t.tax)]),
      h("div", { "class": "money-rows__row money-rows__row--total" }, [h("span", null, "Total"), h("span", { "data-bind": "checkout.displayTotals.total" }, t.total)])
    ]),
    SimulationBadge(true),
    h("div", { "class": "purch-ful__note" }, "This is a demonstration checkout: confirming records your order without any payment. There\u2019s nothing to enter \u2014 no card, no charge, no receipt."),
    h("label", { "class": "co-policy", "data-module": "policy-ack", "data-visual-id": "policy-ack", "data-state": state.spaPolicyAck ? "acked" : "required" }, [
      h("button", { "class": "co-policy__box" + (state.spaPolicyAck ? " co-policy__box--on" : ""), "data-action": "checkout.ackPolicy", role: "checkbox", "aria-checked": state.spaPolicyAck ? "true" : "false" }, state.spaPolicyAck ? "\u2713" : ""),
      h("span", { "data-bind": "checkout.policy" }, co.policy)
    ])
  ]);

  if (phase === "failed") payCard.appendChild(InlineFailure({
    msg: "Your order wasn\u2019t confirmed \u2014 nothing was created. You can try again.",
    retryAction: "checkout.retryConfirm", retryId: co.ref, retryLabel: "Try confirming again"
  }));
  if (phase === "conflict") payCard.appendChild(InlineFailure({
    msg: "The quote changed at the last moment \u2014 reload it and review before confirming. Nothing was ordered.",
    retryAction: "ui.retry", retryId: key, retryLabel: "Reload quote"
  }));

  payCard.appendChild(h("div", { style: "margin-top:12px" }, ActionButton({
    variant: "btn--primary", label: "Confirm order", action: "checkout.confirm", id: co.ref, block: true, lg: true,
    pending: phase === "pending", pendingLabel: "Confirming\u2026",
    disabled: blocked || !state.spaPolicyAck || phase === "conflict", visualId: "checkout-confirm"
  })));
  if (!state.spaPolicyAck && !blocked) payCard.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Tick the box above to confirm"));
  right.appendChild(payCard);

  grid.appendChild(left);
  grid.appendChild(right);
  page.appendChild(grid);
  return page;
}
