# QUOTE-FORM-MULTI-ADDRESS

Read-only investigation, 2026-09-10, tenant `SNOWLIMITLESS` on `dev-1`.
Nothing was written to any environment.

## Answer

Yes — a Core form type can express a repeating value, but **only at the attribute
level**, by setting `multiselect: true` on a single attribute, whose value then
serialises as a JSON array inside `AttributeValue.value`; **an attribute group
cannot repeat**, so "N addresses, each with its own property type / size / risk
factors" is not expressible as a form type.

And a finding that changes the task: **the change has already been made on
dev-1.** The live `GET_QUOTE_` no longer carries `PROPERTY_ADDRESS`; it carries
`PROPERTY_ADDRESSES` with `multiselect: true`. The local snapshot in this repo is
stale. The remaining gap is the renderer.

---

## 1. The live form has already moved

`GET https://dev-1.servicewand.com/en/core-cms/api/form-type/GET_QUOTE_/get.json`
(anonymous, header `X-Organization-Code: SNOWLIMITLESS`) → HTTP 200, form type
`id: 2`, `optimistic: 0`:

| attribute | live | snapshot in `content/form-types/GET_QUOTE_.en.json` |
|---|---|---|
| `PROPERTY_ADDRESSES` | present, `multiselect: true`, `inputFormat: "address"`, `required: true` | absent |
| `PROPERTY_ADDRESS` | **absent from `attributes`** | present, `multiselect: false`, `inputFormat: "address"` |
| `ORGANIZATION_NAME` | present, required | absent |
| `SELECT_YOUR_PROPERTY_TYPE` | absent | present |
| `PROPERTY_SIZE` | absent | present |
| `RISK_FACTORS` | absent | present |

A new attribute group `PROPERTIES` ("Real estate properties", localised into 8
languages) holds `PROPERTY_ADDRESSES`.

Two live defects worth naming:

- `attributeOrder` still contains a row `{"attributeCode":"PROPERTY_ADDRESS","visible":true}`
  under group `EA849F15_9108_455F_9A05_F26BED67E5CD`, pointing at an attribute
  that no longer exists. Both renderers survive it — each drops a group whose
  resolved field list is empty (`portal-form.js:148`, `js/dynamic-form.js` group
  filter `.filter((entry) => Object.values(entry)[0].length > 0)`) — so the
  "Tell us about your property…" heading silently disappears rather than
  rendering blank. It should still be deleted.
- `GET_QUOTE_` on this tenant does **not** exist on `https://servicewand.com`
  (404 for both URL shapes). dev-1 is the only environment carrying it.

---

## 2. What the model can express

### 2.1 Repetition at the attribute level — yes, and it is in production use

`EntityTypeAttribute` (the shared Core shape used by form types, resource types,
order types and organization types alike) carries exactly one cardinality
control, a boolean:

- `/Users/imighty/Code/core-ui/src/shared/generated/core-cms/types.gen.ts:335-357` —
  `{ code, required, multiselect, freeValue, unique, className, nls, options,
  unitCategory, entityTypes, inputFormat, defaultValue, uiBehavior }`.
- `/Users/imighty/Code/core-ui/docs/domain-model/core.json`, class
  `com.pixelnation.common.domain.EntityTypeAttribute` — the same 13 fields,
  `multiselect : java.lang.Boolean`.

There is no `minItems`, `maxItems`, `repeatable`, `cardinality`, or nested
`attributes` field anywhere on it.

The **wire shape of a repeated value** is not a guess. Read live from
`POST core/api/organization/list.json` (Bearer, `X-Organization-Code:
SNOWLIMITLESS`), organization `id: 43`:

```
[1] SUPPORTED_LANGUAGES = {"value":["en","es"]}
[4] REGIONS             = {"value":["Burnaby","Vancouver","Richmond","Surrey", … ]}
[4] QUOTATION_MANAGER   = {"value":[1,2]}
```

and the declarations behind them, read from
`POST core/api/organization-type/list.json`:

```
[type 1 BASE]     SUPPORTED_LANGUAGES  multiselect=true  freeValue=true   className=java.lang.String  options=8
[type 4 OPERATOR] REGIONS              multiselect=true  freeValue=false  className=java.lang.String  options=0
[type 4 OPERATOR] QUOTATION_MANAGER    multiselect=true  freeValue=false  className=com.pixelnation.common.domain.ContactType  options=0
```

`REGIONS` is the exact declaration shape proposed for `PROPERTY_ADDRESSES` —
`multiselect: true`, scalar `java.lang.String`, **zero options** — and it holds
~20 free-text strings on a live entity today. So a repeating free-text list is
not theoretical; it is already stored and read back.

`AttributeValue.value` is `java.lang.Object` in the domain model
(`core.json`, class `com.pixelnation.common.domain.AttributeValue`), which is
what permits the array. Note that `types.gen.ts:194-199` types it as
`{ [key: string]: unknown }` — that is the OpenAPI generator collapsing a
free-form JSON value, not a statement that arrays are disallowed; the live reads
above show arrays.

`Form.attributes` is `{ [typeId]: { [attributeCode]: AttributeValue } }`
(`types.gen.ts:359-375`). One value slot per attribute code per type — so the
repetition has to live **inside** that single value. It does.

### 2.2 Repetition at the group level — no

`AttributeGroup` is `{ code, nls }` and nothing else:

- `types.gen.ts:168-176`
- `FormType.attributeOrder` is `Array<{ [groupCode]: Array<AttributeOrder> }>`
  and `AttributeOrder` is `{ typeId, attributeCode, visible }`
  (`types.gen.ts:188-193`, `:377-402`). One level of grouping, flat rows, no
  nesting, no instance index.
- The vendor's own reference documentation agrees. Core script
  `FORM_API_REFERENCE` (read live via `core/api/script/list.json`) documents
  `AttributeGroup` as `{code, name, order, nls}` and lists `multiValue |
  Boolean | Allow multiple selections.` as the only multiplicity control on a
  field. Core script `FORM_TYPE_ATTRIBUTE_GROUPS` describes groups purely as
  sectioning: *"Add groups for complex forms or multi-step forms… Set `order` so
  groups render predictably."* Nothing in the doc set mentions a repeating
  fieldset.

Corroborating negative: across the 287 attributes dumped from this tenant into
`/Users/imighty/Code/core-content-templates/app-templates/customer-portal/content/core-types/`
(account, appointment, document, invoice, order, order-item, project, resource,
task types), 34 declare `multiselect: true` and **zero** groups declare anything
resembling repetition.

Second corroborating negative, from the vendor's own admin UI: in
`/Users/imighty/Code/core-ui`, the group type is
`export type AttributeGroup = { code: string; } & TNlsAware;`
(`src/widgets/EntityAttributes/EntityTypeAttributes/model/types.ts:14-16`), the
group designer edits only `code` + `nls`
(`.../ui/components/GroupEditorModal/GroupEditorModal.tsx:31-34`), and the form
path is `attributes.<typeId>.<CODE>.value` with **no index segment**
(`src/widgets/EntityAttributes/TypedEntityAttributes/ui/AttributeRow.tsx:62`).
A repo-wide search for `repeatable`, `repeating`, `multiplicity`, `cardinality`,
`minItems`, `maxItems`, `fieldset` found no feature, no flag and no dead code.
A repeating attribute group would be new platform work, not a configuration.

### 2.3 The admin UI already draws a repeating scalar

This matters because it fixes the intended presentation and proves the shape is
supported end to end, not just tolerated by the API.

In core-ui the control dispatcher is
`src/widgets/EntityAttributes/AttributeValueEditor/ui/ValueEditor.tsx`. Its
`text` entry — which `java.lang.String` maps to via the className table in
`src/widgets/EntityAttributes/EntityTypeAttributes/lib/helpers.tsx:40-44` —
branches on multiselect first (`ValueEditor.tsx:85-90`):

```jsx
text: isMulti ? (
  <OptionSelector {...{ field, className, options, multiSelect, freeValue }} readonly={readonly} />
) : inputFormat === "textarea" ? (
```

and `OptionSelector.tsx:33` has a rule written for exactly our case:

```js
const canAddOption = className.includes("java.lang.String") && !options.length && multiSelect;
```

which enables `onCreateOption` on a `react-select` `CreatableSelect` with
`isMulti={multiSelect}` (`OptionSelector.tsx:108-141`) — removable chips the user
can type freely into. Note it fires on `freeValue || canAddOption`, so for
`java.lang.String` + `multiselect` + zero options, **`freeValue: false` does not
prevent free typing** — which is why the live `PROPERTY_ADDRESSES` declaring
`freeValue: false` is still editable by a manager in the admin UI.

Two limits of that admin control, relevant if anyone assumes symmetry: it applies
only to `editor: "text"` classes. For numeric, boolean and date classes the
`components` map at `ValueEditor.tsx:108-161` never consults `isMulti`, so
`multiselect` on those is silently dropped to a single scalar control.

### 2.4 What that costs: a repeated attribute carries no per-item detail

This is the real constraint, and it explains the live schema. The old form asked
`SELECT_YOUR_PROPERTY_TYPE`, `PROPERTY_SIZE` and `RISK_FACTORS` — all
per-property questions. Once the address becomes a list of 50, those three
questions have no place to attach: the model gives you one value slot per
attribute per submission, not one per list element. On the live form they have
simply been removed. *(That the removal was caused by the multiselect change is
my inference from the diff, not something I read in a changelog.)*

`multiselect` gives you a **list of scalars or a list of entity references**. It
does not give you a list of records.

### 2.5 The backend already consumes the list

Core script `WINTER_SERVICE_REGION_WORKFLOW_UTILS` (Java, 45 KB, read via
`core/api/script/list.json`), the `onEnter` side of workflow
`WINTER_SERVICES_QUOTATION_FORM` (`id: 49`, `entityType:
com.pixelnation.cms.domain.Form`, states `INITIAL → SUBMITTED → NOTIFIED →
PROCESSED | REJECTED`):

```java
private List<String> propertyAddresses(Form form) {
    List<String> addresses = new ArrayList<>();
    addPropertyAddresses(addresses, form.findFirstAttributeValue("PROPERTY_ADDRESSES"));
    return addresses;
}

private void addPropertyAddresses(List<String> addresses, Object value) {
    if (value instanceof Collection<?> values) { values.forEach(item -> addPropertyAddresses(addresses, item)); return; }
    if (value instanceof Object[] values) { for (Object item : values) addPropertyAddresses(addresses, item); return; }
    if (value == null) return;
    String address = value.toString().trim();
    …
}
```

It then calls script `WINTER_SERVICE_QUOTATION_CREATOR.createCustomerAccount`
with `"propertyAddresses"` bound to that `List<String>`. That script signature is
`createCustomerAccount(Integer organizationId, Integer formId, String
organizationName, String role, List<String> propertyAddresses, String notes,
String requesterEmail, String requesterPhone, String requesterFirstName, String
requesterLastName)`, throws `"PROPERTY_ADDRESSES is required"` on an empty list,
and for each string runs `addressService.resolveOrCreate(parseAddress(addressText))`
→ `AccountAddress` with the service-address type.

`parseAddress` splits on commas and pulls country, postal code, state and unit
out of the tail — i.e. it expects a **single formatted address line**, which is
exactly what Google Places `formattedAddress` yields from
`portal-form.js:895-897`. The scalar branch in `addPropertyAddresses` means a
single string still works, so a renderer that sends one address will not error —
it will silently cap the business flow at one property.

---

## 3. Recommended `GET_QUOTE_` attribute JSON

The live attribute is already correct. Keep it exactly as it stands:

```json
{
  "code": "PROPERTY_ADDRESSES",
  "required": true,
  "multiselect": true,
  "freeValue": false,
  "unique": false,
  "className": "java.lang.String",
  "nls": {
    "ar": { "NAME": "عناوين العقارات" },
    "en": { "NAME": "Addresses of properties" },
    "es": { "NAME": "Direcciones De Propiedades" },
    "fr": { "NAME": "Adresses Des Propriétés" },
    "he": { "NAME": "כתובות נכסים" },
    "kk": { "NAME": "Мүліктердің Мекенжайлары" },
    "ru": { "NAME": "Адреса Объектов Недвижимости" },
    "zh": { "NAME": "房产地址" }
  },
  "options": [],
  "inputFormat": "address"
}
```

Two edits I do recommend, neither of them to the attribute itself:

1. **Delete the dangling `attributeOrder` row.** Remove
   `{"attributeCode":"PROPERTY_ADDRESS","visible":true}` from group
   `EA849F15_9108_455F_9A05_F26BED67E5CD`. If the group is then empty, delete the
   group too.
2. **Consider `"inputFormat": "address country:ca"`.** `portal-form.js:73-77`
   parses `country:` into `includedRegionCodes` / `componentRestrictions`, and
   the backend already validates submitted addresses against the organization's
   `REGIONS` list, which for `SNOWLIMITLESS` is Metro Vancouver municipalities
   (Burnaby, Vancouver, Richmond, Surrey, …). Restricting autocomplete to `ca`
   would stop a client picking an address the workflow will reject. This is a
   product call, not a model requirement.

Do **not** reach for `className: "com.pixelnation.common.domain.Address"` here —
see §5.

The stale local snapshot
`/Users/imighty/Code/core-content-templates/app-templates/customer-portal/content/form-types/GET_QUOTE_.en.json`
should be refreshed from the live `get.json` response, and the assertions it
pins in `scripts/portal-form-check.mjs:97-125` updated with it.

---

## 4. What `portal-form.js` needs

**Its token DSL already covers this. Its `addressControl` does not.**

Run against the live schema, the current normaliser resolves the field to:

```
PROPERTIES  PROPERTY_ADDRESSES  kind=address  multiselect=true  required=true  choices=0  tokens.address=true
```

So the schema is understood — `multiselect` survives onto the field object — but
three places downstream ignore it:

| file:line | what it does | why it breaks |
|---|---|---|
| `runtime/forms/portal-form.js:94-113` (`fieldKind`) | `multiselect` is consulted **only** inside `if (choices.length)` (lines 96-99). With zero options it falls through to `if (tokens.address) return "address";` at line 104. | A repeating attribute resolves to the singular `address` kind. |
| `runtime/forms/portal-form.js:314-326` (`adopt`) | seeds `[]` only for `kind === "checklist" \|\| kind === "multiselect"` (line 317), otherwise `""` (line 324). | The value starts as a string, so it can never accumulate. |
| `runtime/forms/portal-form.js:789-811` (`addressControl`) | builds one `<input>` plus one map canvas, and `pick()` at `:843-850` assigns `self.setValue(field, formatted)` — a scalar. | One box, one address, scalar submitted at `:426` as `{ value: "…" }` instead of `{ value: [ … ] }`. |

`validateField` (`:359-381`) is already array-aware — line 367 joins arrays
before regex/length checks and line 363 treats `[]` as empty for `required` — so
required-validation of a list needs no change.

The submit path needs no change either: `:426` writes
`attributes[typeId][code] = { value: value }` verbatim, so handing it an array
produces the shape the backend reads. This matches the reference client
(`js/dynamic-form.js:1782`, `groupedAttributes[typeId][key] = { value }`, where
`getFieldValue` returns an array for multiselects at `:1570-1574`).

**The concrete work**, all inside `portal-form.js`:

1. In `fieldKind`, admit a repeating address before line 104 — resolve
   `attribute.multiselect && tokens.address` to a new kind (`address-list`), so
   the existing `address` path stays untouched for single-address forms such as
   the kitchen-sink fixture's `SITE_ADDRESS`.
2. In `adopt`, seed the new kind with `[]`.
3. Add a control that renders a list of committed addresses plus one live
   `addressControl` as the "add another" row, pushing each accepted
   `formattedAddress` onto the array and clearing the input. The existing
   `addressControl` is reusable as the entry row essentially as-is — the Places
   plumbing, the debounce, the suggestion listbox, the geocode fallback and the
   `country:` restriction all already work per-input; what it lacks is the
   commit-and-reset step and the surrounding list with per-row removal.
4. Decide the map. `upgradeAddress` (`:813-924`) creates one `maps.Map` per
   control and re-centres it on `pick`. With N addresses, either keep one shared
   map and drop a marker per committed address (it already builds markers at
   `:831`, it just replaces rather than accumulates them), or drop the map
   entirely for the list kind. One map per address will not scale to 50.
5. Scale. The spec's worst case is 50 addresses. `render()` (`:467-526`)
   re-renders the whole card on every value change, and `renderField` reattaches
   listeners each time. 50 rows plus a Places-enabled input is a re-render per
   keystroke-commit; worth measuring before shipping. *(Concern, not a measured
   result — I did not profile it.)*

No change is needed to `parseTokens`. `address` is already a first-class flag
(`:47`, `:67`) and `country:` already parses (`:73-77`).

**On the shape of the control.** The admin UI's answer to the same declaration is
a chips list (§2.3). For a plain string list that is right; for addresses it is
not quite enough, because each entry needs Places autocomplete and a
commit-on-select. The pattern that fits is a committed list of rows plus one
live `addressControl` as the entry row — chips-like in outcome, autocomplete-like
in interaction.

**Two things neither reference implementation gives us.**

The vendor's public renderer cannot draw this at all: `_parseTokens`
(`js/dynamic-form.js:96-115`) has no `address` token, and for a scalar
`java.lang.String` with no options it goes straight to the
`// String: textarea or input` branch at `:857` and emits a single
`<input type="text">` regardless of `multiselect` (which it reads at `:699` and
then uses only in the `hasChoices` and `type === "entity"` branches).

And `inputFormat: "address"` has **no reference implementation anywhere** — it is
a convention, not a platform feature. core-ui treats `inputFormat` as free text
(`src/widgets/EntityAttributes/EntityTypeAttributes/model/schema.ts:20`,
`inputFormat: z.string().optional()`, rendered as a plain `TextField`), and the
only tokens any core-ui code compares against are `"textarea"`
(`ValueEditor.tsx:90`, `DashboardPane.tsx:654`), `"select-or-create"`
(`EntityEditor.tsx:59`) and `"PRINT_ACTION"`
(`EntityTypePrintActions.tsx:97,316`). `"address"` appears in core-ui only as
seed data — `scripts/dev/seeds/contractInformationTypes.json:37-39` declares
`BILLING_ADDRESS` as `className: "java.lang.String"` with
`"inputFormat": "address"`, the same pairing as `PROPERTY_ADDRESSES` and the same
pairing spec §9.2 asks for. So the convention is shared and deliberate; the only
code that honours it is ours.

---

## 5. Alternatives, if per-address detail is required later

Ranked by cost. Only the first is what the tenant runs today.

1. **Ask the per-property questions once, apply to all.** What the live form now
   does. Zero cost, loses per-property fidelity. Note the drift this created:
   `WINTER_SERVICE_REGION_WORKFLOW_UTILS` still reads
   `attributeText(form, "PROPERTY_SIZE")` for the manager notification email, and
   `WINTER_SERVICE_QUOTATION_CREATOR.validateInputs` throws
   `"PROPERTY_SIZE must be a positive square-foot value"` — but `PROPERTY_SIZE`
   no longer exists on the form type. See §7.

2. **Parallel arrays, positionally correlated.** `PROPERTY_ADDRESSES[i]` ↔
   `PROPERTY_SIZES[i]` ↔ `PROPERTY_TYPES[i]`, each its own `multiselect: true`
   attribute. Expressible today, no model change. Cost: the model guarantees
   nothing about equal lengths or ordering — the renderer must enforce the
   invariant and the backend must re-zip it, and any admin editing the
   submission in the Core UI can desynchronise the columns silently. Fragile in
   proportion to the number of parallel columns.

3. **One JSON blob in a single String attribute.** A `textarea`- or
   hidden-backed attribute holding `[{address, size, type, risks}, …]`. Cost:
   opaque to the CMS admin UI and to `FORM_QUERY_FILTERS`, no per-field
   validation, no localisation of the inner labels, and every consumer needs its
   own parser. It also defeats the whole `EntityTypeAttribute` machinery.

4. **A child `FormType` per property.** One `QUOTE_REQUEST` parent plus N
   `QUOTE_REQUEST_PROPERTY` children carrying a correlation attribute back to the
   parent form id. This is the only option that gives genuine per-record
   structure with real validation. Cost: N+1 submissions through
   `core-cms/api/form/submit.json`, a correlation attribute the anonymous client
   must be trusted to set, no transactionality across the N calls, and the
   workflow has to wait for or reconcile late children. `FORM_TYPE_INHERITANCE`
   covers `parents` for *shared fields*, not for parent/child *instances* — there
   is no instance-level parent link on `Form` (`types.gen.ts:359-375` has no
   `parent`), so the correlation would be a plain attribute.

5. **Entity-valued multiselect** — `className:
   "com.pixelnation.common.domain.Address"` (or `…rm.domain.Resource` for real
   Properties) with `multiselect: true`. The model permits it: `Address` is a
   first-class attribute class (5 attributes in this tenant use it, e.g.
   `resource-type/PROPERTY.153.json` → `ADDRESS`, required, `multiselect: false`),
   `EntityTypeAttribute.entityTypes` exists to constrain which types are
   pickable, and `QUOTATION_MANAGER = {"value":[1,2]}` proves entity multiselects
   round-trip as id arrays. **But it is wrong for an anonymous public form**: the
   value is a reference to an entity that must already exist. The reference
   renderer's entity branch (`js/dynamic-form.js:766-792`) builds a `<select>`
   from `attr.options` with `multiple` when multiselect — it can pick, never
   create. And `WINTER_SERVICE_REGION_WORKFLOW_UTILS.toAddressId` confirms the
   read side expects an `Address`, a `Number` id, or a `Map` with `id`. An
   anonymous prospect has no Address entities to point at. Worth revisiting for
   admin-side forms only. *(`DIAGNOSTICS_AWARE.PHYSICAL_ADDRESS` combines the
   `Address` class with `freeValue: true`, which might mean an entity attribute
   can accept a new value rather than a reference — I could not test that without
   writing, so treat it as unverified.)*

   core-ui closes this off from the other end. Its className table marks Address
   `disableInputFormat: true, disableUnit: true, disableEntityType: true,
   editor: "entity"`
   (`src/widgets/EntityAttributes/EntityTypeAttributes/lib/helpers.tsx:166-171`),
   so an Address-classed attribute renders as a dropdown of **already-existing**
   Address rows, the attribute designer hides the `inputFormat` field entirely
   (`AttributeEditorModal.tsx:566`) — meaning you could not even declare
   `inputFormat: "address"` on it — and inline create-new is disabled in multi
   mode (`EntityEditor.tsx:246-254`). The structured address form
   (`src/shared/config/templates/chunks/addressEditor.ts`) exists only on the
   standalone Address screen, never on the attribute path.

   No attribute anywhere in this tenant combines `className: …domain.Address`
   with `multiselect: true`.

---

## 6. What I could not determine

- **I could not enumerate the tenant's form types.** The supplied read token has
  no authority on `core-cms`: every authenticated endpoint returned HTTP 401 with
  an empty body — `core-cms/api/form-type/list.json`,
  `core-cms/api/form/list.json`, `core-cms/api/document/list.json`,
  `core-cms/api/entity-type/list.json`, and even
  `GET core-cms/.well-known/oauth-protected-resource`. The same token returns 200
  on `core/api/script/list.json` (165), `core/api/organization/list.json` (4),
  `core/api/workflow/list.json` (49), `core-acct/api/account/list.json` (661) and
  `core-rm/api/resource/list.json` (691). Header variants (`X-API-Key`,
  lowercase `authorization`, omitting `X-Organization-Code`) all 401 too. I
  therefore read form types **anonymously by code** via
  `/{locale}/core-cms/api/form-type/{code}/get.json`, which is open. Only
  `GET_QUOTE_` (id 2) and `PRE_SEASON_INSPECTION` (id 1) resolved; ten other
  guessed codes 404'd. The ids being 1 and 2 suggests those may be all of them —
  that is a guess, not a reading.
- **I did not test a write.** That a `{"value": ["a","b"]}` payload is *accepted*
  by `form/submit.json` for a `multiselect` String attribute is inferred from
  three independent readings — the live organization values are stored that way,
  the vendor renderer emits arrays for multiselects, and the backend reader
  handles `Collection`. It is not directly observed, because observing it would
  create a Form.
- **Whether `unique: true` interacts with `multiselect`** (dedupe within the
  list, or uniqueness across submissions) is not documented anywhere I read. The
  backend dedupes addresses case-insensitively in application code
  (`normalizePropertyAddresses`), which suggests it does not rely on `unique`.
- The `FORM_*` Core scripts document field names (`type`, `minLength`, `pattern`,
  `group`, `order`, `visible`, `editable`, `multiValue`) that **do not match** the
  serialised model (`className`, `inputFormat`, `multiselect`, `attributeOrder`).
  Where they disagree I trusted the live payload and `core.json`. Which is
  authoritative for a *write* is untested.
- **The generated TypeScript understates the model on both sides.** Both
  `core-cms/types.gen.ts:194-199` and `core/types.gen.ts:93-98` declare
  `AttributeValue.value` as `{ [key: string]: unknown }`, which admits neither
  the strings, numbers, booleans nor arrays that the API actually returns.
  core-ui only escapes the mismatch because `attributes` is declared
  `type: "custom"` and passed through unreshaped
  (`src/entities/Core/lib/helpers/createMutationMapping/transformEntity.ts:49-54`)
  and because `ValueEditor`'s `field` prop is typed `any`. Do not read the
  generated types as a constraint on what a value may hold.

---

## 7. Noticed outside the contract

Two live inconsistencies that the multiselect change appears to have opened, both
on the automation side rather than the form:

- **`PROPERTY_SIZE` is gone from the form but still required by the script.**
  `WINTER_SERVICE_QUOTATION_CREATOR.validateInputs` throws
  `"PROPERTY_SIZE must be a positive square-foot value"` when it is null or ≤ 0,
  and `WINTER_SERVICE_REGION_WORKFLOW_UTILS` prints it into the manager
  notification via `attributeText(form, "PROPERTY_SIZE")`, which now yields `""`.
- **Spec §4.2 items 3–6 are not implemented.** The spec says every service
  address becomes a Real Estate Resource with three Orders — 50 addresses → 150
  quote orders. In `WINTER_SERVICE_QUOTATION_CREATOR`, `createCustomerAccount`
  creates the Account and one `AccountAddress` per address and **no Resource at
  all** (the script never references `IResourceManager`, `new Resource`, or
  `SNOW_REMOVAL_PROPERTY`), while `createQuotations` loops
  `for (QuoteKind quoteKind : QuoteKind.values())` — three orders **per form**,
  not per address — and the `Order` it builds carries no address, only
  `QUOTE_REQUEST_FORM_ID`, the client id, and a free-text note. So today a
  50-address submission still yields 3 orders.
