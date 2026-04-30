Below is one **combined blueprint** that defines:

1. **TaskType graph** (Route Run + Customer Case/Complaint)
2. **AppointmentType graph** (per-site stop/visit)
3. **Workflows** (Task + Appointment)
4. Only **necessary attributes** with **only non-default attribute fields** (per your rule).

I’m using your conventions:

* multiple parents allowed (type graph / DAG)
* attribute identity is `(typeId, code)`
* references use `className: EntityRef` + `entityTypes: [...]`
* no “status” attributes (workflow-driven)

---

# Winter Services Blueprint: Task + Appointment

## 0) Conventions

### Attribute defaults (not listed unless changed)

`className=String, required=false, multiselect=false, freeValue=true, unique=false, options=[], defaultValue=null, inputFormat=null`

### Common reference entityTypes

* Task ref: `entityTypes: ["Task"]`
* Appointment ref: `entityTypes: ["Appointment"]`
* Account ref: `entityTypes: ["Account"]`
* Org ref: `entityTypes: ["Organization"]`
* Resource ref: `entityTypes: ["Resource"]`

*(Picker filters enforce “only Vehicle”, “only Site”, etc. No extra attribute fields needed.)*

---

## 1) TaskType graph

### 1.1 Base types and mixins

#### `Task` (base)

Parents: *(none)*
Attributes: *(none)*

#### `AccountScopedTask` (mixin)

Parents: `Task`
Attributes:

* `account`

  * `className: EntityRef`
  * `entityTypes: ["Account"]`
  * `required: true`

#### `SiteScopedTask` (mixin)

Parents: `Task`
Attributes:

* `site`

  * `className: EntityRef`
  * `entityTypes: ["Resource"]`
  * `required: true`

> Picker filter: only ResourceType = Site

#### `ServicingOrgTask` (mixin)

Parents: `Task`
Attributes:

* `servicingOrganization`

  * `className: EntityRef`
  * `entityTypes: ["Organization"]`
  * `required: true`

---

### 1.2 Operational route/run task (one vehicle over many accounts/sites)

#### `RouteRunTask`

Parents: `Task`, `ServicingOrgTask`
Workflow: `TASK_ROUTE_RUN`

Attributes:

* `vehicle`

  * `className: EntityRef`
  * `entityTypes: ["Resource"]`
  * `required: true`

> Picker: only ResourceType = Vehicle

* `crew`

  * `className: EntityRef`
  * `entityTypes: ["Resource"]`
  * `multiselect: true`

> Picker: only ResourceType = Human

* `shiftStart`

  * `className: java.time.Instant`
  * `required: true`

* `shiftEnd`

  * `className: java.time.Instant`
  * `required: true`

* `trackingEnabled`

  * `className: java.lang.Boolean`
  * `defaultValue: "true"`

*(Appointments are per stop and carry the account/site.)*

---

### 1.3 Customer cases: complaints / damage / missed service / redo request

#### `CaseTask` (abstract)

Parents: `Task`, `AccountScopedTask`
Workflow: `TASK_CASE_LIFECYCLE`

Attributes:

* `caseCategory`

  * `freeValue: false`
  * `options: ["COMPLAINT", "DAMAGE", "MISSED_SERVICE", "QUESTION", "OTHER"]`
  * `required: true`

* `priority`

  * `freeValue: false`
  * `options: ["LOW", "NORMAL", "HIGH", "URGENT"]`
  * `defaultValue: "NORMAL"`

* `relatedAppointment`

  * `className: EntityRef`
  * `entityTypes: ["Appointment"]`

* `relatedRouteRun`

  * `className: EntityRef`
  * `entityTypes: ["Task"]`

> Picker: only TaskType = RouteRunTask

*(We intentionally keep `site` optional at this level; some complaints are account-level.)*

#### `SiteCaseTask`

Parents: `CaseTask`, `SiteScopedTask`
Workflow: `TASK_CASE_LIFECYCLE`
Attributes: *(none)*

> Use `SiteCaseTask` when a complaint/damage is tied to a specific site.

---

## 2) AppointmentType graph

### 2.1 Base and mixins

#### `Appointment` (base)

Parents: *(none)*
Attributes: *(none)*

#### `TaskBoundAppointment` (mixin)

Parents: `Appointment`
Attributes:

* `task`

  * `className: EntityRef`
  * `entityTypes: ["Task"]`
  * `required: true`

#### `AccountSiteAppointment` (mixin)

Parents: `Appointment`
Attributes:

* `account`

  * `className: EntityRef`
  * `entityTypes: ["Account"]`
  * `required: true`

* `site`

  * `className: EntityRef`
  * `entityTypes: ["Resource"]`
  * `required: true`

> Picker: only ResourceType = Site

---

### 2.2 Route stop appointment (per site/account, customer-visible)

#### `RouteStopAppointment`

Parents: `Appointment`, `TaskBoundAppointment`, `AccountSiteAppointment`
Workflow: `APPOINTMENT_STOP_EXECUTION`

Attributes:

* `sequenceNo`

  * `className: java.lang.Integer`
  * `required: true`

* `plannedStart`

  * `className: java.time.Instant`
  * `required: true`

* `plannedEnd`

  * `className: java.time.Instant`
  * `required: true`

* `customerVisible`

  * `className: java.lang.Boolean`
  * `defaultValue: "true"`

* `serviceNotes`

  * `inputFormat: "MULTILINE"`

> (Optional but useful for “what was done”)

---

## 3) Workflows

You asked: “If needed create separate workflows for types that cannot use common workflows.”
✅ We need **two Task workflows**:

* Route runs behave like operational runs (planned → in progress → completed)
* Cases/complaints behave like ticketing (submitted → review → resolve/close)

Appointments can use a **single common stop execution workflow**.

---

# 3.1 Workflow: RouteRunTask

## Workflow code

`TASK_ROUTE_RUN`

## States

* `INITIAL`
* `PLANNED`
* `READY`
* `IN_PROGRESS`
* `COMPLETED`
* `CANCELLED`

## Transitions (events)

* `INITIAL → PLANNED` (`PLAN_RUN`)
* `PLANNED → READY` (`CONFIRM_RESOURCES`)
  *(vehicle/crew confirmed, route stops generated)*
* `READY → IN_PROGRESS` (`START_SHIFT`)
* `IN_PROGRESS → COMPLETED` (`END_SHIFT`)
* `ANY (pre-COMPLETED) → CANCELLED` (`CANCEL_RUN`)

## Automation hooks (notes)

* On `PLAN_RUN`: generate `RouteStopAppointment` list (sequenceNo, planned windows)
* On `START_SHIFT`: enable customer tracking for appointments where `customerVisible=true`
* On `END_SHIFT`: close unfinished appointments (policy: mark MISSED or keep SCHEDULED)

---

# 3.2 Workflow: CaseTask / SiteCaseTask (complaints, damage, redo request)

## Workflow code

`TASK_CASE_LIFECYCLE`

## States

* `INITIAL`
* `SUBMITTED`
* `UNDER_REVIEW`
* `IN_PROGRESS` *(investigation / provider action)*
* `WAITING_CUSTOMER` *(clarification, approval)*
* `RESOLVED`
* `REJECTED`
* `CLOSED`
* `CANCELLED`

## Transitions (events)

* `INITIAL → SUBMITTED` (`SUBMIT_CASE`)
* `SUBMITTED → UNDER_REVIEW` (`START_REVIEW`)
* `UNDER_REVIEW → IN_PROGRESS` (`START_WORK`)
* `UNDER_REVIEW → WAITING_CUSTOMER` (`REQUEST_CUSTOMER_INFO`)
* `WAITING_CUSTOMER → UNDER_REVIEW` (`CUSTOMER_RESPONDED`)
* `UNDER_REVIEW → REJECTED` (`REJECT_CASE`)
* `IN_PROGRESS → RESOLVED` (`MARK_RESOLVED`)
* `RESOLVED → CLOSED` (`CLOSE_CASE`)
* `ANY (pre-CLOSED) → CANCELLED` (`CANCEL_CASE`)

## Redo / rework handling (winter services)

Redo is typically fulfilled operationally as:

* Create a new `RouteStopAppointment` on a future `RouteRunTask` for the same `account+site`
* Link it back via `CaseTask.relatedAppointment` (or store in notes)
* Keep the case open until that redo stop is `DONE`, then `RESOLVED → CLOSED`

*(No extra “Redo workflow” needed.)*

---

# 3.3 Workflow: RouteStopAppointment (customer-facing stop execution)

## Workflow code

`APPOINTMENT_STOP_EXECUTION`

## States

* `SCHEDULED`
* `EN_ROUTE`
* `ON_SITE`
* `DONE`
* `MISSED`
* `CANCELLED`

## Transitions (events)

* `SCHEDULED → EN_ROUTE` (`DEPART_TO_SITE`)
* `EN_ROUTE → ON_SITE` (`ARRIVE`)
* `ON_SITE → DONE` (`COMPLETE_STOP`)
* `ON_SITE → MISSED` (`MARK_MISSED`) *(blocked, unsafe, no access, etc.)*
* `SCHEDULED → CANCELLED` (`CANCEL_STOP`)
* `EN_ROUTE → CANCELLED` (`CANCEL_STOP`)

## Customer tracking rules (behavior)

* Customer sees ETA + vehicle location when:

  * Appointment is `EN_ROUTE` or `ON_SITE`
  * and parent `RouteRunTask` is `IN_PROGRESS`
  * and appointment.account == customer account

---

## 4) Why this blueprint matches your winter-services requirements

* One vehicle/crew can service many accounts in one run ✅ (`RouteRunTask` + many `RouteStopAppointment`)
* Customers can log in and see:

  * their stop state, ETA, completion notes ✅ (Appointment workflow + fields)
  * the vehicle location only in context of their appointment ✅
* Customers can create complaints tied to what happened ✅ (`CaseTask` with `relatedAppointment`)
* Redo jobs are supported cleanly without inventing more entity types ✅ (case stays open until redo stop done)

