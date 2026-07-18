# Calm Harbor Spa Customer Portal IA

Status: proposed product contract, v0.1

Target family: `CUSTOMER_PORTAL_CALM_HARBOR_STAGING`

Design baseline: `../design-inbox/`

Backend contract: `../content/cases/CORE-CUSTOMER-PORTAL-CONTRACT.md`

## Decision

Calm Harbor keeps the accepted Beauty visual system, but the authenticated
portal is reorganized around appointments and repeat visits rather than the
generic field-service concept of Orders.

This is a target information architecture, not permission to relabel the
current Core Order rows as appointments. The current staging adapter proves a
read-only `User -> Account -> Orders` path. The customer-safe Appointment
relationship and all booking writes remain closed.

## Product Frame

### User and business model

- The signed-in customer is exactly one `SPA_CUSTOMER` Account related to the
  authenticated Core User through `Account.user`.
- The primary user is an individual spa customer, not an operator managing a
  service fleet or a business account.
- Calm Harbor is treated as a hybrid spa: an appointment can occur at a Calm
  Harbor location or at the customer's place. This is an assumption inherited
  from the accepted public landing and must be confirmed before final copy.
- The current UI language is English. Localization is outside this brief.

### Real user job

After sign-in, a customer should be able to understand what happens next and
take the next valid action without learning backend terminology.

Expected priority:

1. See the next appointment, including time, service, specialist, and place.
2. Book or repeat a service when a real booking command is available.
3. Reschedule or cancel an appointment when those commands are available.
4. Understand package, membership, or credit balance when a customer-scoped
   source exists.
5. Browse services and current public prices.
6. Browse retail products as a secondary task.

The first four priorities are product assumptions. Before final visual
acceptance, ask a Calm Harbor operator this exact question:

> What are the three most common things an existing customer contacts the spa
> to do after a booking has already been made?

Record the answer in this document. If the answer changes the top three tasks,
revisit the navigation before visual polish.

## Success Gate

The metric is task clarity and truth, not the number of completed screens.

| Verdict | Condition |
| --- | --- |
| PASS | At `390` and `1440`, a reviewer can identify the next customer state and the primary available action within 10 seconds; primary navigation has no more than four product destinations; no UI fact or action exceeds its opened backend contract. |
| PIVOT | The next appointment or primary action is not discoverable within 10 seconds, a frequent task needs a fifth primary destination, or Order semantics cannot safely support the proposed customer label. Rework IA/copy before polish. |
| ABORT | The design requires CMS/fixtures to supply current appointments, membership balance, loyalty, specialist preference, availability, authorization, or successful mutations in live mode. |

## Source-Truth Baseline

| Capability | Current source | Current disposition | IA consequence |
| --- | --- | --- | --- |
| Session | Core OIDC plus `user/basic-info` | Opened for staging | Private shell and account bootstrap may render. |
| Customer scope | `Account.user` plus `SPA_CUSTOMER` type | Read-only, live-proven on `dev-1` | Exactly one Account is required; no CMS/URL Account selector. |
| Orders | Core Bill `Order.account` | Read-only list, live-proven on `dev-1` | May appear as a neutral staging activity/order list. It is not an Appointment source. |
| Appointments | Scheduling relationship through Task/Project | Customer relationship not proven | Target UI may be designed with fixtures, but live navigation and appointment claims stay disabled. |
| Booking/reschedule/cancel | Scheduling commands | Not opened | No active `Book`, `Reschedule`, or `Cancel` command and no simulated success. |
| Services and prices | Public Core PIM | Price comparison opened on `dev-1` | Current public rows may render with loading, empty, and error states. No availability claim. |
| Retail products | Public PIM price-comparison baseline | Partial; full catalog/media/inventory not opened | Shop is secondary and limited to proven public fields. No stock, cart, or checkout claim. |
| Customer membership/package/credits | No customer-scoped source | Not opened | Do not show `My membership`, remaining visits, renewal, loyalty, or entitlement. Public membership offers remain catalog content. |
| Profile editing | No scoped profile write contract | Not opened | Account menu may show session-safe identity and sign-out only. |
| Care/routine/specialist history | No customer-safe Care relationship | Not opened | `My routine` stays out of live navigation. Accepted fixtures are design reference only. |

## Target Navigation

The authenticated default destination is `Appointments`. It doubles as the
customer's action-first home; a separate dashboard route is not justified yet.

### Primary destinations

| Priority | User label | Stable route contract | Rule |
| --- | --- | --- | --- |
| 1 | Appointments | `orders.list` / `order.detail` presentation family | Enable only after a normalized customer-safe Appointment source exists. Keep stable route ids during presentation transfer unless architecture is deliberately migrated. |
| 2 | Services & prices | `services` and `pricing` | Present as one user-level destination. Preserve both internal route ids and provide an accepted transition/tab composition between them. |
| 3 | Shop | `products` | Secondary. Enable only for the fields proven by the selected PIM contract; cart/checkout remain absent. |
| 4 | My plan | `care` or a future approved membership route | Conditional. Show only after a customer-scoped package/membership source and entitlement decision are opened. |

### Global and secondary actions

- `+ Book` is the dominant global action only when availability and booking
  command contracts are opened. Before then, use an honest navigation action
  such as `Browse services`, or omit the global CTA.
- Account menu owns display name, secure sign-out, and eventually profile
  preferences after their source is opened.
- Support belongs in the account/overflow menu unless operator evidence shows
  it is a top-four customer task.
- Calendar is part of appointment browsing and booking; it is not a permanent
  top-level destination for a normal spa customer.
- Activity, Proposals, Checkout, and generic Care do not appear in primary spa
  navigation. Flow-only routes may still exist when their contracts open.

### Current staging navigation

Until Appointment semantics are proven, the staging package remains an
integration surface rather than pretending to be the target portal:

1. `Orders` — neutral read-only Core Order list.
2. `Services & prices` — public PIM rows.
3. `Shop` — only proven public PIM fields.
4. `Account` — session identity and sign-out.

Do not label this read-only Order list `Appointments`, and do not map raw status
`OPEN` to `Upcoming`, `Scheduled`, or `Confirmed` without a documented mapping.

## Target Appointments Information Architecture

### Default state

The first viewport contains, in order:

1. Customer-safe greeting.
2. Next appointment card.
3. The primary valid action: `Book`, `Book again`, or no command when writes
   are unavailable.
4. Upcoming appointments.
5. Past appointments/history.

The next appointment card may contain only source-proven fields:

- appointment/service label;
- start date and local time with timezone policy;
- specialist display name when authorized;
- visit mode: `At Calm Harbor` or `At your place`;
- safe location label/address according to least-data rules;
- customer-facing status from an approved mapping;
- amount/payment summary only when the source owns it;
- stable reference in details, not as the primary title.

### Empty state

- Explain that there are no upcoming appointments.
- Show `Browse services` while booking is closed.
- Show `Book an appointment` only when the real booking command is open.
- Past history may remain below if its source is available.

### List and detail

- Default grouping is `Upcoming` and `Past`; a month calendar is an optional
  view inside Appointments, not a top-level section.
- Cards lead to detail only when Account ownership is enforced for the detail
  read. A route id by itself is never trusted.
- Reschedule/cancel/book-again actions are entity-scoped, prevent duplicate
  submission, and show success only from authoritative readback.

## Services, Pricing, Shop, and Plan

### Services & prices

- One customer concept combines editorial treatment discovery with live PIM
  price rows.
- A price is displayed verbatim from PIM. Do not infer duration, savings,
  eligibility, or availability.
- When booking is closed, service cards navigate within the catalog rather
  than claiming a reservation.

### Shop

- Product browsing stays visually subordinate to appointments and services.
- Current staging may use only product code/name, safe short description, and
  displayed price from the proven contract.
- Images, inventory, availability, cart, checkout, and purchase success remain
  absent until separately opened.

### My plan

- `My plan` means an enrolled customer package, membership, credits, or loyalty
  state. It is not the same as a public membership product in PIM.
- When opened, its first view should answer: current plan, usable balance,
  renewal/expiry, and the next valid action.
- Saved treatment formulas, specialist notes, and routine history are personal
  service data and require least-data review, authorization, and audit before
  activation.

## State Model

The shell and every dynamic module use explicit, non-overlapping states.

### Account bootstrap

`checking-session` -> `resolving-customer` -> one of:

- `ready`;
- `customer-not-linked`;
- `customer-account-ambiguous`;
- `organization-forbidden`;
- `customer-forbidden`;
- `session-expired`;
- `customer-unavailable`.

No private module renders fixture success before Account resolution reaches
`ready`.

### Module state

Each module supports the applicable subset of:

`loading | ready | empty | error | unauthorized | unavailable | disabled`

An unavailable Appointment source is not an empty appointment list. Empty
means the authorized source successfully returned no relevant entities.

### Command state

Each mutable entity supports:

`idle | pending | failed | conflict | succeeded | session-lost`

Only the affected entity is pending. A toast, closed drawer, or HTTP `200`
without authoritative entity readback is not success.

## Terminology Contract

| Backend term | Customer term | Rule |
| --- | --- | --- |
| `Order` | No automatic replacement | Map by proven order type. Retail remains a purchase/order; a scheduling entity becomes an appointment only through an approved relation. |
| `OPEN` | No automatic replacement | Define a backend-owned status mapping before using `Upcoming`, `Confirmed`, or `Needs confirmation`. |
| Order id | Reference | Show as secondary detail, never the card headline. |
| `SPA_MEMBERSHIP` PIM row | Membership option | Never render it as the customer's active membership. |
| Location/address | At Calm Harbor / At your place | Make visit mode explicit and render the least necessary address. |

## Responsive Contract

- Required acceptance widths: `1440`, `1180`, `768`, and `390`.
- At `390`, the next customer state and primary valid action must appear before
  secondary catalog content.
- Mobile primary navigation exposes no more than three destinations directly;
  the remainder goes into the accepted menu/account treatment.
- The global CTA must not crowd the brand, account, or menu controls.
- Long service names, translated copy, empty lists, and error copy must wrap
  without horizontal scrolling or clipped controls.
- Light and dark Beauty modes remain supported; status may not rely on color
  alone.

## Non-Goals for This Design Increment

- Booking drawer/availability picker implementation.
- Cart, checkout, payment method, or purchase success.
- Editable customer profile.
- Loyalty, package balance, specialist preference, routine notes, or treatment
  formulas in live mode.
- Support threads, proposals, generic activity feed, or standalone calendar
  navigation.
- Backend contract or permission design.

## Failure Modes to Challenge During Review

1. An Order row is visually presented as an appointment without date, time,
   location, or an approved relationship.
2. `OPEN` is translated into a reassuring customer status that the backend
   does not guarantee.
3. An attractive empty state offers `Book` even though booking is unavailable.
4. Public PIM membership options are mistaken for customer entitlement.
5. Mobile navigation gives Shop or Calendar more prominence than the next
   visit.
6. Fixture specialist, package, loyalty, or routine data leaks into live mode.
7. A failed/expired Account request leaves stale private data visible.
8. The hybrid visit model hides whether the appointment is at the salon or at
   the customer's place.

## Humility Checkpoint

Before high-fidelity acceptance, pause and answer:

- Did the Calm Harbor operator confirm the top three existing-customer tasks?
- Can the backend distinguish appointment-like Orders from retail Orders?
- Is Calm Harbor truly hybrid, and what address detail is appropriate?
- Are packages, memberships, and loyalty separate business concepts?
- If Shop disappeared from primary navigation, would the main customer job
  become easier or would revenue materially suffer?

Any unresolved load-bearing answer stays recorded as an assumption rather than
being resolved through visual design.
