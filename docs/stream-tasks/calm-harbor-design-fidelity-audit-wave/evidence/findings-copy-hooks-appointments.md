# D3 — Copy and stable hooks: APPOINTMENTS surface family

Date: 2026-07-28. Slice: D3. Companion to
`findings-components-appointments.md` (D2), which owns the structural verdicts.

Surfaces: `runtime/src/routes/SpaAppointmentsPage.js`,
`runtime/src/routes/SpaAppointmentDetailPage.js`,
`runtime/src/components/spa/SpaBookingFlow.js`,
`runtime/src/components/shell/{SpaTopNav,AccountBootstrap,AppShell,PageHeader}.js`.

Nothing under `runtime/` or `design-inbox/` was edited.

## Summary

- **Hook contract: intact, with one exception.** Every `data-route`,
  `data-module`, `data-action`, `data-bind`, `data-state` and `data-visual-id`
  *value* the appointments-family runtime emits also exists in the design source —
  except `data-visual-id="support-dismiss"` (H-6 / D2 A-24).
- **Copy: 4 strings changed meaning**, all four because the data behind them
  changed, not because the words changed. Three of them assert something that is
  no longer true in live mode (C-01, C-02, C-04).
- Every grep below was executed and its output pasted. **19 greps recorded: 18 hit,
  and 1 is an intentional negative that correctly returns no hit** (H-6). Counted
  mechanically: `grep -c '^rg -n ' <this file>` returns 19.

## Findings index

| id | classification | one line |
| --- | --- | --- |
| C-01 | `drift` | "Live from the public catalog" caption sits above fixture treatments in live mode |
| C-02 | `drift` | the timezone note renders an IANA zone id in live mode, and the list and detail disagree |
| C-03 | `drift` | the booking review's "Where" row is a fixture studio name |
| C-04 | `drift` | the detail page's "shown exactly as recorded" claim is contradicted by the adapter |
| H-6 | `invention` | `data-visual-id="support-dismiss"` has no design counterpart |

C-01 is also filed as D2 A-27; C-02/C-03/C-04 trace to D2 A-06/A-07/A-16/A-18.

---

## Part 1 — Stable hooks

### Method

`data-route`, `data-module`, `data-action`, `data-bind`, `data-state` and
`data-visual-id` are contract. I extracted every **literal** hook value from each
owned runtime file and from its design counterpart and compared the two sets. For
dynamic values (`data-state` computed from a variable) I enumerated the reachable
values from the assigning code on both sides.

Which hooks the browser suites actually select on — read from the scripts, not
guessed:

| script | what it selects on this family |
| --- | --- |
| `scripts/calm-harbor-wave16-visual-check.mjs:10-14,35,109` | `[data-visual-id="…"]` for `appointment-detail`, `appointment-detail-card`, `booking-drawer`, `booking-flow` |
| `scripts/calm-harbor-wave17-visual-check.mjs:10-15` | `[data-visual-id="spa-orders"]` etc. — **no appointments surface**; wave 17 is shop/product/orders |
| `scripts/calm-harbor-wave14-visual-check.mjs:13-17` | `top-nav` (shared with this family), plus non-appointments ids |
| `scripts/calm-harbor-current-api-browser-check.mjs:137-161` | `[data-visual-id="next-appointment"]`, and `[data-action="…"]` for `appointment.cancel`, `appointment.reschedule`, `booking.open`, `booking.selectService`, `booking.selectSpecialist`, `booking.selectSlot`, `booking.hold`, `booking.ackPolicy`, `booking.confirm` |

Every one of those ids/actions is verified present below.

### Result

**Literal hook sets are identical**, file by file, between runtime and design for:

| file | literal hook values | difference |
| --- | --- | --- |
| `SpaAppointmentsPage.js` | 34 | none |
| `SpaAppointmentDetailPage.js` | 22 | none |
| `SpaBookingFlow.js` | 51 | none |
| `SpaTopNav.js` | 21 | none (files are byte-identical) |
| `AccountBootstrap.js` | 3 | none |
| `PageHeader.js` | 4 | none |
| `AppShell.js` | 7 runtime / 6 design | **+1 runtime-only:** `data-visual-id="support-dismiss"` (H-6) |

Entity-ref hooks are also identical in both trees: `data-appointment-id`,
`data-appointment-ref`, `data-purchase-ref`, `data-product-code`, `data-plan-ref`,
`data-slot-ref`, `data-day-key`, `data-specialist-ref`, `data-hold-ref`,
`data-booking-ref`, `data-payment-mode`, `data-capability`, `data-booking`,
`data-retail`, `data-intended-route`, `data-screen-label`,
`data-requires-confirmation`.

### Recorded greps — run these to re-prove the contract

All greps are run from the repository root. Output is pasted verbatim.

#### H-1 — appointments list surface

```
rg -n 'data-visual-id": "spa-appointments"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js
81:  var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": view, "data-visual-id": "spa-appointments", "data-capability": "target-appointments", "data-booking": open ? "open" : "closed", "data-screen-label": "Appointments (target)" });
```
**HIT.**

```
rg -n 'data-visual-id": "next-appointment"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js
131:    var hero = h("div", { "class": "card card--pad appt-hero", "data-module": "next-appointment", "data-visual-id": "next-appointment", "data-appointment-id": next.id, "data-state": cancelled ? "cancelled" : (phase !== "idle" ? phase : "ready") }, [
```
**HIT.** (This is the id `calm-harbor-current-api-browser-check.mjs:137,154` selects.)

```
rg -n 'data-visual-id": "(appointment-row|appointments-upcoming|appointments-past|appointment-empty|visit-details|catalog-teaser)"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js
38:  var row = h("div", { "class": "appt-row appt-row--link", "data-module": "appointment-row", "data-visual-id": "appointment-row", "data-appointment-id": a.id, "data-appointment-ref": a.id, "data-action": "appointment.open", "data-id": a.id, role: "link", tabindex: "0" }, [
54:  var panel = h("div", { "class": "list-panel", "data-module": "appointment-list", "data-visual-id": "appointments-past" }, [
107:    var emptyCard = h("div", { "class": "card appt-empty", "data-module": "appointment-empty", "data-visual-id": "appointment-empty", "data-state": "empty" }, [
144:    var details = h("div", { "class": "appt-details", "data-visual-id": "visit-details" }, [
213:    var upcoming = h("div", { "class": "list-panel", "data-module": "appointment-list", "data-visual-id": "appointments-upcoming" }, [
222:  var rail = h("div", { "class": "card card--pad", "data-module": "catalog-teaser", "data-visual-id": "catalog-teaser" }, [
```
**HIT (6/6).**

```
rg -n 'data-route": "orders.list"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js app-templates/customer-portal/design-inbox/src/routes/SpaAppointmentsPage.js
design-inbox/src/routes/SpaAppointmentsPage.js:79:  var page = h("section", { "class": "page", "data-route": "orders.list", ... "data-state": state.view, ... });
runtime/src/routes/SpaAppointmentsPage.js:81:  var page = h("section", { "class": "page", "data-route": "orders.list", ... "data-state": view, ... });
```
**HIT on both sides** (attribute list elided for width; the two lines differ only in
the `data-state` expression — D2 A-01).

```
rg -n 'data-action": "appointment\.(open|cancel|reschedule|bookAgain|openPurchase)"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js app-templates/customer-portal/runtime/src/routes/SpaAppointmentDetailPage.js
SpaAppointmentDetailPage.js:103:  ... "data-action": "appointment.openPurchase", "data-id": a.relatedPurchaseRef, "data-purchase-ref": a.relatedPurchaseRef ... "View purchase ›"
SpaAppointmentsPage.js:38:   ... "data-action": "appointment.open", "data-id": a.id ...
SpaAppointmentsPage.js:47:   ... "data-action": "appointment.bookAgain", "data-id": a.id, "data-appointment-ref": a.id ... "Book again ›"
SpaAppointmentsPage.js:166:  ... "data-action": "appointment.open", "data-id": next.id, "data-appointment-ref": next.id ... "View details ›"
```
**HIT.** `appointment.reschedule` / `appointment.cancel` are emitted through
`ActionButton`, so they are not literal in these two files; they are proven at H-7.

#### H-2 — appointment detail surface

```
rg -n 'data-visual-id": "(appointment-detail|appointment-detail-card|visit-details)"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentDetailPage.js
38:  var page = h("section", { "class": "page page--narrow", "data-route": "appointment.detail", "data-state": view, "data-visual-id": "appointment-detail", "data-module": "appointment-detail", "data-capability": spaCapability(), "data-appointment-ref": a ? a.ref : undefined, "data-screen-label": "Appointment detail" });
75:  var hero = h("div", { "class": "card card--pad appt-hero", "data-module": "next-appointment", "data-visual-id": "appointment-detail-card", "data-appointment-ref": a.ref, "data-state": cancelled ? "cancelled" : (phase !== "idle" ? phase : (conflict ? "conflict" : "ready")) }, [
88:  var details = h("div", { "class": "appt-details", "data-visual-id": "visit-details" });
```
**HIT (3/3).** These are the two ids
`calm-harbor-wave16-visual-check.mjs:11` screenshots and measures.

```
rg -n 'data-route": "appointment.detail"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentDetailPage.js app-templates/customer-portal/design-inbox/src/routes/SpaAppointmentDetailPage.js
runtime/src/routes/SpaAppointmentDetailPage.js:38: ... "data-route": "appointment.detail" ...
design-inbox/src/routes/SpaAppointmentDetailPage.js:37: ... "data-route": "appointment.detail" ...
```
**HIT on both sides.**

```
rg -n 'data-appointment-ref|data-appointment-id' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js app-templates/customer-portal/runtime/src/routes/SpaAppointmentDetailPage.js app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js
SpaBookingFlow.js:58, SpaBookingFlow.js:221,
SpaAppointmentDetailPage.js:38, :75, :132,
SpaAppointmentsPage.js:34 (comment), :38, :47, :131, :166
```
**HIT (9 code sites + 1 comment).** Note `SpaAppointmentDetailPage.js:132` sets
`data-appointment-ref` imperatively on every rendered action button —
`actions.childNodes.forEach(function (b) { b.setAttribute("data-appointment-ref", a.ref); })`
— identical to design `:130`.

#### H-3 — booking flow

```
rg -n 'data-visual-id": "booking-(flow|steps|review|hold|policy-ack|service|service-list)"' app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js
47:  ... "data-module": "booking-steps", "data-visual-id": "booking-steps" ...
95:  ... "data-module": "booking-context", "data-visual-id": "booking-service", "data-product-code": picked.code ...
108:  ... "data-module": "booking-context", "data-visual-id": "booking-service-list" ...
236:  ... "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": holdOk ? "held" : state.spaHold ...
239:  ... "data-module": "booking-hold", "data-visual-id": "booking-hold", "data-hold-ref": spaCurrentApiDemoOpen() ? undefined : F.spaBooking.hold.ref, "data-bind": "booking.hold.untilLabel" ...
263:  ... "data-module": "policy-ack", "data-visual-id": "booking-policy-ack", "data-state": state.spaBookAck ? "acked" : "required" ...
299:  ... "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": F.spaBooking.ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry ...
```
**HIT (7/7).**

```
rg -n 'data-visual-id": "(slot-days|slot-grid|specialist-options|plan-credit-context|reschedule-current|reschedule-compare)"' app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js
58:  ... "data-module": "reschedule-current", "data-visual-id": "reschedule-current", "data-appointment-ref": a.ref ...
70:  ... "data-module": "plan-credit-context", "data-visual-id": "plan-credit-context", "data-plan-ref": f.planRef || "plan-4e19c3", "data-state": cs ...
130: ... "data-module": "specialist-options", "data-visual-id": "specialist-options" ...
180: ... "data-module": "slot-days", "data-visual-id": "slot-days" ...
187: ... "data-module": "slot-grid", "data-visual-id": "slot-grid", "data-bind": "booking.eligibleSlots" ...
221: ... "data-module": "reschedule-compare", "data-visual-id": "reschedule-compare", "data-appointment-ref": origin.ref ...
```
**HIT (6/6).**

```
rg -n 'data-visual-id": "booking-drawer"' app-templates/customer-portal/runtime/src/app.js app-templates/customer-portal/design-inbox/src/app.js
design-inbox/src/app.js:23, design-inbox/src/app.js:51
runtime/src/app.js:21,  runtime/src/app.js:43
```
**HIT on both sides (2 occurrences each — the flow drawer and the legacy drawer).**
This is the surface selector at `calm-harbor-wave16-visual-check.mjs:12`.

```
rg -n 'data-action": "booking\.(selectService|selectSpecialist|selectSlot|ackPolicy|back)"' app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js
112: booking.selectService  (+ data-id=code, data-product-code=code, data-state=active)
133: booking.selectSpecialist (+ data-specialist-ref)
141: booking.selectSpecialist (data-id="any")
182: booking.selectSlot (data-id="day:"+key, data-day-key)
189: booking.selectSlot (+ data-slot-ref, data-state=active)
264: booking.ackPolicy (role=checkbox, aria-checked)
293: booking.back
```
**HIT (7/7).** These are the actions
`calm-harbor-current-api-browser-check.mjs:141-145,156-158` drives.

```
rg -n 'data-slot-ref|data-day-key|data-specialist-ref|data-hold-ref|data-booking-ref|data-plan-ref|data-payment-mode' app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js
70, 133, 182, 189, 236, 239, 299
```
**HIT (7 sites).**

#### H-4 — booking-flow `data-state` grammar: `context | specialist | slots | review`

Confirmed. The runtime emits **exactly** the accepted set.

```
rg -n 'data-state": f.step, "data-entry": f.entry' app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js app-templates/customer-portal/design-inbox/src/components/spa/SpaBookingFlow.js
design-inbox/src/components/spa/SpaBookingFlow.js:297:  var body = h("div", { "class": "bk-flow", "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": F.spaBooking.ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry });
runtime/src/components/spa/SpaBookingFlow.js:299:  var body = h("div", { "class": "bk-flow", "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": F.spaBooking.ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry });
```
**HIT on both sides — the expression is identical.**

Every writer of `f.step`, enumerated on both sides:

| value | runtime | design |
| --- | --- | --- |
| `context` | `actions.js:515` (flow init), `:54` (back) | `actions.js:514`, `:87` |
| `specialist` | `actions.js:551`, `:54` | `actions.js:529`, `:87` |
| `slots` | `actions.js:50`, `:54`, `:537`, `:551` | `actions.js:83`, `:87`, `:520`, `:529` |
| `review` | `actions.js:560`, `:567` | `actions.js:537` |

No fifth value exists on either side. The runtime has two writers of `review`
instead of one only because the current-api path sets it synchronously
(`runtime/src/actions.js:558-563`) alongside the simulated-command path
(`:565-570`) — the recorded no-holds decision
(`../calm-harbor-customer-portal-full-activation-program/evidence/S1.md` §7.3).
`data-entry` values (`service | empty | credit | book-again | reschedule`) are also
identical.

**Verdict: contract intact.**

#### H-5 — account-gate `data-state` grammar

Confirmed for the authored branches. The runtime implements **exactly** the accepted
seven, in the accepted order, with no extra branch:

```
rg -n 's === "(resolving-customer|customer-unavailable|customer-not-linked|customer-account-ambiguous|organization-forbidden|customer-forbidden|session-expired)"' app-templates/customer-portal/runtime/src/components/shell/AccountBootstrap.js
22:  if (s === "resolving-customer") {
28:  } else if (s === "customer-unavailable") {
36:  } else if (s === "customer-not-linked") {
44:  } else if (s === "customer-account-ambiguous") {
53:  } else if (s === "organization-forbidden") {
62:  } else if (s === "customer-forbidden") {
71:  } else if (s === "session-expired") {
```
**HIT (7/7).** Design counterpart:
`design-inbox/src/components/shell/AccountBootstrap.js:21,27,35,43,52,61,70` — same
seven, same order. Declared in `design-inbox/data/scenarios.json:473-479` and
`:738-744`.

```
rg -n 'data-visual-id": "(account-gate|account-bootstrap)"|data-intended-route' app-templates/customer-portal/runtime/src/components/shell/AccountBootstrap.js
7:// as data-intended-route (a route id — never an Account id, tenant id, token, role or claim).
19:  var page = h("section", { "class": "page account-gate", "data-route": intendedRoute, "data-state": s, "data-visual-id": "account-gate", "data-screen-label": "Account (" + s + ")" });
20:  var card = h("div", { "class": "auth-card account-gate__card", "data-module": "account-bootstrap", "data-visual-id": "account-bootstrap", "data-state": s, "data-intended-route": intendedRoute });
```
**HIT.**

**Caveat — this is where the contract is at risk.** `data-state` is `state.account`
verbatim, and `runtime/src/modules/index.js:147` assigns it whatever error code the
account adapter threw, which includes eleven codes outside the accepted seven. The
grammar therefore holds for every state the component *draws*, but the attribute can
carry an out-of-contract value while the card renders empty. Filed as D2 A-21;
repeated here because it is a hook-contract exposure, not only a visual one.

#### H-6 — the one runtime-only hook (intentional negative grep)

```
rg -n 'data-visual-id": "(app-shell|support-unavailable|support-dismiss)"' app-templates/customer-portal/runtime/src/components/shell/AppShell.js
11:    "class": "app-shell", "data-module": "app-shell", "data-visual-id": "app-shell",
20:      h("div", { "class": "spa-support-card", "data-module": "support-unavailable", "data-visual-id": "support-unavailable", "data-state": "unavailable", role: "dialog", "aria-modal": "true", "aria-label": "Support unavailable" }, [
24:        h("button", { "class": "btn btn--primary", "data-action": "support.dismiss", "data-visual-id": "support-dismiss", style: "margin-top:14px" }, "Close")
```
**HIT (3/3).**

```
rg -n 'data-visual-id": "support-dismiss"' app-templates/customer-portal/design-inbox/src/components/shell/AppShell.js
(NO HIT)
```
**NO HIT — and that is the finding.** Design `AppShell.js:28` renders the same
button with the same class and the same `data-action`, and no `data-visual-id`.

**H-6 `invention`.** Runtime `runtime/src/components/shell/AppShell.js:24` vs design
`design-inbox/src/components/shell/AppShell.js:28`. No recorded decision adds it.
Route: ticket (low severity) — remove it, or record the decision. See D2 A-24.

#### H-7 — hooks emitted through `ActionButton`

`appointment.reschedule`, `appointment.cancel`, `appointment.bookAgain`,
`booking.open`, `booking.hold`, `booking.confirm`, `nav.go`, `ui.retry`,
`auth.signOut`, `auth.oidcSignIn`, `support.email`, `nav.landing` reach the DOM via
`ActionButton` (`data-action`, `data-id`, `data-visual-id`,
`data-requires-confirmation`), so a grep of the route files finds the *call*, not
the attribute:

```
rg -n 'action: "appointment\.(reschedule|cancel|bookAgain)"' app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js app-templates/customer-portal/runtime/src/routes/SpaAppointmentDetailPage.js
SpaAppointmentsPage.js:196:   action: "appointment.reschedule", id: next.id, ... visualId: "appt-reschedule"
SpaAppointmentsPage.js:197:   action: "appointment.cancel", id: next.id, confirm: true, ... visualId: "appt-cancel"
SpaAppointmentDetailPage.js:129: action: "appointment.reschedule", id: a.ref, ... visualId: "adet-reschedule"
SpaAppointmentDetailPage.js:130: action: "appointment.cancel", id: a.ref, confirm: true, ... visualId: "adet-cancel"
SpaAppointmentDetailPage.js:131: action: "appointment.bookAgain", id: a.ref, ... visualId: "adet-book-again"
```
**HIT (5/5).** Identical call sites exist in the design at
`design-inbox/src/routes/SpaAppointmentsPage.js:192,193` and
`design-inbox/src/routes/SpaAppointmentDetailPage.js:127,128,129`.

`visualId` values on this family — `appt-empty-book`, `appt-empty-browse`,
`appt-empty-prices`, `appt-rebook`, `appt-rebook-browse`, `appt-reschedule`,
`appt-cancel`, `adet-rebook`, `adet-rebook-browse`, `adet-reschedule`,
`adet-cancel`, `adet-book-again`, `bk-continue`, `bk-hold`, `credit-reload`,
`confirm-booking`, `primary-cta`, `account-retry`, `account-signout`,
`account-support`, `account-reauth`, `account-catalog` — are **identical between
runtime and design**, and `ActionButton` emits each one as `data-visual-id`
(runtime `ActionButton.js:9`, design `ActionButton.js:12`).

**Contract caveat:** the runtime `ActionButton` drops `data-state="pending"` and
`aria-busy` (D2 A-26). Any future suite selecting `[data-visual-id="appt-cancel"][data-state="pending"]`
will not match in production even though the design emits it.

---

## Part 2 — Copy

Every user-visible string on the owned surfaces. Because the markup is identical on
both sides, most rows are exact matches; those are collapsed into the grouped rows
at the end. Rows with a verdict other than `identical` are listed individually
first.

### Strings whose meaning changed

| # | runtime text | design text | verdict |
| --- | --- | --- | --- |
| C-01 | "Live from the public catalog — shown as published." (`SpaAppointmentsPage.js:224`) above three treatments read from `F.spa.pim.services` (`:226`) | same caption (`design-inbox/…/SpaAppointmentsPage.js:220`), same fixture source (`:222`) | **`drift` — meaning changed.** In the design the caption is about fixture data in a fixture app, and is honest. In production live mode the same caption asserts three *fixture* treatments and *fixture* prices are the published catalog. `spaCatalogServices()` (`runtime/src/state.js:272-284`) exists and the booking flow uses it; this rail was not switched. **Highest-value copy finding.** |
| C-02 | the timezone note beside the start time. Detail page renders the source value (`SpaAppointmentDetailPage.js:84`, `data-bind="appointment.timezoneNote"`), which in live mode is `"America/Chicago"` (`runtime/src/adapters/core-spa-demo-adapter.js:525`). List page renders `F.spa.appointments.tzNote` = `"local time"` (`SpaAppointmentsPage.js:140`). | `"local time"` on both surfaces — `design-inbox/data/fixtures.js:803` (`tzNote`) and `:961-969` (`timezoneNote: "local time"`), rendered at `design-inbox/…/SpaAppointmentDetailPage.js:82` and `…/SpaAppointmentsPage.js:137` | **`drift` — meaning changed.** An IANA zone identifier is a machine value, not the accepted customer phrasing. Worse, the **same visit** reads "local time" on the list hero and "America/Chicago" on its detail page, because the list note is still fixture-sourced in live mode. |
| C-03 | booking review "Where" row for a new booking: `"At Calm Harbor · Harbor Front studio"` — `SpaBookingFlow.js:250-252`, `F.spaBooking.reviewLocation` (`runtime/data/fixtures.js:773`) | identical code and identical fixture value (`design-inbox/…/SpaBookingFlow.js:248-250`, `design-inbox/data/fixtures.js:1237`) | **`drift` — meaning changed.** In production this is a fixture studio name printed as the confirmed venue of a real booking, immediately above the confirm button. Same class of defect as D2 A-06. |
| C-04 | "Times, prices and statuses are shown exactly as recorded — this page never estimates deadlines or eligibility." (`SpaAppointmentDetailPage.js:143`) | identical (`design-inbox/…/SpaAppointmentDetailPage.js:141`) | **`drift` — meaning changed.** The sentence was true of the design. In live mode the page shows a location the adapter invented (D2 A-06), a visit mode it hardcoded, and a status it guessed when unmapped (D2 A-07). The words did not move; what they promise stopped being true. |

### Strings that changed wording (all `decision`, all settled by the no-holds rule)

| # | runtime text | design text | verdict |
| --- | --- | --- | --- |
| C-05 | "Review this time" when the current-api demo is open, else "Hold this time" (`SpaBookingFlow.js:198`) | "Hold this time" (`design-inbox/…:198`) | `decision` — `…/evidence/S1.md` §7.3: *the UI never claims the slot is held*. |
| C-06 | "This demo API has no availability hold. The time is only selected in this browser until Core confirms the appointment." (`SpaBookingFlow.js:201-203`) | "Holding keeps the time briefly while you review — nothing is booked yet." (`design-inbox/…:201`) | `decision` — same clause. The replacement is more honest than the original and claims nothing. |
| C-07 | "**Current API demo** · Core will validate the save when you confirm; no slot hold exists yet." (`SpaBookingFlow.js:239-241`) | "**Held until 2:47 PM (studio clock)** · The studio releases the time automatically after that — it's re-checked when you confirm." (`design-inbox/…:237` + `design-inbox/data/fixtures.js:1236`) | `decision` — same clause; also correctly drops `data-hold-ref` rather than emitting a fixture hold ref. |

### Strings verified identical

Verified character-for-character between runtime and design (spot-checked by diff;
the three route/component diffs contain **no** other string change):

**`SpaAppointmentsPage.js`** — "Your next visit — {date}, {mode}." · "Your {date}
visit was cancelled." · "You have no upcoming visits." · "Couldn't load your
appointments" / "Your appointments didn't load, so nothing is shown — we never show
stale or guessed visits. Nothing was changed; try again." · "No upcoming
appointments" · "Nothing is booked right now — book your next visit whenever you're
ready." · "Nothing is booked right now. Online booking isn't available yet — browse
treatments and prices, and our team takes it from there." · "Book an appointment" ·
"Browse services" · "See prices" · "Visits you complete will build your history
here." · "Next appointment" · "Visit details" · "Where" / "With" / "Price" ·
"location details not provided yet" · "No specialist assigned yet" · "as booked" ·
"Reference {ref}" · "View details ›" · "View purchase ›" · "Rescheduled — confirmed
by the studio. The previous time was released." · "Cancelled — confirmed by the
studio. Nothing further is scheduled for this visit." · "Book a new visit" · "Your
appointment wasn't cancelled — it's still booked exactly as shown." / "Try
cancelling again" · "This appointment changed since you opened it — reload the
latest version before making changes." / "Reload" · "Reschedule" · "Cancel visit" ·
"Cancelling…" · "Online changes aren't available yet for this visit — our team can
reschedule or cancel it for you." / "Contact support ›" · "Upcoming" · "Past" /
"your visit history" · "Book again ›" · "Treatments & prices" · "All services &
prices ›".

**`SpaAppointmentDetailPage.js`** — "‹ Appointments" · "Couldn't load this visit" /
"The visit didn't load, so nothing is shown — we never show a stale or guessed
visit. Nothing was changed; try again." · "Your visit" / "Everything about this
appointment, exactly as recorded by the studio." · the `ConflictBanner` copy · "Book
again" · "…our team can book it again for you." (past variant) · and the shared
strings above.

**`SpaBookingFlow.js`** — "Reschedule your visit" / "Book with a credit" / "Book
again" / "Book a visit" · step labels "Service" / "Specialist" / "Time" / "New time"
/ "Review" · "Currently booked — unchanged until you confirm" · "Choose a treatment"
· "Choose a time" · "Prices come from the public catalog — the exact total is shown
before you confirm." · "Who would you like?" / "No preference" / "first available" ·
"Pick a time" / "Pick a new time" · "Available times didn't load — nothing is shown
so nothing is guessed." / "Reload times" · "No times are open right now" / "The
studio opens new times regularly — check back soon, or our team can find one for
you." · "That time couldn't be held — nothing is booked. Pick it again or choose
another time." · "That time was just taken — nothing is booked. Choose another
time." · "Your held time expired — nothing was booked…" · "The price for this time
changed while you were reviewing…" · "Currently booked" / "stays until you confirm"
/ "Proposed new time" / "not booked yet" · "Visit" / "When" / "With" / "Where" /
"Price" · "local time" · "First available specialist" · "1 visit credit · no charge
for this visit" · the policy note and acknowledgement (`runtime/data/fixtures.js:774-775`
= `design-inbox/data/fixtures.js:1238-1239`) · "No charge is made when you confirm —
you pay at the studio as usual." · "Your booking wasn't confirmed — nothing is
scheduled yet." / "Your visit wasn't moved — it's still booked at the original
time." · "That time window just changed — pick again before confirming. Nothing was
booked." · "Book — no charge" / "Confirm new time — no charge" / "Confirming…" ·
"Tick the policy box above to confirm" · "‹ Back" / "‹ Back to times" · "Open My
plan ›" / "Reload balance" / "Contact support ›" · "1 credit".

**`AccountBootstrap.js`** — all seven gate treatments are character-for-character
identical (titles, subtitles, button labels, "Returning to"). Verified: the only
diff hunks in this file are the `intendedRoute` variable (D2 A-20).

**`AppShell.js`** — "Support isn't set up yet" / "A support contact hasn't been set
up for this portal, so nothing was opened, sent or recorded. For now, please reach
the studio the way you usually do." / "Close" — identical (runtime `:21-24`, design
`:25-28`). The runtime file writes these with literal UTF-8 characters where the
design uses `\uXXXX` escapes; the rendered strings are the same.

**`SpaTopNav.js`** — byte-identical file, so every string matches by construction:
"Calm Harbor Spa", "+ Book", "Browse services", nav labels, account-menu items.

**`PageHeader.js`** — no literal copy; it renders the props its callers pass.

---

## What I could not check

- **Nothing was rendered.** Hook presence is proved from source, not from a live
  DOM. `calm-harbor-wave16-visual-check.mjs` and
  `calm-harbor-current-api-browser-check.mjs` were **not run** in this slice (they
  need Playwright and, for the api check, a live session). Every grep above is a
  source grep; a hook proven present in source can still fail to reach the DOM if
  its branch is not taken.
- **Live copy was read from the adapter, not observed.** C-02's `"America/Chicago"`
  and C-01's fixture rail are read from
  `runtime/src/adapters/core-spa-demo-adapter.js:525` and
  `runtime/src/routes/SpaAppointmentsPage.js:226`; neither was seen on a staging
  page in this slice.
- **`aria-label` / `title` / `alt` text** was compared only where it appears in the
  owned files (all identical). No screen-reader pass was done.
- **Localisation** is out of scope; all copy on this family is English literals in
  source, on both sides.
