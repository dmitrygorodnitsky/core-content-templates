# Design Request: Calm Harbor — A Section That Is Unavailable Inside an Otherwise-Ready Page

## Context

The accepted design covers whole-route unavailability well: `unavailable-state`
is a declared route-root treatment, and `unavailable` is in the accepted
`data-state` grammar for route roots since wave 15.

It does not cover the case that live data actually produces most often: **the
page is ready, and one section inside it is not.** Core answers the route, but a
particular block within it has no data, or the field behind it is not exposed by
the current API.

With no accepted treatment, production has improvised one three separate times,
each differently, and two of the three now say something untrue:

| where | what was improvised | audit id |
| --- | --- | --- |
| `SpaPurchaseDetailPage.js:112` | a 12px `.purch-ful__note` replaces the whole `linesBlock` when Core returns no lines | `AC-C10` |
| `SpaProfilePage.js:147` | a 12px `.purch-ful__note` replaces the accepted `spa-profile-preferences` panel — and its text claims the phone is unavailable while `:84` renders it | `AC-C23b` / `CP-10` |
| purchase line | `dom.js:16-19` skips `null` children, so an empty `<b data-bind="purchase.lines[].displayTotal">` renders where the design shows an amount — an empty slot, not a treatment | `AC-C11` |

A fourth instance is the same shape on the appointments hero: booking is open,
`allowedActions` is empty, and the hero renders with no controls and no
explanation (`A-04`).

`.purch-ful__note` is a caption sized to sit *inside* a card. It is being used
to replace panels. That is the visible symptom; the missing accepted pattern is
the cause.

This request is presentation-only. It does not authorize an API, a permission,
a mutation, or a new data field.

Audit reference: `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/evidence/punch-list.md`
findings `AC-C10`, `AC-C11`, `AC-C23b`/`CP-10`, `A-04`.

## User Goal

A customer on a page that mostly works can tell which one part is not available,
that the rest of the page is still trustworthy, and that nothing has been hidden
from them. They must never be told a fact is unavailable while the page is
showing it.

## What Is Requested

**One reusable pattern**, applied at three scopes, so production stops inventing
a new one per surface:

| Scope | Situation | Needed |
| --- | --- | --- |
| **panel** | An accepted panel or list has no data or no source. | A treatment that occupies the panel's own footprint — not a caption. It must read as "this section", not "this page". |
| **row / field** | A single declared value is absent (e.g. a per-line amount Core does not provide). | A treatment for an empty value slot. Today it renders as blank space, which reads as a rendering bug. |
| **actions** | The section renders but its `allowedActions` is empty. | A treatment for "nothing can be done here right now" that does not imply an error. |

## Required States

| State | Meaning | Required behaviour |
| --- | --- | --- |
| `unavailable` (section-scoped) | The source for this section is not exposed, or returned nothing. | Honest, neutral. Must not read as an error and must not offer a retry that cannot help. The rest of the page stays fully interactive. |
| `empty` (section-scoped) | The source answered, with nothing in it. | Must be distinguishable from `unavailable`. "You have none" and "we cannot show you" are different facts. |
| `error` (section-scoped) | The section's own request failed. | May offer retry. Distinct from the two above. |

`data-state` goes on the section element. The route root keeps its own state
independently — a `ready` route containing an `unavailable` section is the
normal case this request exists for.

### Copy rule — the reason two of the three current notes are defects

The treatment must let the writer name **exactly** what is unavailable and
nothing more. `CP-10` says "Phone and visit preferences are not returned by the
current Core User API" while the phone is on screen. Whatever the pattern is, it
must make an over-broad claim awkward to write.

Please supply the copy skeleton, not just the box.

## Required Actions

None new. The pattern must compose with `ui.retry` where retry is meaningful and
render no action at all where it is not.

## Dynamic Data Shape

The pattern is data-shape agnostic — that is the point of asking for one pattern
rather than three. The four concrete instances it must cover:

```
purchase.lines[]                  — absent entirely (AC-C10)
purchase.lines[].displayTotal     — absent per line (AC-C11)
profile.preferences               — not exposed by the current Core User API (AC-C23b)
appointment.allowedActions        — present but empty (A-04)
```

In every case: unknown fields are omitted, never guessed, and presentation never
substitutes a computed or default value.

## Responsive Requirements

390 / 768 / 1180 / 1440.

- At 390 the panel-scope treatment must not exceed the height of the panel it
  replaces by enough to push the following card off the first screen.
- The row/field-scope treatment must hold the row's column widths — a purchase
  line with an unavailable amount must not shift its neighbours' alignment.
- Verify a page with two unavailable sections at 390; they must not stack into
  something that reads as a broken page.

## Reusable Source Components

- `unavailable-state` — `design-inbox/src/routes/SpaPurchasesPage.js:108`, the
  route-scope treatment this request extends downward
- `empty-state`, `error-state` — `design-inbox/src/components/primitives/`
- `list-panel` — `design-inbox/src/routes/SpaProfilePage.js:123`, the footprint
  the profile instance should have kept
- `purch-ful__note` — the existing caption; please state where it *is* correct,
  so the boundary is explicit

## Data-Ownership Constraints

- Never claim a field is unavailable when it is rendered elsewhere on the page.
- Never fill an absent value with a placeholder, a zero, or a dash that could be
  read as data.
- No API name, endpoint, error code or Core identifier in customer-facing copy.
  "the current Core User API" is already too much internal detail for a customer
  surface — please replace that register.

## Acceptance

- Purchase detail with no lines, 390 and 1180.
- A purchase line with an absent per-line amount beside one with an amount, 390.
- Profile with preferences unavailable and phone present, 390 and 768 — the
  screenshot that makes the `CP-10` contradiction impossible to reproduce.
- Appointments hero with empty `allowedActions`, 390.
- A single page with two unavailable sections, 390.
