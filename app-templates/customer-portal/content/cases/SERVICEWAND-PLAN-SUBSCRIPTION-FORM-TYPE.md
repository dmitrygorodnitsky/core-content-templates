# ServiceWand Plan Subscription FormType

Status: published on dev-1. The 2026-10-19 add-on stage extends the authorized
FormType with two quantities and materializes the confirmed plan, site
expansion and Weather selection in DRAFT. Routing (all catalog generations)
and Custom Reports are excluded. The existing two one-time FormTokens and
SYSTEM execution before User creation are preserved. The tax/Invoice stage now
prepares one unpaid DRAFT Invoice using the existing native tax calculation.
Payment remains blocked pending overall Properties maxima, applicable tax
configuration/rounding decisions and payment integration.
UI and ProductTypes/ProductPriceTypes are unchanged.

On 2026-10-22 a CA-only onboarding readiness command was added for the saved
confirmed purchase. It verifies the existing purchase receipt, reads native
Organization/CUSTOMER/Property/Service Agreement models and reports missing
sources with symbolic creation dependencies. It never creates onboarding
entities or treats buyer consent as paid status. See
[`onboarding/README.md`](../../scripts/plan-subscription/onboarding/README.md)
for the command, blockers and no-fixture verification limits. US remains outside
this readiness scope. Entity types, UI, payment and grant issuance are unchanged.

Definition: [`../form-types/PLAN_SUBSCRIPTION.json`](../form-types/PLAN_SUBSCRIPTION.json).
It follows the Core `FormType` attribute/group/order structure used by
`GET_QUOTE_`. It is a portable definition, not a full deployed-type snapshot.
On 2026-10-18 it was synchronized read-only from dev-1 (nine attributes,
three groups, FormType 6 / optimistic 2 / workflow 69). On 2026-10-19 the user
explicitly authorized adding quantities and deploying backend add-on processing.
The current definition has eleven attributes, three groups; FormType 6 is
optimistic 3 with workflow 69. Existing labels, flags, options, owner, ACLs,
workflow and groups were preserved. Environment IDs, optimistic version,
workflow binding, owner and ACLs remain outside the portable JSON.

## Fields

| Group | Attribute | Value | Required |
| --- | --- | --- | --- |
| Plan | `PLAN_PRODUCT` | One existing PIM Product ID | yes |
| Plan | `BILLING_PERIOD` | `MONTHLY` or `YEARLY` | yes |
| Add-ons | `ADDON_PRODUCTS` | Array of existing PIM Product IDs | no |
| Add-ons | `SITE_EXPANSION_PACKS` | Integer pack count | conditional |
| Add-ons | `WEATHER_PROPERTY_COUNT` | Integer count of Properties selected for Weather | conditional |
| Company | `COMPANY_NAME` | Company name | yes |
| Company | `COMPANY_ADDRESS` | One formatted company address, string | yes |
| Contact | `FIRST_NAME` | Contact first name | no |
| Contact | `LAST_NAME` | Contact last name | no |
| Contact | `EMAIL` | Contact email | yes |
| Contact | `PHONE` | Contact phone | no |

First/last name and phone are optional in this draft: the purchase brief
requires a contact email and does not make these three fields mandatory.
COMPANY_ADDRESS uses the existing String + `inputFormat: address` contract.
It is submitted text, not an existing Address ID, and serves as the company,
billing and legal address. Preserve its original input. Operational address
resolution now produces the country, region, city and postal code before email
token issuance. The saved Address ID is available for billing, legal and the
sample Property. Do not infer contact names, email or phone from the address.
Geographic verification and final tax-jurisdiction validation remain later
workflow dependencies; native address resolution does not prove physical or
legal validity.

## Product references and validation boundary

`PLAN_PRODUCT` and `ADDON_PRODUCTS` use
`com.pixelnation.pim.domain.Product`, not labels, embedded Product objects,
hardcoded catalog options, or client-supplied prices. Core typed attributes
store the selected scalar ID or array of scalar IDs under `.value`.
Missing `ADDON_PRODUCTS` means an empty selection.

The workflow resolves these IDs in the ServiceWand seller scope on the billing/PIM
node using its existing authenticated service queue. The base plan must be
SERVICEWAND_SAAS; Enterprise is sales-only. Compatibility is read from the
plan's COMPATIBILITY Product list. Only compatible site-expansion products
(SERVICEWAND_SAAS_PROPERTY_EXT_*) and enabled SERVICEWAND_WEATHER_INTELLIGENCE
are accepted. Routing Credits and Custom Reports are explicitly rejected,
including older priced Routing products, without silently dropping a selection.

A selected expansion/Weather requires a positive Integer quantity. Unselected
quantities must be absent or zero; fractions, negatives, numeric strings,
overflow, duplicate products and multiple expansion products are refused.
Included Properties and expansion COUNT determine purchased capacity; Weather
count cannot exceed it. No quantity defaults to one. Actual Property assignment
comes with later provisioning. Both new inputs are bound to the immutable
input digest and the second confirmation's catalog snapshot.

Catalog prices must be public seller PER_UNIT_RECURRENT / Licensed, without
an extra fixed fee, in the chosen period and the same currency. Annual add-on
prices must equal monthly × 12; the base plan retains its annual catalog price.
The second email lists each quantity/unit amount/line amount and subtotal before
taxes, and clearly describes pending capacity maxima/taxes and draft-only status.

The 2026-10-19 implementation uses PLAN_SUBSCRIPTION_WORKFLOW_V8 (Script 729)
and PLAN_SUBSCRIPTION_DRAFT_V4 (Script 730). Validation runs before the first
link/Address, on Checkout preparation and before creation. Each confirmed line
is a SERVICEWAND_SUBSCRIPTION_ITEM with exact ProductPrice, catalog unit amount,
explicit itemCount and DRAFT state. Account, Order and all lines commit together;
receipt recovery validates the persisted full selection and native totalCharges
without repricing or duplicates. Existing base-only snapshots are not silently
upgraded to a paid add-on purchase. Details: [backend contract](../../scripts/plan-subscription/README.md).

`itemsMaterialized=true` and `pricingStatus=CATALOG_SELECTION_ONLY` describe the
new selection charges. `capacityValidation=MAXIMUM_NOT_STRUCTURED` remains:
maxima 500/1000/2000 exist only in prose and are not parsed or hardcoded.
`totalPayable=null`, taxes NOT_CALCULATED, Order DRAFT exit blocked. This stage
does not create Invoice, Payment, User or customer Organization.

## Future workflow boundary

- The Form belongs to the ServiceWand seller organization. This is distinct
  from the customer organization, which does not exist until after payment.
- The country resolved from `COMPANY_ADDRESS` selects the configured CA / US
  parent organization. The client does not supply that organization's ID. No
  currency policy is implied by the resolved country.
- Prices, taxes, totals and currency come from trusted server-side calculation.
  Order, Invoice, Payment, company Account, customer organization, User,
  System Ledger Account and demo records are workflow results, not input fields.
- Verification state, grants, payment status and generated credentials are not
  public input attributes. Email confirmation is intended to use the existing
  `FormToken` anonymous event mechanism, not an `AccessGrant` on Form. The
  deployed Core instructions describe consumption on first successful use.
  Confirm the implementation contract and test replay/concurrency before
  treating this behavior as proven for the new workflow.
- The persisted Form ID is the starting correlation identity for workflow
  retries. Duplicate submit/checkout handling and idempotency across entities
  still need implementation; the schema alone provides neither.

## Organization and starter-data model audit — 2026-10-19

Scope: read-only dev-1 inspection for the post-payment portion of the original
purchase brief. No organization, User, Account, Resource, Document, Project,
Ledger entity, Script, entitlement or test fixture was created. No type,
workflow, role, permission or UI was changed. Existing Scripts were read, never
executed. Sources: native `/api-docs`, GET default mappings and authenticated
POST list/basic-info requests. The original brief requires provisioning only
after confirmed payment; this audit does not enable that transition.

### Confirmed reusable model

| Step | Live evidence | Practical consequence |
| --- | --- | --- |
| Customer organization | `OPERATOR` OrganizationType 4, owned by `SERVICE_WAND_WINTER_SERVICES` (8), inherits BASE 1 and AI_AWARE 7; workflow ORGANIZATION_WORKFLOW 1 starts INITIAL | Existing concrete type is available as a candidate; no new OrganizationType is justified by this audit. INITIAL → ACTIVE is an existing event, not an automatic result of saving. |
| CA parent | `SERVICE_WAND_WINTER_SERVICES_CANADA` (9), child of Winter Services 8 | Resolved COMPANY_ADDRESS country CA can identify an existing parent. |
| Organization defaults | BASE requires DEFAULT_LANGUAGE; Winter Services and CA currently carry `en`. OPERATOR requires COMMUNICATION with default GENERAL_COMMUNICATION 83133, owned by Winter Services 8; it exists. QUOTATION_EXPIRATION is required with no default | Language and a shared communication configuration have existing sources; the quotation-expiration date does not. |
| Administrator role | `SW_FS_WS_COMPANY_ADMIN` (29), owned by SERVICEWAND 7; 306 permissions, including user write/role assignment, no SYSTEM_ADMIN permission | There is a company-admin role to evaluate; do not assign platform administrator access. |
| User mechanism | Core User has organization-scoped role assignments. Existing `SNOW_PORTAL_USER_PROVISION_V8` (518) creates/reuses a User by login, links Account.user, assigns a role and issues credentials through UserService.generateNewPassword | Reuse the mechanism, not the whole Script: it is fixed to SNOWLIMITLESS and the customer-portal role, not a newly purchased company. Read only; no credentials were generated. |
| Customer 1 | CUSTOMER AccountType 2 inherits TYPE_AWARE 35; workflow CLIENT_ACCOUNT_LIFECYCLE 36 starts INITIAL | A candidate exists, but inherited required LEGAL_ENTITY_TYPE has no default. Allowed values are INDIVIDUAL, UNINCORPORATED_BUSINESS, CORPORATE, ASSOCIATION, GOVERNMENT. This is a declared model requirement, not a tested assertion about save-time enforcement. |
| Property | SNOW_REMOVAL_PROPERTY 154 inherits PROPERTY 153; both owned by Winter Services 8, workflow PROPERTY_LIFECYCLE 35 starts INITIAL | Required inherited ADDRESS and ACCOUNT can reference the saved COMPANY_ADDRESS and Customer 1. ACCOUNT is constrained to CUSTOMER type 2. The old snapshot's SITE_SERVICE_DURATION is absent from the current type, so it is not a current missing client input. Existing WINTER_SERVICE_PROPERTY_CREATOR_V3 shows the native address/account association. |
| Purchase correlation/recovery | Existing Order/Account metadata and Organization.externalReferences/preferences are native fields | New entity types are not inherently needed for an idempotency receipt. The future orchestrator must still implement per-step correlation, serialization and partial recovery; none was run here. |

### Questions and missing configuration for the team

1. **US parent and tenant defaults.** No US Winter Services parent appears in
   the current 16-organization tree; CA and BY do. Supply the intended US
   organization/code (or prepare it separately). Confirm OPERATOR for purchased
   companies. The quotation-link policy was supplied by the user on
   2026-10-20 (see below); its previous status as an undecided business rule
   is resolved. The checked parent organizations do not supply the season
   configuration. Time zone and tenant readiness/activation defaults should
   also be explicit when implementing.
2. **Activation of the purchased plan/add-ons.** The live catalog has feature
   attributes and quantities, but no inspected plan-to-entitlement/activation
   configuration. On 2026-10-21 the user selected the existing Entitlements API
   as the activation mechanism; the API/model inspection below confirms the
   relevant building blocks. The remaining task is definition/grant/policy
   configuration and its runtime verification, not choosing another mechanism.
   Merely copying a Product ID to metadata is not proof that capabilities are
   activated or their limits enforced.
3. **System Ledger Account.** No LedgerAccount entity/API or System ledger
   type was identified in the inspected published APIs/domain guides or
   AccountTypes. Do not substitute the CRM CUSTOMER or ORGANIZATION Account.
   The team needs to identify the exact entity/service/API and the existing
   System type, mandatory fields and organization linkage. This is an
   unverified implementation contract, not proof that Core has no ledger.
4. **Administrator role across organization roots.** Winter Services 8 has
   no parent SERVICEWAND 7; these are separate roots in the current tree.
   COMPANY_ADMIN 29 is owned by SERVICEWAND, outside the CA ancestry. Confirm
   that this role may be assigned in a newly created Winter Services tenant
   and provides the intended tenant access, or identify the intended existing
   role/configuration. No cross-root role assignment or access was tested.
5. **Demo Customer 1.** Confirm CUSTOMER 2 and the demo LEGAL_ENTITY_TYPE value
   (rather than inventing the real purchaser's legal classification). The
   same inherited required field applies to the seller-side CUSTOMER Account
   of the real buyer: current form inputs do not contain it and createAccount
   in PLAN_SUBSCRIPTION_DRAFT_V5 does not set it. Earlier successful saves do
   not prove that the declared requirement is satisfied. The team must define
   its source/rule before real onboarding; no form/type was changed here.
   Define whether demo
   entities remain INITIAL/DRAFT or become active, whether they count toward
   purchased limits/Weather quantity, and how they are later removed.
6. **Example contract and its extra dependencies.** On 2026-10-20 the user
   selected SERVICE_AGREEMENT from the existing Request Quote process.
   The seasonal/per-visit contract alternatives and their required season
   Project are therefore not dependencies of this selected starter contract.
   SERVICE_AGREEMENT 17 is Winter-owned,
   starts QUOTATION, and requires CLIENT (CUSTOMER 2) plus ORDERS constrained
   to FIELD_SERVICE_ORDER 5 / WINTER_SERVICES_ORDER 6. The ServiceWand purchase
   Order type 7 is not an allowed service order and must not be reused as the
   demo contract's order. The only inspected contract-settings record is
   SNOWLIMITLESS_CONTRACT_SETTINGS 83136, owned by SNOWLIMITLESS; it is not a
   shared default for arbitrary new companies. Define a shared template or
   explicit demo defaults instead of copying another company's settings.
7. **Existing administrator identity and delivery.** Decide the existing-login
   / repeat-purchase policy: reuse a verified existing User with another
   organization role, or use a separate login. Existing credentials must not
   be silently reset on retries. Core has a password-issuance mechanism, but
   the brief's readiness notice, separate access email and login destination
   still need to be wired after the starter set passes its readiness check.
   User.name has a 64-character schema limit, so directly using every valid
   contact email as a login is not a universal generation rule.

User clarification on 2026-10-20: the starter Property reuses the client's saved
COMPANY_ADDRESS; no separate site address or additional site details are to be
requested for this example. Customer 1 is the starter agreement's client.
Selecting SERVICE_AGREEMENT does not authorize creating its supporting service
Order, choosing prices/services, issuing the agreement or changing its type.
This update records the decision only; provisioning remains unimplemented.

Quotation-link rule supplied by the user on 2026-10-20: if the season has not
started, expiry is the start of the season; if it has started (including the
start date), expiry is 30 days from issuing the link. Calculate this when a
Quote link is issued/reissued, rather than setting one fixed organization date
at purchase time. A link issued five days before the season therefore lasts
five days. This applies to Quote links; the purchase flow's two one-time
FormTokens retain their separate 24-hour policy.

Read-only dev-1 verification on 2026-10-20 found SEASON_START as a LocalDate in
CONTRACT_AWARE DictionaryType 35, reached through Organization.CONTRACT_SETTINGS,
not as a direct OPERATOR attribute. Existing SNOW_CONTRACT_SOURCES_V1 (618)
reads it to build the contract-season snapshot; quotation delivery V17 (679)
uses the agreement's TERM_START_DATE. That delivery currently returns the later
of season start and now plus QUOTATION_EXPIRATION days (default 30), so it does
not yet implement the newly stated strict season boundary. OPERATOR still
declares QUOTATION_EXPIRATION as required LocalDate, whereas that delivery's
parser expects a positive day count and falls back to 30 for a date. This is a
live model/code mismatch to reconcile without silently changing types. The
policy and findings are recorded here; no shared Request Quote Script, grant,
organization setting or type was changed during this clarification.

### Inspection limits

SYSTEM/SERVICEWAND read scope was sufficient to inspect the model/configuration
above. Direct reads with Winter Services/CA organization headers returned 403
for this session. Therefore effective visibility, inherited type writes and
role behavior inside a future tenant are not verified. Native creation,
mandatory-field enforcement, hooks, credential delivery and failure recovery
were intentionally not exercised because the user prohibited entity creation.
Published domain-guide Scripts also omit some entities present in live API
mappings (notably entitlements), so the live API takes precedence over those
guides; absence from a guide alone is not treated as proof of absence.

### Entitlements API inspection — 2026-10-21

The user selected native Entitlements for plan/add-on activation. This was a
read-only inspection of fresh core/api-docs, five native GET mappings, five
CRUD datasets in SYSTEM and SERVICEWAND scopes, the live SERVICE-WAND/DEFAULT
data models/enums, permission IDs, the current ServiceWand products and the
local core-ui screen/endpoint definitions. No Script was created/executed, no
entitlement or entity was issued/saved, no quotas were consumed and no API
save/delete/commit or workflow operation was called. Payment stays disabled.

| Component | Confirmed native fields | Role in the purchase flow |
| --- | --- | --- |
| EntitlementDefinition | code, organization, valueType, enforcementType, scopeType, aggregationType, resetPeriod, status, optional scriptId | Define the capability/limit independently of a particular customer. |
| EntitlementGrant | grantorOrganization, granteeOrganization, entitlementDefinition, grantType, value (string), valueType, scopeType, effectiveFrom/effectiveTo, sourceOrderId/sourcePlanId, parentGrant, status | Assign a capability/value to the purchased organization with a validity interval and source receipt. |
| QuotaPool | organization, entitlementDefinition, entitlementGrant, parentPool, limitValue, usedValue, resetPeriod, periodStart/periodEnd, status | Represent the configured limit and current usage. Creating a Grant is not proof that a pool is automatically created or maintained. |
| PolicyRule | organization, entityClass, action, entitlementDefinition, enforcementType, amountExpression, consumerOrgExpression, scopeExpression, usageExpression, whenExpression, optional scriptId, status | Describe which entity action requires/checks/updates a capability or usage. |
| OperationPolicyBinding | organization, operation, policyAction, policyRule, entitlementDefinition, effectType, amountExpression, consumerOrgExpression, whenExpression, reserveBefore, status | Attach policy effects to named backend operations. The operation key must be a supported real execution point, not an invented string. |

All five have ordinary core CRUD endpoints. The entity path segments are
`entitlement-definition`, `entitlement-grant`, `quota-pool`, `policy-rule`,
`operation-policy-binding`, under `/core/api/`; reads use list/get/mappings,
writes would use save. The published OpenAPI inspected here contains CRUD,
audit and mapping routes, not a separate published resolve/evaluate/reserve
Entitlements API. Internal enforcement/service contracts were not inspected
through a newly created Script or mutation probe.

Live enums confirm:

- Value types BOOLEAN, INTEGER, DECIMAL, STRING, DURATION.
- Enforcement FEATURE, QUOTA_POOL, METERED_USAGE, CONTEXTUAL_LIMIT.
- Grant types PURCHASED, DELEGATED, ADDON, ADJUSTMENT, SYSTEM.
- Aggregations COUNT_ACTIVE, COUNT_ALL, SUM, ANY_TRUE, MAX, MIN, CUSTOM.
- Scope types ORGANIZATION_SELF, ORGANIZATION_SUBTREE, ACCOUNT, SITE,
  APPOINTMENT, SITE_APPOINTMENT, BILLING_PERIOD, CUSTOM. A scope enum alone
  does not demonstrate subject binding or runtime enforcement.
- Reset periods NONE, DAILY, MONTHLY, BILLING_CYCLE, CUSTOM.
- Operation effects ASSERT_FEATURE, RESERVE_QUOTA, RELEASE_QUOTA,
  RECORD_METERED_USAGE, EMIT_LIFECYCLE_OUTCOME.

Current records: SYSTEM inspection returns two definitions
ACCOUNTS.MAX_COUNT / ACCOUNTS.MAX_ACTIVE, two SYSTEM grants with value "10",
two quota pools (limit 10 / used 0), and two Account CREATE/DELETE policies.
These records belong to PNI, not ServiceWand. The policies point to
ACCOUNTS.MAX_COUNT and use amountExpression "1", consumerOrgExpression
"#organization", with mutation-based whenExpression. No operation bindings
were returned. SERVICEWAND returns zero definitions, pools, policies or
bindings; its grant list also returns those same two PNI grants. Therefore
the caller's organization header is not an adequate record-correlation filter
in this administrator session; future reconciliation must explicitly match
grantee/definition/source IDs and still rely on server authorization. No
non-admin or buyer access boundary was exercised in this inspection.

Seventeen ServiceWand products were read. They have existing feature/capacity
attributes and empty metadata; no explicit product-to-EntitlementDefinition
relationship/configuration was identified. Feature text/labels must not be
treated as an already configured entitlement. Entity/ProductTypes need not
be expanded merely to use these five existing native entities.

Implementation direction, not deployed configuration:

- Purchased plan features can be represented by PURCHASED grants; selected
  add-ons by ADDON grants, targeting the newly created customer organization.
  BOOLEAN/FEATURE is available for feature flags; numeric limits use the
  existing numeric/quota mechanisms. User roles remain a separate access layer.
- Property capacity comes from the paid selection: included capacity plus
  confirmed expansion quantity times the product's COUNT. Configure the
  corresponding definition, grant/pool and actual Property lifecycle checks;
  do not silently treat an Account-count policy as a Property policy.
- Weather requires both the enabled capability and the purchased Property
  count. Assigning Weather to specific Properties is a later operation, not
  something inferred from the count or starter address. Routing/Custom Reports
  remain excluded by the agreed purchase scope.
- Use effectiveFrom/effectiveTo for purchased coverage, with an explicit
  month/year period rule; quota reset period is a separate concept. Existing
  billing cadence does not by itself define renewal/cancellation behavior.
- Existing sourceOrderId/sourcePlanId permit correlation; they do not prove
  uniqueness or idempotency. Their exact source-plan identifier semantics,
  multiple-grant aggregation, cross-root grantor/grantee validation, automatic
  pool creation, active-Property count release and atomic reserve/rollback
  behavior remain to be confirmed from the backend contract or a later
  explicitly authorized integration test. Never reset existing usedValue on retry.

Permission families verified in the native registry are
P_ENTITLEMENT_DEFINITION, P_ENTITLEMENT_GRANT, P_ENTITLEMENT_QUOTA_POOL,
P_ENTITLEMENT_POLICY_RULE and P_ENTITLEMENT_OPERATION_BINDING, each with
_R/_W/_D/_AUD. This is a registry inventory, not a validation of every endpoint
authorization or AUD semantics. Buyer administration of grants/quotas is not
part of the purchase flow.

The mechanism-selection question is closed. Next, prepare and review a
configuration mapping paid plan/add-on attributes to definitions, values and
supported enforcement operations; runtime enforcement and idempotent paid-only
issuance must then be tested before provisioning can be considered complete.

### Prepared Entitlements configuration — 2026-10-21

The user authorized preparation without grant issuance, payment or ProductType
changes. Subsequent answers fix the owner of Definitions/Policies and future
issuer as SERVICEWAND, coverage start as confirmed payment, missing Boolean
product attributes as disabled, and preservation of STRING capability levels.
The user asked for a backend question on missing Boolean semantics and, after
Javadoc inspection, agreed to ask backend for the unconfirmed runtime hooks.

Canonical configuration and the full forwardable backend questions are in
[`entitlements/README.md`](../../scripts/plan-subscription/entitlements/README.md).
`config.json` contains explicit catalog-source mappings; the pure preparation
CLI validates live data and emits review profiles and 36 INACTIVE native
definition candidates. It has no apply/mutation command. No records were saved
on dev-1, no grants or pools issued, no policy activated and no workflow changed.

| Plan | Catalog code | Included Properties | Enabled/disabled Boolean mappings | Case / dashboard levels |
| --- | --- | ---: | --- | --- |
| Foundation | SERVICEWAND_FOUNDATION | 50 | 18 / 12 | false / false |
| Growth | SERVICEWAND_GROWTH | 200 | 25 / 5 | Standard / Standard |
| Business | SERVICEWAND_PROFESSIONAL | 500 | 30 / 0 | Configurable / Configurable |

Thirty Boolean mappings include the explicit localized CUSTOMER_PORTAL flag.
The three preserved STRING mappings are CASE_MANAGEMENT,
OPERATIONAL_DASHBOARDS and OPERATIONAL_REASSIGNMENT. Site Expansion contributes
the catalog COUNT (currently 50 / 100 / 100) multiplied by the confirmed pack
quantity; yearly billing never multiplies Property capacity by twelve. Weather
uses only an explicitly selected enabled product and its confirmed Property
quantity, bounded by purchased capacity. Routing optimization/credits and
Custom Reports are excluded. General plan maxima and photo-count/user-limit
prose are not parsed into invented numeric entitlements.

Authenticated Javadoc reads confirmed PolicyEngine entity/operation hooks,
EntitlementOperationAspect, callback registration for annotated entities,
stable ordered quota-pool locking and a separate ledger-based reconciliation
service. Aggregation describes usage, not a presumed sum of purchased grants.
FEATURE is an active-grant existence check; disabled features must omit a
grant, rather than issue an active grant whose value is "false". STRING level
values are preserved, but FEATURE existence alone does not enforce their
differences. Account Javadoc exposes CREATE/DELETE PolicyCheck annotations;
Resource and the inspected Weather service/provider pages do not expose the
corresponding hooks or operation keys. No Resource/Weather binding was guessed.
An older binding example says RESERVE while the live effect enum says
RESERVE_QUOTA; native live enum values take precedence.

Verification: the canonical CLI's read-only dev-1 path completed successfully
against the current catalog; native candidates remain INACTIVE and emitted
policyBindings are empty. Eleven offline tests passed: absent/malformed flags,
localized Boolean decoding, preserved/new levels, composed quantities and
cadence, unselected Weather, capacity/compatibility/exclusions, duplicate and
invalid quantities, ambiguous/foreign/drifted sources, stable/invalidation
digests, disabled write controls and existing-definition conflicts. No synthetic
server fixtures were needed. Runtime enforcement, cross-root visibility,
sourcePlanId meaning, pool creation and paid-only idempotent issuance remain
explicitly unverified. Future integration must bind the profile digest to the
Checkout consent snapshot; current purchase workflow sources are unchanged.

### Entitlement purchase provisioning review — 2026-10-22

The backend-provided `ENTITLEMENT_CONFIGURATION_GUIDE.md` supersedes earlier
Javadoc assumptions. Read-only inspection matched the documented active Account
configuration and SUSPENDED Property Pools, Policies and Bindings. Resource
CREATE/DELETE hooks are missing; Definition/Policy scriptId is not executed,
and ASSERT_FEATURE currently audits without checking an effective Grant or its
level. No custom workflow counter or script-based feature gate was introduced.
Weather enforcement remains unconfirmed. Reconciliation has documented RELEASE
sign/shared-parent limitations and is not used. These findings do not establish
working Property/Weather/feature enforcement from a successful Account test.

The user authorized continuing what can be prepared without payment or grants.
`entitlements/provisioning.mjs` now builds a pure per-purchase review with symbolic
references: enabled feature/level Grant templates, one combined base-plus-expansion
Property Grant/Pool, a separate selected-Weather allowance, active-Property
CREATE/DELETE Policy templates and actual workflow ACTIVE-boundary Bindings from
a supplied lifecycle read. Definitions are still candidates, Grants INACTIVE,
Pools/Policies/Bindings SUSPENDED; there is no apply or remote mutation path.
No total-Property or Account quota is inferred from the example configuration.

Purchase identity, quantities and resolved capacity are included in a purchase
digest; the plan digest also covers the lifecycle templates. A changed expansion
COUNT changes the purchase digest. Native Checkout consent integration remains
pending. Actual coverage dates require confirmed payment; no fake payment date
or recipient organization is inserted. sourcePlanId is omitted because it is
optional traceability rather than a Product foreign key.

The pure recovery review compares a proposed plan to a trusted purchase receipt
and fresh Grant/Pool reads. Missing receipts, incomplete/foreign records, changed
allowances and duplicate pools fail closed; usage is never reset, including when
already above limit. This checks identities/allowances only, not paid status,
effective dates, active enforcement or persisted Policy/Binding records. Durable
receipt storage, transactional uniqueness and actual creation remain a future
server integration; a passing local test is not idempotent issuance on dev-1.

The provisional SERVICEWAND owner was retained, not silently replaced by the
guide's Winter Services owner. Ownership must be reconciled before deployment;
customer Policies and operator-context Bindings are explicit, not inherited.
US onboarding is excluded from the current scope. No server entities, ProductTypes,
CMS scripts, workflows, payment configuration or existing customer quotas changed.

Verification: 22 focused offline tests cover source decoding, capacity composition,
false/missing feature omission, preserved levels, changed/reordered purchase data,
environment-derived boundary IDs, incomplete/ambiguous lifecycle rejection,
blocked writes and recovery conflicts/usage preservation. The actual dev-1
Property lifecycle exposes four ACTIVE boundaries, matching the guide; no
lifecycle mutation was performed. Both offline CLIs completed against a fresh
read-only dev-1 catalog and lifecycle snapshot. A synthetic Growth selection
with two expansion packs and Weather for ten Properties produced capacity 400,
31 inactive Grant templates, two suspended Pools, two suspended active-Property
Policies and four suspended Bindings. These are local symbolic templates, not
server records or a real purchase, and canApply remained false.

### Entitlements linked to Checkout on dev-1 — 2026-10-22

The user authorized binding Entitlements to Checkout and checking catalog changes
at confirmation, without UI/type changes, grant issuance or payment. The existing
Script 737/738 and four bound workflows were updated in place. Their source
comments invalidate compiled workflow utilities; tax/lifecycle behavior and
existing states/events/role grants remain unchanged. No Entitlement Definition,
Grant, Pool, Policy or Operation Binding was saved.

The purchase-only manifest is exported from canonical config.json into billing
Script metadata by entitlements/checkout-config.mjs (`--write`, `--check`). New
previews use schemaVersion 3 and persist preview.entitlements plus its canonical
entitlementFingerprint. The canonical catalog hash includes both, and the
existing Checkout/input digest and one-time confirmation bind the result.
The snapshot preserves disabled/missing Booleans, exact STRING levels, expansion
pack size/count and combined Property capacity, selected Weather count, mapping
configuration fingerprint and coverage rules. It invents no recipient or paid
timestamp and declares grantIssuanceEnabled/enforcementVerified=false.

The Form exit hook obtains a fresh billing preview before authorizedAt is
recorded. A changed catalog or manifest refuses that consent. Billing repeats
the check before creating new Account/Order/Items. Saved request metadata cannot
replace the source snapshot. New metadata receipts bind the fingerprint; Order
planPreview and the CMS purchase receipt retain the complete purchased snapshot.
Committed legacy drafts are not silently populated/repriced; unconfirmed legacy
Checkouts require fresh preparation and a new confirmation.

Explicit operator preparation of a changed CHECKOUT_PREPARED snapshot archives
the previous confirmation without its raw dev token and schedules a new one-time
link. Unchanged preparation reuses the existing link. A superseded link cannot
authorize the new snapshot. Operator preparation is recorded as OPERATOR; actual
buyer confirmation and draft creation still use SYSTEM without SYSTEM_ADMIN.
The existing review email now includes readable features/levels and capacities;
no frontend/template UI was added and real test email delivery stays suppressed.

During native integration, initial deferred intake remained SUBMITTED despite a
successful independent billing validation. Deferred intake now uses a fresh
SYSTEM principal and resolves the committed seller/type Form by a server-generated
preparationRequestId, rather than retaining the transient Form object/ID or
anonymous request principal. Bounded polling creates nothing for a rolled-back
submission. Later continuations retain their original after-transaction/state
checks. Early failed diagnostic runs were cleaned before the final successful run.

Verification: 26 offline tests passed, both native helpers compiled/executed,
and the focused --entitlements-only dev-1 integration passed. Native Java output
and its hash matched the independent live-catalog JS projection. Internally
rehashed old feature/level/capacity/Weather/mapping and legacy reviews were
refused before consent/creation; shared Products were never edited. Concurrent
anonymous confirmation, ignored forged request values, same-order receipt
recovery, changed/legacy refresh, old-link refusal and no resend on unchanged
refresh passed. Cleanup removed seven Forms, three CUSTOMER Accounts, three DRAFT
Orders, nine OrderItems, three unpaid DRAFT Invoices, one Address and both temporary
helpers. No real emails or payments were sent.

Independent readback matched all seventeen visible ProductTypes and the original
FormType/version/fields. Existing Grants, Pools and usedValue were unchanged.
Grant/policy enforcement and paid provisioning remain blocked on their previously
documented backend contracts; Checkout data binding does not enable those features.

## Tax and Invoice preparation — 2026-10-19

The user authorized tax verification and Order → Invoice preparation on dev-1,
without UI, ProductType changes or payment. On request, existing calculation
sources were searched in SYSTEM/SERVICEWAND Scripts and Order/OrderItem/Invoice
workflows. The active tax assignment is the exact Order workflow 66 onUpdate;
GENERAL_FSM_ORDER_ITEM's SNOW_ORDER_ITEM_UTILITIES_V1 only logs changes.
Native OrderItem totals calculate unit amount × itemCount × percentage / 100
without rounding; Invoice.amountDue sums OrderItem.grandTotal. Workflow INVOICE
22 supplies the existing item-reference pattern. The new code invokes the
native Order save/hook, audits its assignments and reads native totals rather
than replacing that calculator. The original tax hook remains an exact prefix.

The 92 visible TAX entries were not changed. Some have no attributes; New York
has no row. Explicit zero (e.g. the configured Alaska row) is distinguished
from missing configuration. Missing/unsupported settings leave the same Order
DRAFT with TAX_CONFIGURATION_REQUIRED and no Invoice; there is no guessed zero.
Native fractional cents are preserved with ROUNDING_POLICY_REQUIRED rather
than inventing a rounding mode. Final payment remains disabled in every case.

Implementation: PLAN_SUBSCRIPTION_WORKFLOW_V9 / Script 737 and
PLAN_SUBSCRIPTION_DRAFT_V5 / Script 738. New confirmations prepare a STANDARD
DRAFT invoice when tax configuration applies; prepareInvoice(formId,
checkoutDigest) performs explicit consent-bound reconciliation. The verified
COMPANY_ADDRESS ID and resolved components must still match the native billing
address. The same seller/Form lock and stored invoice receipt serialize retries;
existing or overlapping invoices are validated, not duplicated or repriced.
No dueDate/payment term, invoice delivery, PaymentIntent, payment, User or grant
is invented. Parent/Invoice metadata contains immutable snapshot fingerprints
with deterministic field/item/rate ordering, exact native amounts and item IDs.

Invoice.items has native cascade ALL and orphanRemoval to the existing
OrderItems. Scoped guards on workflows 66/67/68 protect the prepared parent,
items and invoice, refuse unsafe deletion and keep Invoice DRAFT. State/event
graphs are retained. No claim is made that these guards change core-pay's
separate authorization API; the preparation flow does not call that API.

Deployment and verification completed on dev-1 with V9 / Script 737 and V5 /
Script 738. Script importer readback reports two unchanged sources and zero
drift; the combined Form/Order/OrderItem/Invoice workflow plan has changeCount 0.
The 92 TAX records, STANDARD InvoiceType, complete FormType 6 (optimistic 3,
eleven attributes/three groups), seven ProductTypes and six ProductPriceTypes
are unchanged. Persisted SYSTEM role assignments are also unchanged.

`check-dev1.mjs --apply --invoice-only` exited 0 for run `ec9ffb31`, using native
anonymous one-time links and SYSTEM execution without administrator roles:

| Scenario | Native subtotal | Configured rate | Native tax | DRAFT Invoice amount | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| CA BC monthly | 768.50 | 12% | 92.22 | 860.72 | EXACT_MINOR_UNITS |
| CA QC yearly | 6453.80 | 14.975% | 966.45655 | 7420.25655 | ROUNDING_POLICY_REQUIRED |
| US AK monthly | 604.85 | explicit 0% | 0 | 604.85 | EXACT_MINOR_UNITS |
| US NY monthly | — | missing configuration | — | no Invoice | TAX_CONFIGURATION_REQUIRED |

Rates in this table are the existing dev-1 configuration, not a tax-law review.
Every invoice references all three original OrderItems and stays DRAFT/unpaid.
Concurrent confirmation, repeated preparation and lost CMS receipt recovery
reuse the same Invoice/items. Forged request amount/tax/invoice IDs are ignored.
Prepared item quantity changes, invoice item subset replacement, Invoice Submit
and unsafe Invoice/Order deletion were refused without altering the records.

The first integration attempts exposed immutable state collections during the
second save of a newly created Order. New Orders now initialize their existing
workflow/DRAFT state with a mutable set, matching the OrderItem creation
pattern; all cases above then passed. New entity metadata and the in-memory
service principal's empty roles are also mutable without saving User changes.

Cleanup removed four Forms, four Accounts, four Orders, twelve OrderItems,
three Invoices, four Addresses and both temporary test Scripts. Independent
readback found zero remaining records in each run scope. No real emails or
payment API calls were made. Earlier failed diagnostic runs were also cleaned.
Local JSON parsing, JavaScript syntax, exact tax-hook prefix and all eleven
CMS source-digest checks passed.

## Add-on deployment — 2026-10-19

FormType 6 was optimistically updated once (2 → 3), changing only attributes
and attributeOrder. Readback confirms the original nine definitions and all
other settings were preserved; only SITE_EXPANSION_PACKS and
WEATHER_PROPERTY_COUNT were added to ADDONS. API attribute array ordering is
normalized by the server, so definition comparison sorts by code while keeping
attributeOrder exact.

Scripts 729/730 compile natively. Workflow 69 points to V8 and all eleven hook
source comments match SHA256 prefix `61fd474f6e60`. After apply, workflow plan
reports changeCount 0. CONFIRM_PURCHASE still targets
PURCHASE_CONFIRMATION_RECEIVED. Item workflow 67 is unchanged. Order workflow
66 retains the original seven states / ten event edges, the same DRAFT exit
guard and the exact existing tax onUpdate script. Seven ProductTypes and six
ProductPriceTypes exactly match the pre-change catalog readback. No production
requests or writes were used.

Six read-only billing previews (Foundation/Growth/Business × MONTHLY/YEARLY)
passed: one plan + two expansion packs + Weather on three Properties, with
native catalog price IDs/currencies and independently summed expected amounts.
USD subtotals respectively: Foundation 364.85 / 3980.20; Growth 754.85 / 8160.20;
Business 1304.85 / 13460.20. Capacity comes from included Properties + pack COUNT,
and routingOptimizationIncluded follows the plan flag; no Routing credits
are bought or invented. totalPayable stays null in every preview.

Anonymous-token integration exercised all ten new rejection cases (missing,
negative/fractional/orphan quantities, incompatible expansion, Weather over
capacity, old/new Routing and Custom Reports). No rejected selection issued a
verification token. Quantities participate in the immutable input digest.
The existing token replay/concurrency/expiry, forged-input and consent guards
also ran. Anonymous concurrent confirmation created one CUSTOMER and one DRAFT
with three lines, under SYSTEM with administrator=false on CMS and billing.
Lost CMS receipt recovery returned the same three IDs. A mismatched empty-draft
snapshot was refused; matching recovery recreated the complete selection once.
The existing Submit guard kept the order DRAFT without an Invoice.

Run `75331d7d` verified native monthly charges 768.50 USD (Growth 1, expansion 2,
Weather 10) and yearly 6453.80 USD (Growth 1, expansion 1, Weather 7), all exact
catalog ProductPrices/unit amounts and explicit native itemCounts. The yearly
contact inputs and independent Form/account identity were preserved.
The main checker reached its final account-scope read after these business
assertions, then OAuth renewal hit a connect timeout; its automatic cleanup
could not authenticate. This is not recorded as an exit-zero checker run.
A fresh-session continuation verified two separate accounts/orders, all six
native lines/amounts, DRAFT states and an unchanged complete FormType, without
replaying a purchase mutation. The checker now retains its existing bearer on
failed proactive renewal, avoids recursive refresh and closes OAuth connections;
it reports the run label/passed checks before cleanup for explicit recovery.

Scoped cleanup under the fresh session deleted exactly 14 synthetic Forms,
two CUSTOMER Accounts, two Orders, six remaining OrderItems, two Addresses and
two temporary test Scripts; the earlier legacy-empty fixture also removed the
original three monthly lines through native orphan removal. Real emails sent: 0.
The failed initial short-wait run had already cleaned its own fixtures.
All scripts/types/workflows deployed for the business flow remain in place.
Final independent readback exited zero and confirmed no synthetic Forms, scoped
Accounts, Orders, OrderItems, Addresses or test helpers remain.

## Base-plan OrderItem — 2026-10-19

The user approved materializing only the selected base plan while retaining
DRAFT and the payment guard; add-ons await the team's model. Current sources
are PLAN_SUBSCRIPTION_WORKFLOW_V7 and PLAN_SUBSCRIPTION_DRAFT_V3. Earlier V6/V2
evidence below describes the preceding empty-draft implementation.

- Reuse existing SERVICEWAND_SUBSCRIPTION_ITEM (6) and its existing workflow
  SERVICEWAND_ORDER_ITEM_LIFECYCLE (67), initial DRAFT (332). No type changes.
- The line links the selected monthly/yearly catalog ProductPrice, itemCount
  1 for the single scalar PLAN_PRODUCT, and the exact catalog amount. There
  is no manual override and no monthly x 12 conversion for the plan itself.
  Accept Licensed PER_UNIT_RECURRENT pricing with no additional FIXED_FEE;
  unsupported base-plan charging contracts stop for review.
- Account, Order and base-plan item share the existing transaction/advisory
  lock. The item stores Form/input/Checkout correlation, product/price,
  billing period, catalog amount/currency and SINGLE_SELECTED_PLAN in metadata.
- The receipt adds basePlanItemId, basePlanPriceId, basePlanAmount and
  basePlanPricingStatus=CATALOG_PLAN_ONLY. CMS requires the item ID before
  entering DRAFT_ORDER_READY. A lost CMS receipt recovers the existing item;
  unexpected lines or a different quantity/amount/price/owner stop recovery.
- An explicit same-Form retry can fill a legacy empty draft only when its
  saved plan preview and the current confirmed catalog fingerprint match.
  Existing lines are never silently repriced and there is no bulk backfill.
- Order metadata retains draftOnly=true and itemsMaterialized=false, and adds
  basePlanMaterialized=true plus basePlanPricingStatus=CATALOG_PLAN_ONLY.
  Only the base-plan charge contributes to native totalCharges. Add-ons remain
  selected in metadata with no invented quantities/lines. The existing tax hook
  is preserved; native taxes/grandTotal remain provisional, not payable totals.
  The Order DRAFT exit guard is unchanged and no Invoice/Payment is created.

The first verification run stopped at intake before any Account/Order/item
creation: the Form remained SUBMITTED with NOT_PREPARED. A separate reserved
recipient smoke reproduced it. The initial hook synchronously opened a new
transaction from runAfterTx while the committing thread could still hold
the Form lock. V7 now starts preparation on a separate virtual thread from
that callback, preserving the captured Auth context and reading the Form ID
after commit. The next native anonymous smoke reached AWAITING_EMAIL and
SUPPRESSED_FOR_DEV_TEST, then removed its Form and Address. This narrowly
scoped intake repair does not change the FormType, input or token policy.

Deployed on dev-1: Form workflow 69 now binds WORKFLOW_V7 (Script 717), which
uses DRAFT_V3 (Script 718). Native compilation succeeded for both helpers;
the revised V7 intake source also compiled after its callback repair.
The Script seed readback reports two unchanged scripts, and the Form workflow
plan reports zero differences, seven states and six events. The existing Order
DRAFT guard, tax onUpdate hook, seven states and ten event edges were read back
directly and match their existing sources; no Order workflow write was made.

The final `check-dev1.mjs --apply --purchase-only` run passed **18 checks**:
native intake/address/token protection, automatic SYSTEM Checkout and purchase
without administrator roles, expired/stale/forged/direct confirmation refusal,
concurrent one-time confirmation, the monthly catalog-priced base-plan line,
lost CMS receipt recovery without duplicate items, refusal of a mismatched
saved preview, explicit matching legacy empty-draft upgrade and repeat reuse,
Submit remaining DRAFT with no Invoice, and the yearly line using its actual
annual catalog price. Both periods used Growth; monthly 449 USD and annual
4490 USD were checked against their native ProductPrices and totalCharges.
The annual case also preserved supplied names/phone and remained a separate
purchase despite the same email. Selected add-ons produced no line or guessed
quantity. Native HTTP status limitations remain as documented below.

Final-run cleanup deleted six Forms, two CUSTOMER Accounts, two Orders, two
remaining OrderItems and two Addresses, plus both temporary test helpers. The
old item replaced by the legacy fixture was separately confirmed deleted by
native orphan removal. Real emails sent: zero. The first unsuccessful run
and intake smokes were cleaned; an expired local test session later left one
temporary helper for run 84f681a8, removed with a fresh session (no Forms,
Accounts, Orders or Addresses existed for that run). A test-fixture-only
partial CRUD replacement of Order.items returned HTTP 500; it was replaced
by the narrowly scoped temporary managed-collection helper. No production
workflow behavior was changed for that fixture repair.

Post-cleanup readbacks passed: FormType, AccountType, OrderType, OrderItemType
and InvoiceType are unchanged from the fresh pre-stage snapshots. The Form
helper/confirmation target, existing item workflow and Order guard/tax/event
edges were checked again; no reserved synthetic Forms remained. UI and entity types were not
modified. Compatibility/quantities/capacity, Weather/Routing contracts, final
tax/payable totals, Invoice/Stripe/provisioning and actual email delivery
remain outside this base-plan stage.

## Team catalog update readback — 2026-10-19, 12:07 UTC

The user reported that the team populated the model and requested a fresh
check. They explicitly retained per-add-on quantities as our Form follow-up;
the quantity gap is not a request to the product team. This pass used read-only
dev-1 API requests. No server type, Form, product, price or workflow was saved.
Unrelated working-tree changes were left untouched.

Authenticated SERVICEWAND readback now returns 17 Products and 22 prices.
Anonymous public readback returns HTTP 200 for the 13 priced Products and
HTTP 404 for the four new unpriced Products 52–55. Price comparison returns
22 rows for those 13 priced Products, including the still-public legacy
routing rows. Readiness therefore requires plan membership plus actual
public availability and a valid price; membership alone is insufficient.
The team changed SERVICEWAND_SAAS to optimistic 4, added feature attributes
and changed some display flags to strings. These are observed team edits,
not type extensions performed by this task.

**Compatibility is populated in the direction plan → add-ons**, not the
previously proposed add-on → plan direction. All referenced IDs exist:

| Plan | COMPATIBILITY |
| --- | --- |
| Foundation (38) | Foundation Site Expansion (40), Weather Intelligence (41) |
| Growth (43) | Growth Site Expansion (47), Weather (41), new Growth Route Credits (52) |
| Business (44) | Business Site Expansion (46), Weather (41), new Business Route Credits (53), Custom Reports (55) |
| Enterprise (45) | Weather (41), new Enterprise Route Credits (54), Custom Reports (55) |

Enterprise remains sales-only. Add-ons themselves need no reverse lists for
this observed directional contract. A future validator should check membership
in the selected plan's list; it must not use the old proposed suffix matrix
or silently infer compatibility for unrelated priced legacy products.

Updated USD catalog facts:

| Product | Included / expansion count | Monthly | Yearly |
| --- | --- | --- | --- |
| Foundation plan | Included `50` | 199 | 1990 |
| Growth plan | Included `200` | 449 | 4490 |
| Business plan | Included `500` | 1099 | 10990 |
| Foundation Site Expansion | Typed COUNT 50 per block | 80 | 960 |
| Growth Site Expansion | Typed COUNT 100 per block | 150 | 1800 |
| Business Site Expansion | Typed COUNT 100 per block | 100 | 1200 |
| Weather Intelligence | Per customer-selected Active Property | 1.95 | 23.40 |

All three expansions now have annual price rows. Weather's annual catalog
amount equals monthly × 12, resolving the earlier 20-versus-24 discrepancy
with a newly changed monthly price. Its description explicitly says billing
applies only to Active Properties selected by the customer. Prices remain
Licensed PER_UNIT_RECURRENT. The single selected base plan uses its own
annual catalog price, not the add-on ×12 rule.

Remaining model boundaries:

- Included allowances are still String attributes but now contain exact digit
  values 50/200/500 for self-service plans. Expansion increments are typed
  integers. Maximum totals 500/1000/2000 occur only in EXPANSION_PACK and
  descriptions; no structured maximum-capacity attribute exists in the read
  types/products. Do not extract validation ceilings from that prose. The
  previous Foundation 150 / Growth 450-or-500 values are superseded as display
  facts by the team's new copy, not implemented as workflow constants.
- New routing Products 52/53/54 are FEATURE_ADD_ON with ENABLED=true and **no
  ProductPrices**. Their descriptions explicitly defer credit units,
  consumption, allowance, pack sizes, pricing, rollover and expiry until usage
  testing, and explicitly avoid a fixed conversion to solver hours. The plan
  feature text also says TBD. Routing eligibility/SKU linkage is clearer;
  a billable routing contract is still absent.
- Old routing Products 42 and 48–51 and their old prices remain in the
  authenticated catalog but are absent from every populated plan list. Their
  9.9 + fixed fees / 5–3 rates and COUNT HOUR/MONTH values must not be reused
  as the new products' billing contract.
- New Custom Reports (55) is compatible with Business/Enterprise, has no
  ProductPrice and explicitly uses scope/pricing by agreement. Compatibility
  alone cannot admit this product to automatically priced checkout.
- The Form remains nine fields with scalar PLAN_PRODUCT and ID-only
  ADDON_PRODUCTS. Purchased expansion-block / selected-Property quantities
  will be added separately with the user, without inventing a count of one.

This readback establishes data readiness for compatibility lookup and
expansion/Weather prices. Quantity input, structured capacity ceilings and
the deferred routing contract still gate a complete priced selection. Existing
workflow helpers remain V7/V3, DRAFT-only; this audit does not implement new
add-on validation or materialize their OrderItems.

## Catalog readiness for OrderItems — 2026-10-19 (before team update)

Fresh read-only audit of dev-1 in the SERVICEWAND selling context. Read all
13 Products, 20 ProductPrices, seven visible ProductTypes, six PriceTypes,
the current FormType and OrderItemType, and SYSTEM units. No product, price,
type, workflow or business record was saved; production was not accessed.
These are observed catalog facts, not newly approved business rules.
Anonymous public Product detail requests also returned all 13 Products;
the public price-comparison endpoint returned the same 20 price IDs, including
all six self-service plan prices. SYSTEM Dictionary 17 resolves to USD.

The three self-service plans have one PER_UNIT_RECURRENT / Licensed price
for each requested period, using currency reference 17 (USD):

| Plan | Product ID | Monthly | Yearly | Price IDs, month / year |
| --- | --- | --- | --- | --- |
| Foundation | 38 | 99 | 990 | 242 / 246 |
| Growth | 43 | 449 | 4490 | 251 / 254 |
| Business (`SERVICEWAND_PROFESSIONAL`) | 44 | 1099 | 10990 | 252 / 255 |

Enterprise remains sales-only even though catalog price rows contain the
sentinel amount 2147483647. That amount must never become a payable line.

| Add-on | Observed data | Remaining dependency |
| --- | --- | --- |
| Foundation Site Expansion (40) | COUNT 25; 99/month, 1188/year | Compatible plans, purchased pack count, structured plan capacity ceiling |
| Growth Site Expansion (47) | COUNT 50; 89/month; no annual row | Same dependencies; the approved monthly x 12 rule would yield 1068/year |
| Business Site Expansion (46) | COUNT 100; 149/month; no annual row | Same dependencies; the approved monthly x 12 rule would yield 1788/year |
| Weather Intelligence (41) | Licensed, 2/month and 20/year; price IDs 247/248 | Property quantity source, billing basis, and annual rule: catalog 20 differs from monthly x 12 = 24 |
| Route Optimization Credits (42) | Metered; monthly FIXED_FEE 95 plus UNIT_PRICE 9.9, annual FIXED_FEE 950 plus UNIT_PRICE 9.9; Product COUNT 10 HOUR | Which routing product is sold, usage unit/source/aggregation, charge timing and meaning of COUNT/fixed fee |
| Plan-specific Routing expansions (48–51) | PER_UNIT rates 5 / 4.5 / 4 / 3; Product COUNT 10 / 20 / 30 / 100; first two use MONTH, last two have no unit | Same routing contract plus compatibility; these are different products from Product 42 |

`COMPATIBILITY` already exists on SERVICEWAND_ORDERED_PRODUCT (20) as a
multiselect Product reference, inherited by the plan/add-on types. **None of
the 13 Products has a populated COMPATIBILITY value.** The schema alone does
not define the direction of the relation, whether it is symmetric, or what an
absent value means. The earlier recommended add-on-to-plan direction remains
unconfirmed. Do not derive a rejection matrix from product names.

Expansion increments are typed integers, but plan allowances are still
`ACTIVE_PROPERTIES_INCLUDED` strings: `25`, `200 +`, `500 +`, `1000 +`.
No structured maximum-capacity attribute exists in the read types. Growth
copy disagrees internally: EXPANSION_PACK says up to 450 while its card says
up to 500. Foundation EXPANSION_PACK still advertises 49 although the actual
ProductPrice is the user-approved 99. These display strings must not supply
capacity validation or monetary amounts. ROUTE_OPTIMIZATION is true on
Growth, Business and Enterprise; Foundation has no true value. This flag
does not identify which routing SKU or rate applies.

PLAN_SUBSCRIPTION remains nine attributes, with ADDON_PRODUCTS holding only
selected IDs and no per-product quantity or Property count. The existing
SERVICEWAND_SUBSCRIPTION_ITEM type (6, optimistic 1) has no custom attributes.
An existing OrderItem type does not provide the missing input quantity or
usage contract. No implicit add-on quantity of one is approved.

**Readiness:** catalog data and the single selected plan are sufficient for
a base-plan draft line at its actual catalog monthly/yearly amount, subject
to native line calculation checks during implementation. Compatibility,
quantity and usage gaps block complete add-on lines. Submit/payable totals
also require the separately pending tax contract. The audit did not create
OrderItems, enable Submit, alter the DRAFT guard, or deploy new workflow code.

This audit identified base-plan OrderItems with DRAFT/payment guard retained
as the next implementable scope; the user then approved the implementation
documented above. To include add-ons, the team must populate/define
COMPATIBILITY and structured capacity data, choose the quantity source, and
settle Weather annual pricing and the routing usage contract. Any required
type extension still needs explicit user authorization.

## Buyer access through two FormTokens — 2026-10-18

The user authorized system execution before User creation, access bound to the
verified Form through Magic Link, no UI/type changes, and explicitly chose a
second email for purchase review and confirmation. This replaces the earlier
proposal to require a new API or create a buyer User before payment.

Implementation: PLAN_SUBSCRIPTION_WORKFLOW_V6 (Script 709) and
PLAN_SUBSCRIPTION_DRAFT_V2 (Script 710), deployed and compiled on dev-1.
The scoped API integration suite passed all 16 checks described below.

- First one-time token: VERIFY_EMAIL. Once the verified state commits, SYSTEM
  prepares Checkout automatically. No Account or Order is created at this step.
- Second one-time token: CONFIRM_PURCHASE. A separate simple email reviews
  company/contact data, named plan/add-ons, period and catalog plan amount.
  Pending add-on/quantity/tax/final-total rules and draft-only confirmation are
  explicit; no charge is implied. Each link has its own 24-hour lifetime.
- The native token endpoint resolves Form and event from the stored token.
  The hook reads persisted inputs/email/Checkout and checks token ownership,
  native consumption, snapshot binding and expiry. Request context supplies
  no authoritative purchase data. Direct events cannot substitute for the link.
- Added workflow state PURCHASE_CONFIRMATION_RECEIVED and DRAFT_PREPARED event
  retain committed consent before the asynchronous billing action. The worker
  creates or recovers the same CUSTOMER/DRAFT using existing advisory locking
  and deterministic correlation, then advances to DRAFT_ORDER_READY.
- The service principal uses the real native system User ID, SERVICEWAND scope
  and an empty in-memory role set. Both CMS and billing compare actual identity;
  Auth.isSystemUser() alone is unsuitable because it checks organization scope.
  No buyer User or persisted role/permission assignment is added. The buyer
  receives no generic Script or ordinary CRUD authority, and no SYSTEM_ADMIN role is required for
  the automatic service path.
- Generic Script commands remain protected operator/reconciliation tools.
  confirmPurchase now requires the saved one-time consent too. Native public
  token responses return a Form ID; this stage supplies email review, not a
  public JSON read API for Checkout. A future UI needs its own read contract.
- Tagged API remains useful once a buyer User exists. The local TAGGED_ACCESS
  guide requires authentication and distinguishes tokens/AccessGrant. The team
  also confirmed independent OrderItem tags and that tagged write does not
  enforce address-only mappings. These mechanisms are not changed here.

Verification used `check-dev1.mjs --apply --purchase-only` against the real
anonymous Form submit/send-event endpoints. It checked automatic SYSTEM Checkout
with administrator flag false, the second token's own 24-hour lifetime, refusal
of direct/expired/stale confirmations, and concurrent GET/POST confirmation with
one consent transition, one ready transition and one CUSTOMER/Order pair. Forged
request Form/organization/contact/price/metadata values did not retarget or alter
the purchase; the yearly POST case exercised that explicitly. CMS and billing
both recorded SYSTEM execution with administrator flags false.

The suite also verified monthly/yearly catalog prices, preserved optional
contact fields and BILLING+LEGAL Address, lost-receipt recovery without duplicate
entities, and Submit refusal with no Invoice. It deleted six synthetic Forms,
two Accounts, two Orders, two Addresses and its temporary helper. Both mail
stages were suppressed for the reserved example.invalid recipient; zero real
emails were sent, so actual transport/inbox delivery remains untested.

Earlier interrupted checks were not counted as passes: a test assertion
incorrectly expected an explicit null in persisted JSON, and network failures
interrupted other reads/cleanup. The assertion now accepts absence of the
pending total, without fabricating a payable value. A scoped cleanup removed
the two remaining synthetic Addresses from the interrupted run; the final
diagnostic sweep also removed one leftover unbound temporary probe Script. Mutation
requests, including GET token links, are never replayed after an ambiguous sent
request; only pre-request connection failures and known reads are retryable.

Five live type snapshots matched their pre-stage captures, the Script seed
plan reported both records unchanged, and the Form/Order workflow plans had
zero differences.
The existing importer failed to replace CONFIRM_PURCHASE's old target; the
strict administrator-only temporary reconciliation helper changed only that
owned edge through IWorkflowManager, was removed afterwards, and a fresh plan
confirmed the target PURCHASE_CONFIRMATION_RECEIVED with zero drift. Workflow
69 now has seven states and six events; no type or UI was changed.

Core's existing HTTP outcome/replay limitations and simple-mail delivery
limitations still apply. Explicit operator reconciliation can recover a
committed remote purchase; no automatic resend or replacement policy is added.
The final payable OrderItems/Invoice/Stripe stage remains gated by the product
model and calculation contract.

## Initial operator Checkout, CUSTOMER and draft Order — 2026-10-18

Historical operator stage; buyer continuation is now implemented by the two-token
system flow above. The draft-only billing boundary and idempotency below remain.

The user authorized closing Checkout preparation, purchase confirmation,
company Account creation and a linked draft subscription Order. They selected
the existing AccountType CUSTOMER. UI, type extensions, final add-on quantities,
Submit/Invoice/Stripe and customer-organization provisioning remain outside this
stage. The local portable FormType and server type are unchanged.

- CMS helper PLAN_SUBSCRIPTION_WORKFLOW_V5 (Script 681) exposes administrator-only
  prepareCheckout(formId) and confirmPurchase(formId, checkoutDigest). States:
  EMAIL_VERIFIED_MODEL_PENDING → CHECKOUT_PREPARED → DRAFT_ORDER_READY.
- Preparation rechecks the verified immutable inputs, saved Address and current
  public products. The billing helper resolves one matching catalog plan price
  and its currency for the requested period. The snapshot preserves selected
  add-ons, but compatibility/quantity remain DEFERRED_MODEL_PENDING, taxes are
  NOT_CALCULATED and totalPayable is null. Preparation creates no purchase.
- Explicit confirmation calls PLAN_SUBSCRIPTION_DRAFT_V1 (Script 682) on a
  CORE/CORE-ACCT/CORE-PIM/CORE-BILL node. It creates a CUSTOMER with PRIMARY
  contact entries and one Address link marked BILLING and LEGAL; optional names
  and phone are not invented. It creates a SERVICEWAND_SUBSCRIPTION Order in
  DRAFT and links source Form, Account, Address and confirmed snapshot through
  existing metadata.
- The draft has no materialized OrderItems: selected Products and plan preview
  remain in metadata until the team supplies quantity/pricing rules. This is
  a saved preparation record, not a payable zero-total purchase.
- A per-seller/Form PostgreSQL advisory transaction lock serializes billing
  retries. Account and Order share one transaction. Deterministic correlation
  and receipts recover a billing commit if CMS lost the returned links. Separate
  Forms are separate purchases and are not merged by email.
- Script queue submission commits independently before the CMS Form-lock
  transaction polls the remote result. Native Auth system-admin checks are run
  with fresh records of the same caller in SYSTEM scope, avoiding detached
  role-organization references and seller-scope role filtering. The actual
  global SYSTEM_ADMIN membership is required; no substituted user is used.
- The existing SERVICEWAND_SUDSCRIPTION_LIFECYCLE DRAFT.onExit refuses Orders
  marked PLAN_SUBSCRIPTION.draftOnly. The guard seed uses the existing importer
  and preserves the tax onUpdate handler, labels, states and all ten events.
  A minimal nested partial-state save was rejected and rolled back by Core's
  not-null constraints; readback confirmed no change before using the importer.
- These are protected backend/operator commands. The future anonymous buyer's
  scoped Checkout access and Stripe authorization contract remain separate;
  knowledge of Form ID or a consumed email token does not grant access.
- The full scoped integration suite passed all 37 checks on dev-1. It verified
  monthly/yearly catalog snapshots, refusal of unverified/stale confirmations,
  concurrent confirmation returning one CUSTOMER/Order pair, correct contact
  data and BILLING+LEGAL address links, recovery after clearing the CMS receipt,
  a real native Submit attempt remaining in DRAFT, and no resulting Invoice.
  The existing 30 intake/address/token checks also passed. The suite deleted
  all 20 synthetic Forms, two Accounts, two Orders, four Addresses and its
  temporary helper; no real email was sent.
- Readbacks of FormType, AccountType, OrderType, OrderItemType and InvoiceType
  match their pre-stage snapshots. FormType remains optimistic 2. Existing
  subscription tax code, states, labels and events match the pre-guard snapshot
  except for the intended DRAFT exit hook. Source-state exit guards on the Form
  require the prepared snapshot and saved draft receipt before transitions.
- Core Script JSON numeric arguments arrive as Integer; the public Form ID
  parameters use that signature and convert to the native Long ID internally.
  The separate `--purchase-only` checker mode exercises the new stage quickly;
  the 37-check result above is from the full default run.

## Native COMPANY_ADDRESS resolution — 2026-10-18

The user authorized address resolution following Quotation, without UI or type
changes. The implementation copies the formatted-address parser from
WINTER_SERVICE_QUOTATION_CREATOR_V9 and uses the existing
IAddressService.resolveOrCreate contract. Country/state references are looked up
in the Core dictionaries. No new FormType, AddressType or product type is needed.

- Resolve after catalog validation and before issuing the FormToken, within the
  same preparation transaction. Require street, country, city and postal code;
  CA/US additionally require a recognized province/state and postal syntax.
- Preserve COMPANY_ADDRESS verbatim in the Form. Store the resolved addressId,
  components, sourceDigest and resolvedAt under the existing Form metadata at
  PLAN_SUBSCRIPTION.companyAddress. The result is explicitly COMPONENTS_ONLY.
- The native service handles Address reuse/creation and unit-aware matching.
  It does not call Google. Read-only inspection of the deployed AddressService
  confirmed that getGeoLocation is separate; Google parsing updates postal/geo
  data and does not provide the complete country/city/state extraction contract
  assumed in the team discussion. No geographic-validation success is claimed.
- Missing/unparseable components or a resolver error produce PREPARATION_FAILED
  without a verification token or email. Email confirmation also checks that
  the resolved marker belongs to the current COMPANY_ADDRESS digest.
- Future Account billing/legal and sample Property steps should reuse addressId;
  physical-address, geographic ambiguity and final tax checks remain separate.
- The preflight read found no existing PLAN_SUBSCRIPTION Forms. FormType ID 6
  remains at optimistic 2, with nine attributes and three groups. This change
  updates helper/workflow sources only, with helper V4 (Script 675) to avoid
  previously observed cached bindings. Earlier V3 evidence below is historical.
- All 30 scoped API integration checks passed with V4 active: native Address
  persistence and reuse, equivalent/different units, CA and US extraction,
  leading-zero US ZIP, missing/invalid components and country/postal conflicts,
  immutable submitted text/email and verification refusing a removed resolution
  marker. Existing expiry, replay, concurrency and product checks also passed.
- The suite deleted its 20 synthetic Forms, four run-scoped Addresses and the
  temporary test helper. No real email or Google geocoding request was issued
  by this implementation. Full live FormType snapshots matched before/after.

## Single-address update — 2026-10-18

The user explicitly authorized removing the entire BILLING_DETAILS group and
retaining COMPANY_ADDRESS as the only address, together with the workflow
validation change and deployment to dev-1.

- Removed BILLING_ADDRESS, BILLING_COUNTRY, BILLING_REGION, BILLING_CITY and
  BILLING_POSTAL_CODE from attributes and attributeOrder; removed their group.
  BILLING_PERIOD remains unchanged in PLAN_SELECTION.
- The helper's required-field, string-validation and input-digest field lists
  now use the nine surviving attributes. No removed billing field is read.
  COMPANY_ADDRESS remains required and protected against edits after submission.
- Geocoding and country/region/postal validation belong to the operational
  address-resolution stage before payment. The email-confirmation stage does
  not claim to validate the address geographically or establish jurisdiction.
- Before the update, dev-1 had no PLAN_SUBSCRIPTION Forms, so no pending token
  or existing input digest required migration.
- FormType ID 6 was updated using an optimistic partial save of attributes,
  attributeGroups and attributeOrder only: optimistic 1 became 2, with nine
  attributes and three groups. Readback verified every surviving definition,
  ordering, permissions, labels, owner and workflow association.
- Workflow ID 69 now uses helper PLAN_SUBSCRIPTION_WORKFLOW_V3, Script 671.
  The helper and its four hook digests were updated together. Updating V2 in
  place left the first synthetic Form in SUBMITTED/NOT_PREPARED despite the new
  nine-field input digest. A distinct helper version isolates the refreshed
  workflow binding without clearing unrelated runtime caches. Token lifetime,
  states/events and pending product-model boundary are unchanged.
- With V3 active, all 19 scoped integration checks passed against dev-1:
  anonymous submission with only COMPANY_ADDRESS, native confirmation and
  consumption, 24-hour expiry, replay, concurrent use, malformed input and
  product rejection. Missing, blank, non-string, control-character and oversized
  company addresses were rejected. The submitted address text was preserved;
  authenticated email and address edits were rejected without changing saved
  values. Nine synthetic Forms and the temporary helper were deleted. No real
  email was sent. Native HTTP status limitations remain as documented below.
- Final Script/workflow seed plans report no differences. FormType ID 6 is at
  optimistic 2 and still references workflow 69; the tests did not change it.

## Client-input coverage audit — 2026-10-16

Historical audit of the original 14-field definition. Its separate billing
inputs were superseded by the single-address decision on 2026-10-18; the
server-side responsibilities remain.

Compared the full purchase/provisioning/first-login/error-recovery brief and
the subsequent clarifications against the authored definition and the current
dev-1 type (ID `6`, optimistic `0`). The authenticated readback still matches
all 14 attributes and four groups. No missing client field was found for the
explicitly specified first-purchase scenario. This is a requirements and
schema audit, not an execution of the future workflow.

| Brief steps | Client inputs already captured | Server/catalog/template responsibility |
| --- | --- | --- |
| 1–3: choose and submit | `PLAN_PRODUCT`, `BILLING_PERIOD`, optional `ADDON_PRODUCTS`, company/contact/billing fields | Preselection, product resolution, current availability and compatibility validation, persisted Form |
| 4: verify email | `EMAIL` | Issue the one-time link, record verification against the exact email and purchase, create the checkout continuation |
| 5: review and edit | The same purchase/company/contact/billing fields | Resolve current prices, currency and taxes; revalidate changes and refresh the quote before payment |
| 6: company Account | `COMPANY_NAME`, `EMAIL`, optional contact name/phone, addresses | Seller-side Account type, contact/address creation and identity/linkage |
| 7–10: Order, Invoice, payment | Product selection, billing period, billing address and email | Order/item/invoice types, price/tax snapshot, Stripe configuration, webhook correlation and paid/active transitions |
| 11: customer organization and entitlements | `COMPANY_NAME`, `BILLING_COUNTRY`, product selection and period | Resolve CA/US parent, organization type/code, activate purchased capabilities and link seller Account/Order |
| 13: System Ledger Account | No additional client input | Resolve ledger type and create one account in the new organization |
| 14: administrator | `EMAIL`, optional `FIRST_NAME` / `LAST_NAME` | Generate username/password, assign organization and administrative role |
| 15: Customer 1 | No additional client input | Use the example name and configured customer Account type in the new organization |
| 16: sample Property | `COMPANY_ADDRESS` | Resolve/create Address, choose Property type, apply demo defaults and link Customer 1 |
| 17: sample contract | No additional client input is specified in the brief | Choose contract template/type/status/defaults, link Customer 1 and organization, decide Property linkage |
| 18–21: readiness, emails, first login | The same `EMAIL` | Verify links/entitlements, send readiness and access emails, supply login URL and onboarding content |
| Error/retry scenarios | Existing saved purchase/contact inputs | Persist entity links and progress, consume/revoke grants, deduplicate payment/provisioning, resume and resend |

Card details and any additional payment authentication are collected by Stripe
at payment time; they are not FormType attributes. No second administrator email
is required by this scenario: the contact email is the recipient of the link,
readiness notification and access message, and the administrator's email.
Giving the account to a different administrator would be a new requirement.

The following conditions must be explicit when implementing the workflow:

- Optional first/last name and phone remain optional through Account and User
  creation. A display label can use the company name or verified email when
  personal names are absent; do not invent a person's name or borrow
  `GET_QUOTE_` validation that requires a phone or contact role.
- `COMPANY_ADDRESS` must be a complete, resolvable address. Since it is text,
  `required: true` alone does not prove it can produce an operational Address.
  Detect missing/ambiguous addresses before taking payment and let the buyer
  correct the existing field. Billing components must agree with their address.
- If Checkout changes `EMAIL`, its old verification no longer authorizes the
  new address. Require verification of the replacement email before proceeding.
- The selected Property and contract types may have required fields beyond
  those named in the brief. Audit their effective inherited attributes when
  selecting templates and set explicit demo defaults. For example, the local
  `core-types/resource-type/SNOW_REMOVAL_PROPERTY.154.json` snapshot marks
  `SITE_SERVICE_DURATION` required. That snapshot is evidence of a template
  dependency, not a verified current choice for this flow. Do not invent an
  operational value or assume the address alone satisfies every Property type.
- Seller configuration supplies currency, tax/compatibility rules, parent
  organizations, types, roles, templates and email/login destinations. Those
  are implementation dependencies, not missing buyer answers.

The brief leaves full operational-readiness settings, the sample contract's
required fields, and renewal/cancellation behavior undefined. Therefore the
audit establishes coverage of the described minimum starter set only; a later
requirement for real operational data may change that conclusion. No live
schema changes or form submissions were needed for this audit.

## First-stage workflow investigation — 2026-10-16

Scope: validate a submitted PLAN_SUBSCRIPTION and confirm its contact email
through a one-time link before Checkout. Do not extend types without the user's
permission. The user deferred creating/selecting the email template while the
existing library is inspected. No workflow has been created or attached yet.

### Email confirmation mechanism

The authenticated read of Core Script `FORM_TOKEN_ANONYMOUS_ACTIONS` (ID `113`)
and `FORM_API_REFERENCE` (ID `103`) identified a native `FormToken` for one
anonymous workflow action. The documented use is:

```text
FormToken: form + eventCode + token + usedAt
POST /core-cms/api/form/send-event/{token}.json
200 = event succeeded; 400 = required metadata missing;
404 = token unknown; 410 = token already consumed.
```

The generated core-ui Core CMS API description declares both GET (link) and
POST variants of that anonymous send-event route, returning the Form ID on
success. Read-only inspection of the deployed CMS classes confirmed
FormToken setters for form, token and eventCode; getUsedAt/isUsed; and
IFormTokenManager.save/getByToken. The inspected diagnostic Script matched the
local read-only reflection source (apart from its final newline). No tokens or
Forms were created by this inspection. Token issuance integration, expiry
support and concurrent-use behavior still need verification.

The previous probe of `/core-cms/api/grant/mappings.json` returned
`Entity type Form is not grantable`. That is an AccessGrant limitation, not
evidence that email confirmation requires adding grantability to Form.
`FormToken` is an existing entity, not a proposed new FormType attribute.
Its confirmation event must target only the saved purchase and its validated
email; token success alone does not supply the later Checkout access contract.

The ServiceWand-visible email-template inventory includes
`SIMPLE_MAIL_TEMPLATE` (ID `1`, SYSTEM, Velocity), whose content is
`SUBJ: $SUBJECT` followed by `$BODY`. The other visible templates concern
passwords, execution notifications, reports and winter-service quotations or
agreements. A dedicated subscription-confirmation template was not found in
that inventory. No existing template has been selected, changed or sent.

### Link lifetime and compatibility follow-up — 2026-10-16

The user selected a link lifetime of one day: 24 hours from token issuance.
The confirmation event must reject an expired link without confirming the
email. The duration should be configurable so it can be revised later. This
is an agreed behavior, not a deployed expiry implementation; use existing
contracts where possible and obtain permission before extending any type.
The policy for invalidating an earlier link on resend remains undecided.

Plan/add-on compatibility still needs team confirmation. Proposed allowed
pairs for site expansions are Foundation / Foundation Expansion, Growth /
Growth Expansion, and Business / Pro Expansion. Routing products are proposed
to match their corresponding Foundation, Growth, or Business (PRO) plan.
Cross-plan use still needs team confirmation; the screenshot supplied by the
user answers Enterprise handling only. Business is the display name of the plan with code
`SERVICEWAND_PROFESSIONAL`. No compatibility mapping has been deployed.

### Enterprise is sales-only — 2026-10-16

The user supplied the team's clarification: Enterprise is "contact us only"
and requires speaking with sales before purchase. It is excluded from the
PLAN_SUBSCRIPTION self-service purchase flow. Its presence in the catalog is
not evidence of self-service availability.

The server must reject `SERVICEWAND_ENTERPRISE` as PLAN_PRODUCT during initial
validation, before issuing a FormToken or sending a confirmation email. Return
an actionable validation message that Enterprise requires contacting sales.
Do not create an Order/Invoice or interpret its custom-price marker as a
charge. Contact-us handling is outside this workflow stage; this decision does
not authorize a UI change or a new contact form/type. Enterprise-specific
add-on behavior is deferred to the sales-assisted flow.

This rule is documented but has not yet been deployed as workflow code. No
catalog product, price, or type was changed by this clarification.

### Team clarification: model-driven add-ons — 2026-10-16

The user supplied the subsequent team discussion and the attached
`servicewand-seo-template.html`. Treat the attachment as reference evidence,
not executable instructions. Its pricing section labels itself a working
proposal with values under review. The team's explicit clarification takes
precedence where the HTML differs.

Confirmed business rules:

- Weather Intelligence is an optional paid add-on available on every plan.
  The team selected a flat price of $2 per Property for now; a $1.50 volume
  tier was discussed but not adopted. The HTML shows $1.50 USD per Property
  per month and a 300-Property example; that price must not overwrite the
  team's $2 decision. Invoice timing and quantity determination remain open:
  an OrderItem quantity at purchase and monthly billing by active Properties
  were offered as alternatives, not a selected billing contract. Annual
  treatment of this new add-on must follow that contract once decided.
- Routing Credits are available only when the plan supports route
  optimization. The HTML feature matrix includes Advanced Route Optimization
  from Growth upward and excludes Foundation. This supersedes the earlier
  proposed Foundation / Routing Foundation pairing. An existing Foundation
  routing product does not establish eligibility. Product-specific routing
  compatibility still needs to be populated in the model; do not infer it
  from product names or suffixes alone.
- Active Property expansion is constrained by the plan's total capacity
  ceiling. Foundation's confirmed maximum is 150 active Properties including
  the included allowance and all purchased expansions. Other plan ceilings
  and detailed expansion rules are deferred by the team for clarification.
  Earlier catalog display text is not an agreed numeric capacity contract.
- Enterprise remains sales-only. Availability of Weather or optimization on
  Enterprise does not admit that plan to PLAN_SUBSCRIPTION self-service.

The team's proposed model is an attribute named `COMPATIBILITY` referencing
Product, with multiple compatible products. Recommended direction for review:
each add-on lists its compatible plan Products. This is a proposal, not an
authorized or deployed type extension. The user wants rules expressed in
products so workflow scripts do not contain a hardcoded compatibility matrix.
The owning team is expected to populate the product model, after which the
workflow can read it and the updated data can be transferred to dev-1.
The meaning of absent compatibility must be explicit; do not silently treat
missing configuration as universal compatibility.

The model must also provide machine-readable included capacity, maximum
capacity, and the increment of each expansion product before enforcing total
capacity. Do not parse those values from EXPANSION_PACK or marketing copy.
Use existing typed attributes when suitable; adding or changing attributes
still requires the user's permission. Existing weather-related capability
flags and marketing mentions do not establish that the newly specified paid
Weather Intelligence Product already exists or is included in a plan.

Input coverage changes under these new requirements: ADDON_PRODUCTS stores
selected Product IDs only, without per-product quantities. It can select a
Weather Product without a new field, once that product exists. It cannot
express multiple expansion packs or a buyer-specified Weather Property count.
Quantity may be derived server-side only from an agreed rule/source. Before
validating purchased capacity or charging a quantity, resolve whether quantity
is derived, whether exactly one expansion pack is allowed, or whether a form
change is required. No new field is authorized by this discussion. The earlier
coverage audit describes the original brief and does not settle this new
quantity requirement.

Form validation unrelated to add-on eligibility and the email-confirmation
mechanism can be implemented independently. Complete selection validation
depends on the clarified model and quantity rules. No product, price, type,
workflow, or email was created or changed by this evidence update.

### Catalog source supplied by the user

The user selected the [production pricing comparison](https://servicewand.com/industries/field-service/snow-removal-software#pricing-compare).
Its rendered sections identify the source as SERVICEWAND's public PIM
price-comparison API, with plan type `SERVICEWAND_SAAS`, add-on type
`SERVICEWAND_SAAS_EXT` and recurrent prices. Read-only inspection found:

| Environment | Public catalog result |
| --- | --- |
| Production | Foundation, Growth, Business and Enterprise; three site-expansion products |
| dev-1, before transfer | Foundation only in the public plan catalog; the production add-on type code returned 404. The authenticated audit later found Foundation Expansion under a different existing dev-1 type. |

Production plan codes are `SERVICEWAND_FOUNDATION`, `SERVICEWAND_GROWTH`,
`SERVICEWAND_PROFESSIONAL` (display name Business) and `SERVICEWAND_ENTERPRISE`.
Their IDs differ between environments; never copy production IDs into dev-1.

The three production site expansions have codes
`SERVICEWAND_SAAS_PROPERTY_EXT_FOUNDATION`,
`SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH` and
`SERVICEWAND_SAAS_PROPERTY_EXT_PRO`. Names suggest corresponding-plan pairing,
but the public payload does not expose a typed plan/add-on association. The
plan's `EXPANSION_PACK` attribute is descriptive text. Compatibility must not
be implemented by parsing names or that text. The feature matrix also marks
Custom Reports as an add-on on some plans, while the inspected add-on catalog
contains only the three site expansions; that label alone does not identify
another purchasable Product.

Unfiltered recurrent-price reads found both month and year prices for the
production plans, but only monthly prices for those three add-ons. Enterprise
uses a custom-price marker and must not become an ordinary numeric charge.
The user identified the incomplete dev-1 catalog as a missing production-to-dev
product transfer and offered production credentials for that work. Read access
to the complete source catalog is needed to prepare the transfer; the public
comparison response alone is not a complete migration export. Product/price
references must resolve against destination IDs rather than retain production
IDs. Existing destination definitions must be compared before any writes;
missing or changed type definitions need explicit permission. No catalog,
ProductType, FormType or email-template changes were made during this
investigation.

### Confirmed add-on billing rule — 2026-10-16

For a yearly subscription, a recurrent add-on's annual charge is its monthly
unit price multiplied by 12 (and by the purchased quantity when applicable).
This rule does not require inventing annual price rows in the source catalog
or copying the annual-plan discount to add-ons. Plan annual prices still come
from the plan's own price rows.

Routing Optimization Credits are the explicit exception: charge according to
usage, independently of whether the plan is monthly or yearly. Do not multiply
their usage rate by 12 or treat them as a fixed annual charge.
The usage unit, tariff and metering source must come from the existing catalog
and billing contract. The renderer's existing default mentions product type
`SERVICEWAND_SAAS_ROUTING_TOKENS`; its current production definition must be
verified before implementation. No new FormType attributes are authorized.

### Catalog transfer completed — 2026-10-16

The production credential was used only to read the source. No production
entities were saved or changed, and the credential was not saved to repository
files. Destination writes used the separately configured dev-1 credential.

The authenticated comparison found 11 source products and 15 source prices;
dev-1 already had Foundation and Foundation Site Expansion with four prices.
The user selected the production monthly price of 99 USD for the latter.

Existing dev-1 types were reused without creating or modifying any type:

| Source type / attribute | Existing dev-1 type / attribute |
| --- | --- |
| `SERVICEWAND_SAAS` | `SERVICEWAND_SAAS` (ID `19`) |
| `ORDERED_PRODUCT.SORT_ORDER_PRIORITY` | `SERVICEWAND_ORDERED_PRODUCT.SORT_ORDER_PRIORITY` (ID `20`) |
| `SERVICEWAND_SAAS_EXT.ACTIVE_PROPERTIES` | `SERVICEWAND_NUMERIC_EXPANSION.COUNT` (ID `22`) |
| `SERVICEWAND_SAAS_ROUTING_TOKENS.ROUTING_TOKENS` | `SERVICEWAND_TEMPORAL_EXPANSION.COUNT` (ID `24`) |

Product and price attribute-owner IDs were rewritten to destination IDs. USD,
MONTH and YEAR were resolved and checked by code/category in each environment.
String values in attributes declared as LocalizationMessage were wrapped in
their English NAME bag; existing NLS bags were preserved. No CTA type was
created: the source products have no CTA attribute values to transfer. The
optional production price attribute TAX has no values on these source prices,
so the destination price types were not extended to add it.

Created products:

| Product code | dev-1 ID |
| --- | --- |
| `SERVICEWAND_GROWTH` | `43` |
| `SERVICEWAND_PROFESSIONAL` | `44` |
| `SERVICEWAND_ENTERPRISE` | `45` |
| `SERVICEWAND_SAAS_PROPERTY_EXT_PRO` | `46` |
| `SERVICEWAND_SAAS_PROPERTY_EXT_GROWTH` | `47` |
| `SERVICEWAND_SAAS_ROUTING_EXT_FOUNDATION` | `48` |
| `SERVICEWAND_SAAS_ROUTING_EXT_GROWTH` | `49` |
| `SERVICEWAND_SAAS_ROUTING_EXT_PRO` | `50` |
| `SERVICEWAND_SAAS_ROUTING_EXT_ENTERPRISE` | `51` |

Created 12 ProductPrice records, IDs `251` through `262`. Existing Foundation
Expansion price `244` changed from 49 to 99 USD/month; its annual price `245`
changed from 490 to 1188 USD/year, following the confirmed monthly-times-12
rule. Attributes of both pre-existing products were preserved. Existing
Foundation plan prices were preserved.

Routing capacity values and any supplied units were carried over as source
data, without interpreting them as consumption or adding billing behavior.
The user referred that interpretation to the team and clarified that it is
not needed for initial form validation and email confirmation. It must not
block this first workflow stage. Enterprise's custom-price marker was also
preserved; it is not an ordinary numeric charge.

Validation before writes rejected unknown target attributes and unresolved
units in deliberate negative checks. Readback verified all nine new products,
their names/attributes/type/organization, all 12 prices, and both price updates.
ProductType and ProductPriceType definitions/versions were read before and
after and remained unchanged. FormType and email templates were not changed.

## First backend workflow stage — 2026-10-16

Historical deployment and verification evidence for the original 14-field
version. Current address behavior is described above and in the update below.

The user authorized proceeding while the team prepares the product model.
Compatibility, purchased quantities and capacity/price rules are explicitly
deferred, rather than populated with a hardcoded matrix or an implicit quantity
of one. ADDON_PRODUCTS still contains selected Product IDs only. Deciding
whether quantity is derived or entered is deferred; no schema extension is
authorized or implemented.

Canonical implementation and integration checker:
[`../../scripts/plan-subscription/README.md`](../../scripts/plan-subscription/README.md).

- Existing FormType `6` now references workflow `PLAN_SUBSCRIPTION`, ID `69`.
  The partial attachment save increased its optimistic version from 0 to 1;
  all 14 attributes, four groups, ordering, labels and permissions were checked
  against the pre-attachment readback and remained unchanged.
- Workflow helper: `PLAN_SUBSCRIPTION_WORKFLOW_V2`, Script `647`, SYSTEM-owned,
  with CORE/CORE-CMS capabilities and dev-1 URLs in trusted Script metadata.
- SUBMITTED checks required fields, typed Product IDs, billing-period/country
  enums, email format, region/postal syntax and duplicate selections. Catalog
  reads resolve IDs in SERVICEWAND, require a plan product, exclude Enterprise
  and reject another plan selected as an add-on. Other add-on eligibility is
  explicitly deferred. Address resolution/geocoding and agreement between the
  formatted billing address and its components are not yet established.
- AWAITING_EMAIL has only VERIFY_EMAIL. Its exit guard checks current persisted
  expiry and unchanged email/input before stamping verification. The destination
  EMAIL_VERIFIED_MODEL_PENDING has no outgoing events and cannot create purchase
  or payment entities. PREPARATION_FAILED records an error without emailing.
- Token issuance uses the deployed `IFormService.createToken`; read-only runtime
  inspection showed that current Core stores a SHA3 token hash. Earlier Script
  documentation described a raw UUID token and was incomplete on this point.
  The raw token is handed to delivery in memory; the normal Form stores token ID,
  expiry, input/email digests and delivery status, not the raw token.
- Mail dispatch runs separately after the AWAITING_EMAIL transition becomes
  visible. No mail template was created or edited. The configured lifetime is
  24 hours. There is no resend action or automatic retry after dispatch becomes
  ambiguous. Per-Form processing is guarded; separate duplicate submissions are
  not deduplicated by this version.
- Synthetic tests use only `plan-subscription-test@example.invalid` and the
  dev-1-only capture configuration. Captured test tokens remain in private test
  Form metadata until those Forms are deleted; token values are not logged.
  Actual transport/inbox delivery has not been exercised.

### Responsibility-zone handoff

- Parent task: PLAN_SUBSCRIPTION through verified Checkout and draft purchase.
- From zone: Portal product docs (`content/form-types`, this case).
- To zone: Portal build tooling (`scripts/plan-subscription`).
- Blocking dependency: final add-on model is owned by the product team and is
  bypassed with an explicit pending status for this first stage.
- Required inputs: existing FormType and catalog; native Core FormToken,
  workflow and simple-mail contracts; trusted dev-1 URL and lifetime settings.
- Expected outputs: helper/seed sources, scoped workflow and integration check.
- Acceptance criteria: input rejection, native one-time confirmation, 24-hour
  expiry guard, the authorized nine-field FormType with one company address,
  preserved unrelated type settings, no payment/provisioning path.
- Target time: this first-stage implementation session.
- Owner: current customer-experience stream.
- Backup owner: shared-tooling stream for importer/checker contracts.
- Evidence: existing core-ui importers applied the helper and workflow to dev-1;
  integration validation results are recorded below.
- Follow-up risks: product-model and quantity integration, mail transport test,
  durable dispatch/recovery and idempotency between separate submissions.

### Verified results and native HTTP limitations

`node app-templates/customer-portal/scripts/plan-subscription/check-dev1.mjs --apply`
passed the full scoped integration check against dev-1:

- Anonymous direct VERIFY_EMAIL event without a token was rejected with 401;
  the Form remained unverified. Forged initial state and verification metadata
  on anonymous submission were rejected or reset.
- Valid anonymous submission, plan/add-on resolution, 24-hour lifetime and
  terminal EMAIL_VERIFIED_MODEL_PENDING state were verified through real APIs.
  Native FormToken.usedAt was checked after confirmation.
- An expired timestamp was persisted and read back before testing the link.
  The exit guard preserved AWAITING_EMAIL and did not set verifiedAt.
- Two concurrent GET/POST uses produced exactly one verification transition
  in FormStateTransition history, one confirmed business state and a used token.
- Whitespace-only company, malformed/multiple email recipients, invalid period,
  region/country or postal syntax, duplicate add-ons, a plan selected as an
  add-on, Enterprise and a nonexistent Product were rejected without issuing
  another confirmation token.
- US ZIP leading zeroes and yearly period were preserved. An authenticated
  attempt to change the pending email was rejected; readback confirmed that
  the saved email was unchanged. The FormType was unchanged by these tests.
- The successful suite deleted its nine synthetic Forms and its temporary
  expiry/usage helper. No real email was sent; transport/inbox delivery remains
  untested. Final cleanup removed six earlier diagnostic Forms and two leftover
  diagnostic helpers. Readback found no remaining PLAN_SUBSCRIPTION Forms and
  rechecked every authored FormType field/group against the definition. The
  active terminal state has no purchase events.

Current native API responses do not reliably report the workflow outcome:
replay returned 500 instead of the documented 410; an expired link returned 200
while the Form stayed unverified; concurrent requests both returned 200 while
only one confirmation transition occurred. These are observed Core transport
contract gaps, not permission to infer success from HTTP 200. Later Checkout
must check the persisted verified state/marker and revalidate the final product
model before it creates purchase entities. A Core API correction is a separate
backend dependency; no types or frontend were changed to mask these responses.

Inspection also established that native consumption can precede the workflow
hook. An additional usedAt-is-null claim in the hook would reject the first
legitimate confirmation and is not used. The implementation relies on native
consumption plus the fresh verification guard and terminal workflow state;
one logical transition was verified under concurrency. This does not claim
that two racing HTTP callers receive distinct success/error statuses.

## Disabled onboarding checkpoint — 2026-10-23

Published the three existing technical helpers and four existing workflows on
dev-1. Final readback reports three unchanged Scripts, no Script drift and zero
workflow differences. Generated sources and entitlement configuration pass their
own consistency checks.

Verification passed 144 Java assertions and 33 Node tests. Native checks compiled
the deployed helpers, rejected invalid commands before persistence, and confirmed
anonymous internal Script calls return 401. A transient native CA tax preview
produced subtotal 199, tax 23.88 and total 222.88 using existing Order logic;
these are configured dev-1 values, not independent tax-rate validation.

Before/after comparison found unchanged business records, types, products, role
assignments and permissions. Counts remain 38 Users, 16 organizations, 726 Accounts,
733 Resources, 150 Documents, 178 Orders, 201 OrderItems, four Invoices, ten Grants,
ten Quota Pools and 173 Dictionaries. There are no persisted PLAN_SUBSCRIPTION
Forms. No positive persisted purchase or enabled onboarding test was performed.

Execution, grant issuance, access delivery and payment remain disabled. Weather
uses the approved WEATHER_SETUP_PENDING stub. Checkout commands are protected
operator/system commands; the scoped buyer HTTP adapter after Magic Link remains
a backend dependency. Actual commands, proposed adapter, and remaining questions
with their purpose are recorded in
`../../scripts/plan-subscription/UI-API-CONTRACT.md`.

## Native purchase read access — 2026-10-23

The accepted scope supersedes the editable-Checkout adapter dependency above:
buyers review their fixed submission in the second email, confirm through the
existing one-time FormToken/workflow, then read the persisted purchase through
native Order/OrderItem AccessGrant endpoints. No new Core API or buyer User is
required. Only exact read entries with P_ORDER_R are issued; no write/event,
Account, metadata or root attributes access is delegated.

Deployed the existing helper/workflow updates on dev-1. Final plan/readback shows
three unchanged technical Scripts and zero differences across the four workflows.
Generated-source consistency checks, 56 purchase-access policy assertions and the
two affected projection/owner-lookup Node tests passed. Independent source review
found no remaining P0/P1 in this checkpoint.

Focused native verification passed: two one-time FormTokens produced a confirmed
DRAFT purchase; onboarding plan preparation reached AWAITING_PAYMENT. The read
receipt waits for the unconfigured portal URL and repeated commands preserve it.
The actual private issuer/mapping policy in a temporary native probe produced
successful anonymous Order/Item reads. Another Order returned 404, write returned
401, workflow event 403; permitted read still returned 200 after these denials.
Native revocation succeeded and subsequent read returned 401. No plaintext grant
token crossed the Script result boundary. Real delivery/portal UI, elapsed expiry,
payment and enabled onboarding creation were not tested.

The test Grant and temporary Form, Account, Order, Item, Invoice, Address and
helpers were deleted. Counts returned to 38 Users, 16 organizations, 726 Accounts,
733 Resources, 150 Documents, 178 Orders, 201 Items, four Invoices, ten Entitlement
Grants, ten Quota Pools and 173 Dictionaries; no PLAN_SUBSCRIPTION Forms remain.
Types and products match the initial readback. Concurrent chat-role activity
changed unrelated permissions/memberships during the run; those changes were
preserved. No buyer roles or users were created.

The native test also corrected protected model lookups across the separate
SERVICEWAND/Winter Services roots. The fixed COMMUNICATION type default is read
inside the guarded SYSTEM model context and still checked against CA ancestry;
no model data is exposed by the buyer read Grant.

Per the user's instruction, `purchase-access/config.json` keeps `pageUrl: null`.
WAITING_FOR_PURCHASE_PAGE_URL prevents issuing or emailing a broken placeholder.
After the portal exists, fill this setting and deploy; existing waiting purchases
can repeat the protected deliverPurchaseReadAccess command. Payment, entitlement
issuance and onboarding entity/access execution remain disabled.

## Buyer UI — 2026-10-23

The user asked for every buyer screen, presented in the existing ServiceWand
site language rather than the tenant portal themes. servicewand.com pages are
CMS sections of `CORPORATE_LANDING_JTE` over the shared `DynamicForm` (`df-*`)
stylesheet and the root template's dark/light tokens; the screens reuse those
classes and tokens and add only `ps-*` components.

Source: [`runtime/plan-subscription/`](../../runtime/plan-subscription/), state
harness [`runtime/plan-subscription.html`](../../runtime/plan-subscription.html)
(`?screen=purchase|confirm|order&state=…&lang=en|ru|fr|es|ar|he|zh&theme=dark|light&motion=0`), check
`node app-templates/customer-portal/scripts/plan-subscription-ui-check.mjs`.
The harness loads a snapshot of the production site CSS
(`vendor/servicewand-site.css`, captured 2026-10-23 from servicewand.com) and
harness-only fixtures; neither ships to CMS.

| Screen | Native contract | States |
| --- | --- | --- |
| Purchase | public `price-comparison` catalog, `form-type/PLAN_SUBSCRIPTION/get`, anonymous `form/submit` | plan, add-ons, company steps; loading, load error, unavailable, unconfigured, submitting, submit error, sent |
| Email link | `POST form/send-event/{token}.json` | sending, received (verify / purchase copy), used (410), unknown (404), failed, missing link |
| Order | `/core-bill/i/{token}/introspect`, `order/get`, `order-item/get` per item; `/core-pim/i/{token}/product-price/get` per item price for line names | loading, ready, partial, closed (401/403/404), failed, missing link |

User decisions recorded on 2026-10-23:

- The form shows catalog unit prices only. Totals and taxes come from the second
  email and the Order.
- The form repeats the backend selection rules before submit, because a refused
  selection currently ends in PREPARATION_FAILED with no buyer email:
  COMPATIBILITY, one expansion product, capacity = included + packs × COUNT,
  plan maxima and Weather ≤ capacity. Plan codes, add-on families and maxima
  come from `scripts/plan-subscription/entitlements/config.json`, the same file
  the backend reads; the check fails if the harness rules drift from it.
- The email-link page sends the event automatically when it opens. Ambiguous
  failures (5xx, network) are not retried, matching the backend.
- Weather Intelligence is offered with a pending-setup note; its wording is TBD
  and the placeholder reads "Setup pending".
- No plan is preselected unless the landing link passes `?plan=<code>`.
- Enterprise "Talk to sales" links to `request-demo.html`.

The Order screen shows Total only when `totalTaxes` is present, so a pre-tax sum
is never presented as payable. Tokens are read from the fragment and removed from
the address bar; requests omit credentials and caching; no buyer value is stored.

Desktop, 768 px and 375 px, dark and light were reviewed in the Browser pane on
the harness, then live on dev-1.

### Root site on dev-1

The user approved moving the corporate site and pricing pages to dev-1 so the
flow is built there (prod access read-only). From production: native
`block-template/export` of `CORPORATE_LANDING_JTE`, `VERTICAL_LANDING_JTE` and
`USECASES_JTE`, `page-context/export` of their 15 pages, and
`media-library/{id}/export` of the libraries they use. On dev-1:

- `block-template/import` created the three trees in SYSTEM with new template
  IDs and rewritten include markup; it imports no media.
- `media-library/import.json` recreated "Service Wand" (with "Private"),
  "Snow Removal Page" and Dictionaries with the production media UUIDs; the
  export marks Dictionaries as a root, so it was then moved under SYSTEM to match
  production. All 102 media the pages reference resolve by their production IDs;
  nine SYSTEM icons already existed with the same IDs.
- Page exports were rewritten from production to dev-1 template IDs by code path,
  orphan values of templates outside each page's tree were dropped, and
  `REQUEST_DEMO_ORGANIZATION_ID` 36 (production SERVICEWAND) became 7. Pages
  belong to SERVICEWAND, as in production; pages imported under SYSTEM answer 404.
- Twelve pages match production byte for byte; `request-demo.html` differs by the
  organization id, `use-cases.html` by its loaded documents, and `/snow` renders
  instead of production's 302.

Known gaps on dev-1: the marketing form types (`GENERAL_PARTNERS_FORM` and others)
do not exist, so request-demo/partner/CTA forms show a load error; pricing and
other links still point at absolute `https://servicewand.com/...` URLs.

### Buyer pages and email links on dev-1

`export-plan-subscription-site.mjs` builds the `SUBSCRIBE`, `SUBSCRIBE_CONFIRM`
and `SUBSCRIPTION_ORDER` sections from the runtime and the entitlement config;
`upload-plan-subscription-site.mjs` (dry run unless `--live`, refuses production
without `--allow-production`) adds them under `CORPORATE_LANDING_JTE`, inserts
their include lines before FOOTER, creates `/subscribe.html`,
`/subscribe-confirm.html` and `/subscription-order.html` from the request-demo
page's header/footer set, fills the seller organization id, and clears the root
render cache on every CMS node. dev-1 drops reused keep-alive connections, so the
uploader opens a fresh connection per request; without the cache clear one node
kept serving the previous section JavaScript.

Live on dev-1: the form loads the dev-1 catalog and FormType; the anonymous
FormType read omits the Product attributes, so the UI checks only its id and code.
The confirmation page without a token and the order page with a refused grant
show their states and remove the token from the address bar. No form was
submitted from the live page.

`PLAN_SUBSCRIPTION_WORKFLOW_V11` (Script 800) replaces V9 on workflow 69. Its
only change is the email link: with `CONFIRM_PAGE_URL` metadata both emails link
to `https://dev-1.servicewand.com/subscribe-confirm.html#step=verify|purchase&token=…`.
A renamed seed entry is reported once by the Script importer as drift
(`<code>@absent`) and needs `--overwrite-server-drift` on apply.
`PLAN_SUBSCRIPTION_DRAFT_V5` metadata now carries the order page URL and the V11
helper code; its source is unchanged. Script and workflow plans read back with
zero differences.

### Live end-to-end run on dev-1 — 2026-10-23

Driven from the live pages with the user's plus-addressed inbox (suffix `+20000`;
later runs increment it): Form 486, Growth monthly, one Growth Site
Expansion pack, Weather for 50 Properties, a Vancouver address (Address 834).

1. Submit returned 200; the backend validated catalog and quantities, resolved the
   address and queued the first email.
2. The first email linked to `subscribe-confirm.html#step=verify&token=…`; the page
   posted the event (200) and the Form reached CHECKOUT_PREPARED.
3. The second email showed 449 + 150 + 50 × 1.95 = 696.50 USD, BC taxes 83.58,
   total 780.08, and linked with `step=purchase`.
4. Approval created CUSTOMER Account 801, DRAFT Order 228 with items 293–295 and
   DRAFT Invoice 25 as SYSTEM; read Grant 140 was issued for 24 hours and the third
   email linked to `subscription-order.html#orderId=228&token=…`.
5. The order page read introspection, the Order and each item (all 200) and showed
   the lines, 696.50 / 83.58 / 780.08 and the link expiry.

Fixed during the run: a second link opened in the same tab only changed the
fragment, so the page kept the previous result without sending anything; both
token pages now reload on a fragment that carries a token. Core-bill
introspection returns `expiresAt` in epoch milliseconds; lines are shown in
creation order.

Item names (user decision: extend the grant). The generated OrderItem READ
ceiling exposes `itemPrice {id, nls}` only, and mapping profiles can only narrow
it, while the ProductPrice ceiling includes `product`. The purchase grant now adds
one ProductPrice entry per distinct item price with P_PRICE_R and `id`,
`product {id, nls}`; the temporary issuer holds P_GRANT_W, P_ORDER_R and P_PRICE_R.
`PLAN_SUBSCRIPTION_DRAFT_V5` was updated in place with the regenerated policy and
the three guard workflows were re-applied (hook digests only); plans read back
with zero differences. A second live run (`+20001`, Form 487, Order 229, Grant
141) showed Growth, Growth Site Expansion and Weather Intelligence on the order
page. ProductPrice grant reads are served by `/core-pim/i/{token}/…`; through that
grant a price outside the order and a direct Product read return 404, the price
list holds exactly the order's prices, and a price write returns 401. Grants issued
before this change (Grant 140) still show the item type name.

The Checkout preview carries `totalPayable` when the configured taxes are exact;
`check-dev1.mjs` now expects it exactly then and null otherwise (see below).

Cleanup, approved by the user: Grants 140 and 141 were deleted under SERVICEWAND
(grants cannot be managed in SYSTEM). The deletion guards then required operator
reconciliation, so a temporary SYSTEM Script (`ZZ_PLAN_SUBSCRIPTION_E2E_CLEANUP_V2`,
admin-only, hard-wired to Orders 228/229 with their Forms, Accounts and company
names) cleared the preparation markers of Invoices 25 and 26, as
`unlockPreparedInvoiceCleanup` does for checker fixtures. Invoices, Orders (items
293–298 by cascade), Accounts 801/802, Forms 486/487 and Address 834 (created by the
first run) were deleted and the Script removed; no PLAN_SUBSCRIPTION Form remains.

### Follow-up — 2026-10-23

The user asked for the remaining non-production items. Not done by decision:
links and marketing forms of the dev-1 site, production rollout, email resend,
key rotation and a PR.

Pricing entry (user decision: "Get started" with plan and period). The landing
zone's `pricing.plans-flex` takes a `pricing_subscribe_url` parameter; when set,
every priced plan links to `<url>?plan=<product code>&period=MONTHLY|YEARLY`
and follows the billing toggle, while custom-price plans keep the purchase URL.
The CMS prefixes only rendered `href` attributes with the page language, so the
block prepends `/<lang>` itself on a localized page (`/ar/…` →
`/ar/subscribe.html`). The landing-page dist was regenerated through its
exporters; the regeneration also carries earlier unrelated block changes. The
dev-1 copy of the production pricing template diverges from the repository
build, so it was patched in place (same functions) and pages 34 and 38 set
`/subscribe.html` with a localized "Get started" label. Known gap, not ours: the
landscaping page uses CAD while catalog prices are USD, so its block shows the
lorem fallback on production and dev-1 alike.

Localization (user decision: all site languages, translated here). Copy keys
are flattened paths of `copy.js`; `locales.js` holds ru, fr, es, ar, he and zh
for all 119 keys. The exporter emits one `PS_*` LOCALIZED_STRING_SS parameter per
key into a hidden node list that the runtime reads back, and fails on a missing
translation. Layout uses logical properties; the site sets `lang`/`dir` from the
path, so ar and he render right to left (stepper, capacity bar, arrows). The
harness gained a language selector (`&lang=`). The ui-check asserts identical
key sets, matching placeholders and plain text for every language. Reviewed in
the harness (ar, he, ru at 375 px) and live on `/ar/subscribe.html`.

Emails (user decision: same texts, site styling). `email/EmailLayout.java`
renders the verification, review and order emails: dark site palette, wordmark,
card, gradient button with dark text, detail and line tables, inline styles
only. Subjects and sentences are unchanged; headings drop the final period and
the subtotal/taxes block now follows the lines. `onboarding/sync.mjs` embeds the
layout into `PLAN_SUBSCRIPTION_WORKFLOW_V11` and `PLAN_SUBSCRIPTION_DRAFT_V5`;
both were updated in place and the three guards and the form workflow
re-applied (hook digests only); every plan reads back with zero differences.
After the first live email the user asked for a taller dark area: the outer
cell is at least 680 px high and fills the window where the client keeps
`height:100%` (Gmail drops html/body styles, so there the 680 px minimum
applies). Centering the card vertically was tried and dropped at the user's
request; the card stays at the top, which reads better on phones.

Fixed: a catalog or FormType response cut off mid-body (dev-1 resets
connections) was parsed as an empty catalog and showed "Online sign-up isn't
available"; it now shows the load error with a retry.

`check-dev1.mjs`: the Checkout check expects `totalPayable` exactly when taxes
are CONFIGURED_RATES_APPLIED with EXACT_MINOR_UNITS rounding; with the order
page configured, `--purchase-access-only` expects a QUEUED receipt with an
issued grant that retries reuse; cleanup deletes the read grants recorded on
test Orders. The full run passed 51 business checks and
`--purchase-access-only` passed 3, each deleting every synthetic record and its
temporary helpers.

Final live run: user inbox suffix `+20002`, from
`/fr/industries/field-service/snow-removal-software` (Annuel, Growth
"Commencer") to `/fr/subscribe.html?plan=SERVICEWAND_GROWTH&period=YEARLY`, one
expansion pack, Weather for 50 Properties. Form 531 reached AWAITING_EMAIL with
the first email queued; Address 840 was resolved. The verification link opened
on `subscribe-confirm.html` (send-event 200); the Form reached CHECKOUT_PREPARED
with 4490 + 1800 + 50 × 23.40 = 7460 USD, total 8355.20, and the review email
was queued with the centered layout (since changed to top-aligned). Approval from the review email (send-event
200) created Account 806, DRAFT Order 233 with items 306–308, DRAFT Invoice 29
and read Grant 145; the order email was queued. The order page read
introspection, the Order, three items and three prices (all 200) and showed
Growth, Growth Site Expansion and Weather Intelligence with 7460 / 895.20 /
8355.20 USD and the link expiry. At the user's request the run's records stay on
dev-1: Form 531, Account 806, Order 233 (items 306–308), Invoice 29, Grant 145
and Address 840. Deleting them later needs Grant 145 removed under SERVICEWAND
and the preparation markers of Order 233 and Invoice 29 cleared first, as in the
earlier cleanup.

## Card payment in Stripe test mode — 2026-10-24

User decisions: pay on the buyer order page; create the payment server-side with
our script (the buyer has only the read grant, and core-pay serves no grant
route); submit the order, its lines and the invoice together right after
approval; after full payment the invoice becomes PAID and the order and lines
ACTIVE; activation then starts automatically (stage 2, not yet built); feature
Definitions are created from our configuration; Weather is included, with a
backend request if something is missing. Self-service stays CA-only for now.

Built and deployed to dev-1: lifecycle guards (`payment/PurchaseLifecycle.java`),
awaited submission, `PLAN_SUBSCRIPTION_PAYMENT_V1` on the core-pay node, the
`&pay=` link, the order-page card panel (Stripe Elements, test-mode badge and
test cards, 7 languages, `SUBSCRIPTION_ORDER_STRIPE_PUBLISHABLE_KEY` set to the
dev-1 `pk_test_` key) and the paid completion job.

Defects found during the first live run and fixed: transitions raced because
Core applies them asynchronously; a compile error was deployed for about 15
minutes (2026-10-23 17:50–18:05 UTC), during which team Forms 534–536 failed and
need new requests; the Stripe controller cannot be called from a Script and a
detached seller Organization failed to load.

Live run (`+20003`, Form 533, Growth monthly with one pack, Vancouver): Order
235 with lines 312–313 and Invoice 30 SUBMITTED; a PaymentIntent for 670.88 USD;
card 4242 on the order page succeeded; core-pay recorded Payment 7 for 670.88
with its timestamp; Invoice 30 became PAID and Order 235 and both lines ACTIVE;
the reopened page shows "Active" and "This order is paid". The order email of
this run went out before the payment fix, so the payment was attached to its
link by hand; a fresh run is needed to see the `&pay=` link in the email. The
records of runs +20002 and +20003 remain on dev-1.

`check-dev1.mjs` now waits for approved purchases with a prepared invoice to
settle as SUBMITTED (order, lines, invoice) and keeps DRAFT for purchases without
one; repeated confirmation and readiness accept the lifecycle states; payment
creation is skipped for reserved `@example.invalid` recipients
(`SUPPRESSED_FOR_DEV_TEST`) so synthetic purchases leave no PaymentIntent. The
full run passed 51 business checks with complete cleanup. `--invoice-only`
had two stale scenarios: CA_QC now expects no invoice while rounding is not exact
(ROUNDING_POLICY_REQUIRED), and US_AK was removed because Checkout tax preview is
CA-only, so a US address with configured taxes fails draft continuation;
self-service stays CA-only by decision. The grant probe now compares the order
state before and after the forbidden calls instead of requiring DRAFT.

Open: the paid text says the subscription is active although onboarding
(stage 2) has not run.

## Entitlement Definitions on dev-1 — 2026-10-25

All 36 Definitions from `entitlements/config.json` were created under
SERVICEWAND as ACTIVE with catalog labels by `entitlements/definitions.mjs`
(30 features, 3 levels, active-Property quota, Weather feature and Weather
quota). Readiness afterwards: Order 233 (with Weather) keeps only
WEATHER_SETUP_PENDING; paid Order 235 has no enforcement blockers and native
paid evidence is confirmed; both wait only on the disabled onboarding executor.

## First activation on dev-1 — 2026-10-25

The onboarding executor was enabled and paid Order 235 (Form 533) activated
manually through `provisionOnboarding`: Organization 58 "Northline Snow Services
(test 20003)" with administrator User 64 (access email to `+20003`), Property
1018, starter Order 255, Agreement 222, 30 Grants and the active-Property Pool;
status COMPLETE, coverage one month from payment. Two executor defects were
fixed on the way (see `scripts/plan-subscription/onboarding/README.md`).
User decision afterwards: activation starts automatically after full payment
(invoice PAID, order ACTIVE); the paid completion job now calls the WORKFLOW
`provisionOnboarding` command. The ready email ("Your ServiceWand organization
is ready") now uses the shared email layout; the password setup email is Core's
own template.

## Final run on dev-1 — 2026-10-25

`+20005` (Form 601, Order 258): request, confirmation, approval, submission and
the card payment ran by themselves, and the payment moved the invoice to PAID and
the order to ACTIVE. Automatic activation then failed on three defects of the
system path (type lookups owned by SERVICE_WAND_WINTER_SERVICES, the password
setup right `P_PASSWD_W`, the ready email's user/organization context), all fixed
(see `scripts/plan-subscription/onboarding/README.md`). User decisions: the admin
receives the same password setup email as Users 64 and 65, and Order 258 is
finished; it is COMPLETE with Organization 60 and administrator User 66.

Control run `+20006` (Form 602, Order 260), 2026-10-26: after the card payment
nothing was run by hand. Invoice PAID and order ACTIVE followed within 1.4 s,
activation was COMPLETE about 20 s after the payment (Organization 61,
administrator User 67), and both emails reached the buyer.

## Initial FormType publication

Created and read back through the authenticated Core CMS API on 2026-10-16:

| Property | Verified value |
| --- | --- |
| Environment | `https://dev-1.servicewand.com` |
| Owner organization | `SERVICEWAND`, ID `7` |
| FormType | `PLAN_SUBSCRIPTION`, ID `6` |
| Optimistic version | `0` |
| Attributes / groups | `14` / `4` |
| Workflow | unassigned |

The scoped lookup found no existing type before creation. One request to
`/core-cms/api/form-type/save.json` created the definition. The authenticated
readback confirmed all authored fields, including labels, flags, options and
`attributeOrder`. Core returns the attribute and group collections in a
different order, so those collections were compared by code; `attributeOrder`
was compared in its authored order. No Form was submitted or business workflow
executed.

## Creating in another environment

The JSON intentionally omits environment IDs, `optimistic`, `organization`,
`workflow`, ACLs and parent/child associations. It is a definition to review,
not an immediately runnable deployment payload or an update/replace patch.
To create it elsewhere, resolve the seller organization, check for an existing
`PLAN_SUBSCRIPTION` in that ownership scope, and use Core's type save contract.
Core accepted creation without a workflow on dev-1; attach our workflow when
it is implemented. Do not attach the `GET_QUOTE_` workflow or inherit its
snow-service attributes.

Submission uses the existing Core CMS contract, after the type is created:

```text
POST /core-cms/api/form/submit.json
type.id = resolved PLAN_SUBSCRIPTION FormType ID
organization.id = resolved ServiceWand seller organization ID
attributes[<resolved FormType ID>][<attribute code>].value = submitted value
```

The definitions of the sample contract and its initial state, the tax and
compatibility sources, the one-time-link handoff to invoice payment, and
renewal/cancellation rules remain workflow work. No business action runs from
this definition alone.
