import type { ScriptPermissions } from '../permissions';
import type { SceneState } from '../../scene';
import type { EntityAPI, SceneAPI, SceneAPIBuildContext, SceneRaycastHit } from './types';
import { buildEntityRefAPI } from './buildEntityAPI';

function toNullEntityRef(
  scene: SceneState,
  entityId: string,
  permissions: ScriptPermissions,
): EntityAPI | null {
  if (!permissions.allowedEntityIds.has(entityId)) {
    return null;
  }

  if (!scene.entities.has(entityId)) {
    return null;
  }

  return buildEntityRefAPI(entityId, scene, permissions, {});
}

function createEmptyHit(): SceneRaycastHit {
  return {
    hit: false,
    entity: null,
    point: { x: 0, y: 0, z: 0 },
    distance: 0,
  };
}

/**
 * Builds a scene-level scripting API from permissions and host callbacks.
 */
export function buildSceneAPI(
  scene: SceneState,
  permissions: ScriptPermissions,
  apiContext: SceneAPIBuildContext,
): SceneAPI {
  return {
    instantiate(prefabId, position, rotation) {
      if (!permissions.allowedPrefabIds.has(prefabId)) {
        return null;
      }

      const entityId = apiContext.instantiatePrefab?.(scene, prefabId, position, rotation);
      if (!entityId) {
        return null;
      }

      return toNullEntityRef(scene, entityId, permissions);
    },

    findByTag(tag) {
      const ids = apiContext.findEntityIdsByTag?.(scene, tag) ?? [];
      return ids
        .map((entityId) => toNullEntityRef(scene, entityId, permissions))
        .filter((entity): entity is EntityAPI => entity !== null);
    },

    raycast(query) {
      const hit = apiContext.raycast?.(query);
      if (!hit) {
        return null;
      }

      const entity = toNullEntityRef(scene, hit.entityId, permissions);
      if (!entity) {
        return createEmptyHit();
      }

      return {
        hit: true,
        entity,
        point: hit.point,
        distance: hit.distance,
      };
    },

    emit(eventName, payload) {
      apiContext.emitEvent?.(eventName, payload);
    },
  };
}
