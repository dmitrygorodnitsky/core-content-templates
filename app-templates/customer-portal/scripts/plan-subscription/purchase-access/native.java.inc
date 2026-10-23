    private static final String PURCHASE_READ_ACCESS = "PLAN_SUBSCRIPTION_READ_ACCESS";
    @Autowired @org.springframework.beans.factory.annotation.Qualifier("grantService")
    private com.pixelnation.modules.grant.service.iface.IGrantService purchaseGrantService;

    /** Protected server command: raw capability never crosses the Script result boundary. */
    public Map<String,Object> deliverPurchaseReadAccess(String payloadJson) {
        Map<String,Object> source=input(payloadJson);
        PurchaseAccessMail mail=asPurchaseExecutor(()->{
            Order order=readAccessOrder(source);
            Map<String,Object> previous=optionalMap(order.getMetadata().get(PURCHASE_READ_ACCESS));
            if(!PurchaseReadAccess.mayIssue(previous))return new PurchaseAccessMail(previous,null,null);
            Map<String,Object> config=purchaseAccessConfig();
            if(!Boolean.TRUE.equals(config.get("enabled")))throw new ApplicationException("Purchase read access disabled");
            int hours=PurchaseReadAccess.ttlHours(config.get("ttlHours"));
            String page=PurchaseReadAccess.pageUrl(config.get("pageUrl"));
            if(page==null){
                Map<String,Object> waiting=new LinkedHashMap<>();waiting.put("status","WAITING_FOR_PURCHASE_PAGE_URL");waiting.put("orderId",order.getId());
                saveReadAccess(order,waiting);return new PurchaseAccessMail(waiting,null,null);
            }
            // IDs and mappings are exclusively native/server-authored. No Account or arbitrary JSON read access.
            List<Long> itemIds=order.getItems().stream().map(item->item.getId().longValue()).sorted().toList();
            var issued=issuePurchaseReadGrant(order,hours);
            Map<String,Object> saved=new LinkedHashMap<>();saved.put("status","DISPATCHING");saved.put("deliveryStatus","DISPATCHING");
            saved.put("orderId",order.getId());saved.put("grantId",issued.id());saved.put("issuedAt",Instant.now().toEpochMilli());
            saved.put("expiresAt",issued.expiresAt().toString());saved.put("sourceFormId",source.get("sourceFormId"));
            saved.put("checkoutDigest",source.get("checkoutDigest"));saved.put("itemIds",itemIds);saved.put("recipientDigest",digest(text(source,"email")));
            saveReadAccess(order,saved);
            return new PurchaseAccessMail(saved,text(source,"email"),PurchaseReadAccess.link(page,order.getId(),issued.token()));
        });
        if(mail.link()==null)return PurchaseReadAccess.publicReceipt(mail.receipt());
        boolean queued=false;
        try {
            String href=org.springframework.web.util.HtmlUtils.htmlEscape(mail.link());
            onboardingMail.sendSimpleEmail(new String[]{mail.recipient()},"Your ServiceWand purchase",
                    "<p>Your subscription request has been confirmed and its draft order is ready.</p>"
                    +"<p><a href=\""+href+"\">View your purchase</a></p>"
                    +"<p>This private link permits viewing this purchase only. It expires within 24 hours; do not forward it.</p>"
                    +"<p>No payment has been taken. Changes require a new request or assistance from ServiceWand.</p>");
            queued=true;
        } catch(Exception ignored) { /* The mail may have been queued: revoke the capability before any manual retry. */ }
        boolean delivered=queued;
        // Revocation commits independently: a later Order validation/save failure must not restore a live unknown link.
        boolean revoked=!delivered && revokeIssuedPurchaseAccess(source,number(mail.receipt().get("grantId")));
        try{return asPurchaseExecutor(()->{
            Order order=readAccessOrder(source);Map<String,Object> saved=optionalMap(order.getMetadata().get(PURCHASE_READ_ACCESS));
            if(number(saved.get("grantId"))!=number(mail.receipt().get("grantId")) || !"DISPATCHING".equals(saved.get("status")))
                throw new ApplicationException("Purchase access delivery receipt changed; reconcile manually");
            saved=new LinkedHashMap<>(saved);
            if(delivered){saved.put("status","QUEUED");saved.put("deliveryStatus","QUEUED");}
            else {
                saved.put("status",revoked?"REVOKED_DELIVERY_OUTCOME_UNKNOWN":"RECONCILIATION_REQUIRED");saved.put("deliveryStatus","OUTCOME_UNKNOWN");
            }
            saveReadAccess(order,saved);return PurchaseReadAccess.publicReceipt(saved);
        });}catch(Exception failure){
            // Keep the persisted DISPATCHING marker if completion cannot be recorded. Never reissue automatically.
            if(delivered)revokeIssuedPurchaseAccess(source,number(mail.receipt().get("grantId")));
            return Map.of("status","RECONCILIATION_REQUIRED","readOnly",true,"paymentEnabled",false);
        }
    }

    public Map<String,Object> readPurchaseReadAccess(String payloadJson) {
        Map<String,Object> source=input(payloadJson);
        return asPurchaseExecutor(()->{
            Order order=readAccessOrder(source);Map<String,Object> saved=optionalMap(order.getMetadata().get(PURCHASE_READ_ACCESS));
            if(saved.isEmpty())return Map.of("status","NOT_ISSUED","readOnly",true,"paymentEnabled",false);
            Map<String,Object> view=new LinkedHashMap<>(PurchaseReadAccess.publicReceipt(saved));
            if("QUEUED".equals(view.get("status")) && !LocalDateTime.parse(String.valueOf(saved.get("expiresAt"))).isAfter(LocalDateTime.now()))view.put("status","EXPIRED");
            return view;
        });
    }
    private record PurchaseAccessMail(Map<String,Object> receipt,String recipient,String link) {}

    private boolean revokeIssuedPurchaseAccess(Map<String,Object> source,long grantId) {
        try{return asPurchaseExecutor(()->asPurchaseGrantIssuer(seller(source),()->purchaseGrantService.revoke(grantId)));}
        catch(Exception ignored){return false;}
    }

    @SuppressWarnings("unchecked")
    private com.pixelnation.modules.grant.controller.dto.AccessGrantIssueResponse issuePurchaseReadGrant(Order order,int hours) {
        PurchaseReadAccess.ttlHours(hours);
        List<Long> itemIds=order.getItems().stream().map(item->item.getId().longValue()).sorted().toList();
        List<Long> priceIds=order.getItems().stream().map(item->{
            if(item.getItemPrice()==null || item.getItemPrice().getId()==null)throw new ApplicationException("Purchase item price missing");
            return item.getItemPrice().getId().longValue();
        }).distinct().sorted().toList();
            List<com.pixelnation.modules.grant.controller.dto.AccessGrantIssueEntryRequest> entries=new ArrayList<>();
            Map<String,Map<String,Object>> profiles=new LinkedHashMap<>();
            for(Map<String,Object> spec:PurchaseReadAccess.entries(order.getId(),itemIds,priceIds)) {
                String entityType=String.valueOf(spec.get("entityType"));
                Map<String,Object> profile=profiles.computeIfAbsent(entityType,type->asPurchaseGrantIssuer(order.getOrganization(),()->{
                    var request=Json.defaultMapper().convertValue(Map.of("entityType",type,"operations",List.of("READ")),com.pixelnation.modules.grant.controller.dto.AccessGrantMappingsRequest.class);
                    return Json.defaultMapper().convertValue(purchaseGrantService.mappings(request),new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
                }));
                Map<String,Object> readSet=collection(profile.get("sets")).stream().map(this::optionalMap).filter(set->"READ".equals(set.get("operation"))).findFirst()
                        .orElseThrow(()->new ApplicationException("Purchase READ mapping unavailable"));
                List<Map<String,Object>> narrowed=PurchaseReadAccess.narrow((List<Map<String,Object>>)spec.get("readMappings"),
                        collection(readSet.get("mappings")).stream().map(this::optionalMap).toList());
                List<com.pixelnation.common.domain.ui.Mapping> mappings=Json.defaultMapper().convertValue(narrowed,
                        new com.fasterxml.jackson.core.type.TypeReference<List<com.pixelnation.common.domain.ui.Mapping>>(){});
                entries.add(com.pixelnation.modules.grant.controller.dto.AccessGrantIssueEntryRequest.of(
                        entityType,(java.io.Serializable)spec.get("entityId"),(List<String>)spec.get("permissions"),number(profile.get("mappingDefinitionId")),mappings,List.of()));
            }
            return asPurchaseGrantIssuer(order.getOrganization(),()->purchaseGrantService.issue(
                    com.pixelnation.modules.grant.controller.dto.AccessGrantIssueRequest.of(LocalDateTime.now().plusHours(hours),entries)));
    }

    private Order readAccessOrder(Map<String,Object> source) {
        Organization owner=seller(source);
        Order order=orderManager.get(number(source.get("orderId")));
        if(order==null)throw new ApplicationException("Confirmed purchase order missing");
        lockOnboarding(order.getId());
        entityManager.refresh(order,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        Account account=order.getAccount();
        if(account==null || account.getOrganization()==null || order.getOrganization()==null || order.getType()==null
                || !owner.getId().equals(order.getOrganization().getId()) || !owner.getId().equals(account.getOrganization().getId())
                || account.getId().longValue()!=number(source.get("accountId")) || !setting("ORDER_TYPE_CODE").equals(order.getType().getCode())
                || account.getType()==null || !setting("ACCOUNT_TYPE_CODE").equals(account.getType().getCode()) || !order.hasState("DRAFT"))
            throw new ApplicationException("Confirmed seller subscription draft required");
        requireReceipt(order.getMetadata(),source);requireReceipt(account.getMetadata(),source);receipt(account,order);
        Map<String,Object> proof=objectMap(order.getMetadata().get(KEY));
        if(number(proof.get("confirmationTokenId"))!=number(source.get("confirmationTokenId"))
                || number(proof.get("buyerAuthorizedAt"))!=number(source.get("buyerAuthorizedAt")) || number(source.get("buyerAuthorizedAt"))<=0
                || account.getContacts().stream().flatMap(contact->contact.getContactEntries().stream()).noneMatch(entry->
                    entry.getType()!=null && "EMAIL".equals(entry.getType().getCode()) && text(source,"email").equals(entry.getValue())))
            throw new ApplicationException("Verified recipient and persisted purchase consent required");
        return order;
    }
    private void saveReadAccess(Order order,Map<String,Object> value) {
        Map<String,Object> metadata=new LinkedHashMap<>(order.getMetadata());metadata.put(PURCHASE_READ_ACCESS,value);order.setMetadata(metadata);orderManager.save(order);
    }
    private Map<String,Object> purchaseAccessConfig() {
        Script script=scriptManager.getByCode(SCRIPT);return objectMap(script.getMetadata().get("PURCHASE_READ_ACCESS_CONFIG"));
    }
    private <T> T asPurchaseGrantIssuer(Organization owner,Supplier<T> action) {
        User caller=Auth.getAuthenticatedUser();
        if(caller==null || !userManager.getSystemUserId().equals(caller.getId()) || owner==null || !"SERVICEWAND".equals(owner.getCode()))
            throw new ApplicationException("Only the trusted purchase system executor may issue access");
        var previous=org.springframework.security.core.context.SecurityContextHolder.getContext();
        var scoped=org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        List<org.springframework.security.core.GrantedAuthority> authorities=List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("P_GRANT_W"),
                new org.springframework.security.core.authority.SimpleGrantedAuthority("P_ORDER_R"),new org.springframework.security.core.authority.SimpleGrantedAuthority("P_PRICE_R"));
        scoped.setAuthentication(new com.pixelnation.spring.security.RunAsAuthenticationToken(userManager.getSystemUser(),owner,authorities));
        try{org.springframework.security.core.context.SecurityContextHolder.setContext(scoped);return action.get();}
        finally{org.springframework.security.core.context.SecurityContextHolder.setContext(previous);}
    }
