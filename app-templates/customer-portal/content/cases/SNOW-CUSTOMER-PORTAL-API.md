# Snow customer portal — customer-scoped API the backend owes

Status: request to the backend, version 1, 2026-09-11. Nothing here exists.
Version 2, one generic type-driven capability instead of per-screen methods, is
`CUSTOMER-SCOPE-GENERIC-API.md`. This version is the Granite Ridge counterpart
of the "Proposed Customer-Scoped API" in
`CALM-HARBOR-CUSTOMER-PORTAL-PRODUCT-CONTRACT.md`, derived from the portal
screens (`runtime/data/cases/granite-ridge-snow.js`, the Granite Ridge design
requests) and the Core model in `SNOW-VERTICAL-CORE-MODEL.md`.

**Deferred on 2026-09-16.** The backend builds this later. The first dev version
of the portal reads the generic endpoints and scopes to the customer Account in
the browser, which is a bounded dev demonstration and not production isolation.
No signed-in customer reaches production until this exists.

## What the generic endpoints serve today

Read on 2026-09-16 as `SNOWLIMITLESS`. Every portal need has a source except the
service agreement, and what is missing is records, not endpoints.

| portal need | endpoint | rows on dev-1 |
| --- | --- | --- |
| properties | `core-rm/api/resource/list.json`, kept by the `ACCOUNT` attribute | 691 in the organization |
| addresses | `core/api/address/list.json` by id | 710 |
| quotes and contracts as orders | `core-bill/api/order/list.json`, filter `account.id` | 12 |
| invoices | `core-bill/api/invoice/list.json` | 0 |
| visits | `core-svc/api/appointment/list.json` | 0 |
| support tickets | `core-svc/api/task/list.json`, task type `SUPPORT_TICKET` | 0 |
| seasons | `core-svc/api/project/list.json` | 0 |
| quote requests | `core-cms/api/form/list.json` | 7 |
| the customer Account | `core-acct/api/account/list.json` | 661 |
| service agreements | `core/api/document/list.json` | answers, and every document is invisible |

Two things worth knowing before hunting for an endpoint. Projects, tasks and
appointments live in `core-svc` and nowhere else; no other service on dev-1
answers for them, and twenty other service names have no `api-docs` at all. And
the documentation of a service is at `/{service}/api-docs`, not
`/{service}/v3/api-docs`, which answers `404`.

## Why

Core grants permissions per entity type within an organization. A portal user
holding `P_ORDER_R` is not shown to see only their own Orders, so a signed-in
customer cannot be let into production on the generic `list.json` endpoints.
Magic links do not have this problem — they name exact records — which is why
the anonymous quotation flow can go live before this API exists.

## Rules for every method

1. The server derives the User, the customer Account and the organization from
   the session. No request carries `accountId`, `userId` or an organization.
2. Every record returned belongs to that Account. An id that does not answers
   `404`.
3. Lists are paginated. Money, totals and statuses come from the server.
4. A record carries `allowedActions`: what this customer may do with it now.
5. A command is a workflow event underneath, is safe to repeat, and answers with
   the record as it now stands.

Paths name the boundary, not the implementation. The generic endpoints with a
server-enforced Account filter for the customer role would satisfy the same
contract.

## First live portal

### Session and profile

| method | returns or does | Core source |
| --- | --- | --- |
| `GET /portal/v1/me` | user, Account, operator, whether the operator has the portal, locale, time zone | User, `Account.user`, organization type `OPERATOR` |
| `GET /portal/v1/profile` | Account name, primary contact, email, phone, billing address, notification preferences | Account, Contact, AccountAddress |
| `PATCH /portal/v1/profile` | changes the whitelisted fields above | same |

### Properties

| method | returns or does | Core source |
| --- | --- | --- |
| `GET /portal/v1/properties` | my properties: address, category, state, coordinates when known, next visit, open ticket | `SNOW_REMOVAL_PROPERTY` by `ACCOUNT`; Address by id |
| `GET /portal/v1/properties/{id}` | the property with its measurement, on-site contact, site plan and recent visits | same, `PROPERTY_PLAN` media |

### Visits

| method | returns or does | Core source |
| --- | --- | --- |
| `GET /portal/v1/visits?from=&to=&propertyId=` | visits on my properties in a window: property, service, crew or person, planned and actual window, state | Appointment `SNOW_SERVICE_VISIT`, `SNOW_INSPECTION_VISIT` through `RESOURCE` |
| `GET /portal/v1/visits/{id}` | the visit with completion notes and before and after photos | same, `PRE_SERVICE_MEDIA`, `POST_SERVICE_MEDIA` |

Appointments reach the Account only through the property, so the server has to
own that traversal.

### Agreements and quotes

| method | returns or does | Core source |
| --- | --- | --- |
| `GET /portal/v1/agreements` | my agreements: number, state, term, properties | Document `SERVICE_AGREEMENT` by `CLIENT` |
| `GET /portal/v1/agreements/{id}` | parties, properties with services and prices, terms, PDF | same, its `ORDERS` |
| `POST /portal/v1/agreements/{id}/approve` | client approval of an agreement sent to a signed-in client | `SENT_TO_CLIENT-CLIENT_APPROVED` |
| `GET /portal/v1/quotes` | quotes sent to me: property, pricing model, total, state | Order by `CLIENT`, from `QUOTE_SENT` on |
| `GET /portal/v1/quotes/{id}` | lines with products, quantities and prices | Order, OrderItem |
| `POST /portal/v1/quotes/{id}/approve` | approves the quote | `QUOTE_VIEWED-CLIENT_APPROVED` |
| `POST /portal/v1/quotes/{id}/decline` | declines the quote | `QUOTE_VIEWED-DECLINED` |

The quote and agreement commands serve a client who is already signed in — a
new property, the next season. The first sale runs through magic links.
Requesting changes to a quote is not an API method: it is the
`QUOTE_CHANGE_REQUEST` form below.

### Invoices

| method | returns or does | Core source |
| --- | --- | --- |
| `GET /portal/v1/invoices?status=` | my invoices: number, amount, due date, status — overdue, due this month, due later, paid | Invoice `PER_SERVICE`, `FIXED_RATE` |
| `GET /portal/v1/invoices/{id}` | lines and PDF | same |

Paying an invoice is not part of this request.

### Support

| method | returns or does | Core source |
| --- | --- | --- |
| `GET /portal/v1/tickets` | my tickets: subject, property, state, last update | Task `SUPPORT_TICKET` by `ACCOUNT` |
| `GET /portal/v1/tickets/{id}` | the ticket with its messages | same |

Opening a ticket and replying in it are the `SUPPORT_REQUEST` and
`SUPPORT_TICKET_REPLY` forms below; the backend owes only the reads.

### Files

| method | returns or does |
| --- | --- |
| `GET /portal/v1/files/{id}` | a photo, site plan or PDF, only when it is attached to one of my records |

## Client input through forms — ours, decided on 2026-09-11

A signed-in client's free-form input is a Core form, submitted through
`core-cms/api/form/submit.json`. The form's workflow checks it and acts on the
records it concerns, the same way the `GET_QUOTE_` request does.

| form type | fields | on submit | refused when |
| --- | --- | --- | --- |
| `QUOTE_CHANGE_REQUEST` | `ORDER` (Order, required), `MESSAGE` (required), `ATTACHMENTS` (Media, multiple) | sends `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED` to the Order with the message; notifies `QUOTATION_MANAGER` | the submitter is not the Order's client, or the quote is not awaiting the client |
| `SUPPORT_REQUEST` | `PROPERTY` (Resource `SNOW_REMOVAL_PROPERTY`, required), `SUBJECT`, `MESSAGE` (required), `ATTACHMENTS` | opens a `SUPPORT_TICKET` task on the submitter's Account and that property; notifies `CUSTOMER_SUPPORT_MANAGER` | the property is not the submitter's |
| `SUPPORT_TICKET_REPLY` | `TICKET` (Task, required), `MESSAGE` (required), `ATTACHMENTS` | adds the message to the ticket | the ticket is not the submitter's, or it is closed |

- Each form type has a workflow `SUBMITTED → PROCESSED | REJECTED`. The check
  and the action run in the `SUBMITTED` hook; a refused form lands in
  `REJECTED`, where the manager sees it.
- A form keeps no reference to its author. `updatedBy` is plain text, and on the
  dev-1 quote requests it already reads `system`. The hook therefore takes the
  submitter from the session at submit time, as the team's hooks do with
  `Auth.getAuthenticatedUser()`, and resolves the Account through `Account.user`.
  That the hook sees the signed-in client on a form submit is still to be
  verified.
- This serves signed-in clients only. The form endpoint knows nothing of a magic
  link, so on the anonymous quote page anyone holding an Order id could file a
  request; there, requesting changes stays an event sent through the link.
- Whether a form submit accepts attachments, and how a ticket stores its
  messages, are still to be verified.

## Later

| method | returns or does | missing today |
| --- | --- | --- |
| `GET /portal/v1/activity?cursor=` | events on my records: visit started or finished, quote or invoice issued, ticket answered | no event feed identified in Core |
| `POST /portal/v1/activity/read` | marks events read | same |
| `GET /portal/v1/season-summary?season=` | visits, average response, share inside the contracted window, de-icer used | Core holds no trigger, response time or material used |
| `GET /portal/v1/documents` | reports issued to the client, such as a monthly compliance report | no such document type |
| `PATCH /portal/v1/properties/{id}/access` | gate code and on-site contact, if the client may edit them | `ON_SITE_CONTACT_INFO` exists; editing is undecided |

## Not in this request

- Weather comes from Xweather in the browser.
- Prices come from the public PIM catalog, which needs no customer.
- A quote request is the anonymous `GET_QUOTE_` form; for a signed-in client it
  must attach new properties to the existing Account, which is our script's job.

## What is ours before these can be used

- `SUPPORT_TICKET` has no workflow; `SUPPORT_TICKET_LIFECYCLE` exists and is not
  attached.
- `SNOW_SERVICE_VISIT.RESOURCE` points at a type that does not exist.
- The staging customer role `SW_FS_WS_CUSTOMER_PORTAL` exists on dev-1 and is
  assigned during Account activation; the `OPERATOR` portal flag remains
  intentionally deferred. The role is not a production boundary without
  backend-enforced customer Account scope.
- The three form types above, their workflows and their hooks.
