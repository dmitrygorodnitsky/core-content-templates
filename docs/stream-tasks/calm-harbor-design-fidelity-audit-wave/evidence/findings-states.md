# D4 — State reachability

Both directions, per `slices.md` §D4: states the design declares that nobody can
reach, and states the runtime can reach that nobody designed.

Sources: `design-inbox/data/scenarios.json` (25 routes, `implementedStates`),
`runtime/data/scenarios.json` (17 routes), `runtime/src/config.js`
`routeRegistry` (25 routes), `runtime/src/modules/index.js` (envelope states),
`runtime/src/adapters/*.js` (contract-error codes), and the reference app served
and driven at `http://localhost:8765/app-templates/customer-portal/design-inbox/source.html`.

## 0. The route surface itself

`runtime/src/config.js` registers **exactly the same 25 route ids** the design
declares — no route is missing, none is extra.

```
landing, seo.landing, auth.oidc, auth.phone, auth.code, orders.list,
order.detail, appointment.detail, calendar, activity, services, pricing,
products, product.detail, checkout, account, purchases.list, purchase.detail,
plan, cart, proposals.list, proposal.detail, profile, support, care
```

`runtime/data/scenarios.json` names only 17 of them. That file — not the
runtime — is what is missing the eight Calm Harbor routes. See D1 §1b.

Consequence, measured: `s7-route-state-check.mjs` reads `scenarios.json` for its
state contract but iterates `routeRegistry` to navigate, so it walks into
`product.detail` (which carries `param: "id"`) with nothing seeded and
`routePath` throws. That is a harness gap opened by an inventory gap, not by
presentation drift.

## 1. Direction one — design declares it; can the runtime reach it?

The nine priority surfaces in full. `reachable` means a live user or an adapter
response can produce it, with the mechanism named.

### appointments (`orders.list` under the spa profile) · `SpaAppointmentsPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready | yes | `moduleStatus.appointments = "ready"` | yes |
| loading | yes | pre-resolve; `SpaAppointmentsPage.js:65` `data-state="loading"` | yes |
| empty | yes | `SpaAppointmentsPage.js:107` `appointment-empty` | yes |
| error | yes | `modules/index.js:223` maps non-forbidden failures → `error` | yes |
| unauthorized | yes | `modules/index.js:223` `customer-forbidden` → `unauthorized` | yes |
| mobile-navigation-open | yes | `ui.toggleMobileNav` | yes |
| drawer-open | yes | `booking.open` | yes |
| pending-action / success-toast | yes | command lifecycle | yes |

No blank cells. All eight reachable.

### appointment.detail · `SpaAppointmentDetailPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / loading / error / unauthorized | yes | `:37` view, `:42` gate `["loading","error","unauthorized"]` | yes |
| not-found | yes | `:57` `!a \|\| view === "not-found"` → `NotFoundState` | yes |
| conflict | yes | `:67` `conflict = view === "conflict"` | yes |
| card pending / failed / conflict | yes | entity-scoped command phase | yes |
| cancelled / rescheduled (readback only) | yes | server readback | yes |
| session-lost (global gate) | yes | `modules/index.js:220` sets `account = "session-expired"` | yes |

### purchases.list · `SpaPurchasesPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / empty / loading / error / unauthorized | yes | `:44` view, `:57` gate | yes |
| unavailable | yes | `:114` `unavailable-state` | yes |
| cursor-loading | **fixture-only** | `:100` guarded by `!live` — `state.spaPurchMore` is never set in live mode | design has it; live cannot reach it |

`cursor-loading` is the one **declared-but-unreachable-in-live** state found on
the priority surfaces. Filed as `PL-01` below.

### purchase.detail · `SpaPurchaseDetailPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / loading / error / unauthorized | yes | `:63` gate | yes |
| not-found | yes | detail lookup miss | yes |
| unavailable | yes | `:112`, `:182` scoped `data-state="unavailable"` notes | yes |
| command pending / failed / conflict / session-lost | yes | `:30`, `:170` | yes |
| return-accepted-for-review | yes | `spaReturns[ref] === "accepted-for-review"` | yes |

### plan · `SpaPlanPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| active / expiring / exhausted / cancelled | yes | `statusBadges[p.status]`; fixture statuses `Active`, `Expiring soon`, `Cancelled`, `Used up` | yes |
| empty / loading / error / unauthorized | yes | `:82` view, `:104` gate | yes |
| unavailable | yes | `:93` `plan-current-api-unavailable` | yes |

### profile · `SpaProfilePage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / loading / error / unauthorized | yes | `:30`, `:37` gate | yes |
| contact idle / dirty / invalid / saving / save-failed / conflict | yes | `:58` `panelState` computes all six | yes |
| success-toast | yes | server readback | yes |

### products / shop · `SpaShopPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / empty / loading / error | yes | module status | yes |
| sellable / out-of-stock / unavailable / variant-required / price-changed | yes | `:27`, `:43`, `:44`, `:45`, `:63` — all five server sellability values branch | yes |
| models-ready / models-unavailable | yes | wave-17 grouping | yes |

### cart · `SpaCartPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / loading / error / unauthorized | yes | `:58` gate | yes |
| empty | yes | `:72` `cart-empty` | yes |
| row-pending / stale-price / inventory-conflict | yes | row-scoped states | yes |

### checkout · `SpaCheckoutPage.js`

| declared state | reachable | how | treatment |
| --- | --- | --- | --- |
| ready / loading / error / unauthorized | yes | `:125` gate | yes |
| empty / pending-action / success-toast | yes | command lifecycle | yes |
| repriced / inventory-conflict / slot-expired | yes | server quote states | yes |
| confirmed | yes | authoritative readback only | yes |
| conflict | yes | `:214` `phase === "conflict"` | yes |

### Long tail — sampling rule

The 16 non-priority routes (`landing`, `seo.landing`, `auth.*`, `calendar`,
`activity`, `care`, `support`, `services`, `pricing`, `orders.list`/`order.detail`
in the multi-vertical profiles, `proposals.*`, `account`) were sampled rather
than enumerated: for each, the route root and its `routeStateBody` gate were
read, and the declared set compared to the gate's `states` array. Two gaps
surfaced, both long-tail, both recorded in D1 §4 and repeated here as `LT-01`
and `LT-02`.

## 2. Direction two — the runtime can reach it; did anyone design it?

This is where the real finding is.

### 2a. Route roots can carry raw adapter error codes

`runtime/src/routes/SpaOrdersPage.js:46`

```js
var routeState = liveEnvelope && liveEnvelope.state || state.moduleStatus.orders || state.view;
```

and `runtime/src/modules/index.js:206`

```js
failureEnvelope(context, error) { return { state: error && error.code || "error", items: [] }; },
```

The orders module passes the **raw adapter contract-error code** through into the
envelope state, and the route root writes it straight onto `data-state`.
Reachable values on `[data-route="orders.list"]` therefore include:

```
orders-request-failed, orders-forbidden, order-scope-mismatch, session-expired,
session-required, invalid-order, invalid-response, fetch-unavailable,
origin-required, cross-origin-service, organization-required,
customer-account-required, unsupported-module
```

Confirmed live, not inferred — driving the staging preview against a stub that
404s the wave-15 order fan-out produces:

```
renderedRoutes: ["orders.list:orders-request-failed"]
```

None of these appear in the accepted route-root grammar, which is
`ready|loading|empty|error|unauthorized|not-found|conflict` plus wave-15
`unavailable`. The reference app's own dev toolbar offers exactly those eight
and nothing else — verified by reading its `state` select in the served
reference.

**This is not drift, and it must not be "fixed".**
`app-templates/customer-portal/scripts/calm-harbor-customer-portal-manual-check.mjs:198`
asserts it deliberately:

```js
await page.waitForSelector('[data-route="orders.list"][data-state="order-scope-mismatch"]');
assert.equal(await page.locator('[data-module="spa-order-row"]').count(), 0, "foreign Order fails closed");
```

The distinguishable state is the fail-closed security signal for a foreign
Order. Line 206 of `modules/index.js` is the intended behaviour; the three
sibling modules that map to `error`/`unauthorized`
(`:158` profile, `:223` appointments, `:240` plan) are the ones that *cannot*
express it.

Correct classification: **`design-gap`** — reality has states the design never
covered. Route: brief, not fix. Filed as `SG-01`.

The same shape is accepted elsewhere and is already in the grammar: the
account-bootstrap module (`modules/index.js:147,149`) passes its codes through,
and `resolving-customer|customer-unavailable|customer-not-linked|customer-account-ambiguous|organization-forbidden|customer-forbidden|session-expired`
*are* declared. The orders equivalents are simply not declared yet.

### 2b. Adapter contract errors with no route-level treatment

38 distinct `contractError` codes are raised across the five adapters. Grouped
by what the user can end up looking at:

| group | codes | treatment |
| --- | --- | --- |
| account bootstrap | `customer-not-linked`, `customer-account-ambiguous`, `organization-forbidden`, `customer-forbidden`, `session-expired`, `invalid-customer-account`, `invalid-session-user`, `customer-scope-mismatch` | **accepted** — declared account-bootstrap grammar |
| orders fail-closed | `order-scope-mismatch`, `orders-request-failed`, `orders-forbidden` | **no accepted treatment** → `SG-01` |
| configuration / wiring | `api-base-required`, `origin-required`, `organization-required`, `cross-origin-base`, `cross-origin-service`, `fetch-unavailable`, `unsupported-module`, `session-required`, `customer-account-required` | reach the user as `error` for mapped modules, as a raw code on orders → `SG-01` |
| OIDC | `oidc-callback-mismatch`, `oidc-cross-origin-authority`, `oidc-cross-origin-resource`, `oidc-discovery-failed`, `oidc-discovery-incomplete`, `oidc-library-unavailable`, `oidc-manager-unavailable` | **accepted** — `auth.oidc` declares `unavailable`; `modules/index.js:191` maps all seven to it |
| appointment commands | `appointment-cancel-unconfirmed`, `appointment-forbidden`, `appointment-not-cancellable`, `appointment-not-found`, `invalid-appointment`, `invalid-appointment-ref`, `invalid-date` | **accepted** — entity-scoped `pending\|failed\|conflict` plus `not-found` |
| plans | `plans-unavailable`, `invalid-plan` | **accepted** — `unavailable` / `error` |
| data shape | `invalid-response`, `invalid-save-response`, `invalid-order`, `care-plan-missing`, `template-reference-missing` | **accepted** — `error` for mapped modules |

### 2c. Runtime-only rendered values with no design counterpart

Carried forward from D1 §4, now classified:

| value | location | classification |
| --- | --- | --- |
| `data-visual-id="route-fallback"` | `runtime/src/router.js:178` | `design-gap` — unknown-route safety net; the design has no unknown-route treatment. `SG-02` |
| `data-module="activity-control"` | `runtime/src/components/shell/TopNav.js:36` | multi-vertical shell, long tail. `LT-03` |
| `data-module="routine-tasks"` / `routine-task-row` | `runtime/src/components/care/BeautyCareHub.js:67,75` | care surface, long tail. `LT-04` |
| `data-module="seo-public-header"` | `runtime/src/components/seo/SeoSections.js:36` | SEO surface, outside scope. `LT-05` |
| `data-state="selected"` | product gallery thumb | **accepted** — the wave-17 grammar declares `product-gallery-thumb … selected` |

## 3. The two known design-gaps — confirmed and sharpened

### `SG-03` — expired plan card (known starting point 1) — **confirmed**

The design's plan fixtures carry exactly four statuses:

```
design-inbox/data/fixtures.js:991  status: "Active"
design-inbox/data/fixtures.js:993  status: "Expiring soon"
                                   status: "Cancelled"   → SpaPlanPage.js:46 "Ends"
                                   status: "Used up"     → SpaPlanPage.js:63
```

`design-inbox/src/routes/SpaPlanPage.js:34` resolves the badge through
`F.spaCommerce.plans.statusBadges[p.status]`, falling back to
`status-badge--scheduled`. There is **no `Expired` entry** and no branch for it.
An `EXPIRED` enrolment renders with the neutral fallback badge and no
expiry-specific treatment. `design-gap`, brief required.

### `SG-04` — purchase card for a return (known starting point 2) — **confirmed, and narrower than recorded**

The recorded starting point names `RETURN_REQUESTED` *and* `RETURNED`. Only the
second is a gap:

- `RETURN_REQUESTED` **has** an accepted treatment.
  `design-inbox/src/routes/SpaPurchaseDetailPage.js:28` renders a
  `purch-line__note` when `retState === "accepted-for-review"`, and
  `return-accepted-for-review` is in the declared `data-state` grammar.
- `RETURNED` — a completed return — has **no** treatment. No branch, no badge,
  no note, on either the line or the purchase card.

The brief should ask for the completed-return state only, and should say the
in-progress state is already accepted. Filing for both would ask the designer to
redo work already done.

## 4. Findings raised by D4

| id | classification | surface | runtime location | design counterpart | route |
| --- | --- | --- | --- | --- | --- |
| `SG-01` | design-gap | orders route root | `modules/index.js:206`, `SpaOrdersPage.js:46` | absent — grammar stops at `unavailable` | brief; **do not fix** — asserted at `calm-harbor-customer-portal-manual-check.mjs:198` |
| `SG-02` | design-gap | unknown route | `router.js:178` | absent | brief |
| `SG-03` | design-gap | plan card | plan status badge fallback | `design-inbox/.../SpaPlanPage.js:34` has no `Expired` | brief |
| `SG-04` | design-gap | purchase line | no completed-return branch | `design-inbox/.../SpaPurchaseDetailPage.js:28` covers in-progress only | brief |
| `PL-01` | gap | purchases.list | `SpaPurchasesPage.js:100` guarded `!live` | design declares `cursor-loading` | punch list — declared but unreachable in live mode |
| `LT-01` | gap | activity | `data-action="activity.open"` absent | `design-inbox/src/components/shell/TopNav.js:50` | punch list, long tail |
| `LT-02` | gap | support | `data-action="support.retryMessage"` absent | `design-inbox/src/routes/SupportPage.js:78` | punch list, long tail |
| `LT-03` | invention | shell | `TopNav.js:36` `activity-control` | absent | punch list, long tail |
| `LT-04` | invention | care | `BeautyCareHub.js:67,75` | absent | punch list, long tail |
| `LT-05` | invention | seo | `SeoSections.js:36` | absent | punch list, out of scope |
| `INV-01` | inventory | — | `runtime/data/scenarios.json` — 17 routes vs 25 registered | — | fix in D6 |

## 5. Coverage actually achieved

- Both directions enumerated for the **nine priority surfaces**, no blank cells.
- The long tail was **sampled**, not enumerated; the rule is stated in §1.
- Reachability was established by reading the branch **and**, for the orders
  fail-closed path, by driving the live staging preview and capturing the
  rendered `data-state`. Every other row is code-read, not browser-proven, and
  is marked as such by carrying a `file:line` rather than a capture.
