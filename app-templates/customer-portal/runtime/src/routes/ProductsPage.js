// customer-portal/runtime/src/routes/ProductsPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ProductCard } from "../components/commerce/ProductCard.js";
import { CartRow } from "../components/commerce/CartRow.js";

export function Products() {
  var v = F.themes[state.theme];
  var page = h("section", { "class": "page", "data-route": "products", "data-visual-id": "products" });
  page.appendChild(h("div", { "class": "featured-banner", "data-module": "featured-banner", "data-visual-id": "featured-banner" }, [
    h("div", { style: "flex:1" }, [
      h("span", { "class": "eyebrow", "data-bind": "feat.badge" }, v.feat.badge),
      h("h1", { "data-bind": "feat.title" }, v.feat.title),
      h("p", { "data-bind": "feat.desc" }, v.feat.desc),
      h("div", { style: "display:flex;gap:11px;align-items:center" }, [
        ActionButton({ variant: "btn--ghost", label: v.feat.cta, action: "booking.open", lg: true, visualId: "featured-cta" }),
        h("div", { style: "font-size:13px;color:rgba(255,255,255,.8)", "data-bind": "feat.fin" }, v.feat.fin)
      ])
    ]),
    h("div", { "class": "featured-banner__art" }, h("div", { style: "width:120px;height:56px;border-radius:12px;background:var(--surface);box-shadow:0 4px 14px rgba(var(--hair),.12)" }))
  ]));

  var cats = [{ key: "all", label: "All" }].concat(v.cats);
  page.appendChild(h("div", { "class": "shop-head" }, [
    h("div", { "class": "shop-head__title" }, "Shop"),
    h("div", { "class": "tabs", "data-module": "filter-bar" }, cats.map(function (c) {
      return h("span", { "class": "tab" + (c.key === state.prodCat ? " tab--active" : ""), "data-action": "products.filter", "data-id": c.key }, c.label);
    }))
  ]));

  var list = state.prodCat === "all" ? v.products : v.products.filter(function (p) { return p.cat === state.prodCat; });
  if (state.view === "empty" || list.length === 0) {
    page.appendChild(EmptyState({ glyph: "\ud83d\udce6", title: "Nothing here yet", desc: "No products in this category. Try another filter." }));
    return page;
  }
  page.appendChild(h("div", { "class": "product-grid", "data-module": "product-list" }, list.map(function (p) {
    var ci = Math.max(0, v.cats.findIndex(function (c) { return c.key === p.cat; }));
    return ProductCard(p, ci);
  })));
  return page;
}

/* CartRow */
