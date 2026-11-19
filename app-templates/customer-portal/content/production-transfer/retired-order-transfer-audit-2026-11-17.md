# Retired quotation-order script — transfer decision

## Decision

Exclude `WINTER_SERVICES_QUOTATION_ORDER_UTILITIES` and its old `SNOW_QUOTATION_ORDER_UTILITIES_V*` source family from the production transfer. Do not merge its retired behavior into `ORDER_LIFECYCLE_WORKFLOW`. Keep historical source files and rollback tests locally. `GENERAL_FSM_ORDER` was already absent from the transfer registry and is now explicitly excluded in the transfer rules.

The package now selects **39 Java scripts, 20 templates and one platform script dependency**: 60 Script entries. The review contains 351 entries, including one blocked type. Source manifests still contain historical definitions; importers must apply `transferExclusions` from `migration-decisions-2026-11-17.json` rather than import every source manifest indiscriminately.

## Remaining references

Read-only dev-1 snapshot: **2026-11-16 22:49:57 UTC** (17 November in Moscow). All requested reads completed without reduced mappings or warnings.

| Location | Finding | Treatment |
|---|---|---|
| Order types | FIELD_SERVICE_ORDER, WINTER_SERVICES_ORDER, SERVICEWAND_SUBSCRIPTION and SNOW_VISIT_ORDER all use ORDER_LIFECYCLE. None of the seven dev-1 order types uses GENERAL_FSM_ORDER. | Keep the current workflow and script. |
| GENERAL_FSM_ORDER | References SNOW_QUOTATION_ORDER_UTILITIES_V33; its description explicitly says retired on 9 November, retained for history/rollback. | Do not transfer. |
| Historical scripts | SNOW_BULK_QUOTES_V4/V5/V6/V7/V8/V9/V15 contain calls to old utility versions. | Historical definitions, outside the consolidated transfer package. |
| SYSTEM ADMIN | Retains permissions for historical utility versions. A permission is not evidence of an active call. | Do not copy or remap these permissions; SYSTEM ADMIN is not a transferred role. |
| Selected local implementation | No references to the old or normalized utility family in the remaining 59 Java/template source files. | No runtime edits required. |
| Schedules, bulk-action registry and app configurations | No references to the utility family in the fresh dev-1 configuration. | No changes required. |
| Local tests and historical seed | Still inspect the retired workflow/source. | Retain for historical regression coverage; not a reason to import the script. |

This is a source/configuration audit, not a claim that nobody can manually execute an old script on dev-1. No server definitions, roles, grants or data were changed.

## DELETE marker audit

Checked names and descriptions, including all returned localized NAME/DESCRIPTION fields, for **118 selected types and 30 workflows** against the fresh dev-1 snapshot. Every selected definition was found.

One match: `core/organization-type` **OPERATOR**, English name **Service Provider (DELETE)**. Its registry action is now `blocked-delete-marker`. Do not import it, strip the marker, or silently map it to another type.

`SERVICE_PROVIDER` exists on dev-1, but replacement requires comparing parents, attributes and workflow and updating onboarding references. OPERATOR is still assigned to organizations on dev-1, so the label alone is not permission to delete it. This is an explicit blocker for completing the transfer package.

The other 147 selected definitions contain no DELETE marker in the checked fields. Full code-based coverage and findings are in [audit evidence](retired-order-transfer-audit-2026-11-17.json).

## Validation

- Passed registry JSON/CSV count parity, unique keys, explicit exclusions and absence of dependencies on the excluded script.
- Passed source-reference checks for all 59 remaining local Java/template sources and checks of current order-type workflow assignments.
- Passed `quotationPackageOrderFlowCheck`, `workflowSeedCheck`, `snowStaffRolesCheck` and `workflowGrantContractCheck` in core-ui.
- Runtime source, workflow hooks and role permissions were not edited. No Core writes or Sites publication were performed.

The earlier static audit counted preserved legacy manifests as active candidates. This decision supersedes that classification for this script; historical audit files remain unchanged evidence.
