package com.pixelnation.bill.generated;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import com.pixelnation.bill.domain.Order;
import com.pixelnation.bill.domain.Invoice;
import com.pixelnation.bill.persistence.iface.IInvoiceManager;
import com.pixelnation.bill.persistence.iface.IOrderManager;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.domain.Organization;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

// Temporary dev-1 fixture helper only. Never bind to a workflow or seed permanently.
public class MAIN_CLASS {
    private static final String KEY = "PLAN_SUBSCRIPTION";
    private static final String ORIGINAL = "DEV_TEST_ORIGINAL_CATALOG_FINGERPRINT";
    @Autowired private IOrderManager orderManager;
    @Autowired private IInvoiceManager invoiceManager;
    @Autowired private TransactionUtils transactionUtils;
    @PersistenceContext private EntityManager entityManager;

    public Boolean inspectConfiguration() { return asAdmin(() -> true); }

    public java.util.List<Long> unlockPreparedInvoiceCleanup(Integer orderId, Integer formId, String run) {
        return asAdmin(() -> {
            Order order = owned(orderId, formId, run);
            var invoices = invoiceManager.selectJPQL("SELECT i FROM Invoice i WHERE i.order.id = :id", Map.of("id", order.getId()), Invoice.class);
            java.util.List<Long> ids = new java.util.ArrayList<>();
            for (Invoice invoice : invoices) {
                Object value = invoice.getMetadata().get(KEY);
                boolean ownedReceipt = value instanceof Map<?, ?> receipt
                        && receipt.get("sourceFormId") instanceof Number source && source.longValue() == formId.longValue();
                boolean alreadyUnlocked = run.equals(invoice.getMetadata().get("DEV_TEST_CLEANUP"));
                if (!invoice.hasState("DRAFT") || !invoice.getPayments().isEmpty() || !(ownedReceipt || alreadyUnlocked)) {
                    throw new ApplicationException("Only the exact unpaid synthetic preparation invoice may be unlocked");
                }
                invoice.setMetadata(new LinkedHashMap<>(Map.of("DEV_TEST_CLEANUP", run)));
                invoiceManager.save(invoice); ids.add(invoice.getId());
            }
            Map<String, Object> metadata = new LinkedHashMap<>(order.getMetadata());
            Map<String, Object> purchase = new LinkedHashMap<>(map(metadata.get(KEY)));
            purchase.remove("invoicePreparation"); metadata.put(KEY, purchase); order.setMetadata(metadata);
            orderManager.save(order); orderManager.flush(); invoiceManager.flush();
            return ids;
        });
    }

    public Boolean emptyWithStaleSnapshot(Integer orderId, Integer formId, String run) {
        return asAdmin(() -> {
            Order order = owned(orderId, formId, run);
            if (map(order.getMetadata().get(KEY)).get("invoicePreparation") instanceof Map<?, ?> invoice && invoice.get("invoiceId") != null)
                throw new ApplicationException("Never clear items linked to a prepared invoice");
            if (order.getItems().isEmpty()) throw new ApplicationException("Expected synthetic purchase items");
            for (var item : order.getItems()) {
                Map<String, Object> line = map(item.getMetadata().get(KEY));
                if (!java.util.Set.of("BASE_PLAN", "SITE_EXPANSION", "WEATHER").contains(line.get("role"))
                        || ((Number) line.get("sourceFormId")).longValue() != formId.longValue()) {
                    throw new ApplicationException("Item escaped the synthetic purchase");
                }
            }
            Map<String, Object> metadata = new LinkedHashMap<>(order.getMetadata());
            Map<String, Object> saved = new LinkedHashMap<>(map(metadata.get(KEY)));
            Map<String, Object> preview = new LinkedHashMap<>(map(saved.get("planPreview")));
            saved.put(ORIGINAL, preview.get("catalogFingerprint"));
            preview.put("catalogFingerprint", "0".repeat(64));
            saved.put("planPreview", preview);
            saved.remove("basePlanMaterialized"); saved.remove("basePlanPricingStatus");
            metadata.put(KEY, saved); order.setMetadata(metadata);
            // Mutate the managed collection; the ordinary CRUD collection setter
            // cannot safely represent this orphan-removal fixture.
            order.getItems().clear();
            orderManager.save(order); orderManager.flush();
            return true;
        });
    }

    public Boolean restoreSnapshot(Integer orderId, Integer formId, String run) {
        return asAdmin(() -> {
            Order order = owned(orderId, formId, run);
            if (!order.getItems().isEmpty()) throw new ApplicationException("Expected the synthetic empty draft");
            Map<String, Object> metadata = new LinkedHashMap<>(order.getMetadata());
            Map<String, Object> saved = new LinkedHashMap<>(map(metadata.get(KEY)));
            Object original = saved.remove(ORIGINAL);
            if (!(original instanceof String digest) || !digest.matches("[a-f0-9]{64}")) {
                throw new ApplicationException("Original synthetic snapshot was not saved");
            }
            Map<String, Object> preview = new LinkedHashMap<>(map(saved.get("planPreview")));
            preview.put("catalogFingerprint", original); saved.put("planPreview", preview);
            metadata.put(KEY, saved); order.setMetadata(metadata);
            orderManager.save(order); orderManager.flush();
            return true;
        });
    }

    private Order owned(Integer orderId, Integer formId, String run) {
        if (!Auth.isAuthenticatedSystemAdmin() || run == null || !run.matches("[a-f0-9]{8}")) {
            throw new ApplicationException("Administrator and exact synthetic run are required");
        }
        Order order = orderManager.get(orderId.longValue(), LockModeType.PESSIMISTIC_WRITE);
        if (order != null) entityManager.refresh(order, LockModeType.PESSIMISTIC_WRITE);
        if (order == null || order.getType() == null || !"SERVICEWAND_SUBSCRIPTION".equals(order.getType().getCode())
                || !order.hasState("DRAFT") || order.getOrganization() == null || !"SERVICEWAND".equals(order.getOrganization().getCode())
                || order.getAccount() == null || !"PLAN_SUBSCRIPTION integration ".concat(run).equals(order.getAccount().getNls().getOrDefault("en", Map.of()).get("NAME"))) {
            throw new ApplicationException("Only the exact synthetic subscription draft may be changed");
        }
        Map<String, Object> saved = map(order.getMetadata().get(KEY));
        if (!Boolean.TRUE.equals(saved.get("draftOnly")) || ((Number) saved.get("sourceFormId")).longValue() != formId.longValue()) {
            throw new ApplicationException("Synthetic purchase Form does not match");
        }
        boolean email = order.getAccount().getContacts().stream().flatMap(c -> c.getContactEntries().stream())
                .anyMatch(e -> e.getType() != null && "EMAIL".equals(e.getType().getCode()) && "plan-subscription-test@example.invalid".equals(e.getValue()));
        if (!email) throw new ApplicationException("Reserved synthetic email is required");
        return order;
    }

    private <T> T asAdmin(Supplier<T> action) {
        Integer id = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (id == null) throw new ApplicationException("Authenticated administrator required");
        return transactionUtils.getInNewTxRW(() -> {
            User caller = entityManager.find(User.class, id);
            Organization system = entityManager.createQuery("SELECT o FROM Organization o WHERE o.code = :code", Organization.class)
                    .setParameter("code", "SYSTEM").getSingleResult();
            if (caller == null) throw new ApplicationException("Authenticated administrator was removed");
            return Auth.withUser(caller, system, (Supplier<T>) () -> {
                if (!Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("Administrator required");
                return action.get();
            }).get();
        });
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object value) {
        if (!(value instanceof Map<?, ?>)) throw new ApplicationException("Synthetic snapshot is missing");
        return (Map<String, Object>) value;
    }
}
