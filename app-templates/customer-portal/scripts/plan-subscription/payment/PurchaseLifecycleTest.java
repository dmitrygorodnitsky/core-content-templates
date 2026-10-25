import java.math.BigDecimal;

public final class PurchaseLifecycleTest {
    static int checks;
    static void check(boolean condition) { if (!condition) throw new AssertionError(); checks++; }
    static void bad(Runnable action) { boolean rejected = false; try { action.run(); } catch (RuntimeException expected) { rejected = true; } check(rejected); }
    static BigDecimal money(String value) { return new BigDecimal(value); }

    public static void main(String[] args) {
        BigDecimal due = money("8355.20"), zero = BigDecimal.ZERO;

        PurchaseLifecycle.requireOrder("DRAFT"); PurchaseLifecycle.requireOrder("SUBMITTED"); PurchaseLifecycle.requireOrder("ACTIVE"); checks += 3;
        bad(() -> PurchaseLifecycle.requireOrder("CANCELED"));
        bad(() -> PurchaseLifecycle.requireOrder(null));

        PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", due, zero, 0); checks++;
        PurchaseLifecycle.requireInvoice("DRAFT", "SUBMITTED", due, zero, 0); checks++;
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "ACTIVE", due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", due, due, 1));

        PurchaseLifecycle.requireInvoice("SUBMITTED", "SUBMITTED", due, zero, 0); checks++;
        PurchaseLifecycle.requireInvoice("SUBMITTED", "SUBMITTED", due, money("8355.2"), 1); checks++;
        bad(() -> PurchaseLifecycle.requireInvoice("SUBMITTED", "DRAFT", due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("SUBMITTED", "SUBMITTED", due, money("100"), 1));
        bad(() -> PurchaseLifecycle.requireInvoice("SUBMITTED", "SUBMITTED", due, due, 2));
        bad(() -> PurchaseLifecycle.requireInvoice("SUBMITTED", "SUBMITTED", due, money("9000"), 1));

        PurchaseLifecycle.requireInvoice("PAID", "SUBMITTED", due, due, 1); checks++;
        PurchaseLifecycle.requireInvoice("PAID", "ACTIVE", due, due, 1); checks++;
        bad(() -> PurchaseLifecycle.requireInvoice("PAID", "DRAFT", due, due, 1));
        bad(() -> PurchaseLifecycle.requireInvoice("PAID", "ACTIVE", due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("CANCELLED", "SUBMITTED", due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", zero, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoice("DRAFT", "DRAFT", null, zero, 0));

        PurchaseLifecycle.requireInvoiceLeavesDraft("SUBMITTED"); checks++;
        bad(() -> PurchaseLifecycle.requireInvoiceLeavesDraft("DRAFT"));

        PurchaseLifecycle.requireInvoicePaid(due, due, 1); checks++;
        bad(() -> PurchaseLifecycle.requireInvoicePaid(due, zero, 0));
        bad(() -> PurchaseLifecycle.requireInvoicePaid(due, money("8000"), 1));

        PurchaseLifecycle.requireOrderActivation("PAID"); checks++;
        bad(() -> PurchaseLifecycle.requireOrderActivation("SUBMITTED"));

        check(PurchaseLifecycle.nextStep("SUBMITTED", "SUBMITTED", due, zero, 0).equals(PurchaseLifecycle.WAIT));
        check(PurchaseLifecycle.nextStep("SUBMITTED", "SUBMITTED", due, due, 1).equals(PurchaseLifecycle.MARK_INVOICE_PAID));
        check(PurchaseLifecycle.nextStep("PAID", "SUBMITTED", due, due, 1).equals(PurchaseLifecycle.ACTIVATE_ORDER));
        check(PurchaseLifecycle.nextStep("PAID", "ACTIVE", due, due, 1).equals(PurchaseLifecycle.COMPLETE));
        check(PurchaseLifecycle.nextStep("DRAFT", "DRAFT", due, zero, 0).equals(PurchaseLifecycle.WAIT));

        System.out.println("PurchaseLifecycleTest: " + checks + " checks passed");
    }
}
