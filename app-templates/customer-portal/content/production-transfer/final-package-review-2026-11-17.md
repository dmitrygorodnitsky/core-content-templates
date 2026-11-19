# Production transfer candidate — 17 November 2026

**OFFLINE VALIDATED — LOAD IN STAGES WITH FRESH TARGET READS.** This bundle has no upload runner and makes no Core changes. Source evidence is not a native API payload. Numeric IDs in source evidence describe dev records only and must never be used as destination bindings.

## Contents

352 registry entries; 39 local Java scripts, 20 templates and one platform script dependency. `scripts/` contains the exact selected implementations. `source-definitions/` contains per-entry source evidence and the approved target owner/code. `rules/` contains script and method renames and all approved exclusions. `bindings/` preserves bulk actions and role definitions for comparison. `checks/` contains findings and dependencies. `proposals/schedules.json` contains disabled schedules with the consolidated script/method pairs.

No business Accounts, Users, existing purchases, grants or credential stores are included. Reused GENERAL_COMMUNICATION is a reference, not authorization to overwrite production contacts. Snapshot dates remain visible in the manifest; this is not a fresh prod read.

## Import status

Native field, workflow and permission checks pass. No remaining blocker in the main offline payload. The native templates must be resolved against fresh prod data between stages; this is not a flat batch to replay. SOURCE_ID labels are never destination IDs. Reports and AI configuration remain separately deferred.
The two regression assertion discrepancies are resolved: bulk checks inspect the isolated implementation; tagged Task events are verified against the customer support permission contract.

## PROPERTY_PLAN_ML

No current selected source or configured workflow/app/schedule/bulk action calls it. The remaining references are old SNOW_PROPERTY_PLAN_V1/V5 and SYSTEM ADMIN permissions. Current Property Plan calls backend `/api/address/plan.json`. Keep the ML script provisionally in this package: backend internals and arbitrary external API callers were not verified. It is a candidate for later exclusion, not evidence that the current backend endpoint is broken.

## Load order

1. Resolve organizations and reused dictionaries by code. Resolve required organization-type references before creating organization definitions.
2. Load type shells, then parents and typed attributes/defaults; defer workflow attachments.
3. Load canonical scripts and unchanged method contracts with execution-tenant checks and unchanged method permissions.
4. Load workflow states, then events/targets, then attach type/workflow and script links.
5. Load catalog, dictionaries, reports and configuration; load prices only after products and price types.
6. Load selected roles and bulk actions using approved script **and method** mappings. CUSTOMER_PORTAL is the renamed role; do not copy SYSTEM ADMIN or user assignments.
7. Resolve both schedule groups and the target system user; import schedules disabled with `INVOICE_LIFECYCLE_WORKFLOW.runReminders` / `runVisits`. Payment stays disabled.

There are no missing entries in the declared dependency graph. 73 type→workflow links and four organization→type links require ordering beyond the registry's coarse stage number. `checks/deferred-links.json` lists them: sorting the CSV by stage alone is not an import algorithm.

## Confirmed decisions

- Customer organization hardcodes are removed from 12 Winter Services scripts. Two onboarding scripts now use the configured CA parent. Scoped scans, locked writes, invoice settlement, attachment parent lookup and portal role resolution preserve tenant boundaries. Local two-tenant checks pass; see checks/tenant-scope-audit.json. SYSTEM service semantics and the ServiceWand seller policy are not customer authorization and are retained.

- Old Document bulk Send Quotation binding is excluded. retryOperations and current round-send action remain unchanged. The old Java method is retained; this decision removes its bulk binding only.

- ORDER_LIFECYCLE_WORKFLOW is retained; retired GENERAL_FSM_ORDER and WINTER_SERVICES_QUOTATION_ORDER_UTILITIES are excluded, not merged back.
- New onboarding uses SERVICE_PROVIDER; OPERATOR and its obsolete expiry patch are excluded.
- Reuse/update the existing prod SERVICE_PROVIDER; the saved prod snapshot lacks CUSTOMER_PORTAL_URL.
- Resolve the COMMUNICATION default as the existing GENERAL_COMMUNICATION by code, preserving production contacts.
- Replace the approved AI placeholder references and three PROPERTY_SITE type restrictions through the scoped rules only.
- Keep dev-only capture guards in PLAN_SUBSCRIPTION_WORKFLOW. A production-URL transformation must not enable test mail capture on prod.

## Validation and limits

All 352 source entries were found; all declared registry dependencies resolve. Eleven script-permission references from the eight selected roles resolve to selected script definitions. The listed focused consolidation, workflow, role, grant-contract, quotation and agreement checks pass; see `checks/final-audit.json`. The retained-body fingerprint was reconciled only after proving the sole difference was the previously approved deletion of unused private awaitAgreementLeaves.

snowBulkQuotesCheck, snowVisitCrewSnapshotCheck and snowSupportTicketCheck pass. The bulk worker/dispatcher harnesses exercise approval, scope, refusals and deadlines. Customer support retains exactly its eight permitted transitions. All 60 script entry contracts/capabilities and all eight selected role definitions match the previous candidate bundle.

Java parsing and focused Java harnesses do not replace compilation against Core services or production role/context tests. Full production execution, credentials and page availability remain launch checks. No Core writes, schedule activation, payment activation or Sites publication were performed.

## Native payload draft

Native payload — offline validated, staged import only

The selection remains 352 registry records (39 Java scripts, 20 templates and one platform script dependency). Native preparation adds one required category, 140 missing permission definitions, four bulk-action registries and eight actions. These are prerequisite definitions and bindings, not extra business scripts or additional role access.

686 save templates cover the selected changes and prerequisites. 319 reference-resolved drafts can currently be formed from the prod snapshot. 367 await staged target refresh or the three explicitly deferred entries. Counts describe preparation, not successful Core writes. No upload runner is included.

Validation covers 29 written workflows: 190 states, 242 events, initial states, targets, state/event attributes and hook bodies. Workflow IDs are resolved by workflow/state/event codes; target-only states/events or ambiguous identities block instead of being removed. State creation and event attachment use independent requests. The five reused script/template definitions are not rewritten; contracts and contents of the 55 written definitions match the selected package.

Eight role permission sets are frozen from the dev-1 permission catalog and selected seeds, with approved renames and exclusions. The importer must not expand patterns against unrelated new prod permissions. Missing selected permission definitions are loaded before roles/actions; a missing or ambiguous reference still blocks its request. Workflow grant declarations were checked against these role sets. The eight bulk actions retain their selected functions and permissions.

83 prices use owner/product/price type and all pricing dimensions except UNIT_PRICE for identity. Duplicate matches block. Changes to price amount update the same identified price. Codes and semantic dimensions are permanent references; observed target IDs are not configuration.

Load with fresh reads between dependent stages: organizations/categories; type shells; scripts; workflow states; type attributes/defaults; workflow events; workflow attachments; dictionaries/catalog; prices; permission definitions; roles and bulk-action registries/actions; disabled schedules. Dependencies take priority over numeric stage order. Do not replay all resolved drafts sequentially without refreshing target identity and optimistic versions. A phase that needs its own newly-created shell waits for that shell to be read back.

request-templates.json contains symbolic references. resolved-requests.json contains reference-resolved drafts requiring fresh preflight. pending.json records expected waits. role-contracts.json and field-coverage.json expose the audit. validation.json records checks and artifact hashes. The bundled Python tools are offline-only. Synthetic state IDs used in tests are never exported into upload requests.

No remaining offline main-payload blocker was found. Separate user-approved follow-ups:
- Backend configures the OpenAI secret; SNOW_REMOVAL_AI_PLAN waits for it. Secret values are never exported.
- Locate original WINTER_CONTRACT and WINTER_INVOICE files on dev-1 and load reports later using multipart upload. Metadata alone is not the report.

Launch checks remain: actual Core acceptance/execution and organization isolation, page availability, production credentials, mail capture and recipient controls. Only the agreed URL-origin transformation is applied; existing mail controls are not relaxed. Payment and schedules remain disabled. No Core server writes or Sites publication were performed.


## Approved separate follow-ups (not main transfer blockers)

- core/dictionary|SNOW_REMOVAL_AI_PLAN: Backend configures the production OpenAI secret. Defer the dependent AI configuration until it resolves; not a blocker for the main transfer.
- core-rpt/report|WINTER_CONTRACT: Find the original report file on dev-1 and load separately. User approved later loading; not a blocker for the main transfer.
- core-rpt/report|WINTER_INVOICE: Find the original report file on dev-1 and load separately. User approved later loading; not a blocker for the main transfer.

These entries remain deferred; unresolved references are not bypassed. AI generation and report rendering are not declared ready.
