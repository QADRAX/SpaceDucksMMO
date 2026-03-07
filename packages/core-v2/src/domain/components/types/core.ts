/**
 * Discriminator tag for all engine components.
 * Each component carries exactly one of these string literals as its `type` field.
 */
export type ComponentType =
    | 'name'
    | 'boxGeometry'
    | 'sphereGeometry'
    | 'planeGeometry'
    | 'cylinderGeometry'
    | 'coneGeometry'
    | 'torusGeometry'
    | 'customGeometry'
    | 'fullMesh'
    | 'standardMaterial'
    | 'basicMaterial'
    | 'phongMaterial'
    | 'lambertMaterial'
    | 'basicShaderMaterial'
    | 'standardShaderMaterial'
    | 'physicalShaderMaterial'
    | 'cameraView'
    | 'textureTiling'
    | 'ambientLight'
    | 'directionalLight'
    | 'pointLight'
    | 'spotLight'
    | 'skybox'
    | 'rigidBody'
    | 'gravity'
    | 'sphereCollider'
    | 'boxCollider'
    | 'capsuleCollider'
    | 'cylinderCollider'
    | 'coneCollider'
    | 'terrainCollider'
    | 'lensFlare'
    | 'postProcess'
    | 'script'
    | 'metadata';

/** Dependency token used by metadata validation rules. */
export type ComponentDependency = ComponentType | 'geometry';

/** UI field type for inspector rendering. */
export type InspectorFieldType =
    | 'number'
    | 'boolean'
    | 'string'
    | 'color'
    | 'texture'
    | 'enum'
    | 'vector'
    | 'object'
    | 'reference'
    | 'uniforms';

/** Configuration for a single inspector field bound to a component property. */
export interface InspectorFieldConfig<TComponent = unknown, TValue = unknown> {
    /** Property key on the component this field maps to. */
    key: string;
    /** Display label in the inspector UI. */
    label?: string;
    /** Getter for the field value from the component. */
    get?: (component: TComponent) => TValue;
    /** Setter that applies a new value to the component. */
    set?: (component: TComponent, value: TValue) => void;
    /** UI widget type to render for this field. */
    type?: InspectorFieldType;
    /** Tooltip description. */
    description?: string;
    /** Whether the field accepts null/undefined values. */
    nullable?: boolean;
    /** Default value when creating the component. */
    default?: unknown;
    /** Minimum numeric value. */
    min?: number;
    /** Maximum numeric value. */
    max?: number;
    /** Numeric step increment. */
    step?: number;
    /** Display unit suffix (e.g. "m", "°", "px"). */
    unit?: string;
    /** Enum options for dropdown selectors. */
    options?: ReadonlyArray<{ value: string | number; label: string; icon?: unknown }>;
}

/** Inspector metadata describing all editable fields of a component. */
export interface InspectorMetadata<TComponent = unknown> {
    /** Ordered list of fields exposed in the inspector. */
    fields: ReadonlyArray<InspectorFieldConfig<TComponent, unknown>>;
}

/** Static metadata attached to every component definition. */
export interface ComponentMetadata<TComponent = unknown> {
    /** The component type discriminator this metadata belongs to. */
    type: ComponentType;
    /** Human-readable label for UI display. */
    label?: string;
    /** When true, only one instance of this component per entity. */
    unique?: boolean;
    /** When true, at most one instance of this component type across the entire scene. */
    uniqueInScene?: boolean;
    /** Component types that must exist on the same entity. */
    requires?: ReadonlyArray<ComponentDependency>;
    /** Component types that must exist on this entity or any ancestor. */
    requiresInHierarchy?: ReadonlyArray<ComponentDependency>;
    /** Component types that cannot coexist on the same entity. */
    conflicts?: ReadonlyArray<ComponentDependency>;
    /** Inspector field definitions for editor UI. */
    inspector?: InspectorMetadata<TComponent>;
    /** Tooltip description of the component purpose. */
    description?: string;
    /** Category for grouping in the UI (e.g. "Rendering", "Physics"). */
    category?: string;
    /** Icon name for visual representation (e.g. Lucide icon key). */
    icon?: string;
}

/**
 * Static definition for a component type.
 * Links editor metadata with the default field values.
 * Used by the generic factory to stamp new component instances.
 */
export type ComponentSpec<TComponent = unknown> = {
    readonly metadata: ComponentMetadata<TComponent>;
    readonly defaults: Omit<TComponent, 'type' | 'metadata' | 'enabled'>;
};

/**
 * Base shape shared by all ECS components.
 * Components are plain data objects — no methods, no observers.
 * All mutation and notification is handled by the entity layer.
 */
export interface ComponentBase<TType extends ComponentType = ComponentType> {
    readonly type: TType;
    readonly metadata: ComponentMetadata;
    enabled: boolean;
}

/** Fired when a component is added to or removed from an entity. */
export interface ComponentEvent {
    readonly entityId: string;
    readonly component: ComponentBase;
    readonly action: 'added' | 'removed';
}

/** Listener for structural component changes (add/remove). */
export type ComponentListener = (event: ComponentEvent) => void;

/** Listener for component field-level changes. */
export type ComponentChangeListener = (entityId: string, type: ComponentType) => void;
