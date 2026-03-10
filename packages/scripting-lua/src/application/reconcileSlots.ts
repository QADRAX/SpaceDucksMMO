import type { SubsystemEventParams, PropertyValues } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { slotKey, initScriptSlot, destroyScriptSlot } from '../domain/slots';
import { createScriptBridgeContext, ENGINE_SYSTEM_BRIDGES } from '../domain/bridges';
import { createComponentAccessorPair } from '../domain/componentAccessors';

/**
 * Reconciles script slots for a single entity against its ECS `script` component.
 *
 * - Creates new slots for scripts that appear in the component but have no slot yet.
 * - Destroys slots whose scripts were removed from the component.
 * - Updates the `enabled` flag on existing slots.
 *
 * New slot creation is async (source resolution) and tracked in `pending`.
 */
export const reconcileSlots =
  defineSubsystemEventUseCase<ScriptingSessionState, SubsystemEventParams, void>({
    name: 'scripting/reconcileSlots',
    event: 'component-changed',

    execute(session: ScriptingSessionState, params: SubsystemEventParams): void {
      const { scene } = params;
      if (params.event.kind !== 'component-changed') return;
      if (params.event.componentType !== 'script') return;

      const entityId = params.event.entityId;
      const { slots, pending, sandbox } = session;

      if (sandbox.bindComponentAccessors) {
        const { getter, setter } = createComponentAccessorPair(scene);
        sandbox.bindComponentAccessors(getter, setter);
      }

      const entity = scene.entities.get(entityId);
      if (!entity) return;

      const scriptComp = entity.components.get('script') as
        | { scripts: Array<{ scriptId: string; enabled: boolean; properties: PropertyValues }> }
        | undefined;

      const desired = new Set<string>();

      if (scriptComp) {
        for (const ref of scriptComp.scripts) {
          const key = slotKey(entityId, ref.scriptId);
          desired.add(key);

          if (!slots.has(key) && !pending.has(key)) {
            initScriptSlot(
              slots,
              pending,
              sandbox,
              session.resolveSource,
              session.resolveScriptSchema,
              (scene, targetId, schema) => {
                const full = createScriptBridgeContext(
                  scene,
                  targetId,
                  schema,
                  session.bridges,
                  session.ports,
                  session,
                );
                const filtered = { ...full };
                for (const name of ENGINE_SYSTEM_BRIDGES) delete (filtered as Record<string, unknown>)[name];
                return filtered;
              },
              scene,
              entityId,
              ref.scriptId,
              ref.properties,
            );
          }

          const slot = slots.get(key);
          if (slot && slot.enabled !== ref.enabled) {
            slot.enabled = ref.enabled;
            sandbox.callHook(key, ref.enabled ? 'onEnable' : 'onDisable', 0);
          }
        }
      }

      for (const [key, slot] of slots) {
        if (slot.entityId === entityId && !desired.has(key)) {
          destroyScriptSlot(slots, sandbox, session.eventBus, entityId, slot.scriptId);
        }
      }
    },
  });
