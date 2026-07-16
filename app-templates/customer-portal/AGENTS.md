# Customer Portal Agent Rules

## Visual Source Of Truth

`design-inbox/` is immutable, designer-owned executable input. Its accepted
source, `manifest.json`, stable hooks, reusable components, CSS tokens, layout,
responsive behavior, and visual states are the source of truth for production
presentation.

Do not invent, restyle, simplify, or approximate UI. This includes a new page,
panel, card, button treatment, empty state, error state, loading state,
unauthorized state, breakpoint behavior, icon, animation, or visual hierarchy.
Do not infer a visual solution from a business requirement.

Codex owns business logic only: adapters, authentication/session behavior,
authorization, routing, commands, validation, state transitions, data
normalization, CMS packaging, and truthful unavailable/error behavior.

## Required Design Gap Flow

When a requested behavior has no accepted visual representation:

1. Do not implement a new visual treatment.
2. Create a concise request under `design-requests/<slug>.md`. Include the
   route, user goal, exact states/actions, data that will be dynamic, required
   responsive widths, existing components that may be reused, and constraints
   such as PII, authorization, or loading behavior.
3. Give the request to Claude Design. Claude Design works outside this
   repository; the user reviews its output and is the only person who updates
   `design-inbox/`.
4. Wait until the user has updated `design-inbox/` with the accepted executable
   design.
5. Transfer the accepted result 1:1 into `runtime/`. Preserve its component
   boundaries, stable `data-*` hooks, class composition, and visual states.
6. Validate against the executable design at the relevant desktop, tablet, and
   mobile widths before declaring the implementation complete.

Only text values, localization, CMS-authored copy, and the number/content of a
design-approved repeatable block may vary at runtime. Dynamic data does not
authorize a new layout or a one-off card variant.

## Runtime And CMS Rules

- Never modify `design-inbox/**`. The user alone imports accepted Claude Design
  output into that directory.
- Treat `ARCHITECTURE.md` as the authority for production behavior and
  `DATA-OWNERSHIP.md` for what may become live data.
- A design fixture or a successful local state transition is never a live
  business result. Do not ship fixture/mock success as a fallback for an
  unopened contract.
- Generate manual-upload artifacts through their exporter scripts. Do not
  hand-edit `dist/manual-upload/**`.
- Keep CMS configuration to copy and allowed source selectors. Never put
  customer/session values, tokens, account ids, authorization results, or
  private entity data into CMS.

## Current Auth Example

The Core OIDC login is transferred from
`design-inbox/src/routes/AuthOidcPage.js`. Future changes must preserve that
accepted composition and request a new design state before changing it,
replacing only its fixture phone/OTP actions with the real Core OIDC command.
If that composition does not cover the required OIDC states, create a design
request before changing the presentation.
