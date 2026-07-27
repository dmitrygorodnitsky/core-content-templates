# Design Request: Calm Harbor Purchase — Completed Return State

## Context

The accepted purchase surface already covers a return **in progress**.
`design-inbox/src/routes/SpaPurchaseDetailPage.js:28` renders a
`purch-line__note` when `retState === "accepted-for-review"`, and
`return-accepted-for-review` is a declared value in the accepted `data-state`
grammar (`design-inbox/manifest.json`, wave 15).

What has no accepted treatment is a return that has **finished**. When Core
moves a line to a completed return, nothing in the accepted source distinguishes
it from a line that was never returned: no branch, no badge, no note, on either
the purchase line or the purchase row in the list.

The accepted purchase status vocabulary is five labels
(`design-inbox/data/fixtures.js:858`), and a completed return maps to none of
them. `CommerceBits.js:45-47` — byte-identical in both trees — would fall back
to the neutral "scheduled" badge.

This request is presentation-only. It does not authorize an API, a permission,
a mutation, or a new data field.

Audit reference: `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/evidence/punch-list.md`
finding `SG-04`, Known Starting Point 2.

**Please read this scoping note before starting.** The original ticket asked for
both `RETURN_REQUESTED` and `RETURNED`. The audit established that the first is
already designed and accepted. Re-designing it would discard shipped work. Only
the completed-return state is requested here.

## User Goal

A customer looking at a past purchase can tell which items were returned and
that the return is finished — without having to infer it from an amount, and
without a returned item looking like an item they still own.

## Route

`purchase.detail` — `data-route="purchase.detail"`,
`data-visual-id="spa-purchase-detail"`, `data-purchase-ref` (opaque stable ref).

The line is `data-module="purchase-line"` carrying `data-line-ref`.
The list row on `purchases.list` is `data-module="purchase-row"` carrying
`data-purchase-ref`.

## Required States

| State | Scope | User-facing meaning | Required treatment |
| --- | --- | --- | --- |
| `returned` | purchase **line** | This item's return is complete. | Terminal, and visually distinct from `return-accepted-for-review`. The line must not offer `purchase.returnRequest` again. |
| `returned` | purchase **row** (list) | Every returnable line on this purchase has been returned. | A row-level indication that the purchase is not simply "completed". Must survive the row's 390 composition without a column shift. |
| partially returned | purchase **row** (list) | Some lines returned, others not. | Must be distinguishable from fully returned. If the design decides a partial return needs no row-level treatment, say so explicitly — that is an acceptable answer and the audit will record it. |

Keep `return-accepted-for-review` exactly as accepted.

### The money question — please answer it explicitly

Core does not provide a refund amount on the customer-safe Order read model.
`master.md` §Core Rules 5 and the program's S3 §5a both settle the direction:
where the server provides no figure, the honest output is nothing at all.

So: **do not design a refund amount into this state.** If the design believes a
returned line must show an amount, that is an API request and must be raised
separately — it cannot be satisfied by presentation.

## Required Actions

- `purchase.returnRequest` — must **not** render on a returned line.
- `purchase.buyAgain` — may still render if `allowedActions` includes it.
- No new action name is requested.

Actions remain gated on the server's `allowedActions`; presentation never
decides what is permitted.

## Dynamic Data Shape

Unchanged from the accepted wave-15 customer-safe Order read model:

```
purchase.{ reference, kind, customerStatus, placedAt, displayTotal, currency,
           itemSummary, attention }
purchase.lines[].{ title, variant, quantity, displayUnitPrice, displayTotal }
purchase.fulfillment.{ kind, status, pickupWindow }
```

The return state arrives as the line's server-provided status. Unknown fields
are omitted, never guessed. Note that `displayTotal` may be absent per line —
see the companion brief on partially unavailable sections.

## Responsive Requirements

390 / 768 / 1180 / 1440. At 390 the purchase line is the tightest composition on
the surface; a returned marker must not force the title to wrap differently from
a non-returned line in the same list. Verify a long product title at 390.

## Reusable Source Components

- `purchase-line`, `purchase-lines`, `purchase-items` — `design-inbox/src/routes/SpaPurchaseDetailPage.js:21-53`
- `purchase-row` — `design-inbox/src/routes/SpaPurchasesPage.js:20`
- `status-badge` — existing variant set
- `purch-line__note` — the existing note treatment used by `accepted-for-review`

## Data-Ownership Constraints

- No Order id, line id, workflow code or raw Core status in the UI.
  `data-purchase-ref` and `data-line-ref` carry opaque refs only.
- Customer-facing status labels are a backend-owned approved mapping.
- Presentation never calculates money and never infers a return from an amount.

## Acceptance

- A purchase with one returned line and one kept line, 390 and 1180.
- A fully returned purchase row in the list, 390 and 1440.
- A partially returned row beside a normal row at 390 — or an explicit statement
  that no row-level treatment is wanted.
- A returned line with a long title at 390, showing no column shift.
