# Design Request: Calm Harbor Spa Authenticated Portal IA

## Objective

Produce an accepted executable Beauty-theme design for the Calm Harbor Spa
authenticated customer portal that implements the product IA in
[`calm-harbor-spa-customer-portal-ia.md`](calm-harbor-spa-customer-portal-ia.md).

The portal should feel continuous with the accepted Calm Harbor public landing
and let an existing spa customer understand the next relevant state within 10
seconds. It must not make the current Core Order feed look like a functioning
appointment/booking backend.

## Owned Scope

This request owns presentation only:

- the Beauty authenticated shell and responsive navigation;
- the current staging read-only Orders composition;
- the target `Appointments` composition and its lifecycle states;
- the user-level `Services & prices` navigation relationship;
- the visual priority of the secondary Shop destination;
- truthful disabled/unavailable treatments for closed commands/modules;
- stable hooks, scenarios, manifest entries, and viewport evidence.

## Forbidden Scope

- Do not add API calls, authentication logic, permissions, adapters, business
  mappings, persistence, or command implementations.
- Do not change or redesign the accepted Core OIDC composition except to place
  it in the final Calm Harbor-branded shell.
- Do not invent current appointments, availability, specialists, addresses,
  membership enrollment, package balance, loyalty, inventory, or profile data
  for live states.
- Do not present a local transition, toast, drawer close, or fixture mutation as
  a live success contract.
- Do not add Cart, Checkout, Proposals, Activity, standalone Calendar, Support
  threads, or full `My routine` to primary navigation in this increment.
- Do not replace the Beauty tokens, typography, glass surfaces, button system,
  responsive conventions, or component vocabulary with a new visual system.

## Inputs and Baseline

Read these before designing:

1. Product IA: `design-requests/calm-harbor-spa-customer-portal-ia.md`.
2. Live-data state request:
   `design-requests/calm-harbor-authenticated-live-data-states.md`.
3. Executable visual source: `design-inbox/source.html`.
4. Existing appointment-first profile:
   `design-inbox/data/fixtures.js` (`appointments`).
5. Existing shell: `design-inbox/src/components/shell/TopNav.js`.
6. Existing cabinet composition: `design-inbox/src/routes/OrdersPage.js`.
7. Reusable Beauty appointment/package components:
   `design-inbox/src/components/care/BeautyCareHub.js`.
8. Accepted OIDC route: `design-inbox/src/routes/AuthOidcPage.js`.
9. Backend/data truth:
   `content/cases/CORE-CUSTOMER-PORTAL-CONTRACT.md` and
   `DATA-OWNERSHIP.md`.
10. Existing mobile reference:
    `design-inbox/previews/care-beauty-routine-390.png`.

Respect the incumbent visual baseline. The task is to simplify and reprioritize
the spa portal IA inside the accepted system, not to create a new brand or a
generic dashboard.

## Product and Data Truth

The executable design may use clearly marked fixtures to demonstrate future
target states. Production transfer will activate only the states whose sources
are open.

| Surface | Available to current staging | Design rule |
| --- | --- | --- |
| OIDC session and Account bootstrap | Yes | Reuse accepted OIDC and account lifecycle treatments. |
| Account-scoped Order list | Read-only | Design a neutral read-only `Orders` staging variant. Do not call rows appointments. |
| Appointment list/detail | No customer-safe relationship yet | Design target and unavailable states separately; mark fixture-ready states as target-only. |
| Book/reschedule/cancel/book again | Not opened | Disabled/absent in current staging; target command states may be designed but never presented as currently live. |
| Services and displayed prices | Public PIM baseline opened | Preserve loading, ready, empty, and error. No availability claim. |
| Retail Shop | Partial PIM fields only | Secondary destination; no inventory, cart, checkout, or payment. |
| Customer membership/package/loyalty | Not opened | Omit from current staging. Do not confuse public membership offers with enrollment. |

## Required IA Variants

### A. Current truthful staging shell

Primary navigation:

1. `Orders` using stable route `orders.list`;
2. `Services & prices` using existing `services` and `pricing` routes;
3. `Shop` using `products`;
4. Account/session control.

There is no active `+ Book`, Calendar, `My routine`, Cart, notification badge,
or editable profile control. The staging shell may offer `Browse services` as
honest navigation.

### B. Target spa shell after Appointment source opens

Primary navigation:

1. `Appointments` as the authenticated default;
2. `Services & prices`;
3. `Shop`, visually secondary;

The global `+ Book` action is present only in target/open-booking scenarios.
Calendar becomes an appointments view or booking-flow control rather than a
permanent top-level destination. Account and Support use the account/overflow
treatment. `My plan` is reserved by the IA but is outside this design increment
until a customer-scoped membership/package source is opened.

Provide an explicit visual/config distinction between the current staging and
target variants so production can activate modules without ambiguous labels.

## Required Screens and States

### 1. Authenticated shell

Provide desktop, compact, tablet, and mobile compositions for:

- current staging navigation;
- target appointment navigation;
- account menu open;
- mobile menu open;
- long customer name and long service label;
- light and dark Beauty modes.

Use `Calm Harbor Spa` as the brand. Preserve the accepted logo primitive unless
the user supplies a separate approved brand asset.

### 2. Account bootstrap

Reuse or integrate the existing visual language for:

- `resolving-customer`;
- `customer-not-linked`;
- `customer-account-ambiguous`;
- `organization-forbidden`;
- `customer-forbidden`;
- `session-expired`;
- `customer-unavailable`.

No Account id, User id, organization code, permission, access token, or private
fixture entity may appear.

### 3. Current staging Orders

Design the existing `orders.list` route for:

- `loading`;
- `ready` with one row;
- `ready` with several rows and mixed long labels;
- `empty`;
- `error`;
- `unauthorized`.

Each row may show only normalized safe fields already available to staging:
type label/code, secondary reference, approved status presentation, displayed
total, and currency. If no customer-facing status mapping is supplied, provide
an honest unmapped-status treatment rather than translating `OPEN`.

Do not show appointment date/time, specialist, salon/home location, tracking,
invoice download, detail navigation, reschedule, cancel, or book-again controls.

### 4. Target Appointments default

Adapt and reuse the strongest accepted Beauty pieces rather than inventing a
new dashboard. The first viewport must contain:

1. customer-safe greeting;
2. next appointment card;
3. primary valid action;
4. start of the upcoming/past appointment structure.

Provide:

- next appointment at Calm Harbor;
- next appointment at the customer's place;
- no upcoming appointments with past history;
- no appointment history;
- loading;
- source error;
- unauthorized/not-found without entity enumeration;
- long treatment and specialist names;
- missing optional specialist and location-detail fields.

The target appointment card supports source-owned date/time, service,
specialist, visit mode, safe location, customer status, and optional price. The
reference is secondary. Do not use `Order #...` as the headline.

### 5. Target command states

For `Book`, `Reschedule`, `Cancel`, and `Book again`, provide reusable visual
states:

- unavailable/disabled with honest explanation where needed;
- `pending` scoped to the affected appointment/action;
- `failed` with retry;
- `conflict` requiring refresh/review;
- `succeeded` only after authoritative readback;
- `session-lost` preserving intended context.

The design is a presentation contract only. It does not open these commands.

### 6. Services & prices relationship

Keep stable routes `services` and `pricing`, but make them one understandable
customer destination. Return an accepted transition pattern such as an
in-section tab, linked subsection, or another design-system-native composition.

Cover PIM `loading`, `ready`, `empty`, and `error`. The closed-booking variant
uses `Browse services`/catalog navigation, never a false reservation action.

### 7. Shop priority

Preserve the existing product-card language but demonstrate Shop as secondary
to Appointments and Services. Current staging cards may use code, name, safe
description, and displayed price only. Do not show Add to cart, inventory,
availability, checkout, or purchase success.

## Content and Terminology

- Use `Appointment`, `Visit details`, `At Calm Harbor`, `At your place`,
  `Services & prices`, and `Reference` where their data contracts apply.
- Do not automatically translate `Order`, `OPEN`, or an Order type into spa
  scheduling language.
- Public `SPA_MEMBERSHIP` rows are `Membership options`, not `My membership`.
- Avoid field-service copy such as technician, property, dispatch, tracking,
  proposal, work order, or invoice unless a future source explicitly needs it.
- Avoid gendered spa assumptions. Beauty styling can remain warm and premium
  without making customer identity or treatment preferences implicit.
- Status must include a text label and cannot rely on color alone.

## Reuse and Stable Hooks

Reuse existing components/classes where they fit:

- `app-shell`, `top-nav`, `page-header`;
- `card`, `order-card`, `status-badge`;
- `loading-state`, `empty-state`, `error-state`;
- `ActionButton` variants;
- Beauty tokens and light/dark modes;
- the accepted next-appointment and package-card vocabulary, only in scenarios
  where their data is explicitly provided.

Preserve stable route ids unless the handoff includes an explicit migration
map. Add or retain stable hooks for:

- `data-route` and route `data-state`;
- `data-module` and `data-visual-id` for shell, Orders list, next appointment,
  appointment list, service/pricing navigation, and Shop;
- `data-appointment-id` only on authorized target fixtures/data;
- `data-action` and entity-scoped command `data-state`;
- `data-bind` for every dynamic customer-safe field;
- a config/profile hook distinguishing current staging from target
  appointment-capable IA.

Preview tooling may expose fixture controls. Production-visible markup must not
display preview source labels, internal ids, tokens, permission claims, or
contract disposition.

## Responsive Acceptance

Provide executable evidence at `1440`, `1180`, `768`, and `390` in Beauty light
and dark modes.

At minimum, capture:

1. current staging Orders ready/empty/error at `1440` and `390`;
2. target next appointment ready/empty at `1440` and `390`;
3. target at-salon and at-your-place variants at `390`;
4. account bootstrap failure at `390`;
5. mobile navigation open at `390`;
6. one appointment command pending and failed at `390`;
7. Services & prices ready/empty at `1440` and `390`;
8. dark-mode shell plus next appointment at `390`.

Acceptance checks:

- next state and primary valid action are identifiable within 10 seconds;
- no more than four primary product destinations on desktop and three directly
  visible destinations on mobile;
- no horizontal overflow or clipped actions;
- Shop never outranks the next appointment or Services;
- closed modules/actions cannot be mistaken for working features;
- state meaning is understandable without relying on color.

## Failure Modes the Handoff Must Demonstrate Against

Include a short note or scenario proving how the design avoids each failure:

1. Core Order displayed as a scheduled appointment.
2. `OPEN` displayed as `Confirmed` or `Upcoming` without a mapping.
3. Fixture appointment visible while the live source is loading or failed.
4. Active Book/Reschedule/Cancel control in the current staging variant.
5. Public membership offer displayed as customer enrollment or balance.
6. Shop/cart controls implying inventory or checkout.
7. Mobile shell hiding the next state below secondary commerce.
8. At-home appointment rendered without making visit mode clear.
9. Expired session leaving stale private content visible.

## Output Format

Return an executable update to the modular no-build design package containing:

- updated route/component source;
- styles and responsive rules;
- fixture scenarios clearly separated into `current-staging` and
  `target-appointments` capability variants;
- manifest and stable-hook updates;
- an IA/route migration note;
- viewport screenshots listed above;
- a concise inventory of reused, changed, and new presentation components.

## Validation

- Every requested route/state renders through `source.html` over HTTP with no
  console errors.
- Every scenario route/action/module exists in the manifest.
- Current-staging scenarios contain no appointment, membership, loyalty,
  inventory, cart, or successful command claims.
- Target-only fixtures are clearly capability-gated and cannot be selected by
  the current-staging profile.
- Visual comparison confirms continuity with the accepted Calm Harbor landing
  and Beauty tokens at all required widths.
- The user reviews the executable output and is the only person who replaces
  `design-inbox/` with the accepted package.

## Closeout

The handoff reply must state:

- which IA decisions were implemented;
- which baseline components were reused or moved;
- every stable hook or route mapping changed;
- the complete screenshot/evidence list;
- all unresolved product assumptions;
- any requested state that could not be represented without inventing a
  backend fact.
