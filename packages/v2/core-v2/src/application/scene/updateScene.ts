import { defineSceneUseCase } from '../../domain/useCases';
import { guardEngineSetupComplete } from '../../domain/engine/engineGuards';
import { SCENE_FRAME_PHASES } from '../../domain/subsystems';
import type { SceneSubsystem } from '../../domain/subsystems';
import type { SceneState } from '../../domain/scene';

/** Parameters for the updateScene use case. */
export interface UpdateSceneParams {
  readonly dt: number;
}

function getPhaseFn(subsystem: SceneSubsystem, phase: (typeof SCENE_FRAME_PHASES)[number]): ((scene: SceneState, dt: number) => void) | undefined {
  switch (phase) {
    case 'earlyUpdate': return subsystem.earlyUpdate;
    case 'physics': return subsystem.physics;
    case 'update': return subsystem.update;
    case 'lateUpdate': return subsystem.lateUpdate;
    case 'preRender': return subsystem.preRender;
    case 'postRender': return subsystem.postRender;
    default: return undefined;
  }
}

/**
 * Advances the scene by one frame.
 *
 * Iterates frame phases (earlyUpdate, physics, update, lateUpdate, preRender, postRender)
 * and calls each subsystem's phase callback. Respects scene pause flag.
 */
export const updateScene = defineSceneUseCase<UpdateSceneParams, void>({
  name: 'updateScene',
  guards: [guardEngineSetupComplete],
  execute(scene, { dt }) {
    const scenePaused = scene.paused;
    for (const phase of SCENE_FRAME_PHASES) {
      for (const subsystem of scene.subsystems) {
        if (scenePaused && !subsystem.updateWhenPaused) continue;
        const fn = getPhaseFn(subsystem, phase);
        if (fn) fn(scene, dt);
      }
    }
  },
});
