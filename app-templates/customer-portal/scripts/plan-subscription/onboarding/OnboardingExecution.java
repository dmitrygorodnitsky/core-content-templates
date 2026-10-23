import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Orchestrates trusted native ports. Browser/request payment flags are never inputs. */
public final class OnboardingExecution {
    public interface Port {
        Map<String, Object> inspect();
        void ensureCompany();
        void ensureProperty();
        void ensureAgreement();
        void verifyGraph();
        void deliverAccess();
    }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object raw) { return raw instanceof Map<?, ?> ? (Map<String, Object>) raw : Map.of(); }
    private static List<?> list(Object raw) { return raw instanceof List<?> rows ? rows : List.of(); }
    private static boolean yes(Map<String, Object> map, String key) { return Boolean.TRUE.equals(map.get(key)); }

    public static Map<String, Object> plan(Map<String, Object> purchase, Map<String, Object> readiness, Map<String, Object> config) {
        if (!yes(readiness, "persistedPurchaseVerified") || !yes(readiness, "configurationReady")
                || !list(readiness.get("blockers")).isEmpty()) throw new IllegalArgumentException("Verified ready purchase required");
        Map<String, Object> source = new LinkedHashMap<>();
        for (String key : List.of("sourceFormId", "organizationId", "orderId", "accountId", "invoiceId", "addressId",
                "checkoutDigest", "inputDigest", "catalogFingerprint", "entitlementFingerprint", "confirmationTokenId",
                "buyerAuthorizedAt", "companyName", "companyAddressSnapshot", "companyAddressText", "email", "firstName", "lastName", "phone")) {
            Object value = purchase.get(key); if (value != null) source.put(key, value);
        }
        for (String key : List.of("sourceFormId", "organizationId", "orderId", "accountId", "invoiceId", "addressId", "confirmationTokenId", "buyerAuthorizedAt")) {
            Object value = source.get(key);
            if (!(value instanceof Number) || new java.math.BigDecimal(value.toString()).signum() <= 0) throw new IllegalArgumentException("Missing purchase source: " + key);
            new java.math.BigDecimal(value.toString()).longValueExact();
        }
        if (!"CA".equals(map(source.get("companyAddressSnapshot")).get("countryCode"))) throw new IllegalArgumentException("Only CA supported");
        List<Map<String, Object>> artifacts = new ArrayList<>();
        for (Object raw : list(readiness.get("steps"))) {
            Map<String, Object> step = map(raw);
            if (Set.of("organization", "seasonSettings", "starterCustomer", "property", "serviceOrder", "agreement", "ledger").contains(step.get("step"))) {
                artifacts.add(Map.of("key", step.get("step"), "entity", step.get("entity"), "type", map(step.get("type")), "fields", map(step.get("proposed"))));
            }
        }
        if (artifacts.size() != 7) throw new IllegalArgumentException("Incomplete onboarding graph");
        Map<String, Object> entitlement = map(readiness.get("entitlementSnapshot"));
        if (entitlement.isEmpty()) {
            for (Object raw : list(readiness.get("steps"))) if ("entitlements".equals(map(raw).get("step"))) entitlement = map(map(raw).get("snapshot"));
        }
        List<Map<String, Object>> allowances = allowances(entitlement);
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("schemaVersion", 1); plan.put("source", source); plan.put("artifacts", artifacts);
        plan.put("administrator", list(readiness.get("steps")).stream().map(OnboardingExecution::map).filter(row -> "administrator".equals(row.get("step"))).findFirst().orElseThrow());
        plan.put("entitlementSnapshot", entitlement); plan.put("allowances", allowances);
        plan.put("currency", map(purchase.get("currency")));
        plan.put("configuration", config);
        plan.put("enforcement", policySpecs(artifacts, entitlement, map(config.get("executorEnforcement"))));
        return plan;
    }

    public static List<Map<String, Object>> allowances(Map<String, Object> snapshot) {
        if (!Set.of("MONTHLY", "YEARLY").contains(snapshot.get("billingPeriod"))) throw new IllegalArgumentException("Coverage period required");
        Map<String, Map<String, Object>> rows = new LinkedHashMap<>();
        for (Object raw : list(snapshot.get("features"))) {
            Map<String, Object> feature = map(raw);
            if (!(feature.get("value") instanceof Boolean)) throw new IllegalArgumentException("Boolean feature required");
            if (yes(feature, "value")) allowance(rows, feature.get("definitionCode"), "true", "BOOLEAN", "PURCHASED", false);
        }
        for (Object raw : list(snapshot.get("levels"))) {
            Map<String, Object> level = map(raw);
            if (!(level.get("value") instanceof String text) || text.isBlank()
                    || !Boolean.valueOf(!"false".equals(level.get("value"))).equals(level.get("enabled"))) throw new IllegalArgumentException("Invalid feature level");
            if (yes(level, "enabled")) allowance(rows, level.get("definitionCode"), level.get("value").toString(), "STRING", "PURCHASED", false);
        }
        Map<String, Object> capacity = map(snapshot.get("propertyCapacity"));
        long included = integer(capacity.get("included")), packs = integer(capacity.get("expansionPacks")), size = integer(capacity.get("expansionPackSize")), limit = integer(capacity.get("limit")), maximum = integer(capacity.get("overallMaximum"));
        if (included <= 0 || packs < 0 || size < 0 || packs > 0 && size == 0 || limit != Math.addExact(included, Math.multiplyExact(packs, size))
                || limit > maximum || maximum > Integer.MAX_VALUE || !"VALIDATED_CONFIG_MAXIMUM".equals(capacity.get("maximumValidation"))
                || !"TEMPORARY_CONFIG".equals(capacity.get("maximumSource"))) throw new IllegalArgumentException("Unverified Properties allowance");
        allowance(rows, capacity.get("definitionCode"), Long.toString(limit), "INTEGER", "PURCHASED", true);
        Map<String, Object> weather = map(snapshot.get("weather"));
        long count = integer(weather.get("propertyCount"));
        if (!(weather.get("selected") instanceof Boolean) || count < 0 || count > limit || yes(weather, "selected") != (count > 0)) throw new IllegalArgumentException("Invalid Weather allowance");
        if (yes(weather, "selected")) {
            allowance(rows, weather.get("featureDefinitionCode"), "true", "BOOLEAN", "ADDON", false);
            allowance(rows, weather.get("limitDefinitionCode"), Long.toString(count), "INTEGER", "ADDON", true);
        }
        return new ArrayList<>(rows.values());
    }
    private static long integer(Object raw) {
        if (!(raw instanceof Number)) throw new IllegalArgumentException("Numeric allowance required");
        return new java.math.BigDecimal(raw.toString()).longValueExact();
    }
    private static void allowance(Map<String, Map<String, Object>> rows, Object rawCode, String value, String type, String source, boolean quota) {
        if (!(rawCode instanceof String code) || !code.matches("SERVICEWAND\\.[A-Z0-9_.-]+") || rows.containsKey(code)) throw new IllegalArgumentException("Duplicate/unsupported definition");
        rows.put(code, Map.of("code", code, "value", value, "valueType", type, "grantType", source, "quota", quota));
    }

    public static Map<String, Object> policySpecs(List<Map<String, Object>> artifacts, Map<String, Object> snapshot, Map<String, Object> config) {
        if (!"SERVICEWAND".equals(config.get("definitionOwnerCode"))) throw new IllegalArgumentException("Definition owner must be ServiceWand");
        Map<String, Object> type = artifacts.stream().filter(row -> "property".equals(row.get("key"))).map(row -> map(row.get("type"))).findFirst().orElseThrow();
        String condition = "#entity.type.id == " + integer(type.get("id"));
        String active = "#entity.states.^[code == 'ACTIVE'] != null";
        String definition = String.valueOf(map(snapshot.get("propertyCapacity")).get("definitionCode"));
        List<Map<String,Object>> policies = new ArrayList<>(), bindings = new ArrayList<>();
        for (String action : List.of("CREATE", "DELETE")) policies.add(Map.of("key", "property:"+action, "action", action,
                "definitionCode", definition, "entityClass", "com.pixelnation.rm.domain.Resource", "whenExpression", "("+condition+") and "+active));
        Set<Long> events = new java.util.HashSet<>();
        for (Object stateRaw : list(map(type.get("workflow")).get("states"))) {
            Map<String,Object> state=map(stateRaw); boolean fromActive="ACTIVE".equals(state.get("code"));
            for(Object eventRaw:list(state.get("events"))) {
                Map<String,Object> event=map(eventRaw); List<?> targets=list(event.get("targets"));
                if(targets.stream().map(OnboardingExecution::map).noneMatch(target->fromActive != "ACTIVE".equals(target.get("code")))) continue;
                if(targets.size()!=1)throw new IllegalArgumentException("Ambiguous Property ACTIVE boundary");
                long id=integer(event.get("id"));if(id<=0 || !events.add(id))throw new IllegalArgumentException("Duplicate/invalid Property event");
                bindings.add(Map.of("key","property:event:"+id,"operation","workflow:event:"+id,"policyAction",fromActive?"DEACTIVATE":"ACTIVATE",
                        "effectType",fromActive?"RELEASE_QUOTA":"RESERVE_QUOTA","definitionCode",definition,"whenExpression",condition));
            }
        }
        if(bindings.stream().noneMatch(row->"RESERVE_QUOTA".equals(row.get("effectType"))) || bindings.stream().noneMatch(row->"RELEASE_QUOTA".equals(row.get("effectType"))))throw new IllegalArgumentException("Property lifecycle boundaries unavailable");
        bindings.sort(java.util.Comparator.comparing(row->row.get("key").toString()));
        List<String> blockers=new ArrayList<>();
        if(Boolean.TRUE.equals(map(snapshot.get("weather")).get("selected"))) {
            // Weather property selection is a later feature. Its consuming operation must be
            // supplied by backend; never infer it from a marketing/product attribute.
            blockers.add("WEATHER_SETUP_PENDING");
        }
        return Map.of("policyTemplates",policies,"bindingTemplates",bindings,"blockers",blockers);
    }

    public static Map<String, Object> run(Port port) {
        Map<String, Object> current = port.inspect();
        List<String> blockers = new ArrayList<>();
        for (String gate : List.of("executionEnabled", "grantIssuanceEnabled", "accessDeliveryEnabled")) if (!yes(current, gate)) blockers.add(gate.toUpperCase(java.util.Locale.ROOT) + "_DISABLED");
        if (!yes(current, "paymentConfirmed")) blockers.add("CONFIRMED_PAYMENT_REQUIRED");
        if (!yes(current, "planVerified")) blockers.add("FROZEN_PLAN_REQUIRED");
        if (!yes(current, "enforcementReady")) blockers.add("ENTITLEMENT_CONFIGURATION_REQUIRED");
        if (!blockers.isEmpty()) return Map.of("status", "BLOCKED", "blockers", blockers, "paymentEnabled", false, "mutationsPerformed", false);
        // Every native stage obtains the purchase lock, rechecks payment/plan, verifies existing
        // records, and atomically commits that stage's records and receipt. A lost response is safe.
        port.ensureCompany(); port.ensureProperty(); port.ensureAgreement(); port.verifyGraph();
        port.deliverAccess();
        current = port.inspect();
        if (!yes(current, "graphVerified") || !yes(current, "accessDelivered")) throw new IllegalStateException("Onboarding did not reach verified completion");
        return Map.of("status", "COMPLETE", "receipt", map(current.get("receipt")), "paymentEnabled", false);
    }
}
