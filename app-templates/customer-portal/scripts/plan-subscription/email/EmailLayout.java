import java.util.List;

public final class EmailLayout {
    private static final String FONT = "font-family:'Vela Sans',Arial,Helvetica,sans-serif;";
    private static final String TEXT = "color:#D9D9D9;";
    private static final String MUTED = "color:#97A2B8;";
    private static final String HEADING = "color:#FFFFFF;";
    private static final String RULE = "border-top:1px solid #343849;";
    private static final String TABLE = "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"";
    private static final int MIN_HEIGHT = 680;
    private static final String GRADIENT = "background-color:#6BEAF9;background-image:linear-gradient(90deg,#6BEDF9 0%,#FFA72C 100%);";

    private EmailLayout() {}

    public static String escape(Object value) {
        String text = String.valueOf(value);
        StringBuilder out = new StringBuilder(text.length());
        for (int index = 0; index < text.length(); index++) {
            char c = text.charAt(index);
            switch (c) {
                case '&' -> out.append("&amp;");
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                case '"' -> out.append("&quot;");
                case '\'' -> out.append("&#39;");
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    public static String document(String heading, String... blocks) {
        StringBuilder content = new StringBuilder();
        for (String block : blocks) if (block != null) content.append(block);
        return "<!doctype html><html style=\"height:100%;\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<meta name=\"color-scheme\" content=\"dark\"><meta name=\"supported-color-schemes\" content=\"dark\"></head>"
                + "<body style=\"margin:0;padding:0;height:100%;background-color:#17171B;\">"
                + TABLE + " height=\"100%\" bgcolor=\"#17171B\" style=\"height:100%;min-height:" + MIN_HEIGHT + "px;background-color:#17171B;\">"
                + "<tr><td align=\"center\" valign=\"middle\" height=\"" + MIN_HEIGHT + "\" style=\"height:" + MIN_HEIGHT + "px;padding:48px 12px;\">"
                + TABLE + " style=\"max-width:600px;\">"
                + "<tr><td style=\"padding:0 4px 18px;" + FONT + "font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.01em;" + HEADING + "\">"
                + "Service<span style=\"color:#6BEAF9;\">Wand</span></td></tr>"
                + "<tr><td bgcolor=\"#20232D\" style=\"background-color:#20232D;background-image:linear-gradient(180deg,#20232D 0%,#2C2D3C 100%);"
                + "border:1px solid #3B4258;border-radius:20px;overflow:hidden;\">"
                + TABLE + "><tr><td height=\"3\" style=\"height:3px;line-height:3px;font-size:0;" + GRADIENT + "\">&nbsp;</td></tr>"
                + "<tr><td style=\"padding:30px 28px 32px;\">"
                + "<h1 style=\"margin:0 0 20px;" + FONT + "font-size:22px;line-height:1.3;font-weight:700;" + HEADING + "\">" + escape(heading) + "</h1>"
                + content
                + "</td></tr></table></td></tr></table></td></tr></table></body></html>";
    }

    public static String paragraph(String text) {
        return "<p style=\"margin:0 0 16px;" + FONT + "font-size:15px;line-height:1.6;" + TEXT + "\">" + escape(text) + "</p>";
    }

    public static String note(String text) {
        return "<p style=\"margin:0 0 12px;" + FONT + "font-size:13px;line-height:1.55;" + MUTED + "\">" + escape(text) + "</p>";
    }

    public static String button(String label, String href) {
        return TABLE.replace("width=\"100%\" ", "") + " style=\"margin:8px 0 22px;\"><tr><td bgcolor=\"#6BEAF9\" style=\"border-radius:100px;" + GRADIENT + "\">"
                + "<a href=\"" + escape(href) + "\" target=\"_blank\" style=\"display:inline-block;padding:14px 28px;" + FONT
                + "font-size:15px;line-height:1.2;font-weight:700;color:#1B1D25;text-decoration:none;border-radius:100px;\">" + escape(label) + "</a>"
                + "</td></tr></table>";
    }

    public static String details(String... labelsAndValues) {
        if (labelsAndValues.length == 0 || labelsAndValues.length % 2 != 0) throw new IllegalArgumentException("Details need label and value pairs");
        StringBuilder rows = new StringBuilder();
        for (int index = 0; index < labelsAndValues.length; index += 2) {
            String border = index == 0 ? "" : RULE;
            rows.append("<tr><td valign=\"top\" style=\"padding:9px 12px 9px 0;width:42%;").append(border).append(FONT)
                .append("font-size:13px;line-height:1.5;").append(MUTED).append("\">").append(escape(labelsAndValues[index])).append("</td>")
                .append("<td valign=\"top\" style=\"padding:9px 0;").append(border).append(FONT)
                .append("font-size:14px;line-height:1.5;").append(HEADING).append("\">").append(escape(labelsAndValues[index + 1])).append("</td></tr>");
        }
        return section(rows.toString());
    }

    public static String lines(List<List<String>> rows) {
        if (rows.isEmpty()) throw new IllegalArgumentException("Lines are required");
        StringBuilder html = new StringBuilder();
        for (int index = 0; index < rows.size(); index++) {
            List<String> row = rows.get(index);
            if (row.size() != 3) throw new IllegalArgumentException("A line needs a name, a quantity and an amount");
            String border = index == 0 ? "" : RULE;
            html.append("<tr><td valign=\"top\" style=\"padding:10px 10px 10px 0;").append(border).append(FONT)
                .append("font-size:14px;line-height:1.45;").append(HEADING).append("\">").append(escape(row.get(0))).append("</td>")
                .append("<td valign=\"top\" style=\"padding:10px 10px;white-space:nowrap;").append(border).append(FONT)
                .append("font-size:13px;line-height:1.45;").append(MUTED).append("\">").append(escape(row.get(1))).append("</td>")
                .append("<td valign=\"top\" align=\"right\" style=\"padding:10px 0;white-space:nowrap;text-align:right;").append(border).append(FONT)
                .append("font-size:14px;line-height:1.45;font-weight:700;").append(HEADING).append("\">").append(escape(row.get(2))).append("</td></tr>");
        }
        return section(html.toString());
    }

    public static String amounts(String rows) {
        return TABLE + " style=\"margin:0 0 20px;" + RULE + "\">" + rows + "</table>";
    }

    public static String amountRow(String label, String value, boolean strong) {
        String size = strong ? "font-size:16px;font-weight:700;" : "font-size:14px;";
        return "<tr><td style=\"padding:10px 12px 0 0;" + FONT + size + "line-height:1.45;" + (strong ? HEADING : TEXT) + "\">" + escape(label) + "</td>"
                + "<td align=\"right\" style=\"padding:10px 0 0;white-space:nowrap;text-align:right;" + FONT + size + "line-height:1.45;" + HEADING + "\">"
                + escape(value) + "</td></tr>";
    }

    public static String amountNote(String text) {
        return "<tr><td colspan=\"2\" style=\"padding:10px 0 0;" + FONT + "font-size:13px;line-height:1.55;" + MUTED + "\">" + escape(text) + "</td></tr>";
    }

    private static String section(String rows) {
        return TABLE + " bgcolor=\"#1B1D25\" style=\"margin:0 0 16px;background-color:#1B1D25;border:1px solid #343849;border-radius:14px;\">"
                + "<tr><td style=\"padding:6px 16px;\">" + TABLE + ">" + rows + "</table></td></tr></table>";
    }
}
