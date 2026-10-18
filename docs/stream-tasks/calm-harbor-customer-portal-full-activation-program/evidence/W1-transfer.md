# W1 — Wave 16 Executable Transfer

Status: accepted fixture transfer; live API activation remains gated by W0

## Scope Transferred

The accepted Wave 16 designer source was transferred from immutable
`app-templates/customer-portal/design-inbox/**` into the modular runtime:

- customer-owned `appointment.detail` at `/appointments/:id`;
- complete booking, reschedule, book-again and plan-credit drawer flow;
- published package/membership offer cards and simulated plan checkout;
- Calm Harbor least-data Profile view/edit/save presentation;
- Wave 16 deterministic fixtures, styles, action hooks and responsive rules.

The target fixture harness explicitly opens booking, retail and plan commerce.
The uploadable staging/live configuration was not switched: live commands still
fail closed without scoped API adapters, and no CMS export/upload was performed.

## Runtime Safety Decisions

- `design-inbox/**` was not edited.
- Existing production config, module adapters and no-dev-toolbar runtime were
  preserved instead of replacing runtime modules with the presentation harness.
- Fixture success runs only through `runSpaCommand` when `dataMode=fixture`.
- Plan checkout remains `SIMULATED` and makes no Paid/Charged/refund claim.
- Appointment routes use opaque refs and unknown refs share one non-enumerating
  not-found state.
- The prior `.link-action` button reset remains as an approved implementation
  correction for native button chrome; no Wave 16 geometry/copy drift was added.

## Functional Validation

```bash
PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node app-templates/customer-portal/scripts/calm-harbor-wave16-runtime-check.mjs
```

Result:

```text
calm-harbor-wave16-runtime-check ok: booking, appointment detail, 2 plan offers, simulated checkout, least-data profile, non-enumerating not-found
```

The check exercises service selection, optional specialist, slot selection,
server-shaped hold, policy acknowledgement, booking confirmation, plan offer
purchase/confirmation, Profile authoritative readback, deep-link routing and
unknown appointment handling. Browser page/console errors are asserted empty.

## Pixel Pass Evidence

Viewports: 390, 768, 1180 and 1440 CSS pixels.

Surfaces:

- Appointment detail;
- booking drawer/flow open;
- Services & prices with plan offers;
- Spa Profile.

Comparison mode: strict, threshold `0`, deterministic software rendering.

| capture set | pairs | changed | changedPct | rms |
| --- | ---: | ---: | ---: | ---: |
| final | 16 | 0 | 0 | 0 |

Command:

```bash
PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node app-templates/customer-portal/scripts/calm-harbor-wave16-visual-check.mjs
```

Artifacts:

- `evidence/W1-wave16-visual/visual-report.json`;
- `evidence/W1-wave16-visual/reference-*.png`;
- `evidence/W1-wave16-visual/implementation-*.png`;
- `evidence/W1-wave16-visual/diff-*.png`.

Result: `done`. Residual visual drift: none.

## Regression Validation

Passed:

- `config-behavior-check.mjs`: all runtime profiles/config contracts, including
  the updated Wave 16 file inventory (`91` source JS / `97` runtime JS);
- `s7-route-state-check.mjs`: `72` route/profile attempts, `51` enabled,
  `21` disabled, `36` private-route auth guards and `59` executable state
  probes;
- JSON parsing for the runtime manifest and design contracts;
- `node --check` for every changed Wave 16 runtime/check module.

The legacy generic `route-smoke.mjs` is not a release signal for this transfer:
its baseline still expects the superseded `auth.phone` guard and pre-Spa Beauty
profile, then later fails on an existing status assertion. It was left
unchanged; the current config matrix, dedicated Wave 16 flow check and S7
route/state suite provide the applicable coverage.

## Remaining Gate

This closes executable design transfer only. S3-S7 remain `todo`: Appointment,
Purchase, Cart/checkout, Plan and Profile reads/commands must still be wired to
customer-scoped APIs with seed-backed authorization, idempotency, conflict and
session-loss proof before staging activation.
