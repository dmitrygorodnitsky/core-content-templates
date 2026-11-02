# Limitless Snow Removal landing: illustration prompts for Codex

Nine slots of the public landing at `/pages/SNOWLIMITLESS/home`. Each prompt
below is ready to paste on its own.

Paths are relative to the repository root. To ship the art: save each file at
its target path, compress it with
`cwebp -q 78 -alpha_q 85 -m 6 -sharp_yuv -metadata none`, and then run
`node app-templates/customer-portal/scripts/upload-snow-landing-illustrations.mjs --live`,
`node app-templates/customer-portal/scripts/upsert-granite-ridge-staging-landing.mjs --dry-run`
and `--live`. The upload puts each file in the `SNOWLIMITLESS_LANDING` media
library and records its id in `assets/snow-landing/media.json`. The exporter
references each uploaded file as an IMAGE parameter and keeps the placeholder
for the others. It refuses a file that is not WebP, is not the exact size, is
over its byte limit, or was not uploaded.

Every prompt repeats the shared style so it works when pasted alone.

## 1. hero

```text
Draw one illustration and save it as app-templates/customer-portal/assets/snow-landing/hero.webp.
Slot: hero. Size: exactly 960 x 720 pixels, aspect ratio 4:3. Format: WebP, under 180 KB. Background: transparent; the art sits on a blue gradient from #27a6dd to #0e8fc4.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, calm winter morning, generous empty space, consistent with a set of nine.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, #d4eef4, #dee9f7, white, deep blue #0b5c80, and one warm accent #ff8a3d used only on the plow blade and lit windows.
Subject: a snow plow truck clearing a driveway in front of a small commercial building on a snowy morning, with soft hills behind and light snowfall. Compose it inside a rounded panel shape, with the main subject in the middle third.
Must not appear: text, letters, numbers, logos, brand marks, licence plates, street signs, people, faces, real landmarks, photographic textures.
```

## 2. service-snow-removal

```text
Draw one illustration and save it as app-templates/customer-portal/assets/snow-landing/service-snow-removal.webp.
Slot: service-snow-removal. Size: exactly 720 x 480 pixels, aspect ratio 3:2. Format: WebP, under 90 KB. Background: opaque, a soft sky of #dee9f7 to #cfe9f6; it must read on both a light card and a dark card #1b2230.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, calm winter morning, generous empty space, consistent with a set of nine.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, #d4eef4, #dee9f7, white, deep blue #0b5c80, and one warm accent #ff8a3d used only on the plow blade.
Subject: a snow plow pushing a curl of fresh snow across a parking lot, seen from the side, leaving a clean cleared strip behind it. It is also shown as small as 200 px wide, so keep the shape simple and readable.
Must not appear: text, letters, numbers, logos, brand marks, licence plates, people, faces, real landmarks, photographic textures.
```

## 3. service-de-icing

```text
Draw one illustration and save it as app-templates/customer-portal/assets/snow-landing/service-de-icing.webp.
Slot: service-de-icing. Size: exactly 720 x 480 pixels, aspect ratio 3:2. Format: WebP, under 90 KB. Background: opaque, a soft sky of #dee9f7 to #cfe9f6; it must read on both a light card and a dark card #1b2230.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, calm winter morning, generous empty space, consistent with a set of nine.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, #d4eef4, #dee9f7, white, deep blue #0b5c80, and one warm accent #ff8a3d used only on the spreader.
Subject: a small walk-behind salt spreader scattering rock salt across a cleared paved walkway, with a thin sheet of ice melting at the edge and one large simple snowflake in the sky. It is also shown as small as 200 px wide, so keep the shape simple and readable.
Must not appear: text, letters, numbers, logos, brand marks, product labels, people, hands, faces, real landmarks, photographic textures.
```

## 4. step-request

```text
Draw one spot illustration and save it as app-templates/customer-portal/assets/snow-landing/step-request.webp.
Slot: step-request. Size: exactly 240 x 240 pixels, aspect ratio 1:1. Format: WebP, under 30 KB. Background: transparent. It displays at 72 px, on a light card and on a dark card #1b2230, so it must stay readable at that size on both.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, consistent with a set of nine. Bold single object centered on a pale circle of #cfe9f6.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, white, deep blue #0b5c80, and one small warm accent #ff8a3d.
Subject: a map pin standing on a small snowy house roof, meaning "tell us the address".
Must not appear: text, letters, numbers, logos, street names, people, faces, photographic textures.
```

## 5. step-prepare

```text
Draw one spot illustration and save it as app-templates/customer-portal/assets/snow-landing/step-prepare.webp.
Slot: step-prepare. Size: exactly 240 x 240 pixels, aspect ratio 1:1. Format: WebP, under 30 KB. Background: transparent. It displays at 72 px, on a light card and on a dark card #1b2230, so it must stay readable at that size on both.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, consistent with a set of nine. Bold single object centered on a pale circle of #cfe9f6.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, white, deep blue #0b5c80, and one warm accent #ff8a3d used only on the arrows.
Subject: a bird's-eye plan of one property, meaning "we measure your property". A white square lot with rounded corners fills most of the circle, with one small deep blue house roof seen from directly above in its middle. One thick orange double-headed arrow runs along the bottom edge of the lot and a second along its left edge, like dimension lines on a plan. Use at most four shapes in total, large enough to recognise at 72 px. Check it at 72 px: it must read as a plot of land being measured, not as a device.
Must not appear: tape measures, rulers, tick marks, devices, screens, gadgets, boxes with a dial or button, text, letters, numbers, logos, prices, currency signs, people, faces, photographic textures.
```

## 6. step-accept

```text
Draw one spot illustration and save it as app-templates/customer-portal/assets/snow-landing/step-accept.webp.
Slot: step-accept. Size: exactly 240 x 240 pixels, aspect ratio 1:1. Format: WebP, under 30 KB. Background: transparent. It displays at 72 px, on a light card and on a dark card #1b2230, so it must stay readable at that size on both.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, consistent with a set of nine. Bold single object centered on a pale circle of #cfe9f6.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, white, deep blue #0b5c80, and one small warm accent #ff8a3d.
Subject: a sheet of paper with plain grey bars for lines and a large round check mark, meaning "review and accept online".
Must not appear: readable text, letters, numbers, signatures, logos, seals, stamps, people, hands, faces, photographic textures.
```

## 7. step-portal

```text
Draw one spot illustration and save it as app-templates/customer-portal/assets/snow-landing/step-portal.webp.
Slot: step-portal. Size: exactly 240 x 240 pixels, aspect ratio 1:1. Format: WebP, under 30 KB. Background: transparent. It displays at 72 px, on a light card and on a dark card #1b2230, so it must stay readable at that size on both.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, consistent with a set of nine. Bold single object centered on a pale circle of #cfe9f6.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, white, deep blue #0b5c80, and one red map pin #ea4335.
Subject: a simple browser window showing a small map with one red pin, meaning "follow your properties in your portal".
Must not appear: readable text, letters, numbers, web addresses, logos, people, faces, real map data, photographic textures.
```

## 8. service-area

```text
Draw one illustration and save it as app-templates/customer-portal/assets/snow-landing/service-area.webp.
Slot: service-area. Size: exactly 1600 x 500 pixels, aspect ratio 16:5. Format: WebP, under 150 KB. Background: transparent; it runs across the full width of a pale card in light mode and of a #1b2230 card in dark mode, so use shapes that read on both. It is also shown about 310 px wide on a phone, so keep the main shapes large.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, calm winter morning, generous empty space, consistent with a set of nine.
Palette: #0e8fc4, #27a6dd, #46b6e6, #cfe9f6, #d4eef4, #dee9f7, white, deep blue #0b5c80, and red map pins #ea4335.
Subject: a wide panorama of a generic coastal city in winter, and it must read at once as a city. In the middle, a cluster of modern downtown towers of different heights with snow on their roofs. To the left and right, lower apartment blocks and streets of houses with snowy roofs. Snow-capped mountains stand behind the city, and a calm strip of water runs along the front. Five red map pins stand above different parts of the city, spread evenly from left to right, none touching another. The buildings, the water and the ground run off both side edges and reach the bottom edge, with no oval island, frame or vignette. Keep the top sixth of the image empty. It must be a mood piece, not a real place or a map.
Must not appear: text, letters, numbers, place names, signs, billboards, scale bars, compass marks, logos, people, faces, real landmarks or a recognisable real skyline, photographic textures.
```

## 9. final-cta

```text
Draw one illustration and save it as app-templates/customer-portal/assets/snow-landing/final-cta.webp.
Slot: final-cta. Size: exactly 1600 x 400 pixels, aspect ratio 4:1. Format: WebP, under 140 KB. Background: transparent; it is the bottom band of a blue panel from #27a6dd to #0e8fc4, with buttons above it, and it runs edge to edge.
Shared style: flat modern vector illustration, soft rounded geometric shapes, gentle layered depth, no outlines, calm winter morning, generous empty space, consistent with a set of nine.
Palette: white, #cfe9f6, #46b6e6, deep blue #0b5c80, and one warm accent #ff8a3d used only on lit windows.
Subject: a wide snowy horizon with pine trees toward both ends, a few small houses with lit windows, and the middle kept low and quiet. Keep the top half of the image empty, and let the snow reach the bottom and side edges so it blends into the panel.
Must not appear: text, letters, numbers, logos, people, faces, vehicles with markings, real landmarks, photographic textures.
```
