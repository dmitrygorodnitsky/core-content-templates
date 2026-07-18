// customer-portal-design/src/routes/SpaShopPage.js — Wave 14: Calm Harbor Shop
// (route products) — a SECONDARY destination behind Appointments and
// Services & prices. Current staging renders ONLY the proven public PIM fields:
// product code, name, safe short description and displayed price (verbatim).
// Wave 15 — under the NEW deployment capability `retail-commerce-open`
// (data-retail on the route root) the SAME cards become sellable with SERVER
// sellability states: sellable | unavailable | out-of-stock | price-changed |
// variant-required. Add-to-bag is a row-scoped command (one pending card never
// freezes the grid) whose success readback is the complete recalculated server
// cart. Nothing here implies that adding to the bag reserves inventory.
// Browse-only rendering is unchanged from the accepted wave 14.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, spaCapability, spaCartCount, spaRetailOpen, state } from "../state.js";
import { gridSkeleton, routeStateBody } from "../components/primitives/RouteStates.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

function sellInfo(code) {
  return F.spaCommerce.retail.products.find(function (r) { return r.code === code; }) || { state: "unavailable" };
}

function sellableCard(p) {
  var r = sellInfo(p.code);
  var pickedRef = state.spaVariantPick[p.code] || null;
  var picked = r.variants ? r.variants.find(function (v) { return v.ref === pickedRef; }) : null;
  var phase = cmdPhase("cart.addItem:" + p.code);
  var canAdd = r.state === "sellable" || r.state === "price-changed" || (r.state === "variant-required" && picked);
  var muted = r.state === "out-of-stock" || r.state === "unavailable";

  var card = h("div", { "class": "card card--pad spa-shop-card" + (muted ? " spa-shop-card--muted" : ""), "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": p.code, "data-product-ref": p.code, "data-state": phase !== "idle" ? phase : r.state }, [
    h("div", { style: "font-weight:700;font-size:14.5px;overflow-wrap:anywhere", "data-bind": "pim.products[].name" }, p.name),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:3px;line-height:1.45", "data-bind": "pim.products[].shortDescription" }, p.blurb)
  ]);

  /* server sellability treatments — never inferred in the browser */
  if (r.state === "out-of-stock") {
    card.appendChild(h("div", { "class": "shop-chip shop-chip--stock", "data-bind": "retail.state" }, "Out of stock"));
  } else if (r.state === "unavailable") {
    card.appendChild(h("div", { "class": "shop-chip", "data-bind": "retail.state" }, r.note || "Not sold online"));
  } else if (r.state === "variant-required") {
    var vRow = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
    r.variants.forEach(function (v) {
      vRow.appendChild(h("button", {
        "class": "shop-variant" + (pickedRef === v.ref ? " shop-variant--on" : ""),
        "data-action": "shop.pickVariant", "data-id": p.code + "|" + v.ref, "data-variant-ref": v.ref,
        "data-state": pickedRef === v.ref ? "active" : undefined
      }, v.label + " \u00b7 " + v.displayPrice));
    });
    card.appendChild(vRow);
  }

  var price = r.state === "variant-required"
    ? (picked ? picked.displayPrice : "from " + r.variants[0].displayPrice)
    : (r.displayPrice || p.price);
  var priceRow = h("div", { style: "display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap" }, [
    h("b", { style: "font-size:15px", "data-bind": "retail.displayPrice" }, price),
    r.state === "price-changed" ? h("span", { "class": "shop-chip shop-chip--price", "data-bind": "retail.priceNote" }, "Price updated") : null,
    h("span", { "class": "code-chip", style: "margin-left:auto", "data-bind": "pim.products[].code" }, p.code)
  ]);
  card.appendChild(priceRow);

  if (!muted) {
    card.appendChild(h("div", { style: "margin-top:10px" }, ActionButton({
      variant: "btn--primary", label: "Add to bag", action: "cart.addItem", id: p.code, block: true,
      pending: phase === "pending", pendingLabel: "Adding\u2026",
      disabled: !canAdd, visualId: "shop-add-to-bag"
    })));
    if (r.state === "variant-required" && !picked) card.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:6px" }, "Pick a size first"));
    if (phase === "failed") card.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Not added \u2014 your bag is unchanged. Try again."));
    if (phase === "conflict") card.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Stock changed just now \u2014 nothing was added."));
  }
  return card;
}

export function SpaShop() {
  var open = spaRetailOpen();
  var page = h("section", { "class": "page", "data-route": "products", "data-state": state.view, "data-visual-id": "spa-shop", "data-module": "spa-shop", "data-retail": open ? "retail-commerce-open" : "browse-only", "data-capability": spaCapability(), "data-screen-label": open ? "Shop (sellable)" : "Shop (browse-only)" });

  var head = h("div", { "class": "section-head", style: "display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap" }, [
    h("div", { style: "flex:1;min-width:220px" }, [
      h("div", { style: "display:flex;align-items:center;gap:10px" }, [
        h("div", { "class": "section-head__title" }, "Spa shop"),
        open ? null : h("span", { "class": "readonly-chip", style: "margin-left:0" }, "Browse-only")
      ]),
      h("div", { "class": "section-head__sub" }, "Retail from the public catalog \u2014 the products our specialists use.")
    ]),
    open ? h("span", { "class": "link-action", "data-action": "cart.open", "data-visual-id": "shop-open-cart" }, "Your bag" + (spaCartCount() ? " \u00b7 " + spaCartCount() : "") + " \u203a")
         : h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "services" }, "Services & prices \u203a")
  ]);
  page.appendChild(head);

  var gate = routeStateBody({
    states: ["loading", "empty", "error"],
    skeleton: function () { return gridSkeleton("spa-shop-grid", 4, 150); },
    empty: { glyph: "\u25a1", title: "The shelf is empty right now", desc: "No retail products are published in the catalog at the moment \u2014 nothing is invented in the meantime." },
    error: { title: "Couldn\u2019t load the shelf", desc: "Retail products didn\u2019t load, so nothing stale is shown. Nothing was changed \u2014 try again.", retryId: "products" }
  });
  if (gate) { page.appendChild(gate); return page; }

  var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
  F.themes["Beauty"].products.forEach(function (p) {
    if (open) { grid.appendChild(sellableCard(p)); return; }
    grid.appendChild(h("div", { "class": "card card--pad spa-shop-card", "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": p.code }, [
      h("div", { style: "font-weight:700;font-size:14.5px;overflow-wrap:anywhere", "data-bind": "pim.products[].name" }, p.name),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:3px;line-height:1.45", "data-bind": "pim.products[].shortDescription" }, p.blurb),
      h("div", { style: "display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap" }, [
        h("b", { style: "font-size:15px", "data-bind": "pim.products[].displayPrice" }, p.price),
        h("span", { "class": "code-chip", style: "margin-left:auto", "data-bind": "pim.products[].code" }, p.code)
      ])
    ]));
  });
  page.appendChild(grid);
  page.appendChild(h("div", { "class": "catalog-note" }, open
    ? "Prices and stock come from the store at this moment. Adding something to your bag doesn\u2019t reserve it \u2014 availability and prices are confirmed at checkout."
    : "Prices as published in the public catalog. There\u2019s no cart or checkout here \u2014 nothing on this page starts a purchase."));
  return page;
}
