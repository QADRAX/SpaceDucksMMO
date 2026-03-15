import type { Light } from 'three';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { lightFromParams } from '../lightFromParams';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';
import { getLightParamsFromEntity, lightParamsKey } from '../three';

const LIGHT_TYPES = ['ambientLight', 'directionalLight', 'pointLight', 'spotLight'] as const;

/**
 * Feature: sync light components to Three.js lights.
 */
export function createLightFeature(): RenderFeature<RenderContextThree> {
  const lightsByEntity = new Map<string, Light>();
  const lastLightKeyByEntity = new Map<string, string>();

  return {
    name: 'LightFeature',

    syncEntity(entity, context) {
      const params = getLightParamsFromEntity(entity);
      const had = lightsByEntity.has(entity.id);

      if (params && !had) {
        const light = lightFromParams(params, context.three);
        syncTransformToObject3D(entity, light);
        context.registry.add(entity.id, light, context.threeScene);
        lightsByEntity.set(entity.id, light);
        lastLightKeyByEntity.set(entity.id, lightParamsKey(params));
      } else if (params && had) {
        const key = lightParamsKey(params);
        const lastKey = lastLightKeyByEntity.get(entity.id);
        const light = lightsByEntity.get(entity.id)!;
        if (key === lastKey) {
          syncTransformToObject3D(entity, light);
        } else {
          removeFromRegistryAndDispose(context.registry, context.threeScene, entity.id, light, (l) => l.dispose?.());
          const newLight = lightFromParams(params, context.three);
          syncTransformToObject3D(entity, newLight);
          context.registry.add(entity.id, newLight, context.threeScene);
          lightsByEntity.set(entity.id, newLight);
          lastLightKeyByEntity.set(entity.id, key);
        }
      } else if (!params && had) {
        lastLightKeyByEntity.delete(entity.id);
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
      const light = lightFromParams(params, context.three);
      syncTransformToObject3D(entity, light);
      context.registry.add(entity.id, light, context.threeScene);
      lightsByEntity.set(entity.id, light);
    },

    onDetachById(entityId, context) {
      lastLightKeyByEntity.delete(entityId);
      const light = lightsByEntity.get(entityId);
      removeFromRegistryAndDispose(context.registry, context.threeScene, entityId, light, (l) => l.dispose?.());
      lightsByEntity.delete(entityId);
    },
  };
}
