# Contract sources and browser language

Implemented 2026-10-16 together with the `core-ui` contract workflow scripts.
The authoritative source map and deployment evidence are in
`core-ui/docs/service-agreement-data-sources.md`.

The Request Quote renderer sends the browser's `navigator.language` in the existing
Form.metadata.language property. CMS keeps this tag; the workflow passes it as a
scalar task parameter to BILL/ACCT, sets native Contact.language, and snapshots the
original tag on each Order and Service Agreement. A missing language is an error;
there is no automatic English substitution. The backend selects the terms Document's
LocalizedTextContent in that language and supplies locale to native email delivery.
Static CMS copy and available email translations are separate from this transport.

The review page uses native Account data: PRIMARY contacts and their entries, BILLING
addresses, and TYPE_AWARE.LEGAL_ENTITY_TYPE. The five native client classifications
remain distinct. A confirmation is always supplied by the client; unavailable data
remains empty. Retired duplicate Account attributes never supply contact details,
billing addresses, or portal sign-in email. A filled contract keeps its existing
Document snapshot. New legal entity types use the existing choice control.

Provider data is resolved on the server from CONTACT_AWARE, CONTRACT_AWARE and the
agreement's organization. No private record, grant token or customer value is stored
in a CMS parameter. Existing PageContext, template identities, includes and old
links are preserved. Both generated packages are updated only by their exporters.

## Backend limits

The current dev-1 Account grant mapping ceiling exposes contacts/addresses only as
IDs. A separate native projection was rejected (`read.addresses exceeds its ceiling
at property types`); no DEFAULT projection or existing grant was widened. The page
therefore asks the client to fill any unavailable details explicitly. Complete
native prefill needs reviewed backend support for Contact/ContactEntry and
AccountAddress/Address fields, not duplicate Account attributes.

CONTRACT_AWARE currently has no provider legal address field. The implementation
neither creates one nor substitutes a BILLING/SHIPPING address for it.

## Cross-zone handoff

- Parent task: implement agreed contract sources and original browser language.
- From zone: core-ui workflow/configuration scripts (external repository).
- To zone: customer-portal runtime, exporters and domain evidence.
- Blocking dependency: native grant projection ceiling for complete client prefill;
  native CONTRACT_AWARE address source for a provider legal address.
- Required inputs: native Account graph, five legal-entity values, existing agreement
  snapshot fields, saved request language and exact localized terms.
- Expected outputs: public form transport; native-source review/PDF; existing CMS
  packages with the same template IDs and page composition.
- Acceptance criteria: form language differs independently from configured UI
  locale; no retired Account attribute is read; confirmed contract values win;
  authorized API flow succeeds without new EntityTypeAttribute definitions.
- Owner: current implementation chat; backend model changes remain with backend.
- Evidence: `portal-form-check.mjs` tests fr-CA under English form configuration;
  `client-review-check.mjs` tests native sources, priorities, ambiguity, missing data,
  saved language, all 78 preview states and generated package parity.

## dev-1 evidence

Form 199 was submitted through the real Request Quote page and persisted en-GB.
Account 744 has native Language eng; Orders 176–178 and Agreement 214 preserved en-GB.
Both CMS nodes served the new form code after their local caches were refreshed.
The contract test uses an explicitly supplied synthetic area of 1000 ft² for Property
1008. The separate AI plan attempt returned 422 and is not a successful plan test.


Agreement 214 completed quote selection (MONTHLY Order 177), client detail submission,
management approval, delivery and client approval; the backend state is ACTIVE.
The native Account classification is CORPORATE and the primary Contact has the
confirmed job title. The review displayed the native provider snapshot and the
2026-11-01 to 2027-03-31 season. EFFECTIVE_DATE appeared only on client approval,
as 2026-10-16 in the organization's timezone. The approved screen was verified in
the browser. The source terms explicitly identify this as a non-binding dev test.

All native delivery and finalization receipts succeeded. Activation cleared the
native link IDs; the two additional browser test grants were revoked afterwards.
Existing links and previously sent documents were preserved. The final screenshot
is a local task artifact, not a customer-data fixture in this repository.


## AI plan follow-up (2026-10-17)

The earlier 422 was reproduced using the contract test's service note containing
“no service requested”. The same native endpoint/configuration/address returned 200
when the note requested visible entrance walkways and sidewalks. The raw historical
AI reply was not retained; the generic 422 checks several invalid/empty-plan conditions
and is not, by itself, a diagnosis of bad provider configuration. The detailed evidence
is in `core-ui/docs/property-plan/snow-image-generation.md`.

A fresh browser Request Quote submission **248** created property **1009** / address
**772** and automatically saved DRAFT_READY on attempt **1**, without direct dispatch,
retry or manual area input. The draft and durable receipt reference the same tenant
JSON asset. The actual CRM parser accepted two WALKWAY polygons and ten finite
geographic vertices with elevations, with zero invalid elements. The reviewed plan
and SERVICE_AREA_SQFT remain unset until the normal manager review; this run verifies
successful generation without the old contract test's manually supplied area.

Successful generation tests use meaningful service notes. Synthetic contact labels
and reserved example.test email addresses identify test customers; service notes
must describe the surfaces to plan, rather than cancel the service. Real customer
notes are not dropped or rewritten to force generation. Existing CMS packages and
old links were preserved; no portal runtime change was required for this acceptance.
