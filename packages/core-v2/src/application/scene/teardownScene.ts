import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

/**
 * Tears down a scene: emits a teardown event, disposes adapters,
 * detaches all entity observers, and clears state.
 * After teardown the SceneState should not be reused.
 */
export const teardownScene = defineSceneUseCase({
  name: 'teardownScene',
  execute(scene) {
    emitSceneChange(scene, { kind: 'scene-teardown' });

    for (const subsystem of scene.subsystems) {
      try {
        subsystem.dispose?.();
      } catch {
        /* swallow */
      }
    }
    scene.subsystems.length = 0;

    for (const [, cleanup] of scene.entityCleanups) {
      try {
        cleanup();
      } catch {
        /* swallow */
      }
    }
    scene.entityCleanups.clear();

    scene.entities.clear();
    scene.rootEntityIds.length = 0;
    scene.activeCameraId = null;
    scene.changeListeners.clear();
  },
});
