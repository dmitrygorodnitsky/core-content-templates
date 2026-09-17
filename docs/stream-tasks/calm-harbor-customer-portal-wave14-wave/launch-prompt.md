# Launch — Calm Harbor Customer Portal Wave 14

## Mission

Productize the accepted Wave 14.1 Calm Harbor current-staging design into the existing authenticated CMS package without visual drift or invented backend capability.

## Package path

`docs/stream-tasks/calm-harbor-customer-portal-wave14-wave/`

Use `master.md` as the ledger and `slices.md` as the execution decomposition.

## Constraints

- Never edit `app-templates/customer-portal/design-inbox/**`.
- Preserve all accepted stable hooks, copy, hierarchy, and responsive behavior.
- Keep Appointments and every write unopened.
- Never use fixture customer data in live mode.
- Do not upload to CMS.

## Execution order

1. S0 source intake.
2. S1 executable transfer.
3. S2 strict visual acceptance.
4. S3 OIDC/Account/Orders/PIM adapter activation.
5. S4 package regeneration and closeout.

## Validation

- design/runtime JS syntax and JSON checks;
- reference/implementation screenshot and DOM comparisons;
- focused Account, Orders, PIM, config, and manual package checks;
- final generated inventory and `git diff --check`.

## Closeout

- All ledger rows are `done`, `blocked`, or intentionally `not_opened`.
- Create `audits/A1.md` and `evidence/closeout.md`.
- Record exact commands and real residuals.

## Commit / report expectations

- Preserve unrelated dirty worktree changes.
- Do not commit unless explicitly requested.
- Final report leads with the rendered/runtime outcome, then validation and residuals.

