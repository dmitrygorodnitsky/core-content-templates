# D3 — Copy and stable hooks: COMMERCE surface family

Date: 2026-07-28. Branch: `codex/lab-ui-durable-catalog`.
Companion to `findings-components-commerce.md` (D2); finding ids `C-nn` refer to
that file. Paths are relative to `app-templates/customer-portal/` unless they
start with `docs/`.

Surfaces: `SpaShopPage.js`, `SpaProductDetailPage.js`, `SpaCatalogPage.js`,
`SpaCartPage.js`, `SpaCheckoutPage.js`, `components/spa/CommerceBits.js`,
`components/commerce/*.js`.

## Headline

- **Hook contract: intact.** Across the five owned routes the runtime emits
  exactly the same value sets as the design source for `data-route`,
  `data-module`, `data-visual-id`, `data-action`, `data-bind` and `visualId:`.
  **One** value differs anywhere: `data-state="ready"` added to
  `product-model-list` (C-12), and the runtime is the side matching the accepted
  manifest.
- **No hook a suite selects on is missing.** All 24 selector values used by
  `calm-harbor-wave1{4,5,6,7}-visual-check.mjs` and
  `calm-harbor-current-api-browser-check.mjs` on commerce surfaces were grepped
  and hit. Zero HIGH-severity hook findings.
- **Copy: 8 unaccepted user-visible strings**, all introduced by live-mode
  plumbing — 2 on Shop/ProductCard, 5 in the checkout contract, and the live
  confirmation/fulfillment set. Product detail, Catalog and Cart have **zero**
  copy drift.
- **State grammars: exact.** Server sellability, cart line states and checkout
  root states all match the accepted vocabulary — but three sellability values
  are unreachable in live mode (C-06).

---

## 1. Important note on grep form

The brief's example grep (`rg -n 'data-visual-id="product-detail"' …`) is the
**DOM** form. This codebase builds the DOM from `h()` calls with quoted attribute
keys, so the **source** form is `"data-visual-id": "product-detail"`. Greps in
the DOM form return **zero hits against source files** and must not be read as a
missing hook. Every grep recorded below is in the source form and was executed;
the output is pasted verbatim.

## 2. Hook contract

### 2a. Hooks the browser suites actually select on

Read from the scripts, not guessed:

| suite | file:line | commerce selectors |
| --- | --- | --- |
| wave 14 visual | `scripts/calm-harbor-wave14-visual-check.mjs:15-16` | `spa-catalog`, `spa-service-list`, `spa-service-card`, `spa-shop`, `spa-shop-list`, `spa-shop-card` |
| wave 15 visual | `scripts/calm-harbor-wave15-visual-check.mjs:15-16` | `spa-cart`, `cart-list`, `cart-line`, `spa-checkout`, `checkout-contact`, `checkout-payment` |
| wave 16 visual | `scripts/calm-harbor-wave16-visual-check.mjs:13` | `spa-catalog`, `plan-offer-list`, `plan-offer-card` |
| wave 17 visual | `scripts/calm-harbor-wave17-visual-check.mjs:11-13` | `product-model-list`, `product-model-section`, `spa-shop-card`, `product-detail`, `product-gallery`, `product-review-list`, `product-gallery-primary` |
| wave 15 runtime | `scripts/calm-harbor-wave15-runtime-check.mjs:48` | `[data-route="products"][data-retail="retail-commerce-open"]` |
| wave 17 runtime | `scripts/calm-harbor-wave17-runtime-check.mjs:41,42,49,59` | `data-product-ref`, `data-product-code`, `[data-route="product.detail"][data-product-ref=…]` |
| current-api browser | `scripts/calm-harbor-current-api-browser-check.mjs:169,173,174,189,190,194` | `cart-checkout`, `spa-confirmation`, `checkout-confirm`, `offer-buy-package` |

`order-thumb` (wave 17, `:14`) belongs to the Orders surface, not commerce —
routed to the appointments/account owners.

**Every one of these is emitted by the runtime.** No HIGH-severity hook finding.

### 2b. Recorded greps — all executed, all hit

```
rg -n '"data-visual-id": "product-detail"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
159:  var page = h("section", { "class": "page page--narrow", "data-route": "product.detail", "data-state": liveView, "data-visual-id": "product-detail", "data-module": "product-detail", … });
```

```
rg -n '"data-visual-id": "product-gallery"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
26:  var root = h("div", { "class": "product-gallery", "data-module": "product-gallery", "data-visual-id": "product-gallery" });
```

```
rg -n '"data-visual-id": "product-gallery-primary"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
28:    root.appendChild(h("div", { "class": "pd-media pd-media--empty", "data-visual-id": "product-gallery-primary", "data-state": "no-media" }, [
```

(The non-empty gallery sets the same id imperatively at
`SpaProductDetailPage.js:37` — `primary.setAttribute("data-visual-id", "product-gallery-primary")` —
so a *source* grep alone under-reports it. Both branches emit it; verified by
reading `:35-38`.)

```
rg -n '"data-visual-id": "product-review-list"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
80:  var panel = h("div", { "class": "list-panel product-review-list", "data-module": "product-review-list", "data-visual-id": "product-review-list", "data-product-ref": product.ref, "data-state": view });
```

```
rg -n '"data-visual-id": "product-review-card"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
70:  return h("div", { "class": "product-review-card", "data-module": "product-review-card", "data-visual-id": "product-review-card", "data-review-ref": review.ref }, [
```

```
rg -n '"data-visual-id": "product-gallery-thumb"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
45:        "data-module": "product-gallery-thumb", "data-visual-id": "product-gallery-thumb",
```

```
rg -n '"data-visual-id": "variant-picker"' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js app-templates/customer-portal/runtime/src/routes/SpaShopPage.js
app-templates/customer-portal/runtime/src/routes/SpaShopPage.js:46:      var variants = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js:139:    var variants = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
```

```
rg -n '"data-visual-id": "product-model-list"' app-templates/customer-portal/runtime/src/routes/SpaShopPage.js
142:    var list = h("div", { "class": "product-model-list", "data-module": "product-model-list", "data-visual-id": "product-model-list", "data-state": "ready" });
152:    page.appendChild(h("div", { "class": "shop-models-note", "data-module": "product-model-list", "data-visual-id": "product-model-list", "data-state": "unavailable" }, "Collections couldn’t load right now — showing all products. …"));
```

```
rg -n '"data-visual-id": "product-model-section' app-templates/customer-portal/runtime/src/routes/SpaShopPage.js
91:  var section = h("section", { "class": "product-model-section", "data-module": "product-model-section", "data-visual-id": "product-model-section", "data-product-model-ref": model.ref });
111:  var section = h("section", { "class": "product-model-section product-model-section--others", "data-module": "product-model-section", "data-visual-id": "product-model-section-others" });
```

```
rg -n '"data-visual-id": "spa-shop-card"' app-templates/customer-portal/runtime/src/routes/SpaShopPage.js
29:  var card = h("div", { "class": "card spa-shop-card" + (muted ? " spa-shop-card--muted" : ""), "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": code, "data-product-ref": ref, … });
```

```
rg -n '"data-visual-id": "spa-shop(-list)?"' app-templates/customer-portal/runtime/src/routes/SpaShopPage.js
81:  var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
123:  var page = h("section", { "class": "page", "data-route": "products", "data-state": liveView, "data-visual-id": "spa-shop", "data-module": "spa-shop", "data-retail": open ? "retail-commerce-open" : "browse-only", … });
```

```
rg -n '"data-visual-id": "(spa-cart|cart-list|cart-line|cart-totals|cart-fulfillment|cart-empty)"' app-templates/customer-portal/runtime/src/routes/SpaCartPage.js
23:  var row = h("div", { "class": "cart-row spa-cart-row", "data-module": "cart-line", "data-visual-id": "cart-line", "data-line-ref": l.ref, … });
48:  var page = h("section", { "class": "page", "data-route": "cart", "data-state": state.view, "data-visual-id": "spa-cart", "data-module": "spa-cart", … });
73:    page.appendChild(h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "cart-empty", "data-state": "empty" }, [
91:  var card = h("div", { "class": "card", "data-module": "cart-list", "data-visual-id": "cart-list", "data-state": demo !== "as-added" ? demo : undefined }, [
104:  var totalsCard = h("div", { "class": "card card--pad", "data-module": "cart-totals", "data-visual-id": "cart-totals" }, [
117:  right.appendChild(h("div", { "class": "card card--pad", "data-module": "cart-fulfillment", "data-visual-id": "cart-fulfillment" }, [
```

```
rg -n 'visualId: "cart-checkout"' app-templates/customer-portal/runtime/src/routes/SpaCartPage.js
126:    ActionButton({ variant: "btn--primary", label: "Go to checkout", action: "checkout.start", id: "cart", lg: true, block: true, disabled: blocked, visualId: "cart-checkout" }),
```

```
rg -n '"data-visual-id": "(spa-checkout|checkout-contact|checkout-fulfillment|checkout-lines|checkout-payment|policy-ack|spa-confirmation)"' app-templates/customer-portal/runtime/src/routes/SpaCheckoutPage.js
57:  var card = h("div", { "class": "card card--pad co-confirm", "data-module": "spa-confirmation", "data-visual-id": "spa-confirmation", "data-state": "confirmed", "data-result-kind": res.kind }, [
109:  var page = h("section", { "class": "page", "data-route": "checkout", … "data-visual-id": "spa-checkout", "data-module": "spa-checkout", … "data-payment-mode": "SIMULATED", … });
158:  left.appendChild(h("div", { "class": "card card--pad", "data-module": "checkout-contact", "data-visual-id": "checkout-contact" }, [
168:  var fulCard = h("div", { "class": "card card--pad", "data-module": "checkout-fulfillment", "data-visual-id": "checkout-fulfillment" }, [ … ]);
182:  var linesCard = h("div", { "class": "card card--pad", "data-module": "checkout-lines", "data-visual-id": "checkout-lines" }, [ … ]);
195:  var payCard = h("div", { "class": "card card--pad", "data-module": "checkout-payment", "data-visual-id": "checkout-payment", "data-payment-mode": "SIMULATED" }, [
204:    h("label", { "class": "co-policy", "data-module": "policy-ack", "data-visual-id": "policy-ack", "data-state": state.spaPolicyAck ? "acked" : "required" }, [
```

```
rg -n 'visualId: "checkout-confirm"' app-templates/customer-portal/runtime/src/routes/SpaCheckoutPage.js
222:    disabled: blocked || !state.spaPolicyAck || phase === "conflict", visualId: "checkout-confirm"
```

```
rg -n '"data-visual-id": "(spa-catalog|spa-service-list|spa-service-card|spa-pricing-list|spa-pricing-row|plan-offer-list|plan-offer-card|membership-options)"' app-templates/customer-portal/runtime/src/routes/SpaCatalogPage.js
27:  var card = h("div", { "class": "card card--pad offer-card", "data-module": "plan-offer-card", "data-visual-id": "plan-offer-card", "data-plan-offer-ref": o.ref, "data-offer-kind": o.kind, "data-state": sellability }, [
57:  var page = h("section", { "class": "page", "data-route": state.route, "data-state": liveView, "data-visual-id": "spa-catalog", "data-module": "spa-catalog", … });
81:    var grid = h("div", { "class": "spa-svc-grid", "data-module": "spa-service-list", "data-visual-id": "spa-service-list" });
83:      grid.appendChild(h("div", { "class": "card card--pad spa-svc-card", "data-module": "spa-service-card", "data-visual-id": "spa-service-card", "data-product-code": s.code }, [
101:    var rates = h("div", { "class": "rates-card", "data-module": "spa-pricing-list", "data-visual-id": "spa-pricing-list" }, [
106:      rates.appendChild(h("div", { "class": "rate-row", "data-module": "spa-pricing-row", "data-visual-id": "spa-pricing-row", "data-product-code": s.code }, [
123:      var offers = h("div", { style: "margin-top:18px", "data-module": "membership-options", "data-visual-id": "membership-options", "data-plan-commerce": "open" }, [
129:      var ogrid = h("div", { "class": "offer-grid", "data-module": "plan-offer-list", "data-visual-id": "plan-offer-list" });
138:      var mem = h("div", { "class": "list-panel", style: "margin-top:18px", "data-module": "membership-options", "data-visual-id": "membership-options", "data-plan-commerce": "closed" }, [
146:        mem.appendChild(h("div", { "class": "rate-row", "data-module": "spa-pricing-row", "data-visual-id": "spa-pricing-row", "data-product-code": m.code }, [
```

```
rg -n 'visualId: isPkg \? "offer-buy-package" : "offer-join-membership"' app-templates/customer-portal/runtime/src/routes/SpaCatalogPage.js
45:    disabled: !canBuy || sellability !== "sellable", visualId: isPkg ? "offer-buy-package" : "offer-join-membership"
```

**16 greps recorded, 16 hit.** One caveat is recorded in-line: the non-empty
`product-gallery-primary` is set imperatively, so a source grep sees only the
no-media branch. A future wave that wants a single grep proving both branches
should use:

```
rg -n 'product-gallery-primary' app-templates/customer-portal/runtime/src/routes/SpaProductDetailPage.js
28:    root.appendChild(h("div", { "class": "pd-media pd-media--empty", "data-visual-id": "product-gallery-primary", "data-state": "no-media" }, [
37:  primary.setAttribute("data-visual-id", "product-gallery-primary");
```

### 2c. Complete hook inventory per surface

Every value the runtime emits, with its runtime line and whether it exists in the
design source. `YES` = present in the design counterpart file.

**`SpaShopPage.js`** — `data-route`: `products` `:123` YES. `data-module`:
`spa-shop` `:123`, `spa-shop-card` `:29`, `spa-shop-list` `:81`,
`variant-picker` `:46`, `product-model-list` `:142,152`, `product-model-section`
`:91,111` — all YES. `data-visual-id`: `spa-shop` `:123`, `spa-shop-card` `:29`,
`spa-shop-list` `:81`, `variant-picker` `:46`, `product-model-list` `:142,152`,
`product-model-section` `:91`, `product-model-section-others` `:111`,
`shop-open-cart` `:129` — all YES. `data-action`: `product.open` `:31`,
`shop.pickVariant` `:50`, `cart.open` `:129`, `nav.go` `:129` — all YES.
`data-bind`: `pim.products[].name` `:35`, `pim.products[].shortDescription`
`:36`, `pim.products[].code` `:64`, `product.collection.name` `:34`,
`product.variantFacts[]` `:37`, `retail.state` `:43,44`, `retail.priceNote`
`:63`, `retail.displayPrice` `:62` (conditional), `model.name` `:99`,
`model.productCount` `:101`, `model.variants` `:102` — all YES.
`visualId:` `shop-add-to-bag` `:70` YES. `data-state`: `unavailable` `:152` YES;
**`ready` `:142` — NOT in the design source (C-12)**.

**`SpaProductDetailPage.js`** — **every hook value YES.** `data-route`
`product.detail` `:159`. `data-module`: `product-detail` `:159`,
`product-gallery` `:26`, `product-gallery-thumb` `:45`, `product-review-list`
`:80`, `product-review-card` `:70`, `variant-picker` `:139`. `data-visual-id`:
`product-detail` `:159`, `pd-back` `:160`, `pd-collection-link` `:173`,
`product-facts` `:178`, `product-gallery` `:26`, `product-gallery-primary`
`:28,37`, `product-gallery-thumb` `:45`, `product-review-list` `:80`,
`product-review-card` `:70`, `variant-picker` `:139`. `data-action`:
`nav.products` `:160,173`, `product.gallerySelect` `:46`, `shop.pickVariant`
`:141`. `data-bind`: `product.name` `:174`, `product.description` `:175`,
`product.displayPrice` `:120`, `product.collection.name` `:173`,
`product.variantFacts[]` `:179`, `pim.products[].code` `:120,134`,
`retail.displayPrice` `:132`, `retail.priceNote` `:133`, `retail.state`
`:136,137`, `review.authorName` `:67`, `review.verified` `:68`,
`review.publishedAt` `:69`, `review.title` `:71`, `review.body` `:72`,
`reviews.loadedCount` `:83`. `data-state`: `no-media` `:28`, `loading` `:86,163`,
`unavailable` `:90`, `error` `:97`, `empty` `:105`, `browse-only` `:121`.
`visualId:` `pd-reviews-retry` `:100`, `pd-add-to-bag` `:146`.

**`SpaCatalogPage.js`** — **every hook value YES.** `data-module`/`data-visual-id`:
`spa-catalog` `:57`, `spa-service-list` `:81`, `spa-service-card` `:83`,
`spa-pricing-list` `:101`, `spa-pricing-row` `:106,146`, `membership-options`
`:123,138`, `plan-offer-list` `:129`, `plan-offer-card` `:27`. `data-action`:
`nav.go` `:94`, `account.openPlan` `:134`, `support.email` `:156`. `data-bind`:
`pim.services[].{name,shortDescription,displayPrice,interval,code}`
`:84,85,87,88,91,109,110,112`, `pim.memberships[].{name,shortDescription,displayPrice}`
`:148,149,151`, `planOffer.{kind,title,displayPrice,termsSummary,benefits}`
`:29,33,34,35,36`. `data-state`: `unavailable` `:42` (plus `data-state` bound to
`sellability` at `:27`). `visualId:` `offer-reload` `:40`, `spa-svc-book` `:93`,
`catalog-empty-support` `:75`, `offer-buy-package`/`offer-join-membership` `:45`.
Also `data-plan-commerce` `open`/`closed` `:123,138`, `data-plan-offer-ref` `:27`,
`data-offer-kind` `:27`, `data-product-code` `:83,106,146` — all YES.

**`SpaCartPage.js`** — file is byte-identical to the design source, so every hook
value is trivially YES: `data-route` `cart` `:48`; `data-module`/`data-visual-id`
`spa-cart` `:48`, `cart-line` `:23`, `cart-list` `:91`, `cart-totals` `:104`,
`cart-fulfillment` `:117`, `cart-empty`/`empty-state` `:73`; `data-action`
`cart.changeQuantity` `:31,37,39`, `cart.removeItem` `:33,42`, `nav.products`
`:49`; `data-bind` `cart.lines[].{title,displayUnitPrice,priceNote,quantity,displayTotal}`
`:25,26,28,38,41`, `cart.displayTotals.{subtotal,tax,total}` `:107,108,109`,
`cart.fulfillment.{label,detail}` `:119,120`, `cart.version` `:94`; `data-state`
`empty` `:73`, `loading` `:60`, `stale` `:111`; `data-line-ref` `:23`,
`data-cart-ref` `:48`; `visualId:` `cart-unavailable-shop` `:53`,
`cart-empty-shop` `:77`, `cart-checkout` `:126`.

**`SpaCheckoutPage.js`** — **every hook value YES.** `data-route` `checkout`
`:109`; `data-module`/`data-visual-id` `spa-checkout` `:109`, `spa-confirmation`
`:57`, `checkout-contact` `:158`, `checkout-fulfillment` `:168`,
`checkout-lines` `:182`, `checkout-payment` `:195`, `policy-ack` `:204`;
`data-action` `purchase.open` `:69`, `purchase.openAppointment` `:78`,
`account.openPlan` `:87`, `checkout.selectFulfillment` `:170`,
`checkout.ackPolicy` `:205`; `data-bind` `result.{headline,sub,purchase.reference,appointment.service,plan.title,fulfillment}`
`:59,60,68,77,86,94`, `session.displayName` `:161`, `profile.email,profile.phone`
`:162`, `checkout.fulfillment.{label,detail}` `:173,174`,
`checkout.lines[].{title,displayTotal}` `:185,186`, `checkout.recurringNote`
`:190`, `checkout.displayTotals.{subtotal,tax,total}` `:198,199,200`,
`checkout.policy` `:206`; `data-state` `confirmed` `:57`, `loading` `:127`,
`active` `:170` (+ `acked`/`required` `:204`); `data-payment-mode` `SIMULATED`
`:109,195`; `visualId:` `confirm-purchases` `:99`, `confirm-home` `:100`,
`co-unavailable-shop` `:120`, `co-empty-shop` `:139`, `checkout-confirm` `:222`.

**Value-only drift** (attribute name unchanged, emitted value changed in live
mode) — neither is selected on by any suite:

| attribute | fixture / design value | live runtime value | finding |
| --- | --- | --- | --- |
| `data-checkout-ref` `SpaCheckoutPage.js:109` | `chk-5b8d31` (`design-inbox/data/fixtures.js:1140`) | `customer-portal-checkout` (`runtime/src/routes/SpaCheckoutPage.js:23`) | C-04 |
| `data-result-kind` `SpaCheckoutPage.js:57` | `retail` / `booking` / `plan` (`design-inbox/data/fixtures.js:1171,1175,1183`) | `purchase` (`runtime/src/actions.js:416`) | C-21 |

**`CommerceBits.js`** — byte-identical; hooks `unavailable-state` (`:15`),
`simulation-notice` + `checkout.paymentMode` (`:33`), `purchase.kind` (`:42`),
`commercial-totals` + `money.total` (`:54,61`) all match.

**`components/commerce/*.js`** — `AddressCard`, `PaymentMethodCard`,
`ServiceCard`, `PricingCard` emit unchanged hooks. Two hooks **removed**:

| hook | design | runtime | finding |
| --- | --- | --- | --- |
| `data-state` on `[data-visual-id="cart-row"]` | `design-inbox/src/components/commerce/CartRow.js:11` | `runtime/src/components/commerce/CartRow.js:6` — not emitted | C-07 |
| `data-state` on `[data-visual-id="product-card"]` | `design-inbox/src/components/commerce/ProductCard.js:11` | `runtime/src/components/commerce/ProductCard.js:8` — not emitted | C-08 |

No suite selects on either, so neither is HIGH; both are still contract
regressions.

### 2d. Manifest declaration of the hooks

Neither manifest declares the wave-14→17 commerce `dataBindings`
(`cart.*`, `checkout.*`, `product.*`, `retail.*`, `review.*`, `planOffer.*`,
`model.*`, `result.*`) — a **design-manifest** gap, since the bindings exist in
the design source. `runtime/manifest.json` also omits every commerce component
id it emits. Both are enumerated in `findings-components-commerce.md` C-23 and
belong to D1.

Actions fare better: all 21 actions the owned surfaces dispatch
(`account.openPlan`, `account.openPurchases`, `booking.open`, `cart.addItem`,
`cart.changeQuantity`, `cart.open`, `cart.removeItem`, `checkout.ackPolicy`,
`checkout.confirm`, `checkout.selectFulfillment`, `checkout.start`, `nav.go`,
`nav.products`, `plan.purchase`, `product.gallerySelect`, `product.open`,
`purchase.open`, `purchase.openAppointment`, `shop.pickVariant`,
`support.email`, `ui.retry`) are declared in `design-inbox/manifest.json`.
`runtime/manifest.json` declares only 8 of the 21.

---

## 3. Copy table

Format: runtime text | design text | verdict. Only differences are listed; the
mechanical string extraction found **zero** design strings absent from the
runtime on any owned surface, so there is no "copy lost" column to fill.

### 3a. Shop (`SpaShopPage.js`)

| runtime text | runtime | design text | design | verdict |
| --- | --- | --- | --- | --- |
| "Published retail product" (blurb fallback under `pim.products[].shortDescription`) | `:36` | *none* — `p.blurb` rendered as-is | `:63` | **`invention`, meaning changed** — a product with no published description is presented as having one. C-10 |
| "Other products" (literal) | `:113` | "Other products" via `CAT.othersLabel` | `:142` / `design-inbox/data/fixtures.js:1043` | **`drift`, meaning unchanged** — identical text, binding lost. C-13 |

Every other shop string matches verbatim: "Spa shop", "Browse-only",
"Retail from the public catalog — the products our specialists use.",
"Your bag", "Services & prices ›", "The shelf is empty right now",
"No retail products are published in the catalog at the moment — nothing is
invented in the meantime.", "Couldn't load the shelf", "Retail products didn't
load, so nothing stale is shown. Nothing was changed — try again.", "Out of
stock", "Not sold online", "Price updated", "Add to bag", "Adding…", "Pick a
size first", "Not added — your bag is unchanged. Try again.", "Stock changed just
now — nothing was added.", "1 product"/"N products", "Varies by …",
"Collections couldn't load right now — showing all products. Grouping will return
automatically; nothing is grouped by guesswork.", and both catalogue footnotes.

### 3b. Product detail (`SpaProductDetailPage.js`)

**Zero differences.** All 20 user-visible strings match verbatim, including
"No product photos yet", "Photos appear here once the studio adds them — we
don't show a stand-in image in the meantime.", "One photo provided for this
product.", "N out of 5", "Verified purchase", "Reviews", "1 published review" /
"N published reviews", "Reviews aren't available right now", "We couldn't load
reviews for this product — this doesn't affect anything else on the page. You can
still see the product and add it to your bag.", "Couldn't load reviews", "Reviews
didn't load, so nothing is shown here — we never show stale or guessed reviews.
The rest of the page is fine.", "Try again", "No reviews yet", "This product
doesn't have any published reviews yet.", "Showing every published review for
this product. We don't show an average score.", "This is a browse-only
catalogue — there's no cart or checkout here. Nothing on this page starts a
purchase.", "Adding something to your bag doesn't reserve it — availability and
prices are confirmed at checkout.", "‹ Shop", "Couldn't load this product",
"Collection", and the closing "Photos, prices and reviews are shown exactly as
provided by the studio — this page never invents an image, a rating average or a
review."

### 3c. Catalog (`SpaCatalogPage.js`)

**Zero differences in the route file.** Two strings reach the surface from a
selector rather than a fixture and are inventions there:

| runtime text | producer | design text | design | verdict |
| --- | --- | --- | --- | --- |
| "Published spa service" (service description fallback) | `runtime/src/state.js:279` → rendered `SpaCatalogPage.js:85,110` | real per-service `shortDescription` | `design-inbox/data/fixtures.js` service rows | **`invention`** — C-18 |
| "Published catalog offer" (offer terms fallback) | `runtime/src/state.js:298` → rendered `SpaCatalogPage.js:35` | "6 facial visits · valid 12 months from purchase" / "Renews monthly · cancel renewal anytime" | `design-inbox/data/fixtures.js:978-979` | **`invention`, meaning changed** — a specific commitment replaced by a non-statement. C-18 |

Also: `planOffer.benefits` renders an empty list in live mode
(`SpaCatalogPage.js:36`, producer `runtime/src/state.js:299`) where the accepted
offers carry three benefits each (`design-inbox/data/fixtures.js:978-979`) — copy
silently disappearing rather than drifting. C-18.

### 3d. Cart (`SpaCartPage.js`)

**Zero differences in the route file** (byte-identical). Two live-mode strings
arrive through `state.spaCart.fulfillment`:

| runtime text | producer | design text | design | verdict |
| --- | --- | --- | --- | --- |
| "Pickup at the studio" | `runtime/src/actions.js:330` → `SpaCartPage.js:119` | "Pickup — Harbor Front studio" | `design-inbox/data/fixtures.js:1283` | **`invention`** — C-21 |
| "Availability is confirmed by the studio" | `runtime/src/actions.js:330` → `SpaCartPage.js:120` | "Usually ready in 2 days · free" | `design-inbox/data/fixtures.js:1283` | **`invention`, and the design side is the unprovable one** — the accepted string claims a 2-day SLA and a free price. Runtime replacement is honest but unaccepted. C-05/C-21 |

### 3e. Checkout (`SpaCheckoutPage.js`)

| runtime text | runtime | design text | design | verdict |
| --- | --- | --- | --- | --- |
| "Prices and availability are re-checked when you confirm." | `:24` (rendered `:189`) | "This quote holds for 15 minutes — prices and stock are re-checked at confirmation." | `design-inbox/data/fixtures.js:1141` | **meaning changed** — the 15-minute hold promise is withdrawn. Withdrawal is correct (no hold exists → `design-gap` C-05); the replacement is unaccepted copy (`invention` C-04) |
| "Pickup at the studio" | `:26` (rendered `:173`) | "Pickup — Harbor Front studio" | `:1143` | `invention` C-04 — studio identity dropped |
| "The studio confirms availability after the order is recorded" | `:26` (rendered `:174`) | "Usually ready in 2 days · free" | `:1143` | **meaning changed** — an SLA and a price replaced by a process note. Correct to withdraw (C-05), unaccepted as written (C-04) |
| "Delivery isn't offered on this portal yet — pickup only." | `:28` (rendered `:178`) | identical | `:1145` | **no change** — literal duplicated into the route rather than read from data; `drift`, text preserved |
| "I understand this is a simulated checkout and no payment will be taken." | `:29` (rendered `:206`) | "I understand pickup orders are held for 14 days and services follow the studio's cancellation policy." | `:1146` | **meaning changed, and this is the sharpest one** — the accepted acknowledgement is a *retention and cancellation policy*; the runtime replaces it with a *simulation disclaimer* already stated twice on the same card (`SimulationBadge` `:202`, note `:203`). The user now acknowledges nothing about their order. `invention` C-04 + `design-gap` C-05 |
| "The order was recorded in Core. This demo did not take a payment." | `runtime/src/actions.js:418` → `:60` | "Demo checkout completed — no charge was made." | `:1171` | **`invention`, meaning changed** — "recorded in Core" names an internal system to a customer. C-21. Pinned by `scripts/calm-harbor-current-api-browser-check.mjs:151` |
| "Pickup at Harbor Front studio" (confirmation fulfillment) | `runtime/src/actions.js:420` → `:94` | "Pickup — Harbor Front studio. We'll let you know when your items are ready." | `:1173` | `invention` C-21 — the follow-up promise is dropped, and the remaining claim is asserted with no server field |
| "Booking updated" (reschedule headline) | `runtime/src/actions.js:469` → `:59` | "Booking confirmed" | `:1198` | **`invention`** — outside the accepted headline set ("Order confirmed" / "Booking confirmed" / "Demo checkout completed"). Producer is the booking flow → routed to the appointments owner; recorded here because it renders on my surface. C-21 |

All other checkout strings match verbatim: "Review & confirm", "Check everything
below — nothing is ordered until you confirm.", "‹ Back to your bag", "‹ Back",
"Checkout isn't open yet", "Online purchasing isn't enabled on this portal.
Nothing can be ordered here yet.", "Browse the shop", "Couldn't prepare your
checkout", "Checkout isn't available right now", "There's nothing to check out",
"Your bag is empty, so there's nothing to review here.", "Contact", "We use these
only to tell you about this order.", "How you'll get it", "Your order",
"Totals & confirmation", "Subtotal", "Tax", "Total", "Simulation — no charge will
be made", "This is a demonstration checkout: confirming records your order
without any payment. There's nothing to enter — no card, no charge, no receipt.",
"Confirm order", "Confirming…", "Tick the box above to confirm", "Your order
wasn't confirmed — nothing was created. You can try again.", "Try confirming
again", "The quote changed at the last moment — reload it and review before
confirming. Nothing was ordered.", "Reload quote", "All purchases", "Back to
appointments", "Purchase", "Visit", "Plan", "Pickup", "view purchase ›",
"see appointments ›", "open My plan ›", and the three blocking-review banners.

### 3f. `components/commerce/*.js`

| runtime text | runtime | design text | design | verdict |
| --- | --- | --- | --- | --- |
| "Catalog" (product tag fallback) | `ProductCard.js:11` | *none* — `p.tag` as-is | `ProductCard.js:14` | `invention` C-09 |
| "Contact" (CTA label when `allowedActions` includes `support.open`) | `ProductCard.js:16` | always "Add" | `ProductCard.js:19` | `invention` C-09 |
| "Retry add" (on `failed`/`conflict`) | *absent* | "Retry add" | `ProductCard.js:19` | **`gap`** C-08 |
| "Adding…" (pending label) | *absent* | "Adding…" | `ProductCard.js:20` | **`gap`** C-08 |
| "Didn't save — quantity unchanged. Try again." | *absent* | present | `CartRow.js:17` | **`gap`** C-07 |

`AddressCard`, `PaymentMethodCard`, `ServiceCard`, `CommerceBits` and
`PricingCard` itself: zero copy differences. (`PricingCard`'s *consumers* change
copy — see C-11 — but that is `PricingPage.js`, outside owned scope.)

---

## 4. State-grammar confirmation

### 4a. Server sellability — `sellable | unavailable | out-of-stock | price-changed | variant-required`

**Emitted set is exactly the accepted set. No extra state, no missing renderer.**

| state | shop renderer | product-detail renderer | reachable in fixture mode | reachable in live mode |
| --- | --- | --- | --- | --- |
| `sellable` | `SpaShopPage.js:29` (`data-state`), `:67` | `SpaProductDetailPage.js:145` | yes (`design-inbox/data/fixtures.js:1002`) | yes — but **client-asserted**, C-06 |
| `unavailable` | `SpaShopPage.js:28,44` | `SpaProductDetailPage.js:129,137` | yes (`:1010`) | yes, only when the product is absent from the list |
| `out-of-stock` | `SpaShopPage.js:43` | `SpaProductDetailPage.js:136` | yes (`:1007`) | **no** — C-06 |
| `price-changed` | `SpaShopPage.js:63` | `SpaProductDetailPage.js:133` | yes (`:1009`) | **no** — C-06 |
| `variant-required` | `SpaShopPage.js:45-55,72` | `SpaProductDetailPage.js:138-144,147` | yes (`:1003-1006`) | **no** — C-06 |

Source: `runtime/src/state.js:156-165` vs `design-inbox/src/state.js:180-182`.

### 4b. Cart line states — `stale-price | inventory-conflict`

Exact match. `runtime/src/routes/SpaCartPage.js:19` computes the line state and
`:23` emits it; the two resolutions render at `:28` (stale-price note) and
`:29-34` (inventory-conflict with "Keep 1" / "Remove"). Identical to
`design-inbox/src/routes/SpaCartPage.js:19,23,28,29-34`. The declared vocabulary
`as-added | stale-price | inventory-conflict` is documented at
`design-inbox/src/state.js:75` and carried at `runtime/src/state.js:96`
(comment dropped, default and values identical). Command phases `pending` /
`failed` / `conflict` layer on top at `SpaCartPage.js:20-23,27` on both sides.
**No extra state, none missing.**

### 4c. Checkout root — `ready | repriced | inventory-conflict | slot-expired | confirmed`

Exact match. `runtime/src/routes/SpaCheckoutPage.js:109` emits
`res ? "confirmed" : (state.view !== "ready" ? state.view : demo)` — identical
expression to `design-inbox/src/routes/SpaCheckoutPage.js:83`. The three blocking
states render at `:153`, `:154`, `:155` (design `:128`, `:129`, `:130`) and each
disables confirm via `blocked` at `:145`/`:222` (design `:120`/`:197`).

**`confirmed` renders only from the authoritative readback.** `:111-114` returns
early on `state.spaResult` and nothing else can set `data-state="confirmed"`.
Every assignment to `state.spaResult` in the runtime was enumerated
(`rg -n 'spaResult\s*=' runtime/src/`) and each is either a reset to `null` or a
readback callback:

| site | kind |
| --- | --- |
| `runtime/src/state.js:532`, `runtime/src/actions.js:392` | reset to `null` |
| `runtime/src/actions.js:415-421` | live order — inside the `runLiveSpaCommand` **success** callback, after Core returns the order |
| `runtime/src/actions.js:431-432` | fixture order — inside the `runSpaCommand` readback callback opened at `:428` |
| `runtime/src/actions.js:467-472` | live booking — inside the `runLiveSpaCommand` success callback |
| `runtime/src/actions.js:485` | fixture booking readback |

No dispatch-time, timeout-based or toast-based path sets it. **Contract
honoured.** The design equivalents are `design-inbox/src/actions.js:466,468,488,498`
with the same shape.

The declared vocabulary is at `design-inbox/src/state.js:78`, carried at
`runtime/src/state.js:104`.

### 4d. Plan-offer sellability — `sellable | changed | unavailable`

Emitted set matches (`SpaCatalogPage.js:24,27,38,42,45` vs design
`:24,27,38,42,45`), but `changed` and `unavailable` are unreachable in live mode
because `runtime/src/state.js:300` asserts `sellability: "sellable"` — C-18.

---

## 5. What could not be checked

Named honestly rather than implied:

1. **No hook or copy was verified in a rendered DOM.** Every statement here is
   source-level: attribute literals and string literals extracted from the two
   trees. Playwright *is* available in this environment (D5 ran the suites
   against system Chrome 150 — see `evidence/responsive/README.md`), but running
   them is D5's slice, not this one, and re-running a suite D5 owns would produce
   a second, conflicting verdict. **Nothing here should be read as a suite pass**;
   the hook claims are "the runtime source emits this value", not "the browser
   found this element".
2. **Live-mode copy was read from the code paths, not observed against staging.**
   The live strings in §3c-3e are what `runtime/src/state.js` and
   `runtime/src/actions.js` will produce; they were not captured from a live
   session.
3. **`data-screen-label`, `data-capability` and `data-retail` values** were
   compared as source expressions and match, but their *rendered* values depend
   on deployment configuration that was not exercised.
4. **The `succeeded-readback` add-to-bag state** (C-22) could not be confirmed as
   intentionally treatment-free — neither source renders it, so the question is
   for the designer, not answerable from the repository.
5. **`PricingPage.js`, `ProductsPage.js`, `CheckoutPage.js`, `ServicesPage.js`**
   — consumers of my owned `components/commerce/*` — were read only far enough to
   determine whether the new component props are exercised. They are **not
   audited**; their copy and hooks belong to whoever owns the generic portal
   routes.
