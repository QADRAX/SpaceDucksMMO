import type { SubsystemEventParams, EntityId, PropertyValues, ComponentType } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { slotKey, initScriptSlot, destroyScriptSlot } from '../domain/slots';
import { createScriptBridgeContext } from '../domain/bridges';

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
      const event = params.event as any;

      // The builder handles event.kind routing automatically.
      if (event.componentType !== 'script') return;

      const entityId = event.entityId as EntityId;
      const { slots, pending, sandbox } = session;

      // Ensure component accessors are bound before any Lua hooks run (including async init).
      if (sandbox.bindComponentAccessors) {
        sandbox.bindComponentAccessors(
          <T = unknown>(eid: EntityId, componentType: ComponentType, key: string): T | undefined => {
            const ent = scene.entities.get(eid);
            if (!ent) return undefined;
            const comp = ent.components.get(componentType);
            if (!comp) return undefined;
            return (comp as unknown as Record<string, T>)[key];
          },
          <T = unknown>(eid: EntityId, componentType: ComponentType, key: string, value: T): void => {
            const ent = scene.entities.get(eid);
            if (!ent) return;
            const comp = ent.components.get(componentType);
            if (!comp) return;
            (comp as unknown as Record<string, T>)[key] = value;
            ent.observers.fireComponentChanged(eid, componentType);
          }
        );
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
              (scene, targetId, schema) => createScriptBridgeContext(scene, targetId, schema, session.bridges, session.ports),
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
