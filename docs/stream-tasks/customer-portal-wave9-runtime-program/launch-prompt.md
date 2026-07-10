# Launch — Customer Portal Wave 9 Runtime Program

Use `$execution-operator` to execute the next unfinished stage in:

`docs/stream-tasks/customer-portal-wave9-runtime-program/`

## Mission

Bring the existing custom-JavaScript customer portal runtime up to the accepted
wave-9 design baseline at commit `c9879ae`, including Health/Beauty,
`appointments`, vertical Care hubs, and a public SEO/marketing entry, without
visual drift, speculative integrations, legacy dev compatibility, or
fallback/mock success.

## Package Path

`docs/stream-tasks/customer-portal-wave9-runtime-program/`

Source of truth:

- `master.md` for decisions, dependencies, ledger, and Definition of Done.
- `slices.md` for exact stage/slice ownership, tasks, and validation.
- `launch-prompt.md` for operator constraints and execution order.

The program package remains authoritative. Create a child durable package only
when a stage cannot be executed safely within one bounded operator run, and link
that package from the parent ledger.

## Read First

1. `docs/stream-tasks/customer-portal-wave9-runtime-program/master.md`
2. `docs/stream-tasks/customer-portal-wave9-runtime-program/slices.md`
3. `app-templates/customer-portal/ARCHITECTURE.md`
4. `app-templates/customer-portal/design-inbox/README.md`
5. `app-templates/customer-portal/design-inbox/HANDOFF.md`
6. `app-templates/customer-portal/design-inbox/manifest.json`
7. `app-templates/customer-portal/design-inbox/data/scenarios.json`
8. `docs/stream-tasks/customer-portal-runtime-program/evidence/closeout.md`

The old runtime package is closed evidence. Do not edit its ledger or closeout.

## Current Target

Open S0 only:

- S0.1 Baseline Inventory
- S0.2 Architecture Contract

Default execution is current-stage-to-done. Complete, validate, remediate, and
update the ledger for S0 before opening S1. When full-program execution is
requested, continue through the same gate one stage at a time without pausing
between successfully closed stages.

## Constraints (Frozen)

- Use custom JavaScript and native ES modules; no React, bundler, or package
  manager.
- `design-inbox/**` is immutable source of truth.
- Production implementation belongs in `runtime/**`, `cms/**`, and owned
  scripts/docs.
- Preserve accepted ids, hooks, component composition, visual states, and
  responsive behavior.
- Support 17 design routes, eight vertical themes, and three UX profiles.
- `seo.landing` may exist as a parity route, but production SEO ships as a
  separate public CMS document. It must work without portal auth, shell, or hash
  routing and must emit indexable content plus title, description, canonical,
  and FAQ structured data.
- Care is a normalized, entitlement-aware module covering all eight verticals.
- Preserve existing pricing/products PIM integration and all old profile/route
  behavior.
- Do not add backward compatibility for superseded dev-only contracts.
- Do not invent live endpoints or Health security contracts.
- No fallback/mock success. Fixture success requires a real inspectable state
  transition; unknown or unsafe live work remains `not_opened`.
- No CMS upload.

## Execution Order

1. S0 Contract And Baseline
2. S1 Shared Config, Themes, Profiles, Router
3. S2 Care Executable Transfer
4. S3 Public SEO Executable Transfer
5. S4 Visual Acceptance
6. S5 Data And Command Activation
7. S6 CMS Packaging And Export
8. S7 Validation, Audit, Closeout

All stages and subagents run sequentially. Do not parallelize S2 and S3 or run a
validator while its writer is still editing. Shared config/router/state/actions/
manifest/scenario/CMS export files are integrated serially by the operator.

Do not merge independent high-risk stages for speed. In particular:

- Do not combine shared routing with visual transfer.
- Do not combine visual acceptance with data activation.
- Do not combine unknown live endpoint work with CMS packaging.
- Do not close the program without an independent audit and durable evidence.

## Operator Protocol

- Inspect the worktree and newest user changes before assigning work.
- Keep `master.md` as the single authoritative ledger.
- Change a row to `in_progress` when opened and to `done`, `blocked`, or
  `not_opened` immediately after disposition.
- Delegate only bounded, non-overlapping ownership zones.
- Give every subagent explicit allowed paths, prohibited paths, validation, and
  completion criteria.
- Reconcile agent output against the current worktree; never overwrite or
  revert unrelated user changes.
- Close completed/stale agents promptly.
- Before edits, compare runtime behavior to executable design source and the
  closed baseline.
- Use `apply_patch` for manual edits.
- Run the strongest available checks after each slice and record exact results.
- Keep commits stage-scoped. Do not mix unrelated repository changes.

## Mandatory Stage Loop

For each stage `S<n>`:

1. Mark the stage and opened slices `in_progress`.
2. Launch one bounded writer subagent. Give it exact owned/prohibited paths,
   acceptance criteria, validation, and the instruction: **do not invoke
   subagents**.
3. When it returns, inspect the complete diff and run deterministic validation
   locally. Do not accept its self-report as proof.
4. After local checks pass, launch a separate read-only validator subagent with
   the package, stage diff, and evidence. Instruct it to **not invoke
   subagents** and to report severity-ranked findings with file/line references.
5. If findings exist, return the exact list to the live writer immediately or
   launch one fresh remediation writer with narrow ownership. Re-run steps 3-4.
6. Repeat until no actionable findings or required validation gaps remain.
7. Close every stage agent, write `evidence/S<n>.md`, update ledger and Delivery
   Notes, and create the bounded stage commit. Only then open `S<n+1>`.

Keep the stage `in_progress` throughout implementation, review, and remediation.
There is no retry cap; stop only on a true external blocker after local recovery
options are exhausted and recorded.

## Required S0 Output

S0 must produce:

1. A durable design-to-runtime gap inventory covering routes, themes, profiles,
   modules, states, actions, fixtures, styles, CMS params, and exports.
2. An updated `ARCHITECTURE.md` that freezes:
   - accepted design commit `c9879ae`;
   - 17 routes, eight themes, and three profiles;
   - Care normalized module and entitlement states;
   - separate public SEO production entry;
   - Health/Beauty security boundaries;
   - no legacy compatibility and no mock-success rules.
3. Updated S0 ledger statuses and validation results in package delivery notes
   and `evidence/S0.md`.

S0 must not edit runtime implementation or designer-owned source.

## Validation

```bash
git status --short
git show --stat --oneline c9879ae
jq empty app-templates/customer-portal/design-inbox/manifest.json
jq empty app-templates/customer-portal/design-inbox/data/scenarios.json
find app-templates/customer-portal/design-inbox -name '*.js' -print0 | xargs -0 -n1 node --check
git diff --check
```

Later stages must preserve and extend these existing checks:

```bash
export PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
export PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
NODE=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node

$NODE app-templates/customer-portal/scripts/config-behavior-check.mjs --root app-templates/customer-portal/runtime
$NODE app-templates/customer-portal/scripts/route-smoke.mjs --root app-templates/customer-portal/runtime
$NODE app-templates/customer-portal/scripts/pim-adapter-check.mjs
node app-templates/customer-portal/scripts/export-cms.mjs
$NODE app-templates/customer-portal/scripts/route-smoke.mjs --root app-templates/customer-portal --entry dist/customer-portal-preview.html
git diff --check
```

Use the final committed public SEO export/check command once S6 creates it.

## Stop And Report

Stop the affected slice instead of improvising when:

- stable design ids would need migration;
- designer-owned source would need implementation edits;
- public SEO would only work through authenticated/hash routing;
- an endpoint, permission, consent, audit, secure-document, or idempotence
  contract is missing;
- a command can only fake success;
- visual parity cannot be measured;
- shared-file ownership collides;
- old PIM, stormOps, route, theme, or CMS behavior regresses.

Mark isolated unknown live integrations `not_opened` and continue with truthful
fixture/local work when the remaining Definition of Done is independently
achievable.

## Closeout

When S7 is reached:

- run an independent implementation audit using a subagent that is explicitly
  forbidden from invoking subagents;
- save the audit as `audits/A1.md`;
- fix all actionable findings and rerun affected validation;
- write `evidence/closeout.md` with commits, commands, visual artifacts,
  unopened contracts, and residuals;
- mark the program complete only when every required ledger row is `done` or
  intentionally `not_opened` and no required work remains.

Each completed stage must first add `evidence/S<n>.md` with exact commits,
commands, results, and residuals. The final closeout links these stage records.

## Commit / Report Expectations

- Keep the initial durable package in a docs-only commit when committing it.
- Prefer one bounded implementation commit per completed stage; do not combine
  unrelated high-risk stages into one commit.
- Record each stage commit hash in `master.md` Delivery Notes and its stage
  evidence file.
- Do not commit unrelated user changes, generated churn with no contract value,
  credentials, or environment-specific secrets.
- After each stage report: result first, ledger rows closed, files/behavior
  changed, exact validation run, and real residuals or `not_opened` contracts.
- Final report must identify both delivery surfaces, audit disposition, CMS
  artifacts, no-upload status, and remaining external dependencies.
