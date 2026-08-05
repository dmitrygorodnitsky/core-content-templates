# Launch — Calm Harbor Customer Portal Full Activation Program

## Mission

Activate every Calm Harbor customer portal flow except Support against safe
customer-scoped APIs, with authoritative readback and explicitly simulated
payment.

## Package path

`docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/`

Source of truth:

- `master.md` — frozen product decisions, gates and ledger;
- `slices.md` — executable wave/slice decomposition;
- `app-templates/customer-portal/design-requests/calm-harbor-spa-full-flow-activation.md`
  — missing-design request.

Update `master.md` as slices close. Use next-wave-first execution; do not run
the whole program as one undifferentiated change.

## Current target wave

**W4 — commerce commands.** W0, W1 and W2 are closed; W3 is `blocked` on a
backend fault. See `master.md` Delivery Notes for what actually landed.

W4 has its own execution-ready package — **run that, not this file**:
`docs/stream-tasks/calm-harbor-commerce-commands-wave/launch-prompt.md`

A second, independent stream is also ready and does not compete for the same
files:
`docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/launch-prompt.md`
It audits the transferred runtime against `design-inbox/**` and routes design
gaps to Claude Design. **W6 cannot claim visual parity until it closes.** The
browser suites do run on this machine — that package's §Validation carries the
setup — but four of them fail for reasons nobody has diagnosed, so parity is
still unproven.

This program file remains the roadmap container and the place where wave
outcomes are recorded. Execute one wave per round; do not run the whole program
continuously.

## Constraints

- Preserve the accepted appointment-first Spa IA and Wave 15 visual system.
- Never edit incoming `design-inbox/**` while transferring it.
- Never accept Account/User/organization selection from the browser as scope.
- Never use private fixtures or local success in the live CMS package.
- Payment remains `SIMULATED`; no financial records or payment-success copy.
- Support stays unopened and is not a fallback for incomplete business flows.
- Baseline retail fulfillment is pickup only.
- Shared runtime hotspots are edited sequentially.
- Generated manual-upload files are exporter-owned.
- Do not upload or publish to CMS without explicit approval.
- Preserve unrelated dirty-worktree changes and never persist bearer tokens.

## Required execution order

1. W0 / S0-S1 — exact API inventory, deterministic seed and negative scope
   proof. Write redacted evidence; mark missing backend capabilities concretely.
2. W1 / S2 — validate and accept the user-imported designer source. Do not
   approximate missing Appointment detail, booking/reschedule, plan-offer, or
   Spa Profile design.
3. W2 / S3-S4 — scoped read adapters first, then 1:1 presentation activation.
4. W3 / S5 — appointment commands one at a time.
5. W4 / S6 — server commerce and simulated checkout, via its own package.
   **Cancellation and return are excluded**: no accepted design for the return
   states, and workflow event dispatch returns an opaque 500 tenant-wide.
6. W5 / S7 — plan enrollment/use/manage and least-data Profile update. Plan
   cancellation shares W3's blocker.
7. W6 / S8 — capability switch, release export, full E2E, visual proof and CMS
   dry run. Gated on the design-fidelity audit.

Stop between waves when a backend/design gate is not proven. Record the exact
blocked contract; do not substitute a fixture implementation and continue.

## Delegation protocol

Both child packages carry the full current `/execution-operator` contract —
delegation budget, the mandatory ambiguity line, the prompt shape, the
first-spawn retry protocol, background lifecycle SLA, file-churn presumption and
the escalation schema. Read the target wave's `launch-prompt.md` §Delegation
protocol before dispatching anything; do not improvise from memory.

## Validation

Per wave, run the focused checks defined in `slices.md`. At W6, at minimum run:

```bash
find app-templates/customer-portal/runtime app-templates/customer-portal/scripts -name '*.js' -o -name '*.mjs' | while read -r file; do node --check "$file"; done
node app-templates/customer-portal/scripts/core-account-adapter-check.mjs
node app-templates/customer-portal/scripts/core-orders-adapter-check.mjs
node app-templates/customer-portal/scripts/pim-adapter-check.mjs
node app-templates/customer-portal/scripts/config-behavior-check.mjs
node app-templates/customer-portal/scripts/activation-contract-check.mjs
node app-templates/customer-portal/scripts/calm-harbor-wave15-runtime-check.mjs
node app-templates/customer-portal/scripts/s7-route-state-check.mjs
node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs
node app-templates/customer-portal/scripts/calm-harbor-customer-portal-manual-check.mjs
node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
  --out app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging \
  --base-url https://dev-1.servicewand.com/core \
  --org SYSTEM \
  --dry-run
git diff --check
```

Add focused appointment, purchase, cart/checkout, plan, and profile checks as
their adapters land; W6 cannot rely only on the older Wave 15 fixture check.

The no-build CMS exporter is the production compile/assembly step. Do not omit
it in favor of a static module preview.

## Closeout

- All ledger rows are `done` or deliberately `not_opened`; at program completion
  only Support may be `not_opened`.
- Record commit hashes in `master.md` Delivery Notes.
- Create `audits/A1.md` with landed behavior, exact validation and residuals.
- Create `evidence/closeout.md` with result, key files, end-user flow summary,
  security/payment proof, CMS package inventory, and upload status.
- Do not claim completion while any primary route uses fixture/local success.

## Commit / report expectations

- Prefer one commit per closed slice or one tightly coupled read/presentation
  chain; never mix backend evidence, design intake and runtime activation in a
  single opaque commit.
- Stage only owned files and inspect the diff before every commit.
- Final report leads with which customer jobs work end-to-end, then validation,
  CMS readiness, and real residuals.

