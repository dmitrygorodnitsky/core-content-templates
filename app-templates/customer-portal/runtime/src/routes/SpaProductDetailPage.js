// Wave 17 accepted Calm Harbor product detail. The sellable product remains
// authoritative even when optional model, media or review enrichments fail.
import { h } from "../dom.js";
import { cmdPhase, currentProduct, productReviews, spaCapability, spaModelsReady, spaRetailOpen, spaReviewsState, spaSellInfo, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { NotFoundState, routeStateBody, skel } from "../components/primitives/RouteStates.js";

function mediaFrame(media, cls) {
  var wrap = h("div", { "class": "pd-media " + (cls || ""), "data-media-ref": media ? media.ref : undefined, "data-state": media && media.url ? "ready" : "no-data" });
  if (media && media.url) {
    var image = h("img", { "class": "pd-media__img", src: media.url, alt: media.alt || "", loading: "lazy" });
    image.addEventListener("error", function () {
      wrap.setAttribute("data-state", "no-data");
      if (image.parentNode) wrap.removeChild(image);
      wrap.appendChild(h("span", { "class": "pd-media__label" }, media.alt || "product image"));
    });
    wrap.appendChild(image);
  } else {
    wrap.appendChild(h("span", { "class": "pd-media__label" }, media && media.alt ? media.alt : "product image"));
  }
  return wrap;
}

function gallery(product) {
  var media = product.media || [];
  var root = h("div", { "class": "product-gallery", "data-module": "product-gallery", "data-visual-id": "product-gallery" });
  if (!media.length) {
    root.appendChild(h("div", { "class": "pd-media pd-media--empty", "data-visual-id": "product-gallery-primary", "data-state": "no-media" }, [
      h("div", { "class": "pd-media__glyph", "aria-hidden": "true" }, "□"),
      h("div", { "class": "pd-media__empty-title" }, "No product photos yet"),
      h("div", { "class": "pd-media__empty-desc" }, "Photos appear here once the studio adds them — we don’t show a stand-in image in the meantime."),
    ]));
    return root;
  }
  var selected = Math.min(state.spaGallery || 0, media.length - 1);
  var primary = mediaFrame(media[selected], "pd-media--primary");
  primary.setAttribute("data-visual-id", "product-gallery-primary");
  root.appendChild(primary);
  if (media.length > 1) {
    var thumbs = h("div", { "class": "product-gallery__thumbs", role: "group", "aria-label": "Product images" });
    media.forEach(function (item, index) {
      var active = index === selected;
      thumbs.appendChild(h("button", {
        "class": "product-gallery-thumb" + (active ? " product-gallery-thumb--on" : ""),
        "data-module": "product-gallery-thumb", "data-visual-id": "product-gallery-thumb",
        "data-action": "product.gallerySelect", "data-id": String(index), "data-media-ref": item.ref,
        "data-state": active ? "active" : undefined, "aria-current": active ? "true" : undefined,
        "aria-label": "Show image " + (index + 1) + " of " + media.length + (item.alt ? ": " + item.alt : ""),
      }, mediaFrame(item, "pd-media--thumb")));
    });
    root.appendChild(thumbs);
  } else {
    root.appendChild(h("div", { "class": "pd-media__single-note" }, "One photo provided for this product."));
  }
  return root;
}

function stars(rating) {
  var full = Math.max(0, Math.min(5, rating | 0));
  return h("span", { "class": "pd-stars", role: "img", "aria-label": full + " out of 5" }, [
    h("span", { "class": "pd-stars__on", "aria-hidden": "true" }, "★★★★★".slice(0, full)),
    h("span", { "class": "pd-stars__off", "aria-hidden": "true" }, "★★★★★".slice(full)),
  ]);
}

function reviewCard(review) {
  var footer = [h("span", { "class": "pd-review__author", "data-bind": "review.authorName" }, review.authorName)];
  if (review.verified) footer.push(h("span", { "class": "pd-review__verified", "data-bind": "review.verified" }, [h("i", { "aria-hidden": "true" }, "✓"), "Verified purchase"]));
  if (review.publishedAt) footer.push(h("span", { "class": "pd-review__date", "data-bind": "review.publishedAt" }, review.publishedAt));
  return h("div", { "class": "product-review-card", "data-module": "product-review-card", "data-visual-id": "product-review-card", "data-review-ref": review.ref }, [
    h("div", { "class": "pd-review__head" }, [stars(review.rating), review.title ? h("div", { "class": "pd-review__title", "data-bind": "review.title" }, review.title) : null]),
    h("p", { "class": "pd-review__body", "data-bind": "review.body" }, review.body),
    h("div", { "class": "pd-review__foot" }, footer),
  ]);
}

function reviewsRegion(product) {
  var view = spaReviewsState();
  var reviews = productReviews(product.ref);
  var panel = h("div", { "class": "list-panel product-review-list", "data-module": "product-review-list", "data-visual-id": "product-review-list", "data-product-ref": product.ref, "data-state": view });
  panel.appendChild(h("div", { "class": "list-panel__head" }, [
    h("div", { "class": "list-panel__title", style: "flex:1" }, "Reviews"),
    view === "ready" && reviews.length ? h("span", { "class": "pd-review__count", "data-bind": "reviews.loadedCount" }, reviews.length === 1 ? "1 published review" : reviews.length + " published reviews") : null,
  ]));
  if (view === "loading") {
    panel.appendChild(h("div", { "data-state": "loading", "aria-busy": "true" }, [skel("height:64px;border-radius:14px"), skel("height:64px;border-radius:14px;margin-top:10px")]));
    return panel;
  }
  if (view === "unavailable") {
    panel.appendChild(h("div", { "class": "pd-region-state", "data-state": "unavailable" }, [
      h("div", { "class": "pd-region-state__title" }, "Reviews aren’t available right now"),
      h("div", { "class": "pd-region-state__desc" }, "We couldn’t load reviews for this product — this doesn’t affect anything else on the page. You can still see the product and add it to your bag."),
    ]));
    return panel;
  }
  if (view === "error") {
    panel.appendChild(h("div", { "class": "pd-region-state", "data-state": "error" }, [
      h("div", { "class": "pd-region-state__title" }, "Couldn’t load reviews"),
      h("div", { "class": "pd-region-state__desc" }, "Reviews didn’t load, so nothing is shown here — we never show stale or guessed reviews. The rest of the page is fine."),
      h("div", { style: "margin-top:12px" }, ActionButton({ variant: "btn--ghost", label: "Try again", action: "ui.retry", id: "product-reviews", visualId: "pd-reviews-retry" })),
    ]));
    return panel;
  }
  if (view === "empty" || !reviews.length) {
    panel.appendChild(h("div", { "class": "pd-region-state", "data-state": "empty" }, [
      h("div", { "class": "pd-region-state__title" }, "No reviews yet"),
      h("div", { "class": "pd-region-state__desc" }, "This product doesn’t have any published reviews yet."),
    ]));
    return panel;
  }
  panel.appendChild(h("div", { "class": "pd-review__scope" }, "Showing every published review for this product. We don’t show an average score."));
  reviews.forEach(function (review) { panel.appendChild(reviewCard(review)); });
  return panel;
}

function buyRegion(product) {
  var open = spaRetailOpen();
  var root = h("div", { "class": "pd-buy" });
  if (!open) {
    root.appendChild(h("div", { "class": "pd-price" }, [h("b", { "data-bind": "product.displayPrice" }, product.displayPrice), h("span", { "class": "code-chip", "data-bind": "pim.products[].code" }, product.code)]));
    root.appendChild(h("div", { "class": "pd-buy__note", "data-state": "browse-only" }, "This is a browse-only catalogue — there’s no cart or checkout here. Nothing on this page starts a purchase."));
    return root;
  }
  var retail = spaSellInfo(product.code);
  var pickedRef = state.spaVariantPick[product.code] || null;
  var picked = retail.variants ? retail.variants.find(function (variant) { return variant.ref === pickedRef; }) : null;
  var phase = cmdPhase("cart.addItem:" + product.code);
  var canAdd = retail.state === "sellable" || retail.state === "price-changed" || retail.state === "variant-required" && picked;
  var muted = retail.state === "out-of-stock" || retail.state === "unavailable";
  var displayPrice = retail.state === "variant-required" ? picked ? picked.displayPrice : "from " + retail.variants[0].displayPrice : retail.displayPrice || product.displayPrice;
  root.appendChild(h("div", { "class": "pd-price" }, [
    h("b", { "data-bind": "retail.displayPrice" }, displayPrice),
    retail.state === "price-changed" ? h("span", { "class": "shop-chip shop-chip--price", "data-bind": "retail.priceNote" }, "Price updated") : null,
    h("span", { "class": "code-chip", "data-bind": "pim.products[].code" }, product.code),
  ]));
  if (retail.state === "out-of-stock") root.appendChild(h("div", { "class": "shop-chip shop-chip--stock", "data-bind": "retail.state" }, "Out of stock"));
  else if (retail.state === "unavailable") root.appendChild(h("div", { "class": "shop-chip", "data-bind": "retail.state" }, retail.note || "Not sold online"));
  else if (retail.state === "variant-required") {
    var variants = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
    retail.variants.forEach(function (variant) {
      variants.appendChild(h("button", { "class": "shop-variant" + (pickedRef === variant.ref ? " shop-variant--on" : ""), "data-action": "shop.pickVariant", "data-id": product.code + "|" + variant.ref, "data-variant-ref": variant.ref, "data-state": pickedRef === variant.ref ? "active" : undefined }, variant.label + " · " + variant.displayPrice));
    });
    root.appendChild(variants);
  }
  if (!muted) {
    root.appendChild(h("div", { style: "margin-top:12px" }, ActionButton({ variant: "btn--primary", label: "Add to bag", action: "cart.addItem", id: product.code, block: true, lg: true, pending: phase === "pending", pendingLabel: "Adding…", disabled: !canAdd, visualId: "pd-add-to-bag" })));
    if (retail.state === "variant-required" && !picked) root.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:6px" }, "Pick a size first"));
    if (phase === "failed") root.appendChild(h("div", { "class": "cart-row__note", role: "alert", style: "margin-top:8px" }, "Not added — your bag is unchanged. Try again."));
    if (phase === "conflict") root.appendChild(h("div", { "class": "cart-row__note", role: "alert", style: "margin-top:8px" }, "Stock changed just now — nothing was added."));
  }
  root.appendChild(h("div", { "class": "pd-buy__note" }, "Adding something to your bag doesn’t reserve it — availability and prices are confirmed at checkout."));
  return root;
}

export function SpaProductDetail() {
  var liveView = state.config.dataMode === "live" ? state.moduleStatus.products || "loading" : state.view;
  var product = currentProduct();
  var open = spaRetailOpen();
  var page = h("section", { "class": "page page--narrow", "data-route": "product.detail", "data-state": liveView, "data-visual-id": "product-detail", "data-module": "product-detail", "data-capability": spaCapability(), "data-retail": open ? "retail-commerce-open" : "browse-only", "data-product-ref": product ? product.ref : undefined, "data-screen-label": "Product detail" });
  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "nav.products", "data-visual-id": "pd-back" }, "‹ Shop")));
  var gate = routeStateBody({
    view: liveView, states: ["loading", "error", "unauthorized"],
    skeleton: function () { return h("div", { "class": "pd-grid", "data-state": "loading", "aria-busy": "true" }, [skel("height:340px;border-radius:22px"), h("div", null, [skel("height:26px;border-radius:9px"), skel("height:80px;border-radius:12px;margin-top:12px"), skel("height:48px;border-radius:14px;margin-top:16px")])]); },
    error: { title: "Couldn’t load this product", desc: "The product didn’t load, so nothing is shown — we never show a stale or guessed product. Nothing was changed; try again.", retryId: "product.detail" },
    scope: "this product", backRoute: "products",
  });
  if (gate) { page.appendChild(gate); return page; }
  if (!product || liveView === "not-found") {
    page.appendChild(NotFoundState({ noun: "product", backLabel: "shop", backRoute: "products" }));
    return page;
  }
  var info = h("div", { "class": "pd-info" }, [
    product.collection && spaModelsReady() ? h("div", { "class": "pd-collection", "data-product-model-ref": product.collection.ref }, [h("span", { "class": "pd-collection__label" }, "Collection"), h("span", { "class": "link-action pd-collection__link", "data-action": "nav.products", "data-visual-id": "pd-collection-link", "data-bind": "product.collection.name" }, product.collection.name + " ›")]) : null,
    h("h1", { "class": "pd-name", "data-bind": "product.name" }, product.name),
    h("p", { "class": "pd-desc", "data-bind": "product.description" }, product.description),
  ]);
  if (product.variantFacts && product.variantFacts.length) {
    var facts = h("dl", { "class": "pd-facts", "data-visual-id": "product-facts" });
    product.variantFacts.forEach(function (fact) { facts.appendChild(h("div", { "class": "pd-facts__row" }, [h("dt", { "class": "pd-facts__label" }, fact.label), h("dd", { "class": "pd-facts__val", "data-bind": "product.variantFacts[]" }, fact.value)])); });
    info.appendChild(facts);
  }
  info.appendChild(buyRegion(product));
  page.appendChild(h("div", { "class": "card card--pad pd-hero" }, h("div", { "class": "pd-grid" }, [gallery(product), info])));
  page.appendChild(reviewsRegion(product));
  page.appendChild(h("div", { "class": "catalog-note" }, "Photos, prices and reviews are shown exactly as provided by the studio — this page never invents an image, a rating average or a review."));
  return page;
}
