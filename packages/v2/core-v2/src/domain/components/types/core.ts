import type { EntityId } from '../../ids';
import type {
    ComponentPrimitiveKind,
    DefaultValueAttribute,
    DescribedAttribute,
    EnumOption,
    NullableAttribute,
    NumericConstraintAttributes,
} from '../../properties';

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

/** Primitive field kinds reused from shared property typing. */
export type InspectorPrimitiveFieldType = Extract<
    ComponentPrimitiveKind,
    ComponentPrimitiveKind
>;

/** UI field type for inspector rendering. */
export type InspectorFieldType =
    | InspectorPrimitiveFieldType
    | 'texture'
    | 'mesh'
    | 'skybox'
    | 'script'
    | 'shader'
    | 'resource'
    | 'vector'
    | 'reference'
    | 'uniforms';

/** Shared configuration for inspector fields. */
interface InspectorFieldConfigBase<TComponent = unknown, TValue = unknown>
    extends DescribedAttribute,
    NullableAttribute,
    DefaultValueAttribute<unknown>,
    NumericConstraintAttributes {
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
    /** Display unit suffix (e.g. "m", "°", "px"). */
    unit?: string;
}

/** Enum inspector field requires options. */
export type InspectorEnumFieldConfig<TComponent = unknown, TValue = unknown> =
    InspectorFieldConfigBase<TComponent, TValue> & {
        type: 'enum';
        options: ReadonlyArray<EnumOption<string | number>>;
    };

/** Non-enum inspector field does not allow enum options. */
export type InspectorNonEnumFieldConfig<TComponent = unknown, TValue = unknown> =
    InspectorFieldConfigBase<TComponent, TValue> & {
        type?: Exclude<InspectorFieldType, 'enum'>;
        options?: never;
    };

/** Configuration for a single inspector field bound to a component property. */
export type InspectorFieldConfig<TComponent = unknown, TValue = unknown> =
    | InspectorEnumFieldConfig<TComponent, TValue>
    | InspectorNonEnumFieldConfig<TComponent, TValue>;

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
 *
 * @template TType - The component type discriminator literal.
 * @template TSelf - The concrete component type (self-referential).
 *                   When provided, `metadata` carries the full type
 *                   so inspector field `get`/`set` accessors are typed.
 */
export interface ComponentBase<
    TType extends ComponentType = ComponentType,
    TSelf = any,
> {
    readonly type: TType;
    readonly metadata: ComponentMetadata<TSelf>;
    enabled: boolean;
}

/** Fired when a component is added to or removed from an entity. */
export interface ComponentEvent {
    readonly entityId: EntityId;
    readonly component: ComponentBase;
    readonly action: 'added' | 'removed';
}

/** Listener for structural component changes (add/remove). */
export type ComponentListener = (event: ComponentEvent) => void;

/** Listener for component field-level changes. */
export type ComponentChangeListener = (entityId: EntityId, type: ComponentType) => void;
