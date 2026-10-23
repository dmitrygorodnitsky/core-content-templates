package com.pixelnation.rm.generated;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.json.Json;
import com.pixelnation.common.persistence.iface.IUserManager;
import com.pixelnation.common.persistence.iface.IOrganizationManager;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Read-only RM model projection. No Resource/User/organization persistence. */
public class MAIN_CLASS {
    @Autowired private TransactionUtils transactionUtils;
    @Autowired private IUserManager userManager;
    @Autowired private IOrganizationManager organizationManager;
    @PersistenceContext private EntityManager entityManager;

    public Map<String, Object> inspectPropertyType(String typeCode) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated model reader required");
        return transactionUtils.getInNewTx(() -> {
            User caller = entityManager.find(User.class, callerId);
            boolean service = callerId.equals(userManager.getSystemUserId());
            var scope = organizationManager.getByCode(service ? "SERVICEWAND" : "SYSTEM");
            if (caller == null || scope == null) throw new ApplicationException("Model reader context is unavailable");
            User principal = caller;
            if (service) {
                principal = new User(); principal.setId(caller.getId()); principal.setName(caller.getName()); principal.setFullname(caller.getFullname()); principal.setRoles(new LinkedHashSet<>());
            }
            return Auth.withUser(principal, scope, (Supplier<Map<String, Object>>) () -> {
                if (!service && !Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("Read-only model inspection requires a system executor or administrator");
                if (!"SNOW_REMOVAL_PROPERTY".equals(typeCode)) throw new ApplicationException("Unsupported onboarding Property type");
                return describeType("ResourceType", typeCode);
            }).get();
        });
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> objectMap(Object value) {
        if (!(value instanceof Map<?, ?>)) throw new ApplicationException("Model mapping is missing");
        return (Map<String, Object>) value;
    }

    // BEGIN GENERATED ONBOARDING TYPE INSPECTOR
    private Map<String, Object> describeType(String entityName, String code) {
        if (entityManager.getMetamodel().getEntities().stream().noneMatch(type -> entityName.equals(type.getName()))) {
            return Map.of("status", "UNAVAILABLE", "code", code, "reason", "ENTITY_NOT_REGISTERED_ON_NODE");
        }
        List<?> rows = entityManager.createQuery("SELECT t FROM " + entityName + " t WHERE t.code = :code", Object.class)
                .setParameter("code", code).getResultList();
        if (rows.size() != 1) return Map.of("status", "UNAVAILABLE", "code", code);
        Object type = rows.get(0); Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "AVAILABLE"); result.put("id", property(type, "id")); result.put("code", code);
        Object owner = property(type, "organization");
        Map<String, Object> ownerInfo = new LinkedHashMap<>();
        ownerInfo.put("id", property(owner, "id")); ownerInfo.put("code", property(owner, "code"));
        result.put("owner", ownerInfo);
        result.put("parents", collection(property(type, "parents")).stream().map(parent -> {
            Map<String, Object> reference = new LinkedHashMap<>();
            reference.put("id", property(parent, "id")); reference.put("code", property(parent, "code")); return reference;
        }).toList());
        Object abstractValue = property(type, "abstract");
        result.put("isAbstract", abstractValue == null ? property(type, "isAbstract") : abstractValue);
        Map<String, Object> fields = new TreeMap<>();
        collectTypeFields(type, fields, new LinkedHashSet<>(), new LinkedHashSet<>());
        result.put("attributes", new ArrayList<>(fields.values()));
        Object workflow = property(type, "workflow");
        Map<String, Object> wf = new LinkedHashMap<>(); wf.put("id", property(workflow, "id")); wf.put("code", property(workflow, "code"));
        wf.put("initialState", property(property(workflow, "initialState"), "code"));
        if ("ResourceType".equals(entityName) && workflow != null) wf.put("states", collection(property(workflow, "states")).stream().sorted(java.util.Comparator.comparing(value -> String.valueOf(property(value,"code")))).map(state -> {
            Map<String, Object> projected = new LinkedHashMap<>(); projected.put("id", property(state, "id")); projected.put("code", property(state, "code"));
            projected.put("events", collection(property(state, "events")).stream().sorted(java.util.Comparator.comparing(value -> String.valueOf(property(value,"code")))).map(event -> Map.of("id", property(event,"id"), "code", property(event,"code"),
                "targets", collection(property(event,"targets")).stream().map(target -> Map.of("id", property(target,"id"), "code", property(target,"code"))).toList())).toList()); return projected;
        }).toList());
        result.put("workflow", wf);
        return result;
    }

    private void collectTypeFields(Object type, Map<String, Object> fields, Set<Object> path, Set<Object> seen) {
        Object id = property(type, "id");
        if (!path.add(id)) throw new ApplicationException("Cyclic type inheritance");
        if (!seen.contains(id)) {
            for (Object parent : collection(property(type, "parents"))) collectTypeFields(parent, fields, path, seen);
            for (Object raw : collection(property(type, "attributes"))) {
                Map<String, Object> field = Json.defaultMapper().convertValue(raw, Map.class);
                Map<String, Object> projected = new LinkedHashMap<>();
                for (String key : List.of("code", "required", "className", "defaultValue", "freeValue")) projected.put(key, field.get(key));
                projected.put("options", collection(field.get("options")).stream().map(value -> objectMap(value).get("value")).toList());
                projected.put("entityTypes", collection(field.get("entityTypes")).stream().map(value -> objectMap(value).get("value")).toList());
                if (!(field.get("code") instanceof String)) throw new ApplicationException("Unreadable model attribute");
                fields.put(String.valueOf(field.get("code")), projected);
            }
            seen.add(id);
        }
        path.remove(id);
    }

    private static Collection<?> collection(Object value) { return value instanceof Collection<?> rows ? rows : List.of(); }
    private static Object property(Object bean, String key) {
        if (bean == null) return null;
        var wrapper = new org.springframework.beans.BeanWrapperImpl(bean);
        return wrapper.isReadableProperty(key) ? wrapper.getPropertyValue(key) : null;
    }
    // END GENERATED ONBOARDING TYPE INSPECTOR

    // BEGIN GENERATED ONBOARDING RESOURCE EXECUTOR
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("resourceManager") private com.pixelnation.rm.persistence.iface.IResourceManager onboardingResources;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("resourceTypeManager") private com.pixelnation.rm.persistence.iface.IResourceTypeManager onboardingResourceTypes;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("scriptManager") private com.pixelnation.common.persistence.iface.IScriptManager onboardingScripts;

    public Map<String, Object> ensureOnboardingProperty(String payloadJson) { return onboardingProperty(payloadJson, true); }
    public Map<String, Object> verifyOnboardingProperty(String payloadJson) { return onboardingProperty(payloadJson, false); }
    @SuppressWarnings("unchecked")
    private Map<String, Object> onboardingProperty(String payloadJson, boolean create) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated onboarding Property executor required");
        return transactionUtils.getInNewTxRW(() -> {
            User caller = entityManager.find(User.class, callerId);
            if (caller == null) throw new ApplicationException("Onboarding caller unavailable");
            boolean service = callerId.equals(userManager.getSystemUserId());
            User principal = caller;
            if (service) { principal = new User(); principal.setId(caller.getId()); principal.setName(caller.getName()); principal.setFullname(caller.getFullname()); principal.setRoles(new LinkedHashSet<>()); }
            return Auth.withUser(principal, organizationManager.getByCode("SYSTEM"), (Supplier<Map<String, Object>>) () -> {
                if (!service && !Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("System onboarding executor required");
                Map<String, Object> config = objectMap(onboardingScripts.getByCode("PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1").getMetadata().get("ONBOARDING_EXECUTOR_CONFIG"));
                if (!Boolean.TRUE.equals(config.get("executionEnabled"))) throw new ApplicationException("Onboarding Property creation is disabled");
                Map<String, Object> input;
                try { input = Json.defaultMapper().readValue(payloadJson, Map.class); } catch (Exception invalid) { throw new ApplicationException("Invalid onboarding Property source"); }
                long orderId = onboardingNumber(input.get("orderId"));
                int orgId = Math.toIntExact(onboardingNumber(input.get("targetOrganizationId"))), accountId = Math.toIntExact(onboardingNumber(input.get("starterCustomerId")));
                String digest = String.valueOf(input.get("planDigest"));
                if (!digest.matches("[a-f0-9]{64}")) throw new ApplicationException("Frozen onboarding digest required");
                long lock = java.nio.ByteBuffer.wrap(onboardingHash("PLAN_SUBSCRIPTION_PROPERTY:" + orderId)).getLong();
                entityManager.createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(:key)").setParameter("key", lock).getSingleResult();
                var org = organizationManager.get(orgId);
                Map<String, Object> marker = Map.of("orderId", orderId, "sourceFormId", onboardingNumber(input.get("sourceFormId")), "planDigest", digest);
                if (org == null || org.getParent() == null || !"SERVICE_WAND_WINTER_SERVICES_CANADA".equals(org.getParent().getCode())
                        || !org.getCode().equals("PS_ORG_" + orderId) || !onboardingCanonical(marker).equals(onboardingCanonical(org.getMetadata().get("PLAN_SUBSCRIPTION_ONBOARDING")))) throw new ApplicationException("Property target does not match the recorded CA purchase");
                String code = "PS_PROPERTY_" + orderId;
                var rows = onboardingResources.selectJPQL("SELECT r FROM Resource r WHERE r.organization.id = :org AND r.code = :code", Map.of("org", orgId, "code", code), com.pixelnation.rm.domain.Resource.class);
                if (rows.size() > 1 || rows.isEmpty() && (!create || input.get("propertyId") != null)) throw new ApplicationException("Recorded Property missing/duplicated");
                var type = onboardingResourceTypes.getByCode("SNOW_REMOVAL_PROPERTY");
                if (type == null || type.getWorkflow() == null || type.getWorkflow().getInitialState() == null || !"INITIAL".equals(type.getWorkflow().getInitialState().getCode())) throw new ApplicationException("Property type must start INITIAL");
                var row = rows.isEmpty() ? null : rows.getFirst();
                if (row == null) {
                    row = new com.pixelnation.rm.domain.Resource(); row.setOrganization(org); row.setCode(code); row.setType(type);
                    row.setNlsValue("en", "NAME", "Property 1"); row.setWorkflow(type.getWorkflow()); row.setStates(new LinkedHashSet<>(Set.of(type.getWorkflow().getInitialState())));
                    row.setMetadata(new LinkedHashMap<>(Map.of("PLAN_SUBSCRIPTION_ONBOARDING", marker)));
                    Integer accountOwner=onboardingAttributeOwner(type,"ACCOUNT",new LinkedHashSet<>()), addressOwner=onboardingAttributeOwner(type,"ADDRESS",new LinkedHashSet<>());
                    if(accountOwner==null || addressOwner==null)throw new ApplicationException("Onboarding Property attribute owner unavailable");
                    row.setAttributeValue(accountOwner, "ACCOUNT", accountId, null);
                    row.setAttributeValue(addressOwner, "ADDRESS", Math.toIntExact(onboardingNumber(input.get("addressId"))), null);
                    row = onboardingResources.save(row); onboardingResources.flush();
                }
                if (!type.getId().equals(row.getType().getId()) || !onboardingCanonical(marker).equals(onboardingCanonical(row.getMetadata().get("PLAN_SUBSCRIPTION_ONBOARDING")))
                        || onboardingNumber(row.findFirstAttributeValue("ACCOUNT")) != accountId || onboardingNumber(row.findFirstAttributeValue("ADDRESS")) != onboardingNumber(input.get("addressId"))
                        || !row.hasState("INITIAL") || input.get("propertyId") != null && row.getId().longValue() != onboardingNumber(input.get("propertyId"))) throw new ApplicationException("Recorded Property receipt or links changed");
                return Map.of("id", row.getId(), "organizationId", orgId, "accountId", accountId, "verified", true);
            }).get();
        });
    }
    private Integer onboardingAttributeOwner(Object type, String code, Set<Object> seen) {
        if (type == null || !seen.add(property(type, "id"))) return null;
        if (collection(property(type, "attributes")).stream().anyMatch(field -> code.equals(property(field, "code")))) return ((Number) property(type, "id")).intValue();
        for (Object parent : collection(property(type, "parents"))) { Integer id = onboardingAttributeOwner(parent, code, seen); if (id != null) return id; }
        return null;
    }
    private static long onboardingNumber(Object value) {
        try { long result = new java.math.BigDecimal(String.valueOf(value)).longValueExact(); if (result > 0) return result; } catch (RuntimeException invalid) { }
        throw new ApplicationException("Positive onboarding reference required");
    }
    private static byte[] onboardingHash(String value) {
        try { return java.security.MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
        catch (Exception invalid) { throw new ApplicationException("Onboarding digest failed"); }
    }
    private static Object onboardingCanonicalValue(Object raw) {
        if (raw instanceof Map<?, ?> values) { Map<String, Object> sorted = new TreeMap<>(); values.forEach((key, value) -> sorted.put(String.valueOf(key), onboardingCanonicalValue(value))); return sorted; }
        if (raw instanceof Collection<?> values) return values.stream().map(MAIN_CLASS::onboardingCanonicalValue).toList();
        return raw;
    }
    private static String onboardingCanonical(Object raw) {
        try { return Json.defaultMapper().writeValueAsString(onboardingCanonicalValue(raw)); } catch (Exception invalid) { throw new ApplicationException("Onboarding serialization failed"); }
    }
    // END GENERATED ONBOARDING RESOURCE EXECUTOR
}
