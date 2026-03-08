import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the updateEngine use case. */
export interface UpdateEngineParams {
  readonly dt: number;
}

/**
 * Advances the entire engine by one frame.
 *
 * 1. For each scene, calls scene subsystems respecting both
 *    engine-level and scene-level pause flags.
 * 2. Calls engine-level subsystems (render, audio …) respecting
 *    engine-level pause.
 *
 * Subsystem order is deterministic: registration order within each level.
 */
export const updateEngine = defineEngineUseCase<UpdateEngineParams, void>({
  name: 'updateEngine',
  execute(engine, { dt }) {
    for (const scene of engine.scenes.values()) {
      const scenePaused = engine.paused || scene.paused;
      for (const subsystem of scene.subsystems) {
        if (scenePaused && !subsystem.updateWhenPaused) continue;
        subsystem.update?.(scene, dt);
      }
    }

    for (const subsystem of engine.engineSubsystems) {
      if (engine.paused && !subsystem.updateWhenPaused) continue;
      subsystem.update?.(engine, dt);
    }
  },
});
