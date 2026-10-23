# Tenant-scoped SYSTEM.ADMIN access check — 2026-10-22

Scope: dev-1, the existing ADMIN Role defined in SYSTEM, assigned only to one
client organization. This checks the requested onboarding role candidate; it
does not approve or deploy its assignment. Onboarding and payment remain disabled.

## Method and limits

A temporary, operator-only Java Script ran on Core and Account service nodes.
It constructed a transient User and UserOrganizationRole in memory, with one
ADMIN assignment to an existing CA tenant. It never saved either object, issued
credentials, modified a real user's assignments, or created onboarding entities.

The tests used the native Auth implementation and Spring controller beans with
their method-security interceptors. An in-memory servlet request supplied the
request context required by controller metrics. Responses selected only IDs;
no customer profile, password, token or credential was returned. Controller
results are server method tests, not a login/token/network penetration test.

Current deployed class bytecode was inspected for Auth, User, UserApiController,
UserService, OrganizationAuthorizationFilter, CoreBearerTokenAuthentication,
ScriptService, JavaRuntime and JavaCompiler. In particular, the bearer wrapper
rebuilds authorities for the requested organization through
CoreOAuth2User.getAuthorities(organizationCode); it does not blindly preserve
the previous organization's authorities when reading X-Organization-Code.

No nonempty business save, delete, password reset or persistent role assignment
was attempted. Thus write isolation and every custom Script/API were not tested.

## Verified organization boundaries

| Check | Observed result |
| --- | --- |
| ADMIN assigned only to the client organization | Administrative permissions present in that organization; isAuthenticatedSystemAdmin=false |
| Same in-memory User in SYSTEM, SERVICEWAND or Winter Services context | Empty effective permission set; system-admin status remains false |
| Organization list under client ADMIN | Client organization plus its CA/Winter ancestors, three rows; unrelated roots excluded |
| Own Organization by ID | 200 |
| Unrelated Organization by ID | 404 |
| User from an unrelated tenant with no membership in the tested tenant | 404 |
| Own Account by ID, on Account service | 200 |
| ServiceWand-owned Account by ID, on Account service | 404 |
| User controller with no effective permissions | AuthorizationDeniedException |

Visibility of ancestors and shared SYSTEM configuration is part of the native
model; it is not a claim that the user sees only a single Organization row.
The User list also follows the backend's shared SYSTEM-user rules, rather than
being an inventory of exclusively tenant-local identities.

Code inspection additionally found UserApiController.saveUser checks against
modifying users outside the authenticated organization and adding organization
memberships outside that organization/direct children. UserService role
association uses the current authenticated organization. These paths were read,
not exercised with persistent user writes.

## Administrative breadth and Java runtime finding

At the start of this audit ADMIN had 1,734 permissions, including P_SCRIPT_W,
P_SCRIPT_X, P_ROLE_W, P_ROLE_ASSIGN, P_API_KEY_W and Entitlements write permissions.
Its definition being owned by SYSTEM is different from assigning it in SYSTEM.

The native ScriptService.validateExecutePermission gate accepted an arbitrary,
nonexistent/untrusted Script code under the tenant principal because generic
P_SCRIPT_X short-circuits that permission check. This test did not dispatch that
nonexistent Script or prove a later ownership check was absent.

A second test created client-owned Script objects only in memory, obtained their
native compilation units, then ran them through JavaRuntime under the tenant
principal, with no dependencies and a read-only/no-business-write test body.
All six restriction flags were false: allowCreateThread, allowClassLoading,
allowHostClassLookup, allowNativeAccess, allowIO and allowAutowire.

| Harmless test body | Result |
| --- | --- |
| Return the constant "OK" | OK; confirms the runtime test setup executes |
| Return Class.forName("java.lang.String").getName() | java.lang.String, despite allowHostClassLookup=false and allowClassLoading=false |
| Return whether an @Autowired ScriptUtils field was populated | NOT_INJECTED; allowAutowire=false is applied |

The class-lookup result is a concrete mismatch to clarify with backend. It is
not proof of cross-tenant data access or a demonstrated privilege escalation.
The in-memory runtime test bypassed HTTP Script creation/queue submission and
must not be described as a complete end-to-end exploit.

Backend question: should allowHostClassLookup=false reject Class.forName and
similar host-class access in Java? Please confirm the intended semantics and
enforcement in JavaCompiler/BytecodeAnalyzer, and which tenant-admin role and
Script permissions are supported for an untrusted SaaS customer administrator.

The ordinary read tests passed. They do not justify blanket approval of every
ADMIN capability. Keep automatic ADMIN issuance disabled until the Java result
and the intended scope of Script/Entitlements administration are reviewed.
This does not reinstate the incorrect assumption that the ADMIN code alone
means platform system-admin access; assignment organization still matters.

## Cleanup

The temporary technical Script was deleted. Core's automatically registered
read/execute permissions were removed; the ADMIN permission ID set exactly
matched the pre-test set. No persistent test User was created. Existing
PLAN_SUBSCRIPTION Scripts, workflows, types, role assignments and payment
configuration were not updated by this audit.
