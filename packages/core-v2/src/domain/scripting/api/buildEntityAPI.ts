import type { EntityState } from '../../entities';
import type { SceneState } from '../../scene';
import { buildComponentsAPI } from './buildComponentsAPI';
import { buildScriptsAPI } from './buildScriptsAPI';
import { buildTransformAPI } from './buildTransformAPI';
import type { EntityAPI, ScriptAPIBuildContext } from './types';
import type { EntityId } from '../../ids';

function defaultDestroyEntity(scene: SceneState, entityId: EntityId): boolean {
  return scene.entities.delete(entityId);
}

/**
 * Builds an ECS-first entity API for scripting.
 */
export function buildEntityAPI(
  entity: EntityState,
  scene: SceneState,
  isSelf: boolean,
  context: ScriptAPIBuildContext = {},
): EntityAPI {
  const resolveEntityAPI = (target: EntityState, targetIsSelf: boolean): EntityAPI =>
    buildEntityAPI(target, scene, targetIsSelf, context);

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
        isSelf,
        resolveEntityAPI,
      );
    },

    get components() {
      return buildComponentsAPI(entity);
    },

    get scripts() {
      return buildScriptsAPI(entity);
    },

    isValid() {
      return scene.entities.has(entity.id);
    },

    destroy() {
      if (!isSelf) return;

      const destroyFn = context.destroyEntity ?? ((id: EntityId) => defaultDestroyEntity(scene, id));
      destroyFn(entity.id);
    },
  };
}

/**
 * Resolves and builds an entity API from an entity id. Returns null if not found.
 */
export function buildEntityRefAPI(
  entityId: EntityId,
  scene: SceneState,
  isSelf: boolean,
  context: ScriptAPIBuildContext = {},
): EntityAPI | null {
  const entity = scene.entities.get(entityId);
  if (!entity) {
    return null;
  }

  return buildEntityAPI(
    entity,
    scene,
    isSelf,
    context,
  );
}
