import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { RenderEngineState } from '../domain';
import type { EngineSubsystemUpdateParams } from '@duckengine/core-v2';

/**
 * Use case: draw all viewports. Called in render phase.
 */
export const renderFrame = defineSubsystemUseCase<
  RenderEngineState,
  EngineSubsystemUpdateParams,
  void
>({
  name: 'rendering/render',
  execute(state, { engine, dt }) {
    state.render(engine, dt);
  },
});
