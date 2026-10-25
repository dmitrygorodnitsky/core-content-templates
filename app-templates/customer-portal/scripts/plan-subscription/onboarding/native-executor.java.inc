    private static final String ONBOARDING = "PLAN_SUBSCRIPTION_ONBOARDING";
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("documentManager") private com.pixelnation.common.persistence.iface.IDocumentManager onboardingDocuments;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("roleManager") private com.pixelnation.common.persistence.iface.IRoleManager onboardingRoles;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("languageManager") private com.pixelnation.common.persistence.iface.ILanguageManager onboardingLanguages;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("userService") private com.pixelnation.common.service.UserService onboardingUsers;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("scriptUtils") private com.pixelnation.common.util.ScriptUtils onboardingMail;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("entitlementDefinitionManager") private com.pixelnation.modules.entitlement.persistence.iface.IEntitlementDefinitionManager onboardingDefinitions;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("entitlementGrantManager") private com.pixelnation.modules.entitlement.persistence.iface.IEntitlementGrantManager onboardingGrants;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("quotaPoolManager") private com.pixelnation.modules.entitlement.persistence.iface.IQuotaPoolManager onboardingPools;

    public Map<String, Object> inspectOnboardingExecutor() {
        return asOperatorOrServiceRead(() -> Map.of("configuration", executorConfig(), "paymentEnabled", false,
                "entry", "CONFIRMED_FORM_ONLY", "receiptStorage", "SUBSCRIPTION_ORDER_METADATA", "buyerApiAvailable", false));
    }
    private Map<String, Object> executorConfig() {
        return objectMap(scriptManager.getByCode(SCRIPT).getMetadata().get("ONBOARDING_EXECUTOR_CONFIG"));
    }
    public Map<String, Object> prepareOnboarding(String payloadJson) {
        Map<String, Object> source = input(payloadJson);
        Map<String, Object> readiness = checkOnboardingReadiness(payloadJson);
        if (!Boolean.TRUE.equals(readiness.get("configurationReady"))) return Map.of("status", "SOURCE_BLOCKED", "readiness", readiness, "paymentEnabled", false);
        return asPurchaseExecutor(() -> {
            Order purchase = onboardingPurchase(source);
            lockOnboarding(purchase.getId()); entityManager.refresh(purchase);
            Map<String, Object> saved = objectMap(purchase.getMetadata().get(KEY));
            Map<String, Object> nativePreview = objectMap(saved.get("planPreview"));
            Map<String, Object> trusted = new LinkedHashMap<>(source);
            trusted.put("currency", Map.of("id", purchase.getCurrency().getId(), "code", purchase.getCurrency().getCode()));
            Map<String, Object> plan = OnboardingExecution.plan(trusted, readiness, provisioningConfig());
            if (!digest(canonicalJson(nativePreview.get("entitlements"))).equals(source.get("entitlementFingerprint"))) throw new ApplicationException("Committed Entitlements changed");
            String fingerprint = digest(canonicalJson(plan));
            Map<String, Object> previous = optionalMap(purchase.getMetadata().get(ONBOARDING));
            if (!previous.isEmpty() && !fingerprint.equals(previous.get("planDigest"))) throw new ApplicationException("Frozen onboarding plan changed; operator reconciliation required");
            if (previous.isEmpty()) {
                Map<String, Object> receipt = new LinkedHashMap<>();
                receipt.put("plan", plan); receipt.put("planDigest", fingerprint); receipt.put("records", new LinkedHashMap<>());
                receipt.put("status", "AWAITING_PAYMENT"); receipt.put("accessStatus", "NOT_STARTED");
                saveOnboarding(purchase, receipt);
            }
            return Map.of("status", "AWAITING_PAYMENT", "orderId", purchase.getId(), "planDigest", fingerprint,
                    "plan", plan, "enforcementBlockers", enforcementBlockers(state(purchase)), "paymentEnabled", false, "creationEnabled", false);
        });
    }
    public Map<String, Object> provisionOnboarding(String payloadJson) {
        Map<String, Object> source = input(payloadJson);
        // Authentication is checked before even returning disabled/gate status.
        asOperatorOrServiceRead(() -> { onboardingPurchase(source); return true; });
        return OnboardingExecution.run(new NativeOnboarding(source));
    }
    private Order onboardingPurchase(Map<String, Object> source) {
        Order order = orderManager.get(number(source.get("orderId")));
        Organization seller = seller(source);
        if (order == null || order.getOrganization() == null || !seller.getId().equals(order.getOrganization().getId())
                || order.getType() == null || !setting("ORDER_TYPE_CODE").equals(order.getType().getCode())
                || order.getAccount() == null || order.getAccount().getId().longValue() != number(source.get("accountId"))) throw new ApplicationException("Onboarding purchase scope mismatch");
        requireReceipt(order.getMetadata(), source); requireReceipt(order.getAccount().getMetadata(), source);
        receipt(order.getAccount(), order); // Native item identities, quantities, amounts and immutable snapshot.
        return order;
    }
    private void lockOnboarding(long orderId) {
        long key = ByteBuffer.wrap(hashBytes("PLAN_SUBSCRIPTION_ONBOARDING:" + orderId)).getLong();
        entityManager.createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(:key)").setParameter("key", key).getSingleResult();
    }
    private void saveOnboarding(Order order, Map<String, Object> receipt) {
        Map<String, Object> metadata = new LinkedHashMap<>(order.getMetadata()); metadata.put(ONBOARDING, receipt);
        order.setMetadata(metadata); orderManager.save(order); orderManager.flush();
    }
    private Map<String, Object> paidEvidence(Order order, Map<String, Object> source) {
        List<Invoice> invoices = invoiceManager.selectJPQL("SELECT i FROM Invoice i WHERE i.order.id = :id", Map.of("id", order.getId()), Invoice.class);
        if (invoices.size() != 1) return Map.of("confirmed", false);
        Invoice invoice = invoices.getFirst();
        if (invoice.getId().longValue() != number(source.get("invoiceId")) || invoice.getOrganization() == null
                || !order.getOrganization().getId().equals(invoice.getOrganization().getId())) throw new ApplicationException("Onboarding Invoice scope mismatch");
        requireReceipt(invoice.getMetadata(), source);
        Map<String,Object> reviewed=optionalMap(optionalMap(objectMap(order.getMetadata().get(KEY)).get("planPreview")).get("taxQuote"));
        if (!"CONFIGURED_RATES_APPLIED".equals(reviewed.get("status")) || !"EXACT_MINOR_UNITS".equals(reviewed.get("roundingStatus"))
                || reviewed.get("totalWithTaxes")==null || invoice.getAmountDue().compareTo(new BigDecimal(String.valueOf(reviewed.get("totalWithTaxes"))))!=0) return Map.of("confirmed",false);
        try {
            int scale = Currency.getInstance(order.getCurrency().getCode()).getDefaultFractionDigits();
            if (scale < 0) return Map.of("confirmed",false);
            invoice.getAmountDue().setScale(scale, RoundingMode.UNNECESSARY);
        } catch (RuntimeException invalidPrecision) { return Map.of("confirmed",false); }
        verifyOnboardingInvoiceSnapshot(order, invoice);
        Map<String, Object> preparation = optionalMap(objectMap(order.getMetadata().get(KEY)).get("invoicePreparation"));
        if (!"DRAFT_INVOICE_READY".equals(preparation.get("status")) || !invoiceFingerprint(order).equals(preparation.get("snapshotFingerprint"))) return Map.of("confirmed", false);
        if (invoice.getAmountDue() == null || invoice.getAmountDue().signum() <= 0 || !invoice.isFullyPaid()
                || invoice.getPayments().isEmpty() || !invoice.hasState("PAID") || !order.hasState("ACTIVE")) return Map.of("confirmed", false);
        // Timestamp comes from the persisted financial record, never a request or browser flag.
        java.time.LocalDateTime paidAt = invoice.getPayments().stream().map(payment -> property(payment, "observed"))
                .filter(java.time.LocalDateTime.class::isInstance).map(java.time.LocalDateTime.class::cast).max(java.util.Comparator.naturalOrder()).orElse(null);
        if (paidAt == null || paidAt.isAfter(java.time.LocalDateTime.now())) return Map.of("confirmed", false);
        return Map.of("confirmed", true, "invoiceId", invoice.getId(), "paidAt", paidAt.toString(), "amount", invoice.getAmountDue().toPlainString());
    }

    private final class NativeOnboarding implements OnboardingExecution.Port {
        private final Map<String, Object> source;
        NativeOnboarding(Map<String, Object> source) { this.source = source; }
        private <T> T tx(java.util.function.Function<Order, T> work, boolean writes) {
            return asOnboardingNative(() -> {
                Order purchase = onboardingPurchase(source); lockOnboarding(purchase.getId()); entityManager.refresh(purchase);
                Map<String, Object> state = optionalMap(purchase.getMetadata().get(ONBOARDING));
                Map<String, Object> plan = optionalMap(state.get("plan"));
                if (!plan.isEmpty() && !digest(canonicalJson(plan)).equals(state.get("planDigest"))) throw new ApplicationException("Onboarding plan receipt changed");
                if (!plan.isEmpty() && !canonicalJson(optionalMap(plan.get("source"))).equals(canonicalJson(sourceProjection(source, optionalMap(plan.get("source")))))) throw new ApplicationException("Onboarding source differs from its frozen purchase");
                if (writes) {
                    Map<String, Object> gates = executorConfig();
                    for (String key : List.of("executionEnabled", "grantIssuanceEnabled", "accessDeliveryEnabled")) if (!Boolean.TRUE.equals(gates.get(key))) throw new ApplicationException("Onboarding execution is disabled");
                    if (!enforcementBlockers(state).isEmpty()) throw new ApplicationException("Native entitlement configuration requires review: " + enforcementBlockers(state));
                    if (plan.isEmpty() || !Boolean.TRUE.equals(paidEvidence(purchase, source).get("confirmed"))) throw new ApplicationException("Native confirmed payment and frozen onboarding plan required");
                    Map<String,Object> coverage = optionalMap(state.get("coverage"));
                    if (!coverage.isEmpty() && !java.time.LocalDateTime.parse(text(coverage,"to")).isAfter(java.time.LocalDateTime.now())) throw new ApplicationException("Paid coverage expired; reconciliation required");
                    if (!canonicalJson(provisioningConfig()).equals(canonicalJson(plan.get("configuration")))) throw new ApplicationException("Onboarding configuration changed; reconciliation required");
                }
                return work.apply(purchase);
            });
        }
        public Map<String, Object> inspect() {
            return tx(purchase -> {
                Map<String, Object> state = optionalMap(purchase.getMetadata().get(ONBOARDING));
                Map<String, Object> result = new LinkedHashMap<>(executorConfig());
                result.put("enforcementReady", enforcementBlockers(state).isEmpty());
                result.put("enforcementBlockers", enforcementBlockers(state));
                result.put("paymentConfirmed", paidEvidence(purchase, source).get("confirmed")); result.put("planVerified", !state.isEmpty());
                result.put("graphVerified", Boolean.TRUE.equals(state.get("graphVerified")));
                result.put("accessDelivered", "DELIVERED".equals(state.get("accessStatus")) && "QUEUED".equals(state.get("readyMailStatus")));
                result.put("receipt", Map.of("orderId", purchase.getId(), "records", optionalMap(state.get("records")), "status", state.getOrDefault("status", "NOT_PREPARED")));
                if(state.containsKey("errorCode"))result.put("errorCode",state.get("errorCode"));
                return result;
            }, false);
        }
        public void ensureCompany() { tx(purchase -> { company(purchase); return true; }, true); }
        public void ensureProperty() {
            Map<String, Object> request = tx(purchase -> {
                Map<String, Object> state = state(purchase), records = records(state); verifyCompany(purchase, state);
                Map<String, Object> requestData = new LinkedHashMap<>(source); requestData.put("targetOrganizationId", records.get("organization"));
                requestData.put("starterCustomerId", records.get("starterCustomer")); requestData.put("planDigest", state.get("planDigest"));
                requestData.put("propertyTypeId", artifact(state, "property").get("typeId"));
                if(records.containsKey("property"))requestData.put("propertyId",records.get("property"));
                return requestData;
            }, true);
            Map<String, Object> property = onboardingResourceAction("ensureOnboardingProperty", request);
            tx(purchase -> { Map<String, Object> state = state(purchase); Map<String, Object> records = records(state);
                Object existing = records.get("property");
                if (existing != null && number(existing) != number(property.get("id"))) throw new ApplicationException("Onboarding Property receipt mismatch");
                records.put("property", property.get("id")); state.put("records", records); saveOnboarding(purchase, state); return true;
            }, true);
        }
        public void ensureAgreement() { tx(purchase -> { agreement(purchase); return true; }, true); }
        public void verifyGraph() {
            Map<String, Object> request = tx(purchase -> {
                Map<String, Object> state = state(purchase); verifyCompany(purchase, state); verifyAgreement(purchase, state);
                Map<String, Object> requestData = new LinkedHashMap<>(source); requestData.put("targetOrganizationId", records(state).get("organization"));
                requestData.put("starterCustomerId", records(state).get("starterCustomer")); requestData.put("planDigest", state.get("planDigest"));
                requestData.put("propertyId", records(state).get("property")); return requestData;
            }, true);
            onboardingResourceAction("verifyOnboardingProperty", request);
            tx(purchase -> { Map<String, Object> state = state(purchase); verifyCompany(purchase, state); verifyAgreement(purchase, state);
                state.put("graphVerified", true); state.put("status", "ACCESS_PENDING"); saveOnboarding(purchase, state); return true;
            }, true);
        }
        public void deliverAccess() {
            Integer reset = tx(purchase -> {
                Map<String, Object> state = state(purchase); verifyCompany(purchase, state); verifyAgreement(purchase, state);
                if (!Boolean.TRUE.equals(state.get("graphVerified"))) throw new ApplicationException("Verified onboarding graph required before access delivery");
                String status = String.valueOf(state.get("accessStatus"));
                if ("DELIVERED".equals(status)) return null;
                if (!"NOT_STARTED".equals(status)) throw new ApplicationException("Previous credential delivery requires operator reconciliation; automatic retry forbidden");
                int userId = Math.toIntExact(number(records(state).get("administrator")));
                entityManager.createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(:key)")
                        .setParameter("key", ByteBuffer.wrap(hashBytes("PLAN_SUBSCRIPTION_CREDENTIALS:" + userId)).getLong()).getSingleResult();
                // This durable per-User decision spans different purchase Orders. The lock
                // serializes markers; a committed RESET_STARTED blocks any second issuer.
                var otherPurchases = orderManager.selectJPQL("SELECT o FROM Order o WHERE o.organization.id = :seller", Map.of("seller",purchase.getOrganization().getId()), Order.class);
                for (Order other : otherPurchases) {
                    if (other.getId().equals(purchase.getId())) continue;
                    Map<String,Object> otherState = optionalMap(optionalMap(other.getMetadata()).get(ONBOARDING));
                    Object otherUser = optionalMap(otherState.get("records")).get("administrator");
                    if (otherUser != null && number(otherUser) == userId && Set.of("RESET_STARTED","RESET_OUTCOME_UNKNOWN").contains(otherState.get("accessStatus"))) throw new ApplicationException("This User has another unresolved credential delivery; reconciliation required");
                }
                String password = userManager.getEncodedPassword(userId);
                if (!Boolean.TRUE.equals(state.get("administratorCreated")) && password != null && !password.isBlank()) {
                    state.put("accessStatus", "DELIVERED"); state.put("credentialResult", "EXISTING_PASSWORD_UNCHANGED"); state.put("status", "CREDENTIALS_READY");
                    saveOnboarding(purchase, state); return null;
                }
                state.put("accessStatus", "RESET_STARTED"); saveOnboarding(purchase, state); return userId;
            }, true);
            if (reset == null) { deliverReadyMail(); return; }
            // generateNewPassword includes the platform's delivery. A timeout/exception is ambiguous:
            // RESET_STARTED is deliberately retained and must never cause an automatic second reset.
            try {
                if (!Boolean.TRUE.equals(asOnboardingNative(() -> asPasswordIssuer(() -> onboardingUsers.generateNewPassword(reset))))) throw new ApplicationException("Password delivery returned false; operator reconciliation required");
                tx(purchase -> { Map<String, Object> state = state(purchase); state.put("accessStatus", "DELIVERED");
                    state.put("credentialResult", "RESET_METHOD_SUCCEEDED"); state.put("status", "CREDENTIALS_READY"); saveOnboarding(purchase, state); return true;
                }, true);
            } catch (RuntimeException unknown) {
                deliveryFailure("accessStatus","RESET_OUTCOME_UNKNOWN","CREDENTIAL_DELIVERY_OUTCOME_UNKNOWN"); throw unknown;
            }
            deliverReadyMail();
        }
        private void deliverReadyMail() {
            Map<String, Object> mail = tx(purchase -> {
                Map<String, Object> state = state(purchase);
                if (!"DELIVERED".equals(state.get("accessStatus"))) throw new ApplicationException("Credential delivery incomplete");
                if ("QUEUED".equals(state.get("readyMailStatus"))) {
                    if (!"COMPLETE".equals(state.get("status"))) { state.put("status", "COMPLETE"); saveOnboarding(purchase, state); }
                    return Map.of();
                }
                if (state.get("readyMailStatus") != null) throw new ApplicationException("Previous ready notification requires reconciliation; automatic resend forbidden");
                Map<String, Object> config = executorConfig();
                if (!Boolean.TRUE.equals(config.get("readyNotificationEnabled"))) throw new ApplicationException("Ready notification disabled");
                String login = text(config, "readyLoginUrl"); java.net.URI uri = java.net.URI.create(login);
                if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null) throw new ApplicationException("Configured HTTPS login URL required");
                state.put("readyMailStatus", "DISPATCHING"); saveOnboarding(purchase, state);
                return Map.of("recipient", text(objectMap(objectMap(state.get("plan")).get("source")), "email"), "url", login);
            }, true);
            if (mail.isEmpty()) return;
            String url = text(mail, "url");
            try {
            onboardingMail.sendSimpleEmail(new String[]{text(mail,"recipient")}, "Your ServiceWand organization is ready",
                    EmailLayout.document("Your ServiceWand organization is ready",
                            EmailLayout.button("Open ServiceWand", url),
                            EmailLayout.note("Use your existing password, or follow the separate password setup email.")));
            tx(purchase -> { Map<String, Object> state = state(purchase); state.put("readyMailStatus", "QUEUED"); state.put("status", "COMPLETE"); saveOnboarding(purchase, state); return true; }, true);
            } catch (RuntimeException unknown) {
                deliveryFailure("readyMailStatus","DELIVERY_OUTCOME_UNKNOWN","READY_NOTIFICATION_OUTCOME_UNKNOWN"); throw unknown;
            }
        }
        private void deliveryFailure(String field,String value,String code) {
            try { asOnboardingNative(()->{Order purchase=onboardingPurchase(source);lockOnboarding(purchase.getId());entityManager.refresh(purchase);
                Map<String,Object> state=state(purchase);state.put(field,value);state.put("status","RECONCILIATION_REQUIRED");state.put("errorCode",code);saveOnboarding(purchase,state);return true;}); }
            catch(RuntimeException recordingFailed){ /* The durable STARTED/DISPATCHING marker still forbids a second delivery. */ }
        }
    }
    private Map<String, Object> sourceProjection(Map<String, Object> source, Map<String, Object> frozen) {
        Map<String, Object> projected = new LinkedHashMap<>(); for (String key : frozen.keySet()) if (source.get(key) != null) projected.put(key, source.get(key)); return projected;
    }
    private Map<String, Object> state(Order purchase) { return new LinkedHashMap<>(objectMap(purchase.getMetadata().get(ONBOARDING))); }
    private Map<String, Object> records(Map<String, Object> state) { return new LinkedHashMap<>(optionalMap(state.get("records"))); }
    private Map<String, Object> artifact(Map<String, Object> state, String key) {
        for (Object raw : collection(objectMap(state.get("plan")).get("artifacts"))) {
            Map<String, Object> row = objectMap(raw);
            if (key.equals(row.get("key"))) {
                Map<String, Object> result = new LinkedHashMap<>(objectMap(row.get("fields"))); result.put("typeId", objectMap(row.get("type")).get("id")); return result;
            }
        }
        throw new ApplicationException("Missing onboarding artifact");
    }
    private void company(Order purchase) {
        Map<String, Object> state = state(purchase), records = records(state), plan = objectMap(state.get("plan"));
        if (records.containsKey("organization")) { verifyCompany(purchase, state); return; }
        if (!records.isEmpty()) throw new ApplicationException("Partial company transaction requires reconciliation");
        Map<String, Object> orgSpec = artifact(state, "organization");
        Organization parent = organizationManager.getByCode(text(onboardingConfig(), "parentOrganizationCode"));
        if (parent == null || !"SERVICE_WAND_WINTER_SERVICES_CANADA".equals(parent.getCode())) throw new ApplicationException("CA parent unavailable");
        String code = "PS_ORG_" + purchase.getId();
        if (!organizationManager.selectJPQL("SELECT o FROM Organization o WHERE o.code = :code", Map.of("code", code), Organization.class).isEmpty()) throw new ApplicationException("Unrecorded organization already exists; do not adopt automatically");
        Organization target = new Organization(); target.setCode(code); target.setParent(parent); target.setEnabled(true);
        var orgType = entityManager.find(com.pixelnation.common.domain.OrganizationType.class, Math.toIntExact(number(orgSpec.get("typeId"))));
        initializeOnboardingEntity(target, orgType, text(objectMap(plan.get("source")), "companyName"));
        setOnboardingAttributes(target, orgType, objectMap(orgSpec.get("attributes")), records);
        target.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state))));
        Map<String, Object> contactSource = objectMap(plan.get("source"));
        Contact legalContact = new Contact(); legalContact.setType(contactTypeManager.getByCode("LEGAL"));
        if (legalContact.getType() == null) throw new ApplicationException("LEGAL contact type unavailable");
        legalContact.setFirstName(text(contactSource, "firstName")); legalContact.setLastName(text(contactSource, "lastName"));
        var workKind = contactEntryKindManager.getByCode(ContactEntryKind.WORK);
        addEntry(legalContact, workKind, ContactEntryType.EMAIL, text(contactSource, "email"));
        if (!text(contactSource, "phone").isBlank()) addEntry(legalContact, workKind, ContactEntryType.PHONE, text(contactSource, "phone"));
        target.getContacts().add(legalContact);
        var organizationAddress = new com.pixelnation.common.domain.OrganizationAddress(); organizationAddress.setOrganization(target);
        organizationAddress.setAddress(addressManager.get(Math.toIntExact(number(contactSource.get("addressId")))));
        organizationAddress.getTypes().add(addressTypeManager.getByCode("BILLING")); organizationAddress.getTypes().add(addressTypeManager.getByCode("LEGAL"));
        target.getAddresses().add(organizationAddress);
        target = organizationManager.save(target); organizationManager.flush(); records.put("organization", target.getId());

        Map<String, Object> seasonSpec = artifact(state, "seasonSettings");
        var seasonType = entityManager.find(com.pixelnation.common.domain.DictionaryType.class, Math.toIntExact(number(seasonSpec.get("typeId"))));
        Dictionary season = new Dictionary(); season.setOrganization(target); season.setCode("PS_SEASON_" + purchase.getId());
        initializeOnboardingEntity(season, seasonType, "Season settings");
        setOnboardingAttributes(season, seasonType, objectMap(seasonSpec.get("attributes")), records);
        season.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state))));
        season = dictionaryManager.save(season); dictionaryManager.flush(); records.put("seasonSettings", season.getId());
        setOnboardingAttribute(target, orgType, "CONTRACT_SETTINGS", season.getId()); organizationManager.save(target);

        Account ledger = new Account(); ledger.setOrganization(target); ledger.setCode("PS_LEDGER_" + purchase.getId());
        AccountType ledgerType = accountTypeManager.get(Math.toIntExact(number(artifact(state, "ledger").get("typeId"))));
        initializeOnboardingEntity(ledger, ledgerType, text(objectMap(plan.get("source")), "companyName"));
        ledger.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state))));
        ledger = accountManager.save(ledger); accountManager.flush(); records.put("ledger", ledger.getId());
        Account customer = new Account(); customer.setOrganization(target); customer.setCode("PS_CUSTOMER_" + purchase.getId());
        AccountType customerType = accountTypeManager.get(Math.toIntExact(number(artifact(state, "starterCustomer").get("typeId"))));
        initializeOnboardingEntity(customer, customerType, "Customer 1");
        setOnboardingAttributes(customer, customerType, objectMap(artifact(state, "starterCustomer").get("attributes")), records);
        customer.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state))));
        customer = accountManager.save(customer); accountManager.flush(); records.put("starterCustomer", customer.getId());

        Map<String, Object> buyer = objectMap(plan.get("source"));
        String email = text(buyer, "email");
        entityManager.createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(:key)")
                .setParameter("key", ByteBuffer.wrap(hashBytes("PLAN_SUBSCRIPTION_ADMIN:" + email.toLowerCase(java.util.Locale.ROOT))).getLong()).getSingleResult();
        Map<String, Object> administrator = objectMap(plan.get("administrator"));
        var role = onboardingRoles.get(Math.toIntExact(number(objectMap(administrator.get("role")).get("id"))));
        if (role == null || !"ADMIN".equals(role.getCode()) || role.getOrganization() == null || !"SYSTEM".equals(role.getOrganization().getCode())
                || "SYSTEM".equals(target.getCode()) || !target.getParent().getId().equals(parent.getId())
                || role.getPermissions().stream().anyMatch(permission -> "SYSTEM_ADMIN".equals(permission.getId()) || "SYSTEM_ADMIN".equals(permission.getName()))) throw new ApplicationException("Unsafe administrator assignment");
        final Organization assignmentTarget = target;
        var existingUsers = userManager.selectJPQL("SELECT u FROM User u WHERE lower(u.name) = :email", Map.of("email", email.toLowerCase(java.util.Locale.ROOT)), User.class);
        if (existingUsers.size() > 1) throw new ApplicationException("Duplicate User login requires review");
        User admin = existingUsers.isEmpty() ? null : existingUsers.getFirst();
        if (admin == null) {
            admin = new User(); admin.setName(email); admin.setEmail(email); admin.setEnabled(true);
            String fullname=(text(buyer, "firstName") + " " + text(buyer, "lastName")).trim();
            admin.setFullname(fullname.isBlank()?email:fullname); admin.setRoles(new LinkedHashSet<>());
            admin.getRoles().add(new com.pixelnation.common.domain.UserOrganizationRole(admin, target, role));
            admin.setLanguage(onboardingLanguages.getByCode2("en"));
            var workflows = entityManager.createQuery("SELECT w FROM Workflow w WHERE w.code = :code", com.pixelnation.modules.workflow.domain.Workflow.class)
                    .setParameter("code", "USER_WORKFLOW").getResultList();
            if (workflows.size() != 1 || admin.getLanguage() == null) throw new ApplicationException("User language/workflow unavailable");
            admin.setWorkflow(workflows.getFirst()); admin = userManager.save(admin);
            state.put("administratorCreated", true);
        } else if (!email.equalsIgnoreCase(admin.getEmail()) || !Boolean.TRUE.equals(admin.getEnabled())) throw new ApplicationException("Existing User requires operator review");
        if (admin.getId().equals(userManager.getSystemUserId())) throw new ApplicationException("System service User cannot be a buyer administrator");
        if (admin.getRoles().stream().noneMatch(assignment -> assignmentTarget.getId().equals(assignment.getOrganization().getId()) && role.getId().equals(assignment.getRole().getId()))) {
            admin.getRoles().add(new com.pixelnation.common.domain.UserOrganizationRole(admin, target, role)); userManager.save(admin);
        }
        userManager.flush(); records.put("administrator", admin.getId());
        state.put("records", records); createOnboardingAllowances(purchase, state, target);
        createOnboardingEnforcement(purchase, state, target);
        state.put("status", "COMPANY_READY"); saveOnboarding(purchase, state); verifyCompany(purchase, state);
    }
    private Map<String, Object> onboardingMarker(Order purchase, Map<String, Object> state) {
        return Map.of("orderId", purchase.getId(), "sourceFormId", objectMap(objectMap(state.get("plan")).get("source")).get("sourceFormId"), "planDigest", state.get("planDigest"));
    }
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void initializeOnboardingEntity(com.pixelnation.common.domain.AbstractTypedEntity row, com.pixelnation.common.domain.AbstractEntityType type, String name) {
        if (type == null) throw new ApplicationException("Onboarding type unavailable");
        row.setType(type);
        var bean = new org.springframework.beans.BeanWrapperImpl(row);
        if (bean.isWritableProperty("nls")) bean.setPropertyValue("nls", new LinkedHashMap<>(Map.of("en", Map.of("NAME", name))));
        var typed = new org.springframework.beans.BeanWrapperImpl(type);
        Object workflow = typed.isReadableProperty("workflow") ? typed.getPropertyValue("workflow") : null;
        if (workflow != null && bean.isWritableProperty("workflow")) {
            bean.setPropertyValue("workflow", workflow);
            Object initial = property(workflow, "initialState");
            if (initial == null) throw new ApplicationException("Onboarding initial workflow state unavailable");
            bean.setPropertyValue("states", new LinkedHashSet<>(Set.of(initial)));
        }
    }
    @SuppressWarnings("rawtypes")
    private void setOnboardingAttributes(com.pixelnation.common.domain.AbstractTypedEntity row, Object type, Map<String, Object> values, Map<String, Object> records) {
        for (var entry : values.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map<?, ?> ref) {
                value = ref.containsKey("reference") ? records.get(ref.get("reference")) : ref.get("id");
                if (value == null) throw new ApplicationException("Unresolved onboarding reference");
            }
            setOnboardingAttribute(row, type, entry.getKey(), value);
        }
    }
    @SuppressWarnings("rawtypes")
    private void setOnboardingAttribute(com.pixelnation.common.domain.AbstractTypedEntity row, Object type, String code, Object value) {
        Object owner = onboardingAttributeOwner(type, code, new LinkedHashSet<>());
        if (owner == null) throw new ApplicationException("Onboarding attribute owner unavailable: " + code);
        row.setAttributeValue(Math.toIntExact(number(property(owner, "id"))), code, value, null);
    }
    private Object onboardingAttributeOwner(Object type, String code, Set<Object> seen) {
        if (type == null || !seen.add(property(type, "id"))) return null;
        if (collection(property(type, "attributes")).stream().anyMatch(field -> code.equals(property(field, "code")))) return type;
        for (Object parent : collection(property(type, "parents"))) { Object result = onboardingAttributeOwner(parent, code, seen); if (result != null) return result; }
        return null;
    }
    private void createOnboardingAllowances(Order purchase, Map<String, Object> state, Organization target) {
        Map<String, Object> plan = objectMap(state.get("plan")), records = records(state);
        Map<String, Object> evidence = paidEvidence(purchase, objectMap(plan.get("source")));
        java.time.LocalDateTime from = java.time.LocalDateTime.parse(text(evidence, "paidAt"));
        String period = text(objectMap(plan.get("entitlementSnapshot")), "billingPeriod");
        java.time.LocalDateTime to = "MONTHLY".equals(period) ? from.plusMonths(1) : from.plusYears(1);
        if (!to.isAfter(java.time.LocalDateTime.now())) throw new ApplicationException("Paid coverage has expired; reconciliation required");
        Organization issuer = purchase.getOrganization();
        for (Object raw : collection(plan.get("allowances"))) {
            Map<String, Object> allowance = objectMap(raw); String code = text(allowance, "code");
            var definitions = onboardingDefinitions.selectJPQL("SELECT d FROM EntitlementDefinition d WHERE d.organization.id = :org AND d.code = :code",
                    Map.of("org", issuer.getId(), "code", code), com.pixelnation.modules.entitlement.domain.EntitlementDefinition.class);
            if (definitions.size() != 1) throw new ApplicationException("Entitlement definition unavailable: " + code);
            var definition = definitions.getFirst();
            if (!"ACTIVE".equals(definition.getStatus().name())
                    || !(Boolean.TRUE.equals(allowance.get("quota")) ? "QUOTA_POOL" : "FEATURE").equals(definition.getEnforcementType().name())
                    || !text(allowance, "valueType").equals(definition.getValueType().name()) || !"ORGANIZATION_SELF".equals(definition.getScopeType().name())) throw new ApplicationException("Entitlement definition contract mismatch");
            // New organization only: no baseline/reset is invented for an existing or delegated pool.
            if (!onboardingGrants.selectJPQL("SELECT g FROM EntitlementGrant g WHERE g.granteeOrganization.id = :org AND g.entitlementDefinition.id = :definition",
                    Map.of("org", target.getId(), "definition", definition.getId()), com.pixelnation.modules.entitlement.domain.EntitlementGrant.class).isEmpty()) throw new ApplicationException("Unrecorded entitlement allowance exists");
            var grant = new com.pixelnation.modules.entitlement.domain.EntitlementGrant();
            grant.setGrantorOrganization(issuer); grant.setGranteeOrganization(target); grant.setEntitlementDefinition(definition);
            grant.setSourceOrderId(purchase.getId()); grant.setGrantType(com.pixelnation.modules.entitlement.domain.EntitlementGrant.GrantType.valueOf(text(allowance, "grantType")));
            grant.setValue(text(allowance, "value")); grant.setValueType(definition.getValueType()); grant.setScopeType(definition.getScopeType());
            grant.setEffectiveFrom(from); grant.setEffectiveTo(to); grant.setStatus(com.pixelnation.modules.entitlement.domain.EntitlementStatus.ACTIVE);
            grant = onboardingGrants.save(grant); onboardingGrants.flush(); records.put("grant:" + code, grant.getId());
            if (Boolean.TRUE.equals(allowance.get("quota"))) {
                var pool = new com.pixelnation.modules.entitlement.domain.QuotaPool(); pool.setOrganization(target); pool.setEntitlementDefinition(definition); pool.setEntitlementGrant(grant);
                pool.setLimitValue(new BigDecimal(text(allowance, "value"))); pool.setUsedValue(BigDecimal.ZERO);
                pool.setResetPeriod(com.pixelnation.modules.entitlement.domain.QuotaPool.ResetPeriod.NONE);
                pool.setPeriodStart(from); pool.setPeriodEnd(to); pool.setStatus(com.pixelnation.modules.entitlement.domain.QuotaPool.QuotaPoolStatus.ACTIVE);
                pool = onboardingPools.save(pool); onboardingPools.flush(); records.put("pool:" + code, pool.getId());
            }
        }
        state.put("records", records); state.put("coverage", Map.of("from", from.toString(), "to", to.toString()));
    }
    private void verifyCompany(Order purchase, Map<String, Object> state) {
        Map<String, Object> records = records(state), plan = objectMap(state.get("plan")), buyer = objectMap(plan.get("source"));
        Organization target = organizationManager.get(Math.toIntExact(number(records.get("organization"))));
        verifyArtifact(target, artifact(state, "organization"), null, purchase, state);
        verifyAttributes(target, objectMap(artifact(state, "organization").get("attributes")), records);
        var billingLinks = target.getAddresses().stream().filter(link -> link.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode()))).toList();
        if (billingLinks.size() != 1 || billingLinks.getFirst().getAddress() == null || billingLinks.getFirst().getAddress().getId().longValue() != number(buyer.get("addressId"))
                || billingLinks.getFirst().getTypes().stream().noneMatch(type -> "LEGAL".equals(type.getCode()))) throw new ApplicationException("Organization billing/legal address changed");
        var legalContacts = target.getContacts().stream().filter(contact -> contact.getType() != null && "LEGAL".equals(contact.getType().getCode())).toList();
        if (legalContacts.size() != 1 || legalContacts.getFirst().getContactEntries().stream().noneMatch(entry -> entry.getType() != null && "EMAIL".equals(entry.getType().getCode()) && text(buyer,"email").equals(entry.getValue()))) throw new ApplicationException("Organization legal contact changed");
        if (target.getParent() == null || !text(onboardingConfig(), "parentOrganizationCode").equals(target.getParent().getCode())
                || !Boolean.TRUE.equals(target.getEnabled()) || !target.getCode().equals("PS_ORG_" + purchase.getId())) throw new ApplicationException("Onboarding organization changed");
        Dictionary season = entityManager.find(Dictionary.class, Math.toIntExact(number(records.get("seasonSettings"))));
        verifyArtifact(season, artifact(state, "seasonSettings"), target, purchase, state);
        verifyAttributes(season, objectMap(artifact(state, "seasonSettings").get("attributes")), records);
        if (number(target.findFirstAttributeValue("CONTRACT_SETTINGS")) != season.getId().longValue()) throw new ApplicationException("Onboarding season link changed");
        Account ledger = accountManager.get(Math.toIntExact(number(records.get("ledger"))));
        verifyArtifact(ledger, artifact(state, "ledger"), target, purchase, state);
        List<Account> ledgers = accountManager.selectJPQL("SELECT a FROM Account a WHERE a.organization.id = :org AND a.type.code = :code",
                Map.of("org", target.getId(), "code", "ORGANIZATION"), Account.class);
        if (ledgers.size() != 1 || !ledger.getId().equals(ledgers.getFirst().getId())) throw new ApplicationException("Exactly one recorded Ledger required");
        Account customer = accountManager.get(Math.toIntExact(number(records.get("starterCustomer"))));
        verifyArtifact(customer, artifact(state, "starterCustomer"), target, purchase, state);
        verifyAttributes(customer, objectMap(artifact(state, "starterCustomer").get("attributes")), records);
        User admin = userManager.get(Math.toIntExact(number(records.get("administrator"))));
        long roleId = number(objectMap(objectMap(plan.get("administrator")).get("role")).get("id"));
        if (admin == null || admin.getId().equals(userManager.getSystemUserId()) || !text(buyer, "email").equalsIgnoreCase(admin.getEmail())
                || !text(buyer, "email").equalsIgnoreCase(admin.getName()) || !Boolean.TRUE.equals(admin.getEnabled())
                || admin.getRoles().stream().filter(assignment -> assignment.getOrganization() != null && assignment.getRole() != null
                    && target.getId().equals(assignment.getOrganization().getId()) && assignment.getRole().getId().longValue() == roleId).count() != 1) throw new ApplicationException("Onboarding administrator assignment changed");
        verifyOnboardingAllowances(purchase, state, target);
        verifyOnboardingEnforcement(purchase, state, target);
    }
    @SuppressWarnings("rawtypes")
    private void verifyArtifact(com.pixelnation.common.domain.AbstractTypedEntity row, Map<String, Object> spec, Organization target, Order purchase, Map<String, Object> state) {
        if (row == null || row.getType() == null || number(property(row.getType(), "id")) != number(spec.get("typeId"))
                || target != null && (row.getOrganization() == null || !target.getId().equals(row.getOrganization().getId()))
                || !canonicalJson(onboardingMarker(purchase, state)).equals(canonicalJson(optionalMap(row.getMetadata()).get(ONBOARDING)))) throw new ApplicationException("Onboarding artifact receipt/type/scope mismatch");
    }
    @SuppressWarnings("rawtypes")
    private void verifyAttributes(com.pixelnation.common.domain.AbstractTypedEntity row, Map<String, Object> expected, Map<String, Object> records) {
        for (var field : expected.entrySet()) {
            Object value = field.getValue();
            if (value instanceof Map<?, ?> ref) value = ref.containsKey("reference") ? records.get(ref.get("reference")) : ref.get("id");
            if (!canonicalJson(value).equals(canonicalJson(row.findFirstAttributeValue(field.getKey())))) throw new ApplicationException("Onboarding attribute changed: " + field.getKey());
        }
    }
    private void verifyOnboardingAllowances(Order purchase, Map<String, Object> state, Organization target) {
        Map<String, Object> plan = objectMap(state.get("plan")), records = records(state), coverage = objectMap(state.get("coverage"));
        for (Object raw : collection(plan.get("allowances"))) {
            Map<String, Object> expected = objectMap(raw); String code = text(expected, "code");
            var grant = onboardingGrants.get(number(records.get("grant:" + code)));
            if (grant == null || grant.getGrantorOrganization() == null || !purchase.getOrganization().getId().equals(grant.getGrantorOrganization().getId())
                    || grant.getGranteeOrganization() == null || !target.getId().equals(grant.getGranteeOrganization().getId())
                    || grant.getSourceOrderId() == null || !purchase.getId().equals(grant.getSourceOrderId()) || grant.getParentGrant() != null
                    || grant.getEntitlementDefinition() == null || !code.equals(grant.getEntitlementDefinition().getCode())
                    || !purchase.getOrganization().getId().equals(grant.getEntitlementDefinition().getOrganization().getId())
                    || !"ACTIVE".equals(grant.getEntitlementDefinition().getStatus().name())
                    || !(Boolean.TRUE.equals(expected.get("quota")) ? "QUOTA_POOL" : "FEATURE").equals(grant.getEntitlementDefinition().getEnforcementType().name())
                    || !text(expected, "value").equals(grant.getValue()) || !text(expected, "valueType").equals(grant.getValueType().name())
                    || !text(expected, "grantType").equals(grant.getGrantType().name()) || !"ORGANIZATION_SELF".equals(grant.getScopeType().name())
                    || !"ACTIVE".equals(grant.getStatus().name()) || !text(coverage, "from").equals(String.valueOf(grant.getEffectiveFrom()))
                    || !text(coverage, "to").equals(String.valueOf(grant.getEffectiveTo()))) throw new ApplicationException("Onboarding Grant receipt/coverage changed");
            List<?> same = onboardingGrants.selectJPQL("SELECT g FROM EntitlementGrant g WHERE g.granteeOrganization.id = :org AND g.entitlementDefinition.id = :definition",
                    Map.of("org", target.getId(), "definition", grant.getEntitlementDefinition().getId()), com.pixelnation.modules.entitlement.domain.EntitlementGrant.class);
            if (same.size() != 1) throw new ApplicationException("Multiple entitlement allowances require review");
            if (Boolean.TRUE.equals(expected.get("quota"))) {
                var pool = onboardingPools.get(number(records.get("pool:" + code)));
                List<?> samePools = onboardingPools.selectJPQL("SELECT p FROM QuotaPool p WHERE p.organization.id = :org AND p.entitlementDefinition.id = :definition",
                        Map.of("org", target.getId(), "definition", grant.getEntitlementDefinition().getId()), com.pixelnation.modules.entitlement.domain.QuotaPool.class);
                if (pool == null || samePools.size() != 1 || pool.getOrganization() == null || !target.getId().equals(pool.getOrganization().getId())
                        || pool.getEntitlementGrant() == null || !grant.getId().equals(pool.getEntitlementGrant().getId()) || pool.getParentPool() != null
                        || pool.getEntitlementDefinition() == null || !grant.getEntitlementDefinition().getId().equals(pool.getEntitlementDefinition().getId())
                        || pool.getLimitValue() == null || pool.getLimitValue().compareTo(new BigDecimal(text(expected, "value"))) != 0
                        || pool.getUsedValue() == null || pool.getUsedValue().signum() < 0 || pool.getUsedValue().compareTo(pool.getLimitValue()) > 0
                        || !"NONE".equals(pool.getResetPeriod().name()) || !"ACTIVE".equals(pool.getStatus().name())
                        || !text(coverage, "from").equals(String.valueOf(pool.getPeriodStart())) || !text(coverage, "to").equals(String.valueOf(pool.getPeriodEnd()))) throw new ApplicationException("Onboarding Quota Pool changed; usage must not be reset");
            }
        }
    }
    private void agreement(Order purchase) {
        Map<String, Object> state = state(purchase), records = records(state); verifyCompany(purchase, state);
        if (records.containsKey("agreement") || records.containsKey("serviceOrder")) { verifyAgreement(purchase, state); return; }
        number(records.get("property"));
        Organization target = organizationManager.get(Math.toIntExact(number(records.get("organization"))));
        Account customer = accountManager.get(Math.toIntExact(number(records.get("starterCustomer"))));
        Map<String, Object> serviceSpec = artifact(state, "serviceOrder");
        OrderType orderType = entityManager.find(OrderType.class, Math.toIntExact(number(serviceSpec.get("typeId"))));
        Order service = new Order(); service.setOrganization(target); service.setAccount(customer); service.setCurrency(purchase.getCurrency());
        initializeOnboardingEntity(service, orderType, "Snow removal");
        setOnboardingAttributes(service, orderType, objectMap(serviceSpec.get("attributes")), records);
        service.setNotes("Snow removal starter order. Pricing requires manager review.");
        service.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state), "PRICING_MODEL", "SEASONAL")));
        service = orderManager.save(service); orderManager.flush(); records.put("serviceOrder", service.getId());
        Map<String, Object> agreementSpec = artifact(state, "agreement");
        var agreementType = entityManager.find(com.pixelnation.common.domain.DocumentType.class, Math.toIntExact(number(agreementSpec.get("typeId"))));
        var document = new com.pixelnation.common.domain.Document(); document.setOrganization(target); document.setCode("PS_AGREEMENT_" + purchase.getId());
        initializeOnboardingEntity(document, agreementType, "Snow removal service agreement");
        setOnboardingAttribute(document, agreementType, "CLIENT", customer.getId());
        setOnboardingAttribute(document, agreementType, "ORDERS", List.of(service.getId()));
        for (String field : List.of("TERM_START_DATE", "TERM_END_DATE")) setOnboardingAttribute(document, agreementType, field, objectMap(agreementSpec.get("attributes")).get(field));
        document.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state))));
        document = onboardingDocuments.save(document); onboardingDocuments.flush(); records.put("agreement", document.getId());
        state.put("records", records); state.put("status", "GRAPH_CREATED"); saveOnboarding(purchase, state); verifyAgreement(purchase, state);
    }
    private void verifyAgreement(Order purchase, Map<String, Object> state) {
        Map<String, Object> records = records(state);
        Organization target = organizationManager.get(Math.toIntExact(number(records.get("organization"))));
        Order service = orderManager.get(number(records.get("serviceOrder")));
        verifyArtifact(service, artifact(state, "serviceOrder"), target, purchase, state);
        verifyAttributes(service, objectMap(artifact(state, "serviceOrder").get("attributes")), records);
        if (service.getId().equals(purchase.getId()) || service.getAccount() == null || service.getAccount().getId().longValue() != number(records.get("starterCustomer"))
                || service.getCurrency() == null || !purchase.getCurrency().getId().equals(service.getCurrency().getId()) || !service.getItems().isEmpty()
                || !service.hasState("INITIAL") || number(service.findFirstAttributeValue("SERVICE_PROPERTY")) != number(records.get("property"))) throw new ApplicationException("Starter service order changed");
        var document = onboardingDocuments.get(number(records.get("agreement")));
        verifyArtifact(document, artifact(state, "agreement"), target, purchase, state);
        if (!document.hasState("QUOTATION") || number(document.findFirstAttributeValue("CLIENT")) != number(records.get("starterCustomer"))) throw new ApplicationException("Starter agreement changed");
        Object orders = document.findFirstAttributeValue("ORDERS");
        if (!(orders instanceof Collection<?> values) || values.size() != 1 || number(values.iterator().next()) != service.getId()) throw new ApplicationException("Starter agreement service-order link changed");
        for (String field : List.of("TERM_START_DATE", "TERM_END_DATE")) {
            if (!String.valueOf(objectMap(artifact(state, "agreement").get("attributes")).get(field)).equals(String.valueOf((Object) document.findFirstAttributeValue(field)))) throw new ApplicationException("Starter agreement season changed");
        }
    }
    @SuppressWarnings("unchecked")
    private Map<String, Object> onboardingResourceAction(String method, Map<String, Object> payload) {
        List<String> nodes = capabilitiesResolver.listNodesWithCapabilities().entrySet().stream()
                .filter(entry -> entry.getValue().containsAll(Set.of("CORE", "CORE-RM"))).map(Map.Entry::getKey).sorted().toList();
        if (nodes.isEmpty()) throw new ApplicationException("No onboarding Resource execution node");
        java.util.UUID job = transactionUtils.getInNewTxRW(() -> {
            try { return scriptService.submitForExecution(nodes.getFirst(), scriptManager.getByCode("PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1"), method,
                    List.<Map<String, ?>>of(Map.of("payloadJson", json(payload))), Auth.getAuthenticatedUser(), organizationManager.getByCode("SYSTEM")); }
            catch (Exception failure) { throw new ApplicationException(failure); }
        });
        long deadline = System.currentTimeMillis() + 90000;
        while (System.currentTimeMillis() < deadline) {
            var execution = transactionUtils.getInNewTx(() -> scriptService.getScriptExecutionInfo(job));
            if (execution != null && ExecutionStatus.COMPLETED.equals(execution.status())) {
                try { return Json.defaultMapper().readValue(execution.result(), Map.class); } catch (Exception failure) { throw new ApplicationException("Invalid Resource onboarding response"); }
            }
            if (execution != null && ExecutionStatus.FAILED.equals(execution.status())) throw new ApplicationException("Resource onboarding failed; retry uses the recorded Property");
            try { Thread.sleep(100); } catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); throw new ApplicationException("Resource onboarding wait interrupted"); }
        }
        throw new ApplicationException("Resource onboarding response timed out; retry is safe");
    }

    private <T> T asOnboardingNative(Supplier<T> action) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated onboarding executor required");
        boolean service = transactionUtils.getInNewTx(() -> callerId.equals(userManager.getSystemUserId()));
        if (!service) return asOperator(action);
        return transactionUtils.getInNewTxRW(() -> {
            User stored = userManager.getSystemUser(); User principal = new User();
            principal.setId(stored.getId()); principal.setName(stored.getName()); principal.setFullname(stored.getFullname()); principal.setRoles(new LinkedHashSet<>());
            return Auth.withUser(principal, organizationManager.getByCode("SYSTEM"), action).get();
        });
    }
    private <T> T asPasswordIssuer(Supplier<T> action) {
        var previous = org.springframework.security.core.context.SecurityContextHolder.getContext();
        var scoped = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        scoped.setAuthentication(new com.pixelnation.spring.security.RunAsAuthenticationToken(userManager.getSystemUser(), organizationManager.getByCode("SYSTEM"),
                List.<org.springframework.security.core.GrantedAuthority>of(new org.springframework.security.core.authority.SimpleGrantedAuthority("P_USER"),
                        new org.springframework.security.core.authority.SimpleGrantedAuthority("P_PASSWD_W"))));
        try {
            org.springframework.security.core.context.SecurityContextHolder.setContext(scoped);
            return action.get();
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.setContext(previous);
        }
    }

    private void verifyOnboardingInvoiceSnapshot(Order order, Invoice invoice) {
        Map<String, Object> data = optionalMap(invoice.getMetadata().get(KEY));
        if (invoice.getType() == null || !setting("INVOICE_TYPE_CODE").equals(invoice.getType().getCode())
                || invoice.getType().getOrganization() == null || !order.getOrganization().getId().equals(invoice.getType().getOrganization().getId())
                || !invoiceFingerprint(order).equals(data.get("snapshotFingerprint"))
                || !invoice.getItems().stream().map(item -> item.getId().longValue()).sorted().toList().equals(itemIds(order))
                || invoice.getItems().size() != new LinkedHashSet<>(itemIds(order)).size()
                || invoice.getAmountDue().compareTo(new BigDecimal(String.valueOf(data.get("amountDueAtPreparation")))) != 0
                || invoice.getAmountDue().compareTo(order.getGrandTotal()) != 0) throw new ApplicationException("Paid Invoice no longer matches its immutable purchase receipt");
    }

    private Map<String,Object> provisioningConfig() {
        Map<String,Object> result = new LinkedHashMap<>(onboardingConfig());
        result.put("executorEnforcement", objectMap(scriptManager.getByCode(SCRIPT).getMetadata().get("ONBOARDING_ENFORCEMENT_CONFIG"))); return result;
    }
    private List<String> enforcementBlockers(Map<String,Object> state) {
        Map<String,Object> plan=optionalMap(state.get("plan")); if(plan.isEmpty())return List.of("FROZEN_PLAN_REQUIRED");
        List<String> blockers=new ArrayList<>();
        for(Object raw:collection(optionalMap(plan.get("enforcement")).get("blockers")))blockers.add(String.valueOf(raw));
        try {
            List<Map<String,Object>> liveArtifacts=new ArrayList<>();
            for(Object raw:collection(plan.get("artifacts"))) {
                Map<String,Object> artifact=new LinkedHashMap<>(objectMap(raw));
                if("property".equals(artifact.get("key"))) {
                    Map<String,Object> type=new LinkedHashMap<>(objectMap(artifact.get("type"))), workflow=new LinkedHashMap<>(objectMap(type.get("workflow")));
                    var live=entityManager.find(com.pixelnation.modules.workflow.domain.Workflow.class,Math.toIntExact(number(workflow.get("id"))));
                    workflow.put("states",onboardingWorkflowStates(live));type.put("workflow",workflow);artifact.put("type",type);
                }
                liveArtifacts.add(artifact);
            }
            var actual=OnboardingExecution.policySpecs(liveArtifacts,objectMap(plan.get("entitlementSnapshot")),objectMap(objectMap(plan.get("configuration")).get("executorEnforcement")));
            if(!canonicalJson(actual.get("bindingTemplates")).equals(canonicalJson(optionalMap(plan.get("enforcement")).get("bindingTemplates"))))blockers.add("PROPERTY_LIFECYCLE_CHANGED");
        } catch(RuntimeException unavailable){blockers.add("PROPERTY_LIFECYCLE_UNVERIFIED");}

        for(Object raw:collection(plan.get("allowances"))) {
            Map<String,Object> expected=objectMap(raw);
            var rows=onboardingDefinitions.selectJPQL("SELECT d FROM EntitlementDefinition d WHERE d.organization.code = :owner AND d.code = :code",
                    Map.of("owner","SERVICEWAND","code",text(expected,"code")),com.pixelnation.modules.entitlement.domain.EntitlementDefinition.class);
            if(rows.size()!=1){blockers.add("DEFINITION_MISSING:"+text(expected,"code"));continue;}
            var definition=rows.getFirst();
            if(!"ACTIVE".equals(definition.getStatus().name()) || !text(expected,"valueType").equals(definition.getValueType().name())
                    || !"ORGANIZATION_SELF".equals(definition.getScopeType().name()) || !(Boolean.TRUE.equals(expected.get("quota"))?"QUOTA_POOL":"FEATURE").equals(definition.getEnforcementType().name()))blockers.add("DEFINITION_NOT_ACTIVE_OR_MISMATCH:"+text(expected,"code"));
        }
        return blockers;
    }
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("policyRuleManager") private com.pixelnation.modules.entitlement.persistence.iface.IPolicyRuleManager onboardingPolicies;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("operationPolicyBindingManager") private com.pixelnation.modules.entitlement.persistence.iface.IOperationPolicyBindingManager onboardingBindings;
    private void createOnboardingEnforcement(Order purchase, Map<String,Object> state, Organization target) {
        Map<String,Object> plan=objectMap(state.get("plan")), records=records(state), specs=objectMap(plan.get("enforcement"));
        for(Object raw:collection(specs.get("policyTemplates"))) {
            Map<String,Object> spec=objectMap(raw); String code=text(spec,"definitionCode");
            var definition=onboardingGrants.get(number(records.get("grant:"+code))).getEntitlementDefinition();
            var policy=new com.pixelnation.modules.entitlement.domain.PolicyRule(); policy.setOrganization(target); policy.setEntitlementDefinition(definition);
            policy.setEntityClass(text(spec,"entityClass"));policy.setAction(text(spec,"action"));
            policy.setEnforcementType(com.pixelnation.modules.entitlement.domain.EntitlementEnforcementType.QUOTA_POOL);
            policy.setAmountExpression("1");policy.setConsumerOrgExpression("#entity.organization");
            policy.setWhenExpression(onboardingCondition(spec,target));policy.setStatus(com.pixelnation.modules.entitlement.domain.EntitlementStatus.ACTIVE);
            policy=onboardingPolicies.save(policy);onboardingPolicies.flush();records.put("policy:"+text(spec,"key"),policy.getId());
        }
        for(Object raw:collection(specs.get("bindingTemplates"))) {
            Map<String,Object> spec=objectMap(raw); String code=text(spec,"definitionCode");
            var definition=onboardingGrants.get(number(records.get("grant:"+code))).getEntitlementDefinition();
            var binding=new com.pixelnation.modules.entitlement.domain.OperationPolicyBinding();binding.setOrganization(target);binding.setEntitlementDefinition(definition);
            binding.setOperation(text(spec,"operation"));binding.setPolicyAction(text(spec,"policyAction"));
            binding.setEffectType(com.pixelnation.modules.entitlement.domain.EntitlementEffectType.valueOf(text(spec,"effectType")));
            binding.setAmountExpression("1");binding.setConsumerOrgExpression("#entity.organization");binding.setWhenExpression(onboardingCondition(spec,target));
            binding.setReserveBefore(false);binding.setStatus(com.pixelnation.modules.entitlement.domain.EntitlementStatus.ACTIVE);
            binding=onboardingBindings.save(binding);onboardingBindings.flush();records.put("binding:"+text(spec,"key"),binding.getId());
        }
        state.put("records",records);
    }
    private String onboardingCondition(Map<String,Object> spec,Organization target) {
        return "("+text(spec,"whenExpression")+") and #entity.organization.id == "+target.getId();
    }
    private void verifyOnboardingEnforcement(Order purchase,Map<String,Object> state,Organization target) {
        Map<String,Object> plan=objectMap(state.get("plan")),records=records(state),specs=objectMap(plan.get("enforcement"));
        if(!enforcementBlockers(state).isEmpty())throw new ApplicationException("Entitlement enforcement configuration no longer matches purchase");
        for(Object raw:collection(specs.get("policyTemplates"))) {
            Map<String,Object> spec=objectMap(raw);var policy=onboardingPolicies.get(number(records.get("policy:"+text(spec,"key"))));
            var grant=onboardingGrants.get(number(records.get("grant:"+text(spec,"definitionCode"))));
            if(policy==null || policy.getOrganization()==null || !target.getId().equals(policy.getOrganization().getId())
                    || policy.getEntitlementDefinition()==null || !grant.getEntitlementDefinition().getId().equals(policy.getEntitlementDefinition().getId())
                    || !text(spec,"entityClass").equals(policy.getEntityClass()) || !text(spec,"action").equals(policy.getAction())
                    || !"QUOTA_POOL".equals(policy.getEnforcementType().name()) || !"1".equals(policy.getAmountExpression())
                    || !"#entity.organization".equals(policy.getConsumerOrgExpression()) || !onboardingCondition(spec,target).equals(policy.getWhenExpression())
                    || policy.getScriptId()!=null || policy.getScopeExpression()!=null || policy.getUsageExpression()!=null || !"ACTIVE".equals(policy.getStatus().name()))throw new ApplicationException("Recorded Property policy changed");
            var duplicates=onboardingPolicies.selectJPQL("SELECT p FROM PolicyRule p WHERE p.organization.id = :org AND p.entitlementDefinition.id = :definition AND p.action = :action",
                    Map.of("org",target.getId(),"definition",grant.getEntitlementDefinition().getId(),"action",text(spec,"action")),com.pixelnation.modules.entitlement.domain.PolicyRule.class);
            if(duplicates.size()!=1)throw new ApplicationException("Duplicate/unrecorded Property policy");
        }
        for(Object raw:collection(specs.get("bindingTemplates"))) {
            Map<String,Object> spec=objectMap(raw);var binding=onboardingBindings.get(number(records.get("binding:"+text(spec,"key"))));
            var grant=onboardingGrants.get(number(records.get("grant:"+text(spec,"definitionCode"))));
            if(binding==null || binding.getOrganization()==null || !target.getId().equals(binding.getOrganization().getId())
                    || binding.getEntitlementDefinition()==null || !grant.getEntitlementDefinition().getId().equals(binding.getEntitlementDefinition().getId())
                    || !text(spec,"operation").equals(binding.getOperation()) || !text(spec,"policyAction").equals(binding.getPolicyAction())
                    || !text(spec,"effectType").equals(binding.getEffectType().name()) || !"1".equals(binding.getAmountExpression())
                    || !"#entity.organization".equals(binding.getConsumerOrgExpression()) || !onboardingCondition(spec,target).equals(binding.getWhenExpression())
                    || !Boolean.FALSE.equals(binding.getReserveBefore()) || binding.getPolicyRule()!=null || !"ACTIVE".equals(binding.getStatus().name()))throw new ApplicationException("Recorded Property binding changed");
            var duplicates=onboardingBindings.selectJPQL("SELECT b FROM OperationPolicyBinding b WHERE b.organization.id = :org AND b.operation = :operation AND b.entitlementDefinition.id = :definition",
                    Map.of("org",target.getId(),"operation",text(spec,"operation"),"definition",grant.getEntitlementDefinition().getId()),com.pixelnation.modules.entitlement.domain.OperationPolicyBinding.class);
            if(duplicates.size()!=1)throw new ApplicationException("Duplicate/unrecorded Property binding");
        }
    }

    public Map<String,Object> readOnboardingStatus(String payloadJson) {
        Map<String,Object> source=input(payloadJson);
        asOperatorOrServiceRead(()->{onboardingPurchase(source);return true;});
        Map<String,Object> inspected=new NativeOnboarding(source).inspect();
        Map<String,Object> safe=new LinkedHashMap<>();
        safe.put("status",optionalMap(inspected.get("receipt")).get("status"));
        for(String key:List.of("paymentConfirmed","graphVerified","accessDelivered","enforcementBlockers","errorCode"))safe.put(key,inspected.get(key));
        safe.put("paymentEnabled",false);safe.put("buyerHttpAdapterAvailable",false);return safe;
    }

    private List<Map<String,Object>> onboardingWorkflowStates(Object workflow) {
        return collection(property(workflow,"states")).stream().map(state -> {
            Map<String,Object> row=new LinkedHashMap<>();row.put("id",property(state,"id"));row.put("code",property(state,"code"));
            row.put("events",collection(property(state,"events")).stream().map(event -> Map.of("id",property(event,"id"),"code",property(event,"code"),"targets",collection(property(event,"targets")).stream().map(target -> Map.of("id",property(target,"id"),"code",property(target,"code"))).toList())).toList());return row;
        }).toList();
    }
