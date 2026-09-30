// customer-portal-design/src/routes/SpaCartPage.js — Wave 15: the persistent
// SERVER cart (capability retail-commerce-open). Every mutation is a versioned
// command whose success readback is a COMPLETE recalculated server cart —
// presentation renders returned display totals verbatim and never recomputes.
// Pending is ROW-SCOPED: one busy line never freezes the others. Stale-price
// and inventory-conflict are explicit server-reported states with explicit
// resolutions. Nothing on this page implies that adding to the bag reserves
// inventory, and nothing here is a purchase.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, spaCapability, spaCartLines, spaRetailOpen, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { ConflictBanner, skel } from "../components/primitives/RouteStates.js";
import { UnavailableState, spaGate } from "../components/spa/CommerceBits.js";

function cartLineRow(l, i) {
  var demo = state.spaCartDemo;
  var lineState = i === 0 && demo === "stale-price" ? "stale-price" : i === 0 && demo === "inventory-conflict" ? "inventory-conflict" : null;
  var qPhase = cmdPhase("cart.changeQuantity:" + l.ref);
  var rPhase = cmdPhase("cart.removeItem:" + l.ref);
  var busy = qPhase === "pending" || rPhase === "pending";
  var row = h("div", { "class": "cart-row spa-cart-row", "data-module": "cart-line", "data-visual-id": "cart-line", "data-line-ref": l.ref, "data-state": lineState || (busy ? "pending" : (qPhase !== "idle" ? qPhase : undefined)) }, [
    h("div", { "class": "cart-row__body" }, [
      h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "cart.lines[].title" }, l.title + (l.variant ? " \u00b7 " + l.variant : "")),
      h("div", { style: "font-size:13px;color:var(--ink-2)", "data-bind": "cart.lines[].displayUnitPrice" }, l.displayUnitPrice + " each"),
      qPhase === "failed" ? h("div", { "class": "cart-row__note", role: "alert" }, "Didn\u2019t save \u2014 quantity unchanged. Try again.") : null,
      lineState === "stale-price" ? h("div", { "class": "cart-row__note", role: "alert", "data-bind": "cart.lines[].priceNote" }, "The price of this item changed since you added it \u2014 refresh the bag to see current totals.") : null,
      lineState === "inventory-conflict" ? h("div", { "class": "cart-row__note", role: "alert" }, [
        "Only 1 is available right now. ",
        h("span", { "class": "link-action", "data-action": "cart.changeQuantity", "data-id": l.ref + "|1" }, "Keep 1"),
        " \u00b7 ",
        h("span", { "class": "link-action", "data-action": "cart.removeItem", "data-id": l.ref }, "Remove")
      ]) : null
    ]),
    h("div", { "class": "qty" }, [
      h("button", { "class": "qty__btn qty__btn--minus", "data-action": "cart.changeQuantity", "data-id": l.ref + "|" + (l.qty - 1), "aria-label": "Decrease", disabled: busy ? true : undefined }, "\u2212"),
      h("div", { "class": "qty__val", "data-bind": "cart.lines[].quantity" }, String(l.qty)),
      h("button", { "class": "qty__btn qty__btn--plus", "data-action": "cart.changeQuantity", "data-id": l.ref + "|" + (l.qty + 1), "aria-label": "Increase", disabled: busy ? true : undefined }, "+")
    ]),
    h("div", { "class": "cart-row__total", "data-bind": "cart.lines[].displayTotal" }, l.displayTotal),
    h("button", { "class": "cart-remove", "data-action": "cart.removeItem", "data-id": l.ref, disabled: busy ? true : undefined }, rPhase === "pending" ? "Removing\u2026" : "Remove")
  ]);
  return row;
}

export function SpaCart() {
  var page = h("section", { "class": "page", "data-route": "cart", "data-state": state.view, "data-visual-id": "spa-cart", "data-module": "spa-cart", "data-capability": spaCapability(), "data-cart-ref": state.spaCart ? state.spaCart.version : undefined, "data-screen-label": "Your bag" });
  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "nav.products" }, "\u2039 Keep shopping")));
  page.appendChild(PageHeader({ title: "Your bag", sub: "Items you\u2019re planning to buy \u2014 totals come from the store, and nothing is reserved yet." }));

  if (!spaRetailOpen()) {
    page.appendChild(UnavailableState({ title: "Online shopping isn\u2019t open yet", desc: "The shop is browse-only on this portal for now \u2014 nothing can be added to a bag or purchased online.", action: { variant: "btn--ghost", label: "Browse the shop", action: "nav.products", visualId: "cart-unavailable-shop" } }));
    return page;
  }

  var gate = spaGate({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      var w = h("div", { "data-state": "loading", "aria-busy": "true" });
      w.appendChild(skel("height:220px;border-radius:24px"));
      w.appendChild(skel("height:130px;border-radius:24px;margin-top:18px"));
      return w;
    },
    error: { title: "Couldn\u2019t load your bag", desc: "Your bag didn\u2019t load, so nothing is shown \u2014 we never show a stale bag. Nothing was changed; try again.", retryId: "cart" },
    scope: "your bag", backRoute: "products",
    unavailable: { title: "The bag isn\u2019t available right now", desc: "The store can\u2019t open your bag at the moment. Your items aren\u2019t lost \u2014 try again in a bit." }
  });
  if (gate) { page.appendChild(gate); return page; }

  var lines = spaCartLines();
  if (state.view === "empty" || lines.length === 0) {
    page.appendChild(h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "cart-empty", "data-state": "empty" }, [
      h("div", { "class": "state-block__glyph" }, "\u25a1"),
      h("div", { "class": "state-block__title" }, "Your bag is empty"),
      h("div", { "class": "state-block__desc" }, "Products you add from the shop will wait here. Adding something doesn\u2019t reserve it \u2014 stock is confirmed at checkout."),
      ActionButton({ variant: "btn--primary", label: "Browse the shop", action: "nav.products", visualId: "cart-empty-shop" })
    ]));
    return page;
  }

  var demo = state.spaCartDemo;
  var grid = h("div", { "class": "purch-grid" });
  var left = h("div", { "class": "appt-col" });
  var right = h("div", { "class": "appt-col" });

  if (demo === "stale-price") {
    left.appendChild(ConflictBanner({ noun: "bag", desc: "The store re-checked your items and a price changed. Load the latest bag before checking out \u2014 nothing was ordered.", retryId: "cart-quote" }));
  }

  var card = h("div", { "class": "card", "data-module": "cart-list", "data-visual-id": "cart-list", "data-state": demo !== "as-added" ? demo : undefined }, [
    h("div", { "class": "card__head" }, [
      h("span", { "class": "card__title" }, "Items"),
      h("span", { style: "font-size:12px;color:var(--ink-3)", "data-bind": "cart.version" }, "kept in your account \u2014 not reserved")
    ])
  ]);
  var listWrap = h("div", { style: "padding:0 16px 8px" });
  lines.forEach(function (l, i) { listWrap.appendChild(cartLineRow(l, i)); });
  card.appendChild(listWrap);
  left.appendChild(card);

  /* server-owned display totals — rendered verbatim */
  var totals = state.spaCart.displayTotals;
  var totalsCard = h("div", { "class": "card card--pad", "data-module": "cart-totals", "data-visual-id": "cart-totals" }, [
    h("div", { "class": "card__title" }, "Totals"),
    h("div", { "class": "money-rows" }, [
      h("div", { "class": "money-rows__row" }, [h("span", null, "Subtotal"), h("span", { "data-bind": "cart.displayTotals.subtotal" }, totals.subtotal)]),
      h("div", { "class": "money-rows__row" }, [h("span", null, "Tax"), h("span", { "data-bind": "cart.displayTotals.tax" }, totals.tax)]),
      h("div", { "class": "money-rows__row money-rows__row--total" }, [h("span", null, "Total"), h("span", { "data-bind": "cart.displayTotals.total" }, totals.total)])
    ]),
    demo === "stale-price" ? h("div", { "class": "purch-ful__note", "data-state": "stale" }, "Shown totals are the last confirmed ones \u2014 they update when you load the latest bag.") : null
  ]);
  right.appendChild(totalsCard);

  /* explicit fulfillment summary */
  var ful = state.spaCart.fulfillment;
  right.appendChild(h("div", { "class": "card card--pad", "data-module": "cart-fulfillment", "data-visual-id": "cart-fulfillment" }, [
    h("div", { "class": "card__title" }, "How you\u2019ll get it"),
    h("div", { style: "font-weight:600;font-size:13.5px;margin-top:6px", "data-bind": "cart.fulfillment.label" }, ful.label),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px", "data-bind": "cart.fulfillment.detail" }, ful.detail),
    h("div", { "class": "purch-ful__note", style: "margin-top:10px" }, "Items in your bag aren\u2019t reserved \u2014 stock and prices are confirmed at checkout.")
  ]));

  var blocked = demo === "stale-price" || demo === "inventory-conflict";
  right.appendChild(h("div", { style: "display:flex;flex-direction:column;gap:8px" }, [
    ActionButton({ variant: "btn--primary", label: "Go to checkout", action: "checkout.start", id: "cart", lg: true, block: true, disabled: blocked, visualId: "cart-checkout" }),
    blocked ? h("div", { "class": "purch-ful__note", "data-state": demo }, demo === "stale-price" ? "Checkout opens after you load the latest prices." : "Checkout opens after the stock issue above is resolved.") : null
  ]));

  grid.appendChild(left);
  grid.appendChild(right);
  page.appendChild(grid);
  return page;
}
