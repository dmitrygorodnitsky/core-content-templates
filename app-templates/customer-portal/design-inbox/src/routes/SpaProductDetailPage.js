// customer-portal-design/src/routes/SpaProductDetailPage.js — Wave 17:
// Calm Harbor product detail (route product.detail, Beauty only). Opened from
// the Shop via product.open with an OPAQUE product ref (never an authored id or
// PIM code). Required composition: back to Shop, product name, current display
// price, description, media gallery, source-provided variant facts, collection
// link, add-to-bag, and published reviews.
//
// Truth rules:
// - The primary image and thumbnails come from product.media[] in EXPLICIT
//   backend order. No image is duplicated to pad the gallery. One image renders
//   a deliberate single-image composition; zero images renders the accepted
//   no-media state. The selected gallery image is presentation state only
//   (state.spaGallery) and never changes the product or cart identity.
// - Models / reviews / media are OPTIONAL enrichments. If the product loads but
//   an enrichment fails, the sellable product stays; only the affected region
//   shows its honest unavailable / empty / error treatment.
// - Reviews render ONLY the PUBLISHED set already resolved by the backend; the
//   page shows the count of the VISIBLE loaded set and claims no aggregate score.
//   No Review / Product / User / Account / workflow id or raw attribute is shown.
// - Add-to-bag is the SEPARATE cart.addItem command (row-scoped lifecycle) and
//   exists only under retail-commerce-open; adding never reserves stock.
// - A ref that is not in the catalog gets ONE non-enumerating not-found.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, currentProduct, productReviews, spaCapability, spaModelsReady, spaRetailOpen, spaSellInfo, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { NotFoundState, routeStateBody, skel } from "../components/primitives/RouteStates.js";

/* one media frame — a real public/approved image when media.url is supplied,
   otherwise the accepted striped media slot carrying the backend alt text.
   A raw Media id is NEVER used as an image URL. */
function mediaFrame(m, cls) {
  var wrap = h("div", { "class": "pd-media " + (cls || ""), "data-media-ref": m ? m.ref : undefined, "data-state": (m && m.url) ? "ready" : "no-data" });
  if (m && m.url) {
    var img = h("img", { "class": "pd-media__img", src: m.url, alt: m.alt || "", loading: "lazy" });
    img.addEventListener("error", function () {
      wrap.setAttribute("data-state", "no-data");
      if (img.parentNode) wrap.removeChild(img);
      wrap.appendChild(h("span", { "class": "pd-media__label" }, m.alt || "product image"));
    });
    wrap.appendChild(img);
  } else {
    wrap.appendChild(h("span", { "class": "pd-media__label" }, (m && m.alt) ? m.alt : "product image"));
  }
  return wrap;
}

/* media gallery: primary + keyboard-reachable thumbnails.
   0 images -> accepted no-media state · 1 image -> single composition. */
function gallery(p) {
  var media = p.media || [];
  var g = h("div", { "class": "product-gallery", "data-module": "product-gallery", "data-visual-id": "product-gallery" });

  if (!media.length) {
    g.appendChild(h("div", { "class": "pd-media pd-media--empty", "data-visual-id": "product-gallery-primary", "data-state": "no-media" }, [
      h("div", { "class": "pd-media__glyph", "aria-hidden": "true" }, "\u25a1"),
      h("div", { "class": "pd-media__empty-title" }, "No product photos yet"),
      h("div", { "class": "pd-media__empty-desc" }, "Photos appear here once the studio adds them \u2014 we don\u2019t show a stand-in image in the meantime.")
    ]));
    return g;
  }

  var sel = Math.min(state.spaGallery || 0, media.length - 1);
  var primary = mediaFrame(media[sel], "pd-media--primary");
  primary.setAttribute("data-visual-id", "product-gallery-primary");
  g.appendChild(primary);

  if (media.length > 1) {
    var thumbs = h("div", { "class": "product-gallery__thumbs", role: "group", "aria-label": "Product images" });
    media.forEach(function (m, i) {
      var on = i === sel;
      var t = h("button", {
        "class": "product-gallery-thumb" + (on ? " product-gallery-thumb--on" : ""),
        "data-module": "product-gallery-thumb", "data-visual-id": "product-gallery-thumb",
        "data-action": "product.gallerySelect", "data-id": String(i), "data-media-ref": m.ref,
        "data-state": on ? "active" : undefined, "aria-current": on ? "true" : undefined,
        "aria-label": "Show image " + (i + 1) + " of " + media.length + (m.alt ? ": " + m.alt : "")
      }, mediaFrame(m, "pd-media--thumb"));
      thumbs.appendChild(t);
    });
    g.appendChild(thumbs);
  } else {
    g.appendChild(h("div", { "class": "pd-media__single-note" }, "One photo provided for this product."));
  }
  return g;
}

/* accessible star rating: role=img with a textual label ("5 out of 5"); the
   glyphs themselves are decorative. */
function stars(rating) {
  var full = Math.max(0, Math.min(5, rating | 0));
  return h("span", { "class": "pd-stars", role: "img", "aria-label": full + " out of 5" }, [
    h("span", { "class": "pd-stars__on", "aria-hidden": "true" }, "\u2605\u2605\u2605\u2605\u2605".slice(0, full)),
    h("span", { "class": "pd-stars__off", "aria-hidden": "true" }, "\u2605\u2605\u2605\u2605\u2605".slice(full))
  ]);
}

function reviewCard(r) {
  var foot = [h("span", { "class": "pd-review__author", "data-bind": "review.authorName" }, r.authorName)];
  /* verified renders "Verified purchase" ONLY when the backend flag is true */
  if (r.verified) foot.push(h("span", { "class": "pd-review__verified", "data-bind": "review.verified" }, [h("i", { "aria-hidden": "true" }, "\u2713"), "Verified purchase"]));
  if (r.publishedAt) foot.push(h("span", { "class": "pd-review__date", "data-bind": "review.publishedAt" }, r.publishedAt));
  return h("div", { "class": "product-review-card", "data-module": "product-review-card", "data-visual-id": "product-review-card", "data-review-ref": r.ref }, [
    h("div", { "class": "pd-review__head" }, [
      stars(r.rating),
      r.title ? h("div", { "class": "pd-review__title", "data-bind": "review.title" }, r.title) : null
    ]),
    h("p", { "class": "pd-review__body", "data-bind": "review.body" }, r.body),
    h("div", { "class": "pd-review__foot" }, foot)
  ]);
}

/* reviews region — INDEPENDENT of the route lifecycle: it can be loading /
   unavailable / error while the product itself is fully sellable. */
function reviewsRegion(p) {
  var rv = state.spaReviews;
  var list = productReviews(p.ref);
  var panel = h("div", { "class": "list-panel product-review-list", "data-module": "product-review-list", "data-visual-id": "product-review-list", "data-product-ref": p.ref, "data-state": rv });

  var head = h("div", { "class": "list-panel__head" }, [
    h("div", { "class": "list-panel__title", style: "flex:1" }, "Reviews"),
    (rv === "ready" && list.length) ? h("span", { "class": "pd-review__count", "data-bind": "reviews.loadedCount" }, list.length === 1 ? "1 published review" : list.length + " published reviews") : null
  ]);
  panel.appendChild(head);

  if (rv === "loading") {
    var sk = h("div", { "data-state": "loading", "aria-busy": "true" });
    sk.appendChild(skel("height:64px;border-radius:14px"));
    sk.appendChild(skel("height:64px;border-radius:14px;margin-top:10px"));
    panel.appendChild(sk);
    return panel;
  }
  if (rv === "unavailable") {
    panel.appendChild(h("div", { "class": "pd-region-state", "data-state": "unavailable" }, [
      h("div", { "class": "pd-region-state__title" }, "Reviews aren\u2019t available right now"),
      h("div", { "class": "pd-region-state__desc" }, "We couldn\u2019t load reviews for this product \u2014 this doesn\u2019t affect anything else on the page. You can still see the product and add it to your bag.")
    ]));
    return panel;
  }
  if (rv === "error") {
    panel.appendChild(h("div", { "class": "pd-region-state", "data-state": "error" }, [
      h("div", { "class": "pd-region-state__title" }, "Couldn\u2019t load reviews"),
      h("div", { "class": "pd-region-state__desc" }, "Reviews didn\u2019t load, so nothing is shown here \u2014 we never show stale or guessed reviews. The rest of the page is fine."),
      h("div", { style: "margin-top:12px" }, ActionButton({ variant: "btn--ghost", label: "Try again", action: "ui.retry", id: "product-reviews", visualId: "pd-reviews-retry" }))
    ]));
    return panel;
  }
  if (rv === "empty" || !list.length) {
    panel.appendChild(h("div", { "class": "pd-region-state", "data-state": "empty" }, [
      h("div", { "class": "pd-region-state__title" }, "No reviews yet"),
      h("div", { "class": "pd-region-state__desc" }, "This product doesn\u2019t have any published reviews yet.")
    ]));
    return panel;
  }

  /* honest count of the VISIBLE loaded set — never an aggregate score */
  panel.appendChild(h("div", { "class": "pd-review__scope" }, "Showing every published review for this product. We don\u2019t show an average score."));
  list.forEach(function (r) { panel.appendChild(reviewCard(r)); });
  return panel;
}

/* the buy region — SERVER sellability + the SEPARATE add-to-bag command.
   Renders only under retail-commerce-open; browse-only shows the honest note. */
function buyRegion(p) {
  var open = spaRetailOpen();
  var wrap = h("div", { "class": "pd-buy" });

  if (!open) {
    wrap.appendChild(h("div", { "class": "pd-price" }, [h("b", { "data-bind": "product.displayPrice" }, p.displayPrice), h("span", { "class": "code-chip", "data-bind": "pim.products[].code" }, p.code)]));
    wrap.appendChild(h("div", { "class": "pd-buy__note", "data-state": "browse-only" }, "This is a browse-only catalogue \u2014 there\u2019s no cart or checkout here. Nothing on this page starts a purchase."));
    return wrap;
  }

  var r = spaSellInfo(p.code);
  var pickedRef = state.spaVariantPick[p.code] || null;
  var picked = r.variants ? r.variants.find(function (v) { return v.ref === pickedRef; }) : null;
  var phase = cmdPhase("cart.addItem:" + p.code);
  var canAdd = r.state === "sellable" || r.state === "price-changed" || (r.state === "variant-required" && picked);
  var muted = r.state === "out-of-stock" || r.state === "unavailable";

  var price = r.state === "variant-required"
    ? (picked ? picked.displayPrice : "from " + r.variants[0].displayPrice)
    : (r.displayPrice || p.displayPrice);
  wrap.appendChild(h("div", { "class": "pd-price" }, [
    h("b", { "data-bind": "retail.displayPrice" }, price),
    r.state === "price-changed" ? h("span", { "class": "shop-chip shop-chip--price", "data-bind": "retail.priceNote" }, "Price updated") : null,
    h("span", { "class": "code-chip", "data-bind": "pim.products[].code" }, p.code)
  ]));

  if (r.state === "out-of-stock") wrap.appendChild(h("div", { "class": "shop-chip shop-chip--stock", "data-bind": "retail.state" }, "Out of stock"));
  else if (r.state === "unavailable") wrap.appendChild(h("div", { "class": "shop-chip", "data-bind": "retail.state" }, r.note || "Not sold online"));
  else if (r.state === "variant-required") {
    var vRow = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
    r.variants.forEach(function (v) {
      vRow.appendChild(h("button", {
        "class": "shop-variant" + (pickedRef === v.ref ? " shop-variant--on" : ""),
        "data-action": "shop.pickVariant", "data-id": p.code + "|" + v.ref, "data-variant-ref": v.ref,
        "data-state": pickedRef === v.ref ? "active" : undefined
      }, v.label + " \u00b7 " + v.displayPrice));
    });
    wrap.appendChild(vRow);
  }

  if (!muted) {
    wrap.appendChild(h("div", { style: "margin-top:12px" }, ActionButton({
      variant: "btn--primary", label: "Add to bag", action: "cart.addItem", id: p.code, block: true, lg: true,
      pending: phase === "pending", pendingLabel: "Adding\u2026", disabled: !canAdd, visualId: "pd-add-to-bag"
    })));
    if (r.state === "variant-required" && !picked) wrap.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:6px" }, "Pick a size first"));
    if (phase === "failed") wrap.appendChild(h("div", { "class": "cart-row__note", role: "alert", style: "margin-top:8px" }, "Not added \u2014 your bag is unchanged. Try again."));
    if (phase === "conflict") wrap.appendChild(h("div", { "class": "cart-row__note", role: "alert", style: "margin-top:8px" }, "Stock changed just now \u2014 nothing was added."));
  }
  wrap.appendChild(h("div", { "class": "pd-buy__note" }, "Adding something to your bag doesn\u2019t reserve it \u2014 availability and prices are confirmed at checkout."));
  return wrap;
}

export function SpaProductDetail() {
  var p = currentProduct();
  var open = spaRetailOpen();
  var page = h("section", { "class": "page page--narrow", "data-route": "product.detail", "data-state": state.view, "data-visual-id": "product-detail", "data-module": "product-detail", "data-capability": spaCapability(), "data-retail": open ? "retail-commerce-open" : "browse-only", "data-product-ref": p ? p.ref : undefined, "data-screen-label": "Product detail" });
  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "nav.products", "data-visual-id": "pd-back" }, "\u2039 Shop")));

  /* route lifecycle — nothing product-owned renders through these gates */
  var gate = routeStateBody({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      return h("div", { "class": "pd-grid", "data-state": "loading", "aria-busy": "true" }, [
        skel("height:340px;border-radius:22px"),
        h("div", null, [skel("height:26px;border-radius:9px"), skel("height:80px;border-radius:12px;margin-top:12px"), skel("height:48px;border-radius:14px;margin-top:16px")])
      ]);
    },
    error: { title: "Couldn\u2019t load this product", desc: "The product didn\u2019t load, so nothing is shown \u2014 we never show a stale or guessed product. Nothing was changed; try again.", retryId: "product.detail" },
    scope: "this product", backRoute: "products"
  });
  if (gate) { page.appendChild(gate); return page; }

  /* ONE non-enumerating not-found: unknown, removed and foreign refs look identical */
  if (!p || state.view === "not-found") {
    page.appendChild(NotFoundState({ noun: "product", backLabel: "shop", backRoute: "products" }));
    return page;
  }

  var showCollection = p.collection && spaModelsReady();

  var info = h("div", { "class": "pd-info" }, [
    showCollection
      ? h("div", { "class": "pd-collection", "data-product-model-ref": p.collection.ref }, [
          h("span", { "class": "pd-collection__label" }, "Collection"),
          h("span", { "class": "link-action pd-collection__link", "data-action": "nav.products", "data-visual-id": "pd-collection-link", "data-bind": "product.collection.name" }, p.collection.name + " \u203a")
        ])
      : null,
    h("h1", { "class": "pd-name", "data-bind": "product.name" }, p.name),
    h("p", { "class": "pd-desc", "data-bind": "product.description" }, p.description)
  ]);

  /* source-provided variant facts (compact) — never inferred */
  if (p.variantFacts && p.variantFacts.length) {
    var facts = h("dl", { "class": "pd-facts", "data-visual-id": "product-facts" });
    p.variantFacts.forEach(function (f) {
      facts.appendChild(h("div", { "class": "pd-facts__row" }, [
        h("dt", { "class": "pd-facts__label" }, f.label),
        h("dd", { "class": "pd-facts__val", "data-bind": "product.variantFacts[]" }, f.value)
      ]));
    });
    info.appendChild(facts);
  }

  info.appendChild(buyRegion(p));

  var hero = h("div", { "class": "card card--pad pd-hero" }, [
    h("div", { "class": "pd-grid" }, [gallery(p), info])
  ]);
  page.appendChild(hero);

  page.appendChild(reviewsRegion(p));

  page.appendChild(h("div", { "class": "catalog-note" }, "Photos, prices and reviews are shown exactly as provided by the studio \u2014 this page never invents an image, a rating average or a review."));
  return page;
}
