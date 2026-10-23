import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** A server allowlist; accepting a patch never authorizes a buyer or selects a Form. */
public final class CheckoutChanges {
    private static final Set<String> TEXT = Set.of("COMPANY_NAME","COMPANY_ADDRESS","FIRST_NAME","LAST_NAME","PHONE","BILLING_PERIOD");
    public static Map<String,Object> normalize(Map<String,Object> patch) {
        if(patch==null || patch.isEmpty() || patch.size()>10)throw new IllegalArgumentException("Nonempty Checkout patch required");
        Map<String,Object> result=new LinkedHashMap<>();
        for(var entry:patch.entrySet()) {
            String code=entry.getKey();Object value=entry.getValue();
            if(TEXT.contains(code)) {
                if(!(value instanceof String text) || text.length()>4096 || text.chars().anyMatch(c->c<32 || c==127))throw new IllegalArgumentException("Invalid Checkout text: "+code);
                text=text.trim();if(Set.of("COMPANY_NAME","COMPANY_ADDRESS","BILLING_PERIOD").contains(code) && text.isBlank())throw new IllegalArgumentException("Required Checkout text: "+code);
                if("BILLING_PERIOD".equals(code) && !Set.of("MONTHLY","YEARLY").contains(text))throw new IllegalArgumentException("Unsupported period");
                result.put(code,text);
            } else if(Set.of("PLAN_PRODUCT","SITE_EXPANSION_PACKS","WEATHER_PROPERTY_COUNT").contains(code)) {
                result.put(code,integer(value,"PLAN_PRODUCT".equals(code)?1:0));
            } else if("ADDON_PRODUCTS".equals(code)) {
                if(!(value instanceof List<?> values) || values.size()>2)throw new IllegalArgumentException("Invalid Add-ons list");
                Set<Integer> ids=new LinkedHashSet<>();for(Object raw:values)if(!ids.add(integer(raw,1)))throw new IllegalArgumentException("Duplicate Add-on");
                result.put(code,new ArrayList<>(ids));
            } else throw new IllegalArgumentException("Checkout field cannot be changed: "+code);
        }
        return result;
    }
    public static boolean sameDispatch(Object savedTokenId,Object savedDigest,long tokenId,String checkoutDigest) {
        if(!(savedTokenId instanceof Number) || !checkoutDigest.equals(savedDigest))return false;
        try{return new java.math.BigDecimal(savedTokenId.toString()).longValueExact()==tokenId;}catch(RuntimeException invalid){return false;}
    }
    private static int integer(Object value,int minimum) {
        if(!(value instanceof Number))throw new IllegalArgumentException("Whole numeric value required");
        int number=new java.math.BigDecimal(value.toString()).intValueExact();if(number<minimum)throw new IllegalArgumentException("Invalid Checkout number");return number;
    }
}
