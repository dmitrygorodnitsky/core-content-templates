# Weather provider: what Xweather would give the Overview map

Status: evaluation. Nothing in the runtime calls Xweather. The Overview map is
still a drawn surface on fixtures.

Xweather is Vaisala's weather platform, formerly AerisWeather. It sells one
subscription that covers both the data API and the map imagery.

## The three things this screen needs, and where each comes from

| what the screen needs | Xweather product | note |
| --- | --- | --- |
| the seven day frames | Weather API `/forecasts` | daily filter, per lat/lon |
| the pin colour per zone | Weather API `/forecasts` per zone centroid | one call per zone, not per property |
| the weather layer under the pins | Raster Maps tiles, or MapsGL | see *Two ways to draw it* below |
| `Storm warning` in the legend | `alerts` layer, category `winter` | US, Canada and Europe |
| whether a visit is actually triggered | Weather API `/roadweather/conditions` | see *The trigger* below |

### Day frames

`GET https://data.api.xweather.com/forecasts/{lat},{lon}?filter=day&limit=7`

The daily period carries everything the header panel already renders:

| our field | their field |
| --- | --- |
| `temp` | `maxTempC` / `minTempC` / `avgTempC` |
| `label` | `weather` — the forecast phrase |
| `kind` | derived from the coded weather and cloud fields |
| `stats[]` Precipitation | `pop` |
| `stats[]` Wind | `windSpeedKPH` + `windDirDEG` |
| `stats[]` Feels like | `feelslikeC` |
| `stats[]` Humidity | `humidity` |

It also returns `snowCM`, which the fixture does not carry yet and which is the
number this business actually acts on — the contract trigger is snowfall depth,
not temperature. Worth adding to the frame.

### The trigger

`/roadweather/conditions` returns the road surface condition as one of `DRY`,
`MOIST`, `WET`, `SLUSH`, `SNOW`, `ICE`, plus the road surface temperature, at
15-minute steps for two hours and hourly to 24 hours.

That is a much better answer to "will a crew go out tonight" than a general
forecast, and it is what the storm calendar's `trigger` flag is really
describing. Coverage is road-network based, so it needs checking against the
Front Range residential streets this tenant services — a lot for a subdivision
may not sit on a covered road segment.

`/roadweather/analytics` adds snow and ice thickness. That is closer still to a
de-icing decision, and it may be priced separately.

## Two ways to draw it

**Raster tiles.** `https://maps.api.xweather.com/{client_id}_{client_secret}/{layers}/{z}/{x}/{y}/current.png`
— 256×256 PNG in the usual spherical Mercator, so any base map takes them. Up to
ten layers can be composited into one request, which keeps the request count
down. Snow-relevant layer codes: `snow-depth`, `fsnow-depth`, `fqsf-1h`,
`fqsf-accum`, `precip`, `radar`, `fradar`, `alerts` with a `winter` category.

**MapsGL.** WebGL vector rendering, `@xweather/mapsgl`, with controllers for
MapLibre GL, Mapbox GL, Leaflet and **Google Maps**. Included in the same
subscription. This is the current product — the older JavaScript SDK with
`InteractiveMapApp` is deprecated.

The Google Maps controller matters here: the public form already takes a Google
Maps browser key as a CMS parameter for address autocomplete, so the portal can
run one map provider instead of two.

## Authentication, and whether it can be a CMS parameter

A `client_id` + `client_secret` pair, passed as query parameters on every
request. Their own examples put both in a browser URL. The gate is a
**namespace** registered with the key — the top-level domain or subdomain it may
be used from — validated before the API answers.

So it behaves like the Google Maps browser key we already ship: it is public by
design and protected by origin, not by secrecy. That means the same shape works
— a CMS parameter on the template, with the parameter description mandating a
namespace restriction.

Two conditions on that:

1. Register a **separate** key whose namespace is the portal domain. Never ship
   the key a backend uses.
2. The word `secret` in `client_secret` will make someone assume it is safe to
   put a server key there. The parameter description has to say plainly that
   this key is public and origin-scoped.

## Cost, and why the zone design matters

Billing is a single pool of "accesses" covering both data calls and map imagery.
The free Developer tier is 15,000 accesses a month with no card and no expiry.
The paid entry point is €300/month for 1,000,000 accesses, with overage above
that.

The free tier is **not** restricted by endpoint. Xweather states it carries
"full access to every endpoint" — all 65, including road weather, lightning,
hail, the observations archive and climate normals — and Raster Maps needs no
separate Maps subscription. What the free tier limits is volume, and two other
things:

- **Webhooks are excluded.** "Webhooks are a premium feature and require a
  separate subscription not included in our standard Xweather plans." So a
  demo key polls; it cannot be pushed to. That matters for auto-dispatch, not
  for this screen.
- **Overage is US/Canada only.** Elsewhere the limit is raised by contacting
  sales, not by adding a card.

Whether MapsGL specifically works on a free key is unconfirmed: its own docs
say it "requires an active Xweather Weather API and Maps subscription", while
the Raster Maps guide points free developer accounts at the same product.
Raster tiles are the safe assumption for a demo.

Xweather does not publish per-product access multipliers. One figure surfaced
outside the pricing pages — a five-minute unlimited MapsGL session costing 150
accesses — and it needs confirming with their sales before anyone sizes this.

What is already decided in our favour: the map takes its pin colours from
`timeline[].zones`, one forecast per service zone, not one per property. At the
fixture's density that is 4 calls instead of 24, and it stays 4 as the portfolio
grows. Had the contract been per-property, this integration would have been
priced per customer property.

Still unpriced and worth pinning down before committing:

- does scrubbing to another day refetch imagery, and does that bill again;
- does a raster tile cost the same as a data call;
- what a page load costs end to end, at our zoom and map size.

## What we do not have yet

- **Coordinates.** Properties carry `x`/`y` percentages for the drawn map.
  Forecasts are per lat/lon. The addresses need geocoding — and the cheapest
  moment to do that is at capture: the form's `PROPERTY_ADDRESS` field already
  runs Google Places autocomplete, which returns a lat/lng with the selected
  place. Storing it then avoids a geocoding pass later.
- **Zone definitions.** `north` / `central` / `south` / `west` are fixture
  labels. A real zone needs a centroid to forecast against, and a rule for
  assigning a property to one.
- **A units decision.** The API returns both metric and imperial on every field.
  The portal renders `stats[]` verbatim and does no conversion, so whoever fills
  the contract picks the unit.
- **Caching.** A seven-day daily forecast does not change every minute. Whatever
  serves this to the portal should cache per zone per day, or the access pool
  pays for every page view.

## Questions for Xweather

1. Per-product access multipliers — data call, raster tile, MapsGL session.
   This is the one number that decides whether a tiled map is affordable: at
   10–20 tiles per view, a per-tile charge caps the free tier near a thousand
   page views.
2. Whether MapsGL runs on a free developer key, or only on a paid plan.
3. Whether `/roadweather` covers residential and private-lot addresses or only
   the mapped road network, in the Denver Front Range specifically.
4. Whether `/roadweather/analytics` is inside the standard subscription.
5. Whether a browser-namespaced key can be restricted to specific endpoints, or
   whether any key that draws maps can also drain the data quota.
6. Cache and redistribution terms for the tiles.
