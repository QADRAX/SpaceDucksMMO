import type { ComponentType } from '../../components';
import type { PermissionCheckResult, ScriptPermissions } from './types';

/** Returns whether script can access a target entity. */
export function canAccessEntity(permissions: ScriptPermissions, entityId: string): boolean {
  return entityId === permissions.selfEntityId || permissions.allowedEntityIds.has(entityId);
}

/** Returns whether script can access a sibling script type. */
export function canAccessScriptType(permissions: ScriptPermissions, scriptType: string): boolean {
  return permissions.allowedScriptTypes.has(scriptType);
}

/** Returns whether script can access a component type. */
export function canAccessComponentType(
  permissions: ScriptPermissions,
  componentType: ComponentType,
): boolean {
  return permissions.allowedComponentTypes.has(componentType);
}

/** Returns whether script can instantiate a prefab id. */
export function canInstantiatePrefab(permissions: ScriptPermissions, prefabId: string): boolean {
  return permissions.allowedPrefabIds.has(prefabId);
}

/** Returns whether script can destroy its own entity. */
export function canDestroySelfEntity(permissions: ScriptPermissions): boolean {
  return permissions.canDestroySelf;
}

/** Permission check result with reason for entity access. */
export function ensureCanAccessEntity(
  permissions: ScriptPermissions,
  entityId: string,
): PermissionCheckResult {
  if (canAccessEntity(permissions, entityId)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Script cannot access entity '${entityId}'. Declare it as entityRef/entityRefArray in schema.`,
  };
}

/** Permission check result with reason for sibling script access. */
export function ensureCanAccessScriptType(
  permissions: ScriptPermissions,
  scriptType: string,
): PermissionCheckResult {
  if (canAccessScriptType(permissions, scriptType)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Script cannot access sibling script type '${scriptType}'. Declare it as scriptRef in schema.`,
  };
}

/** Permission check result with reason for component access. */
export function ensureCanAccessComponentType(
  permissions: ScriptPermissions,
  componentType: ComponentType,
): PermissionCheckResult {
  if (canAccessComponentType(permissions, componentType)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Script cannot access component '${componentType}'. Declare it via componentRef in schema.`,
  };
}

/** Permission check result with reason for prefab instantiation. */
export function ensureCanInstantiatePrefab(
  permissions: ScriptPermissions,
  prefabId: string,
): PermissionCheckResult {
  if (canInstantiatePrefab(permissions, prefabId)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Script cannot instantiate prefab '${prefabId}'. Declare it as prefabRef in schema.`,
  };
}

/** Permission check result with reason for self-destroy operation. */
export function ensureCanDestroySelfEntity(permissions: ScriptPermissions): PermissionCheckResult {
  if (canDestroySelfEntity(permissions)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Script is not allowed to destroy its own entity.',
  };
}
