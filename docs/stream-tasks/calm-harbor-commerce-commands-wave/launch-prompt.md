# Launch — Calm Harbor Commerce Commands (W4)

## Mission

Give the Calm Harbor customer a server-owned cart, honest sellability, and a
simulated checkout that creates a real Core Order confirmed only by
authoritative readback.

## Package path

`docs/stream-tasks/calm-harbor-commerce-commands-wave/`

Source of truth: `master.md` (ledger, backend truth table), `slices.md`
(decomposition). Update `master.md` as slices close.

Read first, in this order:

1. `app-templates/customer-portal/content/cases/SPA-VERTICAL-CORE-MODEL.md` —
   the types, workflows, and **who owns each money figure**. §3 and §5 will save
   you a day.
2. `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S3.md`
   — the read adapters you build on, plus §5a on how money was got wrong once.
3. `…/evidence/S5.md` §4 — the workflow-event fault that keeps cancel out of
   this wave.

## Constraints (frozen)

- **Money is read, never assembled.** Cart totals, `unitAmount`, `lineAmount`
  and `Order.grandTotal` are server-owned. `OrderItem.amount` is the **unit**
  price — Core multiplies it by `itemCount`. Never send order totals. Where Core
  gives no figure, show none.
- **A 2xx is not success.** Confirm from readback or an inspectable transition.
- **Payment stays SIMULATED.** No charge, invoice, receipt, balance
  transaction, refund, or second payment method. Never the words Paid, Charged,
  Payment successful, Refunded, Receipt.
- **No invented UI.** A state the accepted design does not cover goes to
  `app-templates/customer-portal/design-requests/` as a brief. Never improvise
  markup in `runtime/**`, and never edit `design-inbox/**`.
- **Cancel and return are out of scope** — blocked by a design gap and by
  tenant-wide workflow-event 500s. Leave them `not_opened`; do not build against
  a dead endpoint.
- **`actions.js` and `state.js` are a shared hotspot.** Exactly one slice may
  hold them at a time.
- **No CMS upload.** Rebuild and export only; uploading needs explicit approval.
- **Identity is `RECORD_CODE`**, never `notes`. Core cannot filter on dynamic
  attributes and returns `200` with zero rows instead of erroring — match
  client-side or you will create duplicates.

## Execution order

1. **C1 cart adapter** — local. Foundation; nothing else starts first.
2. **C2 sellability** — parallel with C3, after C1.
3. **C3 cart presentation** — parallel with C2, after C1. Must not touch
   `actions.js`.
4. **C4 checkout** — sequential, alone. Owns `actions.js` and `state.js`.
5. **C5 fulfillment record** — after C4.
6. **C6 evidence** — last.

## Delegation protocol

Follows the current `/execution-operator` contract. These are not suggestions —
each one exists because its absence has cost a wave.

**Budget.** Default cap **3 parallel subagents**. More is a resource decision,
not a freebie: every extra agent costs context, integration, and stale-agent
surface. Keep the critical path local; delegate only work that is bounded,
self-contained, materially useful, and *not* the immediate blocker for your next
local step.

**Status vocabulary — exactly one, across the whole run:**
`todo` · `in_progress` · `blocked` · `done` · `not_opened` · `stale`.
`stale` means a delegated zone with no forward motion — redirect or close it,
never leave it drifting.

**Every multi-slice `Agent` prompt must carry this line verbatim:**

> On ambiguity, make the smallest safe judgment call that preserves behaviour,
> document the decision in `audits/A1.md`, and continue. Do NOT halt to ask a
> question unless a truly blocking contradiction emerges.

Without it, subagents paralyse on small decisions and return early with nothing.

**Prompt shape:** `Objective | Owned scope | Forbidden scope | Context |
Validation | Commit expectation | Closeout expectation`, plus the warning that
the worker is not alone in this repo and must not revert unrelated work.
Creating helper files, checks, or fixtures **inside the owned zone** is allowed
and expected — do not treat them later as a surprise blocker.

**First-spawn retry.** The first `Agent` call of a wave often returns early at
60–150s with a truncated half-thought and no commit. This is a dispatch hiccup,
not a plan failure. When a `completed` agent returns with no commit hash, no
per-slice outcome, or a mid-sentence "now let me…":

1. `git status --short` to see what partial edits landed.
2. Keep them if they are coherent and in scope; otherwise `git restore <path>`.
3. Re-dispatch the **identical** prompt, noting it is a retry after a premature
   return. Do not re-architect the scope.
4. Reinforce: `CRITICAL: Do NOT return until all N slices complete and the commit
   lands.`

Do **not** split the wave into smaller agents to dodge the timeout — that is the
wrong fix.

**Background lifecycle.** Track each background agent through `running` →
`completed_not_integrated` → `integrated_pending_close` → `closed`. A
`completed` agent with no follow-up gets `TaskStop` in the same round. No
`completed` background agent may still be open when you send the final message.

**File churn is not a blocker.** Files appearing inside an active ownership zone
came from a subagent — presume that and reconcile, do not stop to ask. Escalate
only for: changes outside all active zones, two streams editing the same
critical file incompatibly, anything suggesting data loss or destructive
operations, or repo state that cannot be reconciled with the plan.

**Escalate in this schema:**
`blocker | impacted zone | why local action failed | smallest decision needed |
fallback if unanswered`.
Before escalating, try in order: read the code and docs, run the command,
delegate a bounded `Explore` investigation, then make the smallest safe
assumption that preserves motion.

## Validation

Run everything from the **repo root** (`core-content-templates`):

- `node app-templates/customer-portal/scripts/core-cart-adapter-check.mjs`
- `node app-templates/customer-portal/scripts/pim-adapter-check.mjs`
- `node app-templates/customer-portal/scripts/cart-module-check.mjs`
- `node app-templates/customer-portal/scripts/core-spa-demo-adapter-check.mjs`
- `node app-templates/customer-portal/scripts/core-orders-adapter-check.mjs`
- `node app-templates/customer-portal/scripts/core-orders-adapter-check.mjs` and
  `core-plans-adapter-check.mjs` must still pass — they are the regression net
  for the read side.

**Release compile — mandatory, not optional:**

- `node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs`
- `node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs`

This runtime has no bundler in the usual sense; the esbuild step *is* the
production build, and it also runs the fixture-leak boundary scan. Green unit
checks do not prove the bundle builds — several sessions have been caught by
exactly that gap.

**End-to-end proof on staging:** check out a two-item cart, then assert
`Order.grandTotal` equals Σ(`amount` × `itemCount`), that the lines carry the
right `SPA_ITEM_*` types, that a replay creates nothing, and that `invoice` and
`balance-transaction` are still empty.

Live probing as the customer needs the portal API key from the user — the deploy
key gives an admin session, which does not reproduce the cart's account binding.
Never commit it.

**Cannot run here:** every Playwright suite (`config-behavior-check.mjs`,
`s7-route-state-check.mjs`, per-wave visual checks,
`calm-harbor-customer-portal-manual-check.mjs`). Report them as **unrun**, not
passed. Visual parity is W6's gate and needs a machine with Playwright.

## Closeout

- All ledger rows `done` or `not_opened` with a stated reason.
- Commit hashes in `master.md` Delivery Notes.
- `audits/A1.md` — what landed, what was validated, residuals.
- `evidence/closeout.md` — result, key files, behavioural summary, honest
  residuals.
- A delivery note appended to the parent program's `master.md`.

## Commit / report expectations

- One commit per completed slice; conventional prefixes (`feat`, `fix`,
  `refactor`, `docs`, `test`).
- Final report: result first, then zones done, validation actually run, and real
  residuals. If something is unrun, say unrun — never imply coverage you do not
  have.
