# Quotation workflow audit — 2026-09-26

The original audit read dev-1, tenant `SNOWLIMITLESS`, from 07:09 to 07:15 UTC
and changed no configuration. The rollout agreed afterwards is described
below. No new requests were submitted and no real emails were sent to verify
it.

Readiness criterion for automation: the next step starts only after the
previous one has finished; a failure is visible to an operator; a retry creates
no additional business records, emails or live links; the price and the
client's decision are checked on the server. Missing evidence for any of these
properties does not count as a passed check.

The user first approved an automatic `PROCESSED`, then asked for the findings
to be fixed, every email unified, and `ACTIVE` to follow the client's approval.

## Fixes agreed with the user

After the audit the user asked for the findings to be fixed and every email
unified. The request confirmation reports only receipt and further processing:
no account-creation email and no Account link. The agreement becomes `ACTIVE`
automatically after the client's approval and a successful Account/User
activation. Management approval of the agreement stays manual. Historical
records are not replayed.

Deployed on dev-1. The customer portal's form instance now guards against a
repeated submission: until the request settles it blocks a second request,
navigation and restart, and a failing callback of the host page does not turn
an accepted submission into an error. The same change loads Google Maps with a
readiness `callback`, because with `loading=async` the script's load event can
fire before the API is ready. `portal-form-check` covers the pending window,
failure, retry, the callback error and the early load event. The owning
exporter generated the package. Only the JavaScript of `PORTAL_FORM_DOCUMENT`
was updated; its 42 parameters, HTML, CSS, head and advanced sections were
preserved according to a semantic comparison per parameter code, because the
server reorders the parameters array without changing values. After the
generated cache was cleared the published page served the guard. Final
comparison of the public runtime: 08:03 UTC; configuration readback: 08:00 UTC.
The browser confirmed that Property Type is gone and that the Google
suggestions list opens. The test address was not submitted as a request.

### Deployed scope

| Workflow | Active helper | States / events | Readback |
| --- | --- | --- | --- |
| 49 `WINTER_SERVICES_QUOTATION_FORM` | V17 | 14 / 21 | `valid=true`, hooks and graph match |
| 45 `GENERAL_FSM_ORDER` | V5 | 16 / 25 | `valid=true`, hooks and graph match |
| 53 `SERVICE_AGREEMENT_LIFECYCLE` | V12; V13 since 2026-09-27 | 20 / 40 | `valid=true`, hooks and graph match |

New states. Workflow 49: `REQUESTER_NOTIFICATION_PENDING`,
`MANAGER_DELIVERY_FAILED`, `REJECTION_NOTIFICATION_PENDING`,
`REJECTION_DELIVERY_FAILED` and `PROCESSING_OUTCOME_UNKNOWN`; a ready request
notifies the manager and moves on by itself through
`REQUESTER_NOTIFICATION_PENDING` to `PROCESSED`. Workflow 45:
`WAITING_FOR_AREA`, `PRICING_FAILED`, `PACKAGE_ATTACHMENT_FAILED`,
`APPROVAL_PROCESSING_FAILED`, `DECLINE_PROCESSING_FAILED`,
`CHANGES_NOTIFICATION_FAILED` and `CHANGES_NOTIFICATION_CONFIRMED`. Workflow
53: `DETAILS_FINALIZATION_RETRY` and `ACCESS_CLEANUP_RETRY`; once provisioning
succeeds, the helper sends `CLIENT_APPROVED-ACTIVE` itself.

New dependencies: processor V6, quotation delivery V5, agreement delivery V3.
Six new Java scripts and eight Velocity `_V2` templates (script IDs 302–315)
matched their local sources. Older versions were not rewritten. Each hook text
names its helper version so that the server refreshes its binding; on
`PROCESSED` and `REJECTED` the old `onEnter` was cleared explicitly, because a
field the seed omits keeps the live hook.

Additive type patches added 3 attributes to `FIELD_SERVICE_ORDER` (id 5,
optimistic 10 → 11; `WINTER_SERVICES_ORDER` inherits this type) and 19 to
`SERVICE_AGREEMENT` (id 17, 2 → 3). The second schema has an empty
`attributeOrder`, so the patch used `placeAttributes: false`, as its earlier
patches do.

`SW_FS_WS_QUOTATION_MANAGER` (id 87) was reconciled to 78 permissions, 32 of
them workflow events: 15 recovery actions were added and 2 obsolete manual
READY events removed. New client decisions and automatic transitions were not
granted to the manager. The workflow owner is `SERVICE_WAND_WINTER_SERVICES`;
the standard service roles belong to `SERVICEWAND`, while the quotation manager
and customer portal roles belong to `SERVICE_WAND_WINTER_SERVICES`. Operators
are run with that split in mind.

| Finding | Done | Where the result stops |
| --- | --- | --- |
| F1: incomplete price | Every Order, its lines, price and owner are checked; `WAITING_FOR_AREA` and `PRICING_FAILED` | Area and internal approval stay with the manager |
| F2: retry after a timeout | One dispatch; the accepted UUID and intent are stored; an unknown result is its own outcome; a receipt for delivery; the previous link is revoked | No atomic cross-node lock and no transactional outbox |
| F3: several approvals of one property | Conflicts are checked before siblings change, inside the change transaction and before the agreement | A detected conflict blocks; strict serialization is not proven |
| F4: hidden failures | Visible states and statuses, technical retry and confirm; changed details are bound to a fingerprint of the arguments | An unknown result requires checking the queue, not a blind retry |
| F5: cancellation | Quotation and agreement grants are revoked, `CANCELLATION_STATUS`, cleanup retry | The shared Account is not deactivated; what `false` from the platform revoke means is not proven |
| F6: arbitrary package | Bound to organization, Account and source form; deterministic code; duplicate and composition checks | The platform offers no atomic upsert or lock |
| F7: lost after-commit | Read-only recovery report for stuck operations and ambiguous receipts | A manual report, not a background monitor and not a guarantee that a hook runs |
| F8: lost risk context | `RISK_FACTORS` is kept in the shared Account notes and in the manager's email | Not attributed to a single property; does not change the price or the region policy |

The user confirmed that the Core backend sources are not available. The
platform part is not pursued: the current protection stops an ambiguous
process for reconciliation, but it is not declared an exactly-once guarantee
under concurrent execution or a node crash.

### Deployment verification

Server probes without business data compiled and instantiated all six Java
classes. Three helper calls with a null entity finished without acting; three
processor and delivery calls stopped at the expected input ID check, before
reading or changing clients or agreements and before sending email. The real
compilation found an unsupported `runInNewTxRW`; it was replaced with the
confirmed `getInNewTxRW`, and Order V5 compiled before the workflow was
activated.

Passed: `portal-form-check`, the exporter, the checks of the three workflow
seeds and their grants, the Flow, AccountGrant, Delivery and ClientDetails
checks, four Java behavioral harnesses (form, order, agreement delivery,
agreement execution), both role checks, the recovery report check and the
generation check of the eight emails. HTML previews of every email were built
from safe fixtures and reviewed in the browser. This is not a deliverability
test of real mail and not an end-to-end test of transactional rollback.

An independent review found three P1 defects and rechecked their fixes: a
foreign sibling was changed before the owner check, pricing fell back to
another node after an ambiguous dispatch, and the result of an old job
acknowledged changed details. The tenant guard and the manager's permissions
were checked separately. Within these limited checks no P1 remains open; the
platform limitations listed above remain.

Historical records were not fixed automatically: the read-only inventory has 3
advanced Orders without lines and 2 Orders with conflicting approvals. The scope
holds old test records, so these numbers are not a failure rate. They must be
classified before any manual fix; a client decision is never changed
automatically.

### Cross-zone dependency

- Parent task: a reliable request → quote → agreement chain for
  `SNOWLIMITLESS`.
- From zone: customer-portal `runtime/forms` and its CMS exporter.
- To zone: `core-ui` `scripts/dev/seeds` and its workflow, script and
  type-patch operators.
- Blocking dependency: statuses, server-side price checks, client decisions and
  the email and grant effects belong to server scripts; the browser does not
  replace them.
- Required inputs: the read-only configuration snapshot below and the changes
  the user agreed.
- Expected outputs: versioned scripts, one generator for the eight emails,
  explicit failure and recovery states, checks and a readback of the applied
  configuration.
- Acceptance criteria: behavioral checks plus an independent review of the
  price and access changes; an unknown result is never retried automatically;
  no emails for historical requests and no test emails to real clients.
- Target time: this task.
- Owner: the main agent.
- Backup owner: the user.

Evidence:

- Linked commits: `core-ui` branch `codex/snow-crm` — `fe7788b36` (the
  shared email shell), `420cabbb8` (workflows 49, 45 and 53, the portal
  credentials receipt and the Quotation Manager role) and `af156b366` (the
  recovery report).
- Validation commands and results: the checks and readbacks in this document.
- Follow-up risks: no confirmed lock API or transactional outbox; the absence
  of duplicates between independent nodes cannot be declared proven.

`core-ui` gained the read-only `scripts/dev/quotationRecoveryReport.mjs` with
its check `quotationRecoveryReportCheck.mjs`. It lists stuck intermediate
states, explicit failures, advanced Orders without price lines, conflicting
approvals and grant references of canceled agreements. It replays nothing and
prints no personal data or request credentials. It is a reconciliation tool,
not a guarantee that hooks run:

```sh
node scripts/dev/quotationRecoveryReport.mjs --origin https://dev-1.servicewand.com --org SNOWLIMITLESS
```

## Portal credentials receipt — 2026-09-27

`SNOW_PORTAL_USER_PROVISION_V3` (script 316) takes the agreement next to the
Account and records each step of issuing portal credentials on that
`SERVICE_AGREEMENT`, in four attributes that
`portalCredentialsReliabilityPatch.json` added: `PORTAL_CREDENTIALS_STATUS`,
`PORTAL_CREDENTIALS_ERROR`, `PORTAL_CREDENTIALS_UPDATED_AT` and
`PORTAL_CREDENTIALS_USER_ID`. The status moves through `USER_PROVISIONING`,
`USER_SAVED` and, for an existing User, `PASSWORD_CHECK`, and ends in
`EXISTING_PASSWORD_UNCHANGED` or in `RESET_STARTED` → `RESET_METHOD_SUCCEEDED`.
A failure records `<stage>_FAILED`, `RESET_ERROR` or `RESET_RETURNED_FALSE`.
`RESET_METHOD_SUCCEEDED` acknowledges that `generateNewPassword` returned true,
not that the email arrived. `PORTAL_CREDENTIALS_ERROR` holds only the stage and
the exception class, never the exception message.

A stored `RESET_STARTED`, `RESET_ERROR` or `RESET_RETURNED_FALSE` stops the
next run before any change until an operator reconciles it, and a stored
`RESET_METHOD_SUCCEEDED` is never followed by a second reset. Before writing,
the script checks that the agreement is a `SERVICE_AGREEMENT` of the Account's
organization whose `CLIENT` is that Account; its service identity additionally
holds `P_DOCUMENT_R` and `P_DOCUMENT_W`. `serviceAgreementTypes.json` records
the 23 attributes the two agreement patches added.

`SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V13` (script 317) differs from V12
only in passing the agreement ID to provisioning V3, and workflow 53 is bound
to it. Both scripts were written to dev-1 on 2026-09-27 at 08:48 UTC.
`portalCredentialsCheck.mjs` runs the extracted Java method against a new User,
a kept password, a missing password, a failing read, a failed or uncertain
reset that is never replayed, a lost success receipt, a started reset and a
failed provisioning.

## Readback on 2026-09-28

Read-only dry runs of the `core-ui` operators against dev-1, before the
comment clean-up of the same day:

- `core-scripts plan` over `serviceAgreementScripts.json`,
  `quotationPackageScripts.json` and `winterQuotationScripts.json`: all 79
  scripts `unchanged`, meaning byte-identical content apart from trailing
  newlines, with the same category, language, executable flag, metadata and
  nls. This includes V3 (316) and V13 (317).
- `workflows plan` with owner `SERVICE_WAND_WINTER_SERVICES`: workflows 49 and
  45 report no change. Workflow 53 is bound to V13; its only difference is the
  order of the ten attributes of event
  `AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED`, an order the seed has held
  unchanged since its version of 2026-09-23.
- `type-attribute-patch plan`: `portalCredentialsReliabilityPatch.json`,
  `serviceAgreementReliabilityPatch.json`, `quotationOrderReliabilityPatch.json`
  and `GET_QUOTE_.hide-property-type.patch.json` report `changeCount: 0`.

The same day the prose comments were removed from these sources, and the two
claims no check covered became assertions: `portalCredentialsCheck.mjs` proves
that a recorded failure carries only the stage and the exception class, and
`quotationRecoveryReportCheck.mjs` proves that a failed request prints only its
status. Since then five scripts differ from dev-1 only by the removed comment
lines, and `core-scripts plan` reports them as `update`: V17 (302), V5 (306),
V12 (308), V3 (316) and V13 (317). The `PORTAL_FORM_DOCUMENT` JavaScript in
`dist/` likewise differs from the published one by one removed comment line.
The `// Reload helper binding: …` line of each hook text and the
`## Generated by …` header of the `_V2` emails stay: the checks and the email
generator's `--check` read them.

## Original scope before the fixes

| Workflow | ID | Active script | States |
| --- | --- | --- | --- |
| `WINTER_SERVICES_QUOTATION_FORM` | 49 | `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V16` | 9 |
| `GENERAL_FSM_ORDER` | 45 | `SNOW_QUOTATION_ORDER_UTILITIES_V4` | 9 |
| `SERVICE_AGREEMENT_LIFECYCLE` | 53 | `SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V11` | 18 |
| `SNOW_CUSTOMER_LIFECYCLE` | 14 | no bound script | 6 |

All four APIs return `valid: true`. That marks a valid configuration, not
proof that side effects succeed. The audit read 25 scripts and templates
reachable from these workflows, including references to old scripts used to
read metadata. The active Java handlers matched the sources in
`core-ui/scripts/dev/seeds/scripts/` after normalizing CRLF and edge
whitespace. Old versions in the documentation were not used as evidence of
current behavior.

## Steps and automation boundaries

| Step | At the audit | Conclusion |
| --- | --- | --- |
| `GET_QUOTE_` submission → `INITIAL` | The form is created, then an after-commit hook runs | Needs protection against a repeated submission and recovery of a missed start |
| `INITIAL` → `SUBMITTED` | Automatic, only while the form is still `INITIAL` | Correct state check; the script neither confirms the transition nor recovers it |
| `SUBMITTED` → `NOTIFIED` / `REJECTED` | ML checks each address; one unsupported address rejects the whole request | Already automated; an ambiguous address should go to review rather than count as a confident rejection |
| Region error → `VALIDATION_FAILED` | Visible state, manual retry | Keep; a technical retry can be automated within limits |
| `NOTIFIED` → Account, addresses, Property, 3 Orders per property | Sequential; a successful end → `READY_FOR_REVIEW` | Already automated, with `PROCESSING_FAILED`; a sequential retry reuses records |
| `READY_FOR_REVIEW` → `PROCESSED` | Manual; entering READY also notifies the managers | Automate by the user's decision, after every creation has finished |
| `PROCESSED` → "request in progress" email and Account link | Automatic; failure → `DELIVERY_FAILED` | The Account page answers 200; ensure one delivery run per form |
| Measuring the property's area | `SERVICE_AREA_SQFT` on the Property | The area comes from a person or an external source; an address alone gives no area |
| Order `INITIAL` → `QUOTE_PREPARED` | Manual; `onEnter` starts pricing when there are no lines | An automatic start is possible with a verified area, but the pricing error status must be fixed first |
| `QUOTE_PREPARED` → `QUOTE_APPROVED_INTERNALLY` | Manual; the hook adds the Order to the package | Leave it with the manager for now; add a server-side readiness check |
| Creating or extending `SERVICE_AGREEMENT` in `QUOTATION` | Automatic after internal approval | Needs protection against concurrent creation or change of the package |
| `QUOTATION` → `QUOTATION_SENT` | The manager sends the package; Orders, link and email follow automatically | Keep the manual send until each Order is validated |
| Changed quote → `QUOTATION_UPDATE` → `QUOTATION_SENT` | The manager starts the resend | The previous quotation link is already revoked; needs protection against repeated execution |
| Client accepts, declines or asks for changes | Client decision; hooks process the package | Do not automate decisions; make their automatic processing reliable |
| Every property decided → `AWAITING_CLIENT_DETAILS` or `CANCELED` | Automatic | The uniqueness of the accepted option and the cancellation of links are not guaranteed |
| `CLIENT_DETAILS_RECEIVED` → `DRAFT` | Details are checked and written, accepted Orders selected | Already automated; check errors return to the client, manager notification errors are lost |
| `DRAFT` → `PENDING_MANAGEMENT_APPROVAL` → `INTERNALLY_APPROVED` | Manual | Sending for review can be automated after a completeness check; approval stays with a person |
| `INTERNALLY_APPROVED` → `SENT_TO_CLIENT` | Automatic, then the agreement link and email | Already automated; a repeated delivery must revoke the previous link |
| Client approves the agreement → Account `ACTIVE` → portal User | Automatic, with `ACTIVATION_FAILED` | Account and User are handled; the agreement itself stays `CLIENT_APPROVED` |
| Agreement `CLIENT_APPROVED` → `ACTIVE` | The event exists, but the success handler does not send it | A candidate once provisioning is confirmed, unless a separate business start condition exists |
| Cancellation, suspension, expiry, archive | Manual transitions without a cancellation hook | First define and implement access revocation and status alignment |

## Findings by priority

### F1 — P1: a quote status does not guarantee a computed price

`SNOW_QUOTATION_ORDER_UTILITIES_V4.java:463–509`: `priceDraftAfterCommit`
returns when the area is missing and only logs exceptions, while the Order is
already in `QUOTE_PREPARED`. When lines exist, recalculation is skipped
altogether, including for a quote returned for rework.

`SNOW_SERVICE_QUOTATION_DELIVERY_V4.java:223–317` and
`SNOW_SERVICE_AGREEMENT_DELIVERY_V2.java`, method `loadDelivery`: the sets of
lines, prices and products are shared by the whole package. One correct Order
lets a package that contains another Order without lines pass the
`itemIds.isEmpty()` check. Nothing there checks either that each Order belongs
to the package's client and organization.

A live read confirmed individual Orders with 0 lines and total 0 in
`QUOTE_PREPARED`, `QUOTE_APPROVED_INTERNALLY` and `CLIENT_APPROVED`. dev-1 holds
test records, so this does not prove that a wrong price reached a real client.
The current sample holds no mixed package with and without lines.

Fix: explicit waiting-for-area and pricing-error states; each Order is checked
before internal approval and before sending; an empty Order cannot pass
because of its neighbour. A zero price can be allowed only as an explicitly
defined business case. Recalculating after an area change must be distinct
from keeping manual edits.

### F2 — P1: a retry after a timeout may repeat external actions

`SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V11.java:484–529` and
`WINTER_SERVICE_REGION_WORKFLOW_UTILS_V16.java:940–990`: `submitForExecution`
and the wait for its result share one `try`. On a timeout the code moves to
another node and gets a new request ID. The timeout does not cancel the first
execution.

For email and grants this allows two emails and several links; under
concurrent record creation, find-existing-else-create alone does not guarantee
uniqueness. The caller of pricer V3 is already better: once it has the request
ID, the wait sits outside the node failover loop.

`SNOW_SERVICE_AGREEMENT_DELIVERY_V2.java:108–145` issues a new agreement grant
without revoking the previously stored one, unlike quotation delivery V4.
Activation later revokes only the ID stored at that moment. An actual double
run was not reproduced in this audit.

Fix: distinguish a refusal to accept the job from an unknown result of an
accepted job; store the request ID and an operation key; retry the result
check, not the job creation. Delivery needs a stored attempt identifier and
compensation for every grant it issued, not only the last one.

### F3 — P1: concurrent approvals break "one option per property"

`SNOW_QUOTATION_ORDER_UTILITIES_V4.java:859–918`: declining siblings
deliberately skips `CLIENT_APPROVED`. Two clients or two tabs can accept
different Orders of the same property before the after-commit handlers run.
`packageDecision` checks `anyMatch(CLIENT_APPROVED)`, not uniqueness.
`SNOW_SERVICE_AGREEMENT_PROCESSOR_V5.java:423–434` keeps every approved Order in
the agreement without resolving the conflict per `SERVICE_PROPERTY`.

This is a confirmed gap in the checks and a race scenario, not an incident the
audit observed. It needs an atomic record of the decision per package and
property, or an explicit conflict state that blocks agreement preparation.

### F4 — P1: important failures remain only in the logs

- `SNOW_QUOTATION_ORDER_UTILITIES_V4.java:240–276`: adding the Order to the
  agreement and fetching the address can fail, yet the Order stays internally
  approved.
- `:841–856`: a failure to decline siblings or to check that the package is
  complete is only logged; the client's decision is already recorded, and the
  package may not advance.
- `:1043–1068`: the changes email has no stored delivery status.
- `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V16.java:194–237`: the manager
  notification and the rejection email are likewise lost from the working UI.
- `SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V11.java:288–305`: closing the
  quotation grant and notifying the contract manager after `DRAFT` are only
  logged on error; the processor also returns the status of individual
  failures, which the caller does not check.

These operations need stored results, a visible retry and an owner. "Email
queued" does not mean delivered to a mailbox. The organization has suitable
email entries for PRIMARY and SECONDARY, and `QUOTATION_MANAGER` and
`CONTRACT_MANAGER` are configured, so the earlier conclusion "no recipients" no
longer applies. The audit did not check that these addresses actually receive
mail.

### F5 — P1: cancelling an agreement does not revoke its links

In the live workflow 53, `CANCELED` has no `onEnter`, and the bound utility has
no matching handler. Transitions from `QUOTATION_SENT` and `SENT_TO_CLIENT`
lead there directly. The revocation code lives in the repeated quotation
delivery, the details processing and the agreement approval, not in
cancellation.

So cancellation alone does not revoke the quotation or agreement grant, and
reading cannot be assumed to stop merely because of the new status. No test
was made with a real previously issued token; a possible additional server-side
grant policy must be checked separately. The sample held no `CANCELED`
agreement with a stored grant.

Fix: a cancellation handler revokes both grants and records the result, and a
failed revocation can be retried. Agree what happens to the related Orders and
the Account — never deactivate an Account that has another active agreement.

### F6 — P2: the package's scope and its concurrent creation are underdefined

`SNOW_QUOTATION_ORDER_UTILITIES_V4.java:697–790`: the first `QUOTATION`
agreement of the Account and organization is selected; neither the request
code nor the season is part of the criterion. A new agreement code uses the
current time. Two concurrent approvals with no existing agreement can create
two packages; a save conflict on an existing package is only logged. The
script has no locks and no atomic upsert; how the internal managers and the
database behave under concurrency was not checked.

First define the package key (for example organization + Account + request or
season), then ensure a single creation and add Orders with a conflict retry.
This matters most before any automatic bulk approval of quotes.

### F7 — P2: the automatic chain shows no recovery of missed steps

The start and the following steps run through `runAfterTx`. The checked scripts
have no durable intent queue, no periodic reconciliation and no recovery after
a restart. How the platform implements `runAfterTx` was not checked here, so a
guaranteed loss of work on restart cannot be claimed.

The live sample has 47 forms: 6 `INITIAL`, 5 `NOTIFIED`, 7 `READY_FOR_REVIEW`,
23 `PROCESSED`, 6 `REJECTED`. They include old tests and workflow versions. The
count does not measure an error rate, and `created`/`updated` do not prove how
long a record stayed in a state. Transition history and an SLA per step are
needed.

Reconcile long intermediate states against the active request ID, and retry
only known idempotent operations. Do not push every old form through in bulk.

### F8 — P2: part of the form data takes no part in further processing

`RISK_FACTORS` exists in the live form, but no read of it was found in the
checked chain of creation, notifications and pricing. It remains form data
with no demonstrated transfer to the property or the quote. For several
addresses one shared list does not say which property carries which risk
either. Do not claim that the price accounts for these factors.

ML determines the region from the address text and `REGIONS`; coordinates take
no part in the decision. Any NO answer rejects the whole multi-address request.
That is the current business policy, not automatically an error; uncertain
addresses and a partially supported list need an agreed manual review
scenario.

## What was already done well

- Separate `VALIDATION_FAILED`, `PROCESSING_FAILED` and `DELIVERY_FAILED` on the
  form.
- Account, Property and Order are ready before `READY_FOR_REVIEW`.
- Technical codes are stored and existing records are looked up on a
  sequential retry.
- The client details are checked on the server through
  `CLIENT_DETAILS_RECEIVED`, not only in the browser.
- The previous quotation grant is revoked before a reissue, and the new one is
  compensated on error.
- Client decisions are applied as workflow events, never as a direct status
  write.
- Provisioning reuses the User and leaves an existing password unchanged on a
  normal retry.
- The automatic transition `INTERNALLY_APPROVED` → `SENT_TO_CLIENT` already
  exists.

## First agreed step: automatic PROCESSED

This is the audit's plan. V17 implemented it through
`REQUESTER_NOTIFICATION_PENDING`, as "Deployed scope" describes.

Keep `READY_FOR_REVIEW` as the technical boundary of a finished creation. Its
handler notifies the manager and, after the commit and a state confirmation,
sends the existing `READY_FOR_REVIEW-PROCESSED` only while the form is still
ready. `PROCESSED` keeps the existing delivery and its `DELIVERY_FAILED` retry.
A second `sendEvent` cannot simply follow the first: this environment has been
seen suppressing transitions that come too close together.

Do not recreate Account, Property or Order on this transition. Do not approve
Orders or the agreement automatically. Do not process old ready forms in bulk:
that is a separate migration that would send emails for old requests.

The change removes the manager's regular `READY_FOR_REVIEW-REJECTED` after
preparation, because that state becomes short-lived. A manual rejection after
the automatic transition needs its own agreed route. Issuing the Account link
and email also needs protection against repeated execution (F2). The Account
page and the review page answer HTTP 200; reading through a fresh grant and
email delivery were not performed in this audit.

Minimal check before rollout: a new valid form reaches `PROCESSED`
automatically after every entity is created; a preparation error sends no
client email; a repeated ready handler does not duplicate delivery; a delivery
error gives `DELIVERY_FAILED`; a form already `REJECTED` or `PROCESSED` does not
change; old ready forms get no email. Check on dedicated test records and an
agreed mailbox.

## Next automation candidates

1. Recalculate drafts once a verified `SERVICE_AREA_SQFT` appears, with a
   separate error status and manual edits kept. Benefit: fewer technical
   clicks. Cost: an area-change event and recalculation rules.
2. `DRAFT` → `PENDING_MANAGEMENT_APPROVAL` after checking the parties, the terms
   and the accepted quotes. Benefit: the agreement reaches its owner by itself.
   Cost: a completeness check and a guaranteed notification. The approval
   itself stays with a person.
3. The agreement's `CLIENT_APPROVED` → `ACTIVE` after a confirmed Account
   activation and User provisioning. At the audit the API showed four
   `CLIENT_APPROVED` agreements and one `ACTIVE`, and a successful
   `activateAfterCommit` did not send the agreement's activation event. It was
   a candidate until it was decided whether `ACTIVE` also means the start of
   service; the user decided, and V12 sends the event.
4. Limited retries of technical failures and a notification about stuck
   states — after F2 and F7. Business refusals and ambiguous client decisions
   are never retried automatically.

Do not automate the internal price approval, the sending of an unchecked
package or the management approval of the agreement yet. First F1–F5, then
fewer clicks. The access limits of the staging portal role, an immutable
version of the approved terms, email deliverability and the platform's
transaction and queue guarantees need separate checks; this audit does not
declare them closed.

## Checks and limitations

The existing checks in `core-ui` passed:

```text
node scripts/dev/winterQuotationFlowCheck.mjs
node scripts/dev/quotationPackageOrderFlowCheck.mjs
node scripts/dev/serviceAgreementClientDetailsCheck.mjs
node scripts/dev/serviceAgreementDeliveryCheck.mjs
```

They mostly check source texts and contracts rather than run Java on real
nodes. Their green result does not refute the findings about races, partial
execution or delivery. The integration scenarios still needed: a timeout after
a grant was actually issued; two concurrent client approvals of one property;
concurrent internal approval of the first two Orders; a package with one empty
Order; a failed manager email; a cancellation with a live grant; a restart
between the commit and the hook's work.

The raw reads stayed in a local `tmp` and are not a configuration source. This
report holds no tokens, client details or recipient addresses. Behavior changes
belong in the owning `core-ui` seeds and operators, not in edits of the
generated CMS package or in statuses masked by the client UI.
