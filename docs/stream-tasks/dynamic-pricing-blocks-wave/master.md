# Dynamic Pricing Blocks Wave

## Goal
Make the existing lab-ui pricing blocks dynamic by adding one shared Core PIM pricing loader and block-specific render adapters, while preserving the current CMS-authored markup as fallback/editor preview.

## Product Decision
Use the architecture selected in planning: one normalized pricing data layer, multiple DOM adapters. Do not copy the live inline pricing-table script into every block. Reuse its proven API contract, sorting, localization, and feature extraction behavior through a shared runtime.

## Scope
In scope:
- Add a shared dynamic pricing runtime for lab-ui pricing blocks.
- Wire `pricing.plans-flex` to dynamic plan card data.
- Wire `pricing.matrix-collapsible` to dynamic comparison groups and rows.
- Preserve static CMS fields as fallback when dynamic loading is disabled or fails.
- Add mock/live harness coverage for SaaS, Sites, and Routes pricing payload shapes.
- Update block metadata and notes so editors understand dynamic fields versus fallback fields.

Out of scope:
- Rebuilding the visual design of pricing blocks.
- Changing unrelated lab-ui blocks outside `docs/cms-components/lab-ui/14-pricing/`.
- Adding a framework/build system to this repository.
- Changing Core PIM API behavior.
- Implementing checkout or CRM purchase flow beyond preserving configurable CTA URLs/labels.

## Core Rules
- API loading is shared and cached by request signature.
- API response is normalized once, then consumed by adapters.
- Existing static markup remains valid fallback and editor preview.
- Dynamic behavior is opt-in via `data-pricing-dynamic="true"` or equivalent generated CMS parameter.
- No renderer may depend directly on raw Core PIM response shape after normalization.
- Descriptions from API must be text-safe: strip/sanitize HTML before inserting into text nodes.
- Locale must come from block config, `window.__swLocale`, document lang, or fallback `en`; do not hardcode `"en"` in value rendering.
- Plans sort by `SORT_ORDER_PRIORITY` when present, with amount as tie-breaker/fallback.
- Custom/contact pricing is detected from `display.customPrice` or amount `>= 2147483647`.

## Ownership Zones

| zone | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- |
| package-orchestration | operator | done | none | package files exist and are self-contained | `master.md`, `slices.md`, and `launch-prompt.md` are ready for execution/closeout |
| shared-runtime | local | done | package-orchestration | `node --check`; fixture normalization proof | shared loader normalizes/caches SaaS/Sites/Routes payloads and exposes stable adapter API |
| plans-adapter | local | done | shared-runtime | plans harness renders dynamic SaaS plans and fallback/error mode still works | `pricing.plans-flex` fills cards dynamically without breaking billing toggle |
| matrix-adapter | local | done | shared-runtime | matrix harness renders dynamic groups/rows on desktop and mobile accordion | `pricing.matrix-collapsible` renders feature matrix from normalized data |
| fixtures-harness | local | done | shared-runtime, plans-adapter, matrix-adapter | offline mock fixtures plus browser/harness checks | dynamic and fallback scenarios are reproducible without live API dependency |
| metadata-docs | local | done | shared-runtime | `jq empty`; notes document fields | dynamic config parameters and editor notes are added to affected blocks |
| closeout | operator | done | all implementation zones | final validation evidence recorded | ledger updated, `audits/A1.md` and `evidence/closeout.md` exist |

## Definition of Done
- A shared dynamic pricing runtime exists under `docs/cms-components/lab-ui/14-pricing/` or a clearly named shared lab-ui pricing path.
- `pricing.plans-flex` can populate plan slots from Core PIM pricing data while preserving current static fallback.
- `pricing.matrix-collapsible` can rebuild its table and mobile accordion from normalized feature groups and plan values.
- Dynamic config parameters are present in the relevant `block.json` files and represented in harness HTML.
- Mock fixtures cover at least:
  - `SERVICEWAND_SAAS` with `RECURRENT` / `INTERVAL` / `1 month`
  - `SERVICEWAND_SAAS_EXT` with `RECURRENT` / `INTERVAL` / `1 month`
  - `SERVICEWAND_SAAS_ROUTING_TOKENS` with `PER_UNIT` / `UNIT_PRICE`
- Validation evidence includes JS syntax/static checks and at least one local harness/browser proof for desktop and mobile-sized layouts.
- If no project build command exists, closeout explicitly states that no prod compile command is available in this repository and lists the substitute checks that were run.
- All ledger rows are `done` or `not_opened`.
- Closeout artifacts exist:
  - `docs/stream-tasks/dynamic-pricing-blocks-wave/audits/A1.md`
  - `docs/stream-tasks/dynamic-pricing-blocks-wave/evidence/closeout.md`

## Delivery Notes
- Created: 2026-06-15
- Package path: `docs/stream-tasks/dynamic-pricing-blocks-wave/`
- Completed: 2026-06-15
- Execution owner: local operator. No subagent tool was available in this session, so bounded zones were executed locally with the same ownership boundaries.
- Changed implementation files:
  - `docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/sites.json`
  - `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json`
  - `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.html`
  - `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.js`
  - `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.json`
  - `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/harness.html`
  - `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.html`
  - `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.css`
  - `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.js`
  - `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.json`
  - `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/harness.html`
- Closeout artifacts:
  - `docs/stream-tasks/dynamic-pricing-blocks-wave/audits/A1.md`
  - `docs/stream-tasks/dynamic-pricing-blocks-wave/evidence/closeout.md`
- Validation summary:
  - JSON: `jq empty` passed for edited block JSON and fixture JSON.
  - JS: `node --check` passed for shared runtime and edited block adapters.
  - Normalization: Node proof passed for SaaS, Sites, and Routes fixtures.
  - Browser harness: local static server at `http://127.0.0.1:4174/` from `docs/cms-components/lab-ui/` verified dynamic plans, dynamic matrix desktop, dynamic matrix mobile accordion, fallback disabled, failed fixture fallback, token CSS loading, and combined-preview billing sync.
  - Prod compile: no `package.json`, Dockerfile, or CI YAML was found in this repository, so no prod compile command was available.
- Commit hashes:
  - implementation: `26ffc1f` (`Make lab pricing blocks dynamic`)
  - package-orchestration: `26ffc1f`
  - shared-runtime: `26ffc1f`
  - plans-adapter: `26ffc1f`
  - matrix-adapter: `26ffc1f`
  - fixtures-harness: `26ffc1f`
  - metadata-docs: `26ffc1f`
  - closeout: `26ffc1f`
