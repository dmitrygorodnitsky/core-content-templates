# Design Request: Calm Harbor Booking — Location, Notes, and Add-ons

Status: accepted in designer Wave 20 and transferred into the runtime on
2026-08-06. Live mode remains fail-closed until Core exposes the corresponding
booking-option capabilities.

## Context

The accepted booking drawer covers service, an optional specialist, time, and
review. Its review currently displays one location supplied by the selected
slot, while the fixture composition assumes a salon visit. It has no accepted
interaction for choosing a visit mode/location, adding booking notes, or
selecting service add-ons.

These capabilities affect availability and the final Appointment payload, so
they cannot be introduced as decorative fields after a slot is selected. This
request asks for an executable, capability-driven extension of the existing
drawer. It does not authorize an API or permit the runtime to invent choices,
prices, duration, addresses, or successful saves.

## Route and User Goal

Surface: the authenticated booking drawer on `orders.list`, `services`,
`pricing`, `appointment.detail`, and `plan`, rooted at
`data-visual-id="booking-drawer"` / `data-module="booking-flow"`.

A customer can configure the parts of a visit that the server actually allows,
see how those choices affect specialists, locations, times, and price, add an
optional note, and confirm exactly the same selection shown in review.

## Flow and Progressive Disclosure

Preserve one flow for all current entries: new booking, service-card booking,
book again, book with credit, and reschedule.

Requested order:

1. Service context.
2. Options, shown only when at least one supported capability is returned:
   visit mode/location and eligible add-ons.
3. Optional specialist, only when the selected service/options return choices.
4. Eligible date and time.
5. Review, including the optional customer note.
6. Existing policy acknowledgement and confirmation.

Changing service, visit mode, location, or any add-on must invalidate downstream
specialist/slot selection and reload eligibility. Changing only the note must
not discard a selected slot.

The step rail must remain coherent when the optional Options and Specialist
steps are absent or present in any combination. Do not render an empty step.

## Required States and Actions

### Visit mode and location

- no choice required: exactly one server-returned mode/location; show it as
  fixed context without asking the customer to select it;
- choice ready: two or more allowed choices, such as studio and at-home;
- locations loading, empty, error, or unavailable;
- a previously selected location becomes ineligible after another choice;
- at-home selected but no customer-safe address option is returned;
- location changed after slot selection: clear the slot and return to Time.

Requested stable actions:

- `booking.selectVisitMode` with an opaque mode code;
- `booking.selectLocation` with an opaque location ref;
- `booking.reloadLocations` only when retry can change the result.

Do not add free-form address capture unless a separate approved address-write
contract exists. A saved address may be displayed only as a server-provided,
least-data label such as a nickname or redacted summary.

### Add-ons

- none returned: omit the section and the step;
- eligible list ready, with optional or required choices marked by the source;
- add-on loading, error, unavailable, or no longer eligible;
- display-price or duration effect changed after selection;
- one add-on pending while unrelated options remain interactive.

Requested stable action: `booking.toggleAddon` with an opaque add-on ref.

The UI must not infer compatibility, price, duration, tax, or inventory. If an
add-on changes duration or eligibility, refreshed server data owns the new
specialists and slots. A removed or repriced add-on must block confirmation
until the customer reviews the change.

### Customer note

- optional empty and filled;
- character counter approaching a server-provided maximum;
- invalid/too-long with accessible inline explanation;
- note unavailable or forbidden for the selected service/profile: omit it;
- confirm pending/failed: preserve the entered note locally until authoritative
  readback or explicit close.

Requested stable action: `booking.changeNotes`. The textarea must have a real
label; placeholder-only labeling is not accepted.

For Health or another sensitive profile, the capability may be disabled
entirely. Do not solicit symptoms, diagnoses, payment data, access codes, or
other sensitive information in generic booking copy.

## Review and Confirmation

Extend the existing `booking-review` details with only selected/source-returned
facts:

- visit mode and least-data location label;
- selected add-ons and their server display amounts when supplied;
- optional note, visibly marked as information sent with the request;
- server display total or subtotal exactly as returned.

Review must not show an assumed salon location, `First available specialist`
unless the current selection explicitly allows no preference, a computed
amount, or an add-on the server dropped. The confirm command must carry opaque
refs and the note value; success remains the authoritative Appointment readback,
never a browser-only transition.

## Dynamic Data Shape

```js
bookingOptions: {
  capabilities: {
    visitMode: boolean,
    location: boolean,
    addOns: boolean,
    notes: boolean
  },
  visitModes: [{ code, label, locationRequired }],
  locations: [{ ref, label, kind, visitModeCode }],
  addOns: [{
    ref, name, description, required, selected,
    displayPrice, durationNote, allowedActions
  }],
  notes: { enabled, value, maxLength, helperText },
  selectionVersion
}

bookingReview: {
  service,
  visitMode,
  location,
  specialist,
  slot,
  addOns,
  notes,
  displaySubtotal,
  displayTotal,
  policy,
  version,
  allowedActions
}
```

Unknown optional fields are omitted. Empty arrays mean the source answered with
no options; absent/unavailable sources must not be presented as an empty choice.

## Reusable Accepted Components

- `booking-flow`, `booking-steps`, `booking-context`, `booking-review`;
- `bk-opt` / `bk-opts` for source-returned selectable options;
- `specialist-options`, `slot-days`, `slot-grid`;
- `appt-details` rows for review facts;
- `policy-ack`, `action-button`, `inline-failure`, loading skeletons;
- accepted route/drawer `empty`, `error`, and `unavailable` vocabulary.

Preserve the current drawer geometry, typography, tokens, light/dark behavior,
stable hooks, and close/back interaction. Supply new visual ids for the Options
step, location group, add-on group, and note field.

## Responsive Evidence

Required widths: 390, 768, 1180, and 1440, in light and dark modes.

At minimum provide executable states for:

1. fixed studio location with no Options step;
2. studio/at-home choice plus redacted saved-location choices;
3. add-ons with long names, mixed prices, and one required add-on;
4. Options + Specialist step rail at 390;
5. locations loading/error/unavailable and no eligible locations;
6. add-on removed or repriced after a slot was selected;
7. note empty, near limit, invalid, and disabled for a sensitive profile;
8. final review with all three capabilities populated;
9. reschedule where changing location clears the previous slot.

## Data, Privacy, and Authorization Constraints

- CMS may configure labels and capability visibility only. It must never hold
  customer addresses, notes, selected refs, eligibility, or prices.
- All choices are scoped to the authenticated customer and tenant. Location and
  address labels expose the least data needed for selection.
- Never place raw Core ids, workflow states, API names, or permission failures
  in customer-facing copy.
- Notes are transient browser state until confirmation; do not persist them in
  local storage, analytics, logs, or URL parameters.
- Reschedule must leave the original Appointment unchanged until authoritative
  confirmation succeeds.
- Loading, unavailable, empty, error, repriced, conflict, and session-lost are
  distinct states; none may silently fall back to fixtures.

## Requested Handoff

Return executable source components/styles, deterministic fixtures/scenarios,
manifest entries, stable `data-*` hooks, and viewport evidence. The user reviews
and imports the accepted package into `design-inbox/`; only then is it
transferred 1:1 into production runtime and wired to real contracts.
