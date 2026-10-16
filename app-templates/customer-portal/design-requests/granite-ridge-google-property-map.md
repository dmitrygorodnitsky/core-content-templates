# Storm home: the property map on Google Maps

Route: `overview` (`stormRetail` profile), card `property-map`.
Status: built on 2026-09-11 without an accepted design, reusing `ov-pin`,
`ov-tip`, `ov-tip__tag`, `ov-empty` and the legend. Every state below needs
acceptance or a replacement.

## Why it changed

The team decided on 2026-09-11 to stop drawing Xweather map imagery: a view of
the 1040×560 six-layer image cost 60 accesses against four for the forecasts.
The card is now a Google Maps JavaScript API map, and the weather moved into the
property popup. Pins still take their colour from the zone forecast for the
selected day, so the legend, the issue red and the en-route ring are unchanged.

## States that have no accepted presentation

1. **Map loading.** A plain surface with `Loading map…` until the Google script
   and the map are ready.
2. **No map.** Without `PORTAL_MAPS_API_KEY`, or when Google rejects the key or
   the script fails, the canvas is replaced by a scrolling list: pin glyph in the
   pin colour, name, address, the zone weather label for the selected day, and
   the status tag. Selecting a row opens the same popup inline under the row.
   With no properties at all the list becomes `No properties yet`.
3. **Not on the map.** With a map, a property that has neither stored
   coordinates nor a geocodable address is listed under the map in the same list
   pattern, headed `Not on the map` with a count. A live property also sits here
   while its address is being geocoded.
4. **Popup weather**, a block between the visit line and `Go to Property`:
   - loading: `This property · {day}` and `Loading forecast…`;
   - this property: its own forecast phrase, temperature and trigger note;
   - area forecast: the zone's kind and the day's temperature when no property
     forecast is possible (sample conditions, no coordinate, no Xweather key);
   - failed: the area forecast plus `This property’s own forecast is unavailable right now.`
   The previous `{day} · {temp}` tag in the popup is gone.
5. **Attribution.** `Weather · Xweather`, or `Sample conditions` for fixture
   weather, under the header weather panel, under the timeline, and inside the
   popup weather block. The `Live conditions · Xweather` chip over the map is gone.
6. **Popup placement.** Below the pin, or above it in the lower part of the map;
   beside the pin when neither fits; clamped inside the map. At 375 the 288px
   popup covers most of a 320px-tall map and its own pin.

## Dynamic data

| field | source |
| --- | --- |
| pin position | `property.lat`/`lon` (fixture), `COORD_LAT`/`COORD_LNG` (Core), or a geocoded address cached in `localStorage` |
| pin colour, row weather | `timeline[day].zones[property.zone]`, or the frame kind when there is no zone |
| popup weather | Xweather `forecasts` for the property's point rounded to 0.01°, fetched once when the popup first opens |
| initial viewport | `serviceGeography.map.center` and `.zoom`, then fitted to the pins |

## Questions for design

- Is a list the right no-map state, or should the card collapse to the timeline?
- Should the popup dock under the map at mobile widths, as the drawn map did?
- Where should `Not on the map` sit when most of a live book is still unplaced?
- Is the attribution needed three times, or once per card?

## Constraints

- The Google key is public and referrer-restricted; with no key no Google script
  is requested.
- Property addresses are sent to Google's Geocoding API and property points,
  rounded to roughly a kilometre, to Xweather. Neither ever enters a portal URL.
- Required widths: the accepted desktop, tablet and mobile breakpoints for
  `overview`.
