import type { EntityId, ViewportId } from '@duckengine/core-v2';
import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { UISubsystemState } from '../domain/uiSubsystem/types';

/**
 * Unmounts every tracked UI root (scene teardown).
 * Accepts any event/phase params; only subsystem mount state is used.
 */
export const unmountAllUiRoots = defineSubsystemUseCase<UISubsystemState, unknown, void>({
  name: 'ui/unmountAllUiRoots',
  execute(state) {
    for (const key of [...state.mounted]) {
      const [entityId, viewportId] = key.split('::') as [EntityId, ViewportId];
      void state.viewRuntime?.unmount(entityId, viewportId);
      void state.customRuntime?.unmount(entityId, viewportId);
    }
    state.mounted.clear();
  },
});
