# Launch — Dynamic Pricing Blocks Wave

## Mission
Execute the dynamic pricing blocks wave: add one shared Core PIM pricing loader and adapters that make existing lab-ui pricing sections dynamic while preserving static CMS fallback.

## Package path
`docs/stream-tasks/dynamic-pricing-blocks-wave/`

Source of truth:
- `master.md` for goal, scope, rules, ledger, and Definition of Done.
- `slices.md` for execution decomposition and validation matrix.

## Constraints
- Stay inside `docs/cms-components/lab-ui/14-pricing/` plus this package path unless a tiny shared lab-ui support file is objectively required.
- Preserve existing static markup/parameters as fallback/editor preview.
- Do not introduce package manager, bundler, framework, or unrelated repo restructure.
- Do not copy the live inline script into each block. Implement one shared normalized runtime and adapters.
- Do not hardcode English in value rendering; honor block/document locale.
- Do not insert API descriptions as HTML. Sanitize/strip tags and write text safely.
- The repository currently has no discovered `package.json`, Dockerfile, or CI build command; validate with JSON checks, JS syntax checks, harness/browser checks, and record this limitation.

## Required execution order
1. Shared Runtime — build the reusable loader/normalizer/cache.
2. Plans Adapter — wire `pricing.plans-flex` to normalized plans.
3. Matrix Adapter — wire `pricing.matrix-collapsible` to normalized groups/rows.
4. Fixtures/Harness — add compact SaaS/Sites/Routes fixtures and offline harness validation.
5. Metadata/Docs — update affected `block.json` parameters and notes.
6. Closeout — update ledger, create `audits/A1.md`, create `evidence/closeout.md`.

Use `$execution-operator` semantics:
- Keep one ledger in `master.md`.
- Use bounded subagents only where parallelism helps.
- Assign disjoint ownership zones.
- Close completed agents promptly.
- Do not stop until implementation, validation, integration, and closeout artifacts are complete or a real blocker is recorded.

## Validation
Run and record the strongest checks available in this repository:
- `jq empty` on every edited `block.json` and fixture `.json`.
- `node --check` or equivalent on every edited `.js`.
- Harness/browser proof for:
  - `pricing.plans-flex` dynamic SaaS fixture.
  - `pricing.matrix-collapsible` dynamic SaaS fixture.
  - fallback behavior when dynamic is disabled or fixture/API fails.
  - desktop and mobile viewport sanity.
- Cross-block billing event still works for the combined pricing preview where relevant.

If a local static server is needed for fixture loading, use a simple local server and record the URL/command.

## Closeout
- All ledger rows in `master.md` are `done` or explicitly `not_opened`.
- Delivery Notes list changed files and any commit hash if a commit is made.
- Create `docs/stream-tasks/dynamic-pricing-blocks-wave/audits/A1.md`.
- Create `docs/stream-tasks/dynamic-pricing-blocks-wave/evidence/closeout.md`.
- Final report must include:
  - result first;
  - zones done;
  - validation run;
  - residual risks or skipped checks.

## Commit / report expectations
- Do not commit unless explicitly instructed by the user or current repository workflow requires it.
- If committing, keep commits scoped by coherent milestone and record hashes in `master.md`.
- Worker closeout must list changed files and exact validation commands/results.
- Collaboration warning: you are not alone in the codebase. Do not revert unrelated edits. If files change inside an active ownership zone, reconcile them rather than resetting.
