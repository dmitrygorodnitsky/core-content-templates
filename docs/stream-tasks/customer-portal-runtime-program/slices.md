# Customer Portal Runtime Program — Slices

## Program Overview

This program converts the accepted `design-inbox/` customer portal design source
into a production-ready, CMS-compatible custom JavaScript runtime.

The work is intentionally split into program stages because the risk profile changes:

- visual transfer risk in S1;
- routing/theme/profile contract risk in S2;
- state/data/command architecture risk in S3;
- external Core API risk in S4;
- CMS packaging and PageContext migration risk in S5.

Do not collapse these stages into one implementation pass unless the user
explicitly accepts the higher rework risk.

## Stage S0 — Architecture Contract

Intent:
Lock the product/runtime decisions before implementation.

Owned paths:

- `app-templates/customer-portal/ARCHITECTURE.md`
- `docs/stream-tasks/customer-portal-runtime-program/**`

Exact task:

- Commit the latest architecture decision: no React baseline, custom JS/native
  ES modules.
- Keep this program package aligned with the architecture contract.

What not to do:

- Do not begin runtime implementation inside S0.
- Do not reopen the React decision without concrete failure evidence from the
  custom runtime.

Validation:

- `git diff` shows only architecture/package docs.
- Architecture contains custom JS/no React decision.

Completion signal:

- S0 docs are committed and pushed.

## Stage S1 — Runtime Scaffold And Baseline Transfer

Intent:
Create the production runtime target from the accepted design source without
changing behavior.

Owned paths:

- `app-templates/customer-portal/design-inbox/**` read-only
- `app-templates/customer-portal/runtime/**`
- Optional local validation scripts under `app-templates/customer-portal/scripts/**`

Exact task:

- Validate `design-inbox/` boots over HTTP.
- Treat legacy design docs that say `customer-portal-design/` as references to
  `app-templates/customer-portal/design-inbox/`.
- Treat top-level `scenarios.json` wave 5 as stale legacy metadata. Route rows
  span design waves 1-6. The accepted baseline is the current committed package
  whose manifest says wave-6.
- Run JS syntax checks on design source.
- Validate manifest route/action/module consistency against source files.
- Create `runtime/` from the accepted design source.
- Preserve visual markup, classes, CSS tokens, route ids, action ids, module ids,
  `data-bind`, `data-visual-id`, and `data-requires-confirmation`.
- Strip or isolate `data-dev-toolbar` as preview-only.
- Ensure runtime boots over HTTP and all accepted routes render.
- Add a scripted route-smoke harness if practical, for example under
  `app-templates/customer-portal/scripts/route-smoke.mjs`; if not practical in
  S1, record the manual route-smoke method as a durability residual.
- Record design/runtime parity notes.

What not to do:

- Do not add Core API calls.
- Do not redesign or refactor visual components for taste.
- Do not rename routes/actions/modules.
- Do not introduce React, bundlers, package managers, or build tooling.

Validation:

- `node --check` for all design/runtime `.js` files.
- `jq empty` for `manifest.json` and `data/scenarios.json`.
- Static server boot for `design-inbox/source.html`.
- Static server boot for `runtime/source.html`.
- Route smoke for all design routes, preferably scripted. If manual, record the
  exact method and route list.
- Hook preservation scan for `data-visual-id`, `data-action`, `data-module`,
  `data-route`, `data-requires-confirmation`.

Completion signal:

- `runtime/` is a production transfer target that boots and matches the accepted
  design baseline.

## Stage S2 — Config, Router, Themes

Intent:
Make vertical profiles, themes, router modes, and route guards data-driven.

Owned paths:

- `app-templates/customer-portal/runtime/src/config.js`
- `app-templates/customer-portal/runtime/src/router.js`
- `app-templates/customer-portal/runtime/src/state.js`
- `app-templates/customer-portal/runtime/src/components/shell/**`
- `app-templates/customer-portal/runtime/styles/**` only as needed for scoped
  theme behavior.

Exact task:

- Add `verticalProfiles` mapping for `hvac`, `snow`, `lawn`, `pool`, `roofing`,
  and `pest`.
- Preserve this slug/display/profile mapping:

  | slug | display name | profile |
  | --- | --- | --- |
  | `hvac` | `HVAC` | `onDemand` |
  | `snow` | `Snow Removal` | `stormOps` |
  | `lawn` | `Lawn & Garden` | `stormOps` |
  | `pool` | `Pool & Spa` | `stormOps` |
  | `roofing` | `Roofing` | `stormOps` |
  | `pest` | `Pest Control` | `stormOps` |

- Add route registry preserving accepted route ids.
- Add router mode config: `hash`, `history`, `memory`.
- Default deployed CMS mode to `hash` unless backend support is confirmed.
- Add guards for disabled modules, unknown routes, and auth-required routes.
- Guard contract:
  - `landing`, `auth.phone`, and `auth.code` are public.
  - All other accepted routes are private unless a module descriptor overrides.
  - Fixture mode defaults to an authenticated demo session for normal route
    smoke and supports an unauthenticated fixture state for guard tests.
  - Unauthenticated private-route access redirects to `auth.phone` and records
    the intended route.
  - Disabled-module route access resolves to the configured default route or an
    explicit module-disabled state.
- Propagate `data-portal-theme` and `portal_default_mode` to
  `<html data-theme data-mode>` during initial hydration.
- Preserve user light/dark selection after toggle.
- Build navigation from enabled modules/routes, not hardcoded route lists.

What not to do:

- Do not connect live APIs.
- Do not add module business logic beyond route availability and shell config.
- Do not hardcode vertical behavior inside visual components.

Validation:

- Route registry covers all accepted routes.
- Disabled module direct route access resolves to fallback.
- Public/private auth route behavior follows the guard contract.
- Unauthenticated fixture session redirects private routes to `auth.phone`.
- Theme changes update CSS tokens.
- User mode toggle is not clobbered by re-render.
- Navigation differs correctly for `onDemand` and `stormOps`.
- Shell/nav/route-outlet structure is proven here: nav is built from enabled
  modules/routes and does not require a shell data normalizer.

Completion signal:

- Profiles drive routes, nav, theme, default route, and guards.

## Stage S3 — Fixture PortalRuntime And Modules

Intent:
Build the production data/command architecture against fixtures before live API
risk enters.

Owned paths:

- `app-templates/customer-portal/runtime/src/portal-runtime.js`
- `app-templates/customer-portal/runtime/src/modules/**`
- `app-templates/customer-portal/runtime/src/adapters/**`
- `app-templates/customer-portal/runtime/src/normalizers/**`
- `app-templates/customer-portal/runtime/data/fixtures/**`
- `app-templates/customer-portal/runtime/src/actions.js`

Exact task:

- Implement `PortalRuntime.parseConfig`, `load(module)`, request cache,
  fixture adapter wiring, command dispatch, pending state tracking, and error
  handling.
- Add module descriptors for auth, orders, proposals, services, pricing,
  products, checkout, calendar, activity, profile, and support.
- Add fixture adapters and normalizers for opened modules.
- Convert design demo actions into command wrappers while preserving action ids.
- Preserve `data-requires-confirmation` before mutating commands.
- Scope pending state by action/entity.
- Render explicit loading, empty, error, fallback, disabled, and unauthorized
  states where used.

What not to do:

- Do not call live Core APIs.
- Do not let components consume raw fixture payloads directly.
- Do not claim success for rejected/failed commands.

Validation:

- Fixture route smoke for every accepted route.
- Empty/error/fallback scenarios for core modules.
- Module descriptor and normalized fixture proof for every opened S3 data module:
  auth, orders, proposals, services, pricing, products, checkout, calendar,
  activity, profile, and support. If a module is intentionally deferred, mark it
  `not_opened` in `master.md` before closing S3.
- Implementation-added states `fallback`, `disabled`, and `unauthorized` have
  explicit visual treatment and scenario coverage before production use.
- Pending mutation state is entity/action scoped.
- `proposal.approve`, `proposal.requestRevision`, `weather.confirm`,
  `order.cancel`, `checkout.placeOrder`, and `support.sendMessage` command
  flows have success/error paths in fixtures.
- Auth validates phone/code states; services can request service; products can
  filter/add where enabled; checkout can place/fail an order; calendar renders
  both month and storm variants; activity can filter/mark read; profile can set
  default address/payment and toggle preferences.

Completion signal:

- Runtime behavior is production-shaped while still fully offline.

## Stage S4 — Live Core Adapter Integration

Intent:
Connect live Core data incrementally without sacrificing fixture/fallback mode.

Owned paths:

- `app-templates/customer-portal/runtime/src/adapters/core*.js`
- Module adapters/normalizers under `runtime/src/modules/**`,
  `runtime/src/adapters/**`, `runtime/src/normalizers/**`
- Runtime scenarios/fixtures as needed.

Exact task:

- Add live adapters module-by-module.
- Start with pricing/products using the proven Core PIM pattern.
- Use these baseline source paths for the PIM pattern:
  - `docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/sites.json`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json`
  - `docs/cms-components/lab-ui/14-pricing/pricing.dynamic-servicewand/**`
- Then connect orders.
- Then connect proposals and proposal commands.
- Then connect profile/payment/address and support/activity as endpoints become
  known.
- Keep fixture adapter selectable for local/offline validation.
- Keep fallback/error states honest.

What not to do:

- Do not block S4 on unknown endpoints for unrelated modules; mark unknowns as
  residuals and keep fixture mode.
- Do not open a live adapter slice for orders, proposals, profile, support, or
  checkout until the endpoint contract is known.
- Do not commit credentials or environment-specific secrets.
- Do not remove static fallback or fixture mode.

Validation:

- Per-module fixture mode still passes after live adapter is added.
- Live adapter handles HTTP errors and malformed payloads.
- Normalizers shield components from raw API shape.
- Commands report backend rejection as error, not success.

Completion signal:

- Opened modules can run against live Core data or fixtures with the same UI
  components.

## Stage S5 — CMS Packaging And Export

Intent:
Package the runtime as a CMS-compatible portal template.

Owned paths:

- `app-templates/customer-portal/cms/**`
- `app-templates/customer-portal/runtime/**`
- Any customer-portal-specific export scripts.
- Generated artifacts under an agreed `dist/` path.

Exact task:

- Add CMS block metadata for root config and fallback/editor copy.
- Define root params:
  - `portal_api_base`
  - `portal_organization`
  - `portal_vertical`
  - `portal_profile`
  - `portal_theme`
  - `portal_default_mode`
  - `portal_router_mode`
  - `portal_default_route`
  - `portal_enabled_modules`
  - `portal_auth_mode`
  - `portal_error_mode`
- Generate local preview artifacts.
- Keep PageContext values as authored overrides only.
- Document upload guardrails and required approvals.

What not to do:

- Do not upload to CMS without explicit approval.
- Do not encode live customer/business data as CMS defaults.
- Do not generate duplicate parameter codes.

Validation:

- `jq empty` on generated JSON.
- Generated preview boots.
- Parameter codes are unique and stable.
- Root template emits and runtime parses `data-portal-auth-mode` from
  `portal_auth_mode`.
- CMS fallback renders without live API.

Completion signal:

- Portal artifacts are ready for inspected/manual upload or later uploader
  integration.

## Stage S6 — Validation And Closeout

Intent:
Close the program with real evidence and residual risk accounting.

Owned paths:

- `docs/stream-tasks/customer-portal-runtime-program/audits/**`
- `docs/stream-tasks/customer-portal-runtime-program/evidence/**`
- Program ledger in `master.md`

Exact task:

- Run final syntax, JSON, route smoke, visual smoke, fixture, dynamic/fallback,
  and command checks.
- Record exact commands and results.
- Update program ledger statuses.
- Create `audits/A1.md`.
- Create `evidence/closeout.md`.

What not to do:

- Do not mark stages done if only planned.
- Do not hide unknown endpoints or skipped checks.

Validation:

- All opened stage rows are `done` or explicitly `not_opened`.
- Audit and evidence files exist.

Completion signal:

- Program can be resumed or audited later without hidden chat context.

## Dependency Chain

```text
S0 -> S1 -> S2 -> S3 -> S4 -> S5 -> S6
```

Parallelism is allowed inside a stage only after ownership zones are disjoint.
Do not run S4 live adapters before S3 fixture runtime is stable.

## Validation Matrix

| check | required proof |
| --- | --- |
| Architecture contract | `ARCHITECTURE.md` contains custom JS/no React, module/runtime/CMS contract |
| JSON validity | `jq empty` on manifest, scenarios, fixtures, CMS/export JSON |
| JS syntax | `node --check` on all edited `.js` files |
| Design boot | `design-inbox/source.html` boots over local HTTP |
| Runtime boot | `runtime/source.html` boots over local HTTP |
| Route coverage | all accepted route ids render without console errors |
| Manifest/scenario consistency | route/action/module ids in scenarios/source are indexed |
| Hook preservation | `data-visual-id`, `data-action`, `data-module`, `data-route`, `data-requires-confirmation` preserved |
| Theme/profile behavior | vertical changes theme/profile/nav/routes without component hardcoding |
| Router guards | disabled, unknown, and auth routes resolve deliberately |
| Fixture modules | auth/orders/proposals/services/pricing/products/checkout/calendar/activity/profile/support render normalized fixtures or are explicitly `not_opened`; shell is proven structurally in S2 |
| Implementation-added states | `fallback`, `disabled`, and `unauthorized` have visual treatment and scenario coverage before production use |
| Dynamic/fallback | live adapter errors reach explicit `error` or `fallback` states |
| Command semantics | mutating commands have pending/success/error and confirmation where required |
| CMS packaging | generated artifacts validate and fallback without live API |
| Responsive smoke | desktop/tablet/mobile viewport checks for core routes |

## Closeout And Audit Rules

- Keep this program package open until all planned stages are done or marked
  `not_opened`.
- Each implementation stage may add its own stage-specific audit/evidence if it
  becomes large enough.
- The final program closeout must include:
  - `docs/stream-tasks/customer-portal-runtime-program/audits/A1.md`
  - `docs/stream-tasks/customer-portal-runtime-program/evidence/closeout.md`
- Record commit hashes in `master.md` Delivery Notes as stages complete.
