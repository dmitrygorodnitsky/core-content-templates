# Design Request: Calm Harbor Authenticated Live-Data States

## Context

The accepted Calm Harbor customer portal already defines the production visual
composition for all private routes. The next delivery phase replaces fixture
entities with customer-scoped data resolved from the authenticated Core OIDC
session.

OIDC authentication by itself is not enough to render private data. After Core
sign-in, the portal must resolve the subject to one active `SPA_CUSTOMER`
Account and then load only entities authorized for that Account and tenant.
This introduces honest lifecycle and access states that are not consistently
represented in the current executable design.

This request is presentation-only. It does not authorize an API, permission,
customer relation, mutation, or success result.

Implementation evidence now exists for a read-only `User -> Account -> Orders`
path on `dev-1`. That evidence does not remove any requested loading, empty,
access-denied, expired-session, or source-failure presentation state, and it
does not open Order writes or any other module.

## User Goal

A signed-in Calm Harbor customer can understand whether the portal is still
loading, has no relevant data, is temporarily unavailable, cannot access a
resource, or has completed a server-confirmed action. No private fixture data
may appear while a live request is unresolved or failed.

## Shared Session And Account States

Provide an accepted presentation within the existing portal shell for:

| State | User-facing meaning | Required behavior |
| --- | --- | --- |
| `resolving-customer` | Core sign-in succeeded and the portal is resolving the customer Account and capabilities. | Non-interactive progress. Do not render private fixture entities or expose ids/claims. |
| `customer-unavailable` | Account resolution or the private portal service failed. | Honest retry and sign-out actions. Do not fall back to fixture data. |
| `customer-not-linked` | The signed-in identity is not linked to an active customer Account. | Explain that the account cannot be opened; provide support/sign-out navigation only. |
| `customer-forbidden` | The identity is authenticated but lacks customer-portal access. | Non-enumerating access-denied treatment; provide support/sign-out navigation only. |
| `session-expired` | A private request lost its valid session. | Preserve the intended route and offer secure sign-in again. Do not show stale private data as current. |

The treatment must compose with the existing `app-shell`, `top-nav`,
`page-header`, `loading-state`, `empty-state`, `error-state`, and action-button
language. Do not add a separate visual system.

## Route State Coverage

Keep every currently accepted state and add only the missing lifecycle states
below.

| Route | Dynamic entities | Missing presentation states to add |
| --- | --- | --- |
| `calendar` | Customer appointments, service windows, availability summaries | `loading`, `error`, `unauthorized` |
| `services` | Eligible/bookable services | `empty`, `error`, `unauthorized` |
| `pricing` | Live Core PIM price rows | `loading`, `empty`, `error` |
| `products` | Live catalog products | `error` |
| `checkout` | Server-priced cart, address reference, payment-method reference, order result | `loading`, `error`, `unauthorized`; failed and stale submission; no local success |
| `proposals.list` | Customer proposals/contracts | `loading`, `error`, `unauthorized` |
| `proposal.detail` | Versioned proposal, choices and decision | `loading`, `error`, `unauthorized`, `not-found`, `version-conflict`, command failure |
| `profile` | Customer-safe contact fields, addresses, preferences, PSP references | `loading`, `error`, `unauthorized`, field validation, saving, save failure |
| `activity` | Customer event feed and unread state | `loading`, `error`, `unauthorized` |
| `support` | Help content plus customer-scoped threads/messages | `loading`, `empty`, `error`, `unauthorized`, sending, send failure |

`orders.list`, `order.detail`, and `care` already have accepted generic
loading/error/access treatments. Confirm they remain visually valid when the
failure is customer-scope or entity-authorization related, and add only a
design-owned variant if the existing state cannot communicate that truth.

## Command States And Readback

For every mutable action shown on the routes above, provide reusable states:

| State | Required presentation truth |
| --- | --- |
| `pending` | The exact entity/action is visibly pending; duplicate submission is disabled. |
| `failed` | The action did not complete; existing authoritative entity data remains visible where safe and retry is explicit. |
| `conflict` | The entity changed since it was loaded; prompt a refresh/review instead of claiming success. |
| `succeeded` | May appear only after the backend returns the authoritative current entity/readback. |
| `session-lost` | Clear pending state, suppress success, preserve intended route, and require secure sign-in. |

Cover at least these commands: booking/reschedule/cancel, proposal
approve/revision/decline, cart mutation and checkout, profile update, support
message send/read acknowledgement, and Care operations that are later opened.
The visual contract must support entity-scoped pending state so one row/card
does not disable unrelated entities.

## Stable Transfer Hooks

Please keep the existing route, module, action, entity id, and `data-visual-id`
contracts. Add stable hooks for:

- shell/account states through `data-state` on one account-bootstrap module;
- route lifecycle through `data-state` on the existing route root;
- command lifecycle through `data-state` on the exact actionable entity;
- retry through the existing `ui.retry` action with a module/entity id;
- no-customer, forbidden, expired-session, conflict, and not-found states;
- customer-safe data bindings without exposing Account ids, tenant ids, access
  tokens, raw roles, permission claims, or internal entity mappings.

## Data, Authorization, And Privacy Constraints

- The portal reads the authenticated User id from Core `user/basic-info`,
  verifies the configured organization against the User's authorized
  organizations, and resolves exactly one Account through `Account.user` plus
  the accepted customer Account type. The browser never accepts an Account id
  from CMS, URL state, or form input as the current-customer decision.
- Foreign or missing private entities use a non-enumerating `not-found`
  treatment; the UI must not reveal whether another customer owns an id.
- CMS cannot author customer values, entitlements, authorization results,
  prices, order/proposal state, addresses, payment details, or support threads.
- Payment UI displays only approved PSP references. It never displays or
  accepts raw card data unless a separate PSP-owned secure component is added.
- Health documents, provider contact, and clinical/sensitive facts stay
  unavailable until RBAC, consent, audit, secure viewer/download, and
  least-data requirements are accepted and implemented.
- Loading, empty, error, unauthorized, unavailable, and stale are distinct
  product states. None may render fixture success as a fallback.

## Responsive Acceptance

Provide executable states and evidence at `1440`, `1180`, `768`, and `390`
widths in Beauty light and dark modes. At minimum, cover:

1. account resolution loading, not linked, forbidden, and service failure;
2. one list route in loading/empty/error/unauthorized;
3. one entity detail route in loading/not-found/conflict/error;
4. one entity-scoped command in pending/failed/succeeded/session-lost;
5. profile saving/validation failure;
6. support message sending/failure;
7. checkout pending/failure without a false order-success state.

## Requested Handoff

Return reusable source components/states, route integrations, styles,
manifest/scenario updates, stable hooks, and viewport evidence. The user will
review and import the accepted executable result into `design-inbox/`.
Production code will then transfer it 1:1 and connect only server-proven
adapters and commands.
