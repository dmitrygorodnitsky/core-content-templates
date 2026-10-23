import java.util.List;

public final class EmailLayoutTest {
    static int checks;
    static void check(boolean condition) { if (!condition) throw new AssertionError(); checks++; }
    static void bad(Runnable action) { boolean rejected = false; try { action.run(); } catch (RuntimeException expected) { rejected = true; } check(rejected); }

    public static void main(String[] args) {
        check(EmailLayout.escape("<a href=\"x\">Tom & 'Jerry'</a>").equals("&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;"));
        check(EmailLayout.escape(null).equals("null"));

        String page = EmailLayout.document("Confirm <your> email", EmailLayout.paragraph("Hello & welcome"), null, EmailLayout.note("Small print"));
        check(page.startsWith("<!doctype html>"));
        check(page.contains("<h1 ") && page.contains("Confirm &lt;your&gt; email</h1>"));
        check(page.contains("Hello &amp; welcome</p>") && page.contains("Small print</p>"));
        check(page.indexOf("Hello") < page.indexOf("Small print"));
        check(page.contains("bgcolor=\"#17171B\"") && page.contains("max-width:600px"));
        check(page.contains("valign=\"middle\" height=\"680\"") && page.contains("<body style=\"margin:0;padding:0;height:100%;"));
        check(page.split("<table", -1).length - 1 == page.split("</table>", -1).length - 1);
        check(!page.contains("<script") && !page.contains("<style"));

        String button = EmailLayout.button("Confirm email", "https://dev-1.servicewand.com/subscribe-confirm.html#step=verify&token=a\"b");
        check(button.contains("href=\"https://dev-1.servicewand.com/subscribe-confirm.html#step=verify&amp;token=a&quot;b\""));
        check(button.contains(">Confirm email</a>") && button.contains("color:#1B1D25"));

        String details = EmailLayout.details("Company", "Northline <Snow>", "Email", "avery@northline.example");
        check(details.contains(">Company</td>") && details.contains(">Northline &lt;Snow&gt;</td>"));
        check(details.split("<tr>", -1).length - 1 == 3);
        bad(() -> EmailLayout.details("Company"));
        bad(() -> EmailLayout.details());

        String lines = EmailLayout.lines(List.of(List.of("Growth plan", "1 x 249.00", "249.00 CAD"), List.of("Site pack", "2 x 40.00", "80.00 CAD")));
        check(lines.contains(">Growth plan</td>") && lines.contains(">2 x 40.00</td>") && lines.contains(">80.00 CAD</td>"));
        check(lines.indexOf("Growth plan") < lines.indexOf("Site pack"));
        bad(() -> EmailLayout.lines(List.of()));
        bad(() -> EmailLayout.lines(List.of(List.of("Growth plan", "1 x 249.00"))));

        String amounts = EmailLayout.amounts(EmailLayout.amountRow("Subtotal before taxes", "329.00 CAD", false)
                + EmailLayout.amountRow("Total including taxes", "345.45 CAD", true)
                + EmailLayout.amountNote("Taxes & totals"));
        check(amounts.contains(">Subtotal before taxes</td>") && amounts.contains(">345.45 CAD</td>"));
        check(amounts.contains("font-size:16px;font-weight:700;") && amounts.contains(">Taxes &amp; totals</td>"));
        check(amounts.contains("colspan=\"2\""));

        System.out.println("EmailLayoutTest: " + checks + " checks passed");
    }
}
