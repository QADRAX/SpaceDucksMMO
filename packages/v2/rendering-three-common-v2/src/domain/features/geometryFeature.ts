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

function getGeometryComponent(entity: EntityState): GeometryComponent | undefined {
  for (const t of GEOMETRY_COMPONENT_TYPES) {
    const c = getComponent(entity, t);
    if (c && c.type === t) return c as GeometryComponent;
  }
  return undefined;
}

function applyShadow(mesh: THREE.Mesh, cast: boolean, receive: boolean): void {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
}

function getMeshDataForCustom(
  entity: EntityState,
  ctx: RenderContextThree,
): MeshGeometryFileData | null {
  const custom = getComponent<CustomGeometryComponent>(entity, 'customGeometry');
  if (!custom?.mesh) return null;
  return ctx.getMeshData(custom.mesh);
}

function detachById(
  entityId: string,
  ctx: RenderContextThree,
  meshesByEntity: Map<string, THREE.Mesh>,
): void {
  const mesh = meshesByEntity.get(entityId);
  if (mesh) {
    ctx.registry.remove(entityId, mesh, ctx.threeScene);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    meshesByEntity.delete(entityId);
  }
}

/**
 * Feature: sync geometry component to Three.js Mesh (primitives + customGeometry).
 */
export function createGeometryFeature(): RenderFeature {
  const meshesByEntity = new Map<string, THREE.Mesh>();

  return {
    name: 'GeometryFeature',

    isEligible(entity, _scene) {
      return getGeometryComponent(entity) !== undefined;
    },

    onAttach(entity, context) {
      const ctx = context as RenderContextThree;
      const comp = getGeometryComponent(entity);
      if (!comp) return;

      const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, ctx) : null;
      const geom = geometryFromComponent(comp, meshData);
      const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const mesh = new THREE.Mesh(geom, material);
      applyShadow(mesh, comp.castShadow, comp.receiveShadow);
      syncTransformToObject3D(entity, mesh);
      ctx.registry.add(entity.id, mesh, ctx.threeScene);
      meshesByEntity.set(entity.id, mesh);
    },

    onUpdate(entity, componentType, context) {
      const ctx = context as RenderContextThree;
      if (!isGeometryComponentType(componentType)) return;
      const comp = getGeometryComponent(entity);
      if (!comp) return;
      const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, ctx) : null;
      const geom = geometryFromComponent(comp, meshData);
      const mesh = meshesByEntity.get(entity.id);
      if (mesh) {
        mesh.geometry.dispose();
        mesh.geometry = geom;
        applyShadow(mesh, comp.castShadow, comp.receiveShadow);
      }
    },

    onDetach(entity, context) {
      detachById(entity.id, context as RenderContextThree, meshesByEntity);
    },

    onDetachById(entityId, _context) {
      detachById(entityId, _context as RenderContextThree, meshesByEntity);
    },

    onTransformChanged(entity, _context) {
      const mesh = meshesByEntity.get(entity.id);
      if (mesh) syncTransformToObject3D(entity, mesh);
    },
  };
}
