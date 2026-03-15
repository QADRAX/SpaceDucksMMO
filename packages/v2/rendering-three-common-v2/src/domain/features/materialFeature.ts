import * as THREE from 'three';
import { isPlainMaterialComponentType } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { materialFromComponent } from '../materialFromComponent';
import { findMesh, getMaterialComponent, materialKey } from '../three';

/**
 * Feature: sync material component to mesh material. Requires entity to already have a mesh (GeometryFeature).
 */
export function createMaterialFeature(): RenderFeature<RenderContextThree> {
  const lastMaterialKeyByEntity = new Map<string, string>();

  return {
    name: 'MaterialFeature',

    syncEntity(entity, context) {
      const comp = getMaterialComponent(entity);
      if (!comp) {
        lastMaterialKeyByEntity.delete(entity.id);
        return;
      }
      const key = materialKey(comp, context.getTexture);
      const lastKey = lastMaterialKeyByEntity.get(entity.id);
      if (key === lastKey) return;
      const root = context.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh) {
        const prev = mesh.material as THREE.Material;
        if (prev) prev.dispose();
        mesh.material = materialFromComponent(comp, context.getTexture);
        lastMaterialKeyByEntity.set(entity.id, key);
        context.diagnostic?.log('debug', 'Material synced', {
          subsystem: 'rendering-three',
          entityId: entity.id,
          materialRef: comp.material?.key ?? comp.albedo?.key ?? comp.type,
        });
      }
    },

    onUpdate(entity, componentType, context) {
      if (!isPlainMaterialComponentType(componentType)) return;
      const comp = getMaterialComponent(entity);
      if (!comp) return;
      const root = context.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh) {
        const prev = mesh.material as THREE.Material;
        if (prev) prev.dispose();
        mesh.material = materialFromComponent(comp, context.getTexture);
        lastMaterialKeyByEntity.set(entity.id, materialKey(comp, context.getTexture));
        context.diagnostic?.log('debug', 'Material synced', {
          subsystem: 'rendering-three',
          entityId: entity.id,
          materialRef: comp.material?.key ?? comp.albedo?.key ?? comp.type,
        });
      }
    },
  };
}
