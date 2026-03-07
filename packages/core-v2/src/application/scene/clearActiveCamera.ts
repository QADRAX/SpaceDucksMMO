import { defineSceneUseCase } from './sceneUseCase';
import { emitSceneChange } from './emitSceneChange';

/** Clears the active camera, leaving the scene without a camera. */
export const clearActiveCamera = defineSceneUseCase({
  name: 'clearActiveCamera',
  execute(scene) {
    if (scene.activeCameraId === null) return;
    scene.activeCameraId = null;
    scene.ports.renderSync?.setActiveCameraEntityId(null);
    emitSceneChange(scene, { kind: 'active-camera-changed', entityId: null });
  },
});
