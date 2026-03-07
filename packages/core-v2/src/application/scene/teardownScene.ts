import { defineSceneUseCase } from './sceneUseCase';

/**
 * Tears down a scene: detaches all entity observers, destroys ports, clears state.
 * After teardown the SceneState should not be reused.
 */
export const teardownScene = defineSceneUseCase({
  name: 'teardownScene',
  execute(scene) {
    for (const [, cleanup] of scene.entityCleanups) {
      try {
        cleanup();
      } catch {
        /* swallow */
      }
    }
    scene.entityCleanups.clear();

    scene.ports.physics?.destroy();

    scene.entities.clear();
    scene.rootEntityIds.length = 0;
    scene.activeCameraId = null;
    scene.changeListeners.clear();
    scene.ports = {};
  },
});
