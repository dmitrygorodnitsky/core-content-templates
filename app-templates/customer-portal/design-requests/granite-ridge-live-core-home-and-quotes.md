# Live Core on the storm home screen and the Contracts list

Routes: `overview` (`/`), `proposals.list` (`/proposals`),
`proposals.detail` (`/proposals/:id`), `stormRetail` profile.
Status: the read path is built and proven against `dev-1` for organization
`SNOWLIMITLESS`. What is missing is presentation for the places where the
accepted design asks for facts Core does not hold.

The deployed Core model is recorded in
[`../content/cases/SNOW-VERTICAL-CORE-MODEL.md`](../content/cases/SNOW-VERTICAL-CORE-MODEL.md).
Two decisions frame every question below: **the Order is the contract**, and a
contract Document is derived from it, so one Order covers exactly one property;
and the quote request is written by an **anonymous form submit**, so the portal
never creates the customer, the property or the order.

## What Core answers today

A property is a `SNOW_REMOVAL_PROPERTY` Resource. Per customer the portal gets:

| field | source | notes |
| --- | --- | --- |
| name | `nls.en.NAME` | often a legal entity — `01953720 B.C. Ltd / c/o Sincere Real Estate Services Ltd` |
| address | Address entity | `address1`, `city`, `state`, `postalCode`; British Columbia, not Colorado |
| category | `PROPERTY_CATEGORY` | `COMMERCIAL`, `RESIDENTIAL`, `MUNICIPAL`, `STRATA`, `INSTITUTIONAL`, `INDUSTRIAL` |
| lifecycle state | `PROPERTY_LIFECYCLE` | `INITIAL`, `INSPECTION-REQUIRED`, `ACTIVE`, `INACTIVE` |

A quote is a `FIELD_SERVICE_ORDER` in workflow `GENERAL_FSM_ORDER`, carrying
`CLIENT`, `SERVICE_PROPERTY` and three dates. Its customer-visible states are
`QUOTE_SENT`, `QUOTE_VIEWED`, `CLIENT_APPROVED`, `DECLINED` and
`CUSTOMER_CHANGES_REQUESTED`.

There is **no** Invoice, Project, Task or Appointment record in the tenant, and
`SUPPORT_TICKET` has no workflow attached. The accepted empty states already
cover those, and the runtime uses them.

## 1. A property with no coordinates

Core addresses carry `address1`, `city`, `state` and `postalCode` and **no
latitude or longitude**. The map refuses a non-finite coordinate and renders no
pin, so nothing is misplaced — but the accepted home screen is built around the
map, and a live customer sees an empty map panel above a real property list.

Since 2026-09-11 the runtime answers this provisionally: a property is placed
from `COORD_LAT`/`COORD_LNG` or its address geocoded by Google, and is otherwise
listed without a pin. That answer is itself awaiting acceptance in
[`granite-ridge-google-property-map.md`](granite-ridge-google-property-map.md).

Needed: the accepted presentation for the map panel when no property can be
placed. Is it the weather-only panel it degrades to today, a property list that
replaces the map at this breakpoint, or a stated "addresses are not yet
geocoded" treatment? The tooltip, the pin legend and the `DayTimeline` all key
off placed pins and need the same answer.

The one geocoder in the product is the `address` control of the quote form,
which loads Google Maps when `FORM_MAPS_API_KEY` is set. Whether the portal may
geocode at read time is a product decision, not only a visual one.

## 2. The Contracts list assumes a shape Core does not have

The accepted `proposals.list` renders **one** proposal — `Proposal #GR-2049`,
`sent Dec 28`, `valid until Mar 31, 2026`, a portfolio map and a
`N of M decided` pill — over **many** sites, each with a measured lot size,
five per-area figures, a selected plan and a map position.

Core has one Order per property. There is no record that groups them, no
validity date, no measured area, no plan selection and no coordinate. Rendering
the accepted header from the fixture while the rows come from Core would present
invented facts as real, which `AGENTS.md` forbids, so the runtime leaves
`proposals` on fixtures and the module is not enabled in live mode.

Needed, in order of how much they block:

- the list header when the only true facts are a customer, a count and per-row
  states — no proposal number, no sent date, no validity;
- the site row without `lot` and `areas`; the accepted row leans on measured
  area to justify the price;
- the portfolio map without coordinates, same question as §1;
- whether the rollup (`Approved / Revision / Declined / Open`) survives when
  each row is an independent order rather than a line of one proposal.

The accepted footer copy — "Approved lines become live orders the moment you
confirm" — describes the opposite of the settled model, where the order exists
first and approval is a state on it. New copy is needed either way.

## 3. A quote the operator has not sent yet

`INITIAL`, `QUOTE_PREPARED`, `QUOTE_APPROVED_INTERNALLY` and
`CHANGES_REQUESTED` are operator-side states. The runtime withholds them and
counts them, because showing a customer a quote that has not been sent would
expose internal preparation.

All three quotes that exist today sit in `INITIAL`, so a real customer who has
just submitted the form sees an **empty** Contracts list and an
`A contract appears here once a quote is approved` card on the home screen.

Needed: the state that says "we have your request and are preparing your
quote". It is the first thing a customer sees after the flow the primary button
starts, and there is no accepted treatment for it. Whether it belongs on the
home screen, the Contracts list, or both, is part of the question.

## 4. After the anonymous submit

The primary button leaves the portal for the published form document at
`/pages/SNOWLIMITLESS/request-quote`. The form has its own accepted success
screen, but the visitor is signed out and the created records carry no user, so
there is no route back into the portal that would show them anything.

Needed: what the success screen promises, and whether it offers registration.
This overlaps `customer-experience-anonymous-intent-auth-resume.md`; the snow
tenant is the first place it becomes concrete, because the flow creates a
customer and a property before any account exists.

## Constraints

- Property names and addresses are customer data: they may never come from CMS
  or a fixture in live mode, and never appear in a URL or a query string.
- Absent data must render as absent. `Number(null)` is `0`, and a missing
  measurement must never become a zero-sized lot.
- The map is Google Maps, addressed with the public browser key on the root; a
  property with no coordinate must not fall back to the map centre.
- Reusable source: `ov-map`, `ov-card`, `ov-empty`, `ov-row`, `site-list`,
  `ProposalCard`, `EmptyState`, `PageHeader`, `status-badge`.
- Required widths: the accepted desktop, tablet and mobile breakpoints for
  `overview` and `proposals.list`.
