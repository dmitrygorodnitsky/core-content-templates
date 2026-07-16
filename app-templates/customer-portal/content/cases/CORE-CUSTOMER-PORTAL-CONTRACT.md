# Core Customer Portal Contract

Status: proposed private-data backend contract. No private-data endpoint in
this document is open for the browser until it is implemented, authorized, and
proven on staging.

The host OIDC sign-in bridge is proven on `dev-1`: the manual CMS runtime reads
`/core/.well-known/oauth-protected-resource/`, starts the registered Core PKCE
flow, and returns via `/core/oauth2-callback.html`. This establishes an access
token session only. It does not resolve that subject to a customer Account and
does not open any customer record to the browser.

## Research Baseline

The Core UI generated clients expose generic, organization-scoped entity APIs:

| Service | Existing generic endpoints | Portal status |
| --- | --- | --- |
| `core-acct` | `POST /api/account/{list,get,save}.json` | Not opened |
| `core-svc` | `POST /api/{project,task,appointment}/{list,get,save}.json` | Not opened |
| `core-bill` | `POST /api/order/{list,get,save}.json` | Not opened |

Those APIs accept caller-supplied mappings and filters. Core UI sends an OIDC
bearer token plus `X-Organization-Code`; it is an authenticated staff surface,
not a customer-scoped browser API. The portal must never call it directly or
make `X-Organization-Code` an authority chosen by browser code.

The only opened public browser contract remains the anonymous Core PIM catalog
endpoint used by the Calm Harbor staging catalog. It must not share a session,
token, or authorization design with private customer data.

## Entity Reality

`Account` is the customer entity. A portal identity must resolve to exactly one
active `SPA_CUSTOMER` account in the selected organization.

| Customer portal concern | Current Core relationship | Result |
| --- | --- | --- |
| Account identity | `Account.user` exists in the data model. The Calm Harbor staging Account is bound to the customer User. | OIDC authentication is opened; the authenticated subject-to-Account resolution is not opened. |
| Orders | `Order.account` is a direct Core relationship. | A server projection can safely scope orders after account resolution. |
| Appointments | `Appointment.task -> Task.project`; neither `Task` nor `Project` has an `Account` relation in the generated model. | Customer ownership is absent. |
| Care tasks/plans | `Task.project` is direct, but `Project` has no customer relation. | Customer ownership is absent. |

The existing Calm Harbor sample organization intentionally contains an account,
care plan, task, appointment, and order, but it is integration seed data, not
proof that the appointment and care graph belongs to that account.

## Required Backend Boundary

The backend must resolve identity and ownership before it returns an entity. It
must not accept an account id, organization id, or account filter as an access
decision from the browser.

Proposed same-origin API namespace: `/core-portal/api/v1`.

| Method and path | Server-derived scope | Minimal response / command result | Gate |
| --- | --- | --- | --- |
| `GET /me` | bearer subject -> active `SPA_CUSTOMER` account -> organization | account id, display name, organization code, allowed capabilities | identity bridge |
| `GET /appointments?cursor=` | resolved account | appointment id, state, start/end, service label, permitted actions | explicit appointment ownership |
| `GET /care-plans?cursor=` | resolved account | care plan, task ids, state, customer-safe labels | explicit plan ownership |
| `GET /orders?cursor=` | resolved account | order id, state, currency, total, line-item summary | account ownership projection |
| `GET /orders/{id}` | resolved account and requested id | same order only | ownership test |
| `POST /booking-requests` | resolved account | request id, idempotency key, returned request/appointment state | availability hold and idempotency |
| `POST /orders` | resolved account | server-calculated order, id, state; no payment token in this stage | product/price validation and idempotency |

The namespace is a contract proposal, not a request to expose generic Core
entity controllers under a public route.

## Authorization Rules

1. All private portal endpoints require an OIDC access token. A missing or
   invalid token returns `401`.
2. The backend derives account and organization from the token subject. Any
   browser-sent organization or account value is ignored for authorization.
3. Access to an entity outside the resolved account returns a non-enumerating
   `404` response. List endpoints never expose cross-account counts.
4. The portal receives only the fields required for its view. PII, staff notes,
   payment data, internal attributes, generic entity mappings, and workflow
   internals are excluded by default.
5. A mutation uses an idempotency key and returns its canonical server state.
   Browser-side success must be driven only by that returned state.

## Data Model Gate

Before `/appointments` or `/care-plans` is implemented, add a server-enforced
customer ownership relation. A suitable model is a `CarePlanCustomerLink` or a
mandatory customer account reference on the care-plan aggregate; appointment
and task ownership then derives through the care plan. Do not use a browser
filter or an unvalidated free-form attribute as the authorization mechanism.

The Calm Harbor seed may be extended only after this relation exists:

1. Bind the demo login subject to `CHS_STG_ELENA_RIOS`.
2. Link Elena's care plan to that account through the enforced relation.
3. Recreate/read the task and appointment through that care plan.
4. Verify an unrelated customer receives neither records nor their counts.

## Delivery Order

1. Implement and test the authenticated identity bridge and `GET /me`.
2. Add enforced care-plan customer ownership and seed the Calm Harbor link.
3. Ship read-only appointments, care plans/tasks, and orders projections.
4. Add booking request creation with availability hold and idempotency.
5. Add order creation without payment token, using server-side PIM pricing.
6. Only then enable corresponding portal routes and commands; until then they
   remain explicitly not opened in the runtime.

## Acceptance Evidence

For every private endpoint, staging evidence must include:

- the authenticated customer receives only their account's records;
- an unrelated customer cannot read a known foreign id or infer list size;
- each response omits sensitive/internal fields;
- pagination is deterministic and cursor-scoped;
- command retries with the same idempotency key return the same logical result;
- the portal renders loading, empty, unauthorized, and error states without
  replacing them with fixture data.
