# Launch — Dynamic Token Credits Wave

## Mission
Execute the token credits wave: make `pricing.credits-meter` dynamically render routing-token pricing via the existing shared lab-ui pricing runtime while preserving static CMS fallback.

## Package path
`docs/stream-tasks/dynamic-token-credits-wave/`

Source of truth:
- `master.md` for goal, scope, rules, ledger, and Definition of Done.
- `slices.md` for implementation slices and validation matrix.

## Constraints
- Primary implementation scope is `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/**`.
- Reuse `docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js`; edit it only for tiny generic helpers that benefit adapters generally.
- Reuse `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json`.
- Preserve static credits/tokens markup as fallback and editor preview.
- Do not change unrelated lab-ui blocks except `_combined-preview.html` if needed for billing-sync validation.
- Do not introduce a package manager, bundler, or framework.
- Do not commit unless explicitly requested.
- The worktree already contains uncommitted changes from the previous dynamic pricing wave; do not revert them.

## Required execution order
1. Read existing `pricing.credits-meter` block files and the shared runtime.
2. Implement credits dynamic adapter.
3. Add metadata/config parameters to `pricing.credits-meter/block.json`.
4. Update credits harness for dynamic/fallback/error modes using `routes.json`.
5. Validate JSON, JS syntax, dynamic/fallback/error behavior, and billing sync.
6. Update ledger and create closeout artifacts.

Use `$execution-operator` semantics:
- Keep the package ledger current.
- Use subagents only if parallelism materially helps.
- Keep ownership boundaries narrow.
- Closeout only after implementation and validation are complete.

## Validation
Run and record:
- `jq empty docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.json`
- `node --check docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.js`
- `node --check docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js` if edited.
- Browser/DOM harness checks from a local static server under `docs/cms-components/lab-ui/`:
  - default dynamic credits harness renders routes fixture token products;
  - `?mode=fallback` keeps static content;
  - `?mode=error` falls back and records error;
  - billing sync still updates `data-pricing-period`.

If no prod compile command exists, state that explicitly in closeout.

## Closeout
- All ledger rows in `master.md` are `done` or explicitly `not_opened`.
- Create:
  - `docs/stream-tasks/dynamic-token-credits-wave/audits/A1.md`
  - `docs/stream-tasks/dynamic-token-credits-wave/evidence/closeout.md`
- Final report must include result, changed files, validation commands/results, and residual risks.

## Commit / report expectations
- No commit unless explicitly asked.
- If a commit is made, record hash in `master.md`.
- Collaboration warning: you are not alone in the codebase. Do not revert unrelated edits or prior wave changes. Reconcile file churn inside active ownership zones.
