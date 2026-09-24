# D2 — Component audit: APPOINTMENTS surface family

Date: 2026-07-28. Slice: D2. Surface family: appointments / appointment detail /
booking flow / the shell components those surfaces mount inside.

Reference: `app-templates/customer-portal/design-inbox/**` (read-only).
Production: `app-templates/customer-portal/runtime/**` (read-only for this audit —
nothing under `runtime/` was edited).

Paths below are relative to the repository root. Every finding cites `file:line`
on both sides, or states that the counterpart is absent.

## Scope and coverage

| owned file | design counterpart | verdict summary |
| --- | --- | --- |
| `runtime/src/routes/SpaAppointmentsPage.js` (242 ln) | `design-inbox/src/routes/SpaAppointmentsPage.js` (238 ln) | 11 findings; markup structure identical |
| `runtime/src/routes/SpaAppointmentDetailPage.js` (145 ln) | `design-inbox/src/routes/SpaAppointmentDetailPage.js` (143 ln) | 3 findings; markup structure identical |
| `runtime/src/components/spa/SpaBookingFlow.js` (307 ln) | `design-inbox/src/components/spa/SpaBookingFlow.js` (305 ln) | 6 findings; markup structure identical |
| `runtime/src/components/shell/SpaTopNav.js` | `design-inbox/src/components/shell/SpaTopNav.js` | **byte-identical** — no findings |
| `runtime/src/components/shell/AccountBootstrap.js` | `design-inbox/src/components/shell/AccountBootstrap.js` | 2 findings |
| `runtime/src/components/shell/AppShell.js` | `design-inbox/src/components/shell/AppShell.js` | 4 findings |
| `runtime/src/components/shell/PageHeader.js` | `design-inbox/src/components/shell/PageHeader.js` | 0 findings (header comment only) |
| `runtime/styles/*.css` (appointments / booking / account-gate rules) | `design-inbox/styles/*.css` | 3 findings, all read-only comparison |

Coverage is **exhaustive** for these files: every component function in each owned
file was compared against its counterpart and carries a verdict below. No
sampling was used.

Four findings (A-06, A-07, A-21, A-26) have their root cause outside the owned
files but are recorded here because they decide what the appointments surfaces
render. They are labelled as such so the operator can route them to the adapter /
primitive owner rather than to a presentation fix.

## Classification counts

| classification | count |
| --- | --- |
| `invention` | 2 |
| `gap` | 4 |
| `drift` | 11 |
| `decision` | 4 |
| `design-gap` | 6 |
| **total** | **27** |

Findings A-01 … A-27 plus S-01 … S-03 (styles, counted inside `drift`). D3
hook/copy findings are counted separately in
`findings-copy-hooks-appointments.md`.

---

## 1. `SpaAppointmentsPage` — route `orders.list`, capability `target-appointments`

Component inventory, both sides: `modeChip`, `statusBadge`, `apptRow`,
`pastPanel`, `loadingSkeleton`, `SpaAppointments` (page root, header, route-state
gate, empty card, next-appointment hero, visit-details block, reference row,
reschedule/cancel notes, hero actions, upcoming panel, past panel, catalog-teaser
rail). **Every element, class name, attribute set and child order in the emitted
markup is identical between the two files.** All findings below are about the
*source* feeding that markup, or about which branch is reachable.

### A-01 `drift` — the route-state gate is driven by the module status, not `state.view`

- runtime `app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js:75`
  (`var view = state.config.dataMode === "live" ? (state.moduleStatus.appointments || appointments.state || "loading") : state.view;`),
  passed through at `:81` and `:91`.
- design `app-templates/customer-portal/design-inbox/src/routes/SpaAppointmentsPage.js:79`
  (`"data-state": state.view`) and `:88-93` (`routeStateBody` with no `view`).
- Supporting primitive: runtime `runtime/src/components/primitives/RouteStates.js:84`
  (`var v = cfg.view || state.view;`) vs design
  `design-inbox/src/components/primitives/RouteStates.js:84` (`var v = state.view;`).

The accepted design has one lifecycle source (`state.view`, driven by the preview
toolbar). Production has two: the fixture scenario in fixture mode and the live
module status in live mode. The rendered treatments are the accepted ones and the
emitted `data-state` values stay inside the accepted route-lifecycle grammar
(`loading | ready | empty | error | unauthorized`).

**Route: accept with reason.** This is the same "state comes from `moduleStatus`"
transfer that `../calm-harbor-customer-portal-full-activation-program/evidence/S4.md`
§3 records for `SpaPlanPage`, applied to the surface S4 §1 says already read live.
It is a transfer of an accepted pattern, not new UI. Classified `drift`, not
`decision`, because no evidence file names *this* file.

### A-02 `drift` — appointment rows come from a selector, not from `F` directly

- runtime `:74` (`var appointments = spaAppointments();`), `:76`, `:124`, `:216`,
  `:218`; helper `runtime/src/state.js:350-363`.
- design `:75` (`F.spa.appointments.nextVariants[sc]`), `:60`, `:212`, `:214`.
- `pastPanel` signature changed: runtime `:53` `function pastPanel(items, open)`
  vs design `:53` `function pastPanel(open)`.

Behaviour-preserving in fixture mode: `spaAppointments()` reproduces the design's
own scenario resolution (`runtime/src/state.js:354-362`). Required in live mode so
that no fixture visit can render. Markup unchanged.

**Route: accept with reason.**

### A-03 `drift` — the hero's Reschedule / Cancel buttons are gated on `allowedActions`

- runtime `:194-198`
  (`var allowed = next.allowedActions || ["reschedule", "cancel"];` … `if (heroActions.childNodes.length) hero.appendChild(heroActions);`).
- design `:191-194` — both buttons are rendered unconditionally.

In fixture mode the two are identical: `runtime/data/fixtures.js:465-470`
`nextVariants` carry no `allowedActions`, so the `["reschedule", "cancel"]`
default applies and the same two buttons render. In live mode the list follows the
server, which is what the accepted **detail** page already does
(design `design-inbox/src/routes/SpaAppointmentDetailPage.js:66,127-129`) and what
`../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §2 records
the live read model returning (`reschedule` / `bookAgain` / none).

**Route: accept with reason** — but see A-04, which is the consequence the design
never covered.

### A-04 `design-gap` — booking open + empty `allowedActions` renders a hero with no controls and no explanation

- runtime `:194-198`: when `open === true` and `next.allowedActions` is `[]`,
  `heroActions` stays empty and nothing is appended. No note is rendered either —
  the `unavailable` note at `:206-209` belongs to the `else` (booking-closed)
  branch.
- design counterpart: **absent.** The design has no branch for "booking is open but
  the server allows nothing on this visit"; `:191-194` always renders both buttons.

This state is reachable today: `runtime/src/adapters/core-spa-demo-adapter.js:502-504`
returns `allowedActions: []` for any status that is neither `Confirmed` nor
`Completed` — i.e. for a live `In progress` visit. The customer then sees a hero
with no action and no sentence explaining why.

**Route: brief.** Cluster with A-05 into one appointments design request. The
accepted detail page shows the shape a brief should follow
(`design-inbox/src/routes/SpaAppointmentDetailPage.js:132-137`: an explicit
"online changes aren't available" note whenever controls are withheld).

### A-05 `design-gap` — `In progress` has no accepted appointment treatment

- runtime `runtime/src/adapters/core-spa-demo-adapter.js:556`
  (`if (states.includes("IN_PROGRESS")) return "In progress";`), rendered through
  runtime `:29-31` `statusBadge()` and `:135`.
- design `design-inbox/data/fixtures.js:797` — the accepted appointment badge map
  is `Confirmed | Needs confirmation | Completed | Cancelled`. `In progress` is
  **not** in it; it belongs to the *purchase* vocabulary
  (`design-inbox/data/fixtures.js:858`).

`F.spa.statusBadges[label] || "status-badge--scheduled"` (both sides, line 30)
silently falls back to a variant the appointment badge map never declares. The
label renders with an unaccepted colour treatment.

**Route: brief** (with A-04). This is the appointments twin of the two `design-gap`
items already recorded in `master.md` §Known Starting Points for plans and
purchases.

### A-06 `invention` — the live read model fabricates a visit location (root cause outside owned files)

- runtime `runtime/src/adapters/core-spa-demo-adapter.js:521`
  (`location: "Harbor Front studio",`) — a constant, not a Core field. Rendered by
  runtime `:147-150` (`data-bind="appointment.visitMode,appointment.location"`) and
  by runtime `runtime/src/routes/SpaAppointmentDetailPage.js:89-92`.
- design `design-inbox/src/routes/SpaAppointmentsPage.js:146` and
  `design-inbox/src/routes/SpaAppointmentDetailPage.js:87-90` — the design provides
  the honest fallback for exactly this case:
  `" · location details not provided yet"`.

The runtime renders a studio name Core never returned, and in doing so makes the
design's own accepted "not provided yet" state unreachable in live mode. Line 520
(`visitMode: "salon"`) has the same shape: every live visit is stamped
"At Calm Harbor" regardless of what it is.

**Route: fix, by the adapter owner.** The correct output is `null`, which restores
the accepted state. `ARCHITECTURE.md` §Frozen Platform Decisions ("Do not invent
… data") and `../calm-harbor-customer-portal-full-activation-program/evidence/S3.md`
§5a ("where the server does not provide a figure, the honest output is nothing at
all") both settle the direction. Recorded here, not fixed here: this audit does not
edit `runtime/`.

### A-07 `drift` — the live status mapping guesses instead of raising (root cause outside owned files)

- runtime `runtime/src/adapters/core-spa-demo-adapter.js:553-558` — any state that
  is not `COMPLETED` / `CANCELLED` / `IN_PROGRESS` falls through to `"Confirmed"`.
- design `design-inbox/src/routes/SpaAppointmentsPage.js:5-7` (also verbatim at
  runtime `:5-7`): *"Customer status labels … are placeholders for a BACKEND-OWNED
  approved mapping — never derived from raw Core statuses in the browser."*

Both sibling adapters raise on an unmapped state rather than guess
(`../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §3
`plan-status-unmapped`, §4 `order-status-unmapped`). The appointment mapping has no
such guard, so an unknown Core workflow state reaches the customer labelled
"Confirmed" — the highest-trust label on the surface.

**Route: fix, by the adapter owner**, matching the two sibling adapters.

### A-08 `gap` — `Needs confirmation` is an accepted status the live path cannot produce

- design `design-inbox/data/fixtures.js:797` declares the badge treatment;
  `design-inbox/data/fixtures.js:964,966` exercise it.
- runtime `runtime/src/adapters/core-spa-demo-adapter.js:553-558` — no branch emits
  it, so `status-badge--warn` on an appointment never renders live.

**Route: accepted-with-reason for now** (no Core workflow state maps to it), and it
belongs in D4's reachability matrix. Recorded so D4 does not have to rediscover it.

### A-09 `decision` — the purchase deep-link is suppressed in live mode

- runtime `:168-170`
  (`state.config.dataMode !== "live" && F.spaCommerce.purchaseByAppointment[next.id]`).
- design `:165` (`F.spaCommerce.purchaseByAppointment[next.id]`).

`purchaseByAppointment` is a fixture-only map; leaving it live would link a live
appointment to a fixture purchase ref. Suppression is the honest behaviour and
matches `../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §4
("the accepted fixture's `pur-*` refs are fixture-only"). The accepted **detail**
page already gets this right from the source model (`relatedPurchaseRef`, design
detail `:100-103`), so the list hero is simply the weaker of the two paths.

**Route: accepted with reason.** Note the side effect: "View purchase ›" never
renders on the live list hero. It does render on the live detail page when the
read model supplies `relatedPurchaseRef`.

### A-10 `design-gap` (against the design, not the runtime) — the page root `data-state` and the rendered body can disagree

- runtime `:75-81` and `:103`; design `:75-79` and `:100`.

With `view === "ready"` and `next === null` the page root reports `ready` while the
body renders the accepted `empty` card (`data-state="empty"` at runtime `:107` /
design `:104`). **This is true in the design as well** — the design reaches it via
the `sc === "empty"` scenario with `state.view === "ready"`. It is therefore not
runtime drift; it is a property of the accepted source that any selector written
against the page root `data-state` must know about.

**Route: accepted with reason**, recorded for D3/D5 selector authors.

### A-27 `drift` — the "Treatments & prices" rail still reads the fixture catalog while claiming to be live

- runtime `:224` (caption: *"Live from the public catalog — shown as published."*)
  and `:226` (`F.spa.pim.services.slice(0, 3).forEach(...)`).
- design `:220` and `:222` — identical code.

The runtime gained a live catalog selector, `spaCatalogServices()`
(`runtime/src/state.js:272-284`), and the booking flow was switched to it
(A-15, runtime `SpaBookingFlow.js:21`). **This rail was not.** In live mode it
renders three fixture treatments with fixture prices under a caption asserting they
are the published catalog — the clearest case on this family of a string that was
true when designed and is not true now.

The `data-product-code`, `data-bind="pim.services[].name"` and
`data-bind="pim.services[].displayPrice"` hooks (runtime `:227,229,232`) are
therefore bound to fixture values in production.

**Route: ticket.** Switching the rail to `spaCatalogServices()` restores the
caption's truth without any markup change. See also C-01 in
`findings-copy-hooks-appointments.md`.

---

## 2. `SpaAppointmentDetailPage` — route `appointment.detail`

Component inventory, both sides: `modeChip`, `detailRow`, `SpaAppointmentDetail`
(page root, back link, route-state gate, not-found, page header, conflict banner,
hero card, status badge, visit-details rows, reference row, attention note,
cancelled note, failure/conflict inline failures, allowedActions button set,
booking-closed note, catalog note). **Markup identical on both sides.**

### A-11 `drift` — same lifecycle-source change as A-01, and `conflict` becomes unreachable live

- runtime `runtime/src/routes/SpaAppointmentDetailPage.js:37,38,43,57,67`.
- design `design-inbox/src/routes/SpaAppointmentDetailPage.js:37,41,55,65`
  (`state.view` throughout).

Same reasoning and route as A-01: **accept with reason**. One consequence worth
naming: the runtime's `view` never takes the values `not-found` or `conflict` in
live mode, because `state.moduleStatus.appointments` cannot produce them
(runtime `:37`). `not-found` still renders through the `!a` guard at `:57`;
`conflict` (`:67`, and the `ConflictBanner` at `:73`) becomes **unreachable in live
mode**. In fixture mode both stay reachable via `state.view`.

**Sub-route:** the `conflict` treatment belongs in D4's matrix as
declared-but-unreachable-in-live.

### A-12 `decision` — the appointment `attention` copy is a **transfer**, not an invention

This confirms the `master.md` §Known Starting Points item as it applies to
appointments. Verdict: **transfer.**

- The runtime renders `a.attention` **verbatim** and never assembles it:
  runtime `:108` is character-for-character design `:106`.
- The only string the runtime ever synthesises into `attention` is the reschedule
  readback — runtime `runtime/src/state.js:393`
  (`attention: "Rescheduled — confirmed by the studio. The previous time was released."`),
  which is character-for-character design `design-inbox/src/state.js:163`.
- In live mode the read model emits **no `attention` field at all**
  (`runtime/src/adapters/core-spa-demo-adapter.js:505-530` — the key is absent), so
  nothing is assembled from live window data on this surface. Core provides no
  appointment policy copy, and the runtime omitting it is correct under the
  `master.md` honesty rule.

The assembled-from-live-window pattern flagged in `master.md` exists only on the
**purchase** side (`runtime/src/adapters/core-orders-adapter.js:300-305`,
`"Ready — please pick up" + " by " + windowEndLabel`, against the accepted fixture
string `"Ready — please pick up by Jul 22"` at `design-inbox/data/fixtures.js:861`).
That surface is owned by the commerce agent; it is named here only so the
appointments verdict is not mistaken for a verdict on it.

**Route: accepted with reason. No defect on the appointments surfaces.**

### A-13 `gap` — the design's `displayPrice` row does not render live

- design `design-inbox/src/routes/SpaAppointmentDetailPage.js:94` and fixture
  `design-inbox/data/fixtures.js:961` (`displayPrice: "$85"`).
- runtime `runtime/src/routes/SpaAppointmentDetailPage.js:96` (identical code);
  live source `runtime/src/adapters/core-spa-demo-adapter.js:522-523`
  (`price: null, displayPrice: null`).

**This finding is against the design fixture, not against the runtime.** Core
exposes no per-appointment price, and
`../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §5a settles
the rule ("money is read, never assembled"). The runtime omitting the row is
correct.

**Route: accepted with reason.** Do not file a runtime ticket.

---

## 3. `SpaBookingFlow` — the accepted booking drawer body

Component inventory, both sides: `svcByCode`, `dayByKey`, `slotLabel`,
`flowTitle`, `stepsBar`, `rescheduleCurrent`, `creditCard`, `stepContext`,
`stepSpecialist`, `stepSlots`, `stepReview`, `backLink`, `SpaBookingFlow`.
**Markup identical on both sides**, including the
`data-state="context|specialist|slots|review"` root (runtime `:299`, design `:297`).

### A-14 `decision` — no-hold copy and the "Review this time" label

- runtime `:198` (`label: spaCurrentApiDemoOpen() ? "Review this time" : "Hold this time"`),
  `:201-203` (the no-hold note), `:239-241` (`booking-hold` body and the suppressed
  `data-hold-ref`).
- design `:198`, `:201`, `:237`.

Settled by `../calm-harbor-customer-portal-full-activation-program/evidence/S1.md`
§7.3 ("Booking without a server hold — accepted for staging/demo": *the UI never
claims the slot is held; no local countdown and no 'your time is held' copy*). The
runtime's replacement copy states plainly that no hold exists. `data-hold-ref` is
correctly omitted rather than filled with a fixture ref.

**Route: accepted with reason. Not drift.**

### A-15 `decision` — the service list and the reschedule origin read live sources

- runtime `:21` (`spaCatalogServices()`), `:56` and `:218` (`currentAppointment()`),
  `:109` (live catalog codes when the current-api demo is open).
- design `:21` (`F.spa.pim.services`), `:56` and `:216`
  (`F.spaCommerce.appointmentDetails[f.rescheduleOf]`), `:109`
  (`F.spaBooking.eligibleServices`).

Required so the flow cannot show a fixture service or a fixture "currently booked"
visit next to live data. Consistent with
`../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §2. Markup
unchanged.

**Route: accepted with reason.**

### A-16 `drift` — **slot availability is still fixture data in live mode**

- runtime `:180-191` — `F.spaBooking.days.forEach(...)` builds the day chips, and
  `day.slots.forEach(...)` builds the slot grid, unconditionally. The grid carries
  `data-bind="booking.eligibleSlots"` (runtime `:187`).
- design `:181-191` — structurally identical, but the design is a fixture app; its
  own header comment `:5-8` declares that *"slots/specialists/prices/hold expiry
  are all server-returned display data"*.
- Consequence: runtime `runtime/src/actions.js:456` books
  `start: spaSlotIso(flow.slotRef)` — a datetime derived from the fixture slot ref.

The customer picks a time from a fixture calendar and Core records it. No recorded
decision covers this:
`../calm-harbor-customer-portal-full-activation-program/evidence/S1.md` §7.3 settles
the absence of *holds*, and `.../evidence/S0.md` §3 records that **slot inventory
has no server contract at all** — but neither authorises presenting fixture
availability as bookable. This is the single highest-severity finding on the family.

**Route: ticket.** Either open a real availability source, or render the accepted
`spaSlots === "empty"` treatment (both sides, runtime `:170-178` / design
`:170-178`) which already says the honest thing: *"No times are open right now …
our team can find one for you."* Do not invent a new treatment.

### A-17 `gap` — the accepted blocking states have no runtime trigger

Rendered by both files, reachable in neither production path:

| state | runtime code | design code | why unreachable in production |
| --- | --- | --- | --- |
| `spaHold: slot-expired` | `:242` | `:240` | only the preview toolbar sets it (`design-inbox/src/app.js:208`); runtime sets `spaHold` to `"held"` only (`runtime/src/actions.js:542,561,568,690`) |
| `spaHold: repriced` | `:243` | `:241` | same |
| `spaSlots: loading` | `:160-164` | `:160-164` | `design-inbox/src/app.js:213`; runtime only resets to `"ready"` (`runtime/src/actions.js:691`) |
| `spaSlots: error` | `:165-169` | `:165-169` | same |
| `spaSlots: empty` | `:170-178` | `:170-178` | same |
| `spaCredit: unavailable / exhausted / changed` | `:70-81` | `:70-81` | `design-inbox/src/app.js:214`; runtime only resets to `"ok"` (`runtime/src/actions.js:693`) |
| `booking.hold` `failed` / `conflict` | `:195-196` | `:195-196` | the current-api path is synchronous and cannot fail (`runtime/src/actions.js:558-563`) |

The components are faithfully transferred; what is missing is any production event
that sets the state. `ARCHITECTURE.md` §Frozen Platform Decisions forbids shipping
`data-dev-toolbar`, so the design's only trigger is correctly absent.

**Route: hand to D4** for the reachability matrix. Not a presentation defect.

### A-18 `drift` — the review total prefers a fixture map over the live catalog price

- runtime `:255`
  (`F.spaBooking.displayTotals[f.serviceCode] || (svc && svc.displayPrice) || "—"`).
- design `:253` — identical expression.

Structurally a faithful transfer, so not an invention. The risk is precedence: the
fixture map is keyed `svc-spa-01 | svc-spa-02 | svc-spa-03`
(`runtime/data/fixtures.js:755`). A live catalog code colliding with one of those
would show a fixture total on a live booking — exactly the failure
`../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §5a exists to
prevent. No collision exists in the current seed, so this is latent, not live.

**Route: ticket (low severity, latent).** Reverse the precedence in live mode, or
prove by check that live codes cannot collide.

### A-19 `design-gap` — the specialist step can never appear in live mode

- runtime `:41` and `:129` — both read `F.spaBooking.eligibleSpecialists`,
  fixture-only; the live read model returns `specialist: ""`
  (`runtime/src/adapters/core-spa-demo-adapter.js:518`).
- design `:41,:129` — identical.

The design is explicit that the step renders *"ONLY when the server returns
eligible specialists"* (design `:39`, `:127`), so an empty live list producing no
step is the accepted behaviour. What the design never covers is the resulting live
review row: `stepReview` renders `"First available specialist"` (runtime `:249`,
design `:247`) as a positive statement, on a system that has no specialist concept
at all.

**Route: brief, low severity** — cluster with A-04/A-05 rather than filing alone.

---

## 4. Shell components

### `SpaTopNav.js` — no findings

`diff design-inbox/src/components/shell/SpaTopNav.js runtime/src/components/shell/SpaTopNav.js`
produces **no output**. Brand, capability variants, nav links, `+ Book` gating,
cart indicator, account control and account menu are byte-identical, including the
`data-capability` / `data-booking` / `data-retail` / `data-state` hooks.

### `PageHeader.js` — no findings

The only difference is the first-line header comment (runtime `:1` vs design `:1`).
Markup and both `data-bind` hooks are identical.

### A-20 `drift` — `AccountBootstrap` reports the preserved intended route, not the current route

- runtime `runtime/src/components/shell/AccountBootstrap.js:18-20,75`
  (`state.session.intendedRoute || state.route`).
- design `design-inbox/src/components/shell/AccountBootstrap.js:18-19,74`
  (`state.route`).

The design's own header comment (identical on both sides, `:6-7`) says *"The
intended route is PRESERVED in state.route and exposed as data-intended-route"*.
Production preserves it in `state.session.intendedRoute` instead
(`runtime/src/router.js:55`) because the router redirects `state.route`. Reading
the preserved value therefore **satisfies** the accepted contract that the design
comment describes; reading `state.route` in production would not.

**Route: accepted with reason.** Both `data-route` and `data-intended-route` on the
gate now carry the route the customer asked for — which is what the design intended.

### A-21 `design-gap` — `state.account` can hold values outside the accepted seven-state grammar, and the gate then renders an empty card

- runtime `runtime/src/modules/index.js:147`
  (`context.state.account = error && error.code || "customer-unavailable";`) — the
  account module assigns **whatever error code the adapter threw**.
- runtime `runtime/src/adapters/core-account-adapter.js` throws, in addition to the
  seven accepted codes: `fetch-unavailable` `:21`, `unsupported-module` `:25`,
  `session-required` `:38`, `invalid-session-user` `:53`,
  `invalid-customer-account` `:83`, `customer-scope-mismatch` `:85`,
  `organization-required` `:112`, `invalid-response` `:121`/`:131`,
  `origin-required` `:136`, `cross-origin-service` `:138`, `core-request-failed` `:123`.
- runtime `runtime/src/components/shell/AccountBootstrap.js:22-80` — the
  `if / else if` chain has no `else`. For any of those codes the card is appended
  with **no glyph, no title, no copy and no action**, while `:19-20` stamp the raw
  code into `data-state` and `data-screen-label`.
- design `design-inbox/src/components/shell/AccountBootstrap.js:5-6` and
  `design-inbox/data/scenarios.json:473-479` declare exactly seven states.
  Counterpart for the eleven extra codes: **absent.**

The confirmation the wave asked for: the runtime emits **exactly** the accepted
seven and no more *as authored branches* (verified — see the grep in
`findings-copy-hooks-appointments.md` §H-4). The defect is that it can be *asked* to
render a state outside that set, and answers with a blank gate.

**Route: ticket + brief.** The ticket is the missing fallback (any unmapped code
should render the accepted `customer-unavailable` treatment, which is already
accepted "we can't open your account right now" copy — a restoration, not an
invention). The brief question for design is whether a distinct treatment is wanted
for transport failures.

### A-22 `drift` — `AppShell` renders the gated portal nav on public routes

- runtime `runtime/src/components/shell/AppShell.js:8,17`
  (`var gated = customerPortalGateActive() || (!isPublic() && state.account !== "ready");`
  … `gated ? TopNav(true) : (isPublic() ? PublicNav() : TopNav(false))`).
- design `design-inbox/src/components/shell/AppShell.js:10,18`
  (`var gated = !isPublic() && state.account !== "ready";` …
  `isPublic() ? PublicNav() : TopNav(gated)`).

`customerPortalGateActive()` (`runtime/src/state.js:482-486`) does not consider the
route, so on a **public** route with the portal gate active the runtime replaces
`PublicNav` with the gated `TopNav`. The design guarantees `PublicNav` on every
public route. This is a visible shell swap, not a hook change.

**Route: ticket.** Restoring `isPublic()` precedence restores the accepted state.

### A-23 `drift` — `data-account-state` leaks onto public routes

- runtime `runtime/src/components/shell/AppShell.js:12`
  (`"data-account-state": gated || !isPublic() ? state.account : undefined`).
- design `design-inbox/src/components/shell/AppShell.js:14`
  (`"data-account-state": isPublic() ? undefined : state.account`).

Same root cause as A-22: when `gated` is true the attribute is emitted regardless of
`isPublic()`. Low severity on its own, but it is a contract attribute and any
public-surface selector will now see it.

**Route: fold into the A-22 ticket.**

### A-24 `invention` — `data-visual-id="support-dismiss"` does not exist in the design source

- runtime `runtime/src/components/shell/AppShell.js:24`.
- design `design-inbox/src/components/shell/AppShell.js:28` — the same button, same
  class, same action, **no `data-visual-id`.**

Verified negative grep in `findings-copy-hooks-appointments.md` §H-6. It is the only
stable-hook value the appointments-family runtime emits that the design source does
not contain. No evidence file justifies it. It is additive and harmless at render
time, but `master.md` §Scope makes hooks contract and `slices.md` §D3 requires each
one to exist in the design source or be justified by a recorded decision.

**Route: ticket (low severity).** Either remove it, or record the decision that adds
it — do not leave it undeclared.

### A-25 `drift` — `data-booking` on the shell is passed through unnormalised

- runtime `runtime/src/components/shell/AppShell.js:14`
  (`capability === "target-appointments" ? state.spaBooking : undefined`).
- design `design-inbox/src/components/shell/AppShell.js:16`
  (`cap === "target-appointments" ? (state.spaBooking === "open" ? "open" : "closed") : undefined`).

Today the values coincide: `runtime/src/state.js:506` constrains `state.spaBooking`
to `"open" | "closed"`, and no other assignment exists. The design normalises
defensively; the runtime does not, so any future writer of `state.spaBooking` can
put an out-of-contract value straight into the DOM.

**Route: accepted with reason today, ticket if `state.spaBooking` ever gains a
third value.** Recorded so the removal of the normalisation is a known choice rather
than an accident.

### A-26 `gap` — the shared `ActionButton` no longer renders the accepted pending treatment

- runtime `runtime/src/components/primitives/ActionButton.js:5-15` — `props.pending`,
  `props.pendingLabel` and `props.state` are **accepted and ignored**: no
  `data-state="pending"`, no `aria-busy`, no `.btn-spinner`, no pending label, and
  `disabled` no longer covers the pending case.
- design `design-inbox/src/components/primitives/ActionButton.js:5-20` renders all
  of it.

The appointments surfaces pass those props on every in-flight control and get
nothing back: runtime `runtime/src/routes/SpaAppointmentsPage.js:197`
(`pending: phase === "pending", pendingLabel: "Cancelling…"`),
`runtime/src/routes/SpaAppointmentDetailPage.js:130` (same), and
`runtime/src/components/spa/SpaBookingFlow.js:199,284`
(`"Holding…"`, `"Confirming…"`). So the accepted in-flight treatment for **Cancel
visit**, **Hold this time** and **Book — no charge** is not rendered, and the button
is not disabled while the command is in flight — a duplicate-submit exposure that
`ARCHITECTURE.md` §State And Command Grammar explicitly requires
("prevent duplicate submission").

`ActionButton.js` is a **shared primitive outside this family's owned files**; the
account and commerce agents will see the same root cause on their surfaces. Recorded
here because it removes an accepted state from four appointments controls.

**Route: ticket, single fix at the primitive.** Deduplicate against the other two
findings files at closeout.

---

## 5. Styles — read-only comparison

`base.css`, `components.css`, `shell.css`, `tokens.css` are **byte-identical**.

### S-01 `drift` — `.link-action` carries an added control reset

- runtime `runtime/styles/routes.css:655-670`.
- design `design-inbox/styles/routes.css:655`
  (`.link-action { font-weight: 600; font-size: 13px; color: var(--accent); cursor: pointer; }`).

The runtime adds `-webkit-appearance`, `appearance`, `margin`, `padding`, `border`,
`background`, `font-family`, `line-height`, `text-align`, `text-decoration`. On the
appointments family every `.link-action` is a `<span>` (runtime
`SpaAppointmentsPage.js:47,166,169,208,235`;
`SpaAppointmentDetailPage.js:39,103,137`; `SpaBookingFlow.js:78,79,174,293`), and a
`<span>` already carries those values, so the effect on these surfaces is **nil**.
No `<button class="link-action">` exists anywhere in `runtime/src` (verified: the
button-form grep returns no hit).

**Route: accepted with reason** for this family; D5 should still measure it, since
the rule is global.

### S-02 `drift` — the Wave-16 block was relocated within `routes.css`

- design `design-inbox/styles/routes.css:1414-1523`; runtime
  `runtime/styles/routes.css:1685-1794` (moved after the Wave-17 product-detail
  block). Rule text is identical.

Verified inert: the two files have **identical selector sets** and neither contains
a duplicated selector, so no cascade tie changes. (Checked programmatically over
every top-level selector in both files.)

**Route: accepted with reason.**

### S-03 `drift` — `responsive.css` differs by one trailing blank line

- design `design-inbox/styles/responsive.css:174` (trailing blank line present);
  runtime `runtime/styles/responsive.css` ends at `:173`.

No rule difference. All `.vw-mobile .appt-*` rules are identical.

**Route: accepted with reason.**

---

## 6. Inventory note for D1 (not a presentation finding)

`runtime/manifest.json` does not declare fifteen appointments-family component ids
that `design-inbox/manifest.json` does and that the runtime **actually emits**:

`account-bootstrap`, `account-control`, `account-entry`, `account-menu`,
`appointment-empty`, `appointment-list`, `appointment-row`, `booking-hold`,
`booking-review`, `booking-steps`, `next-appointment`, `slot-grid`, `spa-account`,
`support-unavailable`, `visit-mode`.

Each is proven present in the runtime source by the greps in
`findings-copy-hooks-appointments.md` §H-1 … §H-3. Per `slices.md` §D1 *"the
manifest must describe reality"*, this is a manifest under-declaration, not a
runtime gap. Routed to D1 / `evidence/manifest-diff.md`; not edited here.

---

## 7. What I could not check

- **No rendered pixels.** Every verdict above is source-level. Playwright was not
  run for this slice (D5 owns it), so nothing here is a statement about layout,
  spacing or colour at 390 / 768 / 1180 / 1440.
- **No live session.** The live-mode behaviour described in A-04, A-05, A-06, A-07,
  A-13, A-16 and A-19 is read from the adapter source and from
  `../calm-harbor-customer-portal-full-activation-program/evidence/S3.md`; it was not
  exercised against staging in this slice.
- **The legacy-drawer hazard is latent, not demonstrated.** See judgment call J-3 — I
  could not demonstrate an ungated `booking.open` entry point on the Spa surfaces.
- **The `design-inbox` app was not served and clicked.** `slices.md` §Overview asks
  for that; this slice compared executable source, styles, fixtures, manifests and
  the check scripts instead. Any finding that would only show up in the browser is
  outside what this file proves.

---

## Judgment calls

*(For the operator to merge into `audits/A1.md` at closeout — written here rather
than in A1 because three agents are running concurrently.)*

**J-1 — Findings whose root cause sits outside the owned files were recorded, not
dropped.** A-06, A-07 (`core-spa-demo-adapter.js`), A-21 (`modules/index.js`,
`core-account-adapter.js`) and A-26 (`primitives/ActionButton.js`) decide what the
appointments surfaces render. Dropping them would have produced a clean but false
appointments verdict. Each is explicitly labelled with its owner so the operator
routes it correctly, and A-26 is flagged as likely-duplicated by the other two
surface agents.

**J-2 — "Behaviour-preserving in fixture mode" was proved, not assumed.** For A-03
I checked `runtime/data/fixtures.js:465-470` to confirm `nextVariants` carry no
`allowedActions` before calling the change behaviour-preserving. For A-25 I checked
that `state.spaBooking` has exactly one writer. For S-02 I compared selector sets
programmatically rather than eyeballing the diff.

**J-3 — One booking-family risk is recorded as latent rather than as a live
defect.** `runtime/src/actions.js:503-505` adds `&& state.spaBooking === "open"` to
`spaFlowCapable()`, which the design (`design-inbox/src/actions.js:509`) does not
have. In the runtime a `booking.open` dispatched while booking is closed therefore
falls through to the legacy drawer (`runtime/src/app.js:31-38`), whose review claims
*"Your time is held for 10 minutes while you review — confirming books it."* — copy
that `../calm-harbor-customer-portal-full-activation-program/evidence/S1.md` §7.3
forbids. In the design that path is unreachable because `spaFlowCapable()` and
`spaBridge` share one condition. I traced every `booking.open` call site reachable
from a Spa route (`SpaAppointmentsPage.js:114,180`,
`SpaAppointmentDetailPage.js:113`, `SpaCatalogPage.js:93`, `SpaTopNav.js:63`) and
**all of them are gated on `spaBookingOpen()`**, and the Care entry
(`BeautyCareHub.js:43`) is wrapped in `markCareControlUnavailable`. I could not
demonstrate the state from the UI, so I did not file it as a reachable defect. It is
recorded here because closing the `spaFlowCapable` divergence, or removing the
`spaBridge` review from the legacy drawer, would remove the hazard permanently.

**J-4 — Two `master.md` known starting points were confirmed rather than
rediscovered.** The appointment `attention` question is answered in A-12
(**transfer**, with the live path emitting no `attention` at all). The `data-state`
grammars for the booking flow and the account gate are confirmed in
`findings-copy-hooks-appointments.md` §H-4 and §H-5: the runtime emits exactly the
accepted sets, with the one caveat recorded as A-21.

**J-5 — Nothing outside the two findings files was touched.** `design-inbox/**`,
`runtime/**`, `manifest.json`, `master.md`, `audits/A1.md`, `scripts/**` and the
other agents' findings files are all unmodified; confirmed by `git status --short`.
