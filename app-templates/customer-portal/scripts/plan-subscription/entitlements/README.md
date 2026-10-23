# PLAN_SUBSCRIPTION Entitlements configuration

Prepared locally on 2026-10-21; updated against the backend guide on
2026-10-22. No native Entitlement entities were applied; the purchase-only manifest
is now deployed in billing Script metadata for Checkout consent checks. This
directory owns proposed native definitions, catalog-to-entitlement mappings
and a read-only preparation CLI. It does not issue grants, create quota pools,
activate policies, change ProductTypes or enable payment.

`config.json` is the source of configuration. `prepare.mjs` validates it and
projects the current catalog into reviewable profiles and native definition
candidates. The generated review is not a seed importer input. There is no
`apply` command or remote mutation path.

## Confirmed decisions and sources

- Provisional definition owner and future issuer: SERVICEWAND, selected by the
  user. The new backend example owns Definitions in Winter Services and Policies
  in each customer. Ownership is a deployment blocker until reconciled; this
  preparation does not silently move the configuration or reuse other owners.
- Coverage starts at confirmed payment, with calendar MONTH/YEAR units from
  the selected billing period. No renewal, trial or cancellation is inferred.
- Three self-service plans: Foundation, Growth, Business (catalog code
  SERVICEWAND_PROFESSIONAL). Enterprise remains sales-only.
- Thirty Boolean feature mappings, including CUSTOMER_PORTAL's explicit
  English localized true/false representation. A missing Boolean source is
  disabled by the user's rule. A malformed present value is an error.
- CASE_MANAGEMENT, OPERATIONAL_DASHBOARDS and OPERATIONAL_REASSIGNMENT preserve
  their exact levels as STRING values. New/unreviewed levels fail preparation.
- Active Properties: ACTIVE_PROPERTIES_INCLUDED plus selected expansion packs
  times the selected product's structured COUNT. Compatibility comes from the
  base plan's COMPATIBILITY. Quantities come from the confirmed purchase, not
  guessed defaults. No overall maximum is parsed from marketing text.
- Weather: explicit selected product ENABLED plus WEATHER_PROPERTY_COUNT;
  the count cannot exceed purchased Property capacity. Specific Property
  assignment is a later action, not inferred from the starter address.
- Routing products, plan optimization entitlements and Custom Reports remain
  excluded. Service-verification photo counts and Unlimited users are not
  converted from prose to invented numerical limits.

The backend configuration guide supersedes the earlier Javadoc interpretation:
`ASSERT_FEATURE` currently writes audit evidence without enforcing an effective
Grant, and Definition/Policy `scriptId` is stored but not executed. No Boolean
or STRING candidate is a working feature access gate. Disabled features/false
levels still omit future grants as the purchased-data rule, not as proof that
backend denies access. Exact STRING levels remain preserved for later support.

The proposed definition set has 36 records: 30 Boolean features, three STRING
levels, one active-Property quota, Weather feature and Weather-Property quota.
All candidates are INACTIVE. No PolicyRule or OperationPolicyBinding is emitted
with guessed action/operation keys. `policyIntents` records the missing hooks.

Source product amounts, feature values and capacities are not hardcoded into
the executable mapper. The current catalog supplies them. A profile digest
covers its values and the configuration; later integration must bind this
digest to consent. Since 2026-10-22 the native billing helper uses the purchase-only
`checkout-config.mjs` manifest to persist `preview.entitlements` with a canonical
entitlementFingerprint inside the catalog/Checkout digest. This is a distinct
runtime snapshot, not the local provisioning planDigest or an issued grant.

## Prepare and verify

With an existing bearer in SERVICEWAND_BEARER (never an argument):

```sh
node app-templates/customer-portal/scripts/plan-subscription/entitlements/prepare.mjs --dev-1 --out /absolute/path/to/review.json
```

The three remote queries are list-only for products, ProductTypes and existing
definitions, scoped to SERVICEWAND. Existing definition conflicts are reported,
not reconciled or overwritten. A credential-free offline run accepts a JSON
catalog with `products`, `types`, optional `definitions` from the same APIs:

```sh
node app-templates/customer-portal/scripts/plan-subscription/entitlements/prepare.mjs --catalog /absolute/path/to/catalog.json --out /absolute/path/to/review.json
node --test app-templates/customer-portal/scripts/plan-subscription/entitlements/prepare.test.mjs
```

`previewSelection(catalog, config, {planCode, billingPeriod, addons})` is a pure
composition preview; each selected add-on has productCode and positive integer
quantity. It does not construct Grant/QuotaPool writes or fabricate a paid
receipt. Repeated runs never change usage. Successful preparation does not mean
that provisioning, enforcement or deployment is ready.

## Backend guide findings — 2026-10-22

Source: `ENTITLEMENT_CONFIGURATION_GUIDE.md`, provided by backend, verified there
on 2026-10-21. Read-only dev-1 inspection on 2026-10-22 matched six Definitions,
ten Grants, ten Pools, fifteen Policies and seventy-four Bindings. No lifecycle
mutation was performed in this review. These are configuration observations;
the successful Account lifecycle tests are reported by the backend guide.

- Account CREATE/DELETE callbacks and `workflow:event:<actual event ID>` bindings
  are implemented. `reserveBefore=false` is within the transition transaction,
  not after commit. Do not add a separate workflow usage counter.
- Property Pools, Policies and Bindings are SUSPENDED. Resource CREATE/DELETE
  hooks are missing; enabling workflow bindings alone would miss active deletion
  and creation. Weather assignment/enforcement is not established by this guide.
- Provision every Grant and Pool explicitly. Multiple applicable Pools are all
  charged; their limits do not sum. One combined Property allowance/pool contains
  the base capacity plus selected expansions, with component quantities retained
  in the purchase snapshot. Weather has its separate selected-Property capacity.
- Customer Policies and operator-context Bindings are explicit. Organization
  ancestry does not supply them. Do not copy the example's two customer IDs or
  its limits, and do not create Grants for intermediate organizations.
- `sourcePlanId` is optional traceability, not a Product foreign key. This planner
  omits it. Source IDs provide no purchase-event idempotency. Grant updates do
  not synchronize Pool limits; retain usedValue and ledger history on changes.
- Reconciliation has a documented RELEASE sign error and a shared-parent lookup
  limitation. This preparation neither invokes nor relies on a rebuild.

Remaining backend decisions: where our Definitions belong; Resource mutation
hook completion; Weather assignment operations; actual Boolean/STRING feature
enforcement. The later onboarding decision accepts the native backend contract
without claiming runtime issuance was tested. Overall Properties maxima now
come from the user-approved temporary configuration: Foundation 500, Growth
1000, Business (SERVICEWAND_PROFESSIONAL) 2000. Moving this source into the
product model remains future work, not a blocker for current capacity checks.
US provisioning is outside the current scope.

## Prepare a purchase provisioning review

`provisioning.mjs` is a pure planner with an offline CLI. It produces symbolic
review templates, not `SaveMappedRequest` payloads. No output can be applied by
this directory: all writes remain disabled, grants INACTIVE, and Pools, Policies
and Bindings SUSPENDED. Payment, dates of unconfirmed payment and customer IDs
are never invented. An absent target organization remains a symbolic reference.

Input purchase: `formId`, `orderId`, optional `targetOrganizationId`, and
`selection` in the existing `previewSelection` format. These IDs and live
snapshots are local review inputs, never CMS content or committed fixtures.
Optional lifecycle input has `resourceTypes` and `workflows` arrays from native
reads for SNOW_REMOVAL_PROPERTY and PROPERTY_LIFECYCLE, including states, event
IDs and targets. ACTIVE boundary IDs are discovered from that snapshot rather
than copied from dev-1. Missing or ambiguous boundaries block complete preparation.
Only active-Property capacity policies are proposed; no invented total-Property
or Account quota is added to the purchased product.

```sh
node app-templates/customer-portal/scripts/plan-subscription/entitlements/provisioning.mjs --catalog /absolute/path/to/catalog.json --purchase /absolute/path/to/purchase.json --lifecycle /absolute/path/to/lifecycle.json --out /absolute/path/to/provisioning-review.json
node --test app-templates/customer-portal/scripts/plan-subscription/entitlements/prepare.test.mjs app-templates/customer-portal/scripts/plan-subscription/entitlements/provisioning.test.mjs
```

The local purchase digest covers choices, quantities and resolved capacities, including
changes to an expansion product's COUNT. The plan digest also binds proposed
records and the supplied lifecycle. These provisioning digests still require a
future paid-receipt integration; native Checkout now binds its own full Entitlement
snapshot and verifies it before consent and new draft creation. Owner changes
invalidate the local provisioning review, not the purchase-only manifest.
Coverage starts at confirmed payment; duration is a calendar month/year. Runtime
calculation of actual dates remains part of the future paid integration.

`reviewProvisioningRecovery(plan, receipt, current)` compares a **trusted server
receipt** and fresh Grant/Pool reads with the reviewed purchase. The receipt must
include formId/orderId/targetOrganizationId, planDigest and a `records` map from
template key to persisted ID. Definition owner/ID, organization, source Order,
values, links and duplicate allowances are checked. Existing usage, including
usage above the limit, is preserved. A missing receipt or partial/conflicting
records block review rather than create replacements or adopt arbitrary rows.
Definition references in the read snapshot must include their owner organization.

This is a recovery preflight, not a transaction/idempotency implementation or a
payment, effective-date, active-status or Policy/Binding verification. A future
server adapter still needs one durable unique purchase receipt and a shared
transaction/serialization boundary. New Pools may start at zero only for a
verified empty organization; existing data requires a transactional baseline and
matching ledger evidence. Do not zero existing usage on retry or use reconciliation
to manufacture that baseline. Grant issuance remains disabled in every result.

## Javadoc evidence

- [PolicyEngine](https://dev-1.servicewand.com/core/docs/javadoc/com/pixelnation/modules/entitlement/service/PolicyEngine.html): database-driven rules, entity and operation contexts.
- [EntitlementCallbackRegistrar](https://dev-1.servicewand.com/core/docs/javadoc/com/pixelnation/modules/entitlement/persistence/EntitlementCallbackRegistrar.html): registration for managers with annotated entity classes.
- [EntitlementOperationAspect](https://dev-1.servicewand.com/core/docs/javadoc/com/pixelnation/modules/entitlement/service/EntitlementOperationAspect.html): before/after checks on annotated methods.
- [EntitlementAggregationType](https://dev-1.servicewand.com/core/docs/javadoc/com/pixelnation/modules/entitlement/domain/EntitlementAggregationType.html): aggregation describes usage, not an assumed sum of purchased grants.
- [Account](https://dev-1.servicewand.com/core-acct/docs/javadoc/com/pixelnation/account/domain/Account.html), [Resource](https://dev-1.servicewand.com/core-rm/docs/javadoc/com/pixelnation/rm/domain/Resource.html), [WeatherService](https://dev-1.servicewand.com/core-weather/docs/javadoc/com/pixelnation/weather/service/WeatherService.html): annotation visibility inspected, execution not tested.

Javadoc includes a legacy binding example with effectType RESERVE, while the
live enum is RESERVE_QUOTA. Live enum values take precedence; no binding was
created from that example. The documented ACCOUNT operation example is not
used as an invented RESOURCE or Weather operation key.

The backend guide's implementation limits take precedence over illustrative
Javadoc statements, especially scriptId, ASSERT_FEATURE and workflow operation
key syntax. The current native key is `workflow:event:<eventId>`.
