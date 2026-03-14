import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { RenderEngineState } from '../domain';
import type { EngineSubsystemUpdateParams } from '@duckengine/core-v2';

/**
 * Use case: sync ECS to render tree. Called in preRender phase.
 */
export const syncRender = defineSubsystemUseCase<
  RenderEngineState,
  EngineSubsystemUpdateParams,
  void
>({
  name: 'rendering/sync',
  execute(state, { engine, dt }) {
    state.sync(engine, dt);
  },
});
