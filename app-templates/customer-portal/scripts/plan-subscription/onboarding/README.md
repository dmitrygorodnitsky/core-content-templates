# CA onboarding readiness and disabled executor

The readiness command is a read-only source/model check for an already confirmed
PLAN_SUBSCRIPTION purchase. The separate disabled executor is documented below. Buyer confirmation is not payment confirmation. It does not create a
client Organization, User, Account, Property, Document, Ledger Account, Grant or
Quota Pool, change entity types, submit an Invoice, issue mail/tokens or accept
payment. It is not a provisioning executor.

## Command and trust boundary

The operator/system command is
`PLAN_SUBSCRIPTION_WORKFLOW_V11.checkOnboardingReadiness(formId, checkoutDigest)`.
Use the existing authenticated Core Script execution API:

```text
POST /core/api/script/PLAN_SUBSCRIPTION_WORKFLOW_V11/checkOnboardingReadiness/exec.json
X-Organization-Code: SYSTEM
[{"formId": <confirmed Form ID>}, {"checkoutDigest": "<its saved Checkout digest>"}]

POST /core/api/script/result.json
["<returned execution UUID>"]
```

The generic Script API remains operator-only. An anonymous request is not a
replacement for the one-time Magic Links. The CMS command reads the saved Form,
verifies its email/input/Checkout binding and consumed purchase-confirmation
token, and requires the persisted `DRAFT_ORDER_READY` purchase. Confirmation
must have occurred before link expiry; a later readiness check does not require
consuming that link again. Wrong country, digest or purchase state is rejected.

Only saved data crosses to the billing command. Billing validates the seller,
CUSTOMER Account, DRAFT subscription Order, line counts/prices/quantities, native
receipt markers and confirmed Entitlements snapshot. The saved CA Address must
match native components and the single purchaser billing/legal address. Any
existing purchase Invoice must match the saved receipt and remain a guarded
DRAFT. There is no catalog refresh, purchase recovery, entity save or Form
metadata write in this command.

`PLAN_SUBSCRIPTION_DRAFT_V5.inspectOnboardingConfiguration()` can inspect the
model without a Form. Billing reads OrganizationType, AccountType, OrderType and DocumentType
through native managers/JPA. ResourceType is read on the RM node by the dedicated
`PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1.inspectPropertyType(typeCode)` Script.
This technical Script is part of the deployment, accepts only the configured
Property type and has the same system/operator restriction. Queue records and
execution logs are technical side effects, not onboarding business entities.
Queued callers are reread inside the read transaction before authorization;
detached role/organization proxies are not used for that check. The SYSTEM path
uses the actual service User ID and an in-memory principal, without saving roles.

## Report

`mode=ONBOARDING_READINESS_ONLY`; `steps` describe proposed sources and symbolic
dependencies, while `blockers` identify missing/unverified configuration by
step, code and field. Types are read live, including inherited required fields,
allowed values/reference types, concrete-type status, definition ownership,
parent types and initial workflow state. Request Quote reference Scripts are
read for existence, executable status and source fingerprints; none is invoked.
`sourceReady` means only that a step has its own input sources; `dependsOn` still
applies. Model read errors prevent ready claims. No entity-save, role-assignment
or actual access test is implied.

The Property uses the saved client Address and a symbolic `starterCustomer`
reference. A separate WINTER_SERVICES_ORDER starts as a preparation draft in its
native INITIAL state (not a renamed/new DRAFT state), links that Property
and starter Customer, and takes currency from the verified subscription Order.
It has no priced items or automatic submission: the existing Request Quote
draft pattern leaves pricing to manager review. Service Agreement uses that
same starter Customer as CLIENT and the separate service Order as ORDERS. The
subscription purchase Order is never substituted. Entitlements come from the committed purchase snapshot, not the
current catalog. The Quote link rule remains season start before the season,
otherwise 30 days, evaluated when the Quote link is issued.

`configurationReady` reflects reported source/model blockers only.
`canProvision`, `creationEnabled`, `paymentConfirmed`, `paymentEnabled` and
`grantIssuanceEnabled` remain false. Execution additionally requires confirmed
payment and a separately enabled provisioning executor.

The agreed configuration lives in `config.json`. OPERATOR is the existing
Service Provider type; CUSTOMER is the existing Client type. Their codes are
retained. The subscription codes also remain SERVICEWAND_SUBSCRIPTION and
SERVICEWAND_SUBSCRIPTION_ITEM. No type is renamed or created.

Ledger is one Account of the SYSTEM-owned ORGANIZATION type per new client
organization, using the existing Account API. It is an explicit proposed step,
not a request for another ledger service.

The administrator definition is SYSTEM.ADMIN; its assignment is a symbolic
reference to the new client organization, never SYSTEM. Definition ownership is
not assignment scope. The old blanket rejection of code ADMIN is removed, while
SYSTEM assignment and explicit SYSTEM_ADMIN permissions still fail readiness.

Access follows the Request Quote provisioning pattern: reuse a User found by
verified email, keep its existing password, and call UserService.generateNewPassword
only for a new User or missing password. The existing Script is a reference,
not a ready-to-call company-admin provisioner: it contains a fixed tenant and
customer-portal role. Adapting that pattern belongs to the future executor.

The native Entitlements backend contract is accepted per the user's decision.
This removes the blanket backend-enforcement blocker; warnings still state that
no Grant/Pool issuance or runtime enforcement was exercised here. The existing
Entitlements configuration and its activation guards are not changed. A missing
structured overall Properties maximum in the saved purchase remains a data
blocker, distinct from backend capability.

Season dates now have the user-approved temporary CA default in config.json:
2026-11-01 through 2027-03-31. A proposed seasonSettings step describes a new
company-owned CONTRACT_AWARE Dictionary and the subsequent CONTRACT_SETTINGS
attachment. It does not fabricate an existing Dictionary ID. The agreement's
proposed TERM_START_DATE / TERM_END_DATE use the same dates. No Dictionary or
organization is saved by inspection.

QUOTATION_EXPIRATION is no longer required on OPERATOR; its LocalDate type,
label and existing organization values are retained. The approved narrowly
scoped type patch is optional-quotation-expiration.json. It neither removes nor
renames an attribute, changes its datatype, or alters ProductTypes.

Both active Quote issuers use the frozen agreement TERM_START_DATE: if issued
before its midnight, expiry is season start; otherwise expiry is issuance plus
30 days, including issuance exactly at season start. The legacy organization
date is not read as an integer or used to override this rule. The two shared
sources are owned by the sibling core-ui repository under scripts/dev/seeds/scripts/:
SNOW_SERVICE_QUOTATION_DELIVERY_V17.java and
SNOW_QUOTATION_DECISION_CONFIRMATION_V10.java. quote-expiry.test.mjs compiles
their actual methods with isolated data stubs and checks boundary/calendar cases.
CORE_UI_REPOSITORY can override the default sibling checkout used by the checks.

sync.mjs records canonical hashes of both sources in the onboarding config.
The live inspector compares those hashes to the executable server Scripts;
a READY flag alone cannot suppress a source mismatch. This does not send a Quote,
consume a link, revoke a Grant, or change existing link expirations retroactively.

Older purchaser Accounts without LEGAL_ENTITY_TYPE still require manager
review. An email longer than User.name's 64-character limit requires a login
source rather than truncation. No current buyer data is stored in this seed.

The user approved INDIVIDUAL as a temporary LEGAL_ENTITY_TYPE default for new
purchaser Accounts and the proposed starter Customer 1. Both defaults live in
config.json; they do not classify a company from its name/address or add a form
field. ServiceWand managers can subsequently correct the value. Existing
purchaser values are read as persisted and never replaced by this default;
readiness continues to report a missing value on an older Account. Starter
Customer creation remains disabled.

The SYSTEM.ADMIN candidate was checked separately in
[`ADMIN-ROLE-ACCESS-AUDIT.md`](./ADMIN-ROLE-ACCESS-AUDIT.md). Tenant-scoped read
boundaries passed, but a Java host-class-lookup restriction requires backend
clarification. Per the subsequent user decision this is a nonblocking backend
follow-up. The configured readiness candidate is now SYSTEM.ADMIN; no User role
assignment or credential issuance is performed or enabled.

## Source generation and checks

`OnboardingReadiness.java` is the dependency-free evaluator. `type-inspector.java.inc`
is the shared native type projection. Edit those sources, not generated copies
inside the deployed Scripts. `sync.mjs` embeds them, exports metadata and updates
the existing workflow compiler markers without changing lifecycle behavior.

```sh
node app-templates/customer-portal/scripts/plan-subscription/onboarding/sync.mjs --write
node app-templates/customer-portal/scripts/plan-subscription/onboarding/sync.mjs --check
javac -d /tmp/plan-subscription-onboarding-tests \
  app-templates/customer-portal/scripts/plan-subscription/onboarding/OnboardingReadiness.java \
  app-templates/customer-portal/scripts/plan-subscription/onboarding/OnboardingReadinessTest.java
java -cp /tmp/plan-subscription-onboarding-tests OnboardingReadinessTest
node --test app-templates/customer-portal/scripts/plan-subscription/onboarding/quote-expiry.test.mjs
```

Deploy Scripts through the existing coreScripts importer, then the four existing
workflow seeds with `--no-grant`. A final plan must show no changes. The new RM
helper is permanent read-only implementation code, unlike temporary integration
fixtures. Do not use the parent `check-dev1.mjs --apply` for a no-entity-creation
verification: it deliberately creates and cleans synthetic purchases.

2026-10-22 verification: 27 pure Java assertions and 26 existing Entitlements
tests passed. The actual evaluator over a live dev-1 model snapshot reported
the expected missing sources without a persisted fixture. No confirmed
PLAN_SUBSCRIPTION Form existed during verification, so a successful persisted
purchase path was not exercised under the no-entity-creation constraint.
Native verification confirmed all four models were available, missing Forms and
unverified payloads were rejected, and anonymous generic Script execution was
denied. Business counts, entity/Form/Product types, client roles and organizations
were unchanged. Core registered the new helper's two Script permissions on its
existing ADMIN role automatically; no client permission or role was granted.
Final import plans showed three Scripts unchanged and zero changes on all four
existing workflows. No rollback/reconciliation or purchase fixture was run.

2026-10-23 decision refresh: the updated evaluator passed 44 pure Java assertions;
the existing 26 Entitlements tests also passed. Live dev-1 inspection compiled
the deployed Java and found all six types, their owners and initial states.
WINTER_SERVICES_ORDER starts in INITIAL in GENERAL_FSM_ORDER; the configuration
uses that native preparation state without adding or renaming workflow states.
ADMIN was found in SYSTEM without granting it to anyone.

The actual evaluator over this live model, with explicitly in-memory purchase
sources (not a persisted or confirmed purchase test), leaves four source blockers:

- organization: QUOTATION_EXPIRATION has no inherited/default date source;
- quotation: no accessible CONTRACT_SETTINGS / CONTRACT_AWARE with SEASON_START;
- quotation: the shared delivery calculation still needs the agreed expiry rule;
- entitlements: an overall Properties maximum is not structured in the purchase
mapping; current catalog maxima are prose in EXPANSION_PACK, not a numeric field
  (resolved for new purchases by the subsequent temporary-config decision below).

No PLAN_SUBSCRIPTION Forms existed on dev-1 during this verification. Native
negative checks rejected a missing Form, an unverified payload and anonymous
generic execution. These are not a successful confirmed-purchase-path test.
Business counts and snapshots of types, products, Forms, organizations, User
memberships and role permissions were unchanged. Provisioning, credential
delivery, Grants, Pools and payment remain unexecuted and disabled; adapting the
Request Quote examples into a company onboarding executor is still future work.

2026-10-23 temporary maximum configuration: the user approved Foundation 500,
Growth 1000 and Business (SERVICEWAND_PROFESSIONAL) 2000 in
`../entitlements/config.json`. New Checkout snapshots save overallMaximum,
maximumSource=TEMPORARY_CONFIG and maximumValidation=VALIDATED_CONFIG_MAXIMUM;
the configuration and these values are covered by consent fingerprints.
Readiness verifies the saved maximum, the capacity arithmetic and that the
allowance does not exceed it. This closes the capacity blocker for newly
reviewed purchases without changing ProductTypes or issuing Entitlements.
Old snapshots without that evidence are not silently upgraded; they still
require explicit Checkout preparation and confirmation. Remaining source
blockers are QUOTATION_EXPIRATION, CONTRACT_SETTINGS.SEASON_START and adapting
the shared Quote expiry calculation.

Maximum verification: 48 pure Java assertions and 29 Node tests passed, including
exact-boundary, over-limit, malformed/missing configuration, yearly capacity and
consent-fingerprint changes. On dev-1, 12 native read-only validateSelection
executions accepted the exact maximum and rejected one extra expansion pack for
each plan in both billing periods. No persisted purchase fixture was created.

Season/expiry investigation (read-only, 2026-10-23): CONTRACT_AWARE already has
LocalDate SEASON_START and SEASON_END. SNOW_CONTRACT_SOURCES_V1 reads the
organization's explicit CONTRACT_SETTINGS reference and copies those dates to
the agreement's TERM_START_DATE / TERM_END_DATE. An ancestor-owned dictionary
may be referenced, but the Script does not discover a missing reference on a
parent automatically. No season profile is configured for the CA parent or
Winter Services root; the existing configured profile is tenant-owned and is
not a shared default for new clients.

The live SERVICE_AGREEMENT_LIFECYCLE uses
SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V40, which invokes both
SNOW_SERVICE_QUOTATION_DELIVERY_V17 and
SNOW_QUOTATION_DECISION_CONFIRMATION_V10. Both calculate max(season start,
issuedAt + expirationDays). Both parse organization QUOTATION_EXPIRATION as an
integer and fall back to 30 for a date. The native OPERATOR definition declares
this field required java.time.LocalDate, named Quotation Expiration Date.
Consequently the mismatch is in both source semantics and expiry implementations,
not a missing value to fill with the number 30.

Pending proposal, not an accepted configuration/type change: each new company
gets its own CONTRACT_SETTINGS initialized from an agreed CA season template;
dates still require a business decision. Use the agreement's season snapshot
and the existing configured 30-day fallback at link issuance. Make the legacy
organization QUOTATION_EXPIRATION field optional rather than silently changing
its Date type or inventing a required date. Altering required status needs
explicit authorization under the current no-type-changes constraint. No season
dictionary, organization attribute, type or shared Quote Script was changed by
this investigation.

The subsequent user instruction approved the CA dates above, the optional
QUOTATION_EXPIRATION field, and correction of both Quote calculations. That
instruction supersedes the pending proposal and the three remaining season/expiry
blockers in the historical notes. Profile creation and the onboarding executor
remain disabled.

## Shared Quote source dependency

- Parent task: CA subscription onboarding season and Quote-link expiry.
- From zone: Portal build tooling / plan-subscription onboarding.
- To zone: core-ui shared Request Quote Script sources and existing type importer.
- Blocking dependency: the active delivery and confirmation Scripts must use
  the same rule; OPERATOR must allow an omitted legacy expiration date.
- Required inputs: frozen agreement season, issuance timestamp, 30-day period,
  approved CA config and the single-field optionality patch.
- Expected outputs: two existing Script content updates, one required-flag
  change and a truthful read-only readiness projection; no new business records.
- Acceptance criteria: both live source hashes match, date boundaries pass,
  field datatype/values and unrelated types remain intact, no fixture or payment.
- Target time: this authorized dev-1 update.
- Owner: current ServiceWand business-logic change; shared Script source remains
  in core-ui rather than being duplicated in this package.
- Backup owner: backend/type maintainers for changes to the native type contract.
- Evidence: quote-expiry.test.mjs, OnboardingReadinessTest.java, native readback
  and final importer plans; no PR or commit created by this task.

2026-10-23 season/expiry verification: 54 pure Java readiness assertions,
20 boundary/calendar checks compiled from the two actual Quote methods, and
29 existing Entitlements tests passed. Both full shared Scripts compiled on
dev-1; an invalid agreement ID was rejected before any agreement read/save,
mail, Grant issue or revocation. Native readback showed the configured CA dates,
no invented Dictionary ID, required=false with className=java.time.LocalDate,
and verified live fingerprints for both Quote issuers.

The actual readiness evaluator over the live model/catalog, using explicitly
in-memory purchase sources, reports configurationReady=true and zero source
blockers while every execution/payment/grant flag stays false. There are still
no PLAN_SUBSCRIPTION Forms on dev-1, so this is not a positive persisted
confirmed-purchase or end-to-end onboarding test. Business counts (including
Dictionaries), entity values, User memberships, role permissions, ProductTypes
and other types stayed unchanged. The sole authorized type difference is
OPERATOR.QUOTATION_EXPIRATION.required=false; no native season record was created.

## Disabled executor and Checkout checkpoint (2026-10-23)

The earlier read-only readiness command remains read-only. The package now also
owns a separate executable onboarding pipeline, with execution, grant issuance
and access delivery disabled in `executor-config.json`. These switches do not
remove the existing Order/Invoice payment guards. No browser or request flag can
confirm payment or enable provisioning.

The authored sources are `OnboardingExecution.java`, `native-executor.java.inc`
and `resource-executor.java.inc`; `sync.mjs` embeds them into the existing Bill
and RM helpers. `enforcement-config.json` holds the consumer enforcement policy.
The pipeline is CA-only and uses the approved existing types. `prepareOnboarding`
freezes a source/graph/configuration digest on the confirmed subscription Order;
DRAFT_ORDER_READY schedules this preparation without creating onboarding records.
The operator can explicitly repeat it safely. `provisionOnboarding` is a separate
operator/system command. It returns BLOCKED while disabled or without verified
native paid Invoice + ACTIVE Order, a matching frozen source, active matching
Definitions and required enforcement configuration.

After a future explicitly authorized enablement, stages use purchase locks and
atomic records/receipt commits: company/season/Ledger/Client/admin and allowances;
RM Property with a deterministic code and its own receipt lock; separate starter
service Order and Agreement; graph verification; native credential delivery and
ready notification. A lost RM response reuses only a matching recorded Property.
Unknown/changed existing records are not automatically adopted or overwritten.
Properties start INITIAL, so an empty new organization's active-property baseline
is zero. Recorded quota usage is preserved on every retry. Policies cover
CREATE_ACTIVE/DELETE_ACTIVE and the frozen native ACTIVE workflow boundaries;
records are scoped to the new consumer, not the definition owner. Existing shared
Definitions are checked, never silently activated. Runtime quota enforcement is
still not established by these source/negative checks.

Paid evidence verifies native financial totals, exact Invoice type/line IDs and
frozen tax/amount fingerprints, positive fully paid amount, native PAID/ACTIVE
states and the payment record's observed timestamp. Fractional minor units,
missing timestamps and expired coverage fail closed. Month/year coverage is
calendar-based from that timestamp and is never extended by a retry. Payment
transport/webhook authorization and relaxing preparation guards are intentionally
outside this disabled checkpoint.

User reuse is an exact case-insensitive login lookup; existing passwords remain
unchanged. New admin assignments target only the new CA organization. A per-User
lock plus persisted delivery intents across purchase Orders prevents concurrent
purchases from independently resetting the same User. An uncertain credential or
ready-mail outcome requires reconciliation; no automatic second reset/send.
The ready login URL is read from `executor-config.json`, independently of the
purchase digest, so it can change without rewriting logic or re-consenting prices.

Weather is an explicit `WEATHER_SETUP_PENDING` stub approved by the user. Its
selection and quantity remain saved; no working activation/enforcement is
claimed. Weather purchases remain blocked for activation until the backend
operation mapping is supplied. Base-plan preparation is unaffected.

`readCheckout`, `reviseCheckout` and `readPurchaseStatus` are operator/system
business commands, not anonymous browser endpoints. Checkout edits require an
expected revision/digest and the allowlist in `../checkout/CheckoutChanges.java`;
email/system fields are refused. Edits serialize on the Form, revalidate and
reprice, invalidate prior consent, and issue a new one-time confirmation. A
confirmation mail completion is bound to its own token-row ID and digest so an
older send cannot mark a newer revision delivered. Confirmed purchases cannot
be silently edited. `../checkout/` owns the explicit DTO projection and shared
native tax assignment/preview. `../UI-API-CONTRACT.md` records the actual commands
and native read-only Order/OrderItem AccessGrant transport after consent. No buyer
Form editing or new HTTP adapter is required by the accepted flow. Issuance waits
for the customer-portal page URL in `../purchase-access/config.json`; this is
separate from the post-onboarding login URL.

This is source/native-compilation and disabled-stage verification, not successful
paid onboarding. No real organization, User, starter data, Grant or Pool has been
created to demonstrate the enabled graph. Do not turn these guards on as a
substitute for payment integration and a controlled native lifecycle test.
