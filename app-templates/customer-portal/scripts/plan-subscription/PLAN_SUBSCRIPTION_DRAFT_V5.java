package com.pixelnation.bill.generated;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.Currency;
import java.math.RoundingMode;
import java.util.function.Supplier;
import com.pixelnation.common.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import com.pixelnation.account.domain.Account;
import com.pixelnation.account.domain.AccountAddress;
import com.pixelnation.account.domain.AccountType;
import com.pixelnation.account.persistence.iface.IAccountManager;
import com.pixelnation.account.persistence.iface.IAccountTypeManager;
import com.pixelnation.bill.domain.Order;
import com.pixelnation.bill.domain.Invoice;
import com.pixelnation.bill.domain.InvoiceType;
import com.pixelnation.bill.persistence.iface.IInvoiceManager;
import com.pixelnation.bill.persistence.iface.IInvoiceTypeManager;
import com.pixelnation.bill.domain.OrderItem;
import com.pixelnation.bill.domain.OrderItemType;
import com.pixelnation.bill.domain.OrderType;
import com.pixelnation.bill.persistence.iface.IOrderManager;
import com.pixelnation.bill.persistence.iface.IOrderTypeManager;
import com.pixelnation.bill.persistence.iface.IOrderItemTypeManager;
import com.pixelnation.common.domain.Address;
import com.pixelnation.common.domain.AddressType;
import com.pixelnation.common.domain.AttributeValue;
import com.pixelnation.common.domain.Contact;
import com.pixelnation.common.domain.ContactEntry;
import com.pixelnation.common.domain.ContactEntryKind;
import com.pixelnation.common.domain.ContactEntryType;
import com.pixelnation.common.domain.ContactType;
import com.pixelnation.common.domain.Dictionary;
import com.pixelnation.common.domain.Organization;
import com.pixelnation.common.domain.Script;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.json.Json;
import com.pixelnation.common.persistence.iface.IAddressManager;
import com.pixelnation.common.persistence.iface.IAddressTypeManager;
import com.pixelnation.common.persistence.iface.IContactTypeManager;
import com.pixelnation.common.persistence.iface.IContactEntryTypeManager;
import com.pixelnation.common.persistence.iface.IContactEntryKindManager;
import com.pixelnation.common.persistence.iface.IDictionaryManager;
import com.pixelnation.common.persistence.iface.IOrganizationManager;
import com.pixelnation.common.persistence.iface.IUserManager;
import com.pixelnation.common.persistence.iface.IScriptManager;
import com.pixelnation.common.persistence.iface.IUnitManager;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import com.pixelnation.common.cluster.CapabilitiesResolver;
import com.pixelnation.common.script.ScriptService;
import com.pixelnation.common.script.ScriptService.ExecutionStatus;
import com.pixelnation.pim.domain.Product;
import com.pixelnation.pim.domain.ProductPrice;
import com.pixelnation.pim.persistence.iface.IProductManager;
import com.pixelnation.pim.persistence.iface.IProductPriceManager;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

public class MAIN_CLASS {
    private static final String KEY = "PLAN_SUBSCRIPTION";
    private static final String SCRIPT = "PLAN_SUBSCRIPTION_DRAFT_V5";
    @Autowired private TransactionUtils transactionUtils;
    @Autowired private IOrganizationManager organizationManager;
    @Autowired private IUserManager userManager;
    @Autowired private IAccountManager accountManager;
    @Autowired private IAccountTypeManager accountTypeManager;
    @Autowired private IOrderManager orderManager;
    @Autowired private IInvoiceManager invoiceManager;
    @Autowired private IInvoiceTypeManager invoiceTypeManager;
    @Autowired private IOrderTypeManager orderTypeManager;
    @Autowired private IOrderItemTypeManager orderItemTypeManager;
    @Autowired private IAddressManager addressManager;
    @Autowired private IAddressTypeManager addressTypeManager;
    @Autowired private IContactTypeManager contactTypeManager;
    @Autowired private IContactEntryTypeManager contactEntryTypeManager;
    @Autowired private IContactEntryKindManager contactEntryKindManager;
    @Autowired private IProductManager productManager;
    @Autowired private IProductPriceManager productPriceManager;
    @Autowired private IDictionaryManager dictionaryManager;
    @Autowired private IUnitManager unitManager;
    @Autowired private IScriptManager scriptManager;
    @Autowired private ScriptService scriptService;
    @Autowired private CapabilitiesResolver capabilitiesResolver;
    @PersistenceContext private EntityManager entityManager;

    public Map<String, Object> inspectConfiguration() {
        return asOperator(() -> Map.of("accountType", setting("ACCOUNT_TYPE_CODE"), "orderType", setting("ORDER_TYPE_CODE"),
                "orderItemType", setting("ORDER_ITEM_TYPE_CODE"), "basePlanItemEnabled", true,
                "draftOnly", true, "paymentEnabled", false));
    }

    public Map<String, Object> inspectOnboardingConfiguration() {
        return asOperatorOrServiceRead(() -> onboardingModel(null));
    }

    public Map<String, Object> checkOnboardingReadiness(String payloadJson) {
        Map<String, Object> input = input(payloadJson);
        return asOperatorOrServiceRead(() -> {
            Organization seller = seller(input);
            Account account = accountManager.get(Math.toIntExact(number(input.get("accountId"))));
            Order order = orderManager.get(number(input.get("orderId")));
            if (account == null || order == null || account.getOrganization() == null || order.getOrganization() == null
                    || !seller.getId().equals(account.getOrganization().getId()) || !seller.getId().equals(order.getOrganization().getId())
                    || account.getType() == null || !setting("ACCOUNT_TYPE_CODE").equals(account.getType().getCode())
                    || order.getAccount() == null || !account.getId().equals(order.getAccount().getId())
                    || !setting("ORDER_TYPE_CODE").equals(order.getType().getCode()) || !order.hasState("DRAFT")) {
                throw new ApplicationException("A matching confirmed subscription draft is required");
            }
            requireReceipt(account.getMetadata(), input); requireReceipt(order.getMetadata(), input);
            Map<String, Object> committed = receipt(account, order);
            if (input.containsKey("entitlementFingerprint")
                    && !input.get("entitlementFingerprint").equals(committed.get("entitlementFingerprint"))) {
                throw new ApplicationException("Onboarding purchase Entitlements do not match the committed order");
            }
            Address address = addressManager.get(Math.toIntExact(number(input.get("addressId"))));
            Map<String, Object> savedAddress = objectMap(input.get("companyAddressSnapshot"));
            if (address == null || address.getCountry() == null || !"CA".equals(address.getCountry().getCode2())
                    || !"CA".equals(savedAddress.get("countryCode"))
                    || !java.util.Objects.equals(address.getAddress1(), savedAddress.get("address1"))
                    || !java.util.Objects.equals(address.getAddress2(), savedAddress.get("address2"))
                    || !java.util.Objects.equals(address.getCity(), savedAddress.get("city"))
                    || !java.util.Objects.equals(address.getPostalCode(), savedAddress.get("postalCode"))) {
                throw new ApplicationException("Saved CA company address does not match its native Address");
            }
            var billingAddresses = account.getAddresses().stream()
                    .filter(link -> link.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode()))).toList();
            if (billingAddresses.size() != 1 || billingAddresses.get(0).getAddress() == null
                    || !address.getId().equals(billingAddresses.get(0).getAddress().getId())
                    || billingAddresses.get(0).getTypes().stream().noneMatch(type -> "LEGAL".equals(type.getCode()))) {
                throw new ApplicationException("Confirmed company address must be the single purchaser billing/legal address");
            }
            String region = address.getState() == null ? address.getJurisdiction() : address.getState().getCode();
            if (!java.util.Objects.equals(region, savedAddress.get("regionCode"))) throw new ApplicationException("Company address region changed");
            List<Invoice> invoices = invoiceManager.selectJPQL("SELECT i FROM Invoice i WHERE i.order.id = :id", Map.of("id", order.getId()), Invoice.class);
            if (invoices.size() > 1 || input.get("invoiceId") != null && (invoices.size() != 1 || invoices.get(0).getId().longValue() != number(input.get("invoiceId")))) {
                throw new ApplicationException("Purchase invoice receipt requires review");
            }
            if (!invoices.isEmpty()) {
                Invoice invoice = invoices.get(0);
                requireReceipt(invoice.getMetadata(), input);
                if (!Boolean.TRUE.equals(optionalMap(invoice.getMetadata().get(KEY)).get("preparationOnly"))) {
                    throw new ApplicationException("Purchase invoice must retain its preparation-only receipt");
                }
                guardPreparedInvoice(invoice, Map.of());
            }
            Map<String, Object> trusted = new LinkedHashMap<>(input);
            trusted.put("purchaseConfirmed", true); trusted.put("entitlementSnapshot", committed.get("entitlementSnapshot"));
            trusted.put("currency", Map.of("id", order.getCurrency().getId(), "code", order.getCurrency().getCode()));
            Map<String, Object> model = onboardingModel(text(input, "email"));
            Map<String, Object> purchaserAttributes = new LinkedHashMap<>();
            for (Object rawField : collection(optionalMap(model.get("customerType")).get("attributes"))) {
                String code = String.valueOf(objectMap(rawField).get("code"));
                Object value = account.findFirstAttributeValue(code);
                if (value != null) purchaserAttributes.put(code, value);
            }
            trusted.put("purchaserAttributes", purchaserAttributes);
            Map<String, Object> result = OnboardingReadiness.evaluate(trusted, model, onboardingConfig());
            result.put("persistedPurchaseVerified", true);
            return result;
        });
    }

    private Map<String, Object> onboardingConfig() {
        Script script = scriptManager.getByCode(SCRIPT);
        return objectMap(script.getMetadata().get("ONBOARDING_READINESS_CONFIG"));
    }

    private Map<String, Object> onboardingModel(String email) {
        // Definitions span SERVICEWAND and the separate Winter Services tree.
        // Reuse the guarded real-system context for these read-only model lookups.
        return asOnboardingNative(() -> onboardingModelInSystem(email));
    }

    private Map<String, Object> onboardingModelInSystem(String email) {
        Map<String, Object> config = onboardingConfig(), result = new LinkedHashMap<>();
        List<String> errors = new ArrayList<>();
        for (String[] selector : List.of(new String[]{"organizationType", "OrganizationType", "organizationTypeCode"},
                new String[]{"customerType", "AccountType", "customerTypeCode"}, new String[]{"propertyType", "ResourceType", "propertyTypeCode"},
                new String[]{"agreementType", "DocumentType", "agreementTypeCode"},
                new String[]{"serviceOrderType", "OrderType", "serviceOrderTypeCode"},
                new String[]{"ledgerAccountType", "AccountType", "ledgerAccountTypeCode"})) {
            try {
                Map<String, Object> description = transactionUtils.getInNewTx(() -> describeType(selector[1], text(config, selector[2])));
                if ("propertyType".equals(selector[0]) && "ENTITY_NOT_REGISTERED_ON_NODE".equals(description.get("reason"))) description = remotePropertyType(text(config, selector[2]));
                result.put(selector[0], description);
            }
            catch (Exception failure) { result.put(selector[0], Map.of("status", "UNAVAILABLE")); errors.add(selector[0] + ": " + failure.getClass().getSimpleName()); }
        }
        Organization parent = organizationManager.getByCode(text(config, "parentOrganizationCode"));
        Map<String, Object> parentInfo = new LinkedHashMap<>(), defaults = new LinkedHashMap<>();
        Set<Integer> ancestry = new LinkedHashSet<>();
        Dictionary seasonSettings = null;
        if (parent != null) {
            parentInfo.put("status", "AVAILABLE"); parentInfo.put("id", parent.getId()); parentInfo.put("code", parent.getCode());
            for (Organization current = parent; current != null; current = current.getParent()) {
                if (!ancestry.add(current.getId())) { errors.add("organizationAncestry: CYCLE"); parentInfo.put("status", "UNAVAILABLE"); break; }
                Object language = current.findFirstAttributeValue("DEFAULT_LANGUAGE");
                if (!defaults.containsKey("DEFAULT_LANGUAGE") && language instanceof String value && !value.isBlank()) defaults.put("DEFAULT_LANGUAGE", value);
                Object settingsId = current.findFirstAttributeValue("CONTRACT_SETTINGS");
                if (seasonSettings == null && settingsId != null && !String.valueOf(settingsId).isBlank()) {
                    try { seasonSettings = dictionaryManager.get(Math.toIntExact(number(settingsId))); }
                    catch (Exception failure) { errors.add("CONTRACT_SETTINGS: INVALID_REFERENCE"); }
                }
            }
            parentInfo.put("ancestryIds", new ArrayList<>(ancestry));
        } else parentInfo.put("status", "UNAVAILABLE");
        boolean seasonStartAvailable = false;
        Map<String, Object> seasonContract = optionalMap(config.get("seasonSettingsContract"));
        try { result.put("seasonSettingsType", transactionUtils.getInNewTx(() -> describeType("DictionaryType", text(seasonContract, "dictionaryTypeCode")))); }
        catch (Exception failure) { result.put("seasonSettingsType", Map.of("status", "UNAVAILABLE")); errors.add("seasonSettingsType: " + failure.getClass().getSimpleName()); }
        Map<String, Object> seasonInfo = new LinkedHashMap<>(); seasonInfo.put("status", "MISSING");
        if (seasonSettings != null && seasonSettings.getOrganization() != null && ancestry.contains(seasonSettings.getOrganization().getId())
                && seasonSettings.getType() != null && text(seasonContract, "dictionaryTypeCode").equals(seasonSettings.getType().getCode())) {
            seasonInfo.put("status", "AVAILABLE"); seasonInfo.put("templateId", seasonSettings.getId());
            seasonInfo.put("source", "ANCESTOR_PROFILE");
            seasonInfo.put("typeCode", seasonSettings.getType().getCode());
            Object start = seasonSettings.findFirstAttributeValue("SEASON_START");
            if (start != null) {
                try { java.time.LocalDate.parse(String.valueOf(start)); seasonStartAvailable = true; seasonInfo.put("seasonStart", String.valueOf(start)); }
                catch (Exception failure) { errors.add("SEASON_START: INVALID_DATE"); }
            }
            Object end = seasonSettings.findFirstAttributeValue("SEASON_END");
            if (end != null) seasonInfo.put("seasonEnd", String.valueOf(end));
        } else if (seasonSettings != null) errors.add("CONTRACT_SETTINGS: TYPE_OR_SCOPE_UNVERIFIED");
        if (seasonSettings == null) {
            Map<String, Object> fallback = optionalMap(seasonContract.get("defaultSeason"));
            if ("TEMPORARY_CA_CONFIG".equals(fallback.get("source")) && "CA".equals(config.get("countryCode")) && "CA".equals(fallback.get("countryCode"))) {
                try {
                    java.time.LocalDate start = java.time.LocalDate.parse(text(fallback, "seasonStart"));
                    java.time.LocalDate end = java.time.LocalDate.parse(text(fallback, "seasonEnd"));
                    if (end.isBefore(start)) throw new IllegalArgumentException();
                    seasonInfo.put("status", "CONFIGURED"); seasonInfo.put("source", "TEMPORARY_CA_CONFIG"); seasonInfo.put("countryCode", "CA");
                    seasonInfo.put("typeCode", text(seasonContract, "dictionaryTypeCode")); seasonInfo.put("seasonStart", start.toString()); seasonInfo.put("seasonEnd", end.toString());
                    seasonStartAvailable = true;
                } catch (RuntimeException invalid) { errors.add("DEFAULT_CA_SEASON: INVALID_DATES"); }
            }
        }
        seasonInfo.put("requiresCompanyProfileCreation", true); seasonInfo.put("creationEnabled", false);
        result.put("seasonSettings", seasonInfo);
        result.put("seasonStartAvailable", seasonStartAvailable);
        Map<String, Object> organizationType = optionalMap(result.get("organizationType"));
        for (Object raw : (Collection<?>) organizationType.getOrDefault("attributes", List.of())) {
            Map<String, Object> field = objectMap(raw);
            if ("COMMUNICATION".equals(field.get("code")) && field.get("defaultValue") != null
                    && !String.valueOf(field.get("defaultValue")).isBlank()) {
                try {
                    // Resolve this fixed type default in the guarded model context;
                    // its owner must still belong to the verified CA ancestry below.
                    Dictionary communication = entityManager.find(Dictionary.class, Math.toIntExact(number(field.get("defaultValue"))));
                    if (communication != null && communication.getOrganization() != null && ancestry.contains(communication.getOrganization().getId())) {
                        defaults.put("COMMUNICATION", Map.of("id", communication.getId(), "code", communication.getCode()));
                    } else errors.add("COMMUNICATION: DEFAULT_SCOPE_UNVERIFIED");
                } catch (Exception failure) { errors.add("COMMUNICATION: INVALID_DEFAULT_REFERENCE"); }
            }
        }
        result.put("parent", parentInfo); result.put("organizationDefaults", defaults);
        List<?> roles = entityManager.createQuery("SELECT r FROM Role r WHERE r.code = :code", Object.class)
                .setParameter("code", text(config, "adminRoleCode")).getResultList().stream()
                .filter(role -> text(config, "adminRoleOwnerOrganizationCode").equals(property(property(role, "organization"), "code"))).toList();
        if (roles.size() == 1) {
            Object role = roles.get(0), owner = property(role, "organization");
            boolean systemAdmin = "SYSTEM_ADMIN".equals(property(role, "code"));
            for (Object permission : collection(property(role, "permissions"))) {
                Object permissionCode = permission instanceof String ? permission : property(permission, "id");
                systemAdmin |= "SYSTEM_ADMIN".equals(permissionCode) || "SYSTEM_ADMIN".equals(property(permission, "name"));
            }
            Map<String, Object> roleInfo = new LinkedHashMap<>(); roleInfo.put("status", "AVAILABLE");
            roleInfo.put("id", property(role, "id")); roleInfo.put("code", property(role, "code"));
            roleInfo.put("ownerCode", property(owner, "code")); roleInfo.put("hasExplicitSystemAdminPermission", systemAdmin);
            roleInfo.put("ownerInParentAncestry", ancestry.contains(property(owner, "id"))); result.put("adminRole", roleInfo);
        } else result.put("adminRole", Map.of("status", "UNAVAILABLE"));
        Map<String, Object> references = new LinkedHashMap<>();
        references.put("accessDelivery", describeOnboardingReference(text(optionalMap(config.get("accessDeliveryContract")), "referenceScriptCode")));
        references.put("serviceOrder", describeOnboardingReference(text(optionalMap(config.get("serviceOrderPreparation")), "referenceScriptCode")));
        references.put("quoteDelivery", describeOnboardingReference(text(optionalMap(config.get("quoteLinkPolicy")), "deliveryScriptCode")));
        references.put("quoteConfirmation", describeOnboardingReference(text(optionalMap(config.get("quoteLinkPolicy")), "confirmationScriptCode")));
        result.put("referenceScripts", references);
        Map<String, Object> quotePolicy = optionalMap(config.get("quoteLinkPolicy"));
        Map<String, Object> fingerprints = optionalMap(quotePolicy.get("implementationFingerprints"));
        boolean quotePolicyVerified = "READY".equals(quotePolicy.get("implementationStatus"));
        for (String reference : List.of("quoteDelivery", "quoteConfirmation")) {
            Map<String, Object> implementation = optionalMap(references.get(reference));
            Object expected = fingerprints.get(implementation.get("code"));
            quotePolicyVerified &= "AVAILABLE".equals(implementation.get("status")) && expected instanceof String
                    && expected.equals(implementation.get("sourceFingerprint"));
        }
        result.put("quoteExpiryPolicy", Map.of("status", quotePolicyVerified ? "READY" : "REQUIRES_ADAPTATION", "sourceFingerprintsVerified", quotePolicyVerified));
        result.put("subscriptionTypes", Map.of("orderTypeCode", setting("ORDER_TYPE_CODE"), "orderItemTypeCode", setting("ORDER_ITEM_TYPE_CODE")));
        if (email != null) result.put("adminLoginExists", userManager.getByNameWithoutOrganizationFilter(email) != null);
        result.putIfAbsent("seasonStartAvailable", false); result.put("errors", errors);
        result.put("availableModelEntities", entityManager.getMetamodel().getEntities().stream().map(type -> type.getName())
                .filter(name -> Set.of("OrganizationType", "AccountType", "ResourceType", "DocumentType", "OrderType", "DictionaryType").contains(name)).sorted().toList());
        result.put("inspectionOnly", true); result.put("creationEnabled", false);
        return result;
    }

    private Map<String, Object> describeOnboardingReference(String code) {
        Script script = code.isBlank() ? null : scriptManager.getByCode(code);
        if (script == null || !Boolean.TRUE.equals(property(script, "executable")) || script.getContent() == null || script.getContent().isBlank()) {
            return Map.of("status", "UNAVAILABLE", "code", code);
        }
        return Map.of("status", "AVAILABLE", "id", script.getId(), "code", code, "sourceFingerprint", digest(script.getContent().replace("\r\n", "\n").stripTrailing()), "invoked", false);
    }

    private Map<String, Object> remotePropertyType(String typeCode) {
        List<String> nodes = capabilitiesResolver.listNodesWithCapabilities().entrySet().stream()
                .filter(entry -> entry.getValue().containsAll(Set.of("CORE", "CORE-RM"))).map(Map.Entry::getKey).sorted().toList();
        if (nodes.isEmpty()) throw new ApplicationException("No Resource Management model-read node available");
        Script helper = scriptManager.getByCode("PLAN_SUBSCRIPTION_ONBOARDING_MODEL_V1");
        if (helper == null) throw new ApplicationException("Resource Management readiness helper missing");
        java.util.UUID request = transactionUtils.getInNewTxRW(() -> {
            try { return scriptService.submitForExecution(nodes.get(0), helper, "inspectPropertyType", List.<Map<String, ?>>of(Map.of("typeCode", typeCode)),
                    Auth.getAuthenticatedUser(), organizationManager.getByCode(userManager.getSystemUserId().equals(Auth.getAuthenticatedUser().getId()) ? "SERVICEWAND" : "SYSTEM")); }
            catch (Exception failure) { throw new ApplicationException(failure); }
        });
        long deadline = System.nanoTime() + java.time.Duration.ofSeconds(40).toNanos();
        while (System.nanoTime() < deadline) {
            var info = transactionUtils.getInNewTx(() -> scriptService.getScriptExecutionInfo(request));
            if (info != null && info.status() == ExecutionStatus.COMPLETED) {
                try { return Json.defaultMapper().readValue(info.result(), Map.class); }
                catch (Exception failure) { throw new ApplicationException("Invalid Resource Management model result"); }
            }
            if (info != null && info.status() == ExecutionStatus.FAILED) throw new ApplicationException("Resource Management model read failed");
            try { Thread.sleep(200); } catch (InterruptedException failure) { Thread.currentThread().interrupt(); throw new ApplicationException(failure); }
        }
        throw new ApplicationException("Resource Management model read timed out");
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

    private <T> T asOperatorOrServiceRead(Supplier<T> action) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated readiness executor required");
        return transactionUtils.getInNewTx(() -> {
            User caller = entityManager.find(User.class, callerId);
            boolean service = callerId.equals(userManager.getSystemUserId());
            if (caller == null) throw new ApplicationException("Readiness caller is no longer available");
            User principal = caller;
            if (service) {
                principal = new User(); principal.setId(caller.getId()); principal.setName(caller.getName()); principal.setFullname(caller.getFullname()); principal.setRoles(new LinkedHashSet<>());
            }
            Organization context = organizationManager.getByCode(service ? "SERVICEWAND" : "SYSTEM");
            return Auth.withUser(principal, context, (Supplier<T>) () -> {
                if (!service && !Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("Readiness requires a system executor or administrator");
                return action.get();
            }).get();
        });
    }

    public Map<String, Object> validateSelection(String payloadJson) {
        try {
            Map<String, Object> selection = Json.defaultMapper().readValue(payloadJson, Map.class);
            return asPurchaseExecutor(() -> {
                Map<String, Object> preview = previewInTx(selection);
                return Map.<String, Object>of("valid", true, "capacityValidation", preview.get("capacityValidation"),
                        "purchasedPropertyCapacity", preview.get("purchasedPropertyCapacity"), "overallPropertyMaximum", preview.get("overallPropertyMaximum"));
            });
        } catch (ApplicationException failure) {
            return Map.of("valid", false, "message", failure.getMessage() == null ? "Catalog selection is invalid" : failure.getMessage());
        } catch (Exception failure) { return Map.of("valid", false, "message", "Catalog selection could not be validated"); }
    }

    public Map<String, Object> preview(String payloadJson) {
        Map<String, Object> input = input(payloadJson);
        return asPurchaseExecutor(() -> previewInTx(input));
    }

    public Map<String, Object> ensureDraft(String payloadJson) {
        Map<String, Object> input = input(payloadJson);
        if (!text(input, "checkoutDigest").matches("[a-f0-9]{64}")
                || !text(input, "catalogFingerprint").matches("[a-f0-9]{64}")) {
            throw new ApplicationException("Confirmed Checkout snapshot is required");
        }
        number(input.get("confirmationTokenId"));
        number(input.get("buyerAuthorizedAt"));
        return asPurchaseExecutor(() -> {
            // One database lock per seller/Form also serializes remote retries
            // after a billing commit whose CMS receipt could not be saved.
            long lockKey = ByteBuffer.wrap(hashBytes("PLAN_SUBSCRIPTION_DRAFT:"
                    + number(input.get("organizationId")) + ":" + number(input.get("sourceFormId")))).getLong();
            entityManager.createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(:key)")
                    .setParameter("key", lockKey).getSingleResult();
            Organization seller = seller(input);
            String accountCode = "PS" + digest(seller.getId() + ":" + number(input.get("sourceFormId"))).substring(0, 30).toUpperCase();
            List<Account> matches = accountManager.selectJPQL(
                    "SELECT a FROM Account a WHERE a.organization.id = :org AND a.code = :code",
                    Map.of("org", seller.getId(), "code", accountCode), Account.class);
            if (matches.size() > 1) throw new ApplicationException("Duplicate purchase accounts require operator review");
            Account account = matches.isEmpty() ? null : matches.get(0);
            if (account != null) {
                if (!setting("ACCOUNT_TYPE_CODE").equals(account.getType().getCode())) {
                    throw new ApplicationException("Existing purchase account type does not match the configured type");
                }
                requireReceipt(account.getMetadata(), input);
                List<Order> orders = orderManager.selectJPQL(
                        "SELECT o FROM Order o WHERE o.organization.id = :org AND o.account.id = :account",
                        Map.of("org", seller.getId(), "account", account.getId()), Order.class);
                if (orders.size() > 1) throw new ApplicationException("Duplicate purchase orders require operator review");
                if (!orders.isEmpty()) {
                    Order order = orders.get(0);
                    requireReceipt(order.getMetadata(), input);
                    if (!setting("ORDER_TYPE_CODE").equals(order.getType().getCode()) || !order.hasState("DRAFT")) {
                        throw new ApplicationException("Existing purchase order is outside the draft stage");
                    }
                    if (order.getItems().isEmpty()) {
                        // Explicit same-Form recovery can upgrade an old empty draft;
                        // never reprice a consented snapshot or rewrite existing lines.
                        Map<String, Object> preview = confirmedPreview(input);
                        Map<String, Object> saved = objectMap(order.getMetadata().get(KEY));
                        if (!Boolean.TRUE.equals(saved.get("draftOnly"))
                                || !preview.get("catalogFingerprint").equals(objectMap(saved.get("planPreview")).get("catalogFingerprint"))) {
                            throw new ApplicationException("Existing draft pricing snapshot requires operator review");
                        }
                        addPurchaseItems(order, seller, input, preview);
                        markBasePlan(order);
                        orderManager.save(order);
                        orderManager.flush();
                    }
                    receipt(account, order); // Validate committed selection before touching its invoice.
                    prepareInvoice(order, input);
                    return receipt(account, order);
                }
            }
            Map<String, Object> preview = confirmedPreview(input);
            Address address = addressManager.get(Math.toIntExact(number(input.get("addressId"))));
            if (address == null || address.getCountry() == null || address.getCity() == null || address.getPostalCode() == null) {
                throw new ApplicationException("Resolved company address is no longer available");
            }
            if (account == null) account = createAccount(seller, accountCode, address, input);
            OrderType type = orderTypeManager.getByCode(setting("ORDER_TYPE_CODE"));
            if (type == null || type.getWorkflow() == null || type.getWorkflow().getInitialState() == null
                    || !"DRAFT".equals(type.getWorkflow().getInitialState().getCode())) {
                throw new ApplicationException("Subscription order type must start in DRAFT");
            }
            Order order = new Order();
            order.setOrganization(seller);
            order.setType(type);
            order.setWorkflow(type.getWorkflow());
            order.setStates(new LinkedHashSet<>(Set.of(type.getWorkflow().getInitialState())));
            order.setAccount(account);
            order.setCurrency(dictionaryManager.get(Math.toIntExact(number(preview.get("currencyId")))));
            order.setNotes("Plan subscription draft from Form " + number(input.get("sourceFormId"))
                    + ". Properties capacity validated against the configured plan maximum; tax preparation only, not payable.");
            Map<String, Object> purchase = marker(input);
            purchase.put("draftOnly", true);
            purchase.put("itemsMaterialized", true);
            purchase.put("pricingStatus", "CATALOG_SELECTION_ONLY");
            purchase.put("selection", selection(input));
            purchase.put("planPreview", preview);
            order.setMetadata(new LinkedHashMap<>(Map.of(KEY, purchase)));
            addPurchaseItems(order, seller, input, preview);
            markBasePlan(order);
            // Payment remains disabled; tax uses the existing Order workflow.
            order = orderManager.save(order);
            orderManager.flush();
            if (!order.hasState("DRAFT")) throw new ApplicationException("Subscription order did not start in DRAFT");
            receipt(account, order);
            prepareInvoice(order, input);
            return receipt(account, order);
        });
    }

    private Map<String, Object> previewInTx(Map<String, Object> input) {
        Organization seller = seller(input);
        Product plan = product(input.get("planProductId"), seller);
        if (!"SERVICEWAND_SAAS".equals(plan.getType().getCode()) || "SERVICEWAND_ENTERPRISE".equals(plan.getCode())) {
            throw new ApplicationException("Selected plan is not available for self-service purchase");
        }
        String period = text(input, "billingPeriod");
        if (!Set.of("MONTHLY", "YEARLY").contains(period)) throw new ApplicationException("Unsupported billing period");
        ProductPrice price = planPrice(seller, plan, period);
        Object currencyValue = price.findFirstAttributeValue("CURRENCY");
        Dictionary currency = dictionaryManager.get(Math.toIntExact(number(currencyValue)));
        Object amountValue = price.findFirstAttributeValue("UNIT_PRICE");
        if (!(amountValue instanceof Number) || currency == null) throw new ApplicationException("Plan price or currency is missing");
        BigDecimal amount = new BigDecimal(amountValue.toString());
        if (amount.signum() < 0) throw new ApplicationException("Plan price must not be negative");
        List<Map<String, Object>> lines = new ArrayList<>();
        lines.add(priceLine(plan, price, "BASE_PLAN", 1, "SINGLE_SELECTED_PLAN", period, currency));
        Object compatibility = plan.findFirstAttributeValue("COMPATIBILITY");
        Set<Long> compatible = new LinkedHashSet<>();
        if (compatibility instanceof Collection<?> values) for (Object value : values) compatible.add(number(value));
        int packs = quantity(input, "siteExpansionPacks");
        int weatherCount = quantity(input, "weatherPropertyCount");
        long included = number(plan.findFirstAttributeValue("ACTIVE_PROPERTIES_INCLUDED"));
        long capacity = included;
        boolean expansionSelected = false, weatherSelected = false;
        long expansionPackSize = 0;
        List<String> addonNames = new ArrayList<>();
        for (Long id : addons(input)) {
            Product addon = product(id, seller);
            String role;
            int count;
            if (addon.getCode().startsWith("SERVICEWAND_SAAS_PROPERTY_EXT_")) {
                if (expansionSelected) throw new ApplicationException("Only one site expansion product may be selected");
                expansionSelected = true;
                role = "SITE_EXPANSION"; count = packs;
                expansionPackSize = number(addon.findFirstAttributeValue("COUNT"));
                capacity = Math.addExact(capacity, Math.multiplyExact((long) packs, expansionPackSize));
            } else if ("SERVICEWAND_WEATHER_INTELLIGENCE".equals(addon.getCode())) {
                weatherSelected = true;
                if (!Boolean.TRUE.equals(addon.findFirstAttributeValue("ENABLED"))) throw new ApplicationException("Weather is disabled");
                role = "WEATHER"; count = weatherCount;
            } else {
                throw new ApplicationException("Routing Credits, Custom Reports and unsupported add-ons are excluded from this purchase flow");
            }
            if (!compatible.contains(id)) throw new ApplicationException("Selected add-on is incompatible with the selected plan");
            if (count <= 0) throw new ApplicationException("Selected add-on requires an explicit positive quantity");
            ProductPrice addonPrice = planPrice(seller, addon, period);
            if ("YEARLY".equals(period)) {
                BigDecimal annual = new BigDecimal(addonPrice.findFirstAttributeValue("UNIT_PRICE").toString());
                ProductPrice monthlyPrice = planPrice(seller, addon, "MONTHLY");
                if (number(monthlyPrice.findFirstAttributeValue("CURRENCY")) != currency.getId().longValue()
                        || annual.compareTo(new BigDecimal(monthlyPrice.findFirstAttributeValue("UNIT_PRICE").toString()).multiply(BigDecimal.valueOf(12))) != 0) {
                    throw new ApplicationException("Annual add-on price must equal twelve monthly prices in the same currency");
                }
            }
            lines.add(priceLine(addon, addonPrice, role, count,
                    "SITE_EXPANSION".equals(role) ? "SITE_EXPANSION_PACKS" : "WEATHER_PROPERTY_COUNT", period, currency));
            addonNames.add(productName(addon));
        }
        if (!expansionSelected && packs != 0 || !weatherSelected && weatherCount != 0) {
            throw new ApplicationException("Quantity must be empty or zero when its add-on is not selected");
        }
        long maximum = propertyMaximum(plan.getCode(), capacity);
        if (weatherCount > capacity) throw new ApplicationException("Weather quantity exceeds purchased Active Properties capacity");
        BigDecimal subtotal = BigDecimal.ZERO;
        for (Map<String, Object> line : lines) subtotal = subtotal.add(new BigDecimal(line.get("lineAmount").toString()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schemaVersion", 4);
        result.put("planProductId", plan.getId());
        result.put("planCode", plan.getCode());
        result.put("planName", productName(plan));
        result.put("addonNames", addonNames);
        result.put("priceId", price.getId());
        result.put("planAmount", amount.stripTrailingZeros().toPlainString());
        result.put("currencyId", currency.getId());
        result.put("currencyCode", currency.getCode());
        result.put("billingPeriod", period);
        result.put("addonProductIds", addons(input));
        result.put("siteExpansionPacks", packs);
        result.put("weatherPropertyCount", weatherCount);
        result.put("activePropertiesIncluded", included);
        result.put("purchasedPropertyCapacity", capacity);
        result.put("capacityValidation", "VALIDATED_CONFIG_MAXIMUM");
        result.put("overallPropertyMaximum", maximum);
        result.put("routingOptimizationIncluded", Boolean.TRUE.equals(plan.findFirstAttributeValue("ROUTE_OPTIMIZATION")));
        result.put("lines", lines);
        result.put("subtotal", subtotal.stripTrailingZeros().toPlainString());
        result.put("catalogValidation", "VALIDATED");
        result.put("quantityValidation", "VALIDATED");
        Map<String, Object> taxQuote = previewTaxes(input, result);
        result.put("taxQuote", taxQuote);
        result.put("taxStatus", "CONFIGURED_RATES_APPLIED".equals(taxQuote.get("status")) && !"EXACT_MINOR_UNITS".equals(taxQuote.get("roundingStatus")) ? taxQuote.get("roundingStatus") : taxQuote.get("status"));
        result.put("totalPayable", "EXACT_MINOR_UNITS".equals(taxQuote.get("roundingStatus")) ? taxQuote.get("totalWithTaxes") : null);
        Map<String, Object> entitlements = entitlementSnapshot(plan, period, included, packs, expansionPackSize, capacity, weatherSelected, weatherCount);
        result.put("entitlements", entitlements);
        result.put("entitlementFingerprint", digest(canonicalJson(entitlements)));
        result.put("catalogFingerprint", digest(canonicalJson(result)));
        return result;
    }

    private int quantity(Map<String, Object> input, String key) {
        Object value = input.get(key);
        if (value == null) return 0;
        try {
            if (!(value instanceof Number)) throw new IllegalArgumentException();
            int count = new BigDecimal(value.toString()).intValueExact();
            if (count < 0) throw new IllegalArgumentException();
            return count;
        } catch (Exception failure) { throw new ApplicationException("Add-on quantity must be a nonnegative integer"); }
    }

    private long propertyMaximum(String planCode, long capacity) {
        Script helper = scriptManager.getByCode(SCRIPT);
        Map<String, Object> configuration = objectMap(helper.getMetadata().get("ENTITLEMENT_CHECKOUT_CONFIG"));
        Map<String, Object> rule = objectMap(configuration.get("overallPlanMaximum"));
        Object raw = objectMap(rule.get("byPlanCode")).get(planCode);
        if (!"TEMPORARY_CONFIG".equals(rule.get("source")) || !"CONFIGURED_PENDING_MODEL_MIGRATION".equals(rule.get("status"))
                || !Boolean.FALSE.equals(rule.get("allowMarketingTextParsing")) || !(raw instanceof Number)) {
            throw new ApplicationException("Explicit configured Properties maximum is required for this plan");
        }
        long maximum;
        try { maximum = new BigDecimal(raw.toString()).longValueExact(); }
        catch (RuntimeException failure) { throw new ApplicationException("Configured Properties maximum must be a positive integer"); }
        if (maximum <= 0 || maximum > Integer.MAX_VALUE) throw new ApplicationException("Configured Properties maximum must be a positive integer");
        if (capacity <= 0 || capacity > maximum) throw new ApplicationException("Purchased Properties capacity exceeds configured plan maximum: {}", maximum);
        return maximum;
    }

    private Map<String, Object> priceLine(Product product, ProductPrice price, String role, int count,
            String quantitySource, String period, Dictionary currency) {
        if (number(price.findFirstAttributeValue("CURRENCY")) != currency.getId().longValue()) {
            throw new ApplicationException("All selected prices must use the plan currency");
        }
        Object value = price.findFirstAttributeValue("UNIT_PRICE");
        if (!(value instanceof Number)) throw new ApplicationException("Catalog unit price is missing");
        BigDecimal unit = new BigDecimal(value.toString());
        if (unit.signum() < 0) throw new ApplicationException("Catalog unit price must not be negative");
        Map<String, Object> line = new LinkedHashMap<>();
        line.put("role", role); line.put("productId", product.getId()); line.put("productCode", product.getCode());
        line.put("productName", productName(product)); line.put("priceId", price.getId());
        line.put("quantity", count); line.put("quantitySource", quantitySource);
        line.put("unitAmount", unit.stripTrailingZeros().toPlainString());
        line.put("lineAmount", unit.multiply(BigDecimal.valueOf(count)).stripTrailingZeros().toPlainString());
        line.put("billingPeriod", period); line.put("currencyId", currency.getId());
        return line;
    }

    private ProductPrice planPrice(Organization seller, Product plan, String period) {
        List<ProductPrice> matches = new ArrayList<>();
        for (ProductPrice price : productPriceManager.listPublicCatalogPrices(seller.getId(), true)) {
            if (price.getProduct() == null || !price.getProduct().getId().equals(plan.getId())
                    || price.getOrganization() == null || !price.getOrganization().getId().equals(seller.getId())
                    || price.getType() == null || !"PER_UNIT_RECURRENT".equals(price.getType().getCode())) continue;
            entityManager.refresh(price);
            AttributeValue interval = price.findFirstAttribute("INTERVAL");
            if (interval == null || interval.unit() == null || interval.value() == null) continue;
            var unit = unitManager.get(interval.unit());
            long count = number(interval.value());
            if (unit != null && (period.equals("MONTHLY") && count == 1 && "MONTH".equals(unit.getCode())
                    || period.equals("YEARLY") && (count == 1 && "YEAR".equals(unit.getCode())
                    || count == 12 && "MONTH".equals(unit.getCode())))) matches.add(price);
        }
        if (matches.size() != 1) throw new ApplicationException("Exactly one catalog product price is required for the selected period");
        ProductPrice price = matches.get(0);
        Object fee = price.findFirstAttributeValue("FIXED_FEE");
        if (!"Licensed".equals(price.findFirstAttributeValue("USAGE_TYPE"))
                || fee != null && (!(fee instanceof Number) || new BigDecimal(fee.toString()).signum() != 0)) {
            throw new ApplicationException("Selected product must use licensed pricing without an additional fixed fee");
        }
        return price;
    }

    private Map<String, Object> confirmedPreview(Map<String, Object> input) {
        Map<String, Object> preview = previewInTx(input);
        if (!preview.get("catalogFingerprint").equals(input.get("catalogFingerprint"))
                || !preview.get("entitlementFingerprint").equals(input.get("entitlementFingerprint"))
                || !preview.get("entitlementFingerprint").equals(digest(canonicalJson(objectMap(input.get("entitlementSnapshot")))))) {
            throw new ApplicationException("Catalog selection or Entitlements changed; prepare Checkout and obtain a new confirmation");
        }
        return preview;
    }

    private Map<String, Object> entitlementSnapshot(Product plan, String period, long included, int packs,
            long packSize, long capacity, boolean weatherSelected, int weatherCount) {
        Script helper = scriptManager.getByCode(SCRIPT);
        Map<String, Object> config = objectMap(helper.getMetadata().get("ENTITLEMENT_CHECKOUT_CONFIG"));
        if (number(config.get("schemaVersion")) != 1 || !(config.get("planCodes") instanceof Collection<?> plans)
                || !plans.contains(plan.getCode())) throw new ApplicationException("Entitlement Checkout configuration is missing or unsupported");
        List<Map<String, Object>> features = new ArrayList<>(), levels = new ArrayList<>();
        for (Object rawRule : (Collection<?>) config.get("featureRules")) {
            Map<String, Object> rule = objectMap(rawRule);
            String attribute = text(rule, "attribute");
            Object raw = plan.findFirstAttributeValue(attribute);
            boolean missing = plan.findFirstAttribute(attribute) == null;
            boolean enabled = false;
            if (!Boolean.FALSE.equals(rule.get("missingValue"))) throw new ApplicationException("Missing feature must be disabled");
            if (!missing && "BOOLEAN".equals(rule.get("decoder"))) {
                if (!(raw instanceof Boolean)) throw new ApplicationException("Malformed Boolean feature: " + attribute);
                enabled = Boolean.TRUE.equals(raw);
            } else if (!missing && "LOCALIZED_BOOLEAN".equals(rule.get("decoder"))) {
                try {
                    var localized = Json.defaultMapper().readTree(json(raw)).path(text(rule, "locale")).path(text(rule, "field"));
                    if (!localized.isTextual() || !Set.of("true", "false").contains(localized.textValue())) throw new IllegalArgumentException();
                    enabled = "true".equals(localized.textValue());
                } catch (Exception failure) { throw new ApplicationException("Malformed localized feature: " + attribute); }
            } else if (!missing) throw new ApplicationException("Unsupported feature decoder");
            Map<String, Object> feature = new LinkedHashMap<>();
            feature.put("definitionCode", rule.get("definitionCode")); feature.put("sourceAttribute", attribute);
            feature.put("value", enabled); feature.put("sourceStatus", missing ? "ABSENT_DISABLED_BY_USER_RULE" : "EXPLICIT_CATALOG_VALUE");
            features.add(feature);
        }
        for (Object rawRule : (Collection<?>) config.get("levelRules")) {
            Map<String, Object> rule = objectMap(rawRule);
            String attribute = text(rule, "attribute"); Object value = plan.findFirstAttributeValue(attribute);
            if (!(value instanceof String) || !((Collection<?>) rule.get("allowedValues")).contains(value)) {
                throw new ApplicationException("Missing or unreviewed feature level: " + attribute);
            }
            Map<String, Object> level = new LinkedHashMap<>();
            level.put("definitionCode", rule.get("definitionCode")); level.put("sourceAttribute", attribute);
            level.put("value", value); level.put("enabled", !"false".equals(value)); level.put("valueComparisonVerified", false);
            levels.add(level);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schemaVersion", 1); result.put("configurationFingerprint", digest(canonicalJson(config)));
        result.put("planCode", plan.getCode()); result.put("billingPeriod", period);
        result.put("features", features); result.put("levels", levels);
        result.put("propertyCapacity", Map.of("definitionCode", config.get("propertyDefinitionCode"), "included", included,
                "expansionPacks", packs, "expansionPackSize", packSize, "limit", capacity, "overallMaximum", propertyMaximum(plan.getCode(), capacity),
                "maximumSource", "TEMPORARY_CONFIG", "maximumValidation", "VALIDATED_CONFIG_MAXIMUM"));
        result.put("weather", Map.of("selected", weatherSelected, "featureDefinitionCode", config.get("weatherFeatureDefinitionCode"),
                "limitDefinitionCode", config.get("weatherLimitDefinitionCode"), "propertyCount", weatherCount));
        result.put("coverage", config.get("coverage")); result.put("grantIssuanceEnabled", false); result.put("enforcementVerified", false);
        return result;
    }

    private static Object canonical(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> sorted = new TreeMap<>();
            for (var entry : map.entrySet()) sorted.put(String.valueOf(entry.getKey()), canonical(entry.getValue()));
            return sorted;
        }
        if (value instanceof Collection<?> list) return list.stream().map(MAIN_CLASS::canonical).toList();
        return value;
    }

    private static String canonicalJson(Object value) { return json(canonical(value)); }

    private void addPurchaseItems(Order order, Organization seller, Map<String, Object> input, Map<String, Object> preview) {
        if (!order.getItems().isEmpty()) throw new ApplicationException("Draft already contains lines requiring review");
        OrderItemType type = orderItemTypeManager.getByCode(setting("ORDER_ITEM_TYPE_CODE"));
        if (type == null || type.getOrganization() == null || !seller.getId().equals(type.getOrganization().getId())) {
            throw new ApplicationException("Subscription order item type is missing from the selling organization");
        }
        if (type.getWorkflow() != null && (type.getWorkflow().getInitialState() == null
                || !"DRAFT".equals(type.getWorkflow().getInitialState().getCode()))) {
            throw new ApplicationException("Subscription item workflow must start in DRAFT");
        }
        for (Map<String, Object> line : previewLines(preview)) {
        ProductPrice price = productPriceManager.get(number(line.get("priceId")));
        OrderItem item = new OrderItem();
        item.setOrganization(seller);
        item.setCreated(LocalDateTime.now());
        item.setUpdated(LocalDateTime.now());
        item.setUpdatedBy(Auth.getAuthenticatedUser().getName());
        item.setType(type);
        if (type.getWorkflow() != null) {
            item.setWorkflow(type.getWorkflow());
            item.setStates(new LinkedHashSet<>(Set.of(type.getWorkflow().getInitialState())));
        }
        item.setOrder(order);
        item.setItemPrice(price);
        item.setItemCount(Math.toIntExact(number(line.get("quantity"))));
        item.setAmount(new BigDecimal(line.get("unitAmount").toString()));
        item.setSortOrder(order.getItems().size());
        item.setNotes(line.get("productName") + " / " + preview.get("billingPeriod") + "; draft selection, not payable.");
        Map<String, Object> metadata = marker(input);
        metadata.put("role", line.get("role"));
        metadata.put("productId", line.get("productId"));
        metadata.put("planProductId", preview.get("planProductId"));
        metadata.put("priceId", line.get("priceId"));
        metadata.put("catalogUnitAmount", line.get("unitAmount"));
        metadata.put("currencyId", preview.get("currencyId"));
        metadata.put("billingPeriod", preview.get("billingPeriod"));
        metadata.put("quantitySource", line.get("quantitySource"));
        metadata.put("quantity", line.get("quantity"));
        item.setMetadata(new LinkedHashMap<>(Map.of(KEY, metadata)));
        order.getItems().add(item);
        }
    }

    private void markBasePlan(Order order) {
        Map<String, Object> metadata = new LinkedHashMap<>(order.getMetadata());
        Map<String, Object> purchase = new LinkedHashMap<>(objectMap(metadata.get(KEY)));
        purchase.put("basePlanMaterialized", true);
        purchase.put("basePlanPricingStatus", "CATALOG_PLAN_ONLY");
        purchase.put("itemsMaterialized", true);
        Map<String, Object> preview = objectMap(purchase.get("planPreview"));
        purchase.put("capacityValidation", preview.getOrDefault("capacityValidation", "MAXIMUM_NOT_STRUCTURED"));
        metadata.put(KEY, purchase);
        order.setMetadata(metadata);
    }

    private Account createAccount(Organization seller, String code, Address address, Map<String, Object> input) {
        AccountType type = accountTypeManager.getByCode(setting("ACCOUNT_TYPE_CODE"));
        ContactType primary = contactTypeManager.getByCode(ContactType.PRIMARY);
        ContactEntryKind work = contactEntryKindManager.getByCode(ContactEntryKind.WORK);
        AddressType billing = addressTypeManager.getByCode(AddressType.BILLING);
        AddressType legal = addressTypeManager.getByCode("LEGAL");
        if (type == null || primary == null || work == null || billing == null || legal == null) {
            throw new ApplicationException("CUSTOMER/PRIMARY/WORK/BILLING/LEGAL configuration is missing");
        }
        Contact contact = new Contact();
        contact.setType(primary);
        contact.setFirstName(nullable(text(input, "firstName")));
        contact.setLastName(nullable(text(input, "lastName")));
        addEntry(contact, work, ContactEntryType.EMAIL, text(input, "email"));
        if (!text(input, "phone").isBlank()) addEntry(contact, work, ContactEntryType.PHONE, text(input, "phone"));
        Account account = new Account();
        account.setOrganization(seller);
        account.setCode(code);
        account.setType(type);
        setPurchaserLegalEntityType(account, type);
        account.setNlsValue("en", "NAME", text(input, "companyName"));
        account.getContacts().add(contact);
        AccountAddress link = new AccountAddress();
        link.setAccount(account);
        link.setAddress(address);
        link.getTypes().add(billing);
        link.getTypes().add(legal);
        account.getAddresses().add(link);
        account.setMetadata(new LinkedHashMap<>(Map.of(KEY, marker(input))));
        return accountManager.save(account);
    }

    private void setPurchaserLegalEntityType(Account account, AccountType type) {
        String code = "LEGAL_ENTITY_TYPE";
        String value = text(onboardingConfig(), "purchaserLegalEntityType");
        Map<String, Object> fields = new TreeMap<>();
        collectTypeFields(type, fields, new LinkedHashSet<>(), new LinkedHashSet<>());
        Map<String, Object> field = objectMap(fields.get(code));
        if (value.isBlank() || !"java.lang.String".equals(field.get("className"))
                || !collection(field.get("options")).contains(value)) {
            throw new ApplicationException("Configured purchaser legal entity type is not supported by the Account type");
        }
        Integer ownerId = accountAttributeOwner(type, code, new LinkedHashSet<>());
        if (ownerId == null) throw new ApplicationException("Account legal entity attribute owner is missing");
        account.setAttributeValue(ownerId, code, value, null);
    }

    private Integer accountAttributeOwner(AccountType type, String code, Set<Integer> seen) {
        if (type == null || !seen.add(type.getId())) return null;
        if (type.getAttributes().stream().anyMatch(attribute -> code.equals(attribute.getCode()))) return type.getId();
        for (AccountType parent : type.getParents()) {
            Integer owner = accountAttributeOwner(parent, code, seen);
            if (owner != null) return owner;
        }
        return null;
    }

    private void addEntry(Contact contact, ContactEntryKind kind, String code, String value) {
        ContactEntryType type = contactEntryTypeManager.getByCode(code);
        if (type == null) throw new ApplicationException("Contact entry type is missing");
        ContactEntry entry = new ContactEntry();
        entry.setContact(contact); entry.setKind(kind); entry.setType(type); entry.setValue(value);
        contact.getContactEntries().add(entry);
    }

    private Map<String, Object> receipt(Account account, Order order) {
        Map<String, Object> saved = objectMap(order.getMetadata().get(KEY));
        Map<String, Object> preview = objectMap(saved.get("planPreview"));
        List<Map<String, Object>> lines = previewLines(preview);
        if (!Boolean.TRUE.equals(saved.get("draftOnly")) || !Boolean.TRUE.equals(saved.get("basePlanMaterialized"))
                || order.getItems().size() != lines.size()) throw new ApplicationException("Draft lines require operator review");
        OrderItem item = null;
        BigDecimal total = BigDecimal.ZERO;
        Set<Long> matched = new LinkedHashSet<>();
        List<Long> itemIds = new ArrayList<>();
        for (Map<String, Object> expected : lines) {
            List<OrderItem> found = order.getItems().stream().filter(candidate -> candidate.getItemPrice() != null
                    && candidate.getItemPrice().getId().longValue() == number(expected.get("priceId"))).toList();
            if (found.size() != 1) throw new ApplicationException("Draft product price lines require review");
            OrderItem current = found.get(0);
            Map<String, Object> line = objectMap(current.getMetadata().get(KEY));
            requireReceipt(current.getMetadata(), saved);
            BigDecimal unit = new BigDecimal(expected.get("unitAmount").toString());
            if (!expected.get("role").equals(line.get("role")) || current.getId() == null || !matched.add(current.getId().longValue())
                    || current.getType() == null || !setting("ORDER_ITEM_TYPE_CODE").equals(current.getType().getCode())
                    || current.getOrganization() == null || !order.getOrganization().getId().equals(current.getOrganization().getId())
                    || current.getItemCount() == null || current.getItemCount().longValue() != number(expected.get("quantity"))
                    || current.getOverrideAmount() != null || current.getAmount() == null || unit.compareTo(current.getAmount()) != 0
                    || current.getItemPrice().getProduct() == null
                    || current.getItemPrice().getProduct().getId().longValue() != number(expected.get("productId"))
                    || order.getCurrency() == null || order.getCurrency().getId().longValue() != number(preview.get("currencyId"))) {
                throw new ApplicationException("Persisted draft line no longer matches its confirmed snapshot");
            }
            total = total.add(unit.multiply(BigDecimal.valueOf(number(expected.get("quantity")))));
            itemIds.add(current.getId().longValue());
            if ("BASE_PLAN".equals(expected.get("role"))) item = current;
        }
        if (item == null || total.compareTo(order.getTotalCharges()) != 0) throw new ApplicationException("Native draft charges differ from the confirmed selection");
        BigDecimal amount = new BigDecimal(preview.get("planAmount").toString());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "DRAFT_ORDER_READY");
        result.put("accountId", account.getId());
        result.put("orderId", order.getId());
        result.put("orderState", "DRAFT");
        result.put("basePlanItemId", item.getId());
        result.put("basePlanPriceId", item.getItemPrice().getId());
        result.put("basePlanAmount", amount.stripTrailingZeros().toPlainString());
        result.put("basePlanPricingStatus", "CATALOG_PLAN_ONLY");
        result.put("pricingStatus", preview.containsKey("lines") ? "CATALOG_SELECTION_ONLY" : "LEGACY_BASE_PLAN_ONLY");
        result.put("itemIds", itemIds);
        result.put("subtotal", total.stripTrailingZeros().toPlainString());
        result.put("capacityValidation", preview.getOrDefault("capacityValidation", "MAXIMUM_NOT_STRUCTURED"));
        if (preview.containsKey("overallPropertyMaximum")) result.put("overallPropertyMaximum", preview.get("overallPropertyMaximum"));
        if (preview.containsKey("entitlements")) {
            String entitlementFingerprint = digest(canonicalJson(objectMap(preview.get("entitlements"))));
            if (!entitlementFingerprint.equals(preview.get("entitlementFingerprint"))
                    || !entitlementFingerprint.equals(saved.get("entitlementFingerprint"))) {
                throw new ApplicationException("Persisted Entitlement snapshot requires operator review");
            }
            result.put("entitlementFingerprint", entitlementFingerprint);
            result.put("entitlementSnapshot", preview.get("entitlements"));
        }
        Object invoice = saved.get("invoicePreparation");
        if (invoice instanceof Map<?, ?> preparation) {
            result.put("invoiceStatus", preparation.get("status"));
            result.put("invoicePreparation", preparation);
            if (preparation.get("invoiceId") != null) result.put("invoiceId", preparation.get("invoiceId"));
        }
        result.put("paymentEnabled", false);
        result.put("billingExecutionIdentity", userManager.getSystemUserId().equals(Auth.getAuthenticatedUser().getId()) ? "SYSTEM" : "OPERATOR");
        result.put("billingSystemAdmin", Auth.isAuthenticatedSystemAdmin());
        return result;
    }

    private void prepareInvoice(Order order, Map<String, Object> input) {
        Map<String, Object> purchase = objectMap(order.getMetadata().get(KEY));
        List<Invoice> invoices = invoiceManager.selectJPQL(
                "SELECT i FROM Invoice i WHERE i.order.id = :order", Map.of("order", order.getId()), Invoice.class);
        if (invoices.size() > 1) throw new ApplicationException("Multiple invoices require operator review");
        if (!invoices.isEmpty()) {
            Invoice invoice = invoices.get(0);
            requireReceipt(invoice.getMetadata(), input);
            guardPreparedInvoice(invoice, Map.of());
            if (number(objectMap(purchase.get("invoicePreparation")).get("invoiceId")) != invoice.getId().longValue()) {
                throw new ApplicationException("Order invoice receipt requires operator review");
            }
            return; // Recover committed invoice without repricing or changing its links.
        }
        Map<String, Object> old = optionalMap(purchase.get("invoicePreparation"));
        if (old.get("invoiceId") != null) throw new ApplicationException("Prepared invoice disappeared; do not issue another invoice automatically");
        if (!objectMap(purchase.get("planPreview")).containsKey("lines")) {
            saveInvoicePreparation(order, Map.of("status", "LEGACY_SELECTION_REVIEW_REQUIRED", "paymentEnabled", false));
            return;
        }
        Map<String, Object> addressSnapshot = objectMap(input.get("companyAddressSnapshot"));
        List<Address> billing = order.getAccount().getAddresses().stream()
                .filter(link -> link.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode())))
                .map(AccountAddress::getAddress).toList();
        if (billing.size() != 1 || billing.get(0).getId().longValue() != number(input.get("addressId"))) {
            throw new ApplicationException("Billing address differs from the confirmed company address");
        }
        Address address = billing.get(0);
        Map<String, Object> actualAddress = new LinkedHashMap<>();
        actualAddress.put("address1", address.getAddress1()); actualAddress.put("address2", address.getAddress2());
        actualAddress.put("city", address.getCity()); actualAddress.put("postalCode", address.getPostalCode());
        actualAddress.put("countryCode", address.getCountry() == null ? null : address.getCountry().getCode2());
        actualAddress.put("regionCode", address.getState() == null ? address.getJurisdiction() : address.getState().getCode());
        for (var entry : actualAddress.entrySet()) if (!java.util.Objects.equals(entry.getValue(), addressSnapshot.get(entry.getKey()))) {
            throw new ApplicationException("Resolved company address changed; review before preparing its invoice");
        }
        Map<String, Object> tax = inspectConfiguredTaxes(order);
        if (!Set.of("CONFIGURED_RATES_APPLIED", "NATIVE_TAX_ASSIGNMENT_PENDING").contains(tax.get("status"))) {
            saveInvoicePreparation(order, Map.of("status", tax.get("status"), "tax", tax, "paymentEnabled", false));
            return;
        }
        // The existing Order.onUpdate owns tax assignment. No second tax calculator or guessed rate.
        saveInvoicePreparation(order, Map.of("status", "PREPARING", "tax", tax, "paymentEnabled", false));
        tax = inspectConfiguredTaxes(order);
        if (!"CONFIGURED_RATES_APPLIED".equals(tax.get("status"))) {
            saveInvoicePreparation(order, Map.of("status", tax.get("status"), "tax", tax, "paymentEnabled", false));
            return;
        }
        if (!"EXACT_MINOR_UNITS".equals(tax.get("roundingStatus"))) {
            saveInvoicePreparation(order, Map.of("status", tax.getOrDefault("roundingStatus", "ROUNDING_POLICY_REQUIRED"), "tax", tax, "paymentEnabled", false));
            return;
        }
        Map<String, Object> consentedTax = optionalMap(objectMap(purchase.get("planPreview")).get("taxQuote"));
        if (!consentedTax.isEmpty() && (!"CONFIGURED_RATES_APPLIED".equals(consentedTax.get("status"))
                || !java.util.Objects.equals(consentedTax.get("rates"), tax.get("rates"))
                || !java.util.Objects.equals(consentedTax.get("totalWithTaxes"), tax.get("totalWithTaxes")))) {
            throw new ApplicationException("Native Invoice taxes differ from the reviewed Checkout; refresh and confirm the purchase again");
        }
        List<Invoice> overlapping = invoiceManager.selectJPQL(
                "SELECT DISTINCT i FROM Invoice i JOIN i.items item WHERE item.order.id = :order",
                Map.of("order", order.getId()), Invoice.class);
        if (!overlapping.isEmpty()) throw new ApplicationException("Order items are already linked to another invoice");
        InvoiceType type = invoiceTypeManager.getByCode(setting("INVOICE_TYPE_CODE"));
        if (type == null || type.getOrganization() == null || !order.getOrganization().getId().equals(type.getOrganization().getId())
                || type.getWorkflow() == null || type.getWorkflow().getInitialState() == null
                || !"DRAFT".equals(type.getWorkflow().getInitialState().getCode())) {
            throw new ApplicationException("Configured invoice type must belong to the seller and start in DRAFT");
        }
        String fingerprint = invoiceFingerprint(order);
        Map<String, Object> preparation = new LinkedHashMap<>();
        preparation.put("status", "DRAFT_INVOICE_READY");
        preparation.put("snapshotFingerprint", fingerprint);
        preparation.put("tax", tax);
        preparation.put("paymentEnabled", false);
        putInvoicePreparation(order, preparation);
        Invoice invoice = new Invoice();
        invoice.setOrganization(order.getOrganization());
        invoice.setType(type);
        invoice.setWorkflow(type.getWorkflow());
        invoice.setStates(new LinkedHashSet<>(Set.of(type.getWorkflow().getInitialState())));
        invoice.setOrder(order);
        // Same native association as INVOICE workflow 22: reference the existing OrderItems.
        invoice.getItems().addAll(order.getItems());
        invoice.setNotes("Preparation-only invoice for subscription Form " + number(input.get("sourceFormId")) + "; not submitted; payment disabled.");
        Map<String, Object> invoiceData = marker(input);
        invoiceData.put("preparationOnly", true);
        invoiceData.put("paymentEnabled", false);
        invoiceData.put("snapshotFingerprint", fingerprint);
        invoiceData.put("itemIds", itemIds(order));
        invoiceData.put("amountDueAtPreparation", money(order.getGrandTotal()));
        invoiceData.put("tax", tax);
        invoice.setMetadata(new LinkedHashMap<>(Map.of(KEY, invoiceData)));
        invoice = invoiceManager.save(invoice);
        invoiceManager.flush();
        if (!invoice.hasState("DRAFT")) throw new ApplicationException("Prepared invoice did not start in DRAFT");
        preparation.put("invoiceId", invoice.getId());
        preparation.put("amountDue", money(invoice.getAmountDue()));
        saveInvoicePreparation(order, preparation);
        guardPreparedInvoice(invoice, Map.of());
    }

    private Map<String, Object> inspectConfiguredTaxes(Order order) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", "EXISTING_ORDER_WORKFLOW_ON_UPDATE_AND_NATIVE_ORDER_ITEM_TOTALS");
        result.put("paymentEnabled", false);
        if (order.getWorkflow() != null) result.put("workflowCode", order.getWorkflow().getCode());
        List<Address> addresses = order.getAccount().getAddresses().stream()
                .filter(link -> link.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode())))
                .map(AccountAddress::getAddress).toList();
        if (addresses.size() != 1 || addresses.get(0).getCountry() == null) {
            result.put("status", "BILLING_ADDRESS_REVIEW_REQUIRED"); return result;
        }
        Address address = addresses.get(0);
        result.put("addressId", address.getId());
        result.put("country", address.getCountry().getId());
        if (address.getState() != null) result.put("stateId", address.getState().getId());
        Map<Integer, BigDecimal> rates = new TreeMap<>();
        boolean unsupported = false;
        // Match exactly the existing subscription Order.onUpdate's COUNTRY/STATE rules.
        var taxes = dictionaryManager.page(0, Integer.MAX_VALUE, List.of(), List.of(
                new com.pixelnation.common.ui.domain.FilterClause("type.code", com.pixelnation.common.ui.domain.FilterClause.EQ, "TAX")));
        for (var entry : taxes) {
            Object country = entry.getAttributeValue(entry.getType().getId(), "COUNTRY");
            Object state = entry.getAttributeValue(entry.getType().getId(), "STATE");
            if (!java.util.Objects.equals(address.getCountry().getId(), country)) continue;
            if (state != null && (address.getState() == null || !address.getState().getId().toString().equals(state.toString()))) continue;
            Object value = entry.getAttributeValue(entry.getType().getId(), "PERCENTAGE");
            if (!(value instanceof Number)) { unsupported = true; continue; }
            BigDecimal rate = new BigDecimal(value.toString());
            if (rate.signum() < 0 || Boolean.TRUE.equals(entry.getAttributeValue(entry.getType().getId(), "INCLUSIVE"))) unsupported = true;
            rates.put(entry.getId(), rate);
        }
        result.put("rates", canonicalRates(rates));
        if (rates.isEmpty() || unsupported) { result.put("status", "TAX_CONFIGURATION_REQUIRED"); return result; }
        for (OrderItem item : order.getItems()) {
            if (!canonicalRates(rates).equals(canonicalRates(item.getApplicableTaxes()))) {
                result.put("status", "NATIVE_TAX_ASSIGNMENT_PENDING"); return result;
            }
        }
        result.put("status", "CONFIGURED_RATES_APPLIED");
        result.put("subtotal", money(order.getTotalCharges()));
        result.put("taxAmount", money(order.getTotalTaxes()));
        result.put("totalWithTaxes", money(order.getGrandTotal()));
        try {
            int scale = Currency.getInstance(order.getCurrency().getCode()).getDefaultFractionDigits();
            if (scale < 0) throw new IllegalArgumentException();
            result.put("currencyFractionDigits", scale);
            order.getGrandTotal().setScale(scale, RoundingMode.UNNECESSARY);
            result.put("roundingStatus", "EXACT_MINOR_UNITS");
        } catch (ArithmeticException fraction) { result.put("roundingStatus", "ROUNDING_POLICY_REQUIRED"); }
        catch (IllegalArgumentException currency) { result.put("roundingStatus", "CURRENCY_PRECISION_REVIEW_REQUIRED"); }
        return result;
    }

    private Map<String, Object> canonicalRates(Map<Integer, BigDecimal> rates) {
        Map<String, Object> result = new TreeMap<>();
        if (rates != null) for (var entry : rates.entrySet()) {
            if (entry.getValue() == null) throw new ApplicationException("Null tax rate requires review");
            result.put(entry.getKey().toString(), money(entry.getValue()));
        }
        return result;
    }

    private List<Long> itemIds(Order order) { return order.getItems().stream().map(item -> item.getId().longValue()).sorted().toList(); }
    private String money(BigDecimal value) { return value.stripTrailingZeros().toPlainString(); }

    private String invoiceFingerprint(Order order) {
        List<Map<String, Object>> lines = new ArrayList<>();
        order.getItems().stream().sorted(java.util.Comparator.comparing(OrderItem::getId)).forEach(item -> {
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("id", item.getId()); line.put("priceId", item.getItemPrice().getId());
            line.put("amount", money(item.getAmount())); line.put("quantity", item.getItemCount());
            line.put("overrideAmount", item.getOverrideAmount() == null ? null : money(item.getOverrideAmount()));
            line.put("taxes", canonicalRates(item.getApplicableTaxes())); lines.add(line);
        });
        List<String> billingAddresses = order.getAccount().getAddresses().stream()
                .filter(link -> link.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode())))
                .map(link -> link.getAddress().getId() + ":" + link.getAddress().getCountry().getId() + ":"
                        + (link.getAddress().getState() == null ? "" : link.getAddress().getState().getId()) + ":"
                        + link.getAddress().getAddress1() + ":" + link.getAddress().getAddress2() + ":"
                        + link.getAddress().getCity() + ":" + link.getAddress().getPostalCode()).sorted().toList();
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("orderId", order.getId()); snapshot.put("organizationId", order.getOrganization().getId());
        snapshot.put("accountId", order.getAccount().getId()); snapshot.put("currencyId", order.getCurrency().getId());
        snapshot.put("billingAddresses", billingAddresses); snapshot.put("lines", lines);
        return digest(json(snapshot));
    }

    private void putInvoicePreparation(Order order, Map<String, Object> preparation) {
        Map<String, Object> metadata = new LinkedHashMap<>(order.getMetadata());
        Map<String, Object> purchase = new LinkedHashMap<>(objectMap(metadata.get(KEY)));
        purchase.put("invoicePreparation", new LinkedHashMap<>(preparation));
        metadata.put(KEY, purchase); order.setMetadata(metadata);
    }
    private void saveInvoicePreparation(Order order, Map<String, Object> preparation) {
        putInvoicePreparation(order, preparation); orderManager.save(order); orderManager.flush();
    }
    @SuppressWarnings("unchecked")
    private Map<String, Object> optionalMap(Object value) { return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of(); }

    public void guardOrderInvoiceSnapshot(Order order, Map<String, Object> context) {
        Map<String, Object> purchase = optionalMap(order.getMetadata() == null ? null : order.getMetadata().get(KEY));
        Map<String, Object> preparation = optionalMap(purchase.get("invoicePreparation"));
        if (!"DRAFT_INVOICE_READY".equals(preparation.get("status"))) return;
        if (!"SERVICEWAND_SUBSCRIPTION".equals(order.getType().getCode()) || !order.hasState("DRAFT")
                || !invoiceFingerprint(order).equals(preparation.get("snapshotFingerprint"))) {
            throw new ApplicationException("Prepared invoice snapshot is immutable; review before changing the subscription draft");
        }
    }
    public void guardPreparedOrderItem(OrderItem item, Map<String, Object> context) {
        if (item.getOrder() != null) guardOrderInvoiceSnapshot(item.getOrder(), context);
    }
    public void guardPreparedOrderItemDelete(OrderItem item, Map<String, Object> context) {
        if (item.getOrder() != null) guardOrderInvoiceDelete(item.getOrder(), context);
    }
    public void guardOrderInvoiceDelete(Order order, Map<String, Object> context) {
        Map<String, Object> purchase = optionalMap(order.getMetadata() == null ? null : order.getMetadata().get(KEY));
        if (optionalMap(purchase.get("invoicePreparation")).get("invoiceId") != null) {
            throw new ApplicationException("Prepared subscription invoice must be reconciled before deleting its order");
        }
    }
    public void guardPreparedInvoice(Invoice invoice, Map<String, Object> context) {
        Map<String, Object> data = optionalMap(invoice.getMetadata() == null ? null : invoice.getMetadata().get(KEY));
        if (!Boolean.TRUE.equals(data.get("preparationOnly"))) return;
        Order order = invoice.getOrder();
        if (order == null || invoice.getType() == null || !setting("INVOICE_TYPE_CODE").equals(invoice.getType().getCode())
                || !order.hasState("DRAFT") || !invoice.hasState("DRAFT") || invoice.getOrganization() == null
                || !order.getOrganization().getId().equals(invoice.getOrganization().getId()) || !invoice.getPayments().isEmpty()
                || invoice.getTotalPaidAmount().signum() != 0 || !Boolean.FALSE.equals(data.get("paymentEnabled"))) {
            throw new ApplicationException("Prepared subscription invoice must remain an unpaid seller-owned DRAFT");
        }
        List<Long> actual = invoice.getItems().stream().map(item -> item.getId().longValue()).sorted().toList();
        if (!actual.equals(itemIds(order)) || actual.size() != new LinkedHashSet<>(actual).size()
                || !invoiceFingerprint(order).equals(data.get("snapshotFingerprint"))
                || invoice.getAmountDue().compareTo(new BigDecimal(data.get("amountDueAtPreparation").toString())) != 0) {
            throw new ApplicationException("Prepared invoice lines or native amount no longer match the saved order snapshot");
        }
        Map<String, Object> parent = objectMap(order.getMetadata().get(KEY));
        requireReceipt(invoice.getMetadata(), parent);
        if (!data.get("snapshotFingerprint").equals(objectMap(parent.get("invoicePreparation")).get("snapshotFingerprint"))) {
            throw new ApplicationException("Invoice and parent preparation receipts differ");
        }
    }
    public void guardPreparedInvoiceExit(Invoice invoice, Map<String, Object> context) {
        if (Boolean.TRUE.equals(optionalMap(invoice.getMetadata() == null ? null : invoice.getMetadata().get(KEY)).get("preparationOnly"))) {
            throw new ApplicationException("Subscription invoice is preparation-only; submission and payment are disabled");
        }
    }
    public void guardPreparedInvoiceDelete(Invoice invoice, Map<String, Object> context) {
        if (Boolean.TRUE.equals(optionalMap(invoice.getMetadata() == null ? null : invoice.getMetadata().get(KEY)).get("preparationOnly"))) {
            throw new ApplicationException("Deleting this invoice would cascade to order items; operator reconciliation is required");
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> previewLines(Map<String, Object> preview) {
        if (preview.get("lines") instanceof List<?> lines) return (List<Map<String, Object>>) (List<?>) lines;
        // Existing base-plan-only drafts remain read-only recoverable; never silently add paid add-ons.
        return List.of(Map.of("role", "BASE_PLAN", "priceId", preview.get("priceId"),
                "productId", preview.get("planProductId"), "quantity", 1, "unitAmount", preview.get("planAmount")));
    }

    private Map<String, Object> marker(Map<String, Object> input) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (String key : List.of("sourceFormId", "inputDigest", "checkoutDigest", "catalogFingerprint", "addressId", "confirmationTokenId", "buyerAuthorizedAt")) result.put(key, input.get(key));
        if (input.containsKey("entitlementFingerprint")) result.put("entitlementFingerprint", input.get("entitlementFingerprint"));
        result.put("createdAt", Instant.now().toEpochMilli());
        return result;
    }

    private void requireReceipt(Map<String, Object> metadata, Map<String, Object> input) {
        Object value = metadata == null ? null : metadata.get(KEY);
        if (!(value instanceof Map<?, ?> receipt)
                || number(receipt.get("sourceFormId")) != number(input.get("sourceFormId"))
                || !text(input, "inputDigest").equals(receipt.get("inputDigest"))
                || !text(input, "checkoutDigest").equals(receipt.get("checkoutDigest"))
                || input.containsKey("entitlementFingerprint") && !input.get("entitlementFingerprint").equals(receipt.get("entitlementFingerprint"))) {
            throw new ApplicationException("Existing purchase receipt does not match this confirmed snapshot");
        }
    }

    private Map<String, Object> selection(Map<String, Object> input) {
        return Map.of("planProductId", number(input.get("planProductId")), "billingPeriod", text(input, "billingPeriod"),
                "addonProductIds", addons(input), "siteExpansionPacks", quantity(input, "siteExpansionPacks"),
                "weatherPropertyCount", quantity(input, "weatherPropertyCount"));
    }

    private String productName(Product product) {
        String name = product.getNls().getOrDefault("en", Map.of()).get("NAME");
        if (name == null || name.isBlank()) throw new ApplicationException("Selected product has no English display name");
        return name;
    }

    private Product product(Object id, Organization seller) {
        Product product = productManager.get(Math.toIntExact(number(id)));
        if (product == null || product.getType() == null || product.getOrganization() == null
                || !seller.getId().equals(product.getOrganization().getId())) throw new ApplicationException("Selected product is outside the selling catalog");
        entityManager.refresh(product);
        return product;
    }

    private Organization seller(Map<String, Object> input) {
        Organization org = organizationManager.get(Math.toIntExact(number(input.get("organizationId"))));
        if (org == null || !"SERVICEWAND".equals(org.getCode())) throw new ApplicationException("Only the ServiceWand selling organization is supported");
        return org;
    }

    private List<Long> addons(Map<String, Object> input) {
        if (!(input.get("addonProductIds") instanceof Collection<?> values)) throw new ApplicationException("Add-on selection is missing");
        Set<Long> ids = new LinkedHashSet<>();
        for (Object value : values) if (!ids.add(number(value))) throw new ApplicationException("Duplicate add-ons");
        return new ArrayList<>(ids);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> input(String source) {
        try {
            Map<String, Object> input = Json.defaultMapper().readValue(source, Map.class);
            number(input.get("sourceFormId")); number(input.get("verifiedAt")); number(input.get("addressId"));
            for (String key : List.of("inputDigest", "companyName", "email")) if (text(input, key).isBlank()) throw new IllegalArgumentException();
            return input;
        } catch (Exception failure) { throw new ApplicationException("Verified purchase payload is required"); }
    }

    private String setting(String key) {
        Script script = scriptManager.getByCode(SCRIPT);
        Object value = script == null || script.getMetadata() == null ? null : script.getMetadata().get(key);
        if (!(value instanceof String text) || text.isBlank()) throw new ApplicationException("Purchase helper configuration is missing");
        return text;
    }
    private <T> T asPurchaseExecutor(Supplier<T> action) {
        // Auth.isSystemUser() tests organization scope, not the caller's ID.
        // Compare the real persisted service identity, never the SYSTEM org alone.
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated purchase executor required");
        boolean service = transactionUtils.getInNewTx(() -> {
            User system = userManager.getSystemUser();
            return system != null && callerId.equals(system.getId());
        });
        if (!service) return asOperator(action); // Existing operator reconciliation path.
        return transactionUtils.getInNewTxRW(() -> {
            Organization seller = organizationManager.getByCode("SERVICEWAND");
            if (seller == null || Auth.getAuthenticatedOrganization() == null
                    || !seller.getId().equals(Auth.getAuthenticatedOrganization().getId())) {
                throw new ApplicationException("Purchase service executor must be scoped to the seller");
            }
            User stored = userManager.getSystemUser();
            User serviceUser = new User();
            serviceUser.setId(stored.getId()); serviceUser.setName(stored.getName()); serviceUser.setFullname(stored.getFullname());
            serviceUser.setRoles(new LinkedHashSet<>());
            return Auth.withUser(serviceUser, seller, action).get();
        });
    }

    private <T> T asOperator(Supplier<T> action) {
        if (Auth.getAuthenticatedUser() == null || Auth.getAuthenticatedOrganization() == null) {
            throw new ApplicationException("This backend purchase action requires a system administrator");
        }
        Integer userId = Auth.getAuthenticatedUser().getId();
        return transactionUtils.getInNewTxRW(() -> {
            // Queue principals can contain detached Role/Organization proxies.
            // Rebind the same caller from the database, never an elevated user.
            User caller = entityManager.find(User.class, userId);
            Organization org = entityManager.createQuery("SELECT o FROM Organization o WHERE o.code = :code", Organization.class)
                    .setParameter("code", "SYSTEM").getSingleResult();
            if (caller == null || org == null) throw new ApplicationException("Authenticated caller is no longer available");
            return Auth.withUser(caller, org, (Supplier<T>) () -> {
                if (!Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("This backend purchase action requires a system administrator");
                return action.get();
            }).get();
        });
    }
    private static String nullable(String value) { return value.isBlank() ? null : value; }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> objectMap(Object value) {
        if (!(value instanceof Map<?, ?>)) throw new ApplicationException("Saved purchase snapshot is missing");
        return (Map<String, Object>) value;
    }
    private static String text(Map<String, Object> input, String key) { Object value = input.get(key); return value == null ? "" : value.toString().trim(); }
    private static long number(Object value) {
        try { long result = new BigDecimal(value.toString()).longValueExact(); if (result <= 0) throw new IllegalArgumentException(); return result; }
        catch (Exception failure) { throw new ApplicationException("Positive purchase reference required"); }
    }
    private static String json(Object value) { try { return Json.defaultMapper().writeValueAsString(value); } catch (Exception failure) { throw new ApplicationException("Purchase snapshot cannot be serialized"); } }
    private static byte[] hashBytes(String value) { try { return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)); } catch (Exception failure) { throw new ApplicationException("Purchase fingerprint failed"); } }
    private static String digest(String value) { return HexFormat.of().formatHex(hashBytes(value)); }

    // BEGIN GENERATED ONBOARDING READINESS
    /** Pure evaluation of trusted purchase/model reads; never persists or activates anything. */
    public static final class OnboardingReadiness {
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
    // END GENERATED ONBOARDING READINESS

    // BEGIN GENERATED ONBOARDING EXECUTION
    /** Orchestrates trusted native ports. Browser/request payment flags are never inputs. */
    public static final class OnboardingExecution {
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
    // END GENERATED ONBOARDING EXECUTION

    // BEGIN GENERATED ONBOARDING NATIVE EXECUTOR
    private static final String ONBOARDING = "PLAN_SUBSCRIPTION_ONBOARDING";
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("organizationTypeManager") private com.pixelnation.common.persistence.iface.IOrganizationTypeManager onboardingOrganizationTypes;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("dictionaryTypeManager") private com.pixelnation.common.persistence.iface.IDictionaryTypeManager onboardingDictionaryTypes;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("documentManager") private com.pixelnation.common.persistence.iface.IDocumentManager onboardingDocuments;
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("documentTypeManager") private com.pixelnation.common.persistence.iface.IDocumentTypeManager onboardingDocumentTypes;
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
                if (password != null && !password.isBlank()) {
                    state.put("accessStatus", "DELIVERED"); state.put("credentialResult", "EXISTING_PASSWORD_UNCHANGED"); state.put("status", "CREDENTIALS_READY");
                    saveOnboarding(purchase, state); return null;
                }
                state.put("accessStatus", "RESET_STARTED"); saveOnboarding(purchase, state); return userId;
            }, true);
            if (reset == null) { deliverReadyMail(); return; }
            // generateNewPassword includes the platform's delivery. A timeout/exception is ambiguous:
            // RESET_STARTED is deliberately retained and must never cause an automatic second reset.
            try {
                if (!Boolean.TRUE.equals(asOnboardingNative(() -> onboardingUsers.generateNewPassword(reset)))) throw new ApplicationException("Password delivery returned false; operator reconciliation required");
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
                if ("QUEUED".equals(state.get("readyMailStatus"))) return Map.of();
                if (state.get("readyMailStatus") != null) throw new ApplicationException("Previous ready notification requires reconciliation; automatic resend forbidden");
                Map<String, Object> config = executorConfig();
                if (!Boolean.TRUE.equals(config.get("readyNotificationEnabled"))) throw new ApplicationException("Ready notification disabled");
                String login = text(config, "readyLoginUrl"); java.net.URI uri = java.net.URI.create(login);
                if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null) throw new ApplicationException("Configured HTTPS login URL required");
                state.put("readyMailStatus", "DISPATCHING"); saveOnboarding(purchase, state);
                return Map.of("recipient", text(objectMap(objectMap(state.get("plan")).get("source")), "email"), "url", login);
            }, true);
            if (mail.isEmpty()) return;
            String url = org.springframework.web.util.HtmlUtils.htmlEscape(text(mail, "url"));
            try {
            asOnboardingNative(() -> { onboardingMail.sendSimpleEmail(new String[]{text(mail,"recipient")}, "Your ServiceWand organization is ready",
                    "<p>Your ServiceWand organization is ready.</p><p><a href=\"" + url + "\">Open ServiceWand</a></p><p>Use your existing password, or follow the separate password setup email.</p>"); return true; });
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
        var orgType = onboardingOrganizationTypes.get(Math.toIntExact(number(orgSpec.get("typeId"))));
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
        var seasonType = onboardingDictionaryTypes.get(Math.toIntExact(number(seasonSpec.get("typeId"))));
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
        var existingUsers = userManager.selectJPQL("SELECT u FROM User u WHERE lower(u.name) = :email", Map.of("email", email.toLowerCase(java.util.Locale.ROOT)), User.class);
        if (existingUsers.size() > 1) throw new ApplicationException("Duplicate User login requires review");
        User admin = existingUsers.isEmpty() ? null : existingUsers.getFirst();
        if (admin == null) {
            admin = new User(); admin.setName(email); admin.setEmail(email); admin.setEnabled(true);
            String fullname=(text(buyer, "firstName") + " " + text(buyer, "lastName")).trim();
            admin.setFullname(fullname.isBlank()?email:fullname); admin.setRoles(new LinkedHashSet<>());
            admin.setLanguage(onboardingLanguages.getByCode2("en"));
            var workflows = entityManager.createQuery("SELECT w FROM Workflow w WHERE w.code = :code", com.pixelnation.modules.workflow.domain.Workflow.class)
                    .setParameter("code", "USER_WORKFLOW").getResultList();
            if (workflows.size() != 1 || admin.getLanguage() == null) throw new ApplicationException("User language/workflow unavailable");
            admin.setWorkflow(workflows.getFirst()); admin = userManager.save(admin);
        } else if (!email.equalsIgnoreCase(admin.getEmail()) || !Boolean.TRUE.equals(admin.getEnabled())) throw new ApplicationException("Existing User requires operator review");
        if (admin.getId().equals(userManager.getSystemUserId())) throw new ApplicationException("System service User cannot be a buyer administrator");
        Map<String, Object> administrator = objectMap(plan.get("administrator"));
        var role = onboardingRoles.get(Math.toIntExact(number(objectMap(administrator.get("role")).get("id"))));
        if (role == null || !"ADMIN".equals(role.getCode()) || role.getOrganization() == null || !"SYSTEM".equals(role.getOrganization().getCode())
                || "SYSTEM".equals(target.getCode()) || !target.getParent().getId().equals(parent.getId())
                || role.getPermissions().stream().anyMatch(permission -> "SYSTEM_ADMIN".equals(permission.getId()) || "SYSTEM_ADMIN".equals(permission.getName()))) throw new ApplicationException("Unsafe administrator assignment");
        final Organization assignmentTarget = target;
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
        Dictionary season = dictionaryManager.get(Math.toIntExact(number(records.get("seasonSettings"))));
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
        OrderType orderType = orderTypeManager.get(Math.toIntExact(number(serviceSpec.get("typeId"))));
        Order service = new Order(); service.setOrganization(target); service.setAccount(customer); service.setCurrency(purchase.getCurrency());
        initializeOnboardingEntity(service, orderType, "Snow removal");
        setOnboardingAttributes(service, orderType, objectMap(serviceSpec.get("attributes")), records);
        service.setNotes("Snow removal starter order. Pricing requires manager review.");
        service.setMetadata(new LinkedHashMap<>(Map.of(ONBOARDING, onboardingMarker(purchase, state), "PRICING_MODEL", "SEASONAL")));
        service = orderManager.save(service); orderManager.flush(); records.put("serviceOrder", service.getId());
        Map<String, Object> agreementSpec = artifact(state, "agreement");
        var agreementType = onboardingDocumentTypes.get(Math.toIntExact(number(agreementSpec.get("typeId"))));
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
            if (!String.valueOf(objectMap(artifact(state, "agreement").get("attributes")).get(field)).equals(String.valueOf(document.findFirstAttributeValue(field)))) throw new ApplicationException("Starter agreement season changed");
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
    // END GENERATED ONBOARDING NATIVE EXECUTOR

    // BEGIN GENERATED CHECKOUT TAX ASSIGNMENT
    public void assignSubscriptionTaxes(Order entity) {
        var billingAddress = entity.getAccount() == null ? null : entity.getAccount().getAddresses().stream()
            .filter(address -> address.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode())))
            .map(com.pixelnation.account.domain.AccountAddress::getAddress)
            .findFirst().orElse(null);
        var applicableTaxes = new java.util.HashMap<Integer, java.math.BigDecimal>();
        if (billingAddress != null && billingAddress.getCountry() != null) {
            var dictionaryManager = com.pixelnation.common.aspects.ApplicationContextProvider.getApplicationContext()
                .getBean(com.pixelnation.common.persistence.iface.IDictionaryManager.class);
            var taxes = dictionaryManager.page(0, Integer.MAX_VALUE, java.util.List.of(), java.util.List.of(
                new com.pixelnation.common.ui.domain.FilterClause("type.code",
                    com.pixelnation.common.ui.domain.FilterClause.EQ, "TAX")));
            for (var tax : taxes) {
                var typeId = tax.getType().getId();
                Object country = tax.getAttributeValue(typeId, "COUNTRY");
                Object state = tax.getAttributeValue(typeId, "STATE");
                Object percentage = tax.getAttributeValue(typeId, "PERCENTAGE");
                if (!java.util.Objects.equals(billingAddress.getCountry().getId(), country)) continue;
                if (state != null && (billingAddress.getState() == null
                    || !billingAddress.getState().getId().toString().equals(state.toString()))) continue;
                if (percentage != null) {
                    applicableTaxes.put(tax.getId(), new java.math.BigDecimal(percentage.toString()));
                }
            }
        }
        for (var item : entity.getItems()) {
            item.setApplicableTaxes(new java.util.HashMap<>(applicableTaxes));
        }
    }
    // END GENERATED CHECKOUT TAX ASSIGNMENT

    // BEGIN GENERATED CHECKOUT TAX PREVIEW
    private Map<String,Object> previewTaxes(Map<String,Object> source,Map<String,Object> preview) {
        if(source.get("addressId")==null)return Map.of("status","ADDRESS_REQUIRED","source","NATIVE_ORDER_TAXES");
        Address address=addressManager.get(Math.toIntExact(number(source.get("addressId"))));
        if(address==null || address.getCountry()==null || !"CA".equals(address.getCountry().getCode2()))return Map.of("status","COUNTRY_NOT_SUPPORTED","source","NATIVE_ORDER_TAXES");
        Account account=new Account();AccountAddress link=new AccountAddress();link.setAccount(account);link.setAddress(address);
        var billing=addressTypeManager.getByCode("BILLING");if(billing==null)throw new ApplicationException("Billing address type unavailable");
        link.getTypes().add(billing);account.getAddresses().add(link);
        Order order=new Order();order.setOrganization(seller(source));order.setAccount(account);order.setCurrency(dictionaryManager.get(Math.toIntExact(number(preview.get("currencyId")))));
        for(Map<String,Object> line:previewLines(preview)) {
            OrderItem item=new OrderItem();item.setOrder(order);item.setOrganization(order.getOrganization());item.setAmount(new BigDecimal(line.get("unitAmount").toString()));
            item.setItemCount(Math.toIntExact(number(line.get("quantity"))));order.getItems().add(item);
        }
        // Same assignment function as the real Order workflow; native totals own the arithmetic.
        // The account/order/items above are transient Java objects, never saved or merged.
        assignSubscriptionTaxes(order);
        return inspectConfiguredTaxes(order);
    }
    // END GENERATED CHECKOUT TAX PREVIEW

    // BEGIN GENERATED PURCHASE READ ACCESS POLICY
    /** Server-authored access specification. It never accepts client mappings or permissions. */
    public static final class PurchaseReadAccess {
        public static List<Map<String,Object>> orderMappings() {
            return List.of(leaf("id"),node("currency","identifier",List.of(leaf("id"),leaf("code"),leaf("nls"))),
                    node("items","collection",List.of(leaf("id"))),node("states","collection",List.of(leaf("id"),leaf("code"),leaf("nls"))),
                    node("type","identifier",List.of(leaf("id"),leaf("code"),leaf("nls"))),leaf("totalCharges"),leaf("totalTaxes"),leaf("grandTotal"));
        }
        public static List<Map<String,Object>> itemMappings() {
            return List.of(leaf("id"),leaf("itemCount"),leaf("amount"),node("itemPrice","identifier",List.of(leaf("id"),leaf("nls"))),
                    node("order","identifier",List.of(leaf("id"))),node("type","identifier",List.of(leaf("id"),leaf("code"),leaf("nls"))));
        }
        public static List<Map<String,Object>> priceMappings() {
            return List.of(leaf("id"),node("product","identifier",List.of(leaf("id"),leaf("nls"))));
        }
        private static Map<String,Object> leaf(String name){return Map.of("name",name,"type","primitive");}
        private static Map<String,Object> node(String name,String type,List<Map<String,Object>> children){return Map.of("name",name,"type",type,"mappings",children);}
        @SuppressWarnings("unchecked")
        public static List<Map<String,Object>> narrow(List<Map<String,Object>> requested,List<Map<String,Object>> effective) {
            List<Map<String,Object>> result=new ArrayList<>();
            for(var wanted:requested) {
                var matches=effective.stream().filter(field->wanted.get("name").equals(field.get("name"))).toList();
                if(matches.size()!=1 || !wanted.get("type").equals(matches.get(0).get("type")))throw new IllegalArgumentException("Purchase read mapping is unavailable");
                Map<String,Object> actual=new java.util.LinkedHashMap<>(matches.get(0));
                if(wanted.containsKey("mappings"))actual.put("mappings",narrow((List<Map<String,Object>>)wanted.get("mappings"),(List<Map<String,Object>>)actual.get("mappings")));
                else actual.remove("mappings");
                result.add(actual);
            }
            return result;
        }
        public static List<Map<String,Object>> entries(long orderId,List<Long> itemIds,List<Long> priceIds) {
            if(orderId<=0 || itemIds.isEmpty() || itemIds.size()>3 || itemIds.stream().anyMatch(id->id==null || id<=0)
                    || new LinkedHashSet<>(itemIds).size()!=itemIds.size())throw new IllegalArgumentException("Exact order and unique item IDs required");
            if(priceIds.isEmpty() || priceIds.size()>itemIds.size() || priceIds.stream().anyMatch(id->id==null || id<=0)
                    || new LinkedHashSet<>(priceIds).size()!=priceIds.size())throw new IllegalArgumentException("Exact unique item price IDs required");
            List<Map<String,Object>> result=new ArrayList<>();
            result.add(Map.of("entityType","Order","entityId",orderId,"permissions",List.of("P_ORDER_R"),"readMappings",orderMappings(),"writeMappings",List.of()));
            itemIds.stream().sorted().forEach(id->result.add(Map.of("entityType","OrderItem","entityId",id,"permissions",List.of("P_ORDER_R"),"readMappings",itemMappings(),"writeMappings",List.of())));
            priceIds.stream().sorted().forEach(id->result.add(Map.of("entityType","ProductPrice","entityId",id,"permissions",List.of("P_PRICE_R"),"readMappings",priceMappings(),"writeMappings",List.of())));
            return result;
        }
        public static int ttlHours(Object value) {
            if(!(value instanceof Number n) || n.doubleValue()!=n.intValue() || n.intValue()<1 || n.intValue()>24)throw new IllegalArgumentException("Access lifetime must be 1–24 hours");
            return n.intValue();
        }
        public static String pageUrl(Object raw) {
            if(raw==null || String.valueOf(raw).isBlank())return null;
            URI uri=URI.create(String.valueOf(raw));
            if(!"https".equals(uri.getScheme()) || uri.getHost()==null || uri.getUserInfo()!=null || uri.getRawFragment()!=null || uri.getRawQuery()!=null)
                throw new IllegalArgumentException("A configured HTTPS purchase page without query or fragment is required");
            return uri.toASCIIString();
        }
        public static String link(String page,long orderId,String token) {
            String base=pageUrl(page);if(base==null || orderId<=0 || token==null || token.isBlank())throw new IllegalArgumentException("Purchase link data missing");
            return base+"#orderId="+orderId+"&token="+URLEncoder.encode(token,StandardCharsets.UTF_8);
        }
        public static boolean mayIssue(Map<String,Object> previous) { return previous.isEmpty() || "WAITING_FOR_PURCHASE_PAGE_URL".equals(previous.get("status")); }
        public static Map<String,Object> publicReceipt(Map<String,Object> stored) {
            Map<String,Object> out=new java.util.LinkedHashMap<>();
            for(String key:List.of("status","orderId","grantId","issuedAt","expiresAt","deliveryStatus"))if(stored.containsKey(key))out.put(key,stored.get(key));
            if("DISPATCHING".equals(out.get("status")))out.put("status","RECONCILIATION_REQUIRED");
            out.put("paymentEnabled",false);out.put("readOnly",true);return out;
        }
    }
    // END GENERATED PURCHASE READ ACCESS POLICY

    // BEGIN GENERATED PURCHASE READ ACCESS NATIVE
    private static final String PURCHASE_READ_ACCESS = "PLAN_SUBSCRIPTION_READ_ACCESS";
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("grantService")
    private com.pixelnation.modules.grant.service.iface.IGrantService purchaseGrantService;

    /** Protected server command: raw capability never crosses the Script result boundary. */
    public Map<String,Object> deliverPurchaseReadAccess(String payloadJson) {
        Map<String,Object> source=input(payloadJson);
        PurchaseAccessMail mail=asPurchaseExecutor(()->{
            Order order=readAccessOrder(source);
            Map<String,Object> previous=optionalMap(order.getMetadata().get(PURCHASE_READ_ACCESS));
            if(!PurchaseReadAccess.mayIssue(previous))return new PurchaseAccessMail(previous,null,null);
            Map<String,Object> config=purchaseAccessConfig();
            if(!Boolean.TRUE.equals(config.get("enabled")))throw new ApplicationException("Purchase read access disabled");
            int hours=PurchaseReadAccess.ttlHours(config.get("ttlHours"));
            String page=PurchaseReadAccess.pageUrl(config.get("pageUrl"));
            if(page==null){
                Map<String,Object> waiting=new LinkedHashMap<>();waiting.put("status","WAITING_FOR_PURCHASE_PAGE_URL");waiting.put("orderId",order.getId());
                saveReadAccess(order,waiting);return new PurchaseAccessMail(waiting,null,null);
            }
            // IDs and mappings are exclusively native/server-authored. No Account or arbitrary JSON read access.
            List<Long> itemIds=order.getItems().stream().map(item->item.getId().longValue()).sorted().toList();
            var issued=issuePurchaseReadGrant(order,hours);
            Map<String,Object> saved=new LinkedHashMap<>();saved.put("status","DISPATCHING");saved.put("deliveryStatus","DISPATCHING");
            saved.put("orderId",order.getId());saved.put("grantId",issued.id());saved.put("issuedAt",Instant.now().toEpochMilli());
            saved.put("expiresAt",issued.expiresAt().toString());saved.put("sourceFormId",source.get("sourceFormId"));
            saved.put("checkoutDigest",source.get("checkoutDigest"));saved.put("itemIds",itemIds);saved.put("recipientDigest",digest(text(source,"email")));
            saveReadAccess(order,saved);
            return new PurchaseAccessMail(saved,text(source,"email"),PurchaseReadAccess.link(page,order.getId(),issued.token()));
        });
        if(mail.link()==null)return PurchaseReadAccess.publicReceipt(mail.receipt());
        boolean queued=false;
        try {
            String href=org.springframework.web.util.HtmlUtils.htmlEscape(mail.link());
            onboardingMail.sendSimpleEmail(new String[]{mail.recipient()},"Your ServiceWand purchase",
                    "<p>Your subscription request has been confirmed and its draft order is ready.</p>"
                    +"<p><a href=\""+href+"\">View your purchase</a></p>"
                    +"<p>This private link permits viewing this purchase only. It expires within 24 hours; do not forward it.</p>"
                    +"<p>No payment has been taken. Changes require a new request or assistance from ServiceWand.</p>");
            queued=true;
        } catch(Exception ignored) { /* The mail may have been queued: revoke the capability before any manual retry. */ }
        boolean delivered=queued;
        // Revocation commits independently: a later Order validation/save failure must not restore a live unknown link.
        boolean revoked=!delivered && revokeIssuedPurchaseAccess(source,number(mail.receipt().get("grantId")));
        try{return asPurchaseExecutor(()->{
            Order order=readAccessOrder(source);Map<String,Object> saved=optionalMap(order.getMetadata().get(PURCHASE_READ_ACCESS));
            if(number(saved.get("grantId"))!=number(mail.receipt().get("grantId")) || !"DISPATCHING".equals(saved.get("status")))
                throw new ApplicationException("Purchase access delivery receipt changed; reconcile manually");
            saved=new LinkedHashMap<>(saved);
            if(delivered){saved.put("status","QUEUED");saved.put("deliveryStatus","QUEUED");}
            else {
                saved.put("status",revoked?"REVOKED_DELIVERY_OUTCOME_UNKNOWN":"RECONCILIATION_REQUIRED");saved.put("deliveryStatus","OUTCOME_UNKNOWN");
            }
            saveReadAccess(order,saved);return PurchaseReadAccess.publicReceipt(saved);
        });}catch(Exception failure){
            // Keep the persisted DISPATCHING marker if completion cannot be recorded. Never reissue automatically.
            if(delivered)revokeIssuedPurchaseAccess(source,number(mail.receipt().get("grantId")));
            return Map.of("status","RECONCILIATION_REQUIRED","readOnly",true,"paymentEnabled",false);
        }
    }

    public Map<String,Object> readPurchaseReadAccess(String payloadJson) {
        Map<String,Object> source=input(payloadJson);
        return asPurchaseExecutor(()->{
            Order order=readAccessOrder(source);Map<String,Object> saved=optionalMap(order.getMetadata().get(PURCHASE_READ_ACCESS));
            if(saved.isEmpty())return Map.of("status","NOT_ISSUED","readOnly",true,"paymentEnabled",false);
            Map<String,Object> view=new LinkedHashMap<>(PurchaseReadAccess.publicReceipt(saved));
            if("QUEUED".equals(view.get("status")) && !LocalDateTime.parse(String.valueOf(saved.get("expiresAt"))).isAfter(LocalDateTime.now()))view.put("status","EXPIRED");
            return view;
        });
    }
    private record PurchaseAccessMail(Map<String,Object> receipt,String recipient,String link) {}

    private boolean revokeIssuedPurchaseAccess(Map<String,Object> source,long grantId) {
        try{return asPurchaseExecutor(()->asPurchaseGrantIssuer(seller(source),()->purchaseGrantService.revoke(grantId)));}
        catch(Exception ignored){return false;}
    }

    @SuppressWarnings("unchecked")
    private com.pixelnation.modules.grant.controller.dto.AccessGrantIssueResponse issuePurchaseReadGrant(Order order,int hours) {
        PurchaseReadAccess.ttlHours(hours);
        List<Long> itemIds=order.getItems().stream().map(item->item.getId().longValue()).sorted().toList();
        List<Long> priceIds=order.getItems().stream().map(item->{
            if(item.getItemPrice()==null || item.getItemPrice().getId()==null)throw new ApplicationException("Purchase item price missing");
            return item.getItemPrice().getId().longValue();
        }).distinct().sorted().toList();
            List<com.pixelnation.modules.grant.controller.dto.AccessGrantIssueEntryRequest> entries=new ArrayList<>();
            Map<String,Map<String,Object>> profiles=new LinkedHashMap<>();
            for(Map<String,Object> spec:PurchaseReadAccess.entries(order.getId(),itemIds,priceIds)) {
                String entityType=String.valueOf(spec.get("entityType"));
                Map<String,Object> profile=profiles.computeIfAbsent(entityType,type->asPurchaseGrantIssuer(order.getOrganization(),()->{
                    var request=Json.defaultMapper().convertValue(Map.of("entityType",type,"operations",List.of("READ")),com.pixelnation.modules.grant.controller.dto.AccessGrantMappingsRequest.class);
                    return Json.defaultMapper().convertValue(purchaseGrantService.mappings(request),new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
                }));
                Map<String,Object> readSet=collection(profile.get("sets")).stream().map(this::optionalMap).filter(set->"READ".equals(set.get("operation"))).findFirst()
                        .orElseThrow(()->new ApplicationException("Purchase READ mapping unavailable"));
                List<Map<String,Object>> narrowed=PurchaseReadAccess.narrow((List<Map<String,Object>>)spec.get("readMappings"),
                        collection(readSet.get("mappings")).stream().map(this::optionalMap).toList());
                List<com.pixelnation.common.domain.ui.Mapping> mappings=Json.defaultMapper().convertValue(narrowed,
                        new com.fasterxml.jackson.core.type.TypeReference<List<com.pixelnation.common.domain.ui.Mapping>>(){});
                entries.add(com.pixelnation.modules.grant.controller.dto.AccessGrantIssueEntryRequest.of(
                        entityType,(java.io.Serializable)spec.get("entityId"),(List<String>)spec.get("permissions"),number(profile.get("mappingDefinitionId")),mappings,List.of()));
            }
            return asPurchaseGrantIssuer(order.getOrganization(),()->purchaseGrantService.issue(
                    com.pixelnation.modules.grant.controller.dto.AccessGrantIssueRequest.of(LocalDateTime.now().plusHours(hours),entries)));
    }

    private Order readAccessOrder(Map<String,Object> source) {
        Organization owner=seller(source);
        Order order=orderManager.get(number(source.get("orderId")));
        if(order==null)throw new ApplicationException("Confirmed purchase order missing");
        lockOnboarding(order.getId());
        entityManager.refresh(order,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        Account account=order.getAccount();
        if(account==null || account.getOrganization()==null || order.getOrganization()==null || order.getType()==null
                || !owner.getId().equals(order.getOrganization().getId()) || !owner.getId().equals(account.getOrganization().getId())
                || account.getId().longValue()!=number(source.get("accountId")) || !setting("ORDER_TYPE_CODE").equals(order.getType().getCode())
                || account.getType()==null || !setting("ACCOUNT_TYPE_CODE").equals(account.getType().getCode()) || !order.hasState("DRAFT"))
            throw new ApplicationException("Confirmed seller subscription draft required");
        requireReceipt(order.getMetadata(),source);requireReceipt(account.getMetadata(),source);receipt(account,order);
        Map<String,Object> proof=objectMap(order.getMetadata().get(KEY));
        if(number(proof.get("confirmationTokenId"))!=number(source.get("confirmationTokenId"))
                || number(proof.get("buyerAuthorizedAt"))!=number(source.get("buyerAuthorizedAt")) || number(source.get("buyerAuthorizedAt"))<=0
                || account.getContacts().stream().flatMap(contact->contact.getContactEntries().stream()).noneMatch(entry->
                    entry.getType()!=null && "EMAIL".equals(entry.getType().getCode()) && text(source,"email").equals(entry.getValue())))
            throw new ApplicationException("Verified recipient and persisted purchase consent required");
        return order;
    }
    private void saveReadAccess(Order order,Map<String,Object> value) {
        Map<String,Object> metadata=new LinkedHashMap<>(order.getMetadata());metadata.put(PURCHASE_READ_ACCESS,value);order.setMetadata(metadata);orderManager.save(order);
    }
    private Map<String,Object> purchaseAccessConfig() {
        Script script=scriptManager.getByCode(SCRIPT);return objectMap(script.getMetadata().get("PURCHASE_READ_ACCESS_CONFIG"));
    }
    private <T> T asPurchaseGrantIssuer(Organization owner,Supplier<T> action) {
        User caller=Auth.getAuthenticatedUser();
        if(caller==null || !userManager.getSystemUserId().equals(caller.getId()) || owner==null || !"SERVICEWAND".equals(owner.getCode()))
            throw new ApplicationException("Only the trusted purchase system executor may issue access");
        var previous=org.springframework.security.core.context.SecurityContextHolder.getContext();
        var scoped=org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        List<org.springframework.security.core.GrantedAuthority> authorities=List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("P_GRANT_W"),
                new org.springframework.security.core.authority.SimpleGrantedAuthority("P_ORDER_R"),new org.springframework.security.core.authority.SimpleGrantedAuthority("P_PRICE_R"));
        scoped.setAuthentication(new com.pixelnation.spring.security.RunAsAuthenticationToken(userManager.getSystemUser(),owner,authorities));
        try{org.springframework.security.core.context.SecurityContextHolder.setContext(scoped);return action.get();}
        finally{org.springframework.security.core.context.SecurityContextHolder.setContext(previous);}
    }
    // END GENERATED PURCHASE READ ACCESS NATIVE
}
