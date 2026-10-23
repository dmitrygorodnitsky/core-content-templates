import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** No database, HTTP calls, credentials or persisted fixtures. Runs the actual evaluator. */
public final class OnboardingReadinessTest {
    private static int checks;
    private static Map<String, Object> m(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
        return result;
    }
    private static Map<String, Object> field(String code, String cls, Object defaultValue, Object... extra) {
        Map<String, Object> result = m("code", code, "required", true, "className", cls, "defaultValue", defaultValue);
        result.putAll(m(extra)); return result;
    }
    private static Map<String, Object> type(int id, Object... attrs) {
        return m("id", id, "code", id == 3 ? "ORGANIZATION" : id == 35 ? "CONTRACT_AWARE" : "TYPE_" + id, "status", "AVAILABLE", "isAbstract", false,
                "owner", m("id", 1, "code", "SYSTEM"), "workflow", m("initialState", "INITIAL"), "attributes", new ArrayList<>(List.of(attrs)));
    }
    private static Map<String, Object> config() {
        return m("creationEnabled", false, "paymentEnabled", false, "grantIssuanceEnabled", false,
                "organizationTypeConfirmed", true, "organizationTypeCode", "OPERATOR", "customerTypeCode", "CUSTOMER",
                "serviceOrderTypeCode", "WINTER_SERVICES_ORDER", "ledgerAccountTypeCode", "ORGANIZATION",
                "adminRoleCode", "ADMIN", "adminRoleOwnerOrganizationCode", "SYSTEM", "adminAssignmentScope", "NEW_CLIENT_ORGANIZATION",
                "starterLegalEntityType", "INDIVIDUAL", "purchaserLegalEntityType", "INDIVIDUAL",
                "existingAdminPolicy", "REUSE_VERIFIED_EMAIL_KEEP_EXISTING_PASSWORD",
                "serviceOrderPreparation", m("mode", "DRAFT_PENDING_MANAGER_REVIEW", "initialStateCode", "INITIAL", "submitEnabled", false, "pricesRequiredForDraft", false),
                "accessDeliveryContract", m("mode", "REQUEST_QUOTE_PATTERN", "credentialMethod", "UserService.generateNewPassword", "issueOnlyForNewUserOrMissingPassword", true, "reuseExistingPassword", true),
                "entitlementEnforcementContract", m("status", "ACCEPTED_BACKEND_CONTRACT"),
                "quoteLinkPolicy", m("beforeSeason", "SEASON_START", "afterSeasonStartedDays", 30, "implementationStatus", "REQUIRES_ADAPTATION"));
    }
    private static Map<String, Object> model() {
        return m("parent", m("status", "AVAILABLE", "id", 9, "ancestryIds", List.of(9, 8)), "organizationDefaults", m("DEFAULT_LANGUAGE", "en", "COMMUNICATION", m("id", 77)),
                "organizationType", type(4, field("DEFAULT_LANGUAGE", "java.lang.String", null), field("COMMUNICATION", "com.pixelnation.common.domain.Dictionary", 77), field("QUOTATION_EXPIRATION", "java.time.LocalDate", null)),
                "customerType", type(2, field("LEGAL_ENTITY_TYPE", "java.lang.String", null, "options", List.of("CORPORATE", "INDIVIDUAL"))),
                "propertyType", type(154, field("ADDRESS", "com.pixelnation.common.domain.Address", null), field("ACCOUNT", "com.pixelnation.account.domain.Account", null, "entityTypes", List.of(2))),
                "agreementType", type(17, field("CLIENT", "com.pixelnation.account.domain.Account", null, "entityTypes", List.of(2)), field("ORDERS", "com.pixelnation.bill.domain.Order", null, "entityTypes", List.of(5, 6))),
                "serviceOrderType", type(6, field("SERVICE_PROPERTY", "com.pixelnation.rm.domain.Resource", null, "entityTypes", List.of(154))),
                "ledgerAccountType", type(3),
                "seasonSettingsType", type(35, field("SEASON_START", "java.time.LocalDate", null), field("SEASON_END", "java.time.LocalDate", null)),
                "referenceScripts", m("serviceOrder", m("status", "AVAILABLE"), "accessDelivery", m("status", "AVAILABLE"), "quoteDelivery", m("status", "AVAILABLE"), "quoteConfirmation", m("status", "AVAILABLE")),
                "adminRole", m("status", "AVAILABLE", "code", "ADMIN", "ownerCode", "SYSTEM", "hasExplicitSystemAdminPermission", false), "adminLoginExists", false, "seasonStartAvailable", false, "errors", List.of());
    }
    private static Map<String, Object> purchase() {
        return m("sourceFormId", 101, "orderId", 201, "purchaseConfirmed", true, "checkoutDigest", "confirmed-digest", "entitlementFingerprint", "confirmed-entitlements",
                "companyName", "In-memory company", "companyAddressText", "Client-supplied address", "email", "buyer@example.invalid",
                "companyAddressSnapshot", m("countryCode", "CA", "addressId", 301), "purchaserAttributes", m("LEGAL_ENTITY_TYPE", "INDIVIDUAL"), "currency", m("id", 401, "code", "CAD"),
                "entitlementSnapshot", m("propertyCapacity", m("included", 200, "expansionPacks", 2, "expansionPackSize", 100,
                        "limit", 400, "maximumValidation", "MAXIMUM_NOT_STRUCTURED"), "features", List.of(m("value", true))));
    }
    @SuppressWarnings("unchecked") private static Map<String, Object> map(Object value) { return (Map<String, Object>) value; }
    private static boolean has(Map<String, Object> report, String step, String code, String field) {
        return ((List<?>) report.get("blockers")).stream().map(OnboardingReadinessTest::map)
                .anyMatch(row -> Objects.equals(step, row.get("step")) && Objects.equals(code, row.get("code")) && Objects.equals(field, row.get("field")));
    }
    private static void check(boolean condition, String message) { if (!condition) throw new AssertionError(message); checks++; }

    public static void main(String[] args) {
        Map<String, Object> purchase = purchase(), model = model(), config = config();
        String beforePurchase = purchase.toString(), beforeModel = model.toString();
        Map<String, Object> report = OnboardingReadiness.evaluate(purchase, model, config);
        check(has(report, "organization", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "QUOTATION_EXPIRATION"), "Missing inherited organization date must be visible");
        check(!has(report, "starterCustomer", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "LEGAL_ENTITY_TYPE"), "Approved starter legal type is configured");
        check(!has(report, "purchaserAccount", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "LEGAL_ENTITY_TYPE"), "Read the actual purchaser classification");
        check(!has(report, "property", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "ADDRESS"), "Client address must supply the Property source");
        check(!has(report, "property", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "ACCOUNT"), "Starter Customer supplies the symbolic Account link");
        Map<String, Object> agreementStep = ((List<?>) report.get("steps")).stream().map(OnboardingReadinessTest::map).filter(s -> "agreement".equals(s.get("step"))).findFirst().orElseThrow();
        check(List.of(m("reference", "serviceOrder")).equals(map(map(agreementStep.get("proposed")).get("attributes")).get("ORDERS")), "Use the separate service Order, never the subscription purchase");
        check(!has(report, "administrator", "PLATFORM_ADMIN_ROLE_FORBIDDEN", "role") && !has(report, "administrator", "ADMIN_ROLE_SCOPE_UNVERIFIED", "role"), "SYSTEM defines ADMIN but assignment is to the client organization");
        check(((List<?>) report.get("steps")).stream().map(OnboardingReadinessTest::map).anyMatch(s -> "ledger".equals(s.get("step")) && "Account".equals(s.get("entity")) && "ORGANIZATION".equals(map(s.get("type")).get("code"))), "Ledger is the native ORGANIZATION Account");
        check(has(report, "seasonSettings", "SEASON_SETTINGS_REQUIRED", "CONTRACT_SETTINGS.SEASON_START"), "Season source required for the chosen expiry policy");
        check(has(report, "entitlements", "CAPACITY_MAXIMUM_UNVERIFIED", "ACTIVE_PROPERTIES_MAXIMUM"), "An unchecked overall plan maximum must remain visible");
        check(!has(report, "entitlements", "ENTITLEMENT_CONTRACT_REQUIRED", "enforcement"), "Accept the agreed native backend contract without claiming runtime execution");
        check(has(report, "quotation", "QUOTE_EXPIRY_IMPLEMENTATION_REQUIRED", "quoteLinkPolicy"), "The existing max(now+days, seasonStart) rule must not be reported as the chosen rule");
        check(Boolean.FALSE.equals(report.get("canProvision")) && Boolean.FALSE.equals(report.get("creationEnabled")), "Never enable execution from readiness");
        check(Boolean.FALSE.equals(report.get("paymentConfirmed")), "Buyer confirmation never means payment confirmation");
        check(beforePurchase.equals(purchase.toString()) && beforeModel.equals(model.toString()), "Evaluation must not mutate trusted inputs");

        model = model(); map(model.get("customerType")).put("attributes", List.of(field("NEW_REQUIRED_FIELD", "java.lang.String", "")));
        report = OnboardingReadiness.evaluate(purchase(), model, config());
        check(has(report, "starterCustomer", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "NEW_REQUIRED_FIELD"), "New inherited requirements must be discovered");
        model = model(); map(model.get("propertyType")).put("attributes", List.of(field("ACCOUNT", "com.pixelnation.account.domain.Account", null, "entityTypes", List.of(999))));
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "property", "REFERENCE_TYPE_NOT_ALLOWED", "ACCOUNT"), "Reference constraints must be respected");
        config = config(); config.put("starterLegalEntityType", "GUESSED_VALUE");
        check(has(OnboardingReadiness.evaluate(purchase(), model(), config), "starterCustomer", "ATTRIBUTE_VALUE_NOT_ALLOWED", "LEGAL_ENTITY_TYPE"), "Reject unsupported legal classification");
        config = config(); config.put("starterLegalEntityType", "INDIVIDUAL");
        config.put("purchaserLegalEntityType", "INDIVIDUAL");
        purchase = purchase(); map(purchase.get("purchaserAttributes")).clear();
        report = OnboardingReadiness.evaluate(purchase, model(), config);
        check(!has(report, "starterCustomer", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "LEGAL_ENTITY_TYPE"), "Use the authorized starter default");
        check(has(report, "purchaserAccount", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "LEGAL_ENTITY_TYPE"), "A creation default must not hide missing data on an existing purchaser");
        purchase = purchase(); map(purchase.get("purchaserAttributes")).put("LEGAL_ENTITY_TYPE", "INDIVIDUAL");
        report = OnboardingReadiness.evaluate(purchase, model(), config);
        check(!has(report, "purchaserAccount", "REQUIRED_ATTRIBUTE_SOURCE_MISSING", "LEGAL_ENTITY_TYPE"), "Accept the persisted purchaser default");
        map(purchase.get("purchaserAttributes")).put("LEGAL_ENTITY_TYPE", "CORPORATE");
        String classifiedPurchase = purchase.toString();
        report = OnboardingReadiness.evaluate(purchase, model(), config);
        check(!has(report, "purchaserAccount", "ATTRIBUTE_VALUE_NOT_ALLOWED", "LEGAL_ENTITY_TYPE") && classifiedPurchase.equals(purchase.toString()), "Preserve a manager-selected classification instead of applying the default");
        purchase = purchase(); purchase.put("email", "a".repeat(65) + "@example.invalid");
        check(has(OnboardingReadiness.evaluate(purchase, model(), config()), "administrator", "ADMIN_LOGIN_SOURCE_REQUIRED", "name"), "Do not truncate a valid contact email into a guessed login");
        model = model(); model.put("adminLoginExists", true);
        check(!has(OnboardingReadiness.evaluate(purchase(), model, config()), "administrator", "EXISTING_ADMIN_POLICY_REQUIRED", "name"), "Reuse policy is resolved for existing Users");
        config = config(); config.remove("existingAdminPolicy");
        check(has(OnboardingReadiness.evaluate(purchase(), model, config), "administrator", "EXISTING_ADMIN_POLICY_REQUIRED", "name"), "Do not silently replace an absent reuse policy");
        model = model(); map(model.get("adminRole")).put("hasExplicitSystemAdminPermission", true);
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "administrator", "PLATFORM_ADMIN_ROLE_FORBIDDEN", "role"), "Platform admin forbidden");
        config = config(); config.put("adminAssignmentScope", "SYSTEM");
        check(has(OnboardingReadiness.evaluate(purchase(), model(), config), "administrator", "PLATFORM_ADMIN_ROLE_FORBIDDEN", "role"), "ADMIN must never be assigned in SYSTEM");
        model = model(); map(model.get("adminRole")).put("ownerCode", "OTHER_ROOT");
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "administrator", "ADMIN_ROLE_SCOPE_UNVERIFIED", "role"), "Another role with the same code is not interchangeable");
        model = model(); map(model.get("serviceOrderType")).put("owner", m("id", 999, "code", "OTHER_ROOT"));
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "serviceOrder", "TYPE_ORGANIZATION_UNAVAILABLE", "type.owner"), "Service Order type must belong to the intended tenant branch");
        model = model(); map(model.get("serviceOrderType")).put("workflow", m("initialState", "ACTIVE"));
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "serviceOrder", "SERVICE_ORDER_DRAFT_CONFIGURATION_REQUIRED", "preparation"), "Do not activate an example service Order");
        model = model(); map(model.get("agreementType")).put("attributes", List.of(field("ORDERS", "com.pixelnation.bill.domain.Order", null, "entityTypes", List.of(999))));
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "agreement", "REFERENCE_TYPE_NOT_ALLOWED", "ORDERS"), "Agreement must accept the selected concrete service Order type");
        model = model(); map(model.get("ledgerAccountType")).put("code", "CUSTOMER");
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "ledger", "LEDGER_TYPE_CONTRACT_MISMATCH", "type"), "A Client Account cannot stand in for a Ledger Account");
        model = model(); map(map(model.get("referenceScripts")).get("accessDelivery")).put("status", "UNAVAILABLE");
        check(has(OnboardingReadiness.evaluate(purchase(), model, config()), "accessDelivery", "REFERENCE_SCRIPT_UNAVAILABLE", "accessDelivery"), "A missing Request Quote reference must remain visible");
        purchase = purchase(); purchase.remove("currency");
        check(has(OnboardingReadiness.evaluate(purchase, model(), config()), "serviceOrder", "CONFIRMED_CURRENCY_REQUIRED", "currency"), "Do not guess the service Order currency");
        purchase = purchase(); map(purchase.get("companyAddressSnapshot")).put("countryCode", "US");
        report = OnboardingReadiness.evaluate(purchase, model(), config());
        check(((List<?>) report.get("steps")).isEmpty() && has(report, "scope", "COUNTRY_NOT_SUPPORTED", "COMPANY_ADDRESS"), "US must not produce CA proposals");
        purchase = purchase(); purchase.put("purchaseConfirmed", false);
        check(((List<?>) OnboardingReadiness.evaluate(purchase, model(), config()).get("steps")).isEmpty(), "Unconfirmed purchase fails closed");
        purchase = purchase(); purchase.remove("entitlementSnapshot");
        check(has(OnboardingReadiness.evaluate(purchase, model(), config()), "entitlements", "CONFIRMED_ENTITLEMENTS_REQUIRED", "entitlementSnapshot"), "Legacy purchase cannot invent current Entitlements");
        model = model(); model.put("errors", List.of("Model read failed"));
        report = OnboardingReadiness.evaluate(purchase(), model, config());
        check(has(report, "model", "MODEL_SOURCE_UNVERIFIED", "model"), "Read errors cannot silently pass");
        check(((List<?>) report.get("steps")).stream().map(OnboardingReadinessTest::map).noneMatch(row -> Boolean.TRUE.equals(row.get("sourceReady"))), "Model read errors prevent individual ready claims");
        purchase = purchase(); model = model(); config = config();
        map(model.get("organizationDefaults")).put("QUOTATION_EXPIRATION", "2027-01-01");
        model.put("seasonStartAvailable", true); model.put("seasonSettings", m("status", "CONFIGURED", "typeCode", "CONTRACT_AWARE", "source", "TEMPORARY_CA_CONFIG",
                "countryCode", "CA", "seasonStart", "2026-11-01", "seasonEnd", "2027-03-31"));
        map(config.get("quoteLinkPolicy")).put("implementationStatus", "READY");
        model.put("quoteExpiryPolicy", m("status", "READY", "sourceFingerprintsVerified", true));
        Map<String, Object> capacity = map(map(purchase.get("entitlementSnapshot")).get("propertyCapacity"));
        capacity.put("maximumValidation", "VALIDATED_CONFIG_MAXIMUM"); capacity.put("maximumSource", "TEMPORARY_CONFIG"); capacity.put("overallMaximum", 1000);
        report = OnboardingReadiness.evaluate(purchase, model, config);
        check(Boolean.TRUE.equals(report.get("configurationReady")) && Boolean.FALSE.equals(report.get("canProvision")), "Resolved sources still cannot enable provisioning or payment");
        check(((List<?>) report.get("warnings")).size() == 3 && ((List<?>) report.get("executionGates")).contains("PROVISIONING_EXECUTOR_NOT_ENABLED"), "Deferred verification remains distinct from execution gates");
        for (Object raw : (List<?>) map(model.get("organizationType")).get("attributes")) if ("QUOTATION_EXPIRATION".equals(map(raw).get("code"))) map(raw).put("required", false);
        map(model.get("organizationDefaults")).remove("QUOTATION_EXPIRATION");
        report = OnboardingReadiness.evaluate(purchase, model, config);
        check(Boolean.TRUE.equals(report.get("configurationReady")), "An optional legacy date must not require a guessed organization value");
        Map<String, Object> seasonStep = ((List<?>) report.get("steps")).stream().map(OnboardingReadinessTest::map).filter(s -> "seasonSettings".equals(s.get("step"))).findFirst().orElseThrow();
        check(Boolean.FALSE.equals(map(seasonStep.get("proposed")).get("existingEntityAvailable")) && Boolean.FALSE.equals(seasonStep.get("creationEnabled")), "Configured dates do not claim an existing Dictionary or create it");
        map(model.get("seasonSettings")).put("seasonEnd", "2026-10-01");
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "seasonSettings", "SEASON_SETTINGS_REQUIRED", "CONTRACT_SETTINGS.SEASON_START"), "A reversed season is rejected");
        map(model.get("seasonSettings")).put("seasonEnd", "not-a-date");
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "seasonSettings", "SEASON_SETTINGS_REQUIRED", "CONTRACT_SETTINGS.SEASON_START"), "An invalid season date is rejected");
        map(model.get("seasonSettings")).put("seasonEnd", "2027-03-31");
        map(model.get("seasonSettings")).put("countryCode", "US");
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "seasonSettings", "SEASON_SETTINGS_REQUIRED", "CONTRACT_SETTINGS.SEASON_START"), "The CA default cannot silently become a US default");
        map(model.get("seasonSettings")).put("countryCode", "CA");
        map(model.get("quoteExpiryPolicy")).put("sourceFingerprintsVerified", false);
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "quotation", "QUOTE_EXPIRY_IMPLEMENTATION_REQUIRED", "quoteLinkPolicy"), "A READY configuration flag alone cannot approve unverified remote Quote sources");
        map(model.get("quoteExpiryPolicy")).put("sourceFingerprintsVerified", true);
        capacity.put("overallMaximum", 400);
        check(!has(OnboardingReadiness.evaluate(purchase, model, config), "entitlements", "CAPACITY_MAXIMUM_UNVERIFIED", "ACTIVE_PROPERTIES_MAXIMUM"), "Accept capacity exactly at the saved maximum");
        capacity.put("overallMaximum", 399);
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "entitlements", "CAPACITY_MAXIMUM_UNVERIFIED", "ACTIVE_PROPERTIES_MAXIMUM"), "Reject a saved allowance above its maximum");
        capacity.remove("overallMaximum");
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "entitlements", "CAPACITY_MAXIMUM_UNVERIFIED", "ACTIVE_PROPERTIES_MAXIMUM"), "A success marker alone cannot validate an older purchase");
        capacity.put("overallMaximum", 1000); capacity.put("limit", 450);
        check(has(OnboardingReadiness.evaluate(purchase, model, config), "entitlements", "CAPACITY_MAXIMUM_UNVERIFIED", "ACTIVE_PROPERTIES_MAXIMUM"), "The stored allowance must match included capacity plus purchased packs");
        for (String key : List.of("creationEnabled", "paymentEnabled", "grantIssuanceEnabled")) {
            config = config(); config.put(key, true); boolean refused = false;
            try { OnboardingReadiness.evaluate(purchase(), model(), config); } catch (IllegalArgumentException expected) { refused = true; }
            check(refused, "Unsafe mode must be rejected: " + key);
        }
        System.out.println("Onboarding readiness: " + checks + " assertions passed; no persisted entities or external calls");
    }
}
