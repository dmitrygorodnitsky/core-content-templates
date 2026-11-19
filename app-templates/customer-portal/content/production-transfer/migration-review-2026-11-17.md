# Migration review — 17 November 2026

Current review replaces the 16 November readiness conclusions. Historical files remain evidence of that earlier snapshot. Core servers were read only.

## Scope and results

Fresh prod snapshot: 2026-11-16T21:42:49.819Z. Fresh dev-1 snapshot: 2026-11-16T21:42:30.208Z.

352 review entries; 39 local Java scripts + 20 templates are selected. SERVICE_PROVIDER replaces the retired OPERATOR type. The Script category also includes one platform dependency.

| Category | Count |
|---|---|
| Type | 118 |
| Script | 60 |
| Workflow | 30 |
| Dictionary | 15 |
| Organization | 5 |
| Report | 2 |
| Role | 8 |
| Schedule | 2 |
| Product | 29 |
| Price | 83 |

| Decision | Count |
|---|---|
| create | 307 |
| reuse-system | 19 |
| relocate-update | 6 |
| update | 15 |
| reuse-existing | 5 |

## Agreed destinations

Script destinations are explicitly assigned by domain; see [shared exceptions and evidence](script-destinations-2026-11-17.md). Definitions in SYSTEM on dev-1 are not automatically assigned to SYSTEM on prod.

- Winter Services roles → WINTER_SERVICES; SW_FS_WS_CUSTOMER_PORTAL → CUSTOMER_PORTAL. SNOW_VEHICLE_DRIVER excluded. No user assignments are transferred.
- ServiceWand products and prices → SERVICEWAND. Limitless products and prices → LSRC. Other SNOWLIMITLESS-owned definitions → WINTER_SERVICES.
- Product types follow their ServiceWand/Winter Services domain; all Product Price Types → SYSTEM.
- Project Types 14/15/16 and Task Types 31/32/33 → SYSTEM. Task Types 10/29 and Appointment Types 2/3 → WINTER_SERVICES. Source IDs identify dev records only.
- LICENSE and DRIVER_LICENSE → SYSTEM. SERVICE_AGREEMENT → WINTER_SERVICES. ACCOUNT_REPRESENTATIVE is a global Contact Type.
- PLAN_ELEMENT and AI_PLAN Dictionary Types and their dictionary records → WINTER_SERVICES.
- WINTER_CONTRACT and WINTER_INVOICE already belong to WINTER_SERVICES on dev-1; preserve that owner.
- CUSTOMER inherits TYPE_AWARE; TAX_AWARE is included as requested. Do not infer a new TAX_AWARE parent relationship.
- Retain existing SYSTEM entities when matching; update differences from dev-1. Use consolidated local script definitions, not old dev versions.

## Reference decisions and remaining validation

All 15 previously unresolved references now have approved transfer rules: 12 AI_AWARE placeholders and three resource references. No unresolved type-reference decisions remain in this snapshot.

| Definition | Attributes | Replace | With |
|---|---|---|---|
| SNOW_SERVICE_VISIT | RESOURCE | SW_FS_WS_PROPERTY_SITE | SNOW_REMOVAL_PROPERTY |
| SNOW_SEASONAL_CONTRACT | SITES, PRIMARY_SITE | SW_FS_WS_PROPERTY_SITE | SNOW_REMOVAL_PROPERTY |

Apply only to the listed attributes' entityTypes restrictions. Preserve required/multiselect flags and other settings. Use the destination type code, not a fixed numeric ID. The seasonal contract remains optional; these rules apply if it is imported. Do not create SW_FS_WS_PROPERTY_SITE or rewrite existing resource data.

The [AI rules](ai-aware-reference-resolution-2026-11-17.md) preserve the existing allowed service categories. All replacements are recorded in [migration decisions](migration-decisions-2026-11-17.json), with resolved evidence in the readiness JSON.

LSRC is reused by its existing code; production URLs preserve dev-1 paths on prod.servicewand.com. No Core writes were performed. Sites is synchronized from the current local registry for this publication.

The package is not marked ready to execute: construct and validate the final import payload, then verify runtime behavior and production page availability. Replacement workflow checks for the two excluded schedules remain deferred by the user.

## Existing prod definitions requiring updates

The comparison covers selected structural fields. It ignores audit IDs and translated labels; attribute type references are resolved by code across environments. Workflow transition execution was not tested.

| Entity | Code | Differences |
|---|---|---|
| core/script | WINTER_SERVICE_QUOTATION_CREATOR | content, metadata |
| core/script | WINTER_SERVICE_QUOTATION_PROCESSING | content |
| core/script | WINTER_SERVICE_QUOTATION_REJECTED | content |
| core/script | WINTER_SERVICE_QUOTATION_REVIEW | content |
| core/script | WINTER_SERVICE_REGION_AI | content |
| core/script | WINTER_SERVICE_REGION_WORKFLOW_UTILS | content, metadata |
| core-acct/account-type | CUSTOMER | parents, attributes, workflow |
| core-acct/account-type | ORGANIZATION | workflow |
| core/dictionary-type | AI_AWARE | attributes |
| core/dictionary-type | AI_BASE | attributes |
| core/dictionary-type | AI_REALTIME_VOICE | attributes |
| core/dictionary-type | CONTRACT_AWARE | attributes |
| core/organization-type | OPERATOR | parents, attributes, workflow |
| core/script | ORGANIZATION_MEDIA_LIBRARY_MANAGEMENT_UTILS | content |
| core/workflow | CORE_PROJECT_WORKFLOW | states |
| core/workflow | ORGANIZATION_WORKFLOW | script, states |
| core-pim/product-price-type | PER_UNIT | attributes |
| core-pim/product-price-type | PER_UNIT_RECURRENT | parents |
| core-pim/product-price-type | PRICE_CURRENCY | attributes |
| core-pim/product-price-type | RECURRENT | attributes |
| core-pim/product-price-type | TIERED | attributes |

## Import order

### 1. Organizations

Reuse WINTER_SERVICES and WINTER_SERVICES_CA. Import SERVICEWAND and SERVICEWAND_SOFTWARE from dev-1. Reuse the existing LSRC by its actual code; retain its type and parent.

### 2. Types

Load base definitions and parent types first. Resolve references by entity kind and code; never copy dev IDs. Attach workflows in a second pass.

### 3. Scripts

Use the consolidated local package and remap permissions and configured organization references. Keep external dependencies available.

### 4. Workflow links

Import workflows and attach them to types; restore transitions, actions and permissions. Scheduled-task replacement verification is deferred.

### 5. Configuration and catalog

Load dictionaries, reports and products into their agreed organizations.

### 6. Prices

Load price definitions after products; ServiceWand to SERVICEWAND, Limitless to LSRC.

### 7. Roles and environment

Import selected roles into WINTER_SERVICES. Rename the portal role to CUSTOMER_PORTAL. Use dev-1 URL paths with the prod.servicewand.com host; verify the pages are deployed before launch.

### 8. Schedules

Import INVOICE_PAYMENT_REMINDERS and SNOW_VISIT_ORDERS disabled. Exclude the other two application schedules; do not enable payment.

## Deferred and boundaries

Workflow replacement checks for SNOW_PORTAL_TAG_RECONCILE and SNOW_SUPPORT_TICKET_THREADS are explicitly deferred. Neither schedule is selected for import. This does not assert that replacement workflow triggers already exist.

The two retained schedules are imported disabled. Payment remains off. No Core deployment, business data migration or live workflow test was performed.

The registry and decisions file describe import transformations. They are not raw API payloads: organization references, IDs, role codes, script method references and production settings must be resolved by the importer. Development seed scripts are not rewritten to point at prod.

## Files

- [Registry JSON](migration-registry-2026-11-17.json)
- [Registry CSV](migration-registry-2026-11-17.csv)
- [Decisions and remaps](migration-decisions-2026-11-17.json)
- [Readiness and reference gaps](migration-readiness-2026-11-17.json)

Cross-zone dependency: Core UI seed definitions and Portal subscription scripts provide unchanged source definitions; Portal product documentation owns this review; Sites publishes the sanitized register and conclusions.

## Retired order script and DELETE markers

See [the call-site and source-label audit](retired-order-transfer-audit-2026-11-17.md). WINTER_SERVICES_QUOTATION_ORDER_UTILITIES is excluded, not merged. Keep ORDER_LIFECYCLE_WORKFLOW unchanged. OPERATOR is named Service Provider (DELETE) on dev-1: its import is blocked until the team confirms the replacement and configuration mapping. The old no-blocker conclusion is superseded by this finding. Sites has not been republished in this change.

## SERVICE_PROVIDER replacement

The DELETE-marker blocker is resolved for the transfer package: OPERATOR is excluded and onboarding selects SERVICE_PROVIDER. Its 11 inherited attribute contracts, parents and workflow match. Reuse/update the existing production type; do not create a second one or copy dev dictionary IDs. See [compatibility review](service-provider-compatibility-2026-11-17.md). The earlier OPERATOR finding above is historical, not an open blocker. Final payload and runtime validation are still required.

GENERAL_COMMUNICATION is now an explicit reused dependency for SERVICE_PROVIDER.COMMUNICATION. Resolve it before importing the type default; retain production communication settings. This accounts for the extra registry entry, not another imported script.

## Final candidate audit

See [the package review](final-package-review-2026-11-17.md). Customer tenant scoping is implemented and locally tested. Native payload fields, workflows and permissions pass offline validation; import requires fresh target reads between stages. The obsolete Document bulk-send binding has been excluded. The source/permission assertion discrepancies are resolved and all three affected checks pass; see the package review. Previous configuration-only readiness conclusions do not supersede these findings.
