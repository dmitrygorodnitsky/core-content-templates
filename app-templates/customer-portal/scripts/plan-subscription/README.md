# PLAN_SUBSCRIPTION: intake, Checkout and draft purchase

Owns backend intake, email confirmation, automatic Checkout preparation and
one-time purchase confirmation that creates a CUSTOMER Account plus DRAFT
subscription Order with catalog-priced plan, site expansion and Weather OrderItems.
When existing tax configuration is complete, it also prepares one unpaid DRAFT Invoice. The user approved a second email as the review/confirmation
channel while UI is absent. Since 2026-10-24 approval submits the order, its lines and the
invoice, the order email carries a Stripe test-mode payment, and full payment makes the
invoice PAID and the order ACTIVE (see "Card payment" below). No ProductType/ProductPriceType
changes are included.
Since 2026-11-09 the subscription Order runs on the unified ORDER_LIFECYCLE
(DRAFT → ACCEPTED → ACTIVE, then SUSPENDED, COMPLETED or CANCELED) instead of
workflow 66; see core-ui `docs/snow-unified-order-lifecycle-2026-11-09.md`.
Since 2026-11-10 its lines run on ORDER_ITEM_LIFECYCLE (DRAFT → ACTIVE ⇄
SUSPENDED → COMPLETED or CANCELED, always behind their order) and its invoices
on INVOICE_LIFECYCLE (DRAFT → SENT → OVERDUE → PAID or VOID) instead of
workflows 67 and 68; see core-ui `docs/snow-unified-items-invoices-2026-11-10.md`.
The disabled onboarding executor and operator Checkout commands are described in
`onboarding/README.md`. `purchase-access/` owns read-only native Magic Link access
to the confirmed Order and its exact items; `UI-API-CONTRACT.md` describes that
transport. Buyer Form editing and a new session/API are not required. The future
customer-portal URL is deliberately unset, so issuance/delivery waits without
mailing a broken placeholder. Enabled onboarding is not an accepted result yet.

## Purchase read access

The accepted buyer flow uses the existing two one-time FormTokens and workflow.
Before consent the review is the second email, not a publicly editable Form.
After DRAFT_ORDER_READY the guarded CMS continuation calls billing to issue a
native read-only AccessGrant on exactly that Order and its materialized items.
Order and item entries delegate P_ORDER_R only; one entry per distinct item
ProductPrice delegates P_PRICE_R with `id` and `product {id, nls}` so the order
page can name each line (read through `/core-pim/i/{token}/product-price/get.json`).
Every entry has an explicit read subset and empty write mappings. No buyer User,
tag assignment, session or new HTTP API is needed.

`purchase-access/config.json` is the authored configuration. On dev-1 `pageUrl`
is `https://dev-1.servicewand.com/subscription-order.html`, the site page built
from `runtime/plan-subscription/`. An empty `pageUrl` keeps the receipt
WAITING_FOR_PURCHASE_PAGE_URL and issues no grant or broken link. The focused
`--purchase-access-only` checkpoint asserts that unconfigured state and therefore
fails while `pageUrl` is set. After deployment of a page URL, the operator can repeat
`deliverPurchaseReadAccess(formId, checkoutDigest)` for a waiting confirmed Form.
Issued links are not automatically replaced, including after expiry or unknown
mail outcome. `readPurchaseReadAccess` returns a nonsecret operator receipt.

The native read credential permits repeated reads for at most 24 hours; the
verification/consent FormTokens remain single-use. Its plaintext appears only
in the in-memory mail link, with order ID and token in the URL fragment. The
Order receipt contains grant ID/expiry/delivery status, never the token. The
temporary issuer uses the actual system identity and only P_GRANT_W, P_ORDER_R
and P_PRICE_R;
persisted user roles and buyer permissions are not extended.

Focused dev-1 verification with temporary reserved fixtures:

```sh
node app-templates/customer-portal/scripts/plan-subscription/check-dev1.mjs --apply --purchase-access-only
```

It exercises both FormTokens, the unconfigured-page branch, retries and native
read grants using the actual private issuer/mapping policy. It cleans its test
grant, draft, invoice, items, purchaser, Form, address and temporary helpers.
It does not create a buyer User or test delivery through an actual portal/mailbox.

## Purchase page link

`/subscribe.html` accepts `plan` (product code or id), `period` (`MONTHLY` or
`YEARLY`), `packs` (site expansion packs) and `weather` (properties with
Weather Intelligence). `selection.initial` applies the form's own rules: packs
are clamped to the plan maximum, and a weather count above the resulting
capacity, or any add-on without a self-service plan, is dropped. The Snow
Removal landing's Add-ons configurator builds these links.

## Sources

- `PLAN_SUBSCRIPTION_WORKFLOW_V11.java`: Core CMS workflow helper. Its optional
  `CONFIRM_PAGE_URL` metadata makes both FormToken emails link to
  `<page>#step=verify|purchase&token=…`; without it they link to the native
  `send-event` endpoint.
- `scripts.json`: Script seed for the existing core-ui `coreScripts.ts` importer.
- `workflow.json`: Form workflow seed for the existing core-ui importer.
- `PLAN_SUBSCRIPTION_DRAFT_V5.java`: billing-side preview and atomic Account/Order/selection item and DRAFT Invoice preparation.
- `onboarding/`: CA readiness, frozen execution plans, disabled idempotent native
  executor and consumer policy/binding provisioning. No onboarding entities are
  created by the current disabled deployment; see its README for limits.
- `email/`: the shared email layout embedded into the CMS and billing scripts.
- `payment/`: purchase lifecycle rules embedded into the billing script.
- `PLAN_SUBSCRIPTION_PAYMENT_V1.java`: creates the Stripe PaymentIntent for a submitted subscription invoice on the core-pay node.
- `checkout/`: explicit operator-only read/edit DTO commands and shared native
  tax assignment used for both preview and the existing Order workflow.
- `PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1.java`: permanent RM-side read-only
  Property type inspector and disabled Property stage; never a test fixture.
- `entitlements/`: prepared catalog-to-Entitlements configuration, per-purchase
  provisioning/recovery review templates (no issuance), and read-only
  validation/preview CLI; no grants, active bindings or payment are issued.
- `entitlements/checkout-config.mjs`: exports the purchase-only manifest from
  config.json into billing Script metadata (`--write`, or `--check` for drift).
  No entitlement entities, client/session data or credentials enter this seed.
- `invoice-workflow-guard.json` / `item-workflow-guard.json`: retired 2026-11-10; they point at the
  core-ui INVOICE_LIFECYCLE and ORDER_ITEM_LIFECYCLE seeds, whose hook scripts carry the
  preparation snapshot, deletion and lifecycle guards.
- `order-workflow-guard.json`: retired 2026-11-09; points at the core-ui
  ORDER_LIFECYCLE seed, whose hook script carries the order tax hook and guards.
- `check-dev1.mjs`: integration check restricted to dev-1; creates synthetic Forms
  and run-scoped Addresses, Accounts, Orders, OrderItems and Invoices plus temporary test Scripts,
  then deletes them.
- `verification-test-helper.java`: temporary test Script source. Never attach it
  to a business workflow or deploy it independently.
- `base-plan-test-helper.java`: temporary administrator-only fixture for a
  legacy empty draft and mismatched saved pricing snapshot. It requires the
  exact run label, reserved email, seller/type/DRAFT and Form correlation.
  It mutates the managed item collection for native orphan removal; do not
  emulate this fixture with a partial CRUD replacement of Order.items.
  Never bind or seed this helper permanently.

The seller is SERVICEWAND. The FormType has eleven attributes in three groups.
COMPANY_ADDRESS is the single company, billing and legal address; the separate
BILLING_DETAILS group and its five attributes were removed on 2026-10-18.
Email confirmation reaches EMAIL_VERIFIED_MODEL_PENDING. Protected actions then
advance through CHECKOUT_PREPARED and PURCHASE_CONFIRMATION_RECEIVED to terminal
DRAFT_ORDER_READY; payment remains blocked.
`SITE_EXPANSION_PACKS` and `WEATHER_PROPERTY_COUNT` are optional Integer fields.
A selected expansion/Weather requires an explicit positive count; without that
selection its count must be absent or zero. Negative, fractional, nonnumeric,
out-of-Integer-range and duplicate selections are refused. Only one compatible
site expansion can be selected. The expansion count means packs, not Properties;
Weather count means the Properties selected for Weather, not all organization
Properties. Actual Property selection/provisioning is a later stage.
Pending old add-on submissions without quantities are not backfilled with guessed
counts. The operator-only reviseCheckout command can update an unconfirmed
Checkout with explicit counts and fresh consent. Buyers review their submitted
data in the second email; corrections use a new submission or operator assistance.

The billing node validates plan → add-on `COMPATIBILITY` before issuing the
first token, preparing Checkout and creating a draft. Allowed product families
are SERVICEWAND_SAAS_PROPERTY_EXT_* and SERVICEWAND_WEATHER_INTELLIGENCE, with
same-seller public licensed recurrent prices. Routing products (old and new),
Custom Reports and any unsupported product are rejected, without silently
dropping a requested item or charging it. Enterprise remains sales-only.
Capacity is ACTIVE_PROPERTIES_INCLUDED + packs × expansion COUNT; Weather
cannot exceed that purchased capacity. The overall plan maximum is the plan's
Integer attribute ACTIVE_PROPERTIES_MAXIMUM on SERVICEWAND_SAAS (dev-1:
Foundation 500, Growth 1000, Business (SERVICEWAND_PROFESSIONAL) 2000;
Enterprise has none). All three come from the product model, not prose, and a
plan without a maximum cannot be checked out. They are validated before the
first Magic Link, in Checkout and again before draft creation;
capacityValidation is VALIDATED_PRODUCT_MAXIMUM and the snapshot's
maximumSource is PRODUCT_ATTRIBUTE.
Taxes are previewed with transient native OrderItems using the same assignment
function as Order.onUpdate, bound to the reviewed digest, and checked again
during Invoice preparation. Non-minor-unit totals require a rounding policy.
ProductPriceTypes are unchanged.

Initial SUBMITTED entry starts a bounded virtual worker with a server-generated
preparationRequestId in Form metadata. It resolves the exact committed seller/type
Form by that correlation before preparing anything. It carries neither the
transient Form object/ID nor the anonymous request principal across the boundary.
The worker establishes a fresh in-memory SYSTEM identity; a rolled-back submission
has no visible matching row and creates no Address/token/mail. Later continuations
retain their existing after-transaction scheduling and committed-state checks.


COMPANY_ADDRESS must be a nonblank string without control characters, at most
4096 characters after trimming. Its original submitted text is preserved and
covered by the input digest. Names and phone remain optional client inputs.

## Checkout and draft purchase

The buyer needs no Core User, SYSTEM_ADMIN role, generic Script permission or
ordinary entity CRUD access. The authorized transport uses the existing native
FormToken endpoint for two distinct one-time actions:

1. VERIFY_EMAIL consumes the first emailed token and records verified immutable
   inputs/address. After that state commits, the workflow runs prepareCheckout
   as the native system service identity.
2. CHECKOUT_PREPARED issues a separate CONFIRM_PURCHASE FormToken and sends a
   second simple email with company/contact details, named plan/add-ons, billing
   period, each line quantity/unit amount/line amount and the subtotal before taxes.
   It shows the purchased capacity and plan maximum, states that taxes and payable total are pending and that confirmation
   creates a draft without taking payment. No template or UI is added.
3. Opening that token checks its native Form/event binding and used row, the
   saved verified inputs/email, exact prepared Checkout digest and its own
   24-hour expiry. Request metadata cannot select another Form or replace prices,
   seller, contact data, snapshot or generated IDs; the hook uses persisted data.
4. PURCHASE_CONFIRMATION_RECEIVED commits the consent receipt before remote
   billing begins. A system continuation calls confirmPurchase with the saved
   snapshot and sends DRAFT_PREPARED after saving the returned Account/Order.

Both tokens have separate native rows and a configurable 24-hour lifetime. A
Form ID or checkoutDigest alone cannot authorize confirmation. Direct events
also require native token-consumption proof. Form and Script grantability is
unchanged; tagged API is not used before a buyer User exists. Native FormToken
responses still return only the Form ID, not a public Checkout JSON read API.
The second email is the review channel explicitly selected for this stage.
Catalog validation uses the existing billing/PIM queue and does not depend on
public HTTP detail endpoints for resolving unpriced excluded products.

System execution checks the actual persisted IUserManager.getSystemUserId(),
not Auth.isSystemUser(): the latter tests SYSTEM organization scope, not the
caller ID. The CMS continuation and billing worker use an in-memory principal
with that native identity, seller SERVICEWAND scope and an empty role set.
No buyer User or persisted role/permission assignment is added. The service
principal and its empty role set are in memory only. Internal service execution
does not require SYSTEM_ADMIN. Execution receipts record identity,
User ID and administrator flag; billing records its own identity/flag too.

The generic Script API remains authenticated for operator reconciliation:

- prepareCheckout(formId: Integer) can inspect/recheck a verified purchase.
  It creates no Account/Order; normal buyer preparation runs automatically.
- confirmPurchase(formId: Integer, checkoutDigest: String) requires the saved
  one-time consent even for an operator. It creates or recovers one CUSTOMER
  and one subscription DRAFT per seller/Form. It cannot replace buyer consent.

Core Script JSON numeric arguments use Integer; conversion to native Long Form
IDs is internal. Unknown remote outcomes require explicit reconciliation on the
same Form. A matching committed billing draft is recovered without duplication;
failed/expired links are not automatically replaced or resent. Mail dispatch
also has no durable outbox or ambiguous-outcome retry policy.

The plan preview uses PER_UNIT_RECURRENT catalog prices for MONTHLY (1 MONTH)
or YEARLY (1 YEAR / 12 MONTH), UNIT_PRICE and CURRENCY. There must be exactly one
matching public seller price. Add-on annual catalog prices must equal the monthly
price × 12 in the same currency; plans keep their exact catalog annual price.
Preview `lines` records product/price IDs, role, quantity/source, period,
currency, unit and line amount; `subtotal` is their exact BigDecimal sum.
Plan compatibility, included capacity, pack capacity and selected quantities
are revalidated; resulting selection/capacity/lines are covered by the catalog
fingerprint. Taxes stay NOT_CALCULATED and totalPayable is null.

### Entitlements bound to Checkout — 2026-10-22

New previews use schemaVersion 3. `preview.entitlements` records the configured
Boolean features (including disabled/absent values), exact STRING levels, included
Properties, selected expansion pack size/count, combined capacity, Weather
selection/count and coverage rules. It records no payment date or recipient
organization, grants remain disabled and enforcement is explicitly unverified.
The purchase-only mapping is exported from canonical entitlements/config.json to
billing Script metadata. Ownership/provisioning decisions are excluded from it.

`entitlementFingerprint` hashes the canonical snapshot. `catalogFingerprint`
canonically hashes the complete preview including that snapshot and fingerprint;
the existing Checkout/input digest and second FormToken bind that result. JSON
map order and execution-node ordering do not change these hashes. Enabled features,
levels and purchased capacities are included in the existing second review email.

Before recording one-time consent, the native Form exit hook obtains a fresh
billing preview as SYSTEM and compares both fingerprints. Changed prices,
features, levels, capacity or mapping configuration reject the old review before
authorization or Account/Order creation. Billing repeats the comparison immediately
before a new draft, covering a change between consent and remote preparation.
Request metadata cannot override the saved Entitlements or fingerprints.

An explicit operator prepareCheckout on a changed CHECKOUT_PREPARED Form replaces
the snapshot and requests a new one-time confirmation after commit. The previous
confirmation ID/digests are retained as a superseded receipt without the captured
test token. Old links cannot authorize the new snapshot; an unchanged refresh
does not issue another link. Expired/ambiguous deliveries are not automatically
resent and no durable mail outbox is introduced.

New Orders retain the full snapshot in planPreview and bind its fingerprint in
the Account/Order/OrderItem/Invoice metadata receipts. The CMS purchase receipt
returns the same snapshot. Existing committed legacy drafts remain recoverable
from their saved consent; they are not backfilled/repriced from today's catalog.
Unconfirmed legacy Checkouts require explicit refresh and fresh consent before
creation. No Grants, Pools, feature checks or payment are enabled by this stage.

Focused native integration is `check-dev1.mjs --apply --entitlements-only` with
the existing credential environment. It uses CA synthetic purchases and temporary
helpers, compares Java output with an independent JS catalog projection, simulates
old internally consistent review hashes without mutating shared Products, checks
fresh consent/recovery, and cleans all synthetic entities/helpers afterward.

Billing runs on a CORE/CORE-ACCT/CORE-PIM/CORE-BILL node via ScriptService's
existing queue, following Quotation. Queue submission commits before CMS waits
for a result; billing never tries to load the locked source Form. An unknown
remote outcome is recorded for an explicit same-Form retry, never auto-replayed.

The billing helper serializes each seller/Form with a PostgreSQL transaction
advisory lock. Account and Order creation share one transaction. A deterministic
Account code and matching metadata receipts recover remote commits if CMS
could not save the returned IDs. A different Form is a different purchase;
accounts are not merged merely because they share an email.

CUSTOMER is the user-selected existing AccountType. The company name is the
Account label, names/phone remain optional, PRIMARY/WORK/EMAIL entries use the
submitted data, and one existing Address link has both BILLING and LEGAL types.
New purchaser Accounts use the user-approved temporary LEGAL_ENTITY_TYPE
INDIVIDUAL from onboarding/config.json. This is an onboarding placeholder, not
a classification inferred from the company name or address; a ServiceWand
manager is expected to review it. Recovery never overwrites an existing Account
classification. The future starter Customer 1 uses the same approved default.
The draft uses SERVICEWAND_SUBSCRIPTION. Full selection, plan preview and source
Form/input/Checkout digests are stored in existing metadata. Every confirmed
line is materialized using the existing SERVICEWAND_SUBSCRIPTION_ITEM type and
DRAFT lifecycle: native itemPrice is the selected catalog ProductPrice,
itemCount is the confirmed quantity, amount is the catalog unit amount and
overrideAmount stays unset. All lines are saved atomically with Account/Order.
Routing/Custom Reports never become a line. Billing roles are BASE_PLAN,
SITE_EXPANSION and WEATHER; metadata records source receipt and quantity source.

The purchase receipt retains basePlanItemId/basePlanPriceId/basePlanAmount for
compatibility and adds ordered itemIds/subtotal. New drafts have
itemsMaterialized=true and pricingStatus=CATALOG_SELECTION_ONLY; that means
selection charges only, not a payable purchase. Lost CMS receipt recovery
checks every item against the persisted confirmed snapshot and native
Order.totalCharges, then returns the same IDs without repricing. Unexpected
lines/counts/prices/amounts stop for operator review. Legacy base-only snapshots
remain base-only recoverable (LEGACY_BASE_PLAN_ONLY); they are not silently
charged new add-ons. An explicitly recovered empty draft requires the saved
and current confirmed fingerprints to match; there is no bulk backfill.

Source-state exit guards require the prepared snapshot / draft receipt before
the respective transition; target entry checks alone are not used as the gate.
The Form records `checkout` and `purchase` under metadata.PLAN_SUBSCRIPTION.
The Order records PLAN_SUBSCRIPTION.draftOnly=true, basePlanMaterialized=true,
basePlanPricingStatus=CATALOG_PLAN_ONLY and itemsMaterialized=true for new drafts.
Native totalCharges contains the complete confirmed selection charge; grandTotal and any existing automatic tax
assignment are provisional and must not be presented as a payable total.
The ORDER_LIFECYCLE DRAFT exit guard refuses these drafts for
SERVICEWAND_SUBSCRIPTION orders; its onUpdate assigns the taxes and then runs
the scoped invoice snapshot guard.
No Payment is created and no Order is activated.

## Tax inspection and Order → DRAFT Invoice

The tax source is the ORDER_LIFECYCLE Order.onUpdate (`assignSubscriptionTaxes`
for SERVICEWAND_SUBSCRIPTION orders, formerly workflow 66), not an invented rate
table or a new calculator. It assigns TAX
dictionary rates matching the Account BILLING Address COUNTRY/STATE to the
OrderItems. Native OrderItem.getTotalTaxes/getGrandTotal perform the monetary
calculation including quantity; Invoice.getAmountDue sums those same items.
The inspected GENERAL_FSM_ORDER_ITEM helper only logs updates; it has no tax
calculator. The existing INVOICE workflow 22 shows the native item association.
Neither tax dictionaries nor entity/ProductTypes are changed by this stage.

The saved resolved COMPANY_ADDRESS components and ID must still equal the native
BILLING address before invoice preparation. The native Order save runs its
existing tax hook; the helper audits the resulting rate assignments and reads
native totals. An explicitly configured zero is supported. A missing rate,
invalid matching rate or inclusive-tax configuration unsupported by the native
calculator yields TAX_CONFIGURATION_REQUIRED and no Invoice. No default zero
or guessed jurisdiction rule is used. Configured rates are not a legal review
of taxability or rate correctness.

After confirmed line validation, the same seller/Form transaction lock serializes
invoice preparation. One STANDARD Invoice in DRAFT references the original
OrderItems (no cloned charge lines), belongs to the same seller/Order and has
no payments or invented dueDate. Invoice data and the parent receipt store
snapshotFingerprint, native amountDue/taxes, exact item IDs and paymentEnabled=false.
The Form receipt reports invoiceId/invoiceStatus and invoicePreparation; the
Form remains DRAFT_ORDER_READY. CMS prepareInvoice(formId, checkoutDigest) is an
operator reconciliation command with the same verified-Form/one-time-consent
checks as confirmPurchase. New confirmations prepare automatically; retries
recover the same invoice without repricing. A missing saved Invoice, existing
foreign invoice or overlapping item association requires operator review.
Old base-only snapshots are not silently converted into a complete invoice.

The native calculator retains arbitrary decimal precision. No rounding mode is
invented: EXACT_MINOR_UNITS means the native amount fits the ISO currency's
fraction digits; otherwise ROUNDING_POLICY_REQUIRED is recorded. Drafts retain
the exact native amount. A later payment stage must resolve rounding and verify
the saved Properties maximum before any payable submission.

Invoice.items is a native cascade-ALL/orphan-removal association to OrderItems.
For these preparation invoices, scoped Order/OrderItem/Invoice guards reject
line or amount drift, unsafe deletion and leaving Invoice DRAFT. Ordinary
invoices/orders without this preparation receipt retain their existing behavior.
The guards run in the hook scripts of the shared workflows in core-ui:
`ORDER_LIFECYCLE_WORKFLOW` (order), `ORDER_ITEM_LIFECYCLE_WORKFLOW` (lines) and
`INVOICE_LIFECYCLE_WORKFLOW` (invoices). This script is bound to no workflow; it
keeps `guardPreparedInvoice` as the self-check it runs after preparing an invoice.
`payment/PurchaseLifecycle.java` holds the lifecycle rules of the purchase, and
`INVOICE_LIFECYCLE_WORKFLOW` applies the same ones to a prepared invoice:
the invoice DRAFT unpaid; SENT (or OVERDUE) together with its ACCEPTED order and accepting
exactly one payment of the full amount; PAID only fully paid; VOID after a cancellation.
The order leaves DRAFT with its one prepared DRAFT invoice and its lines, and becomes
ACTIVE only after that invoice is PAID; its lines then follow it. A later invoice of
the same order that goes OVERDUE suspends the order for non-payment and its payment
resumes it; a manual Resume is refused while one of its invoices is still OVERDUE.
Since the audit of 2026-11-10 the three lifecycle hooks also refuse a save that
carries a state other than the committed one (states change through events), and a
subscription invoice gets no due date, so nothing marks it OVERDUE automatically; see
core-ui `docs/snow-unified-items-invoices-2026-11-10.md`. No Stripe configuration, webhook, User or permission assignment is added;
core-pay's own webhook records the payment.

For focused synthetic CA/US, explicit-zero/missing-rate, native totals and
invoice snapshot/idempotency checks:

```sh
node app-templates/customer-portal/scripts/plan-subscription/check-dev1.mjs --apply --invoice-only
```

Invoice-aware test cleanup uses the temporary administrator fixture to unlock
only the exact run's unpaid draft receipts, deletes Invoice first (native
cascade), then its Order/Account/Form/Address. Never delete a real preparation
invoice to reset a purchase: that can delete its OrderItems. The fixture is not
seeded or bound to business workflows.

## Company address resolution

Preparation follows WINTER_SERVICE_QUOTATION_CREATOR_V9: parse the submitted
formatted string into native Address components, then call
`IAddressService.resolveOrCreate`. The existing Core normalizer chooses an
existing Address or creates one; no new address type or FormType attribute is
introduced. Country/state references come from ICountryManager/IStateManager;
no default country, guessed contact details or hardcoded environment IDs are used.
Unit/suite forms and Canadian/US postal extraction follow the Quotation parser.

Require street, identifiable country, city and postal code; CA/US also require
a recognized province/state and valid postal syntax. Resolve only after product
validation and before token issuance, in the same preparation transaction.
An incomplete address or resolver failure takes PREPARATION_FAILED without
issuing a token or sending mail. No automatic retry/resend is added.

`metadata.PLAN_SUBSCRIPTION.companyAddress` stores PENDING, RESOLVED or FAILED.
FAILED means preparation did not commit a resolved address; preparationError
records the actual cause, which may also be an earlier catalog failure.
A resolved result records the native addressId, components, sourceDigest,
resolvedAt, method QUOTATION_RESOLVE_OR_CREATE and validation COMPONENTS_ONLY.
AWAITING_EMAIL entry and email confirmation require a resolved marker matching
the current COMPANY_ADDRESS digest. Future billing/legal/Property creation must
reuse the saved addressId and revalidate the address before purchase processing.

RESOLVED means parsed and resolved to a native Address, not geographically
verified or legally validated. Native resolveOrCreate normalizes/deduplicates
and saves; it does not call Google. Core getGeoLocation is a separate operation;
it is not added by this change. geoLocationStatus is only the status read from
Address, never an invented Google success. Geographic verification and ambiguous
location handling remain a separate dependency before payment.

## Token and delivery contract

Use `IFormService.createToken(formId, eventCode)`. The deployed service stores
`Hashing.sha3(rawToken)` in FormToken; assigning a raw UUID to its token column
does not produce a usable native link. The raw value belongs in the email URL.
Form metadata stores the token ID, expiry, email/input digests and delivery
status. Expiry is 24 hours from issuance, configured by `LINK_TTL_HOURS` on the
helper Script. The native GET/POST endpoint consumes the token on success.

Confirmation checks current persisted expiry and unchanged input/email in the
AWAITING_EMAIL exit guard. Core binds the token to its Form/event and consumes
it. The verified marker and terminal workflow state prevent a second logical
confirmation; concurrency checks assert exactly one transition in history.
Editing submitted fields requires a new submission in this first version.
There is no resend action yet, so no unagreed resend/revocation policy is implied.

On current dev-1, HTTP status is not proof of confirmation: replay returns 500
instead of the documented 410, and an expired/refused transition may return
200. Concurrent callers can both receive 200 even though only one transition
occurs. Always read the persisted state/verification marker before later
purchase processing. Correcting the Core endpoint's response contract remains
a separate backend dependency. The checker reports the observed HTTP codes
and asserts business-state outcomes, not fabricated transport success.

The helper uses `sendSimpleEmail`; no email template is created or edited.
The HTML of all three emails comes from `email/EmailLayout.java`, which
`onboarding/sync.mjs` embeds into both scripts: the dark site palette, a
`ServiceWand` wordmark, table layout and inline styles only, with the wording
unchanged. `email/EmailLayoutTest.java` covers escaping and structure.
`QUEUED` means that the Core send call returned, not inbox delivery. Dispatching
or unknown outcomes are not automatically retried because that could send a
duplicate. A crash between token commit and dispatch requires operator recovery
or a new submission; this implementation does not claim a durable mail outbox
or deduplication between separate form submissions.

`DEV_CAPTURE_INVALID_EMAIL` is restricted in code to the dev-1 host and
recipients ending in `@example.invalid`. Such submissions never invoke mail
delivery, are marked `SUPPRESSED_FOR_DEV_TEST`, and temporarily capture the raw
test token in protected Form metadata for API integration checks. These test
Forms must be deleted. The test runner never prints token values.

## Deployment and validation

Use the existing core-ui seed importers with this directory's absolute seed
paths, `--base-url=https://dev-1.servicewand.com/core` and `--org=SYSTEM`.
Apply the Script seed first and then the Form `workflow.json`, with
`--owner-org=SERVICEWAND --no-grant`. The Order, OrderItem and Invoice workflows are
ORDER_LIFECYCLE, ORDER_ITEM_LIFECYCLE and INVOICE_LIFECYCLE, applied from core-ui
`scripts/dev/seeds/orderLifecycleWorkflow.json`, `orderItemLifecycleWorkflow.json` and
`invoiceLifecycleWorkflow.json` with `--owner-org=SYSTEM`.
Review `plan` before `apply --apply`. Preserve every state/event; only owned
helper bindings and scoped snapshot and deletion guards change. This sequence installs the invoice
protections before enabling the Form continuation that creates invoices.
Use the existing importer: nested partial state writes can replace omitted
state fields and are not a safe deployment shortcut. Read back the
CONFIRM_PURCHASE target as PURCHASE_CONFIRMATION_RECEIVED. On current dev-1 the
mapped importer left the existing target unchanged even after a second apply;
`reconcile-confirmation-target.java` repairs only that owned edge through the
native manager, with an administrator check and strict old/new target guards.
Run it as a temporary Script, remove that Script afterwards, and require a
zero-difference workflow plan before accepting deployment. Never attach this
deployment helper to the business workflow or expose it to buyers.
The importers read credentials from their existing environment; never put them
in a seed or command argument. Do not change any other seed or workflow.

The workflow is attached to the existing PLAN_SUBSCRIPTION FormType through a
partial save of `workflow` only, using its current optimistic version. Verify
all attributes and groups against the pre-attachment readback. For the
2026-10-18 address simplification, a separate optimistic partial save updated
only attributes, attributeGroups and attributeOrder. Preserve the workflow,
permissions, labels, owner and every surviving attribute definition. Address
resolution performs no FormType writes; the checker compares complete live
FormType snapshots, independent of an authored descriptor that may be stale.

When updating Java code, refresh the `utility source` digest comments in the
workflow hooks and apply both seeds so the hook context is refreshed. If an
existing helper binding remains cached on the deployed runtime, publish a new
helper code/version and point this workflow to it rather than clearing caches
for unrelated scripts.

Run from the repository root with configured dev-1 credentials:

```sh
node app-templates/customer-portal/scripts/plan-subscription/check-dev1.mjs --apply
```

Checks exercise the real Form API, native anonymous token endpoint, expiry,
replay/concurrency for both token actions, automatic SYSTEM execution without
administrator roles, ignored forged request metadata, address component extraction, native persistence/reuse and
unit separation, verified Checkout snapshots, expired/stale purchase links,
concurrent/repeated draft
confirmation, monthly/yearly plan and add-on amounts/quantities/ProductPrices/native charges,
invalid/missing/orphan quantities, compatibility, Weather capacity, Routing/Reports exclusion,
lost-receipt recovery without duplicate items, matching legacy empty-draft
upgrade and refusal of a mismatched saved snapshot, the Submit guard,
invalid addresses, catalog/Enterprise checks and protection
against changing the submitted email or company address. Test addresses use
run-specific street names and are removed after their Forms. Reserved recipients prevent sending
mail to real people. Actual transport/inbox delivery requires a separate test
with a nominated recipient.

Product-model decisions and deployment evidence belong in
`../../content/cases/SERVICEWAND-PLAN-SUBSCRIPTION-FORM-TYPE.md`.

## Card payment (Stripe test mode)

`DRAFT_ORDER_READY` runs prepareOnboarding, then `submitPurchase`, then the
order email. `submitPurchase` moves the order DRAFT → ACCEPTED (`DRAFT-ACCEPTED`),
then the invoice DRAFT → SENT (`DRAFT-SENT`); the lines stay DRAFT until the order is active. Core
applies `sendEventUnsecured` asynchronously in its own transaction, so each
transition is sent without locks and read back before the next one; otherwise
the next guard sees the old state and the transition is silently dropped.

Before the order email, `createPurchasePayment` submits
`PLAN_SUBSCRIPTION_PAYMENT_V1.createInvoicePayment` to a CORE-PAY node. The
helper accepts only the system executor, checks the prepared SENT or OVERDUE unpaid
invoice of an ACCEPTED order and charges its outstanding amount through
`PaymentRequestBuilderFactory` (the Stripe controller requires an HTTP request).
The email link gains `&pay=<client_secret>`; the receipt keeps `paymentStatus`,
`paymentIntentId` and any `paymentError`, never the secret. A failed creation
still sends the email without payment. `paymentHelperCode` in
`purchase-access/config.json` enables it.

core-pay's webhook records the payment. The invoice update guard then schedules
`completePaidPurchase`, which marks the invoice PAID if core-pay did not (`SENT-PAID`
or `OVERDUE-PAID`), then activates the order (`ACCEPTED-ACTIVE`) through awaited
transitions and waits for the order hook to activate the lines. It is idempotent and
may also be run by an administrator. Once the invoice is PAID and the order and its lines are ACTIVE it starts
activation: it submits
`PLAN_SUBSCRIPTION_WORKFLOW_V11.provisionOnboarding(formId, checkoutDigest)` to a
CORE-CMS node as the system executor (the frozen plan supplies both values) and
waits up to five minutes. It skips activation when the executor is disabled or
onboarding is already COMPLETE; a blocked purchase (for example Weather) comes
back BLOCKED without mutations.

## Proof (b) 2026-11-10

dev-1 run `3d7e4146`, 00:58–01:36 UTC, against the deployed ORDER_LIFECYCLE
(workflow 86), order type 7 bound to it, `PLAN_SUBSCRIPTION_DRAFT_V5` (738),
`PLAN_SUBSCRIPTION_WORKFLOW_V11` (800), `PLAN_SUBSCRIPTION_PAYMENT_V1` (811) and
`ORDER_LIFECYCLE_WORKFLOW` (1103); each deployed source equalled the checked-in
file. Transition rows are `POST /core-bill/api/order-state-transition/list.json`
filtered by `entity.id`; user 2 is the purchase system executor, user 1 the
API-key administrator that sent the manual events. Times are UTC.

`check-dev1.mjs --apply` stops at ACCEPTED/SUBMITTED (ACCEPTED/SENT since 2026-11-10) and deletes its purchases.
Both attempts that night failed before any business check (a connect timeout
during authentication, then HTTP 401 on its billing fixture call); the second
left its two helper Scripts 1106 and 1107, which were deleted. The order was
driven through the same public path instead: anonymous Form
submit, the captured email token, the captured purchase confirmation, then the
automatic DRAFT_ORDER_READY continuation. Buyer email
`plan-subscription-proof-b@example.invalid`, so the order email's payment was
`SUPPRESSED_FOR_DEV_TEST`; the PaymentIntent was then created by
`PLAN_SUBSCRIPTION_PAYMENT_V1.createInvoicePayment`, submitted to the CORE-PAY
node as the system user by a temporary administrator Script, and confirmed
against Stripe test mode (`pk_test_`, `pm_card_visa`, `livemode: false`).
Weather and two site packs were selected; the order carried no frozen
onboarding plan, so activation provisioned nothing.

Checkout (Form 671, Account 1031, Order 350, Invoice 51, items 517–519,
Vancouver BC, Growth monthly + 2 site packs + Weather ×10, amount due 860.72):

| Step | Order 350 | Transition row | Items 517/518/519 (workflow 67) | Invoice 51 (workflow 68) |
|---|---|---|---|---|
| DRAFT_ORDER_READY 01:20:05 | DRAFT → ACCEPTED | 1325 ACCEPTED (456) 01:20:06.787, user 2 | SUBMITTED 01:20:04.446 / 05.127 / 05.787 | SUBMITTED 01:20:07.195 |
| Stripe confirm 01:22:52, `succeeded`, 86072 usd | ACCEPTED → ACTIVE | 1326 ACTIVE (457) 01:22:57.142, user 2 | ACTIVE 01:22:56.510 / .680 / .847 | PAID 01:22:56.169; payment 12 (860.72, observed 01:22:52.915) |
| `ACTIVE-SUSPENDED` sent 01:23:48.285 | SUSPENDED | 1327 SUSPENDED (458) 01:23:48.350, user 1 | ACTIVE | PAID |
| `SUSPENDED-ACTIVE` sent 01:25:05.788 | ACTIVE | 1328 ACTIVE (457) 01:25:09.140, user 1 | ACTIVE | PAID |
| `ACTIVE-CANCELED` sent 01:25:35.918 | CANCELED | 1329 CANCELED (460) 01:25:35.999, user 1 | ACTIVE | PAID |

No transition row exists for the initial DRAFT (the order is created in it).
The DRAFT → ACCEPTED, line activation, invoice PAID and ACCEPTED → ACTIVE
steps were all automatic: core-pay's webhook recorded the payment and the
invoice guard scheduled `completePaidPurchase`; no operator call was needed.
Every send-event answered HTTP 200 with an empty body.

The suspension body that works is the UI envelope
`{"SUSPENSION_REASON":{"value":"NO_PAY"},"MESSAGE":{"value":"proof"}}` (the
endpoint takes a map of attribute objects). Read back after suspension:
`SUSPENSION_REASON` NO_PAY, `SUSPENSION_MESSAGE` proof, `SUSPENDED_AT`
2026-11-10T01:23:48.350686997Z. Resume and cancel leave these three keys in the
metadata. Canceling the order leaves its lines ACTIVE and its invoice PAID.

Quote entry refused (Form 670, Account 1030, Order 349, item 516; NY address,
no tax rate, so no invoice and the order stays DRAFT; the continuation recorded
"Onboarding readiness currently supports CA only" for onboarding, submission and
read access): `POST /core-bill/api/order/349/send-event.json?event=DRAFT-QUOTE_PREPARED`
with `{}` at 01:17:28.902 answered HTTP 200 with an empty body; the order read
back DRAFT in every poll until 01:19:18 and again at 01:19:24, with no
transition row. The refusal is
silent over REST; which hook threw (DRAFT `onExit` draft-exit guard or
`onQuotePrepared`) is not visible.

Deleted and read back as gone: Forms 670, 671; read-access Grant 227; the
payment BalanceTransaction 12 and core-pay `payment_request`
1d441923-f898-46b4-8b30-5605fe7d70ee (removed by temporary administrator
Scripts scoped to Invoice 51, because `fk_payment_request_invoice` refused the
Invoice delete); Invoice 51; Orders 349, 350; OrderItems 516–519; Accounts
1030, 1031; Addresses 1129, 1130; temporary Scripts 1104, 1105. The Stripe
test-mode PaymentIntent `pi_3Ua3lsQWOX4qwHeX54199554` remains in Stripe.

## Proof (c) 2026-11-10: unified lines and invoices

After the lines and invoices moved to ORDER_ITEM_LIFECYCLE (87) and
INVOICE_LIFECYCLE (88), the public path was run again on dev-1 with Form 677
(`proof-ii-sub-1110@example.invalid`, Growth monthly + 2 site packs + Weather ×10,
Vancouver BC): Account 1037, Order 366, lines 532–534, prepared Invoice 53
(860.72 USD). Submit left the lines DRAFT and moved the order to ACCEPTED and
the invoice to SENT. A recorded payment of the full amount then made the invoice
PAID, the order ACTIVE and the three lines ACTIVE without an operator call. A
second invoice (54) marked OVERDUE suspended the order with `SUSPENSION_REASON`
NO_PAY and its lines with it, and Mark Paid resumed both. Canceling the order
canceled the lines, voided the DRAFT invoice 56 and left the SENT invoice 57
flagged with `ORDER_CANCELED`. The transition rows and times are in core-ui
`docs/snow-unified-items-invoices-2026-11-10.md`.

The payment was not a Stripe payment: the agent that ran the proof may not
submit a payment on a hosted environment, so it wrote the payment row
(`balance-transaction` 13, ONLINE, to the SERVICEWAND Ledger) through the REST
API as core-pay's webhook does and saved the invoice. `createInvoicePayment`
against a SENT invoice and the webhook itself were not exercised; repeat the
payment of Proof (b) by hand to cover them.

`check-dev1.mjs --apply` was run twice afterwards and, as on 2026-11-10 before,
stopped ahead of its first business check (a connect timeout, then HTTP 401 on
its billing fixture call); its temporary Script 1111 was deleted.

Deleted and read back as gone: Form 677, read grant 236, payment row 13,
Invoices 53, 54, 56, 57, Order 366 with lines 532–534, Account 1037, Address
1132.
