import java.util.*;
public final class PurchaseReadAccessTest {
    static int checks;
    static void check(boolean b){if(!b)throw new AssertionError();checks++;}
    static void bad(Runnable r){boolean rejected=false;try{r.run();}catch(RuntimeException expected){rejected=true;}check(rejected);}
    public static void main(String[]args){
        var entries=PurchaseReadAccess.entries(10,List.of(12L,11L),List.of(21L,20L));check(entries.size()==5);
        check(entries.get(0).get("entityType").equals("Order"));check(entries.get(1).get("entityId").equals(11L));
        check(entries.get(3).get("entityType").equals("ProductPrice"));check(entries.get(3).get("entityId").equals(20L));
        for(var entry:entries){
            check(entry.get("permissions").equals(List.of("ProductPrice".equals(entry.get("entityType"))?"P_PRICE_R":"P_ORDER_R")));
            check(entry.get("writeMappings").equals(List.of()));
        }
        for(var fields:List.of(PurchaseReadAccess.orderMappings(),PurchaseReadAccess.itemMappings(),PurchaseReadAccess.priceMappings()))
            for(var field:fields)check(!Set.of("metadata","attributes","account","organization","notes","updatedBy","workflow","permissions","tags").contains(field.get("name")));
        check(PurchaseReadAccess.priceMappings().equals(List.of(Map.of("name","id","type","primitive"),
                Map.of("name","product","type","identifier","mappings",List.of(Map.of("name","id","type","primitive"),Map.of("name","nls","type","primitive"))))));
        check(PurchaseReadAccess.ttlHours(24)==24);bad(()->PurchaseReadAccess.ttlHours(25));bad(()->PurchaseReadAccess.ttlHours(1.5));bad(()->PurchaseReadAccess.ttlHours("24"));bad(()->PurchaseReadAccess.ttlHours(0));
        var requested=List.<Map<String,Object>>of(Map.of("name","items","type","collection","mappings",List.of(Map.of("name","id","type","primitive"))));
        var effective=List.<Map<String,Object>>of(Map.of("name","items","type","collection","isImmutableElements",true,"collectionFilter",Map.of(),"mappings",List.of(Map.of("name","id","type","primitive"),Map.of("name","metadata","type","primitive"))));
        var narrowed=PurchaseReadAccess.narrow(requested,effective);check(Boolean.TRUE.equals(narrowed.get(0).get("isImmutableElements")));
        check(narrowed.get(0).get("collectionFilter").equals(Map.of()));check(narrowed.get(0).get("mappings").equals(requested.get(0).get("mappings")));
        bad(()->PurchaseReadAccess.narrow(requested,List.of()));
        bad(()->PurchaseReadAccess.narrow(requested,List.of(Map.of("name","items","type","primitive"))));
        bad(()->PurchaseReadAccess.entries(0,List.of(1L),List.of(9L)));bad(()->PurchaseReadAccess.entries(1,List.of(),List.of(9L)));bad(()->PurchaseReadAccess.entries(1,List.of(2L,2L),List.of(9L)));
        bad(()->PurchaseReadAccess.entries(1,List.of(2L,3L,4L,5L),List.of(9L)));bad(()->PurchaseReadAccess.entries(1,List.of(-2L),List.of(9L)));
        bad(()->PurchaseReadAccess.entries(1,List.of(2L),List.of()));bad(()->PurchaseReadAccess.entries(1,List.of(2L),List.of(8L,9L)));
        bad(()->PurchaseReadAccess.entries(1,List.of(2L,3L),List.of(9L,9L)));bad(()->PurchaseReadAccess.entries(1,List.of(2L),List.of(-9L)));
        check(PurchaseReadAccess.pageUrl(null)==null);bad(()->PurchaseReadAccess.pageUrl("http://example.com/purchase"));
        bad(()->PurchaseReadAccess.pageUrl("https://someone@example.com/purchase"));bad(()->PurchaseReadAccess.pageUrl("https://example.com/purchase?token=x"));bad(()->PurchaseReadAccess.pageUrl("https://example.com/purchase#token=x"));
        check(PurchaseReadAccess.link("https://example.com/purchase",10,"a&b").equals("https://example.com/purchase#orderId=10&token=a%26b"));
        check(PurchaseReadAccess.mayIssue(Map.of()));check(PurchaseReadAccess.mayIssue(Map.of("status","WAITING_FOR_PURCHASE_PAGE_URL")));
        for(String state:List.of("DISPATCHING","QUEUED","REVOKED_DELIVERY_OUTCOME_UNKNOWN","EXPIRED","RECONCILIATION_REQUIRED"))check(!PurchaseReadAccess.mayIssue(Map.of("status",state)));
        var safe=PurchaseReadAccess.publicReceipt(Map.of("status","DISPATCHING","token","secret","link","secret","recipient","private","grantId",2));
        check(safe.get("status").equals("RECONCILIATION_REQUIRED"));check(!safe.containsKey("token"));check(!safe.containsKey("link"));check(!safe.containsKey("recipient"));check(Boolean.FALSE.equals(safe.get("paymentEnabled")));
        System.out.println(checks+" purchase access assertions passed");
    }
}
