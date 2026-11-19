# Production deployment — 17 November 2026

Configuration was written to prod.servicewand.com in stages. This report supersedes the preflight status in the historical candidate documents. Do not replay saved requests: resolve current target references and optimistic versions first.

Verified save phases: 733. Registry entries: 354.

- deployed: 328
- deferred: 3
- reused: 23

## Remaining blockers



## Separate follow-ups

- Backend: production OpenAI secret and dependent AI plan configuration.
- Later, by user decision: WINTER_CONTRACT and WINTER_INVOICE. Source archives retrieved and statically checked; production upload, JDBC setup and PDF rendering deferred (not a transfer blocker).

Payments and both schedules remain disabled. No business Accounts, Users, purchases or grants were created by the transfer. Read-back checks establish saved configuration, not production runtime/E2E readiness.
