# Quotation package — the service agreement carries the quotes

Status: design, decided with the user on 2026-09-11. The agreement lifecycle and
document type are on dev-1 (§4.2); no hook, link or page is implemented. Facts
marked *verified* were read from dev-1 on 2026-09-11; everything else is our
design, filling what the client spec
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
GET_QUOTE_ form ── PROCESSED ──► Account, addresses, one SNOW_REMOVAL_PROPERTY per address
                                   │
manager prepares Orders by hand: one per property × pricing model, SERVICE_PROPERTY set
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
Agreement DRAFT ──► PENDING_MANAGEMENT_APPROVAL ──► INTERNALLY_APPROVED ──► SENT_TO_CLIENT
                                   │                         (link + email)
client approves ──► CLIENT_APPROVED ──► Account → ACTIVE ──► portal User if the operator has the portal
```

## 3. Records

| record | role in the flow | status |
| --- | --- | --- |
| `GET_QUOTE_` form, workflow 49 | the anonymous request | live, ours; property per address and a failure state still to add |
| `Account` (`CUSTOMER`), workflow 14 `SNOW_CUSTOMER_LIFECYCLE` | the client; Party B | live, owned by `SERVICE_WAND_WINTER_SERVICES_CANADA` |
| `SNOW_REMOVAL_PROPERTY` (Resource 154) | one per service address | exists; not created by the form yet |
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
refused too is unverified. Three states stand in front of `DRAFT` and two
failure states beside it:

| state | meaning | leaves by |
| --- | --- | --- |
| `QUOTATION` (initial) | quotes are being collected | `Send Quotation` (manager) → `QUOTATION_SENT`; cancel → `CANCELED` |
| `QUOTATION_SENT` | the client is deciding | package complete → `AWAITING_CLIENT_DETAILS`; nothing approved → `CANCELED` |
| `QUOTATION_SEND_FAILED` | sending failed after the manager's click | retry → `QUOTATION_SENT` |
| `AWAITING_CLIENT_DETAILS` | approved quotes are known; Party B details missing | client submits details → `DRAFT` |
| `DRAFT` … `ARCHIVED` | as seeded, following spec §11–15 | |
| `AGREEMENT_SEND_FAILED` | sending the agreement link failed | retry → `SENT_TO_CLIENT` |

The contract-details event carries the ten attributes of spec §9.2 —
`LEGAL_NAME`, `CLIENT_TYPE`, `BILLING_ADDRESS`, `REPRESENTATIVE_FIRST_NAME`,
`REPRESENTATIVE_LAST_NAME`, `REPRESENTATIVE_JOB_TITLE`, `REPRESENTATIVE_EMAIL`,
`REPRESENTATIVE_PHONE`, `INFORMATION_CONFIRMED`, `AUTHORITY_CONFIRMED` — which are
today the `CONTRACT_INFORMATION` form type seed. That form type and its
lifecycle stay in `core-ui`, unapplied, until event metadata through a link is
confirmed (§9); then they are dropped.

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
| Order enters `QUOTE_APPROVED_INTERNALLY` | requires `SERVICE_PROPERTY`; adds the Order to the agreement already listing it, else to the client's agreement in `QUOTATION`, else to a new one | refuses the transition with a message the manager sees |
| Agreement enters `QUOTATION_SENT` | sends `QUOTE_APPROVED_INTERNALLY-QUOTE_SENT` to each listed Order still there; `DRAFT-PROSPECT` on the account; issues the quotation link; emails the primary contact | `QUOTATION_SEND_FAILED` |
| Order enters `CLIENT_APPROVED` | declines the other options for the same property in the same agreement; evaluates the package | |
| Order enters `DECLINED` | evaluates the package | |
| Order enters `CUSTOMER_CHANGES_REQUESTED` | notifies `QUOTATION_MANAGER` with `MESSAGE` | |
| package evaluation | see §6 | |
| Agreement leaves `AWAITING_CLIENT_DETAILS` | validates the details; writes Party B into the account and a snapshot into the agreement; removes unapproved Orders from `ORDERS`; revokes the quotation link; notifies `CONTRACT_MANAGER` | refuses the event; the client sees the message |
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
holds only `P_GRANT_W` and the permissions below.

| link | issued | entries | page | revoked |
| --- | --- | --- | --- | --- |
| quotation | agreement enters `QUOTATION_SENT`, and again when a changed quote is re-sent | Account `P_ACCT_R`; each Order `P_ORDER_R` and `P_WF:GENERAL_FSM_ORDER:` `QUOTE_SENT-QUOTE_VIEWED`, `QUOTE_VIEWED-CLIENT_APPROVED`, `QUOTE_VIEWED-DECLINED`, `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED`; agreement `P_DOCUMENT_R` and `P_WF:SERVICE_AGREEMENT_LIFECYCLE:AWAITING_CLIENT_DETAILS-DRAFT` | quote review | details submitted, re-issue, or cancel |
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

- **The link works; what it carries does not.** On 2026-09-17 a real grant over
  account 694, orders 36, 37 and 38 and agreement 132 was issued on dev-1 and
  opened with no credential: introspection listed the three types and the two
  delegated events, `list.json` returned the three orders and the agreement, and
  `QUOTE_SENT` → `QUOTE_VIEWED` went through the link on two orders. The review
  page booted against that link in live mode and stopped at `unknown-state`,
  which is the honest answer: a link delivers `states` with `nls` and no `code`,
  so the page cannot tell which state it is looking at.
- **A link exposes no attributes and no money.** Mappings now come from a
  SYSTEM-owned `EntityMappingDefinition` and not from a `MAPPINGS_{ENTITY}`
  script, and its generated ceiling admits scalar leaves and NLS while excluding
  typed-entity `attributes` and flattening associations to ids. So a link cannot
  carry `CONTRACT_TERMS`, the provider fields, `CLIENT` or `ORDERS`, the order
  totals, the item lines, or the state codes — everything §8 asks both pages to
  render. A grant may narrow that tree and nothing more: asking for
  `totalCharges` is refused as exceeding the ceiling. Scripts 203 and 204 are
  not consulted on this path. The gap is a SYSTEM-side decision, and it is
  question 10 for the backend.
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
- **The portal invitation on the agreement page stays hidden.** It asks whether
  the client Account already has a Core User, and `MAPPINGS_ACCOUNT` does not
  expose `user`. That script is `SYSTEM`-owned and shared by every tenant, so
  we do not widen it for one page. The invitation returns when portal access
  has a source of its own.
- **The service address must be readable through the link.** A Resource cannot
  be granted, so the page cannot follow `SERVICE_PROPERTY` to the address. The
  hook that adds an Order to the package also records the property's address on
  the Order.
- **The pricing model is not a field.** `FIELD_SERVICE_ORDER` has no pricing
  model attribute; the team's creator writes the kind into `notes` and item
  `metadata`. The page has to label each option, so the Order gets a
  `PRICING_MODEL` attribute (`SEASONAL`, `MONTHLY`, `PER_SERVICE`).
- **Event metadata through a link — not yet proven.** The team's own scripts
  send `metadata: {MESSAGE}` with an event and read `MESSAGE` from the hook's
  `context`. The dev-1 javadoc gives the anonymous endpoint
  `grantSendEvent(token, AccessGrantEventRequest(id, event, metadata))` and the
  service `IWorkflowService.sendEvent(event, entity, metadata)`, the same map
  type the authenticated `/{id}/send-event.json` takes; it has no method bodies.
  A probe on 2026-09-11 in `SERVICE_WAND_WINTER_SERVICES` got as far as issuing
  a grant carrying `P_WF:ZZ_CLAUDE_PROBE_GRANT_EVENT:DRAFT-SUBMITTED`: introspect
  listed exactly that event, and revocation took effect. Every event call then
  answered `404`, because the probe document was not readable at all: created
  through `/api/document/save.json`, it returned an id but `get.json` answered
  `404` and every list was empty, from `SYSTEM` too. Whether metadata reaches the
  hook, and whether required event attributes are enforced on this path, is
  still open. On 2026-09-15 the document list is still empty in
  `SNOWLIMITLESS`, `SERVICE_WAND_WINTER_SERVICES` and `SYSTEM`. The backend's
  answer that day concerns another failure: the core-ui admin screens send the
  `permissions` of a Document, Project or Task as nested Permission objects,
  which the server refuses with `NestedWriteNotAllowedException`, so such records
  cannot be saved by hand until core-ui maps them as references by id. Our probe
  document was saved through REST without that error and still could not be
  read.
- **`MAPPINGS_*` visibility.** The `IGrantService.mappings` javadoc requires the
  script to be visible in the authenticated organization or SYSTEM-owned;
  `MAPPINGS_ACCOUNT` is SYSTEM-owned.
- The portal flag on `OPERATOR` and the customer role a provisioned User receives
  are still to be named.
