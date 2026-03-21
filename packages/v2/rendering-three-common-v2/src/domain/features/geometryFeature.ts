import type { Mesh, SkinnedMesh } from 'three';
import {
  getComponent,
  isGeometryComponentType,
  collectSortedJointEntitiesForRig,
} from '@duckengine/core-v2';
import type { EntityId, EntityState } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { geometryFromComponent } from '../geometryFromComponent';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import {
  applyShadow,
  applySkinningMaterialIfSkinnedMesh,
  disposeRenderableMesh,
  getGeometryComponent,
  getMeshDataForCustom,
  geometryKey,
  createSkinnedMeshParts,
  wantsSkinnedMesh,
  syncSkeletonBoneWorldMatricesFromEcsJoints,
} from '../three';
import type { SkinComponent } from '@duckengine/core-v2';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';

/**
 * Feature: sync geometry component to Three.js Mesh or SkinnedMesh (primitives + customGeometry).
 * Skinned meshes (`skin` + mesh resource with IBMs and joint attributes) use a Skeleton; each
 * preRender frame, `onFrame` copies ECS joint world matrices into bones and runs `skeleton.update()`.
 */
export function createGeometryFeature(): RenderFeature<RenderContextThree> {
  const meshesByEntity = new Map<string, Mesh>();
  /** Entity ids whose registry object is a SkinnedMesh driven by `skin.rigRootEntityId`. */
  const skinRigRootByEntity = new Map<string, EntityId>();
  const lastGeometryKeyByEntity = new Map<string, string>();

  function detachMesh(entityId: string, context: RenderContextThree): void {
    lastGeometryKeyByEntity.delete(entityId);
    skinRigRootByEntity.delete(entityId);
    const mesh = meshesByEntity.get(entityId);
    removeFromRegistryAndDispose(
      context.registry,
      context.threeScene,
      entityId,
      mesh,
      disposeRenderableMesh,
    );
    meshesByEntity.delete(entityId);
  }

  function attachMesh(entity: EntityState, context: RenderContextThree): void {
    const comp = getGeometryComponent(entity);
    if (!comp) return;
    const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
    if (comp.type === 'customGeometry' && !meshData) return;

    const geom = geometryFromComponent(comp, meshData, context.three);
    const skinned = wantsSkinnedMesh(entity, meshData);
    const material = new context.three.MeshStandardMaterial({ color: 0xcccccc });
    let mesh: Mesh;
    if (skinned && meshData) {
      const { mesh: sm, skeleton } = createSkinnedMeshParts(context.three, geom, material, meshData);
      mesh = sm;
      const skin = getComponent<SkinComponent>(entity, 'skin')!;
      skinRigRootByEntity.set(entity.id, skin.rigRootEntityId);
      mesh.visible = false;
      applyShadow(mesh, comp.castShadow, comp.receiveShadow);
      syncTransformToObject3D(entity, mesh);
      applySkinningMaterialIfSkinnedMesh(mesh, material);
      sm.bind(skeleton, sm.matrixWorld);
    } else {
      mesh = new context.three.Mesh(geom, material);
      mesh.visible = false;
      applyShadow(mesh, comp.castShadow, comp.receiveShadow);
      syncTransformToObject3D(entity, mesh);
    }
    context.registry.add(entity.id, mesh, context.threeScene);
    meshesByEntity.set(entity.id, mesh);
    lastGeometryKeyByEntity.set(entity.id, geometryKey(entity, comp, meshData));
  }

  return {
    name: 'GeometryFeature',

    syncEntity(entity, context) {
      const comp = getGeometryComponent(entity);
      const had = meshesByEntity.has(entity.id);

      if (!comp) {
        if (had) detachMesh(entity.id, context);
        return;
      }

      const meshData = comp.type === 'customGeometry' ? getMeshDataForCustom(entity, context) : null;
      if (comp.type === 'customGeometry' && !meshData) {
        if (had) detachMesh(entity.id, context);
        return;
      }

      const key = geometryKey(entity, comp, meshData);
      const lastKey = lastGeometryKeyByEntity.get(entity.id);
      const mesh = meshesByEntity.get(entity.id);

      if (had && mesh && key === lastKey) {
        syncTransformToObject3D(entity, mesh);
        return;
      }

      if (had && mesh) {
        detachMesh(entity.id, context);
      }

      attachMesh(entity, context);
    },

    onUpdate(entity, componentType, context) {
      if (!isGeometryComponentType(componentType)) return;
      const comp = getGeometryComponent(entity);
      const mesh = comp ? meshesByEntity.get(entity.id) : undefined;
      if (!mesh || !comp) return;
      detachMesh(entity.id, context);
      attachMesh(entity, context);
    },

    onFrame(_dt, context) {
      for (const [entityId, rigRootId] of skinRigRootByEntity) {
        const skinned = meshesByEntity.get(entityId) as SkinnedMesh | undefined;
        if (!skinned?.isSkinnedMesh) continue;
        const rigRoot = context.scene.entities.get(rigRootId);
        if (!rigRoot) continue;
        const joints = collectSortedJointEntitiesForRig(rigRoot);
        syncSkeletonBoneWorldMatricesFromEcsJoints(skinned.skeleton, joints);
      }
    },

    onDetachById(entityId, context) {
      detachMesh(entityId, context);
    },
  };
}
