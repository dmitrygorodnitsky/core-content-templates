# Top nav: tenant brand name and mobile overflow

Route: every private portal route (shell `top-nav`).
Profiles affected: `stormOps`, the new `stormRetail`, and `onDemand` with any
tenant brand longer than the vertical display name.

## User goal

A snow-removal customer opens the portal on a phone and on a laptop and can
reach every enabled destination. The operator's real business name is visible
in the shell.

## Problem

The accepted `top-nav` has no overflow treatment above the `vw-compact`
breakpoint (container width `<= 1040`), and no mobile treatment for a long
brand name or a long primary CTA. `.nav-links` is `overflow: hidden`, so items
past the available width are silently clipped with no affordance.

Measured on the current runtime, container width in brackets:

| configuration | container | nav overflow |
| --- | --- | --- |
| `onDemand`, brand `HVAC`, CTA `+ Book`, cart on | 375 | 0 px |
| `stormRetail`, brand `Granite Ridge`, CTA `Request service`, cart on | 375 | 114 px |
| same, cart hidden | 375 | 70 px |
| same, cart hidden and CTA shortened to `Request` | 375 | 22 px |
| accepted `stormOps` labels, brand `Granite Ridge`, cart off | 375 | 70 px |
| `stormRetail`, 8 nav items, brand `Granite Ridge Snow Removal` | 1440 | 193 px |
| `stormRetail`, 7 nav items, brand `Granite Ridge` | 1440 | 0 px |
| `stormRetail`, 7 nav items, brand `Granite Ridge` | 1180 | 0 px |

Two independent consequences:

1. **Mobile.** At `375` the accepted mobile budget is exhausted by a 4-character
   brand plus `+ Book`. The accepted `stormOps` primary label `Request service`
   already overflows by 70 px before any tenant brand is considered, so this is
   not introduced by the new profile.
2. **Desktop.** Each nav item costs 63–100 px and each brand character costs
   roughly 9 px, so the number of nav items a tenant can show depends on how
   long its name is. Nothing tells the operator this; items just disappear.

## What the runtime currently does about it

Configuration only, no visual change:

- the nav brand is set to `Granite Ridge` while the document and CMS template
  title keep `Granite Ridge Snow Removal`;
- `stormRetail` ships 7 nav items, matching the accepted `stormOps` count, and
  reaches Pricing from the accepted `Manage plan` action on the storm home rail
  rather than from an eighth nav item.

That keeps desktop correct. Mobile is now held by an interim rule set in
`styles/responsive.css`, adopted after the PM reported a broken header on a
phone:

- `.brand-name` truncates with an ellipsis at every width instead of pushing the
  row out of the pill; `.top-nav__brand` may shrink;
- at `vw-mobile` the avatar is hidden and Profile moves into `mobile-nav` below
  a divider;
- at `vw-mobile` the cart is hidden only while it is empty, so the sole route to
  checkout survives;
- at `vw-mobile` the placeholder `brand-logo` yields its width to the name, and
  the brand and primary CTA drop one type step.

Measured after the change, container width in brackets:

| configuration | container | nav overflow | brand shown |
| --- | --- | --- | --- |
| `stormRetail`, brand `Granite Ridge`, empty cart | 375 | 0 px | full |
| `stormRetail`, brand `Granite Ridge`, cart with 1 item | 375 | 0 px | 79/100 px |
| `stormRetail`, brand `Granite Ridge` | 561 | 0 px | 80/110 px |
| `stormRetail`, brand `Granite Ridge` | 1440 | 0 px | full |
| spa target, brand `Calm Harbor Spa` | 375 | 0 px | full |
| any brand up to 38 characters | 375 | 0 px | truncated |

What the interim rules do not settle: between `561` and `1040` the brand is
truncated to about 73 % while three `icon-btn--optional` controls keep their
full width, and there is still no affordance when `nav-links` clips. Items 2 and
3 below remain open.

## What is needed

An accepted visual state for each of:

1. `top-nav` at `375` and `390` with a brand name of 12–28 characters, a primary
   CTA of up to 16 characters, and the cart icon present.
2. `nav-links` when the enabled nav items do not fit the available width above
   `vw-compact` — either a defined truncation affordance, a wrap, an overflow
   menu, or a rule that moves items into the hamburger earlier.
3. The brand lockup when the name must be shortened: whether the shell truncates,
   uses a configured short name, or drops to the logo alone, and at which widths.

## Data that will be dynamic

Brand name, primary CTA label, and the nav label set — all CMS-authored per
tenant. The number of nav items varies by profile (4 to 8 today).

## Required responsive widths

`375`, `390`, `768`, `1180`, `1440`, light and dark.

## Existing components that may be reused

`top-nav`, `nav-links`, `nav-pill`, `nav-link--secondary` (already in
`styles/shell.css` and used by `SpaTopNav`), `mobile-nav`, `hamburger`,
`icon-btn--optional`.

## Constraints

- No customer or session values in the shell; brand and labels are CMS copy.
- The hamburger and `mobile-nav` behavior below `vw-compact` is accepted and
  must not change.
- Any solution must hold for all eight verticals and all six profiles, not only
  for snow.
