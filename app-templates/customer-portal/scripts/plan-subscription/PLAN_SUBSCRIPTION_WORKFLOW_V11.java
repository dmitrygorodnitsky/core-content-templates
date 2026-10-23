package com.pixelnation.cms.generated;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.domain.Organization;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.util.HtmlUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.pixelnation.cms.domain.Form;
import com.pixelnation.cms.domain.FormToken;
import com.pixelnation.cms.persistence.iface.IFormManager;
import com.pixelnation.cms.persistence.iface.IFormTokenManager;
import com.pixelnation.cms.service.iface.IFormService;
import com.pixelnation.common.domain.Script;
import com.pixelnation.common.domain.Address;
import com.pixelnation.common.domain.Country;
import com.pixelnation.common.domain.State;
import com.pixelnation.common.cluster.CapabilitiesResolver;
import com.pixelnation.common.script.ScriptService;
import com.pixelnation.common.script.ScriptService.ExecutionStatus;
import com.pixelnation.common.persistence.iface.IOrganizationManager;
import com.pixelnation.common.persistence.iface.IUserManager;
import com.pixelnation.common.persistence.iface.ICountryManager;
import com.pixelnation.common.persistence.iface.IStateManager;
import com.pixelnation.common.service.iface.IAddressService;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.json.Json;
import com.pixelnation.common.persistence.iface.IScriptManager;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.Hashing;
import com.pixelnation.common.util.ScriptUtils;
import com.pixelnation.common.util.TransactionUtils;
import com.pixelnation.modules.workflow.service.iface.IWorkflowService;
import jakarta.persistence.LockModeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

public class MAIN_CLASS {
    private static final String SCRIPT = "PLAN_SUBSCRIPTION_WORKFLOW_V11";
    private static final String KEY = "PLAN_SUBSCRIPTION";
    private static final String VERIFY = "VERIFY_EMAIL";
    private static final List<String> FIELDS = List.of("PLAN_PRODUCT", "BILLING_PERIOD",
            "ADDON_PRODUCTS", "COMPANY_NAME", "COMPANY_ADDRESS", "FIRST_NAME", "LAST_NAME",
            "EMAIL", "PHONE", "SITE_EXPANSION_PACKS", "WEATHER_PROPERTY_COUNT");
    private static final Pattern CANADIAN_POSTAL_CODE = Pattern.compile(
            "(?i)\\b([A-Z]\\d[A-Z])\\s*(\\d[A-Z]\\d)\\b");
    private static final Pattern US_POSTAL_CODE = Pattern.compile(
            "\\b(\\d{5}(?:-\\d{4})?)\\b");
    private static final Pattern LEADING_NUMERIC_POSTAL = Pattern.compile(
            "^(\\d{3,10}(?:-\\d{2,6})?)\\s+(.+)$");
    private static final Pattern TRAILING_NUMERIC_POSTAL = Pattern.compile(
            "^(.+?)\\s+(\\d{3,10}(?:-\\d{2,6})?)$");
    private static final Pattern UNIT_ONLY = Pattern.compile(
            "(?i)^(?:APARTMENT|APPARTMENT|APPT|APT|SUITE|STE|UNIT|FLAT|ROOM|RM|#)\\s*([\\p{L}\\p{N}-]+)$");
    private static final Pattern LEADING_UNIT_AND_STREET = Pattern.compile(
            "(?i)^(?:APARTMENT|APPARTMENT|APPT|APT|SUITE|STE|UNIT|FLAT|ROOM|RM|#)\\s*([\\p{L}\\p{N}]+(?:-[\\p{L}\\p{N}]+)*)\\s*[-/]\\s*(.+)$");

    @Autowired private IAddressService addressService;
    @Autowired private ICountryManager countryManager;
    @Autowired private IStateManager stateManager;
    @Autowired private IFormManager formManager;
    @Autowired private IFormTokenManager tokenManager;
    @Autowired private IFormService formService;
    @Autowired private IScriptManager scriptManager;
    @Autowired private IWorkflowService workflowService;
    @Autowired private TransactionUtils transactionUtils;
    @Autowired private ScriptUtils scriptUtils;
    @Autowired private ScriptService scriptService;
    @Autowired private CapabilitiesResolver capabilitiesResolver;
    @Autowired private IOrganizationManager organizationManager;
    @Autowired private IUserManager userManager;
    @PersistenceContext private EntityManager entityManager;

    public Map<String, Object> inspectConfiguration() {
        Map<String, Object> config = config();
        requireHttps(setting(config, "PIM_CATALOG_URL"));
        requireHttps(setting(config, "PUBLIC_FORM_API_URL"));
        if (entityManager == null) throw new ApplicationException("Verification persistence context is missing");
        asSystem(() -> findCommittedSubmissions("00000000-0000-0000-0000-000000000000"));
        return Map.of("linkTtlHours", number(config.get("LINK_TTL_HOURS"), "Link lifetime"),
                "catalogValidation", "VALIDATED", "checkoutPreparationEnabled", true,
                "checkoutAccess", "ONE_TIME_FORM_TOKENS_SYSTEM_EXECUTION", "paymentEnabled", false);
    }

    public void onSubmitted(Form form, Map<String, Object> context) {
        validateScope(form);
        validateFields(form);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("inputDigest", inputDigest(form));
        data.put("catalogValidation", "PENDING");
        data.put("quantityValidation", "PENDING");
        data.put("companyAddress", Map.of("status", "PENDING"));
        data.put("mailStatus", "NOT_PREPARED");
        putData(form, data);
        String requestId = UUID.randomUUID().toString();
        data.put("preparationRequestId", requestId);
        putData(form, data);
        // A new Form passed to onEnter can be detached from the managed object
        // which receives its ID. Resolve only the committed, server-correlated
        // row; never carry that object or the anonymous request principal onward.
        Thread.startVirtualThread(() -> prepareCommittedSubmission(requestId));
    }

    private void prepareCommittedSubmission(String requestId) {
        Long id = null;
        try {
            long deadline = System.nanoTime() + Duration.ofSeconds(30).toNanos();
            while (id == null) {
                id = asSystem(() -> {
                    List<Long> matches = findCommittedSubmissions(requestId);
                    if (matches.size() > 1) throw new ApplicationException("Duplicate intake correlation requires operator review");
                    return matches.isEmpty() ? null : matches.get(0);
                });
                if (id == null) {
                    if (System.nanoTime() >= deadline) return; // Rolled-back submission has no committed row or side effects.
                    Thread.sleep(100);
                }
            }
            Long committedId = id;
            asSystem(() -> { prepare(committedId); return null; });
        } catch (Exception failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            Long committedId = id;
            if (committedId != null) asSystem(() -> {
                Form saved = formManager.get(committedId, LockModeType.PESSIMISTIC_WRITE);
                if (saved != null && saved.hasState("SUBMITTED")) {
                    Map<String, Object> current = data(saved);
                    current.put("preparationError", "Deferred preparation failed: " + safeMessage(failure));
                    putData(saved, current); formManager.save(saved);
                    workflowService.sendEventUnsecured("PREPARATION_FAILED", saved, Map.of());
                }
                return null;
            });
        }
    }

    private List<Long> findCommittedSubmissions(String requestId) {
        return entityManager.createQuery(
                "SELECT f.id FROM Form f WHERE f.type.code = :type AND f.organization.code = :owner "
                + "AND cast(function('jsonb_extract_path_text', f.metadata, 'PLAN_SUBSCRIPTION', 'preparationRequestId') as string) = :request",
                Long.class).setParameter("type", "PLAN_SUBSCRIPTION").setParameter("owner", "SERVICEWAND")
                .setParameter("request", requestId).getResultList();
    }

    public void guardUpdate(Form form, Map<String, Object> context) {
        validateScope(form);
        Map<String, Object> data = data(form);
        if (data.containsKey("inputDigest") && !inputDigest(form).equals(data.get("inputDigest"))) {
            throw new ApplicationException("Purchase details changed; submit a new form to verify its email");
        }
    }

    public void onAwaitingEmail(Form form, Map<String, Object> context) {
        validateScope(form);
        requireResolvedCompanyAddress(form, data(form));
        if (!data(form).containsKey("tokenId")) {
            throw new ApplicationException("Email verification was not prepared");
        }
    }

    public void onVerified(Form form, Map<String, Object> context) {
        validateScope(form);
        VerificationSnapshot current = transactionUtils.getInNewTx(() -> {
            Form persisted = formManager.get(form.getId());
            if (persisted == null) throw new ApplicationException("Submitted form was removed");
            entityManager.refresh(persisted);
            validateScope(persisted);
            return new VerificationSnapshot(data(persisted), inputDigest(persisted), digest(text(persisted, "EMAIL")));
        });
        Map<String, Object> data = current.data();
        requireResolvedCompanyAddress(form, data);
        if (!inputDigest(form).equals(data.get("inputDigest"))
                || !current.inputDigest().equals(data.get("inputDigest"))
                || !current.emailDigest().equals(data.get("emailDigest"))) {
            throw new ApplicationException("Purchase details or email changed; verification is required again");
        }
        if (Instant.now().toEpochMilli() >= number(data.get("expiresAt"), "Verification expiry")) {
            throw new ApplicationException("Email verification link expired; submit the form again");
        }
        if (data.containsKey("verifiedAt")) {
            throw new ApplicationException("Email has already been verified");
        }
        requireConsumedToken(form, number(data.get("tokenId"), "Verification token"), VERIFY);
        // Core consumes the native token before the asynchronous workflow hook.
        // The persisted verification marker and terminal state also guard re-entry.
        data.put("verifiedAt", Instant.now().toEpochMilli());
        // Final catalog/quantity validation still gates payment after email confirmation.
        data.put("catalogValidation", "VALIDATED");
        putData(form, data);
    }

    public Map<String, Object> prepareCheckout(Integer formId) {
        try { return asPurchaseExecutor(() -> {
            Form form = purchaseForm(formId);
            Map<String, Object> data = data(form);
            requireVerified(form, data);
            if (form.hasState("DRAFT_ORDER_READY")) return checkoutView(form, data);
            if (!form.hasState("EMAIL_VERIFIED_MODEL_PENDING") && !form.hasState("CHECKOUT_PREPARED")) {
                throw new ApplicationException("Form is not ready to prepare Checkout");
            }
            validateFields(form);
            validateProducts(form);
            Map<String, Object> preview = draftAction("preview", purchasePayload(form, data));
            String fingerprint = String.valueOf(preview.get("catalogFingerprint"));
            if (!fingerprint.matches("[a-f0-9]{64}")) throw new ApplicationException("Catalog preview fingerprint is missing");
            requireEntitlementSnapshot(preview);
            Map<String, Object> previous = map(data.get("checkout"));
            boolean changed = !fingerprint.equals(previous.get("catalogFingerprint"));
            boolean replaceConfirmation = changed && map(data.get("confirmation")).containsKey("tokenId");
            if (replaceConfirmation) {
                Map<String, Object> superseded = new LinkedHashMap<>(map(data.get("confirmation")));
                superseded.remove("devCapturedToken");
                superseded.put("invalidatedAt", Instant.now().toEpochMilli());
                superseded.put("reason", "CHECKOUT_REFRESHED");
                data.put("supersededConfirmation", superseded);
                data.remove("confirmation");
            }
            Map<String, Object> checkout = new LinkedHashMap<>();
            checkout.put("status", "PREPARED");
            checkout.put("catalogFingerprint", fingerprint);
            checkout.put("entitlementFingerprint", preview.get("entitlementFingerprint"));
            checkout.put("checkoutDigest", digest(data.get("inputDigest") + "|" + fingerprint));
            checkout.put("preparedAt", Instant.now().toEpochMilli());
            checkout.put("executionIdentity", userManager.getSystemUserId().equals(Auth.getAuthenticatedUser().getId()) ? "SYSTEM" : "OPERATOR");
            checkout.put("executionUserId", Auth.getAuthenticatedUser().getId());
            checkout.put("executionSystemAdmin", Auth.isAuthenticatedSystemAdmin());
            checkout.put("preview", preview);
            data.put("checkout", checkout);
            if (!data.containsKey("checkoutRevision")) data.put("checkoutRevision", 1);
            else if (changed) data.put("checkoutRevision", Math.addExact(number(data.get("checkoutRevision"), "Checkout revision"),1));
            data.remove("checkoutPreparationError");
            putData(form, data);
            formManager.save(form);
            if (form.hasState("EMAIL_VERIFIED_MODEL_PENDING")) {
                workflowService.sendEventUnsecured("PREPARE_CHECKOUT", form, Map.of());
            } else if (replaceConfirmation) {
                // An explicit operator refresh can request fresh consent, without
                // automatically resending a failed or ambiguous email delivery.
                afterState(form, "CHECKOUT_PREPARED", () -> { issueConfirmation(form.getId()); return null; });
            }
            return checkoutView(form, data);
        }); } catch (Exception failure) {
            recordPurchaseFailure(formId, "checkoutPreparationError", failure);
            throw failure;
        }
    }

    public Map<String, Object> prepareInvoice(Integer formId, String checkoutDigest) {
        return confirmPurchaseInternal(formId, checkoutDigest, true);
    }

    public Map<String, Object> confirmPurchase(Integer formId, String checkoutDigest) {
        return confirmPurchaseInternal(formId, checkoutDigest, false);
    }

    public Map<String, Object> readPurchaseStatus(Integer formId, String checkoutDigest) {
        return onboardingCommand(formId, checkoutDigest, "readOnboardingStatus");
    }
    public Map<String, Object> deliverPurchaseReadAccess(Integer formId, String checkoutDigest) {
        return onboardingCommand(formId, checkoutDigest, "deliverPurchaseReadAccess");
    }
    public Map<String, Object> readPurchaseReadAccess(Integer formId, String checkoutDigest) {
        return onboardingCommand(formId, checkoutDigest, "readPurchaseReadAccess");
    }
    public Map<String, Object> prepareOnboarding(Integer formId, String checkoutDigest) {
        return onboardingCommand(formId, checkoutDigest, "prepareOnboarding");
    }
    public Map<String, Object> provisionOnboarding(Integer formId, String checkoutDigest) {
        return onboardingCommand(formId, checkoutDigest, "provisionOnboarding");
    }
    public Map<String, Object> checkOnboardingReadiness(Integer formId, String checkoutDigest) {
        return onboardingCommand(formId, checkoutDigest, "checkOnboardingReadiness");
    }
    private Map<String, Object> onboardingCommand(Integer formId, String checkoutDigest, String method) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null || formId == null || formId <= 0) throw new ApplicationException("Authenticated readiness command and Form ID required");
        return asReadinessExecutor(() -> {
            Form form = formManager.get(formId.longValue());
            if (form != null) entityManager.refresh(form);
            validateScope(form);
            Map<String, Object> saved = data(form);
            requirePurchaseConsent(form, saved);
            Map<String, Object> checkout = map(saved.get("checkout")), purchase = map(saved.get("purchase"));
            if (!form.hasState("DRAFT_ORDER_READY") || !"DRAFT_ORDER_READY".equals(purchase.get("status"))
                    || checkoutDigest == null || !checkoutDigest.equals(checkout.get("checkoutDigest"))) {
                throw new ApplicationException("Readiness requires this Form's confirmed draft purchase and Checkout digest");
            }
            if (!"CA".equals(map(saved.get("companyAddress")).get("countryCode"))) throw new ApplicationException("Onboarding readiness currently supports CA only");
            Map<String, Object> payload = purchasePayload(form, saved);
            payload.put("companyAddressText", text(form, "COMPANY_ADDRESS"));
            payload.put("checkoutDigest", checkoutDigest); payload.put("catalogFingerprint", checkout.get("catalogFingerprint"));
            payload.put("accountId", purchase.get("accountId")); payload.put("orderId", purchase.get("orderId"));
            payload.put("invoiceId", purchase.get("invoiceId"));
            payload.put("confirmationTokenId", map(saved.get("confirmation")).get("tokenId"));
            payload.put("buyerAuthorizedAt", map(saved.get("confirmation")).get("authorizedAt"));
            if (checkout.containsKey("entitlementFingerprint")) {
                payload.put("entitlementFingerprint", checkout.get("entitlementFingerprint"));
                payload.put("entitlementSnapshot", map(checkout.get("preview")).get("entitlements"));
            }
            // Only trusted persisted data crosses to billing. No Form save, catalog
            // refresh, draft recovery, token/mail issuance or provisioning side effect.
            return asSystem(() -> draftAction(method, payload));
        });
    }

    private <T> T asReadinessExecutor(Supplier<T> action) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated readiness executor required");
        return transactionUtils.getInNewTx(() -> {
            User caller = entityManager.find(User.class, callerId);
            boolean service = callerId.equals(userManager.getSystemUserId());
            Organization scope = organizationManager.getByCode(service ? "SERVICEWAND" : "SYSTEM");
            if (caller == null || scope == null) throw new ApplicationException("Readiness executor context is unavailable");
            User principal = caller;
            if (service) {
                principal = new User(); principal.setId(caller.getId()); principal.setName(caller.getName()); principal.setFullname(caller.getFullname()); principal.setRoles(new LinkedHashSet<>());
            }
            return Auth.withUser(principal, scope, (Supplier<T>) () -> {
                if (!service && !Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("Readiness requires a system executor or administrator");
                return action.get();
            }).get();
        });
    }

    private Map<String, Object> confirmPurchaseInternal(Integer formId, String checkoutDigest, boolean refreshInvoice) {
        try { return asPurchaseExecutor(() -> {
            Form form = purchaseForm(formId);
            Map<String, Object> data = data(form);
            requireVerified(form, data);
            if (!form.hasState("PURCHASE_CONFIRMATION_RECEIVED") && !form.hasState("DRAFT_ORDER_READY")) {
                throw new ApplicationException("A one-time purchase confirmation is required");
            }
            requirePurchaseConsent(form, data);
            Map<String, Object> checkout = map(data.get("checkout"));
            requirePreparedCheckout(data, checkout);
            if (checkoutDigest == null || !checkoutDigest.equals(checkout.get("checkoutDigest"))) {
                throw new ApplicationException("Checkout snapshot changed; review and confirm the current snapshot");
            }
            Map<String, Object> purchase = map(data.get("purchase"));
            if (refreshInvoice || !"DRAFT_ORDER_READY".equals(purchase.get("status")) || purchase.get("basePlanItemId") == null
                    || purchase.get("invoiceStatus") == null) {
                validateFields(form);
                validateProducts(form);
                Map<String, Object> payload = purchasePayload(form, data);
                payload.put("checkoutDigest", checkoutDigest);
                payload.put("catalogFingerprint", checkout.get("catalogFingerprint"));
                if (checkout.containsKey("entitlementFingerprint")) {
                    payload.put("entitlementFingerprint", checkout.get("entitlementFingerprint"));
                    payload.put("entitlementSnapshot", map(checkout.get("preview")).get("entitlements"));
                }
                payload.put("confirmationTokenId", map(data.get("confirmation")).get("tokenId"));
                payload.put("buyerAuthorizedAt", map(data.get("confirmation")).get("authorizedAt"));
                purchase = draftAction("ensureDraft", payload);
                number(purchase.get("accountId"), "Purchase account");
                number(purchase.get("orderId"), "Purchase order");
                number(purchase.get("basePlanItemId"), "Base plan order item");
                if (!"DRAFT_ORDER_READY".equals(purchase.get("status")) || !"DRAFT".equals(purchase.get("orderState"))) {
                    throw new ApplicationException("Billing service did not return a draft purchase");
                }
                if (checkout.containsKey("entitlementFingerprint")
                        && !checkout.get("entitlementFingerprint").equals(purchase.get("entitlementFingerprint"))) {
                    throw new ApplicationException("Billing draft does not retain the confirmed Entitlements");
                }
                purchase = new LinkedHashMap<>(purchase);
                purchase.put("confirmedAt", Instant.now().toEpochMilli());
                purchase.put("executionIdentity", userManager.getSystemUserId().equals(Auth.getAuthenticatedUser().getId()) ? "SYSTEM" : "OPERATOR");
                purchase.put("executionUserId", Auth.getAuthenticatedUser().getId());
                purchase.put("executionSystemAdmin", Auth.isAuthenticatedSystemAdmin());
                purchase.put("confirmationTokenId", map(data.get("confirmation")).get("tokenId"));
                data.put("purchase", purchase);
                data.remove("draftPreparationError");
                putData(form, data);
                formManager.save(form);
            }
            if (form.hasState("PURCHASE_CONFIRMATION_RECEIVED")) {
                workflowService.sendEventUnsecured("DRAFT_PREPARED", form, Map.of());
            }
            return new LinkedHashMap<>(purchase);
        }); } catch (Exception failure) {
            recordPurchaseFailure(formId, "draftPreparationError", failure);
            throw failure;
        }
    }

    public void onEmailVerified(Form form, Map<String, Object> context) {
        validateScope(form);
        requireVerified(form, data(form));
        afterState(form, "EMAIL_VERIFIED_MODEL_PENDING", () -> prepareCheckout(Math.toIntExact(form.getId())));
    }

    public void onCheckoutEntered(Form form, Map<String, Object> context) {
        onCheckoutPrepared(form, context);
        afterState(form, "CHECKOUT_PREPARED", () -> { issueConfirmation(form.getId()); return null; });
    }

    public void onPurchaseConfirmation(Form form, Map<String, Object> context) {
        validateScope(form);
        // Request metadata is untrusted workflow context. Only persisted Form
        // data and the native FormToken row authorize this action.
        Map<String, Object> current = transactionUtils.getInNewTx(() -> {
            Form saved = formManager.get(form.getId());
            if (saved == null) throw new ApplicationException("Purchase Form was removed");
            entityManager.refresh(saved);
            validateScope(saved);
            Map<String, Object> data = data(saved);
            requireVerified(saved, data);
            Map<String, Object> confirmation = map(data.get("confirmation"));
            requirePreparedCheckout(data, map(data.get("checkout")));
            requireConfirmationBinding(saved, data, confirmation);
            if (confirmation.containsKey("authorizedAt")) throw new ApplicationException("Purchase confirmation already recorded");
            if (Instant.now().toEpochMilli() >= number(confirmation.get("expiresAt"), "Purchase confirmation expiry")) {
                throw new ApplicationException("Purchase confirmation link expired");
            }
            requireConsumedToken(saved, number(confirmation.get("tokenId"), "Purchase confirmation token"), "CONFIRM_PURCHASE");
            Map<String, Object> fresh = asSystem(() -> draftAction("preview", purchasePayload(saved, data)));
            Map<String, Object> checkout = map(data.get("checkout"));
            requireEntitlementSnapshot(fresh);
            if (!fresh.get("catalogFingerprint").equals(checkout.get("catalogFingerprint"))
                    || !fresh.get("entitlementFingerprint").equals(checkout.get("entitlementFingerprint"))) {
                throw new ApplicationException("Catalog selection or Entitlements changed; prepare Checkout and obtain a new confirmation");
            }
            confirmation.put("authorizedAt", Instant.now().toEpochMilli());
            confirmation.put("executionIdentity", "SYSTEM");
            confirmation.put("executionUserId", userManager.getSystemUserId());
            data.put("confirmation", confirmation);
            return data;
        });
        if (!inputDigest(form).equals(current.get("inputDigest"))) throw new ApplicationException("Purchase details changed");
        putData(form, current);
    }

    public void onPurchaseConfirmationReceived(Form form, Map<String, Object> context) {
        validateScope(form);
        requirePurchaseConsent(form, data(form));
        afterState(form, "PURCHASE_CONFIRMATION_RECEIVED", () -> {
            Map<String, Object> saved = transactionUtils.getInNewTx(() -> data(formManager.get(form.getId())));
            return confirmPurchase(Math.toIntExact(form.getId()), String.valueOf(map(saved.get("confirmation")).get("checkoutDigest")));
        });
    }

    private void requireConsumedToken(Form form, long id, String event) {
        FormToken token = tokenManager.get(id);
        if (token != null) entityManager.refresh(token);
        if (token == null || !token.isUsed() || token.getForm() == null
                || !form.getId().equals(token.getForm().getId()) || !event.equals(token.getEventCode())) {
            throw new ApplicationException("A consumed one-time token for this Form and action is required");
        }
    }

    private void requireConfirmationBinding(Form form, Map<String, Object> data, Map<String, Object> confirmation) {
        if (!form.getId().equals(number(confirmation.get("formId"), "Confirmation Form"))
                || !data.get("inputDigest").equals(confirmation.get("inputDigest"))
                || !data.get("emailDigest").equals(confirmation.get("emailDigest"))
                || !map(data.get("checkout")).get("checkoutDigest").equals(confirmation.get("checkoutDigest"))) {
            throw new ApplicationException("Confirmation does not match the verified purchase snapshot");
        }
    }

    private void requirePurchaseConsent(Form form, Map<String, Object> data) {
        requireVerified(form, data);
        Map<String, Object> confirmation = map(data.get("confirmation"));
        requirePreparedCheckout(data, map(data.get("checkout")));
        requireConfirmationBinding(form, data, confirmation);
        long authorized = number(confirmation.get("authorizedAt"), "One-time purchase consent");
        if (authorized >= number(confirmation.get("expiresAt"), "Purchase confirmation expiry")) {
            throw new ApplicationException("Purchase was not confirmed within the link lifetime");
        }
        requireConsumedToken(form, number(confirmation.get("tokenId"), "Purchase confirmation token"), "CONFIRM_PURCHASE");
    }

    private void afterState(Form form, String expected, Supplier<?> action) {
        Long id = form.getId();
        transactionUtils.runAfterTx(() -> Thread.startVirtualThread(() -> {
            try {
                long deadline = System.nanoTime() + Duration.ofSeconds(30).toNanos();
                while (!asSystem(() -> {
                    Form saved = formManager.get(id);
                    if (saved == null) throw new ApplicationException("Purchase Form was removed");
                    entityManager.refresh(saved);
                    validateScope(saved);
                    return saved.hasState(expected);
                })) {
                    if (System.nanoTime() >= deadline) throw new ApplicationException("Purchase state was not committed");
                    Thread.sleep(100);
                }
                asSystem(() -> { action.get(); return null; });
            } catch (Exception failure) {
                if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
                asSystem(() -> { recordPurchaseFailure(Math.toIntExact(id), "buyerContinuationError", failure); return null; });
            }
        }));
    }

    private void issueConfirmation(Long id) {
        ConfirmationMail mail = transactionUtils.getInNewTxRW(() -> {
            Form form = purchaseForm(Math.toIntExact(id));
            if (!form.hasState("CHECKOUT_PREPARED")) return null;
            Map<String, Object> data = data(form);
            requireVerified(form, data);
            Map<String, Object> checkout = map(data.get("checkout"));
            requirePreparedCheckout(data, checkout);
            // Entry hooks or explicit operator preview retries must not send a second email.
            if (map(data.get("confirmation")).containsKey("tokenId")) return null;
            requireConsumedToken(form, number(data.get("tokenId"), "Email verification token"), VERIFY);
            String raw = formService.createToken(id, "CONFIRM_PURCHASE");
            tokenManager.flush();
            FormToken token = tokenManager.getByToken(tokenHash(raw));
            if (token == null) throw new ApplicationException("Purchase confirmation token was not saved");
            long issued = Instant.now().toEpochMilli();
            Map<String, Object> confirmation = new LinkedHashMap<>();
            confirmation.put("formId", id);
            confirmation.put("tokenId", token.getId());
            confirmation.put("issuedAt", issued);
            long hours = number(config().getOrDefault("LINK_TTL_HOURS", 24), "Link lifetime");
            confirmation.put("expiresAt", Math.addExact(issued, Math.multiplyExact(hours, 3600000L)));
            confirmation.put("inputDigest", data.get("inputDigest"));
            confirmation.put("emailDigest", data.get("emailDigest"));
            confirmation.put("checkoutDigest", checkout.get("checkoutDigest"));
            confirmation.put("mailStatus", "DISPATCHING");
            String base = setting(config(), "PUBLIC_FORM_API_URL");
            requireHttps(base);
            String recipient = text(form, "EMAIL");
            boolean capture = Boolean.TRUE.equals(config().get("DEV_CAPTURE_INVALID_EMAIL"))
                    && URI.create(base).getHost().equals("dev-1.servicewand.com") && recipient.endsWith("@example.invalid");
            if (capture) { confirmation.put("mailStatus", "SUPPRESSED_FOR_DEV_TEST"); confirmation.put("devCapturedToken", raw); }
            data.put("confirmation", confirmation);
            putData(form, data);
            formManager.save(form);
            Map<String, Object> preview = map(checkout.get("preview"));
            String link = confirmationLink(config(), base, raw, "purchase");
            String body = "<p>Review your ServiceWand subscription request.</p>"
                    + "<p>Company: " + HtmlUtils.htmlEscape(text(form, "COMPANY_NAME")) + "<br>Address: "
                    + HtmlUtils.htmlEscape(text(form, "COMPANY_ADDRESS")) + "</p>"
                    + "<p>Contact: " + HtmlUtils.htmlEscape((text(form, "FIRST_NAME") + " " + text(form, "LAST_NAME")).trim())
                    + "<br>Email: " + HtmlUtils.htmlEscape(recipient) + "<br>Phone: " + HtmlUtils.htmlEscape(text(form, "PHONE")) + "</p>"
                    + "<p>Plan: " + HtmlUtils.htmlEscape(String.valueOf(preview.get("planName")))
                    + "<br>Billing period: " + ("YEARLY".equals(text(form, "BILLING_PERIOD")) ? "Yearly" : "Monthly")
                    + "<br>Catalog plan price: " + HtmlUtils.htmlEscape(String.valueOf(preview.get("planAmount"))) + " "
                    + HtmlUtils.htmlEscape(String.valueOf(preview.get("currencyCode"))) + "</p>"
                    + "<p>Add-ons: " + HtmlUtils.htmlEscape(((Collection<?>) preview.get("addonNames")).isEmpty() ? "None" : String.join(", ", ((Collection<?>) preview.get("addonNames")).stream().map(String::valueOf).toList())) + "</p>"
                    + purchaseLinesHtml(preview)
                    + entitlementSummaryHtml(preview)
                    + "<p>Subtotal before taxes: " + HtmlUtils.htmlEscape(String.valueOf(preview.get("subtotal"))) + " "
                    + HtmlUtils.htmlEscape(String.valueOf(preview.get("currencyCode"))) + "</p>"
                    + checkoutTaxHtml(preview)
                    + "<p>Routing Credits and Custom Reports are excluded. "
                    + "This confirmation creates a draft order only. No payment is taken.</p>"
                    + "<p><a href=\"" + HtmlUtils.htmlEscape(link) + "\">Confirm request and create draft order</a></p>"
                    + "<p>This link can be used once and expires in " + hours + " hours. If these details are incorrect, submit a new request.</p>";
            return new ConfirmationMail(recipient, body, capture, token.getId(), String.valueOf(checkout.get("checkoutDigest")));
        });
        if (mail == null || mail.capture()) return;
        String status;
        try {
            scriptUtils.sendSimpleEmail(new String[] {mail.recipient()}, "Confirm your ServiceWand subscription request", mail.body());
            status = "QUEUED";
        } catch (Exception failure) { status = "DELIVERY_OUTCOME_UNKNOWN"; }
        String outcome = status;
        transactionUtils.getInNewTxRW(() -> {
            Form form = purchaseForm(Math.toIntExact(id));
            Map<String, Object> data = data(form);
            Map<String, Object> confirmation = map(data.get("confirmation"));
            if ("DISPATCHING".equals(confirmation.get("mailStatus"))
                    && CheckoutChanges.sameDispatch(confirmation.get("tokenId"), confirmation.get("checkoutDigest"), mail.tokenId(), mail.checkoutDigest())) {
                confirmation.put("mailStatus", outcome); data.put("confirmation", confirmation); putData(form, data); formManager.save(form);
            }
            return null;
        });
    }

    private record ConfirmationMail(String recipient, String body, boolean capture, Long tokenId, String checkoutDigest) {}

    public void onCheckoutPrepared(Form form, Map<String, Object> context) {
        validateScope(form);
        Map<String, Object> data = data(form);
        requireVerified(form, data);
        requirePreparedCheckout(data, map(data.get("checkout")));
    }

    public void onDraftOrderReady(Form form, Map<String, Object> context) {
        validateScope(form);
        Map<String, Object> data = data(form);
        requirePurchaseConsent(form, data);
        Map<String, Object> purchase = map(data.get("purchase"));
        if (!"DRAFT_ORDER_READY".equals(purchase.get("status")) || !"DRAFT".equals(purchase.get("orderState"))) {
            throw new ApplicationException("Confirmed draft purchase is missing");
        }
        number(purchase.get("accountId"), "Purchase account");
        number(purchase.get("orderId"), "Purchase order");
        number(purchase.get("basePlanItemId"), "Base plan order item");
        String checkoutDigest=String.valueOf(map(data.get("checkout")).get("checkoutDigest"));
        afterState(form,"DRAFT_ORDER_READY",()->{
            try { prepareOnboarding(Math.toIntExact(form.getId()),checkoutDigest); }
            catch(Exception failure){recordPurchaseFailure(Math.toIntExact(form.getId()),"onboardingPreparationError",failure);}
            try { return deliverPurchaseReadAccess(Math.toIntExact(form.getId()),checkoutDigest); }
            catch(Exception failure){recordPurchaseFailure(Math.toIntExact(form.getId()),"purchaseReadAccessError",failure);return null;}
        });
    }

    private Form purchaseForm(Integer id) {
        if (id == null || id <= 0) throw new ApplicationException("Form ID is required");
        Form form = formManager.get(id.longValue(), LockModeType.PESSIMISTIC_WRITE);
        if (form != null) entityManager.refresh(form, LockModeType.PESSIMISTIC_WRITE);
        validateScope(form);
        return form;
    }

    private void requireVerified(Form form, Map<String, Object> data) {
        number(data.get("verifiedAt"), "Email verification");
        if (!inputDigest(form).equals(data.get("inputDigest"))
                || !digest(text(form, "EMAIL")).equals(data.get("emailDigest"))) {
            throw new ApplicationException("Submitted purchase details require email verification");
        }
        requireResolvedCompanyAddress(form, data);
    }

    private void requirePreparedCheckout(Map<String, Object> data, Map<String, Object> checkout) {
        if (!"PREPARED".equals(checkout.get("status"))
                || !digest(data.get("inputDigest") + "|" + checkout.get("catalogFingerprint")).equals(checkout.get("checkoutDigest"))) {
            throw new ApplicationException("A current Checkout snapshot is required");
        }
        Map<String, Object> preview = map(checkout.get("preview"));
        if (preview.containsKey("entitlements") || checkout.containsKey("entitlementFingerprint")) {
            requireEntitlementSnapshot(preview);
            if (!preview.get("entitlementFingerprint").equals(checkout.get("entitlementFingerprint"))) {
                throw new ApplicationException("Checkout Entitlement fingerprint is inconsistent");
            }
            Map<String, Object> source = new LinkedHashMap<>(preview); source.remove("catalogFingerprint");
            if (!digest(canonicalJson(source)).equals(checkout.get("catalogFingerprint"))) {
                throw new ApplicationException("Checkout catalog snapshot is inconsistent");
            }
        }
    }

    private void requireEntitlementSnapshot(Map<String, Object> preview) {
        Map<String, Object> snapshot = map(preview.get("entitlements"));
        if (!Integer.valueOf(1).equals(snapshot.get("schemaVersion"))
                || !Boolean.FALSE.equals(snapshot.get("grantIssuanceEnabled"))
                || !Boolean.FALSE.equals(snapshot.get("enforcementVerified"))
                || !digest(canonicalJson(snapshot)).equals(preview.get("entitlementFingerprint"))) {
            throw new ApplicationException("A prepared Entitlement snapshot is required; prepare Checkout again");
        }
    }

    private String entitlementSummaryHtml(Map<String, Object> preview) {
        Map<String, Object> snapshot = map(preview.get("entitlements"));
        List<String> features = new ArrayList<>(), levels = new ArrayList<>();
        for (Object value : (Collection<?>) snapshot.get("features")) {
            Map<String, Object> feature = map(value);
            if (Boolean.TRUE.equals(feature.get("value"))) features.add(String.valueOf(feature.get("sourceAttribute")).replace('_', ' ').toLowerCase(Locale.ROOT));
        }
        for (Object value : (Collection<?>) snapshot.get("levels")) {
            Map<String, Object> level = map(value);
            if (Boolean.TRUE.equals(level.get("enabled"))) levels.add(String.valueOf(level.get("sourceAttribute")).replace('_', ' ').toLowerCase(Locale.ROOT) + ": " + level.get("value"));
        }
        return "<p>Purchased active Properties capacity: " + HtmlUtils.htmlEscape(String.valueOf(map(snapshot.get("propertyCapacity")).get("limit")))
                + "<br>Plan maximum Properties: " + HtmlUtils.htmlEscape(String.valueOf(map(snapshot.get("propertyCapacity")).get("overallMaximum")))
                + "<br>Weather Properties: " + HtmlUtils.htmlEscape(String.valueOf(map(snapshot.get("weather")).get("propertyCount")))
                + "<br>Included features: " + HtmlUtils.htmlEscape(String.join(", ", features))
                + "<br>Feature levels: " + HtmlUtils.htmlEscape(String.join(", ", levels)) + "</p>";
    }

    private static Object canonical(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> sorted = new java.util.TreeMap<>();
            for (var entry : map.entrySet()) sorted.put(String.valueOf(entry.getKey()), canonical(entry.getValue()));
            return sorted;
        }
        if (value instanceof Collection<?> list) return list.stream().map(MAIN_CLASS::canonical).toList();
        return value;
    }

    private static String canonicalJson(Object value) {
        try { return Json.defaultMapper().writeValueAsString(canonical(value)); }
        catch (Exception failure) { throw new ApplicationException("Checkout snapshot cannot be serialized"); }
    }

    private String purchaseLinesHtml(Map<String, Object> preview) {
        StringBuilder html = new StringBuilder("<ul>");
        if (!(preview.get("lines") instanceof Collection<?> lines)) throw new ApplicationException("Checkout lines are missing");
        for (Object value : lines) {
            Map<String, Object> line = map(value);
            html.append("<li>").append(HtmlUtils.htmlEscape(String.valueOf(line.get("productName"))))
                .append(": ").append(HtmlUtils.htmlEscape(String.valueOf(line.get("quantity"))))
                .append(" x ").append(HtmlUtils.htmlEscape(String.valueOf(line.get("unitAmount"))))
                .append(" = ").append(HtmlUtils.htmlEscape(String.valueOf(line.get("lineAmount"))))
                .append(" ").append(HtmlUtils.htmlEscape(String.valueOf(preview.get("currencyCode")))).append("</li>");
        }
        return html.append("</ul>").toString();
    }

    private Map<String, Object> purchasePayload(Form form, Map<String, Object> data) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sourceFormId", form.getId());
        result.put("organizationId", form.getOrganization().getId());
        result.put("inputDigest", data.get("inputDigest"));
        result.put("verifiedAt", data.get("verifiedAt"));
        result.put("addressId", map(data.get("companyAddress")).get("addressId"));
        result.put("companyAddressSnapshot", map(data.get("companyAddress")));
        result.put("companyName", text(form, "COMPANY_NAME"));
        result.put("email", text(form, "EMAIL"));
        result.put("firstName", text(form, "FIRST_NAME"));
        result.put("lastName", text(form, "LAST_NAME"));
        result.put("phone", text(form, "PHONE"));
        result.put("planProductId", number(form.findFirstAttributeValue("PLAN_PRODUCT"), "Plan"));
        result.put("addonProductIds", addons(form));
        result.put("siteExpansionPacks", quantity(form, "SITE_EXPANSION_PACKS"));
        result.put("weatherPropertyCount", quantity(form, "WEATHER_PROPERTY_COUNT"));
        result.put("billingPeriod", text(form, "BILLING_PERIOD"));
        return result;
    }

    private Map<String, Object> checkoutView(Form form, Map<String, Object> data) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("formId", form.getId());
        result.put("checkout", map(data.get("checkout")));
        result.put("inputs", purchasePayload(form, data));
        result.put("purchase", map(data.get("purchase")));
        result.put("paymentEnabled", false);
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> draftAction(String method, Map<String, Object> payload) {
        try {
            List<String> nodes = capabilitiesResolver.listNodesWithCapabilities().entrySet().stream()
                    .filter(entry -> entry.getValue().containsAll(Set.of("CORE", "CORE-ACCT", "CORE-PIM", "CORE-BILL")))
                    .map(Map.Entry::getKey).sorted().toList();
            if (nodes.isEmpty()) throw new ApplicationException("No billing-capable execution node is available");
            String helperCode = setting(config(), "DRAFT_HELPER_CODE");
            String serialized = Json.defaultMapper().writeValueAsString(payload);
            // Commit the queue submission separately before waiting. The outer
            // transaction holds only the source Form lock; billing never loads it.
            UUID request = transactionUtils.getInNewTxRW(() -> {
                try { return scriptService.submitForExecution(
                        nodes.get(0), scriptManager.getByCode(helperCode), method,
                        List.<Map<String, ?>>of(Map.of("payloadJson", serialized)), Auth.getAuthenticatedUser(),
                        organizationManager.get(Math.toIntExact(number(payload.get("organizationId"), "Seller"))));
                } catch (Exception failure) { throw new ApplicationException(failure); }
            });
            long deadline = System.nanoTime() + Duration.ofSeconds(45).toNanos();
            while (System.nanoTime() < deadline) {
                ScriptService.ScriptExecutionInfo info = transactionUtils.getInNewTx(
                        () -> scriptService.getScriptExecutionInfo(request));
                if (info != null && info.status() == ExecutionStatus.COMPLETED) {
                    return Json.defaultMapper().readValue(info.result(), Map.class);
                }
                if (info != null && info.status() == ExecutionStatus.FAILED) {
                    StringBuilder frames = new StringBuilder();
                    try {
                        JsonNode trace = Json.defaultMapper().readTree(info.result());
                        if (trace.isArray()) for (JsonNode frame : trace) {
                            String className = frame.path("className").asText();
                            if (!className.startsWith("com.pixelnation.bill.generated.")) continue;
                            frames.append(frame.path("methodName").asText()).append(":")
                                .append(frame.path("lineNumber").asInt()).append(" ");
                        }
                        if (trace.isArray() && !trace.isEmpty()) frames.append(trace.get(0).path("className").asText());
                    } catch (Exception ignored) { frames.append("inspect queue result"); }
                    throw new ApplicationException("Billing " + method + " failed at " + frames);
                }
                Thread.sleep(200);
            }
            throw new ApplicationException("Billing execution outcome is unknown; inspect its queue result before retrying");
        } catch (Exception failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            // Remote work may have committed. The billing helper's Form-scoped
            // receipt and transaction lock make a later retry safe.
            throw new ApplicationException("Draft purchase helper failed: " + safeMessage(failure), failure);
        }
    }

    private void recordPurchaseFailure(Integer id, String key, Exception failure) {
        if (id == null || id <= 0) return;
        asPurchaseExecutor(() -> {
            Form form = formManager.get(id.longValue(), LockModeType.PESSIMISTIC_WRITE);
            if (form == null) return null;
            validateScope(form);
            Map<String, Object> data = data(form);
            data.put(key, failure.getClass().getSimpleName() + ": " + safeMessage(failure));
            putData(form, data);
            formManager.save(form);
            return null;
        });
    }

    private <T> T asPurchaseExecutor(Supplier<T> action) {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Authenticated purchase executor required");
        boolean service = transactionUtils.getInNewTx(() -> {
            User system = userManager.getSystemUser();
            return system != null && callerId.equals(system.getId());
        });
        if (!service) return asOperator(action); // Explicit operator recovery remains available.
        return asSystem(action);
    }

    private <T> T asSystem(Supplier<T> action) {
        return transactionUtils.getInNewTxRW(() -> {
            User stored = userManager.getSystemUser();
            Organization seller = organizationManager.getByCode("SERVICEWAND");
            if (stored == null || seller == null) throw new ApplicationException("Purchase service identity is unavailable");
            // In-memory service principal only; no persisted roles or permissions change.
            User service = new User();
            service.setId(stored.getId()); service.setName(stored.getName()); service.setFullname(stored.getFullname());
            service.setRoles(new LinkedHashSet<>());
            return Auth.withUser(service, seller, action).get();
        });
    }

    private <T> T asOperator(Supplier<T> action) {
        if (Auth.getAuthenticatedUser() == null || Auth.getAuthenticatedOrganization() == null) {
            throw new ApplicationException("Checkout backend actions require a system administrator");
        }
        Integer userId = Auth.getAuthenticatedUser().getId();
        return transactionUtils.getInNewTxRW(() -> {
            User caller = entityManager.find(User.class, userId);
            Organization org = entityManager.createQuery("SELECT o FROM Organization o WHERE o.code = :code", Organization.class)
                    .setParameter("code", "SYSTEM").getSingleResult();
            if (caller == null || org == null) throw new ApplicationException("Authenticated caller is no longer available");
            return Auth.withUser(caller, org, (Supplier<T>) () -> {
                if (!Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("Checkout backend actions require a system administrator");
                return action.get();
            }).get();
        });
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object value) {
        return value instanceof Map<?, ?> ? new LinkedHashMap<>((Map<String, Object>) value) : new LinkedHashMap<>();
    }

    private void prepare(Long id) {
        String issuedToken;
        try {
            issuedToken = transactionUtils.getInNewTxRW(() -> {
                Form form = formManager.get(id, LockModeType.PESSIMISTIC_WRITE);
                if (form != null) entityManager.refresh(form, LockModeType.PESSIMISTIC_WRITE);
                if (form == null || !form.hasState("SUBMITTED")) return null;
                validateScope(form);
                validateFields(form);
                Map<String, Object> data = data(form);
                if (!inputDigest(form).equals(data.get("inputDigest"))) {
                    throw new ApplicationException("Purchase details changed before validation");
                }
                Map<String, Object> validation = validateProducts(form);
                data.put("catalogValidation", "VALIDATED");
                data.put("quantityValidation", "VALIDATED");
                data.put("capacityValidation", validation.get("capacityValidation"));
                data.put("overallPropertyMaximum", validation.get("overallPropertyMaximum"));
                data.put("companyAddress", resolveCompanyAddress(form));
                long issued = Instant.now().toEpochMilli();
                long hours = number(config().getOrDefault("LINK_TTL_HOURS", 24), "Link lifetime");
                String rawToken = formService.createToken(form.getId(), VERIFY);
                tokenManager.flush();
                FormToken token = tokenManager.getByToken(tokenHash(rawToken));
                if (token == null || token.getId() == null) throw new ApplicationException("Verification token was not persisted");
                data.put("tokenId", token.getId());
                data.put("issuedAt", issued);
                data.put("expiresAt", Math.addExact(issued, Math.multiplyExact(hours, 3600000L)));
                data.put("emailDigest", digest(text(form, "EMAIL")));
                data.put("mailStatus", "PENDING");
                putData(form, data);
                formManager.save(form);
                workflowService.sendEventUnsecured("PREPARED", form, Map.of());
                return rawToken;
            });
        } catch (Exception failure) {
            transactionUtils.runInNewTx(() -> {
                Form form = formManager.get(id, LockModeType.PESSIMISTIC_WRITE);
                if (form == null) return;
                Map<String, Object> data = data(form);
                data.put("companyAddress", Map.of("status", "FAILED"));
                data.put("preparationError", failure.getClass().getSimpleName() + ": " + safeMessage(failure));
                if (!form.hasState("SUBMITTED")) {
                    data.put("mailStatus", "DELIVERY_PREPARATION_FAILED");
                    putData(form, data);
                    formManager.save(form);
                    return;
                }
                data.put("mailStatus", "NOT_PREPARED");
                putData(form, data);
                formManager.save(form);
                workflowService.sendEventUnsecured("PREPARATION_FAILED", form, Map.of());
            });
            return;
        }
        if (issuedToken == null) return;
        Thread.startVirtualThread(Auth.withCurrentUser(() -> dispatchAfterTransition(id, issuedToken)));
    }

    private void dispatchAfterTransition(Long id, String issuedToken) {
        try {
            long deadline = System.nanoTime() + Duration.ofSeconds(15).toNanos();
            while (!transactionUtils.getInNewTxRW(() -> {
                Form form = formManager.get(id);
                if (form == null) throw new ApplicationException("Submitted form was removed");
                entityManager.refresh(form);
                return form.hasState("AWAITING_EMAIL");
            })) {
                if (System.nanoTime() >= deadline) throw new ApplicationException("Email confirmation state was not committed");
                Thread.sleep(100);
            }
            deliver(id, issuedToken);
        } catch (Exception failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            transactionUtils.runInNewTx(() -> {
                Form form = formManager.get(id, LockModeType.PESSIMISTIC_WRITE);
                if (form == null) return;
                Map<String, Object> data = data(form);
                if (!"PENDING".equals(data.get("mailStatus"))) return;
                data.put("mailStatus", "DELIVERY_PREPARATION_FAILED");
                data.put("deliveryError", failure.getClass().getSimpleName() + ": " + safeMessage(failure));
                putData(form, data);
                formManager.save(form);
            });
        }
    }

    private void deliver(Long id, String rawToken) {
        Mail mail = transactionUtils.getInNewTxRW(() -> {
            Form form = formManager.get(id, LockModeType.PESSIMISTIC_WRITE);
            if (form == null) return null;
            entityManager.refresh(form, LockModeType.PESSIMISTIC_WRITE);
            if (!form.hasState("AWAITING_EMAIL")) throw new ApplicationException("Form is not awaiting email confirmation");
            Map<String, Object> data = data(form);
            if (!"PENDING".equals(data.get("mailStatus"))) return null;
            validateScope(form);
            if (!inputDigest(form).equals(data.get("inputDigest"))) {
                throw new ApplicationException("Purchase details changed before sending");
            }
            FormToken token = tokenManager.get(number(data.get("tokenId"), "Verification token"));
            if (token == null || !tokenHash(rawToken).equals(token.getToken())) {
                throw new ApplicationException("Email verification token does not match the purchase");
            }
            String recipient = text(form, "EMAIL");
            Map<String, Object> config = config();
            String base = setting(config, "PUBLIC_FORM_API_URL");
            requireHttps(base);
            String link = confirmationLink(config, base, rawToken, "verify");
            boolean capture = Boolean.TRUE.equals(config.get("DEV_CAPTURE_INVALID_EMAIL"))
                    && URI.create(base).getHost().equals("dev-1.servicewand.com")
                    && recipient.endsWith("@example.invalid");
            data.put("mailStatus", capture ? "SUPPRESSED_FOR_DEV_TEST" : "DISPATCHING");
            if (capture) data.put("devCapturedToken", rawToken);
            putData(form, data);
            formManager.save(form);
            return new Mail(recipient, link, capture,
                    number(config.getOrDefault("LINK_TTL_HOURS", 24), "Link lifetime"));
        });
        if (mail == null || mail.capture()) return;
        String status;
        try {
            String body = "<p>Confirm your email to continue your ServiceWand purchase.</p>"
                    + "<p><a href=\"" + HtmlUtils.htmlEscape(mail.link()) + "\">Confirm email</a></p>"
                    + "<p>This link can be used once and expires in " + mail.hours() + " hours.</p>"
                    + "<p>If you did not request this purchase, you can ignore this email.</p>";
            scriptUtils.sendSimpleEmail(new String[] {mail.recipient()},
                    "Confirm your ServiceWand email", body);
            status = "QUEUED";
        } catch (Exception failure) {
            // A timeout may occur after queuing. Never resend automatically.
            status = "DELIVERY_OUTCOME_UNKNOWN";
        }
        String outcome = status;
        transactionUtils.runInNewTx(() -> {
            Form form = formManager.get(id, LockModeType.PESSIMISTIC_WRITE);
            Map<String, Object> data = data(form);
            if (!"DISPATCHING".equals(data.get("mailStatus"))) return;
            data.put("mailStatus", outcome);
            putData(form, data);
            formManager.save(form);
        });
    }

    private void validateScope(Form form) {
        if (form == null || form.getType() == null || !"PLAN_SUBSCRIPTION".equals(form.getType().getCode())
                || form.getOrganization() == null || !"SERVICEWAND".equals(form.getOrganization().getCode())) {
            throw new ApplicationException("This workflow accepts ServiceWand PLAN_SUBSCRIPTION forms only");
        }
    }

    private void validateFields(Form form) {
        for (String field : List.of("COMPANY_NAME", "COMPANY_ADDRESS", "EMAIL", "BILLING_PERIOD")) {
            if (text(form, field).isBlank()) throw new ApplicationException("{} is required", field);
        }
        for (String field : FIELDS) {
            if (Set.of("PLAN_PRODUCT", "ADDON_PRODUCTS", "SITE_EXPANSION_PACKS", "WEATHER_PROPERTY_COUNT").contains(field)) continue;
            Object value = form.findFirstAttributeValue(field);
            if (value != null && !(value instanceof String)) {
                throw new ApplicationException("{} must be a string", field);
            }
            if (text(form, field).length() > 4096 || text(form, field).chars().anyMatch(c -> c < 32 || c == 127)) {
                throw new ApplicationException("{} contains invalid text", field);
            }
        }
        String email = text(form, "EMAIL");
        if (email.length() > 254 || !email.matches("[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+")
                || email.chars().anyMatch(c -> ",;:\"()[]\\".indexOf(c) >= 0)
                || email.startsWith(".") || email.contains("..") || email.substring(0, email.indexOf('@')).endsWith(".")) {
            throw new ApplicationException("EMAIL is invalid");
        }
        if (!Set.of("MONTHLY", "YEARLY").contains(text(form, "BILLING_PERIOD"))) {
            throw new ApplicationException("BILLING_PERIOD must be MONTHLY or YEARLY");
        }
        long plan = number(form.findFirstAttributeValue("PLAN_PRODUCT"), "PLAN_PRODUCT");
        quantity(form, "SITE_EXPANSION_PACKS");
        quantity(form, "WEATHER_PROPERTY_COUNT");
        Set<Long> seen = new LinkedHashSet<>();
        for (Long addon : addons(form)) {
            if (addon == plan || !seen.add(addon)) throw new ApplicationException("ADDON_PRODUCTS contains duplicate selections or the plan itself");
        }
    }

    private Map<String, Object> validateProducts(Form form) {
        Map<String, Object> selection = new LinkedHashMap<>();
        selection.put("organizationId", form.getOrganization().getId());
        selection.put("planProductId", number(form.findFirstAttributeValue("PLAN_PRODUCT"), "Plan"));
        selection.put("addonProductIds", addons(form));
        selection.put("billingPeriod", text(form, "BILLING_PERIOD"));
        selection.put("siteExpansionPacks", quantity(form, "SITE_EXPANSION_PACKS"));
        selection.put("weatherPropertyCount", quantity(form, "WEATHER_PROPERTY_COUNT"));
        // Read-only catalog validation on the PIM node before any link or Address is created.
        Map<String, Object> validation = asSystem(() -> draftAction("validateSelection", selection));
        if (!Boolean.TRUE.equals(validation.get("valid"))) {
            throw new ApplicationException(String.valueOf(validation.getOrDefault("message", "Catalog selection is invalid")));
        }
        return validation;
    }

    private int quantity(Form form, String field) {
        Object value = form.findFirstAttributeValue(field);
        if (value == null) return 0;
        try {
            if (!(value instanceof Number)) throw new IllegalArgumentException();
            int count = new java.math.BigDecimal(value.toString()).intValueExact();
            if (count < 0) throw new IllegalArgumentException();
            return count;
        } catch (Exception failure) { throw new ApplicationException("{} must be a nonnegative integer", field); }
    }

    private List<Long> addons(Form form) {
        Object value = form.findFirstAttributeValue("ADDON_PRODUCTS");
        if (value == null) return List.of();
        if (!(value instanceof Collection<?> values)) throw new ApplicationException("ADDON_PRODUCTS must be a list of Product IDs");
        List<Long> ids = new ArrayList<>();
        for (Object item : values) ids.add(number(item, "ADDON_PRODUCTS"));
        return ids;
    }

    private Map<String, Object> resolveCompanyAddress(Form form) {
        Address candidate = parseAddress(text(form, "COMPANY_ADDRESS"));
        requireAddressComponents(candidate);
        Address address = addressService.resolveOrCreate(candidate);
        if (address == null || address.getId() == null) {
            throw new ApplicationException("COMPANY_ADDRESS could not be resolved");
        }
        requireAddressComponents(address);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "RESOLVED");
        result.put("method", "QUOTATION_RESOLVE_OR_CREATE");
        result.put("validation", "COMPONENTS_ONLY");
        result.put("addressId", address.getId());
        result.put("sourceDigest", digest(text(form, "COMPANY_ADDRESS")));
        result.put("address1", address.getAddress1());
        result.put("address2", address.getAddress2());
        result.put("city", address.getCity());
        result.put("countryCode", address.getCountry().getCode2());
        result.put("regionCode", address.getState() == null ? address.getJurisdiction() : address.getState().getCode());
        result.put("postalCode", address.getPostalCode());
        result.put("geoLocationStatus", address.getGeoLocationStatus() == null ? "unprocessed" : address.getGeoLocationStatus().name());
        result.put("resolvedAt", Instant.now().toEpochMilli());
        return result;
    }

    private void requireAddressComponents(Address address) {
        if (address == null || trimToNull(address.getAddress1()) == null
                || address.getCountry() == null || trimToNull(address.getCity()) == null
                || trimToNull(address.getPostalCode()) == null) {
            throw new ApplicationException("COMPANY_ADDRESS must include street, city, postal code and an identifiable country");
        }
        String country = address.getCountry().getCode2();
        if (Set.of("CA", "US").contains(country)) {
            if (address.getState() == null) {
                throw new ApplicationException("COMPANY_ADDRESS must include a valid province or state");
            }
            String postal = address.getPostalCode();
            if (!("CA".equals(country)
                    ? postal.matches("(?i)[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z] ?[0-9][ABCEGHJ-NPRSTV-Z][0-9]")
                    : postal.matches("[0-9]{5}(-[0-9]{4})?"))) {
                throw new ApplicationException("COMPANY_ADDRESS has an invalid postal code for its country");
            }
        }
    }

    private void requireResolvedCompanyAddress(Form form, Map<String, Object> data) {
        Object value = data.get("companyAddress");
        if (!(value instanceof Map<?, ?> address)
                || !"RESOLVED".equals(address.get("status"))
                || !digest(text(form, "COMPANY_ADDRESS")).equals(address.get("sourceDigest"))) {
            throw new ApplicationException("Company address was not resolved for this submission");
        }
        number(address.get("addressId"), "Resolved company address");
    }

    private Address parseAddress(String value) {
        String raw = trimToNull(value);
        if (raw == null) {
            throw new ApplicationException("Address is required");
        }

        List<String> parts = new ArrayList<>();
        for (String part : raw.split("\\s*,\\s*")) {
            String trimmed = trimToNull(part);
            if (trimmed != null) {
                parts.add(trimmed);
            }
        }
        if (parts.isEmpty()) {
            throw new ApplicationException("Address is required");
        }

        Country country = findCountry(parts.get(parts.size() - 1));
        if (country != null) {
            parts.remove(parts.size() - 1);
        }

        PostalPart postalPart = findPostalPart(parts, country);
        if (postalPart != null) {
            if (postalPart.remainder().isBlank()) {
                parts.remove(postalPart.index());
            } else {
                parts.set(postalPart.index(), postalPart.remainder());
            }
            if (country == null && postalPart.countryCode() != null) {
                country = countryManager.getByCode(postalPart.countryCode());
            }
        }

        if (parts.isEmpty()) {
            throw new ApplicationException(
                    "COMPANY_ADDRESS has no street component");
        }

        Address address = new Address();
        String first = parts.remove(0);
        Matcher leadingUnit = LEADING_UNIT_AND_STREET.matcher(first);
        String unit = unitPart(first);
        if (leadingUnit.matches()) {
            address.setAddress2("UNIT " + leadingUnit.group(1));
            address.setAddress1(leadingUnit.group(2));
        } else if (unit != null && !parts.isEmpty()) {
            address.setAddress2(unit);
            address.setAddress1(parts.remove(0));
        } else {
            address.setAddress1(
                    first.replaceAll("(?i)\\bAPPT\\s+", "APT "));
        }

        if (address.getAddress2() == null && !parts.isEmpty()) {
            unit = unitPart(parts.get(0));
            if (unit != null) {
                address.setAddress2(unit);
                parts.remove(0);
            }
        }

        if (country != null && !parts.isEmpty()) {
            State state = findState(country, parts.get(parts.size() - 1));
            if (state != null) {
                address.setState(state);
                parts.remove(parts.size() - 1);
            }
        }

        if (address.getState() == null && parts.size() > 1) {
            address.setJurisdiction(parts.remove(parts.size() - 1));
        }
        if (!parts.isEmpty()) {
            address.setCity(String.join(", ", parts));
        }

        address.setCountry(country);
        if (postalPart != null) {
            address.setPostalCode(postalPart.postalCode());
        }
        return address;
    }

    private String unitPart(String value) {
        Matcher matcher = UNIT_ONLY.matcher(value);
        return matcher.matches()
                ? "UNIT " + matcher.group(1)
                : null;
    }

    private PostalPart findPostalPart(
            List<String> parts,
            Country country) {
        for (int i = parts.size() - 1; i > 0; i--) {
            String value = parts.get(i);

            if (country == null || "CA".equalsIgnoreCase(country.getCode2())) {
                Matcher canadian = CANADIAN_POSTAL_CODE.matcher(value);
                if (canadian.find()) {
                    return postalPart(
                            i,
                            value,
                            canadian,
                            canadian.group(1).toUpperCase(Locale.ROOT)
                                    + " "
                                    + canadian.group(2).toUpperCase(Locale.ROOT),
                            "CA");
                }
            }

            if (country == null || "US".equalsIgnoreCase(country.getCode2())) {
                Matcher us = US_POSTAL_CODE.matcher(value);
                if (us.find()) {
                    return postalPart(
                            i,
                            value,
                            us,
                            us.group(1),
                            "US");
                }
            }

            if (country != null
                    && !"CA".equalsIgnoreCase(country.getCode2())
                    && !"US".equalsIgnoreCase(country.getCode2())
                    && value.chars().anyMatch(Character::isDigit)) {
                Matcher leading = LEADING_NUMERIC_POSTAL.matcher(value);
                if (leading.matches()) {
                    return new PostalPart(
                            i,
                            leading.group(1),
                            leading.group(2),
                            null);
                }

                Matcher trailing = TRAILING_NUMERIC_POSTAL.matcher(value);
                if (trailing.matches()) {
                    return new PostalPart(
                            i,
                            trailing.group(2),
                            trailing.group(1),
                            null);
                }

                if (value.length() <= 16) {
                    return new PostalPart(i, value, "", null);
                }
            }
        }
        return null;
    }

    private PostalPart postalPart(
            int index,
            String value,
            Matcher matcher,
            String postalCode,
            String countryCode) {
        String remainder = (
                value.substring(0, matcher.start())
                        + " "
                        + value.substring(matcher.end()))
                .trim()
                .replaceAll("\\s+", " ");
        return new PostalPart(index, postalCode, remainder, countryCode);
    }

    private Country findCountry(String value) {
        String candidate = normalizeLabel(value);
        if (candidate == null) {
            return null;
        }

        String countryCode = switch (candidate) {
            case "CANADA" -> "CA";
            case "UNITED STATES", "UNITED STATES OF AMERICA", "U S", "USA" -> "US";
            case "UNITED KINGDOM", "UK" -> "GB";
            default -> candidate.replace(" ", "");
        };
        if (countryCode.matches("[A-Z]{2,3}")) {
            Country country = countryManager.getByCode(countryCode);
            if (country != null) {
                return country;
            }
        }

        for (Country country : countryManager.list()) {
            if (matchesNlsName(country.getNls(), candidate)) {
                return country;
            }
        }

        for (Locale locale : Locale.getAvailableLocales()) {
            String localeCountryCode = locale.getCountry();
            if (!localeCountryCode.isBlank()
                    && candidate.equals(
                            normalizeLabel(locale.getDisplayCountry(locale)))) {
                Country country = countryManager.getByCode(localeCountryCode);
                if (country != null) {
                    return country;
                }
            }
        }
        return null;
    }

    private State findState(Country country, String value) {
        String candidate = normalizeLabel(value);
        if (candidate == null) {
            return null;
        }

        State state = stateManager.getBy(country.getCode2(), candidate);
        if (state != null) {
            return state;
        }

        for (State item : stateManager.list(country)) {
            if (candidate.equals(normalizeLabel(item.getCode()))
                    || matchesNlsName(item.getNls(), candidate)) {
                return item;
            }
        }
        return null;
    }

    private boolean matchesNlsName(
            Map<String, Map<String, String>> nls,
            String candidate) {
        if (nls == null) {
            return false;
        }
        for (Map<String, String> values : nls.values()) {
            if (values != null
                    && candidate.equals(normalizeLabel(values.get("NAME")))) {
                return true;
            }
        }
        return false;
    }

    private String normalizeLabel(String value) {
        String normalized = trimToNull(value);
        return normalized == null
                ? null
                : normalized.replace(".", "")
                        .replaceAll("\\s+", " ")
                        .toUpperCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }

    private record PostalPart(int index, String postalCode, String remainder, String countryCode) {}

    private String inputDigest(Form form) {
        Map<String, Object> fields = new LinkedHashMap<>();
        for (String field : FIELDS) {
            Object value = form.findFirstAttributeValue(field);
            if (value == null && Set.of("SITE_EXPANSION_PACKS", "WEATHER_PROPERTY_COUNT").contains(field)) continue;
            fields.put(field, value);
        }
        try { return digest(Json.defaultMapper().writeValueAsString(fields)); }
        catch (Exception failure) { throw new ApplicationException("Purchase data could not be validated"); }
    }

    private static String digest(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception failure) { throw new ApplicationException("Verification digest could not be calculated"); }
    }

    private static String tokenHash(String rawToken) {
        try { return Hashing.sha3(rawToken); }
        catch (Exception failure) { throw new ApplicationException("Verification token could not be hashed"); }
    }

    private static long number(Object value, String name) {
        try {
            if (!(value instanceof Number)) throw new IllegalArgumentException();
            long result = new BigDecimal(value.toString()).longValueExact();
            if (result <= 0) throw new IllegalArgumentException();
            return result;
        } catch (Exception failure) { throw new ApplicationException("{} must be a positive integer", name); }
    }

    private static String text(Form form, String field) {
        Object value = form.findFirstAttributeValue(field);
        return value == null ? "" : value.toString().trim();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> data(Form form) {
        Object value = form.getMetadata() == null ? null : form.getMetadata().get(KEY);
        return value instanceof Map<?, ?> ? new LinkedHashMap<>((Map<String, Object>) value) : new LinkedHashMap<>();
    }

    private static void putData(Form form, Map<String, Object> value) {
        Map<String, Object> metadata = form.getMetadata() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(form.getMetadata());
        metadata.put(KEY, value);
        form.setMetadata(metadata);
    }

    private Map<String, Object> config() {
        Script script = scriptManager.getByCode(SCRIPT);
        if (script == null || script.getMetadata() == null) throw new ApplicationException("Subscription workflow configuration is missing");
        return script.getMetadata();
    }

    private static String setting(Map<String, Object> config, String key) {
        Object value = config.get(key);
        if (!(value instanceof String text) || text.isBlank()) throw new ApplicationException("{} is not configured", key);
        return text;
    }

    private static String confirmationLink(Map<String, Object> config, String formApi, String rawToken, String step) {
        Object page = config.get("CONFIRM_PAGE_URL");
        if (!(page instanceof String text) || text.isBlank()) return formApi.replaceAll("/+$", "") + "/send-event/" + rawToken + ".json";
        requireHttps(text);
        return text + "#step=" + step + "&token=" + java.net.URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }

    private static void requireHttps(String url) {
        URI uri = URI.create(url);
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
                || uri.getQuery() != null || uri.getFragment() != null) throw new ApplicationException("Invalid public API URL configuration");
    }

    private static String safeMessage(Exception failure) {
        String message = failure.getMessage();
        if (message == null) return "Verification preparation failed";
        message = message.replaceAll("[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}", "[redacted]");
        return message.substring(0, Math.min(256, message.length()));
    }

    private record Mail(String recipient, String link, boolean capture, long hours) {}
    private record VerificationSnapshot(Map<String, Object> data, String inputDigest, String emailDigest) {}

    // BEGIN GENERATED CHECKOUT CHANGES
    /** A server allowlist; accepting a patch never authorizes a buyer or selects a Form. */
    public static final class CheckoutChanges {
        private static final Set<String> TEXT = Set.of("COMPANY_NAME","COMPANY_ADDRESS","FIRST_NAME","LAST_NAME","PHONE","BILLING_PERIOD");
        public static Map<String,Object> normalize(Map<String,Object> patch) {
            if(patch==null || patch.isEmpty() || patch.size()>10)throw new IllegalArgumentException("Nonempty Checkout patch required");
            Map<String,Object> result=new LinkedHashMap<>();
            for(var entry:patch.entrySet()) {
                String code=entry.getKey();Object value=entry.getValue();
                if(TEXT.contains(code)) {
                    if(!(value instanceof String text) || text.length()>4096 || text.chars().anyMatch(c->c<32 || c==127))throw new IllegalArgumentException("Invalid Checkout text: "+code);
                    text=text.trim();if(Set.of("COMPANY_NAME","COMPANY_ADDRESS","BILLING_PERIOD").contains(code) && text.isBlank())throw new IllegalArgumentException("Required Checkout text: "+code);
                    if("BILLING_PERIOD".equals(code) && !Set.of("MONTHLY","YEARLY").contains(text))throw new IllegalArgumentException("Unsupported period");
                    result.put(code,text);
                } else if(Set.of("PLAN_PRODUCT","SITE_EXPANSION_PACKS","WEATHER_PROPERTY_COUNT").contains(code)) {
                    result.put(code,integer(value,"PLAN_PRODUCT".equals(code)?1:0));
                } else if("ADDON_PRODUCTS".equals(code)) {
                    if(!(value instanceof List<?> values) || values.size()>2)throw new IllegalArgumentException("Invalid Add-ons list");
                    Set<Integer> ids=new LinkedHashSet<>();for(Object raw:values)if(!ids.add(integer(raw,1)))throw new IllegalArgumentException("Duplicate Add-on");
                    result.put(code,new ArrayList<>(ids));
                } else throw new IllegalArgumentException("Checkout field cannot be changed: "+code);
            }
            return result;
        }
        public static boolean sameDispatch(Object savedTokenId,Object savedDigest,long tokenId,String checkoutDigest) {
            if(!(savedTokenId instanceof Number) || !checkoutDigest.equals(savedDigest))return false;
            try{return new java.math.BigDecimal(savedTokenId.toString()).longValueExact()==tokenId;}catch(RuntimeException invalid){return false;}
        }
        private static int integer(Object value,int minimum) {
            if(!(value instanceof Number))throw new IllegalArgumentException("Whole numeric value required");
            int number=new java.math.BigDecimal(value.toString()).intValueExact();if(number<minimum)throw new IllegalArgumentException("Invalid Checkout number");return number;
        }
    }
    // END GENERATED CHECKOUT CHANGES

    // BEGIN GENERATED CHECKOUT COMMANDS
    /** Operator/system business command. A buyer HTTP adapter must authenticate the Form capability. */
    public Map<String,Object> readCheckout(Integer formId) {
        return asReadinessExecutor(() -> {
            if(formId==null || formId<=0)throw new ApplicationException("Form ID required");
            Form form=formManager.get(formId.longValue());if(form!=null)entityManager.refresh(form);validateScope(form);Map<String,Object> saved=data(form);
            requireVerified(form,saved); return buyerCheckoutView(form,saved); });
    }
    @SuppressWarnings("unchecked")
    public Map<String,Object> reviseCheckout(Integer formId,Integer expectedRevision,String expectedCheckoutDigest,String changesJson) {
        if(changesJson==null || changesJson.length()>65536)throw new ApplicationException("Invalid Checkout patch");
        Map<String,Object> changes;
        try{changes=CheckoutChanges.normalize(Json.defaultMapper().readValue(changesJson,Map.class));}
        catch(Exception invalid){throw new ApplicationException("Checkout patch contains unsupported or invalid fields");}
        if(expectedRevision==null || expectedRevision<1 || expectedCheckoutDigest==null || !expectedCheckoutDigest.matches("[a-f0-9]{64}"))throw new ApplicationException("Expected Checkout revision and digest required");
        return asPurchaseExecutor(() -> {
            Form form=purchaseForm(formId);Map<String,Object> saved=data(form);requireVerified(form,saved);
            if(!form.hasState("CHECKOUT_PREPARED") || !map(saved.get("purchase")).isEmpty() || map(saved.get("confirmation")).containsKey("authorizedAt"))throw new ApplicationException("Confirmed purchases cannot be edited");
            String request=digest(expectedRevision+"|"+expectedCheckoutDigest+"|"+canonicalJson(changes));
            Map<String,Object> last=map(saved.get("lastCheckoutRevision"));
            if(request.equals(last.get("requestDigest")))return buyerCheckoutView(form,saved);
            long revision=saved.get("checkoutRevision")==null?1:number(saved.get("checkoutRevision"),"Checkout revision");
            if(revision!=expectedRevision || !expectedCheckoutDigest.equals(map(saved.get("checkout")).get("checkoutDigest")))throw new ApplicationException("Checkout revision changed; reload before editing");
            for(var entry:changes.entrySet()) {
                Integer owner=checkoutFieldOwner(form.getType(),entry.getKey(),new LinkedHashSet<>());
                if(owner==null)throw new ApplicationException("Checkout attribute owner unavailable");
                form.setAttributeValue(owner,entry.getKey(),entry.getValue(),null);
            }
            validateFields(form);validateProducts(form);
            if(changes.containsKey("COMPANY_ADDRESS"))saved.put("companyAddress",resolveCompanyAddress(form));
            saved.put("inputDigest",inputDigest(form));requireVerified(form,saved);
            Map<String,Object> preview=draftAction("preview",purchasePayload(form,saved));requireEntitlementSnapshot(preview);
            Map<String,Object> checkout=new LinkedHashMap<>();checkout.put("status","PREPARED");
            checkout.put("catalogFingerprint",preview.get("catalogFingerprint"));checkout.put("entitlementFingerprint",preview.get("entitlementFingerprint"));
            checkout.put("checkoutDigest",digest(saved.get("inputDigest")+"|"+preview.get("catalogFingerprint")));
            checkout.put("preparedAt",Instant.now().toEpochMilli());checkout.put("preview",preview);
            Map<String,Object> previous=new LinkedHashMap<>(map(saved.get("confirmation")));previous.remove("devCapturedToken");
            if(!previous.isEmpty()){previous.put("invalidatedAt",Instant.now().toEpochMilli());previous.put("reason","CHECKOUT_REVISED");saved.put("supersededConfirmation",previous);}
            saved.remove("confirmation");saved.put("checkout",checkout);saved.put("checkoutRevision",Math.addExact(revision,1));
            saved.put("lastCheckoutRevision",Map.of("requestDigest",request,"baseRevision",revision,"newRevision",revision+1));
            putData(form,saved);formManager.save(form);
            afterState(form,"CHECKOUT_PREPARED",()->{issueConfirmation(form.getId());return null;});
            return buyerCheckoutView(form,saved);
        });
    }
    private Integer checkoutFieldOwner(Object type,String code,Set<Object> seen) {
        var bean=new org.springframework.beans.BeanWrapperImpl(type);Object id=bean.getPropertyValue("id");if(!seen.add(id))return null;
        Object attributes=bean.getPropertyValue("attributes");if(attributes instanceof Collection<?> rows)for(Object field:rows) {
            var attribute=new org.springframework.beans.BeanWrapperImpl(field);if(code.equals(attribute.getPropertyValue("code")))return ((Number)id).intValue();
        }
        Object parents=bean.isReadableProperty("parents")?bean.getPropertyValue("parents"):null;
        if(parents instanceof Collection<?> rows)for(Object parent:rows){Integer owner=checkoutFieldOwner(parent,code,seen);if(owner!=null)return owner;}return null;
    }
    private Map<String,Object> buyerCheckoutView(Form form,Map<String,Object> saved) {
        Map<String,Object> checkout=map(saved.get("checkout")),preview=map(checkout.get("preview"));
        Map<String,Object> result=new LinkedHashMap<>(),fields=new LinkedHashMap<>();
        for(String code:FIELDS)fields.put(code,form.findFirstAttributeValue(code));
        result.put("schemaVersion",1);result.put("purchaseReference",String.valueOf(form.getId()));result.put("fields",fields);
        result.put("revision",saved.getOrDefault("checkoutRevision",1));result.put("checkoutDigest",checkout.get("checkoutDigest"));
        result.put("status",form.hasState("DRAFT_ORDER_READY")?"DRAFT_ORDER_READY":form.hasState("CHECKOUT_PREPARED")?"CHECKOUT_PREPARED":"PREPARING");
        result.put("allowedActions",form.hasState("CHECKOUT_PREPARED")?List.of("READ","REVISE","CONFIRM_BY_EMAIL"):List.of("READ"));
        List<Map<String,Object>> lines=new ArrayList<>();Object raw=preview.get("lines");
        if(raw instanceof Collection<?> rows)for(Object row:rows) {
            Map<String,Object> line=map(row),safe=new LinkedHashMap<>();
            for(String key:List.of("role","productCode","productName","quantity","unitAmount","lineAmount","billingPeriod"))if(line.get(key)!=null)safe.put(key,line.get(key));lines.add(safe);
        }
        result.put("lines",lines);result.put("subtotal",preview.get("subtotal"));result.put("currency",preview.get("currencyCode"));
        Map<String,Object> tax=map(preview.get("taxQuote"));
        result.put("taxStatus",preview.getOrDefault("taxStatus","NOT_CALCULATED"));
        result.put("taxTotal",tax.get("taxAmount"));result.put("totalPayable",preview.get("totalPayable"));
        result.put("roundingStatus",tax.get("roundingStatus"));
        Map<String,Object> entitlement=map(preview.get("entitlements"));result.put("propertyCapacity",map(entitlement.get("propertyCapacity")).get("limit"));
        result.put("propertyMaximum",map(entitlement.get("propertyCapacity")).get("overallMaximum"));
        result.put("weather",Map.of("selected",Boolean.TRUE.equals(map(entitlement.get("weather")).get("selected")),"count",map(entitlement.get("weather")).getOrDefault("propertyCount",0),"status",Boolean.TRUE.equals(map(entitlement.get("weather")).get("selected"))?"WEATHER_SETUP_PENDING":"NOT_SELECTED"));
        result.put("paymentEnabled",false);result.put("canPay",false);result.put("buyerHttpAdapterAvailable",false);
        // Explicit projection only: never forward data(form), devCapturedToken or native receipts.
        return result;
    }

    private String checkoutTaxHtml(Map<String,Object> preview) {
        Map<String,Object> tax=map(preview.get("taxQuote"));
        if(!"CONFIGURED_RATES_APPLIED".equals(preview.get("taxStatus")) || !"EXACT_MINOR_UNITS".equals(tax.get("roundingStatus")) || preview.get("totalPayable")==null)
            return "<p>Taxes and the final total require configuration or review. No payment is available.</p>";
        String currency=HtmlUtils.htmlEscape(String.valueOf(preview.get("currencyCode")));
        return "<p>Taxes: "+HtmlUtils.htmlEscape(String.valueOf(tax.get("taxAmount")))+" "+currency
                +"<br>Total including taxes: "+HtmlUtils.htmlEscape(String.valueOf(preview.get("totalPayable")))+" "+currency+"</p>";
    }
    // END GENERATED CHECKOUT COMMANDS
}
