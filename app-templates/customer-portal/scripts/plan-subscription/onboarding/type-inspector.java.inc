    private Map<String, Object> describeType(String entityName, String code) {
        if (entityManager.getMetamodel().getEntities().stream().noneMatch(type -> entityName.equals(type.getName()))) {
            return Map.of("status", "UNAVAILABLE", "code", code, "reason", "ENTITY_NOT_REGISTERED_ON_NODE");
        }
        List<?> rows = entityManager.createQuery("SELECT t FROM " + entityName + " t WHERE t.code = :code", Object.class)
                .setParameter("code", code).getResultList();
        if (rows.size() != 1) return Map.of("status", "UNAVAILABLE", "code", code);
        Object type = rows.get(0); Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "AVAILABLE"); result.put("id", property(type, "id")); result.put("code", code);
        Object owner = property(type, "organization");
        Map<String, Object> ownerInfo = new LinkedHashMap<>();
        ownerInfo.put("id", property(owner, "id")); ownerInfo.put("code", property(owner, "code"));
        result.put("owner", ownerInfo);
        result.put("parents", collection(property(type, "parents")).stream().map(parent -> {
            Map<String, Object> reference = new LinkedHashMap<>();
            reference.put("id", property(parent, "id")); reference.put("code", property(parent, "code")); return reference;
        }).toList());
        Object abstractValue = property(type, "abstract");
        result.put("isAbstract", abstractValue == null ? property(type, "isAbstract") : abstractValue);
        Map<String, Object> fields = new TreeMap<>();
        collectTypeFields(type, fields, new LinkedHashSet<>(), new LinkedHashSet<>());
        result.put("attributes", new ArrayList<>(fields.values()));
        Object workflow = property(type, "workflow");
        Map<String, Object> wf = new LinkedHashMap<>(); wf.put("id", property(workflow, "id")); wf.put("code", property(workflow, "code"));
        wf.put("initialState", property(property(workflow, "initialState"), "code"));
        if ("ResourceType".equals(entityName) && workflow != null) wf.put("states", collection(property(workflow, "states")).stream().sorted(java.util.Comparator.comparing(value -> String.valueOf(property(value,"code")))).map(state -> {
            Map<String, Object> projected = new LinkedHashMap<>(); projected.put("id", property(state, "id")); projected.put("code", property(state, "code"));
            projected.put("events", collection(property(state, "events")).stream().sorted(java.util.Comparator.comparing(value -> String.valueOf(property(value,"code")))).map(event -> Map.of("id", property(event,"id"), "code", property(event,"code"),
                "targets", collection(property(event,"targets")).stream().map(target -> Map.of("id", property(target,"id"), "code", property(target,"code"))).toList())).toList()); return projected;
        }).toList());
        result.put("workflow", wf);
        return result;
    }

    private void collectTypeFields(Object type, Map<String, Object> fields, Set<Object> path, Set<Object> seen) {
        Object id = property(type, "id");
        if (!path.add(id)) throw new ApplicationException("Cyclic type inheritance");
        if (!seen.contains(id)) {
            for (Object parent : collection(property(type, "parents"))) collectTypeFields(parent, fields, path, seen);
            for (Object raw : collection(property(type, "attributes"))) {
                Map<String, Object> field = Json.defaultMapper().convertValue(raw, Map.class);
                Map<String, Object> projected = new LinkedHashMap<>();
                for (String key : List.of("code", "required", "className", "defaultValue", "freeValue")) projected.put(key, field.get(key));
                projected.put("options", collection(field.get("options")).stream().map(value -> objectMap(value).get("value")).toList());
                projected.put("entityTypes", collection(field.get("entityTypes")).stream().map(value -> objectMap(value).get("value")).toList());
                if (!(field.get("code") instanceof String)) throw new ApplicationException("Unreadable model attribute");
                fields.put(String.valueOf(field.get("code")), projected);
            }
            seen.add(id);
        }
        path.remove(id);
    }

    private static Collection<?> collection(Object value) { return value instanceof Collection<?> rows ? rows : List.of(); }
    private static Object property(Object bean, String key) {
        if (bean == null) return null;
        var wrapper = new org.springframework.beans.BeanWrapperImpl(bean);
        return wrapper.isReadableProperty(key) ? wrapper.getPropertyValue(key) : null;
    }
