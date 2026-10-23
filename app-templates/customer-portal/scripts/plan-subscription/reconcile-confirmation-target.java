package com.pixelnation.cms.generated;

import java.util.Map;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.domain.Organization;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import com.pixelnation.modules.workflow.persistence.iface.IWorkflowManager;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

// Temporary deployment repair only. Do not attach to a workflow or grant to buyers.
// The existing mapped importer does not update an existing event's target on dev-1.
public class MAIN_CLASS {
    @Autowired private IWorkflowManager workflowManager;
    @Autowired private TransactionUtils transactionUtils;
    @PersistenceContext private EntityManager entityManager;

    public Map<String, Object> reconcile() {
        Integer callerId = Auth.getAuthenticatedUser() == null ? null : Auth.getAuthenticatedUser().getId();
        if (callerId == null) throw new ApplicationException("Administrator required");
        return transactionUtils.getInNewTxRW(() -> {
            User caller = entityManager.find(User.class, callerId);
            Organization system = entityManager.createQuery("SELECT o FROM Organization o WHERE o.code = :code", Organization.class)
                    .setParameter("code", "SYSTEM").getSingleResult();
            return Auth.withUser(caller, system, (Supplier<Map<String, Object>>) () -> {
                if (!Auth.isAuthenticatedSystemAdmin()) throw new ApplicationException("Administrator required");
                var workflow = workflowManager.getByCode("PLAN_SUBSCRIPTION");
                if (workflow == null || !"SERVICEWAND".equals(workflow.getOrganization().getCode())
                        || workflow.getScript() == null || !"PLAN_SUBSCRIPTION_WORKFLOW_V11".equals(workflow.getScript().getCode())) {
                    throw new ApplicationException("Expected deployed subscription workflow not found");
                }
                var source = workflow.getStates().stream().filter(s -> "CHECKOUT_PREPARED".equals(s.getCode())).findFirst().orElseThrow();
                var target = workflow.getStates().stream().filter(s -> "PURCHASE_CONFIRMATION_RECEIVED".equals(s.getCode())).findFirst().orElseThrow();
                var event = source.getEvents().stream().filter(e -> "CONFIRM_PURCHASE".equals(e.getCode())).findFirst().orElseThrow();
                if (event.getTargets().size() != 1 || event.getTargets().stream().anyMatch(s ->
                        !"DRAFT_ORDER_READY".equals(s.getCode()) && !target.getCode().equals(s.getCode()))) {
                    throw new ApplicationException("Unexpected confirmation targets; refusing to replace them");
                }
                boolean changed = !event.getTargets().iterator().next().getId().equals(target.getId());
                if (changed) {
                    event.getTargets().clear(); event.getTargets().add(target);
                    workflowManager.save(workflow);
                    entityManager.flush();
                }
                return Map.of("workflow", workflow.getCode(), "event", event.getCode(), "target", target.getCode(), "changed", changed);
            }).get();
        });
    }
}
