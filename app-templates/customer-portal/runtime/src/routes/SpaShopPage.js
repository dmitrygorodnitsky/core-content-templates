// Wave 17 accepted Calm Harbor Shop transfer. ProductModel grouping, card
// enrichment and the product-detail affordance are optional layers over the
// authoritative sellable product list; cart.addItem remains a separate action.
import { h } from "../dom.js";
import { cmdPhase, productDetailByCode, productItems, spaCapability, spaCartCount, spaModelsReady, spaProductModels, spaProductRef, spaRetailOpen, spaSellInfo, state } from "../state.js";
import { gridSkeleton, routeStateBody } from "../components/primitives/RouteStates.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

function pimByCode(code) { return productItems().find(function (product) { return product.code === code; }); }

function cardThumb(detail) {
  var media = detail && detail.media && detail.media[0];
  var thumb = h("div", { "class": "spa-shop-card__thumb", "data-state": media && media.url ? "ready" : "no-data", "aria-hidden": "true" });
  if (media && media.url) thumb.appendChild(h("img", { "class": "spa-shop-card__thumb-img", src: media.url, alt: "" }));
  return thumb;
}

function productCard(code, open) {
  var product = pimByCode(code);
  if (!product) return null;
  var detail = productDetailByCode(code);
  var ref = detail && detail.ref || spaProductRef(code);
  var retail = open ? spaSellInfo(code) : null;
  var pickedRef = state.spaVariantPick[code] || null;
  var picked = retail && retail.variants ? retail.variants.find(function (variant) { return variant.ref === pickedRef; }) : null;
  var phase = open ? cmdPhase("cart.addItem:" + code) : "idle";
  var canAdd = retail && (retail.state === "sellable" || retail.state === "price-changed" || (retail.state === "variant-required" && picked));
  var muted = retail && (retail.state === "out-of-stock" || retail.state === "unavailable");
  var card = h("div", { "class": "card spa-shop-card" + (muted ? " spa-shop-card--muted" : ""), "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": code, "data-product-ref": ref, "data-state": phase !== "idle" ? phase : retail ? retail.state : undefined });

  card.appendChild(h("button", { "class": "spa-shop-card__open", "data-action": "product.open", "data-id": ref, "data-product-ref": ref, "aria-label": "View " + product.name }, [
    cardThumb(detail),
    h("div", { "class": "spa-shop-card__id" }, [
      detail && detail.collection && spaModelsReady() ? h("div", { "class": "spa-shop-card__collection", "data-product-model-ref": detail.collection.ref, "data-bind": "product.collection.name" }, detail.collection.name) : null,
      h("div", { "class": "spa-shop-card__name", "data-bind": "pim.products[].name" }, product.name),
      h("div", { "class": "spa-shop-card__blurb", "data-bind": "pim.products[].shortDescription" }, product.blurb || product.description || "Published retail product"),
      detail && detail.variantFacts && detail.variantFacts.length ? h("div", { "class": "spa-shop-card__facts", "data-bind": "product.variantFacts[]" }, detail.variantFacts.map(function (fact) { return h("span", { "class": "fact-chip" }, fact.value); })) : null,
    ]),
  ]));

  var body = h("div", { "class": "spa-shop-card__buy" });
  if (open) {
    if (retail.state === "out-of-stock") body.appendChild(h("div", { "class": "shop-chip shop-chip--stock", "data-bind": "retail.state" }, "Out of stock"));
    else if (retail.state === "unavailable") body.appendChild(h("div", { "class": "shop-chip", "data-bind": "retail.state" }, retail.note || "Not sold online"));
    else if (retail.state === "variant-required") {
      var variants = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
      retail.variants.forEach(function (variant) {
        variants.appendChild(h("button", {
          "class": "shop-variant" + (pickedRef === variant.ref ? " shop-variant--on" : ""),
          "data-action": "shop.pickVariant", "data-id": code + "|" + variant.ref, "data-variant-ref": variant.ref,
          "data-state": pickedRef === variant.ref ? "active" : undefined,
        }, variant.label + " · " + variant.displayPrice));
      });
      body.appendChild(variants);
    }
  }

  var displayPrice = open
    ? retail.state === "variant-required" ? picked ? picked.displayPrice : "from " + retail.variants[0].displayPrice : retail.displayPrice || product.price
    : product.price;
  body.appendChild(h("div", { "class": "spa-shop-card__price" }, [
    h("b", { "data-bind": open ? "retail.displayPrice" : "pim.products[].displayPrice" }, displayPrice),
    open && retail.state === "price-changed" ? h("span", { "class": "shop-chip shop-chip--price", "data-bind": "retail.priceNote" }, "Price updated") : null,
    h("span", { "class": "code-chip", style: "margin-left:auto", "data-bind": "pim.products[].code" }, code),
  ]));

  if (open && !muted) {
    body.appendChild(h("div", { style: "margin-top:10px" }, ActionButton({
      variant: "btn--primary", label: "Add to bag", action: "cart.addItem", id: code, block: true,
      pending: phase === "pending", pendingLabel: "Adding…", disabled: !canAdd, visualId: "shop-add-to-bag",
    })));
    if (retail.state === "variant-required" && !picked) body.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:6px" }, "Pick a size first"));
    if (phase === "failed") body.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Not added — your bag is unchanged. Try again."));
    if (phase === "conflict") body.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Stock changed just now — nothing was added."));
  }
  card.appendChild(body);
  return card;
}

function productGrid(codes, open) {
  var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
  codes.forEach(function (code) {
    var card = productCard(code, open);
    if (card) grid.appendChild(card);
  });
  return grid;
}

function modelSection(model, open) {
  var codes = (model.productCodes || []).filter(pimByCode);
  var section = h("section", { "class": "product-model-section", "data-module": "product-model-section", "data-visual-id": "product-model-section", "data-product-model-ref": model.ref });
  var header = [];
  if (model.media) {
    var media = h("div", { "class": "pmodel-head__media", "data-state": model.media.url ? "ready" : "no-data", "aria-hidden": "true" });
    if (model.media.url) media.appendChild(h("img", { "class": "pmodel-head__img", src: model.media.url, alt: "" }));
    header.push(media);
  }
  header.push(h("div", { "class": "pmodel-head__body" }, [
    h("h2", { "class": "pmodel-head__name", "data-bind": "model.name" }, model.name),
    h("div", { "class": "pmodel-head__meta" }, [
      h("span", { "data-bind": "model.productCount" }, codes.length === 1 ? "1 product" : codes.length + " products"),
      model.variants && model.variants.length ? h("span", { "class": "pmodel-head__dims", "data-bind": "model.variants" }, "Varies by " + model.variants.join(", ")) : null,
    ]),
  ]));
  section.appendChild(h("div", { "class": "pmodel-head" }, header));
  section.appendChild(productGrid(codes, open));
  return section;
}

function othersSection(codes, open) {
  var section = h("section", { "class": "product-model-section product-model-section--others", "data-module": "product-model-section", "data-visual-id": "product-model-section-others" });
  section.appendChild(h("div", { "class": "pmodel-head" }, h("div", { "class": "pmodel-head__body" }, [
    h("h2", { "class": "pmodel-head__name" }, "Other products"),
    h("div", { "class": "pmodel-head__meta" }, h("span", null, codes.length === 1 ? "1 product" : codes.length + " products")),
  ])));
  section.appendChild(productGrid(codes, open));
  return section;
}

export function SpaShop() {
  var open = spaRetailOpen();
  var liveView = state.config.dataMode === "live" ? state.moduleStatus.products || "loading" : state.view;
  var page = h("section", { "class": "page", "data-route": "products", "data-state": liveView, "data-visual-id": "spa-shop", "data-module": "spa-shop", "data-retail": open ? "retail-commerce-open" : "browse-only", "data-capability": spaCapability(), "data-screen-label": open ? "Shop (sellable)" : "Shop (browse-only)" });
  page.appendChild(h("div", { "class": "section-head", style: "display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap" }, [
    h("div", { style: "flex:1;min-width:220px" }, [
      h("div", { style: "display:flex;align-items:center;gap:10px" }, [h("div", { "class": "section-head__title" }, "Spa shop"), open ? null : h("span", { "class": "readonly-chip", style: "margin-left:0" }, "Browse-only")]),
      h("div", { "class": "section-head__sub" }, "Retail from the public catalog — the products our specialists use."),
    ]),
    open ? h("span", { "class": "link-action", "data-action": "cart.open", "data-visual-id": "shop-open-cart" }, "Your bag" + (spaCartCount() ? " · " + spaCartCount() : "") + " ›") : h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "services" }, "Services & prices ›"),
  ]));

  var gate = routeStateBody({
    view: liveView, states: ["loading", "empty", "error"],
    skeleton: function () { return gridSkeleton("spa-shop-grid", 4, 220); },
    empty: { glyph: "□", title: "The shelf is empty right now", desc: "No retail products are published in the catalog at the moment — nothing is invented in the meantime." },
    error: { title: "Couldn’t load the shelf", desc: "Retail products didn’t load, so nothing stale is shown. Nothing was changed — try again.", retryId: "products" },
  });
  if (gate) { page.appendChild(gate); return page; }

  var codes = productItems().map(function (product) { return product.code; });
  if (spaModelsReady()) {
    var list = h("div", { "class": "product-model-list", "data-module": "product-model-list", "data-visual-id": "product-model-list", "data-state": "ready" });
    var claimed = {};
    spaProductModels().forEach(function (model) {
      model.productCodes.forEach(function (code) { claimed[code] = true; });
      list.appendChild(modelSection(model, open));
    });
    var others = codes.filter(function (code) { return !claimed[code]; });
    if (others.length) list.appendChild(othersSection(others, open));
    page.appendChild(list);
  } else {
    page.appendChild(h("div", { "class": "shop-models-note", "data-module": "product-model-list", "data-visual-id": "product-model-list", "data-state": "unavailable" }, "Collections couldn’t load right now — showing all products. Grouping will return automatically; nothing is grouped by guesswork."));
    page.appendChild(productGrid(codes, open));
  }
  page.appendChild(h("div", { "class": "catalog-note" }, open ? "Prices and stock come from the store at this moment. Adding something to your bag doesn’t reserve it — availability and prices are confirmed at checkout." : "Prices as published in the public catalog. There’s no cart or checkout here — nothing on this page starts a purchase."));
  return page;
}
