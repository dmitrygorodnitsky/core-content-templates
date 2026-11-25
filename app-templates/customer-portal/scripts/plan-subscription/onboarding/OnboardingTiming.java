final class OnboardingTiming {
    static final int CMS_PREFLIGHT_SECONDS = 30;
    static final int NATIVE_STAGE_SECONDS = 90;
    static final int BILLING_SUBMIT_SECONDS = 90;
    static final int BILLING_PROVISION_SECONDS = 330;
    static final int CMS_ACTIVATION_SECONDS = 360;
    static final int CMS_SCRIPT_TIMEOUT_SECONDS = 345;
    static final int BILLING_SCRIPT_TIMEOUT_SECONDS = 480;

    static int billingWaitSeconds(String command) {
        return switch (command) {
            case "submitPurchase" -> BILLING_SUBMIT_SECONDS;
            case "provisionOnboarding" -> BILLING_PROVISION_SECONDS;
            default -> 45;
        };
    }
}
