import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class OnboardingExecutionTest {
    private static int checks;
    private static Map<String,Object> m(Object... args) { Map<String,Object> r = new LinkedHashMap<>(); for(int i=0;i<args.length;i+=2)r.put((String)args[i],args[i+1]); return r; }
    private static void check(boolean value, String message) { if(!value)throw new AssertionError(message); checks++; }
    private static void rejects(Runnable action, String message) { boolean rejected=false; try{action.run();}catch(RuntimeException expected){rejected=true;} check(rejected,message); }
    private static Map<String,Object> snapshot() {
        return m("billingPeriod","MONTHLY","features",List.of(m("definitionCode","SERVICEWAND.FEATURE.A","value",false),m("definitionCode","SERVICEWAND.FEATURE.FULL-FEATURED_MOBILE_APP","value",true)),
                "levels",List.of(m("definitionCode","SERVICEWAND.LEVEL.X","value","Individual and bulk reassignment","enabled",true)),
                "propertyCapacity",m("definitionCode","SERVICEWAND.PROPERTIES.MAX_ACTIVE","included",50,"expansionPacks",2,"expansionPackSize",50,"limit",150,"overallMaximum",500,"maximumSource","TEMPORARY_CONFIG","maximumValidation","VALIDATED_CONFIG_MAXIMUM"),
                "weather",m("selected",true,"propertyCount",120,"featureDefinitionCode","SERVICEWAND.FEATURE.WEATHER_INTELLIGENCE","limitDefinitionCode","SERVICEWAND.WEATHER.MAX_PROPERTIES"));
    }
    @SuppressWarnings("unchecked") private static Map<String,Object> map(Object raw){return (Map<String,Object>)raw;}
    private static final class Port implements OnboardingExecution.Port {
        Map<String,Object> flags=m("executionEnabled",true,"grantIssuanceEnabled",true,"accessDeliveryEnabled",true,"paymentConfirmed",true,"planVerified",true,"enforcementReady",true);
        final List<String> committed=new ArrayList<>(); final List<String> attempts=new ArrayList<>();
        String fail="", mutate=""; boolean graph, access;
        public Map<String,Object> inspect(){Map<String,Object> r=new LinkedHashMap<>(flags);r.put("graphVerified",graph);r.put("accessDelivered",access);r.put("receipt",m("status",access?"COMPLETE":"PENDING"));return r;}
        private void stage(String name){ attempts.add(name); if(!mutate.isEmpty() && mutate.equals(name))throw new IllegalStateException("native receipt mismatch"); if(!committed.contains(name))committed.add(name); if(fail.equals(name)){fail="";throw new IllegalStateException("lost response after commit");} }
        public void ensureCompany(){stage("company");} public void ensureProperty(){stage("property");}
        public void ensureAgreement(){stage("agreement");} public void verifyGraph(){stage("verify");graph=true;}
        public void deliverAccess(){check(graph,"No credentials before graph verification");stage("access");access=true;}
    }
    public static void main(String[] args){
        for(String gate:List.of("executionEnabled","grantIssuanceEnabled","accessDeliveryEnabled","paymentConfirmed","planVerified","enforcementReady")){
            Port p=new Port();p.flags.put(gate,false);Map<String,Object> r=OnboardingExecution.run(p);
            check("BLOCKED".equals(r.get("status")),gate+" blocks");check(p.attempts.isEmpty(),gate+" forbids every mutation");
        }
        for(String stage:List.of("company","property","agreement","verify","access")){
            Port p=new Port();p.fail=stage;rejects(()->OnboardingExecution.run(p),"Lost response must propagate");
            check("COMPLETE".equals(OnboardingExecution.run(p).get("status")),"Resume after lost "+stage);
            check(p.committed.equals(List.of("company","property","agreement","verify","access")),"Each stage committed once after "+stage);
            OnboardingExecution.run(p);check(p.committed.size()==5,"Completed replay must not duplicate stages");
        }
        Port altered=new Port();altered.mutate="agreement";rejects(()->OnboardingExecution.run(altered),"Native conflict must stop flow");check(!altered.attempts.contains("access"),"Conflict prevents credential delivery");
        Map<String,Object> s=snapshot();String before=s.toString();List<Map<String,Object>> a=OnboardingExecution.allowances(s);
        check(before.equals(s.toString()),"Frozen purchase not mutated");check(a.size()==5,"Disabled feature omitted and Weather split into feature/quota");
        check(a.stream().filter(x->"SERVICEWAND.PROPERTIES.MAX_ACTIVE".equals(x.get("code"))).count()==1,"Base+expansion use one combined allowance");
        check(a.stream().anyMatch(x->"Individual and bulk reassignment".equals(x.get("value"))),"Preserve non-Boolean levels");
        s.put("billingPeriod","YEARLY");check(OnboardingExecution.allowances(s).equals(a),"Annual coverage does not multiply capacities");
        map(s.get("propertyCapacity")).put("limit",151);Map<String,Object> invalid=s;rejects(()->OnboardingExecution.allowances(invalid),"Capacity arithmetic checked");
        s=snapshot();map(s.get("weather")).put("propertyCount",151);Map<String,Object> over=s;rejects(()->OnboardingExecution.allowances(over),"Weather within purchased capacity");
        s=snapshot();s.put("features",List.of(m("definitionCode","SERVICEWAND.PROPERTIES.MAX_ACTIVE","value",true)));Map<String,Object> dup=s;rejects(()->OnboardingExecution.allowances(dup),"Duplicate definition rejected");
        s=snapshot();map(s.get("propertyCapacity")).put("maximumValidation","MAXIMUM_NOT_STRUCTURED");Map<String,Object> legacy=s;rejects(()->OnboardingExecution.allowances(legacy),"Legacy unverified maximum rejected");
        Map<String,Object> property=m("key","property","type",m("id",154,"workflow",m("states",List.of(
                m("code","INACTIVE","events",List.of(m("id",327,"targets",List.of(m("code","ACTIVE"))))),
                m("code","ACTIVE","events",List.of(m("id",326,"targets",List.of(m("code","INACTIVE")))))))));
        Map<String,Object> policies=OnboardingExecution.policySpecs(List.of(property),snapshot(),m("definitionOwnerCode","SERVICEWAND"));
        check(((List<?>)policies.get("policyTemplates")).size()==2,"Both CREATE_ACTIVE and DELETE_ACTIVE covered");
        check(((List<?>)policies.get("bindingTemplates")).size()==2,"Both ACTIVE boundaries covered");
        check(((List<?>)policies.get("blockers")).contains("WEATHER_SETUP_PENDING"),"Weather stub is explicit");
        Map<String,Object> withoutWeather=snapshot();withoutWeather.put("weather",m("selected",false,"propertyCount",0));
        check(((List<?>)OnboardingExecution.policySpecs(List.of(property),withoutWeather,m("definitionOwnerCode","SERVICEWAND")).get("blockers")).isEmpty(),"Base purchase unaffected by Weather stub");
        rejects(()->OnboardingExecution.policySpecs(List.of(property),snapshot(),m("definitionOwnerCode","SYSTEM")),"Wrong definition owner rejected");
        Map<String,Object> ambiguous=m("key","property","type",m("id",154,"workflow",m("states",List.of(m("code","INACTIVE","events",List.of(m("id",327,"targets",List.of(m("code","ACTIVE"),m("code","INACTIVE")))))))));
        rejects(()->OnboardingExecution.policySpecs(List.of(ambiguous),snapshot(),m("definitionOwnerCode","SERVICEWAND")),"Ambiguous branch rejected");
        rejects(()->OnboardingExecution.policySpecs(List.of(m("key","property","type",m("id",154,"workflow",m("states",List.of())))),snapshot(),m("definitionOwnerCode","SERVICEWAND")),"Missing lifecycle coverage rejected");
        System.out.println(checks+" onboarding execution assertions passed");
    }
}
