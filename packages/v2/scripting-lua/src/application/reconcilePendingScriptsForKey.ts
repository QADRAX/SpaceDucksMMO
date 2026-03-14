import type { SubsystemEngineEventParams } from '@duckengine/core-v2';
import type { ScriptingSessionState } from '../domain/session';
import { slotKey, initScriptSlot } from '../domain/slots';
import { createScriptBridgeContext, ENGINE_SYSTEM_BRIDGES } from '../domain/bridges';

/**
 * Reconciles pending script slots when a resource is loaded.
 * Called from engineEvents['resource-loaded'] when event.ref.kind === 'script'.
 */
export const reconcilePendingScriptsForKey = {
  name: 'scripting/reconcilePendingScriptsForKey',
  execute(session: ScriptingSessionState, params: SubsystemEngineEventParams): void {
    const { event, scene } = params;
    if (event.kind !== 'resource-loaded' || event.ref.kind !== 'script') return;
    if (!scene) return;

    const key = event.ref.key;
    const { slots, pending, pendingScripts, sandbox } = session;

    const toProcess = pendingScripts.filter((e) => e.scriptId === key);
    if (toProcess.length === 0) return;

    for (const entry of toProcess) {
      const slotKeyStr = slotKey(entry.entityId, entry.scriptId);
      if (slots.has(slotKeyStr) || pending.has(slotKeyStr)) continue;

      initScriptSlot(
        slots,
        pending,
        sandbox,
        session.resolveSource,
        session.resolveScriptSchema,
        (s, targetId, schema) => {
          const full = createScriptBridgeContext(
            s,
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
        entry.entityId,
        entry.scriptId,
        entry.properties,
        undefined,
      );
    }

    const remaining = pendingScripts.filter((e) => e.scriptId !== key);
    pendingScripts.length = 0;
    pendingScripts.push(...remaining);
  },
};
