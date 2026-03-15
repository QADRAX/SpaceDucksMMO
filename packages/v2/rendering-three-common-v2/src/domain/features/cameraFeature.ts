import type { PerspectiveCamera } from 'three';
import { getComponent } from '@duckengine/core-v2';
import type { CameraViewComponent } from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import { createPerspectiveCameraFromParams, applyPerspectiveCameraParams } from '../cameraFromParams';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';
import { cameraKey } from '../three';

/**
 * Feature: sync cameraView component to Three.js PerspectiveCamera.
 */
export function createCameraFeature(): RenderFeature<RenderContextThree> {
  const camerasByEntity = new Map<string, PerspectiveCamera>();
  const lastCameraKeyByEntity = new Map<string, string>();

  return {
    name: 'CameraFeature',

    syncEntity(entity, context) {
      const cam = getComponent<CameraViewComponent>(entity, 'cameraView');
      const had = camerasByEntity.has(entity.id);

      if (cam && !had) {
        const threeCam = createPerspectiveCameraFromParams(
          {
            fov: cam.fov,
            aspect: cam.aspect ?? 1,
            near: cam.near,
            far: cam.far,
          },
          context.three,
        );
        syncTransformToObject3D(entity, threeCam);
        context.registry.add(entity.id, threeCam, context.threeScene);
        camerasByEntity.set(entity.id, threeCam);
        lastCameraKeyByEntity.set(entity.id, cameraKey(cam));
      } else if (cam && had) {
        const key = cameraKey(cam);
        const lastKey = lastCameraKeyByEntity.get(entity.id);
        const threeCam = camerasByEntity.get(entity.id)!;
        if (key === lastKey) {
          syncTransformToObject3D(entity, threeCam);
        } else {
          applyPerspectiveCameraParams(threeCam, {
            fov: cam.fov,
            aspect: cam.aspect ?? 1,
            near: cam.near,
            far: cam.far,
          });
          syncTransformToObject3D(entity, threeCam);
          lastCameraKeyByEntity.set(entity.id, key);
        }
      } else if (!cam && had) {
        lastCameraKeyByEntity.delete(entity.id);
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
      const cam = getComponent<CameraViewComponent>(entity, 'cameraView');
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
      lastCameraKeyByEntity.delete(entityId);
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
