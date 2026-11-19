# Script destination review — 17 November 2026

Local transfer rules only; no Core changes. The register includes 39 Java scripts, 20 templates and one platform script dependency.

| Destination | Definitions |
|---|---|
| SYSTEM | 10 |
| WINTER_SERVICES | 46 |
| SERVICEWAND | 4 |

## SYSTEM exceptions

| Code | Reason |
|---|---|
| RESOURCE_MEDIA_LIBRARY | Shared entity media library; retain platform availability for workflows in multiple domains. |
| ACCOUNT_MEDIA_LIBRARY | Shared entity media library; retain platform availability for workflows in multiple domains. |
| PROJECT_MEDIA_LIBRARY | Shared entity media library; retain platform availability for workflows in multiple domains. |
| TASK_MEDIA_LIBRARY | Shared entity media library; retain platform availability for workflows in multiple domains. |
| APPOINTMENT_MEDIA_LIBRARY | Shared entity media library; retain platform availability for workflows in multiple domains. |
| ORGANIZATION_MEDIA_LIBRARY_MANAGEMENT_UTILS | Shared entity media library; retain platform availability for workflows in multiple domains. |
| MAPPINGS_ORDER | Shared Order mapping definition; retain platform visibility. |
| MAPPINGS_DOCUMENT | Shared Document mapping definition; retain platform visibility. |
| ORDER_LIFECYCLE_WORKFLOW | Contains explicit subscription and winter-service order branches. Subscription checks and tax handling must remain visible to SERVICEWAND. |
| INVOICE_LIFECYCLE_WORKFLOW | Contains subscription payment handling (PLAN_SUBSCRIPTION_DRAFT) and winter-service invoice, item, reminder and visit logic. |

## Review evidence

- ORDER_LIFECYCLE_WORKFLOW explicitly detects SERVICEWAND_SUBSCRIPTION, handles subscription taxes and rejects quote preparation for subscriptions; winter quote/property branches are separate.
- INVOICE_LIFECYCLE_WORKFLOW calls PLAN_SUBSCRIPTION_DRAFT for subscription payment handling and also contains winter visit/reminder/item logic.
- Detailed call-path review supersedes the earlier SYSTEM exception: CONTRACT_SOURCES is reached by winter invoice reminders and quote-change notifications, not the normal subscription purchase branch. Target WINTER_SERVICES. See contract-sources-call-path-2026-11-17.md.
- Media libraries and MAPPINGS_ORDER / MAPPINGS_DOCUMENT remain platform dependencies.
- Subscription onboarding metadata names WINTER_SERVICE_QUOTATION_CREATOR for the client winter quote policy; this is a winter-domain dependency, not evidence that all quote logic should live under the seller organization. Its visibility during onboarding must be tested.

## Boundaries

The review is static, based on the local consolidated package and saved source snapshots. It is not a live authorization test. Keep method permissions, capabilities, run-as identities and organization-switching logic unchanged. Owner changes for existing SYSTEM definitions require applying the change to the existing code, not creating duplicates.

Before applying the import, verify lookups under the actual workflow, bulk-action and schedule execution organizations. SYSTEM ownership of a shared caller does not automatically prove access to every domain-owned callee. The deferred replacement of the two excluded schedules remains deferred.

## Exact assignments

| Code | Destination |
|---|---|
| MAPPINGS_ORDER | SYSTEM |
| RESOURCE_MEDIA_LIBRARY | SYSTEM |
| WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES | WINTER_SERVICES |
| WINTER_SERVICES_BULK_APPROVE_QUOTES_DISPATCH | WINTER_SERVICES |
| WINTER_SERVICES_BULK_REQUESTS | WINTER_SERVICES |
| WINTER_SERVICES_CONTRACT_SOURCES | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_PROPERTY_TAG_SYNC | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_QUOTATION_READY | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_QUOTATION_UPDATED | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_QUOTE_ACCOUNT | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_QUOTE_REQUEST | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_TAG_SYNC | WINTER_SERVICES |
| WINTER_SERVICES_PROPERTY_LINK_GRANT | WINTER_SERVICES |
| WINTER_SERVICES_PROPERTY_OPERATIONS | WINTER_SERVICES |
| WINTER_SERVICES_PROPERTY_PLAN | WINTER_SERVICES |
| WINTER_SERVICES_PROPERTY_PLAN_ML | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_CREATOR | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_PROCESSING | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_READY | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_REJECTED | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_REVIEW | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_UPDATED | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_VERIFY_EMAIL | WINTER_SERVICES |
| WINTER_SERVICE_REGION_AI | WINTER_SERVICES |
| WINTER_SERVICE_REGION_WORKFLOW_UTILS | WINTER_SERVICES |
| MAPPINGS_DOCUMENT | SYSTEM |
| WINTER_SERVICES_PORTAL_ACCESS | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_AGREEMENT_READY | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_QUOTATION_DECISIONS_CONFIRMED | WINTER_SERVICES |
| WINTER_SERVICES_PORTAL_USER_PROVISION | WINTER_SERVICES |
| WINTER_SERVICE_AGREEMENT_CHANGES_REQUESTED | WINTER_SERVICES |
| WINTER_SERVICE_AGREEMENT_READY | WINTER_SERVICES |
| WINTER_SERVICE_CONTRACT_DETAILS_RECEIVED | WINTER_SERVICES |
| PLAN_SUBSCRIPTION_DRAFT | SERVICEWAND |
| PLAN_SUBSCRIPTION_ONBOARDING_MODEL | SERVICEWAND |
| PLAN_SUBSCRIPTION_PAYMENT | SERVICEWAND |
| PLAN_SUBSCRIPTION_WORKFLOW | SERVICEWAND |
| WINTER_SERVICE_QUOTATION_DECISIONS_CONFIRMED | WINTER_SERVICES |
| INVOICE_LIFECYCLE_WORKFLOW | SYSTEM |
| ORDER_LIFECYCLE_WORKFLOW | SYSTEM |
| WINTER_SERVICES_BULK_VISIT_ORDERS_DISPATCH | WINTER_SERVICES |
| WINTER_SERVICES_VISIT_CREW_SNAPSHOT | WINTER_SERVICES |
| WINTER_SERVICE_QUOTATION_CHANGES_REQUESTED | WINTER_SERVICES |
| WINTER_SERVICES_CUSTOMER_INVOICE_PAYMENT | WINTER_SERVICES |
| WINTER_SERVICES_INVOICE_CARD_PAYMENT | WINTER_SERVICES |
| WINTER_SERVICES_INVOICE_PAYMENT_REMINDER | WINTER_SERVICES |
| WINTER_SERVICES_PROPERTY_WORKFLOW_UTILS | WINTER_SERVICES |
| ACCOUNT_MEDIA_LIBRARY | SYSTEM |
| WINTER_SERVICES_PORTAL_SERVICE_TAG_SYNC | WINTER_SERVICES |
| WINTER_SERVICES_VISIT_CREW_NAMES | WINTER_SERVICES |
| WINTER_SERVICES_CUSTOMER_SUPPORT_TICKET | WINTER_SERVICES |
| WINTER_SERVICES_SUPPORT_TICKET_THREAD | WINTER_SERVICES |
| WINTER_SERVICES_CUSTOMER_LOGIN_CHANGED | WINTER_SERVICES |
| WINTER_SERVICES_CUSTOMER_PROFILE_APPLY | WINTER_SERVICES |
| WINTER_SERVICES_CUSTOMER_PROFILE_UPDATE | WINTER_SERVICES |
| PROJECT_MEDIA_LIBRARY | SYSTEM |
| TASK_MEDIA_LIBRARY | SYSTEM |
| WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE | WINTER_SERVICES |
| APPOINTMENT_MEDIA_LIBRARY | SYSTEM |
| ORGANIZATION_MEDIA_LIBRARY_MANAGEMENT_UTILS | SYSTEM |
