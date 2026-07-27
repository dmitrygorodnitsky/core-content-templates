# Customer Portal Design Requests

This directory holds briefs for presentation that is not already covered by the
accepted executable source in `../design-inbox/`.

Each request must name the route, required states and actions, dynamic data
shape, responsive requirements, reusable source components, and any security
or data-ownership constraints. Claude Design creates the visual answer outside
this repository. The user reviews it and imports the accepted package into
`design-inbox/`; production runtime work then transfers that answer 1:1.

## Calm Harbor Spa

- [`calm-harbor-spa-customer-portal-ia.md`](calm-harbor-spa-customer-portal-ia.md)
  is the product/IA contract for the appointment-first authenticated portal.
- [`calm-harbor-spa-customer-portal-designer-brief.md`](calm-harbor-spa-customer-portal-designer-brief.md)
  is the executable presentation request derived from that IA.
- [`calm-harbor-spa-wave14-acceptance-fixes.md`](calm-harbor-spa-wave14-acceptance-fixes.md)
  records the blocking responsive, data-truth, and contract corrections found
  during acceptance of the first Wave 14 designer handoff.
- [`calm-harbor-authenticated-live-data-states.md`](calm-harbor-authenticated-live-data-states.md)
  owns shared authenticated lifecycle, authorization, and command-state design.
- [`calm-harbor-spa-public-landing-media-and-products.md`](calm-harbor-spa-public-landing-media-and-products.md)
  owns the separate public landing media and retail teaser request.

### From the design fidelity audit

Filed by `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/`. Each covers
a state the live runtime reaches that the accepted source never described; see
that wave's `evidence/punch-list.md` for the finding ids.

- [`calm-harbor-plan-expired-and-terminal-enrolment-states.md`](calm-harbor-plan-expired-and-terminal-enrolment-states.md)
  asks for the `Expired` plan card — the accepted vocabulary stops at four
  labels and an expired enrolment falls through to the neutral badge.
- [`calm-harbor-purchase-completed-return-state.md`](calm-harbor-purchase-completed-return-state.md)
  asks for the **completed** return only; a return in progress is already
  accepted as `return-accepted-for-review`.
- [`calm-harbor-partially-unavailable-sections.md`](calm-harbor-partially-unavailable-sections.md)
  asks for one reusable pattern for a section that is unavailable inside an
  otherwise-ready page — production has improvised it three times, and two of
  the three now say something untrue.
- [`calm-harbor-route-root-access-and-source-failure-states.md`](calm-harbor-route-root-access-and-source-failure-states.md)
  extends the route-root `data-state` grammar to the access and source-failure
  states the runtime already reaches, including the fail-closed foreign-Order
  signal a live check depends on.
- [`calm-harbor-appointment-status-and-slot-availability-states.md`](calm-harbor-appointment-status-and-slot-availability-states.md)
  covers `In progress`, the unreachable booking states, the specialist step, and
  the honest treatment for "we cannot show you availability".
