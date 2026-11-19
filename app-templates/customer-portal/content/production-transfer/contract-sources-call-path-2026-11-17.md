# CONTRACT_SOURCES call-path review

Decision: WINTER_SERVICES_CONTRACT_SOURCES belongs to WINTER_SERVICES; retain its existing code. The earlier SYSTEM exception was based on a shared caller file, not the actual branch, and is withdrawn.

- INVOICE_LIFECYCLE_WORKFLOW: runReminders -> reminder process -> invoiceIds -> remind -> addEmailSignature -> CONTRACT_SOURCES.emailSignature. The SQL filters order.type.code to FIELD_SERVICE_ORDER, WINTER_SERVICES_ORDER, WINTER_SERVICE_ORDER and SNOW_VISIT_ORDER. SERVICEWAND_SUBSCRIPTION is excluded. The send executes as the system user in the invoice organization.
- ORDER_LIFECYCLE_WORKFLOW: quote changes / retry -> notifyChangesAfterCommit -> changesNotification -> commercialRecipients -> CONTRACT_SOURCES.communication. This is the CUSTOMER_CHANGES_REQUESTED notification path, executed in the order organization. The normal subscription path uses checkout submission; onQuotePrepared explicitly rejects subscriptions.
- PLAN_SUBSCRIPTION scripts have no direct CONTRACT_SOURCES reference. The quote-policy metadata names the quote creator for winter client quotes; it does not itself invoke CONTRACT_SOURCES during checkout.
- The quote creator uses provider, communication and emailSignature for winter quotes/agreements.

Limits: static inspection, no workflows executed. The public onCustomerChangesRequested handler itself does not explicitly reject subscriptions; forced invocation or an incorrectly configured state transition could reach it. This finding covers the intended subscription purchase flow, not every arbitrary method invocation. It does not introduce a new guard or change behavior.

Rules, JSON/CSV registry and ownership review updated locally. No Core writes; Sites not republished for this correction.
