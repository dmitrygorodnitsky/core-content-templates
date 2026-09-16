# Quotation flow — what is implemented against spec §4.2

Status: read from `dev-1` as `SNOWLIMITLESS` on 2026-09-10. Read-only; nothing
was created, updated or transitioned. Script line numbers refer to the script
content as it was read that day.

Spec: `quotation-contract-client-activation-flow.md`, §4.2 `onEnter(SUBMITTED)`.

## Verdict

The automated quote-request flow creates the customer account and its addresses,
issues an access grant, and emails the requester a link to a public account page.
It creates **no service property** and **no quotation order**. The method that
would create orders exists but nothing calls it; the nine quote orders on dev-1
were produced by invoking it by hand on 2026-09-02. Any failure in the automated
step is written to a log while the form still reads `PROCESSED`.

## What the automated flow does today

Form type `GET_QUOTE_`, workflow `WINTER_SERVICES_QUOTATION_FORM` (id 49, Java):

```text
INITIAL → SUBMITTED → NOTIFIED → PROCESSED
                   ↘ REJECTED  ↘ REJECTED
```

| state | hook |
| --- | --- |
| `SUBMITTED` | `workflowUtils.validateServiceRegion(entity, context)` |
| `NOTIFIED` | `workflowUtils.sendQuotationNotification(entity, context)` |
| `PROCESSED` | `workflowUtils.createQuotations(entity, context)` |
| `REJECTED` | `workflowUtils.sendQuotationRequesterRejectedNotification(entity, context)` |

`workflowUtils` is script `WINTER_SERVICE_REGION_WORKFLOW_UTILS` (id 169). The
`PROCESSED` call chain:

1. `createQuotations` (line 111) schedules `createQuotationsAfterCommit(formId)`
   with `transactionUtils.runAfterTx`.
2. `createQuotationsAfterCommit` (line 691) loads the form input, calls
   `executeQuotationCreation`, builds `accountUrl(result)` and sends the
   requester notification.
3. `executeQuotationCreation` picks a node with `CORE`, `CORE-PIM` and
   `CORE-BILL` capabilities and calls `submitQuotationCreation`.
4. `submitQuotationCreation` dispatches script `WINTER_SERVICE_QUOTATION_CREATOR`
   (id 176) method **`"createCustomerAccount"`** (line 874). It is the only
   method name dispatched by string anywhere in script 169.
5. `createCustomerAccount` in script 176 (lines 191–262) validates the
   organization, form, addresses, email, phone and role; resolves or creates the
   account through `resolveFormAccount`; issues `issueAccountReadGrant`; and
   returns `formId`, `accountId`, `accountCode`, `accountCreated`,
   `accessToken`, `accessExpiresAt` and `addressIds`. It does not create an
   order or a resource and does not call `createQuotations`.
6. Back in script 169, `accountUrl` builds
   `publicAccountPageUrl() + "?accountId=" + id + "#token=" + token`, and the
   requester receives it through the processing email template.
7. The whole job runs inside `catch (Exception e)` that only logs
   `"Customer account processing failed for form {}"`.

## What spec §4.2 requires, against what exists

| spec §4.2 | implemented |
| --- | --- |
| 1. create the client Account | yes — `resolveFormAccount` |
| 2. create Address records | yes — one `AccountAddress` per submitted address |
| 3. a Real Estate Resource for every service address | **no** — neither script references a resource |
| 4. link each Resource to the Account through its `ACCOUNT` attribute | **no** — follows from 3 |
| 5. three Orders — Monthly, Seasonal, Per Service — for every address | **no** — not called from the flow; see gap 2 |
| 6. link the Orders to the Account and the Property | partial — `CLIENT` only, no property |
| 7. notify the Service Provider Manager | yes — at `NOTIFIED` |

## Gaps

1. **No service property is created.** Script 176 and script 169 contain no
   reference to a resource, `IResourceManager` or `SNOW_REMOVAL_PROPERTY`. The
   newest `SNOW_REMOVAL_PROPERTY` on dev-1 is resource 908, created 2026-08-07,
   before any of these forms existed. Closed in code on 2026-09-16 by script
   200; it has never run.
2. **Quotation creation is not wired into the workflow.** Script 176 exposes a
   public `createQuotations` (line 265) that does create orders, but nothing
   dispatches it: the `PROCESSED` hook shares its name and dispatches
   `createCustomerAccount` instead. The naming along the chain —
   `createQuotations`, `createQuotationsAfterCommit`,
   `executeQuotationCreation`, `submitQuotationCreation` — describes order
   creation that does not happen.
3. **When it is run, `createQuotations` works per form, not per address.** It
   loops `for (QuoteKind quoteKind : QuoteKind.values())` (line 304) with
   idempotency keyed on the source form (`existingOrders(sourceFormId)`, line
   301). It sets `CLIENT` and `QUOTE_REQUEST_FORM_ID` and no `SERVICE_PROPERTY`.
   A fifty-address request would yield three orders, none tied to an address.
4. **`createQuotations` needs a property size the form no longer collects.**
   The size is a method parameter, not read from the form, and
   `validateInputs` (lines 349–363) throws
   `"PROPERTY_SIZE must be a positive square-foot value"` without it. The
   current `GET_QUOTE_` has no `PROPERTY_SIZE`, and the per-property
   measurements are unset on 629 of 630 properties. The 2026-09-02 run passed
   75 000 for all three forms, including form 1, which has no size at all — so
   the three sets of totals are identical.
5. **Failures are silent.** The after-commit job catches every exception into a
   log. A form reads `PROCESSED` whether or not anything was created. Closed in
   code on 2026-09-16 for the property step, which now lands the form in
   `PROCESSING_FAILED`; the account and e-mail steps still only log.
6. **Form hygiene.**
   - `GET_QUOTE_.attributeOrder` still lists `PROPERTY_ADDRESS`, a deleted
     attribute, as the only row of group `EA849F15_9108_455F_9A05_F26BED67E5CD`;
     renderers drop the empty group, so its heading "Tell us about your
     property…" no longer appears.
   - Script 169 still prints `PROPERTY_SIZE` into the manager notification
     (lines 366 and 587); on current forms that line is empty.

## Observed on dev-1

Every `GET_QUOTE_` form, all on workflow 49:

| form | created | state | contract | `PROPERTY_SIZE` | addresses | orders |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 09-02 08:33 | `PROCESSED` | current | — | 1 | 3, created 18:07 |
| 2 | 09-02 10:48 | `REJECTED` | previous | 75000 | 1 | 0 |
| 6 | 09-02 11:32 | `PROCESSED` | previous | 75000 | 1 | 3, created 17:54 |
| 7 | 09-02 12:12 | `PROCESSED` | previous | 75000 | 1 | 3, created 18:01 |
| 17 | 09-04 14:26 | `REJECTED` | current | — | 2 | 0 |
| 18 | 09-04 14:32 | `PROCESSED` | current | — | 2 | **0** |
| 19 | 09-04 14:36 | `PROCESSED` | current | — | 2 | **0** |

- The nine orders created since 2026-09-01 are all `WINTER_SERVICES_ORDER` in
  `INITIAL`, all on account 694, all with `SERVICE_PROPERTY` unset, three per
  `QUOTE_REQUEST_FORM_ID` 1, 6 and 7. Each set totals 2444.72, 6687.9 and
  26751.6.
- Forms 6, 7 and 1 got their orders in a thirteen-minute window that evening,
  ten hours after form 1 was submitted.
- Forms 18 and 19 produced accounts 695 and 696, each with two addresses, a
  `DRAFT` state and **zero** orders — exactly what `createCustomerAccount`
  returns.

## Reproduce

Any bearer with read access to `core`, `core-cms`, `core-bill` and `core-rm`:

```bash
export HOST=https://dev-1.servicewand.com TOKEN='<bearer>'
```

Forms, their states and submitted attributes:

```bash
curl -sS -X POST "$HOST/core-cms/api/form/list.json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Organization-Code: SNOWLIMITLESS" -d '{"mappings":[{"name":"id"},{"name":"created"},{"name":"attributes"},{"key":"id","mappings":[{"name":"id"},{"name":"code"}],"name":"type","type":"identifier"},{"mappings":[{"name":"id"},{"name":"code"}],"name":"states","type":"collection"}],"offset":0,"pageSize":100}'
```

Orders with their source form, client and property:

```bash
curl -sS -X POST "$HOST/core-bill/api/order/list.json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Organization-Code: SNOWLIMITLESS" -d '{"mappings":[{"name":"id"},{"name":"created"},{"name":"grandTotal"},{"name":"attributes"},{"key":"id","mappings":[{"name":"id"},{"name":"code"}],"name":"account","type":"identifier"},{"mappings":[{"name":"id"},{"name":"code"}],"name":"states","type":"collection"}],"offset":0,"pageSize":200}'
```

Orders for the accounts created by forms 18 and 19 — expect `resultSize` 0:

```bash
curl -sS -X POST "$HOST/core-bill/api/order/list.json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Organization-Code: SNOWLIMITLESS" -d '{"filters":[{"type":"INTEGER","operator":"=","property":"account.id","value":"695"}],"mappings":[{"name":"id"}],"offset":0,"pageSize":50}'
```

Newest service properties — expect nothing after 2026-08-07:

```bash
curl -sS -X POST "$HOST/core-rm/api/resource/list.json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Organization-Code: SNOWLIMITLESS" -d '{"mappings":[{"name":"id"},{"name":"created"},{"key":"id","mappings":[{"name":"id"},{"name":"code"}],"name":"type","type":"identifier"}],"sorting":[{"field":"created","direction":"DESC"}],"offset":0,"pageSize":5}'
```

The only method the workflow dispatches — expect `createCustomerAccount` true and
`createQuotations` false:

```bash
curl -sS -X POST "$HOST/core/api/script/list.json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Organization-Code: SNOWLIMITLESS" -d '{"filters":[{"operator":"=","property":"code","value":"WINTER_SERVICE_REGION_WORKFLOW_UTILS"}],"mappings":[{"name":"id"},{"name":"content"}],"offset":0,"pageSize":1}' | python3 -c 'import json,sys; c=json.load(sys.stdin)["result"][0]["content"]; print({name: "\"%s\"" % name in c for name in ("createCustomerAccount", "createQuotations")})'
```

## What depends on this

- `SERVICE_AGREEMENT.ORDERS` collects approved quote orders. Without a property
  on each order the agreement's Schedule A has no premises to list, and with
  three orders per form there is nothing to choose per address.
- The customer portal reads properties by account and quotes by
  `SERVICE_PROPERTY`; neither exists for accounts created through the form.

## Team answers, 2026-09-10

1. **Quotation is manual.** The Service Provider Manager builds the quotes by
   hand, per address, from the addresses and the rest of the form, and then
   sends them to the client for approval. `createCustomerAccount` at `PROCESSED`
   is therefore the intended automated step, and gap 2 — quotation creation not
   wired into the workflow — is by design rather than a defect. This departs
   from spec §4.2 item 5, which creates three draft orders automatically; the
   team's answer is the operative one.
2. **Property size comes from the manager or from a measurement service.** The
   manager enters it by hand or obtains it through a service whose response
   already has a design. The size is not collected on the form and should not
   be.
3. **One order per address per pricing model, each carrying
   `SERVICE_PROPERTY`** — as spec §4.2 describes.
4. **A failed step must land in a visible state** from which a responsible
   person can restart it or act otherwise. Logging alone is not acceptable.

Anything the specification does not cover is ours to design; there is no
further product input to wait for.

## Ownership and scope, settled 2026-09-10

- **Workflow 49 and its six scripts become ours.** `WINTER_SERVICE_REGION_AI`,
  `WINTER_SERVICE_REGION_WORKFLOW_UTILS`, the three
  `WINTER_SERVICE_QUOTATION_PROCESSING` / `_REJECTED` / `_REVIEW` email
  templates and `WINTER_SERVICE_QUOTATION_CREATOR` exist only on the server,
  last edited on 2026-09-04. They are extracted into `core-ui` seeds before any
  change, so every later edit — a property per address, a visible failure
  state — is versioned and reviewable. Once the seed exists, an edit made
  directly on the server is overwritten by the next apply unless the script is
  re-extracted first.
- **The manager's interface for building quotes by hand is out of scope.**
- **The measurement service is Beam AI.** Its report shape, and how little of it
  `SNOW_REMOVAL_PROPERTY` can hold, is in `SNOW-VERTICAL-CORE-MODEL.md` §6b.

## Status of the takeover, 2026-09-11

- **The six scripts are in `core-ui`.** Content lives in
  `scripts/dev/seeds/scripts/` byte-for-byte as on dev-1 — three files use CRLF
  with a trailing newline, three use LF without one, and `.gitattributes`
  (`* -text`) keeps git from normalising either. `scripts/dev/coreScripts.ts`
  extracts, plans and applies; a plan against dev-1 right after extraction
  reports all six unchanged, confirmed independently by hashing a raw server
  read against the files.
- **Server drift is refused by default.** A script edited on the server after its
  recorded baseline is blocked from apply until
  `--overwrite-server-drift=CODE@UPDATED` names that exact server version.
- **Environment-specific metadata is split out.** `PUBLIC_CORE_URL` and
  `PUBLIC_ACCOUNT_PAGE_URL` on `WINTER_SERVICE_REGION_WORKFLOW_UTILS` live under
  `environmentMetadata.dev-1`; an environment lacking them is blocked, so a
  production run cannot publish dev links.
- **The workflow tool was destructive and is fixed.** Applied to an existing
  workflow, the previous `workflows.ts` stored an empty event list on its first
  pass and then failed on `targets`, leaving the workflow with no transitions.
  Against workflow 49 it would have removed all five. No workflow on dev-1 shows
  that damage; lsrc, the tool's default base URL, was not checked.
- **Workflow 49 is in `core-ui`** as `scripts/dev/seeds/winterQuotationWorkflows.json`,
  generated from the dev-1 read. A plan against dev-1 reports `changeCount: 0` and
  `deletionCount: 0`, and the server's `updated` stamp for the workflow is still
  the 2026-09-04 value, so nothing was written. `plan` now reports every
  difference an apply would make — states and events it would create or delete,
  targets, localized names, `orderIndex`, `style`, hooks, attributes and the
  workflow's own fields — so zero genuinely means a no-op.
- **The previous tool would also have erased names.** It wrote state and event
  names in English only; on workflow 49 that meant dropping seven of eight
  languages on the workflow, all five states and all five events. The seed now
  carries every language.
- **One binding is not in the seed.** Workflow 49 holds `script →
  WINTER_SERVICE_REGION_WORKFLOW_UTILS` (id 169), the link that makes
  `workflowUtils` available to its hooks. It is outside the save mask, so an
  apply on dev-1 leaves it in place, but a workflow created from this seed on any
  other environment would run hooks that call an unbound `workflowUtils`. The
  seed must carry the link before it is used anywhere but dev-1.
- The first writes of the takeover landed on 2026-09-16; see "Applied on dev-1
  on 2026-09-16".

## dev-1 on 2026-09-15

Read-only, as `SNOWLIMITLESS`.

- **`GET_QUOTE_` has been rewritten.** Form type 2 reports `updated`
  2026-09-14 15:39 by `system`, `optimistic` 12, and carries the single-address
  contract again: `PROPERTY_ADDRESS`, `SELECT_YOUR_PROPERTY_TYPE`,
  `PROPERTY_SIZE`, `RISK_FACTORS`, `SELECT_ROLE`, `FIRST_NAME`, `LAST_NAME`,
  `EMAIL`, `PHONE`, `ADDITIONAL_NOTES`. `PROPERTY_ADDRESSES`,
  `ORGANIZATION_NAME` and the `PROPERTIES` group are gone. Forms 17–19 were
  submitted against the multi-address contract on 2026-09-04.
- **Its schema no longer loads.** The anonymous
  `/en/core-cms/api/form-type/GET_QUOTE_/get.json` answers `401` with or without
  an organization header, and `500` with a bearer. `PRE_SEASON_INSPECTION`
  answers `200` on the same path, so the endpoint works and this form type does
  not.
- **The published page is gone.** `/pages/SNOWLIMITLESS/request-quote` answers
  `404`, "Error page 404 has not been configured".
- **No submission of the current form can create an account.** Script 169 reads
  addresses only from `PROPERTY_ADDRESSES`, and `createCustomerAccount` throws
  `"PROPERTY_ADDRESSES is required"` on an empty list; gap 5 would hide that
  behind `PROCESSED`.
- **The CMS holds older packages than the repository.** `PORTAL_FORM_DOCUMENT`
  (`0d62e1e1-d1af-4ae8-ab5f-9c0d12f0ab04`) carries a renderer with neither the
  address list nor coordinates, and `CUSTOMER_PORTAL_GRANITE_RIDGE_FIXTURE`
  (`8c08277e-644e-4935-918c-4c3158448bc9`) is the package of commit `27612ac`,
  before the Google map.
- Unchanged since 2026-09-11: workflows 45, 49 and 53, the six scripts of
  workflow 49, twelve orders all in `INITIAL`, one account with a user (692), no
  `GET_QUOTE_` form after 2026-09-04 and no property after 2026-08-07. The probe
  workflows and permissions of 2026-09-11 are removed.

Reproduce with the `HOST` and `TOKEN` above. Form type status, anonymous, then
the reference form type:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' "$HOST/en/core-cms/api/form-type/GET_QUOTE_/get.json"
```

```bash
curl -sS -o /dev/null -w '%{http_code}\n' "$HOST/en/core-cms/api/form-type/PRE_SEASON_INSPECTION/get.json"
```

The stored definition and its last change:

```bash
curl -sS -X POST "$HOST/core-cms/api/form-type/list.json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Organization-Code: SNOWLIMITLESS" -d '{"mappings":[{"name":"id"},{"name":"code"},{"name":"optimistic"},{"name":"updated"},{"name":"updatedBy"},{"name":"attributes"}],"offset":0,"pageSize":50}'
```

The published page:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' "$HOST/pages/SNOWLIMITLESS/request-quote"
```

## dev-1 on 2026-09-16

Read-only. The form type and the page were read anonymously; everything else
was read with a key issued that day. A ServiceWand API key is not a bearer: as
one it answers `401` everywhere, and it has to be exchanged for an access token
first, as the commands below show.

- **The schema loads again.** `/en/core-cms/api/form-type/GET_QUOTE_/get.json`
  answers `200` without a token from both CMS nodes, `x-node-id`
  `app-1-core-cms` and `app-3-core-cms`, with identical bodies. The backend's
  explanation: option loading read an NLS field that `Address` does not have,
  which surfaced as `401`. The lookup is now skipped, and an Address attribute
  arrives with `options: []`, which does not mean the field is missing.
- **The contract is still the single-address one.** Ten attributes in three
  groups: `SELECT_YOUR_PROPERTY_TYPE`, `PROPERTY_ADDRESS`, `RISK_FACTORS`,
  `PROPERTY_SIZE`; `SELECT_ROLE`, `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `PHONE`;
  `ADDITIONAL_NOTES`. `PROPERTY_ADDRESS` is required, single, of class
  `com.pixelnation.common.domain.Address`, with no `inputFormat`.
  `PROPERTY_ADDRESSES`, `ORGANIZATION_NAME` and the `PROPERTIES` group are
  absent. The stored definition is `optimistic` 12, last changed 2026-09-14
  15:39 UTC, and carries no `inputFormat` on `PROPERTY_ADDRESS` either.
- **Our renderer could not submit it.** `portal-form.js` sent an attribute
  without options through its class table, which maps every entity class to a
  select, so `PROPERTY_ADDRESS` rendered as a required select with no options.
  Fixed in `c778c2e`: an attribute of that class without options renders the
  address control and submits the typed text, checked against a verbatim copy
  of this response, `content/form-types/GET_QUOTE_.2026-09-16.en.json`.
- **The page came back later that day.** `/pages/SNOWLIMITLESS/request-quote`
  answers `200` and serves the deployed `PORTAL_FORM_DOCUMENT`, whose renderer
  predates the Address-class fix. Opened in a browser it renders the three
  steps, and `#pf-PROPERTY_ADDRESS` is a required select holding one option,
  the placeholder: there is nothing to choose and the form cannot be
  completed. The form type itself is unchanged at `optimistic` 12.
- **Account creation cannot work.** Script 169 is `optimistic` 21, unchanged
  since 2026-09-04 11:10 UTC, as are the five other scripts of workflow 49.
  `propertyAddresses` reads only
  `form.findFirstAttributeValue("PROPERTY_ADDRESSES")`, and an empty list throws
  `PROPERTY_ADDRESSES is required` twice: where the quotation input is built and
  in `loadInputs`. `toAddressId`, which accepts an `Address`, a number or a map
  with `id` and names `PROPERTY_ADDRESS` in its errors, has no caller.
  `attributeText` returns an empty string for a missing attribute, so the absent
  `ORGANIZATION_NAME` passes silently. `createCustomerAccount` receives
  `propertyAddresses` as a list of strings, so the workflow expects address text
  while the form type now declares an entity reference.
- **No Core document is readable.** Re-checked on 2026-09-16.
  `core/api/document/list.json` answers `resultSize` 0 in `SNOWLIMITLESS`,
  `SERVICE_WAND_WINTER_SERVICES` and `SYSTEM`, and the probe documents 130 and
  131, whose save returned those ids, answer `404` by id in all three. Document
  types read normally, `SERVICE_AGREEMENT` (17) included, so the gap is specific
  to Document rows. Call shapes, so that the report cannot be dismissed as a bad
  request: `document/get.json` takes `id` as a query parameter and answers `500`
  when it is only in the body, `document/size.json` without a filter throws a
  `NullPointerException`, and `core-cms` has no document endpoint at all.
  **Fixed later the same day:** the list answers with one document in
  `SNOWLIMITLESS` and 115 in `SYSTEM`. The two probe ids never came back, so
  the records lost while the gap was open are gone, not hidden.
- **The rewrite was not intended.** The team said on 2026-09-16 that the form
  type was changed by mistake and that they restore it themselves.

Reproduce with the `HOST` above. Every authenticated command needs a `TOKEN`
exchanged from an API key, good for 15 minutes:

```bash
curl -sS -X POST "$HOST/oauth2/oauth2/token" -H "Content-Type: application/x-www-form-urlencoded" -H "X-API-Key: $API_KEY" --data "grant_type=api_key&scope=openid"
```

The node and status of each answer, then the attributes; the page command of
2026-09-15 still applies:

```bash
for i in 1 2 3 4; do curl -sS -o /dev/null -D - "$HOST/en/core-cms/api/form-type/GET_QUOTE_/get.json" | grep -i -E '^(HTTP|x-node-id)'; done
```

```bash
curl -sS "$HOST/en/core-cms/api/form-type/GET_QUOTE_/get.json" | python3 -c 'import json,sys; t=json.load(sys.stdin); print([(a["code"], a["className"].rsplit(".",1)[-1], a.get("inputFormat"), len(a["options"])) for a in t["attributes"]])'
```

## Applied on dev-1 on 2026-09-16

The first writes of the takeover, with the user's go: prepared in `core-ui`,
planned, reviewed, applied, and read back from the server.

- **Workflow 49** holds six states and seven events. `PROCESSING_FAILED` was
  created, with `PROCESSED-PROCESSING_FAILED` carrying a required `MESSAGE` and
  `PROCESSING_FAILED-PROCESSED` retrying by re-firing `onEnter(PROCESSED)`. A
  re-plan reports `changeCount` 0. Both permissions exist and role `ADMIN` holds
  them, so a person can retry a failed form by hand.
- **Script 169**, `optimistic` 22. The requester notification is queued before
  property creation, so the new step cannot suppress the e-mail; a failure in it
  sends the form to `PROCESSING_FAILED` with the error as `MESSAGE`.
- **Script 176**, `optimistic` 26. `createQuotations` now creates one order per
  property per pricing model with `SERVICE_PROPERTY` set, and is still not
  called by the flow. `resolveFormAccount` finds its own account again: it looks
  the code up as the platform stores it, uppercased with the leading digit
  lifted (`SNOW-VERTICAL-CORE-MODEL.md` rule 10), and falls back to the raw
  code. Verified against the live rows: form 18 resolves to account 695 and form
  19 to account 696.
- **Script 200, `WINTER_SERVICE_PROPERTY_CREATOR`,** is new, capabilities `CORE`
  and `CORE-RM`. It creates one `SNOW_REMOVAL_PROPERTY` per submitted address,
  linked to the account and the address, idempotent by a prefixed code. It runs
  on its own node because `app-1-core-rm` and `app-2-core-rm` are the only nodes
  carrying `CORE-RM` and they carry nothing else, so neither 169 nor 176 can
  touch a Resource.
- **`PROPERTY` (153) is `optimistic` 7.** `COORD_LAT` and `COORD_LNG`, both
  `java.lang.Float` and optional, sit after `ADDRESS` in the default group, and
  a re-plan reports no change. `SNOW_REMOVAL_PROPERTY` (154) inherits them.
- **The form type was repaired the same day.** The user restored
  `PROPERTY_ADDRESSES` themselves — `java.lang.String`, required, multiselect,
  `inputFormat: "address"`, eight locales — and two order patches followed:
  the row moved into the property group after `SELECT_YOUR_PROPERTY_TYPE`, the
  stale `PROPERTY_ADDRESS` row and the emptied `default` group entry were
  dropped, and the hidden `PROPERTY_COORDINATES` was added after the address.
  `GET_QUOTE_` is `optimistic` 16 and both patches re-plan as no change.
- **The page renders it.** Three steps, the address list beside the property
  questions, the hidden coordinate field invisible, no console error. Adding
  several addresses works by the button and by Enter.
- **Two things the form still gets wrong.** `FORM_MAPS_API_KEY` is the
  placeholder `#`, so Google loads with an invalid key, Places never arrives
  and no coordinate is ever captured; an empty value would load no script at
  all. And seven of the eight locales still name the field in the singular,
  left over from the rewrite; only `en` reads "Property Addresses", while the
  repository template carries plural strings for all eight.
- **Script 169 is unusable until the CMS nodes are evicted.** Our edited
  content does not compile. The platform prepares a workflow hook when the form
  is created, so every submit answered `500 Execution error` and rolled the
  whole transaction back. Restoring the 2026-09-04 content byte for byte did
  not help: `script/clear-compile-cache` exists only on `core`, whose nodes are
  not the ones executing the hook (`app-1-core-cms`, `app-3-core-cms`), and
  `core-cms` answers `404` for that path. The way out was a new code: script
  201 `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V2`, a byte-identical copy of the
  2026-09-04 content, which compiles fresh. Workflow 49 is bound to it.
- **Our property creator has still never run**, because the workflow runs the
  2026-09-04 content through that copy. Its first run is also the first test of
  `IResourceTypeManager`, which no other script on dev-1 uses.

## The first end-to-end run, 2026-09-16

- **The chain works.** Form 38, submitted from the published page with two
  addresses, went `INITIAL → SUBMITTED → NOTIFIED → PROCESSED` and produced
  account 697 and addresses 713 and 714, one per submitted address. The
  region check, the manager notification and the requester e-mail all ran.
- **But `form/submit.json` no longer fires the first transition.** Every form
  created since then stays in `INITIAL`. Tested against each suspicion in
  turn: with workflow 49 reverted to its exact 2026-09-04 shape, with the
  `SUBMITTED` hook emptied, with either script bound, and with an
  authenticated caller holding all eight workflow permissions including
  `INITIAL-SUBMITTED`. The form type carries no submit-event field to lose
  either: its whole field list is `children, id, code, nls, created, image,
  isAbstract, optimistic, organization, parents, updated, updatedBy,
  workflow`. Sending `INITIAL-SUBMITTED` with a token runs the chain
  immediately, and an anonymous `form/{id}/send-event.json` answers `401`, so
  the browser cannot do it instead. Forms 17 to 19 of 2026-09-04 did go
  through, so something outside our reach changed.
- **Call shapes worth keeping:** `form/{id}/send-event.json` takes `event` as a
  query parameter, `audit/revisions.json` is `GET` while `audit/get.json` is
  `POST`, and a workflow apply that touches permissions fails intermittently
  on `/api/permission/list.json`; `--no-grant` and a retry get through.
- **We fire the first transition ourselves now.** State `INITIAL` never had a
  hook, a rule set or an exit script: its single audit revision is the `ADD` of
  2026-09-02, so nothing of ours removed one. The workflow is ours, so the
  utility script gained `submitAfterCreate`, modelled line for line on
  `validateServiceRegion`, and `INITIAL.onEnter` calls it. After the commit it
  sends `INITIAL-SUBMITTED` only while the form is still `INITIAL`, so a
  restored platform transition would simply find nothing to do.
- **Proof, from the transition rows.** Forms 42 and 43 were moved by user 2,
  the service user our hook sends as, and form 43 came from the published page
  with no one watching it. Forms 36, 37, 39 and 40, submitted before the hook
  existed, sit in `INITIAL` forever. Form 41 was moved by user 30, a person in
  the admin UI, and its Hong Kong address was correctly rejected.
- **Every script change needs a new code until the cache is evicted.** Saving
  content to an existing code does not reach the CMS nodes, so the hook landed
  as script 202 `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V3`: the 2026-09-04
  content plus that one method. Workflow 49 is bound to it. Scripts 169 and
  201 stay where they are.
- **Junk to delete on dev-1:** forms 25, 36, 37, 39 and 40, all probes, and
  scripts 201 and 202 once 169 can run again. Forms 38, 42 and 43 with accounts
  697 and 698 and addresses 713 and 714 are real runs worth keeping.

## Questions for the team

1. Is `createCustomerAccount` at `PROCESSED` the intended first step, with
   quotation creation planned as a later, separate step — or should
   `PROCESSED` create the quotations?
2. Where should the property size come from now that the form does not collect
   it: a manager entering it per property, or measurements on the resource?
3. Should one quote order be created per address per pricing model, as §4.2
   says, and should each carry `SERVICE_PROPERTY`?
4. Should a failed step move the form to a visible state instead of logging?
5. ~~Which `GET_QUOTE_` contract is intended?~~ **Answered 2026-09-16.** The
   rewrite of 2026-09-14 was a mistake and the team restores the form type.
   Restored, it carries `PROPERTY_ADDRESSES` as `java.lang.String` with
   `inputFormat: "address"` and `multiselect: true`, the contract workflow 49
   and the renderer already expect. Re-read it when it lands: the renderer also
   handles an Address-class attribute since `c778c2e`, so a second rewrite would
   render, not break.
6. ~~Was `/pages/SNOWLIMITLESS/request-quote` removed on purpose?~~ **Answered
   2026-09-16:** it answers `200` again. Only the form type is still to come
   back.
7. Questions 1 to 4 are now ours to decide, not to ask: workflow 49 and its six
   scripts became ours on 2026-09-11 and are extracted into `core-ui`.
8. Why does `core-cms/api/form/submit.json` no longer move a form out of its
   initial state? We now fire it from an `INITIAL` hook of our own, so the
   flow works either way, but it would be good to know whether the platform is
   meant to do it and simply stopped.
9. How is the compiled-script cache evicted on the CMS nodes? Saving a new
   version does not reach them and `script/clear-compile-cache` exists only on
   `core`. As it stands, a script that fails to compile once is dead until the
   nodes restart, and a fixed version never takes effect.
