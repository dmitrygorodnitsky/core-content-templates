    private Map<String,Object> previewTaxes(Map<String,Object> source,Map<String,Object> preview) {
        if(source.get("addressId")==null)return Map.of("status","ADDRESS_REQUIRED","source","NATIVE_ORDER_TAXES");
        Address address=addressManager.get(Math.toIntExact(number(source.get("addressId"))));
        if(address==null || address.getCountry()==null || !"CA".equals(address.getCountry().getCode2()))return Map.of("status","COUNTRY_NOT_SUPPORTED","source","NATIVE_ORDER_TAXES");
        Account account=new Account();AccountAddress link=new AccountAddress();link.setAccount(account);link.setAddress(address);
        var billing=addressTypeManager.getByCode("BILLING");if(billing==null)throw new ApplicationException("Billing address type unavailable");
        link.getTypes().add(billing);account.getAddresses().add(link);
        Order order=new Order();order.setOrganization(seller(source));order.setAccount(account);order.setCurrency(dictionaryManager.get(Math.toIntExact(number(preview.get("currencyId")))));
        for(Map<String,Object> line:previewLines(preview)) {
            OrderItem item=new OrderItem();item.setOrder(order);item.setOrganization(order.getOrganization());item.setAmount(new BigDecimal(line.get("unitAmount").toString()));
            item.setItemCount(Math.toIntExact(number(line.get("quantity"))));order.getItems().add(item);
        }
        // Same assignment function as the real Order workflow; native totals own the arithmetic.
        // The account/order/items above are transient Java objects, never saved or merged.
        assignSubscriptionTaxes(order);
        return inspectConfiguredTaxes(order);
    }
