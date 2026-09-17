# Calm Harbor Customer Portal Wave 14 Productization

## Goal

Ship the accepted Calm Harbor `current-staging` authenticated portal presentation through the existing CMS manual package while preserving the proven OIDC → User → Account → read-only Orders and public PIM data rails.

## Product Decision

- Accepted visual baseline: `app-templates/customer-portal/design-inbox/` Wave 14.1.
- Live capability: `current-staging` only.
- Live routes: Orders, Services & prices, Shop, account/session shell.
- Appointments, booking, order writes, support conversations, My plan/routine, cart, checkout, and profile writes remain unopened.
- Generic Core entity reads are staging-only until backend row isolation is enforced.

## Scope

In scope:

- deterministic source intake and baseline inventory;
- 1:1 Calm Harbor shell, Orders, catalog, Shop, account bootstrap, and support-unavailable transfer;
- identical responsive behavior at 390, 768, 1180, and 1440;
- activation through existing OIDC, Account, Orders, and public PIM adapters;
- generated `CUSTOMER_PORTAL_CALM_HARBOR_STAGING` manual CMS package;
- focused runtime, visual, adapter, and package validation.

Out of scope:

- modifying `design-inbox/**`;
- target Appointment activation or any mutation;
- production authorization claims beyond bounded staging evidence;
- uploading or publishing to CMS.

## Core Rules

- Visual transfer precedes adapter activation.
- `design-inbox/**` is immutable designer-owned source.
- No fixture customer or success fallback in live mode.
- No Account/User/Order identifiers originate from CMS or URL input.
- Support ends in the accepted unavailable dialog; no fixture chat is reachable.
- Generated `dist/manual-upload/**` files are exporter-owned.

## Ownership Zones

- Reference: `app-templates/customer-portal/design-inbox/**` (read-only).
- Production runtime: `app-templates/customer-portal/runtime/**`.
- CMS source/export: `app-templates/customer-portal/content/cases/**`, `cms/**`, `scripts/export-calm-harbor-portal-manual.mjs`.
- Generated output: `app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging/**`.
- Evidence: this package.

## Wave Ledger

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| S0 source intake | reference | local | done | — | JS syntax, JSON parse, blocker inventory | Wave 14.1 is deterministic and accepted |
| S1 executable transfer | runtime presentation | local | done | S0 | reference/runtime route smoke | staging surfaces are mounted without adapter-driven layout |
| S2 visual acceptance | runtime + evidence | local | done | S1 | paired screenshots and DOM metrics | 12 ready-state pairs preserve the accepted geometry at four widths |
| S3 adapter activation | runtime adapters | local | done | S2 | account/orders/PIM focused checks | live data fills accepted contracts without layout drift |
| S4 CMS package + closeout | exporter/dist/docs | local | done | S3 | exporter, manual check, diff check | package regenerated and residuals recorded honestly |

## Definition of Done

- The CMS staging root renders the accepted `current-staging` shell and routes.
- OIDC and Account bootstrap fail closed; Orders remain read-only and Account-filtered.
- Services/prices and Shop use only proven public PIM fields.
- Support unavailable, loading, empty, error, unauthorized/account failure, mobile navigation, light/dark, and long-row behavior are preserved where applicable.
- Visual evidence covers 390, 768, 1180, and 1440 with no unapproved drift.
- Focused checks and generated-package inventory pass.
- `audits/A1.md` and `evidence/closeout.md` state real residuals.

## Delivery Notes

- Source intake accepted locally from the user-updated Wave 14.1 package.
- No upload, publish, or commit was performed by this wave.
