import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { RenderEngineState } from '../domain';

/**
 * Use case: release rendering resources. Called on subsystem dispose.
 */
export const disposeRender = defineSubsystemUseCase<RenderEngineState, void, void>({
  name: 'rendering/dispose',
  execute(state) {
    state.dispose?.();
  },
});
