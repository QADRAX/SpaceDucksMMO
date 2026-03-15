import type { Mesh } from 'three';
import { isGeometryComponentType } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { geometryFromComponent } from '../geometryFromComponent';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { applyShadow, disposeMesh, getGeometryComponent, getMeshDataForCustom, geometryKey } from '../three';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';

/**
 * Feature: sync geometry component to Three.js Mesh (primitives + customGeometry).
 */
export function createGeometryFeature(): RenderFeature<RenderContextThree> {
  const meshesByEntity = new Map<string, Mesh>();
  const lastGeometryKeyByEntity = new Map<string, string>();

  return {
    name: 'GeometryFeature',

    syncEntity(entity, context) {
      const comp = getGeometryComponent(entity);
      const had = meshesByEntity.has(entity.id);

      if (comp && !had) {
        const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
        if (comp.type === 'customGeometry' && !meshData) {
          return;
        }
        const geom = geometryFromComponent(comp, meshData, context.three);
        const material = new context.three.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new context.three.Mesh(geom, material);
        mesh.visible = false;
        applyShadow(mesh, comp.castShadow, comp.receiveShadow);
        syncTransformToObject3D(entity, mesh);
        context.registry.add(entity.id, mesh, context.threeScene);
        meshesByEntity.set(entity.id, mesh);
        lastGeometryKeyByEntity.set(entity.id, geometryKey(comp, meshData));
      } else if (comp && had) {
        const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
        const key = geometryKey(comp, meshData);
        const lastKey = lastGeometryKeyByEntity.get(entity.id);
        const mesh = meshesByEntity.get(entity.id)!;
        if (key === lastKey) {
          syncTransformToObject3D(entity, mesh);
        } else {
          const geom = geometryFromComponent(comp, meshData, context.three);
          mesh.geometry.dispose();
          mesh.geometry = geom;
          applyShadow(mesh, comp.castShadow, comp.receiveShadow);
          syncTransformToObject3D(entity, mesh);
          lastGeometryKeyByEntity.set(entity.id, key);
        }
      } else if (!comp && had) {
        lastGeometryKeyByEntity.delete(entity.id);
        const mesh = meshesByEntity.get(entity.id);
        removeFromRegistryAndDispose(
          context.registry,
          context.threeScene,
          entity.id,
          mesh,
          disposeMesh,
        );
        meshesByEntity.delete(entity.id);
      }
    },

    onUpdate(entity, componentType, context) {
      if (!isGeometryComponentType(componentType)) return;
      const comp = getGeometryComponent(entity);
      const mesh = comp ? meshesByEntity.get(entity.id) : undefined;
      if (!mesh || !comp) return;
      const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
      const geom = geometryFromComponent(comp, meshData, context.three);
      mesh.geometry.dispose();
      mesh.geometry = geom;
      applyShadow(mesh, comp.castShadow, comp.receiveShadow);
    },

    onDetachById(entityId, context) {
      lastGeometryKeyByEntity.delete(entityId);
      const mesh = meshesByEntity.get(entityId);
      removeFromRegistryAndDispose(
        context.registry,
        context.threeScene,
        entityId,
        mesh,
        disposeMesh,
      );
      meshesByEntity.delete(entityId);
    },
  };
}
