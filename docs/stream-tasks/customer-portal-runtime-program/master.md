# Customer Portal Runtime Program

Created: 2026-07-09
Package path: `docs/stream-tasks/customer-portal-runtime-program/`
Status: program container

## Goal

Turn the accepted Claude Design customer portal package into a CMS-compatible,
custom JavaScript production runtime with modular vertical profiles, themes,
route guards, business modules, dynamic Core data adapters, and export-ready CMS
artifacts.

## Core Decision

The customer portal runtime uses custom JavaScript with native ES modules. React
and bundlers are out of the baseline. The runtime follows the proven lab-ui
pricing pattern: `data-*` configuration, fixture/live adapters, normalizers,
explicit DOM state, CMS fallback, and upload-safe generated artifacts.

The architecture source of truth is:

- `app-templates/customer-portal/ARCHITECTURE.md`
- `app-templates/customer-portal/design-inbox/README.md`
- `app-templates/customer-portal/design-inbox/HANDOFF.md`
- `app-templates/customer-portal/design-inbox/manifest.json`
- `app-templates/customer-portal/design-inbox/data/scenarios.json`

Path note:

- `design-inbox/` is the repository path for the delivered
  `customer-portal-design/` package. Legacy references inside the design package
  to `customer-portal-design/` map to
  `app-templates/customer-portal/design-inbox/`.
- `manifest.json` labels the package as wave-6. `scenarios.json` still has a
  stale top-level `"wave": 5`; individual route rows span design waves 1-6. The
  accepted baseline for this program is the current committed package.

## Scope

In scope:

- Freeze design wave-6 as the visual/contract baseline.
- Create `app-templates/customer-portal/runtime/` as the production transfer
  target.
- Preserve accepted design markup, CSS, route ids, action ids, module ids,
  `data-visual-id`, `data-requires-confirmation`, and scenario coverage.
- Add vertical theme/profile configuration.
- Replace the design route switch with a route registry and route guards.
- Add `PortalRuntime` with fixture-first module loading and command dispatch.
- Add module adapters and normalizers for auth, orders, proposals, services,
  pricing, products, checkout, calendar, activity, profile, and support.
- Connect live Core APIs incrementally after fixture behavior is stable.
- Add CMS block metadata/export path only after the runtime contract is stable.
- Add validation harnesses and closeout evidence for each implementation stage.

Out of scope:

- React, client-side framework migration, bundler setup, or package manager
  introduction.
- Redesigning the accepted Claude Design visuals.
- Uploading to production CMS without explicit current-thread approval.
- Changing Core API behavior.
- Replacing the lab-ui CMS generator architecture.
- Renaming accepted design route/action/module ids for consistency only.

## Core Rules

- `design-inbox/` is immutable input. It is the ingested
  `customer-portal-design/` package.
- `runtime/` is the only production transfer target.
- No business logic, API calls, secrets, or permissions go into design input.
- Vertical profile controls theme, modules, routes, primary actions, calendar
  type, commerce availability, and dynamic behavior.
- Components consume normalized UI shapes, never raw Core payloads.
- Adapters perform IO; normalizers shape data; modules orchestrate adapters,
  commands, and route state.
- `data-mode` from CMS is an initial default only; user light/dark choice must
  not be overwritten by re-render or re-hydration.
- `data-portal-theme/default-mode` must propagate to the design CSS contract on
  `<html data-theme data-mode>` unless a scoped CMS embedding fallback is
  explicitly documented.
- Dynamic failure is not a silent success: mark `error` or `fallback` state.
- PageContext values remain authored overrides only and migrate by stable
  parameter code.

## Ownership Zones

| zone | primary paths | owner | status | notes |
| --- | --- | --- | --- | --- |
| architecture-contract | `app-templates/customer-portal/ARCHITECTURE.md` | Codex | in_progress | Runtime decision is locked to custom JS; latest doc edits still need commit. |
| design-baseline | `app-templates/customer-portal/design-inbox/**` | Claude Design input / Codex validation | todo | Validate accepted wave-6 and do not mutate source. |
| runtime-transfer | `app-templates/customer-portal/runtime/**` | Codex | todo | Production transfer target from design source. |
| config-router-theme | `runtime/src/config.js`, `runtime/src/router.js`, shell/theme code | Codex | todo | Vertical profiles, router modes, route guards, theme propagation. |
| module-runtime | `runtime/src/portal-runtime.js`, `runtime/src/modules/**`, `runtime/src/adapters/**`, `runtime/src/normalizers/**` | Codex | todo | Fixture-first data and command architecture. |
| live-core-adapters | `runtime/src/adapters/core*.js`, module adapters | Codex | todo | Connect real Core APIs after fixtures prove contract. |
| cms-packaging | `app-templates/customer-portal/cms/**`, generated artifacts | Codex | todo | Block metadata/export after runtime stabilizes. |
| validation-closeout | package audits/evidence, harness scripts | Codex | todo | Per-stage validation and closeout artifacts. |

## Program Stages

| stage | goal | status | depends_on | primary output | done_when |
| --- | --- | --- | --- | --- | --- |
| S0 Architecture Contract | Lock runtime decisions and transfer contract | in_progress | none | `ARCHITECTURE.md` committed | Custom JS decision, themes/profiles/modules/CMS contract documented and pushed. |
| S1 Runtime Scaffold And Baseline Transfer | Create production runtime from accepted design source | todo | S0 | `runtime/` boots 1:1 from transferred source | Runtime preview matches design source, dev toolbar stripped/isolated, hooks preserved. |
| S2 Config, Router, Themes | Add vertical profile config, route registry, guards, theme propagation | todo | S1 | Config/router/theme layer | Enabled modules drive nav/routes; disabled and auth routes guard cleanly. |
| S3 Fixture PortalRuntime And Modules | Add fixture-first `PortalRuntime`, adapters, normalizers, commands | todo | S2 | Module runtime using fixtures | Auth, orders, proposals, services, pricing, products, checkout, calendar, activity, profile, and support render from normalized fixtures or are explicitly not_opened. Shell remains structural and is proven by S2 nav/route-outlet checks. |
| S4 Live Core Adapter Integration | Connect real Core APIs incrementally | todo | S3 | Core adapters and resilient dynamic states | Pricing/products use proven PIM paths first; other modules open only when endpoints are known. |
| S5 CMS Packaging And Export | Create CMS block metadata and export path | todo | S4 | CMS-ready template artifacts | Config params, fallback copy, generated preview, and export scripts validate locally. |
| S6 Validation And Closeout | Complete full scenario/browser validation and program evidence | todo | S5 | Audits and closeout evidence | Ledger updated, validations recorded, residuals explicit. |

## Cross-Stage Dependency Rules

- S1 must not add business behavior beyond preserving design demo behavior.
- S2 must not connect live APIs; it only introduces config, router, guards, and
  theme/profile behavior.
- S3 must be fixture-first. Live API work waits until normalized fixture shapes
  are stable.
- S4 may add live adapters only module-by-module while retaining fixtures and
  fallback.
- S5 must not begin until the runtime contract is stable enough that CMS params
  will not immediately churn.
- S6 closes the program only after all opened stages are done or explicitly
  marked `not_opened`.

## Program Ledger

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| S0-docs | architecture-contract | Codex | in_progress | none | Markdown review, git diff, commit/push | Architecture decision is committed and referenced by package. |
| S1-baseline-validation | design-baseline | Codex | todo | S0-docs | HTTP boot, `node --check`, manifest/scenario checks | `design-inbox` accepted as wave-6 baseline without source mutation. |
| S1-runtime-scaffold | runtime-transfer | Codex | todo | S1-baseline-validation | runtime HTTP boot, route smoke, hook scan | `runtime/` exists and visually matches baseline. |
| S2-config-theme-router | config-router-theme | Codex | todo | S1-runtime-scaffold | route guard tests, theme propagation checks | Profiles control routes/nav/theme without hardcoded vertical checks. Shell/nav/route-outlet structure is proven here. |
| S3-fixture-modules | module-runtime | Codex | todo | S2-config-theme-router | fixture route smoke for every opened module, action/pending/error checks | Auth, orders, proposals, services, pricing, products, checkout, calendar, activity, profile, and support load normalized fixtures or are explicitly not_opened. |
| S4-live-adapters | live-core-adapters | Codex | todo | S3-fixture-modules | API/fallback harness checks per opened module | Pricing/products use PIM live/fixture adapters; other live modules are done only when endpoint contracts are known. |
| S5-cms-export | cms-packaging | Codex | todo | S4-live-adapters | `jq empty`, generated preview, CMS artifact validation | CMS block/export artifacts are upload-ready. |
| S6-closeout | validation-closeout | Codex | todo | all opened stages | A1 audit and evidence docs | Program state and residual risks are recorded. |

## Definition Of Done

- `ARCHITECTURE.md` is committed with the custom JS/no React decision.
- `runtime/` is the production transfer target and boots through a static HTTP
  server.
- All accepted design routes render in runtime with no console errors.
- `data-visual-id`, `data-module`, `data-route`, `data-bind`, `data-action`,
  and `data-requires-confirmation` are preserved unless explicitly migrated.
- `data-dev-toolbar` is absent from production runtime or isolated as
  preview-only.
- Vertical themes and profiles drive navigation, modules, route access, and
  theme tokens.
- Disabled modules are hidden from navigation and guarded on direct access.
- Fixture adapters and normalizers exist for every opened module.
- Live adapters retain fixture and fallback paths.
- CMS params exist for root config and fallback/editor copy.
- Validation evidence covers syntax, manifest/scenario consistency, route smoke,
  responsive smoke, dynamic/fallback states, and command pending/error states.
- No upload is performed without explicit approval.

## Delivery Notes

- 2026-07-09: Design package committed in `26e8eae` (`Add customer portal design handoff`).
- 2026-07-09: Architecture document committed in `1fb2a81` (`Document customer portal architecture`).
- 2026-07-09: Architecture document updated locally after commit to lock the
  custom JS/no React runtime decision; commit pending at package creation time.
- This program package is a roadmap container. Execute one stage at a time unless
  the user explicitly requests continuous multi-stage execution.
