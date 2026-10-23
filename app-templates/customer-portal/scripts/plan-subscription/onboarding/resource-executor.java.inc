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
