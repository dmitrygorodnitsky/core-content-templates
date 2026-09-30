# Design Request: Calm Harbor Plan — Expired and Terminal Enrolment States

## Context

The accepted Calm Harbor plan surface (`design-inbox/src/routes/SpaPlanPage.js`)
defines the production composition for packages and memberships. It resolves a
plan's badge through `F.spaCommerce.plans.statusBadges[p.status]`
(`design-inbox/src/routes/SpaPlanPage.js:34`), and the accepted vocabulary is
exactly four labels (`design-inbox/data/fixtures.js:988`):

```
Active · Expiring soon · Cancelled · Used up
```

Two of the four have dedicated treatment branches: `Cancelled` relabels the date
row to "Ends" (`:46`) and `Used up` gets its own block (`:63`).

Core returns an `EXPIRED` enrolment state that maps to none of them. There is no
`Expired` entry in `statusBadges`, so the lookup falls through to
`status-badge--scheduled` — the neutral badge — and an expired plan renders as
if it were merely pending. The runtime is not guessing around this: the plans
adapter raises `plan-status-unmapped` rather than inventing a label, which is
correct and is why this is a design request rather than a fix.

This request is presentation-only. It does not authorize an API, a permission,
a mutation, or any new data field.

Audit reference: `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/evidence/punch-list.md`
findings `SG-03` / `AC-C17`, Known Starting Point 1.

## User Goal

A customer whose package or membership has ended can tell, at a glance, that it
has ended, when it ended, and what — if anything — they can still do with it.
An ended plan must never be mistakable for an active or upcoming one.

## Route

`plan` — `data-route="plan"`, `data-visual-id="spa-plan"`,
`data-module="spa-plan"`.

The plan card is `data-module="plan-card"` / `data-visual-id="plan-card"`
carrying `data-plan-ref` and `data-plan-kind`
(`design-inbox/src/routes/SpaPlanPage.js:35`).

## Required States

Keep all four accepted labels unchanged and add the terminal states below. Each
needs a badge variant and a card treatment.

| State | Applies to | User-facing meaning | Required treatment |
| --- | --- | --- | --- |
| `Expired` | `PACKAGE`, `MEMBERSHIP` | The enrolment reached its expiry date with credits or term remaining. | Visually terminal — clearly distinct from `Expiring soon`, which is still usable. The date row reads as a past fact. Any remaining-credit figure must read as forfeited or lapsed, not as a balance the customer can spend. |
| `Expired` + remaining credits > 0 | `PACKAGE` | Expired while credits were unused. | The `plan-usage` meter must not read as an available balance. This is the sharpest case: "4 of 6 visits left" on an expired package is actively misleading. |
| unmapped status | either | Core returned a state with no approved customer label. | An honest, non-enumerating treatment. Do **not** ask for a guessed label — the adapter deliberately raises `plan-status-unmapped`. |

### Explicitly out of scope for this request

`Active`, `Expiring soon`, `Cancelled` and `Used up` are accepted and must not
be re-designed. Only the additions above are requested.

## Required Actions

An expired plan's `allowedActions` is server-owned and will normally be empty.

- `plan.cancelRenewal` — must **not** render for an expired enrolment.
- `plan.bookWithCredit` — must **not** render for an expired enrolment, even
  when `remainingUses > 0`.
- If the design wants a recovery path, it must be an existing accepted route —
  `nav.go` to `pricing` — and it must not imply the expired plan can be revived.

No new action name is requested. Adding one would be an API request, not a
presentation request.

## Dynamic Data Shape

Unchanged from the accepted wave-15 plan read model. Every field is
server-provided and rendered verbatim; presentation never computes or projects:

```
plan.{ kind, title, status, remainingUses, totalUses, renewsAt, expiresAt,
       displayRecurringPrice, allowedActions }
```

`status` is the only field this request changes the handling of. Unknown fields
are omitted, never guessed. `remainingUses` / `totalUses` may be `null` for a
membership and the treatment must survive that.

## Responsive Requirements

390 / 768 / 1180 / 1440. At 390 the plan grid is a single column and the badge
must not push the title into a second line or clip it. An expired card must keep
the same footprint as an active one — no column shift when a list mixes states.

## Reusable Source Components

Compose from the accepted language; do not introduce a separate visual system.

- `plan-card`, `plan-list`, `plan-usage` — `design-inbox/src/routes/SpaPlanPage.js:23-70`
- `status-badge` — the existing variant set, extended with one new variant
- `page-header`, `action-button`, `unavailable-state` — the shared primitives

## Data-Ownership Constraints

- Balances, renewal dates and prices are shown exactly as recorded on the plan.
  The accepted page footnote already states this and must stay true — this page
  never estimates or projects.
- No plan reference, Core id, workflow code or raw status may appear in the UI.
  `data-plan-ref` carries the opaque ref only.
- The customer label for a status is a **backend-owned approved mapping**. This
  request asks for the treatment of `Expired`, not for the browser to derive it.

## Acceptance

- An expired package with unused credits, at all four widths, light and dark.
- An expired membership, at 390 and 1180.
- A list mixing `Active`, `Expiring soon` and `Expired`, showing that the three
  are unambiguous side by side.
- The unmapped-status treatment at 390.
