# Customer Portal Wave 9 Runtime Program Slices

This file is the execution specification for
`docs/stream-tasks/customer-portal-wave9-runtime-program/`.

Read `master.md` before opening any slice. Execute the next unfinished stage by
default and update the parent ledger as work changes state. For every stage,
apply the Mandatory Stage Execution Loop from `master.md`: one writer at a time,
local operator validation, then a separate read-only validator; repeat after
remediation until the stage is actually complete. Subagents must not invoke
subagents.

## S0 Contract And Baseline

### S0.1 Baseline Inventory

Status: `done`

Inputs:

- Design commit `c9879ae` and `design-inbox/**`.
- Current `runtime/**`, `cms/**`, and `scripts/**`.
- Closed package `docs/stream-tasks/customer-portal-runtime-program/**`.
- `app-templates/customer-portal/ARCHITECTURE.md`.

Tasks:

1. Produce a design-to-runtime inventory for routes, themes, profiles, modules,
   states, actions, components, styles, fixtures, CMS params, and exports.
2. Confirm the accepted design contract contains 17 routes, eight verticals,
   three profiles, Care hubs, and reusable SEO sections.
3. Identify every shared file that later stages must serialize.
4. Record existing runtime behavior that is a regression baseline, especially
   PIM pricing/products, `stormOps`, route guards, theme/mode propagation, and
   dual fixture/live semantics.

Do not:

- Edit `design-inbox/**`.
- Start runtime transfer or CMS implementation.
- Treat a screenshot alone as the source of truth when executable design source
  exists.

Validation:

```bash
git show --stat --oneline c9879ae
jq empty app-templates/customer-portal/design-inbox/manifest.json
jq empty app-templates/customer-portal/design-inbox/data/scenarios.json
find app-templates/customer-portal/design-inbox -name '*.js' -print0 | xargs -0 -n1 node --check
git diff --check
```

Done when the inventory is complete enough that S1-S6 can be executed without
hidden chat context.

### S0.2 Architecture Contract

Status: `done`

Tasks:

1. Update `ARCHITECTURE.md` with the wave-9 baseline commit and the full
   route/theme/profile/module matrix.
2. Define Care module inputs, normalized UI shape, state model, entitlement
   behavior, and command ownership.
3. Define the production SEO split: shared sections are reusable, while the
   public CMS document owns indexable HTML, metadata, canonical URL, FAQ
   structured data, and CMS-authored slots.
4. Define Health/Beauty security boundaries and the exact conditions required
   before sensitive live actions may open.
5. State that `module.normalize` delegates to a module-owned normalizer rather
   than becoming a second shape-logic home.
6. Keep CMS `data-mode` as an initial default only; subsequent hydration must
   not overwrite a user-selected mode.

Validation:

- Cross-check architecture against design manifest, scenarios, HANDOFF, and
  current runtime contracts.
- Confirm there is no React/bundler/legacy compatibility requirement.
- Run `git diff --check`.

Done when the contract resolves all cross-document ambiguity before shared
runtime changes begin.

S0 evidence:

- Write the reconciled inventory, architecture decisions, exact validation
  output summary, and residuals to `evidence/S0.md`.
- Update S0 rows and the S0 stage in `master.md` immediately after validation.

## S1 Shared Config, Themes, Profiles, Router

### S1.1 Config, Profiles, Themes

Status: `done`

Primary paths:

- `app-templates/customer-portal/runtime/src/config.js`
- Runtime theme/profile data and root config parsing.
- Config behavior tests.

Tasks:

1. Add Health and Beauty as first-class verticals with accepted theme tokens.
2. Add the `appointments` profile and its module/route/navigation matrix.
3. Preserve `onDemand` and `stormOps` behavior exactly.
4. Extend CMS/root config parsing without introducing legacy aliases.
5. Verify missing weather data is valid for non-weather profiles and never
   creates hardcoded Snow assumptions.
6. Preserve user-controlled light/dark mode after initial hydration.

Validation cases:

- Each of eight verticals resolves the expected theme/profile defaults.
- Explicit profile overrides remain validated and deterministic.
- Health/Beauty do not accidentally enable weather-only UI.
- Existing six verticals and both old profiles retain their route/module sets.

### S1.2 Routes, Navigation, Guards

Status: `done`

Tasks:

1. Account for `care` and `seo.landing` in the route/scenario registry.
2. Gate `care` by enabled module and entitlement; direct access must render the
   documented disabled or unauthorized state rather than silently redirecting
   to an unrelated page.
3. Keep a parity route for `seo.landing`, while declaring the separate public
   CMS entry as the production route owner.
4. Update navigation from enabled profile modules, not vertical-name checks.
5. Preserve auth, unknown-route, disabled-module, history/hash/memory, detail
   route, and query behavior from the closed baseline.
6. Integrate manifest/scenario updates serially after Care and SEO route owners
   agree on stable hooks.

Validation:

- Route registry and scenarios account for all 17 design route ids.
- Direct Care access covers enabled, disabled, unauthenticated, unauthorized,
  and missing-entitlement behavior.
- Public SEO HTML remains usable when portal auth state and hash router are
  absent.
- Existing route-smoke scenarios remain green.

Do not:

- Transfer Care or SEO visuals in this stage beyond the minimum deterministic
  route placeholder needed for guard validation.
- Open live APIs.

## S2 Care Executable Transfer

### S2.1 Component And Style Transfer

Status: `done`

Primary design inputs:

- Care route/component files under `design-inbox/src/**`.
- Care styles and vertical fixtures.
- Care rows in manifest/scenarios and HANDOFF.

Tasks:

1. Transfer accepted Care page structure into focused reusable runtime
   components; do not create a new monolithic page file.
2. Transfer all eight vertical Care hubs and accepted responsive styling.
3. Preserve route, module, bind, action, visual, state, and confirmation hooks.
4. Remove only preview-only designer tooling; do not remove contract hooks.
5. Reuse runtime primitives only when their rendered DOM and CSS behavior meet
   the accepted source exactly.

### S2.2 Module, Fixtures, Normalizer, States

Status: `done`

Tasks:

1. Add a `care` module descriptor that delegates shape conversion to a dedicated
   Care normalizer.
2. Add vertical-specific fixture inputs and one stable normalized UI shape.
3. Render `ready`, `loading`, `empty`, `error`, and
   `unauthorized`/entitlement-disabled states with explicit visual treatment and
   scenario coverage before production use.
4. Keep profile and vertical selection in config/module composition, not inside
   generic leaf components.
5. Ensure structural Care components do not pretend to have data normalizers
   when their proof is module composition or navigation.

### S2.3 Fixture Commands

Status: `done`

Required action dispositions:

- `care.selectUnit`
- `care.download`
- `care.requestRetreat`
- `care.selectSpecialist`
- `care.completeTask`
- `care.contactProvider`
- `care.openSecureDoc`

Tasks:

1. Register every accepted action id through runtime command dispatch.
2. Implement safe fixture-only/local actions as real state transitions with
   visible readback.
3. Add entity-scoped pending/error state for async actions and prevent duplicate
   submission.
4. Mark live-only or security-sensitive actions unavailable in fixture mode
   when a truthful local transition is not meaningful.
5. Never use toast-only completion as mutation proof.

Validation:

- All eight hubs render normalized fixture data.
- Every state has a scenario and visual treatment.
- Every accepted Care action is registered, intentionally unavailable, or
  `not_opened`; no click is inert and no command lies.
- Existing non-Care modules still render.

## S3 Public SEO Executable Transfer

### S3.1 Reusable SEO Sections

Status: `done`

Tasks:

1. Transfer accepted SEO sections, styles, fixtures, and hooks into reusable
   runtime modules.
2. Preserve the design's section order, responsive behavior, CTA ids, service
   selection, and FAQ semantics.
3. Keep copy/data injectable through stable props or normalized content rather
   than embedding one vertical's content in shared sections.
4. Keep parity preview support for `seo.landing` without making that preview the
   production SEO architecture.

### S3.2 Public CMS Document

Status: `done`

Tasks:

1. Add a standalone public CMS root template/entry that renders useful content
   without portal authentication, portal shell, or hash router.
2. Expose CMS-authored slots for title, description, canonical URL, hero,
   services, proof, FAQs, and CTA labels/targets as supported by design.
3. Emit real document `<title>`, meta description, canonical link, and valid FAQ
   JSON-LD or equivalent structured data from the same authored FAQ source.
4. Keep CTA targets truthful. Booking/quote actions must be a real URL/command
   contract or unavailable, not simulated success.
5. Preserve accessibility semantics for headings, links, controls, and FAQ
   disclosure states.

Required action dispositions:

- `seo.cta.book`
- `seo.cta.quote`
- `seo.cta.call`
- `seo.cta.services`
- `seo.service.select`
- `seo.faq.toggle`

Validation:

- Fetching the public document without JavaScript exposes meaningful page copy
  and metadata appropriate to the export architecture.
- The page works with no portal auth object and no hash fragment.
- FAQ structured data parses and matches visible FAQ content.
- All SEO actions have a real target, local state transition, or explicit
  unavailable disposition.

## S4 Visual Acceptance

### S4.1 Care Parity

Status: `done`

Compare runtime to executable design source at widths 390, 768, 1180, and 1440.
Generate fresh design screenshots from source when committed preview PNGs do not
cover the required viewport.

Coverage:

- All eight vertical Care hubs in `ready` state.
- Representative `loading`, `empty`, `error`, and unauthorized/disabled states.
- Long labels/content and mobile navigation.
- Key DOM metrics: container widths, grid tracks, section order, typography,
  control dimensions, spacing, visible states, and hook presence.

### S4.2 SEO Parity

Status: `done`

Coverage:

- Complete landing composition for Health and Beauty.
- At least one existing service vertical to prove reuse.
- Light/dark variants where accepted design defines them.
- 390, 768, 1180, and 1440 widths.
- FAQ open/closed, selected service, CTA states, long CMS content, and missing
  optional media.

Acceptance rules:

- Executable `design-inbox` is the visual baseline.
- Material visual drift is a defect. Do not approve an approximate replacement
  because the runtime component API is cleaner.
- Visual fixes belong in runtime/shared production styles, never designer input.
- Record screenshot paths, viewport, route, vertical, profile, state, and commit
  for every comparison.

## S5 Data And Command Activation

### S5.1 Contract Inventory

Status: `done`

Create a table for every Care/SEO data source and action with:

- owning module;
- fixture shape and normalizer;
- known Core/CMS endpoint or URL contract;
- authentication/authorization requirements;
- consent/audit/secure-document requirements;
- command idempotence and duplicate-submit policy;
- success readback source;
- fallback/error behavior;
- final disposition: local, fixture, opened live, unavailable, or `not_opened`.

Unknown endpoint or security contracts must remain `not_opened`.

### S5.2 Safe Local And Fixture Activation

Status: `done`

Open interactions that can be truthful without speculative backend IO, such as:

- Care unit/specialist selection when it changes real local state.
- SEO service selection and section navigation.
- FAQ disclosure state.
- URL-backed call/service navigation.

For every async path:

- use the runtime's scoped pending/error model;
- choose and document single-flight or drop-while-running semantics;
- disable only the relevant command/entity;
- preserve retry after failure;
- do not infer success from request dispatch alone.

### S5.3 Live Activation

Status: `not_opened`

Tasks:

1. Connect only repository-proven, documented endpoint contracts.
2. Keep raw payload handling in adapters and shape logic in normalizers.
3. Preserve fixture mode and explicit error/fallback rendering.
4. Require mutation success readback or authoritative response state.
5. For sensitive Health actions, require RBAC, consent, audit event, secure
   viewer/download, and least-data rendering before opening the path.
6. Record every unopened endpoint/action in closeout rather than implementing a
   placeholder success.

Regression requirement:

- Existing pricing/products Core PIM live mode must continue to pass its adapter
  check and browser smoke.

## S6 CMS Packaging And Export

### S6.1 CMS Contract

Status: `done`

Tasks:

1. Extend portal CMS enums for Health, Beauty, and `appointments`.
2. Add Care module/entitlement configuration and accepted styles, including
   Care/SEO CSS dependencies.
3. Add a separate public SEO block/template schema with authored metadata and
   content slots.
4. Keep `data-portal-auth-mode` and initial-default-only `data-mode` behavior
   consistent with architecture.
5. Validate defaults and required fields without legacy aliases.

### S6.2 Dual Export

Status: `done`

Tasks:

1. Preserve authenticated portal export and generated preview.
2. Add independent public SEO export and preview artifact.
3. Ensure each export includes only the scripts/styles it owns and does not
   duplicate business logic inside generated HTML.
4. Verify public SEO output has useful metadata/content before application boot.
5. Do not upload artifacts.

Validation:

- `jq empty` for all JSON metadata and generated JSON artifacts.
- Export scripts run twice without dirty nondeterministic output.
- Portal and public SEO previews boot independently.
- CMS enum/config round trips preserve all eight verticals and three profiles.

## S7 Validation, Audit, Closeout

### S7.1 Regression Matrix

Status: `todo`

Run the complete validation matrix below and record exact commands, exit status,
browser, viewport, artifact paths, skipped checks, and reasons.

### S7.2 Independent Audit

Status: `todo`

The audit must:

- be performed by an independent subagent/reviewer;
- explicitly prohibit that reviewer from invoking subagents;
- inspect the complete customer-portal implementation diff since `c9879ae` and
  the prior runtime baseline;
- lead with severity-ranked actionable findings and file/line references;
- verify no fake success, dev-only compatibility, or authenticated/hash-only SEO
  delivery was introduced;
- verify visual evidence rather than trusting implementation claims;
- be saved as `audits/A1.md`.

Fix all actionable findings, rerun affected validation, and update the audit
disposition before closeout.

### S7.3 Closeout

Status: `todo`

Create `evidence/closeout.md` containing:

- final scope and decisions;
- baseline and implementation commits;
- complete ledger disposition;
- validation commands/results;
- visual evidence index;
- opened and `not_opened` live contracts;
- CMS artifacts and no-upload statement;
- residual risks/environment limitations;
- audit findings and fixes.

The program is complete only when all required rows in `master.md` are `done` or
intentionally `not_opened` and no required work remains.

Every earlier stage must already have `evidence/S<n>.md`; closeout must link
those notes rather than reconstructing their history from chat.

## Per-Stage Agent Gate

The following gate applies to S0-S7 in addition to each stage's own validation:

| step | owner | write access | completion signal |
| --- | --- | --- | --- |
| Implement | bounded stage writer subagent | only declared owned paths | Implementation and self-checks returned; agent no longer editing. |
| Inspect | Codex operator | integration scope only | Full diff reviewed, user changes reconciled, deterministic checks pass. |
| Validate | independent validator subagent | read-only | No actionable findings and no required missing validation; subagents prohibited. |
| Remediate | same live writer or fresh bounded writer | exact finding paths only | Findings fixed with targeted regression tests/checks. |
| Revalidate | Codex operator, then validator | operator integration/read-only review | All stage acceptance criteria pass after fixes. |
| Close | Codex operator | ledger/evidence/commit only | Agents closed, `evidence/S<n>.md` written, ledger updated, bounded commit recorded. |

Keep the current stage `in_progress` through all remediation cycles. Do not mark
it `done` between implementation and validation, and do not open the next stage
while a validator finding is unresolved.

## Validation Matrix

| area | minimum proof |
| --- | --- |
| Design integrity | `git diff c9879ae -- app-templates/customer-portal/design-inbox` shows no implementation mutation beyond separately accepted design commits. |
| Syntax | `node --check` passes for every runtime/design/script `.js` and `.mjs` file. |
| JSON | `jq empty` passes for manifests, scenarios, CMS metadata, and generated JSON. |
| Config | Eight verticals, three profiles, theme propagation, initial mode, module/entitlement resolution. |
| Routes | All 17 design routes accounted; auth, unknown, disabled, detail, Care entitlement, and SEO public-entry behavior. |
| Care fixtures | Eight hubs plus ready/loading/empty/error/unauthorized or disabled scenarios. |
| Care actions | Every accepted action registered with pending/error/readback or explicit unavailable/`not_opened` disposition. |
| SEO document | Public no-auth/no-hash content, title, description, canonical, FAQ structured data, authored slots. |
| SEO actions | CTA/service/FAQ actions have real URL, local state, command, or explicit unavailable disposition. |
| Existing modules | Auth, orders, proposals, services, pricing, products, checkout, calendar, activity, profile, and support regressions. Shell is proven structurally through config/nav/route-outlet checks. |
| PIM | Existing pricing/products live and fixture adapter checks remain green. |
| Async UI | Entity-scoped pending/error, duplicate-submit protection, retry, authoritative success/readback. |
| Security | Sensitive Health paths satisfy auth/RBAC/consent/audit/secure-view requirements or remain unopened. |
| Visual | Design/runtime screenshot and DOM metrics at 390/768/1180/1440 for Care and SEO. |
| CMS/export | Portal and public SEO metadata/export/preview artifacts validate independently and deterministically. |
| Console | No uncaught errors, failed module imports, invalid asset loads, or misleading success logs. |
| Closeout | Ledger, A1 audit, closeout evidence, residuals, and clean worktree accounting. |

## Standard Commands

Use the repository's available Node first. For Playwright browser checks, the
closed baseline used:

```bash
export PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
export PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
NODE=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

Static checks:

```bash
find app-templates/customer-portal/runtime app-templates/customer-portal/scripts app-templates/customer-portal/design-inbox \
  \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
find app-templates/customer-portal -name '*.json' -print0 | xargs -0 -n1 jq empty
git diff --check
```

Existing runtime checks to preserve and extend:

```bash
$NODE app-templates/customer-portal/scripts/config-behavior-check.mjs \
  --root app-templates/customer-portal/runtime
$NODE app-templates/customer-portal/scripts/route-smoke.mjs \
  --root app-templates/customer-portal/runtime
$NODE app-templates/customer-portal/scripts/pim-adapter-check.mjs
node app-templates/customer-portal/scripts/export-cms.mjs
$NODE app-templates/customer-portal/scripts/route-smoke.mjs \
  --root app-templates/customer-portal \
  --entry dist/customer-portal-preview.html
```

S6 must add equivalent deterministic validation for the public SEO export. S7
must use the final script names actually committed, not leave placeholder command
names in closeout evidence.
