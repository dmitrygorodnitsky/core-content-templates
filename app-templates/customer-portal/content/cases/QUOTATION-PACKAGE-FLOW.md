# Quotation package — the service agreement carries the quotes

Status: implementation in progress, decided with the user on 2026-09-11 and
revised through 2026-09-23; where the flow stands is §10. Facts marked *verified* were read
from dev-1; everything else is our design, filling what the client spec
(`quotation-contract-client-activation-flow.md`) leaves open.

Related: `SNOW-VERTICAL-CORE-MODEL.md` §6c (magic links) and §7 (decisions),
`QUOTATION-FLOW-IMPLEMENTATION-GAPS.md` (workflow 49 and its scripts).

## 1. Why the agreement is the package

- **Nothing joins the quotes a client decides together.** Every quote is its own
  `Order` with its own workflow instance. The spec wants the workflow to decide
  when "the required quotation set is sufficiently approved" (§8), which needs a
  set to reason about.
- **The spec wants one email and one review experience per package** (§7.2). A
  hook on every Order would send one email per quote: 150 for a client with 50
  properties.
- **A magic link cannot reach a Form** (*verified*: `core-cms` exposes no
  `/i/{token}` endpoint), so `CONTRACT_INFORMATION` cannot be filled through the
  anonymous link as a form.

The `SERVICE_AGREEMENT` document solves all three. It exists from the first
internally approved quote, lists the package in `ORDERS`, is sent once, and
collects the client's contract details as attributes of one of its own events.

## 2. The flow at a glance

```text
GET_QUOTE_ form, on submit ──► Account, addresses, one SNOW_REMOVAL_PROPERTY per address,
                               one Order per property × pricing model, SERVICE_PROPERTY set
                                   │
manager takes the request (NOTIFIED → PROCESSED by hand): the requester gets the email with
the Account link, and the manager reviews and corrects the Orders
                                   │
Order QUOTE_APPROVED_INTERNALLY ──► added to the account's open agreement (QUOTATION)
                                   │
manager: Send Quotation on the agreement
                                   ▼
Agreement QUOTATION_SENT ──► Orders → QUOTE_SENT, Account DRAFT → PROSPECT,
                             one link (account + orders + agreement), one email
                                   │
client, per option: view / approve / decline / request changes (event on the Order)
                                   │
changes requested ──► manager revises the Order and approves it internally again
                      (it stays in the same agreement), then Send Updated Quotation:
                      Agreement QUOTATION_UPDATE ──► QUOTATION_SENT, the same delivery:
                      previous link revoked, revised Orders → QUOTE_SENT, a new link,
                      an email saying the quotation was updated
                                   │
every property decided ──► Agreement AWAITING_CLIENT_DETAILS
                                   │
client submits contract details (event on the agreement, with attributes)
                                   ▼
Agreement CLIENT_DETAILS_RECEIVED ── our hook checks them ──► DRAFT, or back to AWAITING_CLIENT_DETAILS
                                   │
Agreement DRAFT ──► PENDING_MANAGEMENT_APPROVAL ──► INTERNALLY_APPROVED ──► SENT_TO_CLIENT
                                   │                         (link + email)
client approves ──► CLIENT_APPROVED ──► Account → ACTIVE ──► portal User (staging; portal flag deferred)
```

Since 2026-09-17 the manager no longer builds the quotes: every entity is
created with the request, the form no longer collects a property size, and the
manager reviews and corrects the Orders. The manager's send is to become a bulk
action over the reviewed Orders, designed separately.

## 3. Records

| record | role in the flow | status |
| --- | --- | --- |
| `GET_QUOTE_` form, workflow 49 | the anonymous request | live, ours; entering `NOTIFIED` creates the Account, a property per address and three unpriced Order drafts per property, then enters `READY_FOR_REVIEW`; the manager's manual move to `PROCESSED` issues the Account link and sends the requester's email (*verified* 2026-09-22) |
| `Account` (`CUSTOMER`), workflow 14 `SNOW_CUSTOMER_LIFECYCLE` | the client; Party B | live, owned by `SERVICE_WAND_WINTER_SERVICES_CANADA` |
| `SNOW_REMOVAL_PROPERTY` (Resource 154) | one per service address | created by the flow since 2026-09-21; form 62 created Property 962 |
| `Order` (`FIELD_SERVICE_ORDER`), workflow 45 `GENERAL_FSM_ORDER` | one quote: one property under one pricing model | live, owned by `SERVICE_WAND_WINTER_SERVICES`; form 62 created Orders 53–55 with `SERVICE_PROPERTY` and `PRICING_MODEL` |
| `SERVICE_AGREEMENT` (Document) | the package, then the contract | type 17 and workflow 53 on dev-1, owned by `SERVICE_WAND_WINTER_SERVICES`; seed role grants applied and read back exactly on 2026-09-22 |
| organization type `OPERATOR` | portal flag; `QUOTATION_MANAGER`, `CONTRACT_MANAGER` for notifications | managers *verified*; portal flag to add |

## 4. Workflows

### 4.1 Order — workflow 45

Events, *verified*: `INITIAL-QUOTE_PREPARED`, `QUOTE_PREPARED-CHANGES_REQUESTED`,
`CHANGES_REQUESTED-QUOTE_PREPARED`, `QUOTE_PREPARED-QUOTE_APPROVED_INTERNALLY`,
`QUOTE_APPROVED_INTERNALLY-QUOTE_SENT`, `QUOTE_SENT-QUOTE_VIEWED`,
`QUOTE_VIEWED-CLIENT_APPROVED`, `QUOTE_VIEWED-DECLINED`,
`QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED`, `CUSTOMER_CHANGES_REQUESTED-QUOTE_PREPARED`.
No event carries attributes; its only hook is `onUpdate`, which calls
`ORDER_UTILITIES.updateOrder`, a method that only logs.

We add:
- a required `MESSAGE` attribute on `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED`
  (spec §7.4);
- the hooks in §5.

### 4.2 Service agreement — `SERVICE_AGREEMENT_LIFECYCLE`

Seed: `core-ui` `scripts/dev/seeds/serviceAgreementWorkflows.json`, applied to
dev-1 as workflow 53, extended on 2026-09-22 to 17 states and 33 events, and on
2026-09-23 to 18 states and 36 events with the quotation update below.
`workflows.ts` enumerates generated workflow permissions in the SYSTEM
deployment context, preserves their `SERVICE_WAND_WINTER_SERVICES` ownership,
and saves each role permission as the backend's link-only `{ id }` identifier.
The deployer removes stale permissions of this workflow before adding the exact
seed set. Live readback on 2026-09-23 from the `SERVICEWAND`-owned roles found
36 permissions on `SW_FS_WS_COMPANY_ADMIN`, 7 on `SW_FS_WS_SALES`, 2 on
`SW_FS_WS_OPERATIONS_MANAGER` and 4 on `SW_FS_WS_BILLING_FINANCE`, with no
missing or extra workflow permission. Five states stand in front of `DRAFT`,
two of them transient, and two failure states beside it:

| state | meaning | leaves by |
| --- | --- | --- |
| `QUOTATION` (initial) | quotes are being collected | `Send Quotation` (manager) → `QUOTATION_SENT`; cancel → `CANCELED` |
| `QUOTATION_SENT` | the client is deciding | package complete → `AWAITING_CLIENT_DETAILS`; nothing approved → `CANCELED`; `Send Updated Quotation` (manager) → `QUOTATION_UPDATE` |
| `QUOTATION_UPDATE` | transient: an updated quotation is on its way | our hook forwards it → `QUOTATION_SENT`; a forward that cannot happen → `QUOTATION_SEND_FAILED` |
| `QUOTATION_SEND_FAILED` | sending failed after the manager's click, first or updated | retry → `QUOTATION_SENT` |
| `AWAITING_CLIENT_DETAILS` | approved quotes are known; Party B details missing | client submits details → `CLIENT_DETAILS_RECEIVED` |
| `CLIENT_DETAILS_RECEIVED` | transient: our hook is checking the details | complete → `DRAFT`; incomplete → back to `AWAITING_CLIENT_DETAILS` |
| `DRAFT` … `ARCHIVED` | as seeded, following spec §11–15 | |
| `AGREEMENT_SEND_FAILED` | sending the agreement link failed | retry → `SENT_TO_CLIENT` |

The contract-details event carries the ten attributes of spec §9.2 —
`LEGAL_NAME`, `CLIENT_TYPE`, `BILLING_ADDRESS`, `REPRESENTATIVE_FIRST_NAME`,
`REPRESENTATIVE_LAST_NAME`, `REPRESENTATIVE_JOB_TITLE`, `REPRESENTATIVE_EMAIL`,
`REPRESENTATIVE_PHONE`, `INFORMATION_CONFIRMED`, `AUTHORITY_CONFIRMED` — which are
also persisted on document type 17. Event metadata through a link was confirmed
on 2026-09-21 (§9), so the separate `CONTRACT_INFORMATION` form type and its
lifecycle, still in `core-ui` and never applied, are to be dropped.

**The details are checked in a transient state** (decided with the user on
2026-09-21). A hook cannot refuse an event, and the server does not enforce an
event's required attributes on the anonymous path (§9), so nothing stops
incomplete details on the way into `DRAFT`. The client's event therefore becomes
`AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED`, carrying the ten attributes,
and lands in
`CLIENT_DETAILS_RECEIVED`, whose `onEnter` is the one place those attributes are
visible. When they are complete the hook writes Party B into the account and a
snapshot into the agreement, then sends `CLIENT_DETAILS_RECEIVED-DRAFT`; when
they are not, it records what is missing and sends
`CLIENT_DETAILS_RECEIVED-AWAITING_CLIENT_DETAILS`, so the same link can submit
again. Core drops an event sent too soon after the transition before it
(dev-1, 2026-09-17), so the follow-up event is sent after the commit with a
delay or a retry, and an agreement left in `CLIENT_DETAILS_RECEIVED` must be
visible to the manager. This is live on dev-1: the workflow utility dispatches
processor V2 to a `CORE`/`CORE-ACCT`/`CORE-BILL` node, and the review page sends
the new event. Since 2026-09-23 the page shows `CLIENT_DETAILS_RECEIVED` as a
checking state, right after the submit and when the link is opened there. It
re-reads one read at a time for up to 75 s, then offers Refresh status, and
moves to whatever it reads: the returned form, the link closed after the
details, or `DRAFT` and later states.

`EFFECTIVE_DATE` is optional, because it cannot be known while the agreement is
still a package.

**A revised quote goes back to the client through the same agreement**
(decided with the user on 2026-09-23; live on dev-1 the same day). When the
client requests changes on an option, the manager:

1. takes the Order back with `CUSTOMER_CHANGES_REQUESTED-QUOTE_PREPARED`;
2. changes its lines or reprices it;
3. approves it again with `QUOTE_PREPARED-QUOTE_APPROVED_INTERNALLY`, which
   keeps it in the agreement already listing it (§5);
4. presses `Send Updated Quotation` on the agreement:
   `QUOTATION_SENT-QUOTATION_UPDATE`.

The event is granted to exactly the roles that hold `Send Quotation`:
`SW_FS_WS_COMPANY_ADMIN` and `SW_FS_WS_SALES`. `QUOTATION_UPDATE` is transient.
Its hook only forwards `QUOTATION_UPDATE-QUOTATION_SENT` after the commit, with
the same wait for the committed state as `INTERNALLY_APPROVED → SENT_TO_CLIENT`,
and records `QUOTATION_UPDATE-QUOTATION_SEND_FAILED` when the agreement does not
move on within 15 s. Re-entering `QUOTATION_SENT` runs the one delivery of §5,
which also serves the first send and the retry from `QUOTATION_SEND_FAILED`.
With nothing revised the same button re-sends the link, for a client who lost
the email. A decision the client sends during the half second the agreement
spends in `QUOTATION_UPDATE` is not evaluated, because §6 runs only in
`QUOTATION_SENT`.

### 4.3 Account — workflow 14

Events, *verified*: `DRAFT-PROSPECT`, `DRAFT-ARCHIVED`, `PROSPECT-ACTIVE`,
`PROSPECT-ARCHIVED`, `ACTIVE-SEASONAL_HOLD`, `ACTIVE-INACTIVE`,
`INACTIVE-ACTIVE`, `INACTIVE-ARCHIVED`, `SEASONAL_HOLD-ACTIVE`,
`SEASONAL_HOLD-INACTIVE`. There is no `DRAFT-ACTIVE`, so an account becomes a
prospect when its first package is sent and active when an agreement is
approved.

## 5. Hooks

| trigger | does | if it cannot |
| --- | --- | --- |
| Order enters `QUOTE_APPROVED_INTERNALLY` | requires `SERVICE_PROPERTY`; adds the Order to the agreement already listing it, else to the client's agreement in `QUOTATION`, else to a new one | cannot refuse the transition (§9); what it does instead is decided with the Order hooks |
| Agreement enters `QUOTATION_SENT`, first, on retry or after `QUOTATION_UPDATE` | quotation delivery V4: accepts listed Orders in any state; revokes the previous quotation link and clears `QUOTATION_GRANT_ID`; sends `QUOTE_APPROVED_INTERNALLY-QUOTE_SENT` only to Orders in `QUOTE_APPROVED_INTERNALLY` and leaves decided and pending ones as they are; `DRAFT-PROSPECT` only from `DRAFT`; refreshes the Account pre-fill; issues the new quotation link over the current lines; emails the primary contact, saying the quotation was updated when a previous link existed and an Order was just sent again, otherwise the ready email | `QUOTATION_SEND_FAILED`; a previous link that cannot be revoked stops the delivery before anything moves, and a new link whose storage or email fails is revoked |
| Agreement enters `QUOTATION_UPDATE` | forwards `QUOTATION_UPDATE-QUOTATION_SENT` once the transition is committed | `QUOTATION_UPDATE-QUOTATION_SEND_FAILED` |
| Order enters `CLIENT_APPROVED` | declines the other options for the same property in the same agreement; evaluates the package | |
| Order enters `DECLINED` | evaluates the package | |
| Order enters `CUSTOMER_CHANGES_REQUESTED` | notifies `QUOTATION_MANAGER` with `MESSAGE` | |
| package evaluation | see §6 | |
| Agreement enters `CLIENT_DETAILS_RECEIVED` | checks the ten details the event carried; when they are complete, writes Party B into the account and a snapshot into the agreement, removes unapproved Orders from `ORDERS`, revokes the quotation link, notifies `CONTRACT_MANAGER` and sends the agreement to `DRAFT` (§4.2) | writes the codes of what is missing or invalid to `CLIENT_DETAILS_ERRORS` (comma-separated), or `PROCESSING_FAILED` when processing itself fails, and sends it back to `AWAITING_CLIENT_DETAILS`; the page marks each named field and says a `PROCESSING_FAILED` return is not the client's mistake |
| Agreement enters `INTERNALLY_APPROVED` | sends it on to `SENT_TO_CLIENT` (spec §13) | |
| Agreement enters `SENT_TO_CLIENT` | issues the agreement link; emails the primary contact | `AGREEMENT_SEND_FAILED` |
| Agreement enters `CLIENT_APPROVED` | revokes the agreement link; `PROSPECT-ACTIVE` or `INACTIVE-ACTIVE` on the account | |
| Agreement approval activates the Account | creates or reuses the User from the Account's primary email, links `Account.user`, assigns the staging customer role, then invokes Core's existing password-reset email after commit for a new User or one still without a local password | `ACTIVATION_FAILED` and retry |

Every lifecycle change of another record is an event on that record's workflow,
never a direct state write (spec §2.2).

Work that spans Documents and Orders runs as a script on a node with both
`CORE` and `CORE-BILL`, the way `WINTER_SERVICE_REGION_WORKFLOW_UTILS` already
dispatches `WINTER_SERVICE_QUOTATION_CREATOR`. Such work runs after the
triggering transaction commits, which is why its failures need the visible
states above rather than a log line.

The hooks of workflow 53, a `JavaScript` workflow, reach the bound script as
`this.workflowUtils`; a `Java` workflow such as 45 writes `workflowUtils` (§9). A
`JavaScript` hook cannot refuse its transition. Whether an exception in a `Java`
hook rolls one back is untested, so every check above ends in a state rather
than relying on a refusal.

## 6. When a package is complete

Evaluated whenever an Order of the package enters `CLIENT_APPROVED` or
`DECLINED`, and only while the agreement is `QUOTATION_SENT`:

1. Group the agreement's Orders by `SERVICE_PROPERTY`.
2. A property is decided when one of its Orders is `CLIENT_APPROVED`, or all of
   them are `DECLINED`.
3. Every property decided and at least one approval → `AWAITING_CLIENT_DETAILS`.
4. Every property decided and no approval → `CANCELED`, and `QUOTATION_MANAGER`
   is told.

An Order the manager never approved internally is not in the package and does
not hold it back. A second season's quotes for the same client start a new
agreement, because the first one is no longer in `QUOTATION`.

## 7. Links

Both are issued on `core-bill`, the one service that registers Account, Order
and Document grant entries together, by a persisted service user whose role
holds only `P_GRANT_W` and the permissions below. The six entity types a review
link carries, and the service that grants each, are in
`SNOW-CLIENT-REVIEW-MAGIC-LINK-ENTITIES.md`.

| link | issued | entries | page | revoked |
| --- | --- | --- | --- | --- |
| quotation | each time the agreement enters `QUOTATION_SENT`: the first send, a retry, and every `Send Updated Quotation`, which re-issues it over the current lines after revoking the previous one | Account `P_ACCT_R`; each Order `P_ORDER_R` and `P_WF:GENERAL_FSM_ORDER:` `QUOTE_SENT-QUOTE_VIEWED`, `QUOTE_VIEWED-CLIENT_APPROVED`, `QUOTE_VIEWED-DECLINED`, `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED`; each Order's `OrderItem` records with their `ProductPrice` and `Product`; agreement `P_DOCUMENT_R` and `P_WF:SERVICE_AGREEMENT_LIFECYCLE:AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED` | quote review | details submitted, re-issue, or cancel |
| agreement | agreement enters `SENT_TO_CLIENT` | Account `P_ACCT_R`; agreement `P_DOCUMENT_R` and `P_WF:SERVICE_AGREEMENT_LIFECYCLE:SENT_TO_CLIENT-CLIENT_APPROVED`; each Order and OrderItem `P_ORDER_R`; each ProductPrice `P_PRICE_R`; each Product `P_PRODUCT_R` | agreement review | client approval |

The token is never stored; the agreement keeps the grant ids so a hook can
revoke them. A grant is a snapshot of its entries at issue, so a link issued
before a revision cannot read a line added after it; the re-issued link can.
The review page answers a revoked or expired link with "This link has expired
or was withdrawn" and, live since 2026-09-23, sends the client to the link in
the provider's newest email.

## 8. Pages

Both are anonymous, token-only CMS pages: they introspect the grant and list
what it holds.

- **Quote review** — spec §7–9 in one page: properties with their options,
  products and prices, status per property and a package summary; approve,
  decline, request changes with a message; once the agreement is
  `AWAITING_CLIENT_DETAILS`, the contract-details step, rendered from the event's
  attributes in the same shape `portal-form.js` renders form attributes, and
  pre-filled from the account.
- **Agreement review** — spec §14 and §19.6: parties, properties and services,
  prices, terms from `CONTRACT_TERMS`; approve; the completion state with the
  portal invitation.

## 9. Prerequisites and open points

- **The link works and carries what the pages need** (*verified* 2026-09-21).
  A grant issued on 2026-09-17 over account 694, orders 36, 37 and 38 and
  agreement 132 was read with no credential and moved two Orders to
  `QUOTE_VIEWED`, but its profile carried no attributes, totals or state codes,
  and the review page stopped at `unknown-state`. On 2026-09-18 the backend
  admitted typed-entity `attributes`, and the SYSTEM `DEFAULT` profiles 102
  (Account), 114 (Order) and 11 (Document) gained them. On 2026-09-21 a fresh
  combined grant read the Order totals, `states[].code` and separate
  `OrderItem`, `ProductPrice` and `Product` records. Grants issued earlier keep
  their old snapshots and have to be reissued. The entry list is in
  `SNOW-CLIENT-REVIEW-MAGIC-LINK-ENTITIES.md`.
- **What a link may reveal is decided by what we put in attributes.** Whenever
  the ceiling admits them, it admits the whole bag, service attributes included,
  so a record reachable by a client holds nothing we would not show one.
- **The terms live in `CONTRACT_TERMS`** on document type 17 since 2026-09-17,
  one optional string that the attribute editor shows as a multi-line field,
  and the review page reads it. The text becomes blocks through a
  micro-syntax: `# ` a heading, `- ` an item, a blank line between blocks.
  Since 2026-09-23 a line starting with a number marker (`1.`, `1)`, `1.1`,
  `2.3.`) is a numbered clause that keeps its number and depth, together with
  the lines under it up to the next blank line or marker; a prose line that
  starts with a decimal such as "1.5 hours" is read as clause 1.5. Two limits,
  worth stating before anyone treats this page as the contract. One string
  holds one language, so the terms sit unmarked in whatever
  language they were typed while the rest of the page follows the reader. And
  one string is one revision: nothing records which wording the client
  approved, and an edit after approval replaces it silently. The executed
  instrument is still a PDF elsewhere; this is what the client reads before
  pressing Approve.
- **The provider party and the terms come from the organization** (the user,
  2026-09-23).
  - The OPERATOR organization type carries `PROVIDER_LEGAL_NAME`,
    `PROVIDER_REPRESENTATIVE_NAME`, `PROVIDER_REPRESENTATIVE_JOB_TITLE` and
    `CONTRACT_TERMS`. Document type 17 has the same codes.
  - When the contract is formed, processor V5 (script 291) copies them from the
    agreement's own organization into the agreement, only where the agreement
    is empty, so a manager can still edit them before internal approval.
  - SNOWLIMITLESS holds test values: representative "Test Representative,
    Contracts Manager (test)" and terms headed "Test terms: not a real
    contract".
  - `applyProviderTerms` backfilled agreements 138 and 139.
  - The page falls back to the organization name only when nothing was copied.
- **The portal invitation is back** (2026-09-23). The completion states
  (`CLIENT_APPROVED`, `ACTIVATION_FAILED`, `ACTIVE`) and the link closed right
  after approval explain portal access without asking `Account.user`, which the
  readback right after approval usually cannot see yet: a client without a
  portal password receives one by email once access is ready, and an existing
  password stays the same. The page names the Account's PRIMARY email only when
  the link returns exactly one, the rule provisioning uses, and links to the
  portal only when the CMS parameter `PORTAL_URL` is set.
- **The client's own details travel as Account attributes.**
  - **Why:** through a link an Account returns its contacts and addresses as
    ids only. Core's generated grant ceiling keeps every association shallow,
    and the backend confirmed on 2026-09-23 that Contact, ContactEntry and
    AccountAddress will not become grantable.
  - **The attributes:** SNOW_RESIDENTIAL_CUSTOMER and SNOW_COMMERCIAL_CUSTOMER
    declare `BILLING_ADDRESS` and `REPRESENTATIVE_FIRST_NAME`, `_LAST_NAME`,
    `_JOB_TITLE`, `_EMAIL` and `_PHONE`.
  - **Who writes them:** quotation delivery V3 (294) and agreement delivery V2
    (293) copy the PRIMARY contact and the BILLING address into them right
    before issuing each grant, overwriting all six. Email and phone are
    written only when exactly one entry exists.
  - **The job title** comes only from an agreement's accepted details, never
    from the contact title, which holds the form's role code until then.
  - **What the page does:** it pre-fills the details form from these attributes
    and names `REPRESENTATIVE_EMAIL` in the portal invitation.
  - **Proven:** an anonymous read of Account 718 through a short-lived grant
    returned all six.
- **The service address is written on the Order.** A Resource cannot be
  granted, so the page cannot follow `SERVICE_PROPERTY` to the address. Since
  2026-09-23 `SNOW_QUOTATION_ORDER_UTILITIES_V2` (script 260, workflow 45)
  asks `SNOW_SERVICE_PROPERTY_ADDRESS_V1` (259) on a `CORE-RM` node for the
  address of the Order's current `SERVICE_PROPERTY` and writes
  `SERVICE_ADDRESS` before the Order joins its package. A failed lookup is
  logged and never keeps the Order out, and `refreshServiceAddress` backfills
  one Order; Orders 41 and 42 were backfilled on both core-bill nodes.
- **The pricing model is not a field.** `FIELD_SERVICE_ORDER` has no pricing
  model attribute; the team's creator writes the kind into `notes` and item
  `metadata`. The page has to label each option, so the Order gets a
  `PRICING_MODEL` attribute (`SEASONAL`, `MONTHLY`, `PER_SERVICE`).
- **Required event attributes are not enforced through a link.** The event
  `AWAITING_CLIENT_DETAILS-DRAFT` declares nine required attributes and one
  optional. Sent through a link on 2026-09-17 with no metadata at all, it was
  accepted and the agreement moved to `DRAFT`. So nothing on the server
  guarantees the ten contract details ever arrive. The page's own validation is
  the first gate and our hook in `CLIENT_DETAILS_RECEIVED` the second (§4.2); the
  hook treats every detail as possibly absent.
- **Nothing persists what an event carried.** A transition through a link is
  audited as a revision whose username is `na`, and `order-state-transition`
  records only the entity, the state, the user and the time. The metadata map is
  visible to a hook and nowhere else, so it cannot be recovered after the fact.
  The hook that reads the details therefore writes them where they belong
  before the agreement moves on.
- **Event metadata through a link — proven on 2026-09-21.** A hook on the
  agreement workflow runs and reads what an event carried once its body
  addresses the bound script correctly. A `JavaScript` workflow compiles its
  hooks into a generated class whose constructor receives the script —
  `constructor(workflowService, globalContext, workflowUtils, scriptUtils)` —
  and every state handler holds it as `this.workflowUtils`; a `Java` workflow
  such as 49 writes plain `workflowUtils`. With probe script 205 bound to
  workflow 53 and `this.workflowUtils.recordEventContext(entity, context)` as the
  `onEnter` of `DRAFT`, an authenticated event and an anonymous event through a
  link both reached the script, `context` carried `MESSAGE` and `PROBE`, and
  `USER_NAME` read `anonymous` for the link. The attempt of 2026-09-17 had
  written `workflowUtils` without `this.`, a `ReferenceError` that a `try/catch`
  around it swallowed.
- **A hook cannot refuse its transition** (*verified* 2026-09-21). An `onEnter`
  that recorded its context and then threw because `MESSAGE` was missing still
  let `PENDING_MANAGEMENT_APPROVAL` → `DRAFT` complete, and the event answered
  HTTP 200. Checks therefore end in a state (§4.2, §5), never in a refusal.
- **Do not switch an existing workflow's `scriptLanguage`.** On 2026-09-17
  workflow 53 set to `Java` with a script bound read back `valid: false`, and
  events then answered HTTP 200 without moving the document; set back to
  `JavaScript`, it worked again. Generated `sourceCode` is language-specific — a
  Java class for workflows 14, 45 and 49, a JavaScript class for 53 — and a
  switch apparently does not regenerate it.
- **`MAPPINGS_*` visibility.** The `IGrantService.mappings` javadoc requires the
  script to be visible in the authenticated organization or SYSTEM-owned;
  `MAPPINGS_ACCOUNT` is SYSTEM-owned.
- The portal flag on `OPERATOR` remains intentionally deferred. The staging
  customer role is `SW_FS_WS_CUSTOMER_PORTAL` (role 75 on dev-1): it contains
  only the permissions needed by the live `overview` and `properties` modules.
  It is not a production customer boundary until backend reads are scoped to
  the linked customer Account.

## 10. Where the flow stands, 2026-09-23

| step of §2 | state |
| --- | --- |
| request → Account and addresses | *verified*: creation runs on `NOTIFIED`, then the workflow enters `READY_FOR_REVIEW`; form 60 created Account 711 and reached the ready state without operator help |
| the Account link of the requester's email | *verified*: issued only when the manager sends `READY_FOR_REVIEW-PROCESSED`, by `issueAccountLink` of `WINTER_SERVICE_QUOTATION_CREATOR_V6` (script 233); form 60 remained ready until the manual event and then stayed `PROCESSED` after the link and email were queued |
| a property per address | *verified*: form 60 created Property 960 on its first attempt. Form 59 created Account 710 and Property 959 once; repeated processing reused both records without duplicates |
| every entity created on submit | *verified* 2026-09-22: `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V16` (script 237) creates on `NOTIFIED`, exposes `VALIDATION_FAILED` and `PROCESSING_FAILED`, and unlocks manager actions only in `READY_FOR_REVIEW`. A rejected request cannot receive a client link. Link/email failure moves `PROCESSED` to retryable `DELIVERY_FAILED`; a grant issued before a failed email is revoked before the failure transition. `npm run winter-quotation-flow-check` guards the split and compensation |
| three Orders per property | *verified*: `WINTER_SERVICE_QUOTATION_DRAFT_CREATOR_V1` (script 236) created Orders 53–55 for Property 962 with `PER_SERVICE`, `MONTHLY` and `SEASONAL`; rerunning it returned those IDs with `ordersCreated: 0` |
| Order hooks of §5 on workflow 45 | *verified* 2026-09-22: workflow 45 is bound to SYSTEM-owned `SNOW_QUOTATION_ORDER_UTILITIES_V1` (script 238); Orders entering `QUOTE_APPROVED_INTERNALLY` join the agreement, client approval declines sibling options for the same property, terminal decisions evaluate the package, and requested changes require `MESSAGE` and notify `QUOTATION_MANAGER`. Since 2026-09-23 the binding is `SNOW_QUOTATION_ORDER_UTILITIES_V2` (script 260), which also writes `SERVICE_ADDRESS` (§9); its hook path is proven by the next end-to-end run |
| quotation delivery on `QUOTATION_SENT` | *verified* 2026-09-22: workflow 53 is bound to `SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V5` (script 255). Agreement 136 automatically sent Orders 41–42, issued combined grant 58 across Account, Document, Order, OrderItem, ProductPrice and Product, persisted `QUOTATION_GRANT_ID`, and completed the email call through processor 256 and template 257. Incomplete agreement 137 entered `QUOTATION_SEND_FAILED` without a grant ID and without moving Order 50 or Account 712. **Defect found 2026-09-23:** the grant carries `P_WF:SERVICE_AGREEMENT_LIFECYCLE:QUOTATION_SENT-AWAITING_CLIENT_DETAILS` instead of `…:AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED` (`SNOW_SERVICE_QUOTATION_DELIVERY_V1`), so a link from the email cannot send the contract details; every live details pass so far used a hand-issued grant. Fixed the same day by `SNOW_SERVICE_QUOTATION_DELIVERY_V2` (script 263); grant 60 of the end-to-end run below carried the details event, and the client sent the details through the emailed link |
| Send Quotation as a bulk action | outside this stream; owned as a separate task |
| a revised quote back to the client | *verified* 2026-09-23: `Send Updated Quotation` (`QUOTATION_SENT-QUOTATION_UPDATE`), the transient `QUOTATION_UPDATE`, workflow utility V11 (script 297) and quotation delivery V4 (script 298) with email template 299. On agreement 140 the old emailed link answered 401, the new one read the added line anonymously, and the client's approval through it moved the agreement to `AWAITING_CLIENT_DETAILS` (the quotation update run below) |
| quote review page | *verified* 2026-09-22: the regenerated package is live at `/pages/SNOWLIMITLESS/review`; all four live template hashes match the repository. Read-only grant 50 over 19 exact records rendered three quote cards, six product lines, states and server totals in the browser. On 2026-09-23 the version with the checking state, returned details, portal invitation and numbered terms was uploaded: the four hashes match, and `REVIEW_API_BASE_URL` and PageContext 21 were kept. The version live since the end of that day follows the last decision and the details check on its own, words a return on a reopened link, and holds every accepted command until a read shows it; `PORTAL_URL` points at the published portal. Since the evening of 2026-09-23 it also knows `QUOTATION_UPDATE` and sends a client with a closed link to the provider's newest email. The CMS nodes do not invalidate each other's page cache, so each upload was followed by one identical save steered to the node still serving the old page |
| client decisions through a link | *verified in the live browser* 2026-09-22 with combined grant 57 over agreement 135 and Orders 39–40. Opening each option sent `QUOTE_SENT-QUOTE_VIEWED`; Order 39 then reached `CLIENT_APPROVED`. The page refused an empty change request for Order 40, sent the supplied `MESSAGE`, and reached `CUSTOMER_CHANGES_REQUESTED`; its summary showed one approved and one changes-requested property. The test grant was revoked, `QUOTATION_GRANT_ID` cleared and the token returned `401` after the proof |
| package evaluation → `AWAITING_CLIENT_DETAILS` | *verified* 2026-09-22: Orders 53–55 joined agreement 134; approving 53 moved it to `CLIENT_APPROVED`, automatically declined 54 and 55, and moved agreement 134 from `QUOTATION_SENT` to `AWAITING_CLIENT_DETAILS` |
| details → `CLIENT_DETAILS_RECEIVED` → `DRAFT` | *verified* 2026-09-22: workflow 53, utility script 249 and processor script 250 moved agreement 133 automatically through the transient state to `DRAFT`; Party B was written to Account 694 and the agreement, `ORDERS` retained only approved Order 38, and the live review template now sends the new event. *Verified in the live browser* 2026-09-23 with hand-issued grant 59 over agreement 136: after Orders 41 and 42 were approved on the page, a details event without phone and authority came back with both fields marked, and the details sent from the page passed the checking state into `DRAFT`. Two defects of processor V2 surfaced: it revokes the quotation grant without clearing `QUOTATION_GRANT_ID`, and it adds another `BILLING` address to the Account on every submission. Both are fixed: processor V4 (script 267) only validates and persists and keeps one `BILLING` address, and the workflow utility (V7, now V8) sends `CLIENT_DETAILS_RECEIVED-DRAFT` itself, then dispatches the revoke, the clear and the contract-manager email, whose failures are only logged. The end-to-end run below proved it through the emailed link |
| `DRAFT` → `SENT_TO_CLIENT`, the agreement link and email | *verified* 2026-09-22: workflow 53 is bound to `SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V5` (script 255). Agreement 133 moved through management approval, automatically entered `SENT_TO_CLIENT`, and `SNOW_SERVICE_AGREEMENT_DELIVERY_V1` (script 252) issued grant 51 over Account, Document, Order, OrderItem, ProductPrice and Product records. Only `AGREEMENT_GRANT_ID` was persisted; the one-time token was placed in the email link rendered by template 253. Failure compensation revokes the grant, clears the stored ID and sends `SENT_TO_CLIENT-AGREEMENT_SEND_FAILED`; retry re-enters `SENT_TO_CLIENT`. `npm run service-agreement-delivery-check` guards both delivery paths, six entity types, writable permissions and compensation |
| approval → Account `ACTIVE` → portal User | *Verified on dev-1* 2026-09-22: anonymous approval of agreement 134 revoked its grant and activated Account 694. `SNOW_PORTAL_USER_PROVISION_V1` (script 258) is called after activation script 254 by workflow utility 255. It creates or reuses a User using the PRIMARY email as login, assigns `SW_FS_WS_CUSTOMER_PORTAL` (75) in `SNOWLIMITLESS`, and writes `Account.user`; failure enters retryable `ACTIVATION_FAILED`. Account 694 links to User 35. ACTIVE smoke Account 714 created User 43, assigned the role and linked it; an approval retry on agreement 134 restored an intentionally removed role on User 35. Activation script 254 handles a cleared `AGREEMENT_GRANT_ID`. The portal flag remains deferred. An admin password reset for User 43 returned `200/[true]`; a reachable test mailbox supplied the password, and Core OIDC accepted the login. Calm Harbor correctly denied that SNOWLIMITLESS user access to its own organization. Script 258 now calls Core `UserService.generateNewPassword` after the User transaction commits. ACTIVE smoke Account 715 created User 49 with `credentialsIssued: true`; rerun returned `created: false`, `credentialsIssued: false`. ACTIVE smoke Account 716 created User 50 with the same result, and the user confirmed receipt of the automatically generated password email at a reachable mailbox. The operator `snow-portal-user plan` now resolves by login, not non-unique email. **Correction, 2026-09-23:** the anonymous path was not proven on 2026-09-22, because Account 694 was already `ACTIVE` from the authenticated check. In the end-to-end run below an anonymous approval left the Account `PROSPECT` and the agreement in `ACTIVATION_FAILED`, and an operator retry activated it and created User 51. Activation V2 and provisioning V2 (scripts 269 and 270, dispatched by utility V8, script 268) now send the Account events, create the User and send the password email as a service identity |

Failure visibility was completed on 2026-09-22. A validation failure is
retryable through `VALIDATION_FAILED`; Account or Property creation failure is
retryable through `PROCESSING_FAILED`; client link or email failure is
retryable through `DELIVERY_FAILED`. `READY_FOR_REVIEW` removes the early
manager race. Quotation delivery uses `QUOTATION_SEND_FAILED`, agreement
delivery uses `AGREEMENT_SEND_FAILED`, and post-approval Account activation
uses `ACTIVATION_FAILED`; each re-enters its processing state on retry. The
historical first Property failure of 2026-09-21 cannot be
reconstructed because its event metadata was stored as `{}`; it did not recur
for forms 59 or 60. The retry investigation did uncover and fix a separate V4
lazy-loading error on an existing Account: V6 returns detached-safe IDs from
the transaction, and form 59 proved the retry without duplicate entities.

Order draft creation was completed on 2026-09-22. Because the request no longer
collects a property size, the three Orders start in `INITIAL` without priced
items; each records its `SERVICE_PROPERTY`, source form and `PRICING_MODEL`.
The manager supplies or corrects the measured pricing during review instead of
the automation inventing a size.

### The first end-to-end run, 2026-09-23

The run went from a public request to the client signed in to the portal. The
requester was a plus-alias of the user's mailbox, and the user received every
email.

1. **Request.** Form 63 created Account 717 (type `SNOW_RESIDENTIAL_CUSTOMER`),
   Property 963 (999 Canada Place) and draft Orders 56–58. Its `INITIAL` hook
   never ran after the anonymous submit; the same event sent through
   `app-1-core-cms` ran the whole chain in 8 s.
2. **Pricing.** Saving an order line through `core-bill/api/order-item/save.json`
   fails on every node with "Execution error", and the backend is asked for
   the trace. The operator script `WINTER_SERVICE_QUOTATION_DRAFT_PRICER` (V1,
   script 264) priced Order 57 server-side. V2 (script 265) reads the catalog's
   five-month season, which the user confirmed, and adds a read-only
   `previewDraft`.
3. **Package and quotation.** `QUOTE_APPROVED_INTERNALLY` wrote `SERVICE_ADDRESS`
   and created agreement 138. Send Quotation issued grant 60 with the details
   event, and the email arrived.
4. **Client decisions and details.** In the browser through the emailed link:
   - The option was viewed and approved, and the page followed to the details
     step on its own.
   - The first details submission came back `PROCESSING_FAILED`. Processor V3
     had sent the `DRAFT` event from a script execution on another node under
     the anonymous client, and Core did not apply it.
   - After processor V4 and utility V7 the resubmission reached `DRAFT`. It
     revoked and cleared grant 60 and kept one `BILLING` address.
5. **Agreement.** Management approval sent the agreement to `SENT_TO_CLIENT` with
   grant 61, and the email arrived. The client approved through it.
6. **Activation.** The agreement fell into `ACTIVATION_FAILED`, for the same
   reason as step 4: activation V1 sent `PROSPECT-ACTIVE` as the anonymous
   client. An operator retry activated Account 717 and created User 51, whose
   password email arrived. Activation V2 and provisioning V2 now act as a
   service identity.
7. **Portal.** The live portal was published at `/pages/SNOWLIMITLESS/portal`
   and User 51 signed in.
   - At first it found no customer Account, because it asked only for type
     `CUSTOMER`; it now accepts
     `SNOW_RESIDENTIAL_CUSTOMER,SNOW_COMMERCIAL_CUSTOMER,CUSTOMER`.
   - Home, Contracts, the agreement and the profile then read every record
     with role 75, and nothing was refused.

The lesson of steps 4 and 6: after a client's anonymous event, a script
dispatched to another node must not send workflow events as that client. Send
them from the workflow utility's hook context, or as a service identity.

**A second run the same day proved the fixes** without an operator step, with
an example.com requester and a hand-issued link:
- Form 64 created Account 718, Property 964 and Orders 59–61.
- Pricer V2 priced Order 60, and its `SERVICE_ADDRESS` was written. Agreement
  139 was sent with grant 62, which carried the details event.
- The client's anonymous view, approval and details moved the agreement to
  `DRAFT` and cleared the quotation grant.
- After management approval, the client's anonymous agreement approval kept
  agreement 139 in `CLIENT_APPROVED`.
- Within 3.4 s Account 718 was `ACTIVE` and User 52 existed, held the portal
  role and was linked from `Account.user`. The Account's audit records both
  changes as `system`.

The only manual step was the form's first event. The anonymous submit landed on
`app-3-core-cms`, whose `INITIAL` hook does not fire, and the event was sent
through `app-1-core-cms`.

### The quotation update run, 2026-09-23

The run used Account 717 and Property 963 (75,000 sq ft). The Account's primary
email is a plus-alias of the user's mailbox.

1. **Order.** Order 76 (`PER_SERVICE`, Property 963) was created through REST.
   Its first `INITIAL-QUOTE_PREPARED` answered 200 and was not applied; the
   same event two minutes later was. The hook priced it from the area: line 91
   (snow removal, 1,528.48) and line 92 (de-icing, 916.24), 2,444.72 in total.
2. **First send, as before.** `QUOTE_APPROVED_INTERNALLY` created agreement
   140. `Send Quotation` put Order 76 in `QUOTE_SENT` within 3.5 s and stored
   grant 69 within 6.6 s. Grant 69 carries the entries of V3: Account 717,
   Document 140 with the details event, Order 76 with its four events, lines 91
   and 92, prices 28 and 36, products 25 and 28. Account 717 stayed `ACTIVE`.
3. **Change request.** A link's token cannot be read back from Core, so the
   client's first round went through a two-hour hand-issued grant (70) over
   Order 76: `QUOTE_SENT-QUOTE_VIEWED`, then
   `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED` with a `MESSAGE`. Grant 70 was
   revoked right after, and its token then answered 401.
4. **Revision.** `CUSTOMER_CHANGES_REQUESTED-QUOTE_PREPARED` kept the lines. A
   quantity change on line 91 failed (see Next), so the revision is a new line
   94, Manual Shovel, 2 × 60, which makes the total 2,564.72.
   `QUOTE_PREPARED-QUOTE_APPROVED_INTERNALLY` kept the Order in agreement 140.
5. **Send Updated Quotation.** The agreement's transition log reads
   `QUOTATION_SENT` → `QUOTATION_UPDATE` → `QUOTATION_SENT`, 0.46 s apart. Order
   76 was `QUOTE_SENT` again within 2.5 s of the event, and `QUOTATION_GRANT_ID`
   held grant 72 within 5.4 s. Grant 72 adds line 94, price 49 and product 31
   to the entries of grant 69. Grant 69 left the list of live grants on
   `core-bill` and `core`.
6. **The emails.** The user received both and forwarded their links. The
   heading they saw in the first was "Review quotation options", and in the
   second "Review the updated quotation": the link texts of the ready template
   (257) and of the updated one (299).
7. **The client, through the emailed links.**
   - The link of the ready email (grant 69) answered 401, to the introspection
     and to an Order read alike.
   - The link of the updated email (grant 72) read, anonymously, agreement 140,
     Account 717, Order 76 at 2,564.72 and lines 91, 92 and 94 with their
     prices and products, Manual Shovel included.
   - Through it Order 76 went `QUOTE_VIEWED`, then `CLIENT_APPROVED`, and
     agreement 140 was `AWAITING_CLIENT_DETAILS` 1.3 s after the approval.
     The first attempt at the view event was lost to a socket error on our
     side and never reached Core; the Order was still `QUOTE_SENT`, and the
     event was sent again.
8. **Closed.** Grant 72 was still live once the package completed, because
   the details step that revokes it did not run, and it was revoked by hand;
   its link then answered 401. Agreement 140 stays in `AWAITING_CLIENT_DETAILS`
   with `QUOTATION_GRANT_ID` still naming grant 72.

Revoking a grant that had already expired answered 200; revoking one twice
answered 404 the second time.

The review document was uploaded the same evening (§10 table, "quote review
page"). Opened with the revoked link of the ready email, the live page on both
CMS nodes shows "This link has expired or was withdrawn" with the new line
pointing to the provider's newest email, and the portal invitation.

Next, in order:

1. **Backend.**
   - `app-3-core-cms` does not fire the `GET_QUOTE_` form's `INITIAL` hook.
     Form 64 was submitted there at 11:55:32 UTC and stalled; the same event
     through `app-1-core-cms` ran the chain.
   - The CMS nodes do not invalidate each other's page cache after a template
     save.
2. **Build the three client forms** specified for the portal. Bulk Send
   Quotation is owned outside this stream.
3. **Price by the founder's model.** Received from the user on 2026-09-23.
   - A visit of snow removal and a visit of de-icing each have a price set by
     the serviced area. It is not a fixed rate per square foot.
   - The season total is de-icing × 28 plus snow removal × 4.
   - The monthly option is that total divided by the five months.
   - The prepaid seasonal option is the total × 0.9.
   - Example: 10,000 sq ft at 245 de-icing and 350 snow removal gives 1,652 a
     month and 7,434 for the season.

   The dev-1 catalog prices the three models independently: per-visit, monthly
   and seasonal tiers of flat fee plus a per-square-foot rate, and its seasonal
   rows carry four times the monthly amounts over five months instead of 4.5.
   The next draft pricer should derive monthly and seasonal from the per-visit
   prices, keeping the coefficients as OPERATOR attributes. It waits for the
   per-visit price table by area from the founder.

Drafts are priced from the property's measured area since 2026-09-23:
- SNOW_REMOVAL_PROPERTY carries `SERVICE_AREA_SQFT`, which the manager fills.
- Order utilities V4 (script 301, workflow 45) price an Order without lines
  when it enters `QUOTE_PREPARED`: they read the area on a `CORE-RM` node
  (script 295) and run draft pricer V3 (script 300).
- Without an area the Order stays unpriced.
- Order 58 was priced this way; Order 59, whose property has no area, stayed
  empty.

Resolved on 2026-09-23 after the runs:
- **Order lines save through REST again.** Workflow 46
  (`GENERAL_FSM_ORDER_ITEM_LIFECYCLE`) was bound to `ORDER_UTILITIES` (script
  164): category API, `CORE-BILL` only, package `com.pixelnation.bill.utils`.
  It now runs `SNOW_ORDER_ITEM_UTILITIES_V1` (script 287), shaped like every
  working utility, and a line saved on one core-bill node and updated on the
  other answered 200. That held only for a line created through REST until
  the next item.
- **A line the draft pricer wrote can be edited.** Read on dev-1, the pricer's
  lines 91 and 92 differed from line 94, saved through REST, only in `workflow`
  and `states`: 94 held workflow 46 and its initial state `DRAFT` (229) from
  its first revision, and 91 and 92 held neither, like every priced line
  before them (84–87, 89–90). The pricer adds its lines to the Order and saves
  the Order, and that save gives new lines no workflow, though a new Order
  saved in Java gets its type's. Without a workflow a REST update made Core
  create a default one, which broke its not-null organization; with workflow
  46 the line had no state and the save answered "Execution error". Draft
  pricer V3 (script 300) gives each line its item type's workflow and that
  workflow's initial state, and order utilities V4 (script 301) call it.
  Workflow 45 was bound to V4 at 20:52 UTC on 2026-09-23, and states 221, 223,
  226, 227 and 228 were re-saved. The proof, on Order 61 (`SEASONAL`) after
  Property 964 was given 75,000 sq ft: `INITIAL-QUOTE_PREPARED` priced it 1.5 s
  later into lines 95 and 96, each with workflow 46 and `DRAFT` from its first
  revision. Line 95 was updated through REST on `app-1-core-bill` and on
  `app-3-core-bill`, and line 96 was deleted; each answered 200. Lines 84–87
  and 89–92, written before V3, still have no workflow.
- **The provider party and terms** come from the organization (§9).
- **The details form pre-fills** from Account attributes (§9).

Live on workflow 53 since the evening of 2026-09-23:
- workflow utility V11 (297), which adds the `QUOTATION_UPDATE` forward;
- details processor V5 (291);
- quotation delivery V4 (298), with the ready email (template 257) and the
  updated one (template 299), and agreement delivery V2 (293);
- activation V2 (269) and provisioning V2 (270).

The role is staging-only until backend reads are scoped to the linked
customer Account; browser filters alone are not a production customer
boundary.
