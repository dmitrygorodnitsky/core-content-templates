# Snow Removal Operations — local release package

Target: `SNOW-REMOVAL-OPERATIONS/DEFAULT`, under `WINTER_SERVICES`, at `snow-removal-operations/index.html`. This package is local only. It creates a separate app; the existing `SNOW-CRM` stays in place.

| Area | Change |
| --- | --- |
| Invoices and Paid Invoices | Pick Billing Orders of type `SNOW_VISIT_ORDER`. Keep the `FIXED_RATE` list filter and the `PAID` editor lock. |
| Route Planning | Filter `INITIAL`, the stored initial state for `SNOW_ROUTE`. Routing Runs and Templates still use `isTemplate`. |
| Appointment timeline and editor | Keep `SNOW_SERVICE_VISIT` and `SNOW_INSPECTION_VISIT` in both the list and the type picker. The separate Service Visits list already uses those types. |
| Configuration defaults | Resolve the 40 numeric references from the export using production codes, including each type's actual production workflow. Use the old ID only to look up a source code if the export has no code. The create payload has no source application ID. |
| Access | Preserve the exported menu roles and action permissions. The access plan adds only the new app's config-read permission(s), to the six existing web staff roles by code. No business permission changes. |

The package includes a configuration file, the Core create payload (the multipart `app` field), the frontend archive (the `file` field), an access plan, validation results and SHA-256 checksums. The build uses the current Core UI sources, configured app owner `WINTER_SERVICES`, and derives the API origin from the browser URL for runtime requests.

The validator resolves all configured screen links and checks explicit permission codes, role/permission pairs in the menu, and eight registered business bulk actions against saved production definitions. Twenty absent type codes remain in older grid filters outside the three changes above and are listed in `validation.json`. They were kept for review; this package neither enables those older screens in the main menu nor creates obsolete types.

Before upload, refresh the production catalog to confirm the target code and context are still free and that the resolved references still match production. After the initial save, read back app ownership and `DEFAULT` and verify which config-read permission Core generated before applying the role changes. Confirm the launch URL with explicit `app-name`, `app-config`, and `app-org`, using the current organization code for LSRC from the catalog. Check a fresh staff session and an existing session, and exercise the three fixed paths, Routing Runs/Templates availability, bulk actions, and organization isolation. This package does not confirm runtime permission behavior. Reports, payments, and schedules remain outside this cutover.

See the [preflight findings](snow-removal-operations-app-preflight-2026-11-17.md) for the comparison before applying the changes.
