# Dynamic Token Credits Wave

## Goal
Make `pricing.credits-meter` dynamic by connecting the existing lab-ui credits/tokens section to the shared pricing runtime and the Core PIM routing-token pricing contract.

## Product Decision
Use the shared runtime introduced by `docs/stream-tasks/dynamic-pricing-blocks-wave/` rather than adding a second loader. `pricing.credits-meter` should remain a specialized usage/tokens surface, not a generic plans table.

## Scope
In scope:
- Add opt-in dynamic config to `pricing.credits-meter`.
- Use `SERVICEWAND_SAAS_ROUTING_TOKENS` with `PER_UNIT` / `UNIT_PRICE` to populate token pack economics from Core PIM data.
- Preserve the current static allowance and pack markup as CMS fallback/editor preview.
- Use existing fixture `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json` for offline harness validation.
- Keep cross-block `pricing:billing` synchronization working.
- Update `pricing.credits-meter/block.json` notes/parameters for dynamic token pricing.
- Add package closeout artifacts.

Out of scope:
- Reworking SaaS plan cards or comparison matrix.
- Changing the shared runtime except for tiny generic helpers required by the credits adapter.
- Changing API behavior or inventing token business rules not present in API data or CMS fallback fields.
- Building checkout/CRM purchase flow.
- Editing unrelated lab-ui categories.

## Core Rules
- `pricing.credits-meter` dynamic mode is opt-in via CMS/data attributes.
- Static CMS fields remain fallback if dynamic is disabled, fixture/API fails, or runtime is unavailable.
- The adapter must use `window.LabPricing.load(section)` and normalized `plans/groups`.
- Do not duplicate request-building, sorting, localization, or sanitization logic from `_shared/pricing-runtime.js`.
- For routing-token products, render returned products as token packs/rate tiers.
- Preserve existing `pricing:billing` listener behavior.
- Keep DOM writes text-safe.
- If a live endpoint is not available in the local harness, validate with `routes.json`.

## Ownership Zones

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| package-orchestration | operator | operator | done | none | Package files read; scope and forbidden paths honored | Package executed by execution-operator with one ledger and no blocking questions |
| credits-adapter | operator | operator | done | package-orchestration, existing shared-runtime | `node --check` on `pricing.credits-meter/block.js`; Chrome DOM harness dynamic proof | Credits block renders token tiers from normalized routes fixture |
| credits-metadata | operator | operator | done | credits-adapter | `jq empty pricing.credits-meter/block.json`; manual parameter scan | Block JSON exposes dynamic token pricing config without removing fallback fields |
| credits-harness | operator | operator | done | credits-adapter | Chrome DOM proof for dynamic/fallback/error and billing sync | Harness defaults to dynamic routes fixture and supports fallback/error modes |
| closeout | operator | operator | done | all slices | Ledger updated; A1 and closeout evidence created | All rows done and residuals documented |

## Definition of Done
- `pricing.credits-meter` can render routing-token data dynamically from the existing shared runtime.
- Harness dynamic mode uses `../_fixtures/routes.json` and renders token pack rows in expected sort order.
- Fallback mode preserves the original static credits/tokens content.
- Error mode falls back cleanly and records `data-pricing-error` or equivalent state.
- `pricing:billing` still updates `data-pricing-period` on credits-meter and combined preview behavior remains intact.
- Edited JSON and JS pass syntax validation.
- Closeout artifacts exist:
  - `docs/stream-tasks/dynamic-token-credits-wave/audits/A1.md`
  - `docs/stream-tasks/dynamic-token-credits-wave/evidence/closeout.md`

## Delivery Notes
- Created: 2026-06-15
- Package path: `docs/stream-tasks/dynamic-token-credits-wave/`
- Depends on uncommitted prior wave changes under:
  - `docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json`
- Commit hashes:
  - implementation: `26ffc1f` (`Make lab pricing blocks dynamic`)
  - package-orchestration: `26ffc1f`
  - credits-adapter: `26ffc1f`
  - credits-metadata: `26ffc1f`
  - credits-harness: `26ffc1f`
  - closeout: `26ffc1f`

## Closeout Evidence
- Date: 2026-06-15
- Changed implementation files:
  - `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.html`
  - `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.js`
  - `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.json`
  - `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/harness.html`
- Changed package files:
  - `docs/stream-tasks/dynamic-token-credits-wave/master.md`
  - `docs/stream-tasks/dynamic-token-credits-wave/audits/A1.md`
  - `docs/stream-tasks/dynamic-token-credits-wave/evidence/closeout.md`
- Validation:
  - `jq empty docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.json` — passed
  - `node --check docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.js` — passed
  - Chrome DOM harness at `http://127.0.0.1:8765/14-pricing/pricing.credits-meter/harness.html` — passed dynamic, fallback, error, and billing-sync checks
  - Chrome DOM combined preview at `http://127.0.0.1:8765/14-pricing/_combined-preview.html` — passed billing toggle sync from plans to matrix and credits
- Prod compile command: not found. Repo scan found no root `package.json`, Dockerfile, CI workflow, Makefile, justfile, or task runner; only `docs/cms-components/lab-ui/scripts/build-landing.mjs` exists.
- Residual risks:
  - Live Core PIM endpoint behavior was not exercised; validation used the offline `routes.json` fixture required by the package.
  - CMS/page integrations must load `_shared/pricing-runtime.js` before `pricing.credits-meter/block.js` when dynamic pricing is enabled.
