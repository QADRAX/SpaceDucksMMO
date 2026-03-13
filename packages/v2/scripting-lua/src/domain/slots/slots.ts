import type { SceneState, ScriptSchema, EntityId, PropertyValues } from '@duckengine/core-v2';
import type { ScriptBridgeContext } from '../bridges';
import type { ScriptSandbox } from '../ports';
import type { SceneEventBus } from '@duckengine/core-v2';
import { diffProperties, applyPropertyChanges } from '../properties';
import type { ScriptSlotState, ScriptHook } from './types';

/**
 * Creates a new script slot state for a given entity + script pair.
 *
 * @param entityId   - The owning entity's ID.
 * @param scriptId   - The script identifier (e.g. 'ai/patrol').
 * @param properties - Initial properties from the ECS ScriptReference.
 * @param hooks      - Set of hooks the script source declares.
 */
export function createScriptSlot(
  entityId: EntityId,
  scriptId: string,
  properties: PropertyValues,
  hooks: ReadonlyArray<ScriptHook>,
): ScriptSlotState {
  return {
    entityId,
    scriptId,
    enabled: true,
    properties: { ...properties },
    dirtyKeys: new Set(),
    declaredHooks: new Set(hooks),
    sandboxHandle: undefined,
  };
}

/**
 * Generates a deterministic slot key from entity + script IDs.
 * Used as the lookup key in the adapter's slot registry.
 */
export function slotKey(entityId: EntityId, scriptId: string): string {
  return `${entityId}::${scriptId}`;
}

/**
 * Asynchronously initializes a script slot and registers it in the slot map.
 *
 * Source and schema resolution failures are ignored by caller policy; missing source exits
 * early without slot registration.
 */
export function initScriptSlot(
  slots: Map<string, ScriptSlotState>,
  pending: Map<string, Promise<void>>,
  sandbox: ScriptSandbox,
  resolveSource: (scriptId: string) => Promise<string | null>,
  resolveScriptSchema: (scriptId: string) => Promise<ScriptSchema | null>,
  bridgeContextFactory: (scene: SceneState, entityId: EntityId, schema: ScriptSchema | null) => ScriptBridgeContext,
  scene: SceneState,
  entityId: EntityId,
  scriptId: string,
  properties: PropertyValues,
): void {
  const key = slotKey(entityId, scriptId);
  if (slots.has(key) || pending.has(key)) return;

  const init = async () => {
    const [source, schema] = await Promise.all([
      resolveSource(scriptId),
      resolveScriptSchema(scriptId),
    ]);
    if (!source) return;

    const declaredHooks = sandbox.detectHooks(source);
    const slot = createScriptSlot(entityId, scriptId, properties, declaredHooks);

    sandbox.createSlot(key, source, bridgeContextFactory(scene, entityId, schema), slot.properties, schema);
    slot.sandboxHandle = key;
    slots.set(key, slot);

    sandbox.callHook(key, 'init', 0);
    if (slot.enabled) sandbox.callHook(key, 'onEnable', 0);
  };

  const promise = init()
    .catch(() => {
      /* slot creation failed; slot remains unregistered */
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, promise);
}

/** Destroys one slot and removes its event subscriptions. */
export function destroyScriptSlot(
  slots: Map<string, ScriptSlotState>,
  sandbox: ScriptSandbox,
  eventBus: SceneEventBus,
  entityId: EntityId,
  scriptId: string,
): void {
  const key = slotKey(entityId, scriptId);
  const slot = slots.get(key);
  if (!slot) return;

  if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
  sandbox.callHook(key, 'onDestroy', 0);
  sandbox.destroySlot(key);
  eventBus.removeSlot(key);
  slots.delete(key);
}

/** Destroys all slots that belong to a given entity. */
export function destroyEntityScriptSlots(
  slots: Map<string, ScriptSlotState>,
  sandbox: ScriptSandbox,
  eventBus: SceneEventBus,
  entityId: EntityId,
): void {
  for (const [key, slot] of slots) {
    if (slot.entityId !== entityId) continue;

    if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
    sandbox.callHook(key, 'onDestroy', 0);
    sandbox.destroySlot(key);
    eventBus.removeSlot(key);
    slots.delete(key);
  }
}

/** Runs a hook on all enabled slots that declared it. */
export function runHookOnAllSlots(
  slots: Map<string, ScriptSlotState>,
  sandbox: ScriptSandbox,
  hook: string,
  dt: number,
): void {
  for (const [key, slot] of slots) {
    if (!slot.enabled) continue;
    if (!slot.declaredHooks.has(hook as never)) continue;

    const success = sandbox.callHook(key, hook, dt);
    if (!success) slot.enabled = false;
  }
}

/** Synchronizes ECS properties into a single slot and emits change hooks. */
export function syncSlotPropertiesFromScene(
  scene: SceneState,
  slot: ScriptSlotState,
  sandbox: ScriptSandbox,
): void {
  const entity = scene.entities.get(slot.entityId);
  if (!entity) return;

  const scriptComp = entity.components.get('script') as
    | { scripts: Array<{ scriptId: string; properties: PropertyValues }> }
    | undefined;
  if (!scriptComp) return;

  const ref = scriptComp.scripts.find((s) => s.scriptId === slot.scriptId);
  if (!ref) return;

  const changed = diffProperties(slot.properties, ref.properties);
  if (changed.length === 0) return;

  applyPropertyChanges(slot.properties, ref.properties, changed);
  const key = slot.sandboxHandle as string;
  sandbox.syncProperties(key, slot.properties);

  for (const propertyKey of changed) {
    sandbox.callHook(key, 'onPropertyChanged', 0, propertyKey, slot.properties[propertyKey]);
  }
}

/** Flushes dirty keys authored by scripts back into ECS script component data. */
export function flushDirtySlotsToScene(
  slots: Map<string, ScriptSlotState>,
  scene: SceneState,
): void {
  for (const slot of slots.values()) {
    if (slot.dirtyKeys.size === 0) continue;

    const entity = scene.entities.get(slot.entityId);
    if (!entity) continue;

    const scriptComp = entity.components.get('script') as
      | { scripts: Array<{ scriptId: string; properties: PropertyValues }> }
      | undefined;
    if (!scriptComp) continue;

    const ref = scriptComp.scripts.find((s) => s.scriptId === slot.scriptId);
    if (!ref) continue;

    for (const dirtyKey of slot.dirtyKeys) {
      ref.properties[dirtyKey] = slot.properties[dirtyKey];
    }
    slot.dirtyKeys.clear();
  }
}
