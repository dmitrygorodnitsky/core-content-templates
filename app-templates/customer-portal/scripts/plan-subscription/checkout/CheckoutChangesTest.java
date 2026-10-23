import java.util.List;
import java.util.Map;
public final class CheckoutChangesTest {
    static int checks;
    static void check(boolean b){if(!b)throw new AssertionError();checks++;}
    static void bad(Map<String,Object> raw){boolean rejected=false;try{CheckoutChanges.normalize(raw);}catch(RuntimeException expected){rejected=true;}check(rejected);}
    public static void main(String[] args){
        for(String field:List.of("EMAIL","organization","metadata","price","checkoutDigest","paymentConfirmed","userId","role","BILLING_DETAILS","expectedRevision"))bad(Map.of(field,"injected"));
        bad(Map.of("SITE_EXPANSION_PACKS",-1));bad(Map.of("WEATHER_PROPERTY_COUNT",1.1));bad(Map.of("PLAN_PRODUCT",0));bad(Map.of("PLAN_PRODUCT","123"));bad(Map.of("SITE_EXPANSION_PACKS",2147483648L));
        bad(Map.of("ADDON_PRODUCTS",List.of(1,1)));bad(Map.of("ADDON_PRODUCTS",List.of(1,2,3)));bad(Map.of("ADDON_PRODUCTS",List.of("1")));
        bad(Map.of("BILLING_PERIOD","DECADE"));bad(Map.of("COMPANY_ADDRESS"," \n "));bad(Map.of("COMPANY_NAME"," "));bad(Map.of());
        check(CheckoutChanges.normalize(Map.of("COMPANY_NAME","  Client  ","SITE_EXPANSION_PACKS",2L,"ADDON_PRODUCTS",List.of(10L))).equals(Map.of("COMPANY_NAME","Client","SITE_EXPANSION_PACKS",2,"ADDON_PRODUCTS",List.of(10))));
        Map<String,Object> original=Map.of("PHONE"," +1 123 ");CheckoutChanges.normalize(original);check(" +1 123 ".equals(original.get("PHONE")));
        check(CheckoutChanges.sameDispatch(10,"a",10L,"a"));
        check(!CheckoutChanges.sameDispatch(11,"a",10L,"a"));check(!CheckoutChanges.sameDispatch(10,"b",10L,"a"));
        check(!CheckoutChanges.sameDispatch(null,"a",10L,"a"));check(!CheckoutChanges.sameDispatch(10.1,"a",10L,"a"));
        System.out.println(checks+" Checkout allowlist/delivery assertions passed");
    }
}
