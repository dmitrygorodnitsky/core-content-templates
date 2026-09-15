# Snow Vertical — Core Type and Flow Model

Status: read from `dev-1` as organization `SNOWLIMITLESS`, 2026-08-31. Read-only;
nothing in Core was created, updated or transitioned to produce it.
Reproduce with:

```bash
SERVICEWAND_API_KEY=... node app-templates/customer-portal/scripts/snow-core-inventory.mjs
```

Snapshots of every type and workflow payload live in
[`../core-types/`](../core-types/), one file per record plus `index.json`.

This is the counterpart to [`SPA-VERTICAL-CORE-MODEL.md`](SPA-VERTICAL-CORE-MODEL.md):
what Core is configured to hold for the winter-services vertical, and what it
actually holds. It supersedes the claim in `HANDOFF.md` that none of Property,
Contract, Quote, Invoice, Appointment or Support Ticket exists in Core.

The definitions were **not** produced by `core-ui/scripts/dev/seeds/snowTypes.json`
in its current form. That seed names types this organization does not have
(`SW_FS_WS_PROPERTY_SITE`, `SNOW_SERVICE_JOB`, `SNOW_PLOW_TRUCK`, `SNOW_CREW`) and
misses types it does (`PROPERTY`, `SNOW_REMOVAL_PROPERTY`, `SUPPORT_TICKET`).
Treat the deployed state below as truth and the seed as drifted.

## 1. Organizations visible to the portal key

```text
SERVICEWAND                            id 7
└── SERVICE_WAND_WINTER_SERVICES       id 8    owns most types and workflows
    └── SERVICE_WAND_WINTER_SERVICES_CANADA  id 9   owns customer/contract/season types
        └── SNOWLIMITLESS              id 43   holds every business record
```

Definitions live at provider level and are visible to `SNOWLIMITLESS` through
inheritance. Only `SNOW_REMOVAL_VEHICLE` is owned by the tenant itself.

## 2. Types

`req` marks `required`. An attribute typed as an entity class holds that
entity's **id** as its value. `et` lists the `entityTypes` the attribute accepts.

### core-acct — account-type

| type | id | owner | workflow | attributes |
| --- | --- | --- | --- | --- |
| `CUSTOMER` | 2 | `SYSTEM` | `SNOW_CUSTOMER_LIFECYCLE` | `MANAGEMENT_COMPANY`, `PARTY_TYPE` |
| `SNOW_RESIDENTIAL_CUSTOMER` | 5 | `…_CANADA` | `SNOW_CUSTOMER_LIFECYCLE` | `CUSTOMER_STATUS`, `CUSTOMER_PRIORITY`, `BILLING_TERMS`, `PREFERRED_CONTACT_METHOD`, `TAX_EXEMPT`, `CUSTOMER_NOTES` |
| `SNOW_COMMERCIAL_CUSTOMER` | 6 | `…_CANADA` | `SNOW_CUSTOMER_LIFECYCLE` | same six |
| `SNOW_PROPERTY_MANAGER` | 7 | `…_CANADA` | `SNOW_CUSTOMER_LIFECYCLE` | same six |
| `SNOW_EMPLOYEE` | 12 | `…_CANADA` | `SNOW_WORKFORCE_LIFECYCLE` | 7 |
| `SNOW_SUBCONTRACTOR` | 17 | `…_CANADA` | `SNOW_WORKFORCE_LIFECYCLE` | 7 |

Every customer record in the tenant is the generic `CUSTOMER` (2), not one of
the three snow-specific customer types.

### core-rm — resource-type

| type | id | workflow | attributes |
| --- | --- | --- | --- |
| `PROPERTY` | 153 | `PROPERTY_LIFECYCLE` | `ADDRESS` Address req, `ACCOUNT` Account req et=2, `PROPERTY_CATEGORY` String (`COMMERCIAL`, `RESIDENTIAL`, `MUNICIPAL`, `STRATA`, `INSTITUTIONAL`, `INDUSTRIAL`) |
| `SNOW_REMOVAL_PROPERTY` | 154 | `PROPERTY_LIFECYCLE` | `SITE_SERVICE_DURATION` Integer req, `DRIVEWAY`/`SIDEWALK_LENGTH`/`PARKING_LOT` Float, `DRIVEWAY_SURFACE_TYPE`/`SIDEWALK_SURFACE_TYPE`/`PARKING_LOT_SURFACE_TYPE` String multi, `APPROVED_DE_ICING_MATERIALS` String multi, `SURFACE_TREATMENT_RESTRICTIONS` String multi, `PRIORITY` String, `ON_SITE_CONTACT_INFO` String, `PROPERTY_PLAN` Media multi |
| `CREW` | 84 | `RESOURCE` | `DEPOT_ADDRESS`, `WORK_START`, `WORK_END`, `ROUTE_COLOR` |
| `PLOW` 148, `SPREADER` 149, `BRINE_TANK` 150 | | `SIMPLE_RESOURCE` | attachment master data |
| `PUBLIC_ROAD_VEHICLE` 114, `OFF_ROAD_VEHICLE` 126, `SNOW_REMOVAL_VEHICLE` 161 | | | fleet master data |
| `WORKFORCE` 155, `DRIVER` 156, `GENERAL_WORKER` 157, `DISPATCHER` 158, `FOREMAN` 159 | | `WORKFORCE_LIFECYCLE` | people as resources |

A property record carries `ADDRESS`, `ACCOUNT` and `PROPERTY_CATEGORY` under
type id **153**, because `SNOW_REMOVAL_PROPERTY` inherits them. Its own 12
attributes sit under type id **154** and are empty on all 630 records.

### core-svc

| endpoint | type | id | workflow | attributes |
| --- | --- | --- | --- | --- |
| project-type | `SNOW_SERVICE_SEASON` | 4 | `SW_FS_WS_PROJECT` | `SEASON_YEAR`, `SEASON_START_DATE`, `SEASON_END_DATE`, `SEASON_STATUS` |
| project-type | `SNOW_SERVICE_PROGRAM` | 5 | `SW_FS_WS_PROJECT` | `PROGRAM_TYPE`, `PROGRAM_STATUS` |
| task-type | `SNOW_ROUTE` | 10 | `SNOW_ROUTE_TASK` | crew/vehicle/equipment assignment, `ROUTE_DATE`, `SCHEDULE_WINDOW`, `CHECK_LIST` FormType |
| task-type | `SUPPORT_TICKET` | 29 | **none** | `ACCOUNT` Account req, `PROPERTY` Resource req multi et=154 |
| appointment-type | `SNOW_SERVICE_VISIT` | 2 | `APPOINTMENT` | `RESOURCE`, `CREW_NOTES`, `COMPLETION_NOTES`, `PRE_SERVICE_MEDIA`, `POST_SERVICE_MEDIA` |
| appointment-type | `SNOW_INSPECTION_VISIT` | 3 | `APPOINTMENT` | `RESOURCE` req et=154, `COMPLETION_NOTES` req, `CREW_NOTES`, `INSPECTION_MEDIA` |

### core — document-type

`SNOW_SEASONAL_CONTRACT` and `SNOW_PER_VISIT_CONTRACT` on `SNOW_CONTRACT_DOCUMENT`,
each with `PRIMARY_SITE` req, `SITES` multi, `SERVICE_SEASON` Project req,
`CONTRACT_START_DATE`/`CONTRACT_END_DATE`, `PRICING_MODEL`, `BILLING_FREQUENCY`,
`SERVICE_LEVEL`, `PO_NUMBER`, `CONTRACT_NOTES`.

Both codes exist **four times** — ids 4/6/8/10 and 5/7/9/11 — all owned by
`…_CANADA` with identical attributes. Resolving a contract type by code is
ambiguous today.

### core-bill

| endpoint | type | id | workflow | attributes |
| --- | --- | --- | --- | --- |
| order-type | `FIELD_SERVICE_ORDER` | 5 | `GENERAL_FSM_ORDER` | `CLIENT` Account et=2, `SERVICE_PROPERTY` Resource et=154, `SERVICE_PERIOD_START`, `SERVICE_PERIOD_END`, `EFFECTIVE_DATE`, `PROPERTY_PLAN` Media multi |
| order-type | `WINTER_SERVICES_ORDER` | 6 | `GENERAL_FSM_ORDER` | `SNOW_TRIGGER` Float, `DE_ICING_TRIGGER` Float |
| order-item-type | `SNOW_REMOVAL_ORDER_ITEM` | 5 | `GENERAL_FSM_ORDER_ITEM_LIFECYCLE` | none |
| invoice-type | `PER_SERVICE` | 5 | none | `DATE` req, `PAYMENT_NET_TERMS` req |
| invoice-type | `FIXED_RATE` | 6 | none | `DATE` req, `PAYMENT_NET_TERMS` req, `SERVICE_PERIOD` |

## 3. Workflows

`GENERAL_FSM_ORDER` is workflow **id 45** on `com.pixelnation.bill.domain.Order`,
owned by `SERVICE_WAND_WINTER_SERVICES`. It is the quote lifecycle:

```text
INITIAL ──► QUOTE_PREPARED ──► QUOTE_APPROVED_INTERNALLY ──► QUOTE_SENT ──► QUOTE_VIEWED
               ▲     │                                                          │
               │     └──► CHANGES_REQUESTED ──┘                                 │
               └──────────── CUSTOMER_CHANGES_REQUESTED ◄────────────────────────┤
                                          CLIENT_APPROVED ◄──────────────────────┤
                                                 DECLINED ◄──────────────────────┘
```

`CLIENT_APPROVED` and `DECLINED` are terminal. The three customer-visible events
are `QUOTE_VIEWED-CLIENT_APPROVED`, `QUOTE_VIEWED-DECLINED` and
`QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED`; everything before `QUOTE_SENT` is
operator-side.

Other lifecycles:

| workflow | id | entity | initial | states |
| --- | --- | --- | --- | --- |
| `PROPERTY_LIFECYCLE` | 35 | Resource | `INITIAL` | `INITIAL`→`INSPECTION-REQUIRED`→`ACTIVE`↔`INACTIVE` |
| `SNOW_CUSTOMER_LIFECYCLE` | 14 | Account | `DRAFT` | `DRAFT`→`PROSPECT`→`ACTIVE`↔`SEASONAL_HOLD`/`INACTIVE`, `ARCHIVED` terminal |
| `SNOW_CONTRACT_DOCUMENT` | 13 | Document | `DRAFT` | `DRAFT`→`PENDING_APPROVAL`→`ACTIVE`→`SUSPENDED`/`EXPIRED`→`ARCHIVED` |
| `APPOINTMENT` | 20 | Appointment | `SCHEDULED` | `DRAFT`→`SCHEDULED`→`IN_PROGRESS`→`COMPLETED`, `CANCELED` terminal |
| `SW_FS_WS_PROJECT` | 18 | Project | `INITIAL` | `INITIAL`→`ACTIVE`↔`SUSPENDED`→`CLOSED` |
| `GENERAL_FSM_ORDER_ITEM_LIFECYCLE` | 46 | OrderItem | `DRAFT` | `DRAFT`→`PENDING_APPROVAL`→`APPROVED`→`ACTIVE` |
| `SUPPORT_TICKET_LIFECYCLE` | 48 | — | — | exists but is **not attached** to task type `SUPPORT_TICKET` |

## 4. Records actually present in `SNOWLIMITLESS`

| entity | count | detail |
| --- | --- | --- |
| resource `SNOW_REMOVAL_PROPERTY` | 630 | 628 `ACTIVE`, 1 `INITIAL`, 1 `INSPECTION-REQUIRED`; every one has an `ADDRESS`; none has a single type-154 attribute filled |
| resource fleet | 61 | 21 `PUBLIC_ROAD_VEHICLE`, 16 `PLOW`, 16 `SPREADER`, 7 `OFF_ROAD_VEHICLE`, 1 `DRIVER` |
| account `CUSTOMER` | 632 | 630 own exactly one property each |
| account `EMPLOYEE` | 25 | |
| account `SNOW_COMMERCIAL_CUSTOMER` | 1 | id 22 |
| order `FIELD_SERVICE_ORDER` | 3 | ids 15, 18, 19 — all still at `INITIAL` |
| user | 22 | |
| invoice, project, task, appointment | 0 | none of these has ever been created |
| document | 1 | a `DRIVER_LICENSE`; no contract document exists |

The address book is British Columbia — Surrey, strata and management-company
names — not the Colorado front range the Granite Ridge fixture depicts.

### The identity gap

Exactly **one** Account in the whole organization is linked to a Core User:
account **692** → user **29**. It is `CUSTOMER`, state `DRAFT`, and it owns no
property and no order. The 630 accounts that do own property have no user at
all, so no portal session can resolve to them.

The three existing quote orders belong to accounts 51 and 62, neither of which
has a user. Account 62 also owns property 278 and orders 18 and 19 — the trace
of a quote request that created customer, property and order but never created
or linked a User.

## 5. Address contract

Addresses are a separate entity read from `core/api/address/list.json` by id.
Projectable fields are `address1`, `city`, `postalCode`, `state` (identifier,
e.g. `BC`) and `country` (identifier, e.g. `CA`). There is **no latitude or
longitude**: a map that places properties by coordinate needs geocoding the
portal does not have today.

Measured across the whole book, not sampled: the 630 properties reference 629
distinct addresses — one address is shared by two properties — and **all 629
resolve** when read by id.

| | count |
| --- | --- |
| complete: street, city, postal code and province | 592 |
| missing street line | 24 |
| missing postal code | 24 |
| missing province | 37 |

Provinces are `BC` 587, `ON` 3, `AB` 2 and 37 unset. The book covers 42 cities,
led by Vancouver 104, Richmond 46, Surrey 44, Burnaby 40 and Coquitlam 35. City
is the one field that is never blank.

## 6. Reading Core without breaking it

Verified against these endpoints, and each of these cost a debugging round:

1. `mappings` is mandatory. A list request without it answers `200` and an
   empty body.
2. An object-valued field projected as a bare `{ name }` answers `200` with a
   multi-megabyte non-JSON body. Entity references need
   `{ key: "id", name, type: "identifier", mappings: [...] }`; `states` needs
   `type: "collection"`.
3. `attributes` is the exception: it must be a bare `{ name: "attributes" }`.
   Projecting its members returns empty objects.
4. On a record, `attributes` is a map keyed by **type id**, then attribute code,
   then `{ value }` — `attributes["153"].ACCOUNT.value`. Inherited attributes
   are keyed by the ancestor's id, not the record's own type.
5. Attribute values are inconsistently typed. Property 278 carries
   `ACCOUNT: { value: 62 }` and property 430 carries `ACCOUNT: { value: "62" }`.
   A strict `===` comparison silently drops half a customer's book; coerce
   before comparing, and guard the coercion, because `Number(null)` is `0`.
6. Record endpoints accept `type.code` and `account.id` as filters, and reject
   attribute predicates: `attributes.ACCOUNT` matches nothing and a bare
   `ACCOUNT` answers `500`. There is no `in` operator — it answers `500` in
   every spelling tried, so a batch read by id is one request per id.
7. Type endpoints accept no `code` filter at all — a type lookup by code has to
   walk pages.
8. Type definitions carry no `parent`; inheritance is only observable through
   the attribute keying in rule 4.
9. **`address/list.json` paginates on an unstable sort.** Walking it returns
   exactly the 705 rows `resultSize` promises, but 169 of them are repeats and
   169 distinct ids are never served, at `pageSize` 100 and 200 alike:

   ```text
   page 0 (offset 0)    200 rows,   0 already seen, ascending = yes
   page 1 (offset 200)  200 rows,   0 already seen, ascending = yes
   page 2 (offset 400)  200 rows, 109 already seen, ascending = no
   page 3 (offset 600)  105 rows,  60 already seen, ascending = no
   ```

   The first two pages come back ordered and the last two do not, so the
   `OFFSET`/`LIMIT` windows overlap. Every id the walk misses — 503, 535, 637,
   655 among them — resolves normally when filtered by `id`. An address must
   therefore be read by id, never by paging the collection: a portal that paged
   would silently drop a quarter of its customers' addresses while looking
   healthy. The count is not the defect and neither are permissions; the
   ordering is. Whether the same instability affects `resource/list.json` and
   `account/list.json` is untested — their walks agreed with `resultSize` at the
   current volume, which is not proof.

## 6a. The quote calculation, as the team owns it

Confirmed by the team on 2026-08-31 and matched against the records:

- `Order.SERVICE_PROPERTY` **is** the site. One Order covers one property; that
  is the model, not a gap. A customer with several properties has several
  Orders.
- Each `OrderItem` is one service on that site. It carries a `ProductPrice`,
  which carries the money and points at a product — `Snow Removal`,
  `Rock Salt De-Icing`, `Ice Melt De-Icing`, or an hourly machine.
- The number of units on each line is **computed**, from the property's
  measurements, by a formula to be embedded in an `onUpdate` hook on either the
  Order or the OrderItem workflow.

Order 15 already exercises the chain: two `SNOW_REMOVAL_ORDER_ITEM` lines, each
in its own `GENERAL_FSM_ORDER_ITEM_LIFECYCLE` state, one priced against
`PARKING_LOT_SNOW_REMOVAL` and one against the hourly `ATV / UTV`.

`SNOW_REMOVAL_ORDER_ITEM` declaring zero attributes is therefore correct: the
line needs no property reference, because the Order already names the site, and
no measurement, because the units are derived.

### The price book, as the founder settled it on 2026-09-09

`core-pim/api/product-price/list.json` holds 43 rows against 8 of the 12
products, in four price types: `TIERED` 19, `TIERED_RECURRENT` 18, `PER_UNIT` 5,
`PER_UNIT_RECURRENT` 1. `TIERED` is the one-off price per visit;
`TIERED_RECURRENT` is the monthly price and carries `INTERVAL: { value: 1,
unit: 55 }` — unit 55 is `MONTH` — and `USAGE_TYPE: "Licensed"`.

**There is no single ratio between the one-off and the monthly price, and there
was never meant to be.** A monthly price is a seasonal contract spread evenly:

```text
monthly = one-off price × expected visits per season ÷ 5 months
```

Snow Removal assumes about four visits a season, which is exactly the observed
`$350 × 4 ÷ 5 = $280`. De-icing assumes roughly 28–32, which is why its monthly
price runs about six times the per-visit one. One month may carry twenty visits
and the next almost none; the customer pays the same amount either way.

**The expected visit count therefore has to be stored** — per product or per
tariff — and it is not in the model today. Without it the monthly price cannot
be derived, only copied.

### How a tiered price is actually read

The first two rows are **threshold prices, not ranges**. Read them as "up to X":

| Snow Removal | Rock Salt De-Icing |
| --- | --- |
| up to 5 000 sq ft — $275 | up to 5 000 sq ft — $195 |
| 5 001 – 10 000 sq ft — $350 | 5 001 – 10 000 sq ft — $245 |

A 4 000 sq ft lot is therefore $275, not $350. Taken literally as `0–5 000` and
`0–10 000` the two rows overlap, so the calculation needs either a stated rule —
smallest matching upper threshold wins — or the second band re-cut to
`5 001–10 000`.

Above 10 000 sq ft the shape changes. The row with `FROM_COUNT: 10001` is **the
rate for the area beyond the first 10 000 only**, not a new price for the whole
property:

```text
15 000 sq ft  =  $350  +  (15 000 − 10 000) × per-unit rate
```

Ice Melt sits about 15% above Rock Salt, with rounded actuals, and follows the
same base-plus-excess shape.

Rock Salt's recurrent book has no `0–5 000` band because it was missed. It needs
adding, priced by the seasonal formula above.

### The pricing bases

The unit attribute is named `UNIT` on the two snow-removal types and `SIZE` on
the four others. That inconsistency is acknowledged: **a calculation must not
look only at `UNIT`**, and the intended fix is one common unit field across all
product types.

| basis | how it prices | status |
| --- | --- | --- |
| `AREA_BASED_SNOW_REMOVAL` | total area in sq ft, threshold price plus excess rate | in use |
| `AREA_BASED_DE_ICING` | same shape, separate rates for Rock Salt and Ice Melt | in use |
| `TIME_BASED_SNOW_REMOVAL` | hourly rate per equipment type; duration is unknown when quoting, so the quote states the rate | available |
| `TIME_BASED_DE_ICING` | hourly de-icing rate, which may differ from the snow-removal rate for the same machine | **does not exist yet, to be added** |
| `WEIGHT_BASED_DE_ICING` | solid de-icer by weight — per kg or per 50 kg bag; combines with the time-based rate, machine time and material billed separately | valid, no products yet |
| `VOLUME_BASED_DE_ICING` | liquid de-icer by volume — brine in litres or gallons | valid, no products yet |
| `LENGTH_BASED_SNOW_REMOVAL` | — | not used for quotes; its empty product list is expected |

Whether weight- and volume-based products are created now or left as future
options is undecided.

### Settled on 2026-09-10

- **The expected visit count lives on the product type**, so each product carries
  its own figure. Snow Removal assumes about four visits a season, de-icing about
  thirty. The monthly price is derived from it, never stored.
- **The common unit field is added alongside `UNIT` and `SIZE`, not instead of
  them.** Neither is renamed or removed: nothing visible tells us what else reads
  them, and an attribute dropped from a type orphans every value stored under its
  code.
- Product types were never created by a seed in `core-ui`, and `snowTypes.ts`
  replaces an attribute list wholesale. Changes to them therefore go through a
  script that reads the live definition and merges, not through a declarative
  seed that would re-author it from memory.

### Still open with the founder

- Price row 45, `PER_UNIT_RECURRENT` on Snow Removal, carrying `CURRENCY`,
  `INTERVAL` and `USAGE_TYPE` but no money attribute at all — the only one of 43
  without a price.
- Whether `SNOW_REMOVAL_PARKING_LOT` (product 26) duplicates
  `PARKING_LOT_SNOW_REMOVAL` (25) or is a distinct offering. Both are
  `AREA_BASED_SNOW_REMOVAL`, both declare `1 × SQUARE-FOOT`, neither carries a
  description; 25 holds 15 price rows, 26 none, and `Skid-Steer` none either.

### Data to correct before any calculation runs

`SIDEWALK_LENGTH = { value: 6, unit: 2 }` on resource 661 — six centimetres of
sidewalk — is a test value. It must be deleted or replaced with a real
measurement, and must not feed a calculation meanwhile. It is the only type-154
attribute filled on any of the 630 properties.


### What this fixes on the portal side

Money stays server-owned, exactly as in the spa: `OrderItem.amount` is a unit
price, `itemCount` is the computed quantity, `Order.grandTotal` is Core's. The
browser must never run the tier ladder itself or reconstruct a total.

The accepted Contracts screen's per-site measured area now **does** have a
source — the property's `PARKING_LOT`, `DRIVEWAY` and `SIDEWALK_LENGTH`. What
still has none is the grouping proposal above the sites, its number, its sent
date and its validity. `Order` carries **no `code` field at all** — absent, not
empty — and none of `dueDate`, `validTo`, `validUntil`, `expiryDate`,
`startDate`, `endDate`, `number` or `reference` exists on it. What does exist is
`notes`, `created`, `updated`, `grandTotal`, `totalCharges` and `totalTaxes`.
One Order is one site, so a customer's quote list is N independent Orders with
no record joining them.

## 6b. Measurement service — Beam AI

A property's measurements come from the manager or from Beam AI, an aerial
measurement service. Its report for one address — the example is 2412 Haywood
Ave, West Vancouver, BC — carries:

- the lot area in sq ft (17 303 sq ft, 0.4 acres);
- six feature classes, each measured as an **area in sq ft and a length in ft**:
  Drive Lanes, Driveway, Parking Spot, Pavement, Private Sidewalk and Public
  Sidewalk;
- an overview aerial image, one overlay image per feature, and four oblique side
  views — east, north, south and west;
- the note that measurements are rounded to the nearest whole number.

| Beam feature | example | home in `SNOW_REMOVAL_PROPERTY` |
| --- | --- | --- |
| Lot area | 17 303 sq ft | none |
| Drive Lanes | 876 sq ft · 267 ft | none |
| Driveway | 0 sq ft · 0 ft | `DRIVEWAY` — area only |
| Parking Spot | 1 263 sq ft · 221 ft | `PARKING_LOT` — area only |
| Pavement | 0 sq ft · 0 ft | none |
| Private Sidewalk | 1 549 sq ft · 632 ft | `SIDEWALK_LENGTH` — length only, no private/public split |
| Public Sidewalk | 865 sq ft · 290 ft | `SIDEWALK_LENGTH` — length only, no private/public split |
| overlay and side-view images | 13 images | `PROPERTY_PLAN` — Media, multiselect |

The type has three measurement fields against Beam's thirteen numbers. There is
no field for drive lanes, pavement, sidewalk area, lot area or the private and
public sidewalk distinction, and nothing records which measured surface feeds the
snow-removal price and which feeds de-icing. The client has not specified either;
both are ours to decide.

**Decided on 2026-09-11: `SNOW_REMOVAL_PROPERTY` is not extended for now.** The
founder prices from a single measured parameter. Which parameter, and whether the
Beam features need homes at all, is to be settled with him.

## 6c. Anonymous access — magic links

Sources: the backend guides `MAGIC_LINKS_FROM_JAVA_SCRIPTS.md` and
`MAGIC_LINK_ADMIN_UI.md`, checked against the `api-docs` of each dev-1 service and
the dev-1 script list on 2026-09-11.

- A link is an `AccessGrant`: one token, one expiry, and entries that each name one
  exact entity with its own permissions and read and write mappings. It stays
  usable until it expires or is revoked, however many times it is opened.
- The public page calls `/{service}/i/{token}/{entity}/get.json`, `list.json`,
  `save.json` or `event.json`. A workflow event is delegated as the permission
  `P_WF:{workflow}:{event}` and sent as `{ id, event, metadata }`.
- Grant endpoints exist on dev-1 for `document` (`core`), `account`
  (`core-acct`), `order` (`core-bill`), and `task` and `appointment`
  (`core-svc`). **`core-cms` and `core-rm` expose none: a Form and a Resource
  cannot be reached through a link.**
- Every granted entity needs a Velocity script `MAPPINGS_{ENTITY}`, and the
  endpoint answers `400` without it. dev-1 lists only `MAPPINGS_ACCOUNT`.
- One grant holds Account, Order and Document entries together only when it is
  issued on `core-bill`.
- Introspection answers `{ expiresAt, types: [{ entityType, canRead, canWrite,
  events: [{ id, code, nls }] }] }`; after revocation it answers `401`, not the
  `404` the guide describes. A document grant's `get.json` answers `400` while
  `MAPPINGS_DOCUMENT` is missing.
- Since the `core` deploy of 2026-09-11, `core` admits a request only for an
  organization where the user holds a role of its own; a role in a parent
  organization no longer carries over. `core-acct`, `core-bill` and `core-cms`
  still honoured the parent role on the same day.
- The issuer must hold `P_GRANT_W` and every permission it delegates, event
  permissions included. `WINTER_SERVICE_QUOTATION_CREATOR` issues its account
  link through an in-memory `MAGIC_LINK_ISSUER` role on the system user carrying
  `P_GRANT_W` and `P_ACCT_R`; the guide asks for a persisted service user with a
  narrow role instead.

## 7. Settled product decisions

- **The Order is the quote; the contract is a `SERVICE_AGREEMENT` document.** A
  `FIELD_SERVICE_ORDER` in workflow 45 carries `CLIENT` and `SERVICE_PROPERTY`
  and prices one property under one pricing model. The client's September spec
  generates the contract as a Document over the approved Orders, so one agreement
  covers many Orders through its `ORDERS` attribute. This replaces the earlier
  reading, made before that spec existed, that the Order itself was the contract.
  The four `SNOW_SEASONAL_CONTRACT` and `SNOW_PER_VISIT_CONTRACT` types are not
  used.
- **The service agreement is the quotation package**, decided on 2026-09-11. Core
  has no record that joins the Orders a client decides together, a link cannot
  reach a Form, and the spec wants one email for a package. So the
  `SERVICE_AGREEMENT` is created as soon as the first quote is approved
  internally, and it collects each such Order in `ORDERS`. The manager sends the
  package once, from the agreement, which moves its Orders to `QUOTE_SENT` and
  issues one link to the account, the Orders and the agreement. Each client
  decision is an event on one Order; the Order's hook checks only the Orders of
  its own agreement, and once every property has a decision the agreement asks
  for the client's contract details. Those details are attributes of an event on
  the agreement rather than a `CONTRACT_INFORMATION` form. From `DRAFT` on, the
  agreement follows the spec. This departs from the spec twice: the package is
  sent from the agreement rather than by a bulk action on Orders, and the
  details arrive through an event rather than a form. Workflow 45 joins our
  seeds.
- **Customer Portal entitlement is an attribute of the provider organization**,
  decided on 2026-09-11. `SNOWLIMITLESS` is organization type `OPERATOR` (id 4),
  which already carries `REGIONS` and the `GENERAL_CONTACT`, `QUOTATION_MANAGER`,
  `CONTRACT_MANAGER`, `INVOICE_MANAGER`, `DISPATCH_MANAGER`,
  `OPERATIONS_MANAGER` and `CUSTOMER_SUPPORT_MANAGER` attributes. When it is on,
  every client the provider activates receives a portal User; no client is
  entitled separately.
- **The quote request writes through the anonymous form submit.** A customer
  sends `GET_QUOTE_` to `core-cms/api/form/submit.json` without a session. The
  portal does not create a User, an Account, a Property or an Order from the
  browser, and does not claim a quote exists as a result of the submission.

## 8. What blocks the portal

- **No user on any customer account.** The one-customer resolution the spa
  portal performs has exactly one candidate, and that candidate owns nothing.
- **`SUPPORT_TICKET` has no workflow**, so a ticket has no states to show.
- **Stale `entityTypes` references.** `SNOW_SERVICE_VISIT.RESOURCE`,
  `SNOW_SEASONAL_CONTRACT.PRIMARY_SITE` and `.SITES` point at
  `SW_FS_WS_PROPERTY_SITE`, which does not exist; `SNOW_ROUTE` points at
  `SNOW_CREW`, `SNOW_PLOW_TRUCK`, `SNOW_SALT_TRUCK`, `SNOW_LOADER`,
  `SNOW_VEHICLE` and `SNOW_EQUIPMENT`, none of which exist. A visit or contract
  cannot be attached to a real property until these point at 154.
- **Four duplicate contract document types** make resolution by code ambiguous.
- **No coordinates on addresses**, so the property map has no live source.
- **No invoice, project, task or appointment record has ever been created**, so
  every screen but properties, customers and quotes would render an empty state
  against live data.
