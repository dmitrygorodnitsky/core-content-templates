import java.math.BigDecimal;
import java.util.Set;

public final class PurchaseLifecycle {
    public static final String MARK_INVOICE_PAID = "MARK_INVOICE_PAID";
    public static final String ACTIVATE_ORDER = "ACTIVATE_ORDER";
    public static final String COMPLETE = "COMPLETE";
    public static final String WAIT = "WAIT";
    private static final Set<String> ORDER_STATES = Set.of("DRAFT", "SUBMITTED", "ACTIVE");

    private PurchaseLifecycle() {}

    public static void requireOrder(String orderState) {
        if (!ORDER_STATES.contains(orderState)) throw new IllegalStateException("Subscription order must be DRAFT, SUBMITTED or ACTIVE");
    }

    public static void requireInvoice(String invoiceState, String orderState, BigDecimal amountDue, BigDecimal paid, int payments) {
        requireOrder(orderState);
        requireAmounts(amountDue, paid, payments);
        switch (String.valueOf(invoiceState)) {
            case "DRAFT" -> {
                if (!unpaid(paid, payments) || "ACTIVE".equals(orderState)) throw new IllegalStateException("A draft subscription invoice must stay unpaid");
            }
            case "SUBMITTED" -> {
                if (!"SUBMITTED".equals(orderState)) throw new IllegalStateException("A submitted subscription invoice requires its submitted order");
                if (!unpaid(paid, payments) && !fullyPaid(amountDue, paid, payments)) throw new IllegalStateException("A subscription invoice accepts one payment of the full amount");
            }
            case "PAID" -> {
                if ("DRAFT".equals(orderState) || !fullyPaid(amountDue, paid, payments)) throw new IllegalStateException("A paid subscription invoice requires one full payment");
            }
            default -> throw new IllegalStateException("Subscription invoice state is not supported");
        }
    }

    public static void requireInvoiceLeavesDraft(String orderState) {
        if (!"SUBMITTED".equals(orderState)) throw new IllegalStateException("A subscription invoice is submitted together with its order");
    }

    public static void requireInvoicePaid(BigDecimal amountDue, BigDecimal paid, int payments) {
        requireAmounts(amountDue, paid, payments);
        if (!fullyPaid(amountDue, paid, payments)) throw new IllegalStateException("A subscription invoice is paid only by one full payment");
    }

    public static void requireOrderActivation(String invoiceState) {
        if (!"PAID".equals(invoiceState)) throw new IllegalStateException("A subscription order becomes active only after its invoice is paid");
    }

    public static String nextStep(String invoiceState, String orderState, BigDecimal amountDue, BigDecimal paid, int payments) {
        if ("SUBMITTED".equals(invoiceState) && "SUBMITTED".equals(orderState) && fullyPaid(amountDue, paid, payments)) return MARK_INVOICE_PAID;
        if ("PAID".equals(invoiceState) && "SUBMITTED".equals(orderState)) return ACTIVATE_ORDER;
        if ("PAID".equals(invoiceState) && "ACTIVE".equals(orderState)) return COMPLETE;
        return WAIT;
    }

    private static void requireAmounts(BigDecimal amountDue, BigDecimal paid, int payments) {
        if (amountDue == null || amountDue.signum() <= 0 || paid == null || paid.signum() < 0 || payments < 0) {
            throw new IllegalStateException("Subscription invoice amounts are invalid");
        }
    }

    private static boolean unpaid(BigDecimal paid, int payments) {
        return paid.signum() == 0 && payments == 0;
    }

    private static boolean fullyPaid(BigDecimal amountDue, BigDecimal paid, int payments) {
        return amountDue != null && paid != null && payments == 1 && paid.compareTo(amountDue) == 0;
    }
}
