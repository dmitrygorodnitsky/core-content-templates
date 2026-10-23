var purchase = entity.getMetadata() == null ? null : entity.getMetadata().get("PLAN_SUBSCRIPTION");
if (purchase instanceof java.util.Map<?, ?> pending && Boolean.TRUE.equals(pending.get("draftOnly"))) {
    throw new com.pixelnation.common.exception.ApplicationException(
        "Subscription draft cannot be submitted while payment integration remains disabled");
}
