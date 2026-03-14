import * as THREE from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { syncTransformToObject3D } from '../syncTransformToObject3D';

/**
 * Feature: sync cameraView component to Three.js PerspectiveCamera.
 */
export function createCameraFeature(): RenderFeature {
  const camerasByEntity = new Map<string, THREE.PerspectiveCamera>();

  return {
    name: 'CameraFeature',

    isEligible(entity, _scene) {
      return getComponent(entity, 'cameraView') !== undefined;
    },

    onAttach(entity, context) {
      const ctx = context as RenderContextThree;
      const cam = getComponent(entity, 'cameraView') as {
        fov: number;
        near: number;
        far: number;
        aspect: number;
      } | undefined;
      if (!cam) return;

      const threeCam = new THREE.PerspectiveCamera(
        cam.fov,
        cam.aspect || 1,
        cam.near,
        cam.far,
      );
      syncTransformToObject3D(entity, threeCam);
      ctx.registry.add(entity.id, threeCam, ctx.threeScene);
      camerasByEntity.set(entity.id, threeCam);
    },

    onUpdate(entity, componentType, _context) {
      if (componentType !== 'cameraView') return;
      const cam = getComponent(entity, 'cameraView') as {
        fov: number;
        near: number;
        far: number;
        aspect: number;
      } | undefined;
      const threeCam = camerasByEntity.get(entity.id);
      if (threeCam && cam) {
        threeCam.fov = cam.fov;
        threeCam.near = cam.near;
        threeCam.far = cam.far;
        threeCam.aspect = cam.aspect || 1;
        threeCam.updateProjectionMatrix();
      }
    },

    onDetach(entity, ctx) {
      detachById(entity.id, ctx as RenderContextThree, camerasByEntity);
    },

    onDetachById(entityId, ctx) {
      detachById(entityId, ctx as RenderContextThree, camerasByEntity);
    },

    onTransformChanged(entity, _context) {
      const threeCam = camerasByEntity.get(entity.id);
      if (threeCam) syncTransformToObject3D(entity, threeCam);
    },
  };
}

function detachById(
  entityId: string,
  ctx: RenderContextThree,
  camerasByEntity: Map<string, THREE.PerspectiveCamera>,
): void {
  const threeCam = camerasByEntity.get(entityId);
  if (threeCam) {
    ctx.registry.remove(entityId, threeCam, ctx.threeScene);
    camerasByEntity.delete(entityId);
  }
}
