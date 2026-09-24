# Design Request: Customer Experience Core Auth 2FA

## Objective

Design the reusable two-factor authentication page that follows the existing
CMS-skinned Core Auth login and remains in the same customer-experience visual
family across verticals.

The result must preserve visual continuity from login to 2FA without moving
credentials, CSRF processing, authenticator enrollment, OAuth state, or
verification into CMS or browser JavaScript.

## Success Gate

Pass only when the executable handoff:

1. uses the accepted login composition, theme tokens, typography, spacing,
   branding, responsive behavior, and accessibility language;
2. represents both first-time authenticator setup and normal verification;
3. remains fully usable with JavaScript disabled;
4. contains exactly one correctly marked Core Auth 2FA form;
5. renders every protected runtime value only through the documented
   `core-auth` placeholders;
6. works for every registered customer-experience theme without introducing a
   tenant-specific layout.

Pivot if the current login composition cannot accommodate the QR/setup content
accessibly. Abort the custom 2FA design if meeting the visual goal requires a
client-side verification flow, third-party script, or CMS-owned secret.

## Baseline to Preserve

Use the accepted CMS login skin as the presentation baseline. Reuse its:

- centered responsive auth composition and card hierarchy;
- brand mark/name placement;
- localized title, supporting copy, labels, error treatment, and primary
  action;
- theme and light/dark token packs;
- keyboard focus treatment and mobile typography;
- no-JavaScript form behavior.

Do not redesign the surrounding portal `auth.oidc` redirect screen. This brief
owns only the CMS page served by `core-auth` after login requires 2FA.

## Required Presentation States

| State | Runtime condition | Required presentation and action |
| --- | --- | --- |
| `setup-ready` | `SETUP_DISPLAY=block`, `VERIFY_NOTICE_DISPLAY=none`, `ERROR_DISPLAY=none` | Explain first-time authenticator enrollment, show the Core Auth QR image, provide the generated secret as an accessible manual fallback, show one `code` field, and one verify action. |
| `setup-error` | `SETUP_DISPLAY=block`, `ERROR_DISPLAY=block` | Preserve setup instructions and show a localized assertive error without replacing or regenerating runtime enrollment data in CMS. Allow resubmission through the same form. |
| `verify-ready` | `SETUP_DISPLAY=none`, `VERIFY_NOTICE_DISPLAY=block`, `ERROR_DISPLAY=none` | Explain that an authenticator code is required, show one `code` field, and one verify action. Do not show QR or secret. |
| `verify-error` | `SETUP_DISPLAY=none`, `VERIFY_NOTICE_DISPLAY=block`, `ERROR_DISPLAY=block` | Keep the verification context, show a localized assertive invalid-code message, and allow resubmission. Do not claim why verification failed beyond the supplied copy. |

Submitting is a native form navigation. Do not require a JavaScript loading or
disabled state. Optional progressive enhancement may prevent a second click
only if the form remains completely functional without it and no protected
value is read or transformed by script.

## Exact Core Auth Form Contract

The executable source must contain exactly one form:

```html
<form method="post" action="{{TWO_FACTOR_ACTION}}" data-core-auth-2fa>
  <input
    type="hidden"
    name="{{CSRF_PARAMETER_NAME}}"
    value="{{CSRF_TOKEN}}">

  <div style="display:{{SETUP_DISPLAY}}">
    <p>${TWO_FACTOR_SETUP@LOCALIZED_STRING_SS}</p>
    <img
      src="{{TWO_FACTOR_QR_CODE}}"
      alt="${TWO_FACTOR_QR_ALT@LOCALIZED_STRING_SS}">
    <code>{{TWO_FACTOR_SECRET}}</code>
  </div>

  <p style="display:{{VERIFY_NOTICE_DISPLAY}}">
    ${TWO_FACTOR_NOTICE@LOCALIZED_STRING_SS}
  </p>

  <label for="code">
    ${TWO_FACTOR_CODE_LABEL@LOCALIZED_STRING_SS}
  </label>
  <input
    id="code"
    name="code"
    inputmode="numeric"
    autocomplete="one-time-code"
    required>

  <div style="display:{{ERROR_DISPLAY}}" role="alert">
    ${TWO_FACTOR_ERROR@LOCALIZED_STRING_SS}
  </div>

  <button type="submit">
    ${TWO_FACTOR_BUTTON@LOCALIZED_STRING_SS}
  </button>
</form>
```

Additional inert wrappers and accessible descriptions are allowed. Do not add
a second form, rename the `code` field, change the POST method, or replace
placeholder-driven visibility with client-side state.

## Protected Runtime Placeholders

These values are supplied only by `core-auth`. Every placeholder referenced by
the template must survive the CMS-rendered HTML byte-for-byte until Core Auth
substitution:

- `{{TWO_FACTOR_ACTION}}`;
- `{{CSRF_PARAMETER_NAME}}`;
- `{{CSRF_TOKEN}}`;
- `{{ERROR_DISPLAY}}`;
- `{{SETUP_DISPLAY}}`;
- `{{VERIFY_NOTICE_DISPLAY}}`;
- `{{TWO_FACTOR_QR_CODE}}`;
- `{{TWO_FACTOR_SECRET}}`;
- `{{TWO_FACTOR_OTPAUTH_URI}}` when the accepted template references it.

Do not create CMS parameters, defaults, fixtures, logs, analytics attributes,
or JavaScript variables for these placeholders. The authenticator URI does not
need a visible control unless the product explicitly accepts one later.

## CMS-Owned Localized Parameters

Provide reusable `LOCALIZED_STRING_SS` parameters for at least:

- document title;
- card title and subtitle;
- first-time setup explanation;
- QR image alternative text;
- already-enrolled verification notice;
- code field label;
- error copy;
- verify button label;
- optional security/help note;
- the shared brand and supporting pitch copy used by login.

Do not hardcode Calm Harbor, Beauty, or English-only business copy into the
generic source.

## Accessibility and Responsive Requirements

- Provide desktop, tablet, and mobile evidence at `1440`, `1180`, `768`, and
  `390` widths in light and dark modes.
- Keep explicit labels, visible focus, logical heading order, and a single
  assertive error region.
- Make the QR image legible without becoming the only enrollment method.
- Present the manual secret so it can wrap or scroll without breaking the card,
  while remaining readable by assistive technology.
- Do not auto-focus in a way that skips setup instructions for a first-time
  user.
- Preserve 200% zoom usability and reduced-motion behavior.

## Security and Failure Boundaries

- No username, password, access token, OAuth state, customer Account id, role,
  or authentication cookie is visible or owned by CMS.
- No third-party scripts, fonts, QR generators, telemetry, or asset hosts.
- The QR source is the Core Auth data URL; the browser must not fetch it from an
  external service.
- Do not add reveal/copy controls that require secret handling in JavaScript.
- CMS failure, invalid markup, timeout, or oversized response is handled by
  Core Auth's bundled 2FA fallback and is outside this page's presentation.
- There is no registration, recovery-code, resend-code, trust-device, alternate
  factor, or factor-management feature in this brief.

## Owned and Forbidden Scope

Owned scope:

- reusable `AUTH_2FA` presentation source;
- setup/verify and error variants;
- localized parameter inventory;
- responsive/accessibility evidence;
- manifest/scenario documentation for the four states.

Forbidden scope:

- editing Core Auth verification behavior;
- changing login, OAuth, session, HAProxy, PageContext resolution, or Account
  provisioning contracts;
- inventing registration or alternate-factor actions;
- modifying accepted source under `design-inbox/**` before user acceptance.

## Requested Handoff

Return:

1. reusable executable 2FA component/page source using the exact form contract;
2. styles expressed through the existing auth/theme tokens;
3. localized parameter list with safe example copy;
4. scenario/manifest coverage for all four states;
5. desktop/tablet/mobile, light/dark evidence;
6. a validation note confirming one marked form, required field names,
   no-JavaScript operation, preserved placeholders, and no third-party assets.

The user reviews and imports the accepted package into `design-inbox/`. Runtime
or CMS-family activation begins only after that acceptance.
