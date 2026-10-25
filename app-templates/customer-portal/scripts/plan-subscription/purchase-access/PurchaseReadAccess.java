import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/** Server-authored access specification. It never accepts client mappings or permissions. */
public final class PurchaseReadAccess {
    public static List<Map<String,Object>> orderMappings() {
        return List.of(leaf("id"),node("currency","identifier",List.of(leaf("id"),leaf("code"),leaf("nls"))),
                node("items","collection",List.of(leaf("id"))),node("states","collection",List.of(leaf("id"),leaf("code"),leaf("nls"))),
                node("type","identifier",List.of(leaf("id"),leaf("code"),leaf("nls"))),leaf("totalCharges"),leaf("totalTaxes"),leaf("grandTotal"));
    }
    public static List<Map<String,Object>> itemMappings() {
        return List.of(leaf("id"),leaf("itemCount"),leaf("amount"),node("itemPrice","identifier",List.of(leaf("id"),leaf("nls"))),
                node("order","identifier",List.of(leaf("id"))),node("type","identifier",List.of(leaf("id"),leaf("code"),leaf("nls"))));
    }
    public static List<Map<String,Object>> priceMappings() {
        return List.of(leaf("id"),node("product","identifier",List.of(leaf("id"),leaf("nls"))));
    }
    private static Map<String,Object> leaf(String name){return Map.of("name",name,"type","primitive");}
    private static Map<String,Object> node(String name,String type,List<Map<String,Object>> children){return Map.of("name",name,"type",type,"mappings",children);}
    @SuppressWarnings("unchecked")
    public static List<Map<String,Object>> narrow(List<Map<String,Object>> requested,List<Map<String,Object>> effective) {
        List<Map<String,Object>> result=new ArrayList<>();
        for(var wanted:requested) {
            var matches=effective.stream().filter(field->wanted.get("name").equals(field.get("name"))).toList();
            if(matches.size()!=1 || !wanted.get("type").equals(matches.get(0).get("type")))throw new IllegalArgumentException("Purchase read mapping is unavailable");
            Map<String,Object> actual=new java.util.LinkedHashMap<>(matches.get(0));
            if(wanted.containsKey("mappings"))actual.put("mappings",narrow((List<Map<String,Object>>)wanted.get("mappings"),(List<Map<String,Object>>)actual.get("mappings")));
            else actual.remove("mappings");
            result.add(actual);
        }
        return result;
    }
    public static List<Map<String,Object>> entries(long orderId,List<Long> itemIds,List<Long> priceIds) {
        if(orderId<=0 || itemIds.isEmpty() || itemIds.size()>3 || itemIds.stream().anyMatch(id->id==null || id<=0)
                || new LinkedHashSet<>(itemIds).size()!=itemIds.size())throw new IllegalArgumentException("Exact order and unique item IDs required");
        if(priceIds.isEmpty() || priceIds.size()>itemIds.size() || priceIds.stream().anyMatch(id->id==null || id<=0)
                || new LinkedHashSet<>(priceIds).size()!=priceIds.size())throw new IllegalArgumentException("Exact unique item price IDs required");
        List<Map<String,Object>> result=new ArrayList<>();
        result.add(Map.of("entityType","Order","entityId",orderId,"permissions",List.of("P_ORDER_R"),"readMappings",orderMappings(),"writeMappings",List.of()));
        itemIds.stream().sorted().forEach(id->result.add(Map.of("entityType","OrderItem","entityId",id,"permissions",List.of("P_ORDER_R"),"readMappings",itemMappings(),"writeMappings",List.of())));
        priceIds.stream().sorted().forEach(id->result.add(Map.of("entityType","ProductPrice","entityId",id,"permissions",List.of("P_PRICE_R"),"readMappings",priceMappings(),"writeMappings",List.of())));
        return result;
    }
    public static int ttlHours(Object value) {
        if(!(value instanceof Number n) || n.doubleValue()!=n.intValue() || n.intValue()<1 || n.intValue()>24)throw new IllegalArgumentException("Access lifetime must be 1–24 hours");
        return n.intValue();
    }
    public static String pageUrl(Object raw) {
        if(raw==null || String.valueOf(raw).isBlank())return null;
        URI uri=URI.create(String.valueOf(raw));
        if(!"https".equals(uri.getScheme()) || uri.getHost()==null || uri.getUserInfo()!=null || uri.getRawFragment()!=null || uri.getRawQuery()!=null)
            throw new IllegalArgumentException("A configured HTTPS purchase page without query or fragment is required");
        return uri.toASCIIString();
    }
    public static String link(String page,long orderId,String token) {
        String base=pageUrl(page);if(base==null || orderId<=0 || token==null || token.isBlank())throw new IllegalArgumentException("Purchase link data missing");
        return base+"#orderId="+orderId+"&token="+URLEncoder.encode(token,StandardCharsets.UTF_8);
    }
    public static String link(String page,long orderId,String token,String paymentSecret) {
        String link=link(page,orderId,token);
        return paymentSecret==null?link:withPayment(link,paymentSecret);
    }
    public static String withPayment(String link,String paymentSecret) {
        if(link==null || !link.contains("#orderId=") || link.contains("&pay="))throw new IllegalArgumentException("Purchase link without payment required");
        if(paymentSecret==null || !paymentSecret.matches("pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+"))throw new IllegalArgumentException("Payment client secret has an unexpected format");
        return link+"&pay="+paymentSecret;
    }
    public static boolean mayIssue(Map<String,Object> previous) { return previous.isEmpty() || "WAITING_FOR_PURCHASE_PAGE_URL".equals(previous.get("status")); }
    public static Map<String,Object> publicReceipt(Map<String,Object> stored) {
        Map<String,Object> out=new java.util.LinkedHashMap<>();
        for(String key:List.of("status","orderId","grantId","issuedAt","expiresAt","deliveryStatus"))if(stored.containsKey(key))out.put(key,stored.get(key));
        if("DISPATCHING".equals(out.get("status")))out.put("status","RECONCILIATION_REQUIRED");
        out.put("paymentEnabled",false);out.put("readOnly",true);return out;
    }
}
