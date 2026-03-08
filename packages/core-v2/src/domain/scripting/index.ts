// Public schema contracts
export type {
  ScriptSchema,
  PropertySchema,
  PropertyValue,
  PropertyValues,
  ScriptInstance,
  ScriptRegistryEntry,
} from './schema';

// Public schema helpers
export {
  validateScriptSchema,
  validatePropertyValues,
  createDefaultPropertyValues,
} from './schema';

// Public permission contracts
export type {
  ScriptPermissions,
  PermissionCheckResult,
  CreateScriptPermissionsOptions,
} from './permissions';

// Public permission helpers
export {
  createPermissionsFromSchema,
  canAccessEntity,
  canAccessScriptType,
  canAccessComponentType,
  canInstantiatePrefab,
  canDestroySelfEntity,
} from './permissions';

// Public ECS-first API builders
export type {
  EntityAPI,
  TransformAPI,
  ComponentsAPI,
  ScriptAPI,
  ScriptsAPI,
  Vec3API,
  Vec2API,
  SceneRaycastQuery,
  SceneRaycastHit,
  SceneAPI,
  InputAPI,
  TimeAPI,
  ScriptAPIBuildContext,
  SceneAPIBuildContext,
  InputAPIBuildContext,
  TimeAPIBuildContext,
} from './api/index';

export {
  buildEntityAPI,
  buildEntityRefAPI,
  buildSceneAPI,
  buildInputAPI,
  buildTimeAPI,
  buildTransformAPI,
  buildComponentsAPI,
  buildScriptsAPI,
} from './api/index';

// Public runtime context contracts/builders
export type {
  ScriptRuntimeContext,
  ScriptRuntimeBuildContext,
  CreateScriptRuntimeContextParams,
  CreateScriptRuntimeContextFromInstanceParams,
} from './runtime/index';

export {
  createScriptRuntimeContext,
  createScriptRuntimeContextFromScriptInstance,
  createScriptRuntimeContextFromInstance,
} from './runtime/index';
