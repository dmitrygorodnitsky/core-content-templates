// customer-portal/runtime/src/routes/CheckoutPage.js — production transfer module.
import { h } from "../dom.js";
import { currentFixture, currentTheme, money, state } from "../state.js";
import { go } from "../actions.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { CartRow } from "../components/commerce/CartRow.js";
import { AddressCard } from "../components/commerce/AddressCard.js";
import { PaymentCard } from "../components/commerce/PaymentMethodCard.js";

export function Checkout() {
  var fixture = currentFixture();
  var theme = currentTheme();
  var page = h("section", { "class": "page", "data-route": "checkout", "data-visual-id": "checkout" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "Checkout"),
    h("div", { "class": "section-head__sub" }, "Review your items, delivery and payment.")
  ]));

  if (state.cartItems.length === 0 || state.view === "empty") {
    page.appendChild(h("div", { "class": "empty-cart", "data-module": "empty-state", "data-state": "empty", "data-visual-id": "empty-cart" }, [
      h("div", { "class": "empty-cart__glyph" }, "\ud83d\uded2"),
      h("div", { style: "font-weight:700;font-size:18px" }, "Your cart is empty"),
      h("div", { style: "font-size:14px;color:var(--ink-2);margin:6px 0 20px" }, "Browse Calm Harbor ritual products and add them to your order."),
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
    h("div", { style: "display:flex;flex-direction:column;gap:10px" }, fixture.addresses.map(AddressCard))]);
  left.appendChild(addrPanel);
  var payPanel = h("div", { "class": "checkout-panel" }, [h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Payment"),
    h("div", { style: "display:flex;flex-direction:column;gap:10px" }, fixture.cards.map(PaymentCard))]);
  left.appendChild(payPanel);

  var summary = h("div", { "class": "checkout-panel checkout-summary", "data-module": "checkout-summary", "data-visual-id": "checkout-summary" }, [
    h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:16px" }, "Order summary"),
    h("div", { "class": "summary-row" }, [h("span", null, "Subtotal"), h("b", null, money(subtotal))]),
    h("div", { "class": "summary-row" }, [h("span", null, "Delivery"), h("b", { style: "color:var(--ok)" }, "Free")]),
    h("div", { "class": "summary-row" }, [h("span", null, "Est. tax"), h("b", null, money(tax))]),
    h("div", { "class": "summary-total" }, [h("span", null, "Total"), h("span", null, money(subtotal + tax))]),
    ActionButton({ variant: "btn--primary", label: "Place order", action: "checkout.placeOrder", block: true, lg: true, visualId: "place-order" }),
    h("div", { "class": "summary-note" }, theme.checkoutNote || "Orders are prepared by Calm Harbor and sent to your saved delivery address.")
  ]);

  grid.appendChild(left); grid.appendChild(summary);
  page.appendChild(grid);
  return page;
}

/* =========================================================
   WAVE 4 — Proposals
   ========================================================= */
