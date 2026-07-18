# Design Correction Request: Calm Harbor Spa Wave 14 Acceptance

Status: blocking corrections required before runtime transfer

Baseline under review: `design-inbox/` Wave 14

Parent contracts:

- `calm-harbor-spa-customer-portal-ia.md`
- `calm-harbor-spa-customer-portal-designer-brief.md`
- `calm-harbor-authenticated-live-data-states.md`

## Objective

Correct the Wave 14 executable design without redesigning accepted working
surfaces. The corrected source must preserve the current-staging versus
target-appointments capability split while closing the measured responsive,
data-truth, and manifest/scenario gaps below.

## Forbidden Scope

- Do not change the accepted Beauty tokens, typography, glass surfaces, brand,
  primary IA, route ids, or capability model.
- Do not add APIs, adapters, permissions, persistence, or real command logic.
- Do not replace current-staging Orders with appointment claims.
- Do not add Cart, Checkout, Calendar, My routine, loyalty, package balance, or
  editable Profile to the Calm Harbor navigation.
- Do not remove long fixture values merely to make the layout pass. The layout
  must handle them intentionally.

## Blocker 1: Mobile Orders Row Collapses

Route/state:

- Beauty
- capability `current-staging`
- route `orders.list`
- state `ready`
- rows `many`
- viewport `390`

The long staging row currently starves `.spa-order-row__body` between the icon,
raw-status badge, and amount. Measured at a true `390` viewport:

| Metric | Observed |
| --- | ---: |
| `.spa-order-row__body` width | `33.984375px` |
| long row height | `571.84375px` |
| long order-name rendered height | `255px` |

The service name and type code break almost character-by-character. This fails
the brief's long-label and mobile readability acceptance.

Required correction:

- provide an intentional mobile row composition for icon, order identity,
  reference/type code, raw status, and amount;
- preserve every current safe field and the unmapped-status treatment;
- do not truncate away the long order name, reference, type code, raw status,
  amount, or currency;
- do not allow a sibling badge/amount to reduce the identity column to
  character-by-character wrapping;
- preserve no-horizontal-overflow behavior.

Acceptance at `390`:

- the long identity column remains at least `180px` wide when it shares a row,
  or moves into an accepted full-width mobile region;
- words wrap at normal boundaries rather than one character per line;
- the long row remains readable without horizontal scrolling;
- capture `staging-orders-long-390-light.png` and dark-mode equivalent.

## Blocker 2: Current-Staging Support Opens Fixture Conversation

In `SpaTopNav`, the visible Account/mobile menu action `support.open` navigates
to the existing `support` route. Under capability `current-staging`, that route
renders fixture help/chat content even though customer-scoped support threads
are not opened.

Related current-staging/closed-target links also use `support.email`, whose
presentation demo only shows an `Opening email to support` toast and has no
approved destination.

This contradicts the Wave 14 claim that current-staging renders only proven
sources.

Required correction:

- choose one explicit truthful presentation contract:
  - an approved CMS-authored/external support destination with a real action
    hook and no customer conversation claim; or
  - an honest unavailable support treatment; or
  - omit the visible Support action until a destination is configured;
- current-staging must never reach fixture support messages, agent state,
  tickets, or chat success through product navigation;
- the closed-target `Contact support`, catalog-empty support, and membership
  enquiry actions must follow the same approved destination/unavailable rule;
- do not use a success-like toast as proof that email, call, or message delivery
  started.

Acceptance:

- starting at current-staging `orders.list`, every visible Support-related
  action ends at the approved static destination/treatment;
- no `[data-module="chat-panel"]`, fixture thread/message, ticket, agent status,
  or sent-message state becomes reachable;
- destination-missing is represented honestly and is covered at `390`.

## Blocker 3: Unproven Address-Sharing Claim

The target at-home appointment fixture currently says:

> Address on file — shared with your specialist before the visit

The target Appointment relationship, address policy, consent, and specialist
sharing behavior are not opened. This sentence invents an operational/privacy
fact beyond the design contract.

Required correction:

- keep the explicit `At your place` visit-mode chip;
- use neutral least-data fixture copy such as `Address on file`, or bind a
  source-owned safe location label without asserting sharing behavior;
- leave address-sharing policy as an unresolved product/backend assumption.

Acceptance:

- no target fixture or copy claims that an address, note, preference, or
  personal detail will be shared with a specialist/provider;
- `target-appt-home-390-light.png` is regenerated.

## Blocker 4: Profile Contract Drift

Wave 14 runtime behavior overrides Beauty with `spaStaging` or `spaTarget`, and
the README says the legacy `appointments` profile now applies to Health only.
The machine-readable contracts remain stale:

- `manifest.json` still lists both Health and Beauty under
  `portalProfiles.profiles.appointments.verticals`;
- `data/scenarios.json` still lists both Health and Beauty under
  `profiles.appointments.verticals`;
- `data/scenarios.json` does not describe `spaStaging` and `spaTarget` in its
  top-level profile inventory.

Required correction:

- make README, manifest, scenarios, fixtures, and executable profile resolution
  agree;
- list Health only under legacy `appointments`;
- declare `spaStaging` and `spaTarget` with their capability, navigation,
  primary-action, cart, and booking rules in scenarios as well as manifest;
- document any retained `profileFor["Beauty"]` fallback as reference-only, or
  replace it with an unambiguous capability-aware contract.

Acceptance:

- automated comparison finds the same vertical/profile ownership in README,
  manifest, scenarios, and executable behavior;
- current-staging cannot select target fixtures or old Beauty Care/navigation;
- Health remains on the accepted legacy `appointments` profile.

## Missing Acceptance Evidence

The parent brief requires `1440`, `1180`, `768`, and `390`. Wave 14 currently
contains primarily `1440` and `390` captures and does not include explicit long
Orders/appointment evidence.

Add true-viewport executable captures for:

1. current-staging Orders ready with long row at `390`, `768`, `1180`, `1440`;
2. target long customer/treatment/specialist at `390` and `768`;
3. Shop ready at `390` and `768`;
4. current-staging support destination missing/unavailable at `390`;
5. target at-home copy after removal of the sharing claim at `390`;
6. desktop shell at a true `1440` CSS viewport with nav links visible and the
   hamburger hidden.

Do not use a scaled capture pane as evidence of a true desktop breakpoint.

## Validation

- All JavaScript passes `node --check`; manifest and scenarios pass `jq empty`.
- Every scenario route/action/module exists in the manifest and executable
  source.
- At true `1440`, Calm Harbor shows `Orders|Appointments`, `Services & prices`,
  and secondary `Shop`; nav links are visible and hamburger is hidden.
- At true `390`, there is no horizontal overflow and the long Orders row remains
  readable.
- Current-staging visible navigation cannot reach Appointment fixtures, booking
  commands, customer membership state, cart/checkout, or fixture Support data.
- Target loading/error/unauthorized states contain no appointment fixture ids or
  values.
- The corrected evidence set covers all required viewport/state rows above.

## Requested Handoff

Return the corrected executable source, styles, manifest/scenarios/README sync,
and regenerated evidence. In the closeout, list only the files changed for
these corrections and state whether any blocker remains. The user reviews and
updates `design-inbox/`; Codex then resumes the 1:1 runtime transfer.
