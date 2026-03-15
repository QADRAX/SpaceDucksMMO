import type { EntityId, SubsystemEventParams, PropertyValues } from '@duckengine/core-v2';
import type { SceneState } from '@duckengine/core-v2';
import { defineSubsystemEventUseCase, emitSceneChange } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { slotKey, initScriptSlot, destroyScriptSlot } from '../domain/slots';
import { createScriptBridgeContext, ENGINE_SYSTEM_BRIDGES } from '../domain/bridges';
import { createComponentAccessorPair } from '../domain/componentAccessors';

/**
 * Core reconcile logic for a single entity. Shared by component-changed and entity-added handlers.
 * When entities are loaded from YAML with script components already attached, only entity-added
 * fires (component-changed does not, since components were added before the entity entered the scene).
 */
function reconcileEntityScriptSlots(
  session: ScriptingSessionState,
  scene: SceneState,
  entityId: EntityId,
): void {
      const { slots, pending, sandbox } = session;

      if (sandbox.bindScriptErrorReporter) {
        sandbox.bindScriptErrorReporter(({ slotKey, phase, hookName, message }) => {
          emitSceneChange(scene, { kind: 'script-error', slotKey, phase, hookName, message });
        });
      }

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
            const isPending = session.pendingScripts.some(
              (e) => e.entityId === entityId && e.scriptId === ref.scriptId
            );
            if (!isPending) {
              session.diagnostic?.log('debug', 'Script slot init', {
                subsystem: 'scripting-lua',
                entityId,
                scriptId: ref.scriptId,
              });
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
              session.pendingScripts,
            );
            }
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
}

/**
 * Reconciles script slots when script component changes.
 */
export const reconcileSlots =
  defineSubsystemEventUseCase<ScriptingSessionState, SubsystemEventParams, void>({
    name: 'scripting/reconcileSlots',
    event: 'component-changed',

    execute(session: ScriptingSessionState, params: SubsystemEventParams): void {
      if (params.event.kind !== 'component-changed') return;
      if (params.event.componentType !== 'script') return;
      reconcileEntityScriptSlots(session, params.scene, params.event.entityId);
    },
  });

/**
 * Reconciles script slots when entity is added. Required for entities loaded from YAML
 * with script components (component-changed does not fire for pre-attached components).
 */
export const reconcileSlotsOnEntityAdded =
  defineSubsystemEventUseCase<ScriptingSessionState, SubsystemEventParams, void>({
    name: 'scripting/reconcileSlotsOnEntityAdded',
    event: 'entity-added',

    execute(session: ScriptingSessionState, params: SubsystemEventParams): void {
      if (params.event.kind !== 'entity-added') return;
      reconcileEntityScriptSlots(session, params.scene, params.event.entityId);
    },
  });
