# Customer scope — a generic, type-driven API for signed-in customers

Status: request to the backend, version 2, 2026-09-11. Nothing here exists.
Version 1, `SNOW-CUSTOMER-PORTAL-API.md`, lists one method per portal need; this
version asks for one generic capability that serves every entity type and every
vertical, and shows the snow portal as its first configuration. Facts marked
*verified* were read from the dev-1 `api-docs` of each service on 2026-09-11.

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
| Order | `FIELD_SERVICE_ORDER`, `WINTER_SERVICES_ORDER` | field `account` | `QUOTE_SENT`, `QUOTE_VIEWED`, `CLIENT_APPROVED`, `DECLINED` |
| OrderItem | | through its Order | |
| Document | `SERVICE_AGREEMENT` | attribute `CLIENT` | `SENT_TO_CLIENT`, `CLIENT_APPROVED`, `ACTIVE`, `SUSPENDED`, `EXPIRED` |
| Appointment | `SNOW_SERVICE_VISIT`, `SNOW_INSPECTION_VISIT` | attribute `RESOURCE` through Resource | |
| Invoice | `PER_SERVICE`, `FIXED_RATE` | field `account` | |
| Task | `SUPPORT_TICKET` | attribute `ACCOUNT` | |
| Media | | referenced by `PROPERTY_PLAN`, `PRE_SERVICE_MEDIA`, `POST_SERVICE_MEDIA` of a scoped row | |

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
