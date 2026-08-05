# Design Request: Core Auth CMS Login Page

## Context

`core-auth` can serve its login page with a skin retrieved from `core-cms`. The
page is requested server-to-server, runtime placeholders are substituted by
`core-auth`, and the browser receives the result from the `core-auth` origin.
The CMS supplies presentation only — it never receives the username, password,
CSRF token, session, or authentication cookies.

This is the counterpart to `calm-harbor-core-oidc-login.md`. That request covers
the portal side, which must never render a password input because the password
is entered on the Core sign-in page. This request covers that page — the one
the portal redirects to.

The accepted `AuthPage` represents a fixture phone and OTP flow, and
`AuthOidcPage` represents the redirect hand-off. Neither is an accepted visual
answer for a username and password form.

One thing here is unlike every previous request: **the delivered page must be
static markup that works with JavaScript disabled.** The accepted source builds
its DOM from `src/app.js` through `h()` factories and a delegated action
listener. None of that can survive on this page. The visual system carries over;
the delivery shape does not. This is the main constraint of the request.

Two-factor authentication is a separate request, filed once its backend
contract can be verified.

## User Goal

A customer redirected from the portal or a public site reaches a sign-in page
that belongs to the same product, enters their username and password, and
continues. If they arrived after signing out, the page says so. If the previous
attempt failed, the page says so. All of this works with JavaScript
unavailable.

## Required Presentation States

One page, one form, three server-controlled states. Visibility is toggled by
`core-auth` substituting `block` or `none` into an inline `display` — there is
no client-side state and no `data-state` transition.

| State | Required content and action |
| --- | --- |
| `default` | Username field, password field, primary submit action, password-reset link. Neither message region occupies layout. |
| `error` | The previous attempt failed. Assertive message region visible above the fields. The form stays fully usable and keeps its layout — the message must not push the submit action below the fold at `390`. |
| `after-logout` | The session ended normally. Polite message region visible. A neutral confirmation, not a warning; it must read differently from `error` without relying on color alone. |

Both message regions are present in the DOM at all times and are shown or
hidden server-side, so the design must hold in every combination, including the
degenerate case where both are visible.

Each state is required at `1440`, `1180`, `768`, and `390`, in light and dark,
and in both LTR and RTL. Arabic and Hebrew are in the shipped locale set, and
`dir` is a server-rendered attribute here rather than something script sets.

## Reuse And Boundaries

Reuse the accepted system wherever it fits:

- the `auth-page` / `auth-grid` / `auth-pitch` / `auth-card` composition;
- the field primitives from the profile contact form — `field-row`,
  `field-label`, `field`, `field-error`, the `:focus` treatment and the
  `[data-state="invalid"]` treatment;
- the accessible field contract already used on the Calm Harbor profile:
  `aria-invalid`, `aria-describedby`, and `field-error` carrying `role="alert"`;
- `ActionButton` and the accepted button primitives;
- tokens, typography, glass surfaces, radii, dark mode, and the
  `outline: 2px solid var(--accent)` focus convention.

Replace, because they have no product action here: the fixture phone control
(`auth-phone`, country-code chip), OTP, resend, the Apple control, and
`auth-divider`. Do not visually preserve a control that no longer does
anything.

The password-reset link is a plain link to a URL supplied at runtime — not an
action, not a route.

This is an operational sign-in surface. No hero, no scroll-driven behavior, no
decorative motion. The `auth-pitch` column may stay if it earns its place at
`1440`; at `390` the form comes first.

## Stable Transfer Hooks

The runtime contract is fixed and the markup must carry it exactly.

- Exactly one `<form>` on the page, marked `data-core-auth-login`.
- Field names `username` and `password`. These are not renameable and must not
  become parameters or bindings.
- `autocomplete="username"` and `autocomplete="current-password"`.
- A hidden CSRF input.
- These placeholders must appear verbatim in the delivered markup:
  `{{LOGIN_ACTION}}` (the form `action`), `{{CSRF_PARAMETER_NAME}}` and
  `{{CSRF_TOKEN}}` (the hidden input), `{{RESET_PASSWORD_URL}}` (the reset
  link), `{{ERROR_DISPLAY}}` and `{{LOGOUT_DISPLAY}}` (the two message
  regions). `core-auth` substitutes them per request; nothing else may produce
  or consume them.
- State is expressed only as `style="display:{{ERROR_DISPLAY}}"` and
  `style="display:{{LOGOUT_DISPLAY}}"`. No class toggling, no scripted
  visibility, no `data-state` switch.
- The assertive region carries `role="alert"`, the polite region `role="status"`.
- Every visible string sits in its own clearly marked slot, one string per
  slot, so each can be replaced with a localized CMS parameter on transfer.
- `lang` and `dir` are server-rendered attributes on `<html>`.

## Data And Security Constraints

- The page must be fully functional with JavaScript disabled. Submission is a
  native form POST to `{{LOGIN_ACTION}}`. No `fetch`, no scripted submit, no
  delegated action listener, no client-side check as the only guard.
- Own JavaScript is permitted only as enhancement — a show/hide password
  control is the obvious candidate. Deleting the script must change nothing
  functional.
- Nothing third-party. No scripts, styles, fonts, icon sets, or images from
  another origin, including for preview. The accepted source loads Manrope from
  Google Fonts through a `<link>` in `source.html`; this page needs a local
  `@font-face` instead.
- No analytics, tag manager, session recording, or error reporter. The DOM
  contains a password field and a live CSRF token.
- Dynamic data: none. The page renders no customer name, no session state, no
  account id, no claim. Everything variable comes from the six placeholders and
  the copy slots.
- Asset URLs must be root-relative and valid on the public host, since the page
  is served from the `core-auth` origin.

## Requested Handoff

This deviates from the usual executable-source shape, and the deviation is the
point. The answer transfers into a CMS block template, which is static HTML
plus CSS.

- One static HTML file carrying the real markup — not a component factory, not
  ES modules, no build step, no `manifest.json` entry needed.
- One CSS file. Reuse the accepted tokens and add only what the form needs.
- A way to preview the three states. A `data-dev-toolbar` harness is fine by
  the existing convention, provided removing it leaves the page fully working.

Evidence: every state at all four widths, light and dark, plus one capture in
RTL and one capture taken with JavaScript disabled in the browser.

The JavaScript-disabled capture is the acceptance artifact. The server-side
fallback in `core-auth` only checks that the retrieved page is structurally
valid — it cannot detect a page that arrives valid and then fails to render, so
that failure would reach users silently.

The user reviews the package and imports the accepted answer; the CMS template
package then transfers it 1:1, replacing only the copy slots with localized
parameters.
