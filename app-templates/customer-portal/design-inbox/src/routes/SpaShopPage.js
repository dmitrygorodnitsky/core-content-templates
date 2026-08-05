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
// Wave 17 — OPTIONAL ProductModel grouping (state.spaModels): when the models
// enrichment is available the grid is grouped into product-model-section blocks
// (name · optional decorative model media · product count · the variant
// dimensions the model declares) plus a neutral "Other products" group for
// unmodeled products — a series is NEVER inferred from a product's code or name.
// When the enrichment is unavailable the accepted flat grid renders unchanged
// with an honest notice; the products stay sellable either way. Every card also
// carries product.open (opaque data-product-ref) to the product detail — a
// SEPARATE affordance from cart.addItem — and may show one primary image, its
// collection name and compact variant facts.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, spaCapability, spaCartCount, spaModelsReady, spaProductRef, spaRetailOpen, spaSellInfo, state } from "../state.js";
import { gridSkeleton, routeStateBody } from "../components/primitives/RouteStates.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

var CAT = F.spaCommerce.productCatalog;

function pimByCode(code) { return F.themes["Beauty"].products.find(function (p) { return p.code === code; }); }
function detByCode(code) { return CAT.byRef[CAT.codeToRef[code]] || null; }

/* the primary product image (media[0]) as a compact, DECORATIVE card thumbnail —
   the card's open button already announces the product name, and the detail
   gallery carries the descriptive alt text. Missing media -> striped slot. */
function cardThumb(det) {
  var m = det && det.media && det.media[0];
  var t = h("div", { "class": "spa-shop-card__thumb", "data-state": (m && m.url) ? "ready" : "no-data", "aria-hidden": "true" });
  if (m && m.url) t.appendChild(h("img", { "class": "spa-shop-card__thumb-img", src: m.url, alt: "" }));
  return t;
}

/* one shop card. `open` = retail-commerce-open (sellable). product.open is the
   card's open affordance (opaque ref); cart.addItem stays a SEPARATE command. */
function productCard(code, open) {
  var p = pimByCode(code);
  var det = detByCode(code);
  var ref = det ? det.ref : spaProductRef(code);
  var r = open ? spaSellInfo(code) : null;
  var pickedRef = state.spaVariantPick[code] || null;
  var picked = (r && r.variants) ? r.variants.find(function (v) { return v.ref === pickedRef; }) : null;
  var phase = open ? cmdPhase("cart.addItem:" + code) : "idle";
  var canAdd = r && (r.state === "sellable" || r.state === "price-changed" || (r.state === "variant-required" && picked));
  var muted = r && (r.state === "out-of-stock" || r.state === "unavailable");

  var card = h("div", { "class": "card spa-shop-card" + (muted ? " spa-shop-card--muted" : ""), "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": code, "data-product-ref": ref, "data-state": phase !== "idle" ? phase : (r ? r.state : undefined) });

  /* open affordance — media + identity open the product detail (product.open) */
  var openBtn = h("button", { "class": "spa-shop-card__open", "data-action": "product.open", "data-id": ref, "data-product-ref": ref, "aria-label": "View " + p.name }, [
    cardThumb(det),
    h("div", { "class": "spa-shop-card__id" }, [
      (det && det.collection && spaModelsReady()) ? h("div", { "class": "spa-shop-card__collection", "data-product-model-ref": det.collection.ref, "data-bind": "product.collection.name" }, det.collection.name) : null,
      h("div", { "class": "spa-shop-card__name", "data-bind": "pim.products[].name" }, p.name),
      h("div", { "class": "spa-shop-card__blurb", "data-bind": "pim.products[].shortDescription" }, p.blurb),
      (det && det.variantFacts && det.variantFacts.length)
        ? h("div", { "class": "spa-shop-card__facts", "data-bind": "product.variantFacts[]" }, det.variantFacts.map(function (f) { return h("span", { "class": "fact-chip" }, f.value); }))
        : null
    ])
  ]);
  card.appendChild(openBtn);

  var body = h("div", { "class": "spa-shop-card__buy" });

  if (open) {
    if (r.state === "out-of-stock") body.appendChild(h("div", { "class": "shop-chip shop-chip--stock", "data-bind": "retail.state" }, "Out of stock"));
    else if (r.state === "unavailable") body.appendChild(h("div", { "class": "shop-chip", "data-bind": "retail.state" }, r.note || "Not sold online"));
    else if (r.state === "variant-required") {
      var vRow = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
      r.variants.forEach(function (v) {
        vRow.appendChild(h("button", {
          "class": "shop-variant" + (pickedRef === v.ref ? " shop-variant--on" : ""),
          "data-action": "shop.pickVariant", "data-id": code + "|" + v.ref, "data-variant-ref": v.ref,
          "data-state": pickedRef === v.ref ? "active" : undefined
        }, v.label + " \u00b7 " + v.displayPrice));
      });
      body.appendChild(vRow);
    }
  }

  var price = open
    ? (r.state === "variant-required" ? (picked ? picked.displayPrice : "from " + r.variants[0].displayPrice) : (r.displayPrice || p.price))
    : p.price;
  body.appendChild(h("div", { "class": "spa-shop-card__price" }, [
    h("b", { "data-bind": open ? "retail.displayPrice" : "pim.products[].displayPrice" }, price),
    (open && r.state === "price-changed") ? h("span", { "class": "shop-chip shop-chip--price", "data-bind": "retail.priceNote" }, "Price updated") : null,
    h("span", { "class": "code-chip", style: "margin-left:auto", "data-bind": "pim.products[].code" }, code)
  ]));

  if (open && !muted) {
    body.appendChild(h("div", { style: "margin-top:10px" }, ActionButton({
      variant: "btn--primary", label: "Add to bag", action: "cart.addItem", id: code, block: true,
      pending: phase === "pending", pendingLabel: "Adding\u2026", disabled: !canAdd, visualId: "shop-add-to-bag"
    })));
    if (r.state === "variant-required" && !picked) body.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:6px" }, "Pick a size first"));
    if (phase === "failed") body.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Not added \u2014 your bag is unchanged. Try again."));
    if (phase === "conflict") body.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Stock changed just now \u2014 nothing was added."));
  }
  card.appendChild(body);
  return card;
}

/* one product-model-section: heading (name · optional decorative media · product
   count · declared variant dimensions) + the grid of its products. */
function modelSection(model, open) {
  var codes = model.productCodes.filter(pimByCode);
  var sec = h("section", { "class": "product-model-section", "data-module": "product-model-section", "data-visual-id": "product-model-section", "data-product-model-ref": model.ref });
  var headKids = [];
  /* model media is OPTIONAL and DECORATIVE (empty alt) */
  if (model.media) {
    var mh = h("div", { "class": "pmodel-head__media", "data-state": model.media.url ? "ready" : "no-data", "aria-hidden": "true" });
    if (model.media.url) mh.appendChild(h("img", { "class": "pmodel-head__img", src: model.media.url, alt: "" }));
    headKids.push(mh);
  }
  headKids.push(h("div", { "class": "pmodel-head__body" }, [
    h("h2", { "class": "pmodel-head__name", "data-bind": "model.name" }, model.name),
    h("div", { "class": "pmodel-head__meta" }, [
      h("span", { "data-bind": "model.productCount" }, codes.length === 1 ? "1 product" : codes.length + " products"),
      (model.variants && model.variants.length) ? h("span", { "class": "pmodel-head__dims", "data-bind": "model.variants" }, "Varies by " + model.variants.join(", ")) : null
    ])
  ]));
  sec.appendChild(h("div", { "class": "pmodel-head" }, headKids));
  var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
  codes.forEach(function (c) { grid.appendChild(productCard(c, open)); });
  sec.appendChild(grid);
  return sec;
}

/* neutral "Other products" group — unmodeled products, no inferred series
   (no variant dimensions, no model media). */
function othersSection(codes, open) {
  var sec = h("section", { "class": "product-model-section product-model-section--others", "data-module": "product-model-section", "data-visual-id": "product-model-section-others" });
  sec.appendChild(h("div", { "class": "pmodel-head" }, h("div", { "class": "pmodel-head__body" }, [
    h("h2", { "class": "pmodel-head__name" }, CAT.othersLabel),
    h("div", { "class": "pmodel-head__meta" }, h("span", null, codes.length === 1 ? "1 product" : codes.length + " products"))
  ])));
  var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
  codes.forEach(function (c) { grid.appendChild(productCard(c, open)); });
  sec.appendChild(grid);
  return sec;
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
    skeleton: function () { return gridSkeleton("spa-shop-grid", 4, 220); },
    empty: { glyph: "\u25a1", title: "The shelf is empty right now", desc: "No retail products are published in the catalog at the moment \u2014 nothing is invented in the meantime." },
    error: { title: "Couldn\u2019t load the shelf", desc: "Retail products didn\u2019t load, so nothing stale is shown. Nothing was changed \u2014 try again.", retryId: "products" }
  });
  if (gate) { page.appendChild(gate); return page; }

  var allCodes = F.themes["Beauty"].products.map(function (p) { return p.code; });

  if (spaModelsReady()) {
    /* GROUPED — one section per ProductModel, then unmodeled products */
    var list = h("div", { "class": "product-model-list", "data-module": "product-model-list", "data-visual-id": "product-model-list" });
    var claimed = {};
    CAT.models.forEach(function (m) {
      m.productCodes.forEach(function (c) { claimed[c] = true; });
      list.appendChild(modelSection(m, open));
    });
    var others = allCodes.filter(function (c) { return !claimed[c]; });
    if (others.length) list.appendChild(othersSection(others, open));
    page.appendChild(list);
  } else {
    /* models enrichment UNAVAILABLE — accepted flat grid + honest notice; the
       products stay sellable, and no series is guessed */
    page.appendChild(h("div", { "class": "shop-models-note", "data-module": "product-model-list", "data-visual-id": "product-model-list", "data-state": "unavailable" }, "Collections couldn\u2019t load right now \u2014 showing all products. Grouping will return automatically; nothing is grouped by guesswork."));
    var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
    allCodes.forEach(function (c) { grid.appendChild(productCard(c, open)); });
    page.appendChild(grid);
  }

  page.appendChild(h("div", { "class": "catalog-note" }, open
    ? "Prices and stock come from the store at this moment. Adding something to your bag doesn\u2019t reserve it \u2014 availability and prices are confirmed at checkout."
    : "Prices as published in the public catalog. There\u2019s no cart or checkout here \u2014 nothing on this page starts a purchase."));
  return page;
}
