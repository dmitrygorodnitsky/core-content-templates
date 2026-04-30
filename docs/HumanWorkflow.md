# Human Resource Workflow Blueprint

## Workflow code

`HUMAN_LIFECYCLE`

## Applies to

* ResourceType: `Human`
* Subtypes: `Driver`, `Shoveler`, `Supervisor`, etc.

---

## Design fixes vs original diagram (important)

### Problems in the original:

1. **Vacation / Sick Leave modeled as peers of Active**
   → These are *temporary availability states*, not lifecycle endpoints.

2. **Termination reachable from many places without review**
   → Termination should go through a controlled review step.

3. **Inactive used ambiguously**
   → Sometimes means “not working today”, sometimes “employment paused”.

4. **Suspended / Under Review logic unclear**
   → Needs explicit investigation → decision flow.

---

## Corrected model principles

* Lifecycle states are **linear and irreversible** where appropriate.
* Temporary availability states are **substates branching from Active**.
* Termination is **final** (except legal reinstatement, which is rare and explicit).
* Inactive ≠ Vacation ≠ Sick Leave.

---

## States

### A) Creation & onboarding

* `INITIAL`
  Human record created.

* `INCOMPLETE`
  Missing required data (documents, contracts, licenses).

* `ONBOARDING`
  Actively onboarding (training, paperwork, equipment issue).

* `ACTIVE`
  Fully employed and eligible for assignment (subject to availability).

---

### B) Availability / temporary absence (from ACTIVE only)

These are **exclusive alternatives to ACTIVE**, but reversible.

* `VACATION`
  Planned time off.

* `SICK_LEAVE`
  Temporary medical absence.

* `INACTIVE`
  Temporarily not working (seasonal pause, unpaid leave, admin decision).

---

### C) Compliance & disciplinary

* `SUSPENDED`
  Temporarily removed from duties pending review.

* `UNDER_REVIEW`
  Investigation / compliance / HR review in progress.

---

### D) Exit

* `TERMINATED`
  Employment ended. Final state.

---

## Transitions & Events

### 1) Creation & onboarding

1. `INITIAL → INCOMPLETE`
   **Event:** `CREATE`

2. `INCOMPLETE → ONBOARDING`
   **Event:** `SUBMIT_REQUIRED_INFO`

3. `ONBOARDING → ACTIVE`
   **Event:** `COMPLETE_ONBOARDING`
   **Guard:** all mandatory checks passed

---

### 2) Availability changes (temporary, reversible)

From `ACTIVE` only:

4. `ACTIVE → VACATION`
   **Event:** `START_VACATION`

5. `VACATION → ACTIVE`
   **Event:** `END_VACATION`

6. `ACTIVE → SICK_LEAVE`
   **Event:** `START_SICK_LEAVE`

7. `SICK_LEAVE → ACTIVE`
   **Event:** `END_SICK_LEAVE`

8. `ACTIVE → INACTIVE`
   **Event:** `DEACTIVATE_TEMPORARY`

9. `INACTIVE → ACTIVE`
   **Event:** `REACTIVATE`

> Guard: return to ACTIVE requires valid employment + not suspended.

---

### 3) Compliance / disciplinary flow

10. `ACTIVE → SUSPENDED`
    **Event:** `SUSPEND`

11. `SUSPENDED → UNDER_REVIEW`
    **Event:** `START_REVIEW`

12. `UNDER_REVIEW → ACTIVE`
    **Event:** `CLEAR_REVIEW`

13. `UNDER_REVIEW → TERMINATED`
    **Event:** `TERMINATE`

14. `SUSPENDED → ACTIVE` *(optional shortcut)*
    **Event:** `REINSTATE`
    *(Use only if no review needed.)*

---

### 4) Termination

15. `ACTIVE → TERMINATED` *(rare, admin-only)*
    **Event:** `TERMINATE_IMMEDIATE`

> After `TERMINATED`, **no transitions allowed** (unless your legal model explicitly supports reinstatement).

---

## Key behavioral rules (non-negotiable)

### Dispatch eligibility

A Human can be assigned to Tasks/Appointments **only if**:

* state == `ACTIVE`

Not eligible when:

* `VACATION`
* `SICK_LEAVE`
* `INACTIVE`
* `SUSPENDED`
* `UNDER_REVIEW`
* `TERMINATED`

---

### Automation hooks (actions, not states)

* On `ONBOARDING`: generate training tasks, equipment assignment.
* On `START_VACATION`: auto-unassign future work.
* On `SUSPEND`: immediate removal from dispatch pool.
* On `TERMINATED`: revoke access, archive credentials, return equipment.

---

## Why this workflow is correct

✔ Clean separation between **employment lifecycle** and **availability**
✔ No illegal transitions (e.g., Sick → Terminated directly)
✔ Matches HR, legal, and ops reality
✔ Works perfectly with Task/Appointment workflows
✔ Easy to extend (e.g., add `PROBATION` later)

---

## Optional future extensions (not in v1)

* `PROBATION`
* `TRAINING_REQUIRED`
* `LICENSE_EXPIRED`
* `REINSTATED` (legal edge case)

