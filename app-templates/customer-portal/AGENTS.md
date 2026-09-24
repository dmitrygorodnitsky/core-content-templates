# Customer Portal Agent Rules

## Responsibility Map

- `experience/**`: canonical family schema, registry, contracts, and tenant
  descriptors.
- `runtime/**`: production portal behavior and presentation.
- `cms/**`, `assets/**`, `public/**`: authored CMS/public surface input.
- `scripts/**`: stable CLI entrypoints for build, export, and validation.
- `dist/**`: generated output; never hand-edit.
- `content/**` and root Markdown: product and domain evidence.
- `design-requests/**`: closed history of briefs written for Claude Design; no
  new request is added.

Repository-wide zone boundaries are documented in
`../../docs/repository-zones/zone-catalog.md`.

## Visual Design

Since 2026-09-11 presentation is designed in the working session instead of
being requested from Claude Design. `design-inbox/` remains the accepted
baseline the existing screens were built from, not the only permitted source of
presentation.

When a behavior needs presentation that does not exist yet:

1. Design it directly in `runtime/` as an extension of the existing design
   language. Reuse the components, CSS tokens, class composition and
   `data-module` / `data-visual-id` hooks already there before adding new ones.
2. Design every state the behavior can reach, not only the successful one:
   loading, empty, partial, error, unavailable and unauthorized.
3. Verify it in the Browser pane at desktop, tablet (768 px) and mobile (375 px)
   widths, in light and dark mode, and give the screenshots to the user, who
   accepts or rejects the presentation from them.
4. Record the decision where the behavior is documented — the case document,
   `HANDOFF.md`, or the change itself. Do not write a design request.

Runtime data varies text, localized values and the number of repeated items. A
single record's data does not justify a one-off layout variant.

## Runtime And CMS Rules

- Never modify `design-inbox/**`. It belongs to the user.
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

The Core OIDC login was transferred from
`design-inbox/src/routes/AuthOidcPage.js`, with its fixture phone/OTP actions
replaced by the real Core OIDC command. It is the starting point for any change:
an OIDC state it does not cover is designed under "Visual Design" above.
