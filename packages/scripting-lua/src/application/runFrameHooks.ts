import type { SubsystemUpdateParams, SubsystemUseCase, EntityId, ComponentType } from '@duckengine/core-v2';
import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import {
  FRAME_HOOKS,
  runHookOnAllSlots,
  syncSlotPropertiesFromScene,
  flushDirtySlotsToScene,
} from '../domain/slots';

/**
 * Executes the per-frame hook pipeline for all enabled slots.
 *
 * Order:
 * 1. Update time state
 * 2. Sync ECS → Lua properties (delegated to syncProperties use case externally before this)
 * 3. Run `earlyUpdate` on all slots
 * 4. Flush event bus (delivers queued events)
 * 5. Run remaining frame hooks (`update`, `lateUpdate`, `onDrawGizmos`)
 * 6. Flush dirty properties (Lua → ECS)
 *
 * If a hook call fails, the slot is automatically disabled.
 */
export const runFrameHooks: SubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void> =
  defineSubsystemUseCase<ScriptingSessionState, SubsystemUpdateParams, void>({
    name: 'scripting/runFrameHooks',

    execute(session: ScriptingSessionState, params: SubsystemUpdateParams): void {
      const { scene, dt } = params;
      const { slots, sandbox, eventBus, timeState } = session;

      // 1. Update time state
      timeState.delta = dt;
      timeState.elapsed += dt;
      timeState.frameCount++;

      // 1.5. Bind generic component accessors for this frame using the active scene
      if (sandbox.bindComponentAccessors) {
          sandbox.bindComponentAccessors(
              <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string): T | undefined => {
                  if (!scene) return undefined;
                  const entity = scene.entities.get(entityId);
                  if (!entity) return undefined;
                  
                  const comp = entity.components.get(componentType);
                  if (!comp) return undefined;
                  
                  return (comp as unknown as Record<string, T>)[key];
              },
              <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string, value: T): void => {
                  if (!scene) return;
                  const entity = scene.entities.get(entityId);
                  if (!entity) return;
                  
                  const comp = entity.components.get(componentType);
                  if (!comp) return;
                  
                  (comp as unknown as Record<string, T>)[key] = value;
                  entity.observers.fireComponentChanged(entityId, componentType);
              }
          );
      }

      // 2. Sync properties (ECS → Lua) for all enabled slots
      for (const slot of slots.values()) {
        if (!slot.enabled) continue;
        syncSlotPropertiesFromScene(scene, slot, sandbox);
      }

      // 3. earlyUpdate
      runHookOnAllSlots(slots, sandbox, 'earlyUpdate', dt);

      // 4. Flush event bus
      eventBus.flush();

      // 5. Remaining frame hooks
      for (const hook of FRAME_HOOKS) {
        if (hook === 'earlyUpdate') continue;
        runHookOnAllSlots(slots, sandbox, hook, dt);
      }

      // 6. Flush dirty properties (Lua → ECS)
      for (const slot of slots.values()) {
        if (!slot.enabled || !slot.sandboxHandle) continue;
        const dirty = sandbox.flushDirtyProperties(slot.sandboxHandle as string);
        if (dirty) {
          for (const [key, value] of Object.entries(dirty)) {
            slot.properties[key] = value;
            slot.dirtyKeys.add(key);
          }
        }
      }
      flushDirtySlotsToScene(slots, scene);
    },
  });
