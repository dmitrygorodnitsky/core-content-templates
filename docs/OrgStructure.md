# ServiceWand – Organization & Account Blueprint

**(Winter Services – v1)**

## 1. Purpose of this document

This document defines the **canonical organization and account structure** for ServiceWand, explaining:

* tenant isolation
* cross-office operations
* SaaS billing
* how organizations and accounts interact

It is intended to be used as:

* a design reference
* an implementation guide
* a shared mental model for developers and product owners

---

## 2. Core principles

### 2.1 Separation of concerns

* **Organization**
  → security boundary, hierarchy, ownership of configuration and resources

* **Account**
  → business/operational party used for **billing, service delivery, and reporting**

### 2.2 SaaS vs Tenant isolation

* ServiceWand is a **SYSTEM organization**
* Winter service providers are **independent tenant organizations**
* Tenants are *not* children of ServiceWand

### 2.3 Cross-office management

* Client Accounts are **owned by the tenant root (Corp)**
* Offices are **assignments**, not ownership boundaries
* Reassigning work between offices does **not** move data

---

## 3. Organization tree (security & ownership)

### 3.1 Top-level SYSTEM organization

```
ServiceWand (SYSTEM Organization)
```

Characteristics:

* Has **no parent**
* Users can see **all entities across all tenants**
* Owns:

  * SaaS configuration
  * SaaS billing accounts
  * platform-level dictionaries, workflows, types

---

### 3.2 Provider tenant organization tree

Each winter service provider is its **own tenant**, represented by a root organization:

```
ServiceProviderCorp (e.g. "Corp 1")
├── ServiceProviderOffice (Toronto Office 1)
├── ServiceProviderOffice (Vancouver Office 1)
└── ...
```

#### ServiceProviderCorp

Purpose:

* Tenant root
* Owns:

  * client accounts
  * contracts
  * billing configuration
  * shared configuration (types, workflows, rules)

Visibility:

* Corp users see **everything inside the tenant**
* Corp defines defaults for offices

#### ServiceProviderOffice

Purpose:

* Operational execution unit
* Owns:

  * vehicles
  * crews
  * local operational resources

Visibility:

* Office users see:

  * resources owned by their office
  * tasks/sites/accounts **assigned to their office**
* They do **not** see sibling offices’ operational data

---

## 4. Account tree (business & billing entities)

### 4.1 SaaS billing accounts (inside ServiceWand)

```
ServiceWand (SYSTEM)
└── TenantSubscriptionAccount
    ├── tenantOrganization = Corp 1
    ├── subscriptionPlan
    ├── subscriptionStatus
    └── billingCycle
```

Purpose:

* Bills tenant organizations for **ServiceWand usage**
* References tenant organizations directly
* Requires ServiceWand to be SYSTEM for visibility

---

### 4.2 Tenant operating accounts (inside ServiceProviderCorp)

```
ServiceProviderCorp (Corp 1)
├── ProviderOperatingAccount
├── ClientAccount (Strata 1)
├── ClientAccount (Commercial Client A)
└── ClientAccount (Municipality X)
```

#### ProviderOperatingAccount

Purpose:

* Represents the provider itself as a billing/operational party
* Used for:

  * internal accounting
  * revenue attribution
  * contracts where provider is counterparty

Minimal attributes:

* none (uses defaults + conventions)

---

#### ClientAccount (base type)

Purpose:

* Represents a **customer of the provider**
* Central anchor for:

  * billing
  * sites
  * service calls
  * invoices
  * reporting

Ownership:

* **Owned by ServiceProviderCorp**
* Never owned by offices

Key attributes:

* `servicingOrganization` (Organization reference)
  → which office executes work
* `billingOrganization` (optional Organization reference)
  → who issues invoices (corp or office)
* `invoiceDeliveryMethod` (EMAIL / PORTAL / INTEGRATION)

Specializations (no extra attributes yet):

* Strata / HOA
* Property Management
* Commercial Client
* Residential Client
* Municipality

---

## 5. Resource ownership rules (important)

### 5.1 Provider-owned operational resources

Owned by **ServiceProviderOffice** organizations:

* Trucks
* ATVs
* Crews / employees
* Provider-owned equipment

```
Truck 1.ownerOrgId = Toronto Office 1
ATV 123.ownerOrgId = Toronto Office 1
```

Reason:

* Availability
* dispatch
* maintenance
* security isolation between offices

---

### 5.2 Client-owned or site-specific assets

Owned by **ClientAccount**:

* Sites / Properties
* Access artifacts (keys, fobs, codes)
* Client-owned on-site equipment

```
Site X.accountId = Strata 1
KeyFob A.accountId = Strata 1
```

---

## 6. How work flows (high-level)

1. **ClientAccount** is created under Corp
   → `servicingOrganization = Toronto Office 1`

2. **Sites** are created and linked to ClientAccount

3. **Tasks / Appointments** are created:

   * reference ClientAccount
   * inherit `servicingOrganization`
   * assign office-owned resources

4. **Invoices** are issued:

   * billed to ClientAccount
   * issued by billingOrganization (Corp or Office)

5. **Cross-office change**

   * Change `servicingOrganization` on ClientAccount or Site
   * No data migration required

---

## 7. Why this blueprint works

* ✔ Strict tenant isolation
* ✔ SYSTEM-level SaaS billing without hacks
* ✔ Easy cross-office reassignment
* ✔ Clean separation of security vs business logic
* ✔ Scales to other verticals beyond Winter Services

---

## 8. Status

This blueprint is **authoritative** for:

* Organization hierarchy
* Account hierarchy
* Ownership rules
* SaaS vs tenant separation

All future modeling (Resources, Tasks, Products, Billing) should align with this structure.

