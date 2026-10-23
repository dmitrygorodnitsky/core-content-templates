package com.pixelnation.cms.generated;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import com.pixelnation.cms.domain.Form;
import com.pixelnation.cms.domain.FormToken;
import com.pixelnation.cms.persistence.iface.IFormManager;
import com.pixelnation.cms.persistence.iface.IFormTokenManager;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.util.TransactionUtils;
import jakarta.persistence.LockModeType;

// The integration checker creates this Script temporarily on dev-1 and removes it.
public class MAIN_CLASS {
    @Autowired private IFormManager formManager;
    @Autowired private IFormTokenManager formTokenManager;
    @Autowired private TransactionUtils transactionUtils;

    public Map<String, Object> used(Integer formId) {
        try { return transactionUtils.getInNewTxRW(() -> {
            Form form = formManager.get(formId.longValue(), LockModeType.PESSIMISTIC_WRITE);
            if (form == null) return Map.of("found", false);
            Map<String, Object> flags = new LinkedHashMap<>();
            flags.put("found", true);
            flags.put("typeMatches", form.getType() != null && "PLAN_SUBSCRIPTION".equals(form.getType().getCode()));
            flags.put("ownerMatches", form.getOrganization() != null && "SERVICEWAND".equals(form.getOrganization().getCode()));
            flags.put("emailMatches", "plan-subscription-test@example.invalid".equals(form.findFirstAttributeValue("EMAIL")));
            flags.put("labelMatches", String.valueOf((Object) form.findFirstAttributeValue("COMPANY_NAME")).startsWith("PLAN_SUBSCRIPTION integration "));
            if (flags.containsValue(false)) return flags;
            Map<?, ?> data = (Map<?, ?>) form.getMetadata().get("PLAN_SUBSCRIPTION");
            FormToken token = formTokenManager.get(((Number) data.get("tokenId")).longValue());
            flags.put("used", token != null && token.isUsed());
            return flags;
        }); } catch (Throwable failure) {
            return Map.of("error", failure.getClass().getSimpleName(), "message", String.valueOf(failure.getMessage()).replaceAll("[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}", "[redacted]"));
        }
    }

    public Boolean expire(Integer formId) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            Map<String, Object> metadata = new LinkedHashMap<>(form.getMetadata());
            Map<String, Object> data = new LinkedHashMap<>((Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION"));
            data.put("expiresAt", ((Number) data.get("issuedAt")).longValue() - 1);
            metadata.put("PLAN_SUBSCRIPTION", data);
            form.setMetadata(metadata);
            formManager.save(form);
            return true;
        });
    }

    public Boolean expireConfirmation(Integer formId) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            Map<String, Object> metadata = new LinkedHashMap<>(form.getMetadata());
            Map<String, Object> data = new LinkedHashMap<>((Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION"));
            Map<String, Object> confirmation = new LinkedHashMap<>((Map<String, Object>) data.get("confirmation"));
            confirmation.put("expiresAt", ((Number) confirmation.get("issuedAt")).longValue() - 1);
            data.put("confirmation", confirmation); metadata.put("PLAN_SUBSCRIPTION", data);
            form.setMetadata(metadata); formManager.save(form); return true;
        });
    }

    public Boolean unresolve(Integer formId) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            Map<String, Object> metadata = new LinkedHashMap<>(form.getMetadata());
            Map<String, Object> data = new LinkedHashMap<>((Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION"));
            data.remove("companyAddress");
            metadata.put("PLAN_SUBSCRIPTION", data);
            form.setMetadata(metadata);
            formManager.save(form);
            return true;
        });
    }

    public Boolean staleCheckout(Integer formId) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            Map<String, Object> metadata = new LinkedHashMap<>(form.getMetadata());
            Map<String, Object> data = new LinkedHashMap<>((Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION"));
            Map<String, Object> checkout = new LinkedHashMap<>((Map<String, Object>) data.get("checkout"));
            String fingerprint = "0".repeat(64);
            checkout.put("catalogFingerprint", fingerprint);
            try {
                String source = data.get("inputDigest") + "|" + fingerprint;
                checkout.put("checkoutDigest", java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                        .digest(source.getBytes(java.nio.charset.StandardCharsets.UTF_8))));
            } catch (Exception failure) { throw new ApplicationException(failure); }
            data.put("checkout", checkout); metadata.put("PLAN_SUBSCRIPTION", data);
            form.setMetadata(metadata); formManager.save(form); return true;
        });
    }

    public Boolean staleFeature(Integer formId) { return staleEntitlements(formId, "FEATURE"); }
    public Boolean staleLevel(Integer formId) { return staleEntitlements(formId, "LEVEL"); }
    public Boolean staleCapacity(Integer formId) { return staleEntitlements(formId, "CAPACITY"); }
    public Boolean staleWeather(Integer formId) { return staleEntitlements(formId, "WEATHER"); }
    public Boolean staleMapping(Integer formId) { return staleEntitlements(formId, "MAPPING"); }
    public Boolean legacyCheckout(Integer formId) { return staleEntitlements(formId, "LEGACY"); }

    // Simulate a previously reviewed catalog without editing any shared Product.
    // Rewrite all bound digests so rejection must compare with the fresh catalog,
    // rather than merely detect a broken hash or token/Checkout mismatch.
    private Boolean staleEntitlements(Integer formId, String kind) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            if (!form.hasState("CHECKOUT_PREPARED")) throw new ApplicationException("Expected unconfirmed synthetic Checkout");
            try {
                Map<String, Object> metadata = com.pixelnation.common.json.Json.defaultMapper().readValue(
                        com.pixelnation.common.json.Json.defaultMapper().writeValueAsString(form.getMetadata()), Map.class);
                Map<String, Object> data = (Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION");
                Map<String, Object> checkout = (Map<String, Object>) data.get("checkout");
                Map<String, Object> preview = (Map<String, Object>) checkout.get("preview");
                Map<String, Object> snapshot = (Map<String, Object>) preview.get("entitlements");
                switch (kind) {
                    case "FEATURE" -> {
                        Map<String, Object> first = (Map<String, Object>) ((java.util.List<?>) snapshot.get("features")).get(0);
                        first.put("value", !Boolean.TRUE.equals(first.get("value")));
                    }
                    case "LEVEL" -> ((Map<String, Object>) ((java.util.List<?>) snapshot.get("levels")).get(0)).put("value", "Configurable");
                    case "CAPACITY" -> ((Map<String, Object>) snapshot.get("propertyCapacity")).put("limit", 99999);
                    case "WEATHER" -> ((Map<String, Object>) snapshot.get("weather")).put("propertyCount", 99999);
                    case "MAPPING" -> snapshot.put("configurationFingerprint", "0".repeat(64));
                    case "LEGACY" -> { preview.remove("entitlements"); preview.remove("entitlementFingerprint"); preview.put("schemaVersion", 2); checkout.remove("entitlementFingerprint"); }
                    default -> throw new ApplicationException("Unknown synthetic fixture");
                }
                if (!"LEGACY".equals(kind)) {
                    String entitlement = digest(com.pixelnation.common.json.Json.defaultMapper().writeValueAsString(canonical(snapshot)));
                    preview.put("entitlementFingerprint", entitlement); checkout.put("entitlementFingerprint", entitlement);
                }
                preview.remove("catalogFingerprint");
                String catalog = digest(com.pixelnation.common.json.Json.defaultMapper().writeValueAsString(canonical(preview)));
                preview.put("catalogFingerprint", catalog); checkout.put("catalogFingerprint", catalog);
                String checkoutDigest = digest(data.get("inputDigest") + "|" + catalog);
                checkout.put("checkoutDigest", checkoutDigest);
                ((Map<String, Object>) data.get("confirmation")).put("checkoutDigest", checkoutDigest);
                form.setMetadata(metadata); formManager.save(form); return true;
            } catch (Exception failure) { throw new ApplicationException(failure); }
        });
    }

    private static Object canonical(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> sorted = new java.util.TreeMap<>();
            for (var entry : map.entrySet()) sorted.put(String.valueOf(entry.getKey()), canonical(entry.getValue()));
            return sorted;
        }
        if (value instanceof java.util.Collection<?> list) return list.stream().map(MAIN_CLASS::canonical).toList();
        return value;
    }

    private static String digest(String source) throws Exception {
        return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(source.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }

    public Boolean forgetReceipt(Integer formId) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            Map<String, Object> metadata = new LinkedHashMap<>(form.getMetadata());
            Map<String, Object> data = new LinkedHashMap<>((Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION"));
            data.remove("purchase"); metadata.put("PLAN_SUBSCRIPTION", data);
            form.setMetadata(metadata); formManager.save(form); return true;
        });
    }

    public Boolean forgetBasePlanReceipt(Integer formId) {
        return transactionUtils.getInNewTxRW(() -> {
            Form form = owned(formId);
            Map<String, Object> metadata = new LinkedHashMap<>(form.getMetadata());
            Map<String, Object> data = new LinkedHashMap<>((Map<String, Object>) metadata.get("PLAN_SUBSCRIPTION"));
            Map<String, Object> purchase = new LinkedHashMap<>((Map<String, Object>) data.get("purchase"));
            purchase.remove("basePlanItemId");
            data.put("purchase", purchase); metadata.put("PLAN_SUBSCRIPTION", data);
            form.setMetadata(metadata); formManager.save(form); return true;
        });
    }

    private Form owned(Integer formId) {
        Form form = formManager.get(formId.longValue(), LockModeType.PESSIMISTIC_WRITE);
        if (form == null || !"PLAN_SUBSCRIPTION".equals(form.getType().getCode())
                || !"SERVICEWAND".equals(form.getOrganization().getCode())
                || !"plan-subscription-test@example.invalid".equals(form.findFirstAttributeValue("EMAIL"))
                || !String.valueOf((Object) form.findFirstAttributeValue("COMPANY_NAME")).startsWith("PLAN_SUBSCRIPTION integration ")) {
            throw new ApplicationException("Only synthetic subscription test forms may be inspected");
        }
        return form;
    }
}
