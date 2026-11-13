# W1 — Wave 16 Design Source Intake

Status: accepted for executable transfer

## Incoming Source

- Path: `app-templates/customer-portal/design-inbox/`
- Version: `wave-16 (modular / customer-portal-design)`
- Scenario wave: `16`
- Date received: 2026-07-17
- Owner: external designer; imported by the repository owner
- Format: no-build native ES modules, CSS, deterministic fixtures/scenarios,
  manifest, and PNG preview evidence

Binding source of truth:

- `design-inbox/source.html`;
- `design-inbox/src/**`;
- `design-inbox/styles/**`;
- `design-inbox/data/**`;
- stable hooks/actions/bindings in `design-inbox/manifest.json`.

## Previous Accepted Reference

- Wave 15 source evidence: `docs/stream-tasks/calm-harbor-customer-portal-wave15/evidence/intake.md`.
- Wave 15 screenshots: `design-inbox/previews/wave15/**`.
- Previous transferred implementation/reference harness:
  `runtime/calm-harbor-spa-target.html` and
  `docs/stream-tasks/calm-harbor-customer-portal-wave15/evidence/**`.

The incoming source was not edited during intake. The previous implementation
remains the side-by-side reference until Wave 16 transfer and parity complete.

## Changed Surfaces

Wave 16 closes the four gaps in the program's designer brief:

1. standalone `appointment.detail` with owned/non-enumerating states and
   capability-driven actions;
2. complete booking/reschedule/book-again/book-with-credit flow through server
   slot selection, hold, simulated review, and authoritative result;
3. sellable package/membership offer entry into the accepted plan checkout and
   enrollment confirmation;
4. Calm Harbor least-data Profile with versioned edit/save/conflict/session
   presentation.

It also adds:

- navigable Appointment rows and opaque appointment/slot/hold/specialist refs;
- current-versus-proposed reschedule treatment;
- plan-credit `ok | unavailable | exhausted | changed` states;
- plan offer `sellable | unavailable | changed` states;
- Profile `unchanged | dirty | invalid | saving | save-failed | conflict` states;
- named dev-toolbar controls and Wave 16 viewport fixtures.

Wave 15 Account, Purchases, Purchase detail, My plan, Shop, Cart, Checkout and
confirmation remain the reused visual system. No Support flow or fifth primary
destination was introduced.

## Adjudication

- Payment remains explicitly `SIMULATED`; active Spa checkout contains the
  no-charge treatment and no Paid/Charged/Payment successful/Refunded claim.
- Appointment, Order, fulfillment, plan and payment-mode states remain separate.
- Appointment detail uses a service headline and one non-enumerating not-found.
- Booking hold expiry is a server display label, not a local countdown.
- Profile is limited to phone, email and approved preferences; generic spend,
  savings, addresses and payment-method presentation is absent from the Spa
  route.
- Allowed actions and command states are entity-scoped with opaque refs.
- Demo fixture readback is accepted for visual transfer only. It is not
  permission to open live commands or fixture fallback in the CMS package.

The source is accepted for 1:1 fixture-backed transfer. API/command activation
still waits for W0 scoped-contract and seed proof.

## Determinism

- Manifest version and scenario wave are explicit.
- No random id generation, current-clock dependency, or local hold countdown
  was found in Wave 16 flows.
- Calendar helpers use supplied year/month values and are unrelated to the new
  Spa flow defaults.
- Named fixture/dev controls cover appointment refs, offer sellability, slot
  source state, plan credit, hold result, command result and profile state.
- `.DS_Store` is ignored workspace metadata and must not be committed.

## Validation

Passed:

- `node --check` for every JavaScript file under design `src/**` and `data/**`;
- JSON parsing for `manifest.json` and `data/scenarios.json`;
- source-to-manifest action scan: 128 manifest actions, including every Wave 16
  required action;
- route/scenario scan: 24 scenario routes including `appointment.detail` and the
  Spa `profile` variant;
- `calm-harbor-wave16-source-check.mjs` in headless Chrome:
  Appointment detail, booking entry, two plan offers, simulated plan checkout,
  least-data Profile/validation, and non-enumerating not-found; no page or
  console errors.

Browser command:

```bash
PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node app-templates/customer-portal/scripts/calm-harbor-wave16-source-check.mjs
```

Result:

```text
calm-harbor-wave16-source-check ok: appointment detail, booking entry, 2 plan offers, simulated checkout, least-data profile, non-enumerating not-found
```

## Acceptance Backlog For Transfer

| surface | binding source state | required implementation proof |
| --- | --- | --- |
| Appointment detail | ready/not-found/conflict/cancel lifecycle | route/hook parity and paired true-width captures |
| Booking | context/specialist/slots/hold/review/result | flow and all blocking states without local success |
| Reschedule | current/proposed/confirmed readback | original visit remains unchanged before readback |
| Plan offer | sellable/unavailable/changed | plan checkout and both Purchase/My plan links |
| Spa Profile | ready/dirty/invalid/saving/failure/conflict/session lost | least-data DOM and readback semantics |
| Mobile shell | open navigation and long action layouts | no clipping at 390/768 |

Designer PNG files are 908×540 capture-pane images even when the filename names
390/768/1180/1440 CSS presets; the designer documents this limitation. The
executable source at the named CSS width is authoritative. Transfer acceptance
must generate new reference/implementation screenshots and DOM geometry at
true 390, 768, 1180 and 1440 browser viewports; supplied PNG dimensions are not
used as a pixel-parity oracle.

## Forbidden During Transfer

- No edits under `design-inbox/**`.
- No visual cleanup, hook renaming, copy rewriting or component substitution.
- No live command/API activation before W0 proof.
- No Support implementation or fake Support fallback.
- No private fixture success in the uploadable live CMS package.
