# Resource Types Structure Blueprint

**Winter Services – v1 (ServiceWand / Pixel Core)**
**Model:** type graph (multiple parents), workflow-driven state (multi-state), **Option A equipment attachment**, barcode-scannable equipment.

---

## 0) Conventions & rules

### Type graph

* Resource types form a **DAG** (multiple parents allowed).
* Attributes are identified by **(typeId, code)**.
* Attribute codes may repeat across parents; we avoid collisions by design.

### Workflow-driven state

* No “status” attributes (e.g., no `vehicleStatus`).
* Lifecycle flags like `AVAILABLE`, `REQUIRES_MAINTENANCE`, `VACATION`, `DO_NOT_DISTURB`, etc. are represented as **workflow states** and may co-exist.

### Attribute definition style

Only list `EntityTypeAttribute` fields that differ from defaults:

* defaults assumed: `className=String`, `required=false`, `multiselect=false`, `freeValue=true`, `unique=false`, `options=[]`, `unitCategory=null`, `entityTypes=null`, `inputFormat=null`, `defaultValue=null`.

### References

* Reference attributes use:

  * `className: EntityRef`
  * `entityTypes: ["..."]`

### Units

* Measurable values include:

  * `unitCategory: {"id":"<UnitCategory>"}` (e.g., `AREA`, `LENGTH`, `TIME`, etc.)

---

## 1) Type graph overview

### 1.1 Base + mixins

* `Resource` *(abstract base)*
* `OrgOwned` *(mixin)*
* `AccountOwned` *(mixin)*

### 1.2 Winter Services resource types

* `Site` → `PropertySite` *(optional later: `SiteZone`)*
* `Human` → `Driver`, `Shoveler`, `Supervisor`
* `Vehicle` → `Truck`, `Pickup`, `ATV`, `SkidSteer`
* `Equipment` → `Plow`, `Spreader`, `Trailer`, `Broom`, `Shovel` *(optional children; the base already supports tracking)*

---

## 2) Base types and mixins

### 2.1 `Resource` (abstract)

**Parents:** none
**Attributes:** none

---

### 2.2 `OrgOwned` (mixin)

**Purpose:** resource is owned/managed by an Organization (typically a ServiceProviderOffice)

**Attributes**

* `ownerOrganization`

  * `className: EntityRef`
  * `entityTypes: ["Organization"]`
  * `required: true`

> UI/API picker rule (not an attribute field): restrict to ServiceProviderOffice orgs.

---

### 2.3 `AccountOwned` (mixin)

**Purpose:** resource is owned/scoped by an Account (typically a ClientAccount)

**Attributes**

* `account`

  * `className: EntityRef`
  * `entityTypes: ["Account"]`
  * `required: true`

> UI/API picker rule: restrict to ClientAccount*.

---

## 3) Site types (Account-owned)

### 3.1 `Site`

**Parents:** `Resource`, `AccountOwned`

**Attributes**

* `servicingOrganization` *(optional override; if empty, derive from Account.servicingOrganization)*

  * `className: EntityRef`
  * `entityTypes: ["Organization"]`

* `siteAccessClass`

  * `freeValue: false`
  * `options: ["OPEN", "GATED", "KEY_REQUIRED", "APP_ACCESS"]`
  * `defaultValue: "OPEN"`

Optional (only if you need routing/capacity in v1):

* `serviceArea`

  * `className: java.lang.Double`
  * `unitCategory: {"id":"AREA"}`

### 3.2 `PropertySite`

**Parents:** `Site`
**Attributes:** none

### 3.3 `SiteZone` *(optional, later)*

**Parents:** `Site`
**Attributes:** none (v1)

---

## 4) Human types (Org-owned)

### 4.1 `Human`

**Parents:** `Resource`, `OrgOwned`

**Attributes**

* `employmentType`

  * `freeValue: false`
  * `options: ["EMPLOYEE", "CONTRACTOR"]`
  * `defaultValue: "EMPLOYEE"`

### 4.2 `Driver`

**Parents:** `Human`

**Attributes**

* `licenseClass`

  * `freeValue: false`
  * `options: ["G", "DZ", "AZ", "OTHER"]`

### 4.3 `Shoveler`

**Parents:** `Human`
**Attributes:** none

### 4.4 `Supervisor`

**Parents:** `Human`
**Attributes:** none

---

## 5) Vehicle types (Org-owned) + equipment attachment (Option A)

### 5.1 `Vehicle`

**Parents:** `Resource`, `OrgOwned`

**Attributes**

* `licensePlate`

  * `required: true`
  * `unique: true`

* `registrationId` *(generic “registration identifier”; can map to VIN/plate permit/etc.)*

  * `unique: true`

* `attachedEquipment` *(Option A)*

  * `className: EntityRef`
  * `entityTypes: ["Resource"]`
  * `multiselect: true`

> UI/API picker rule (not attribute field): restrict `attachedEquipment` selection to `Equipment` types and same-tenant scope.

Optional later (if needed):

* `odometer`

  * `className: java.lang.Double`
  * `unitCategory: {"id":"LENGTH"}`

### 5.2 `Truck`

**Parents:** `Vehicle`
**Attributes:** none

### 5.3 `Pickup`

**Parents:** `Vehicle`
**Attributes:** none

### 5.4 `ATV`

**Parents:** `Vehicle`

**Attributes**

* `towingCapable`

  * `className: java.lang.Boolean`
  * `defaultValue: "false"`

### 5.5 `SkidSteer`

**Parents:** `Vehicle`
**Attributes:** none

---

## 6) Equipment types (Org-owned) + barcode identity

### 6.1 `Equipment`

**Parents:** `Resource`, `OrgOwned`

**Attributes**

* `assetTag` *(primary barcode/QR identifier for scanning)*

  * `required: true`
  * `unique: true`
  * `inputFormat: "BARCODE"` *(omit if your UI doesn’t support this convention yet)*

Optional later:

* `serialNumber`

  * `unique: true` *(only if you expect manufacturer serials to be unique in your tenant)*

### 6.2 `Plow`

**Parents:** `Equipment`
**Attributes:** none

### 6.3 `Spreader`

**Parents:** `Equipment`
**Attributes:** none

### 6.4 `Trailer`

**Parents:** `Equipment`
**Attributes:** none

### 6.5 `Broom` *(optional child; examples like tracking specific broom/shovel)*

**Parents:** `Equipment`
**Attributes:** none

### 6.6 `Shovel` *(optional child)*

**Parents:** `Equipment`
**Attributes:** none

> You can add more tool/equipment types later without changing Vehicle schema, because attachment is via `attachedEquipment`.

---

## 7) Ownership and attachment rules (enforced by validation / policies)

### 7.1 Org-owned resources

For any type that inherits `OrgOwned`:

* `ownerOrganization` must be in the tenant org tree.
* recommended: ownerOrganization must be `ServiceProviderOffice` (picker restriction).

Applies to:

* Human, Vehicle, Equipment (and their descendants)

### 7.2 Account-owned resources

For any type that inherits `AccountOwned`:

* `account` must belong to tenant root (Corp) and be of `ClientAccount*` type (picker restriction).

Applies to:

* Site (and its descendants)

### 7.3 Equipment attachment (Option A)

For `Vehicle.attachedEquipment`:

* equipment must be within same tenant scope.
* recommended (policy-level): equipment.ownerOrganization == vehicle.ownerOrganization
* equipment can be attached to multiple vehicles unless you enforce exclusivity via workflow/rules (recommended later if needed).

### 7.4 Scanning flow (operational)

* scan barcode → value = `assetTag`
* find Equipment where `assetTag == scanned`
* attach/detach by updating `Vehicle.attachedEquipment`

No reverse `assignedTo` relationship required.

---

## 8) What is config vs data

### Config (ancestor-visible)

* ResourceType definitions (this blueprint)
* Attribute definitions
* Picker rules/filters
* Workflows configured per entity/type

### Data (tenant-scoped instances)

* Resource instances (Sites, Humans, Vehicles, Equipment)
* Equipment attachments (`attachedEquipment` values)

---

## 9) Minimal v1 checklist

To launch with this blueprint, you need only:

* types: Resource, OrgOwned, AccountOwned, Site, Human, Vehicle, Equipment (+ a few children)
* required refs: `ownerOrganization` and `account`
* `Vehicle.licensePlate` (unique, required)
* `Equipment.assetTag` (unique, required)
* `Vehicle.attachedEquipment` multiselect reference

Everything else can be added incrementally.

---
