import type { Material } from 'three';
import { getTransform3d, isPlainMaterialComponentType } from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { materialFromComponent } from '../materialFromComponent';
import {
  applySkinningMaterialIfSkinnedMesh,
  findMesh,
  getMaterialComponent,
  materialKey,
  hasUnresolvedTextures,
} from '../three';
import type { MaterialComponent } from '@duckengine/core-v2';

/**
 * Feature: sync material component to mesh material. Requires entity to already have a mesh (GeometryFeature).
 */
export function createMaterialFeature(): RenderFeature<RenderContextThree> {
  const lastMaterialKeyByEntity = new Map<string, string>();

  function applyVisibility(
    mesh: { visible: boolean },
    entity: EntityState,
    comp: MaterialComponent | null,
    context: RenderContextThree,
  ): void {
    if (!getTransform3d(entity)) {
      mesh.visible = false;
      return;
    }
    if (!comp) {
      mesh.visible = true;
      return;
    }
    mesh.visible = !hasUnresolvedTextures(comp, context.getTexture);
  }

  return {
    name: 'MaterialFeature',

    syncEntity(entity, context) {
      const comp = getMaterialComponent(entity);
      if (!comp) {
        lastMaterialKeyByEntity.delete(entity.id);
        const root = context.registry.get(entity.id);
        const mesh = root ? findMesh(root) : null;
        if (mesh) applyVisibility(mesh, entity, null, context);
        return;
      }
      const key = materialKey(comp, context.getTexture);
      const lastKey = lastMaterialKeyByEntity.get(entity.id);
      const root = context.registry.get(entity.id);
      const mesh = findMesh(root);
      if (key === lastKey) {
        if (mesh) applyVisibility(mesh, entity, comp, context);
        return;
      }
      if (mesh) {
        const prev = mesh.material as Material;
        if (prev) prev.dispose();
        mesh.material = materialFromComponent(comp, context.getTexture, context.three);
        applySkinningMaterialIfSkinnedMesh(mesh, mesh.material as Material);
        applyVisibility(mesh, entity, comp, context);
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
        const prev = mesh.material as Material;
        if (prev) prev.dispose();
        mesh.material = materialFromComponent(comp, context.getTexture, context.three);
        applySkinningMaterialIfSkinnedMesh(mesh, mesh.material as Material);
        applyVisibility(mesh, entity, comp, context);
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
