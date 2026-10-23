import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Pure evaluation of trusted purchase/model reads; never persists or activates anything. */
public final class OnboardingReadiness {
    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of();
    }
    private static List<?> list(Object value) { return value instanceof List<?> rows ? rows : List.of(); }
    private static boolean present(Object value) {
        return value != null && (!(value instanceof String s) || !s.isBlank())
                && (!(value instanceof Collection<?> rows) || !rows.isEmpty()) && (!(value instanceof Map<?, ?> m) || !m.isEmpty());
    }
    private static String text(Object value) { return value == null ? "" : value.toString(); }
    private static void block(List<Map<String, Object>> blocks, String step, String code, String field, String message) {
        blocks.add(Map.of("step", step, "code", code, "field", field, "message", message));
    }

    public static Map<String, Object> evaluate(Map<String, Object> purchase, Map<String, Object> model, Map<String, Object> config) {
        if (!Boolean.FALSE.equals(config.get("creationEnabled")) || !Boolean.FALSE.equals(config.get("paymentEnabled"))
                || !Boolean.FALSE.equals(config.get("grantIssuanceEnabled"))) throw new IllegalArgumentException("Readiness must remain read-only");
        List<Map<String, Object>> blockers = new ArrayList<>(), steps = new ArrayList<>();
        for (Object error : list(model.get("errors"))) block(blockers, "model", "MODEL_SOURCE_UNVERIFIED", "model", text(error));
        Map<String, Object> address = map(purchase.get("companyAddressSnapshot"));
        boolean ca = "CA".equals(address.get("countryCode"));
        if (!ca) block(blockers, "scope", "COUNTRY_NOT_SUPPORTED", "COMPANY_ADDRESS", "Сейчас проверка онбординга поддерживает только CA.");
        if (!Boolean.TRUE.equals(purchase.get("purchaseConfirmed"))) block(blockers, "purchase", "PURCHASE_NOT_CONFIRMED", "confirmation", "Требуется сохранённое одноразовое подтверждение покупки.");
        if (!present(purchase.get("orderId"))) block(blockers, "purchase", "DRAFT_ORDER_REQUIRED", "orderId", "Требуется сохранённый черновик заказа.");
        Map<String, Object> entitlements = map(purchase.get("entitlementSnapshot"));
        if (entitlements.isEmpty()) block(blockers, "entitlements", "CONFIRMED_ENTITLEMENTS_REQUIRED", "entitlementSnapshot", "В подтверждённой покупке нет сохранённого состава Entitlements.");
        if (!ca || !Boolean.TRUE.equals(purchase.get("purchaseConfirmed")) || !present(purchase.get("orderId"))) return result(purchase, steps, blockers, model, config);

        Map<String, Object> parent = map(model.get("parent"));
        if (!"AVAILABLE".equals(parent.get("status"))) block(blockers, "organization", "CA_PARENT_UNAVAILABLE", "parent", "Не найден однозначный CA-родитель организации.");
        Map<String, Object> organization = type(model, "organizationType", "organization", blockers);
        if (!Boolean.TRUE.equals(config.get("organizationTypeConfirmed"))) block(blockers, "organization", "ORGANIZATION_TYPE_CONFIRMATION_REQUIRED", "type", "OPERATOR найден как кандидат; назначение этого типа новой организации ещё нужно подтвердить.");
        Map<String, Object> organizationValues = new LinkedHashMap<>(map(model.get("organizationDefaults")));
        required(organization, organizationValues, "organization", blockers);
        steps.add(step("organization", "Organization", organization, Map.of("parent", parent, "name", text(purchase.get("companyName")), "attributes", organizationValues)));

        Map<String, Object> season = map(model.get("seasonSettings")), seasonType = map(model.get("seasonSettingsType"));
        if (!seasonSourceReady(model)) block(blockers, "seasonSettings", "SEASON_SETTINGS_REQUIRED", "CONTRACT_SETTINGS.SEASON_START", "Нужен проверенный источник дат начала и конца сезона для будущего профиля CONTRACT_AWARE.");
        Map<String, Object> seasonValues = new LinkedHashMap<>();
        seasonValues.put("LEGAL_NAME", text(purchase.get("companyName")));
        seasonValues.put("SEASON_START", text(season.get("seasonStart"))); seasonValues.put("SEASON_END", text(season.get("seasonEnd")));
        required(seasonType, seasonValues, "seasonSettings", blockers);
        steps.add(step("seasonSettings", "Dictionary", seasonType, Map.of("organization", Map.of("reference", "organization"),
                "attributes", seasonValues, "source", season, "attachToOrganizationAttribute", "CONTRACT_SETTINGS", "existingEntityAvailable", false)));

        Map<String, Object> role = map(model.get("adminRole"));
        if (!"AVAILABLE".equals(role.get("status"))) block(blockers, "administrator", "ADMIN_ROLE_UNAVAILABLE", "role", "Не найдена однозначная роль администратора компании.");
        if (Boolean.TRUE.equals(role.get("hasExplicitSystemAdminPermission")) || Boolean.TRUE.equals(role.get("hasSystemAdmin"))
                || !"NEW_CLIENT_ORGANIZATION".equals(config.get("adminAssignmentScope"))) {
            block(blockers, "administrator", "PLATFORM_ADMIN_ROLE_FORBIDDEN", "role", "Роль назначается только новой клиентской организации; назначение SYSTEM и явные платформенные права запрещены.");
        }
        if (!text(config.get("adminRoleCode")).equals(text(role.get("code")))
                || !text(config.get("adminRoleOwnerOrganizationCode")).equals(text(role.get("ownerCode")))) {
            block(blockers, "administrator", "ADMIN_ROLE_SCOPE_UNVERIFIED", "role", "Определение роли не совпадает с согласованными кодом и организацией-владельцем.");
        }
        String email = text(purchase.get("email"));
        if (email.isBlank() || email.length() > 64) block(blockers, "administrator", "ADMIN_LOGIN_SOURCE_REQUIRED", "name", "Email не подходит как логин User с текущим ограничением 64 символа; нужен способ формирования логина.");
        if (Boolean.TRUE.equals(model.get("adminLoginExists")) && !"REUSE_VERIFIED_EMAIL_KEEP_EXISTING_PASSWORD".equals(config.get("existingAdminPolicy"))) block(blockers, "administrator", "EXISTING_ADMIN_POLICY_REQUIRED", "name", "Логин уже существует; нужна политика переиспользования без сброса действующих реквизитов.");
        steps.add(Map.of("step", "administrator", "entity", "User", "source", "VERIFIED_CONTACT", "email", email, "role", role,
                "assignmentOrganization", Map.of("reference", "organization"), "existingUserPolicy", text(config.get("existingAdminPolicy")), "creationEnabled", false));

        Map<String, Object> customer = type(model, "customerType", "starterCustomer", blockers);
        Map<String, Object> customerValues = new LinkedHashMap<>();
        if (present(config.get("starterLegalEntityType"))) customerValues.put("LEGAL_ENTITY_TYPE", config.get("starterLegalEntityType"));
        required(customer, customerValues, "starterCustomer", blockers);
        required(customer, map(purchase.get("purchaserAttributes")), "purchaserAccount", blockers);
        steps.add(step("starterCustomer", "Account", customer, Map.of("name", "Customer 1", "attributes", customerValues)));

        Map<String, Object> property = type(model, "propertyType", "property", blockers);
        Map<String, Object> propertyValues = new LinkedHashMap<>();
        if (present(address.get("addressId"))) propertyValues.put("ADDRESS", Map.of("id", address.get("addressId"), "source", "VERIFIED_COMPANY_ADDRESS"));
        propertyValues.put("ACCOUNT", Map.of("reference", "starterCustomer"));
        required(property, propertyValues, "property", blockers);
        referenceType(property, "ACCOUNT", customer.get("id"), "property", blockers);
        steps.add(step("property", "Resource", property, Map.of("attributes", propertyValues, "addressText", text(purchase.get("companyAddressText")))));

        Map<String, Object> serviceOrder = type(model, "serviceOrderType", "serviceOrder", blockers);
        Map<String, Object> orderValues = new LinkedHashMap<>();
        orderValues.put("SERVICE_PROPERTY", Map.of("reference", "property"));
        required(serviceOrder, orderValues, "serviceOrder", blockers);
        referenceType(serviceOrder, "SERVICE_PROPERTY", property.get("id"), "serviceOrder", blockers);
        Map<String, Object> preparation = map(config.get("serviceOrderPreparation"));
        if (!"DRAFT_PENDING_MANAGER_REVIEW".equals(preparation.get("mode")) || !Boolean.FALSE.equals(preparation.get("submitEnabled"))
                || !Boolean.FALSE.equals(preparation.get("pricesRequiredForDraft")) || !Set.of("INITIAL", "DRAFT").contains(text(preparation.get("initialStateCode")))
                || !text(preparation.get("initialStateCode")).equals(map(serviceOrder.get("workflow")).get("initialState"))) {
            block(blockers, "serviceOrder", "SERVICE_ORDER_DRAFT_CONFIGURATION_REQUIRED", "preparation", "Нужен сервисный черновик в согласованном начальном состоянии без автоматической отправки и цен до проверки менеджером.");
        }
        referenceScript(model, "serviceOrder", "serviceOrder", blockers);
        Map<String, Object> currency = map(purchase.get("currency"));
        if (!present(currency.get("id"))) block(blockers, "serviceOrder", "CONFIRMED_CURRENCY_REQUIRED", "currency", "Валюта стартового заказа должна быть прочитана из подтверждённого заказа подписки.");
        steps.add(step("serviceOrder", "Order", serviceOrder, Map.of("account", Map.of("reference", "starterCustomer"), "currency", currency,
                "attributes", orderValues, "items", List.of(), "pricing", "PENDING_MANAGER_REVIEW", "initialState", text(map(serviceOrder.get("workflow")).get("initialState")),
                "source", "REQUEST_QUOTE_DRAFT_PATTERN")));

        Map<String, Object> agreement = type(model, "agreementType", "agreement", blockers);
        Map<String, Object> agreementValues = new LinkedHashMap<>(); agreementValues.put("CLIENT", Map.of("reference", "starterCustomer"));
        if (present(season.get("seasonStart"))) agreementValues.put("TERM_START_DATE", season.get("seasonStart"));
        if (present(season.get("seasonEnd"))) agreementValues.put("TERM_END_DATE", season.get("seasonEnd"));
        // The subscription purchase Order is never silently used as a service Order.
        agreementValues.put("ORDERS", List.of(Map.of("reference", "serviceOrder")));
        required(agreement, agreementValues, "agreement", blockers);
        referenceType(agreement, "CLIENT", customer.get("id"), "agreement", blockers);
        referenceType(agreement, "ORDERS", serviceOrder.get("id"), "agreement", blockers);
        steps.add(step("agreement", "Document", agreement, Map.of("attributes", agreementValues, "allowedOrderTypeIds", allowed(agreement, "ORDERS"))));
        if (!"READY".equals(map(config.get("quoteLinkPolicy")).get("implementationStatus"))
                || !"READY".equals(map(model.get("quoteExpiryPolicy")).get("status"))
                || !Boolean.TRUE.equals(map(model.get("quoteExpiryPolicy")).get("sourceFingerprintsVerified"))) {
            block(blockers, "quotation", "QUOTE_EXPIRY_IMPLEMENTATION_REQUIRED", "quoteLinkPolicy", "Обе выдачи Quote-ссылок должны соответствовать проверенным исходникам согласованного расчёта срока.");
        }
        referenceScript(model, "quoteDelivery", "quotation", blockers);
        referenceScript(model, "quoteConfirmation", "quotation", blockers);

        Map<String, Object> ledger = type(model, "ledgerAccountType", "ledger", blockers);
        required(ledger, Map.of(), "ledger", blockers);
        if (!"ORGANIZATION".equals(ledger.get("code")) || !"SYSTEM".equals(map(ledger.get("owner")).get("code"))) {
            block(blockers, "ledger", "LEDGER_TYPE_CONTRACT_MISMATCH", "type", "Ledger должен быть Account типа ORGANIZATION из SYSTEM.");
        }
        steps.add(step("ledger", "Account", ledger, Map.of("organization", Map.of("reference", "organization"),
                "name", text(purchase.get("companyName")), "cardinality", "ONE_PER_ORGANIZATION", "api", "core-acct/api/account/save.json")));

        Map<String, Object> access = map(config.get("accessDeliveryContract"));
        if (!"REQUEST_QUOTE_PATTERN".equals(access.get("mode")) || !"UserService.generateNewPassword".equals(access.get("credentialMethod"))
                || !Boolean.TRUE.equals(access.get("issueOnlyForNewUserOrMissingPassword")) || !Boolean.TRUE.equals(access.get("reuseExistingPassword"))) {
            block(blockers, "accessDelivery", "ACCESS_DELIVERY_CONFIGURATION_REQUIRED", "credentials", "Доступ должен повторять Request Quote: существующий пароль сохраняется, штатная выдача вызывается только для нового User или отсутствующего пароля.");
        }
        referenceScript(model, "accessDelivery", "accessDelivery", blockers);
        steps.add(Map.of("step", "accessDelivery", "source", "REQUEST_QUOTE_PATTERN", "contract", access, "creationEnabled", false));
        if (!entitlements.isEmpty()) {
            if (!validatedPropertyMaximum(map(entitlements.get("propertyCapacity")))) {
                block(blockers, "entitlements", "CAPACITY_MAXIMUM_UNVERIFIED", "ACTIVE_PROPERTIES_MAXIMUM", "В подтверждённой покупке нет сохранённого и проверенного числового максимума Properties; нужна повторная подготовка и подтверждение Checkout.");
            }
            if (!"ACCEPTED_BACKEND_CONTRACT".equals(map(config.get("entitlementEnforcementContract")).get("status"))) {
                block(blockers, "entitlements", "ENTITLEMENT_CONTRACT_REQUIRED", "enforcement", "Нужен согласованный контракт применения штатных Entitlements.");
            }
            steps.add(Map.of("step", "entitlements", "source", "CONFIRMED_PURCHASE_SNAPSHOT", "snapshot", entitlements, "grantIssuanceEnabled", false));
        }
        return result(purchase, steps, blockers, model, config);
    }

    private static boolean seasonSourceReady(Map<String, Object> model) {
        Map<String, Object> season = map(model.get("seasonSettings")), definition = map(model.get("seasonSettingsType"));
        if (!Boolean.TRUE.equals(model.get("seasonStartAvailable")) || !Set.of("AVAILABLE", "CONFIGURED").contains(text(season.get("status")))
                || !"CONTRACT_AWARE".equals(season.get("typeCode")) || !"AVAILABLE".equals(definition.get("status"))
                || !"CONTRACT_AWARE".equals(definition.get("code")) || !Set.of("TEMPORARY_CA_CONFIG", "ANCESTOR_PROFILE").contains(text(season.get("source")))) return false;
        for (String code : List.of("SEASON_START", "SEASON_END")) {
            if (list(definition.get("attributes")).stream().map(OnboardingReadiness::map).noneMatch(field -> code.equals(field.get("code")) && "java.time.LocalDate".equals(field.get("className")))) return false;
        }
        Map<String, Object> owner = map(definition.get("owner"));
        if (!"SYSTEM".equals(owner.get("code")) && list(map(model.get("parent")).get("ancestryIds")).stream().noneMatch(id -> text(id).equals(text(owner.get("id"))))) return false;
        if ("TEMPORARY_CA_CONFIG".equals(season.get("source")) && !"CA".equals(season.get("countryCode"))) return false;
        try {
            java.time.LocalDate start = java.time.LocalDate.parse(text(season.get("seasonStart")));
            java.time.LocalDate end = java.time.LocalDate.parse(text(season.get("seasonEnd")));
            return !end.isBefore(start);
        } catch (RuntimeException invalid) { return false; }
    }

    private static boolean validatedPropertyMaximum(Map<String, Object> capacity) {
        if (!"VALIDATED_CONFIG_MAXIMUM".equals(capacity.get("maximumValidation")) || !"TEMPORARY_CONFIG".equals(capacity.get("maximumSource"))) return false;
        try {
            long[] values = new long[5]; int i = 0;
            for (String field : List.of("included", "expansionPacks", "expansionPackSize", "limit", "overallMaximum")) {
                Object value = capacity.get(field); if (!(value instanceof Number)) return false;
                values[i++] = new java.math.BigDecimal(value.toString()).longValueExact();
            }
            return values[0] > 0 && values[1] >= 0 && values[2] >= 0 && (values[1] == 0 || values[2] > 0)
                    && values[3] == Math.addExact(values[0], Math.multiplyExact(values[1], values[2]))
                    && values[4] > 0 && values[4] <= Integer.MAX_VALUE && values[3] <= values[4];
        } catch (RuntimeException invalid) { return false; }
    }

    private static Map<String, Object> type(Map<String, Object> model, String key, String step, List<Map<String, Object>> blockers) {
        Map<String, Object> type = map(model.get(key));
        if (!"AVAILABLE".equals(type.get("status"))) block(blockers, step, "TYPE_UNAVAILABLE", "type", "Тип не найден однозначно: " + key);
        else {
            if (!Boolean.FALSE.equals(type.get("isAbstract"))) block(blockers, step, "CONCRETE_TYPE_REQUIRED", "type", "Тип должен быть конкретным, с проверенным isAbstract=false.");
            if (!present(map(type.get("workflow")).get("initialState"))) block(blockers, step, "INITIAL_WORKFLOW_STATE_REQUIRED", "workflow", "Не найдено начальное состояние типа.");
            Map<String, Object> owner = map(type.get("owner"));
            if (!"SYSTEM".equals(owner.get("code")) && list(map(model.get("parent")).get("ancestryIds")).stream().noneMatch(id -> text(id).equals(text(owner.get("id"))))) {
                block(blockers, step, "TYPE_ORGANIZATION_UNAVAILABLE", "type.owner", "Тип не принадлежит SYSTEM или ветке родительской CA-организации.");
            }
        }
        return type;
    }
    private static void referenceScript(Map<String, Object> model, String key, String step, List<Map<String, Object>> blockers) {
        if (!"AVAILABLE".equals(map(map(model.get("referenceScripts")).get(key)).get("status"))) {
            block(blockers, step, "REFERENCE_SCRIPT_UNAVAILABLE", key, "Согласованный пример или механизм Request Quote не найден либо не исполняем.");
        }
    }
    private static Map<String, Object> step(String key, String entity, Map<String, Object> type, Map<String, Object> proposed) {
        return Map.of("step", key, "entity", entity, "type", type, "proposed", proposed, "creationEnabled", false);
    }
    private static void required(Map<String, Object> type, Map<String, Object> values, String step, List<Map<String, Object>> blockers) {
        for (Object raw : list(type.get("attributes"))) {
            Map<String, Object> field = map(raw); String code = text(field.get("code"));
            Object value = values.get(code);
            if (!present(value) && !text(field.get("className")).startsWith("com.pixelnation.")) value = field.get("defaultValue");
            if (Boolean.TRUE.equals(field.get("required")) && !present(value)) block(blockers, step, "REQUIRED_ATTRIBUTE_SOURCE_MISSING", code, "Нет источника обязательного поля " + code + ".");
            if (present(value) && value instanceof String && !list(field.get("options")).isEmpty()
                    && !Boolean.TRUE.equals(field.get("freeValue")) && !list(field.get("options")).contains(value)) block(blockers, step, "ATTRIBUTE_VALUE_NOT_ALLOWED", code, "Значение отсутствует в разрешённых вариантах " + code + ".");
        }
    }
    private static List<?> allowed(Map<String, Object> type, String attribute) {
        for (Object raw : list(type.get("attributes"))) if (attribute.equals(map(raw).get("code"))) return list(map(raw).get("entityTypes"));
        return List.of();
    }
    private static void referenceType(Map<String, Object> type, String field, Object targetId, String step, List<Map<String, Object>> blockers) {
        List<?> allowed = allowed(type, field);
        if (!allowed.isEmpty() && allowed.stream().noneMatch(value -> text(value).equals(text(targetId)))) block(blockers, step, "REFERENCE_TYPE_NOT_ALLOWED", field, "Выбранный тип связанной сущности не разрешён для " + field + ".");
    }
    private static Map<String, Object> result(Map<String, Object> purchase, List<Map<String, Object>> steps,
            List<Map<String, Object>> blockers, Map<String, Object> model, Map<String, Object> config) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schemaVersion", 2); result.put("mode", "ONBOARDING_READINESS_ONLY");
        result.put("sourceFormId", purchase.get("sourceFormId")); result.put("orderId", purchase.get("orderId"));
        result.put("checkoutDigest", purchase.get("checkoutDigest")); result.put("entitlementFingerprint", purchase.get("entitlementFingerprint"));
        result.put("purchaseConfirmed", Boolean.TRUE.equals(purchase.get("purchaseConfirmed")));
        result.put("paymentConfirmed", false);
        result.put("configurationReady", blockers.isEmpty()); result.put("canProvision", false);
        result.put("creationEnabled", false); result.put("paymentEnabled", false); result.put("grantIssuanceEnabled", false);
        result.put("executionGates", List.of("CONFIRMED_PAYMENT_REQUIRED", "PROVISIONING_EXECUTOR_NOT_ENABLED"));
        List<Map<String, Object>> described = new ArrayList<>();
        for (Map<String, Object> step : steps) {
            Map<String, Object> copy = new LinkedHashMap<>(step);
            copy.put("sourceReady", blockers.stream().noneMatch(block -> "model".equals(block.get("step"))
                    || java.util.Objects.equals(block.get("step"), step.get("step"))));
            copy.put("dependsOn", switch (text(step.get("step"))) {
                case "administrator", "starterCustomer", "seasonSettings", "ledger", "entitlements" -> List.of("organization");
                case "property" -> List.of("organization", "starterCustomer");
                case "serviceOrder" -> List.of("organization", "starterCustomer", "property");
                case "agreement" -> List.of("organization", "starterCustomer", "serviceOrder", "seasonSettings");
                case "accessDelivery" -> List.of("organization", "administrator");
                default -> List.of();
            });
            described.add(copy);
        }
        result.put("steps", described); result.put("blockers", blockers); result.put("modelReadErrors", model.getOrDefault("errors", List.of()));
        result.put("quoteLinkPolicy", config.get("quoteLinkPolicy"));
        result.put("warnings", List.of(
                Map.of("code", "ADMIN_JAVA_RESTRICTION_FOLLOW_UP", "blocking", false, "message", "Вопрос ограничений Java передан backend; по решению пользователя не блокирует подготовку онбординга. Роль назначается только клиентской организации."),
                Map.of("code", "ENTITLEMENT_RUNTIME_NOT_EXERCISED", "blocking", false, "message", "Принят штатный backend-контракт Entitlements. Реальная выдача и применение к новой организации в этой проверке не выполнялись."),
                Map.of("code", "PROVISIONING_ADAPTATION_NOT_EXECUTED", "blocking", false, "message", "Request Quote используется как пример: его фиксированные организация и клиентская роль не вызываются для новой компании. Нужна адаптация в будущем исполнителе.")));
        result.put("acceptedDecisions", Map.of("organizationTypeCode", text(config.get("organizationTypeCode")),
                "customerTypeCode", text(config.get("customerTypeCode")), "serviceOrderTypeCode", text(config.get("serviceOrderTypeCode")),
                "ledgerAccountTypeCode", text(config.get("ledgerAccountTypeCode")), "adminRoleCode", text(config.get("adminRoleCode")),
                "adminAssignmentScope", text(config.get("adminAssignmentScope")), "starterLegalEntityType", text(config.get("starterLegalEntityType")),
                "existingAdminPolicy", text(config.get("existingAdminPolicy")), "entitlementContract", map(config.get("entitlementEnforcementContract")),
                "subscriptionTypes", map(model.get("subscriptionTypes"))));
        result.put("verificationLimit", "MODEL_AND_SOURCE_READINESS_ONLY_NO_ENTITY_SAVE_ROLE_ASSIGNMENT_OR_ACCESS_TEST");
        return result;
    }
}
