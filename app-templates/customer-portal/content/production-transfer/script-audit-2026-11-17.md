# Audit of the 40 scripts and 20 templates — 17 November 2026

## Outcome

The consolidated package still contains substantial duplicated implementation and some legacy paths. No code, configuration, permissions, transfer rules or Core entities were modified by this audit. New files are audit evidence only; Sites was not published.

Scope: the current 60 definitions referenced by manifests in core-ui/scripts/dev/seeds and customer-portal/scripts/plan-subscription: 40 Java files (46,955 lines) and 20 Velocity files (425 lines). Historical unreferenced *_V source files are excluded from the 40-script count.

Findings:

- 138 groups of token-normalized identical method bodies of at least 12 physical lines. This is candidate duplication, not 138 independently removable functions.
- 66 of those groups are shared by ORDER_LIFECYCLE_WORKFLOW and WINTER_SERVICES_QUOTATION_ORDER_UTILITIES.
- 27 groups repeat within WINTER_SERVICE_QUOTATION_CREATOR itself.
- Six private methods have no ordinary reference beyond their declaration inside their file.
- All 18 email templates have a literal reference in an active Java definition. Two remaining templates are platform mappings, not emails.
- 147 declared FUNCTIONS were checked. Nineteen have no method-name match outside their source and declaring manifest in the searched local corpus; many have internal callers or are operator/dynamic entry points. This is not an unused-method count.

## Prioritized findings

### A1 — Hardcoded development organizations remain executable (before migration)

Sources include [WINTER_SERVICES_PORTAL_PROPERTY_TAG_SYNC](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_PROPERTY_TAG_SYNC.java:27), [WINTER_SERVICES_PORTAL_TAG_SYNC](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_TAG_SYNC.java:57), [WINTER_SERVICES_PORTAL_USER_PROVISION](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_USER_PROVISION.java:59), [WINTER_SERVICES_INVOICE_CARD_PAYMENT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_INVOICE_CARD_PAYMENT.java:54), [PLAN_SUBSCRIPTION_DRAFT](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_DRAFT.java:2123) and [PLAN_SUBSCRIPTION_ONBOARDING_MODEL](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_ONBOARDING_MODEL.java:149).

SNOWLIMITLESS and SERVICE_WAND_WINTER_SERVICES_CANADA still appear in executable guards/selectors. Approved migration mappings exist, but changing script ownership alone does not rewrite these checks. Apply and validate the approved transformation on the final import payload. Do not delete the organization guard; replace its configured source. Some appearances are comments only, e.g. RESOURCE_MEDIA_LIBRARY:38. Confidence: high; migration issue, not proof that dev behavior is wrong.

### A2 — Two large order implementations duplicate the same decisions (consolidation priority)

[ORDER_LIFECYCLE_WORKFLOW](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/ORDER_LIFECYCLE_WORKFLOW.java:2981) and [WINTER_SERVICES_QUOTATION_ORDER_UTILITIES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_QUOTATION_ORDER_UTILITIES.java:1827) contain the same 73-line concludeDecision body. There are 66 shared duplicate-body groups overall, including decision, recovery and batching helpers.

Both are active: orderLifecycleWorkflow.json:9 binds the first; quotationPackageOrderWorkflow.json:9 binds the second. Do not delete either file as unused. Extract/reconcile shared logic while preserving their distinct workflow entry points, order-type checks, transactions and permissions. The first also handles subscriptions and visit orders; wholesale replacement with the second would lose behavior. Confidence: high for duplication; equivalence of complete handlers is not established.

### A3 — Quote creator contains copies left by file-level merging

[WINTER_SERVICE_QUOTATION_CREATOR](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_CREATOR.java:4181) repeats issuePropertyGrant at lines 5399 and 9582 (56-line body). syncPortalTags repeats at 4931, 6796 and 9197 and also exists in [WINTER_SERVICES_PORTAL_USER_PROVISION](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_USER_PROVISION.java:464). Postal parsing, account names, LEGAL-contact email lookup, script submission/result polling and email signatures also repeat.

There are 27 internal duplicate groups. Consolidate helpers inside the script first; preserve public wrappers and the separate delivery/round/agreement branches. Identical bodies in different nested classes can depend on different outer state, so relocation still requires tests. Confidence: high for duplicate bodies, not a safe automatic deletion.

### A4 — Address parsing has multiple owners

[WINTER_SERVICE_QUOTATION_CREATOR](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_CREATOR.java:947) and [WINTER_SERVICES_PORTAL_QUOTE_ACCOUNT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_QUOTE_ACCOUNT.java:283) share an 83-line parseAddress body. findPostalPart is identical at creator:1038, portal-account:374 and [PLAN_SUBSCRIPTION_WORKFLOW](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_WORKFLOW.java:1221). Country lookup is another shared body.

Risk: a fix in one flow can leave signup or quote entry behaving differently. A common parser is a candidate, but its destination must remain reachable from SERVICEWAND and WINTER_SERVICES. Do not solve this by introducing unreviewed cross-organization dependencies. Confidence: high.

### A5 — Reference conversion, invoice fingerprints and media-library helpers repeat

referenceId repeats across six scripts (24 lines), invoiceFingerprint across invoice/item/order sections (28 lines), and organizationLibrary across resource/account/project helpers. See the duplicate CSV for exact sites. These are good focused extraction candidates; preserve numeric parsing behavior and snapshot hashing exactly. A changed fingerprint can invalidate purchases or recovery checks. Confidence: high for duplication.

### A6 — Six private methods are removal candidates

No normal in-file reference and no string-based reference in the checked local config corpus was found. These are the smallest cleanup candidates. Reflection/backend behavior is outside this static proof; compile and run focused checks after any future deletion.

| Script | Method | Line | Body lines |
|---|---|---|---|
| [WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES.java:1886) | `awaitAgreementLeaves` | 1886 | 20 |
| [WINTER_SERVICE_REGION_WORKFLOW_UTILS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_REGION_WORKFLOW_UTILS.java:665) | `buildQuotationNotificationBody` | 665 | 21 |
| [WINTER_SERVICE_REGION_WORKFLOW_UTILS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_REGION_WORKFLOW_UTILS.java:1670) | `toPositiveInteger` | 1670 | 20 |
| [WINTER_SERVICE_REGION_WORKFLOW_UTILS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_REGION_WORKFLOW_UTILS.java:1937) | `formatAddress` | 1937 | 18 |
| [ORDER_LIFECYCLE_WORKFLOW](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/ORDER_LIFECYCLE_WORKFLOW.java:4184) | `sameOrganization` | 4184 | 5 |
| [WINTER_SERVICES_QUOTATION_ORDER_UTILITIES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_QUOTATION_ORDER_UTILITIES.java:2881) | `sameOrganization` | 2881 | 5 |

buildQuotationNotificationBody constructs a plain-text notification body while active notification code uses templates. Deleting a root helper may leave its helpers unused; a subsequent pass should inspect those chains. Confidence: high for absence of ordinary calls, medium for safe removal.

### A7 — Legacy agreement sending is still wired, not dead

[WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES.java:2561) exports sendLegacyQuotations and retains LegacyBulkAgreement. It sends the old QUOTATION-QUOTATION_SENT event on SERVICE_AGREEMENT. snowBulkActions.json:13 still binds this function, and :27 binds retryOperations to the same legacy helper.

The round-based sending path also exists. Before retiring legacy sending, decide whether Document bulk actions remain supported and whether existing agreements still need retries. Remove/rebind the action and permission only together with the branch. Confidence: high; do not delete now.

### A8 — PROPERTY_PLAN_ML is a whole-script legacy candidate, not confirmed dead

[WINTER_SERVICES_PROPERTY_PLAN_ML](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_PLAN_ML.java:1) exposes generateJson / generateImage. No local active caller for either method was found. [WINTER_SERVICES_PROPERTY_PLAN](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_PLAN.java:337) now delegates to the embedded backend worker; the worker makes an HTTP request to Core instead of calling those two ML methods.

Its old adapter-specific GPT Image rejection at ML:295 is also a likely historical assumption. Before excluding this script, check the backend endpoint implementation, external invocations and operator usage. Their absence cannot be proven from this repo. Keep it in the package until that evidence is available. Confidence: medium.

### A9 — Exported methods without outside matches need classification, not deletion

Examples: planAll is a diagnostic/dry-run entry; ensureChat and deleteChat have internal callers; route scheduleAppointments / validateAppointmentsCompleted / archiveChat may be workflow hooks whose source configuration is not local. Public API exposure alone is not usage, but missing text matches do not prove disuse. The complete 147-function result is in script-audit-exports-2026-11-17.csv.

Prioritize checks for PROPERTY_PLAN_ML.generateJson/generateImage, SUPPORT_TICKET_THREAD.createTicket and route archiveChat/scheduleAppointments/validateAppointmentsCompleted. These have no outside method-name evidence in the inspected local corpus. Do not remove workflow or external API methods based on this result. Confidence: medium/low depending on entry.

### A10 — Email templates repeat presentation, but all are referenced

18 email templates have active Java references. For example AGREEMENT_READY and QUOTATION_READY share about 86% of lines; portal QUOTATION_READY and QUOTATION_UPDATED about 86%; PROCESSING and REJECTED about 84%. This mostly reflects shared HTML layout, not interchangeable messages.

Share a layout only if the template runtime supports it; preserve subjects, links, required variables and permissions. Public-link and portal messages are distinct delivery contracts. Do not delete a template just because it resembles another. MAPPINGS_ORDER and MAPPINGS_DOCUMENT contain mapping JSON; no explicit caller was found locally, but platform convention-based loading must be checked before retirement. Confidence: high for similarities and email references, unresolved for platform mapping usage.

### A11 — Safety/compatibility code that should not be labelled dead

- PLAN_SUBSCRIPTION_DRAFT:947/990 LEGACY_SELECTION_REVIEW_REQUIRED intentionally blocks processing of old/incomplete purchase snapshots; this is a fail-closed compatibility guard.
- PLAN_SUBSCRIPTION_WORKFLOW:549/967 dev-1 host checks bound test token capture to example.invalid recipients and a development host. They are not production redirect URLs.
- primaryEmail in quotation code actually selects LEGAL contacts (e.g. creator:9908); the name is stale, the selected type is not. Rename for clarity only; do not switch it back to PRIMARY.
- Quote expiry implementation fingerprints match the current creator source after the exact normalization used by describeOnboardingReference (CRLF conversion + stripTrailing). A raw file hash appeared different only because of the final newline. No stale-fingerprint defect was confirmed.

## Suggested order of future work

1. Final import organization/config transformations: retain guards and prove the rewritten payload.
2. Delete the six private candidates only after focused compile/tests.
3. Consolidate duplicated helpers inside the quote creator and shared address parsing.
4. Reconcile the two order handlers with workflow-specific tests.
5. Decide whether legacy Document bulk sending and PROPERTY_PLAN_ML are still required.
6. Reduce template layout duplication only if worthwhile; it does not currently justify removing messages.

No further reduction from 40 scripts is promised: function-level duplication and platform boundaries must be resolved first.

## Method and limits

This is a static audit of every manifest-selected source, not an end-to-end test. The structural scanner detected 2,561 public/private/protected method declarations (including nested classes) and compared bodies of at least 12 physical lines. It ignores comments and whitespace while preserving string literal contents. Same body does not imply same state, transaction or permission context. It is a lightweight parser, not Java compiler call-graph analysis.

Reference search covers active Java files, manifest/config JSON, Core UI TS/TSX and portal runtime sources. Historical Java versions, generated API clients and test-only references are not treated as proof of runtime usage. Declared exported functions were compared by method-name mentions; this can overcount unrelated same-name methods. Backend reflective calls, deployed workflow action bodies not represented locally, operator execution and external clients remain outside the proof. No production invocation logs were queried and no server scripts were executed.

## Evidence files

- [Coverage of all 60 definitions](script-audit-coverage-2026-11-17.csv)
- [Duplicate body groups with line numbers](script-audit-duplicates-2026-11-17.csv)
- [Detected method declarations](script-audit-methods-2026-11-17.csv)
- [Declared API functions and local reference evidence](script-audit-exports-2026-11-17.csv)

## Per-definition coverage

| Definition | Kind | Lines | Duplicate groups | Private candidates |
|---|---|---|---|---|
| [ACCOUNT_MEDIA_LIBRARY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/ACCOUNT_MEDIA_LIBRARY.java:1) | Java | 138 | 2 | - |
| [APPOINTMENT_MEDIA_LIBRARY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/APPOINTMENT_MEDIA_LIBRARY.java:1) | Java | 688 | 3 | - |
| [INVOICE_LIFECYCLE_WORKFLOW](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/INVOICE_LIFECYCLE_WORKFLOW.java:1) | Java | 1992 | 3 | - |
| [MAPPINGS_DOCUMENT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/MAPPINGS_DOCUMENT.vm:1) | Velocity | 1 | 0 | - |
| [MAPPINGS_ORDER](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/MAPPINGS_ORDER.vm:1) | Velocity | 1 | 0 | - |
| [ORDER_LIFECYCLE_WORKFLOW](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/ORDER_LIFECYCLE_WORKFLOW.java:1) | Java | 4448 | 68 | sameOrganization |
| [PLAN_SUBSCRIPTION_DRAFT](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_DRAFT.java:1) | Java | 3073 | 6 | - |
| [PLAN_SUBSCRIPTION_ONBOARDING_MODEL](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_ONBOARDING_MODEL.java:1) | Java | 197 | 2 | - |
| [PLAN_SUBSCRIPTION_PAYMENT](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_PAYMENT.java:1) | Java | 106 | 0 | - |
| [PLAN_SUBSCRIPTION_WORKFLOW](/Users/imighty/Code/core-content-templates/app-templates/customer-portal/scripts/plan-subscription/PLAN_SUBSCRIPTION_WORKFLOW.java:1) | Java | 1711 | 8 | - |
| [PROJECT_MEDIA_LIBRARY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/PROJECT_MEDIA_LIBRARY.java:1) | Java | 138 | 2 | - |
| [RESOURCE_MEDIA_LIBRARY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/RESOURCE_MEDIA_LIBRARY.java:1) | Java | 451 | 5 | - |
| [TASK_MEDIA_LIBRARY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/TASK_MEDIA_LIBRARY.java:1) | Java | 157 | 2 | - |
| [WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES.java:1) | Java | 2954 | 6 | awaitAgreementLeaves |
| [WINTER_SERVICES_BULK_APPROVE_QUOTES_DISPATCH](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_BULK_APPROVE_QUOTES_DISPATCH.java:1) | Java | 143 | 1 | - |
| [WINTER_SERVICES_BULK_REQUESTS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_BULK_REQUESTS.java:1) | Java | 417 | 0 | - |
| [WINTER_SERVICES_BULK_VISIT_ORDERS_DISPATCH](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_BULK_VISIT_ORDERS_DISPATCH.java:1) | Java | 143 | 1 | - |
| [WINTER_SERVICES_CONTRACT_SOURCES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_CONTRACT_SOURCES.java:1) | Java | 207 | 0 | - |
| [WINTER_SERVICES_CUSTOMER_INVOICE_PAYMENT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_CUSTOMER_INVOICE_PAYMENT.java:1) | Java | 517 | 1 | - |
| [WINTER_SERVICES_CUSTOMER_LOGIN_CHANGED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_CUSTOMER_LOGIN_CHANGED.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICES_CUSTOMER_PROFILE_APPLY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_CUSTOMER_PROFILE_APPLY.java:1) | Java | 625 | 1 | - |
| [WINTER_SERVICES_CUSTOMER_PROFILE_UPDATE](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_CUSTOMER_PROFILE_UPDATE.java:1) | Java | 1007 | 3 | - |
| [WINTER_SERVICES_CUSTOMER_SUPPORT_TICKET](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_CUSTOMER_SUPPORT_TICKET.java:1) | Java | 1010 | 1 | - |
| [WINTER_SERVICES_INVOICE_CARD_PAYMENT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_INVOICE_CARD_PAYMENT.java:1) | Java | 616 | 0 | - |
| [WINTER_SERVICES_INVOICE_PAYMENT_REMINDER](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_INVOICE_PAYMENT_REMINDER.vm:1) | Velocity | 23 | 0 | - |
| [WINTER_SERVICES_PORTAL_ACCESS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_ACCESS.vm:1) | Velocity | 25 | 0 | - |
| [WINTER_SERVICES_PORTAL_AGREEMENT_READY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_AGREEMENT_READY.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICES_PORTAL_PROPERTY_TAG_SYNC](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_PROPERTY_TAG_SYNC.java:1) | Java | 170 | 1 | - |
| [WINTER_SERVICES_PORTAL_QUOTATION_DECISIONS_CONFIRMED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_QUOTATION_DECISIONS_CONFIRMED.vm:1) | Velocity | 28 | 0 | - |
| [WINTER_SERVICES_PORTAL_QUOTATION_READY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_QUOTATION_READY.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICES_PORTAL_QUOTATION_UPDATED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_QUOTATION_UPDATED.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICES_PORTAL_QUOTE_ACCOUNT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_QUOTE_ACCOUNT.java:1) | Java | 566 | 6 | - |
| [WINTER_SERVICES_PORTAL_QUOTE_REQUEST](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_QUOTE_REQUEST.java:1) | Java | 1254 | 13 | - |
| [WINTER_SERVICES_PORTAL_SERVICE_TAG_SYNC](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_SERVICE_TAG_SYNC.java:1) | Java | 189 | 1 | - |
| [WINTER_SERVICES_PORTAL_TAG_SYNC](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_TAG_SYNC.java:1) | Java | 728 | 1 | - |
| [WINTER_SERVICES_PORTAL_USER_PROVISION](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PORTAL_USER_PROVISION.java:1) | Java | 616 | 2 | - |
| [WINTER_SERVICES_PROPERTY_LINK_GRANT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_LINK_GRANT.java:1) | Java | 488 | 1 | - |
| [WINTER_SERVICES_PROPERTY_OPERATIONS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_OPERATIONS.java:1) | Java | 1265 | 2 | - |
| [WINTER_SERVICES_PROPERTY_PLAN](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_PLAN.java:1) | Java | 1536 | 0 | - |
| [WINTER_SERVICES_PROPERTY_PLAN_ML](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_PLAN_ML.java:1) | Java | 404 | 0 | - |
| [WINTER_SERVICES_PROPERTY_WORKFLOW_UTILS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_PROPERTY_WORKFLOW_UTILS.java:1) | Java | 581 | 5 | - |
| [WINTER_SERVICES_QUOTATION_ORDER_UTILITIES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_QUOTATION_ORDER_UTILITIES.java:1) | Java | 3149 | 66 | sameOrganization |
| [WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE.java:1) | Java | 306 | 0 | - |
| [WINTER_SERVICES_SUPPORT_TICKET_THREAD](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_SUPPORT_TICKET_THREAD.java:1) | Java | 1035 | 3 | - |
| [WINTER_SERVICES_VISIT_CREW_NAMES](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_VISIT_CREW_NAMES.java:1) | Java | 203 | 0 | - |
| [WINTER_SERVICES_VISIT_CREW_SNAPSHOT](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICES_VISIT_CREW_SNAPSHOT.java:1) | Java | 469 | 1 | - |
| [WINTER_SERVICE_AGREEMENT_CHANGES_REQUESTED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_AGREEMENT_CHANGES_REQUESTED.vm:1) | Velocity | 24 | 0 | - |
| [WINTER_SERVICE_AGREEMENT_READY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_AGREEMENT_READY.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICE_CONTRACT_DETAILS_RECEIVED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_CONTRACT_DETAILS_RECEIVED.vm:1) | Velocity | 23 | 0 | - |
| [WINTER_SERVICE_QUOTATION_CHANGES_REQUESTED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_CHANGES_REQUESTED.vm:1) | Velocity | 23 | 0 | - |
| [WINTER_SERVICE_QUOTATION_CREATOR](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_CREATOR.java:1) | Java | 10927 | 37 | - |
| [WINTER_SERVICE_QUOTATION_DECISIONS_CONFIRMED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_DECISIONS_CONFIRMED.vm:1) | Velocity | 29 | 0 | - |
| [WINTER_SERVICE_QUOTATION_PROCESSING](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_PROCESSING.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICE_QUOTATION_READY](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_READY.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICE_QUOTATION_REJECTED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_REJECTED.vm:1) | Velocity | 23 | 0 | - |
| [WINTER_SERVICE_QUOTATION_REVIEW](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_REVIEW.vm:1) | Velocity | 27 | 0 | - |
| [WINTER_SERVICE_QUOTATION_UPDATED](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_UPDATED.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICE_QUOTATION_VERIFY_EMAIL](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_QUOTATION_VERIFY_EMAIL.vm:1) | Velocity | 22 | 0 | - |
| [WINTER_SERVICE_REGION_AI](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_REGION_AI.java:1) | Java | 52 | 0 | - |
| [WINTER_SERVICE_REGION_WORKFLOW_UTILS](/Users/imighty/Code/core-ui/scripts/dev/seeds/scripts/WINTER_SERVICE_REGION_WORKFLOW_UTILS.java:1) | Java | 2279 | 14 | buildQuotationNotificationBody; toPositiveInteger; formatAddress |
