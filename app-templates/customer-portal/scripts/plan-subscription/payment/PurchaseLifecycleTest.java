import java.math.BigDecimal;

public final class PurchaseLifecycleTest {
    static int checks;
    static void check(boolean condition) { if (!condition) throw new AssertionError(); checks++; }
    static void bad(Runnable action) { boolean rejected = false; try { action.run(); } catch (RuntimeException expected) { rejected = true; } check(rejected); }
    static BigDecimal money(String value) { return new BigDecimal(value); }

    public static void main(String[] args) {
        BigDecimal due = money("8355.20"), zero = BigDecimal.ZERO;

        for (String state : new String[] {"DRAFT", "ACCEPTED", "ACTIVE", "SUSPENDED", "COMPLETED", "CANCELED"}) { PurchaseLifecycle.requireOrder(state); checks++; }
        bad(() -> PurchaseLifecycle.requireOrder("SUBMITTED"));
        bad(() -> PurchaseLifecycle.requireOrder("QUOTE_SENT"));
        bad(() -> PurchaseLifecycle.requireOrder(null));

        PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", due, zero, 0); checks++;
        PurchaseLifecycle.requireInvoice("DRAFT", "ACCEPTED", due, zero, 0); checks++;
        PurchaseLifecycle.requireInvoice("DRAFT", "CANCELED", due, zero, 0); checks++;
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "ACTIVE", due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", due, due, 1));

        for (String state : new String[] {"SENT", "OVERDUE"}) {
            PurchaseLifecycle.requireInvoice(state, "ACCEPTED", due, zero, 0); checks++;
            PurchaseLifecycle.requireInvoice(state, "ACCEPTED", due, money("8355.2"), 1); checks++;
            PurchaseLifecycle.requireInvoice(state, "CANCELED", due, zero, 0); checks++;
            bad(() -> PurchaseLifecycle.requireInvoice(state, "DRAFT", due, zero, 0));
            bad(() -> PurchaseLifecycle.requireInvoice(state, "ACTIVE", due, zero, 0));
            bad(() -> PurchaseLifecycle.requireInvoice(state, "ACCEPTED", due, money("100"), 1));
            bad(() -> PurchaseLifecycle.requireInvoice(state, "ACCEPTED", due, due, 2));
            bad(() -> PurchaseLifecycle.requireInvoice(state, "ACCEPTED", due, money("9000"), 1));
        }
        bad(() -> PurchaseLifecycle.requireInvoice("SUBMITTED", "ACCEPTED", due, zero, 0));

        for (String state : new String[] {"ACCEPTED", "ACTIVE", "SUSPENDED", "COMPLETED", "CANCELED"}) { PurchaseLifecycle.requireInvoice("PAID", state, due, due, 1); checks++; }
        bad(() -> PurchaseLifecycle.requireInvoice("PAID", "DRAFT", due, due, 1));
        bad(() -> PurchaseLifecycle.requireInvoice("PAID", "ACTIVE", due, zero, 0));
        PurchaseLifecycle.requireInvoice("VOID", "CANCELED", due, zero, 0); checks++;
        bad(() -> PurchaseLifecycle.requireInvoice("CANCELLED", "ACCEPTED", due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", zero, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", null, zero, 0));

        check(PurchaseLifecycle.nextStep("SENT", "ACCEPTED", due, zero, 0).equals(PurchaseLifecycle.WAIT));
        check(PurchaseLifecycle.nextStep("SENT", "ACCEPTED", due, due, 1).equals(PurchaseLifecycle.MARK_INVOICE_PAID));
        check(PurchaseLifecycle.nextStep("OVERDUE", "ACCEPTED", due, due, 1).equals(PurchaseLifecycle.MARK_INVOICE_PAID));
        check(PurchaseLifecycle.nextStep("SENT", "CANCELED", due, due, 1).equals(PurchaseLifecycle.WAIT));
        check(PurchaseLifecycle.nextStep("PAID", "ACCEPTED", due, due, 1).equals(PurchaseLifecycle.ACTIVATE_ORDER));
        check(PurchaseLifecycle.nextStep("PAID", "ACTIVE", due, due, 1).equals(PurchaseLifecycle.COMPLETE));
        check(PurchaseLifecycle.nextStep("PAID", "SUSPENDED", due, due, 1).equals(PurchaseLifecycle.WAIT));
        check(PurchaseLifecycle.nextStep("DRAFT", "DRAFT", due, zero, 0).equals(PurchaseLifecycle.WAIT));

        System.out.println("PurchaseLifecycleTest: " + checks + " checks passed");
    }
}
