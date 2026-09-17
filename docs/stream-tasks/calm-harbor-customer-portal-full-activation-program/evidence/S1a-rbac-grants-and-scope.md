# S1a — customer RBAC grants, and what scoping actually enforces

**Date:** 2026-07-28
**Session:** customer, not admin. `user/basic-info` returns
`authenticatedUserName: "elena"`, `roles: ["SPA_CUSTOMER_PORTAL"]`,
`organizationPath: ".SYSTEM.CALM_HARBOR_SPA_STAGING"`.
**Method:** direct HTTP with the portal customer key, read-only. No writes, no
transitions. The key was held in a session scratchpad at mode 600 and deleted
with the probe scripts afterwards; it is not in this repo or in `core-ui`.

This file supersedes two recorded claims. See §4.

---

## 1. What changed

`SPA_CUSTOMER_PORTAL` held 13 permissions and none of them covered appointment,
resource, project, task, order, cart, shipment, price or subscription. Eleven
reads were added in `core-ui` and applied to `CALM_HARBOR_SPA_STAGING`:

```
P_APPOINTMENT_R  P_RESOURCE_R  P_PROJECT_R  P_TASK_R  P_SCHD_R
P_ORDER_R  P_SHIP_R  P_PRICE_R  P_SUBSCRIPTION_R  P_CART_R  P_CART_W
```

Seed: `core-ui/scripts/dev/seeds/beautySpaCustomerPortalRbac.json`, commit
`0ebf2215`. The seeder itself needed a fix first (`2dbe4424`) — it resolved the
role owner from a `--role-org` that defaulted to `SYSTEM`, missed the existing
role in organization 25, and tried to insert against a unique index on `code`.

Read back after apply: role 39, organization `CALM_HARBOR_SPA_STAGING#25`,
exactly 24 permission ids, none dropped by the seeder's silent
does-this-permission-exist filter.

## 2. What the customer can now reach

| endpoint | status | rows |
| --- | --- | --- |
| `core-svc /api/appointment/list.json` | 200 | 9 |
| `core-svc /api/project/list.json` | 200 | 7 |
| `core-svc /api/task/list.json` | 200 | 8 |
| `core-rm /api/resource/list.json` | 200 | 7 |
| `core-acct /api/account/list.json` | 200 | 4 |
| `core-bill /api/order/list.json` | 200 | 12 |
| `core-bill /api/subscription/list.json` | 200 | 1 |
| `core-pim /api/product-price/list.json` | 200 | 24 |
| `core-pim /api/inventory/list.json` | 200 | 2 |

`core-rm` resources being readable means **the pickup studio resolves**. W4's
`locationUnresolvedReason` was a workaround for a permission gap, not for a
missing backend capability, and is no longer needed.

## 3. Scope: exactly one endpoint enforces it

The customer sees four accounts, including another real customer's:

```
id=1  CHS_STG_ELENA_RIOS                ← own
id=2  CHS_STG_MAYA_CHEN                 ← a different customer
id=3  CP_ACCESS_PROBE_OWN_ACCOUNT
id=4  CP_ACCESS_PROBE_FOREIGN_ACCOUNT
```

`core-bill /api/order/list.json` returns 12 orders spanning account ids 1, 3 and
4 — foreign orders included.

The cart is the exception, and it is consistently right:

```
GET core-bill /api/cart/current.json?accountId=1 → 200   (own)
GET core-bill /api/cart/current.json?accountId=2 → 403   (foreign)
GET core-bill /api/cart/current.json?accountId=3 → 200   (own probe)
GET core-bill /api/cart/current.json?accountId=4 → 403   (foreign probe)
```

**This is the finding that matters.** Core can scope a request by account
ownership — it does so in `cart/current` and nowhere else measured. So the ask to
the backend is not "please add scoping"; it is "apply what `cart/current`
already does to `order`, `appointment`, `account`, `project` and `subscription`".

Until then the only thing keeping a customer to their own data is client-side
filtering in the portal adapters. That is an accepted residual for a
one-customer staging demo and is not acceptable in production. The grants did
not create this hole — S1 §6.1 recorded foreign order reads succeeding before
any of them existed.

## 4. Two recorded claims are wrong

Both are in
`docs/stream-tasks/calm-harbor-commerce-commands-wave/evidence/closeout.md`
§Residuals, and both were true when written — they were measured before these
grants existed.

**"`core-svc` and `core-rm` refuse the customer token outright" (residual 3).**
They do not. It was a missing grant. Both answer 200 now.

**"The authenticated `core-pim` API alternates 200/401 on identical requests —
one bad replica behind the load balancer" (residual 2).** Does not reproduce:
20 consecutive `inventory/list` calls returned 200, balanced across
`app-1-core-pim` (10) and `app-3-core-pim` (10). A bad replica would not
disappear from both. The likelier reading is that the 401 was an authorization
refusal all along and the alternation was the load balancer, not the fault — but
this run cannot prove which, only that it no longer happens on either node.

## 5. Backend items still open

Two, down from four:

- **Workflow event dispatch returns an opaque 500 tenant-wide** (`S5.md` §4).
  Unchanged, and unrelated to permissions — it reproduced with the admin session
  on rows the portal never wrote. Blocks appointment cancel, order
  cancel/return, plan and subscription cancellation.
- **Two `=` filters on the same property are ANDed into an empty body** — the
  same silent-zero-rows class as the unfilterable dynamic attribute.

Note for whoever grants cancel later: the transition permissions exist
(`P_WF:SPA_APPOINTMENT_LIFECYCLE:SCHEDULED-CANCELLED` and siblings) and are
deliberately ungranted. Fixing the 500 alone will not make cancel work from the
portal.

## 6. Reproducing this

Needs the portal customer key, which is not stored anywhere in either repo — ask
the user. All calls are `POST <service>/api/<entity>/list.json` with
`Authorization: Bearer <key>`, `X-Organization-Code: CALM_HARBOR_SPA_STAGING`
and body `{"mappings":[{"name":"id"}],"offset":0,"pageSize":50}`; the cart calls
are `GET` with an `accountId` query parameter. The key is a bearer token
already — do not try to exchange it through `grant_type=api_key`, which returns
401.
