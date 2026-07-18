// customer-portal-design/src/routes/CheckoutPage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { cmdPhase, money, state } from "../state.js";
import { go } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { ConflictBanner, InlineFailure, routeStateBody, skel } from "../components/primitives/RouteStates.js";
import { CartRow } from "../components/commerce/CartRow.js";
import { AddressCard } from "../components/commerce/AddressCard.js";
import { PaymentCard } from "../components/commerce/PaymentMethodCard.js";

export function Checkout() {
  var page = h("section", { "class": "page", "data-route": "checkout", "data-state": state.view, "data-visual-id": "checkout" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "Checkout"),
    h("div", { "class": "section-head__sub" }, "Review your items, delivery and payment.")
  ]));

  /* wave 13 — the cart is server-priced; addresses/payment are references.
     While unresolved/failed/unauthorized no totals or references render. */
  var gate = routeStateBody({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      return h("div", { "class": "checkout-grid", "data-state": "loading", "aria-busy": "true" }, [
        h("div", { style: "display:flex;flex-direction:column;gap:16px" }, [
          skel("height:200px;border-radius:20px"), skel("height:170px;border-radius:20px"), skel("height:170px;border-radius:20px")
        ]),
        skel("height:320px;border-radius:20px")
      ]);
    },
    error: { title: "Couldn\u2019t load your checkout", desc: "The server-priced cart didn\u2019t load, so no totals are shown. Nothing was ordered or charged \u2014 try again.", retryId: "checkout" },
    scope: "checkout"
  });
  if (gate) { page.appendChild(gate); return page; }

  if (state.cartItems.length === 0 || state.view === "empty") {
    page.appendChild(h("div", { "class": "empty-cart", "data-module": "empty-state", "data-state": "empty", "data-visual-id": "empty-cart" }, [
      h("div", { "class": "empty-cart__glyph" }, "\ud83d\uded2"),
      h("div", { style: "font-weight:700;font-size:18px" }, "Your cart is empty"),
      h("div", { style: "font-size:14px;color:var(--ink-2);margin:6px 0 20px" }, "Browse units, thermostats, filters and purifiers."),
      ActionButton({ variant: "btn--primary", label: "Browse products", action: "nav.go", id: "products", lg: true, visualId: "browse-products" })
    ]));
    return page;
  }

  var subtotal = state.cartItems.reduce(function (a, x) { return a + x.priceNum * x.qty; }, 0);
  var tax = Math.round(subtotal * 0.0825);
  var grid = h("div", { "class": "checkout-grid" });

  var left = h("div", { style: "display:flex;flex-direction:column;gap:16px" });
  var cartCard = h("div", { "class": "cart-card", "data-module": "cart-list", "data-visual-id": "cart-list" }, [h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 4px" }, "Your cart")]);
  state.cartItems.forEach(function (it) { cartCard.appendChild(CartRow(it)); });
  left.appendChild(cartCard);

  var addrPanel = h("div", { "class": "checkout-panel" }, [h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Delivery address"),
    h("div", { style: "display:flex;flex-direction:column;gap:10px" }, F.addresses.map(AddressCard))]);
  left.appendChild(addrPanel);
  var payPanel = h("div", { "class": "checkout-panel" }, [h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Payment"),
    h("div", { style: "display:flex;flex-direction:column;gap:10px" }, F.cards.map(PaymentCard))]);
  left.appendChild(payPanel);

  /* wave 13 — order submission is a command: pending disables duplicates, failure
     keeps the authoritative cart visible with explicit retry, conflict means the
     server re-priced the cart (stale totals — refresh before submitting), and
     success exists only as the server-confirmed order (readback → orders list).
     No local success state is ever rendered here. */
  var ckKey = "checkout.placeOrder:cart";
  var ckPhase = cmdPhase(ckKey);
  var summary = h("div", { "class": "checkout-panel checkout-summary", "data-module": "checkout-summary", "data-visual-id": "checkout-summary", "data-state": ckPhase === "idle" ? "ready" : ckPhase }, [
    h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:16px" }, "Order summary"),
    ckPhase === "conflict" ? ConflictBanner({ noun: "cart", desc: "Prices were updated on the server, so the totals below may be stale. Load the latest \u2014 nothing was ordered or charged.", retryId: ckKey }) : null,
    h("div", { "class": "summary-row" }, [h("span", null, "Subtotal"), h("b", null, money(subtotal))]),
    h("div", { "class": "summary-row" }, [h("span", null, "Delivery"), h("b", { style: "color:var(--ok)" }, "Free")]),
    h("div", { "class": "summary-row" }, [h("span", null, "Est. tax"), h("b", null, money(tax))]),
    h("div", { "class": "summary-total" }, [h("span", null, "Total"), h("span", null, money(subtotal + tax))]),
    ckPhase === "failed" ? h("div", { style: "margin-bottom:12px" }, InlineFailure({ msg: "Your order was NOT placed \u2014 nothing was charged. Your cart is unchanged.", retryAction: "checkout.placeOrder", retryLabel: "Try again" })) : null,
    ActionButton({ variant: "btn--primary", label: "Place order", action: "checkout.placeOrder", block: true, lg: true, visualId: "place-order",
      pending: ckPhase === "pending", pendingLabel: "Placing order\u2026", disabled: ckPhase === "conflict" }),
    ckPhase === "pending"
      ? h("div", { "class": "summary-note" }, "Confirming with the server \u2014 your order isn\u2019t placed until it\u2019s confirmed.")
      : h("div", { "class": "summary-note" }, "Installation is scheduled with a technician after checkout. Free returns within 30 days.")
  ]);

  grid.appendChild(left); grid.appendChild(summary);
  page.appendChild(grid);
  return page;
}

/* =========================================================
   WAVE 4 — Proposals
   ========================================================= */
