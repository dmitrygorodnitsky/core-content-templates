Understood — **one Account entity = one workflow**, chosen by **AccountType** at creation. We’ll merge everything into a **single Account workflow** exactly like the picture: lead capture → confirmation → intro → quote → convert to active, plus suspension/inactive branches and re-engagement loop.

Below is a **blueprint workflow** (states + transitions + triggers). I’ll keep the state names close to the diagram.

---

# Workflow: Account Lifecycle (Lead → Active → Suspended/Inactive)

## Workflow code

`ACCOUNT_LIFECYCLE`

## Applies to

* `ClientAccount*`
* (optionally) `ProviderOperatingAccount` with a shortened path
* `TenantSubscriptionAccount` can use a simplified SaaS variant, but same pattern

---

## States

### Lead capture & contact validation

* `INITIAL`
* `UNCONFIRMED_CONTACT`
* `CONFIRMATION_REQUEST_SENT`
* `CONFIRMED_CONTACT`
* `BLACK_LISTED`

### Introduction / qualification

* `INTRODUCTION_SENT`
* `INTRODUCED`
* `QUOTE_REQUESTED`
* `NOT_INTERESTED`

### Re-engagement loop

* `REENGAGEMENT_SCHEDULED`
* `REACTIVATION_CHECK`

### Customer lifecycle

* `ACTIVE_ACCOUNT`
* `SUSPENDED_NO_PAY`
* `SUSPENDED_CUSTOMER_REQUEST`
* `SUSPENDED_NO_VALUE`
* `INACTIVE`
* `DELETED`

> Note: If your workflow engine supports **multiple active states simultaneously**, you can treat some of these as “flags” (e.g., `REENGAGEMENT_SCHEDULED` alongside `NOT_INTERESTED`). If it doesn’t, keep them mutually exclusive as written.

---

## Transitions (as on the picture)

### A) Lead → confirmed contact

1. `INITIAL` → `UNCONFIRMED_CONTACT`
   **Event:** `SET_LEAD`

2. `UNCONFIRMED_CONTACT` → `CONFIRMATION_REQUEST_SENT`
   **Event:** `REQUEST_CONFIRMATION`

3. `CONFIRMATION_REQUEST_SENT` → `CONFIRMED_CONTACT`
   **Event:** `CONFIRM_CONTACT`

4. `UNCONFIRMED_CONTACT` → `CONFIRMED_CONTACT`
   **Event:** `CSR_CONFIRMS_MANUALLY`

### B) Blacklist branch

5. `INITIAL` → `BLACK_LISTED`
   **Event:** `BLACKLIST` *(AI lead scoring / rules / manual)*

6. `BLACK_LISTED` → `UNCONFIRMED_CONTACT`
   **Event:** `UNBLACKLIST` *(CSR override)*

### C) Intro sequence

7. `CONFIRMED_CONTACT` → `INTRODUCTION_SENT`
   **Event:** `SEND_INTRODUCTION`

8. `INTRODUCTION_SENT` → `INTRODUCED`
   **Event:** `INTRO_EMAIL_CONFIRMED` *(open tracking / reply / NLP classifier)*

9. `INTRODUCTION_SENT` → `NOT_INTERESTED`
   **Event:** `DECLINE` *(NLP or explicit)*

10. `INTRODUCED` → `NOT_INTERESTED`
    **Event:** `DECLINE`

### D) Quote request

11. `INTRODUCED` → `QUOTE_REQUESTED`
    **Event:** `REQUEST_QUOTE`

*(Diagram shows “Prepare Quote …” as a process step; keep it as automation/action, not a state.)*

### E) Convert to active account

12. `QUOTE_REQUESTED` → `ACTIVE_ACCOUNT`
    **Event:** `CONVERT_TO_FULL_ACCOUNT` *(contract accepted / onboarding complete)*

### F) Suspensions and recovery (top-right of diagram)

13. `ACTIVE_ACCOUNT` → `SUSPENDED_CUSTOMER_REQUEST`
    **Event:** `SUSPEND_ON_CUSTOMER_REQUEST`

14. `ACTIVE_ACCOUNT` → `SUSPENDED_NO_PAY`
    **Event:** `NO_PAY`

15. `ACTIVE_ACCOUNT` → `SUSPENDED_NO_VALUE`
    **Event:** `SUSPEND_NO_VALUE`

16. `SUSPENDED_CUSTOMER_REQUEST` → `ACTIVE_ACCOUNT`
    **Event:** `RECOVER`

17. `SUSPENDED_NO_PAY` → `ACTIVE_ACCOUNT`
    **Event:** `RECOVER` *(payment resolved)*

18. `SUSPENDED_NO_VALUE` → `ACTIVE_ACCOUNT`
    **Event:** `RECOVER` *(CSR override / renewed plan)*

19. `ACTIVE_ACCOUNT` → `INACTIVE`
    **Event:** `DEACTIVATE`

20. `INACTIVE` → `DELETED`
    **Event:** `DELETE`

*(Diagram also shows recover paths into Active; you can optionally allow `INACTIVE → ACTIVE_ACCOUNT` on `RECOVER` if you want.)*

### G) Re-engagement loop (bottom-right of diagram)

21. `NOT_INTERESTED` → `REENGAGEMENT_SCHEDULED`
    **Event:** `RETRY_LATER` *(CSR enters a date)*

22. `REENGAGEMENT_SCHEDULED` → `REACTIVATION_CHECK`
    **Event:** `AUTOMATION_RUN` *(timer)*

23. `REACTIVATION_CHECK` → `INTRODUCTION_SENT`
    **Event:** `REENGAGE` *(automation decides to re-contact)*

24. `REACTIVATION_CHECK` → `NOT_INTERESTED`
    **Event:** `STILL_NOT_INTERESTED`

---

## Automation hooks (actions on transitions, not states)

* On `SET_LEAD`: run **AI Lead Scoring**
* On `SEND_INTRODUCTION`: send email + enable **open tracking**
* On `INTRO_EMAIL_CONFIRMED` / `DECLINE`: **NLP classifier** tags outcome
* On `REENGAGEMENT_SCHEDULED`: create timer / follow-up automation
* On `NO_PAY`: create billing task / notify CSR
* On `CONVERT_TO_FULL_ACCOUNT`: initialize contract/order scaffolding

