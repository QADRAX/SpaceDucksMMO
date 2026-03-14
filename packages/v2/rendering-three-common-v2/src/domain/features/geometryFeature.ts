import * as THREE from 'three';
import { getComponent, GEOMETRY_COMPONENT_TYPES, isGeometryComponentType } from '@duckengine/core-v2';
import type {
  EntityState,
  GeometryComponent,
  MeshGeometryFileData,
  CustomGeometryComponent,
} from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { geometryFromComponent } from '../geometryFromComponent';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { applyShadow, disposeMesh } from '../three';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';

function getGeometryComponent(entity: EntityState): GeometryComponent | undefined {
  for (const t of GEOMETRY_COMPONENT_TYPES) {
    const c = getComponent(entity, t);
    if (c && c.type === t) return c as GeometryComponent;
  }
  return undefined;
}

function getMeshDataForCustom(
  entity: EntityState,
  ctx: RenderContextThree,
): MeshGeometryFileData | null {
  const custom = getComponent<CustomGeometryComponent>(entity, 'customGeometry');
  if (!custom?.mesh) return null;
  return ctx.getMeshData(custom.mesh);
}

/**
 * Feature: sync geometry component to Three.js Mesh (primitives + customGeometry).
 */
export function createGeometryFeature(): RenderFeature<RenderContextThree> {
  const meshesByEntity = new Map<string, THREE.Mesh>();

  return {
    name: 'GeometryFeature',

    syncEntity(entity, context) {
      const comp = getGeometryComponent(entity);
      const had = meshesByEntity.has(entity.id);

      if (comp && !had) {
        const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
        const geom = geometryFromComponent(comp, meshData);
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(geom, material);
        applyShadow(mesh, comp.castShadow, comp.receiveShadow);
        syncTransformToObject3D(entity, mesh);
        context.registry.add(entity.id, mesh, context.threeScene);
        meshesByEntity.set(entity.id, mesh);
      } else if (comp && had) {
        const mesh = meshesByEntity.get(entity.id)!;
        const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
        const geom = geometryFromComponent(comp, meshData);
        mesh.geometry.dispose();
        mesh.geometry = geom;
        applyShadow(mesh, comp.castShadow, comp.receiveShadow);
        syncTransformToObject3D(entity, mesh);
      } else if (!comp && had) {
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
      const geom = geometryFromComponent(comp, meshData);
      mesh.geometry.dispose();
      mesh.geometry = geom;
      applyShadow(mesh, comp.castShadow, comp.receiveShadow);
    },

    onDetachById(entityId, context) {
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
