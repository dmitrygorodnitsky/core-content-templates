# Core Customer Portal Contract

Status: source-traced and backend-verified staging contract. Account bootstrap
and Account-scoped Orders list adapters are implemented, proven read-only on
`dev-1`, and wired into the dedicated Calm Harbor manual CMS root. The generic
multi-vertical CMS runtime has not yet adopted this bootstrap.

## Current Identity Decision

The customer is the one `Account` whose `user` relation points to the currently
authenticated Core `User`. There is no separate customer-login entity or
customer subject mapping at this stage.

The browser follows the same Core calling convention as `core-ui`:

1. Core OIDC authorization-code with PKCE supplies an access token.
2. `POST /core/api/user/basic-info.json` returns the authenticated User id and
   authorized organizations. This request has a bearer token and deliberately
   has no `X-Organization-Code` header.
3. The portal verifies its configured organization against
   `authorizedOrganizations`.
4. `POST /core-acct/api/account/list.json` uses the bearer token plus the
   verified `X-Organization-Code` and filters by both:
   - `user.id = authenticatedUserId`;
   - `type.code = SPA_CUSTOMER` (or the configured customer Account type).
5. Exactly one result is required. Zero results means `customer-not-linked`;
   multiple results mean `customer-account-ambiguous`. Neither state may fall
   back to a fixture Account.

The executable request contract is owned by
`runtime/src/adapters/core-account-adapter.js` and validated by
`scripts/core-account-adapter-check.mjs`. The sanitized live probe is owned by
`scripts/core-account-live-check.mjs`; it does not print or persist the bearer
token.

## Core Request Shape

Every private Core service request uses:

```text
Authorization: Bearer <OIDC access token>
Content-Type: application/json
X-Organization-Code: <organization verified by user/basic-info>
```

`X-Organization-Code` is omitted only for `user/basic-info`, matching the
`core-ui` OIDC interceptor. Service bases are same-origin and configured as
`/core`, `/core-acct`, `/core-bill`, `/core-svc`, and `/core-pim` as their
adapters are opened.

Mappings are explicit and least-data. Components never consume generic raw
entity responses directly; adapters normalize them into customer-safe module
shapes.

## Current Entity Relationships

| Portal concern | Core relationship | Current result |
| --- | --- | --- |
| Customer identity/profile | `Account.user -> User` and `Account.type -> SPA_CUSTOMER` | Implemented, live-proven on `dev-1`, and activated in `CUSTOMER_PORTAL_CALM_HARBOR_STAGING`. |
| Orders | `Order.account -> Account` | Read-only list implemented, live-proven, and activated in the same manual staging root. |
| Appointments | `Appointment.task -> Task.project` | No Account relationship is present; customer-safe activation remains closed. |
| Care plans/tasks | `Task.project`; Project has no Account relationship | Customer-safe activation remains closed. |
| PIM pricing/products | Public PIM query by configured product types | Already opened independently; it is not customer-scoped. |

## Read-Only Staging Queries

| Module | Endpoint | Mandatory filters | Observed staging access |
| --- | --- | --- | --- |
| Account bootstrap/profile | `POST /core-acct/api/account/list.json` | `user.id`, `type.code` | Allowed for the supplied low-rights test session on `dev-1`; exact permission evaluation is not yet source-proven. |
| Orders list | `POST /core-bill/api/order/list.json` | `account.id = resolved Account.id` | Allowed for the same session; returned only the resolved Account's row in the live probe. |
| Order detail | Filtered `POST /core-bill/api/order/list.json` | resolved Account id plus requested order id | Not yet implemented or live-proven. |

Order detail must not trust a route id alone. If the generic `get` endpoint
cannot enforce or prove Account ownership, the adapter loads through the
filtered list path and requires exactly one result.

Appointments, Care, proposals, checkout, and support conversations remain
unopened until a real customer relationship and matching Core endpoint are
source-traced.

## RBAC Gate

The repository seed `core-ui/scripts/dev/seeds/beautySpaCustomerPortalRbac.json`
lists only sign-in and self-service User permissions. Nevertheless, the
supplied low-rights test session successfully read its matching Account and one
Account-scoped Order on the deployed `dev-1` stack. That proves the requests
work; it does not prove whether access came from self-scope behavior, another
deployed role, or entity permissions not represented by that seed.

Do not add speculative permission codes merely to match the repository seed.
Before production activation, trace and test the deployed permission decision,
including a negative user and a foreign Account filter. Write, event,
transition, delete, import, and broad `*` permissions remain prohibited.

Important limitation: the generic Core permissions are service/entity
permissions, not evidence of row-level Account isolation. The browser filters
by `user.id` and resolved `account.id`, but a modified client may try another
filter. Until Core enforces the same relation server-side, this direct generic
API approach is staging-only and must not be described as production tenant
isolation.

## Fail-Closed States

| Condition | Portal state |
| --- | --- |
| Missing/expired token or Core `401` | `session-expired` |
| Configured organization is absent from `authorizedOrganizations` | `organization-forbidden` |
| Account endpoint returns `403` | `customer-forbidden` |
| No matching Account | `customer-not-linked` |
| More than one matching Account | `customer-account-ambiguous` |
| Account relation does not match authenticated User | `customer-scope-mismatch` |
| Malformed response or Core failure | `customer-unavailable` / module error |

No condition above may load fixture customer data in live mode.

## Delivery Order

1. Keep the existing Core OIDC authorization-code/PKCE boundary.
2. Preserve the activated `user/basic-info -> Account.user` bootstrap in the
   Calm Harbor staging root.
3. Preserve the activated read-only Orders list filter using the resolved
   Account id.
4. Trace the deployed RBAC/self-scope decision and verify negative and foreign-
   Account attempts fail closed.
5. Transfer accepted account/loading/empty/forbidden/error states 1:1 into the CMS
   portal package.
6. Add a customer relation before opening Appointments or Care.
7. Open writes one command at a time only with idempotency and authoritative
   readback.

## Acceptance Evidence

- `user/basic-info` returns the signed-in User without an organization header;
- configured organization is present in `authorizedOrganizations`;
- the Account query contains both `user.id` and `type.code` filters and returns
  exactly one Account;
- a User without an Account receives no fixture customer;
- an unauthorized organization and missing permissions fail closed;
- Orders queries always include the resolved Account id;
- the `dev-1` probe resolved the test customer Account and returned one Order
  with status `OPEN` through that exact Account filter;
- browser responses omit unnecessary internal mappings and sensitive fields;
- loading, empty, forbidden, expired-session, and source-failure states remain
  visually truthful.

The generated staging package and its browser contract are:

- `dist/manual-upload/customer-portal-calm-harbor-staging`;
- `scripts/calm-harbor-customer-portal-manual-check.mjs`.
