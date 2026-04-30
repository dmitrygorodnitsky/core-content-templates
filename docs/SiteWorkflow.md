# Site Workflow Blueprint (ResourceType = Site)

## Workflow code

`SITE_LIFECYCLE`

## Applies to

* ResourceType: `Site` (and descendants: `PropertySite`, later `SiteZone`)

## Intent

Track the site as an operational service location:

* readiness for service
* inspection/verification cycle (initial + seasonal)
* inactive/off-season
* retirement (archived/deleted)

---

## States

### Setup & readiness

* `INITIAL`
  Site record created, not yet prepared for operations.

* `UNDER_SETUP`
  Data collection: address/geo, access notes, service scopes, hazards, photos, etc.

* `READY_UNVERIFIED`
  Site is configured enough to be serviced, but inspection/verification is pending.

### Inspection cycle

* `INSPECTION_SCHEDULED`
  A site inspection is planned (pre-season or change-triggered).

* `INSPECTED_VERIFIED`
  Inspection done and accepted; site is verified.

* `INSPECTION_FAILED`
  Inspection done but not accepted; issues must be resolved.

### Operational service availability

* `ACTIVE`
  Site is in service (eligible for task generation/dispatch).

* `INACTIVE`
  Temporarily not in service (off-season, client pause, no contract).

### Retirement

* `ARCHIVED`
  Kept for history; should not generate new operational work.

* `DELETED`
  Logical deletion.

---

## Transitions & events

### A) Creation and setup

1. `INITIAL → UNDER_SETUP`
   **Event:** `START_SETUP`

2. `UNDER_SETUP → READY_UNVERIFIED`
   **Event:** `MARK_READY`

> Guard (policy): required minimal fields exist (account, address/geo, servicing org resolution, etc.)

---

### B) Inspection scheduling and result

3. `READY_UNVERIFIED → INSPECTION_SCHEDULED`
   **Event:** `SCHEDULE_INSPECTION`

4. `ACTIVE → INSPECTION_SCHEDULED`
   **Event:** `SCHEDULE_SEASONAL_INSPECTION` *(recurring pre-season)*

5. `INACTIVE → INSPECTION_SCHEDULED`
   **Event:** `SCHEDULE_INSPECTION`

6. `INSPECTION_SCHEDULED → INSPECTED_VERIFIED`
   **Event:** `INSPECTION_PASSED`

7. `INSPECTION_SCHEDULED → INSPECTION_FAILED`
   **Event:** `INSPECTION_FAILED`

8. `INSPECTION_FAILED → READY_UNVERIFIED`
   **Event:** `FIX_REQUIRED_INFO` *(issues addressed, re-check needed)*

---

### C) Activation / deactivation

9. `INSPECTED_VERIFIED → ACTIVE`
   **Event:** `ACTIVATE_SITE`

10. `READY_UNVERIFIED → ACTIVE` *(optional shortcut if you allow “activate without inspection”)*
    **Event:** `ACTIVATE_SITE_OVERRIDE` *(CSR/manager only)*

11. `ACTIVE → INACTIVE`
    **Event:** `DEACTIVATE_SITE`

12. `INACTIVE → ACTIVE`
    **Event:** `REACTIVATE_SITE`
    **Guard:** either verified recently OR override permission

---

### D) Retirement

13. `ACTIVE → ARCHIVED`
    **Event:** `ARCHIVE`

14. `INACTIVE → ARCHIVED`
    **Event:** `ARCHIVE`

15. `ARCHIVED → DELETED`
    **Event:** `DELETE`

*(Optional: `ARCHIVED → INACTIVE` via `RESTORE` if you need unarchive.)*

---

## Automation hooks (actions, not states)

* On `MARK_READY`: validate minimal data completeness; compute servicing org if not overridden.
* On `SCHEDULE_SEASONAL_INSPECTION`: create an inspection Task/Appointment (separate entity) and set reminders.
* On `INSPECTION_PASSED`: optionally auto-activate if contract is active.
* On `ARCHIVE`: automatically close/cancel future scheduled work for this site (policy).

---

## Why this is “more correct” than the original picture

* Inspection is handled as a **repeatable cycle** (`INSPECTION_SCHEDULED` ↔ results), not a one-off “seasonal inspection” state.
* `READY_UNVERIFIED` replaces the confusing “Uninspected” + mixed transitions.
* You can do seasonal inspections without forcing the site into “Inactive”.
* Clean separation between “configured”, “verified”, and “operationally active”.

