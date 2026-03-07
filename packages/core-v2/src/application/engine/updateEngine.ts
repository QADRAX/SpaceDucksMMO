import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the updateEngine use case. */
export interface UpdateEngineParams {
  readonly dt: number;
}

/**
 * Advances the entire engine by one frame.
 *
 * 1. For each scene, calls scene adapters respecting both
 *    engine-level and scene-level pause flags.
 * 2. Calls engine-level adapters (render, audio …) respecting
 *    engine-level pause.
 *
 * Adapter order is deterministic: registration order within each level.
 */
export const updateEngine = defineEngineUseCase<UpdateEngineParams, void>({
  name: 'updateEngine',
  execute(engine, { dt }) {
    for (const scene of engine.scenes.values()) {
      const scenePaused = engine.paused || scene.paused;
      for (const adapter of scene.adapters) {
        if (scenePaused && !adapter.updateWhenPaused) continue;
        adapter.update?.(scene, dt);
      }
    }

    for (const adapter of engine.engineAdapters) {
      if (engine.paused && !adapter.updateWhenPaused) continue;
      adapter.update?.(engine, dt);
    }
  },
});
