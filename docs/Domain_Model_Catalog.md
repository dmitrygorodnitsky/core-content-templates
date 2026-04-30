# Winter Services – Domain Model Catalog (from core* modules)

This document is auto-generated from the current codebase (JPA/Mongo annotations).
It’s intended as a starting point for a Winter Services data model: entity inventory, key structure, and where entities show up in business flows.

## Scope and notes

- Included: classes annotated with `@Entity`, `@Embeddable`, `@MappedSuperclass`, `@Document` under `core*/*/src/main`. 
- Excluded: test-only entities (`src/test`), build/generated sources.
- ‘Used by’ is best-effort: ripgrep-based references across all `core*` modules (`src/main`).

## Module: `core`

### AbstractEntityType

- **Kind:** MappedSuperclass
- **FQCN:** `com.pixelnation.common.domain.AbstractEntityType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/AbstractEntityType.java`
- **Role (heuristic):** Base/pattern class providing shared fields/behavior for persisted types.
- **Description:** AbstractEntityType class.
- **Relationships/Value objects:** `@ManyToMany` → `List<T> parents`; `@ManyToMany` → `List<T> children`; `@ManyToOne` → `Image image`

### AbstractStateTransition

- **Kind:** MappedSuperclass
- **FQCN:** `com.pixelnation.common.domain.AbstractStateTransition`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/AbstractStateTransition.java`
- **Role (heuristic):** Base/pattern class providing shared fields/behavior for persisted types.
- **Relationships/Value objects:** `@ManyToOne` → `T entity`; `@ManyToOne` → `WorkflowState state`; `@ManyToOne` → `User user`

### AbstractTypedEntity

- **Kind:** MappedSuperclass
- **FQCN:** `com.pixelnation.common.domain.AbstractTypedEntity`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/AbstractTypedEntity.java`
- **Role (heuristic):** Base/pattern class providing shared fields/behavior for persisted types.
- **Description:** Resource entity.
- **Relationships/Value objects:** `@ManyToOne` → `T type`

### Address

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Address`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Address.java`
- **Role (heuristic):** Auxiliary entity representing an address linked to a parent entity.
- **Description:** Address entity class.
- **Table:** `address`
- **Sequence:** `seq_address`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `State state`; `@ManyToOne` → `Country country`; `@Embedded` → `GeoLocation geoLocation`

### AddressType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.AddressType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/AddressType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Defines type of the address: BILLING, SHIPPING, Etc.
- **Table:** `address_type`
- **Sequence:** `seq_address_type`
- **ID:** `Integer id`

### ApiKey

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ApiKey`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ApiKey.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `api_key`
- **Sequence:** `seq_api_key`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `OAuth2RegisteredClient client`; `@ManyToOne` → `User user`

### AsyncRequest

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.AsyncRequest`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/AsyncRequest.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `async_request`
- **ID:** `String id`

### Contact

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Contact`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Contact.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `contact`
- **Sequence:** `seq_contact`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Dictionary gender`; `@ManyToOne` → `Language language`; `@ManyToOne` → `ContactType type`; `@OneToMany` → `List<ContactEntry> contactEntries`

### ContactEntry

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ContactEntry`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ContactEntry.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** ContactEntry is an atomic entry for the contact object.
- **Table:** `contact_entry`
- **Sequence:** `seq_contact_entry`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ContactEntryType type`; `@ManyToOne` → `ContactEntryKind kind`; `@ManyToOne` → `Contact contact`

### ContactEntryKind

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ContactEntryKind`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ContactEntryKind.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Group of the contact entry - home, business, Etc.
- **Table:** `contact_entry_kind`
- **Sequence:** `seq_contact_entry_kind`
- **ID:** `Integer id`

### ContactEntryType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ContactEntryType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ContactEntryType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Type of the contact entry - email, phone, Etc.
- **Table:** `contact_entry_type`
- **Sequence:** `seq_contact_entry_type`
- **ID:** `Integer id`

### ContactType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ContactType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ContactType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** ContactType represents various types of contacts.
- **Table:** `contact_type`
- **Sequence:** `seq_contact_type`
- **ID:** `Integer id`

### Country

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Country`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Country.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `country`
- **ID:** `String code2`
- **Relationships/Value objects:** `@OneToMany` → `Set<State> states`

### Dashboard

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Dashboard`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Dashboard.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Dashboard is per usesr.
- **Table:** `dashboard`
- **Sequence:** `seq_dashboard`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `User user`

### Dictionary

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Dictionary`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Dictionary.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The entity class for the dictionary.
- **Table:** `dictionary`
- **Sequence:** `seq_dictionary`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToMany` → `Set<Dictionary> dependsOn`; `@ManyToMany` → `Set<Dictionary> dependents`; `@ManyToOne` → `Image image`

### DictionaryType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.DictionaryType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/DictionaryType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** The entity class for the dictionary type.
- **Table:** `dictionary_type`
- **Sequence:** `seq_dictionary_type`
- **ID:** `Integer id`

### Document

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Document`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Document.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a concrete document instance in the system.
- **Table:** `document`
- **Sequence:** `seq_document`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToMany` → `Set<Permission> permissions`

### DocumentStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.DocumentStateTransition`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/DocumentStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `document_state_transition`
- **Sequence:** `seq_document_state_transition`
- **ID:** `Long id`

### DocumentType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.DocumentType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/DocumentType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Represents a document type in the system that serves as a blueprint for documents.
- **Table:** `document_type`
- **Sequence:** `seq_document_type`
- **ID:** `Integer id`

### GeoLocation

- **Kind:** Embeddable
- **FQCN:** `com.pixelnation.common.domain.GeoLocation`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/GeoLocation.java`
- **Role (heuristic):** Value object embedded into an owning entity (often composite IDs or grouped fields).

### HttpRequestLog

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.HttpRequestLog`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/HttpRequestLog.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `http_request_log`
- **ID:** `LocalDateTime start`, `String ipAddress`, `String sessionId`, `String url`, `String nodeId`, `RequestType requestType`

### Image

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Image`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Image.java`
- **Role (heuristic):** Core business entity for this module’s domain.

### Language

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Language`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Language.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `lang`
- **ID:** `String code3`

### LogNode

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.LogNode`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/LogNode.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `log_level`
- **ID:** `String path`, `String app`

### Media

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Media`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Media.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **ID:** `String id`
- **Relationships/Value objects:** `@ManyToOne` → `MediaLibrary mediaLibrary`

### MediaAsset

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.MediaAsset`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/MediaAsset.java`
- **Role (heuristic):** Core business entity for this module’s domain.

### MediaLibrary

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.MediaLibrary`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/MediaLibrary.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `media_library`
- **Sequence:** `seq_media_library`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `MediaLibrary parent`; `@ManyToOne` → `MediaLibraryStats stats`

### MediaLibraryStats

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.MediaLibraryStats`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/MediaLibraryStats.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **ID:** `Integer id`

### NlsKey

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.NlsKey`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/NlsKey.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `nls_key`
- **Sequence:** `seq_nls_key`
- **ID:** `Integer id`

### NotificationLog

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.NotificationLog`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/NotificationLog.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `notification_log`
- **Sequence:** `seq_notification_log`
- **ID:** `Long id`

### NotificationMessage

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.NotificationMessage`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/NotificationMessage.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `notification_message`
- **ID:** `String id`

### Organization

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Organization`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Organization.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `organization`
- **Sequence:** `seq_organization`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Organization parent`; `@OneToMany` → `List<Contact> contacts`; `@OneToMany` → `Set<OrganizationAddress> addresses`; `@OneToOne` → `Image image`

### OrganizationAddress

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.OrganizationAddress`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/OrganizationAddress.java`
- **Role (heuristic):** Auxiliary entity representing an address linked to a parent entity.
- **Table:** `organization_address_map`
- **Relationships/Value objects:** `@ManyToOne` → `Organization organization`

### OrganizationSecret

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.OrganizationSecret`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/OrganizationSecret.java`
- **Role (heuristic):** Credential/secret storage entity (keys/tokens/password material).
- **Relationships/Value objects:** `@ManyToOne` → `Organization organization`

### OrganizationStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.OrganizationStateTransition`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/OrganizationStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `organization_state_transition`
- **Sequence:** `seq_organization_state_transition`
- **ID:** `Long id`

### OrganizationType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.OrganizationType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/OrganizationType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `organization_type`
- **Sequence:** `seq_organization_type`
- **ID:** `Integer id`

### Permission

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Permission`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Permission.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `permissions`
- **ID:** `String name`

### Preference

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Preference`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Preference.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `preferences`
- **ID:** `String app`, `String key`

### PreferenceKey

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.PreferenceKey`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/PreferenceKey.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The persistent class for the preference_key database table.
- **Table:** `preference_key`
- **Sequence:** `seq_preference_key`
- **ID:** `Integer id`

### Role

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Role`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Role.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `roles`
- **Sequence:** `seq_role`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToMany` → `Set<Permission> permissions`

### RoleGroup

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.RoleGroup`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/RoleGroup.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Used to group multiple roles together.
- **Table:** `role_group`
- **Sequence:** `seq_role_group`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToMany` → `Set<Role> roles`

### Schedule

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Schedule`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Schedule.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `schedule`
- **Sequence:** `seq_schedule`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ScheduleGroup group`; `@ManyToOne` → `Script onStart`; `@ManyToOne` → `Script onFailure`; `@ManyToOne` → `Script onSuccess`; `@ManyToOne` → `User runAs`

### ScheduleGroup

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ScheduleGroup`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ScheduleGroup.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `schedule_group`
- **Sequence:** `seq_schedule_group`
- **ID:** `Integer id`

### ScheduleHistory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ScheduleHistory`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ScheduleHistory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `schedule_history`
- **ID:** `String code`, `LocalDateTime startTime`
- **Relationships/Value objects:** `@ManyToOne` → `User runAs`

### ScheduleInfo

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ScheduleInfo`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ScheduleInfo.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `schedule_info`
- **Sequence:** `seq_schedule_info`
- **ID:** `Integer id`

### Script

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Script`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Script.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The executable script provides the information about the public methods/functions available in the script.
- **Table:** `script`
- **Sequence:** `seq_script`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ScriptCategory category`; `@ManyToMany` → `List<Script> dependencies`

### ScriptCategory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ScriptCategory`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ScriptCategory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `script_category`
- **Sequence:** `seq_script_category`
- **ID:** `Integer id`

### ScriptTask

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.ScriptTask`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/ScriptTask.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `script_tasks`
- **Sequence:** `seq_script_task`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Script script`

### Secret

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Secret`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Secret.java`
- **Role (heuristic):** Credential/secret storage entity (keys/tokens/password material).
- **Description:** Entity class representing sensitive information such as API keys, tokens, or credentials.
- **Table:** `secret`
- **Sequence:** `seq_secret`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `SecretType type`

### SecretType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.SecretType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/SecretType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `secret_type`
- **Sequence:** `seq_secret_type`
- **ID:** `Integer id`

### Sound

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Sound`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Sound.java`
- **Role (heuristic):** Core business entity for this module’s domain.

### State

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.State`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/State.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `state`
- **Sequence:** `seq_state`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Country country`

### TypedAddress

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.TypedAddress`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/TypedAddress.java`
- **Role (heuristic):** Auxiliary entity representing an address linked to a parent entity.
- **Table:** `typed_address`
- **Sequence:** `seq_typed_address`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Address address`; `@Embedded` → `GeoLocation geoLocation`; `@ManyToMany` → `Set<AddressType> types`

### UIApplication

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UIApplication`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UIApplication.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `ui_application`
- **Sequence:** `seq_ui_application`
- **ID:** `Integer id`

### Unit

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Unit`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Unit.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Unit, kg, mg, ton, cm, km, etc
- **Table:** `unit`
- **Sequence:** `seq_unit`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `UnitCategory category`; `@ManyToOne` → `Unit baseUnit`

### UnitCategory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UnitCategory`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UnitCategory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Unit category, used to group units.
- **Table:** `unit_category`
- **Sequence:** `seq_unit_category`
- **ID:** `Integer id`

### User

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.User`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/User.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `users`
- **Sequence:** `seq_user`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@OneToMany` → `Set<UserOrganizationRole> roles`; `@ManyToOne` → `Language language`; `@OneToMany` → `List<Contact> contacts`; `@OneToMany` → `Set<UserAddress> addresses`; `@OneToOne` → `Image avatar`

### UserAddress

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserAddress`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserAddress.java`
- **Role (heuristic):** Auxiliary entity representing an address linked to a parent entity.
- **Table:** `user_address_map`
- **Relationships/Value objects:** `@ManyToOne` → `User user`

### UserMetadata

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserMetadata`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserMetadata.java`
- **Role (heuristic):** Auxiliary entity for extensible or structured metadata linked to a parent entity.
- **Description:** Metadata attached to each user (customer)
- **Table:** `user_metadata`
- **Sequence:** `seq_user_metadata`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `User user`

### UserOrganizationPreferences

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserOrganizationPreferences`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserOrganizationPreferences.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a set of configurable preferences for a specific {@link User} within an organization and preference type.
- **Table:** `user_org_preferences`
- **Sequence:** `seq_user_org_preferences`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `User user`

### UserOrganizationPreferencesType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserOrganizationPreferencesType`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserOrganizationPreferencesType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `user_org_preferences_type`
- **Sequence:** `seq_user_org_preferences_type`
- **ID:** `Integer id`

### UserOrganizationRole

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserOrganizationRole`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserOrganizationRole.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `user_organization_role`
- **Relationships/Value objects:** `@EmbeddedId` → `UserOrganizationRolePK id`; `@ManyToOne` → `User user`; `@ManyToOne` → `Organization organization`; `@ManyToOne` → `Role role`

### UserOrganizationRolePK

- **Kind:** Embeddable
- **FQCN:** `com.pixelnation.common.domain.UserOrganizationRolePK`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserOrganizationRolePK.java`
- **Role (heuristic):** Value object embedded into an owning entity (often composite IDs or grouped fields).

### UserSecret

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserSecret`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserSecret.java`
- **Role (heuristic):** Credential/secret storage entity (keys/tokens/password material).
- **Relationships/Value objects:** `@ManyToOne` → `User user`

### UserStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.UserStateTransition`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/UserStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `user_state_transition`
- **Sequence:** `seq_user_state_transition`
- **ID:** `Long id`

### Video

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.Video`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/Video.java`
- **Role (heuristic):** Core business entity for this module’s domain.

### CoreRevisionEntity

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.audit.CoreRevisionEntity`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/audit/CoreRevisionEntity.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `revinfo`

### ClusterView

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.domain.cluster.ClusterView`
- **Source:** `core/src/main/java/com/pixelnation/common/domain/cluster/ClusterView.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `cluster_view`
- **ID:** `String cluster`, `String node`

### OAuth2Authorization

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.security.oauth2.OAuth2Authorization`
- **Source:** `core/src/main/java/com/pixelnation/common/security/oauth2/OAuth2Authorization.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `oauth2_authorization`
- **ID:** `String id`

### OAuth2RegisteredClient

- **Kind:** Entity
- **FQCN:** `com.pixelnation.common.security.oauth2.OAuth2RegisteredClient`
- **Source:** `core/src/main/java/com/pixelnation/common/security/oauth2/OAuth2RegisteredClient.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `oauth2_registered_client`
- **ID:** `String id`

### Chat

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.chat.domain.Chat`
- **Source:** `core/src/main/java/com/pixelnation/modules/chat/domain/Chat.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a chat conversation between users.
- **Table:** `chat`
- **Sequence:** `seq_chat`
- **ID:** `Long id`
- **Relationships/Value objects:** `@OneToMany` → `Set<ChatParticipant> participants`; `@ManyToOne` → `User owner`

### ChatMessage

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.chat.domain.ChatMessage`
- **Source:** `core/src/main/java/com/pixelnation/modules/chat/domain/ChatMessage.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a message within a chat conversation.
- **Table:** `chat_message`
- **Sequence:** `seq_chat_message`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Chat chat`; `@ManyToOne` → `User sender`; `@OneToMany` → `List<Media> media`

### ChatParticipant

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.chat.domain.ChatParticipant`
- **Source:** `core/src/main/java/com/pixelnation/modules/chat/domain/ChatParticipant.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `chat_participants`
- **Relationships/Value objects:** `@EmbeddedId` → `ChatParticipantPK id`; `@ManyToOne` → `Chat chat`; `@ManyToOne` → `User user`

### ChatParticipantPK

- **Kind:** Embeddable
- **FQCN:** `com.pixelnation.modules.chat.domain.ChatParticipantPK`
- **Source:** `core/src/main/java/com/pixelnation/modules/chat/domain/ChatParticipantPK.java`
- **Role (heuristic):** Value object embedded into an owning entity (often composite IDs or grouped fields).

### ChatType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.chat.domain.ChatType`
- **Source:** `core/src/main/java/com/pixelnation/modules/chat/domain/ChatType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `chat_type`
- **Sequence:** `seq_chat_type`
- **ID:** `Integer id`

### Rule

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.rule.domain.Rule`
- **Source:** `core/src/main/java/com/pixelnation/modules/rule/domain/Rule.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Entity representing a business rule in the system.
- **Table:** `rule`
- **Sequence:** `seq_rule`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToMany` → `Set<RuleSet> ruleSets`

### RuleSet

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.rule.domain.RuleSet`
- **Source:** `core/src/main/java/com/pixelnation/modules/rule/domain/RuleSet.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `rule_set`
- **Sequence:** `seq_rule_set`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToMany` → `List<Rule> rules`

### Workflow

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.Workflow`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/Workflow.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Workflow represents a sequence of states and events that define a business process.<br> It contains metadata, a script, and an initial state.
- **Table:** `workflow`
- **Sequence:** `seq_workflow`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@OneToMany` → `List<Workflow> children`; `@OneToMany` → `List<WorkflowState> states`; `@ManyToOne` → `Script script`; `@ManyToOne` → `RuleSet onDeleteRuleSet`; `@ManyToOne` → `RuleSet onUpdateRuleSet`; `@ManyToOne` → `WorkflowState initialState`

### WorkflowMessage

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.WorkflowMessage`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/WorkflowMessage.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `workflow_message`
- **Sequence:** `seq_workflow_message`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToMany` → `List<Media> attachments`; `@ManyToOne` → `User user`

### WorkflowMessageStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.WorkflowMessageStateTransition`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/WorkflowMessageStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `workflow_message_state_transition`
- **Sequence:** `seq_workflow_message_state_transition`
- **ID:** `Long id`

### WorkflowProcess

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.WorkflowProcess`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/WorkflowProcess.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a workflow process instance that executes a specific workflow.
- **Table:** `workflow_process`
- **Sequence:** `seq_workflow_process`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@OneToMany` → `List<WorkflowProcessTrigger> triggers`; `@ManyToOne` → `Workflow workflow`; `@ManyToOne` → `User user`

### WorkflowProcessTrigger

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.WorkflowProcessTrigger`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/WorkflowProcessTrigger.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a trigger that initiates the execution of a workflow process.
- **Table:** `workflow_process_trigger`
- **Sequence:** `seq_workflow_process_trigger`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `WorkflowProcess process`

### WorkflowState

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.WorkflowState`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/WorkflowState.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `workflow_state`
- **Sequence:** `seq_workflow_state`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Workflow workflow`; `@ManyToOne` → `RuleSet onEnterRuleSet`; `@ManyToOne` → `RuleSet onExitRuleSet`; `@OneToMany` → `List<WorkflowEvent> events`; `@ManyToOne` → `Image image`

### has

- **Kind:** Entity
- **FQCN:** `com.pixelnation.modules.workflow.domain.has`
- **Source:** `core/src/main/java/com/pixelnation/modules/workflow/domain/WorkflowEvent.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `workflow_event`
- **Sequence:** `seq_workflow_event`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `WorkflowState source`; `@ManyToOne` → `Workflow workflow`; `@ManyToMany` → `List<WorkflowState> targets`; `@ManyToOne` → `Image image`

### LocalizationMessage

- **Kind:** Entity
- **FQCN:** `com.pixelnation.spring.domain.LocalizationMessage`
- **Source:** `core/src/main/java/com/pixelnation/spring/domain/LocalizationMessage.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `i18n_messages`
- **ID:** `String locale`, `String key`

## Module: `core-acct`

### Account

- **Kind:** Entity
- **FQCN:** `com.pixelnation.account.domain.Account`
- **Source:** `core-acct/src/main/java/com/pixelnation/account/domain/Account.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `account`
- **Sequence:** `seq_account`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `User user`; `@OneToMany` → `List<Contact> contacts`; `@OneToMany` → `Set<AccountAddress> addresses`

### AccountAddress

- **Kind:** Entity
- **FQCN:** `com.pixelnation.account.domain.AccountAddress`
- **Source:** `core-acct/src/main/java/com/pixelnation/account/domain/AccountAddress.java`
- **Role (heuristic):** Auxiliary entity representing an address linked to a parent entity.
- **Table:** `account_address_map`
- **Relationships/Value objects:** `@ManyToOne` → `Account account`

### AccountMetadata

- **Kind:** Entity
- **FQCN:** `com.pixelnation.account.domain.AccountMetadata`
- **Source:** `core-acct/src/main/java/com/pixelnation/account/domain/AccountMetadata.java`
- **Role (heuristic):** Auxiliary entity for extensible or structured metadata linked to a parent entity.
- **Description:** Metadata attached to each account (customer).
- **Table:** `account_metadata`
- **Sequence:** `seq_account_metadata`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Account account`

### AccountStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.account.domain.AccountStateTransition`
- **Source:** `core-acct/src/main/java/com/pixelnation/account/domain/AccountStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `account_state_transition`
- **Sequence:** `seq_account_state_transition`
- **ID:** `Long id`

### AccountType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.account.domain.AccountType`
- **Source:** `core-acct/src/main/java/com/pixelnation/account/domain/AccountType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `account_type`
- **Sequence:** `seq_account_type`
- **ID:** `Integer id`

## Module: `core-ads`

### Advertisement

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.Advertisement`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/Advertisement.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents an advertisement within a broader marketing campaign.
- **Table:** `advertisement`
- **Sequence:** `seq_advertisement`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `MarketingCampaign campaign`; `@ManyToMany` → `Set<AdvertisementCategory> categories`; `@ManyToOne` → `Image image`

### AdvertisementCategory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.AdvertisementCategory`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/AdvertisementCategory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents an advertisement category within a flexible graph structure, allowing each category to be associated with multiple parent and child categories.
- **Table:** `advertisement_category`
- **Sequence:** `seq_advertisement_category`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToMany` → `Set<AdvertisementCategory> parentCategories`; `@ManyToMany` → `Set<AdvertisementCategory> childCategories`

### AdvertisementCategoryType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.AdvertisementCategoryType`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/AdvertisementCategoryType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Represents an advertisement category type within a hierarchical tree structure, defining the foundational attributes and organizational framework for various ad categories.
- **Table:** `advertisement_category_type`
- **Sequence:** `seq_advertisement_category_type`
- **ID:** `Integer id`

### AdvertisementType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.AdvertisementType`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/AdvertisementType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `advertisement_type`
- **Sequence:** `seq_advertisement_type`
- **ID:** `Integer id`

### Impression

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.Impression`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/Impression.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents an impression of an advertisement, capturing essential details related to the display and performance of the ad.
- **Table:** `impression`
- **Sequence:** `seq_impression`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Advertisement advertisement`; `@ManyToOne` → `ImpressionType type`

### ImpressionType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.ImpressionType`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/ImpressionType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `impression_type`
- **Sequence:** `seq_impression_type`
- **ID:** `Integer id`

### MarketingCampaign

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.MarketingCampaign`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/MarketingCampaign.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a specific marketing campaign that is based on a predefined {@code MarketingCampaignType}.
- **Table:** `marketing_campaign`
- **Sequence:** `seq_marketing_campaign`
- **ID:** `Integer id`

### MarketingCampaignType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.marketing.domain.MarketingCampaignType`
- **Source:** `core-ads/src/main/java/com/pixelnation/marketing/domain/MarketingCampaignType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Examples of Marketing Program Types across Various Industries.
- **Table:** `marketing_campaign_type`
- **Sequence:** `seq_marketing_campaign_type`
- **ID:** `Integer id`

## Module: `core-bill`

### AccountBalance

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.AccountBalance`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/AccountBalance.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Entity mapped to the account_currency_balance materialized view.
- **Table:** `account_currency_balance`
- **Relationships/Value objects:** `@EmbeddedId` → `AccountBalancePK id`; `@ManyToOne` → `Account account`; `@ManyToOne` → `Dictionary currency`

### AccountBalancePK

- **Kind:** Embeddable
- **FQCN:** `com.pixelnation.bill.domain.AccountBalancePK`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/AccountBalancePK.java`
- **Role (heuristic):** Value object embedded into an owning entity (often composite IDs or grouped fields).

### BalanceTransaction

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.BalanceTransaction`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/BalanceTransaction.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a balance transaction in the system, which can be linked to an order or invoice.
- **Table:** `balance_transaction`
- **Sequence:** `seq_balance_transaction`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Account sourceAccount`; `@ManyToOne` → `Account targetAccount`; `@ManyToOne` → `Order order`; `@ManyToOne` → `Invoice invoice`; `@ManyToOne` → `Dictionary sourceCurrency`; `@ManyToOne` → `ExchangeRate exchangeRate`

### ExchangeRate

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.ExchangeRate`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/ExchangeRate.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** ExchangeRate entity.
- **Table:** `exchange_rate`
- **Sequence:** `seq_exchange_rate`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Dictionary sourceCurrency`; `@ManyToOne` → `Dictionary targetCurrency`

### Invoice

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.Invoice`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/Invoice.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `invoice`
- **Sequence:** `seq_invoice`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Order order`; `@OneToMany` → `List<BalanceTransaction> payments`

### InvoiceStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.InvoiceStateTransition`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/InvoiceStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `invoice_state_transition`
- **Sequence:** `seq_invoice_state_transition`
- **ID:** `Long id`

### InvoiceType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.InvoiceType`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/InvoiceType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `invoice_type`
- **Sequence:** `seq_invoice_type`
- **ID:** `Integer id`

### Order

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.Order`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/Order.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `orders`
- **Sequence:** `seq_order`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Account account`; `@OneToMany` → `List<OrderItem> items`; `@ManyToOne` → `Dictionary currency`

### OrderItem

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.OrderItem`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/OrderItem.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `order_item`
- **Sequence:** `seq_order_item`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Order order`; `@ManyToOne` → `ProductPrice itemPrice`

### OrderItemStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.OrderItemStateTransition`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/OrderItemStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `order_item_state_transition`
- **Sequence:** `seq_order_item_state_transition`
- **ID:** `Long id`

### OrderItemType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.OrderItemType`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/OrderItemType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `order_item_type`
- **Sequence:** `seq_order_item_type`
- **ID:** `Integer id`

### OrderStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.OrderStateTransition`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/OrderStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `order_state_transition`
- **Sequence:** `seq_order_state_transition`
- **ID:** `Long id`

### OrderType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.OrderType`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/OrderType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `order_type`
- **Sequence:** `seq_order_type`
- **ID:** `Integer id`

### Shipment

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.Shipment`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/Shipment.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `shipment`
- **Sequence:** `seq_shipment`
- **ID:** `Long id`

### ShipmentStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.ShipmentStateTransition`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/ShipmentStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `shipment_state_transition`
- **Sequence:** `seq_shipment_state_transition`
- **ID:** `Long id`

### ShipmentType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.bill.domain.ShipmentType`
- **Source:** `core-bill/src/main/java/com/pixelnation/bill/domain/ShipmentType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Represents a hierarchical structure for shipment types in a logistics management system, where attributes are inherited from parent types to child types.
- **Table:** `shipment_type`
- **Sequence:** `seq_shipment_type`
- **ID:** `Integer id`

## Module: `core-cms`

### BlockTemplate

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.BlockTemplate`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/BlockTemplate.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code BlockTemplate} class is a fundamental component of our content management system (CMS) designed to streamline the creation and management of white-label websites.
- **Table:** `block_template`
- **ID:** `UUID id`
- **Relationships/Value objects:** `@ManyToOne` → `BlockTemplate parent`; `@OneToMany` → `List<BlockTemplate> children`

### BlogPost

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.BlogPost`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/BlogPost.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `blog_post`
- **Sequence:** `seq_blog_post`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `BlogPost parent`; `@ManyToOne` → `User author`; `@ManyToMany` → `Set<BlogPostTag> tags`; `@ManyToMany` → `Set<BlogPostCategory> categories`; `@ManyToMany` → `List<Image> images`

### BlogPostCategory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.BlogPostCategory`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/BlogPostCategory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** BlogPostCategory is NlsAware as it could be in multiple languages
- **Table:** `blog_post_category`
- **Sequence:** `seq_blog_post_category`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `BlogPostCategory parent`; `@OneToOne` → `Image image`

### BlogPostComment

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.BlogPostComment`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/BlogPostComment.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `blog_post_comment`
- **Sequence:** `seq_blog_post_comment`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `BlogPost blogPost`; `@ManyToOne` → `BlogPostComment parent`; `@ManyToOne` → `User author`

### BlogPostTag

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.BlogPostTag`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/BlogPostTag.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code BlogPostTag} class represents a tag that can be associated with blog posts in the content management system.
- **Table:** `blog_post_tag`
- **Sequence:** `seq_blog_post_tag`
- **ID:** `Integer id`

### Form

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.Form`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/Form.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `form`
- **Sequence:** `seq_form`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `User user`

### FormStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.FormStateTransition`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/FormStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `form_state_transition`
- **Sequence:** `seq_form_state_transition`
- **ID:** `Long id`

### FormType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.FormType`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/FormType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** FormType represents a web form definition, where attributes define form fields and rules for populating them.
- **Table:** `form_type`
- **Sequence:** `seq_form_type`
- **ID:** `Integer id`

### PageContext

- **Kind:** Entity
- **FQCN:** `com.pixelnation.cms.domain.PageContext`
- **Source:** `core-cms/src/main/java/com/pixelnation/cms/domain/PageContext.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code PageContext} class is an essential component of our content management system (CMS) that represents individual web pages.
- **Table:** `page_context`
- **Sequence:** `seq_page_context`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `BlockTemplate template`; `@ManyToMany` → `Set<Permission> permissions`

## Module: `core-ml`

### AiChat

- **Kind:** Entity
- **FQCN:** `com.pixelnation.ml.assistant.domain.AiChat`
- **Source:** `core-ml/src/main/java/com/pixelnation/ml/assistant/domain/AiChat.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** <p> The AiChat entity represents a conversation between a user and an AI assistant.
- **Table:** `ai_chat`
- **Sequence:** `seq_ai_chat`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `User user`; `@OneToOne` → `AiChatMemory memory`; `@ManyToOne` → `Dictionary config`

### AiChatMemory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.ml.assistant.domain.AiChatMemory`
- **Source:** `core-ml/src/main/java/com/pixelnation/ml/assistant/domain/AiChatMemory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `ai_chat_memory`
- **ID:** `Long id`
- **Relationships/Value objects:** `@OneToOne` → `AiChat chat`

### AiChatMessage

- **Kind:** Entity
- **FQCN:** `com.pixelnation.ml.assistant.domain.AiChatMessage`
- **Source:** `core-ml/src/main/java/com/pixelnation/ml/assistant/domain/AiChatMessage.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a chat message entity associated with an AI chat session within the system.
- **Table:** `ai_chat_message`
- **Sequence:** `seq_ai_chat_message`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `AiChat chat`

## Module: `core-pay`

### PaymentRequest

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pay.domain.PaymentRequest`
- **Source:** `core-pay/src/main/java/com/pixelnation/pay/domain/PaymentRequest.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Payment entity.
- **Table:** `payment_request`
- **ID:** `UUID id`
- **Relationships/Value objects:** `@ManyToOne` → `Invoice invoice`; `@ManyToOne` → `Dictionary currency`

### Refund

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pay.domain.Refund`
- **Source:** `core-pay/src/main/java/com/pixelnation/pay/domain/Refund.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Refund entity.
- **Table:** `refund`
- **Sequence:** `seq_refund`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Order order`; `@OneToMany` → `List<OrderItem> items`

## Module: `core-pim`

### Interval

- **Kind:** Embeddable
- **FQCN:** `com.pixelnation.pim.domain.Interval`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/Interval.java`
- **Role (heuristic):** Value object embedded into an owning entity (often composite IDs or grouped fields).
- **Description:** Represents a recurring interval for pricing, used when the price type is set to recurring.

### Inventory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.Inventory`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/Inventory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `inventory`
- **Sequence:** `seq_inventory`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Product product`

### InventoryStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.InventoryStateTransition`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/InventoryStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `inventory_state_transition`
- **Sequence:** `seq_inventory_state_transition`
- **ID:** `Long id`

### InventoryTransaction

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.InventoryTransaction`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/InventoryTransaction.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Examples of various InventoryTransaction instances with different InventoryTransactionType values across multiple vertical markets.
- **Table:** `inventory_transaction`
- **Sequence:** `seq_inventory_transaction`
- **ID:** `Integer id`

### InventoryTransactionType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.InventoryTransactionType`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/InventoryTransactionType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Represents a hierarchical structure for InventoryTransactionType, where each type inherits attributes from its parent.
- **Table:** `inventory_transaction_type`
- **Sequence:** `seq_inventory_transaction_type`
- **ID:** `Integer id`

### InventoryType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.InventoryType`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/InventoryType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Represents a hierarchical structure for inventory types in an inventory management system, where attributes are inherited from parent types to child types.
- **Table:** `inventory_type`
- **Sequence:** `seq_inventory_type`
- **ID:** `Integer id`

### Product

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.Product`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/Product.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Examples of various products in different vertical markets, illustrating the structure and flexibility of the Product class.
- **Table:** `product`
- **Sequence:** `seq_product`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ProductModel model`; `@ManyToMany` → `Set<ProductCategory> categories`; `@ManyToMany` → `List<Media> media`

### ProductCategory

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductCategory`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductCategory.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Examples of categories based on various Category Types, providing a detailed classification system for products across multiple industries.
- **Table:** `product_category`
- **Sequence:** `seq_product_category`
- **ID:** `Integer id`

### ProductCategoryType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductCategoryType`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductCategoryType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Examples of Category Types in a hierarchical product categorization system, where each type provides a distinct dimension for organizing products.
- **Table:** `product_category_type`
- **Sequence:** `seq_product_category_type`
- **ID:** `Integer id`

### ProductModel

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductModel`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductModel.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Examples of ProductModel usage across various vertical markets, demonstrating how different product types with specific attributes can be configured using a hierarchical and flexible structure.
- **Table:** `product_model`
- **Sequence:** `seq_product_model`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ProductType type`; `@OneToMany` → `List<Product> products`

### ProductPrice

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductPrice`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductPrice.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a price configuration for a {@link Product} using one of the concrete types defined in the <code>product_price_type</code> hierarchy.
- **Table:** `product_price`
- **Sequence:** `seq_product_price`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Product product`

### ProductPriceType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductPriceType`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductPriceType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Represents different types of product pricing models in the system.
- **Table:** `product_price_type`
- **Sequence:** `seq_product_price_type`
- **ID:** `Integer id`

### ProductReview

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductReview`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductReview.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `product_review`
- **Sequence:** `seq_product_review`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Product product`

### ProductReviewStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductReviewStateTransition`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductReviewStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `product_review_state_transition`
- **Sequence:** `seq_product_review_state_transition`
- **ID:** `Long id`

### ProductReviewType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductReviewType`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductReviewType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Table:** `product_review_type`
- **Sequence:** `seq_product_review_type`
- **ID:** `Integer id`

### ProductType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.pim.domain.ProductType`
- **Source:** `core-pim/src/main/java/com/pixelnation/pim/domain/ProductType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** The ProductType class represents a hierarchical structure that categorizes products across various vertical markets.
- **Table:** `product_type`
- **Sequence:** `seq_product_type`
- **ID:** `Integer id`

## Module: `core-rm`

### LogEntity

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.LogEntity`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/LogEntity.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `log_entity`
- **Sequence:** `seq_log_entity`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Sensor sensor`

### LogEntry

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.LogEntry`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/LogEntry.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code LogEntry} class represents an individual log message or event collected from a monitored application or service.
- **Table:** `log_entry`
- **Sequence:** `seq_log_entry`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `LogEntity logEntity`

### Resource

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.Resource`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/Resource.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `resource`
- **Sequence:** `seq_resource`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@OneToMany` → `List<Sensor> sensors`; `@ManyToMany` → `List<ResourceTypeAction> actions`; `@ManyToMany` → `List<ResourceTypeReaction> reactions`

### ResourceBackup

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.ResourceBackup`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/ResourceBackup.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code ResourceBackup} class represents a backup snapshot of a resource's configuration or data.
- **Table:** `resource_backup`
- **Sequence:** `seq_resource_backup`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Resource resource`

### ResourceDiag

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.ResourceDiag`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/ResourceDiag.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code ResourceDiag} class represents a diagnostic evaluation snapshot for a resource at a specific point in time.
- **Table:** `resource_diag`
- **ID:** `Integer resourceId`, `LocalDateTime observed`
- **Relationships/Value objects:** `@ManyToOne` → `Resource resource`

### ResourceStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.ResourceStateTransition`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/ResourceStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Description:** The {@code ResourceStateTransition} class represents a recorded state transition for a resource within a workflow.
- **Table:** `resource_state_transition`
- **Sequence:** `seq_resource_state_transition`
- **ID:** `Long id`

### ResourceType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.ResourceType`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/ResourceType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** The {@code ResourceType} class represents a hierarchical structure for defining different types of resources within a system.
- **Table:** `resource_type`
- **Sequence:** `seq_resource_type`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@OneToMany` → `Set<ResourceTypeReaction> reactions`; `@OneToMany` → `List<ResourceTypeAction> actions`; `@OneToMany` → `List<SensorDefinition> sensorDefinitions`

### ResourceTypeAction

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.ResourceTypeAction`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/ResourceTypeAction.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code ResourceTypeAction} class represents actions that can be performed on a specific resource type.
- **Table:** `resource_type_action`
- **Sequence:** `seq_resource_type_action`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ResourceType resourceType`; `@ManyToOne` → `Image enabledIcon`; `@ManyToOne` → `Image disabledIcon`; `@ManyToOne` → `Script script`

### ResourceTypeReaction

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.ResourceTypeReaction`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/ResourceTypeReaction.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code ResourceTypeReaction} class defines automated responses, or "reactions," to specific conditions or changes in attributes associated with a particular resource type.
- **Table:** `resource_type_reaction`
- **Sequence:** `seq_resource_type_reaction`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ResourceType resourceType`; `@ManyToOne` → `Script script`

### Sensor

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.Sensor`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/Sensor.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** The {@code Sensor} class represents an individual data collection point that is attached to a specific resource (e.g., a server or network device) within a system.
- **Table:** `sensor`
- **Sequence:** `seq_sensor`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Resource resource`; `@ManyToOne` → `SensorDefinition definition`; `@ManyToOne` → `User agent`

### SensorData

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.SensorData`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/SensorData.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `sensor_data`
- **Relationships/Value objects:** `@EmbeddedId` → `SensorDataIdentifier id`

### SensorDefinition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.SensorDefinition`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/SensorDefinition.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `sensor_definition`
- **Sequence:** `seq_sensor_definition`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `SensorType sensorType`; `@ManyToOne` → `ResourceType resourceType`

### SensorType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.rm.domain.SensorType`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/SensorType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** The {@code SensorType} entity represents a classification for various types of sensors within an inventory management system, organizing sensor-specific attributes, unit categories, and other customizable properties.
- **Table:** `sensor_type`
- **Sequence:** `seq_sensor_type`
- **ID:** `Integer id`

### providing

- **Kind:** Embeddable
- **FQCN:** `com.pixelnation.rm.domain.providing`
- **Source:** `core-rm/src/main/java/com/pixelnation/rm/domain/SensorDataIdentifier.java`
- **Role (heuristic):** Value object embedded into an owning entity (often composite IDs or grouped fields).

## Module: `core-rpt`

### Report

- **Kind:** Entity
- **FQCN:** `com.pixelnation.report.domain.Report`
- **Source:** `core-rpt/src/main/java/com/pixelnation/report/domain/Report.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Definition of the report
- **Table:** `report`
- **Sequence:** `seq_report`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `ReportType type`; `@OneToMany` → `List<ReportParameter> parameters`; `@ManyToMany` → `List<Role> roles`

### ReportParameter

- **Kind:** Entity
- **FQCN:** `com.pixelnation.report.domain.ReportParameter`
- **Source:** `core-rpt/src/main/java/com/pixelnation/report/domain/ReportParameter.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** This class represents a report parameter entity.
- **Table:** `report_parameter`
- **Sequence:** `seq_report_parameter`
- **ID:** `Integer id`
- **Relationships/Value objects:** `@ManyToOne` → `Report report`

### ReportType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.report.domain.ReportType`
- **Source:** `core-rpt/src/main/java/com/pixelnation/report/domain/ReportType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** This class represents a report type entity that is used to define the type of a report.
- **Table:** `report_type`
- **Sequence:** `seq_report_type`
- **ID:** `Integer id`

## Module: `core-svc`

### Appointment

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.Appointment`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/Appointment.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `appointment`
- **Sequence:** `seq_appointment`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Task task`

### AppointmentStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.AppointmentStateTransition`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/AppointmentStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `appointment_state_transition`
- **Sequence:** `seq_appointment_state_transition`
- **ID:** `Long id`

### AppointmentType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.AppointmentType`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/AppointmentType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Appointment could be of different types.
- **Table:** `appointment_type`
- **Sequence:** `seq_appointment_type`
- **ID:** `Integer id`

### DialogUnit

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.DialogUnit`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/DialogUnit.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Description:** Represents a unit of a conversation, whether part of a Task or chat, containing detailed content, participants, and associated media attachments.
- **Table:** `dialog_unit`
- **Sequence:** `seq_dialog_unit`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Task task`; `@ManyToOne` → `User user`; `@OneToMany` → `List<Media> media`; `@ManyToMany` → `Set<Permission> permissions`

### Project

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.Project`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/Project.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `project`
- **Sequence:** `seq_project`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Image image`; `@OneToMany` → `List<Task> tasks`; `@ManyToMany` → `Set<Permission> permissions`

### ProjectStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.ProjectStateTransition`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/ProjectStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `project_state_transition`
- **Sequence:** `seq_project_state_transition`
- **ID:** `Long id`

### ProjectType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.ProjectType`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/ProjectType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Entity representing a project type in the system.
- **Table:** `project_type`
- **Sequence:** `seq_project_type`
- **ID:** `Integer id`

### Task

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.Task`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/Task.java`
- **Role (heuristic):** Core business entity for this module’s domain.
- **Table:** `task`
- **Sequence:** `seq_task`
- **ID:** `Long id`
- **Relationships/Value objects:** `@ManyToOne` → `Project project`; `@ManyToMany` → `Set<Permission> permissions`

### TaskStateTransition

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.TaskStateTransition`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/TaskStateTransition.java`
- **Role (heuristic):** Audit/history entity capturing workflow/state changes for a parent entity.
- **Table:** `task_state_transition`
- **Sequence:** `seq_task_state_transition`
- **ID:** `Long id`

### TaskType

- **Kind:** Entity
- **FQCN:** `com.pixelnation.svc.domain.TaskType`
- **Source:** `core-svc/src/main/java/com/pixelnation/svc/domain/TaskType.java`
- **Role (heuristic):** Reference/configuration entity defining a type/category for other entities.
- **Description:** Task Type entity.
- **Table:** `task_type`
- **Sequence:** `seq_task_type`
- **ID:** `Integer id`

## Winter Services lens (suggested bounded contexts)

Use this as a first pass for modeling; refine after confirming requirements.

- **Identity & Access:** `User`, `Role`, `Permission`, `Organization` (+ role mappings, secrets, preferences)
- **Customer/Account:** `Account` (+ addresses, metadata, types)
- **Work Management (field service):** `Project`, `Task`, `Appointment` (+ types/state transitions)
- **Catalog & Inventory:** `Product*`, `Inventory*`
- **Billing & Payments:** `Order*`, `Invoice*`, `BalanceTransaction`, `PaymentRequest`, `Refund`
- **Assets & Telemetry:** `Resource*`, `Sensor*`, `SensorData*`
- **Workflow & Rules:** `Workflow*`, `Rule*`, `State` (+ mappings/state transitions)
- **Communication & Content:** `Chat*`, `Notification*`, CMS entities (blog/forms/pages)
