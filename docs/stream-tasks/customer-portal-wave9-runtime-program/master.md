# Customer Portal Wave 9 Runtime Program

Created: 2026-07-10
Package path: `docs/stream-tasks/customer-portal-wave9-runtime-program/`
Status: program container
Current target: S1 Shared Config, Themes, Profiles, Router (`done`; S2 not yet opened)
Execution mode: sequential stage-to-done loop

## Goal

Bring the production customer portal runtime up to the accepted wave-9 design
baseline without visual drift, while preserving the existing custom JavaScript
architecture, fixture/live truthfulness, CMS export contract, and previously
validated pricing/products PIM behavior.

The resulting product has two related but distinct delivery surfaces:

1. An authenticated, modular customer portal with profile-driven pages and a
   new vertical-specific Care module.
2. A public, indexable SEO/marketing landing entry that shares tokens and
   components with the portal but does not depend on authenticated shell or
   hash routing.

## Accepted Baselines

Design source of truth:

- Commit `c9879ae` (`Expand customer portal vertical design`).
- `app-templates/customer-portal/design-inbox/**`.
- `app-templates/customer-portal/design-inbox/README.md`.
- `app-templates/customer-portal/design-inbox/HANDOFF.md`.
- `app-templates/customer-portal/design-inbox/manifest.json`.
- `app-templates/customer-portal/design-inbox/data/scenarios.json`.

Closed production runtime baseline:

- `docs/stream-tasks/customer-portal-runtime-program/**`.
- Runtime scaffold and config: `204b331`, `e89557a`.
- Fixture runtime and PIM adapter: `446f5e2`, `a2e5f6b`.
- CMS export and closeout: `c97b046`, `85e9be4`.
- Post-closeout fixes: `f77fed8`, `6a43c3f`, `ada6650`, `215c8b7`.

The prior package is closed evidence. Do not reopen it or rewrite its ledger.
This package owns all wave-9 follow-up work.

## Fixed Decisions

- Keep custom JavaScript and native ES modules. Do not add React, a bundler, or
  a package manager.
- Treat `design-inbox/**` as immutable designer-owned input.
- Transfer accepted markup, styles, route ids, action ids, state ids, and
  `data-*` hooks into `runtime/**`; do not redesign during activation.
- Support eight vertical themes: HVAC, Snow Removal, Lawn & Garden, Pool & Spa,
  Roofing, Pest Control, Health, and Beauty.
- Support three UX profiles: `onDemand`, `stormOps`, and `appointments`.
- Account for all 17 accepted design routes, including `care` and
  `seo.landing`.
- Keep `seo.landing` available in the executable design/runtime parity harness,
  but ship its production form as a separate public CMS entry with server-
  visible metadata and content. It must not require authentication, portal
  shell boot, or hash navigation to be indexed or used.
- Care is a normalized module with entitlement-aware states, not vertical copy
  embedded directly in shared route logic.
- Pricing/products retain the proven Core PIM live adapter and fixture path.
- Unknown live endpoint contracts remain `not_opened`. Never convert missing
  IO, permissions, or command handlers into fallback/mock success.
- Health does not invent clinical metrics, diagnoses, results, or treatment
  claims. Sensitive provider, appointment, address, and document paths require
  explicit authorization, consent, audit, and secure-view/download contracts
  before live activation.
- Fixture command success is valid only when it performs a real, inspectable
  offline state transition. Otherwise the command must be unavailable or fail
  honestly.
- No CMS upload is part of this program.

## Scope

In scope:

- Reconcile architecture docs with the wave-9 design contract.
- Extend runtime config, themes, profiles, route registry, navigation, and
  guards for Health, Beauty, `appointments`, `care`, and `seo.landing`.
- Transfer the Care page and all eight vertical Care hubs into production
  runtime components and styles.
- Add a Care module descriptor, fixture adapter, normalizer, state handling,
  entitlements, and command dispatch.
- Transfer reusable SEO sections and create a dedicated public CMS template,
  metadata contract, canonical handling, and FAQ structured data.
- Prove visual parity against executable design source across verticals,
  states, and responsive viewports.
- Activate only data sources and commands whose contracts are present and
  testable; explicitly record all unopened live work.
- Extend CMS metadata, exports, previews, and validation harnesses.
- Preserve all existing six-vertical, `stormOps`, route, command, CMS, and PIM
  behavior.
- Audit and close the program with durable evidence.

Out of scope:

- Mutating `design-inbox/**` to make runtime implementation easier.
- React/framework migration or build-system introduction.
- Renaming accepted ids or supporting superseded dev-only contracts.
- Speculative Core endpoints, credentials, production writes, or fake API
  responses.
- CMS upload, deployment, DNS, analytics vendor configuration, or production
  environment setup.
- SEO copywriting beyond faithfully transferring accepted design content and
  exposing CMS-authored slots.
- Clinical workflows, medical records systems, diagnoses, outcomes, or claims
  not explicitly present in the accepted design and backed by approved APIs.
- Unrelated refactors of the prior customer portal runtime.

## Ownership Zones

| zone | primary paths | owner | status | boundary |
| --- | --- | --- | --- | --- |
| contract-baseline | `app-templates/customer-portal/ARCHITECTURE.md`, package docs | Codex | done | Wave-9 contract and S0 evidence independently validated. |
| design-input | `app-templates/customer-portal/design-inbox/**` | Claude Design input / Codex validation | done | Immutable accepted source at `c9879ae`. |
| shared-config-router | `runtime/src/config.js`, `router.js`, shell/nav/theme/profile code | Codex | done | Eight verticals, three profiles, 17 routes, guards, and vertical/theme axis separation independently validated. |
| care-runtime | Care components, styles, fixtures, module, adapter, normalizer | Codex | todo | No SEO or shared-router ownership. |
| seo-public-entry | SEO components, styles, public CMS template and metadata | Codex | todo | Public/indexable surface; no authenticated-shell dependency. |
| visual-acceptance | screenshot/DOM evidence and parity fixes | Codex | todo | Compare only against executable accepted source. |
| activation | Care/SEO adapters and command handlers | Codex | todo | Open only known contracts; no mock success. |
| cms-export | block metadata, templates, export scripts, generated previews | Codex | todo | No CMS upload. |
| validation-closeout | smoke harnesses, audit, evidence, ledger | Codex | todo | Independent final review and residuals. |

Shared files that must not be edited concurrently by independent agents:

- `app-templates/customer-portal/runtime/src/app.js`
- `app-templates/customer-portal/runtime/src/config.js`
- `app-templates/customer-portal/runtime/src/router.js`
- `app-templates/customer-portal/runtime/src/state.js`
- `app-templates/customer-portal/runtime/src/actions.js`
- `app-templates/customer-portal/runtime/manifest.json`
- `app-templates/customer-portal/runtime/data/scenarios.json`
- CMS block metadata and export scripts

## Program Stages

| stage | goal | status | depends_on | primary output | done_when |
| --- | --- | --- | --- | --- | --- |
| S0 Contract And Baseline | Freeze wave-9 runtime and delivery contracts | done | none | Updated architecture and reconciled inventories | The 17-route, 8-theme, 3-profile, Care, public SEO, and Health security contracts are explicit and design/runtime gaps are machine-readable. |
| S1 Shared Config, Themes, Profiles, Router | Extend shared runtime control plane | done | S0 | Config/profile/router/theme/nav support | Health/Beauty and `appointments` are config-driven; Care is guarded by module/entitlement; public SEO route is accounted without coupling production SEO to portal auth/hash routing. |
| S2 Care Executable Transfer | Transfer and componentize accepted Care UI | todo | S1 | Care route/components/styles/fixtures/module | All eight Care hubs and required states render from normalized fixture data with accepted hooks and no visual redesign. |
| S3 Public SEO Executable Transfer | Transfer SEO sections and create public entry | todo | S2 | Shared SEO components plus public CMS page | SEO content renders without portal auth/hash boot, has CMS-authored slots and real document metadata/structured data, and remains parity-testable. |
| S4 Visual Acceptance | Close visual drift before live activation | todo | S3 | Screenshot/DOM comparison evidence | Care and SEO match executable design at required viewports, verticals, and states; unresolved drift is blocking, not waived as approximate. |
| S5 Data And Command Activation | Add truthful adapters and interactions | todo | S4 | Known live/fixture data and command paths | Local interactions work; opened mutations have pending/success/error and readback/idempotence proof; unknown or unsafe live paths are `not_opened`. |
| S6 CMS Packaging And Export | Package both delivery surfaces | todo | S5 | Portal and public SEO export artifacts | CMS enums/styles/templates/exports cover all profiles/verticals and validate locally without upload. |
| S7 Validation, Audit, Closeout | Regress, audit, and close the program | todo | S6 | `audits/A1.md`, `evidence/closeout.md` | Full DoD is proven, findings are fixed or explicit residuals, ledger is final, and no required work remains. |

## Dependency And Sequencing Rules

- Execute stages strictly in order: S0, S1, S2, S3, S4, S5, S6, S7.
- Do not open the next stage while any required slice in the current stage is
  `todo`, `in_progress`, `blocked`, or awaiting validation/remediation.
- Use only one write-capable subagent at a time. A later validator is read-only
  and starts only after the writer has stopped editing and the operator has
  inspected the worktree.
- S4 starts only after both executable transfers are complete and independently
  validated in their own stages.
- S5 starts only after visual acceptance, so business activation cannot hide or
  normalize design drift.
- S6 packages stable contracts; it must not become a second implementation
  location for route or business logic.
- S7 requires an independent audit. The reviewer must not invoke subagents and
  must review the complete customer-portal diff and executed evidence.
- Default execution is current-stage-to-done. Update this ledger immediately
  after every stage; do not mark multiple stages done retroactively at closeout.
- If a stage becomes too broad for one context window, create a child durable
  package and link it here. The parent ledger remains authoritative.

## Why The Program Is Split

The work is intentionally separated because shared routing, executable visual
transfer, visual acceptance, live activation, and CMS packaging have different
failure modes. Closing visual parity before data activation prevents business
logic from masking layout drift; closing endpoint/security contracts before CMS
packaging prevents generated artifacts from freezing speculative behavior.
Care and public SEO can share tokens and components, but they have different
delivery and authorization boundaries and therefore require independent
completion signals.

Each completed stage records a short evidence note at `evidence/S<n>.md` with
the exact commits, commands, results, and residuals for that stage. S7 adds the
program-level `evidence/closeout.md` after the independent audit.

## Mandatory Stage Execution Loop

In this package, an execution “wave” means one program stage `S0` through `S7`.
Every stage uses the same sequential loop:

1. **Dispatch writer.** Launch one bounded implementation subagent with exact
   owned paths, prohibited paths, acceptance criteria, validation commands, and
   an explicit prohibition on invoking subagents. Mark the stage/slices
   `in_progress` before dispatch.
2. **Integrate and validate locally.** After the writer returns, the Codex
   operator reads the complete diff, reconciles current user changes, and runs
   the stage's deterministic checks. A worker report is never sufficient proof.
3. **Dispatch validator.** Launch a separate read-only validation subagent after
   local checks pass. The validator receives the stage diff, package contract,
   evidence, and explicit prohibition on invoking subagents. It must return
   severity-ranked findings with file/line references and missing-test evidence.
4. **Remediate findings.** If any actionable finding remains, send the exact
   findings back to the still-live writer immediately or launch one fresh,
   narrowly scoped remediation subagent. Then repeat local validation and
   independent validation. Do not repair a delegated ownership zone silently
   unless execution-operator recovery mode is explicitly recorded.
5. **Close the stage.** Close all stage agents, write `evidence/S<n>.md`, update
   the ledger and Delivery Notes, and commit the bounded stage only after all
   required checks pass. Then and only then open `S<n+1>`.

There is no arbitrary retry limit. Continue the implement → validate → remediate
loop until the stage satisfies its `done_when`, or record a true external
blocker using the package stop conditions. `not_opened` is valid only for an
explicitly optional/unknown external integration, never as a way to skip a
required implementation or validation finding.

## Program Ledger

| slice | zone | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| S0.1-baseline-inventory | contract-baseline | Codex | done | none | manifest/scenario/config/CMS diff inventory | Every wave-9 design addition and current runtime gap is listed without mutating design source. |
| S0.2-architecture-contract | contract-baseline | Codex | done | S0.1 | doc review, `git diff --check` | Architecture freezes separate public SEO delivery, Care module shapes, profile/theme matrix, and Health security boundaries. |
| S1.1-config-profile-theme | shared-config-router | Codex | done | S0.2 | config behavior checks | Eight themes and three profiles parse from CMS/root config and do not regress user-controlled mode. |
| S1.2-route-nav-guards | shared-config-router | Codex | done | S1.1 | registry/scenario/guard smoke | All 17 design routes are accounted; Care module/entitlement guards and SEO delivery split are deterministic. |
| S2.1-care-transfer | care-runtime | Codex | todo | S1.2 | hook scan, visual source comparison | Accepted Care markup/styles/components exist in runtime without designer-source edits. |
| S2.2-care-data-states | care-runtime | Codex | todo | S2.1 | fixture/normalizer/state tests | All eight hubs render normalized `ready`, `loading`, `empty`, `error`, and `unauthorized`/entitlement treatment where applicable. |
| S2.3-care-commands-fixture | care-runtime | Codex | todo | S2.2 | command state/readback checks | Care fixture commands perform inspectable state changes or are explicitly unavailable; no toast-only success. |
| S3.1-seo-transfer | seo-public-entry | Codex | todo | S2.3 | component/hook/source comparison | Accepted SEO sections and vertical fixtures are reusable in runtime and public entry. |
| S3.2-seo-public-document | seo-public-entry | Codex | todo | S3.1 | raw HTML/DOM metadata checks | Public page works without portal auth/hash boot and emits title, description, canonical, and valid FAQ structured data from CMS-authored content. |
| S4.1-care-parity | visual-acceptance | Codex | todo | S3.2 | screenshots and DOM metrics | Eight Care hubs plus representative states match accepted source at 390, 768, 1180, and 1440 widths. |
| S4.2-seo-parity | visual-acceptance | Codex | todo | S3.2 | screenshots and DOM metrics | Public SEO page/sections match accepted source across themes and required widths. |
| S5.1-contract-inventory | activation | Codex | todo | S4.1, S4.2 | endpoint/permission matrix | Every Care/SEO action and data source is classified local, fixture, opened live, unavailable, or `not_opened`. |
| S5.2-safe-local-actions | activation | Codex | todo | S5.1 | interaction and async-state tests | Unit/specialist selection, FAQ toggle, service navigation, and other local actions update real state with scoped pending/error behavior where async. |
| S5.3-live-activation | activation | Codex | todo | S5.2 | adapter contract, mutation/readback, auth tests | Only known endpoints are connected; sensitive Health paths meet RBAC/consent/audit/secure-view requirements; remaining unknowns are `not_opened`. |
| S6.1-cms-contract | cms-export | Codex | todo | S5.3 | schema/enum/style validation | CMS metadata covers Health, Beauty, `appointments`, Care, public SEO, and required styles/slots. |
| S6.2-dual-export | cms-export | Codex | todo | S6.1 | export scripts and generated preview smoke | Authenticated portal and public SEO artifacts export independently and run locally. |
| S7.1-regression | validation-closeout | Codex | todo | S6.2 | complete validation matrix | Old and new routes/profiles/states/actions pass static and browser checks with no console errors. |
| S7.2-independent-audit | validation-closeout | independent reviewer | todo | S7.1 | `audits/A1.md` | Reviewer audits implementation without subagents; all actionable findings are fixed or accepted as explicit residuals. |
| S7.3-closeout | validation-closeout | Codex | todo | S7.2 | `evidence/closeout.md`, clean diff check | Ledger, commits, commands, visual evidence, unopened work, and residual risks are durable and accurate. |

Allowed statuses: `todo`, `in_progress`, `blocked`, `done`, `not_opened`,
`stale`.

## Definition Of Done

- `ARCHITECTURE.md` describes the wave-9 production contract and names
  `c9879ae` as the accepted design baseline.
- All 17 design routes are accounted for without treating authenticated hash
  routing as the production SEO delivery mechanism.
- Eight verticals and three profiles are selected through config rather than
  scattered vertical conditionals.
- The Care module renders all eight accepted vertical hubs from normalized data
  with entitlement-aware visual states and preserved design hooks.
- The public SEO entry renders without authentication or portal shell, exposes
  CMS-authored content slots, emits real title/description/canonical metadata,
  and includes valid FAQ structured data when FAQ content exists.
- `care.selectUnit`, `care.download`, `care.requestRetreat`,
  `care.selectSpecialist`, `care.completeTask`, `care.contactProvider`, and
  `care.openSecureDoc` have explicit truthful command dispositions.
- `seo.cta.book`, `seo.cta.quote`, `seo.cta.call`, `seo.cta.services`,
  `seo.service.select`, and `seo.faq.toggle` have explicit truthful command
  dispositions.
- Opened async mutations prevent duplicate submission, expose scoped pending
  and error states, and prove success by state/readback rather than toast alone.
- Sensitive Health data/actions are either protected by the documented
  authorization/consent/audit/secure-view contract or remain `not_opened`.
- Existing HVAC/Snow/Lawn/Pool/Roofing/Pest behavior, `onDemand`, `stormOps`,
  pricing/products PIM integration, route guards, theme mode, and CMS preview
  remain green.
- Runtime and CMS exports contain no legacy dev-only compatibility layer,
  preview toolbar dependency, secrets, speculative endpoint, or mock success.
- Care and SEO visual evidence covers widths 390, 768, 1180, and 1440 against
  executable design source, with material drift resolved.
- Static checks, export checks, route/profile/state/action browser smoke, and
  console checks pass or any unavoidable environment limitation is recorded.
- `audits/A1.md` and `evidence/closeout.md` exist, all required ledger rows are
  `done` or intentionally `not_opened`, and residual risks are explicit.

## Stop Conditions

Stop the affected slice and record `blocked` when:

- implementing accepted design requires changing designer-owned source or
  migrating stable ids without approval;
- a public SEO requirement cannot be satisfied without authenticated/hash-only
  rendering;
- a live endpoint, permission, consent, audit, secure-document, or mutation
  idempotence contract is unknown;
- a command can only appear successful through a toast, timeout, hardcoded
  response, or fixture that does not change inspectable state;
- Care/SEO parity cannot be measured against executable design source;
- shared-file churn makes sequential agent ownership ambiguous or unsafe;
- existing PIM, stormOps, CMS, or route behavior regresses.

Do not block the entire program for an unopened live integration when a truthful
fixture/local product surface can be completed independently. Mark only that
live slice `not_opened` and continue with the remaining Definition of Done.

## Known Residuals At Package Creation

- Non-PIM live endpoint contracts were not present in the closed baseline.
- There is no discovered repository-level production compile command for this
  template; current proof uses native modules, export scripts, syntax checks,
  and browser harnesses.
- CMS upload remains manual/out of scope.
- Browser automation uses bundled Playwright modules with system Chrome when
  bundled Chromium is unavailable.

## Delivery Notes

- 2026-07-10: Package created against accepted design commit `c9879ae` and the
  closed runtime baseline through `215c8b7`.
- 2026-07-10: No implementation stage is opened at package creation. S0 is the
  first executable target.
- 2026-07-10: Execution policy changed to a strict sequential stage-to-done
  loop: writer subagent, local operator validation, independent read-only
  validator, remediation, and repeated validation before the next stage opens.
- 2026-07-10: S0 closed in `6ce1980` (`docs(runtime): close customer portal
  wave 9 S0`). Independent validator cycle 2 approved the architecture and
  baseline evidence with no actionable findings. S1 opened next.
