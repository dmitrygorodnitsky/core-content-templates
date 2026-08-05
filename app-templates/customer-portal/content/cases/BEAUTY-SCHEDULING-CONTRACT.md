# Beauty Scheduling Contract

## Status

This is the proposed contract for the authenticated customer portal. It is not
implemented, and no endpoint below may be simulated as a successful booking.
Until a real adapter is opened, `services`, booking, calendar, and appointment
mutations stay `not_opened` or unavailable.

Public SEO remains separate. Its CTA may lead to a verified external booking
system only after the concept case is replaced with a real customer. It must
not call this private contract from a public page.

## Scope And Authority

| Fact | Source of truth | Portal may do |
| --- | --- | --- |
| Service editorial name, category, description | Service catalog | Read and render after catalog validation |
| Service enabled state, duration, practitioner and room eligibility | Scheduling backend | Read only from backend response |
| Available slot and current booking total | Scheduling backend | Render only from a current availability response |
| Hold, appointment creation, reschedule, cancel | Scheduling backend | Mutate with idempotency and readback |
| Customer routine, formula and sensitive preference notes | Customer/Beauty Care backend | Render only the minimum authorized data; do not put in public catalog payloads |
| Product price and stock | Dedicated PIM/commerce | Never return through scheduling |

The `proposedOfferingKey` in `*.catalog-concept.json` is a mapping candidate,
not proof that an offering exists. The scheduling backend must echo a resolved
`offeringId` before a UI marks the service bookable.

## Required Endpoints

All endpoints are customer- and tenant-scoped by the authenticated server
session. The browser must not provide a customer id, tenant id, price, total,
or appointment status as authority.

### 1. Resolve offerings

`GET /customer-portal/v1/scheduling/offerings?vertical=beauty&brandKey={brandKey}`

Response:

```json
{
  "source": "scheduling",
  "asOf": "2026-07-15T10:15:00Z",
  "offerings": [
    {
      "offeringId": "backend-owned-id",
      "catalogServiceId": "chs-grounding-massage",
      "state": "enabled",
      "bookingMode": "appointment",
      "pricePolicy": "booking-total",
      "allowedActions": ["booking.availability.read"]
    }
  ]
}
```

The backend may return `disabled` or omit an offering. A catalog entry with no
matching enabled offering renders unavailable; it does not inherit a fixture
or a CMS action.

### 2. Read availability and server-calculated total

`POST /customer-portal/v1/scheduling/availability/query`

Request:

```json
{
  "offeringId": "backend-owned-id",
  "timezone": "America/Chicago",
  "from": "2026-08-01T00:00:00-05:00",
  "to": "2026-08-08T00:00:00-05:00"
}
```

Response:

```js
{
  "offeringId": "backend-owned-id",
  "slots": [
    {
      "slotId": "backend-owned-id",
      "startsAt": "2026-08-02T10:00:00-05:00",
      "endsAt": "2026-08-02T11:15:00-05:00",
      "bookingTotal": "server-calculated Money",
      "quoteRequired": false
    }
  ]
}
```

The actual response is the only source of duration, total, currency, and slot.
`quoteRequired: true` means no final total is shown and the next operation is a
quote-request flow defined by the backend.

### 3. Create an expiring hold

`POST /customer-portal/v1/scheduling/holds`

Required headers:

```text
Idempotency-Key: UUID generated for the user intent
If-Match: availability response version
```

Request:

```json
{ "slotId": "backend-owned-id", "offeringId": "backend-owned-id" }
```

Response:

```js
{
  "holdId": "backend-owned-id",
  "expiresAt": "2026-08-02T09:55:00-05:00",
  "appointmentDraft": {
    "offeringId": "backend-owned-id",
    "startsAt": "2026-08-02T10:00:00-05:00",
    "bookingTotal": "server-calculated Money"
  }
}
```

The hold response is the first moment at which a selected slot can be called
reserved. Expired, mismatched, or no-longer-available holds must return an
explicit conflict state and require a fresh availability query.

### 4. Confirm appointment

`POST /customer-portal/v1/scheduling/appointments`

Required headers:

```text
Idempotency-Key: UUID generated for the user intent
```

Request:

```json
{ "holdId": "backend-owned-id", "customerNote": "optional, validated free text" }
```

Response:

```js
{
  "appointment": {
    "id": "backend-owned-id",
    "status": "scheduled",
    "offeringId": "backend-owned-id",
    "startsAt": "2026-08-02T10:00:00-05:00",
    "endsAt": "2026-08-02T11:15:00-05:00",
    "bookingTotal": "server-calculated Money",
    "allowedActions": ["appointment.reschedule", "appointment.cancel"]
  }
}
```

The client treats confirmation as incomplete until it has this returned
appointment. It must refresh calendar and orders/activity from returned or
subsequently read server state; no toast, local cart, or generated order id is
success.

### 5. Read and mutate existing appointment

```text
GET    /customer-portal/v1/scheduling/appointments
GET    /customer-portal/v1/scheduling/appointments/{appointmentId}
POST   /customer-portal/v1/scheduling/appointments/{appointmentId}/reschedule-holds
POST   /customer-portal/v1/scheduling/appointments/{appointmentId}/cancel
```

Reschedule repeats availability and hold creation for the new slot. Cancel and
reschedule require an appointment version or ETag to prevent overwriting a
change made elsewhere.

## UI State Rules

| Backend state | `/services` and booking behavior |
| --- | --- |
| Contract not opened | Catalog may not render as live private services; direct route is `not_opened`. |
| Offerings loading | Stable loading state; no selectable slots or price. |
| Catalog service absent/disabled | Visible only when product policy allows it, with disabled action and an explanatory state. |
| Availability empty | Honest no-slots state; no fallback slot. |
| Availability error or stale version | Error state with a retry that refetches availability; no old slot can be confirmed. |
| Hold conflict or expiry | Return to availability selection and explain that the slot is no longer held. |
| Appointment confirmed | Render returned appointment and refresh dependent routes. |

## Acceptance Evidence Before Activation

1. Real authorized response proves customer and tenant scope cannot be changed
   by browser input.
2. Every concept catalog MVP service is mapped to an allowed `offeringId`, or
   explicitly unavailable.
3. Price, duration, and availability shown in the UI come from the immediate
   backend response and carry no CMS/fixture fallback.
4. Hold and confirm operations are idempotent, conflict-aware, and have
   returned appointment readback.
5. Cancel/reschedule obey appointment versioning and refresh calendar, orders,
   activity, and Beauty Care only after server confirmation.
6. Beauty-specific preference or routine data is minimized, authorized, and
   never placed in public SEO, public catalog, or analytics payloads.
