// customer-portal/runtime/src/routes/ProductsPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { currentTheme, productItems, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { skeletonRow } from "../components/primitives/LoadingState.js";
import { ProductCard } from "../components/commerce/ProductCard.js";

export function Products() {
  var v = currentTheme();
  var products = state.moduleData.products || {};
  var liveProducts = products.source === "core-pim";
  var page = h("section", { "class": "page", "data-route": "products", "data-visual-id": "products" });
  page.appendChild(h("div", { "class": "featured-banner", "data-module": "featured-banner", "data-visual-id": "featured-banner" }, [
    h("div", { style: "flex:1" }, [
      h("span", { "class": "eyebrow", "data-bind": liveProducts ? "pim.catalog" : "feat.badge" }, liveProducts ? "Core PIM catalog" : v.feat.badge),
      h("h1", { "data-bind": liveProducts ? "pim.product.name" : "feat.title" }, liveProducts ? "Live catalog products" : v.feat.title),
      h("p", { "data-bind": liveProducts ? "pim.product.description" : "feat.desc" }, liveProducts ? "Products and purchasable plans are loaded from Core PIM." : v.feat.desc),
      h("div", { style: "display:flex;gap:11px;align-items:center" }, [
        ActionButton({ variant: "btn--ghost", label: liveProducts ? "Contact support" : v.feat.cta, action: liveProducts ? "support.open" : "booking.open", lg: true, visualId: "featured-cta" }),
        h("div", { style: "font-size:13px;color:rgba(255,255,255,.8)", "data-bind": "feat.fin" }, liveProducts ? "Live mode" : v.feat.fin)
      ])
    ]),
    h("div", { "class": "featured-banner__art" }, h("div", { style: "width:120px;height:56px;border-radius:12px;background:var(--surface);box-shadow:0 4px 14px rgba(var(--hair),.12)" }))
  ]));

  var cats = liveProducts ? [{ key: "all", label: "All" }] : [{ key: "all", label: "All" }].concat(v.cats);
  page.appendChild(h("div", { "class": "shop-head" }, [
    h("div", { "class": "shop-head__title" }, "Shop"),
    h("div", { "class": "tabs", "data-module": "filter-bar" }, cats.map(function (c) {
      return h("span", { "class": "tab" + (c.key === state.prodCat ? " tab--active" : ""), "data-action": "products.filter", "data-id": c.key }, c.label);
    }))
  ]));

  if (state.view === "loading") {
    var loading = h("div", { "class": "product-grid", "data-module": "product-list", "data-state": "loading" });
    for (var index = 0; index < 4; index++) loading.appendChild(skeletonRow());
    page.appendChild(loading);
    return page;
  }

  var list = productItems();
  if (!liveProducts && state.prodCat !== "all") list = list.filter(function (p) { return p.cat === state.prodCat; });
  if (state.view === "empty" || list.length === 0) {
    page.appendChild(EmptyState({ glyph: "\ud83d\udce6", title: "Nothing here yet", desc: "No products in this category. Try another filter." }));
    return page;
  }
  page.appendChild(h("div", { "class": "product-grid", "data-module": "product-list" }, list.map(function (p) {
    var ci = liveProducts ? 0 : Math.max(0, v.cats.findIndex(function (c) { return c.key === p.cat; }));
    return ProductCard(p, ci);
  })));
  return page;
}

/* CartRow */
