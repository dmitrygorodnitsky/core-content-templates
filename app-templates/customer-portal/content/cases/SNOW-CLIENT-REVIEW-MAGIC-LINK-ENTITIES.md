# Snow client review — magic-link entities

Status: implemented contract, rechecked against `dev-1` on 2026-09-21.

One client-review token must grant exact records of these types:

| Entity | Service | Purpose |
| --- | --- | --- |
| `Account` | `core-acct` | Client identity and contract-details prefill |
| `Document` | `core` | `SERVICE_AGREEMENT`, terms, parties and Order ids |
| `Order` | `core-bill` | One property quote, totals, address, pricing model and decision events |
| `OrderItem` | `core-bill` | Quantity, unit price and display order |
| `ProductPrice` | `core-pim` | Connects an OrderItem to its Product |
| `Product` | `core-pim` | Customer-facing service name |

Relationships stay id-only on their owners; referenced records are separate
entries in the same grant:

```text
Document.attributes.ORDERS -> Order
Order.items                 -> OrderItem
OrderItem.itemPrice         -> ProductPrice
ProductPrice.product        -> Product
```

Status is required but is not a separate grant entity. The page needs
`Order.states[].code` and `Document.states[].code`, or an equivalent safe
`currentStateCode` scalar on each record. It does not need workflow history.

Order totals remain scalar Order fields: `totalCharges`, `totalTaxes` and
`grandTotal`. Currency may remain the shallow `{ code, nls }` summary.

Verified on `dev-1` with a fresh combined grant:

- all three Order totals and `states[].code` are readable;
- `OrderItem`, `ProductPrice` and `Product` are grantable in their owning
  services;
- all six entity reads return 200 and introspection reports `canRead: true`;
- the client-review runtime follows the id-only chain above and keeps totals
  server-owned.

Optional later prefill entries are `Contact`, `ContactEntry`, `AccountAddress`
and `Address`. They do not block reviewing or approving a quote.
