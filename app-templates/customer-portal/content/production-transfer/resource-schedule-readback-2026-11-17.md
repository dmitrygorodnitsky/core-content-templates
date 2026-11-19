> Current migration decisions and fresh prod comparison: [17 November review](migration-review-2026-11-17.md). This file retains its original inspection scope.

# Resource types and schedules: dev-1 readback

Read at: 2026-11-16T21:25:01.744Z

Read-only inspection. No Core configuration changed and no job was executed. This is source evidence, not a directly importable production payload.

## Coverage

Read all 47 resource types and all 9 schedules. Resource definitions include attributes, options, entity-type constraints, parent types, workflow references, attribute order, processing configuration and sensor references. Schedule definitions include actual execution parameters, cron, enabled state, group and run-as reference.

37 resource types belong to SERVICE_WAND_WINTER_SERVICES. The remaining 10 belong to SYSTEM (2), IT_OPERATIONS (6) and CALM_HARBOR_SPA_STAGING (2); they are not automatically added to the Winter Services transfer.

## Schedules selected for transfer

Only INVOICE_PAYMENT_REMINDERS and SNOW_VISIT_ORDERS are selected for schedule transfer. Both are currently enabled on dev-1, owned by SYSTEM and run as system. Import them disabled. Preserve their schedule codes; update execution targets using the consolidated local definitions.

| Schedule | Cron | Actual dev-1 target | Consolidated target |
|---|---|---|---|
| INVOICE_PAYMENT_REMINDERS | `0 15 * * *` | INVOICE_PAYMENT_REMINDERS.run | INVOICE_LIFECYCLE_WORKFLOW.runReminders |
| SNOW_VISIT_ORDERS | `0 9 * * *` | SNOW_VISIT_ORDERS.run | INVOICE_LIFECYCLE_WORKFLOW.runVisits |

Excluded by team decision: SNOW_PORTAL_TAG_RECONCILE and SNOW_SUPPORT_TICKET_THREADS must run through workflows, not imported schedules. Keep their supporting scripts as workflow dependencies. Verify workflow coverage of the former scheduled tasks before release; this decision does not establish that the replacement triggers are already configured. Existing dev-1 schedules remain unchanged.

Other schedules: PROPERTY_WEATHER_UPDATER (disabled), PG_DATABASE_MAINTENANCE, SENSOR_DATA_RETENTION, PASSWORD_EXPIRATION_NOTIFIER, SYNC_SCHEDULES (disabled). These are outside the two schedules selected for transfer above.

## Winter Services resource types

All listed types currently belong to SERVICE_WAND_WINTER_SERVICES; the agreed production destination is Winter Services. Attribute counts below exclude inherited attributes.

| Type | Parents | Workflow | Own attributes |
|---|---|---|---|
| REAL_ESTATE_PROPERTY | - | - | 3 |
| CREW | - | RESOURCE | 4 |
| VEHICLE | EQUIPMENT | RESOURCE | 6 |
| PUBLIC_ROAD_VEHICLE | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| OFF_ROAD_VEHICLE | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| EQUIPMENT | - | EQUIPMENT_LIFECYCLE | 4 |
| VEHICLE_ATTACHMENT | EQUIPMENT | - | 4 |
| PLOW | VEHICLE_ATTACHMENT | EQUIPMENT_LIFECYCLE | 2 |
| SPREADER | VEHICLE_ATTACHMENT | EQUIPMENT_LIFECYCLE | 1 |
| BRINE_TANK | VEHICLE_ATTACHMENT | EQUIPMENT_LIFECYCLE | 1 |
| PROPERTY | - | PROPERTY_LIFECYCLE | 3 |
| SNOW_REMOVAL_PROPERTY | PROPERTY | PROPERTY_LIFECYCLE | 9 |
| WORKFORCE | - | WORKFORCE_LIFECYCLE | 1 |
| DRIVER | WORKFORCE | WORKFORCE_LIFECYCLE | 1 |
| GENERAL_WORKER | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |
| DISPATCHER | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |
| FOREMAN | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |
| SNOW_REMOVAL_VEHICLE | EQUIPMENT | EQUIPMENT_LIFECYCLE | 7 |
| CONTRACTOR | - | - | 3 |
| PICKUP_TRUCK | VEHICLE, SNOW_REMOVAL_VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| DUMP_TRUCK | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| ATV | VEHICLE, SNOW_REMOVAL_VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| UTV | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| TRACTOR | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| SIDEWALK_TRACTOR | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| SKID_STEER | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| COMPACT_TRACK_LOADER | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| WHEEL_LOADER | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| BACKHOE_LOADER | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| EXCAVATOR | VEHICLE | EQUIPMENT_LIFECYCLE | 0 |
| SNOW_BLOWER | VEHICLE_ATTACHMENT | EQUIPMENT_LIFECYCLE | 1 |
| SNOW_BUCKET | VEHICLE_ATTACHMENT | EQUIPMENT_LIFECYCLE | 2 |
| POWER_BROOM | VEHICLE_ATTACHMENT | EQUIPMENT_LIFECYCLE | 1 |
| COMPANY_ADMIN | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |
| CUSTOMER_SUPPORT | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |
| SALES | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |
| BILLING | WORKFORCE | WORKFORCE_LIFECYCLE | 0 |

## Dependencies and import handling

All parent resource types of these 37 definitions are present in the same Winter Services selection. No missing parent was found.

| Workflow | Current dev-1 script |
|---|---|
| RESOURCE | No script assigned |
| WORKFORCE_LIFECYCLE | RESOURCE_MEDIA_LIBRARY |
| PROPERTY_LIFECYCLE | SNOW_PROPERTY_WORKFLOW_UTILS_V1 |
| EQUIPMENT_LIFECYCLE | No script assigned |

Resolve PROPERTY.ACCOUNT AccountType ID 2 and DRIVER.DRIVER_LICENSE DocumentType ID 13 by source entity kind and code before import. VEHICLE_ATTACHMENT.VEHICLE restricts selection to 13 resource types, all present in this selection. SNOW_REMOVAL_PROPERTY.PROPERTY_PLAN uses the mediaAsset discriminator; it is not a numeric resource-type ID.

Do not replace the consolidated property workflow handler with the old SNOW_PROPERTY_WORKFLOW_UTILS_V1 just because it is still deployed on dev-1. Use the existing consolidation mapping.

Readback of workflow references is not an executable workflow export: transition actions and permissions still come from the migration package and require their existing validation. No fresh production conflict check was performed in this readback.

Raw source snapshot (local scratch, not the migration source of truth): `tmp/prod-transfer-2026-11-17/full-definitions.json`.
