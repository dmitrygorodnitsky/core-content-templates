    /** Operator/system business command. A buyer HTTP adapter must authenticate the Form capability. */
    public Map<String,Object> readCheckout(Integer formId) {
        return asReadinessExecutor(() -> {
            if(formId==null || formId<=0)throw new ApplicationException("Form ID required");
            Form form=formManager.get(formId.longValue());if(form!=null)entityManager.refresh(form);validateScope(form);Map<String,Object> saved=data(form);
            requireVerified(form,saved); return buyerCheckoutView(form,saved); });
    }
    @SuppressWarnings("unchecked")
    public Map<String,Object> reviseCheckout(Integer formId,Integer expectedRevision,String expectedCheckoutDigest,String changesJson) {
        if(changesJson==null || changesJson.length()>65536)throw new ApplicationException("Invalid Checkout patch");
        Map<String,Object> changes;
        try{changes=CheckoutChanges.normalize(Json.defaultMapper().readValue(changesJson,Map.class));}
        catch(Exception invalid){throw new ApplicationException("Checkout patch contains unsupported or invalid fields");}
        if(expectedRevision==null || expectedRevision<1 || expectedCheckoutDigest==null || !expectedCheckoutDigest.matches("[a-f0-9]{64}"))throw new ApplicationException("Expected Checkout revision and digest required");
        return asPurchaseExecutor(() -> {
            Form form=purchaseForm(formId);Map<String,Object> saved=data(form);requireVerified(form,saved);
            if(!form.hasState("CHECKOUT_PREPARED") || !map(saved.get("purchase")).isEmpty() || map(saved.get("confirmation")).containsKey("authorizedAt"))throw new ApplicationException("Confirmed purchases cannot be edited");
            String request=digest(expectedRevision+"|"+expectedCheckoutDigest+"|"+canonicalJson(changes));
            Map<String,Object> last=map(saved.get("lastCheckoutRevision"));
            if(request.equals(last.get("requestDigest")))return buyerCheckoutView(form,saved);
            long revision=saved.get("checkoutRevision")==null?1:number(saved.get("checkoutRevision"),"Checkout revision");
            if(revision!=expectedRevision || !expectedCheckoutDigest.equals(map(saved.get("checkout")).get("checkoutDigest")))throw new ApplicationException("Checkout revision changed; reload before editing");
            for(var entry:changes.entrySet()) {
                Integer owner=checkoutFieldOwner(form.getType(),entry.getKey(),new LinkedHashSet<>());
                if(owner==null)throw new ApplicationException("Checkout attribute owner unavailable");
                form.setAttributeValue(owner,entry.getKey(),entry.getValue(),null);
            }
            validateFields(form);validateProducts(form);
            if(changes.containsKey("COMPANY_ADDRESS"))saved.put("companyAddress",resolveCompanyAddress(form));
            saved.put("inputDigest",inputDigest(form));requireVerified(form,saved);
            Map<String,Object> preview=draftAction("preview",purchasePayload(form,saved));requireEntitlementSnapshot(preview);
            Map<String,Object> checkout=new LinkedHashMap<>();checkout.put("status","PREPARED");
            checkout.put("catalogFingerprint",preview.get("catalogFingerprint"));checkout.put("entitlementFingerprint",preview.get("entitlementFingerprint"));
            checkout.put("checkoutDigest",digest(saved.get("inputDigest")+"|"+preview.get("catalogFingerprint")));
            checkout.put("preparedAt",Instant.now().toEpochMilli());checkout.put("preview",preview);
            Map<String,Object> previous=new LinkedHashMap<>(map(saved.get("confirmation")));previous.remove("devCapturedToken");
            if(!previous.isEmpty()){previous.put("invalidatedAt",Instant.now().toEpochMilli());previous.put("reason","CHECKOUT_REVISED");saved.put("supersededConfirmation",previous);}
            saved.remove("confirmation");saved.put("checkout",checkout);saved.put("checkoutRevision",Math.addExact(revision,1));
            saved.put("lastCheckoutRevision",Map.of("requestDigest",request,"baseRevision",revision,"newRevision",revision+1));
            putData(form,saved);formManager.save(form);
            afterState(form,"CHECKOUT_PREPARED",()->{issueConfirmation(form.getId());return null;});
            return buyerCheckoutView(form,saved);
        });
    }
    private Integer checkoutFieldOwner(Object type,String code,Set<Object> seen) {
        var bean=new org.springframework.beans.BeanWrapperImpl(type);Object id=bean.getPropertyValue("id");if(!seen.add(id))return null;
        Object attributes=bean.getPropertyValue("attributes");if(attributes instanceof Collection<?> rows)for(Object field:rows) {
            var attribute=new org.springframework.beans.BeanWrapperImpl(field);if(code.equals(attribute.getPropertyValue("code")))return ((Number)id).intValue();
        }
        Object parents=bean.isReadableProperty("parents")?bean.getPropertyValue("parents"):null;
        if(parents instanceof Collection<?> rows)for(Object parent:rows){Integer owner=checkoutFieldOwner(parent,code,seen);if(owner!=null)return owner;}return null;
    }
    private Map<String,Object> buyerCheckoutView(Form form,Map<String,Object> saved) {
        Map<String,Object> checkout=map(saved.get("checkout")),preview=map(checkout.get("preview"));
        Map<String,Object> result=new LinkedHashMap<>(),fields=new LinkedHashMap<>();
        for(String code:FIELDS)fields.put(code,form.findFirstAttributeValue(code));
        result.put("schemaVersion",1);result.put("purchaseReference",String.valueOf(form.getId()));result.put("fields",fields);
        result.put("revision",saved.getOrDefault("checkoutRevision",1));result.put("checkoutDigest",checkout.get("checkoutDigest"));
        result.put("status",form.hasState("DRAFT_ORDER_READY")?"DRAFT_ORDER_READY":form.hasState("CHECKOUT_PREPARED")?"CHECKOUT_PREPARED":"PREPARING");
        result.put("allowedActions",form.hasState("CHECKOUT_PREPARED")?List.of("READ","REVISE","CONFIRM_BY_EMAIL"):List.of("READ"));
        List<Map<String,Object>> lines=new ArrayList<>();Object raw=preview.get("lines");
        if(raw instanceof Collection<?> rows)for(Object row:rows) {
            Map<String,Object> line=map(row),safe=new LinkedHashMap<>();
            for(String key:List.of("role","productCode","productName","quantity","unitAmount","lineAmount","billingPeriod"))if(line.get(key)!=null)safe.put(key,line.get(key));lines.add(safe);
        }
        result.put("lines",lines);result.put("subtotal",preview.get("subtotal"));result.put("currency",preview.get("currencyCode"));
        Map<String,Object> tax=map(preview.get("taxQuote"));
        result.put("taxStatus",preview.getOrDefault("taxStatus","NOT_CALCULATED"));
        result.put("taxTotal",tax.get("taxAmount"));result.put("totalPayable",preview.get("totalPayable"));
        result.put("roundingStatus",tax.get("roundingStatus"));
        Map<String,Object> entitlement=map(preview.get("entitlements"));result.put("propertyCapacity",map(entitlement.get("propertyCapacity")).get("limit"));
        result.put("propertyMaximum",map(entitlement.get("propertyCapacity")).get("overallMaximum"));
        result.put("weather",Map.of("selected",Boolean.TRUE.equals(map(entitlement.get("weather")).get("selected")),"count",map(entitlement.get("weather")).getOrDefault("propertyCount",0),"status",Boolean.TRUE.equals(map(entitlement.get("weather")).get("selected"))?"WEATHER_SETUP_PENDING":"NOT_SELECTED"));
        result.put("paymentEnabled",false);result.put("canPay",false);result.put("buyerHttpAdapterAvailable",false);
        // Explicit projection only: never forward data(form), devCapturedToken or native receipts.
        return result;
    }

    private String checkoutTaxHtml(Map<String,Object> preview) {
        Map<String,Object> tax=map(preview.get("taxQuote"));
        if(!"CONFIGURED_RATES_APPLIED".equals(preview.get("taxStatus")) || !"EXACT_MINOR_UNITS".equals(tax.get("roundingStatus")) || preview.get("totalPayable")==null)
            return EmailLayout.amountNote("Taxes and the final total require configuration or review. No payment is available.");
        String currency=String.valueOf(preview.get("currencyCode"));
        return EmailLayout.amountRow("Taxes",tax.get("taxAmount")+" "+currency,false)
                +EmailLayout.amountRow("Total including taxes",preview.get("totalPayable")+" "+currency,true);
    }
