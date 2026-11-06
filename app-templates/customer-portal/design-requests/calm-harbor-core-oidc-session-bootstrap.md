# Addendum: Core OIDC Session Bootstrap State

## Why This Is Needed

On every `auth.oidc` page load, including the return from
`/core/oauth2-callback.html`, the runtime must first read Core discovery and
restore the existing OIDC session from browser storage. Until that completes it
cannot truthfully choose between `ready-signed-out` and `ready-signed-in`.

The accepted Wave 10 route has five states but no visual answer for this
initial recovery interval. It must not be represented as `redirecting`: the
browser is not leaving for Core at that time.

## Requested Addition

Add one presentation state to `auth.oidc`:

| State | User-facing meaning | Required behavior |
| --- | --- | --- |
| `checking-session` | The portal is securely restoring the existing session. | Non-interactive progress treatment. It must not claim a redirect, show sign-in controls, or reveal a session name until recovery completes. |

Use the same approved auth composition and provide the same visual treatment
for desktop, tablet, mobile, light, and dark. Add the state to the route,
module scenario matrix, manifest, action/state documentation, and preview
evidence. No new dynamic data is required.
