# D2 — Component findings: ACCOUNT surface family

Date: 2026-07-28. Slice D2. Surface family: Account (Purchases, Purchase detail,
Plan, Profile, Account overview, Orders, StatCard).

Reference: `app-templates/customer-portal/design-inbox/src/routes/**` (read-only,
verified clean — `git status --short app-templates/customer-portal/design-inbox/`
is empty and the tree last changed at `224bd57 feat(customer-portal): accept the
wave 17 design intake`).

Runtime: `app-templates/customer-portal/runtime/src/**`. **No runtime file was
edited by this slice.** Every removal below is recorded for the operator.

All paths are relative to the repo root.

## Coverage

Every component in all six owned routes plus `StatCard.js` has a verdict. No
sampling.

| runtime file | design lines | runtime lines |
| --- | --- | --- |
| `.../routes/SpaPurchasesPage.js` | 114 | 120 |
| `.../routes/SpaPurchaseDetailPage.js` | 190 | 190 |
| `.../routes/SpaPlanPage.js` | 113 | 134 |
| `.../routes/SpaProfilePage.js` | 146 | 152 |
| `.../routes/SpaAccountPage.js` | 66 | 81 |
| `.../routes/SpaOrdersPage.js` | 95 | 113 |
| `.../components/profile/StatCard.js` | 12 | 12 |

Counts by classification: **`invention` 8 · `gap` 2 · `drift` 8 · `decision` 12 ·
`design-gap` 5** — 35 findings.

## Configuration reachability (this shapes every severity below)

Three shipped Calm Harbor configurations exist. All three set
`capability="target-appointments"`:

- `app-templates/customer-portal/content/cases/calm-harbor-spa.customer-portal-staging.json:11,15,19-31,33`
  — the **deployed** package: `capability target-appointments`,
  `demoCommands current-api`, `dataMode live`, `plan` in `enabledModules`,
  `defaultRoute orders.list`.
- `app-templates/customer-portal/runtime/calm-harbor-spa-live-demo.html:28,30,31,35`
  — same, live.
- `app-templates/customer-portal/runtime/calm-harbor-spa-target.html:28,30,31,32`
  — same, fixture.

Consequences used repeatedly below:

1. `runtime/src/router.js:148` —
   `case "orders.list": return isSpa() ? (spaCapability() === "target-appointments" ? SpaAppointments() : SpaOrders()) : Cabinet();`
   **`SpaOrdersPage` is unreachable in all three shipped configs.** Its findings
   are real but latent.
2. `spaCurrentApiDemoOpen()` (`runtime/src/state.js:346-348`) is **true** in the
   deployed package. Everything it gates is live production behaviour.
3. `runtime/src/state.js:13` declares `view: "ready", // ready | loading | empty | error`
   and the only writers are `runtime/src/app.js:160,165,169,174,237`
   (`ready` / `loading` / `error` / `fallback`). **`state.view` is never
   `unavailable` and never `not-found` in the runtime.** See AC-C03.

---

## AC-P — `runtime/src/routes/SpaPurchasesPage.js` (design counterpart: `design-inbox/src/routes/SpaPurchasesPage.js`)

### AC-C01 — live module wiring replaces the scenario view · `decision`

- runtime `SpaPurchasesPage.js:42-44`
- design `SpaPurchasesPage.js:42` (`"data-state": state.view`)

`var live/source/view` derived from `state.moduleData.orders` and
`state.moduleStatus.orders`. Recorded:
`docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S4.md`
§1 — "Purchases | `SpaPurchasesPage` reads `state.moduleData.orders` and gates
the mapped list behind the target capability | none". Not a defect.

### AC-C02 — `spaGate({ view: view, … })` · `decision`

- runtime `SpaPurchasesPage.js:55-56`
- design `SpaPurchasesPage.js:52-53` (no `view` key)

The shared primitive gained the parameter:
`runtime/src/components/primitives/RouteStates.js:84` reads
`var v = cfg.view || state.view;` where design
`design-inbox/src/components/primitives/RouteStates.js:84` reads
`var v = state.view;`. Necessary plumbing for AC-C01. `RouteStates.js` is
outside this agent's owned scope; recorded here because the account surfaces are
its only consumers in this family.

### AC-C03 — the accepted `unavailable` route treatment is unreachable · `gap` · **high**

- runtime `SpaPurchasesPage.js:67`, `SpaPlanPage.js:113-114`,
  `SpaProfilePage.js:46`, `SpaPurchaseDetailPage.js:73`, `SpaAccountPage.js:47`
- design `SpaPurchasesPage.js:63`, `SpaPlanPage.js:92-93`,
  `SpaProfilePage.js:46`, `SpaPurchaseDetailPage.js:73`, `SpaAccountPage.js:36`
- root cause `runtime/src/components/spa/CommerceBits.js:25-26` (byte-identical
  to `design-inbox/src/components/spa/CommerceBits.js:25-26`):
  `if (state.view === "unavailable") return UnavailableState(cfg.unavailable || {});`

`spaGate` branches on `state.view`, **not** on the `view` now threaded through
`cfg`. Since `state.view` is never `unavailable` (see §Configuration
reachability item 3), the accepted `UnavailableState` treatment configured on
all five account routes never renders. This is the mechanical reason each page
then hand-rolled its own unavailable notice — AC-C09, AC-C15, AC-C23b, AC-C10.

Design describes the treatment; the runtime does not render it → `gap`. Fixing
it is a one-line change in a shared primitive and is **not** in this slice's
scope. Route to the punch list, not to a design brief.

`not-found` on `purchase.detail` is unaffected in practice: the route reaches
`NotFoundState` by its own path at `runtime/SpaPurchaseDetailPage.js:77-81`
(identical to design `:77-81`), so only the `spaGate` branch is dead.

### AC-C04 — currency read accepts two shapes · `drift` · low

- runtime `SpaPurchasesPage.js:34` —
  `p.displayCurrency || (p.currency && p.currency.code) || ""`
- design `SpaPurchasesPage.js:34` — `p.currency`

The design fixture stores a string (`currency: "USD"`,
`design-inbox/data/fixtures.js:860-865`); the live adapter emits an object plus
a display string (`runtime/src/adapters/core-orders-adapter.js:316,325`). The
fallback chain renders the same text in both modes. Recorded because one
component now consumes two data shapes rather than one normalized shape.

### AC-C05 — cursor pagination gated to fixture mode · `decision`

- runtime `SpaPurchasesPage.js:72,100,103`
- design `SpaPurchasesPage.js:68,96,99`

"Show earlier purchases" and its two pending skeleton rows render only when
`!live`. Core cursor paging is not opened; showing a control that cannot page is
worse than omitting it. Consistent with `ARCHITECTURE.md` §Adapter And
Data-Mode Truthfulness.

### AC-C06 — live footnote is a different sentence · `invention` (copy) · medium

- runtime `SpaPurchasesPage.js:107-109`
- design `SpaPurchasesPage.js:103`

The `card__footnote` node exists in both, so this is copy only. Full treatment
in `findings-copy-hooks-account.md` §CP-06.

### AC-C07 — `purch-row__attention` (the pickup notice) · `decision` · Known Starting Point 4

- runtime render site `SpaPurchasesPage.js:28`
- design render site `SpaPurchasesPage.js:28` (identical)
- string assembly `runtime/src/adapters/core-orders-adapter.js:300-306`
- design source string `design-inbox/data/fixtures.js:861`

Component structure is byte-identical. The string is a **transfer**, not an
invention — verdict and reasoning in `findings-copy-hooks-account.md` §CP-04.

### AC-C08 — live filter tabs are built from a fixture registry · `drift` · low

- runtime `SpaPurchasesPage.js:77-79,90` — reads
  `F.spaCommerce.purchases.filters` / `.kindFilter` in **both** modes
- design `SpaPurchasesPage.js:73-75,86`

The live kind vocabulary is `SERVICE | RETAIL | PACKAGE | MEMBERSHIP` from
`runtime/src/adapters/core-orders-adapter.js:9-14` plus `MIXED` from `:230`.
`kindFilter` at `design-inbox/data/fixtures.js:854` covers all five, so no live
kind falls through today. Recorded because a new Core item type would silently
lose its filter tab.

### AC-C09 — `spaGateUnavailable()` · `decision` (unreachable) · low

- runtime `SpaPurchasesPage.js:50-53,113-120`
- design `SpaPurchasesPage.js:47-50,107-114`

Structurally identical, including `data-visual-id="unavailable-state"` and the
`◌` glyph. Gated on `spaCapability() === "current-staging"`, which no
shipped config sets — dead in all three packages. Not a defect; recorded so a
future capability change is not mistaken for new UI.

---

## AC-D — `runtime/src/routes/SpaPurchaseDetailPage.js`

Design and runtime are both 190 lines and differ on **exactly one line**.

### AC-C10 — items-card unavailable note replaces `linesBlock` · `invention` + linked `design-gap` · **high**

- runtime `SpaPurchaseDetailPage.js:112` —
  `d.lines && d.lines.length ? linesBlock(d) : h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Line items are not returned by the current Core Order API. …")`
- design `SpaPurchaseDetailPage.js:112` — `linesBlock(d)`, unconditional

The design never described an items card without items. The runtime invented a
treatment: a 12px grey caption (`.purch-ful__note`,
`runtime/styles/routes.css:1339`) standing in for a list.

**Do not delete this one.** Removal does not restore an accepted state — it
restores an empty `purch-lines` container with no explanation. `master.md`
§Core Rules 3 allows outright removal only when removal restores the accepted
state. Route: brief the "purchase with no line detail" state to design, then
replace.

Reachability: with the current adapter this branch is largely dormant —
`core-orders-adapter.js:297` always builds `lines`, and `.../evidence/S3.md` §4
records that an Order with no lines is excluded from the purchase list entirely.
It becomes live the moment a line-less order is allowed through.

### AC-C11 — per-line `displayTotal` renders an empty `<b>` · `design-gap` · **high** · Known Starting Point 5

- runtime `SpaPurchaseDetailPage.js:33` —
  `h("b", { "data-bind": "purchase.lines[].displayTotal" }, l.displayTotal)`
- design `SpaPurchaseDetailPage.js:33` — identical
- design fixture showing the figure: `design-inbox/data/fixtures.js:860-865`
- runtime value: `runtime/src/adapters/core-orders-adapter.js:255` —
  `displayTotal: null`, with the reason at `:238-243`

**Verdict: `design-gap`, filed against the design, not the runtime.** Core
exposes no per-line total (`.../evidence/S3.md` §5a: "Core exposes no per-line
total, so `displayTotal` is **omitted** rather than multiplied"). Per
`master.md` §Core Rules 5 the honest output is nothing, so the runtime's
omission is correct and the design fixture is what shows a number the server
does not provide.

**Secondary, and this part *is* a runtime defect:** `runtime/src/dom.js:16-19`
skips `null` children, so the element still renders as
`<b data-bind="purchase.lines[].displayTotal"></b>` — an empty bold node holding
layout in `.purch-line__side`. The design never described an empty amount slot.
The brief must say what a line without a total looks like; the fix is to omit
the node, not to fill it.

### AC-C12 — nine unchanged detail components · `decision` (verified identical)

`purchase-summary` `:88`, `purchase-items` `:110`, `purchase-lines` `:40`,
`purchase-line` `:24`, `purchase-totals` `:117`, `purchase-fulfillment` `:126`,
`purchase-appointments` `:138`, `purchase-plan` `:156`, `purchase-actions`
`:167` — all byte-identical to the same line numbers in
`design-inbox/src/routes/SpaPurchaseDetailPage.js`. No finding.

### AC-C13 — detail route state is not wired to the module · `drift` · medium

- runtime `SpaPurchaseDetailPage.js:58` — `"data-state": state.view`
- design `SpaPurchaseDetailPage.js:58` — identical

Unlike its list (AC-C01) the detail page never consults
`state.moduleStatus.orders`, while `currentPurchase()`
(`runtime/src/state.js:420-426`) *does* read the live `byRef` map. In live mode
the page therefore renders `data-state="ready"` while the orders module is still
loading, and a live load failure reaches `NotFoundState` (`:77-81`) rather than
the accepted error gate at `:70-71`. Inconsistent with the pattern
`.../evidence/S4.md` §3 established. Route: punch list.

---

## AC-L — `runtime/src/routes/SpaPlanPage.js` (design 113 → runtime 134)

### AC-C14 — plan route state from `moduleStatus.plan` · `decision` · Known Starting Point 6

- runtime `SpaPlanPage.js:78-82`
- design `SpaPlanPage.js:78` (`state.view`)

Recorded in `.../evidence/S4.md` §3: "It now resolves `state.moduleStatus.plan`
first, exactly as `SpaPurchasesPage` does … That is a transfer of an existing
accepted pattern, not a new one." **Confirmed `decision`.** Accounts for
5 of the 21 added lines.

### AC-C15 — the "current API" unavailable block · `invention` (structure + hook) with a `decision` on its gate · **high** · Known Starting Point 3

- runtime `SpaPlanPage.js:87-100`, hook at `:93`
- design counterpart: **absent.** `rg -n 'plan-current-api-unavailable'
  app-templates/customer-portal/design-inbox/` returns no match (exit 1), and
  `rg -n "current API|current-api|spaCurrentApiDemoOpen"
  app-templates/customer-portal/design-inbox/` reports `0 matches, 315 files
  searched`.

Two separable questions, answered separately:

**(a) The gate — `decision`, and it reads as intended.** `.../evidence/S4.md` §3
records the change from `spaCurrentApiDemoOpen()` alone to
`spaCurrentApiDemoOpen() && !isModuleEnabled("plan")`. Verified against every
shipped config: all three enable `plan`
(`content/cases/calm-harbor-spa.customer-portal-staging.json:29`,
`runtime/calm-harbor-spa-live-demo.html:28`,
`runtime/calm-harbor-spa-target.html:28`), so the short-circuit never fires and
**the accepted plan-card path at `:102-133` is what renders.** Known Starting
Point 3 is confirmed on both halves of its question.

**(b) The block itself — `invention`.** S4 §3 states "Both treatments are
accepted design". That is not supported by the source. The accepted unavailable
treatment for this route is the `spaGate` config at `:113-114` (design `:92-93`),
which renders `UnavailableState` — `data-visual-id="unavailable-state"`, glyph
`◌`, copy "My plan isn't available yet"
(`runtime/src/components/spa/CommerceBits.js:13-21`). The runtime block instead
hand-builds a `state-block` with a **different** `data-visual-id`
(`plan-current-api-unavailable`), a **different** glyph (`❀`) and
**different** copy. It is presentation the design never described.

Severity is high for the audit record and low for the user: the block is dead in
all three shipped configs. Route: the operator may remove it — and here removal
*does* restore the accepted state, because `spaGate`'s `unavailable:` config
already carries the sanctioned treatment. Removing it also depends on AC-C03
being fixed, or the accepted treatment stays unreachable too. The deletion
decision and the mandatory release compile stay with the operator.

### AC-C16 — `view === "empty"` replaces `state.view === "empty"` · `decision`

- runtime `SpaPlanPage.js:118`
- design `SpaPlanPage.js:97`

Same wiring as AC-C14.

### AC-C17 — expired plan card · `design-gap` · Known Starting Point 1

- runtime: **no treatment exists.** `SpaPlanPage.js:34` —
  `F.spaCommerce.plans.statusBadges[p.status] || "status-badge--scheduled"`
- design: **no treatment exists.** `design-inbox/src/routes/SpaPlanPage.js:34`
  is identical; the accepted vocabulary is exactly four labels at
  `design-inbox/data/fixtures.js:988` —
  `{ "Active", "Expiring soon", "Used up", "Cancelled" }`. No `Expired`.
- source: `.../evidence/S3.md` §5 — "the accepted vocabulary is `Active`,
  `Expiring soon`, `Used up`, `Cancelled`; `Expiring soon` is a warning on a
  live plan, not a terminal state".

**Confirmed `design-gap`.** The adapter raises `plan-status-unmapped` rather
than guessing (S3 §3), so the fallback badge at `:34` is never reached today.
If it ever were, an `EXPIRED` enrollment would render with the neutral
"scheduled" badge and a raw label — which is why the loud failure is correct.
Brief owed before W5 opens plan expiry.

### AC-C18 — five unchanged plan components · `decision` (verified identical)

`plan-usage` `:24`, `plan-card` `:35`, the `factRow` fact list `:44-48,70-75`,
`plan-empty` `:120`, `plan-list` `:129` — all byte-identical to
`design-inbox/src/routes/SpaPlanPage.js` at `:24`, `:35`, `:44-48,70-75`,
`:99`, `:108`. No finding.

---

## AC-R — `runtime/src/routes/SpaProfilePage.js` (design 146 → runtime 152)

### AC-C19 — live view from `moduleStatus.profile` · `decision`

- runtime `SpaProfilePage.js:29-31,36`
- design `SpaProfilePage.js:29,33`

Same pattern as AC-C01/AC-C14. `.../evidence/S4.md` §1 records the profile
module already selecting the Core adapter in live mode.

### AC-C20 — phone row conditional on presence · `decision`

- runtime `SpaProfilePage.js:84` — `if (confirmed.phone != null) ro.appendChild(…)`
- design `SpaProfilePage.js:80-83` — both rows unconditional

`.../evidence/S3.md` §4b: "A missing contact means a missing phone, never a
placeholder." Honest omission, and the `data-bind="profile.phone"` hook is
preserved whenever the value exists.

### AC-C21 — edit form is email-only in live mode · `decision`

- runtime `SpaProfilePage.js:91` and `canEdit` at `:59`
- design `SpaProfilePage.js:89` and `canEdit` at `:56`

`.../evidence/S3.md` §4b: "**Phone stays read-only.** Only `edit-email` is in
`allowedActions`; opening a contact write needs a scoped contract that does not
exist."

### AC-C22 — `data-profile-version` dropped in live mode · `drift` · low

- runtime `SpaProfilePage.js:62` — `"data-profile-version": live ? undefined : F.spaProfileSrv.version`
- design `SpaProfilePage.js:59` — `"data-profile-version": F.spaProfileSrv.version`

The Core profile read returns no version, and `runtime/src/dom.js:9` skips
`undefined` attributes, so the hook simply vanishes in live mode. Honest, but it
silently weakens the optimistic-concurrency contract the conflict banner at
`:71-78` depends on. Also recorded in the hooks file.

### AC-C23a — preferences panel omitted in live mode · `decision`

- runtime `SpaProfilePage.js:125,145-146` (`if (!live) { … }`)
- design `SpaProfilePage.js:123-142` (unconditional)

`.../evidence/S3.md` §4b: "**Preferences remain explicitly unavailable.** They
have nowhere to persist … `unavailableFields` reports `preferences`." Omitting
is correct.

### AC-C23b — the substitute note · `invention` + linked `design-gap` · **high**

- runtime `SpaProfilePage.js:147` —
  `h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Phone and visit preferences are not returned by the current Core User API, so this portal does not show or edit them.")`
- design counterpart: **absent.**

Where the design puts a full `list-panel` the runtime puts a bare 12px grey
caption (`.purch-ful__note`, `runtime/styles/routes.css:1339`, `margin-top: 6px`
— a class written to sit *inside* a card) appended directly to the page. The
design's vocabulary for "this section is not available" is
`state-block` / `unavailable-state`
(`runtime/src/components/spa/CommerceBits.js:13-21`), which this does not use.

**Do not delete.** Removal leaves the section silently missing, which is worse
than the wrong treatment. Cluster with AC-C10 and AC-C11 into a single "section
unavailable inside an otherwise-ready page" brief.

### AC-C24 — three unchanged profile components · `decision` (verified identical)

`spa-profile-contact` `:62`, `profile-conflict` `:71`, `profile-preference`
`:134` — identical to design `:59`, `:68`, `:131` modulo the attribute change
already recorded as AC-C22.

---

## AC-A — `runtime/src/routes/SpaAccountPage.js` (design 66 → runtime 81)

### AC-C25 — "My plan" is advertised as unavailable while the plan page works · `invention` · **HIGHEST SEVERITY**

- runtime `SpaAccountPage.js:23-26` —
  `if (spaCurrentApiDemoOpen()) { if (key === "support" || key === "plan") return "unavailable"; return "available"; }`
- runtime copy override `SpaAccountPage.js:64-65` — "Published packages and
  memberships can be ordered now. A personal balance or renewal record is not
  exposed by the current API."
- runtime foot link `SpaAccountPage.js:72-73` — "Membership options ›" to
  `pricing`, instead of "Open my plan ›"
- design counterpart: **absent.** `design-inbox/src/routes/SpaAccountPage.js:15-21`
  has no `spaCurrentApiDemoOpen` branch and `:51` renders `e.desc` /
  `e.unavailableDesc` with no per-key override; `rg` for `spaCurrentApiDemoOpen`
  across `design-inbox/` returns 0 matches in 315 files.

`spaCurrentApiDemoOpen()` (`runtime/src/state.js:346-348`) is **true** in the
deployed package (`demoCommands: "current-api"` + `dataMode: "live"`,
`content/cases/calm-harbor-spa.customer-portal-staging.json:15,33`). So in
production **today**:

- the Account overview shows "My plan — Not available yet" with a "Not available
  yet" chip (`:60`) and the sentence above, and
- `SpaPlanPage` at the same moment renders the real plan list from Core —
  `.../evidence/S3.md` §3 records the live result: three plans, balances 4/5 and
  0/3, `$18 / month`, `bookWithCredit` and `cancelRenewal` actions.

This is exactly the class of error `.../evidence/S4.md` §3 identified and fixed
on `SpaPlanPage` — "a message that had become false" — and it was never fixed on
the surface that links to it. It is worse here than there: the customer is told
their balance does not exist *and* is denied the navigation to the page that
shows it. The `Support` half of the same branch is consistent with the design
(design `:17` also makes support unavailable), so only `plan` is wrong.

Route: punch list, high priority, W4/W5 blocking. The narrow fix is to drop
`plan` from the `spaCurrentApiDemoOpen()` branch and gate on
`isModuleEnabled("plan")` exactly as `SpaPlanPage.js:92` now does. This slice
does not make that edit.

### AC-C26 — copy moved from fixtures into a frozen module const · `drift` · low

- runtime `SpaAccountPage.js:13-19,52` (`ACCOUNT_ENTRIES`)
- design `SpaAccountPage.js:8,41` (`F.spaCommerce.accountEntries`)

Copy is character-identical to `design-inbox/data/fixtures.js:837-849` (the
runtime writes the literal glyphs where the fixture writes escapes). The `route`
field is dropped, which this page does not use. Two consequences:

1. `runtime/data/fixtures.js:498-510` still carries `accountEntries` and now has
   **no consumer** — `rg -n "accountEntries" app-templates/customer-portal/runtime/src/`
   returns nothing. Dead fixture, and a second copy of the same strings free to
   drift.
2. Navigation copy is no longer scenario-swappable, which is a real (if minor)
   loss against the design's data-driven intent.

### AC-C27 — `staging` availability branch and the "See your orders ›" link · `decision` (unreachable) · low

- runtime `SpaAccountPage.js:27-31,70-71`
- design `SpaAccountPage.js:16-20,55-56` (identical logic)

`spaCapability() === "current-staging"` is set by no shipped config, so both are
dead. Carried forward unchanged from the design; not a defect.

### AC-C28 — `spa-account`, `account-entry-list`, `account-entry` structure · `decision` (verified identical)

runtime `:35,51,54-57` vs design `:24,40,43-46`. Element order, class
composition and every hook match.

---

## AC-O — `runtime/src/routes/SpaOrdersPage.js` (design 95 → runtime 113)

**Reachability first:** unreachable in all three shipped configs (see
§Configuration reachability item 1). Every finding below is latent. It is still
in scope: the file ships, and a capability flip makes all of it live at once.

### AC-C29 — `liveOrder()` assembles money in the browser and invents a currency · `invention` · **high (latent)**

- runtime `SpaOrdersPage.js:99-113`, specifically `:101-103` —
  `var total = Number.isFinite(order.grandTotal) ? new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(order.grandTotal) : "—";`
- design counterpart: **absent.** `design-inbox/src/routes/SpaOrdersPage.js` has
  no mapper; it reads `F.spa.stagingOrders` (`design SpaOrdersPage.js:63`),
  whose rows already carry `total: "$85.00"` and `currency: "USD"`
  (`design-inbox/data/fixtures.js:773-776`).

Three distinct problems in one function:

1. **`currency || "USD"`** — when Core returns no currency code the page formats
   the number with a dollar sign while the adjacent
   `<span data-bind="order.currency">` (`:88`) renders empty. A currency is
   invented. This is the failure mode `.../evidence/S3.md` §5a closes with:
   "**money is read, never assembled.** Where the server does not provide a
   figure, the honest output is nothing at all."
2. **It re-derives a figure the adapter already formatted.**
   `runtime/src/adapters/core-orders-adapter.js:324-325` emits `displayTotal`
   and `displayCurrency` for the same row. Presentation should render those
   verbatim, exactly as `SpaPurchasesPage.js:33-34` does.
3. **`"—"`** as the total when `grandTotal` is absent — a placeholder the design
   never showed. Reachable, since `core-orders-adapter.js:313` allows
   `grandTotal: null`.

Related, outside this agent's scope, same defect class:
`core-orders-adapter.js:296` — `var currencyCode = text(row.currency && row.currency.code) || "USD";`
applies the same invented default one layer down. Route both to the punch list
together.

### AC-C30 — invented fallback labels · `invention` · low (dead)

- runtime `SpaOrdersPage.js:106-108` — `"Order"`, `"ORDER"`, `"UNMAPPED"`
- design counterpart: **absent.** `design-inbox/data/fixtures.js:773-776` rows
  always carry a real `typeLabel` / `typeCode` / raw `status`. "UNMAPPED" in
  `design-inbox/styles/components.css:311` and
  `design-inbox/data/scenarios.json:177` names the *treatment*, never a label
  shown to a customer.

`"UNMAPPED"` is unreachable in practice: `core-orders-adapter.js:289-295` throws
`order-status-unmapped` before a row without a mapped state can reach the page,
so `statusCode` is always non-empty. `"Order"` / `"ORDER"` are reachable when
Core omits the type NLS. Recorded so the deletion is deliberate rather than
incidental.

### AC-C31 — route-state precedence differs from Purchases · `drift` · medium

- runtime `SpaOrdersPage.js:45-46` —
  `liveEnvelope && liveEnvelope.state || state.moduleStatus.orders || state.view`
- runtime `SpaPurchasesPage.js:44` —
  `state.moduleStatus.orders || source && source.state || "loading"`
- design `SpaOrdersPage.js:46` — `state.view`

Two pages read the same module with **inverted** precedence, and Orders falls
back to `state.view` where Purchases falls back to `"loading"`. A stale envelope
`state` therefore wins over a live `loading` status on one page and loses on the
other. One of the two is wrong; the audit cannot say which without a product
call. Route: punch list.

### AC-C32 — `orderThumb` rewritten, behaviour preserved, normative comment deleted · `drift` · low

- runtime `SpaOrdersPage.js:20-42`
- design `SpaOrdersPage.js:27-42` (after its comment block at `:7-13`)

Logic is equivalent — `mode === "broken" || mode !== "missing" && mode !== "forbidden" && …`
vs `mode === "broken" ? true : (mode !== "missing" && …)` — same hooks, same
`data-state` values, same error listener. What changed is that the design's
seven-line wave-17.1 rule block (`design SpaOrdersPage.js:7-13`: media is
backend-supplied and never inferred; failures resolve to the neutral fallback
without shifting columns) was dropped and the parameter renamed `o` → `order`.
No visual effect; the constraint that governs future edits is now undocumented
at the edit site.

### AC-C33 — `spa-order-list`, `spa-order-row`, empty state, footnote · `decision` (verified identical)

runtime `:57-61,69-73,76-91,94` vs design `:56-60,66-71,73-88,92`. Identical
markup, hooks and copy.

---

## AC-S — `runtime/src/components/profile/StatCard.js`

### AC-C34 — provenance comment only · `drift` · none

- runtime `StatCard.js:1` — `// customer-portal/runtime/src/components/profile/StatCard.js — production transfer module.`
- design `StatCard.js:1` — `// customer-portal-design/src/components/profile/StatCard.js — presentation runtime (auto-split from app.js). No business logic.`

Lines 2-12 are byte-identical. Not consumed by any Calm Harbor surface — the
only consumer is the generic `runtime/src/routes/ProfilePage.js:10,31-33`, which
matches `design-inbox/src/routes/ProfilePage.js:11,87-89`. No action.

---

## Stylesheets (read-only comparison, account sections)

Compared with `diff -u` per file and, for `routes.css`, with a sorted-line
comparison to separate reordering from real change.

| file | verdict |
| --- | --- |
| `base.css`, `components.css`, `shell.css`, `tokens.css` | identical (0 diff lines) |
| `responsive.css` | identical apart from one trailing blank line — `drift`, cosmetic |
| `routes.css` | see AC-C35; every account selector (`.purch-row` ×13, `.plan-card` ×13, `.plan-meter` ×6, `.account-entry` ×4, `.list-panel` ×3, `.pref-row` ×2, `.spa-order-thumb` ×4) is identical in both |
| `seo.css` | 107 diff lines — SEO family, not this agent's scope |

### AC-C35 — `.link-action` re-declared as a control reset · `drift` · low

- runtime `runtime/styles/routes.css:654-668`
- design `design-inbox/styles/routes.css:654` —
  `.link-action { font-weight: 600; font-size: 13px; color: var(--accent); cursor: pointer; }`

The runtime adds `-webkit-appearance/appearance: none; margin: 0; padding: 0;
border: 0; background: transparent; font-family: inherit; line-height: inherit;
text-align: left; text-decoration: none;` — a `<button>` reset. Every
`.link-action` in `runtime/src/` is a `<span>` (32 occurrences), on which the
added declarations are inert. Visually neutral today; a latent divergence if any
surface later emits a real button. This is the **only** substantive `routes.css`
difference — the large hunk a naive diff reports at `:1409` is a relocation,
proved by the sorted-line comparison returning only these `.link-action` lines.

---

## Known Starting Points — verdicts

| # | item | verdict | citations |
| --- | --- | --- | --- |
| 1 | `EXPIRED` enrollment has no accepted treatment | **`design-gap` confirmed** | AC-C17 · runtime `SpaPlanPage.js:34` · design `SpaPlanPage.js:34` + `design-inbox/data/fixtures.js:988` (four labels, no `Expired`) · `.../evidence/S3.md` §5 |
| 2 | purchase card for `RETURN_REQUESTED` / `RETURNED` | **`design-gap` confirmed** | `runtime/src/components/spa/CommerceBits.js:45-47` = design `:45-47`, fallback `status-badge--scheduled` · accepted vocabulary `design-inbox/data/fixtures.js:858` = `{Confirmed, In progress, Ready for pickup, Fulfilled, Cancelled}` · `.../evidence/S3.md` §5 |
| 3 | plan "not in the current API" now gated on the module | **`decision` on the gate (reads as intended; the accepted plan-card path is what renders) + `invention` on the block itself** | AC-C15 · runtime `SpaPlanPage.js:92-100,102-133` · design counterpart absent (0 matches in 315 design files) · `.../evidence/S4.md` §3 |
| 4 | purchase `attention` "Ready — please pick up by …" | **transfer, not invention → `decision`**; the dateless variant is a minor `design-gap` | AC-C07 + CP-04 · runtime `SpaPurchasesPage.js:28` = design `:28` · assembly `core-orders-adapter.js:300-306` · design string `design-inbox/data/fixtures.js:861` |
| 5 | per-line total omitted while the fixture shows `displayTotal` | **`design-gap`, filed against the design** (the runtime omission is correct); plus a runtime defect — the empty `<b>` still renders | AC-C11 · runtime `SpaPurchaseDetailPage.js:33` + `core-orders-adapter.js:255,238-243` + `runtime/src/dom.js:16-19` · design `SpaPurchaseDetailPage.js:33` + `design-inbox/data/fixtures.js:860-865` · `.../evidence/S3.md` §5a |
| 6 | plan state from `moduleStatus.plan`, matching Purchases | **`decision` confirmed** | AC-C14 · runtime `SpaPlanPage.js:78-82` · design `SpaPlanPage.js:78` · `.../evidence/S4.md` §3 |

## Cross-references handed to other slices

- **D1 (manifest).** `runtime/manifest.json` omits every account-family
  component id the design manifest declares — `spa-purchases`, `spa-plan`,
  `spa-account`, `spa-purchase-detail`, `purchase-row`, `spa-order-list`,
  `spa-order-row`, `unavailable-state`, `conflict-banner` are all present in
  `design-inbox/manifest.json` and absent from `runtime/manifest.json`
  (design 197 component ids vs runtime 142). `plan-current-api-unavailable`
  (AC-C15) is in neither. Not this agent's file; recorded so D1 reconciles it.
- **D4 (state reachability).** AC-C03 (`unavailable` unreachable on five
  routes), AC-C09/AC-C27/AC-C29–C33 (`current-staging` unreachable in every
  shipped config), AC-C30 (`"UNMAPPED"` dead), AC-C13 (detail loading/error
  unreachable) all belong in the route × state matrix.
- **D6 (briefs).** Three `design-gap` clusters: **(i)** expired plan card
  (AC-C17); **(ii)** purchase card for a return in progress / completed
  (Known Starting Point 2); **(iii)** "a section is unavailable inside an
  otherwise-ready page" — one brief covering AC-C10, AC-C11's empty amount slot,
  and AC-C23b.

---

## Judgment calls

Operator: merge into `audits/A1.md` at closeout. Written here rather than in
`A1.md` because three agents run concurrently on this package.

1. **`spaGate`'s dead `unavailable` branch (AC-C03) is classified `gap`, not
   `invention`.** The design describes the treatment and the runtime does not
   render it; that is the `gap` definition in `master.md` §Core Rules 1. It is
   *caused* by a runtime change to a shared primitive, but classifying by cause
   rather than by effect would put it in a bucket whose route is "remove", which
   would be wrong here.
2. **`RouteStates.js` and `CommerceBits.js` are cited but not claimed.** Both
   are shared primitives outside this agent's owned paths. They are named
   because the account surfaces are the only consumers of the changed behaviour
   in this family; ownership of any fix stays with the operator.
3. **AC-C10 and AC-C23b are classified `invention` but marked "do not delete".**
   `master.md` §Core Rules 3 permits removing an invention "only when removal
   restores the accepted state". Neither removal does — both would leave a
   silently missing section. They are therefore recorded as inventions that must
   be *replaced* via a brief, not deleted. No runtime file was edited.
4. **`.../evidence/S4.md` §3's sentence "Both treatments are accepted design" is
   contradicted on the evidence** and AC-C15 says so plainly rather than
   deferring to it. The recorded *decision* (the gate) is honoured as a
   `decision`; the *claim about the block's provenance* is a factual error, and
   `master.md` §Core Rules 4 protects decisions, not incidental prose.
5. **Latent findings are reported at full detail with severity discounted for
   reachability** rather than being dropped. `SpaOrdersPage` ships in every
   build; a one-attribute capability change makes AC-C29–C33 live at once.
6. **The example grep in `slices.md` §D3 does not hit.** The sources are
   JavaScript object literals (`"data-visual-id": "plan-card"`), not HTML
   attributes (`data-visual-id="plan-card"`). Every grep recorded in
   `findings-copy-hooks-account.md` uses the form that actually matches, and
   each is pasted with its hit.
