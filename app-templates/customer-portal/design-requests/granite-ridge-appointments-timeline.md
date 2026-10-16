# Appointments timeline, and retiring Shop and Services

Route: `appointments` (`/appointments`), `stormRetail` profile.
Status: mockup on fixtures. Nothing here reaches a backend.

## The table

Five columns, as asked: Resource, Address, Appointment state, Est time, Actual
time. Resource is the sortable column — its header toggles ascending and
descending, and within one resource the rows stay in chronological order so a
crew's day reads as a route rather than a shuffled list.

The date filter is a chip row: **All dates** plus one chip per day that
actually has a visit, each carrying its count. A day with nothing booked gets
no chip, so the filter never leads to an empty table by accident.

The two time columns are the point of the screen. Est is the planned window;
Actual is what happened. A scheduled visit shows `—`, a finished one shows the
real window, and a visit that has started but not finished shows an open end
(`5:38 AM – …`). Without at least one of each the columns look redundant, so
the fixture carries three completed visits, one in progress and ten scheduled.

## Where the two links go

The address opens the property, the state and service open the visit, and the
map tooltip's *Go to Property* finally lands somewhere — it used to drop the
customer on the contracts list.

`property.detail` at `/properties/:id` answers "what is this place": the
contract it belongs to and that contract's plan, its service zone, the quoted
lot size and per-visit price when the address is one of the four on the
current quote, any open request, the current or next visit, and the last one.

`visit.detail` at `/visits/:id` answers "what happened here": resource, state,
property, address, and the estimated against the actual window.

Two structural notes. Properties now carry `contract`, which they did not —
the map, the quote sites and the contracts were three lists that never
referenced each other. And the visit page lives at `/visits/:id`, not
`/appointments/:id`, because the spa already answers that path with its own
appointment detail; sharing it would make the match order decide which page a
customer gets.

## Days are indices, not dates

Appointments carry `dayIndex` into the weather timeline, not a date string.
That is what lets the live forecast re-date the whole week without visits
falling off the timeline — the same reason the Overview timeline was changed.
The table reads its day label off whichever timeline is active.

## Contracts the backend has to provide

| fixture path | what it is |
| --- | --- |
| `appointment.resource` | who is assigned — a person or a crew |
| `appointment.est` | `{ start, end }` planned window |
| `appointment.actual` | `{ start, end }`, `end` empty while the visit runs, absent before it starts |
| `appointment.state` | `SCHEDULED`, `EN_ROUTE`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `appointment.dayIndex` | which day of the active window the visit falls on |

`EN_ROUTE` and `CANCELLED` are rendered but not exercised by the fixture; they
exist because a dispatch system will produce them.

Times are pre-formatted clock strings today. The portal parses them only to
sort, so a real payload should carry timestamps and let the portal format.

## Shop and Services are retired

Every service is ordered through the quote form, so `products`, `services` and
`checkout` are out of the `stormRetail` profile, the cart is gone from the top
nav, and the primary action leaves for the form.

Three consequences worth knowing:

1. `checkout` had to go with `products`. The exporter already refused products
   without checkout; leaving checkout enabled alone would ship an add-to-cart
   flow with nothing to add.
2. The primary action used to be gated on the `services` module being enabled,
   which would have hidden the button entirely. It is now gated on the profile
   declaring a primary action.
3. `pricing` stays enabled. It is not in the nav and is reached from the
   accepted `Manage plan` action on the storm home rail.

The destination is the CMS parameter `PORTAL_REQUEST_FORM_URL`, rendered into
`data-portal-request-form-url` on the root element. An operator can repoint the
button in the CMS without a rebuild.

It is accepted only over https. The origin allow-list that guards the other
external links is deliberately not applied here: the address and the allow-list
would arrive through the same trusted channel, so demanding both adds no
security and one more way to misconfigure — change the parameter, forget the
list, and the button dies silently.

Everything else fails closed to an inert button: plain http, a `javascript:`
scheme, an empty value, and — the case worth naming — an unset parameter, which
JTE renders as its own literal marker rather than as an empty string.

## Open

1. **The shipped default is a placeholder.** It points at
   `https://dev-1.servicewand.com/snow-removal--request-quote`, a guess at
   where `PORTAL_FORM_DOCUMENT` is published. Correcting it no longer needs a
   rebuild — set `PORTAL_REQUEST_FORM_URL` in the CMS. The default that travels
   with the package lives in
   `content/cases/granite-ridge-snow.customer-portal-fixture.json`.
2. **The button label.** The brief said the button becomes "request form". It
   ships as `Request a quote`, because the form is `GET_QUOTE_` and the
   reference mockup said "Request Free Quote" — a button labelled after the
   document rather than the outcome reads oddly. It is one attribute,
   `data-portal-primary-cta-label`, if the brief meant it literally.
3. Both detail pages read the fixture directly. A real one would fetch a
   property and a visit by id, and would have to answer for an id that no
   longer exists — today that renders an empty state rather than a 404.
