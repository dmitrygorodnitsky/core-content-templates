# Customer Experience Anonymous Intent → Auth → Resume

## Why This Is Needed

The generic customer-experience family can preserve a short-lived anonymous
selection before Core Auth, but accepted presentation does not define how the
landing/portal signals saved selection, auth handoff, Account bootstrap,
server reconciliation, retry, expiry, or changed commercial truth.

This request applies to the family across verticals. Calm Harbor must not
activate `selection-only` by inventing these states in runtime markup.

## Routes and Required States

| Surface / route | State | User-facing meaning | Required actions |
| --- | --- | --- | --- |
| landing offer/service CTA | `selection-ready` | A public offer/service can be selected before sign-in. | Select and continue to portal auth. |
| `auth.oidc` | `intent-preserved` | The selection is safely preserved while sign-in begins. | Sign in; register only when the registration contract is open. |
| route root | `checking-account` | Authentication succeeded; customer Account linkage is being resolved. | None; prevent duplicate continuation. |
| intended portal route | `resume-pending` | Current price/availability/cart or service state is being checked on the server. | Disable the initiating action. |
| intended portal route | `resume-ready` | The authoritative server accepted the selection. | Continue to cart, service selection, or booking. |
| intended portal route | `resume-failed` | Server reconciliation failed without losing the selection. | Retry once the prior call settles; dismiss/back. |
| intended portal route | `intent-expired` | The short-lived selection expired. | Return to current catalog/services. |
| intended portal route | `selection-changed` | Price, stock, eligibility, or availability differs from the anonymous view. | Review current server truth; explicitly accept a new selection. |

Also show existing fail-closed zero/multiple Account states after registration;
do not describe authentication success as customer onboarding success.

## Dynamic Data Shape

Presentation may receive only:

- intent kind and public offer/service display data re-read from the server;
- item count;
- pending/ready/failed/expired/changed state;
- safe return action and retry availability;
- current authoritative price/availability when the server provides it.

Do not display browser-cached price, slot, total, customer identity, or success
claims as server truth.

## Responsive and Reuse Requirements

Provide desktop, tablet, and mobile states in light and dark modes. Reuse the
accepted auth composition, global async-action treatment, catalog/service
cards, cart feedback, and route-level failure patterns. Specify focus return,
screen-reader announcements, disabled/loading behavior, and reduced-motion
behavior.

The visual answer must work for retail and service verticals without tenant-
specific layout or copy baked into the generic component.

## Security and Behavior Constraints

- No arbitrary return URL or cross-origin destination.
- Resume remains disabled until authentication and exactly one customer
  Account are ready.
- Duplicate clicks do not create duplicate server mutations.
- Failure preserves the selection for retry; expiry and malformed state fail
  closed.
- Registration CTA is absent while `PORTAL_REGISTRATION_MODE=closed`.
