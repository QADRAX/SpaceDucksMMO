import type { EntityState } from '../../entities';
import type { SceneState } from '../../scene';
import type { ScriptPermissions } from '../permissions';
import { canAccessEntity, canDestroySelfEntity } from '../permissions';
import { buildComponentsAPI } from './buildComponentsAPI';
import { buildScriptsAPI } from './buildScriptsAPI';
import { buildTransformAPI } from './buildTransformAPI';
import type { EntityAPI, ScriptAPIBuildContext } from './types';

function defaultDestroyEntity(scene: SceneState, entityId: string): boolean {
  return scene.entities.delete(entityId);
}

/**
 * Builds an ECS-first entity API for scripting with permission checks.
 */
export function buildEntityAPI(
  entity: EntityState,
  scene: SceneState,
  permissions: ScriptPermissions,
  context: ScriptAPIBuildContext = {},
  isSelf = entity.id === permissions.selfEntityId,
): EntityAPI {
  const resolveEntityAPI = (target: EntityState, targetIsSelf: boolean): EntityAPI =>
    buildEntityAPI(target, scene, permissions, context, targetIsSelf);

  return {
    get id() {
      return entity.id;
    },

    get name() {
      return entity.displayName;
    },
    set name(value: string) {
      if (!isSelf) return;
      entity.displayName = value;
    },

    get transform() {
      return buildTransformAPI(
        entity.transform,
        entity,
        scene,
        permissions,
        isSelf,
        resolveEntityAPI,
      );
    },

    get components() {
      return buildComponentsAPI(entity, permissions);
    },

    get scripts() {
      return buildScriptsAPI(entity, permissions);
    },

    isValid() {
      return scene.entities.has(entity.id);
    },

    destroy() {
      if (!isSelf) return;

      if (!canDestroySelfEntity(permissions)) return;

      const destroyFn = context.destroyEntity ?? ((id: string) => defaultDestroyEntity(scene, id));
      destroyFn(entity.id);
    },
  };
}

/**
 * Resolves and builds an entity API from an entity id if permissions allow it.
 */
export function buildEntityRefAPI(
  entityId: string,
  scene: SceneState,
  permissions: ScriptPermissions,
  context: ScriptAPIBuildContext = {},
): EntityAPI | null {
  if (!canAccessEntity(permissions, entityId)) {
    return null;
  }

  const entity = scene.entities.get(entityId);
  if (!entity) {
    return null;
  }

  return buildEntityAPI(
    entity,
    scene,
    permissions,
    context,
    entity.id === permissions.selfEntityId,
  );
}
