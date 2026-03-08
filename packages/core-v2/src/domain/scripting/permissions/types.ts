import type { ComponentType } from '../../components';

/**
 * Script permissions define what entities, scripts, components, and prefabs
 * a script instance can access at runtime.
 * 
 * Permissions are derived from the script's property schema.
 */
export interface ScriptPermissions {
  /**
   * The entity ID that owns this script.
   * Scripts always have full read-write access to their own entity.
   */
  readonly selfEntityId: string;

  /**
   * Entity IDs that this script can access (read-only).
   * Derived from entityRef and entityRefArray properties.
   */
  readonly allowedEntityIds: ReadonlySet<string>;

  /**
   * Script types that this script can access on its own entity.
   * Derived from scriptRef properties.
   */
  readonly allowedScriptTypes: ReadonlySet<string>;

  /**
   * Component types that this script can access on its own entity.
   * Derived from componentRef properties.
   */
  readonly allowedComponentTypes: ReadonlySet<ComponentType>;

  /**
   * Prefab IDs that this script can instantiate.
   * Derived from prefabRef properties.
   */
  readonly allowedPrefabIds: ReadonlySet<string>;

  /**
   * Whether the script can destroy its own entity.
   * Generally true, but can be restricted for critical entities.
   */
  readonly canDestroySelf: boolean;
}

/**
 * Permission check result.
 */
export interface PermissionCheckResult {
  readonly allowed: boolean;
  readonly reason?: string;
}
