export type { ScriptPermissions, PermissionCheckResult } from './types';

export type { CreateScriptPermissionsOptions } from './create';

export { createPermissionsFromSchema } from './create';

export {
  canAccessEntity,
  canAccessScriptType,
  canAccessComponentType,
  canInstantiatePrefab,
  canDestroySelfEntity,
} from './validators';
