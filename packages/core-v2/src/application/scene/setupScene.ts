import type { ScenePorts } from '../../domain/types/sceneState';
import { defineSceneUseCase } from './sceneUseCase';

/** Parameters for the setupScene use case. */
export interface SetupSceneParams {
  readonly ports?: Partial<ScenePorts>;
}

/**
 * Initialises scene system ports.
 * Call this when renderer/physics backends are ready.
 * Registers all existing entities with the newly injected ports.
 */
export const setupScene = defineSceneUseCase<SetupSceneParams, void>({
  name: 'setupScene',
  execute(scene, { ports }) {
    if (ports) {
      scene.ports = { ...scene.ports, ...ports };
    }

    scene.ports.physics?.init();

    for (const entity of scene.entities.values()) {
      scene.ports.renderSync?.addEntity(entity);
      scene.ports.physics?.addEntity(entity);
    }

    for (const [kind, enabled] of scene.debugFlags) {
      scene.ports.renderSync?.setSceneDebugEnabled(kind, enabled);
    }

    if (scene.activeCameraId) {
      scene.ports.renderSync?.setActiveCameraEntityId(scene.activeCameraId);
    }
  },
});
