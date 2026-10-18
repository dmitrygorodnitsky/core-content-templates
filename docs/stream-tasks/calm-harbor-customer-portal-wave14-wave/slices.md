# Calm Harbor Customer Portal Wave 14 Slices

## Overview

This wave moves one accepted executable design slice into the existing no-build customer portal and then reuses the already-proven read adapters. Presentation and activation remain separate gates.

## S0 — Source intake

- Intent: accept Wave 14.1 as deterministic visual truth.
- Owned paths: read-only `app-templates/customer-portal/design-inbox/**`; evidence package only.
- Task: verify the previous four blockers, JS syntax, manifest/scenario consistency, and viewport evidence.
- Do not: edit designer-owned files.
- Validation: `node --check` for every design JS file; `jq empty` for manifest/scenarios; blocker-specific source inspection.
- Completion: corrected source and evidence are present.

## S1 — Executable transfer

- Intent: mount current-staging presentation before business activation.
- Owned paths: `app-templates/customer-portal/runtime/**` and transfer-only checks.
- Task: transfer shell, account bootstrap, Orders, Services & prices, Shop, account menu, support-unavailable, and responsive styles with stable hooks/copy.
- Do not: change design hierarchy/copy or wire new commands.
- Validation: source and target open over HTTP; route/state smoke.
- Completion: fixture/reference candidate renders every in-scope surface.

## S2 — Visual acceptance

- Intent: prove reference/implementation parity.
- Owned paths: validation scripts and this package evidence.
- Task: capture paired states at 390/768/1180/1440 and compare DOM geometry/styles for drift.
- Do not: approve approximate drift without explicit user threshold.
- Validation: screenshot diff plus DOM metrics.
- Completion: zero or explicitly blocked/approved drift for each declared row.

## S3 — Adapter activation

- Intent: replace fixtures with the existing design-shaped live read models.
- Owned paths: manual runtime, Account/Orders/PIM adapters, focused checks.
- Task: preserve OIDC session states; resolve one Account from authenticated User; load only Account-filtered Orders; map public PIM rows; keep all writes unavailable.
- Do not: accept Account/User/Order IDs from CMS/URL, infer appointments, map raw status, or enable mutations.
- Validation: `core-account-adapter-check.mjs`, `core-orders-adapter-check.mjs`, `pim-adapter-check.mjs`, customer manual browser check.
- Completion: live states populate the accepted visual contract and negative scope checks fail closed.

## S4 — CMS package and closeout

- Intent: regenerate the uploadable staging package and record evidence.
- Owned paths: exporter, generated staging output, package audit/evidence.
- Task: export, verify exact inventory and payload root template, run final visual regression, write A1 and closeout.
- Do not: upload or hand-edit generated output.
- Validation: exporter, manual check, `git diff --check`.
- Completion: generated package is reproducible and closeout is honest.

## Dependency Order

`S0 -> S1 -> S2 -> S3 -> S4`.

## Validation Matrix

| surface | states | widths |
| --- | --- | --- |
| shell/navigation | ready, account-menu, mobile-nav, support-unavailable | 390, 768, 1180, 1440 |
| Orders | ready, long, loading, empty, error, account gates | 390, 768, 1180, 1440 |
| Services & prices | ready, loading, empty, error | 390, 768, 1440 |
| Shop | ready, loading, empty, error | 390, 768, 1440 |
| OIDC | checking, signed-out, unavailable, signed-in | 390, 1440 |

## Closeout Requirements

- Ledger statuses reflect reality.
- `audits/A1.md` records visual and behavioral validation.
- `evidence/closeout.md` names the staging security residual and unopened capabilities.

