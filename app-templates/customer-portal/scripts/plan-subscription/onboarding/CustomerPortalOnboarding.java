final class CustomerPortalOnboarding {
    static String pinnedUrl(String pinned, String configured, String defaultValue, String organizationCode) {
        boolean hasConfiguredUrl = configured != null && !configured.isBlank() && !configured.contains("{ORGANIZATION}");
        if (pinned != null && !pinned.isBlank()) {
            pagePath(pinned, organizationCode);
            if (hasConfiguredUrl && !pinned.equals(configured)) {
                throw new IllegalArgumentException("Organization portal URL differs from the reserved onboarding URL");
            }
            return pinned;
        }
        if (!hasConfiguredUrl) return url(defaultValue, organizationCode);
        pagePath(configured, organizationCode);
        return configured;
    }

    static String url(String defaultValue, String organizationCode) {
        if (defaultValue == null || !defaultValue.contains("{ORGANIZATION}")) {
            throw new IllegalArgumentException("Customer portal default must include {ORGANIZATION}");
        }
        String url = defaultValue.replace("{ORGANIZATION}", organizationCode);
        pagePath(url, organizationCode);
        return url;
    }

    static String pagePath(String url, String organizationCode) {
        String prefix = "/core-cms/pages/" + organizationCode;
        if (!organizationCode.matches("[A-Z][A-Z0-9_-]*") || !url.startsWith(prefix + "/")) {
            throw new IllegalArgumentException("Customer portal URL must belong to its organization");
        }
        String path = url.substring(prefix.length());
        if (!path.matches("(/[a-zA-Z0-9_-][a-zA-Z0-9._-]*)+")) {
            throw new IllegalArgumentException("Invalid customer portal page path");
        }
        return path;
    }
}
