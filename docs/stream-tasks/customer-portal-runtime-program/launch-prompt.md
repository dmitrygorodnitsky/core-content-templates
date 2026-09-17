# Launch — Customer Portal Runtime Program

## Mission

Execute the customer portal runtime program one stage at a time, starting with
the next unfinished stage, to turn the accepted Claude Design source into a
CMS-compatible custom JavaScript runtime.

## Package path

`docs/stream-tasks/customer-portal-runtime-program/`

Source of truth:

- `master.md` for goal, core decisions, scope, ownership zones, stage ledger,
  and Definition of Done.
- `slices.md` for stage decomposition and validation matrix.
- `app-templates/customer-portal/ARCHITECTURE.md` for the runtime contract.

## Current Target Stage

Start with S0 if the latest architecture/package docs are uncommitted.
Otherwise start with S1: Runtime Scaffold And Baseline Transfer.

Default mode is `next-stage-first`: complete and close one stage before opening
the next. Do not run the whole program continuously unless the user explicitly
requests that.

## Constraints

- Use custom JavaScript and native ES modules. Do not introduce React, a bundler,
  a package manager, or framework runtime.
- Treat `app-templates/customer-portal/design-inbox/` as immutable input.
- Preserve accepted design ids and hooks unless a documented migration is
  explicitly approved.
- Preserve `data-visual-id`, `data-module`, `data-route`, `data-bind`,
  `data-action`, and `data-requires-confirmation`.
- Do not retain backward compatibility for old dev-only contracts or preview
  toolbar behavior in production runtime.
- Treat weather/stormOps as a required reference UX. Snow Removal must prove
  storm home, weather-operational calendar, weather order confirmation, and
  weather/access commands; the same stormOps runtime must remain reusable for
  Lawn & Garden, Pool & Spa, Roofing, and Pest Control.
- Strip or isolate `data-dev-toolbar` from production runtime.
- Keep modules fixture-first before live Core API integration.
- Do not use fallback/mock success for mutating commands. Fixture success must
  be a real offline state transition; otherwise fail honestly.
- Do not upload anything to CMS without explicit current-thread approval.
- Do not commit credentials, API keys, or environment-specific secrets.
- Do not revert unrelated user changes.
- The repository has no discovered project-level prod build command for this
  template. Use the validation commands below and record this limitation in
  closeout until a real prod compile path exists.

## Required Execution Order

1. S0 Architecture Contract
   - Commit/push current docs if needed.
   - Confirm custom JS/no React decision is in `ARCHITECTURE.md`.
2. S1 Runtime Scaffold And Baseline Transfer
   - Validate `design-inbox`.
   - Identify and preserve the storm/weather source surfaces:
     `StormHome`, `StormCalendar`, `WeatherCard`, and weather/access action ids.
   - Create and boot `runtime/`.
   - Preserve hooks and route/action/module contract.
3. S2 Config, Router, Themes
   - Add vertical profiles, route registry, guards, theme propagation.
   - Prove `onDemand` and `stormOps` select different home/calendar variants by
     profile, not by visual-component hardcoding.
4. S3 Fixture PortalRuntime And Modules
   - Add fixture-first runtime, modules, adapters, normalizers, commands.
   - Add weather-triggered fixture shapes and command flows for stormOps.
5. S4 Live Core Adapter Integration
   - Connect live adapters module-by-module, starting with pricing/products.
6. S5 CMS Packaging And Export
   - Add CMS params, metadata, generated preview/export artifacts.
7. S6 Validation And Closeout
   - Update ledger and create audit/evidence.

Use `$execution-operator` semantics if executing with subagents:

- Keep one ledger in `master.md`.
- Use bounded ownership zones.
- Launch parallel work only when paths and contracts do not overlap.
- Close completed agents promptly.
- Reconcile file churn; never reset unrelated edits.

## Validation

Run and record the strongest checks available for the current stage.

S1 pre-scaffold checks:

```bash
find app-templates/customer-portal/design-inbox -name '*.js' -print0 | xargs -0 -n1 node --check
jq empty app-templates/customer-portal/design-inbox/manifest.json
jq empty app-templates/customer-portal/design-inbox/data/scenarios.json
```

S1 post-scaffold checks:

```bash
find app-templates/customer-portal/runtime -name '*.js' -print0 | xargs -0 -n1 node --check
jq empty app-templates/customer-portal/runtime/manifest.json
jq empty app-templates/customer-portal/runtime/data/scenarios.json
```

Browser/static-server checks:

- Design baseline server:

  ```bash
  cd app-templates/customer-portal/design-inbox
  python3 -m http.server 8777 --bind 127.0.0.1
  ```

  Open `http://127.0.0.1:8777/source.html`.

- Runtime server after S1 scaffold:

  ```bash
  cd app-templates/customer-portal/runtime
  python3 -m http.server 8778 --bind 127.0.0.1
  ```

  Open `http://127.0.0.1:8778/source.html`.

- Smoke every accepted route:
  `landing`, `auth.phone`, `auth.code`, `orders.list`, `order.detail`,
  `calendar`, `activity`, `services`, `pricing`, `products`, `checkout`,
  `proposals.list`, `proposal.detail`, `profile`, `support`.
- StormOps/weather smoke:
  - Snow Removal `orders.list` renders storm/weather home behavior.
  - Snow Removal `calendar` renders weather-operational agenda behavior.
  - Snow Removal `order.detail` renders weather confirmation when the order has
    a weather trigger.
  - `weather.confirm`, `weather.decline`, `access.confirm`, and
    `service.requestExtra` execute through command dispatch with pending,
    success, and error states once S3 opens.
  - Lawn & Garden, Pool & Spa, Roofing, and Pest Control reuse the stormOps
    profile with vertical-specific data/copy.
- Route-smoke method: use the design/runtime route selector when the preview
  toolbar is enabled in source validation; in production runtime validation use
  the route registry API or hash route URLs. Record which method was used.
- Prefer a scripted route-smoke harness once `runtime/` exists. If route smoke
  remains manual, record it as a durability residual.
- Check desktop/tablet/mobile viewport smoke.
- Check console has no runtime errors.

Contract checks:

- Manifest/scenario route/action consistency.
- Hook preservation scan for `data-visual-id`, `data-action`, `data-module`,
  `data-route`, `data-bind`, `data-requires-confirmation`.
- Confirm no production runtime element carries `data-dev-toolbar`.
- Confirm vertical profile changes theme/nav/routes/modules.
- Confirm weather/stormOps behavior is profile-driven and not reduced to a
  theme-only variation.
- Confirm disabled route and unknown route behavior.
- Confirm fixture/dynamic/fallback/error states where applicable.

CMS/export checks when S5 opens:

```bash
jq empty <generated-cms-json-files>
```

- Confirm generated root markup includes `data-portal-auth-mode`.
- Confirm runtime config parsing reads `portal_auth_mode` from
  `data-portal-auth-mode`.

Record any skipped checks and why.

## Stop Conditions Between Stages

Stop after each stage unless the user explicitly approves continuing.

Stop immediately and report if:

- accepted design ids would need migration;
- runtime cannot preserve visual parity without design changes;
- Core API endpoint contracts are unknown for the target live module;
- CMS embedding cannot support the theme/mode propagation contract;
- validation reveals a behavioral mismatch that would make later stages build on
  false assumptions.

## Closeout

For each completed stage:

- Update `master.md` ledger status.
- Record changed files and validation commands/results.
- Record commit hash if a commit is made.
- Note residual risks and skipped checks.

For final program closeout:

- All opened stage rows in `master.md` are `done` or explicitly `not_opened`.
- Create `docs/stream-tasks/customer-portal-runtime-program/audits/A1.md`.
- Create `docs/stream-tasks/customer-portal-runtime-program/evidence/closeout.md`.
- Final report starts with result, then stages completed, validation, and real
  residuals.

## Commit / Report Expectations

- Keep program/package docs commits separate from implementation commits when
  practical.
- Prefer one coherent implementation commit per completed stage.
- Do not commit unless the user asks or the current workflow requires it.
- If pushing, report branch and commit hashes.
- Final report must be concise and include exactly what was validated.
