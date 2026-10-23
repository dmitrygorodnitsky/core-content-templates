    public void assignSubscriptionTaxes(Order entity) {
        var billingAddress = entity.getAccount() == null ? null : entity.getAccount().getAddresses().stream()
            .filter(address -> address.getTypes().stream().anyMatch(type -> "BILLING".equals(type.getCode())))
            .map(com.pixelnation.account.domain.AccountAddress::getAddress)
            .findFirst().orElse(null);
        var applicableTaxes = new java.util.HashMap<Integer, java.math.BigDecimal>();
        if (billingAddress != null && billingAddress.getCountry() != null) {
            var dictionaryManager = com.pixelnation.common.aspects.ApplicationContextProvider.getApplicationContext()
                .getBean(com.pixelnation.common.persistence.iface.IDictionaryManager.class);
            var taxes = dictionaryManager.page(0, Integer.MAX_VALUE, java.util.List.of(), java.util.List.of(
                new com.pixelnation.common.ui.domain.FilterClause("type.code",
                    com.pixelnation.common.ui.domain.FilterClause.EQ, "TAX")));
            for (var tax : taxes) {
                var typeId = tax.getType().getId();
                Object country = tax.getAttributeValue(typeId, "COUNTRY");
                Object state = tax.getAttributeValue(typeId, "STATE");
                Object percentage = tax.getAttributeValue(typeId, "PERCENTAGE");
                if (!java.util.Objects.equals(billingAddress.getCountry().getId(), country)) continue;
                if (state != null && (billingAddress.getState() == null
                    || !billingAddress.getState().getId().toString().equals(state.toString()))) continue;
                if (percentage != null) {
                    applicableTaxes.put(tax.getId(), new java.math.BigDecimal(percentage.toString()));
                }
            }
        }
        for (var item : entity.getItems()) {
            item.setApplicableTaxes(new java.util.HashMap<>(applicableTaxes));
        }
    }
