# Customer Portal Scripts

This directory is intentionally a flat, stable CLI surface. Internal source is
organized elsewhere; script paths stay stable for documentation, skills, CI,
and operator commands.

| Prefix or entrypoint | Purpose |
| --- | --- |
| `customer-experience-*`, `create-customer-experience.mjs`, `build-customer-experience.mjs` | Configure, compile, and validate the four-surface family |
| `export-*`, `generate-*`, `build-calm-harbor-target-runtime.mjs` | Generate owned runtime/CMS artifacts |
| `build-fixture-portal-runtime.mjs`, `export-fixture-portal-manual.mjs` | Compile and package a fixture-only demonstration portal for one registered case |
| `core-*-adapter-check.mjs`, `pim-adapter-check.mjs` | Deterministic adapter contracts |
| `core-*-live-check.mjs` | Explicit live staging probes; may create real records |
| `*-visual-check.mjs`, `visual-acceptance.mjs` | Browser-based visual evidence |
| `s6-*`, `s7-*`, `config-behavior-check.mjs`, `route-smoke.mjs` | Broad CMS/runtime regression gates |

Generated output must be changed through its owning build/export script, never
by editing `../dist/` directly. Builders must not read `../dist/` or a generated
tenant package as an upstream source.

`granite-ridge-fixture-check.mjs` and `calm-harbor-fixture-check.mjs` pin one
demonstration tenant each. They assert that the case fixture, the profile it
selects, every fixture adapter payload, and the case-vertical guard stay
coherent without a browser.

The fixture portal pair is generic. `build-fixture-portal-runtime.mjs` bundles
`runtime/src/app.js` with the fixture data modules left in place, the opposite
of `build-calm-harbor-target-runtime.mjs`, and refuses to emit a bundle that
does not contain its case. `export-fixture-portal-manual.mjs` refuses any
source that leaves fixture mode, claims an authentication contract, carries an
`account`/`pim`/`auth` block, enables a module its profile does not own, or
enables products without checkout.

`customer-experience-login-check.mjs` and
`customer-experience-2fa-check.mjs` protect the accepted Core Auth transfer
contracts. Their visual companions require Playwright and compare accepted and
compiled pages with a strict zero-diff gate.
