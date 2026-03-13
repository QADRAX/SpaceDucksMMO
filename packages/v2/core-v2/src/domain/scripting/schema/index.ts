// Property type definitions
export type {
  NumberProperty,
  BooleanProperty,
  StringProperty,
  Vec3Property,
  Vec2Property,
  EntityRefProperty,
  EntityRefArrayProperty,
  ScriptRefProperty,
  ComponentRefProperty,
  PrefabRefProperty,
  ColorProperty,
  EnumProperty,
  PropertySchema,
} from './propertyTypes';

export {
  isEntityRefProperty,
  isEntityRefArrayProperty,
  isScriptRefProperty,
  isComponentRefProperty,
  isPrefabRefProperty,
} from './propertyTypes';

// Schema types
export type {
  ScriptSchema,
  PropertyValue,
  PropertyValues,
  ScriptInstance,
  ScriptRegistryEntry,
} from './types';

// Validation
export {
  validatePropertyValue,
  validatePropertyValues,
  validateScriptSchema,
  isPropertyValue,
  getDefaultPropertyValue,
  createDefaultPropertyValues,
} from './validation';
