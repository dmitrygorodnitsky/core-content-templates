import java.math.BigDecimal;
import java.util.Set;

public final class PurchaseLifecycle {
    public static final String MARK_INVOICE_PAID = "MARK_INVOICE_PAID";
    public static final String ACTIVATE_ORDER = "ACTIVATE_ORDER";
    public static final String COMPLETE = "COMPLETE";
    public static final String WAIT = "WAIT";
    private static final Set<String> ORDER_STATES = Set.of("DRAFT", "ACCEPTED", "ACTIVE", "SUSPENDED", "COMPLETED", "CANCELED");
    private static final Set<String> PAYABLE_INVOICE_STATES = Set.of("SENT", "OVERDUE");

    private PurchaseLifecycle() {}

    public static void requireOrder(String orderState) {
        if (!ORDER_STATES.contains(orderState)) {
            throw new IllegalStateException("Subscription order must be DRAFT, ACCEPTED, ACTIVE, SUSPENDED, COMPLETED or CANCELED");
        }
    }

    public static void requireInvoice(String invoiceState, String orderState, BigDecimal amountDue, BigDecimal paid, int payments) {
        requireOrder(orderState);
        requireAmounts(amountDue, paid, payments);
        switch (String.valueOf(invoiceState)) {
            case "DRAFT" -> {
                if (!unpaid(paid, payments) || !Set.of("DRAFT", "ACCEPTED", "CANCELED").contains(orderState)) {
                    throw new IllegalStateException("A draft subscription invoice must stay unpaid");
                }
            }
            case "SENT", "OVERDUE" -> {
                if (!Set.of("ACCEPTED", "CANCELED").contains(orderState)) throw new IllegalStateException("A sent subscription invoice requires its accepted order");
                if (!unpaid(paid, payments) && !fullyPaid(amountDue, paid, payments)) throw new IllegalStateException("A subscription invoice accepts one payment of the full amount");
            }
            case "PAID" -> {
                if ("DRAFT".equals(orderState) || !fullyPaid(amountDue, paid, payments)) throw new IllegalStateException("A paid subscription invoice requires one full payment");
            }
            case "VOID" -> { }
            default -> throw new IllegalStateException("Subscription invoice state is not supported");
        }
    }

    public static String nextStep(String invoiceState, String orderState, BigDecimal amountDue, BigDecimal paid, int payments) {
        if (PAYABLE_INVOICE_STATES.contains(String.valueOf(invoiceState)) && "ACCEPTED".equals(orderState) && fullyPaid(amountDue, paid, payments)) return MARK_INVOICE_PAID;
        if ("PAID".equals(invoiceState) && "ACCEPTED".equals(orderState)) return ACTIVATE_ORDER;
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
