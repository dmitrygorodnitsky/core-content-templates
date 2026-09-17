# Overview home — data the backend must supply

Route: `overview` (`stormRetail` profile, Granite Ridge fixture case).
Status: mockup on fixtures. Nothing on this screen reaches a backend yet.

## What the screen is

A portfolio dashboard for a customer who owns more than one property. It
answers four questions above the fold: what is the weather doing to my sites,
what is scheduled, what do I owe, and what is open.

The fixture carries 24 properties on purpose. At four pins the layout tells you
nothing about whether the design survives a real portfolio; at 24 it forces the
pin, the tooltip and the legend to work at density.

## Timeline is days, not hours

Seven day frames starting at today. `‹` and `›` move the selection one day;
they are disabled at the ends. Selecting a day changes the map overlay, every
pin colour, and the weather panel in the page header. There is one weather
readout on the screen, in the header, so the timeline row stays a pure day
picker.

Below `vw-mobile` the arrows are hidden and the seven days are tapped directly.

## Contracts the backend has to provide

None of the following exists in Core today. Each is a separate ask.

| fixture path | what it is | note |
| --- | --- | --- |
| `overview.weather.timeline[]` | 7 day frames: `day`, `date`, `kind`, `temp`, `label`, `note` | `kind` is one of `clear`, `snow`, `freezing`, `storm` |
| `…timeline[].stats[]` | four `{label, value}` measures per day | rendered verbatim; the portal does not compute or convert units |
| `…timeline[].zones` | forecast `kind` per service zone for that day | this is what colours the pins; a per-property forecast would work too and is a strictly larger payload |
| `overview.properties[].zone` | which zone a property sits in | |
| `overview.properties[].x` / `.y` | position on the map, in percent | placeholder for real coordinates; the map is a drawn surface, not a map provider |
| `overview.properties[].appointment` | `state`, `service`, `when`, and for scheduled visits `time` and `date` | `IN_PROGRESS` renders the En Route ring |
| `overview.properties[].ticket` | open ticket, if any | an open ticket outranks the zone forecast and paints the pin red |
| `overview.invoices.outstanding[]` | `number`, `amount` (number), `due`, `state` | `state` is `OVERDUE`, `DUE_THIS_MONTH` or `DUE_LATER`; the portal sums and formats, so amounts cannot arrive pre-formatted |
| `overview.invoices.paidThisMonth[]` | invoices settled in the current billing month | its own bucket, not part of outstanding |
| `overview.contracts[]` | `number`, `plan` | the description is not shown on this screen |
| `overview.support[]` | `title`, `status`, `when`, `tone` | `tone` drives the dot and the status colour |
| `overview.banner` | `title`, `copy`, `action` | tenant copy, not a shared string in the route |

## Overdue is the loudest thing on the page

Asked for by the operators: customers in this business let invoices run, and the
debt has to nag. The Invoices widget is therefore full width, sits directly
under the map ahead of everything else, and carries two reds — a red card edge
around a red-filled alert block with the overdue total at 38px, the invoice
count, a payment warning and a solid red action.

The widget lists no individual invoices. Three columns carry the whole picture
— total outstanding, due this month, paid this month — and every figure is
summed from the invoice rows rather than authored, so the columns cannot drift
apart. With no overdue invoice the alert block and both reds disappear and the
card is calm.

## The timeline says which days a visit happens

A weather forecast alone does not tell a customer when someone will actually
turn up. Each day in the timeline now carries the number of visits booked for
that date, derived from the properties' appointments, and a day with no visit
stays deliberately blank.

The timeline stays attached to the map rather than becoming a fifth widget,
because selecting a day is what repaints the map.

## What the legend means

The legend names every colour a pin can take, which is four weather kinds plus
`Issue opened`. Service state is deliberately not a pin colour — a property
with a crew on site keeps its weather colour and gains a ring, and the full
state is in the tooltip. Without that split the map would need nine colours.

## Open

1. The top nav in the reference mockup carries `Properties` and `Appointments`
   as nav items and `Request Free Quote` as the primary action. The runtime
   still ships the accepted `stormRetail` nav. Changing it is a profile
   decision, not a styling one, and is not part of this mockup.
2. `Go to Property` has no property route to open; it currently lands on the
   contracts list.
3. The map is a drawn surface. If this becomes a real map, the pin, the
   tooltip placement and the zone overlay all become the provider's problem and
   this screen's CSS for them goes away. Xweather is the provider under
   evaluation — see overview-weather-provider-xweather.md for what its API
   supplies against the table above, and what it does not.
4. On mobile the `Real-time conditions` chip can sit over a pin, because the
   map keeps its full pin set at 375.
