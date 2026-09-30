# D2 — Component audit: COMMERCE surface family

Date: 2026-07-28. Branch: `codex/lab-ui-durable-catalog`.
Reference: `app-templates/customer-portal/design-inbox/` (read-only, untouched).
Subject: `app-templates/customer-portal/runtime/` (read-only in this slice — this
wave reports; the operator removes).

All paths below are relative to `app-templates/customer-portal/` unless they
start with `docs/`.

## Scope

Owned surfaces, all compared in full (no sampling):

| runtime file | design counterpart | lines D→R |
| --- | --- | --- |
| `runtime/src/routes/SpaShopPage.js` | `design-inbox/src/routes/SpaShopPage.js` | 202 → 157 (−45) |
| `runtime/src/routes/SpaProductDetailPage.js` | same path under `design-inbox/` | 279 → 187 (−92) |
| `runtime/src/routes/SpaCatalogPage.js` | same | 158 → 163 (+5) |
| `runtime/src/routes/SpaCartPage.js` | same | 134 → 134 (0) |
| `runtime/src/routes/SpaCheckoutPage.js` | same | 206 → 231 (+25) |
| `runtime/src/components/spa/CommerceBits.js` | same | 72 → 72 (0) |
| `runtime/src/components/commerce/{AddressCard,CartRow,PaymentMethodCard,PricingCard,ProductCard,ServiceCard}.js` | same | see §3 |
| `runtime/styles/*.css` (shop/product/cart/checkout rules) | `design-inbox/styles/*.css` | read-only comparison, C-19/C-20 |

## Method

Three passes, all mechanical and reproducible:

1. **Byte diff** — `diff -u` per file pair.
2. **Structural extraction** — every `h(tag, props)` call reduced to
   `tag | class | data-visual-id | data-module | data-action | data-bind |
   data-state`, comments stripped, compared as a multiset. This is what proves
   whether a line-count delta is lost presentation or lost commentary.
3. **Attribute-set extraction** — the exact value sets of `data-bind`,
   `data-action`, `data-visual-id`, `data-module`, `data-state`, `data-route`
   and `visualId:` per file pair.

Where a difference is produced outside my owned files (`state.js`, `actions.js`)
but *rendered* by an owned surface, the finding names both the render site and
the producer, because the user-visible defect is on my surface.

## Summary

23 findings.

| classification | count | ids |
| --- | --- | --- |
| `invention` | 9 | C-01, C-02, C-03, C-04, C-09, C-10, C-17, C-18, C-21 |
| `gap` | 4 | C-06, C-07, C-08, C-23 |
| `drift` | 6 | C-11, C-12, C-13, C-15, C-19, C-20 |
| `decision` | 2 | C-14, C-16 |
| `design-gap` | 2 | C-05, C-22 |

Severity: 5 HIGH (C-01, C-02, C-03, C-06, C-07), 9 MED, 9 LOW.

---

## 1. The two large negative deltas, enumerated block by block

The headline result: **neither negative delta is lost presentation.** Both are
comment removal plus line compaction. This is stated with a mechanical proof,
not an impression.

### 1a. `SpaProductDetailPage.js` — 279 → 187 (−92)

Structural extraction: **76 `h()` elements on the design side, 76 on the runtime
side. Zero design-only elements. Zero runtime-only elements.** Attribute-set
extraction: **zero differences** across `data-bind`, `data-action`,
`data-visual-id`, `data-module`, `data-state`, `data-route` and `visualId:`.
User-visible string extraction: **zero strings present on one side only.**

Every accepted block, in design order, with its runtime location:

| # | accepted block | design | runtime | verdict |
| --- | --- | --- | --- | --- |
| 1 | `mediaFrame` — `.pd-media` + `data-media-ref` + `data-state ready\|no-data`, `<img>` lazy, `error` listener falling back to `.pd-media__label` | `SpaProductDetailPage.js:32-46` | `SpaProductDetailPage.js:8-22` | present |
| 2 | gallery no-media state — `.pd-media--empty`, `data-visual-id="product-gallery-primary"`, `data-state="no-media"`, glyph, title, description | `:55-59` | `:28-32` | present |
| 3 | gallery primary — selected frame promoted with `data-visual-id="product-gallery-primary"` | `:63-66` | `:35-38` | present |
| 4 | gallery thumbs — `.product-gallery__thumbs` `role=group`, per-thumb `product.gallerySelect`, `data-media-ref`, `data-state="active"`, `aria-current`, indexed `aria-label` | `:68-81` | `:39-51` | present |
| 5 | single-image note — "One photo provided for this product." | `:83` | `:53` | present |
| 6 | `stars()` — `role=img`, "N out of 5" label, decorative on/off glyph spans | `:90-96` | `:58-64` | present |
| 7 | `reviewCard` — `product-review-card`, `data-review-ref`, head (stars + optional title), body, footer (author + conditional "Verified purchase" + optional date) | `:98-111` | `:66-75` | present |
| 8 | reviews panel shell — `list-panel product-review-list`, `data-product-ref`, `data-state`, head with title + `reviews.loadedCount` | `:115-124` | `:77-84` | present |
| 9 | reviews `loading` — two skeletons, `aria-busy` | `:127-131` | `:85-88` | present |
| 10 | reviews `unavailable` — title + description | `:133-138` | `:89-95` | present |
| 11 | reviews `error` — title + description + `ui.retry product-reviews` ghost button (`pd-reviews-retry`) | `:140-146` | `:96-103` | present |
| 12 | reviews `empty` — title + description | `:148-153` | `:104-110` | present |
| 13 | reviews scope note — "Showing every published review… We don't show an average score." | `:157` | `:111` | present |
| 14 | buy region, browse-only — `.pd-price` (`product.displayPrice` + code chip) + `data-state="browse-only"` note | `:169-171` | `:120-122` | present |
| 15 | buy region price — `retail.displayPrice`, "from …" for `variant-required`, "Price updated" chip on `price-changed`, code chip | `:184-188` | `:131-135` | present |
| 16 | `out-of-stock` chip | `:190` | `:136` | present |
| 17 | `unavailable` chip with `retail.note` fallback "Not sold online" | `:191` | `:137` | present |
| 18 | `variant-picker` — `.shop-variants`, per-variant `shop.pickVariant`, `data-variant-ref`, `data-state="active"` | `:192-202` | `:138-144` | present |
| 19 | add-to-bag — primary block/lg `cart.addItem`, pending "Adding…", `disabled` when `!canAdd`, `pd-add-to-bag` | `:204-208` | `:145-146` | present |
| 20 | "Pick a size first" hint | `:209` | `:147` | present |
| 21 | `failed` alert — "Not added — your bag is unchanged. Try again." | `:210` | `:148` | present |
| 22 | `conflict` alert — "Stock changed just now — nothing was added." | `:211` | `:149` | present |
| 23 | non-reservation note — "Adding something to your bag doesn't reserve it…" | `:213` | `:151` | present |
| 24 | route root — `data-route="product.detail"`, `data-visual-id`/`data-module="product-detail"`, `data-capability`, `data-retail`, `data-product-ref`, `data-screen-label` | `:220` | `:159` | present |
| 25 | back link — `nav.products` "‹ Shop", `pd-back` | `:221` | `:160` | present |
| 26 | route gate — `loading`/`error`/`unauthorized`, two-column skeleton, error copy, `retryId: "product.detail"`, `backRoute: "products"` | `:224-235` | `:161-167` | present |
| 27 | non-enumerating not-found | `:238-241` | `:168-171` | present |
| 28 | collection link — `.pd-collection`, `data-product-model-ref`, `pd-collection-link`, gated on `spaModelsReady()` | `:243-251` | `:173` | present (inlined) |
| 29 | name + description | `:252-253` | `:174-175` | present |
| 30 | variant facts — `<dl class="pd-facts">` `data-visual-id="product-facts"` rows | `:257-266` | `:177-181` | present |
| 31 | hero — `.card.card--pad.pd-hero` > `.pd-grid` > [gallery, info] | `:270-273` | `:183` | present |
| 32 | reviews region mount | `:275` | `:184` | present |
| 33 | catalogue footnote — "Photos, prices and reviews are shown exactly as provided by the studio…" | `:277` | `:185` | present |

Where the 92 lines went:

| source of the delta | design lines | ≈ lines |
| --- | --- | --- |
| file header comment (truth rules) | `:1-22` | 22 |
| `F` fixture import removed (runtime reads state selectors) | `:24` | 1 |
| eight block comments (`:29-31`, `:48-49`, `:88-89`, `:113-114`, `:156`, `:162-163`, `:223`, `:237`, `:256`) | — | 14 |
| multi-line `h()` calls collapsed to one line (thumbs, review card, review panel head, skeleton pair, buy price, variant button, add-to-bag, gate, info block, hero) | — | ≈ 53 |
| intermediate locals removed (`var t`, `var sk`, `var vRow`, `var showCollection`, `var hero`) | `:63,72,127,193,243,270` | ≈ 6 |

**No accepted block, state or element is missing.** The only substantive change
in this file is the live-view resolution at `:156` — see C-14.

### 1b. `SpaShopPage.js` — 202 → 157 (−45)

Structural extraction: **53 design `h()` elements, 51 runtime.** The apparent
misses are one refactor and one addition:

- `div.spa-shop-grid[data-visual-id="spa-shop-list"]` appears **three times** in
  the design source (`:131` in `modelSection`, `:145` in `othersSection`, `:193`
  in the flat fallback) and **once** in the runtime (`:81`) — because the runtime
  factored the identical body into `productGrid()` (`:80-87`) and calls it from
  all three sites (`:106`, `:116`, `:153`). **Renders three times on both sides.
  Not a gap.**
- `div.product-model-list[data-visual-id="product-model-list"]` with no
  `data-state` (design `:180`) versus with `data-state="ready"` (runtime `:142`)
  — see C-12.

Every accepted block, in design order:

| # | accepted block | design | runtime | verdict |
| --- | --- | --- | --- | --- |
| 1 | `cardThumb` — decorative `.spa-shop-card__thumb`, `data-state ready\|no-data`, `aria-hidden`, `<img alt="">` only when a URL exists | `SpaShopPage.js:35-40` | `SpaShopPage.js:11-16` | present |
| 2 | card root — `card spa-shop-card` (+`--muted`), `data-module`/`data-visual-id="spa-shop-card"`, `data-product-code`, `data-product-ref`, `data-state` = command phase else sellability | `:55` | `:29` | present |
| 3 | open affordance — `button.spa-shop-card__open` carrying `product.open`, `data-id`=opaque ref, `data-product-ref`, `aria-label "View <name>"` | `:58` | `:31` | present |
| 4 | collection line — `.spa-shop-card__collection`, `data-product-model-ref`, gated on `spaModelsReady()` | `:61` | `:34` | present |
| 5 | name / blurb | `:62-63` | `:35-36` | present, blurb drifted — C-10 |
| 6 | variant facts chips — `.spa-shop-card__facts` > `.fact-chip` | `:64-66` | `:37` | present |
| 7 | `out-of-stock` chip | `:74` | `:43` | present |
| 8 | `unavailable` chip with note fallback | `:75` | `:44` | present |
| 9 | `variant-picker` block | `:76-86` | `:45-55` | present |
| 10 | price row — `retail.displayPrice`/`pim.products[].displayPrice`, "from …", "Price updated" chip, code chip | `:89-96` | `:58-65` | present |
| 11 | add-to-bag — primary block `cart.addItem`, "Adding…", `shop-add-to-bag` | `:98-102` | `:67-71` | present |
| 12 | "Pick a size first" | `:103` | `:72` | present |
| 13 | `failed` alert | `:104` | `:73` | present |
| 14 | `conflict` alert | `:105` | `:74` | present |
| 15 | `modelSection` — `section.product-model-section`, `data-product-model-ref`, optional decorative model media, name (`model.name`), product count (`model.productCount`), declared dimensions ("Varies by …", `model.variants`) | `:113-135` | `:89-108` | present |
| 16 | `othersSection` — `--others` modifier, `data-visual-id="product-model-section-others"`, no model ref, no media, no dimensions | `:139-149` | `:110-118` | present; label drifted — C-13 |
| 17 | route root — `data-route="products"`, `spa-shop`, `data-retail`, `data-capability`, `data-screen-label` variant | `:153` | `:123` | present |
| 18 | section head — title "Spa shop", Browse-only chip when closed, subtitle, and the right-hand link (`cart.open` "Your bag · N ›" when open, else `nav.go services` "Services & prices ›") | `:155-165` | `:124-130` | present |
| 19 | route gate — `loading` grid skeleton (4 × 220), `empty` ("The shelf is empty right now"), `error` ("Couldn't load the shelf", `retryId: "products"`) | `:168-173` | `:132-137` | present |
| 20 | grouped branch — `product-model-list`, one section per model in returned order, then the unmodeled "Other products" group | `:178-188` | `:141-150` | present |
| 21 | models-unavailable branch — `.shop-models-note` with `data-visual-id="product-model-list"` `data-state="unavailable"` + honest notice, then the flat grid | `:189-196` | `:151-154` | present |
| 22 | catalogue footnote — sellable and browse-only variants | `:198-200` | `:155` | present |

Where the 45 lines went:

| source of the delta | design lines | ≈ lines |
| --- | --- | --- |
| file header comment (wave 14/15/17 truth rules) | `:1-20` | 20 |
| `F` import + `CAT`/`pimByCode`/`detByCode` fixture helpers replaced by state selectors | `:22,27,29-30` | 4 |
| six block comments (`:32-34`, `:42-43`, `:57`, `:111-112`, `:117`, `:137-138`, `:179`, `:190-191`) | — | 12 |
| `productGrid()` factoring — three duplicated grid bodies become one helper plus three calls | `:131-132,145-146,193-194` | ≈ 4 |
| multi-line `h()` collapsed (open button, section head, gate, card body) | — | ≈ 8 |

**No accepted block, state or element is missing.**

---

## 2. Findings

### C-01 · `invention` · HIGH · Live cart and checkout totals are assembled by the client

The cart and checkout money rows are contractually server-owned display strings.
In live (`current-api`) mode there is no server cart: the runtime builds the
lines, applies a **hardcoded 8 % tax**, formats `$` strings, and renders the
result through the `cart.displayTotals.*` / `checkout.displayTotals.*` bindings.

- Render sites (owned): `runtime/src/routes/SpaCartPage.js:103-112` (`cart-totals`,
  binds `cart.displayTotals.subtotal|tax|total`), `runtime/src/routes/SpaCartPage.js:41`
  (`cart.lines[].displayTotal`), `runtime/src/routes/SpaCartPage.js:26`
  (`cart.lines[].displayUnitPrice`), `runtime/src/routes/SpaCheckoutPage.js:194-201`
  (`checkout-payment` money rows), `runtime/src/routes/SpaCheckoutPage.js:186`
  (`checkout.lines[].displayTotal`).
- Producer (not owned, report only): `runtime/src/actions.js:316-332` —
  `var taxes = Math.round(subtotal * 0.08);` at `:318`, and
  `displayTotals: … { subtotal: displayMoney(subtotal), tax: displayMoney(taxes), total: displayMoney(subtotal + taxes) }`
  at `:329`. Reached in live mode from `runtime/src/actions.js:334-346`
  (`spaAddLine`, live branch calls `spaSetLines`).
- Design counterpart: `design-inbox/src/routes/SpaCartPage.js:1-8` (accepted
  header: "presentation renders returned display totals verbatim and never
  recomputes") and `design-inbox/src/routes/SpaCartPage.js:102`
  ("server-owned display totals — rendered verbatim"). The equivalent arithmetic
  exists in the design **only inside the fixture**,
  `design-inbox/data/fixtures.js:1273-1285` (`spaServerCart`), where it
  legitimately stands in for the server.
- Cross-reference: `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S3.md`
  §5a — "money is read, never assembled… The Cart API does return `unitAmount`,
  `lineAmount`, and `subtotal`, so W4 checkout has server-owned totals available
  and must use them rather than repeating this."

Route: fix in W4 by reading the Cart API figures. Not removable as a pure
invention — deleting the assembly leaves the surface with no totals at all, so
this is a fix ticket, not a deletion.

### C-02 · `invention` · HIGH · The live plan quote fabricates a subtotal, a zero tax and a total

`runtime/src/routes/SpaCheckoutPage.js:43-47`:

```js
return {
  lines: [{ ref: "line-" + offer.ref, title: offer.title, variant: null, qty: 1, displayUnitPrice: offer.displayPrice, displayTotal: offer.displayPrice }],
  displayTotals: { subtotal: offer.displayPrice, tax: "$0.00", total: offer.displayPrice },
  recurringNote: offer.kind === "MEMBERSHIP" ? offer.termsSummary : null,
};
```

`tax: "$0.00"` is a commercial claim no server made, and `total` is asserted to
equal `subtotal`. Design counterpart: `design-inbox/src/routes/SpaCheckoutPage.js:25`
returns a **frozen server quote** (`F.spaCommerce.checkout.planQuotes[…]`,
`design-inbox/data/fixtures.js:1154-1163`) with distinct server-supplied
`subtotal`, `tax` and `total`.

Aggravating: in live mode `offer.displayPrice` is built at
`runtime/src/state.js:296` as `item.price + " / " + item.interval`, so the
checkout `Total` row can render a **rate string** — e.g. `$18.00 / month` — in a
row bound to `checkout.displayTotals.total`.

### C-03 · `invention` · HIGH · The live order total and tax are computed client-side and written to Core

`runtime/src/actions.js:597-608` (`spaLiveCheckoutAmounts`):

```js
var subtotalCents = spaLines().reduce(function (sum, line) { return sum + Number(line.cents || 0) * Number(line.qty || 0); }, 0);
var taxCents = Math.round(subtotalCents * 0.08);
return { total: (subtotalCents + taxCents) / 100, taxes: taxCents / 100 };
```

Consumed at `runtime/src/actions.js:410-412` —
`createOrder({ requestRef: requestRef, total: amounts.total, taxes: amounts.taxes }, …)` —
which is the command behind `checkout-confirm` on the owned surface,
`runtime/src/routes/SpaCheckoutPage.js:219-223`.

Design counterpart: **absent.** The accepted confirm path is a readback
(`design-inbox/src/routes/SpaCheckoutPage.js:194-198` dispatching
`checkout.confirm`, resolved from `design-inbox/data/fixtures.js:1170-1200`);
presentation never carries an amount into the command.

This is the most consequential row in the family: an invented 8 % tax rate is
not just displayed, it is **persisted**.

### C-04 · `invention` · MED · `LIVE_CHECKOUT` ships unaccepted checkout copy and a runtime-authored checkout ref

`runtime/src/routes/SpaCheckoutPage.js:22-34` introduces a frozen contract used
whenever `dataMode === "live"` (`checkoutContract()` at `:32-34`, consumed at
`:108`, `:109`, `:169`, `:178`, `:189`, `:206`, `:212`, `:220`).

Design counterpart: `design-inbox/src/routes/SpaCheckoutPage.js:117`
(`var co = F.spaCommerce.checkout;`) with values at
`design-inbox/data/fixtures.js:1139-1146`. Five user-visible strings and the
`data-checkout-ref` value differ — the per-string table is in
`findings-copy-hooks-commerce.md` §3.

`data-checkout-ref` becomes `"customer-portal-checkout"` in live mode
(`runtime/src/routes/SpaCheckoutPage.js:23`, rendered at `:109`) against the
accepted `chk-5b8d31` (`design-inbox/data/fixtures.js:1140`). No check script
selects on `data-checkout-ref`, so the suites do not break — but it is a contract
attribute changing value silently.

### C-05 · `design-gap` · MED · The accepted checkout fixture asserts facts Core does not provide

The runtime's substitution in C-04 is partly *correct* under the honesty rule.
These accepted strings state facts the live system cannot support:

- `design-inbox/data/fixtures.js:1141` — "This quote holds for 15 minutes — prices
  and stock are re-checked at confirmation." There is no quote hold; nothing
  freezes for 15 minutes.
- `design-inbox/data/fixtures.js:1143` — "Usually ready in 2 days · free". No
  fulfillment SLA and no shipping-price field is returned.
- `design-inbox/data/fixtures.js:1146` — "I understand pickup orders are held for
  14 days and services follow the studio's cancellation policy." A 14-day hold
  policy is not recorded anywhere in the contract.

Finding is **against the design fixture**. The runtime omitting them is right;
what needs a brief is the accepted replacement copy for a deployment with no
quote-expiry, pickup-window or retention policy. Cluster with C-04 into one
checkout brief.

### C-06 · `gap` · HIGH · Three of the five accepted server sellability states are unreachable in live mode, and `sellable` is client-asserted

The accepted grammar is `sellable | unavailable | out-of-stock | price-changed |
variant-required` (`design-inbox/src/routes/SpaShopPage.js:5-8`, fixture rows at
`design-inbox/data/fixtures.js:1002-1010`).

The runtime **renderers are all present and byte-faithful** —
`runtime/src/routes/SpaShopPage.js:42-65` and
`runtime/src/routes/SpaProductDetailPage.js:124-144` match
`design-inbox/src/routes/SpaShopPage.js:73-96` and
`design-inbox/src/routes/SpaProductDetailPage.js:174-202` exactly. What is missing
is the data:

```js
// runtime/src/state.js:156-160 — live branch
var product = productItems().find(function (item) { return item.code === code; });
return product ? { state: "sellable", cents: …, displayPrice: product.price } : { state: "unavailable" };
```

Design counterpart: `design-inbox/src/state.js:180-182` returns the server-shaped
row verbatim, carrying whichever of the five states applies.

Consequences on the owned surfaces, all live-mode dead code:

| accepted treatment | render site | dead because |
| --- | --- | --- |
| "Out of stock" chip | `SpaShopPage.js:43`, `SpaProductDetailPage.js:136` | `out-of-stock` never returned |
| "Price updated" chip | `SpaShopPage.js:63`, `SpaProductDetailPage.js:133` | `price-changed` never returned |
| `variant-picker` + "Pick a size first" | `SpaShopPage.js:45-55,72`, `SpaProductDetailPage.js:138-144,147` | `variant-required` never returned |
| muted card (`spa-shop-card--muted`) | `SpaShopPage.js:28-29` | only `unavailable` can mute, i.e. a product absent from the list |

Separately: `state: "sellable"` is asserted from *the presence of a PIM row*.
No server sellability field is read. A product Core has published but is not
selling reads as sellable. Route: brief + W4 fix; the presentation itself needs
no change.

### C-07 · `gap` · HIGH · `CartRow` lost the accepted wave-13 row-scoped command lifecycle

- Runtime: `runtime/src/components/commerce/CartRow.js:1-21`.
- Design: `design-inbox/src/components/commerce/CartRow.js:1-27`.

Missing on the runtime side, each present in the design:

| accepted element | design | runtime |
| --- | --- | --- |
| `cmdPhase("cart.mutate:" + item.name)` and `busy` | `:9-10` | absent |
| `data-state` on `[data-visual-id="cart-row"]` | `:11` | `:6` — attribute not emitted |
| failure note "Didn't save — quantity unchanged. Try again." (`role="alert"`) | `:17` | absent |
| `disabled` on the − control while pending | `:20` | `:14` — no `disabled` |
| `disabled` on the + control while pending | `:22` | `:16` — no `disabled` |
| `disabled` on Remove while pending | `:25` | `:19` — no `disabled` |

The whole accepted row-scoped pending/failure treatment is gone: a busy row is
indistinguishable from an idle one, and a failed quantity change is silent.

Note against the design as well: **both** sides compute the row total —
`money(item.priceNum * item.qty)` at `design-inbox/src/components/commerce/CartRow.js:24`
and `runtime/src/components/commerce/CartRow.js:18`. That is client-side money
arithmetic in the accepted source; it belongs in the same W4 money ticket as C-01.

### C-08 · `gap` · MED · `ProductCard` lost the accepted wave-13 entity-scoped add lifecycle

- Runtime: `runtime/src/components/commerce/ProductCard.js:1-19`.
- Design: `design-inbox/src/components/commerce/ProductCard.js:1-23`.

| accepted element | design | runtime |
| --- | --- | --- |
| `cmdPhase("cart.addItem:" + p.name)` | `:10` | absent |
| `data-state` on `[data-visual-id="product-card"]` | `:11` | `:8` — attribute not emitted |
| pending "Adding…" on the Add button | `:20` | `:16` — no `pending`/`pendingLabel` |
| "Retry add" label on `failed`/`conflict` | `:19` | `:16` — always "Add"/"Contact" |
| `state: "failed"` on the button | `:20` | absent |

### C-09 · `invention` · MED · `ProductCard` adds an undesigned Contact affordance and fabricated fallback text

`runtime/src/components/commerce/ProductCard.js:16`:

```js
label: p.allowedActions && p.allowedActions.includes("support.open") ? "Contact" : "Add",
action: p.allowedActions && p.allowedActions.includes("support.open") ? "support.open" : "cart.addItem",
```

The design (`design-inbox/src/components/commerce/ProductCard.js:19`) always
renders `Add` / `cart.addItem`. A "Contact" product card is a state the accepted
design never described.

Two fabricated fallbacks in the same file:

- `:11` — `p.tag || p.code || "Catalog"` under `data-bind="product.tag"`; design
  `:14` is `p.tag`. A product with no tag gets the literal **"Catalog"**, and one
  with no tag but a code shows its PIM code where the accepted design shows a tag.
- `:13` — `p.blurb || p.description || p.cta` under `data-bind="product.blurb"`;
  design `:16` is `p.blurb`. Falling back to `cta` puts call-to-action text in the
  description slot.

### C-10 · `invention` · MED · The shop card fabricates a product blurb

`runtime/src/routes/SpaShopPage.js:36`:

```js
h("div", { "class": "spa-shop-card__blurb", "data-bind": "pim.products[].shortDescription" }, product.blurb || product.description || "Published retail product"),
```

Design counterpart `design-inbox/src/routes/SpaShopPage.js:63` renders `p.blurb`
only. **"Published retail product"** is invented catalogue copy presented under a
binding that promises the published `shortDescription`. It is the only new
user-visible string on the shop surface.

### C-11 · `drift` · LOW · `PricingCard` parameterized beyond the accepted signature

| prop | design | runtime |
| --- | --- | --- |
| price suffix | hardcoded `"/mo"` — `design-inbox/src/components/commerce/PricingCard.js:12` | `props.suffix \|\| "/mo"` — `runtime/src/components/commerce/PricingCard.js:12` |
| CTA label | `"Activate plan"` — `:17` | `props.ctaLabel \|\| "Activate plan"` — `:17` |
| CTA action | `"booking.open"` — `:17` | `props.action \|\| "booking.open"`, plus new `id: props.actionId` — `:17` |

Defaults preserve the accepted render, so the component alone is not a defect.
It becomes one at the call site: `runtime/src/routes/PricingPage.js:22` passes a
`suffix` derived from `plan.interval`, and `:32` changes the "Pay as you go" card
to `price: "Per ritual"` / `tag: "Current total is shown before confirmation"`
against the accepted `"$0"` / `"Standard rates per visit"`
(`design-inbox/src/routes/PricingPage.js:42-43`). `PricingPage.js` is **outside my
owned scope** — routed to whoever owns the generic portal routes, flagged here
because the component is mine.

### C-12 · `drift` · LOW · `product-model-list` carries `data-state="ready"` that the design source omits

- Runtime: `runtime/src/routes/SpaShopPage.js:142` —
  `…"data-visual-id": "product-model-list", "data-state": "ready"`.
- Design source: `design-inbox/src/routes/SpaShopPage.js:180` — same element, **no
  `data-state`**. (Both sides emit `data-state="unavailable"` on the fallback
  notice: runtime `SpaShopPage.js:152`, design `:192`.)

This is the **only** attribute-value difference across all five owned routes.

**The runtime is the side that matches the accepted contract.** The design
manifest declares `product-model-list` with `"states": ["ready","unavailable"]`
and the note "OPTIONAL ProductModel enrichment on the Shop (**data-state on the
container**)" — `design-inbox/manifest.json` `components[190]`. The design
*source* does not emit the `ready` value its own manifest declares.

Route: **accept, no runtime change.** Record the design-source/manifest
inconsistency for the designer. Verified harmless to the suites: the wave-17
check selects `[data-visual-id="product-model-list"]` without a state predicate
(`scripts/calm-harbor-wave17-visual-check.mjs:11,35`) and compares pixels, which
an attribute does not affect.

### C-13 · `drift` · LOW · "Other products" heading hardcoded instead of read from the catalog

- Runtime: `runtime/src/routes/SpaShopPage.js:113` — literal `"Other products"`.
- Design: `design-inbox/src/routes/SpaShopPage.js:142` — `CAT.othersLabel`, i.e.
  `design-inbox/data/fixtures.js:1043`.

The value is identical on both sides and the field still exists in the runtime
data (`runtime/data/spa-product-catalog.js:19`), so there is **no copy change**.
What is lost is the binding: the label can no longer be changed from data.

### C-14 · `decision` · Live route state resolved from `moduleStatus` rather than the fixture scenario

| surface | runtime | design |
| --- | --- | --- |
| Shop | `SpaShopPage.js:122` (`liveView`), `:123` (root `data-state`), `:133` (`view:` on the gate) | `SpaShopPage.js:153`, `:168` — `state.view` |
| Product detail | `SpaProductDetailPage.js:156,159,162` | `SpaProductDetailPage.js:220,224` — `state.view` |
| Catalog | `SpaCatalogPage.js:56,57,71` | `SpaCatalogPage.js:54,67` — `state.view` |

Recorded decision, not drift:
`docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S4.md`
§3 — "It now resolves `state.moduleStatus.plan` first, exactly as
`SpaPurchasesPage` does, so live loading, error, and unauthorized reach the gate.
That is a transfer of an existing accepted pattern, not a new one."

The rendered states are unchanged; only their source moved. **Not a defect.**

### C-15 · `drift` · LOW · Checkout was not migrated to `moduleStatus` while its siblings were

`runtime/src/routes/SpaCheckoutPage.js:109` still reads
`state.view !== "ready" ? state.view : demo`, and the gate at `:124-134` passes no
`view:`, i.e. it falls back to `state.view` — the fixture scenario. Design
counterpart `design-inbox/src/routes/SpaCheckoutPage.js:83,98-108` is identical,
so this is *faithful to the design*; the drift is **internal inconsistency**
against C-14's three siblings. In live mode the checkout route lifecycle
therefore cannot show a module-driven `loading`/`error`/`unauthorized`.

Route: decide deliberately — either accept (checkout has no module of its own)
or extend C-14's pattern. Recorded so it is a decision rather than an oversight.

### C-16 · `decision` · Data sourced through state selectors instead of direct `F.*` fixture reads

| surface | runtime | design |
| --- | --- | --- |
| Shop | `SpaShopPage.js:5,9,21,140,144` — `productItems()`, `productDetailByCode()`, `spaProductModels()` | `SpaShopPage.js:22,27,29-30,176,182` — `F.themes["Beauty"].products`, `F.spaCommerce.productCatalog` |
| Catalog | `SpaCatalogPage.js:13,54,55,82,104,130,144` — `spaCatalogServices()`, `spaPlanOffers()` | `SpaCatalogPage.js:78,100,126,140` — `F.spa.pim.services`, `F.spaCommerce.planOffers`, `F.spa.pim.memberships` |
| Product detail | via `currentProduct()`, `productReviews()`; `F` import dropped | `SpaProductDetailPage.js:24` imports `F` |
| Checkout | `spaPlanOffers()` at `:15,41` | `F.spaCommerce.checkout.planQuotes` at `:25` |

Per `ARCHITECTURE.md` §"Adapter And Data-Mode Truthfulness" and the normalizer
boundary: components must not consume raw payloads, and the current baseline is
explicitly progressing away from direct `F.*` consumption. Renders identically in
fixture mode. **Not a defect** — but it is the vector for C-10, C-17 and C-18,
because the selectors invent values the fixtures supplied honestly.

### C-17 · `invention` · MED · The browse-only membership list is synthesized from plan offers under a `pim.memberships[]` binding

`runtime/src/routes/SpaCatalogPage.js:144-145`:

```js
planOffers.filter(function (offer) { return offer.kind === "MEMBERSHIP"; }).forEach(function (offer) {
  var m = { code: offer.productCode || offer.ref, name: offer.title, shortDescription: offer.termsSummary, displayPrice: offer.displayPrice, interval: "" };
```

Design counterpart `design-inbox/src/routes/SpaCatalogPage.js:140` iterates
`F.spa.pim.memberships` — a distinct published collection.

Three consequences:

1. The bindings at `runtime/src/routes/SpaCatalogPage.js:148,149,151` still claim
   `pim.memberships[].name`, `.shortDescription`, `.displayPrice` while the values
   now come from plan offers. The binding no longer describes its source.
2. `interval: ""` is hardcoded, so the `" / " + m.interval` suffix at `:151` can
   **never** render — the accepted per-interval price display is dead in the
   closed-commerce branch (design `:146` renders it whenever `m.interval` exists).
3. Membership rows disappear entirely if the pricing module returns no
   `SPA_MEMBERSHIP` / `SPA_PACKAGE` rows, where the accepted source has its own
   memberships collection.

### C-18 · `invention` · MED · Live catalog and offer selectors fabricate description text, empty benefits and asserted sellability

Producer `runtime/src/state.js` (not owned — report only), rendered by
`runtime/src/routes/SpaCatalogPage.js`:

| fabrication | producer | render site | accepted source |
| --- | --- | --- | --- |
| `shortDescription: item.description \|\| "Published spa service"` | `state.js:279` | `SpaCatalogPage.js:85,111` (`pim.services[].shortDescription`) | `design-inbox/data/fixtures.js` service rows |
| `termsSummary: item.description \|\| "Published catalog offer"` | `state.js:298` | `SpaCatalogPage.js:35` (`planOffer.termsSummary`) | `design-inbox/data/fixtures.js:978-979` — real terms |
| `benefits: []` | `state.js:299` | `SpaCatalogPage.js:36` (`planOffer.benefits`) | `:978-979` — three benefits per offer |
| `sellability: "sellable"` | `state.js:300` | `SpaCatalogPage.js:24,27,45` (`plan-offer-card` `data-state`, buy gating) | `:978-979` — per-offer sellability |
| `allowedActions: ["purchase"]` | `state.js:301` | `SpaCatalogPage.js:26,45` | `:978-979` — per-offer allowed actions |

Live-mode dead presentation as a result:

- `.offer-benefits` (`SpaCatalogPage.js:36`) renders an **empty `<ul>`** on every
  offer.
- The `changed` treatment — attention note + "Reload offer"
  (`SpaCatalogPage.js:38-41`) — is unreachable.
- The `unavailable` treatment (`SpaCatalogPage.js:42`) is unreachable.
- The disabled buy button (`:45`, `disabled: !canBuy || sellability !== "sellable"`)
  can never disable, because both inputs are asserted true.

Same class of defect as C-06, on the plan-offer surface.

### C-19 · `drift` · LOW · `.link-action` gained a button reset in the runtime stylesheet

- Runtime: `runtime/styles/routes.css:654-669`.
- Design: `design-inbox/styles/routes.css:654` —
  `.link-action { font-weight: 600; font-size: 13px; color: var(--accent); cursor: pointer; }`.

Rule-level comparison of the whole stylesheet: **724 selectors on each side, zero
selector-set differences, and this is the only declaration difference in the
file.** No `.link-action` is rendered as a `<button>` in either tree, and every
added declaration (`appearance`, `margin`/`padding`/`border` zeroing,
`background: transparent`, `font-family`/`line-height: inherit`,
`text-align: left`, `text-decoration: none`) is a no-op on the `<span>`s my
surfaces emit (`SpaShopPage.js:129`, `SpaCartPage.js:49`,
`SpaCheckoutPage.js:116,134`, `SpaCatalogPage.js:90,134,156`,
`SpaProductDetailPage.js:160,173`).

Verdict: **zero visual delta on the commerce family.** Recorded so a later
responsive pass does not re-derive it. `base.css`, `components.css`, `shell.css`
and `tokens.css` are byte-identical between the two trees.

### C-20 · `drift` · LOW · `responsive.css` differs only by a trailing blank line

`design-inbox/styles/responsive.css` ends with a blank line after `:174`;
`runtime/styles/responsive.css` does not. No rule difference. Noted so it is not
re-reported as a responsive finding.

### C-21 · `invention` · MED · The live confirmation emits an undeclared `data-result-kind`, unaccepted sub-copy and a hardcoded pickup fact

Render site (owned): `runtime/src/routes/SpaCheckoutPage.js:57` (`data-result-kind`),
`:60` (`result.sub`), `:68` (`result.purchase.reference`), `:94`
(`result.fulfillment`).
Producer (not owned): `runtime/src/actions.js:415-421`.

| field | runtime live value | accepted values |
| --- | --- | --- |
| `kind` → `data-result-kind` | `"purchase"` (`actions.js:416`) | `retail` / `booking` / `plan` — `design-inbox/data/fixtures.js:1171,1175,1179,1183,1188,1193,1198` |
| `sub` | "The order was recorded in Core. This demo did not take a payment." (`actions.js:418`) | "Demo checkout completed — no charge was made." and the two variants — `:1171,1179,1193` |
| `purchase.reference` | `order.ref` (`actions.js:419`) — the opaque ref reused as the human reference | a distinct human reference, e.g. `CH-2431` — `:1172` |
| `fulfillment` | "Pickup at Harbor Front studio" (`actions.js:420`), a claim asserted with no server field | "Pickup — Harbor Front studio. We'll let you know when your items are ready." — `:1173` |

Aggravating: `scripts/calm-harbor-current-api-browser-check.mjs:151` asserts
`/recorded in Core/i` against `[data-visual-id="spa-confirmation"]`, so the
unaccepted copy is **pinned into the browser suite**. Correcting the copy will
fail that assertion; the suite must be updated with the same change.

Adjacent, produced by the booking flow and therefore routed to the appointments
owner rather than fixed here: `runtime/src/actions.js:469` emits
`headline: "Booking updated"` for a reschedule, where the accepted reschedule
readback headline is `"Booking confirmed"` (`design-inbox/data/fixtures.js:1198`).
It renders through my `SpaCheckoutPage.js:59`, so it is recorded here and
cross-referenced.

Also in the same producer: `runtime/src/actions.js:330` sets the live cart's
`fulfillment` to `{ label: "Pickup at the studio", detail: "Availability is
confirmed by the studio" }`, rendered by
`runtime/src/routes/SpaCartPage.js:119-120` under
`cart.fulfillment.label|detail`, against the accepted
`{ label: "Pickup — Harbor Front studio", detail: "Usually ready in 2 days · free" }`
(`design-inbox/data/fixtures.js:1283`). Same cluster as C-04/C-05: the accepted
strings assert an SLA and a price the server does not provide, so this belongs in
the checkout/fulfillment brief.

### C-22 · `design-gap` · LOW · `add-to-bag … succeeded-readback` is declared with no treatment in either source

`design-inbox/manifest.json` `components[193]` (`product-detail`) declares the
state list `["ready (3 images | 1 image | no media)", "loading",
"not-found (non-enumerating)", "error", "unauthorized",
"add-to-bag idle|pending|failed|conflict|succeeded-readback"]`.

`idle`, `pending`, `failed` and `conflict` all have treatments on both sides
(design `SpaProductDetailPage.js:204-211`, runtime `:145-149`).
**`succeeded-readback` has no distinct product-detail treatment in either
source** — the success signal is the recalculated bag, surfaced as the header
count on the shop (runtime `SpaShopPage.js:129`, design `:163`).

No runtime gap. Recorded so the D4 state matrix has no blank cell and the
designer can confirm that the bag count is the intended readback.

### C-23 · `gap` (inventory) · MED · The wave-14→17 commerce inventory is absent from `runtime/manifest.json` although the runtime emits it

`design-inbox/manifest.json` declares 722 component ids; `runtime/manifest.json`
declares 418. Every id below is **declared in the design manifest, emitted by the
runtime source, and undeclared in the runtime manifest** — the answer to the
brief's question is uniformly *present but undeclared*, never genuinely absent:

| component id | design manifest | runtime manifest | runtime source |
| --- | --- | --- | --- |
| `product-detail` | `components[193]` | absent | `SpaProductDetailPage.js:159` |
| `product-gallery` | `components[194]` | absent | `SpaProductDetailPage.js:26` |
| `product-model-list` | `components[190]` | absent | `SpaShopPage.js:142,152` |
| `product-model-section` | `components[191]` | absent | `SpaShopPage.js:91,111` |
| `product-review-card` | `components[196]` | absent | `SpaProductDetailPage.js:70` |
| `product-review-list` | `components[195]` | absent | `SpaProductDetailPage.js:80` |
| `variant-picker` | `components[174]` | absent | `SpaShopPage.js:46`, `SpaProductDetailPage.js:139` |
| `spa-shop-card` | `components[164]` + `[192]` (wave-17 enrichment) | absent | `SpaShopPage.js:29` |

Same condition for the rest of the commerce family, all emitted and all
undeclared in `runtime/manifest.json`: `spa-shop` (`SpaShopPage.js:123`),
`spa-shop-list` (`:81`), `product-gallery-thumb` (`SpaProductDetailPage.js:45`),
`product-facts` (`:178`), `spa-cart` (`SpaCartPage.js:48`), `cart-line` (`:23`),
`cart-totals` (`:104`), `cart-fulfillment` (`:117`), `cart-empty` (`:73`),
`spa-checkout` (`SpaCheckoutPage.js:109`), `checkout-contact` (`:158`),
`checkout-fulfillment` (`:168`), `checkout-lines` (`:182`), `checkout-payment`
(`:195`), `policy-ack` (`:204`), `spa-confirmation` (`:57`), `spa-catalog`
(`SpaCatalogPage.js:57`), `spa-service-list` (`:81`), `spa-service-card` (`:83`),
`spa-pricing-list` (`:101`), `spa-pricing-row` (`:106,146`), `plan-offer-list`
(`:129`), `plan-offer-card` (`:27`), `membership-options` (`:123,138`).

The design manifest is likewise incomplete for `data-bind`: its `dataBindings`
array carries none of `cart.*`, `checkout.*`, `product.*`, `retail.*`, `review.*`,
`planOffer.*`, `model.*` or `result.*`, all of which exist in the design source.
That is a **design-manifest** gap, not runtime drift.

Route: D1 owns the manifest reconciliation. Recorded here with the emission sites
so D1 does not have to re-derive them.

---

## 3. Per-file verdicts (every owned component has one)

| file | verdict | findings |
| --- | --- | --- |
| `runtime/src/routes/SpaShopPage.js` | faithful in composition; 4 findings | C-10, C-12, C-13, C-14/C-16 |
| `runtime/src/routes/SpaProductDetailPage.js` | **faithful — zero structural, hook and copy differences**; 1 recorded decision | C-14, C-16 (+ C-06, C-22 sourced elsewhere) |
| `runtime/src/routes/SpaCatalogPage.js` | faithful in composition; 2 inventions in the data it is fed | C-17, C-18, C-14/C-16 |
| `runtime/src/routes/SpaCartPage.js` | **byte-identical to the design source** (`diff` reports no difference); defects are entirely in the data supplied | C-01 |
| `runtime/src/routes/SpaCheckoutPage.js` | +25 lines: all live-mode plumbing, 4 findings inside it | C-02, C-04, C-15, C-21 |
| `runtime/src/components/spa/CommerceBits.js` | **byte-identical to the design source** — `UnavailableState`, `spaGate`, `SimulationBadge`, `KindChip`, `purchaseStatusBadge`, `MoneyRows`, `DetailSection` all match | none |
| `runtime/src/components/commerce/AddressCard.js` | faithful — only the first-line file-path comment differs | none |
| `runtime/src/components/commerce/PaymentMethodCard.js` | faithful — only the first-line file-path comment differs | none |
| `runtime/src/components/commerce/ServiceCard.js` | faithful — only the first-line file-path comment differs | none |
| `runtime/src/components/commerce/CartRow.js` | lifecycle removed | C-07 |
| `runtime/src/components/commerce/ProductCard.js` | lifecycle removed + inventions | C-08, C-09 |
| `runtime/src/components/commerce/PricingCard.js` | parameterized | C-11 |
| `runtime/styles/{base,components,shell,tokens}.css` | byte-identical | none |
| `runtime/styles/routes.css` | 724/724 selectors identical, one declaration difference | C-19 |
| `runtime/styles/responsive.css` | trailing newline only | C-20 |

A second consumer note, outside owned scope but material: the design's
`PricingPage.js` imports `ProductCard` and `CartRow`
(`design-inbox/src/routes/PricingPage.js:6-7`); the runtime's imports only
`PricingCard` (`runtime/src/routes/PricingPage.js:5`). That is a route-level
composition difference on a surface I do not own — flagged for whoever audits the
generic portal routes, not counted in my totals.

---

## 4. Wave-17 accepted presentation — declaration vs emission

| accepted component | declared in `design-inbox/manifest.json` | declared in `runtime/manifest.json` | emitted by the runtime source | verdict |
| --- | --- | --- | --- | --- |
| `product-detail` | yes | no | yes | present, undeclared (C-23) |
| `product-gallery` | yes | no | yes | present, undeclared (C-23) |
| `product-model-list` | yes (`states: ready\|unavailable`) | no | yes, both states | present, undeclared (C-23); `ready` value differs from the design *source* (C-12) |
| `product-model-section` | yes | no | yes, incl. the `--others` variant | present, undeclared (C-23) |
| `product-review-card` | yes | no | yes | present, undeclared (C-23) |
| `product-review-list` | yes (`states: ready\|empty\|loading\|unavailable\|error`) | no | yes, all five | present, undeclared (C-23) |
| `variant-picker` | yes | no | yes, on both shop and detail | present, undeclared (C-23); unreachable live (C-06) |
| `spa-shop-card (wave 17 enrichment)` | yes | no | yes — media + identity in one open button, Add as a sibling, no nested interactive | present, undeclared (C-23); blurb fallback invented (C-10) |

---

## Judgment calls

Recorded here for the operator to merge into `audits/A1.md` at closeout — three
agents are writing concurrently, so A1 is not edited directly.

1. **Findings against producers outside the owned file set.** C-01, C-03, C-06,
   C-18 and C-21 originate in `runtime/src/state.js` and `runtime/src/actions.js`,
   which are not owned commerce presentation files. I filed them anyway, citing
   both the producer line and the owned render site, because the user-visible
   defect appears on a commerce surface and dropping them would have made the
   audit read as clean when it is not. No file outside my two findings files was
   modified.

2. **`data-state="ready"` (C-12) classified as `drift` against the design source,
   not against the runtime.** The design *manifest* explicitly declares the state
   and says "data-state on the container"; the design *source* omits it.
   `ARCHITECTURE.md` §"Accepted Design Metadata Reconciliation" gives current
   manifest arrays precedence for inventory reconciliation, so the runtime is the
   compliant side. Routed as accept-with-reason rather than a runtime fix.

3. **Line-count deltas proved mechanically rather than argued.** Rather than
   assert "the runtime is more compact", both sides were reduced to element
   signatures and attribute-value sets. That is why §1a can state 76 = 76 with
   zero differences. The extraction scripts were throwaway and were kept out of
   `scripts/` per D1's instruction; they are reconstructable from §Method.

4. **Fixture-mode arithmetic is not filed as a defect.** `spaServerCart`
   (`design-inbox/data/fixtures.js:1273-1285`) computes an 8 % tax, and the
   runtime fixture does the same (`runtime/data/fixtures.js:809-821`). A fixture
   standing in for a server response may legitimately produce the figures the
   server would. C-01 is scoped strictly to **live / `current-api` mode**, where
   `runtime/src/actions.js:316-332` performs the same arithmetic in production
   command code.

5. **`CartRow`'s client-side line total was filed against both sides.** Rather
   than exempt it because the design does it too, C-07 records it as a note
   against the accepted source and routes it into the same money ticket. The
   honesty rule cuts both ways.

6. **`PricingPage.js` consumer copy differences (C-11) were recorded but not
   audited.** The route is outside my owned scope; the two strings noted were
   observed while checking whether `PricingCard`'s new props are exercised, and
   the route itself is routed to its owner rather than expanding scope.

7. **Concurrent-agent working tree.** At the start of this slice
   `git status --short` showed three untracked paths belonging to other agents:
   two transient suite cache directories under `app-templates/customer-portal/`
   (`.calm-harbor-portal-manual-customer-check/`,
   `.calm-harbor-portal-manual-wave14-visual-check/`) and
   `evidence/responsive/`. None were touched. By the time this slice committed,
   the cache directories had been cleaned by their own suite runs and
   `evidence/responsive/` had been committed by the D5 agent (`a66ae1c`), so the
   final `git status --short` is exactly the two owned findings files.
