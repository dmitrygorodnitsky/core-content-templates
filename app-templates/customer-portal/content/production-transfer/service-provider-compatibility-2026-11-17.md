# SERVICE_PROVIDER onboarding compatibility

## Decision

New onboarding uses `SERVICE_PROVIDER` instead of retired `OPERATOR`. Local configuration and embedded script metadata have been synchronized. No server types, organizations, purchases, permissions or grants were changed. Payment and creation enablement remain unchanged.

The obsolete `onboarding/optional-quotation-expiration.json` patch is removed. `OPERATOR` is explicitly excluded from transfer. Existing frozen onboarding plans are not rewritten or migrated by this change.

## Compatibility evidence

Compared the dev-1 definitions from the read-only snapshot at 2026-11-16 22:49:57 UTC. The [normalized comparison](service-provider-compatibility-2026-11-17.json) uses codes for dictionary references, not environment-specific IDs.

| Requirement | Result |
|---|---|
| Concrete organization type | SERVICE_PROVIDER is not abstract. |
| Parents | Both inherit BASE and AI_AWARE. |
| Lifecycle | Both use ORGANIZATION_WORKFLOW. |
| Inherited attributes | All 11 match in datatype, required/multiselect/unique flags, options, allowed types and defaults. |
| Season | CONTRACT_SETTINGS accepts CONTRACT_AWARE; current season creation and attachment need no change. |
| Quote expiry | QUOTATION_EXPIRATION is already optional LocalDate. No patch required. |
| Communication | Required CONTACT_AWARE reference, same GENERAL_COMMUNICATION default. |
| Region and portal | REGIONS and CUSTOMER_PORTAL_URL are present with the expected types. |
| Definition ownership | SERVICE_PROVIDER belongs to WINTER_SERVICES, the intended production domain. Onboarding resolves the configured type by code. Runtime visibility still belongs to final environment validation. |

The change does not make every purchase ready for onboarding. Existing checks still require the purchase, parent organization, language/currency values, season, entitlements and other prerequisites. In particular, inherited DEFAULT_LANGUAGE and SUPPORTED_CURRENCIES remain required; neither has a type default. No missing value is fabricated by this switch.

## Production transfer

SERVICE_PROVIDER already exists on prod in the saved comparison snapshot. Reuse it by code and update its configuration from dev-1; that snapshot lacks CUSTOMER_PORTAL_URL. Do not create a duplicate or rename OPERATOR.

The COMMUNICATION default must resolve to the existing production `WINTER_SERVICES / GENERAL_COMMUNICATION` dictionary of type CONTACT_AWARE. It is now an explicit reused dependency in the registry. Preserve production contact values. Do not copy the dev dictionary ID. Resolve default dependencies before saving the type.

There are 352 review entries: replacing OPERATOR keeps the type count unchanged, and explicitly recording the reused communication dictionary adds one entry. Script counts remain 39 Java scripts + 20 templates + one platform dependency.

The former DELETE-marker blocker is resolved for the selected package. Historical audit files retain the original finding. The package remains subject to final payload and runtime checks; compatibility of definitions is not a completed live onboarding test.

## Validation

- All 11 inherited attribute contracts compare equal after code-based reference normalization.
- Onboarding sync `--check` passes after regeneration.
- 55 Java readiness assertions and 61 execution assertions pass.
- Three Quote expiry / Property executor tests pass.
- Registry exclusions, JSON/CSV parity, configured type and metadata, default dependency and selected-source DELETE checks pass.

No Core writes, entity creation, emails, payment calls or Sites publication were performed.
