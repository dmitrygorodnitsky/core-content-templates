# Customer Portal Data Ownership

Status: proposed implementation contract

This document decides where every customer-portal fact is owned before a
manual CMS package or a live adapter is added. It complements
[`ARCHITECTURE.md`](ARCHITECTURE.md): that document defines the runtime;
this document defines the authority of the data the runtime is allowed to
show or change.

## Product Gate

The product metric is not that a portal route renders. A customer must see
their current authorized facts and a completed action must have an
authoritative, inspectable result.

| verdict | condition |
| --- | --- |
| Pass | Every customer, commercial, and operational fact comes from its designated source; every live write has authorization, idempotency where applicable, and readback. |
| Pivot | A source can read data but cannot prove customer/tenant scope or return an authoritative result for a write. Keep the surface read-only or unavailable. |
| Abort | The proposed integration requires customer data, entitlements, secrets, or sensitive Health data to be authored in CMS or simulated as successful. |

The initial production gate for calling this a customer portal is a real
session plus authorized read-only Orders and Calendar data. PIM catalog data
can be enabled earlier because its live adapter is already repository-proven,
but it does not make a customer-specific portal by itself.

The first staged release may instead be the public SEO landing. It is a
separate CMS-owned marketing surface, not an authenticated customer portal;
its static authored content can ship before any customer backend is opened.

## Authority Rules

1. CMS owns presentation configuration and public authored content. It never
   owns customer, tenant, entitlement, operational, payment, or health facts.
2. A source system owns business facts. The portal receives them only through
   a module adapter and a normalizer; components never consume raw responses.
3. Browser state owns transient interaction only. It must not be represented
   as a completed server action or a durable business fact.
4. Every mutable live command needs an authenticated actor, customer and tenant
   scope, entity authorization, an idempotency policy when retry is possible,
   a failure state, and an authoritative readback.
5. `fixture`, `local`, `unavailable`, and `not_opened` are product states, not
   substitutes for a live integration. Live mode must never silently load a
   fixture and appear current.
6. `portal_case` may select a repository-owned demonstration organization only
   in `fixture` mode. It is ignored in `live` mode and cannot select a customer,
   tenant, or source-system record.

## Ownership Matrix

`Opened` means that a repository-proven adapter currently exists. It does not
mean that every deployment has configured its credentials, gateway, or source
data. `Not opened` means no live contract may be inferred from the UI.

| Domain and entities | Source of truth | UI modules/routes | Current disposition | CMS role | Opening condition |
| --- | --- | --- | --- | --- | --- |
| Portal configuration: vertical, profile, theme, enabled modules, default route, initial mode | CMS template configuration | shell and all routes | CMS-authored | Owns allowed configuration only | Validate enum/profile compatibility at render time. |
| Authentication, session, customer id, tenant id, roles | Identity/session service | `auth`, private-route guards | fixture; live not opened | Cannot author identity, scope, token, or role | Define host auth bridge, session transport, expiry/sign-out, and scope claims. |
| Orders: order, status, service history, invoice metadata | Order/service backend | `orders.list`, `order.detail` | fixture; live not opened | None | Authorized list/detail contract and explicit document-download contract. |
| Appointments and service calendar: visits, windows, slot availability | Scheduling backend | `calendar`, booking drawer | fixture; live not opened | May author labels only | Customer-scoped read contract; booking/reschedule requires availability hold, idempotency, and returned appointment state. |
| Activity and notifications | Event/notification backend | `activity` | fixture; live not opened | May author empty-state copy only | Customer-scoped event feed, pagination/cursor, read acknowledgement semantics. |
| Proposals: sites, line items, choices, approval/revision/decline | Proposal/CRM backend | `proposals.list`, `proposal.detail` | fixture; live not opened | None | Versioned proposal read model; write commands with optimistic-concurrency/version check and returned proposal state. |
| Pricing: plan, price, currency, price interval | Core PIM | `pricing` | opened live on dev-1 same-origin | May select PIM query configuration; never author a live price | `POST /core-pim/public/{organization}/catalog/price-comparison.json` is proven for Calm Harbor Spa. Validate normalized rows and retain loading, empty, and error states. |
| Products: SKU/catalog item, category, attributes, media, availability | Core PIM product catalog | `products`, cart entry points, future public product grid | opened live price-comparison baseline on dev-1; catalog expansion not opened | May control visual module availability only | The adapter reads identity and price rows for configured product types. It does not prove media, inventory, availability, or a complete public catalog contract. |
| Cart, checkout, payment, final total, order creation | Commerce backend and PSP | `checkout` | local/fixture; live not opened | Cannot author cart, payment method, payment token, or price result | Server-calculated total, payment-token handoff, idempotent order creation, and returned order id/status. |
| Customer profile: name, contacts, addresses, payment-method references, preferences | Customer/profile service and PSP | `profile` | fixture; live not opened | May author labels and field visibility policy, never customer values | Scoped read/write contracts; payment data must use PSP tokens/references only. |
| Services: service definitions and marketing descriptions | CMS or service catalog | `services`, public SEO | mixed; fixture runtime | Owns editorial service copy and static media | If availability, eligibility, price, or bookability is shown, source it dynamically from service/catalog backend. |
| Support articles | CMS or knowledge base | `support` | fixture runtime | Owns article/help-topic content | Versioned CMS/KB read contract if articles are not bundled into the template. |
| Support conversations, tickets, agent status | Support backend | `support` | fixture; live not opened | None | Customer-scoped thread contract, message delivery/readback, attachment policy, and retention/audit rules. |
| Care entitlement and service data | Vertical service backend | `care` | fixture; `care.live` not opened | Cannot author entitlement or customer-specific Care data | Prove preflight entitlement, customer/tenant scope, normalized data contract, and per-command authorization. |
| Health documents, provider contact, clinical or sensitive appointment facts | Health-compliant service | Health `care` and appointment surfaces | unavailable/not opened | Prohibited | RBAC, consent, audit, secure viewer/download, least-data rendering, and authorized readback are all mandatory. |
| Public landing SEO: brand, locality, metadata, page copy, FAQ, CTA, media | CMS-authored public document | public SEO template | CMS-authored local generation | Owns complete authored public document | Validate complete payload, canonical origin, allowlisted destinations, and server-visible output. |
| Public service availability or live local inventory | Service/catalog backend | future SEO dynamic slots | not opened | CMS may author static fallback copy only | Define cache/freshness policy and prove that SEO output cannot show a false availability claim. |

## Classification By Data Lifetime

### CMS-Authored Static or Configuration Data

The manual-upload packages may expose only these categories as parameters:

- Portal title, visual theme, business vertical, profile, enabled modules,
  router mode, default route, initial light/dark mode, and generic copy.
- PIM routing configuration: API base, organization, product type code, and
  currency. These select a source; they are not catalog data.
- Public SEO content: brand, locality, metadata, canonical path, headings,
  sections, FAQ, CTA destinations, media references, and footer/legal links.
- Labels, empty/error copy, static service descriptions, and feature flags
  that do not grant access or create business facts.

CMS must not contain customer ids, user names, session values, access tokens,
entitlements, prices, order/proposal payloads, addresses, card data, payment
tokens, document URLs, provider data, Health data, or an authorization result.

### Dynamic Source Data

The following facts must be refreshed from their source before they are shown
as current: identity/scope, order and appointment state, proposal state,
prices/products, cart totals, checkout outcome, profile values, support
threads, Care entitlement/data, and live availability.

Each dynamic module owns a normalized envelope with an explicit UI state:
`loading`, `ready`, `empty`, `error`, `disabled`, `unauthorized`, or
`unavailable`. A module without an opened live contract must show the relevant
unavailable state in live mode; it must not receive fixture data as a fallback.

### Local Ephemeral State

The browser may own the current route, filter/sort state, open drawer, selected
tab, unsaved form input, mobile navigation state, light/dark preference, and
pending command presentation. It may retain an inspectable fixture transition
only in fixture mode.

Local state is not a source of truth for cart contents, order status, proposal
decision, appointment, profile mutation, payment, support message, Care
request, or entitlement. After a successful live write, it is replaced by the
authoritative readback.

## Dynamic Module Contract

Every dynamic entity family is added through this path:

```text
source system -> authenticated adapter -> normalizer -> module envelope -> component
                                     |                         |
                                     +-> command policy --------+-> authoritative readback
```

Before an adapter is marked `opened_live`, its implementation record must name:

1. The source owner and endpoint or transport.
2. Required session, customer, tenant, role, entitlement, and entity-scope
   checks.
3. Raw input schema and the stable normalized UI shape.
4. Loading, empty, error, unauthorized, disabled, and stale-result behavior.
5. Cache key, refresh/invalidation rule, and concurrency policy.
6. For each write: idempotency/retry policy, error response, and the exact
   returned readback that replaces optimistic/local state.
7. Browser and contract tests for authorization, malformed payloads, duplicate
   submit, lost scope, and source failure.

The existing `runtime/data/activation-contracts.json` remains the executable
inventory for Care and public SEO. Add the same level of evidence for every
new Orders, Proposal, Calendar, Checkout, Profile, Support, and live catalog
adapter before opening it.

## Commands And Readback

| Command family | Permitted live outcome | Required readback |
| --- | --- | --- |
| Order cancel/reschedule/book again | Updated order/appointment version and status | Returned current order or appointment, then route/module refresh. |
| Proposal approve/request revision/decline/select plan | Accepted or rejected versioned proposal decision | Returned proposal version, decision state, and any next action. |
| Cart changes and checkout | Persisted cart or created order; payment result is handled by PSP | Server-calculated cart/order state, order id/status, and payment reference only. |
| Profile address/preference updates | Persisted scoped profile change | Returned profile field/value/version. |
| Support send/read acknowledgement | Accepted message or acknowledgement | Returned message id/timestamp/state or updated unread count. |
| Care operation | Only the explicitly authorized operation | Source-specific entity state; sensitive data obeys the Health boundary. |

A spinner, closed drawer, toast, local field mutation, or a network `200` on
its own is never sufficient readback.

## Rollout Order

| Priority | Scope | Reason and gate |
| --- | --- | --- |
| P0 | Public SEO landing manual CMS package | Ship the complete authored landing with server-visible SEO, native CTAs, and no private/session dependency. |
| P1 | Dynamic public pricing block | The anonymous PIM price endpoint is proven on `dev-1` same-origin for Calm Harbor Spa. Add the block with `loading`, `empty`, and `error` states; CMS price rows are not a silent fallback. External origins remain blocked by CORS. |
| P2 | Public product/catalog block | Do not ship product cards from the price-comparison baseline. Open a catalog contract for product identity, category, media, availability, and destination first. Until then use CMS-authored service cards without price/inventory claims. |
| P3 | Authenticated portal foundation: host auth/session bridge, Orders read, Calendar read | Establishes an actual customer portal and validates the hosting boundary. |
| P4 | Proposals read and decisions; then Profile, cart, checkout, and support conversations | Direct commercial value first; payment, PII, and mutable workflow open source by source. |
| P5 | Care by vertical and optional public live availability | Care requires entitlement preflight and per-vertical contracts. Health remains closed until the full sensitive-data control set is proven. Availability needs freshness, locality, and SEO claim policy. |

At every priority boundary, review the data source rather than the screen: if
the required scope, normalized shape, or readback is absent, the corresponding
module remains `not_opened` even if its UI is already complete.

## Manual CMS Package Implications

The portal is one authenticated root template, not a separate CMS block for
each route. It exposes a small configuration surface and its router renders
the allowed private modules. Public SEO is a separate public root template;
it must never inherit portal session, shell, customer data, or hash routing.

For each manual-upload package, the export must provide its CMS template record,
`head.html`, `html.html`, `css.css`, `javascript.js`, `parameters.json`, a
preview, and upload instructions. The package must state which parameters are
CMS-authored configuration and which data is fetched at runtime. No deployment
may be represented as live merely because the CMS template was uploaded.

`customer-portal-calm-harbor-pim-staging` is the first live-data portal manual
package. It is intentionally narrower than an authenticated portal: only the
PIM-backed `pricing` and `products` modules are enabled, and its runtime asset
tree is uploaded under one same-origin static path on `dev-1`.

## Landing-First Composition

The first manual package is the public SEO landing. Its accepted design has a
public header, hero, trust strip, services, how-it-works, proof, pricing,
service area, reviews, FAQ, final CTA, and footer. These are split by data
authority, not merely visual section boundaries:

| Landing block | Authority | First release behavior |
| --- | --- | --- |
| Metadata, header, hero, trust, how-it-works, proof, area, reviews, FAQ, final CTA, footer | CMS-authored | Server-visible, validated authored content. FAQ structured data is generated only from that authored FAQ collection. |
| Service cards | CMS-authored editorial content | May show service name, benefit, and an authored destination. They must not claim live availability or inventory. A staging-only, named PIM snapshot is allowed only when shipped with its source artifact. |
| Pricing | Core PIM on `dev-1` same-origin | One dynamic `landing.pricing-pim` block. It normalizes PIM rows and renders `loading`, `ready`, `empty`, or `error`; in failure it displays no CMS-authored numeric price fallback. The P0 staging landing retains its named snapshot until this block is activated. |
| Product grid | Core PIM catalog when catalog contract is opened | Omitted initially. A CMS-authored service-card grid is not a product catalog and must not be labelled or styled as one. |

P0 is exported by `scripts/export-seo-public-manual.mjs` into
`dist/manual-upload/customer-portal-seo-public-*`. It produces a self-contained
JTE root record and split `root/` files from one validated authored document.
The committed `*-reference` package is explicitly `public-authored-test` and
must never be uploaded. A production manual package requires a complete
`public-authored` input and is regenerated rather than hand-editing HTML.

The public PIM pricing block is a separate optional manual block composed with
the SEO root, not a mutation of server-authored SEO content. Before it is
enabled, prove anonymous request authorization, CORS, cache/freshness behavior,
allowed organization/product-type/currency inputs, normalized output, and an
honest error state. Do not emit `Offer`/price structured data from a browser-
only response. Server-visible price structured data needs its own trusted
server source and freshness contract.

Each published landing uses one price authority at a time:

- CMS-only landing: no current numeric price claims; it may use explanatory
  pricing copy and a quote/booking CTA.
- PIM landing: `landing.pricing-pim` is the sole source for displayed current
  price rows. CMS may author its heading and empty/error labels, but not values.

This keeps SEO copy editable while preventing two competing definitions of a
price on the same page.

## Known Open Contracts

- The identity/session host bridge is not yet specified.
- Orders, proposals, appointments, cart/checkout, profile, support, and Care
  have no repository-proven live endpoint contracts.
- The current Core PIM Products path is a price-comparison baseline, not a
  complete product-catalog contract.
- The anonymous PIM price contract is proven only for `dev-1` same-origin:
  `POST /core-pim/public/{organization}/catalog/price-comparison.json` returns
  Calm Harbor Spa rows without a bearer token. It sends `no-store`; cross-origin
  preflight from `calmharborspa.com` is denied with `403`, so it is not yet an
  external-domain public SEO contract.
- Public SEO has no opened dynamic availability source and must remain
  CMS-authored rather than making availability claims from fixtures.

These are deliberate negative results. They prevent a manual CMS upload from
turning an attractive fixture surface into a false production integration.
