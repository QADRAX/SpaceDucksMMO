import type { SceneState } from '../../scene';
import type { EntityAPI, SceneAPI, SceneAPIBuildContext, SceneRaycastHit } from './types';
import { buildEntityAPI } from './buildEntityAPI';
import type { EntityId } from '../../ids';

function toEntityRef(
  scene: SceneState,
  entityId: EntityId,
): EntityAPI | null {
  const entity = scene.entities.get(entityId);
  if (!entity) {
    return null;
  }

  return buildEntityAPI(entity, scene, false, {});
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
 * Builds a scene-level scripting API from host callbacks.
 */
export function buildSceneAPI(
  scene: SceneState,
  apiContext: SceneAPIBuildContext,
): SceneAPI {
  return {
    instantiate(prefabId, position, rotation) {
      const entityId = apiContext.instantiatePrefab?.(scene, prefabId, position, rotation);
      if (!entityId) {
        return null;
      }

      return toEntityRef(scene, entityId);
    },

    findByTag(tag) {
      const ids = apiContext.findEntityIdsByTag?.(scene, tag) ?? [];
      return ids
        .map((entityId) => toEntityRef(scene, entityId))
        .filter((entity): entity is EntityAPI => entity !== null);
    },

    raycast(query) {
      const hit = apiContext.raycast?.(query);
      if (!hit) {
        return null;
      }

      const entity = toEntityRef(scene, hit.entityId);
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
