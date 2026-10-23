import fs from 'node:fs/promises';
// Temporary dev-1 fixture only. Compile the actual issuer and mapping policy, never a hand-copied authorization implementation.
export async function withPurchaseAccessProbe(base) {
  const native=await fs.readFile(new URL('./native.java.inc',import.meta.url),'utf8');
  const bill=await fs.readFile(new URL('../PLAN_SUBSCRIPTION_DRAFT_V5.java',import.meta.url),'utf8');
  function method(source,name){const signature=new RegExp('^    private [^\\n]*\\b'+name+'\\([^\\n]*\\)\\s*\\{','m').exec(source);if(!signature)throw Error('Method missing '+name);const start=signature.index;let a=source.indexOf('{',start),depth=1,b=a+1;for(;depth&&b<source.length;b++){if(source[b]==='{')depth++;else if(source[b]==='}')depth--;}return source.slice(start,b);}
  let policy=await fs.readFile(new URL('./PurchaseReadAccess.java',import.meta.url),'utf8');
  const imports=policy.split('\n').filter(s=>s.startsWith('import ')).join('\n')+'\nimport java.time.LocalDateTime;\nimport java.math.BigDecimal;\nimport java.util.Collection;\nimport com.pixelnation.common.json.Json;\n';
  policy=policy.split('\n').filter(s=>!s.startsWith('import ')).join('\n').replace('public final class PurchaseReadAccess','public static final class PurchaseReadAccess');
  const extra=`
 @Autowired @org.springframework.beans.factory.annotation.Qualifier("grantService") private com.pixelnation.modules.grant.service.iface.IGrantService purchaseGrantService;
 @Autowired private com.pixelnation.common.persistence.iface.IUserManager userManager;
 ${policy}
 ${method(native,'issuePurchaseReadGrant')}
 ${method(native,'asPurchaseGrantIssuer')}
 ${method(bill,'optionalMap')}
 ${method(bill,'collection')}
 ${method(bill,'number')}
 private User fixtureSystemUser(){User stored=userManager.getSystemUser();User principal=new User();principal.setId(stored.getId());principal.setName(stored.getName());principal.setFullname(stored.getFullname());principal.setRoles(new LinkedHashSet<>());return principal;}
 private record NativeIssued(Long id,String token,Long orderId,List<Long> items,Long other,String notes){}
 public Map<String,Object> verifyPurchaseReadGrant(Integer orderId,Integer formId,String run) {
   NativeIssued issued=asAdmin(()->{
     Order order=owned(orderId,formId,run);return Auth.withUser(fixtureSystemUser(),order.getOrganization(),(Supplier<NativeIssued>)()->{var initial=org.springframework.security.core.context.SecurityContextHolder.getContext();
     asPurchaseGrantIssuer(order.getOrganization(),()->{if(!new java.util.HashSet<>(Auth.getAuthenticatedUserRoles()).equals(java.util.Set.of("P_GRANT_W","P_ORDER_R","P_PRICE_R")))throw new ApplicationException("Issuer authority widened");return true;});
     try{asPurchaseGrantIssuer(order.getOrganization(),()->{throw new IllegalStateException("expected issuer failure");});}catch(IllegalStateException expected){}
     if(initial!=org.springframework.security.core.context.SecurityContextHolder.getContext())throw new ApplicationException("Issuer context leaked on failure");
     var response=issuePurchaseReadGrant(order,24);
     if(initial!=org.springframework.security.core.context.SecurityContextHolder.getContext())throw new ApplicationException("Issuer context leaked on success");
     Long other=entityManager.createQuery("SELECT o.id FROM Order o WHERE o.id <> :id ORDER BY o.id",Long.class).setParameter("id",order.getId()).setMaxResults(1).getSingleResult();
     return new NativeIssued(response.id(),response.token(),order.getId(),order.getItems().stream().map(item->item.getId().longValue()).toList(),other,order.getNotes());}).get();
   });
   Map<String,Object> result=new LinkedHashMap<>();result.put("grantId",issued.id());
   try {
     var initial=org.springframework.security.core.context.SecurityContextHolder.getContext();
     var order=anon(issued,"order/get.json?id="+issued.orderId(),"{}");
     if(order.statusCode()!=200)throw new Exception("order read");
     var body=Json.defaultMapper().readTree(order.body());
     if(body.path("id").asLong()!=issued.orderId() || body.has("metadata") || body.has("attributes") || body.has("account") || body.has("organization") || body.has("notes"))throw new Exception("order projection");
     if(body.path("items").size()!=issued.items().size())throw new Exception("nested items");
     for(Long item:issued.items()){
       var response=anon(issued,"order-item/get.json?id="+item,"{}");if(response.statusCode()!=200)throw new Exception("item read");
       var line=Json.defaultMapper().readTree(response.body());
       if(line.path("order").path("id").asLong()!=issued.orderId() || line.has("metadata") || line.has("attributes") || line.has("organization"))throw new Exception("item projection");
       var price=anonPim(issued,"product-price/get.json?id="+line.path("itemPrice").path("id").asLong());if(price.statusCode()!=200)throw new Exception("item price read");
       var priceBody=Json.defaultMapper().readTree(price.body());
       if(!priceBody.path("product").has("nls") || priceBody.has("attributes") || priceBody.has("organization") || priceBody.path("product").has("code"))throw new Exception("item price projection");
     }
     if(anon(issued,"order/get.json?id="+issued.other(),"{}").statusCode()!=404)throw new Exception("other order read");
     var write=anon(issued,"order/save.json",Json.defaultMapper().writeValueAsString(Map.of("entities",List.of(Map.of("id",issued.orderId(),"notes","blocked")))));result.put("writeStatus",write.statusCode());if(!java.util.Set.of(401,403).contains(write.statusCode())){String message=Json.defaultMapper().readTree(write.body()).path("message").asText();throw new Exception("write authority "+write.statusCode()+" "+message.replace(issued.token(),"[redacted]"));}
     var event=anon(issued,"order/event.json",Json.defaultMapper().writeValueAsString(Map.of("id",issued.orderId(),"event","DRAFT-SUBMITTED","metadata",Map.of())));result.put("eventStatus",event.statusCode());if(!java.util.Set.of(401,403).contains(event.statusCode()))throw new Exception("event authority "+event.statusCode());
     if(anon(issued,"order/get.json?id="+issued.orderId(),"{}").statusCode()!=200)throw new Exception("Read capability stopped working after forbidden calls");
     asAdmin(()->{Order persisted=owned(orderId,formId,run);if(!java.util.Objects.equals(persisted.getNotes(),issued.notes()) || !persisted.hasState("DRAFT"))throw new ApplicationException("Read grant mutated order");return true;});
     boolean revoked=asAdmin(()->{var owner=owned(orderId,formId,run).getOrganization();return Auth.withUser(fixtureSystemUser(),owner,(Supplier<Boolean>)()->asPurchaseGrantIssuer(owner,()->purchaseGrantService.revoke(issued.id()))).get();});
     if(!revoked)throw new Exception("native revoke failed");
     var afterRevoke=anon(issued,"order/get.json?id="+issued.orderId(),"{}");result.put("revokedStatus",afterRevoke.statusCode());
     if(!java.util.Set.of(401,404).contains(afterRevoke.statusCode()))throw new Exception("revoked read "+afterRevoke.statusCode());
     if(initial!=org.springframework.security.core.context.SecurityContextHolder.getContext())throw new Exception("security context leak");
     result.put("passed",true);result.put("itemsChecked",issued.items().size());
   } catch(Exception failure){result.put("passed",false);result.put("check",failure.getMessage()==null?"native request":failure.getMessage().replace(issued.token(),"[redacted]"));}
   finally{try{asAdmin(()->{var owner=owned(orderId,formId,run).getOrganization();return Auth.withUser(fixtureSystemUser(),owner,(Supplier<Boolean>)()->asPurchaseGrantIssuer(owner,()->purchaseGrantService.revoke(issued.id()))).get();});}catch(Exception ignored){}}
   return result;
 }
 private java.net.http.HttpResponse<String> anonPim(NativeIssued issued,String path)throws Exception {
   return java.net.http.HttpClient.newBuilder().followRedirects(java.net.http.HttpClient.Redirect.NEVER).connectTimeout(java.time.Duration.ofSeconds(20)).build().send(
       java.net.http.HttpRequest.newBuilder(URI.create("https://dev-1.servicewand.com/core-pim/i/"+issued.token()+"/"+path))
       .timeout(java.time.Duration.ofSeconds(30)).header("Content-Type","application/json").POST(java.net.http.HttpRequest.BodyPublishers.ofString("{}")).build(),java.net.http.HttpResponse.BodyHandlers.ofString());
 }
 private java.net.http.HttpResponse<String> anon(NativeIssued issued,String path,String json)throws Exception {
   return java.net.http.HttpClient.newBuilder().followRedirects(java.net.http.HttpClient.Redirect.NEVER).connectTimeout(java.time.Duration.ofSeconds(20)).build().send(
       java.net.http.HttpRequest.newBuilder(URI.create("https://dev-1.servicewand.com/core-bill/i/"+issued.token()+"/"+path))
       .timeout(java.time.Duration.ofSeconds(30)).header("Content-Type","application/json").POST(java.net.http.HttpRequest.BodyPublishers.ofString(json)).build(),java.net.http.HttpResponse.BodyHandlers.ofString());
 }
 `;
  return base.replace('\n\nimport ','\n\n'+imports+'\nimport ').trimEnd().slice(0,-1)+extra+'\n}\n';
}
