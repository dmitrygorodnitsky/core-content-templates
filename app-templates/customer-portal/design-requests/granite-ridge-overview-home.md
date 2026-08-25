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
| `overview.invoices` | `outstanding[]` and `lastPaid` | amounts are pre-formatted strings today |
| `overview.contracts[]` | `number`, `plan` | the description is not shown on this screen |
| `overview.support[]` | `title`, `status`, `when`, `tone` | `tone` drives the dot and the status colour |
| `overview.banner` | `title`, `copy`, `action` | tenant copy, not a shared string in the route |

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
   this screen's CSS for them goes away.
4. On mobile the `Real-time conditions` chip can sit over a pin, because the
   map keeps its full pin set at 375.
