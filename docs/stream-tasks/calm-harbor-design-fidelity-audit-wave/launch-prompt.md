# Launch — Calm Harbor Design Fidelity Audit

## Mission

Establish with evidence how faithfully the production runtime carries the
accepted design, and turn every deviation into a fix, a design brief, or a
recorded acceptance.

You are auditing, not redesigning. The most valuable output is an honest punch
list — including the parts you could not check.

## Package path

`docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/`

Source of truth: `master.md` (ledger, known starting points), `slices.md`
(method). Update `master.md` as slices close.

Read first:

1. `app-templates/customer-portal/design-requests/README.md` — the brief format
   you will have to write in.
2. `app-templates/customer-portal/ARCHITECTURE.md` — the design/runtime ownership
   split and the stable-hook contract.
3. `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S3.md`
   and `S4.md` — what the recent waves transferred, and the six known starting
   points in this package's `master.md`.

## Constraints (frozen)

- **`design-inbox/**` is read-only.** Never edit it, for any reason, including
  to "fix an obvious typo". It is the designer's artefact and the reference this
  audit measures against.
- **Never invent presentation.** A missing state is a brief for Claude Design in
  `design-requests/`, not a guess in `runtime/**`. This rule is the reason the
  wave exists; breaking it inside a fidelity audit would be self-defeating.
- **Only inventions may be deleted.** Repairing drift is in scope; redesigning is
  not. If a fix requires a judgement call about what it should look like, that is
  a brief.
- **A recorded product decision is not drift.** Plans as a hybrid model, one
  order type with typed lines, booking without server holds — all settled. Check
  the program evidence before filing a finding against them.
- **Do not weaken an honesty rule to match a picture.** If the design shows a
  number the server does not provide, the finding is against the design. The
  runtime omitting it is correct.
- **Stable hooks are contract.** `data-route`, `data-module`, `data-action`,
  `data-bind`, `data-state`, `data-visual-id` are selected on by the browser
  checks. Changing one is a contract change needing its own justification.
- **No CMS upload.**

## Execution order

1. **D1 manifest diff** — local. Produces the inventory everything else uses.
2. **D2 component audit** — may fan out by surface (one agent per route family),
   never by dimension.
3. **D3 copy and hooks** — parallel with D2, same split rule.
4. **D4 state reachability** — after D2.
5. **D5 responsive** — **blocked** unless the machine has Playwright. If it does,
   run it; if not, leave the row `blocked` and say so.
6. **D6 punch list and briefs** — last; proceeds even if D5 is blocked.

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

- `evidence/manifest-diff.md` reconciles against both manifests.
- Every priority surface (Appointments, Appointment detail, Purchases, Purchase
  detail, Plan, Profile, Shop, Cart, Checkout) has a per-component verdict with
  citations on both sides.
- The recorded hook greps still hit after any correction.
- The route × state matrix has no blank cells.
- **Release compile — mandatory if any runtime file was touched at all**, even to
  delete a single invented element:
  `node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs`
  This no-bundler runtime's esbuild step is the production build and also scans
  for fixture leakage; unit checks passing does not prove it builds.
- If a correction touched anything under `runtime/src/`, re-run the adapter
  checks too — presentation and adapters share `state.js` selectors more than
  the file layout suggests.

Run every command from the repo root (`core-content-templates`).

**Playwright is not installed on the machine where this package was written.**
Everything visual depends on it: the per-wave visual suites,
`visual-acceptance.mjs`, `s7-route-state-check.mjs`,
`config-behavior-check.mjs`, `calm-harbor-customer-portal-manual-check.mjs`. If
your machine lacks it, those are **unrun, not passed**, and the closeout must say
so plainly. Do not describe layout as verified on the strength of reading code.

## Closeout

- Ledger rows `done`, or `blocked` with the tooling reason.
- `audits/A1.md` — what was audited, the coverage actually achieved rather than
  intended, what was corrected, what was briefed.
- `evidence/punch-list.md` — every finding classified, located, routed.
- `evidence/closeout.md` — the honest fidelity verdict, naming any surface that
  went unaudited.
- New briefs in `design-requests/`, listed in that README.
- A delivery note in the parent program's `master.md`: W6 cannot claim visual
  parity without this wave's result.

## Commit / report expectations

- One commit per slice. Findings commits are `docs`; corrections are `fix` and
  must state what invention was removed.
- Final report: result first, then coverage achieved, what was corrected, what
  was briefed, and what could not be checked. Partial coverage honestly stated
  is worth more than a clean-looking report that skipped the hard surfaces.
