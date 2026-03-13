import type { GameSettings } from '../../domain/engine';
import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the updateSettings use case. */
export interface UpdateSettingsParams {
  readonly patch: {
    readonly graphics?: Partial<GameSettings['graphics']>;
    readonly gameplay?: Partial<GameSettings['gameplay']>;
    readonly audio?: Partial<GameSettings['audio']>;
  };
}

/**
 * Applies a partial update to the engine's game settings.
 *
 * Each section (graphics, gameplay, audio) is shallow-merged
 * so callers can update individual fields without replacing
 * the entire section. Returns the resulting GameSettings.
 */
export const updateSettings = defineEngineUseCase<UpdateSettingsParams, GameSettings>({
  name: 'updateSettings',
  execute(engine, { patch }) {
    if (patch.graphics) {
      engine.settings = {
        ...engine.settings,
        graphics: { ...engine.settings.graphics, ...patch.graphics },
      };
    }
    if (patch.gameplay) {
      engine.settings = {
        ...engine.settings,
        gameplay: { ...engine.settings.gameplay, ...patch.gameplay },
      };
    }
    if (patch.audio) {
      engine.settings = {
        ...engine.settings,
        audio: { ...engine.settings.audio, ...patch.audio },
      };
    }
    return { ...engine.settings };
  },
});
