import type {
  SceneState,
  SceneChangeEventWithError,
  SceneSystemAdapter,
  EngineState,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, TimeState } from '../domain/bridges';
import type { ScriptSlotState } from '../domain/slots';
import type { ScriptSandbox } from '../domain/ports';
import {
  createScriptSlot,
  slotKey,
  FRAME_HOOKS,
} from '../domain/slots';
import { diffProperties, applyPropertyChanges } from '../domain/properties';
import { createScriptEventBus } from '../domain/events';
import { createScriptBridgeContext } from '../domain/bridges';

/** Configuration for creating a scripting adapter. */
export interface CreateScriptingAdapterParams {
  /** The root engine state (for cross-scene resolution). */
  readonly engine: EngineState;
  /** The scene this adapter manages. */
  readonly sceneId: string;
  /** Bridge declarations to install per slot. */
  readonly bridges: ReadonlyArray<BridgeDeclaration>;
  /** External ports for bridges that need infra (physics, input, gizmo). */
  readonly ports?: BridgePorts;
  /** The sandbox implementation (wasmoon or mock). */
  readonly sandbox: ScriptSandbox;
  /** Shared time state updated by the adapter each frame. */
  readonly timeState: TimeState;
  /** Optional script source resolver. Defaults to no-op. */
  readonly resolveSource?: (scriptId: string) => Promise<string | null>;
}

/**
 * Creates a `SceneSystemAdapter` that manages Lua script lifecycles.
 *
 * Reacts to ECS events (component-changed, entity-removed) to create
 * and destroy script slots, and runs the per-frame hook pipeline
 * during `update()`.
 */
export function createScriptingAdapter(
  params: CreateScriptingAdapterParams,
): SceneSystemAdapter {
  const { engine: _engine, sceneId: _sceneId, bridges, ports, sandbox, timeState } = params;
  const resolveSource = params.resolveSource ?? (() => Promise.resolve(null));
  const eventBus = createScriptEventBus();
  const slots = new Map<string, ScriptSlotState>();
  const bridgePorts: BridgePorts = ports ?? {};

  /** Pending async slot initializations. */
  const pending = new Map<string, Promise<void>>();

  function initSlot(scene: SceneState, entityId: string, scriptId: string, properties: Record<string, unknown>): void {
    const key = slotKey(entityId, scriptId);
    if (slots.has(key) || pending.has(key)) return;

    const init = async () => {
      const source = await resolveSource(scriptId);
      if (!source) return;

      const declaredHooks = sandbox.detectHooks(source);
      const slot = createScriptSlot(entityId, scriptId, properties, declaredHooks);
      const ctx = createScriptBridgeContext(scene, entityId, bridges, bridgePorts);

      sandbox.createSlot(key, source, ctx, slot.properties);
      slot.sandboxHandle = key;
      slots.set(key, slot);

      sandbox.callHook(key, 'init', 0);
      if (slot.enabled) sandbox.callHook(key, 'onEnable', 0);
    };

    const promise = init().catch(() => {
      /* slot creation failed — slot stays unregistered */
    }).finally(() => {
      pending.delete(key);
    });

    pending.set(key, promise);
  }

  function destroySlot(entityId: string, scriptId: string): void {
    const key = slotKey(entityId, scriptId);
    const slot = slots.get(key);
    if (!slot) return;

    if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
    sandbox.callHook(key, 'onDestroy', 0);
    sandbox.destroySlot(key);
    eventBus.removeSlot(key);
    slots.delete(key);
  }

  function destroyAllSlotsForEntity(entityId: string): void {
    for (const [key, slot] of slots) {
      if (slot.entityId === entityId) {
        if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
        sandbox.callHook(key, 'onDestroy', 0);
        sandbox.destroySlot(key);
        eventBus.removeSlot(key);
        slots.delete(key);
      }
    }
  }

  function syncPropertiesForSlot(scene: SceneState, slot: ScriptSlotState): void {
    const entity = scene.entities.get(slot.entityId);
    if (!entity) return;

    const scriptComp = entity.components.get('script') as
      | { scripts: Array<{ scriptId: string; properties: Record<string, unknown> }> }
      | undefined;
    if (!scriptComp) return;

    const ref = scriptComp.scripts.find((s) => s.scriptId === slot.scriptId);
    if (!ref) return;

    const changed = diffProperties(slot.properties, ref.properties);
    if (changed.length === 0) return;

    applyPropertyChanges(slot.properties, ref.properties, changed);
    const key = slot.sandboxHandle as string;
    sandbox.syncProperties(key, slot.properties);

    for (const k of changed) {
      sandbox.callHook(key, 'onPropertyChanged', 0, k, slot.properties[k]);
    }
  }

  return {
    handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void {
      if (event.kind === 'component-changed' && event.componentType === 'script') {
        reconcileScriptSlots(scene, event.entityId);
      }

      if (event.kind === 'entity-removed') {
        destroyAllSlotsForEntity(event.entityId);
      }

      if (event.kind === 'scene-teardown') {
        for (const [key, slot] of slots) {
          if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
          sandbox.callHook(key, 'onDestroy', 0);
          sandbox.destroySlot(key);
        }
        slots.clear();
        eventBus.dispose();
      }
    },

    update(scene: SceneState, dt: number): void {
      timeState.delta = dt;
      timeState.elapsed += dt;
      timeState.frameCount++;

      for (const slot of slots.values()) {
        if (!slot.enabled) continue;
        syncPropertiesForSlot(scene, slot);
      }

      runHookOnAll('earlyUpdate', dt);
      eventBus.flush();

      for (const hook of FRAME_HOOKS) {
        if (hook === 'earlyUpdate') continue;
        runHookOnAll(hook, dt);
      }

      flushDirtyToECS(scene);
    },

    dispose() {
      for (const [key, slot] of slots) {
        if (slot.enabled) sandbox.callHook(key, 'onDisable', 0);
        sandbox.callHook(key, 'onDestroy', 0);
        sandbox.destroySlot(key);
      }
      slots.clear();
      eventBus.dispose();
      sandbox.dispose();
    },
  };

  function reconcileScriptSlots(scene: SceneState, entityId: string): void {
    const entity = scene.entities.get(entityId);
    if (!entity) return;

    const scriptComp = entity.components.get('script') as
      | { scripts: Array<{ scriptId: string; enabled: boolean; properties: Record<string, unknown> }> }
      | undefined;

    const desired = new Set<string>();

    if (scriptComp) {
      for (const ref of scriptComp.scripts) {
        const key = slotKey(entityId, ref.scriptId);
        desired.add(key);

        if (!slots.has(key) && !pending.has(key)) {
          initSlot(scene, entityId, ref.scriptId, ref.properties);
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
        destroySlot(entityId, slot.scriptId);
      }
    }
  }

  function runHookOnAll(hook: string, dt: number): void {
    for (const [key, slot] of slots) {
      if (!slot.enabled) continue;
      if (!slot.declaredHooks.has(hook as never)) continue;

      const success = sandbox.callHook(key, hook, dt);
      if (!success) {
        slot.enabled = false;
      }
    }
  }

  function flushDirtyToECS(scene: SceneState): void {
    for (const slot of slots.values()) {
      if (slot.dirtyKeys.size === 0) continue;

      const entity = scene.entities.get(slot.entityId);
      if (!entity) continue;

      const scriptComp = entity.components.get('script') as
        | { scripts: Array<{ scriptId: string; properties: Record<string, unknown> }> }
        | undefined;
      if (!scriptComp) continue;

      const ref = scriptComp.scripts.find((s) => s.scriptId === slot.scriptId);
      if (!ref) continue;

      for (const key of slot.dirtyKeys) {
        ref.properties[key] = slot.properties[key];
      }
      slot.dirtyKeys.clear();
    }
  }
}
