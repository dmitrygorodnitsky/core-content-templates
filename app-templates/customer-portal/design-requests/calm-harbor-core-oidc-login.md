# Design Request: Calm Harbor Core OIDC Login

## Context

Calm Harbor Spa has a real customer User linked to its customer Account. The
portal must start the existing Core OIDC authorization-code-with-PKCE redirect
flow, then return to the same portal URL. The browser must never receive or
render a password input, API key input, access token, or customer Account id.

The accepted `design-inbox/src/routes/AuthPage.js` represents a fixture phone
and OTP flow. It does not provide an accepted visual answer for the Core OIDC
redirect flow below.

## User Goal

A Calm Harbor customer opens `#/login`, understands that sign-in continues in
the secure Core account service, completes that login, and returns to a clear
signed-in portal state. They can also sign out.

## Required Presentation States

Create the accepted presentation for one login route and these states:

| State | Required content and action |
| --- | --- |
| `ready-signed-out` | One primary `Continue to secure sign-in` action. Explain that login continues in the secure account service. |
| `redirecting` | Non-interactive progress state after the primary action; the page is leaving for Core. |
| `unavailable` | Honest retry treatment when Core discovery or the authorization library cannot initialize. No fallback login method. |
| `ready-signed-in` | Display a customer-safe display name supplied by the authenticated session, a route back to the public catalog, and a sign-out action. Do not imply that orders, appointments, profile, or booking data are available. |
| `signing-out` | Non-interactive progress state while Core completes logout. |

## Reuse And Boundaries

- Reuse the accepted auth route composition, shared tokens, typography,
  responsive rules, button primitives, and visual language wherever they fit.
- Replace fixture phone, OTP, resend, and Apple controls. Do not visually
  preserve controls that no longer have a product action.
- The public catalog nav remains available before and after authentication.
- The design must work at `1440`, `1180`, `768`, and `390` widths in light and
  dark mode for the Beauty theme.
- Avoid a new marketing-style page. This is an operational customer sign-in
  surface.

## Stable Transfer Hooks

Please provide stable elements/hooks for:

- route `auth.oidc` at `/login`;
- module `core-oidc-auth`;
- actions `auth.oidcSignIn`, `auth.retrySession`, `auth.signOut`;
- states `ready-signed-out`, `redirecting`, `unavailable`, `ready-signed-in`,
  and `signing-out`;
- a display-name binding that accepts a single customer-safe text value.

## Data And Security Constraints

- Dynamic data: only a safe display name and authenticated/unauthenticated
  session status.
- No customer Account id, role, order, appointment, task, payment, profile,
  token, or identity-provider claim is visible.
- Private customer modules are not part of this request. Their server-scoped
  contracts are still closed.

## Requested Handoff

Provide reusable component(s), route source, styles, manifest/scenario
coverage, and desktop/tablet/mobile evidence to the user. The user will import
the accepted package into `design-inbox/`; the production runtime will then
transfer it 1:1 and replace only fixture actions with Core OIDC commands.
