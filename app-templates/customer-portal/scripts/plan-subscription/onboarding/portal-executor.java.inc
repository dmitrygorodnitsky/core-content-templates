    private static final String ONBOARDING_PORTAL_TEMPLATE = "CUSTOMER_PORTAL_SUBSCRIPTION";
    private static final String ONBOARDING_PORTAL_ORGANIZATION = "PORTAL_ORGANIZATION";

    @Autowired private com.pixelnation.cms.service.iface.IPageContextService onboardingPages;

    public Map<String, Object> checkOnboardingCustomerPortal() {
        Integer caller = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        return transactionUtils.getInNewTx(() -> {
            if (caller == null || !caller.equals(userManager.getSystemUserId())) throw new ApplicationException("System onboarding executor required");
            return Map.of("status", customerPortalTemplate() == null ? "PORTAL_TEMPLATE_UNAVAILABLE" : "READY");
        });
    }

    public Map<String, Object> ensureOnboardingCustomerPortal(String payloadJson) {
        Integer caller = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (caller == null) throw new ApplicationException("Authenticated onboarding executor required");
        return transactionUtils.getInNewTxRW(() -> {
            if (!caller.equals(userManager.getSystemUserId())) throw new ApplicationException("System onboarding executor required");
            Map<String, Object> input;
            try {
                input = map(Json.defaultMapper().readValue(payloadJson, Map.class));
            } catch (Exception invalid) {
                throw new ApplicationException("Invalid onboarding portal request");
            }
            long orderId = number(input.get("orderId"), "Purchase");
            int organizationId = Math.toIntExact(number(input.get("organizationId"), "Organization"));
            String digest = String.valueOf(input.get("planDigest"));
            if (!digest.matches("[a-f0-9]{64}")) throw new ApplicationException("Frozen onboarding digest required");
            Map<String, Object> marker = Map.of("orderId", orderId, "sourceFormId",
                    number(input.get("sourceFormId"), "Form"), "planDigest", digest);
            Organization org = entityManager.find(Organization.class, organizationId, LockModeType.PESSIMISTIC_WRITE);
            if (org == null || !Boolean.TRUE.equals(org.getEnabled()) || !org.getCode().equals("PS_ORG_" + orderId)
                    || org.getType() == null || !"SERVICE_PROVIDER".equals(org.getType().getCode())
                    || !canonicalJson(marker).equals(canonicalJson(org.getMetadata().get("PLAN_SUBSCRIPTION_ONBOARDING")))) {
                throw new ApplicationException("Portal target does not match the recorded purchase");
            }
            String url = String.valueOf(input.get("url"));
            if (!url.equals(org.findFirstAttributeValue("CUSTOMER_PORTAL")) || !Boolean.TRUE.equals(org.findFirstAttributeValue("HOSTING_ENABLED"))) {
                throw new ApplicationException("Organization portal hosting is not configured");
            }
            String path = CustomerPortalOnboarding.pagePath(url, org.getCode());
            return saveOnboardingPortal(org, path, input.get("pageId"));
        });
    }

    private com.pixelnation.cms.domain.BlockTemplate customerPortalTemplate() {
        var templates = entityManager.createQuery(
                "SELECT t FROM BlockTemplate t WHERE t.organization.code = 'SYSTEM' AND t.code = :code",
                com.pixelnation.cms.domain.BlockTemplate.class)
                .setParameter("code", ONBOARDING_PORTAL_TEMPLATE).getResultList();
        if (templates.size() != 1) return null;
        var template = templates.getFirst();
        if (template.getHtml() == null || !template.getHtml().contains("data-portal-organization=\"${PORTAL_ORGANIZATION@STRING}\"")
                || template.getJavascript() == null || template.getJavascript().isBlank() || template.getParameters() == null) return null;
        long bindings = template.getParameters().stream()
                .map(parameter -> map(Json.defaultMapper().convertValue(parameter, Map.class)))
                .filter(parameter -> ONBOARDING_PORTAL_ORGANIZATION.equals(parameter.get("code")) && "STRING".equals(parameter.get("type"))).count();
        return bindings == 1 ? template : null;
    }

    private Map<String, Object> saveOnboardingPortal(Organization org, String path, Object recordedId) {
        var template = customerPortalTemplate();
        if (template == null) throw new ApplicationException("Subscription portal template is unavailable or ambiguous");
        var pages = entityManager.createQuery(
                "SELECT p FROM PageContext p WHERE p.organization.id = :org AND p.site IS NULL AND (p.url = :path OR p.template.id = :template)",
                com.pixelnation.cms.domain.PageContext.class)
                .setParameter("org", org.getId()).setParameter("path", path).setParameter("template", template.getId()).getResultList();
        if (pages.size() > 1 || pages.isEmpty() && recordedId != null) throw new ApplicationException("Recorded subscription portal is missing or duplicated");
        String key = template.getId().toString();
        if (!pages.isEmpty()) {
            var page = pages.getFirst();
            if ((recordedId != null && page.getId().longValue() != number(recordedId, "Page"))
                    || !path.equals(page.getUrl()) || page.getTemplate() == null || !template.getId().equals(page.getTemplate().getId())
                    || !org.getCode().equals(map(page.getValues().get(key)).get(ONBOARDING_PORTAL_ORGANIZATION))) {
                throw new ApplicationException("An incompatible page already uses this portal URL");
            }
            return Map.of("id", page.getId());
        }
        var page = new com.pixelnation.cms.domain.PageContext();
        page.setOrganization(org);
        page.setTemplate(template);
        page.setUrl(path);
        page.setExcludeFromSeo(true);
        page.setValues(new LinkedHashMap<>(Map.of(key, Map.of(ONBOARDING_PORTAL_ORGANIZATION, org.getCode()))));
        page.setPermissions(new LinkedHashSet<>());
        page.setEnabledTemplates(new LinkedHashSet<>());
        Integer saved = savePortalAsSystem(org, page);
        entityManager.flush();
        return Map.of("id", saved);
    }

    private Integer savePortalAsSystem(Organization target, com.pixelnation.cms.domain.PageContext page) {
        var previous = org.springframework.security.core.context.SecurityContextHolder.getContext();
        var scoped = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        scoped.setAuthentication(new com.pixelnation.spring.security.RunAsAuthenticationToken(userManager.getSystemUser(), target,
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("P_USER"),
                        new org.springframework.security.core.authority.SimpleGrantedAuthority("P_PAGE_CTX_W"))));
        try {
            org.springframework.security.core.context.SecurityContextHolder.setContext(scoped);
            return onboardingPages.save(page);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.setContext(previous);
        }
    }
