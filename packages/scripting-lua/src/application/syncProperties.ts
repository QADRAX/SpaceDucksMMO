import type { SceneState } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import type { SubsystemUseCase } from '../domain/subsystems';
import { defineSubsystemUseCase } from '../domain/subsystems';
import { syncSlotPropertiesFromScene } from '../domain/slots';

export interface SyncPropertiesParams {
  readonly scene: SceneState;
}

/**
 * Synchronises ECS → Lua properties for all enabled slots.
 *
 * For each slot, reads the entity's `script` component to detect property
 * changes, pushes them into the sandbox, and fires `onPropertyChanged`
 * hooks for each changed key.
 */
export const syncProperties: SubsystemUseCase<SyncPropertiesParams, void> =
  defineSubsystemUseCase<SyncPropertiesParams, void>({
    name: 'scripting/syncProperties',

    execute(session: ScriptingSessionState, params: SyncPropertiesParams): void {
      const { scene } = params;
      const { slots, sandbox } = session;

      for (const slot of slots.values()) {
        if (!slot.enabled) continue;
        syncSlotPropertiesFromScene(scene, slot, sandbox);
      }
    },
  });
