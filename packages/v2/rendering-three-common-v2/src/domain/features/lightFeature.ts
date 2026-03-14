import * as THREE from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';
import { parseColor } from '../parseColor';
import { syncTransformToObject3D } from '../syncTransformToObject3D';

function createLight(entity: EntityState): THREE.Light | null {
  const ambient = getComponent(entity, 'ambientLight') as { color: string; intensity: number } | undefined;
  if (ambient) {
    const light = new THREE.AmbientLight(parseColor(ambient.color), ambient.intensity);
    return light;
  }

  const dir = getComponent(entity, 'directionalLight') as { color: string; intensity: number; castShadow: boolean } | undefined;
  if (dir) {
    const light = new THREE.DirectionalLight(parseColor(dir.color), dir.intensity);
    light.castShadow = dir.castShadow ?? false;
    return light;
  }

  const point = getComponent(entity, 'pointLight') as { color: string; intensity: number; distance: number; decay: number; castShadow: boolean } | undefined;
  if (point) {
    const light = new THREE.PointLight(parseColor(point.color), point.intensity, point.distance ?? 0, point.decay ?? 2);
    light.castShadow = point.castShadow ?? false;
    return light;
  }

  const spot = getComponent(entity, 'spotLight') as { color: string; intensity: number; distance: number; angle: number; penumbra: number; castShadow: boolean } | undefined;
  if (spot) {
    const light = new THREE.SpotLight(
      parseColor(spot.color),
      spot.intensity,
      spot.distance ?? 0,
      spot.angle ?? Math.PI / 3,
      spot.penumbra ?? 0,
    );
    light.castShadow = spot.castShadow ?? false;
    return light;
  }

  return null;
}

const LIGHT_TYPES = ['ambientLight', 'directionalLight', 'pointLight', 'spotLight'] as const;

/**
 * Feature: sync light components to Three.js lights.
 */
export function createLightFeature(): RenderFeature {
  const lightsByEntity = new Map<string, THREE.Light>();

  return {
    name: 'LightFeature',

    isEligible(entity, _scene) {
      return (
        getComponent(entity, 'ambientLight') !== undefined ||
        getComponent(entity, 'directionalLight') !== undefined ||
        getComponent(entity, 'pointLight') !== undefined ||
        getComponent(entity, 'spotLight') !== undefined
      );
    },

    onAttach(entity, context) {
      const ctx = context as RenderContextThree;
      const light = createLight(entity);
      if (!light) return;
      syncTransformToObject3D(entity, light);
      ctx.registry.add(entity.id, light, ctx.threeScene);
      lightsByEntity.set(entity.id, light);
    },

    onUpdate(entity, componentType, context) {
      if (!LIGHT_TYPES.includes(componentType as (typeof LIGHT_TYPES)[number])) return;
      const ctx = context as RenderContextThree;
      const prev = lightsByEntity.get(entity.id);
      const light = createLight(entity);
      if (!light) return;
      if (prev) {
        ctx.registry.remove(entity.id, prev, ctx.threeScene);
        prev.dispose?.();
      }
      syncTransformToObject3D(entity, light);
      ctx.registry.add(entity.id, light, ctx.threeScene);
      lightsByEntity.set(entity.id, light);
    },

    onDetach(entity, ctx) {
      detachById(entity.id, ctx as RenderContextThree, lightsByEntity);
    },

    onDetachById(entityId, ctx) {
      detachById(entityId, ctx as RenderContextThree, lightsByEntity);
    },

    onTransformChanged(entity, _context) {
      const light = lightsByEntity.get(entity.id);
      if (light) syncTransformToObject3D(entity, light);
    },
  };
}

function detachById(
  entityId: string,
  ctx: RenderContextThree,
  lightsByEntity: Map<string, THREE.Light>,
): void {
  const light = lightsByEntity.get(entityId);
  if (light) {
    ctx.registry.remove(entityId, light, ctx.threeScene);
    light.dispose?.();
    lightsByEntity.delete(entityId);
  }
}
