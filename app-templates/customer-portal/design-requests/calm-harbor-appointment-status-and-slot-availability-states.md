# Design Request: Calm Harbor Appointments — Status and Slot-Availability States

## Context

The appointments surface is the portal's home screen and carries the highest
trust: `Confirmed` on an appointment is the strongest claim the product makes.
The accepted design (`design-inbox/src/routes/SpaAppointmentsPage.js`,
`SpaAppointmentDetailPage.js`, `components/spa/SpaBookingFlow.js`) declares in
its own header that customer status labels are placeholders for a
**backend-owned approved mapping**, "never derived from raw Core statuses in the
browser" (`design-inbox/src/routes/SpaAppointmentsPage.js:5-7`).

The audit found four gaps where a state the customer can reach has no accepted
treatment, and one where an accepted treatment can never be reached.

This request is presentation-only. It does not authorize an API, a permission,
a mutation, a booking hold, or any new data field.

Audit reference: `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/evidence/punch-list.md`
findings `A-05`, `A-08`, `A-17`, `A-19`, `C-22`.

## User Goal

A customer sees the true state of every visit — including the ones the original
design did not anticipate — and is never shown a booking option the studio
cannot honour.

## Route

`orders.list` under the appointments capability — `data-visual-id="spa-appointments"`;
`appointment.detail` — `data-visual-id="appointment-detail"`;
the booking drawer — `data-visual-id="booking-drawer"`, `data-module="booking-flow"`
carrying `data-state` = `context | specialist | slots | review`.

## Required States

### 1. `In progress` has no accepted treatment (`A-05`)

Core emits `IN_PROGRESS` and the runtime maps it to the label `In progress`, but
the accepted badge vocabulary has no variant for it. A visit happening right now
renders with the neutral fallback badge — the same as one merely scheduled.

Requested: a badge variant and, if warranted, a card treatment for a visit that
is currently under way. This is the one status where "now" is the whole meaning.

### 2. `Needs confirmation` is designed but unreachable (`A-08`)

The inverse case, recorded so the designer knows it is deliberate rather than
forgotten. `design-inbox/data/fixtures.js:797` declares the badge and `:964,966`
exercise it, but no Core workflow state maps to it.

Requested: **confirm the treatment should stay** against a future mapping, or
say it should be retired. No new design work either way — this is a keep/retire
decision the audit cannot make.

### 3. The accepted blocking states have no runtime trigger (`A-17`)

The accepted booking flow declares blocking states the live path never produces.
Combined with `A-19` below, the flow can reach `review` with nothing having been
verified.

Requested: for each accepted blocking state, either confirm it is correct as
designed and awaits a server contract, or state which should be removed. The
audit's constraint: **booking without server holds is a settled product
decision** — do not reintroduce a hold. Please confirm the no-hold copy and the
"Review this time" label remain the accepted answer.

### 4. The specialist step can never appear in live mode (`A-19`)

`booking-flow` declares `data-state="specialist"` as one of four steps. In live
mode `eligibleSpecialists` is never populated, so the step is skipped and the
flow runs `context → slots → review`.

Requested: confirm whether `specialist` remains a declared step awaiting a
server contract, or whether the accepted flow is three steps with specialist as
a conditional. This changes the step indicator's accepted composition, which is
why it needs an answer rather than a guess.

### 5. `add-to-bag … succeeded-readback` is declared with no treatment (`C-22`)

Declared in the wave-17 grammar; neither source renders anything for it.
Requested: the treatment, or confirmation that success is intentionally
treatment-free because it renders only as the readback replacing the control.

## A finding against the design, for the same review

**Slot availability has no server contract at all** (`A-16`, and
`…/calm-harbor-customer-portal-full-activation-program/evidence/S0.md` §3). The
runtime currently renders fixture availability in live mode and books against
it, which is ticketed as a runtime defect. But the accepted design assumes
server-returned slots that do not exist yet.

Requested: the **honest state for "we cannot show you availability"** — the
booking flow's `slots` step when the server provides nothing. Without it, fixing
the runtime defect leaves the step with nothing to render.

This is the highest-value item in this brief: it is the design counterpart the
runtime fix needs.

## Required Actions

Unchanged and gated on server-provided `allowedActions`:
`booking.open`, `booking.back`, `booking.close`, `booking.selectService`,
`booking.selectSlot`, `booking.selectSpecialist`, `booking.ackPolicy`,
`booking.confirm`, `booking.retry`, `appointment.cancel`,
`appointment.reschedule`, `appointment.bookAgain`, `appointment.openPurchase`.

No new action name is requested. `booking.hold` must **not** be reintroduced.

## Dynamic Data Shape

Unchanged wave-16 read models. Every option, price and label is server-returned:

```
appointment.{ ref, service, start, timezoneNote, specialist, visitMode, location,
              customerStatus, displayPrice, reference, attention,
              relatedPurchaseRef, allowedActions, version }
booking.{ ref, version, source, service, planRef, eligibleSpecialists,
          eligibleSlots, review, paymentMode: SIMULATED, displayTotal, policy,
          allowedActions }
```

`specialist`, `location`, `visitMode` and `displayPrice` are **optional** and
frequently absent. The design already provides the honest fallback
(`design-inbox/src/routes/SpaAppointmentsPage.js:146`,
`" · location details not provided yet"`) — please keep it; the runtime
currently bypasses it with a fabricated constant, which is ticketed.

`eligibleSlots` may be empty or absent. That is the case §"A finding against the
design" asks you to cover.

## Responsive Requirements

390 / 768 / 1180 / 1440, light and dark. 390 is the primary width for this
surface.

- A status badge must not push the service name to a second line at 390.
- The booking drawer's step indicator must survive both three and four steps at
  390 without reflowing the body.
- An appointment card with every optional field absent must keep the same
  footprint as a fully populated one — no column shift in a mixed list.

## Reusable Source Components

- `appointment-row`, `appointment-list`, `appointment-empty`, `next-appointment`
- `appointment-detail`, `appointment-detail-card`, `visit-mode`
- `booking-flow`, `booking-steps`, `booking-review`, `slot-grid`
- `status-badge`, `action-button`, `empty-state`, `unavailable-state`

## Data-Ownership Constraints

- Customer status labels are a **backend-owned approved mapping**. This request
  asks for treatments, not for the browser to derive a label. Where no mapping
  exists the honest output is the unmapped treatment, not a guess.
- No appointment id, Core workflow code or raw status in the UI;
  `data-appointment-ref` carries the opaque ref only.
- Never render an availability option the server did not return.
- Booking without server holds is settled. No hold timer, no "held for N
  minutes" copy.

## Acceptance

- `In progress` beside `Confirmed` and `Completed` at 390 — the three
  unambiguous side by side.
- The `slots` step with no server availability, 390 and 768.
- The booking flow's step indicator at three and four steps, 390.
- An appointment card with all optional fields absent, 390, beside a full one.
- A keep/retire answer on `Needs confirmation` and on the `specialist` step —
  prose is fine, no mockup needed.
