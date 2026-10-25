package com.pixelnation.bill.generated;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import com.pixelnation.bill.domain.Invoice;
import com.pixelnation.bill.persistence.iface.IInvoiceManager;
import com.pixelnation.common.domain.Organization;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.json.Json;
import com.pixelnation.common.persistence.iface.IOrganizationManager;
import com.pixelnation.common.persistence.iface.IUserManager;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import com.pixelnation.pay.process.PaymentRequestBuilderFactory;
import com.pixelnation.pay.process.PaymentResult;

public class MAIN_CLASS {
    private static final String KEY = "PLAN_SUBSCRIPTION";
    private static final String SELLER = "SERVICEWAND";
    @Autowired private IInvoiceManager invoiceManager;
    @Autowired private IUserManager userManager;
    @Autowired private IOrganizationManager organizationManager;
    @Autowired private TransactionUtils transactionUtils;
    @Autowired private PaymentRequestBuilderFactory paymentRequestBuilderFactory;

    private record Charge(BigDecimal amount, String currency) {}

    public Map<String, Object> createInvoicePayment(String payloadJson) {
        User caller = Auth.getAuthenticatedUser();
        if (caller == null || !userManager.getSystemUserId().equals(caller.getId())) {
            throw new ApplicationException("Only the purchase system executor may create a payment");
        }
        Map<String, Object> payload = read(payloadJson);
        long invoiceId = number(payload.get("invoiceId")), orderId = number(payload.get("orderId"));
        String email = String.valueOf(payload.getOrDefault("email", "")).trim();
        Charge charge = transactionUtils.getInNewTx(() -> {
            Invoice invoice = invoiceManager.get(invoiceId);
            if (invoice == null || invoice.getOrder() == null || invoice.getOrder().getId().longValue() != orderId
                    || invoice.getOrganization() == null || !SELLER.equals(invoice.getOrganization().getCode())
                    || invoice.getOrder().getOrganization() == null || !invoice.getOrganization().getId().equals(invoice.getOrder().getOrganization().getId())) {
                throw new ApplicationException("Subscription invoice does not match the purchase");
            }
            Object receipt = invoice.getMetadata() == null ? null : invoice.getMetadata().get(KEY);
            if (!(receipt instanceof Map<?, ?> prepared) || !Boolean.TRUE.equals(prepared.get("preparationOnly"))) {
                throw new ApplicationException("Only a prepared subscription invoice can be paid here");
            }
            if (!invoice.hasState("SUBMITTED") || !invoice.getOrder().hasState("SUBMITTED")
                    || !invoice.getPayments().isEmpty() || invoice.getTotalPaidAmount().signum() != 0) {
                throw new ApplicationException("Subscription invoice is not awaiting its payment");
            }
            BigDecimal outstanding = invoice.getAmountDue().subtract(invoice.getTotalPaidAmount());
            if (outstanding.signum() <= 0 || invoice.getOrder().getCurrency() == null) throw new ApplicationException("Subscription invoice has nothing to pay");
            return new Charge(outstanding, invoice.getOrder().getCurrency().getCode().toLowerCase(Locale.ROOT));
        });
        Map<String, Object> instructions = transactionUtils.getInNewTxRW(() -> asSeller(organizationManager.getByCode(SELLER), () -> {
            Invoice invoice = invoiceManager.get(invoiceId);
            PaymentResult result = paymentRequestBuilderFactory.forInvoice(invoice).amount(charge.amount())
                    .account(invoice.getOrder().getAccount()).extras(email.isEmpty() ? Map.of() : Map.of("email", email)).dispatch();
            Map<String, Object> out = new java.util.LinkedHashMap<>();
            if (result != null && result.getClientInstructions() != null) result.getClientInstructions().forEach((key, value) -> out.put(String.valueOf(key), value));
            return out;
        }));
        String secret = java.util.stream.Stream.of("client_secret", "clientSecret").map(instructions::get).filter(String.class::isInstance)
                .map(String.class::cast).findFirst().orElse(null);
        if (secret == null || !secret.matches("pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+")) {
            return Map.of("error", "Payment instructions carry no client secret", "instructionKeys", List.copyOf(instructions.keySet()));
        }
        String intent = secret.substring(0, secret.indexOf("_secret_"));
        return Map.of("clientSecret", secret, "paymentIntentId", intent, "amount", charge.amount().toPlainString(), "currency", charge.currency());
    }

    private <T> T asSeller(Organization seller, Supplier<T> action) {
        var previous = org.springframework.security.core.context.SecurityContextHolder.getContext();
        var scoped = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        List<org.springframework.security.core.GrantedAuthority> authorities = List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("P_USER"),
                new org.springframework.security.core.authority.SimpleGrantedAuthority("P_INVOICE_R"));
        scoped.setAuthentication(new com.pixelnation.spring.security.RunAsAuthenticationToken(userManager.getSystemUser(), seller, authorities));
        try {
            org.springframework.security.core.context.SecurityContextHolder.setContext(scoped);
            return action.get();
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.setContext(previous);
        }
    }

    private Map<String, Object> read(String payloadJson) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = Json.defaultMapper().readValue(payloadJson, Map.class);
            return payload;
        } catch (Exception failure) {
            throw new ApplicationException("Payment payload is required");
        }
    }

    private long number(Object value) {
        if (!(value instanceof Number number) || number.longValue() <= 0) throw new ApplicationException("Payment payload is incomplete");
        return number.longValue();
    }
}
