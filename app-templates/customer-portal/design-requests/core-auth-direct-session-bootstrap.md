# Core Auth direct-session bootstrap states

## Route

`/pages/{ORGANIZATION}/auth/login.html`

## User goal

Sign in from the tenant-branded CMS page without first entering the Portal OIDC
redirect flow, then return to that experience's configured customer portal.

## Existing presentation to preserve

- Wave 18 login composition and responsive behavior;
- existing password reveal, credential-error, and signed-out regions;
- current disabled button primitive.

## Dynamic behavior

The raw CMS page retrieves a same-origin CSRF token from `/oauth2/login`, keeps
submit disabled until the token is ready, posts credentials once, refreshes the
token after a credential failure, and returns to the configured portal after a
successful session login. A 2FA redirect remains server-owned.

## Missing accepted states

1. Initial login bootstrap while the CSRF request is pending.
2. Bootstrap unavailable/network failure with an explicit retry action.
3. Session-login response that cannot be classified as success, credential
   failure, or 2FA handoff.

The implementation may reuse the accepted disabled button while pending and
must fail closed on bootstrap failure. It must not reuse the credential-error
copy for a network or configuration failure.

## Security and responsive constraints

- credentials and CSRF values are never logged, persisted, or stored in CMS;
- requests are same-origin and credentials use cookies only;
- portal return comes from the validated experience descriptor and must remain
  same-origin;
- repeat submit is dropped while one request is active;
- cover 1440, 768, and 390 CSS-pixel widths in light and dark modes.
