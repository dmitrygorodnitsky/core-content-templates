> Current migration decisions and fresh prod comparison: [17 November review](migration-review-2026-11-17.md). This file retains its original inspection scope.

# Готовность переноса Snow CRM на prod

Сверка только чтением: dev-1 2026-11-16T13:47:27.687Z; prod 2026-11-16T13:47:15.261Z. Core не изменён.

**Пакет пока не готов к переносу и включению без доработки конфигурации.**

Проверено 181 уникальная сущностей с зависимостями (240 строк по флоу). 29 уже доступны в SYSTEM и не переносятся; один LEGAL — общий справочник. 151 — кандидаты на загрузку, включая опциональные модули, а не утверждённый список обязательного импорта.

Локальный пакет содержит 60 определений скриптов/шаблонов. Проверка родительских типов добавила одну существующую платформенную script-зависимость. 12 кодов скриптов совпадают с SYSTEM prod: 6 совпадают по проверенным телам/метаданным, у 6 есть отличия. Их не перезаписываем автоматически.

Локально выполнена [консолидация скриптов](prod-consolidation-review-2026-11-16.md): 40 Java и 20 шаблонов. Серверные сведения остаются снимком указанного времени.

## Решения команды от 17 ноября 2026

- Schedule exclusions: do not transfer `SNOW_PORTAL_TAG_RECONCILE` or `SNOW_SUPPORT_TICKET_THREADS`; their tasks must be handled by workflows. Retain supporting scripts and verify workflow triggers before release. Transfer only `INVOICE_PAYMENT_REMINDERS` and `SNOW_VISIT_ORDERS` from our application schedules, disabled.

Ниже — новые указания к плану переноса. Это не отчёт о выполненном импорте. Сравнение prod далее остаётся снимком от 16 ноября; шесть вопросов ниже нужно читать с учётом этих решений.

- Источник определений и поведения — dev-1, в том числе при отличиях от SYSTEM prod. Для наших скриптов сохраняется согласованная локальная консолидация: 40 Java, коды без версий, обновлённые ссылки и права. Нельзя повторно загрузить старые раздельные скрипты вместо объединённых. Перед импортом требуется сверить изменения dev-1 после снимка.
- Роли и Winter Services-конфигурация назначаются организации `WINTER_SERVICES`; привязка к `SNOWLIMITLESS` заменяется на Winter Services. Это не отменяет отдельное назначение продуктов и цен Limitless организации `LSRC`.
- Названы организации `SERVICEWAND_SOFTWARE` и `SERVICEWAND`. Продукты и цены самого ServiceWand относятся к `SERVICEWAND`; назначение `SERVICEWAND_SOFTWARE` и её место в иерархии пока не определены этим сообщением.
- Перенести `TYPE_AWARE` и `TAX_AWARE`; `CUSTOMER` должен наследовать `TYPE_AWARE`. Наследование `TAX_AWARE` у CUSTOMER не согласовано и автоматически не добавляется.
- Product Types, связанные с ServiceWand, — под `SERVICEWAND`; связанные с ServiceWand Winter Services — под `WINTER_SERVICES`.
- Продукты и цены Limitless — под `LSRC`; продукты и цены ServiceWand — под `SERVICEWAND`. Product Price Types — из dev-1 под `SYSTEM`.
- Contact Type Account Representative — перенести из dev-1; точный код и владелец требуют сверки.
- Document Types License и Driver License — под `SYSTEM`; Service Agreement — под `WINTER_SERVICES`.
- Перенести оба отчёта `WINTER_CONTRACT` и `WINTER_INVOICE`; организация-владелец в комментарии не указана.
- Все Dictionary-записи Plan Element и AI Plan Configuration, а также их Dictionary Types — под `WINTER_SERVICES`.

### Роли со скриншота

Все восемь выбранных ролей — под `WINTER_SERVICES`, с сохранением прав и заменой ссылок на объединённые скрипты:

| Код dev-1 | Код назначения |
|---|---|
| SW_FS_WS_COMPANY_ADMIN | SW_FS_WS_COMPANY_ADMIN |
| SW_FS_WS_OPERATIONS_MANAGER | SW_FS_WS_OPERATIONS_MANAGER |
| SW_FS_WS_SALES | SW_FS_WS_SALES |
| SW_FS_WS_CSR | SW_FS_WS_CSR |
| SW_FS_WS_BILLING_FINANCE | SW_FS_WS_BILLING_FINANCE |
| SW_FS_WS_DISPATCHER | SW_FS_WS_DISPATCHER |
| SW_FS_WS_DRIVER | SW_FS_WS_DRIVER |
| SW_FS_WS_CUSTOMER_PORTAL | CUSTOMER_PORTAL |

`SNOW_VEHICLE_DRIVER` на скриншоте не выбран, в этот набор не включён. Переименование роли портала требует обновления всех ссылок на неё; перенос не означает автоматического назначения ролей пользователям.

### Типы, указанные по ID dev-1

Коды сверены со снимком dev-1 от 16 ноября. ID используются для идентификации источника, не как целевые ID prod.

| Сущность | ID dev-1 | Код | Организация назначения |
|---|---|---|---|
| Project Type | 14 | INCIDENT_MANAGEMENT | SYSTEM |
| Project Type | 15 | SOFTWARE_DEVELOPMENT | SYSTEM |
| Project Type | 16 | CUSTOMER_SERVICE | SYSTEM |
| Task Type | 31 | INCIDENT_CASE | SYSTEM |
| Task Type | 32 | SOFTWARE_TASK | SYSTEM |
| Task Type | 33 | SUPPORT_CASE | SYSTEM |
| Task Type | 10 | SNOW_ROUTE | WINTER_SERVICES |
| Task Type | 29 | SUPPORT_TICKET | WINTER_SERVICES |
| Appointment Type | 2 | SNOW_SERVICE_VISIT | WINTER_SERVICES |
| Appointment Type | 3 | SNOW_INSPECTION_VISIT | WINTER_SERVICES |

«As is» означает сохранить настройки и поведение, но пересопоставить ссылки и ID между средами. Для зависимостей наших скриптов применяется согласованная карта объединения.

### Что ещё не закрыто этими комментариями

- Выбор `OPERATOR` либо существующего `SERVICE_PROVIDER`, клиентский workflow и значения профилей CONTRACT_SETTINGS/COMMUNICATION.
- Роль `SERVICEWAND_SOFTWARE`, точные коды/иерархия целевых организаций и размещение двух отчётов.
- URL, значения настроек среды и момент включения расписаний/оплаты. Прежнее решение — переносить задания выключенными, оплату не включать.
- Attachments are now available. Full dev-1 resource-type and schedule definitions were read; see [readback and dependencies](resource-schedule-readback-2026-11-17.md).

## Что мешает

1. **Выбрать организации prod.** В конфиге подписки остаются SERVICEWAND и SERVICE_WAND_WINTER_SERVICES_CANADA, а на prod есть WINTER_SERVICES / WINTER_SERVICES_CA и SERVICE_WAND_OPS. Это не автоматические замены. Нужны продавец подписки, родитель CA и оператор портала.

2. **Убрать привязку портала к dev-организации.** В скриптах остаётся жёстко заданный SNOWLIMITLESS. На prod такой организации нет. Нужно согласованно настроить эти проверки для целевого оператора; одного изменения владельца скрипта недостаточно.

3. **Сверить общие скрипты в SYSTEM.** WINTER_SERVICE_QUOTATION_CREATOR, WINTER_SERVICE_REGION_WORKFLOW_UTILS, WINTER_SERVICE_QUOTATION_PROCESSING, WINTER_SERVICE_QUOTATION_REJECTED, WINTER_SERVICE_QUOTATION_REVIEW, ORGANIZATION_MEDIA_LIBRARY_MANAGEMENT_UTILS. Не перезаписываем их. Сравнить нужные методы и поведение с платформой: часть локальных реализаций отличается.

4. **Проверить Client и тип создаваемой организации.** CUSTOMER в SYSTEM prod не имеет родителей, атрибутов и workflow из dev. OPERATOR тоже отличается. Видимость SYSTEM решает доступность определения, но не добавляет отсутствующие настройки.

5. **Подготовить данные и настройки среды.** На prod нет продуктов, ProductType и форм нашего флоу. Для подписки нужны каталог и цены, Entitlements, настройки налогов/сезона, адреса портала и входа. URL dev-1 нельзя переносить как рабочие prod-настройки.

6. **Настроить права, массовые действия и расписания.** Пакет типов/скриптов/workflow сам по себе не переносит роли, новые P_SCRIPT_X, bulk-привязки и задания. Их проверяем отдельным шагом; расписания и оплату при загрузке не включаем.


## Порядок загрузки

- **1. Повторно используем SYSTEM.** Сопоставить по типу сущности и коду существующие определения SYSTEM. Зафиксировать их prod ID. Не копировать только ради иерархии организаций; спорные настройки согласовать без перезаписи.

- **2. Выбираем организации и состав релиза.** Определить продавца, Winter Services CA и оператора; решить, нужны ли Routes, инспекции и техника. Подготовить таблицу dev → prod для кодов организаций и ID.

- **3. Загружаем основу типов.** Категории скриптов, необходимые справочники, базовые/абстрактные типы и их родители. Циклические связи между типами и workflow разрешать в два прохода: сначала определения, затем ссылки.

- **4. Загружаем зависимости и скрипты.** Общие media-библиотеки переиспользуем из SYSTEM. Затем недостающие helpers, исполнители и оркестраторы. Для маршрутов TASK_MEDIA_LIBRARY должен быть доступен раньше обработчика маршрута. Скрипты пока не запускать.

- **5. Связываем workflow и типы.** Загрузить workflow с новыми кодами скриптов, затем привязать типы и обновить ссылки атрибутов/родителей по prod ID. Не переносить числовые ID dev напрямую.

- **6. Настраиваем данные и доступ.** Каталог/цены, Entitlements без выдачи грантов, роли и bulk-actions с новыми кодами, адреса и необходимые настройки среды. Проверить область организаций и SYSTEM.

- **7. Проверяем флоу до включения.** Проверить котировку → договор → заказ/счёт, Property, портал и подписку без оплаты; отдельно права и повторы. Только после принятия результата решать о расписаниях и оплате.

## Существующие SYSTEM-определения с отличиями

| Сущность | Код | Что отличается |
|---|---|---|
| core/script | WINTER_SERVICE_QUOTATION_CREATOR | тело скрипта; метаданные / методы / capabilities |
| core/script | WINTER_SERVICE_REGION_WORKFLOW_UTILS | тело скрипта; метаданные / методы / capabilities; категория |
| core/script | WINTER_SERVICE_QUOTATION_PROCESSING | тело скрипта |
| core/script | WINTER_SERVICE_QUOTATION_REJECTED | тело скрипта |
| core/script | WINTER_SERVICE_QUOTATION_REVIEW | тело скрипта |
| core-acct/account-type | CUSTOMER | нет атрибута MANAGEMENT_COMPANY; родительские типы; workflow |
| core-acct/account-type | ORGANIZATION | workflow |
| core/script | ORGANIZATION_MEDIA_LIBRARY_MANAGEMENT_UTILS | тело скрипта |
| core/dictionary-type | AI_AWARE | не заполнены ссылки dev: VIDEO_GENERATION_SERVICE; не заполнены ссылки dev: DEFAULT_TRANSLATION_SERVICE; не заполнены ссылки dev: ASK_SERVICE; не заполнены ссылки dev: DEFAULT_ASK_SERVICE; не заполнены ссылки dev: DEFAULT_VIDEO_GENERATION_SERVICE; не заполнены ссылки dev: VIDEO_TRANSCRIPTION_SERVICE; не заполнены ссылки dev: DEFAULT_AUDIO_GENERATION_SERVICE; настройки атрибута AUDIO_GENERATION_SERVICE; не заполнены ссылки dev: IMAGE_TRANSCRIPTION_SERVICE; не заполнены ссылки dev: AUDIO_TRANSCRIPTION_SERVICE; нет атрибута DEFAULT_VECTORIZATION_SERVICE; нет атрибута VECTORIZATION_SERVICE; не заполнены ссылки dev: TRANSLATION_SERVICE |
| core/dictionary-type | AI_BASE | настройки атрибута MODEL; настройки атрибута ENDPOINT; настройки атрибута SYSTEM_MESSAGE; настройки атрибута TEMPERATURE; дополнительный атрибут ROUTER_SCRIPT |
| core/dictionary-type | AI_REALTIME_VOICE | нет атрибута REASONING_EFFORT |
| core/dictionary-type | CONTRACT_AWARE | настройки атрибута CONTRACT_TERMS |
| core/organization-type | OPERATOR | нет атрибута QUOTATION_EXPIRATION; нет атрибута REGIONS; нет атрибута BUSINESS_REGISTRATION_NUMBER; нет атрибута CONTRACT_SETTINGS; нет атрибута COMMUNICATION; нет атрибута CUSTOMER_PORTAL_URL; нет атрибута WEBSITE; родительские типы; workflow |
| core/workflow | ORGANIZATION_WORKFLOW | различается script; различается states |

Ссылки entityTypes сравниваются по коду типа, а не числовому ID. Например BASE.SUPPORTED_CURRENCIES (FIAT) и AI_AWARE.AI_CONFIGURATION совпадают несмотря на разные ID. Неразрешённые `<..._TYPE_ID>` на dev отмечены как незаполненные ссылки источника.

## Границы проверки

Прямые вызовы скриптов замыкаются на локальные определения и prod. Это не тест динамических вызовов, отправки писем, оплаты или исполнения workflow. Налоговые справочники читались по коду/типу/владельцу, ставки не проверялись. Не переносим бизнес-данные, клиентов, пользователей или секреты.

Организации в таблице — фактические владельцы текущих сущностей. Для переименованных скриптов показывается владелец исходной реализации dev-1; нормализация на dev-1 ещё не опубликована. Числовые ID должны сопоставляться на целевой среде.

[Реестр CSV](prod-readiness-2026-11-16.csv) · [Результат JSON](prod-readiness-2026-11-16.json) · [Реестр JSON](prod-readiness-registry-2026-11-16.json).

Зависимость зон: Core UI seed scripts и Portal build tooling поставляют локальные определения; Portal product docs хранит результат сверки; Sites публикует только обезличенный реестр кодов/владельцев и выводы, без исходников, токенов или бизнес-данных.
