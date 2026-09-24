# D3 — Copy and stable hooks: ACCOUNT surface family

Date: 2026-07-28. Slice D3. Companion to `findings-components-account.md`.

Surfaces: `SpaPurchasesPage`, `SpaPurchaseDetailPage`, `SpaPlanPage`,
`SpaProfilePage`, `SpaAccountPage`, `SpaOrdersPage`, `components/profile/StatCard.js`.

No runtime file was edited. No `design-inbox/**` file was read as anything but
the reference.

---

# Part 1 — Stable hooks

## 1.1 Which hooks are actually selected on

Read from the check scripts rather than guessed:

| script | selectors it uses on account surfaces |
| --- | --- |
| `scripts/calm-harbor-wave14-visual-check.mjs:14` | `spa-orders`, `spa-order-list`, `spa-order-row` (+ `top-nav`) |
| `scripts/calm-harbor-wave15-visual-check.mjs:11-14` | `spa-account`, `account-entry-list`, `account-entry-purchases`; `spa-purchases`, `purchase-list`, `purchase-row`; `spa-purchase-detail`, `purchase-summary`, `purchase-items`; `spa-plan`, `plan-list`, `plan-card` |
| `scripts/calm-harbor-wave16-visual-check.mjs:14` | `spa-profile`, `spa-profile-contact`, `spa-profile-preferences` |
| `scripts/calm-harbor-wave17-visual-check.mjs:14` | `spa-orders`, `spa-order-list`, `order-thumb` |
| `scripts/calm-harbor-current-api-browser-check.mjs:178,179,181-185` | `[data-purchase-ref^="order-core-"]`, `[data-module="purchase-list"]`, `profile-edit`, `profile-save`, `[data-bind="profile.email"]` |

All three visual scripts resolve them the same way — `[data-visual-id="<id>"]`
at `wave14:41-46`, `wave15:41-46`, `wave16:35,43-44`, `wave17` — so a
`data-visual-id` change is a suite break, not a cosmetic edit.

## 1.2 Contract verdict: intact, with one runtime-only addition

Set comparison of every `data-visual-id`, `data-module`, `data-bind` and
`data-action` literal in each owned route against its design counterpart:

| surface | runtime-only | design-only |
| --- | --- | --- |
| `SpaPurchasesPage.js` | — | — |
| `SpaPurchaseDetailPage.js` | — | — |
| `SpaPlanPage.js` | `data-visual-id="plan-current-api-unavailable"`, `data-module="unavailable-state"` (second occurrence) | — |
| `SpaProfilePage.js` | — | — |
| `SpaAccountPage.js` | — | — |
| `SpaOrdersPage.js` | — | — |

**Verdict: the hook contract is intact on all six surfaces except one runtime-only
`data-visual-id` on the plan route.** No hook was renamed, none was dropped from
the source, and every id the check scripts select on is present.

### HK-01 — `plan-current-api-unavailable` · `invention` · see AC-C15

- runtime `runtime/src/routes/SpaPlanPage.js:93`
- design counterpart: **absent** — 0 matches across 315 `design-inbox/` files.

The accepted id for this treatment is `unavailable-state`
(`runtime/src/components/spa/CommerceBits.js:15` = design `:15`). The block
reuses `data-module="unavailable-state"` while inventing a new
`data-visual-id`, so a suite selecting the module hook finds two different
components under one module name. Not selected by any current script, so
nothing breaks today.

## 1.3 Hooks that disappear at runtime under live configuration

These are not renames — the source is unchanged — but the DOM contract is
mode-dependent, which a future suite must know.

### HK-02 — `spa-profile-preferences` and `profile-preference` are absent in live mode · consequence of `decision` AC-C23a · **medium**

- runtime `runtime/src/routes/SpaProfilePage.js:125` — `if (!live) {` wraps
  `:126` (`data-visual-id="spa-profile-preferences"`) and `:134`
  (`data-visual-id="profile-preference"`, `data-pref-key`)
- design `design-inbox/src/routes/SpaProfilePage.js:123,131` — unconditional

`scripts/calm-harbor-wave16-visual-check.mjs:14` lists
`spa-profile-preferences` among its metrics. That script drives
`runtime/calm-harbor-spa-target.html`, which is `data-portal-data-mode="fixture"`
(`:30`), so it still resolves — the suite passes for a reason unrelated to live
correctness. Any live-mode visual check must not select it. The bindings
`profile.preferences[].label` and `profile.preferences[].value` disappear with
the panel.

### HK-03 — `data-profile-version` is absent in live mode · `drift` · low

- runtime `runtime/src/routes/SpaProfilePage.js:62` —
  `"data-profile-version": live ? undefined : F.spaProfileSrv.version`
- design `design-inbox/src/routes/SpaProfilePage.js:59` — always present

`runtime/src/dom.js:9` (`if (v == null || v === false) return;`) drops the
attribute entirely. Nothing selects on it today, but it is the only DOM evidence
of the optimistic-concurrency contract the conflict banner (`:71-78`) exists to
serve.

### HK-04 — `data-bind="profile.phone"` is absent when Core returns no contact · consequence of `decision` AC-C20 · low

- runtime `runtime/src/routes/SpaProfilePage.js:84` —
  `if (confirmed.phone != null) ro.appendChild(…)`
- design `design-inbox/src/routes/SpaProfilePage.js:80-83` — unconditional

Correct per `.../evidence/S3.md` §4b; recorded because a selector on
`[data-bind="profile.phone"]` is not safe to assume.

### HK-05 — `[data-purchase-ref^="order-core-"]` prefix contract · `decision` · confirmed intact

- assertion `scripts/calm-harbor-current-api-browser-check.mjs:178`
- render site `runtime/src/routes/SpaPurchasesPage.js:20`
- ref producer `runtime/src/adapters/core-orders-adapter.js:308-309`

`.../evidence/S3.md` §4: "Ref prefixes stay `order-core-*` … The accepted
fixture's `pur-*` refs are fixture-only, and `[data-purchase-ref^="order-core-"]`
in the browser check is an existing production contract." Confirmed on both
sides. Note the assertion has never been executed — see §3 Not checked.

## 1.4 Recorded greps — every one verified to hit

**Correction first.** The example grep in
`docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/slices.md:91` —
`rg -n 'data-visual-id="plan-card"' …/SpaPlanPage.js` — **does not hit**. The
sources are JavaScript object literals, so the attribute name is quoted and
followed by `: `. Verified: that exact command returns no output and exit 1.
Every grep below uses the form that matches and is pasted with its hit. Run from
the repo root.

```
$ rg -n '"data-visual-id": "plan-card"' app-templates/customer-portal/runtime/src/routes/SpaPlanPage.js
35:  var card = h("div", { "class": "card card--pad plan-card", "data-module": "plan-card", "data-visual-id": "plan-card", "data-plan-ref": p.ref, "data-plan-kind": p.kind, "data-state": p.status === "Used up" ? "exhausted" : undefined }, [
```

```
$ rg -n 'data-purchase-ref' app-templates/customer-portal/runtime/src/routes/SpaPurchasesPage.js
20:  return h("article", { "class": "purch-row", "data-module": "purchase-row", "data-visual-id": "purchase-row", "data-purchase-ref": p.ref, "data-action": "purchase.open", "data-id": p.ref, tabindex: "0", role: "link" }, [
```

```
$ rg -n '"data-visual-id": "(spa-purchases|purchase-list|purchase-row)"' app-templates/customer-portal/runtime/src/routes/SpaPurchasesPage.js
20:  return h("article", { "class": "purch-row", "data-module": "purchase-row", "data-visual-id": "purchase-row", ... }, [
45:  var page = h("section", { "class": "page", "data-route": "purchases.list", "data-state": view, "data-visual-id": "spa-purchases", "data-module": "spa-purchases", ... });
93:  var card = h("div", { "class": "card", "data-module": "purchase-list", "data-visual-id": "purchase-list" });
```

```
$ rg -n '"data-visual-id": "(spa-purchase-detail|purchase-summary|purchase-items)"' app-templates/customer-portal/runtime/src/routes/SpaPurchaseDetailPage.js
58:  var page = h("section", { ... "data-route": "purchase.detail", ... "data-visual-id": "spa-purchase-detail", "data-module": "spa-purchase-detail", ... });
88:  var head = h("div", { "class": "card card--pad purch-head", "data-module": "purchase-summary", "data-visual-id": "purchase-summary", "data-purchase-ref": d.ref }, [
110:  var itemsCard = h("div", { "class": "card card--pad", "data-module": "purchase-items", "data-visual-id": "purchase-items" }, [
```

```
$ rg -n '"data-visual-id": "(spa-plan|plan-list)"' app-templates/customer-portal/runtime/src/routes/SpaPlanPage.js
83:  var page = h("section", { "class": "page", "data-route": "plan", "data-state": view, "data-visual-id": "spa-plan", "data-module": "spa-plan", ... });
129:  var grid = h("div", { "class": "plan-grid", "data-module": "plan-list", "data-visual-id": "plan-list" });
```

```
$ rg -n '"data-visual-id": "(spa-profile|spa-profile-contact|spa-profile-preferences)"' app-templates/customer-portal/runtime/src/routes/SpaProfilePage.js
31:  var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-state": view, "data-visual-id": "spa-profile", "data-module": "spa-profile", ... });
62:  var panel = h("div", { "class": "list-panel", "data-module": "spa-profile-contact", "data-visual-id": "spa-profile-contact", "data-state": panelState, "data-profile-version": live ? undefined : F.spaProfileSrv.version }, [
126:  var prefsPanel = h("div", { "class": "list-panel", "data-module": "spa-profile-preferences", "data-visual-id": "spa-profile-preferences", "data-state": editing ? "editing" : "ready" }, [
```

```
$ rg -n 'visualId: "profile-(edit|save)"' app-templates/customer-portal/runtime/src/routes/SpaProfilePage.js
87:    if (canEdit) panel.appendChild(h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Edit details", action: "profile.edit", visualId: "profile-edit" })));
117:      ActionButton({ variant: "btn--primary", label: "Save changes", action: "profile.save", visualId: "profile-save", pending: saving, pendingLabel: "Saving…", disabled: conflict }),
```

```
$ rg -n '"data-bind": "profile.email"' app-templates/customer-portal/runtime/src/routes/SpaProfilePage.js
85:    ro.appendChild(h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, "Email"), h("div", { "class": "appt-details__val" }, h("b", { "data-bind": "profile.email" }, confirmed.email))]));
```

```
$ rg -n '"data-visual-id": "(spa-account|account-entry-list)"|"data-visual-id": "account-entry-" \+ e.key' app-templates/customer-portal/runtime/src/routes/SpaAccountPage.js
35:  var page = h("section", { "class": "page", "data-route": "account", "data-state": state.view, "data-visual-id": "spa-account", "data-module": "spa-account", ... });
51:  var grid = h("div", { "class": "account-grid", "data-module": "account-entry-list", "data-visual-id": "account-entry-list" });
56:      "data-module": "account-entry", "data-visual-id": "account-entry-" + e.key, "data-state": avail
```

Note: `account-entry-purchases`, which `wave15-visual-check.mjs:11` selects, is
produced by the `"account-entry-" + e.key` template at `:56` with
`key: "purchases"` from `:15` — there is no literal to grep, which is why the
key list is the thing to assert on.

```
$ rg -n '"data-visual-id": "(spa-orders|spa-order-list|spa-order-row|order-thumb)"' app-templates/customer-portal/runtime/src/routes/SpaOrdersPage.js
22:  var attrs = { "class": "order-card__icon spa-order-thumb", "data-visual-id": "order-thumb", "data-media-kind": order.media && order.media.kind || "none", "aria-hidden": "true" };
47:  var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": routeState, "data-visual-id": "spa-orders", "data-capability": "current-staging", ... });
57:  var card = h("div", { "class": "card", "data-module": "spa-order-list", "data-visual-id": "spa-order-list" });
76:      listWrap.appendChild(h("article", { "class": "spa-order-row", "data-module": "spa-order-row", "data-visual-id": "spa-order-row", "data-order-ref": o.ref }, [
```

```
$ rg -n '"data-module": "purchase-list"' app-templates/customer-portal/runtime/src/routes/SpaPurchasesPage.js
93:  var card = h("div", { "class": "card", "data-module": "purchase-list", "data-visual-id": "purchase-list" });
```

```
$ rg -n '"order-core-" \+ id' app-templates/customer-portal/runtime/src/adapters/core-orders-adapter.js
308:    ref: "order-core-" + id,
309:    reference: "order-core-" + id,
```

```
$ rg -n 'data-purchase-ref\^="order-core-"' app-templates/customer-portal/scripts/calm-harbor-current-api-browser-check.mjs
178:  await page.waitForSelector('[data-purchase-ref^="order-core-"]');
```

Runtime-only hook, and its negative counterpart — both recorded deliberately:

```
$ rg -n '"data-visual-id": "plan-current-api-unavailable"' app-templates/customer-portal/runtime/src/routes/SpaPlanPage.js
93:    page.appendChild(h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "plan-current-api-unavailable", "data-state": "unavailable" }, [

$ rg -n 'plan-current-api-unavailable' app-templates/customer-portal/design-inbox/
(no output; exit 1 — the counterpart is absent)
```

---

# Part 2 — Copy

Only user-visible strings. Runtime text is the live-mode string where the
runtime branches on `live`; the fixture-mode string is identical to the design
unless noted. Verdicts: **match** · **transfer** (accepted phrasing carrying
live data) · **invention** (no design counterpart) · **false** (was true when
designed, is not true now).

## 2.1 Purchases (`purchases.list`)

| runtime text | design text | verdict |
| --- | --- | --- |
| "Purchases" / "Everything you've ordered, with its current state — exactly as our records show it." (`:46`) | same (`:43`) | match |
| "No purchases yet" + "Anything you order — a visit, shop items or a plan — will appear here with its current state." (`:63`) | same (`:59`) | match |
| "Couldn't load your purchases" + "Your purchases didn't load, so nothing is shown — we never show stale records. Nothing was changed; try again." (`:65`) | same (`:61`) | match |
| "Purchases aren't available yet" + "Purchase history isn't connected on this portal yet…" (`:67`) | same (`:63`) | match — but **never rendered** (AC-C03) |
| "Nothing under this filter" + "You have purchases, just not of this kind. Switch back to All to see everything." (`:95`) | same (`:91`) | match |
| "Show earlier purchases" (`:105`) | same (`:101`) | match — fixture mode only (AC-C05) |
| "Purchases aren't available on this portal yet" + "…Your raw order records — exactly as recorded — are on the Orders page." + "See your orders" (`:116-118`) | same (`:110-112`) | match — unreachable (AC-C09) |
| **"Amounts and raw Order states come from Core exactly as returned. Line items, receipts and payment history are not returned by this API."** (`:108`) | — | **CP-06 invention** |
| "Amounts and statuses come from our records exactly as written — receipts and payment history aren't part of this portal yet." (`:109`) | same (`:103`) | match (fixture branch) |
| pickup notice, e.g. "Ready — please pick up by Jul 29, 2026" (`:28` ← `core-orders-adapter.js:305`) | "Ready — please pick up by Jul 22" (`design-inbox/data/fixtures.js:861`) | **CP-04 transfer** |

### CP-04 — "Ready — please pick up by …" · **transfer, classified `decision`** · Known Starting Point 4

- runtime render `runtime/src/routes/SpaPurchasesPage.js:28` (identical to design `:28`)
- runtime assembly `runtime/src/adapters/core-orders-adapter.js:300-306` —
  `attention = "Ready — please pick up" + (fulfillment.windowEndLabel ? " by " + fulfillment.windowEndLabel : "");`
- design string `design-inbox/data/fixtures.js:861` —
  `attention: "Ready — please pick up by Jul 22"`

**Verdict: transfer, not invention.** Every word is the accepted string; the
only substituted token is the date, which in the design is fixture data
(`Jul 22`) and in the runtime is the real `Shipment` window end formatted by the
adapter. The component is byte-identical to the design and the string is built
in the normalizer, which is where `ARCHITECTURE.md` §Adapter And Data-Mode
Truthfulness puts shape logic. `.../evidence/S3.md` §4 records the same
treatment: "when a pickup is `READY` … it surfaces as
`customerStatus: "Ready for pickup"` with the accepted notice copy", with the
live result `Ready — please pick up by Jul 29, 2026`.

**One qualification, and it is a small `design-gap`.** When Core returns a
shipment with no `windowEnd`, the string degrades to bare
`"Ready — please pick up"`. The design never showed a dateless variant. Omitting
an absent date is the honest behaviour (`.../evidence/S3.md` §4: "An absent
window produces no date rather than the epoch"), so the runtime is right and the
design is silent. Add it to the pickup brief rather than filing it against the
runtime.

### CP-06 — the live footnote · `invention` · medium

- runtime `runtime/src/routes/SpaPurchasesPage.js:108`
- design `design-inbox/src/routes/SpaPurchasesPage.js:103` — the fixture
  sentence only; no live variant exists

Two problems beyond "not in the design":

1. **"raw Order states"** contradicts what the page renders. Since
   `.../evidence/S3.md` §4 the page shows the **mapped** customer vocabulary
   (`Confirmed`, `In progress`, `Ready for pickup`, `Fulfilled`, `Cancelled`)
   via `purchaseStatusBadge` (`CommerceBits.js:45-47`); the raw state is kept as
   `statusCode` and is not rendered. The footnote tells the customer they are
   seeing something they are not. The raw-state presentation belongs to
   `SpaOrdersPage`, a different route.
2. **"Line items … are not returned by this API"** is contradicted on the same
   screen: `runtime/src/adapters/core-orders-adapter.js:297,323` builds real
   lines and the `itemSummary` printed on every row at `:27` is derived from
   them — the live rows in S3 §4 read "2 × Harbor body oil",
   "Custom facial · Mineral bath soak". What Core does not return is the per-line
   **total** (AC-C11), which is a much narrower claim.

Highest-value copy finding on this surface: a sentence written to be honest that
now misdescribes the screen in two directions. Route: punch list, rewrite
against the design's sentence.

## 2.2 Purchase detail (`purchase.detail`)

| runtime text | design text | verdict |
| --- | --- | --- |
| "Purchase" / "Placed …" / "Items" / "Totals" / "Pickup" / "Your plan credit" / "Appointment" / "Your plan" | same, same line numbers | match |
| "Return requested — accepted for review. We'll confirm the next step; nothing is refunded or promised yet." (`:28`) | same (`:28`) | match |
| "Cancellation requested — accepted for review. The order stays as shown until the studio confirms; nothing is undone yet." (`:100-101`) | same (`:100-101`) | match |
| "Totals are recorded amounts — no payment was taken through this portal." (`:120`) | same (`:120`) | match |
| "Online shopping isn't open on this portal yet — the studio can help you reorder." (`:182`) | same (`:182`) | match |
| **"Line items are not returned by the current Core Order API. The recorded total and raw state are shown without guessing the contents."** (`:112`) | — | **CP-07 invention, and partly false** |

### CP-07 — the items-card note · `invention` · **high**

- runtime `runtime/src/routes/SpaPurchaseDetailPage.js:112`
- design `design-inbox/src/routes/SpaPurchaseDetailPage.js:112` — `linesBlock(d)`,
  no note

Structural verdict at AC-C10. On copy alone: "**raw state**" is wrong for this
page just as in CP-06 — `:92` renders `purchaseStatusBadge(d.customerStatus)`,
the mapped label, not the raw code. And the sentence would print on a purchase
whose lines Core *did* return but which failed to normalize, telling the
customer a fact about the API rather than about their order.

## 2.3 Plan (`plan`)

| runtime text | design text | verdict |
| --- | --- | --- |
| "My plan" / "Your packages and membership — balances and renewal, exactly as recorded." (`:85`) | same (`:80`) | match |
| "Package" / "Membership" chips, "<n> of <m> visits left" (`:26,37`) | same (`:26,37`) | match |
| "Renews" / "Expires" / "Ends" / "Price" (`:45-47`) | same (`:45-47`) | match |
| "Book with a credit", "Cancel renewal", "Cancelling…", "Buy this package again" (`:55,61,64`) | same (`:55,61,64`) | match |
| "Online booking isn't available yet — the studio books credit visits for you." (`:56`) | same (`:56`) | match |
| "Renewal wasn't cancelled — your membership is unchanged." / "Your plan changed since you opened it — reload before making changes." (`:59-60`) | same (`:59-60`) | match |
| "Couldn't load your plan" + "…we never guess remaining visits…" (`:111`) | same (`:90`) | match |
| "My plan isn't available yet" + "Plan balances aren't connected on this portal yet. Published membership options are in Services & prices." (`:113-114`) | same (`:92-93`) | match — **never rendered** (AC-C03) |
| "You don't have a plan yet" + "Packages and membership you buy will live here…" (`:122-123`) | same (`:101-102`) | match |
| "Balances, renewal dates and prices are shown exactly as recorded on your plan — this page never estimates or projects them." (`:132`) | same (`:111`) | match |
| **"Personal plan details aren't in the current API"** + "You can order a published package or membership now. The resulting Core Order appears in Purchases, but visit balances and renewal controls need a customer entitlement API." + "See membership options" (`:95-97`) | — | **CP-08 invention, and now false — but correctly gated off** |

### CP-08 — "Personal plan details aren't in the current API" · `invention` (string had no design source) with a `decision` gate · Known Starting Point 3

- runtime `runtime/src/routes/SpaPlanPage.js:95-97`, gate at `:92`
- design counterpart: **absent** (0 matches, 315 files)

`.../evidence/S4.md` §3: "That was true when the design was accepted. After S3
it is not: packages and memberships now come from Core." Confirmed. The gate
now requires `!isModuleEnabled("plan")`, and all three shipped configs enable
the module, so **the false sentence is not shown to anyone** and the accepted
plan-card path at `:102-133` renders instead. The `decision` is sound and
verified; the string itself still has no design counterpart.

## 2.4 Profile (`profile`)

| runtime text (live) | design text | verdict |
| --- | --- | --- |
| "Profile" (`:33`) | same (`:31`) | match |
| **"Your email from Core. Phone and preferences are not exposed by the current API."** (`:33`) | "Your contact details and preferences — nothing else is stored here." (`:31`) | **CP-09 invention** |
| "Contact details" / "Phone" / "Email" / "Edit details" / "Save changes" / "Discard" / "Saving…" (`:64,84-87,117-118`) | same (`:61,80-84,114-115`) | match |
| "Unsaved changes" / "No changes yet" (`:66`) | same (`:63`) | match |
| "Your profile changed since you opened it" + "Nothing was saved. Reload the latest details and review them before editing again." + "Reload profile" (`:74-77`) | same (`:71-74`) | match |
| "Your changes weren't saved — the details on file are unchanged." (`:112`) | same (`:109`) | match |
| "Changes apply only once the studio's system confirms them." (`:119`) | same (`:116`) | match |
| "Couldn't load your profile" + "…we never show stale or guessed values…" (`:44`) | same (`:44`) | match |
| "Profile isn't available yet" + "Profile editing isn't connected on this portal yet — our team can update your details for you." (`:46`) | same (`:46`) | match — **never rendered** (AC-C03) |
| **"Phone and visit preferences are not returned by the current Core User API, so this portal does not show or edit them."** (`:147`) | — (design renders the Preferences panel, `:123-142`) | **CP-10 invention, and partly false** |
| **"The email above is read from the signed-in Core User and saved back only after Core confirms it."** (`:150`) | "This page holds only your contact details and the preferences above — exactly as the studio's system returns them." (`:144`) | **CP-11 invention** |
| "Preferences" / "about your visits only" / "Use Edit details above to change these." (`:128-129,144`) | same (`:126-127,141`) | match — fixture mode only (HK-02) |

### CP-09 — the live page subtitle · `invention` · medium

"Your email from Core" names an internal system to a spa customer. The design's
voice throughout this family is the studio's ("our records", "the studio's
system", `design-inbox/.../SpaProfilePage.js:31,144`). "Core" appears nowhere in
`design-inbox/`. Same objection applies to CP-06, CP-07, CP-10, CP-11 — five
strings that leak the backend product name into customer copy.

### CP-10 — the preferences substitute note · `invention`, and one clause is **false** · **high**

- runtime `runtime/src/routes/SpaProfilePage.js:147`
- design counterpart: **absent**

"**Phone** … not returned by the current Core User API" is contradicted by the
same page and by the program record. `.../evidence/S3.md` §4b: "**Phone comes
from the customer Account's contact entries** … Live result: `email
opanagushin@gmail.com`, `phone +1 512 555 0143`". The runtime renders that phone
at `:84` whenever it exists, immediately above this sentence. What is true is
that phone is **read-only** (no scoped contact write contract) and that
**preferences** have nowhere to persist. The sentence conflates the two and
denies a field the page is displaying.

This is the second-highest-value copy finding in the family. Structural verdict
at AC-C23b; the copy needs rewriting whether or not the treatment is rebriefed.

### CP-11 — the live catalog note · `invention` · low

Accurate and consistent with `.../evidence/S3.md` §4b's save-and-readback path,
but it names "Core" (CP-09) and drops the design's scope promise ("This page
holds **only** your contact details…"), which was the sentence's point.

## 2.5 Account (`account`)

| runtime text | design text | verdict |
| --- | --- | --- |
| "Account" / "Signed in as <name>" (`:36`) | same (`:25`) | match |
| "Purchases" + "Everything you've ordered — services, shop items and plans, with their current state." (`:15`) | `design-inbox/data/fixtures.js:838-840` | match (verbatim, AC-C26) |
| "My plan" + "Your packages and membership — remaining visits, renewal and valid actions." (`:16`) | `…fixtures.js:841-843` | match — **but not shown**, see CP-12 |
| "Profile" + "Your contact details and preferences." (`:17`) | `…fixtures.js:844-846` | match |
| "Support" + "A support destination hasn't been set up for this portal yet." (`:18`) | `…fixtures.js:847-849` | match |
| "Not available yet" chip (`:60`) | same (`:49`) | match |
| "Open purchases ›" / "Open profile ›" / "Membership options ›" / "See your orders ›" (`:69,71,73`) | same (`:54,56,58`) | match |
| "Couldn't load your account" + "…we never show stale sections…" (`:45`) | same (`:34`) | match |
| "Account isn't available yet" + "This part of the portal isn't connected yet. Your visits and catalog pages still work as usual." (`:47`) | same (`:36`) | match — **never rendered** (AC-C03) |
| "Sections appear here as they're connected for your account — nothing is shown from guesses." (`:79`) | same (`:64`) | match |
| **"Published packages and memberships can be ordered now. A personal balance or renewal record is not exposed by the current API."** (`:65`) | — | **CP-12 invention, and FALSE IN PRODUCTION** |

### CP-12 — the Account page tells the customer their plan balance does not exist · `invention` · **HIGHEST SEVERITY IN THIS FAMILY**

- runtime `runtime/src/routes/SpaAccountPage.js:64-65`, gated by `:23-26`
- design counterpart: **absent** — `design-inbox/src/routes/SpaAccountPage.js:51`
  has no per-key copy override, and `spaCurrentApiDemoOpen` has 0 matches in
  `design-inbox/`

Reachable **today, in the deployed package**: `spaCurrentApiDemoOpen()`
(`runtime/src/state.js:346-348`) is true whenever `demoCommands: "current-api"`
and `dataMode: "live"`, both set at
`content/cases/calm-harbor-spa.customer-portal-staging.json:15,33`.

The sentence was true before `.../evidence/S3.md` §3 and is false after it. S3
§3 records three live plans with balances (`Harbor reset series` 4/5,
`Skin ritual trio` 0/3), a renewal record (`Harbor membership`, `$18 / month`)
and live actions (`bookWithCredit`, `cancelRenewal`). `SpaPlanPage` renders
exactly that at the same moment (AC-C15(a)).

Compounding it, the same branch marks the entry "unavailable", which swaps the
foot link from "Open my plan ›" to "Membership options ›" (`:72-73`) — so the
one navigation path to the working plan page is removed from the Account
overview.

This is the identical defect `.../evidence/S4.md` §3 found and fixed on
`SpaPlanPage` ("A message that had become false"), left unfixed on the surface
that links to it. It is the single highest-value finding in this audit family:
a string that was true when designed, is not true now, and is on screen in
production.

## 2.6 Orders (`orders.list`, current-staging — unreachable in every shipped config)

| runtime text | design text | verdict |
| --- | --- | --- |
| "<greeting>" / "Here's what's on your account." (`:48`) | same (`:47`) | match |
| "Your orders" / "Read-only" (`:59-60`) | same (`:58-59`) | match |
| "Couldn't load your orders" + "…we never show stale records…" (`:52`) | same (`:51`) | match |
| "No orders on your account yet" + "Anything recorded on your account will appear here, exactly as our records show it." + "Browse services" (`:70-72`) | same (`:69-71`) | match |
| "Reference <ref>" (`:81`) | same (`:79`) | match |
| "Statuses and amounts appear exactly as recorded on your account — this view is read-only. Scheduling details and online changes aren't part of these records." (`:94`) | same (`:92`) | match |
| **"—"** as the total when Core omits `grandTotal` (`:103`) | design rows always carry a real total (`design-inbox/data/fixtures.js:773-776`) | **invention**, see AC-C29 |
| **"UNMAPPED"**, **"Order"**, **"ORDER"** fallbacks (`:106-108`) | design rows always carry real values | **invention**, see AC-C30 |

Every authored sentence on this surface matches the design. The only copy
findings are the machine-generated fallbacks in `liveOrder()`, covered
structurally at AC-C29/AC-C30.

## 2.7 StatCard

No user-visible string of its own — it renders the label and number its caller
passes. `runtime/src/components/profile/StatCard.js:4-11` is byte-identical to
`design-inbox/src/components/profile/StatCard.js:4-11`. No finding.

---

# Part 3 — Summary and honest limits

## Copy findings by verdict

| verdict | count | ids |
| --- | --- | --- |
| match | 63 strings across 7 surfaces | — |
| transfer (`decision`) | 1 | CP-04 |
| invention | 6 | CP-06, CP-07, CP-08, CP-09, CP-10, CP-11, CP-12 (7 strings; CP-08 and CP-12 are also *false*) |
| false (a subset of the above) | 3 | CP-12 (live), CP-06 (two clauses), CP-10 (one clause); CP-08 is false but correctly gated off |

## Strings that changed meaning — ranked

1. **CP-12** — Account: "A personal balance or renewal record is not exposed by
   the current API." **On screen in production; contradicted by the plan page
   beside it.**
2. **CP-10** — Profile: "**Phone** … not returned by the current Core User API",
   printed under the phone number the page renders.
3. **CP-06** — Purchases: "raw Order states" and "Line items … not returned",
   both contradicted by the rows above the footnote.
4. **CP-08** — Plan: "Personal plan details aren't in the current API" — false
   since S3, correctly gated off since S4. No customer impact; string retained.

## Not checked — named honestly

- **No page was rendered.** This is a source-level audit. Playwright is not
  installed here; `.../evidence/S3.md` §7 and `.../evidence/S4.md` §4 record the
  same gap and confirm it reproduces with all changes stashed. Nothing in this
  file is a pixel or DOM claim, and no suite is reported as passed.
- **`[data-purchase-ref^="order-core-"]` (HK-05) has never been executed.**
  `.../evidence/S4.md` §4 lists it among the unrun assertions. The source-side
  contract is verified on both ends; the browser assertion is not.
- **`data-visual-id` presence is verified in source, not in the DOM.** For
  hooks emitted from a template (`"account-entry-" + e.key`) or gated by mode
  (HK-02, HK-03, HK-04) only a rendered check can confirm the final attribute.
- **Fixture-mode copy for the Care, appointments and commerce families** is out
  of this agent's scope and untouched here.
- **`runtime/manifest.json` was read but not reconciled** — that is D1's file.
  The account-family omissions are listed in `findings-components-account.md`
  §Cross-references.
- **`seo.css` (107 diff lines)** was seen while diffing the stylesheet
  inventory and deliberately not analysed; it belongs to no account surface.
