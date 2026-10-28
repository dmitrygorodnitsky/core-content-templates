# Customer scope — tagged API migration for the Snow portal

Status: **live on dev-1 since 2026-10-28.** The deployed Snow portal reads and
acts only through Core's tagged API; role 75 and the server-side tag
maintenance that makes those reads answer are recorded in
`core-ui/docs/snow-customer-portal-tagged-access.md`. No signed-in browser
test with a customer session has been run.

The Snow Account/Profile and Resource/Order/OrderItem/Document adapters use
`/api/tagged/...`, preserve owner/session checks, and never fall back to
ordinary CRUD. Property addresses are read through the tagged Account's nested
`addresses.address` relation and intersected with the owned Resources'
`ADDRESS` ids. OrderItem lines are read through their own tagged list; a line
carries its own tag. Spa purchase/booking and the anonymous magic-link review
are unchanged.

Core requests the deployed portal makes (staging modules overview, properties,
appointmentsTimeline, invoices, proposals, profile):

| Request | Permission held by role 75 |
| --- | --- |
| `/core/api/user/basic-info.json` | session and self permissions |
| `/core-acct/api/tagged/account/list.json`, `get.json` | `P_TAG_ACCT_R` |
| `/core-rm/api/tagged/resource/list.json` | `P_TAG_RESOURCE_R` |
| `/core/api/document-type/list.json` | `P_DOCUMENT_TYPE_R` |
| `/core/api/tagged/document/list.json`, `get.json` | `P_TAG_DOCUMENT_R` |
| `/core/api/tagged/document/{id}/send-event.json` | `P_TAG_DOCUMENT_E` + `P_WF:SERVICE_AGREEMENT_LIFECYCLE:SENT_TO_CLIENT-CLIENT_APPROVED`; the contract details event `AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED` with its permission of the same name |
| `/core-bill/api/tagged/order/list.json`, `get.json`, `/core-bill/api/tagged/order-item/list.json` | `P_TAG_ORDER_R` |
| `/core-bill/api/tagged/order/{id}/send-event.json` | `P_TAG_ORDER_E` + the four `P_WF:GENERAL_FSM_ORDER:` quote events, `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED` included |
| `/core-pim/api/product-price/list.json`, `/core-pim/api/product/list.json` | `P_PRICE_R`, `P_PRODUCT_R` |
| `/core-svc/api/tagged/appointment/list.json` (`type.code = SNOW_SERVICE_VISIT`) | `P_TAG_APPOINTMENT_R` |
| `/core-svc/api/tagged/appointment/{id}/list-transitions.json` (visit progress; maps `id`, `observed`, `state`) | `P_TAG_APPOINTMENT_R` |
| `/core-bill/api/tagged/invoice/list.json` | `P_TAG_INVOICE_R` |
| `/core/image/{id}/get` (visit photos) | none |
| `GET /en/core-cms/api/form-type/{code}/get.json` (`CUSTOMER_PROFILE_UPDATE`, `CUSTOMER_LOGIN_CHANGE`) | none; sent without the session, as the public quote form does |
| `POST /core-cms/api/form/submit.json` with the session (profile and sign-in edits) | none |
| `GET /core/api/user/preferences.json` (the edit's outcome) | `P_UI_USER_PREF` |
| `GET /en/core-cms/api/form-type/CUSTOMER_INVOICE_PAYMENT/get.json`, then `POST /core-cms/api/form/submit.json` with the session (card payment) | none |
| `PUT /core/api/user/preference.json` (removes the client secret from `SNOW_CUSTOMER_INVOICE_PAYMENT` once read) | `P_UI_USER_PREF` is assumed; not exercised with a customer session, and the server also removes it when the invoice is paid |
| `https://js.stripe.com/v3/` and Stripe's API from Stripe.js (card field and `confirmCardPayment`) | none; Stripe test mode on dev-1 |
| `GET /en/core-cms/api/form-type/PORTAL_QUOTE_REQUEST/get.json`, then `POST /core-cms/api/form/submit.json` with the session (quote request) | none |
| `GET /core/api/user/preferences.json` read with Contracts (the last `SNOW_PORTAL_QUOTE_REQUEST` report, for the preparing step) | `P_UI_USER_PREF`; a failed read leaves Contracts as it was |
| `/core-acct/api/tagged/account/list.json` with the profile mappings plus `attributes` (contract details pre-fill) | `P_TAG_ACCT_R` |

The PIM adapter's private product-model, product-review and inventory lists are
not called: the staging configuration leaves `pimEnrichmentMode` at `closed`.
dev-1 has no `P_TAG_ORDER_ITEM_*` permission; the order-item tagged list has not
been exercised with a customer session.

Deployment, 2026-10-28: `upsert-granite-ridge-staging-portal.mjs --live`
rebuilt the runtime and package byte-identical to the committed ones, ran
its eleven checks (all passed) and updated BlockTemplate
`CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING` (`3e57675e-c967-47b2-9501-9235830f3bc3`);
operator parameters kept their CMS values. After `block-template/clear-cache.json`
answered 200 on app-1-core-cms and app-3-core-cms, twelve fetches of
`/pages/SNOWLIMITLESS/portal` (six per node) served the uploaded bundle.

Deployment, 2026-10-28, Visits and Invoices: the staging package enables
`appointmentsTimeline` (nav label Visits) and `invoices`. A dry run rebuilt the
runtime and package and ran the twelve checks the upsert lists (all passed),
including `snow-visits-invoices-check.mjs`; `--live` then updated the same
BlockTemplate. After `block-template/clear-cache.json` answered 200 on
app-1-core-cms and app-3-core-cms, six fetches of `/pages/SNOWLIMITLESS/portal`
(three per node) served the new bundle, byte-identical on both nodes. No
signed-in browser test with a customer session has been run.

Deployment, 2026-10-28, profile editing: the Profile page edits the LEGAL
contact's name, the email, the phone and the billing address in place, each
row with its own Edit (or Add when nothing is on file), Save and Cancel, and
the sign-in email in a separate card. The browser checks a value with the
server's rules and messages before sending, submits only the changed fields
(named in `FIELDS`) as a `CUSTOMER_PROFILE_UPDATE` form, or the new login as a
`CUSTOMER_LOGIN_CHANGE` form, with the session's Bearer and the organization id
from `basic-info.json`, allows one save at a time, and waits up to 45 s for the
outcome in the User's `SNOW_CUSTOMER_PROFILE_UPDATE` or
`SNOW_CUSTOMER_LOGIN_CHANGE` preference. An applied profile change re-reads the
tagged Account; a refusal is shown next to the field it names, or in the row;
no outcome in time is shown as unconfirmed. An applied sign-in change shows the
new login with a note to use it next time; a 401 while waiting for it tells the
client to sign in again with either login. The billing address offers Google
Places suggestions only when `PORTAL_MAPS_API_KEY` is set; on 2026-10-28 the
deployed staging page had no key, so it is plain text. A fixture portal stays
read-only. The backend side is recorded in
`core-ui/docs/snow-customer-portal-tagged-access.md`.

`upsert-granite-ridge-staging-portal.mjs` ran its twelve checks in the dry
run and again with `--live`, which updated BlockTemplate
`CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING`; `block-template/clear-cache.json`
answered 200 on app-1-core-cms and app-3-core-cms; twelve fetches of
`/pages/SNOWLIMITLESS/portal` answered the same bytes from both nodes, and eight
more carried the new profile-editing code on both. The page was opened in the Browser pane in an existing signed-in
session: the profile and sign-in rows, the inline editor, a browser-side
refusal and the saving and refused states rendered at desktop, tablet and
mobile widths in light and dark mode; nothing was saved and no form was
submitted from the browser.

Deployment, 2026-10-28, invoice card payment: the detail of a `SENT` or
`OVERDUE` invoice with its full amount due offers "Pay CA$…" below the charges;
`PAID`, `VOID` and partly paid invoices offer nothing, and `DRAFT` invoices are
not listed. Pay submits a `CUSTOMER_INVOICE_PAYMENT` form carrying only
`INVOICE_ID`, waits up to 60 s for the outcome in the User's
`SNOW_CUSTOMER_INVOICE_PAYMENT` preference, then overwrites that preference
without the client secret and publishable key. `READY` loads Stripe.js from
`https://js.stripe.com/v3/` with the publishable key from the answer and mounts
the card field in a payment sheet appended to `document.body`, outside the
portal's re-rendered tree, because a re-render would destroy Stripe's iframe.
In test mode the sheet names the test card 4242 4242 4242 4242. Pay confirms
with `confirmCardPayment`; a decline or a Stripe field error is shown under the
card field and the card form stays open; `succeeded` or `processing` re-reads
the tagged invoice list every 2 s for up to 60 s until the invoice is `PAID`,
otherwise the sheet says the payment went through and the invoice will update
within minutes, and the invoice page shows "Payment received" with no second
Pay button. `PROCESSING` skips the card form; `REFUSED` shows the server's
message; a lost outcome offers Try again. One payment runs at a time. The
backend side, including why SNOWLIMITLESS refuses card payment until it has a
Ledger Account, is in `core-ui/docs/snow-customer-portal-tagged-access.md`.

The same deployment renames the Profile page's sign-in row from "Sign-in email"
to "Account name" (label, editor label and `aria-label`); the field stays an
email input with placeholder `name@example.com` and the same validation. Its
help text reads "The name you sign in to this portal with. Changing it does not
change your contact email." and, after a change, "Use this account name the
next time you sign in. Your password stays the same."

`upsert-granite-ridge-staging-portal.mjs` ran its thirteen checks, including the
new `snow-invoice-payment-check.mjs`, in the dry run and again with `--live` at
15:39 UTC, which updated BlockTemplate `CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING`;
`block-template/clear-cache.json` answered 200 on app-1-core-cms and
app-3-core-cms, and eight fetches of `/pages/SNOWLIMITLESS/portal` (four per
node) answered the same bytes carrying the payment sheet, the Stripe.js URL and
"Account name". The sheet's states (starting, card with test mode, declined,
recording, paid, slow, refused, failed) were rendered from `runtime/src` with a
stand-in Stripe card field at desktop, tablet and mobile widths in light and
dark mode; the deployed page was not opened with a customer session and no card
was entered.

Deployment, 2026-10-28, visit page: a visit shows its property (address linked
to the property page, area, approved plan), the services of the active
agreement's chosen option without prices, its progress from the tagged
transition list, before photos as soon as they exist, and after photos and
completion notes when present; a section without data is left out. Transition
`observed` values are server UTC instants, unlike the wall-clock `start` and
`end`. A visit created directly in
`SCHEDULED` has no transition, so no "Scheduled" step. The deploy key gets 403
"Entity is not accessible" from the tagged transition list of visit 78; the
customer's read of it is unverified until a signed-in browser test. The dry run
passed the thirteen checks the upsert lists; after `--live`, `clear-cache.json`
answered 200 on app-1-core-cms and app-3-core-cms, and twelve fetches of
`/pages/SNOWLIMITLESS/portal` (six per node) served the new bundle,
byte-identical on both nodes.

Follow-up, same day, time zone: the operator's signed-in session read the
transitions, but visit 78 showed "Started · 3:21 PM", the Moscow time of the
viewer, beside the Vancouver window "6:30 – 7:30 AM". Recorded moments and
"today" are now formatted in the service organization's zone. The current reads
do not carry it: SNOWLIMITLESS (Organization 43) has `timeZone`
`America/Vancouver`, but the agreement's `organization` mapping asks only for
id, code and name, and the basic-info answer used by the account gate is read
only for organization codes. So the zone comes from the staging configuration
(`account.timeZone`) and ships as the template parameter `PORTAL_TIME_ZONE`,
`America/Vancouver`; a value that is not an IANA zone falls back to the device
zone. Visit 78 then reads "Started · 5:21 AM".

Deployment, 2026-10-29, portal quote flow (interface:
`core-ui/docs/snow-portal-quote-flow.md`): the header's Request a quote opens
`#/quote/new` in a live portal whose Contracts module is enabled, and the
public form at `PORTAL_REQUEST_FORM_URL` otherwise (a fixture portal never
reaches the page). The page offers the client's own properties from the tagged
Resource list as cards with the address and area each has, and Add another
address: with `PORTAL_MAPS_API_KEY` set, Google Places suggestions restricted to
the `within:` box of `PROPERTY_ADDRESSES`, the picked place's location sent in
`PROPERTY_COORDINATES`, a typed address geocoded, and an address outside the box
or unknown to Google refused with the public form's messages; without the key a
typed address is added as text without coordinates. Risk factors, their labels
and the notes field come from the `PORTAL_QUOTE_REQUEST` form type itself; the
page has no contact field. Selected properties and located addresses are pinned
on the shared property map.

The submission is the documented body (property ids as strings, attributes
without a value left out, `metadata.language` `en`) with the session's Bearer.
The outcome is read from the User's `SNOW_PORTAL_QUOTE_REQUEST` preference every
3 s for up to 300 s (`QUOTE_REQUEST_OUTCOME_TIMEOUT_MS` in
`runtime/src/quote-request.js`), not the 45 s of a profile edit, because the hook
waits up to 130 s for each worker and checks every new address with an AI region
check. The page says "Sending your request…", then "Request sent. Waiting for
our system to pick it up…", then, once `PROCESSING` of this form is reported,
"We're checking your properties and preparing quote drafts…", with a note that
it can take a few minutes and that the quotes arrive in Contracts and by email.
With no final outcome after 300 s it shows "We're still working on your
request" with Go to Contracts and Check again, never an error. A refusal is
shown under the property cards (`PROPERTY_IDS`), under the address input
(`PROPERTY_ADDRESSES`) or above the button (no field, and `FAILED`), with the
choices kept. `ACCEPTED` shows "Request received" and what happens next, with
Go to Contracts, and re-reads Contracts and properties. Contracts reads the same
preference: `PROCESSING`, or `ACCEPTED` with an order id the client cannot read
yet, shows the preparing step.

A quote in `QUOTE_VIEWED` offers Request changes between Approve and Decline.
It opens a comment box; an empty or blank comment is refused in the browser
("Write what you would like changed before sending.") and nothing is sent;
otherwise `QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED` is sent with
`{ "MESSAGE": { "value": "<text>" } }`, the quotes are re-read and the option
shows "Changes requested". A failed send keeps the comment.

An agreement in `AWAITING_CLIENT_DETAILS` shows a details step instead of the
old notice, and its Client facts card is left out while the step is open. The
pre-fill reads the Account through the tagged list with the profile mappings
plus `attributes`: legal name from the Account name, client type from
`LEGAL_ENTITY_TYPE` only when it is one of the five accepted values, billing
address from `address1` of the lowest-id `BILLING` address, and the
representative from the `LEGAL` contact with its lowest-id `EMAIL` and `PHONE`
entries (the profile's reading of "first"); the confirmations are never
pre-filled. Client type is a required choice of `INDIVIDUAL`,
`UNINCORPORATED_BUSINESS`, `CORPORATE`, `ASSOCIATION` and `GOVERNMENT`;
`ORGANIZATION`, which the processor refuses and Account 732's old agreement
holds, is not offered. The browser checks every field with the profile's rules
and both confirmations, then sends
`AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED` with every attribute as
`{ "value": ... }`, reads the agreement every 1.5 s for up to 45 s and re-reads
Contracts. Accepted details show "Pending management approval" and what comes
next; details the processor returned are marked field by field from
`CLIENT_DETAILS_ERRORS` with the client's input kept; no state change in 45 s
is shown as unconfirmed with Refresh status.

Status labels follow the interface's step tables. Quotes: Sent (`QUOTE_SENT`),
Viewed, Changes requested (also `CHANGES_NOTIFICATION_FAILED` and
`_CONFIRMED`), Approved (also `APPROVAL_PROCESSING_FAILED`), Declined (also
`DECLINE_PROCESSING_FAILED`); `WAITING_FOR_AREA` and `PRICING_FAILED` join the
manager-side states that keep Contracts in preparing. Agreements: Awaiting your
decisions (`QUOTATION_SENT`, `QUOTATION_UPDATE`, `QUOTATION_SEND_FAILED`),
Awaiting your details, Checking your details (`CLIENT_DETAILS_RECEIVED`),
Pending management approval (`DRAFT`, `PENDING_MANAGEMENT_APPROVAL`,
`INTERNALLY_APPROVED`, `CLIENT_CHANGES_REQUESTED`), Sent for your approval
(`SENT_TO_CLIENT`; `AGREEMENT_SEND_FAILED` reads "Being sent to you" and offers
no approval), Approved (`CLIENT_APPROVED`, `ACTIVATION_FAILED`) and Active.
Nothing reads Order or agreement `metadata`: the portal's tagged reads do not
map it, so they do not return it, and no screen depends on `ORIGIN`.

`upsert-granite-ridge-staging-portal.mjs` now lists fifteen checks, the new
`snow-portal-quote-flow-check.mjs` included; it boots `runtime/src` in a fake
DOM against a stand-in Core and drives the real actions. The dry run and the
`--live` run (expected root `3e57675e-c967-47b2-9501-9235830f3bc3`, existing
required) passed all fifteen and updated BlockTemplate
`CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING`; PageContext 22 was not written.
`block-template/clear-cache.json` answered 200 from app-3-core-cms and
app-1-core-cms, and twelve complete downloads of `/pages/SNOWLIMITLESS/portal`
(six per node, gzip decoded, ending with `</html>`) were byte-identical and
carried the package's script and stylesheet verbatim apart from the trailing
newline the CMS drops; the page keeps its maps key. The screens were rendered
from `runtime/src` against a stand-in Core at desktop, tablet and mobile widths
in light and dark mode. No signed-in browser test with a customer session has
been run; the request, the change request and the details event have not yet
reached Core from a customer session.

History: on 2026-10-19 the deployment was held because `P_TAG_DOCUMENT_E` also
authorized `sync-state-history`; the backend was told. On 2026-10-28 the user
decided to go fully tagged, `_E` included.

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
5. Can a hook read the subject on a signed-in form submit? Answered by a
   dev-1 probe on 2026-10-28: a Bearer submission sets `Form.user` to the
   session User and ignores a `user` in the body, and the hooks run in the
   submitter's security context.
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
