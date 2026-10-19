# Customer scope — tagged API migration for the Snow portal

Status: **prepared frontend; deployment waits for backend permission fix**,
2026-10-19. Source baselines: core-ui `ba2eae1c3` (`codex/snow-crm`) and
core-content-templates `e257e1c` (`codex/lab-ui-durable-catalog`).
The user chose Snow first and publication/revocation of personal
user tags; no general tagged save. Spa purchase/booking and anonymous magic-link
review are outside this migration.

The live OpenAPI publishes tagged Account, Resource, Document, Order, OrderItem,
Invoice, BalanceTransaction and SVC entities. Use these existing APIs for row
access; the historical `/me/` proposal below is superseded and is not an
implementation plan. OrderItem has independent tags and receives no automatic
parent access.

The Snow Account/Profile and Resource/Order/OrderItem/Document adapters now use
`/api/tagged/...`, preserve owner/session checks, and never fall back to ordinary
CRUD. Property addresses are fetched through the authorized tagged Account's
nested `addresses.address` relation and intersected with owned Resource ADDRESS
IDs, requiring no ordinary Address read. Nesting does not introduce independent
Address tags. Type/catalog and PIM requests retain their separate contracts.

**Blocker confirmed on deployed CORE Document:** both `send-event` and
`sync-state-history` use `P_TAG_DOCUMENT_E`. The latter directly persists history
and final state; the inspected helper contains no workflow-event permission
check. Thus `_E` is wider than the agreed selected-event authority. The user
chose to send a backend note and wait, rather than deploy a read-only interim.
The note and acceptance tests are in
`core-ui/docs/snow-customer-portal-tagged-access.md`. BILL controllers and exploit
behavior were not tested. The diagnostic was removed without permission residue.

No role replacement, server tag-maintenance hooks, existing-data tag backfill,
CMS export or deployment has been done. The current staging-only deployment
retains its previous authorization model; this source change is not production
acceptance. Tagged mappings do not enforce a DEFAULT read/write ceiling; generic
`_W`, `_D` and `_AUD` are not approved for customers.

Cross-zone dependency: portal runtime owns the prepared adapter composition;
portal build tooling owns regeneration/upload; core-ui owns role and trusted
workflow tag maintenance; backend owns separating history-sync authority.
Inputs are the corrected backend permission contract and publication receipts.
Outputs must be tagged-only private reads, selected safe events and preserved
anonymous links. Acceptance requires two-user/foreign-record negative tests,
independent OrderItem visibility, publish/revoke/republish and user-reassignment
checks, plus ordinary-CRUD denial. No delivery deadline is assumed.

Validation completed: targeted Account/Snow/profile/contracts/overview and
`snow-tagged-api-check.mjs` checks, Spa orders/booking regressions, anonymous
client-review regression, and temporary bundle build. The owning Snow upsert's
checks include the new tagged transport check. Generated runtime/manual and dist
are untouched.

**Exact next action:** after the backend fix, verify customer `_E` cannot call
history sync (including force=true), then implement the server publication/
revocation hooks and guarded backfill. Only then replace role 75, run live
negative tests, rebuild/export with `upsert-granite-ridge-staging-portal.mjs` and
deploy. Do not run that upsert as the next step before resolving these gates.

## Historical /me/ proposal (2026-09-11, superseded)

## 1. The idea: a signed-in customer is a dynamic access grant

Core already answers most of this question for anonymous users. An access grant
(magic link) gives a bearer:

- generated endpoints per entity — `/{service}/i/{token}/{entity}/list.json`,
  `get.json`, `save.json`, `event.json` — and `/core/i/{token}/introspect.json`;
- fields capped by the `MAPPINGS_{ENTITY}` script rendered for one permission,
  and narrowed per grant;
- workflow events delegated one by one as `P_WF:{workflow}:{event}`.

What a grant cannot express is the portal's set of records: a grant names exact
ids fixed at issue time, while a customer owns whatever properties, visits,
quotes and invoices exist now. **Customer scope** is the same machinery with a
different subject: the session's customer Account instead of a token, and a
scope rule per entity type instead of a list of ids.

The browser then has one client for both. The anonymous quote page talks to
`/i/{token}/…`, the signed-in portal to `/me/…`, with the same request and
response shapes and the same introspection.

## 2. What the backend builds once

### 2.1 Subject

On every `/me/` request the server resolves the session User, then the Account
whose `Account.user` is that User and whose type is a customer type configured
for the organization. Exactly one Account is the subject. None or several
answers `403`. The request carries no `accountId` or `userId`.

### 2.2 Scope rules

A scope rule tells the server how a row belongs to the subject. Rules are data,
kept the way `MAPPINGS_{ENTITY}` is kept: one Velocity script per entity class,
`CUSTOMER_SCOPE_{ENTITY}`, visible in the organization or owned by `SYSTEM`,
rendering a JSON array:

```json
[
  { "type": "SNOW_REMOVAL_PROPERTY", "owner": { "attribute": "ACCOUNT" } },
  { "type": "FIELD_SERVICE_ORDER", "owner": { "field": "account" }, "states": ["QUOTE_SENT", "QUOTE_VIEWED", "CLIENT_APPROVED", "DECLINED"] },
  { "type": "SNOW_SERVICE_VISIT", "owner": { "attribute": "RESOURCE", "through": "Resource" } }
]
```

| key | meaning |
| --- | --- |
| `type` | an entity type code; a type absent from the array is invisible to customers |
| `owner.field` | a core field holding the Account, such as `Order.account` |
| `owner.attribute` | a type attribute holding the Account id, such as `ACCOUNT` or `CLIENT` |
| `owner.self` | the row is the subject Account itself |
| `owner.through` | the attribute holds a row of another entity, and that row must itself be in scope |
| `owner.referencedBy` | the row is in scope when a scoped row references it, for addresses and media |
| `states` | optional; the row is visible only in these workflow states |

`owner.attribute` and `owner.through` need attribute predicates inside the
server. Today's list API rejects them: `attributes.ACCOUNT` matches nothing and
a bare `ACCOUNT` answers `500` (`SNOW-VERTICAL-CORE-MODEL.md` §6).

### 2.3 Endpoints

The same generated shapes as the grant endpoints, under `/me/`:

| method | does |
| --- | --- |
| `POST /core/me/introspect.json` | the subject — user, Account, organization — and per entity type `canRead`, `canWrite` and the events the customer may send, in the grant introspection shape |
| `POST /{service}/me/{entity}/list.json` | rows in scope; paging, sorting and filters on mapped fields, attribute fields included; filters are added to the scope, never replace it |
| `POST /{service}/me/{entity}/get.json?id=` | one row in scope; out of scope answers `404` |
| `POST /{service}/me/{entity}/events.json?id=` | the events this customer may send to this row now: role permissions, current state and scope together |
| `POST /{service}/me/{entity}/event.json` | `{ id, event, metadata }` for a row in scope and an allowed event |
| `POST /{service}/me/{entity}/save.json` | writes only the fields of the `MAPPINGS_{ENTITY}` write set for the customer permission |
| `GET /core/me/media/{id}` | a file referenced by a row in scope |

### 2.4 Rules

1. **Fields.** `MAPPINGS_{ENTITY}` rendered for the customer's permission is the
   ceiling; the request's `mappings` may only narrow it, validated as grant
   mappings are.
2. **A customer role works only through `/me/`.** A role marked
   customer-scoped is refused by the tenant endpoints `/api/{entity}/…`.
   Otherwise the same `P_ORDER_R` that reads my orders under `/me/` reads every
   order of the operator under `/api/`.
3. **Events** run through the normal workflow, with its validation and hooks.
4. **The hook context carries the subject.** On a form submitted by a signed-in
   customer, the `SUBMITTED` hook needs the subject Account, so a form can
   check that the order, property or ticket it names is the submitter's.

### 2.5 Entities to open

Generated `/me/` endpoints are needed for `account`, `address`, `resource`,
`order`, `order-item`, `invoice`, `document`, `appointment`, `task` and media.
Of these, dev-1 grants reach only `account`, `order`, `document`, `task` and
`appointment` today (*verified*); `resource`, `invoice`, `address` and
`order-item` have tenant endpoints and no grant endpoints.

## 3. What we configure for the snow portal

### 3.1 Scope rules

| entity | types | owner | states |
| --- | --- | --- | --- |
| Account | `CUSTOMER` | self | |
| Address | | referenced by the subject Account or a scoped Resource `ADDRESS` | |
| Resource | `SNOW_REMOVAL_PROPERTY` | attribute `ACCOUNT` | |
| Order | `FIELD_SERVICE_ORDER`, `WINTER_SERVICES_ORDER` | field `account` | `QUOTE_SENT`, `QUOTE_VIEWED`, `CUSTOMER_CHANGES_REQUESTED`, `CLIENT_APPROVED`, `DECLINED` |
| OrderItem | | through its Order | |
| Document | `SERVICE_AGREEMENT` | attribute `CLIENT` | `QUOTATION_SENT`, `AWAITING_CLIENT_DETAILS`, `DRAFT`, `PENDING_MANAGEMENT_APPROVAL`, `INTERNALLY_APPROVED`, `SENT_TO_CLIENT`, `CLIENT_APPROVED`, `ACTIVE`, `SUSPENDED`, `EXPIRED` |
| Appointment | `SNOW_SERVICE_VISIT`, `SNOW_INSPECTION_VISIT` | attribute `RESOURCE` through Resource | |
| Invoice | `PER_SERVICE`, `FIXED_RATE` | field `account` | |
| Task | `SUPPORT_TICKET` | attribute `ACCOUNT` | |
| Media | | referenced by `PROPERTY_PLAN`, `PRE_SERVICE_MEDIA`, `POST_SERVICE_MEDIA` of a scoped row | |

The agreement is in scope from `QUOTATION_SENT`, the state in which its quotes
reach the client, because the portal's package header reads it while they are
under review. In `QUOTATION` its quotes have not been sent, so it stays hidden,
and so does a `CANCELED` package. A quote returned for changes stays visible in
`CUSTOMER_CHANGES_REQUESTED`. Nothing in scope yet tells a client that a request
is being prepared, since operator-side Orders and an agreement in `QUOTATION`
are hidden; question 7 in §5 asks for that signal.

### 3.2 Role, fields and forms

- A customer-scoped role in the operator organization with the read permissions
  of the entities above, the write permission for the profile fields, and
  these events: `P_WF:GENERAL_FSM_ORDER:QUOTE_SENT-QUOTE_VIEWED`,
  `…:QUOTE_VIEWED-CLIENT_APPROVED`, `…:QUOTE_VIEWED-DECLINED`,
  `P_WF:SERVICE_AGREEMENT_LIFECYCLE:SENT_TO_CLIENT-CLIENT_APPROVED`.
- `MAPPINGS_{ENTITY}` scripts for those permissions: which fields a customer
  reads, and which profile fields they write.
- The forms `QUOTE_CHANGE_REQUEST`, `SUPPORT_REQUEST` and `SUPPORT_TICKET_REPLY`
  (`SNOW-CUSTOMER-PORTAL-API.md`) with their workflows and hooks.

### 3.3 The portal screens on this API

| need | call |
| --- | --- |
| who I am, what I may do | `POST /core/me/introspect.json` |
| profile | `get.json` and `save.json` on `/core-acct/me/account/` |
| properties with addresses | `/core-rm/me/resource/list.json`, then `/core/me/address/list.json` |
| visits in a window, by property | `/core-svc/me/appointment/list.json` filtered by date and `RESOURCE` |
| visit with photos | `/core-svc/me/appointment/get.json`, `/core/me/media/{id}` |
| agreements, approve | `/core/me/document/list.json`, `get.json`, `event.json` |
| quotes and lines, approve or decline | `/core-bill/me/order/list.json`, `/core-bill/me/order-item/list.json`, `event.json` |
| invoices | `/core-bill/me/invoice/list.json`, `get.json` |
| tickets and messages | `/core-svc/me/task/list.json`, `get.json` |
| request changes, open a ticket, reply | the forms, through `core-cms/api/form/submit.json` |
| buttons available on a record | `events.json` |

## 4. Outside the generic API

- **The season summary** — visits, response time, share inside the window,
  de-icer used — is an aggregate, and Core holds no trigger, response time or
  material to aggregate.
- **The activity feed** needs an event or notification entity; once one exists,
  it is scoped like any other.
- **Payments** are not part of this request.
- **Home-screen joins** such as a property's next visit or open ticket are
  composed in the browser from the scoped lists.

## 5. Questions for the backend

1. Scope rules as a script per entity class, like `MAPPINGS_{ENTITY}`, or as a
   property of each entity type?
2. Can a role be marked customer-scoped, so that its permissions apply only
   through `/me/`?
3. Can the scope evaluation follow attributes and one hop through another
   entity, as `Appointment.RESOURCE → Resource.ACCOUNT` needs?
4. A User owning several customer Accounts: refuse, or pick one through a header
   the server checks against the subject?
5. Can a hook read the subject on a signed-in form submit?
6. A quote sent back for changes returns to `QUOTE_PREPARED` and leaves the
   client's list until it is sent again. Is a state history the right way to
   keep it visible, or should the workflow gain a client-visible revision state?
7. What tells a signed-in client that a request is being prepared? Operator-side
   Orders and an agreement in `QUOTATION` are out of scope by design. Our
   proposal: the `GET_QUOTE_` hook writes the resolved Account into an `ACCOUNT`
   attribute on the form, and the subject's processed quote requests become
   readable through `/core-cms/me/form/list.json` with a scope rule on that
   attribute. Is a scoped form list possible, or should the Account carry a
   server-maintained flag instead?
