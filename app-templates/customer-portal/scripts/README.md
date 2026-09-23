# Customer Portal Scripts

This directory is intentionally a flat, stable CLI surface. Internal source is
organized elsewhere; script paths stay stable for documentation, skills, CI,
and operator commands.

| Prefix or entrypoint | Purpose |
| --- | --- |
| `customer-experience-*`, `create-customer-experience.mjs`, `build-customer-experience.mjs` | Configure, compile, and validate the four-surface family |
| `export-*`, `generate-*`, `build-calm-harbor-target-runtime.mjs` | Generate owned runtime/CMS artifacts |
| `build-fixture-portal-runtime.mjs`, `export-fixture-portal-manual.mjs` | Compile and package a fixture-only demonstration portal for one registered case |
| `build-live-portal-runtime.mjs`, `export-live-portal-manual.mjs` | Compile and package a live, signed-in portal root from a source under `../cms/` |
| `portal-manual-package.mjs` | Library, not an entrypoint: the file, style and head mechanics shared by the live and Calm Harbor portal exporters |
| `upsert-*.mjs` | One operator entrypoint per deliverable: build, export, check, then create-or-update the BlockTemplate by code |
| `export-*-landing-blocks-manual.mjs` | Compile a tenant public landing into a CMS family: one root plus independently editable section blocks |
| `export-live-landing-manual.mjs`, `granite-ridge-staging-landing-manual-check.mjs` | Compile and guard a live public landing from a source under `../cms/`: one root template, no children |
| `export-portal-form-manual.mjs`, `portal-form-check.mjs` | Compile and guard the universal Core form document rendered in the portal design language |
| `core-*-adapter-check.mjs`, `pim-adapter-check.mjs` | Deterministic adapter contracts |
| `core-*-live-check.mjs` | Explicit live staging probes; may create real records |
| `snow-core-inventory.mjs` | Read-only enumeration of the winter-services types, workflows and records; snapshots them under `../content/core-types/` |
| `core-snow-adapter-check.mjs`, `snow-live-overview-check.mjs` | Deterministic contracts for the live snow property/quote reads and the live home-screen seam |
| `property-map-check.mjs` | The storm home property map against a stubbed `google.maps`: pins, popup anchored or docked, per-property forecast, geocode cache, the keyless list, and the day timeline badges |
| `core-snow-live-check.mjs` | Live read-only probe of one customer's properties and quotes on staging |
| `snow-contracts-check.mjs` | The Contracts package model: the customer-scope order list and agreement document normalized with absent data, grouped by property, with decisions and the rollup |
| `snow-portal-shell-check.mjs` | The live snow shell: the customer Account gate whatever the module list, no placeholder route and no action without a configured destination, the bell dot, route rewriting, Sign out from the header and the mobile menu, the spa gates unchanged, the sign-in route that a signed-in User with access never sees, and the signed-in sign-in card, which is never blank |
| `snow-portal-public-entry-check.mjs` | The landing as the snow portal's public entry: every decision over the opt-in, the session and the account gate, and the real boot of `runtime/src` in worker threads against the shipped root — who leaves for the landing and with which reason, who never does, what Sign out stores for the Core callback, the history writes around sign-in, a jump back to `#/login`, and a page restored from the back/forward cache |
| `snow-account-profile-check.mjs` | The snow profile: one server-scoped read of the customer Account with its contacts and typed addresses, its normalizer and fixture data, and every page state |
| `export-client-review-manual.mjs`, `client-review-check.mjs` | Compile and guard the anonymous quotation and agreement review document |
| `snow-magic-link-mappings.mjs` | Dry-run-first, optimistic-lock guarded update that adds the typed-entity `attributes` bag to the Account, Order and Document grant profiles used by snow client review |
| `*-visual-check.mjs`, `visual-acceptance.mjs` | Browser-based visual evidence |
| `s6-*`, `s7-*`, `config-behavior-check.mjs`, `route-smoke.mjs` | Broad CMS/runtime regression gates |

Generated output must be changed through its owning build/export script, never
by editing `../dist/` directly. Builders must not read `../dist/` or a generated
tenant package as an upstream source.

`granite-ridge-fixture-check.mjs` and `calm-harbor-fixture-check.mjs` pin one
demonstration tenant each. They assert that the case fixture, the profile it
selects, every fixture adapter payload, and the case-vertical guard stay
coherent without a browser.

The fixture portal pair is generic. `build-fixture-portal-runtime.mjs` bundles
`runtime/src/app.js` with the fixture data modules left in place, the opposite
of `build-calm-harbor-target-runtime.mjs`, and refuses to emit a bundle that
does not contain its case. `export-fixture-portal-manual.mjs` refuses any
source that leaves fixture mode, claims an authentication contract, carries an
`account`/`pim`/`auth` block, enables a module its profile does not own, or
enables products without checkout.

The live pair is its counterpart. `build-live-portal-runtime.mjs` bundles
`runtime/src/app.js` with every fixture data module aliased to its `live-*`
stub and refuses a bundle that still carries a fixture marker;
`build-calm-harbor-target-runtime.mjs` is that builder with the Calm Harbor
output path. `export-live-portal-manual.mjs` refuses a source that leaves live
data mode, lacks the Core OIDC or customer Account contract, names a service
base that is not a same-origin path, enables a module its profile does not own
or a PIM module without a PIM contract, carries a key it does not ship,
ships an operator-owned parameter with anything but the `#` placeholder, which
the runtime reads as not set, or makes the landing its public entry without a
landing address on an allowed https origin or with a sign-out return other than
that landing with `?portal=signed-out`.

`upsert-granite-ridge-portal.mjs` chains the four steps for the snow tenant and
is dry-run by default. `--live` refuses to run without an explicit `--base-url`,
and `--skip-build` verifies the package on disk still matches the sha256 digests
in its own manifest, so a hand-edited package is refused rather than uploaded.
The upsert itself is delegated to `../../landing-page/scripts/upload-cms-family.mjs`,
which resolves the template by code and never writes template parents, include
markup, enabled templates, or PageContext records.

`upsert-granite-ridge-staging-portal.mjs` chains the same four steps for
`CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING`, built from
`../cms/granite-ridge-snow.customer-portal-staging.json`. With `--skip-build`
it also verifies the upload payload against the manifest and refuses an
operator-owned parameter that carries anything but `#`.
`granite-ridge-staging-portal-manual-check.mjs` re-exports that package into a
throwaway directory, asserts its invariants and drives every refusal.

`granite-ridge-portal-manual-check.mjs` re-exports the package into a throwaway
directory and asserts the fixture invariants: a JTE-safe root whose only
parameters are the operator-owned form address, Google browser key and map ID,
no Google key shipped, no service base, no OIDC contract, no tenant
organization, a noindex head, and an exporter that still refuses live data mode,
an escape from `dist/manual-upload/`, and products without checkout.

`property-map-check.mjs` loads the map module against a hand-rolled DOM and a
stubbed `google.maps` (Map, OverlayView, LatLng, LatLngBounds, Geocoder). It
asserts pin placement and colouring, one map load across re-renders, the popup
anchored to its pin with close, Escape and focus return, the popup docked below a
map narrower than 648 px with the same focus, Escape, weather and Go to Property,
and moved between the two only when a stubbed `ResizeObserver` reports the map
crossing that width under an open popup, the property forecast fetched once on
open with the area forecast as its fallback, geocoding once per address with only
successes cached in `localStorage`, and the list that replaces the map when there
is no key or Google rejects it. It also renders the overview and reads
`routes.css` and `responsive.css` to keep the timeline badges reading "4 visits":
no rule may make the badge a flex or grid box, and tablet and mobile still hide
the word.

`granite-ridge-landing-manual-check.mjs` guards the snow landing family. It
re-exports into a throwaway directory and asserts that every child records the
root as its parent, that every declared parameter is referenced and every
referenced parameter is declared, that no block calls a backend or names a Core
service or a deployment host, that the three portal destinations ship empty and
fail closed, and that the runtime URL guard accepts only absolute https.

`export-live-landing-manual.mjs` is that landing's live counterpart: it
compiles a source under `../cms/` into one JTE root with no children, because
the uploader never composes child includes. It refuses a key it does not ship,
a missing or empty copy value, copy with surrounding whitespace, the `#`
placeholder or a character CMS would insert unescaped (`<`, `>`, `&`, `"`, a
backtick, `${` or a control character), a destination that is not an absolute
https address in canonical form on `https://dev-1.servicewand.com`, an address
with credentials or a query, a fragment on any address but sign-in, a city
listed twice, a parameter without a value, and an output outside
`dist/manual-upload/`. `granite-ridge-staging-landing-manual-check.mjs` rebuilds
the package in memory and compares it with `../dist/` byte for byte, asserts the
brand, the three destinations, `noindex,nofollow`, the dropped trust, proof,
pricing and reviews sections, no forbidden claim or demonstration copy, and the
same cities as the portal's service geography, runs the runtime in a `vm`
against stubs of the shipped markup so that only `?portal=signed-out` and
`?portal=no-access` show a notice and `#` disables its links, and drives every
exporter refusal. `upsert-granite-ridge-staging-landing.mjs` chains rebuild,
repackage, that check and the upsert by code through `upload-cms-family.mjs`.
It is dry-run by default, `--live` refuses to run without an explicit
`--base-url`, `--skip-build` refuses a package that differs from a fresh build,
and it never creates or changes a PageContext.

`upsert-portal-form.mjs` chains regenerate, check and upsert for the form
document and is dry-run by default. Beyond the shared staleness gate it refuses
to upload a package whose `FORM_API_BASE_URL`, `FORM_TYPE_CODE` or
`FORM_ORGANIZATION_ID` carries a value: a deployment target belongs in CMS, not
baked into the uploaded template. An update no longer clears them: the uploader
keeps whatever CMS holds for a parameter the package ships empty, and names
every parameter it kept and every one still empty on both sides.

`portal-form-check.mjs` loads `runtime/forms/portal-form.js` in an isolated
`vm` context and asserts the whole field contract without a browser: the Java
class to field-type mapping, every `inputFormat` token including masks that
contain spaces, mask application and completeness, `attributeOrder` winning over
`attributeGroups`, inherited attributes keeping their parent type id,
`visible:false` attributes never rendering yet still submitting while ungrouped
attributes still render, locale fallback, and that every renderable kind but the
repeating address appears in the committed fixture. Against a stubbed
`google.maps` that models the `loading=async` bootstrap, where classes appear only
once `importLibrary` resolves, it drives the Places data API, the legacy
Autocomplete and the Geocoder, and asserts that an attribute declaring
`coordinates-of:<address code>` never renders, submits one JSON entry per current
address that has a location, follows every add, edit and removal in both address
controls, and leaves a keyless submission unchanged. A browser-like press, where
mousedown moves focus and a click is lost on an element a re-render removed,
proves that the first click on a suggestion lands, that typed text survives any
re-render so Continue commits what is on screen, and that Enter or `+` asks the
Geocoder for the committed string without any blur. A script that fails to load
or a library import that fails leaves a plain input that still submits. It also refuses a renderer that gains
`new Function`, `eval` or `innerHTML`, and a stylesheet that hardcodes a colour
instead of using a portal token.

`customer-experience-login-check.mjs` and
`customer-experience-2fa-check.mjs` protect the accepted Core Auth transfer
contracts. Their visual companions require Playwright and compare accepted and
compiled pages with a strict zero-diff gate.
