import * as THREE from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { createPerspectiveCameraFromParams, applyPerspectiveCameraParams } from '../cameraFromParams';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';

type CameraParams = { fov: number; near: number; far: number; aspect: number };

/**
 * Feature: sync cameraView component to Three.js PerspectiveCamera.
 */
export function createCameraFeature(): RenderFeature<RenderContextThree> {
  const camerasByEntity = new Map<string, THREE.PerspectiveCamera>();

  return {
    name: 'CameraFeature',

    syncEntity(entity, context) {
      const cam = getComponent(entity, 'cameraView') as CameraParams | undefined;
      const had = camerasByEntity.has(entity.id);

      if (cam && !had) {
        const threeCam = createPerspectiveCameraFromParams({
          fov: cam.fov,
          aspect: cam.aspect ?? 1,
          near: cam.near,
          far: cam.far,
        });
        syncTransformToObject3D(entity, threeCam);
        context.registry.add(entity.id, threeCam, context.threeScene);
        camerasByEntity.set(entity.id, threeCam);
      } else if (cam && had) {
        const threeCam = camerasByEntity.get(entity.id)!;
        applyPerspectiveCameraParams(threeCam, {
          fov: cam.fov,
          aspect: cam.aspect ?? 1,
          near: cam.near,
          far: cam.far,
        });
        syncTransformToObject3D(entity, threeCam);
      } else if (!cam && had) {
        const threeCam = camerasByEntity.get(entity.id);
        removeFromRegistryAndDispose(
          context.registry,
          context.threeScene,
          entity.id,
          threeCam,
          () => {},
        );
        camerasByEntity.delete(entity.id);
      }
    },

    onUpdate(entity, componentType, _context) {
      if (componentType !== 'cameraView') return;
      const cam = getComponent(entity, 'cameraView') as CameraParams | undefined;
      const threeCam = camerasByEntity.get(entity.id);
      if (threeCam && cam) {
        applyPerspectiveCameraParams(threeCam, {
          fov: cam.fov,
          aspect: cam.aspect ?? 1,
          near: cam.near,
          far: cam.far,
        });
      }
    },

    onDetachById(entityId, context) {
      const threeCam = camerasByEntity.get(entityId);
      removeFromRegistryAndDispose(
        context.registry,
        context.threeScene,
        entityId,
        threeCam,
        () => {},
      );
      camerasByEntity.delete(entityId);
    },
  };
}
