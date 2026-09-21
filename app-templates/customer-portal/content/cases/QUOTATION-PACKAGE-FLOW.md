# Quotation package — the service agreement carries the quotes

Status: design, decided with the user on 2026-09-11 and revised on 2026-09-17
and 2026-09-21; where the flow stands is §10. Facts marked *verified* were read
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
manager takes the request (NOTIFIED → PROCESSED by hand), reviews and corrects the Orders
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
every property decided ──► Agreement AWAITING_CLIENT_DETAILS
                                   │
client submits contract details (event on the agreement, with attributes)
                                   ▼
Agreement CLIENT_DETAILS_RECEIVED ── our hook checks them ──► DRAFT, or back to AWAITING_CLIENT_DETAILS
                                   │
Agreement DRAFT ──► PENDING_MANAGEMENT_APPROVAL ──► INTERNALLY_APPROVED ──► SENT_TO_CLIENT
                                   │                         (link + email)
client approves ──► CLIENT_APPROVED ──► Account → ACTIVE ──► portal User if the operator has the portal
```

Since 2026-09-17 the manager no longer builds the quotes: every entity is
created with the request, the form no longer collects a property size, and the
manager reviews and corrects the Orders. The manager's send is to become a bulk
action over the reviewed Orders, designed separately.

## 3. Records

| record | role in the flow | status |
| --- | --- | --- |
| `GET_QUOTE_` form, workflow 49 | the anonymous request | live, ours; on `PROCESSED` it creates the Account, its link and a property per address (*verified* 2026-09-21), and a failure lands in `PROCESSING_FAILED`; creation is still to move to `NOTIFIED`, and Order creation is not wired (§10) |
| `Account` (`CUSTOMER`), workflow 14 `SNOW_CUSTOMER_LIFECYCLE` | the client; Party B | live, owned by `SERVICE_WAND_WINTER_SERVICES_CANADA` |
| `SNOW_REMOVAL_PROPERTY` (Resource 154) | one per service address | created by the flow since 2026-09-21 (Property 956) |
| `Order` (`FIELD_SERVICE_ORDER`), workflow 45 `GENERAL_FSM_ORDER` | one quote: one property under one pricing model | live, owned by `SERVICE_WAND_WINTER_SERVICES`; joins our seeds |
| `SERVICE_AGREEMENT` (Document) | the package, then the contract | type 17 and workflow 53 on dev-1, owned by `SERVICE_WAND_WINTER_SERVICES`; seed role grants not applied |
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
dev-1 on 2026-09-11 as workflow 53 with 15 states and 28 events. The server
created the 28 `P_WF:SERVICE_AGREEMENT_LIFECYCLE:*` permissions and added them
to `ADMIN` by itself; the seed's grants to the `SW_FS_WS_*` roles were left out
of that apply. `workflows.ts` grants them through `saveRolePermissions`, which
sends each Permission as a nested object keyed by `name`: the shape the backend
reported refused for Documents, Projects and Tasks (§9). Whether roles are
refused too is unverified. Four states stand in front of `DRAFT`, one of them
transient, and two failure states beside it:

| state | meaning | leaves by |
| --- | --- | --- |
| `QUOTATION` (initial) | quotes are being collected | `Send Quotation` (manager) → `QUOTATION_SENT`; cancel → `CANCELED` |
| `QUOTATION_SENT` | the client is deciding | package complete → `AWAITING_CLIENT_DETAILS`; nothing approved → `CANCELED` |
| `QUOTATION_SEND_FAILED` | sending failed after the manager's click | retry → `QUOTATION_SENT` |
| `AWAITING_CLIENT_DETAILS` | approved quotes are known; Party B details missing | client submits details → `CLIENT_DETAILS_RECEIVED` |
| `CLIENT_DETAILS_RECEIVED` | transient: our hook is checking the details | complete → `DRAFT`; incomplete → back to `AWAITING_CLIENT_DETAILS` |
| `DRAFT` … `ARCHIVED` | as seeded, following spec §11–15 | |
| `AGREEMENT_SEND_FAILED` | sending the agreement link failed | retry → `SENT_TO_CLIENT` |

The contract-details event carries the ten attributes of spec §9.2 —
`LEGAL_NAME`, `CLIENT_TYPE`, `BILLING_ADDRESS`, `REPRESENTATIVE_FIRST_NAME`,
`REPRESENTATIVE_LAST_NAME`, `REPRESENTATIVE_JOB_TITLE`, `REPRESENTATIVE_EMAIL`,
`REPRESENTATIVE_PHONE`, `INFORMATION_CONFIRMED`, `AUTHORITY_CONFIRMED` — which are
today the `CONTRACT_INFORMATION` form type seed. Event metadata through a link
was confirmed on 2026-09-21 (§9), so that form type and its lifecycle, still in
`core-ui` and never applied, are to be dropped.

**The details are checked in a transient state** (decided with the user on
2026-09-21). A hook cannot refuse an event, and the server does not enforce an
event's required attributes on the anonymous path (§9), so nothing stops
incomplete details on the way into `DRAFT`. The client's event therefore becomes
`AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED`, carrying the ten attributes in
place of today's `AWAITING_CLIENT_DETAILS-DRAFT`, and lands in
`CLIENT_DETAILS_RECEIVED`, whose `onEnter` is the one place those attributes are
visible. When they are complete the hook writes Party B into the account and a
snapshot into the agreement, then sends `CLIENT_DETAILS_RECEIVED-DRAFT`; when
they are not, it records what is missing and sends
`CLIENT_DETAILS_RECEIVED-AWAITING_CLIENT_DETAILS`, so the same link can submit
again. Core drops an event sent too soon after the transition before it
(dev-1, 2026-09-17), so the follow-up event is sent after the commit with a
delay or a retry, and an agreement left in `CLIENT_DETAILS_RECEIVED` must be
visible to the manager. The seed, the link's event permission (§7) and the
review page change with it: the page sends `AWAITING_CLIENT_DETAILS-DRAFT` today
and has to show the transient state while it reads the agreement again.

`EFFECTIVE_DATE` is optional, because it cannot be known while the agreement is
still a package.

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
| Agreement enters `QUOTATION_SENT` | sends `QUOTE_APPROVED_INTERNALLY-QUOTE_SENT` to each listed Order still there; `DRAFT-PROSPECT` on the account; issues the quotation link; emails the primary contact | `QUOTATION_SEND_FAILED` |
| Order enters `CLIENT_APPROVED` | declines the other options for the same property in the same agreement; evaluates the package | |
| Order enters `DECLINED` | evaluates the package | |
| Order enters `CUSTOMER_CHANGES_REQUESTED` | notifies `QUOTATION_MANAGER` with `MESSAGE` | |
| package evaluation | see §6 | |
| Agreement enters `CLIENT_DETAILS_RECEIVED` | checks the ten details the event carried; when they are complete, writes Party B into the account and a snapshot into the agreement, removes unapproved Orders from `ORDERS`, revokes the quotation link, notifies `CONTRACT_MANAGER` and sends the agreement to `DRAFT` (§4.2) | sends it back to `AWAITING_CLIENT_DETAILS` with what is missing; the client sees it on the page |
| Agreement enters `INTERNALLY_APPROVED` | sends it on to `SENT_TO_CLIENT` (spec §13) | |
| Agreement enters `SENT_TO_CLIENT` | issues the agreement link; emails the primary contact | `AGREEMENT_SEND_FAILED` |
| Agreement enters `CLIENT_APPROVED` | revokes the agreement link; `PROSPECT-ACTIVE` or `INACTIVE-ACTIVE` on the account | |
| Account enters `ACTIVE` | if the operator's portal flag is on, creates the User, links it, assigns the customer role, emails onboarding | |

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
| quotation | agreement enters `QUOTATION_SENT`, and again when a changed quote is re-sent | Account `P_ACCT_R`; each Order `P_ORDER_R` and `P_WF:GENERAL_FSM_ORDER:` `QUOTE_SENT-QUOTE_VIEWED`, `QUOTE_VIEWED-CLIENT_APPROVED`, `QUOTE_VIEWED-DECLINED`, `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED`; each Order's `OrderItem` records with their `ProductPrice` and `Product`; agreement `P_DOCUMENT_R` and `P_WF:SERVICE_AGREEMENT_LIFECYCLE:AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED` | quote review | details submitted, re-issue, or cancel |
| agreement | agreement enters `SENT_TO_CLIENT` | Account `P_ACCT_R`; agreement `P_DOCUMENT_R` and `P_WF:SERVICE_AGREEMENT_LIFECYCLE:SENT_TO_CLIENT-CLIENT_APPROVED`; its Orders `P_ORDER_R` | agreement review | client approval |

The token is never stored; the agreement keeps the grant ids so a hook can
revoke them.

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
  prices, terms from the document content; approve; the completion state.

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
  and the review page reads it. Three limits, worth stating before anyone
  treats this page as the contract. The text becomes blocks through an
  unwritten micro-syntax — `# ` a heading, `- ` an item, a blank line between
  blocks — so a contract numbered "1. Services" renders as unbroken prose.
  One string holds one language, so the terms sit unmarked in whatever
  language they were typed while the rest of the page follows the reader. And
  one string is one revision: nothing records which wording the client
  approved, and an edit after approval replaces it silently. The executed
  instrument is still a PDF elsewhere; this is what the client reads before
  pressing Approve. Who writes it, a template at creation or a manager, is
  still open.
- **The provider party fields are on the type too.** `PROVIDER_LEGAL_NAME`,
  `PROVIDER_REPRESENTATIVE_NAME` and `PROVIDER_REPRESENTATIVE_JOB_TITLE`, all
  optional strings, applied in the same write. The page has read them all
  along; until something fills them the provider card falls back to the
  organization name.
- **The portal invitation on the agreement page can come back.** It asks
  whether the client Account already has a Core User, and the Account profile
  now exposes `user` as `{ id }` (read on 2026-09-21), which is enough to tell.
  The page keeps it hidden until it asks for that field.
- **The service address must be readable through the link.** A Resource cannot
  be granted, so the page cannot follow `SERVICE_PROPERTY` to the address. The
  hook that adds an Order to the package also records the property's address on
  the Order.
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
- The portal flag on `OPERATOR` and the customer role a provisioned User receives
  are still to be named.

## 10. Where the flow stands, 2026-09-21

| step of §2 | state |
| --- | --- |
| request → Account and addresses | *verified*: the form runs by itself up to `NOTIFIED`; the Account is created when the request enters `PROCESSED` (Accounts 705 and 706) |
| the Account link of the first email | *verified*: `WINTER_SERVICE_QUOTATION_CREATOR_V3` (script 224) asks only for fields inside the Account profile, and the link reads the Account with no credential |
| a property per address | *verified*: Property 956 was created by the flow; the first attempt landed in `PROCESSING_FAILED` and the retry succeeded, with the cause not recorded |
| every entity created on submit | not yet: creation runs on `PROCESSED`, which is the manager's manual step, so it waits for the manager; the decision of 2026-09-17 moves it to `NOTIFIED` |
| three Orders per property | not wired |
| Order hooks of §5 on workflow 45 | not written; workflow 45 is `Java` with `ORDER_UTILITIES` bound |
| Send Quotation as a bulk action | not designed; a separate task |
| quote review page | built in `runtime/client-review/`, not deployed; it needs the six-type link of §7 |
| client decisions through a link | `QUOTE_SENT` → `QUOTE_VIEWED` *verified* on 2026-09-17; approve, decline and request changes not yet through a live link |
| package evaluation → `AWAITING_CLIENT_DETAILS` | not written |
| details → `CLIENT_DETAILS_RECEIVED` → `DRAFT` | designed (§4.2); a hook on workflow 53 runs and reads what an event carried (*verified* 2026-09-21); the seed, the hook and the page are not changed yet |
| `DRAFT` → `SENT_TO_CLIENT`, the agreement link and email | not written |
| approval → Account `ACTIVE` → portal User | not written; workflow 14 is `Java` with no script bound, and the portal flag and the customer role are still to be named |

Next, in order:

1. **Create every entity on `NOTIFIED`.** Move `createQuotations` from the
   `PROCESSED` hook to the `NOTIFIED` hook, next to the manager's notification,
   with its failure event leaving from `NOTIFIED`; `PROCESSED` stays the
   manager's manual step. Find out why the first property attempt failed.
2. **Create the three Orders per property with them**, each carrying
   `SERVICE_PROPERTY` and its pricing model.
3. **Deploy the review page** and pass it with a fresh six-type link issued by
   hand. The key we use has been answered `401` by `core-bill` since
   2026-09-21, and `core-bill` grants the Order entries.
4. **Write the Order hooks** on workflow 45: add an Order to its agreement,
   decline the other options of a decided property, evaluate the package,
   notify `QUOTATION_MANAGER` of requested changes.
5. **Write the agreement side** on workflow 53: the transient
   `CLIENT_DETAILS_RECEIVED` in the seed, its hook, the page's new event and
   checking state; then the `SENT_TO_CLIENT` link and email, approval, and
   activation.
6. **Send Quotation as a bulk action**, designed separately.
