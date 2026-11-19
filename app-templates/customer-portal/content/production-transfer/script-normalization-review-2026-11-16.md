# Инвентаризация скриптов перед переносом — 16 ноября 2026

Актуальная проверка prod, правила переиспользования SYSTEM, конфликты и порядок загрузки: [готовность переноса](prod-readiness-2026-11-16.md).

Задачи: убрать суффиксы версий; сократить число скриптов внутри флоу; заменить префикс SNOW_ на WINTER_SERVICES_.

Уточнение после чтения топологии prod: [план дальнейшего объединения](prod-consolidation-review-2026-11-16.md). Причины сохранения отдельных скриптов ниже пересмотрены: одинаковые имена методов и асинхронность сами по себе не запрещают слияние.

## Выполнение локально

После нормализации и дополнительного объединения: **60 определений**, без суффиксов версий и без префикса SNOW_ у скриптов. Это **40 Java-скриптов и 20 Velocity-шаблонов** (18 EMAIL_TEMPLATE и 2 WORKFLOW). До изменений было 265 рабочих/исторических определений плюс 41 диагностическое ZZ_.

- 41 диагностический скрипт физически удалён вместе с исходниками и отдельными пакетами; связанные проверки удалённых ремонтных инструментов убраны, проверки рабочего поведения сохранены.
- На семейство оставлена одна реализация. Старые исходники, необходимые историческим тестам, не являются deploy-пакетом.
- Agreement ACTIVATION объединён с PROCESSOR: публичный finalizeApproval сохранён, права CORE/ACCT/BILL не расширены, старые ключи повторов привязаны к методу.
- Четыре стандартных bulk-диспетчера объединены в WINTER_SERVICES_BULK_DISPATCH; роли Admin + Sales, пять методов и отдельные асинхронные исполнители сохранены. Диспетчер утверждения (Admin), визитов (Admin + Billing Finance) и старой отправки договора (конфликтующий метод) оставлены отдельно.
- Два Property resolver объединены в WINTER_SERVICES_SERVICE_PROPERTY: методы resolveServiceAddress и resolveServiceArea сохранены, права CORE/RM не расширены.
- Четыре PLAN_SUBSCRIPTION скрипта и все остальные определения в проверенных manifest переведены на коды без версии; SNOW_ у скриптов заменён на WINTER_SERVICES_. Коды типов/организаций не менялись.
- Оба списка переноса обновлены. Для изменившихся кодов старые ID очищены, состояние prod отмечено как требующее сверки, а не выдано за проверенное.
- Закрыто последующим чтением dev-1: шесть ранее отсутствовавших определений: RESOURCE_MEDIA_LIBRARY, ACCOUNT_MEDIA_LIBRARY, PROJECT_MEDIA_LIBRARY, TASK_MEDIA_LIBRARY, APPOINTMENT_MEDIA_LIBRARY, SNOW_ROUTE_CHAT_LIFECYCLE. Все шесть получены и добавлены локально; см. раздел ниже.
- CSV инвентаризации и ссылок отражают текущее локальное состояние. Нижележащий разбор и таблица 89 семейств сохранены как исходный план, не текущий deploy manifest.

### Дополнительное объединение по проверенной топологии prod

Два прохода объединения сократили пакет с 70 до 40 Java: сначала 70 → 56, затем семь согласованных групп 56 → 40. Подробная таблица, ограничения прав и результаты тестов — в [отчёте консолидации](prod-consolidation-review-2026-11-16.md). Предыдущие причины отказа по одинаковым именам методов и асинхронности пересмотрены; эти ограничения устранены сохранением отдельных входов и очередей внутри общего скрипта.

Серверы не менялись. После отдельного согласованного исправления источник названия клиента в доставке котировки — Account; прежний блокер LEGAL_NAME закрыт, workflowSeedCheck проходит.

### Зависимость между зонами

Portal build tooling (подписка) зависит от Core UI seed scripts (котировки, Invoice/Order): согласованное переименование вызовов и refresh fingerprints через штатный генератор. Portal product docs получает оба списка переноса. Критерий приёмки — новые коды разрешаются, права и методы сохранены, целевые проверки проходят. Владелец текущего изменения — эта рабочая сессия; UI и типы вне изменения.

## Исходная инвентаризация до нормализации

## Что проверено

Локальные JSON seed-пакеты core-ui/scripts/dev/seeds, привязанные ими исходники, workflow, конфигурация расписания тегов, метаданные подписки и её workflow. Отдельный поиск ссылок охватывает dev-скрипты, проверки, права и runtime портала. Сверен список snow-crm-owned-flows-2026-11-16.csv. Архив rollback, сгенерированный dist и design-inbox не используются как подтверждение рабочего вызова.

Состояние сервера dev-1 и prod заново не читалось. «Достижим» означает найденную цепочку текстовых ссылок от локальной конфигурации, а не доказательство исполнения на сервере. Комментарии и строки конфигурации могут давать лишние ссылки; динамически составляемые коды могут быть пропущены. Перед удалением старого кода обязательно проверить живые workflow, расписания, роли, шаблоны и отложенные задания.

Обнаружено **265 определений в 89 семействах** (семейство — код без _Vчисло). Из них **233 определений с версией**, **202 с SNOW_**. Это не число необходимых рабочих скриптов: сюда входят исторические определения. Дополнительно 41 диагностических/ремонтных определений ZZ_ вынесены за рабочий контур. Дубли одного кода в разных manifest учитываются как отдельные определения.

Файлы:

- [Семейства и предлагаемые коды](script-normalization-families-2026-11-16.csv) — компактная полная таблица.
- [Каждое определение, методы, capabilities и зависимости](script-normalization-inventory-2026-11-16.csv).
- [Места ссылок и прав с номерами строк](script-normalization-references-2026-11-16.csv). Здесь есть исторические исходники и тесты; строка в этой таблице сама по себе не означает рабочий вызов.

## 1. Удаление версий

У Service Agreement шесть исполнителей уже имеют коды без версии с WINTER_SERVICES_. Также без версии уже сведены WINTER_SERVICE_REGION_WORKFLOW_UTILS, WINTER_SERVICE_QUOTATION_DRAFT_CREATOR, SNOW_PROPERTY_LINK_GRANT, SNOW_PORTAL_TAG_SYNC и SNOW_PORTAL_PROPERTY_TAG_SYNC. Последним трём ещё требуется смена префикса.

В проверенной локальной цепочке не обнаружены два достижимых кода одного семейства одновременно. Но в пакетах остаётся много исторических реализаций, а некоторые входы — например решение клиента по ссылке — нельзя считать полностью покрытыми локальными workflow-привязками. Поэтому брать максимальный номер автоматически нельзя.

Порядок для каждого семейства: подтвердить рабочие входы → сохранить все используемые методы → перенести реализацию в один код → обновить вызовы/права/расписание → проверить повторы и отложенные задания → убрать старые определения из deploy-пакета. Исторические источники тестов удаляются отдельно, после замены соответствующих проверок.

## 2. Что объединять

Это кандидаты на объединение, а не одобренная замена поведения. Точное количество итоговых скриптов станет известно после разбора методов. Разные capabilities нельзя незаметно объединять в один более привилегированный публичный вход.

| Флоу | Предлагаемое разделение | Что проверить перед объединением |
|---|---|---|
| Service Agreement | Оркестратор workflow; обработка данных и активация; доставка; проверка Invoice. PORTAL_USER_PROVISION остаётся общей зависимостью | PROCESSOR + ACTIVATION — первый кандидат, одинаковые CORE/ACCT/BILL. Сохранить методы, транзакции, повторы и старые fingerprints операций. Доставка требует PIM, invoice guard — только BILL |
| Котировка из формы и портала | Общая подготовка заявки/раунда; обработчик портальной формы; расчёт; отправка раунда и решение клиента | PORTAL_QUOTE_ACCOUNT/PROPERTIES/REQUEST — кандидаты, но права ACCT/RM/CMS различаются. Сохранить ORIGIN, состав раунда, повтор запроса и несколько адресов |
| Котировка: события и письма | Сгруппировать небольшие однотипные обработчики событий в методы одного скрипта уведомлений, если совпадают контекст и права | QUOTATION_READY/UPDATED/REVIEW/REJECTED/PROCESSING и их портальные варианты: сначала сравнить получателей, шаблоны и способ запуска |
| Массовые действия | Общий диспетчер похожих действий; исполнители по предметной области | BULK_QUOTES, REQUESTS, PROPERTY_PLANS, SEND_ROUND, APPROVE_QUOTES, VISIT_ORDERS. Не смешать выдачу прав и выполнение задач; сохранить очереди, прогресс, повтор и защиту от дублей |
| Property и план | Lifecycle/активация; генерация плана; утверждение плана и связанный перерасчёт | PLAN, PLAN_BACKEND, IMAGE, JSON могут иметь разные способы исполнения. PLAN_APPROVAL и AREA_QUOTES связаны, но нужно сохранить обновление котировок. Общий генератор не сливать с массовым диспетчером |
| Order / OrderItem | Оставить общий lifecycle заказа и строки отдельно от зимней бизнес-логики котировки | ORDER_LIFECYCLE_WORKFLOW и ORDER_ITEM_LIFECYCLE_WORKFLOW могут использоваться вне Snow CRM; слияние с QUOTATION_ORDER_UTILITIES затронет чужие типы |
| Invoice | Lifecycle; платёжный сервис; форма оплаты; напоминания | INVOICE_CARD_PAYMENT использует PAY, CUSTOMER_INVOICE_PAYMENT — CMS. Сведение их в один скрипт расширит доступ. Напоминания требуют отдельного запуска по расписанию |
| Подписка | Сохранить четыре границы: workflow формы, Checkout/Draft, модель онбординга, платёж | Убрать V11/V5/V1/V1. Onboarding/checkout уже имеют раздельные локальные исходники и генерацию: уменьшение числа файлов само по себе ухудшит поддержку |
| Доступ в портал | Выдача доступа/пользователя; общий link grant; синхронизация тегов с отдельным запуском расписания | Link grant сохраняет методы для документа и раунда. Tag sync сохраняет немедленный и полный проход. Нельзя сливать выдачу прав со случайным потребителем |
| Профиль клиента | Обработчик запроса и применение изменений; смену логина рассмотреть отдельно | PROFILE_UPDATE/APPLY и LOGIN_CHANGE/CHANGED: подтверждение email, уникальность логина и отзыв старого доступа |
| Поддержка | Создание/обработка заявки и работа с перепиской — 1–2 исполнителя при совпадении прав | SUPPORT_TICKET_CREATE, CUSTOMER_SUPPORT_TICKET, SUPPORT_TICKET_THREAD; авторство, видимость и уведомления |
| Визиты и экипаж | Подготовка визитов; снимок экипажа; массовый запуск | VISIT_ORDER_VISITS/VISIT_ORDERS и CREW_NAMES/SNAPSHOT. Проверить назначения сотрудников и то, когда фиксируется состав экипажа |
| Media library и Route chat | Пока не объединять: сначала получить исходники | Эти зависимости есть в списке переноса, но определения не найдены в проверенных пакетах |

## 3. Единое именование

Правило для скриптов: SNOW_X_Vn → WINTER_SERVICES_X. PLAN_SUBSCRIPTION_* сохраняет своё предметное имя и теряет только _Vn. Уже общие ORDER_*/INVOICE_* не получают зимний префикс автоматически.

Отдельная несогласованность: остаются имена WINTER_SERVICE_* в единственном числе. В CSV их префикс пока сохранён: исходное поручение — заменить SNOW_. Для полной унификации предлагается отдельно нормализовать их в WINTER_SERVICES_* при обработке котировок.

При переименовании обновляются: manifest/code/contentFile; обращения к scriptManager и вызовы методов; workflow.script и встроенные обработчики; расписания и bulk actions; P_SCRIPT_X_* и другие фактически найденные права; метаданные и конфиги; UI-вызовы; тесты/ожидаемые fingerprints; оба списка переноса. Старые коды в журнале исполнения и ключах идемпотентности не заменять механически.

SNOW_REMOVAL_PROPERTY и другие коды типов, организации SNOWLIMITLESS, коды шаблонов писем, URL и названия продуктов этим поручением автоматически не переименовываются: это отдельные контракты данных.

## Расхождения со списком переноса

- WINTER_SERVICE_REGION_WORKFLOW_UTILS_V45 нужно сверить с уже каноническим WINTER_SERVICE_REGION_WORKFLOW_UTILS.
- WINTER_SERVICE_QUOTATION_DRAFT_CREATOR_V5 и V7 нужно заменить одной записью WINTER_SERVICE_QUOTATION_DRAFT_CREATOR.
- WINTER_SERVICE_QUOTATION_CREATOR без версии указан в списке, но в проверенном seed есть V3–V9, рабочая локальная ссылка — V9. Не путать его с DRAFT_CREATOR.
- RESOURCE_MEDIA_LIBRARY, ACCOUNT_MEDIA_LIBRARY, PROJECT_MEDIA_LIBRARY, TASK_MEDIA_LIBRARY, APPOINTMENT_MEDIA_LIBRARY и SNOW_ROUTE_CHAT_LIFECYCLE: получить определения и зависимости перед переносом. Наличие строки CSV не заменяет исходник.
- В seed есть достижимые вспомогательные реализации, отсутствующие отдельной строкой списка. Например SNOW_INVOICE_WORKFLOW_UTILITIES_V2. Список нужно строить с транзитивными зависимостями, а не только по главным workflow.
- Нет ссылок — не значит можно удалить. ZZ_* — кандидаты на исключение из релиза, но backfill/reconcile могут потребоваться при миграции существующих данных; запускать их автоматически нельзя.

## Очерёдность

1. Завершить Service Agreement: проверить кандидат PROCESSOR + ACTIVATION и оставить общие сервисы отдельными.
2. Котировки/раунды и все входы решения клиента; одновременно поправить устаревшие строки переноса.
3. Property и массовые действия.
4. Общий доступ в портал, теги, пользователь и link grant.
5. Invoice, Order/OrderItem; затем профиль, поддержка, визиты.
6. Подписка — только после стабилизации кодов её зависимостей; регенерировать исходники штатным sync.
7. Получить недостающие скрипты, сверить граф с dev-1, проверить импорт на пустой среде и лишь затем считать пакет готовым к prod.

## Полный список семейств

«Ссылки» ниже — локально достижимые коды. Прочерк означает, что путь не найден, а не доказанное отсутствие использования. Количество — определения во всех проверенных manifest.

| Семейство | Определений | Ссылки из локальной конфигурации | Код после переименования |
|---|---:|---|---|
| SNOW_INVOICE_CARD_PAYMENT | 2 | SNOW_INVOICE_CARD_PAYMENT_V2 | WINTER_SERVICES_INVOICE_CARD_PAYMENT |
| SNOW_CUSTOMER_INVOICE_PAYMENT | 2 | SNOW_CUSTOMER_INVOICE_PAYMENT_V2 | WINTER_SERVICES_CUSTOMER_INVOICE_PAYMENT |
| SNOW_INVOICE_WORKFLOW_UTILITIES | 2 | SNOW_INVOICE_WORKFLOW_UTILITIES_V2 | WINTER_SERVICES_INVOICE_WORKFLOW_UTILITIES |
| SNOW_CUSTOMER_LOGIN_CHANGED | 1 | SNOW_CUSTOMER_LOGIN_CHANGED_V2 | WINTER_SERVICES_CUSTOMER_LOGIN_CHANGED |
| SNOW_CUSTOMER_PROFILE_UPDATE | 1 | SNOW_CUSTOMER_PROFILE_UPDATE_V1 | WINTER_SERVICES_CUSTOMER_PROFILE_UPDATE |
| SNOW_CUSTOMER_LOGIN_CHANGE | 1 | SNOW_CUSTOMER_LOGIN_CHANGE_V1 | WINTER_SERVICES_CUSTOMER_LOGIN_CHANGE |
| SNOW_CUSTOMER_PROFILE_APPLY | 1 | SNOW_CUSTOMER_PROFILE_APPLY_V1 | WINTER_SERVICES_CUSTOMER_PROFILE_APPLY |
| SNOW_SUPPORT_TICKET_CREATE | 1 | — | WINTER_SERVICES_SUPPORT_TICKET_CREATE |
| SNOW_CUSTOMER_SUPPORT_TICKET | 2 | SNOW_CUSTOMER_SUPPORT_TICKET_V2 | WINTER_SERVICES_CUSTOMER_SUPPORT_TICKET |
| SNOW_SUPPORT_TICKET_THREAD | 1 | SNOW_SUPPORT_TICKET_THREAD_V1 | WINTER_SERVICES_SUPPORT_TICKET_THREAD |
| MAPPINGS_ORDER | 1 | — | MAPPINGS_ORDER |
| MAPPINGS_DOCUMENT | 1 | — | MAPPINGS_DOCUMENT |
| SNOW_INVOICE_PAYMENT_REMINDER | 1 | SNOW_INVOICE_PAYMENT_REMINDER | WINTER_SERVICES_INVOICE_PAYMENT_REMINDER |
| INVOICE_PAYMENT_REMINDERS | 1 | INVOICE_PAYMENT_REMINDERS | INVOICE_PAYMENT_REMINDERS |
| ORDER_ITEM_LIFECYCLE_WORKFLOW | 1 | ORDER_ITEM_LIFECYCLE_WORKFLOW | ORDER_ITEM_LIFECYCLE_WORKFLOW |
| INVOICE_LIFECYCLE_WORKFLOW | 1 | INVOICE_LIFECYCLE_WORKFLOW | INVOICE_LIFECYCLE_WORKFLOW |
| ORDER_LIFECYCLE_WORKFLOW | 1 | ORDER_LIFECYCLE_WORKFLOW | ORDER_LIFECYCLE_WORKFLOW |
| SNOW_PORTAL_ACCESS | 1 | SNOW_PORTAL_ACCESS_V2 | WINTER_SERVICES_PORTAL_ACCESS |
| SNOW_PORTAL_QUOTE_ACCOUNT | 1 | SNOW_PORTAL_QUOTE_ACCOUNT_V1 | WINTER_SERVICES_PORTAL_QUOTE_ACCOUNT |
| SNOW_PORTAL_QUOTE_PROPERTIES | 1 | SNOW_PORTAL_QUOTE_PROPERTIES_V1 | WINTER_SERVICES_PORTAL_QUOTE_PROPERTIES |
| SNOW_PORTAL_QUOTE_REQUEST | 1 | SNOW_PORTAL_QUOTE_REQUEST_V1 | WINTER_SERVICES_PORTAL_QUOTE_REQUEST |
| SNOW_QUOTATION_ORDER_UTILITIES | 32 | SNOW_QUOTATION_ORDER_UTILITIES_V33 | WINTER_SERVICES_QUOTATION_ORDER_UTILITIES |
| WINTER_SERVICE_QUOTATION_CHANGES_REQUESTED | 3 | WINTER_SERVICE_QUOTATION_CHANGES_REQUESTED_V3 | WINTER_SERVICE_QUOTATION_CHANGES_REQUESTED |
| SNOW_SERVICE_PROPERTY_ADDRESS | 1 | SNOW_SERVICE_PROPERTY_ADDRESS_V1 | WINTER_SERVICES_SERVICE_PROPERTY_ADDRESS |
| SNOW_ORDER_ITEM_UTILITIES | 1 | SNOW_ORDER_ITEM_UTILITIES_V1 | WINTER_SERVICES_ORDER_ITEM_UTILITIES |
| SNOW_SERVICE_PROPERTY_AREA | 1 | SNOW_SERVICE_PROPERTY_AREA_V1 | WINTER_SERVICES_SERVICE_PROPERTY_AREA |
| SNOW_BULK_QUOTES | 16 | SNOW_BULK_QUOTES_V16 | WINTER_SERVICES_BULK_QUOTES |
| SNOW_BULK_QUOTES_DISPATCH | 17 | SNOW_BULK_QUOTES_DISPATCH_V17 | WINTER_SERVICES_BULK_QUOTES_DISPATCH |
| SNOW_SERVICE_QUOTATION_ROUND_DELIVERY | 4 | SNOW_SERVICE_QUOTATION_ROUND_DELIVERY_V4 | WINTER_SERVICES_SERVICE_QUOTATION_ROUND_DELIVERY |
| SNOW_BULK_SEND_ROUND | 4 | SNOW_BULK_SEND_ROUND_V4 | WINTER_SERVICES_BULK_SEND_ROUND |
| SNOW_BULK_SEND_ROUND_DISPATCH | 2 | SNOW_BULK_SEND_ROUND_DISPATCH_V2 | WINTER_SERVICES_BULK_SEND_ROUND_DISPATCH |
| SNOW_BULK_APPROVE_QUOTES_DISPATCH | 5 | SNOW_BULK_APPROVE_QUOTES_DISPATCH_V5 | WINTER_SERVICES_BULK_APPROVE_QUOTES_DISPATCH |
| SNOW_SERVICE_QUOTATION_DELIVERY | 18 | SNOW_SERVICE_QUOTATION_DELIVERY_V17 | WINTER_SERVICES_SERVICE_QUOTATION_DELIVERY |
| WINTER_SERVICE_CONTRACT_DETAILS_RECEIVED | 2 | WINTER_SERVICE_CONTRACT_DETAILS_RECEIVED_V2 | WINTER_SERVICE_CONTRACT_DETAILS_RECEIVED |
| WINTER_SERVICE_AGREEMENT_READY | 2 | WINTER_SERVICE_AGREEMENT_READY_V2 | WINTER_SERVICE_AGREEMENT_READY |
| WINTER_SERVICE_QUOTATION_READY | 2 | WINTER_SERVICE_QUOTATION_READY_V2 | WINTER_SERVICE_QUOTATION_READY |
| WINTER_SERVICE_QUOTATION_UPDATED | 2 | WINTER_SERVICE_QUOTATION_UPDATED_V2 | WINTER_SERVICE_QUOTATION_UPDATED |
| SNOW_BULK_SEND_QUOTATION | 9 | SNOW_BULK_SEND_QUOTATION_V9 | WINTER_SERVICES_BULK_SEND_QUOTATION |
| WINTER_SERVICE_AGREEMENT_CHANGES_REQUESTED | 1 | WINTER_SERVICE_AGREEMENT_CHANGES_REQUESTED_V2 | WINTER_SERVICE_AGREEMENT_CHANGES_REQUESTED |
| WINTER_SERVICE_QUOTATION_DECISIONS_CONFIRMED | 2 | WINTER_SERVICE_QUOTATION_DECISIONS_CONFIRMED_V3 | WINTER_SERVICE_QUOTATION_DECISIONS_CONFIRMED |
| SNOW_QUOTATION_DECISION_CONFIRMATION | 12 | SNOW_QUOTATION_DECISION_CONFIRMATION_V10 | WINTER_SERVICES_QUOTATION_DECISION_CONFIRMATION |
| SNOW_PROPERTY_APPROVED_PLAN | 1 | — | WINTER_SERVICES_PROPERTY_APPROVED_PLAN |
| SNOW_PROPERTY_LINK_GRANT | 2 | SNOW_PROPERTY_LINK_GRANT | WINTER_SERVICES_PROPERTY_LINK_GRANT |
| SNOW_CONTRACT_SOURCES | 1 | SNOW_CONTRACT_SOURCES_V1 | WINTER_SERVICES_CONTRACT_SOURCES |
| WINTER_SERVICES_AGREEMENT_ACTIVATION | 1 | WINTER_SERVICES_AGREEMENT_ACTIVATION | WINTER_SERVICES_AGREEMENT_ACTIVATION |
| SNOW_PORTAL_PROPERTY_TAG_SYNC | 1 | SNOW_PORTAL_PROPERTY_TAG_SYNC | WINTER_SERVICES_PORTAL_PROPERTY_TAG_SYNC |
| SNOW_PORTAL_SERVICE_TAG_SYNC | 1 | SNOW_PORTAL_SERVICE_TAG_SYNC_V1 | WINTER_SERVICES_PORTAL_SERVICE_TAG_SYNC |
| SNOW_PORTAL_TAG_RECONCILE | 3 | SNOW_PORTAL_TAG_RECONCILE_V3 | WINTER_SERVICES_PORTAL_TAG_RECONCILE |
| SNOW_PORTAL_TAG_SYNC | 1 | SNOW_PORTAL_TAG_SYNC | WINTER_SERVICES_PORTAL_TAG_SYNC |
| WINTER_SERVICES_PORTAL_USER_PROVISION | 1 | WINTER_SERVICES_PORTAL_USER_PROVISION | WINTER_SERVICES_PORTAL_USER_PROVISION |
| SNOW_PORTAL_QUOTATION_READY | 1 | SNOW_PORTAL_QUOTATION_READY_V2 | WINTER_SERVICES_PORTAL_QUOTATION_READY |
| SNOW_PORTAL_QUOTATION_UPDATED | 1 | SNOW_PORTAL_QUOTATION_UPDATED_V2 | WINTER_SERVICES_PORTAL_QUOTATION_UPDATED |
| SNOW_PORTAL_QUOTATION_DECISIONS_CONFIRMED | 1 | — | WINTER_SERVICES_PORTAL_QUOTATION_DECISIONS_CONFIRMED |
| SNOW_PORTAL_AGREEMENT_READY | 1 | SNOW_PORTAL_AGREEMENT_READY_V2 | WINTER_SERVICES_PORTAL_AGREEMENT_READY |
| WINTER_SERVICES_AGREEMENT_INVOICE_GUARD | 1 | WINTER_SERVICES_AGREEMENT_INVOICE_GUARD | WINTER_SERVICES_AGREEMENT_INVOICE_GUARD |
| WINTER_SERVICES_AGREEMENT_PROCESSOR | 1 | WINTER_SERVICES_AGREEMENT_PROCESSOR | WINTER_SERVICES_AGREEMENT_PROCESSOR |
| WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES | 1 | WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES | WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES |
| WINTER_SERVICES_AGREEMENT_DELIVERY | 1 | WINTER_SERVICES_AGREEMENT_DELIVERY | WINTER_SERVICES_AGREEMENT_DELIVERY |
| SNOW_PROPERTY_PLAN_APPROVAL | 7 | SNOW_PROPERTY_PLAN_APPROVAL_V10 | WINTER_SERVICES_PROPERTY_PLAN_APPROVAL |
| SNOW_PROPERTY_AREA_QUOTES | 4 | SNOW_PROPERTY_AREA_QUOTES_V4 | WINTER_SERVICES_PROPERTY_AREA_QUOTES |
| SNOW_BULK_PROPERTY_PLANS | 4 | SNOW_BULK_PROPERTY_PLANS_V4 | WINTER_SERVICES_BULK_PROPERTY_PLANS |
| SNOW_BULK_PROPERTY_PLANS_DISPATCH | 4 | SNOW_BULK_PROPERTY_PLANS_DISPATCH_V4 | WINTER_SERVICES_BULK_PROPERTY_PLANS_DISPATCH |
| SNOW_PROPERTY_ACTIVATION | 1 | SNOW_PROPERTY_ACTIVATION_V1 | WINTER_SERVICES_PROPERTY_ACTIVATION |
| SNOW_PROPERTY_WORKFLOW_UTILS | 1 | SNOW_PROPERTY_WORKFLOW_UTILS_V1 | WINTER_SERVICES_PROPERTY_WORKFLOW_UTILS |
| SNOW_PROPERTY_PLAN_BACKEND | 8 | SNOW_PROPERTY_PLAN_BACKEND_V13 | WINTER_SERVICES_PROPERTY_PLAN_BACKEND |
| SNOW_VISIT_ORDER_VISITS | 1 | SNOW_VISIT_ORDER_VISITS | WINTER_SERVICES_VISIT_ORDER_VISITS |
| SNOW_VISIT_ORDERS | 1 | SNOW_VISIT_ORDERS | WINTER_SERVICES_VISIT_ORDERS |
| SNOW_BULK_VISIT_ORDERS_DISPATCH | 1 | SNOW_BULK_VISIT_ORDERS_DISPATCH | WINTER_SERVICES_BULK_VISIT_ORDERS_DISPATCH |
| SNOW_VISIT_CREW_NAMES | 1 | SNOW_VISIT_CREW_NAMES_V1 | WINTER_SERVICES_VISIT_CREW_NAMES |
| SNOW_VISIT_CREW_SNAPSHOT | 1 | SNOW_VISIT_CREW_SNAPSHOT_V1 | WINTER_SERVICES_VISIT_CREW_SNAPSHOT |
| WINTER_SERVICE_REGION_AI | 1 | WINTER_SERVICE_REGION_AI | WINTER_SERVICE_REGION_AI |
| WINTER_SERVICE_QUOTATION_PROCESSING | 2 | WINTER_SERVICE_QUOTATION_PROCESSING_V2 | WINTER_SERVICE_QUOTATION_PROCESSING |
| WINTER_SERVICE_QUOTATION_REJECTED | 2 | WINTER_SERVICE_QUOTATION_REJECTED_V2 | WINTER_SERVICE_QUOTATION_REJECTED |
| WINTER_SERVICE_QUOTATION_REVIEW | 2 | WINTER_SERVICE_QUOTATION_REVIEW_V2 | WINTER_SERVICE_QUOTATION_REVIEW |
| WINTER_SERVICE_QUOTATION_CREATOR | 6 | WINTER_SERVICE_QUOTATION_CREATOR_V9 | WINTER_SERVICE_QUOTATION_CREATOR |
| WINTER_SERVICE_PROPERTY_CREATOR | 12 | WINTER_SERVICE_PROPERTY_CREATOR_V18 | WINTER_SERVICE_PROPERTY_CREATOR |
| WINTER_SERVICE_QUOTATION_DRAFT_PRICER | 5 | WINTER_SERVICE_QUOTATION_DRAFT_PRICER_V5 | WINTER_SERVICE_QUOTATION_DRAFT_PRICER |
| WINTER_SERVICE_QUOTATION_VERIFY_EMAIL | 1 | WINTER_SERVICE_QUOTATION_VERIFY_EMAIL | WINTER_SERVICE_QUOTATION_VERIFY_EMAIL |
| SNOW_PROPERTY_PLAN | 9 | SNOW_PROPERTY_PLAN_V15 | WINTER_SERVICES_PROPERTY_PLAN |
| SNOW_PROPERTY_PLAN_IMAGE | 1 | — | WINTER_SERVICES_PROPERTY_PLAN_IMAGE |
| SNOW_PROPERTY_PLAN_JSON | 1 | — | WINTER_SERVICES_PROPERTY_PLAN_JSON |
| WINTER_SERVICE_QUOTATION_DRAFT_CREATOR | 1 | WINTER_SERVICE_QUOTATION_DRAFT_CREATOR | WINTER_SERVICE_QUOTATION_DRAFT_CREATOR |
| WINTER_SERVICE_REGION_WORKFLOW_UTILS | 1 | WINTER_SERVICE_REGION_WORKFLOW_UTILS | WINTER_SERVICE_REGION_WORKFLOW_UTILS |
| SNOW_BULK_REQUESTS | 1 | SNOW_BULK_REQUESTS_V5 | WINTER_SERVICES_BULK_REQUESTS |
| SNOW_BULK_REQUESTS_DISPATCH | 1 | SNOW_BULK_REQUESTS_DISPATCH_V5 | WINTER_SERVICES_BULK_REQUESTS_DISPATCH |
| PLAN_SUBSCRIPTION_WORKFLOW | 1 | PLAN_SUBSCRIPTION_WORKFLOW_V11 | PLAN_SUBSCRIPTION_WORKFLOW |
| PLAN_SUBSCRIPTION_DRAFT | 1 | PLAN_SUBSCRIPTION_DRAFT_V5 | PLAN_SUBSCRIPTION_DRAFT |
| PLAN_SUBSCRIPTION_ONBOARDING_MODEL | 1 | PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1 | PLAN_SUBSCRIPTION_ONBOARDING_MODEL |
| PLAN_SUBSCRIPTION_PAYMENT | 1 | PLAN_SUBSCRIPTION_PAYMENT_V1 | PLAN_SUBSCRIPTION_PAYMENT |

## Проверки после изменений

- 84 определения: коды уникальны, исходники существуют, нет `_Vчисло`, `SNOW_` или `ZZ_` в кодах deploy-скриптов.
- Проверки исполнения Agreement: повторы, неопределённый исход, конкурирующие вызовы, receipts и прежние fingerprints проходят. Доставка: 14 сценариев котировки, 12 активации, по 45 проверок grants для котировки и договора.
- Полная компиляция объединённого Property на тестовых границах: 16 проверок. Полная компиляция объединённого Bulk на тестовых границах: 5 публичных действий сохраняют исполнителя, метод, пользователя, организацию и результат.
- Подписка: 37 Node-проверок, 291 Java assertion в шести наборах, 20 граничных проверок срока Quote; генератор синхронизирован.
- Независимый аудит сравнил тела объединённых методов, capabilities, параметры методов и роли. Открытых P0/P1 в проверенных изменениях не осталось.
- `snowVisitCrewSnapshotCheck` имеет исходное противоречие: запрещает `P_TAG_TASK_E`, уже присутствующий в HEAD роли портала. Право не удалялось ради теста. Это не успешная проверка и не новая ошибка рефакторинга.
- Проверка Contract Sources обновлена под текущую сигнатуру approval hook и проходит: 13 сценариев источников, дата организации/повтор/отсутствие timezone.

Полный backend и серверная интеграция здесь не запускались. Перед применением к dev-1/prod требуется сверка целевых конфигураций; шесть внешних скриптов теперь получены. Изменения локальные, без commit/push/deploy.

## Получение шести зависимостей с dev-1

16.11.2026 выполнены только чтение API и локальный extract. Все шесть скриптов найдены. Источник — SYSTEM на dev-1. Тела всех шести исходников сохранены побайтово, включая отсутствие завершающего перевода строки у обработчика маршрута. Метаданные и capabilities не дополнялись по догадкам. [Происхождение и SHA-256](dev1-script-dependencies-2026-11-16.json).

Файлы пакета в core-ui/scripts/dev/seeds:

- mediaLibraryScripts.json — пять общих Core API скриптов. Общие имена сохранены; существующие реализации на prod требуют сравнения, не автоматической перезаписи.
- winterRouteScripts.json — WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE, исходный код на dev-1 SNOW_ROUTE_CHAT_LIFECYCLE. Изменено только имя локального определения и имя файла; тело и методы сохранены. Переносится только вместе с Routes; workflow SNOW_ROUTE_LIFECYCLE при импорте должен ссылаться на новое имя. Живой workflow не изменён, его локальный seed этой операцией не создавался.

| Скрипт | Для чего нужен | Зависимости и условия |
|---|---|---|
| RESOURCE_MEDIA_LIBRARY | Файлы Property, планы, инспекции и ресурсы | CORE + CORE-RM; Resource, ACCOUNT reference, MediaLibrary, Organization. Имя Account берёт из существующей медиабиблиотеки либо контекста, прямого вызова ACCOUNT_MEDIA_LIBRARY нет |
| ACCOUNT_MEDIA_LIBRARY | Библиотека Client и других Accounts | CORE + CORE-ACCT; Account/Organization, корневая библиотека организации |
| PROJECT_MEDIA_LIBRARY | Файлы проекта/сезона | CORE + CORE-SVC; Project/Organization. Прямых вызовов других скриптов нет |
| TASK_MEDIA_LIBRARY | Файлы задачи/маршрута под проектом | CORE + CORE-SVC; Task/Project/Organization. Сам создаёт нужную родительскую библиотеку проекта, PROJECT_MEDIA_LIBRARY не вызывает |
| APPOINTMENT_MEDIA_LIBRARY | Файлы визита до/после, библиотека Property; проверка пересечения визитов техники | CORE + CORE-SVC; Appointment/Task/Project, typed ACCOUNT/RESOURCE, ASSIGNED_VEHICLE/ASSIGNED_CREW, SQL к штатным таблицам resource/appointment/task. Нет прямых вызовов остальных media-скриптов; они используют общую структуру библиотек |
| WINTER_SERVICES_ROUTE_CHAT_LIFECYCLE | Чат маршрута, файлы задачи, проверка перед выездом, запуск и завершение визитов | Единственная прямая script-зависимость: TASK_MEDIA_LIBRARY.onUpdate/onDelete. Загрузить TASK_MEDIA_LIBRARY раньше. Route workflow/type, ROUTE_CHAT с ограничением ChatType, пользовательские назначения, CORE_MOBILE_FSM.ASSOCIATED_RESOURCE, необязательный CHAT_DISPATCHERS; для настроенной проверки — PRE-ROUTE_CHECK и PRE-CHECK-FORM-COMPLETED. Appointment должен поддерживать DRAFT-SCHEDULED и конечные состояния |

У обработчика маршрута на dev-1 category и CAPABILITIES не заданы. Сохранили это как есть; назначение узла и присутствие Chat/SVC/CMS-зависимостей проверяются перед развёртыванием, новых параметров здесь не придумывали. ChatType берётся из атрибута ROUTE_CHAT, не хардкодится. Код типов SNOW_ROUTE, workflow и имена библиотек не переименовывались.

Read-only plan пяти общих media-скриптов против dev-1: 5 unchanged, 0 create/update, 0 drift. Проверка исходников на секреты: clean. Инвентаризация теперь включает 90 определений, отсутствующих исходников среди строк скриптов списка переноса — 0. Скрипты не исполнялись и бизнес-сущности не создавались.
