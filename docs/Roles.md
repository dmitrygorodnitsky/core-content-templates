Got it. Here’s a clean **blueprint** for **RoleGroup** + **org-aware roles/permissions**, fully consistent with your model (auto-generated `P_<ENTITY_KIND>_<SUFFIX>`, additive roles, and org visibility rules).

---

# RoleGroup + Org-Aware Roles/Permissions Blueprint

## 1) Core concepts

### 1.1 Permission (auto-generated)

* Code format: `P_<PERMISSION_KEY>_<SUFFIX>`
* Examples: `P_TASK_R`, `P_TASK_E`, `P_APPOINTMENT_W`, `P_RESOURCE_AUD`
  *(Where `PERMISSION_KEY` comes from the entity’s `permissionKey` in code; e.g. Workflow uses `P_WF_*`.)*
* Permissions are **additive** through roles.
* Permissions are **organization-aware**:

  * SYSTEM permissions are globally visible/usable
  * Tenant permissions are visible/usable only in that tenant org context

### 1.2 Role (assignable unit)

* A Role is a **named set of permissions**.
* Roles are **additive**; no role implies another role.
* A Role belongs to an **owning organization**:

  * `orgId = SYSTEM` → globally visible/usable
  * `orgId = <tenantOrg>` → visible/usable only inside that org tree/context

### 1.3 RoleGroup (assignment convenience)

* A RoleGroup is a **named set of Roles** (and/or other RoleGroups, if you want nesting).
* RoleGroups are **not authorization primitives** at runtime; they are an **assignment shortcut**.
* When assigned to a user, a RoleGroup is **expanded** into individual Roles and stored as direct user-role links.

---

## 2) Visibility and organization context rules (authoritative)

### 2.1 SYSTEM scope

Roles/permissions created under **SYSTEM org** are:

* visible to all organizations
* usable in any organization context (subject to data visibility rules)

### 2.2 Tenant scope

Roles/permissions created under **tenant organizations** are:

* visible only within that organization context
* assignable only by admins in that org context
* usable only when the user operates within that org context

### 2.3 Practical consequence

A user may have roles from:

* SYSTEM (global capabilities)
* Tenant org(s) (tenant-specific capabilities)
* Office org(s) (office-specific capabilities, if you use that)

But enforcement always evaluates:

1. user’s effective roles in the **current org context**
2. the permission codes inside those roles
3. the entity visibility rules (tenant isolation, office assignment, account ownership)

---

## 3) RoleGroup expansion semantics

### 3.1 Expansion rule

Assigning RoleGroup `G` to User `U` in OrgContext `O` results in:

* compute closure: all roles in `G` (and nested groups if supported)
* store direct links: `U → Role` for each resolved role
* optionally store `U → RoleGroup` for audit/history (not required for auth)

### 3.2 Deduplication

If RoleGroup contains role already assigned, skip duplicates.

### 3.3 Versioning behavior (recommended)

If you later edit a RoleGroup:

* previously assigned users **do not change automatically**
* you can offer an explicit “Reapply group” operation for admins
  This avoids surprise privilege changes.

---

## 4) Recommended entity model (minimal)

### 4.1 Role

* `id`
* `orgId` *(owner org; SYSTEM or tenant)*
* `code` *(e.g., `ROLE_TASK_RO`)*
* `permissionCodes[]` *(e.g., `P_TASK_R`)*

### 4.2 RoleGroup

* `id`
* `orgId` *(owner org; SYSTEM or tenant)*
* `code` *(e.g., `RG_CSR_ADMIN`)*
* `roleCodes[]` *(roles included)*
* *(optional)* `groupCodes[]` *(nested groups)*

### 4.3 UserRole assignment (result of expansion)

* `userId`
* `roleId`
* `orgContextId` *(optional if your auth uses “active org context”)*

---

## 5) RoleGroup examples for Winter Services

### 5.1 SYSTEM RoleGroups (global templates)

These are “recommended defaults” visible to all tenants.

#### `RG_CSR_ADMIN` (template)

Roles included (examples):

* `ROLE_ACCOUNT_RO` → `P_ACCOUNT_R`
* `ROLE_TASK_RO` → `P_TASK_R`
* `ROLE_TASK_RW` → `P_TASK_W`
* `ROLE_TASK_EXEC` → `P_TASK_E`
* `ROLE_APPOINTMENT_RO` → `P_APPOINTMENT_R`

*(Tenants can copy and customize into their org if needed.)*

---

### 5.2 Tenant RoleGroups (tenant-specific operational bundles)

#### `RG_DISPATCHER`

* `ROLE_RESOURCE_RO`
* `ROLE_TASK_RO`
* `ROLE_TASK_RW`
* `ROLE_TASK_EXEC` *(route run events)*
* `ROLE_APPOINTMENT_RO`
* `ROLE_APPOINTMENT_RW`
* `ROLE_APPOINTMENT_EXEC`

#### `RG_FIELD_OPERATOR`

* `ROLE_APPOINTMENT_RO`
* `ROLE_APPOINTMENT_EXEC`

#### `RG_BILLING`

* `ROLE_ACCOUNT_RO`
* `ROLE_BILLING_RO`
* `ROLE_BILLING_RW`
* *(optional)* `ROLE_ACCOUNT_RW` (if billing edits account billing fields)

#### `RG_TENANT_ADMIN`

* `ROLE_ORGANIZATION_RO`
* `ROLE_ORGANIZATION_RW`
* `ROLE_USER_RO`
* `ROLE_USER_RW`
* `ROLE_WORKFLOW_RO`
* `ROLE_WORKFLOW_RW`
* plus whatever operational access they need

---

## 6) Enforcement logic (simple and correct)

When checking an action:

1. Determine active org context (SYSTEM / tenant / office)
2. Collect user roles:

   * SYSTEM roles (always included)
   * roles belonging to the active org context (tenant/office)
3. Union permissions from roles
4. Check required permission code(s), e.g.:

   * read Task → `P_TASK_R`
   * update Appointment → `P_APPOINTMENT_W`
   * send Task workflow event → `P_TASK_E`
5. Apply visibility filters (tenant isolation, office assignment, account ownership)

---

## 7) Practical admin UI rules (recommended)

* Role picker shows:

  * SYSTEM roles (read-only templates)
  * local org roles (editable)
* RoleGroup picker shows:

  * SYSTEM role groups (templates)
  * local org role groups
* Assigning RoleGroup:

  * expands into roles immediately
  * shows preview: “This will assign X roles / Y permissions”

---

# ServiceWand Role Catalog (Winter Services)

## 0) Rules

* Roles are **additive**.
* RoleGroups are **assignment shortcuts**: assigning a RoleGroup expands into individual Roles.
* **Org-aware visibility**

  * Roles/RoleGroups owned by **SYSTEM** org are visible to everyone (template library).
  * Roles/RoleGroups owned by a **tenant organization** are usable only within that org context.

---

## 0.1 Permission key mapping (code-aligned)

The codebase does not always use `P_<ENTITY_KIND>_*` with the same **entity kind labels** used in this document. These are the key mappings observed in `@ControllerApiAware(permissionKey=...)` across `core*` modules:

Extraction notes:
* `@Secured` usage was extracted from controllers/services into [secured-methods.csv](secured-methods.csv) (2162 secured methods).
* Unique permissions referenced by `@Secured` were written to [unique-secured-permissions.txt](unique-secured-permissions.txt) (472 unique permissions).

| Conceptual entity kind | Permission key prefix in code |
|---|---|
| ORGANIZATION | `P_ORG` (plus `P_ORG_TYPE` for org types) |
| USER | `P_USR` (plus related `P_USER_METADATA`, `P_USER_ORG_PREFS*`) |
| ROLE / ROLE_GROUP | `P_ROLE`, `P_ROLE_GROUP` (plus `P_ROLE_ASSIGN`) |
| WORKFLOW | `P_WF` (plus `P_WF_EVENT`, `P_WF_STATE`, `P_WF_PROCESS`, `P_WF_MESSAGE`) |
| ACCOUNT | `P_ACCT` (not `P_ACCOUNT`) |
| TASK | `P_TASK` (plus `P_TASK_TYPE`) |
| APPOINTMENT | `P_APPOINTMENT` (plus `P_APPOINTMENT_TYPE`) |
| RESOURCE | `P_RESOURCE` (plus `P_RESOURCE_TYPE*`, `P_RESOURCE_DIAG`, `P_RESOURCE_BACKUP`) |
| BILLING (umbrella) | multiple: `P_INVOICE*`, `P_ORDER*`, `P_SHIP*`, `P_BALANCE_TXN*`, `P_EXCHANGE*` |

---

# 1) SYSTEM roles (global templates)

### ROLE_SYS_SUPER_ADMIN

**Scope:** SYSTEM
**Responsibilities:** full platform control (tenants, global config, support, billing coordination).
**Typically touches:** all entity kinds; all action types including `_AUD`.

**Permissions:** this is effectively “ALL permissions”. In implementation, treat as a superuser capability rather than enumerating individual `P_*` codes.

### ROLE_SYS_PLATFORM_ADMIN

**Scope:** SYSTEM
**Responsibilities:** platform configuration & operations (types, workflows, dictionaries, automation templates, diagnostics).
**Typically touches:** WORKFLOW, ROLE/USER, ENTITY TYPES; actions `_R/_W/_X/_AUD`.

**Permissions (minimum, code-aligned):**
* Admin/ops: `P_ADMIN`, `P_ADMIN_METRICS`, `P_ADMIN_RESTART`
* Org/User/Role admin: `P_ORG_R`, `P_ORG_W`, `P_ORG_D`, `P_ORG_AUD`, `P_ORG_TYPE_R`, `P_ORG_TYPE_W`, `P_ORG_TYPE_D`, `P_ORG_TYPE_AUD`, `P_USR_R`, `P_USR_W`, `P_USR_D`, `P_USR_AUD`, `P_ROLE_R`, `P_ROLE_W`, `P_ROLE_D`, `P_ROLE_GROUP_R`, `P_ROLE_GROUP_W`, `P_ROLE_GROUP_D`, `P_ROLE_ASSIGN`
* Workflow config: `P_WF_R`, `P_WF_W`, `P_WF_D`, `P_WF_AUD`, `P_WF_EVENT_R`, `P_WF_EVENT_W`, `P_WF_EVENT_D`, `P_WF_EVENT_AUD`, `P_WF_STATE_R`, `P_WF_STATE_W`, `P_WF_STATE_D`, `P_WF_STATE_AUD`, `P_WF_PROCESS_R`, `P_WF_PROCESS_W`, `P_WF_PROCESS_D`, `P_WF_MESSAGE_R`, `P_WF_MESSAGE_W`, `P_WF_MESSAGE_D`, `P_WF_MESSAGE_E`
* Common config entities (examples): `P_DICTIONARY_R`, `P_DICTIONARY_W`, `P_DICTIONARY_D`, `P_DICTIONARY_AUD`, `P_DICTIONARY_TYPE_R`, `P_DICTIONARY_TYPE_W`, `P_DICTIONARY_TYPE_D`, `P_DICTIONARY_TYPE_AUD`, `P_NLS_KEY_R`, `P_NLS_KEY_W`, `P_NLS_KEY_D`, `P_LANG_R`, `P_LANG_W`, `P_LANG_D`, `P_LANG_AUD`, `P_UNIT_R`, `P_UNIT_W`, `P_UNIT_D`, `P_UNIT_AUD`, `P_UNIT_CATEGORY_R`, `P_UNIT_CATEGORY_W`, `P_UNIT_CATEGORY_D`, `P_UNIT_CATEGORY_AUD`
* Automation/integrations: `P_SCRIPT_R`, `P_SCRIPT_W`, `P_SCRIPT_D`, `P_SCRIPT_AUD`, `P_SCRIPT_X`, `P_SCRIPT_TASK_R`, `P_SCRIPT_TASK_W`, `P_SCRIPT_TASK_D`, `P_SCRIPT_TASK_AUD`, `P_SCRIPT_TASK_X`, `P_API_KEY_R`, `P_API_KEY_W`, `P_API_KEY_D`, `P_OAUTH2_CLIENT_R`, `P_OAUTH2_CLIENT_W`, `P_OAUTH2_CLIENT_D`, `P_SECRET_R`, `P_SECRET_W`, `P_SECRET_D`

### ROLE_SYS_BILLING_ADMIN

**Scope:** SYSTEM
**Responsibilities:** SaaS subscription billing (tenant subscription accounts, plans, invoicing, suspension/reactivation).
**Typically touches:** ACCOUNT/BILLING; actions `_R/_W/_E/_AUD`.

**Permissions (minimum, code-aligned):**
* Account: `P_ACCT_R`, `P_ACCT_W`, `P_ACCT_E`, `P_ACCT_AUD`
* Billing umbrella:
  * Invoice: `P_INVOICE_R`, `P_INVOICE_W`, `P_INVOICE_E`, `P_INVOICE_D`, `P_INVOICE_AUD`, `P_INVOICE_TYPE_R`, `P_INVOICE_TYPE_W`, `P_INVOICE_TYPE_D`, `P_INVOICE_TYPE_AUD`
  * Orders: `P_ORDER_R`, `P_ORDER_W`, `P_ORDER_E`, `P_ORDER_D`, `P_ORDER_AUD`, `P_ORDER_TYPE_R`, `P_ORDER_TYPE_W`, `P_ORDER_TYPE_D`, `P_ORDER_TYPE_AUD`, `P_ORDER_ITEM_TYPE_R`, `P_ORDER_ITEM_TYPE_W`, `P_ORDER_ITEM_TYPE_D`, `P_ORDER_ITEM_TYPE_AUD`
  * Shipment: `P_SHIP_R`, `P_SHIP_W`, `P_SHIP_E`, `P_SHIP_D`, `P_SHIP_AUD`, `P_SHIP_TYPE_R`, `P_SHIP_TYPE_W`, `P_SHIP_TYPE_D`, `P_SHIP_TYPE_AUD`
  * Balance/Exchange: `P_BALANCE_TXN_R`, `P_BALANCE_TXN_W`, `P_BALANCE_TXN_D`, `P_BALANCE_TXN_AUD`, `P_EXCHANGE_R`, `P_EXCHANGE_W`, `P_EXCHANGE_D`, `P_EXCHANGE_AUD`

### ROLE_SYS_SUPPORT_AUDITOR

**Scope:** SYSTEM
**Responsibilities:** cross-tenant support read access and auditing (no business meddling unless explicitly allowed).
**Typically touches:** ORGANIZATION/ACCOUNT/RESOURCE/TASK/APPOINTMENT; actions `_R/_AUD`.

**Permissions (minimum, code-aligned):**
* Org: `P_ORG_R`, `P_ORG_AUD`
* Account: `P_ACCT_R`, `P_ACCT_AUD`
* Resource: `P_RESOURCE_R`, `P_RESOURCE_AUD`
* Task: `P_TASK_R`, `P_TASK_AUD`
* Appointment: `P_APPOINTMENT_R`, `P_APPOINTMENT_AUD`

### ROLE_SYS_SUPPORT_OPERATOR

**Scope:** SYSTEM
**Responsibilities:** run support procedures (retries, unblocks, operational fixes) within strict boundaries.
**Typically touches:** TASK/APPOINTMENT/WORKFLOW ops; actions `_X/_E` (and `_R` typically paired).

**Permissions (minimum, code-aligned):**
* Task ops: `P_TASK_R`, `P_TASK_E`
* Appointment ops: `P_APPOINTMENT_R`, `P_APPOINTMENT_E`
* Workflow ops (where applicable): `P_WF_R`, `P_WF_MESSAGE_E`

---

# 2) Tenant roles (service provider corp)

## 2.1 Tenant administration & configuration

### ROLE_TENANT_ADMIN

**Scope:** Tenant (Corp)
**Responsibilities:** tenant-wide admin (org tree, users/roles, policies).
**Typically touches:** ORGANIZATION, USER/ROLE, WORKFLOW (view), ACCOUNT; actions `_R/_W/_AUD` (and `_D` carefully).

**Permissions (minimum, code-aligned):**
* Org admin: `P_ORG_R`, `P_ORG_W`, `P_ORG_D`, `P_ORG_AUD`, `P_ORG_TYPE_R`, `P_ORG_TYPE_W`, `P_ORG_TYPE_D`, `P_ORG_TYPE_AUD`
* User admin: `P_USR_R`, `P_USR_W`, `P_USR_D`, `P_USR_AUD`
* Role admin: `P_ROLE_R`, `P_ROLE_W`, `P_ROLE_D`, `P_ROLE_GROUP_R`, `P_ROLE_GROUP_W`, `P_ROLE_GROUP_D`, `P_ROLE_ASSIGN`
* Workflow (view): `P_WF_R`, `P_WF_EVENT_R`, `P_WF_STATE_R`, `P_WF_PROCESS_R`, `P_WF_MESSAGE_R`
* Account (corp-level): `P_ACCT_R`, `P_ACCT_W`, `P_ACCT_AUD`

### ROLE_TENANT_TECH_ADMIN

**Scope:** Tenant (Corp)
**Responsibilities:** configuration and integrations (entity types/attributes, workflow configuration, automation scripts).
**Typically touches:** WORKFLOW, PRODUCT_TYPE (if used), ENTITY TYPE config; actions `_R/_W/_X/_AUD`.

**Permissions (minimum, code-aligned):**
* Workflow config: `P_WF_R`, `P_WF_W`, `P_WF_D`, `P_WF_AUD`, `P_WF_EVENT_R`, `P_WF_EVENT_W`, `P_WF_EVENT_D`, `P_WF_EVENT_AUD`, `P_WF_STATE_R`, `P_WF_STATE_W`, `P_WF_STATE_D`, `P_WF_STATE_AUD`, `P_WF_PROCESS_R`, `P_WF_PROCESS_W`, `P_WF_PROCESS_D`, `P_WF_MESSAGE_R`, `P_WF_MESSAGE_W`, `P_WF_MESSAGE_D`, `P_WF_MESSAGE_E`
* Automation: `P_SCRIPT_R`, `P_SCRIPT_W`, `P_SCRIPT_D`, `P_SCRIPT_AUD`, `P_SCRIPT_X`, `P_SCRIPT_TASK_R`, `P_SCRIPT_TASK_W`, `P_SCRIPT_TASK_D`, `P_SCRIPT_TASK_AUD`, `P_SCRIPT_TASK_X`
* Common config entities (examples): `P_DICTIONARY_R`, `P_DICTIONARY_W`, `P_DICTIONARY_D`, `P_DICTIONARY_AUD`, `P_DICTIONARY_TYPE_R`, `P_DICTIONARY_TYPE_W`, `P_DICTIONARY_TYPE_D`, `P_DICTIONARY_TYPE_AUD`, `P_NLS_KEY_R`, `P_NLS_KEY_W`, `P_NLS_KEY_D`, `P_LANG_R`, `P_LANG_W`, `P_LANG_D`, `P_LANG_AUD`
* Integrations/secrets: `P_API_KEY_R`, `P_API_KEY_W`, `P_API_KEY_D`, `P_OAUTH2_CLIENT_R`, `P_OAUTH2_CLIENT_W`, `P_OAUTH2_CLIENT_D`, `P_SECRET_R`, `P_SECRET_W`, `P_SECRET_D`

### ROLE_TENANT_SECURITY_AUDITOR

**Scope:** Tenant (Corp)
**Responsibilities:** audit logs, permission reviews, incident analysis.
**Typically touches:** AUDIT + read access across business entities; actions `_AUD/_R`.

**Permissions (minimum, code-aligned):**
* Audit/log access: `P_HTTP_REQ_LOG_R`, `P_NOTIFICATION_LOG_R`, `P_LOG_R`, `P_LOG_ENTITY_R`, `P_LOG_ENTRY_R`
* Business entity read/audit: `P_ORG_R`, `P_ORG_AUD`, `P_USR_R`, `P_USR_AUD`, `P_ACCT_R`, `P_ACCT_AUD`, `P_RESOURCE_R`, `P_RESOURCE_AUD`, `P_TASK_R`, `P_TASK_AUD`, `P_APPOINTMENT_R`, `P_APPOINTMENT_AUD`

---

## 2.2 Customer & billing operations (tenant)

### ROLE_TENANT_CSR

**Scope:** Tenant (Corp)
**Responsibilities:** customer support, create/triage case tasks, communicate, request redo.
**Typically touches:** ACCOUNT, TASK (case), APPOINTMENT (view); actions `_R/_W/_E` (and some `_AUD`).

**Permissions (minimum, code-aligned):**
* Account: `P_ACCT_R`, `P_ACCT_W`
* Case tasks: `P_TASK_R`, `P_TASK_W`, `P_TASK_E`
* Appointment (view): `P_APPOINTMENT_R`
* Optional audit: `P_TASK_AUD`, `P_ACCT_AUD`

### ROLE_TENANT_CSR_MANAGER

**Scope:** Tenant (Corp)
**Responsibilities:** approve/deny escalations, authorize redo/rework policies, SLA ownership.
**Typically touches:** TASK (case), ACCOUNT; actions `_E` (approvals), `_R/_AUD`.

**Permissions (minimum, code-aligned):**
* Case tasks: `P_TASK_R`, `P_TASK_E`, `P_TASK_AUD`
* Account: `P_ACCT_R`, `P_ACCT_AUD`

### ROLE_TENANT_BILLING_SPECIALIST

**Scope:** Tenant (Corp)
**Responsibilities:** invoicing/payments, account commercial status, non-pay handling.
**Typically touches:** ACCOUNT/BILLING; actions `_R/_W/_E/_AUD`.

**Permissions (minimum, code-aligned):**
* Account: `P_ACCT_R`, `P_ACCT_W`, `P_ACCT_E`, `P_ACCT_AUD`
* Billing umbrella (same as system billing scope): `P_INVOICE_R`, `P_INVOICE_W`, `P_INVOICE_E`, `P_INVOICE_D`, `P_INVOICE_AUD`, `P_ORDER_R`, `P_ORDER_W`, `P_ORDER_E`, `P_ORDER_D`, `P_ORDER_AUD`, `P_SHIP_R`, `P_SHIP_W`, `P_SHIP_E`, `P_SHIP_D`, `P_SHIP_AUD`, `P_BALANCE_TXN_R`, `P_BALANCE_TXN_W`, `P_BALANCE_TXN_D`, `P_BALANCE_TXN_AUD`, `P_EXCHANGE_R`, `P_EXCHANGE_W`, `P_EXCHANGE_D`, `P_EXCHANGE_AUD`

### ROLE_TENANT_OPERATIONS_DIRECTOR

**Scope:** Tenant (Corp)
**Responsibilities:** cross-office oversight, routing governance, rebalancing, escalation authority.
**Typically touches:** TASK (route + case), APPOINTMENT, RESOURCE; actions `_R/_W/_E/_AUD`.

**Permissions (minimum, code-aligned):**
* Tasks: `P_TASK_R`, `P_TASK_W`, `P_TASK_E`, `P_TASK_AUD`
* Appointments: `P_APPOINTMENT_R`, `P_APPOINTMENT_W`, `P_APPOINTMENT_E`, `P_APPOINTMENT_AUD`
* Resources: `P_RESOURCE_R`, `P_RESOURCE_W`, `P_RESOURCE_E`, `P_RESOURCE_AUD`

---

# 3) Office roles (ServiceProviderOffice)

### ROLE_OFFICE_MANAGER

**Scope:** Office
**Responsibilities:** manage office resources and local operations; approve readiness.
**Typically touches:** RESOURCE (vehicles/humans/equipment), TASK/APPOINTMENT (office scope); actions `_R/_W/_E/_AUD`.

**Permissions (minimum, code-aligned):**
* Resources: `P_RESOURCE_R`, `P_RESOURCE_W`, `P_RESOURCE_E`, `P_RESOURCE_AUD`
* Tasks: `P_TASK_R`, `P_TASK_W`, `P_TASK_E`, `P_TASK_AUD`
* Appointments: `P_APPOINTMENT_R`, `P_APPOINTMENT_W`, `P_APPOINTMENT_E`, `P_APPOINTMENT_AUD`

### ROLE_OFFICE_DISPATCHER

**Scope:** Office
**Responsibilities:** create and run RouteRunTasks; generate route-stop appointments; monitor live run.
**Typically touches:** TASK (route run), APPOINTMENT; actions `_R/_W/_E/_X` (e.g., route generation), plus `_AUD` optionally.

**Permissions (minimum, code-aligned):**
* Tasks: `P_TASK_R`, `P_TASK_W`, `P_TASK_E`
* Appointments: `P_APPOINTMENT_R`, `P_APPOINTMENT_W`, `P_APPOINTMENT_E`
* Optional audit: `P_TASK_AUD`, `P_APPOINTMENT_AUD`
* Optional automation (only if route generation is implemented via scripts): `P_SCRIPT_TASK_X` (and/or `P_SCRIPT_X`)

### ROLE_OFFICE_OPERATIONS_SUPERVISOR

**Scope:** Office
**Responsibilities:** quality control, handle MISSED/INCOMPLETE stops, start redo process (creates CaseTask).
**Typically touches:** APPOINTMENT (execution outcomes), TASK (case creation), RESOURCE (view); actions `_R/_W/_E`.

**Permissions (minimum, code-aligned):**
* Appointments: `P_APPOINTMENT_R`, `P_APPOINTMENT_W`, `P_APPOINTMENT_E`
* Tasks: `P_TASK_R`, `P_TASK_W`, `P_TASK_E`
* Resource (view): `P_RESOURCE_R`

### ROLE_FIELD_OPERATOR

**Scope:** Office (but visibility should be limited to assigned work)
**Responsibilities:** execute appointments: en-route/on-site/done/missed, upload notes/photos, scan equipment asset tags.
**Typically touches:** APPOINTMENT; actions `_E` (status events) and `_W` (notes/media refs).
*(Usually paired with minimal `_R` so the operator can see their assigned stops.)*

**Permissions (minimum, code-aligned):**
* Appointments: `P_APPOINTMENT_R`, `P_APPOINTMENT_E`, `P_APPOINTMENT_W`
* Media (for photos/attachments): `P_MEDIA_R`, `P_MEDIA_W`
* Optional resource lookup (asset tags): `P_RESOURCE_R`

---

# 4) Customer portal roles (Account-level)

### ROLE_CUSTOMER_ACCOUNT_ADMIN

**Scope:** Customer Account
**Responsibilities:** manage their users, see all their sites/appointments, create complaints.
**Typically touches:** ACCOUNT (own), APPOINTMENT (own), TASK (case); actions `_R/_W` (complaint creation is `_W`), optionally `_AUD` for own records.

**Permissions (minimum, code-aligned):**
* Account: `P_ACCT_R`, `P_ACCT_W`
* Appointments: `P_APPOINTMENT_R`
* Case tasks/complaints: `P_TASK_R`, `P_TASK_W`
* Media (view completion photos): `P_MEDIA_R`

### ROLE_CUSTOMER_VIEWER

**Scope:** Customer Account
**Responsibilities:** read-only visibility into appointments, ETAs, completion notes/photos.
**Typically touches:** APPOINTMENT (own), ACCOUNT (own summary); actions `_R`.

**Permissions (minimum, code-aligned):**
* Account: `P_ACCT_R`
* Appointments: `P_APPOINTMENT_R`
* Media (view completion photos): `P_MEDIA_R`

### ROLE_CUSTOMER_SITE_MANAGER

**Scope:** Customer Account (optionally restricted to a subset of sites)
**Responsibilities:** manage site-related info (contacts/access notes) and submit complaints for their sites.
**Typically touches:** RESOURCE (Site via portal), TASK (case), APPOINTMENT (own); actions `_R/_W`.

**Permissions (minimum, code-aligned):**
* Site/resource: `P_RESOURCE_R`, `P_RESOURCE_W`
* Case tasks/complaints: `P_TASK_R`, `P_TASK_W`
* Appointments: `P_APPOINTMENT_R`


---

# 5) RoleGroups (assignment bundles)

## 5.1 SYSTEM RoleGroups (templates)

### RG_SYS_SUPER_ADMIN

Expands to:

* ROLE_SYS_SUPER_ADMIN

### RG_SYS_PLATFORM_ADMIN

Expands to:

* ROLE_SYS_PLATFORM_ADMIN
* ROLE_SYS_SUPPORT_AUDITOR *(optional; many orgs want platform admins to have audit visibility)*

### RG_SYS_BILLING

Expands to:

* ROLE_SYS_BILLING_ADMIN

### RG_SYS_SUPPORT

Expands to:

* ROLE_SYS_SUPPORT_AUDITOR
* ROLE_SYS_SUPPORT_OPERATOR *(if you allow actions beyond read)*

---

## 5.2 Tenant RoleGroups (recommended defaults)

### RG_TENANT_ADMIN

Expands to:

* ROLE_TENANT_ADMIN
* ROLE_TENANT_TECH_ADMIN
* ROLE_TENANT_SECURITY_AUDITOR

### RG_TENANT_OPERATIONS_LEADERSHIP

Expands to:

* ROLE_TENANT_OPERATIONS_DIRECTOR
* ROLE_TENANT_CSR_MANAGER

### RG_TENANT_CSR_TEAM

Expands to:

* ROLE_TENANT_CSR

### RG_TENANT_BILLING_TEAM

Expands to:

* ROLE_TENANT_BILLING_SPECIALIST

---

## 5.3 Office RoleGroups

### RG_OFFICE_MANAGEMENT

Expands to:

* ROLE_OFFICE_MANAGER
* ROLE_OFFICE_OPERATIONS_SUPERVISOR

### RG_OFFICE_DISPATCH

Expands to:

* ROLE_OFFICE_DISPATCHER
* ROLE_OFFICE_OPERATIONS_SUPERVISOR

### RG_FIELD_CREW

Expands to:

* ROLE_FIELD_OPERATOR

---

## 5.4 Customer RoleGroups

### RG_CUSTOMER_ADMIN

Expands to:

* ROLE_CUSTOMER_ACCOUNT_ADMIN
* ROLE_CUSTOMER_SITE_MANAGER

### RG_CUSTOMER_READONLY

Expands to:

* ROLE_CUSTOMER_VIEWER

---

# 6) How this maps to your permission engine (without inventing permissions)

For any role above, your implementation can derive required permissions using your official patterns:

* Entity kinds: ORGANIZATION, ACCOUNT, RESOURCE, TASK, APPOINTMENT, WORKFLOW, BILLING, USER, ROLE, AUDIT
* Action suffixes: `_R/_W/_D/_X/_E/_AUD`

Example (conceptual only):

* ROLE_FIELD_OPERATOR needs APPOINTMENT `_E` (+ `_W` for notes/photos, `_R` to view assigned work)
* ROLE_OFFICE_DISPATCHER needs TASK/APPOINTMENT `_R/_W/_E` (+ `_X` for route planning automation if applicable)

Permission codes are enumerated in the role sections above, using the code-aligned permission key prefixes (e.g. `WORKFLOW → P_WF`, `ACCOUNT → P_ACCT`).
