# Calm Harbor Product Media Prompt Pack

## Purpose

This pack defines coherent source imagery for Calm Harbor product collections.
It produces three useful assets per retail product:

1. `primary` — clean ecommerce packshot;
2. `detail` — texture, ingredient, or packaging detail;
3. `ritual` — product used in a calm at-home setting without identifiable
   people.

Generated assets are candidates, not backend truth. After review, approved
files must be uploaded to the media owner, assigned to the exact Product code,
ordered explicitly, and supplied with alt text. Do not place generated ratings,
certifications, prices, claims, or readable packaging copy inside an image.

## Shared Art Direction

Use this prefix for every prompt:

> Premium editorial product photography for Calm Harbor Spa, quiet coastal
> wellness aesthetic, warm ivory limestone, pale sea-glass green, muted berry
> accent used sparingly, soft north-window daylight, gentle realistic shadows,
> tactile natural materials, restrained luxury, contemporary Austin day-spa
> identity, photorealistic, high-end ecommerce art direction, accurate product
> scale, no people unless explicitly requested.

Use this negative prompt for every asset:

> no readable text, no misspelled label, no logo imitation, no price, no badge,
> no medical claim, no before-and-after, no watermark, no border, no collage,
> no duplicated container, no floating product, no excessive flowers, no
> tropical resort cliché, no glossy black luxury background, no neon colors,
> no hands with anatomical errors.

Master output: 2400×3000 portrait (4:5), subject inside the central 70% safe
area. Also export a 2400×1600 landscape crop (3:2) and 1600×1600 square crop.
Keep the same container shape, material, cap, and color across all views of one
Product code.

## Portal Reuse And Order Thumbnails

Do not commission a separate photograph just for an Order row. Reuse the
approved source image associated with the ordered entity:

- retail Order: the Product `primary` square crop;
- service Order: the Service landscape master with an additional centered
  1600×1600 crop;
- package/series Order: the ProductModel collection hero square crop;
- no explicit backend association: no photograph; the portal uses its neutral
  no-media fallback.

Every approved master therefore needs a 1600×1600 export with the meaningful
subject inside the central 70% safe area. The backend/read model, not the
browser, selects which approved media represents an Order. Never choose an
image by matching an order title, type, price, or filename.

## Collection Hero Prompts

### `CHS_MODEL_TIDELINE_BODY` — Tideline body collection

> [Shared art direction] A coherent family of five unbranded matte ivory and
> smoked sea-glass body-care containers: slender 100 ml oil bottle, 180 ml
> cream jar, 200 ml scrub jar, 250 ml wash bottle, and 10 ml pulse-oil roller.
> Arranged at varied heights on warm limestone with one folded natural linen
> cloth, a cedar sprig, and a small translucent dish of sea salt. Soft side
> light, generous negative space, muted berry detail only on one small cap ring,
> front three-quarter camera angle, collection campaign photograph. [Negative]

Alt: `Tideline body collection of oil, cream, scrub, wash, and pulse oil on warm stone.`

### `CHS_MODEL_STILLWATER_SKIN` — Stillwater skin collection

> [Shared art direction] Five coordinated fragrance-free skincare containers:
> low cleansing-balm jar, fine-mist bottle, 30 ml serum dropper, 50 ml barrier
> cream jar, and 150 ml cleansing-milk pump. Frosted sea-glass and warm ivory
> materials, subtle condensation on the mist bottle, a shallow water reflection
> and one smooth pale stone, clinical clarity softened by spa warmth, no flowers,
> front three-quarter collection campaign photograph. [Negative]

Alt: `Stillwater skin collection of cleanser, mist, serum, and moisturizers in frosted bottles and jars.`

### `CHS_MODEL_HARBOR_BATH` — Harbor bath collection

> [Shared art direction] A wide mineral bath-soak jar and a kraft-fiber box with
> two visible unbranded herbal bath sachets, placed beside a small ceramic bowl
> of mineral salts and dried oat tops on pale limestone near the edge of a calm
> bath, soft steam in the distant background, dry packaging in sharp focus,
> quiet evening daylight, no candles, no person. [Negative]

Alt: `Mineral bath soak and herbal bath tea beside a calm bath and a ceramic bowl of salts.`

### `CHS_MODEL_SIGNATURE_RITUALS` — Signature rituals

> [Shared art direction] Calm Harbor treatment-room still life representing a
> series of spa rituals: neatly folded warm ivory towels, ceramic oil bowl,
> facial brush, smooth basalt stones, botanical compress, and a low treatment
> bed entering the background. Soft window light, ample walking space, no guest,
> no practitioner, no staged rose petals, architectural editorial photograph,
> landscape 3:2 master. [Negative]

Alt: `Quiet Calm Harbor treatment room prepared for massage, facial, and body rituals.`

## Product Shot Matrix

For each row, append the scene direction to the shared art direction and shared
negative prompt.

| Product code | Primary packshot direction | Detail direction | Ritual direction |
| --- | --- | --- | --- |
| `CHS_BODY_001` | Slender 100 ml smoked sea-glass body-oil bottle with ivory pump, upright on limestone, cedar leaf and one curl of citrus peel. | Macro of golden lightweight oil forming one clean drop beside the bottle shoulder. | Bottle on a linen-covered bedside tray after use, warm towel and cedar sprig, no hands. |
| `CHS_BODY_002` | Low 180 ml warm-ivory cream jar with sea-glass lid, open jar plus closed lid, oat and sea-buckthorn accents. | Macro of one soft cream swipe showing rich but airy texture. | Jar beside folded linen after a bath, soft morning light, no person. |
| `CHS_BODY_003` | 200 ml frosted jar of fine sea-mineral scrub, ivory lid, small ceramic dish of salt and juniper. | Macro of mineral crystals suspended in botanical oil, realistic fine grain. | Open jar and wooden scoop on dry bath ledge, no water splashes on product. |
| `CHS_BODY_004` | 250 ml muted sea-glass pump bottle, clean linen ribbon and coastal herb stem kept secondary. | Close crop of low-foam pearly wash texture on wet pale stone. | Bottle in a minimal stone shower niche, diffuse steam, no person. |
| `CHS_BODY_005` | 10 ml amber pulse-oil roller with ivory cap, lavender, cedar chip, and vetiver root in restrained arrangement. | Macro of glass roller ball with a controlled bead of clear oil. | Roller on a bedside book and linen cloth in blue-hour light, no readable book text. |
| `CHS_SKIN_001` | 90 ml cleansing-balm jar in warm ivory glass, lid beside it, one small botanical oil seed. | Macro of translucent balm melting from solid to silky oil on a glass spatula. | Jar beside a clean damp face cloth and ceramic basin, no face or hands. |
| `CHS_SKIN_002` | 80 ml frosted fine-mist bottle with sea-glass cap and subtle condensation. | Backlit macro of a fine mist cloud beside the nozzle, product remains sharp. | Bottle on a cool stone vanity beside a small bowl of water, morning light. |
| `CHS_SKIN_003` | 30 ml frosted serum bottle with ivory dropper, minimal centella leaf accent. | Macro of a single silky serum drop suspended from a glass pipette. | Serum beside a simple mirror edge and folded cotton cloth, no reflected person. |
| `CHS_SKIN_004` | 50 ml low frosted jar with pale sea-glass lid, compact substantial form. | Macro cream ribbon showing cushiony barrier-cream texture without bubbles. | Closed jar on a bedside vanity in soft evening light, no medical props. |
| `CHS_SKIN_005` | 150 ml warm-ivory cleansing-milk pump with a faint rosewater tint in the frosted lower body. | Macro of fluid cleansing milk on a small glazed ceramic dish. | Bottle beside a soft cotton cloth and one pale rose petal, restrained and not romanticized. |
| `CHS_BATH_001` | Wide 300 ml mineral-soak jar, smoked sea-glass, ivory lid, ceramic salt scoop. | Macro of coastal mineral crystals with small cedar fragments, dry and realistic. | Closed jar on bath ledge with distant soft steam, product remains dry and legible as a form. |
| `CHS_BATH_002` | Kraft-fiber box and two compostable 120 ml-equivalent herbal sachets, oat and calendula visible through one mesh sachet. | Macro of oat, calendula, and lavender blend inside natural fiber mesh. | One sachet steeping in a ceramic bowl beside the bath, box safely away from water. |

## Service Imagery Prompts

Use landscape 3:2 masters with the treatment environment as the subject. Avoid
identifiable faces and avoid claims about outcomes.

- `CHS_GROUNDING_MASSAGE`: treatment bed, folded towel, ceramic oil bowl,
  basalt stones, soft side light; practitioner hands may enter frame only as a
  natural, anatomically correct preparation detail, no guest face.
- `CHS_CUSTOM_FACIAL`: facial bed prepared with bowls, brush, warm compress,
  magnifying lamp kept subtle, botanical skincare textures, no clinical claim.
- `CHS_HARBOR_RESET`: wider treatment-room composition combining massage oil
  and facial tools in clearly ordered stations, generous negative space.
- `CHS_SEASONAL_BODY_RITUAL`: botanical compress, mineral bowl, body brush, and
  folded towels reflecting a restrained late-summer palette.
- `CHS_DEEP_TIDE_MASSAGE`: grounded treatment-room view with bolsters, warm
  towel, and oil, stronger directional light but still calm.
- `CHS_QUIET_SHOULDERS`: seated treatment setup with supportive cushion,
  folded neck towel, and quiet window light, no identifiable guest.
- `CHS_BOTANICAL_RENEWAL_FACIAL`: ceramic mask bowl, fan brush, serum dropper,
  warm compress, fresh green botanical accent used sparingly.
- `CHS_SALT_CEDAR_BODY_POLISH`: mineral scrub bowl, cedar sprig, body brush,
  and warm towel on limestone, texture-rich close environment.

## Approval Checklist

- Container continuity is exact across primary/detail/ritual images.
- Crop survives 4:5 card, 1:1 thumbnail, and 3:2 collection hero.
- No generated text or product claim is visible.
- No identifiable person is implied to be a customer or reviewer.
- Alt text describes only visible content.
- Approved filenames begin with the Product or ProductModel code, followed by
  `primary`, `detail`, `ritual`, or `collection`.
