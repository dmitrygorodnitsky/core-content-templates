# Organization cascade and entity placement

Where each type and workflow of the service model belongs in the organization
tree, decided by how universal the entity actually is.

**Date:** 2026-07-28. Companion to
[`SPA-VERTICAL-CORE-MODEL.md`](SPA-VERTICAL-CORE-MODEL.md), which describes the
entities themselves. This document only answers *where they live*.

Everything below marked **verified** was checked against
`dev-1.servicewand.com` on the date above with an admin session. Everything
marked **open** is a decision or an unchecked assumption, and is called out as
such rather than assumed.

---

## 1. The proposed cascade

From the founder:

```
Service Industries
├── Beauty, Wellness & Personal Care
│   ├── Spa
│   ├── Nail Salon
│   └── Non-clinical Massage
├── Allied Health & Rehabilitation
│   ├── Physiotherapy
│   └── Registered or Clinical Massage Therapy
├── Building Services & Skilled Trades
│   └── HVAC
└── Property & Grounds Services
    ├── Snow Removal
    ├── Gardening and Lawn Care
    └── Landscaping
```

Mapped onto Core organizations, that is five levels once the platform root and
the operating tenant are included:

| level | example org | what belongs here |
| --- | --- | --- |
| platform | `SYSTEM` | what Core itself ships — SYSTEM price types, base workflows |
| service industries | *does not exist yet* | true of every service business |
| category | *does not exist yet* | regulatory and commercial-shape differences |
| industry | *does not exist yet* | genuinely industry-specific vocabulary |
| tenant | `CALM_HARBOR_SPA_STAGING` | instance data only, no types, no workflows |

## 2. What the tree actually looks like

**Verified.** The cascade does not exist. Live tree:

```
SYSTEM  [SYSTEM]
└── CALM_HARBOR_SPA_STAGING  [SPA_ORGANIZATION]
PNI  [MERCHANT]
PIXEL_CORE  [PLATFORM_MANAGEMENT]
SERVICEWAND  [PLATFORM_MANAGEMENT]
└── SERVICE_WAND_WINTER_SERVICES  [PLATFORM_MANAGEMENT]
    └── SERVICE_WAND_WINTER_SERVICES_CANADA  [PLATFORM_MANAGEMENT]
        └── SNOWLIMITLESS  [OPERATOR]
```

Existing organization types: `BASE`, `SYSTEM`, `MERCHANT`, `OPERATOR`,
`PLATFORM_MANAGEMENT`, `AI_AWARE`, `SPA_ORGANIZATION`.

## 3. Inheritance works, and we placed everything wrong

**Verified — inheritance on read.** Listing `product-type` as
`CALM_HARBOR_SPA_STAGING` returns 6 rows: 4 owned by the tenant and **2 owned by
`SYSTEM`**. A type owned by an ancestor is visible to its descendants. This is
the mechanism the whole cascade depends on, and it already functions.

**Verified — current placement is wrong in two opposite directions:**

| what | where it lives now | problem |
| --- | --- | --- |
| all 17 types | `CALM_HARBOR_SPA_STAGING` | too low — universal definitions are locked inside one tenant and no second tenant can reuse them |
| all 15 workflows | `SYSTEM` | too high — spa lifecycles sit at the platform root, visible to `PNI` and `SNOWLIMITLESS`, which have no use for them |

The two halves of one model ended up at opposite ends of the tree. This is a
consequence of how the provisioning scripts resolve ownership: types are written
to the organization in the request header, workflows to the resolved owner
organization, and the two diverged.

## 4. Placement

### 4.1 Service industries — 14 of 17 types

Every one of these is true of any service business. The `SPA_` prefix describes
the circumstances in which the type was created, not the entity.

| current code | proposed code | why it is universal |
| --- | --- | --- |
| `SPA_CUSTOMER` | `CUSTOMER` | every service business has customers |
| `SPA_SPECIALIST` | `PRACTITIONER` | whoever performs the work |
| `SPA_SERVICE` | `SERVICE` | a service has a duration; so does an HVAC call-out |
| `SPA_RETAIL` | `RETAIL` | goods sold alongside: cosmetics, a part, de-icer |
| `SPA_MEMBERSHIP` | `MEMBERSHIP` | HVAC service contract, spa membership — same shape |
| `SPA_PACKAGE` | `PACKAGE` | a block of N visits: physio, lawn care, spa |
| `SPA_VISIT` | `SERVICE_VISIT` | an appointment and a site call-out are structurally one thing |
| `SPA_ORDER` | `SERVICE_ORDER` | one general order; kind derives from its line types |
| `SPA_ITEM_SERVICE` | `ITEM_SERVICE` | the four commercial line shapes are universal |
| `SPA_ITEM_RETAIL` | `ITEM_RETAIL` | |
| `SPA_ITEM_PACKAGE` | `ITEM_PACKAGE` | |
| `SPA_ITEM_MEMBERSHIP` | `ITEM_MEMBERSHIP` | |
| `SPA_FULFILLMENT` | `FULFILLMENT` | pickup, delivery, or work performed on site |
| `SPA_STOCK` | `STOCK` | anyone who hands over goods has stock |
| `SPA_PLAN_ENROLLMENT` | `PLAN_ENROLLMENT` | a prepaid balance of units |
| `SPA_CUSTOMER_REVIEW` | `CUSTOMER_REVIEW` | a review of something sold |
| `SPA_STUDIO` | `SERVICE_LOCATION` | where the work happens — provider premises or the customer's |

`SERVICE_LOCATION` carries a requirement the spa model did not have to face:
Property & Grounds and Building Services work at the *customer's* address, not
at a location the provider owns. The type needs to express both, with the
category supplying the default.

### 4.2 Category — attributes, not types

Nothing at this level is a new type. What differs is which attributes a
universal type carries.

**Beauty, Wellness & Personal Care**

- Retail attributes `VOLUME_ML`, `SCENT_PROFILE`, `FORMAT`, `COLLECTION` are
  body-care attributes. HVAC needs a part number and compatibility; grounds work
  needs coverage area. The `RETAIL` type is universal; this attribute set is not.
- `FOCUS` on a service ("Personalized facial care") is wellness framing. The
  equivalent slot holds system type for HVAC, surface type for snow removal.

**Allied Health & Rehabilitation** — not yet modelled, but two differences are
already visible and will not fit a shared type:

- A practitioner needs registration, scope of practice, and insurance. A
  beauty-therapy practitioner does not. `PRACTITIONER` needs a category-level
  extension, not one shared attribute set.
- A treatment plan is a health record. `SPA_CARE_PLAN` / `SPA_CARE_TASK` should
  become a universal `SERVICE_PROGRAM` / `PROGRAM_TASK` at service-industries
  level, `CARE_PLAN` in Beauty & Wellness, and something separate with clinical
  handling in Allied Health. Renaming one field is not enough — the privacy
  requirements differ.

**Property & Grounds Services** — seasonality is real here and absent from the
spa model: a season has a start and end, and work is route-based rather than
appointment-based. `SERVICE_VISIT` still fits; the scheduling model above it
does not exist yet.

### 4.3 Industry — nothing

**No type and no workflow in the current model is spa-specific.** A nail salon
or a non-clinical massage studio would use all 17 types and all 15 workflows
unchanged.

This is the substantive finding of this document. It means the industry level of
the cascade is, for our current model, empty — and that the `SPA_` prefix was
never describing a spa.

### 4.4 Tenant — data only

Products, prices, accounts, orders, order items, appointments, the studio
resource, stock rows, reviews, enrolments, subscriptions. Instances. No type
definitions, no workflow definitions.

### 4.5 Workflows

All 15 belong at service-industries level by the same test — none is
spa-specific:

`ORGANIZATION_LIFECYCLE` · `ACCOUNT_LIFECYCLE` · `PRODUCT_LIFECYCLE` ·
`PRODUCT_REVIEW_LIFECYCLE` · `PRICE_LIFECYCLE` · `CARE_PLAN_LIFECYCLE` ·
`TASK_LIFECYCLE` · `APPOINTMENT_LIFECYCLE` · `RESOURCE_LIFECYCLE` ·
`ORDER_LIFECYCLE` · `ORDER_ITEM_LIFECYCLE` · `FULFILLMENT_LIFECYCLE` ·
`PLAN_ENROLLMENT_LIFECYCLE` · `INVENTORY_LIFECYCLE` · `SUBSCRIPTION_LIFECYCLE`

**But some should not move at all — they should be deleted.** Seven of the
fifteen are a trivial `DRAFT → ACTIVE` with a single transition, and
`SPA_RESOURCE_LIFECYCLE` and `SPA_INVENTORY_LIFECYCLE` have one state and no
transitions. Meanwhile the permission catalogue already contains
`P_WF:SIMPLE_RESOURCE:*`, `P_WF:HUMAN_RESOURCE:*` and `P_WF:TASK:*` — Core ships
its own. Each of ours needs checking against the Core equivalent before it is
carried up; a duplicate should be dropped in favour of what already exists.

`SPA_APPOINTMENT_LIFECYCLE` is worth keeping as-is: `SCHEDULED`, `IN_PROGRESS`,
`COMPLETED`, `CANCELLED`, `NO_SHOW` applies as cleanly to an HVAC call-out as to
a facial.

## 5. Structural problems to resolve first

**`SPA_ORGANIZATION` is the wrong kind of organization type.** An organization
type should describe the node's role in the tree, not the vertical it happens to
serve. The cascade needs `INDUSTRY_CATEGORY`, `INDUSTRY` and `TENANT`; none
exists, and `SPA_ORGANIZATION` should not survive the migration.

**Geography is an undeclared axis.** The snow vertical is
`SERVICEWAND → SERVICE_WAND_WINTER_SERVICES → …_CANADA → SNOWLIMITLESS`. The
proposed cascade has no geography level. **Open decision:** is geography a level
in the tree, or an attribute of the tenant? If it is a level the cascade becomes
six deep, and placement has to account for Canadian rules differing from US
ones — which is a real constraint for Allied Health in particular.

**There are two roots.** `SYSTEM` and `SERVICEWAND` both currently act as roots
for verticals. The cascade assumes one. **Open decision:** which, and what
happens to the other.

## 6. Open questions that gate the migration

1. **Can a tenant write an entity whose type is owned by an ancestor?**
   Inheritance is verified for *reads* only. If writes reject an inherited type,
   the entire cascade is read-only decoration and the placement above cannot be
   implemented. This is the load-bearing unknown and needs one probe save.
2. **Can a type's `code` be changed in place?** Core resolves types by code and
   every seeded row references a type id. If `code` is immutable, renaming means
   creating new types and repointing every row — a data migration, not a config
   change.
3. **Does an organization inherit workflows the same way it inherits types?**
   Our workflows are all in `SYSTEM` and resolve fine from the tenant, but that
   is the root case; an intermediate level is untested.
4. **Which of our 15 workflows duplicate Core's?** Per §4.5.

## 7. Migration order, once those are answered

1. Create the cascade organizations and the organization types for their roles.
2. Re-parent `CALM_HARBOR_SPA_STAGING` under `Spa`.
3. Move workflows down from `SYSTEM` to service-industries level, dropping the
   ones that duplicate Core's.
4. Move types up from the tenant to service-industries level, renaming as §4.1.
5. Split the category-level attribute sets off the universal types.
6. Re-point tenant data at the relocated types.
7. Retire `SPA_ORGANIZATION`.

Steps 3 and 4 both touch live data and neither is reversible by itself; they
should be one operation with a verified readback, not two.

## 8. How the verified claims were checked

All read-only, admin session, `X-Organization-Code` as noted:

- Organization tree and types: `POST /core/api/organization/list.json` and
  `/core/api/organization-type/list.json` as `SYSTEM`.
- Inheritance and ownership: `POST /{service}/api/{entity}-type/list.json` as
  `CALM_HARBOR_SPA_STAGING`, mapping `organization` on each row, for
  `core-bill/order-type`, `core-pim/product-type`,
  `core-svc/appointment-type`, and `core/workflow`.
- Type and workflow inventory: `core-ui/scripts/dev/seeds/beautySpaTypes.json`
  and `beautySpaWorkflows.json`.
