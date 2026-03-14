import * as THREE from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';
import { parseColor } from '../parseColor';
import { lightFromParams, type LightParams } from '../lightFromParams';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';

const LIGHT_TYPES = ['ambientLight', 'directionalLight', 'pointLight', 'spotLight'] as const;

function getLightParamsFromEntity(entity: EntityState): LightParams | null {
  const ambient = getComponent(entity, 'ambientLight') as { color: string; intensity: number } | undefined;
  if (ambient) return { type: 'ambientLight', color: parseColor(ambient.color), intensity: ambient.intensity };

  const dir = getComponent(entity, 'directionalLight') as { color: string; intensity: number; castShadow: boolean } | undefined;
  if (dir) return { type: 'directionalLight', color: parseColor(dir.color), intensity: dir.intensity, castShadow: dir.castShadow ?? false };

  const point = getComponent(entity, 'pointLight') as { color: string; intensity: number; distance: number; decay: number; castShadow: boolean } | undefined;
  if (point) return { type: 'pointLight', color: parseColor(point.color), intensity: point.intensity, distance: point.distance ?? 0, decay: point.decay ?? 2, castShadow: point.castShadow ?? false };

  const spot = getComponent(entity, 'spotLight') as { color: string; intensity: number; distance: number; angle: number; penumbra: number; castShadow: boolean } | undefined;
  if (spot) return { type: 'spotLight', color: parseColor(spot.color), intensity: spot.intensity, distance: spot.distance ?? 0, angle: spot.angle ?? Math.PI / 3, penumbra: spot.penumbra ?? 0, castShadow: spot.castShadow ?? false };

  return null;
}

/**
 * Feature: sync light components to Three.js lights.
 */
export function createLightFeature(): RenderFeature<RenderContextThree> {
  const lightsByEntity = new Map<string, THREE.Light>();

  return {
    name: 'LightFeature',

    syncEntity(entity, context) {
      const params = getLightParamsFromEntity(entity);
      const had = lightsByEntity.has(entity.id);

      if (params && !had) {
        const light = lightFromParams(params);
        syncTransformToObject3D(entity, light);
        context.registry.add(entity.id, light, context.threeScene);
        lightsByEntity.set(entity.id, light);
      } else if (params && had) {
        const prev = lightsByEntity.get(entity.id)!;
        removeFromRegistryAndDispose(context.registry, context.threeScene, entity.id, prev, (l) => l.dispose?.());
        const light = lightFromParams(params);
        syncTransformToObject3D(entity, light);
        context.registry.add(entity.id, light, context.threeScene);
        lightsByEntity.set(entity.id, light);
      } else if (!params && had) {
        const light = lightsByEntity.get(entity.id);
        removeFromRegistryAndDispose(context.registry, context.threeScene, entity.id, light, (l) => l.dispose?.());
        lightsByEntity.delete(entity.id);
      }
    },

    onUpdate(entity, componentType, context) {
      if (!LIGHT_TYPES.includes(componentType as (typeof LIGHT_TYPES)[number])) return;
      const prev = lightsByEntity.get(entity.id);
      const params = getLightParamsFromEntity(entity);
      if (!params) return;
      if (prev) {
        removeFromRegistryAndDispose(context.registry, context.threeScene, entity.id, prev, (l) => l.dispose?.());
      }
      const light = lightFromParams(params);
      syncTransformToObject3D(entity, light);
      context.registry.add(entity.id, light, context.threeScene);
      lightsByEntity.set(entity.id, light);
    },

    onDetachById(entityId, context) {
      const light = lightsByEntity.get(entityId);
      removeFromRegistryAndDispose(context.registry, context.threeScene, entityId, light, (l) => l.dispose?.());
      lightsByEntity.delete(entityId);
    },
  };
}
