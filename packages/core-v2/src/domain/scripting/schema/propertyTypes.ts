import type { ComponentType } from '../../components';
import type {
  DefaultValueAttribute,
  DescribedAttribute,
  EnumValueConstraint,
  NumericConstraintAttributes,
  RequiredAttribute,
  ScriptingPrimitiveKind,
} from '../../properties';

type PrimitiveTypeName<T extends ScriptingPrimitiveKind> = Extract<ScriptingPrimitiveKind, T>;

interface PrimitivePropertyBase<TType extends ScriptingPrimitiveKind> {
  readonly type: PrimitiveTypeName<TType>;
}

interface ScriptPropertyBase extends DescribedAttribute, RequiredAttribute {}

interface ScriptPropertyWithDefault<T> extends ScriptPropertyBase, DefaultValueAttribute<T> {}

/**
 * Number property configuration.
 */
export interface NumberProperty
  extends
    PrimitivePropertyBase<'number'>,
    ScriptPropertyWithDefault<number>,
    NumericConstraintAttributes {}

/**
 * Boolean property configuration.
 */
export interface BooleanProperty
  extends PrimitivePropertyBase<'boolean'>, ScriptPropertyWithDefault<boolean> {}

/**
 * String property configuration.
 */
export interface StringProperty
  extends PrimitivePropertyBase<'string'>, ScriptPropertyWithDefault<string> {}

/**
 * Vec3 property configuration (3D vector).
 */
export interface Vec3Property
  extends
    PrimitivePropertyBase<'vec3'>,
    ScriptPropertyWithDefault<readonly [number, number, number]> {}

/**
 * Vec2 property configuration (2D vector).
 */
export interface Vec2Property
  extends PrimitivePropertyBase<'vec2'>, ScriptPropertyWithDefault<readonly [number, number]> {}

/**
 * Entity reference property (single entity).
 * Allows script to access a referenced entity.
 */
export interface EntityRefProperty extends ScriptPropertyWithDefault<string | null> {
  readonly type: 'entityRef';
}

/**
 * Entity reference array property (multiple entities).
 * Allows script to access an array of referenced entities.
 */
export interface EntityRefArrayProperty extends ScriptPropertyWithDefault<readonly string[]> {
  readonly type: 'entityRefArray';
}

/**
 * Script reference property (sibling script on same entity).
 * Allows script to communicate with another script on the same entity.
 */
export interface ScriptRefProperty extends ScriptPropertyBase {
  readonly type: 'scriptRef';
  readonly scriptType: string;
}

/**
 * Component reference property (required components on self entity).
 * Validates that the entity has specific components and grants access.
 */
export interface ComponentRefProperty extends ScriptPropertyBase {
  readonly type: 'componentRef';
  readonly componentTypes: readonly ComponentType[];
}

/**
 * Prefab reference property (prefab that can be instantiated).
 * Allows script to instantiate a specific prefab.
 */
export interface PrefabRefProperty extends ScriptPropertyWithDefault<string | null> {
  readonly type: 'prefabRef';
}

/**
 * Color property configuration (RGBA).
 */
export interface ColorProperty
  extends
    PrimitivePropertyBase<'color'>,
    ScriptPropertyWithDefault<readonly [number, number, number, number]> {
  readonly type: PrimitiveTypeName<'color'>;
}

/**
 * Enum property configuration (dropdown selection).
 */
export interface EnumProperty
  extends
    PrimitivePropertyBase<'enum'>,
    ScriptPropertyWithDefault<string>,
    EnumValueConstraint<string> {
  readonly type: PrimitiveTypeName<'enum'>;
}

/**
 * Union of all possible property schemas.
 */
export type PropertySchema =
  | NumberProperty
  | BooleanProperty
  | StringProperty
  | Vec3Property
  | Vec2Property
  | EntityRefProperty
  | EntityRefArrayProperty
  | ScriptRefProperty
  | ComponentRefProperty
  | PrefabRefProperty
  | ColorProperty
  | EnumProperty;

/**
 * Type guard to check if a property schema is an entity reference.
 */
export function isEntityRefProperty(schema: PropertySchema): schema is EntityRefProperty {
  return schema.type === 'entityRef';
}

/**
 * Type guard to check if a property schema is an entity reference array.
 */
export function isEntityRefArrayProperty(schema: PropertySchema): schema is EntityRefArrayProperty {
  return schema.type === 'entityRefArray';
}

/**
 * Type guard to check if a property schema is a script reference.
 */
export function isScriptRefProperty(schema: PropertySchema): schema is ScriptRefProperty {
  return schema.type === 'scriptRef';
}

/**
 * Type guard to check if a property schema is a component reference.
 */
export function isComponentRefProperty(schema: PropertySchema): schema is ComponentRefProperty {
  return schema.type === 'componentRef';
}

/**
 * Type guard to check if a property schema is a prefab reference.
 */
export function isPrefabRefProperty(schema: PropertySchema): schema is PrefabRefProperty {
  return schema.type === 'prefabRef';
}
