import type { Camera as ThreeCamera } from 'three';
import type { PerspectiveCamera, OrthographicCamera } from 'three';
import { getComponent } from '@duckengine/core-v2';
import type {
  CameraOrthographicComponent,
  CameraPerspectiveComponent,
  EntityState,
} from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../renderContextThree';
import {
  createPerspectiveCameraFromParams,
  applyPerspectiveCameraParams,
  createOrthographicCameraFromParams,
  applyOrthographicCameraParams,
} from '../cameraFromParams';
import { syncTransformToObject3D } from '../syncTransformToObject3D';
import { removeFromRegistryAndDispose } from '../removeFromRegistry';
import { cameraKey } from '../three';

function getCameraComponent(
  entity: EntityState,
):
  | { kind: 'perspective'; comp: CameraPerspectiveComponent }
  | { kind: 'orthographic'; comp: CameraOrthographicComponent }
  | undefined {
  const p = getComponent<CameraPerspectiveComponent>(entity, 'cameraPerspective');
  if (p) return { kind: 'perspective', comp: p };
  const o = getComponent<CameraOrthographicComponent>(entity, 'cameraOrthographic');
  if (o) return { kind: 'orthographic', comp: o };
  return undefined;
}

function createThreeCamera(cam: NonNullable<ReturnType<typeof getCameraComponent>>, three: typeof import('three')): ThreeCamera {
  if (cam.kind === 'perspective') {
    const c = cam.comp;
    return createPerspectiveCameraFromParams(
      {
        fov: c.fov,
        aspect: c.aspect ?? 1,
        near: c.near,
        far: c.far,
      },
      three,
    );
  }
  const c = cam.comp;
  return createOrthographicCameraFromParams(
    {
      halfHeight: c.halfHeight,
      aspect: c.aspect ?? 1,
      near: c.near,
      far: c.far,
    },
    three,
  );
}

/**
 * Feature: sync cameraPerspective / cameraOrthographic to Three.js cameras.
 */
export function createCameraFeature(): RenderFeature<RenderContextThree> {
  const camerasByEntity = new Map<string, ThreeCamera>();
  const lastCameraKeyByEntity = new Map<string, string>();

  return {
    name: 'CameraFeature',

    syncEntity(entity, context) {
      const cam = getCameraComponent(entity);
      const had = camerasByEntity.has(entity.id);
      const three = context.three;

      if (cam && !had) {
        const threeCam = createThreeCamera(cam, three);
        syncTransformToObject3D(entity, threeCam);
        context.registry.add(entity.id, threeCam, context.threeScene);
        camerasByEntity.set(entity.id, threeCam);
        lastCameraKeyByEntity.set(entity.id, cameraKey(entity));
        return;
      }

      if (cam && had) {
        const key = cameraKey(entity);
        const lastKey = lastCameraKeyByEntity.get(entity.id);
        let threeCam = camerasByEntity.get(entity.id)!;

        const kindChanged =
          lastKey !== undefined &&
          ((lastKey.startsWith('p:') && cam.kind === 'orthographic') ||
            (lastKey.startsWith('o:') && cam.kind === 'perspective'));

        if (kindChanged) {
          removeFromRegistryAndDispose(
            context.registry,
            context.threeScene,
            entity.id,
            threeCam,
            () => {},
          );
          threeCam = createThreeCamera(cam, three);
          syncTransformToObject3D(entity, threeCam);
          context.registry.add(entity.id, threeCam, context.threeScene);
          camerasByEntity.set(entity.id, threeCam);
          lastCameraKeyByEntity.set(entity.id, key);
          return;
        }

        if (key === lastKey) {
          syncTransformToObject3D(entity, threeCam);
          return;
        }

        if (cam.kind === 'perspective' && (threeCam as PerspectiveCamera).isPerspectiveCamera) {
          const c = cam.comp;
          applyPerspectiveCameraParams(threeCam as PerspectiveCamera, {
            fov: c.fov,
            aspect: c.aspect ?? 1,
            near: c.near,
            far: c.far,
          });
        } else if (cam.kind === 'orthographic' && (threeCam as OrthographicCamera).isOrthographicCamera) {
          const c = cam.comp;
          applyOrthographicCameraParams(threeCam as OrthographicCamera, {
            halfHeight: c.halfHeight,
            aspect: c.aspect ?? 1,
            near: c.near,
            far: c.far,
          });
        }
        syncTransformToObject3D(entity, threeCam);
        lastCameraKeyByEntity.set(entity.id, key);
        return;
      }

      if (!cam && had) {
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
      if (componentType !== 'cameraPerspective' && componentType !== 'cameraOrthographic') return;
      const cam = getCameraComponent(entity);
      const threeCam = camerasByEntity.get(entity.id);
      if (!threeCam || !cam) return;

      if (cam.kind === 'perspective' && (threeCam as PerspectiveCamera).isPerspectiveCamera) {
        const c = cam.comp;
        applyPerspectiveCameraParams(threeCam as PerspectiveCamera, {
          fov: c.fov,
          aspect: c.aspect ?? 1,
          near: c.near,
          far: c.far,
        });
      } else if (cam.kind === 'orthographic' && (threeCam as OrthographicCamera).isOrthographicCamera) {
        const c = cam.comp;
        applyOrthographicCameraParams(threeCam as OrthographicCamera, {
          halfHeight: c.halfHeight,
          aspect: c.aspect ?? 1,
          near: c.near,
          far: c.far,
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
