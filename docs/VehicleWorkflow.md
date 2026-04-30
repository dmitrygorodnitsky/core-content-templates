# Vehicle Workflow Blueprint

## Workflow code

`VEHICLE_LIFECYCLE`

## Applies to

* ResourceType: `Vehicle` (and descendants: Truck, Pickup, ATV, SkidSteer)

## Intent

Track:

* readiness to be dispatched
* inspection scheduling/outcomes
* maintenance lifecycle
* breakdown/out-of-service handling
* retirement (archived/deleted)

---

## States

### Setup / activation

* `INITIAL`
  Vehicle record created but not yet ready/verified.

* `UNDER_SETUP`
  Entering required data, attaching documents, verifying identifiers.

* `ACTIVE`
  Vehicle is operational and allowed to be dispatched (subject to other constraints).

* `INACTIVE`
  Temporarily inactive by admin decision (seasonal hold, not used).

### Inspection

* `INSPECTION_SCHEDULED`
  Inspection is planned.

* `INSPECTION_FAILED`
  Inspection did not pass and requires remediation.

### Maintenance

* `REQUIRES_MAINTENANCE`
  Maintenance is required (can be set from inspection failed or detected issue).

* `UNDER_MAINTENANCE`
  Vehicle is currently in maintenance process.

### Failure / downtime

* `BROKEN`
  Vehicle has an unexpected failure. (May or may not be immediately out of service.)

* `OUT_OF_SERVICE`
  Vehicle must not be dispatched until recovered.

### Retirement

* `ARCHIVED`
  Vehicle is retired/kept for history; not used operationally.

* `DELETED`
  Logical delete (audit-safe).

---

## Transitions & Events

### A) Creation and setup

1. `INITIAL → UNDER_SETUP`
   **Event:** `START_SETUP`

2. `UNDER_SETUP → ACTIVE`
   **Event:** `ACTIVATE`
   **Guard:** required identifiers present (e.g., licensePlate) and ownerOrganization set.

3. `ACTIVE → INACTIVE`
   **Event:** `DEACTIVATE`

4. `INACTIVE → ACTIVE`
   **Event:** `REACTIVATE`

---

### B) Inspection path

5. `ACTIVE → INSPECTION_SCHEDULED`
   **Event:** `SCHEDULE_INSPECTION`

6. `INSPECTION_SCHEDULED → ACTIVE`
   **Event:** `INSPECTION_PASSED`

7. `INSPECTION_SCHEDULED → INSPECTION_FAILED`
   **Event:** `INSPECTION_FAILED`

8. `INSPECTION_FAILED → REQUIRES_MAINTENANCE`
   **Event:** `REQUIRE_MAINTENANCE`

*(Optional shortcut if you want fewer clicks: `INSPECTION_FAILED → UNDER_MAINTENANCE` on `START_MAINTENANCE`.)*

---

### C) Maintenance path

9. `REQUIRES_MAINTENANCE → UNDER_MAINTENANCE`
   **Event:** `START_MAINTENANCE`

10. `UNDER_MAINTENANCE → ACTIVE`
    **Event:** `COMPLETE_MAINTENANCE`

11. `UNDER_MAINTENANCE → INSPECTION_SCHEDULED` *(optional)*
    **Event:** `SCHEDULE_POST_MAINT_INSPECTION`

---

### D) Breakdown / out of service

12. `ACTIVE → BROKEN`
    **Event:** `REPORT_BREAKDOWN`

13. `BROKEN → OUT_OF_SERVICE`
    **Event:** `TAKE_OUT_OF_SERVICE`

14. `BROKEN → UNDER_MAINTENANCE`
    **Event:** `START_MAINTENANCE`

15. `OUT_OF_SERVICE → UNDER_MAINTENANCE`
    **Event:** `START_MAINTENANCE`

16. `OUT_OF_SERVICE → ACTIVE`
    **Event:** `RETURN_TO_SERVICE`
    **Guard:** no open maintenance required / passed checks (policy-driven)

---

### E) Retirement

17. `ACTIVE → ARCHIVED`
    **Event:** `ARCHIVE`

18. `INACTIVE → ARCHIVED`
    **Event:** `ARCHIVE`

19. `ARCHIVED → DELETED`
    **Event:** `DELETE`

*(Optionally allow `ARCHIVED → ACTIVE` via `RESTORE` if you need “unretire”.)*

---

## Automation hooks (actions, not states)

* On `ACTIVATE`: validate required identifiers, ensure uniqueness (license plate), attach default inspection schedule if policy requires.
* On `SCHEDULE_INSPECTION`: create inspection task/checklist (if your platform supports generating child objects).
* On `INSPECTION_FAILED`: automatically set `REQUIRES_MAINTENANCE`.
* On `REPORT_BREAKDOWN`: notify office ops + optionally force `OUT_OF_SERVICE` by policy.
* On `RETURN_TO_SERVICE`: optional “post-maintenance inspection required” guard.
