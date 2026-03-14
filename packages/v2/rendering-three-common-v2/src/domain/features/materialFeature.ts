import * as THREE from 'three';
import {
  getComponent,
  PLAIN_MATERIAL_COMPONENT_TYPES,
  isPlainMaterialComponentType,
} from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { EntityState, MaterialComponent } from '@duckengine/core-v2';
import type { RenderContextThree } from '../renderContextThree';
import { materialFromComponent } from '../materialFromComponent';
import { findMesh } from '../three';

function getMaterialComponent(entity: EntityState): MaterialComponent | undefined {
  for (const t of PLAIN_MATERIAL_COMPONENT_TYPES) {
    const c = getComponent(entity, t);
    if (c && 'type' in c && c.type === t) return c as MaterialComponent;
  }
  return undefined;
}

/**
 * Feature: sync material component to mesh material. Requires entity to already have a mesh (GeometryFeature).
 */
export function createMaterialFeature(): RenderFeature<RenderContextThree> {
  return {
    name: 'MaterialFeature',

    syncEntity(entity, context) {
      const comp = getMaterialComponent(entity);
      if (!comp) return;
      const root = context.registry.get(entity.id);
      const mesh = findMesh(root);
      if (mesh) {
        const prev = mesh.material as THREE.Material;
        if (prev) prev.dispose();
        mesh.material = materialFromComponent(comp);
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
        mesh.material = materialFromComponent(comp);
      }
    },
  };
}
