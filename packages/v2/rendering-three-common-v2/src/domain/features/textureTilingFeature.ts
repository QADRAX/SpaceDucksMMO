import * as THREE from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { TextureTilingComponent } from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';
import { findMesh, applyTilingToMaterial, tilingKey } from '../three';

/**
 * Feature: sync textureTiling component to mesh material UV repeat/offset.
 * Does not register an object; updates the mesh (from GeometryFeature) material textures.
 */
export function createTextureTilingFeature(): RenderFeature<RenderContextThree> {
  const lastTilingKeyByEntity = new Map<string, string>();

  return {
    name: 'TextureTilingFeature',

    syncEntity(entity, context) {
      const comp = getComponent<TextureTilingComponent>(entity, 'textureTiling');
      if (!comp) {
        lastTilingKeyByEntity.delete(entity.id);
        return;
      }
      const key = tilingKey(comp);
      if (lastTilingKeyByEntity.get(entity.id) === key) return;
      const root = context.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh?.material) {
        applyTilingToMaterial(
          mesh.material as THREE.Material,
          comp.repeatU,
          comp.repeatV,
          comp.offsetU,
          comp.offsetV,
        );
        lastTilingKeyByEntity.set(entity.id, key);
      }
    },

    onUpdate(entity, componentType, context) {
      if (componentType !== 'textureTiling') return;
      const comp = getComponent<TextureTilingComponent>(entity, 'textureTiling');
      if (!comp) return;
      const root = context.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh?.material) {
        applyTilingToMaterial(
          mesh.material as THREE.Material,
          comp.repeatU,
          comp.repeatV,
          comp.offsetU,
          comp.offsetV,
        );
        lastTilingKeyByEntity.set(entity.id, tilingKey(comp));
      }
    },
  };
}
