package com.pixelnation.common.generated;

import java.util.*;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.LockModeType;
import com.fasterxml.jackson.databind.JsonNode;
import com.pixelnation.common.json.Json;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import com.pixelnation.account.domain.Account;
import com.pixelnation.common.domain.Contact;
import com.pixelnation.common.domain.ContactEntry;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.domain.Organization;

public class MAIN_CLASS {
    @Autowired private com.pixelnation.account.persistence.iface.IAccountManager accountManager;
    @Autowired private com.pixelnation.account.persistence.iface.IAccountTypeManager accountTypeManager;
    @Autowired private com.pixelnation.common.persistence.iface.IContactTypeManager contactTypeManager;
    @Autowired private TransactionUtils transactionUtils;
    @PersistenceContext private EntityManager entityManager;
    private static final Map<Integer,String> OLD_TYPES = Map.of(5,"SNOW_RESIDENTIAL_CUSTOMER",6,"SNOW_COMMERCIAL_CUSTOMER",7,"SNOW_PROPERTY_MANAGER");
    private static final Set<String> OBSOLETE = Set.of("CUSTOMER_PRIORITY","PREFERRED_CONTACT_METHOD","BILLING_ADDRESS","REPRESENTATIVE_FIRST_NAME","REPRESENTATIVE_LAST_NAME","REPRESENTATIVE_JOB_TITLE","REPRESENTATIVE_EMAIL","REPRESENTATIVE_PHONE");

    public Map<String,Object> run(String payloadJson) {
        if (Auth.getAuthenticatedUser()==null || Auth.getAuthenticatedOrganization()==null) throw failure("Authenticated system administrator required");
        Integer callerId=Auth.getAuthenticatedUser().getId();
        Integer callerOrganizationId=Auth.getAuthenticatedOrganization().getId();
        final JsonNode input;
        try { input=Json.defaultMapper().readTree(payloadJson); } catch(Exception invalid) { throw failure("Invalid migration payload"); }
        if(input==null || !input.isObject() || !input.path("apply").isBoolean() || !input.path("rows").isArray() || input.path("rows").size()<1 || input.path("rows").size()>25) throw failure("Explicit apply and 1..25 rows required");
        return transactionUtils.getInNewTxRW(() -> {
            User caller=entityManager.find(User.class,callerId);
            Organization callerOrganization=entityManager.find(Organization.class,callerOrganizationId);
            if(caller==null || callerOrganization==null || !Auth.withUser(caller,callerOrganization,(Supplier<Boolean>)()->Auth.isAuthenticatedSystemAdmin()).get())throw failure("Authenticated system administrator required");
            Organization system=entityManager.createQuery("SELECT o FROM Organization o WHERE o.code = :code",Organization.class).setParameter("code","SYSTEM").getSingleResult();
            if(caller==null || system==null)throw failure("Authenticated caller unavailable");
            return Auth.withUser(caller,system,(Supplier<Map<String,Object>>)()-> {
                if(!Auth.isAuthenticatedSystemAdmin())throw failure("Authenticated system administrator required");
                return migrate(input);
            }).get();
        });
    }

    private Map<String,Object> migrate(JsonNode input) {
        var target=accountTypeManager.getByCode("CUSTOMER"); var legal=contactTypeManager.getByCode("LEGAL");
        if(target==null || target.getWorkflow()==null || target.getWorkflow().getId().longValue()!=36 || !"CLIENT_ACCOUNT_LIFECYCLE".equals(target.getWorkflow().getCode()) || legal==null)throw failure("Expected CUSTOMER workflow36 and LEGAL contact type required");
        List<JsonNode> rows=new ArrayList<>(); input.path("rows").forEach(rows::add);
        rows.sort(Comparator.comparingLong(row->requiredNumber(row,"id")));
        Set<Long> ids=new HashSet<>(); List<Account> accounts=new ArrayList<>(); Map<Integer,String> descriptions=new HashMap<>();
        for(JsonNode row:rows) {
            long id=requiredNumber(row,"id"); if(id<=0 || !ids.add(id) || !row.path("contacts").isArray())throw failure("Unique positive IDs and full contact snapshots required");
            Account account=accountManager.get(Math.toIntExact(id),LockModeType.PESSIMISTIC_WRITE);
            if(account==null)throw failure("Account missing: "+id);
            entityManager.refresh(account,LockModeType.PESSIMISTIC_WRITE);
            if(account.getOrganization()==null || !"SNOWLIMITLESS".equals(account.getOrganization().getCode()) || account.getType()==null || account.getType().getId().longValue()!=requiredNumber(row,"typeId") || account.getOptimistic()==null || account.getOptimistic().longValue()!=requiredNumber(row,"optimistic") || account.getWorkflow()==null || account.getWorkflow().getId().longValue()!=36)throw failure("Account scope/version/type/workflow changed: "+id);
            Integer oldId=account.getType().getId();
            if(!target.getId().equals(oldId) && !Objects.equals(OLD_TYPES.get(oldId),account.getType().getCode()))throw failure("Unexpected Account type: "+id);
            verifyContacts(account,row.path("contacts"));
            long primary=account.getContacts().stream().filter(c->contactType(c,"PRIMARY")).count(),legalCount=account.getContacts().stream().filter(c->contactType(c,"LEGAL")).count();
            if(legalCount>1 || !account.getContacts().isEmpty() && legalCount==0 && primary!=1)throw failure("Exactly one LEGAL or PRIMARY contact required: "+id);
            if(!target.getId().equals(oldId)) {
                String notes=""; var bag=account.getAttributes()==null?null:account.getAttributes().get(oldId);
                if(bag!=null)for(var entry:bag.entrySet()) {
                    Object value=entry.getValue()==null?null:entry.getValue().value();
                    if("CUSTOMER_NOTES".equals(entry.getKey())) { if(value!=null && !(value instanceof String))throw failure("Unexpected notes value: "+id); notes=string(value); }
                    else if(!OBSOLETE.contains(entry.getKey()) && populated(value))throw failure("Unmigrated Account attribute "+entry.getKey()+": "+id);
                }
                Object english=account.getNls()==null?null:account.getNls().get("en");
                String current=english instanceof Map<?,?> map?string(map.get("DESCRIPTION")):"";
                String merged=notes.isBlank() || current.equals(notes) || current.endsWith("\n\n"+notes)?current:current.isBlank()?notes:current+"\n\n"+notes;
                descriptions.put(account.getId(),merged);
            }
            accounts.add(account);
        }
        // No entity has been modified before every row, attribute and contact graph passes.
        boolean apply=input.path("apply").booleanValue(); int changedTypes=0,changedContacts=0,changedDescriptions=0;
        List<Map<String,Object>> results=new ArrayList<>();
        for(Account account:accounts) {
            boolean old=!target.getId().equals(account.getType().getId());
            Contact primary=account.getContacts().stream().filter(c->contactType(c,"PRIMARY")).findFirst().orElse(null);
            boolean changeContact=primary!=null && account.getContacts().stream().noneMatch(c->contactType(c,"LEGAL"));
            if(old) {
                changedTypes++; Object english=account.getNls()==null?null:account.getNls().get("en"); String current=english instanceof Map<?,?> map?string(map.get("DESCRIPTION")):""; String merged=descriptions.get(account.getId());
                if(!current.equals(merged)){changedDescriptions++; if(apply)account.setNlsValue("en","DESCRIPTION",merged);}
                if(apply){if(account.getAttributes()!=null){var attributes=new LinkedHashMap<>(account.getAttributes());attributes.remove(account.getType().getId());account.setAttributes(attributes);}account.setType(target);}
            }
            if(changeContact){changedContacts++;if(apply)primary.setType(legal);}
            if(apply && (old||changeContact))accountManager.save(account);
            List<Map<String,Object>> contactIds=new ArrayList<>();
            for(Contact contact:account.getContacts())contactIds.add(Map.of("id",contact.getId(),"typeId",contact.getType().getId(),"entryIds",contact.getContactEntries().stream().map(ContactEntry::getId).sorted().toList()));
            results.add(Map.of("id",account.getId(),"typeId",account.getType().getId(),"contacts",contactIds));
        }
        if(apply)entityManager.flush();
        return Map.of("applied",apply,"changedTypes",changedTypes,"changedContacts",changedContacts,"changedDescriptions",changedDescriptions,"rows",results);
    }

    private void verifyContacts(Account account,JsonNode expected) {
        if(account.getContacts()==null || account.getContacts().size()!=expected.size())throw failure("Contact set changed: "+account.getId());
        Map<Long,JsonNode> snapshots=new HashMap<>();
        for(JsonNode row:expected)if(snapshots.put(requiredNumber(row,"id"),row)!=null)throw failure("Duplicate contact snapshot");
        for(Contact contact:account.getContacts()) {
            entityManager.refresh(contact,LockModeType.PESSIMISTIC_WRITE);
            JsonNode row=snapshots.remove(contact.getId().longValue()); if(row==null)throw failure("Contact identity changed");
            same(row,"title",contact.getTitle());same(row,"firstName",contact.getFirstName());same(row,"middleName",contact.getMiddleName());same(row,"lastName",contact.getLastName());same(row,"suffix",contact.getSuffix());same(row,"notes",contact.getNotes());same(row,"dateOfBirth",contact.getDateOfBirth());
            reference(row.path("type"),contact.getType()==null?null:contact.getType().getId(),contact.getType()==null?null:contact.getType().getCode());
            reference(row.path("language"),contact.getLanguage()==null?null:contact.getLanguage().getId(),null);
            if(contact.getLanguage()!=null && row.path("language").has("code2"))same(row.path("language"),"code2",contact.getLanguage().getCode2());
            reference(row.path("gender"),contact.getGender()==null?null:contact.getGender().getId(),contact.getGender()==null?null:contact.getGender().getCode());
            same(row,"salutation",contact.getSalutation());
            if(!row.path("contactEntries").isArray() || contact.getContactEntries()==null || contact.getContactEntries().size()!=row.path("contactEntries").size())throw failure("Contact entries changed");
            Map<Long,JsonNode> entries=new HashMap<>();for(JsonNode entry:row.path("contactEntries"))if(entries.put(requiredNumber(entry,"id"),entry)!=null)throw failure("Duplicate entry snapshot");
            for(ContactEntry entry:contact.getContactEntries()) {
                entityManager.refresh(entry,LockModeType.PESSIMISTIC_WRITE); JsonNode e=entries.remove(entry.getId().longValue()); if(e==null)throw failure("Contact entry identity changed");
                same(e,"value",entry.getValue());reference(e.path("type"),entry.getType()==null?null:entry.getType().getId(),entry.getType()==null?null:entry.getType().getCode());reference(e.path("kind"),entry.getKind()==null?null:entry.getKind().getId(),entry.getKind()==null?null:entry.getKind().getCode());
            }
        }
    }
    private void same(JsonNode row,String field,Object actual){JsonNode expected=row.path(field);JsonNode value=Json.defaultMapper().valueToTree(actual);if(expected.isMissingNode())expected=com.fasterxml.jackson.databind.node.NullNode.getInstance();if(!expected.equals(value))throw failure("Contact field changed: "+field);}
    private void reference(JsonNode expected,Object id,Object code){if(id==null){if(!expected.isNull()&&!expected.isMissingNode())throw failure("Contact reference changed");return;}if(expected.isNull()||expected.isMissingNode()||!Objects.equals(expected.path("id").asText(),String.valueOf(id))||expected.has("code")&&!Objects.equals(expected.path("code").isNull()?null:expected.path("code").asText(),code))throw failure("Contact reference changed");}
    private boolean contactType(Contact contact,String code){return contact!=null&&contact.getType()!=null&&code.equalsIgnoreCase(contact.getType().getCode());}
    private static boolean populated(Object value){return value!=null&&(!(value instanceof String text)||!text.isBlank())&&(!(value instanceof Collection<?> values)||!values.isEmpty())&&(!(value instanceof Map<?,?> values)||!values.isEmpty());}
    private static String string(Object value){return value==null?"":String.valueOf(value);}
    private static long requiredNumber(JsonNode row,String name){JsonNode value=row.path(name);if(!value.isIntegralNumber()||!value.canConvertToLong())throw failure("Integer field required: "+name);return value.longValue();}
    private static ApplicationException failure(String message){return new ApplicationException(message);}
}
