import type {
  EntityId,
  PropertyValues,
  ScriptSchema,
  SceneEventBus,
  SceneEventBusProviderPort,
  SceneId,
} from '@duckengine/core-v2';
import type { ScriptSlotState } from '../slots';
import type { BridgeDeclaration, BridgePorts, TimeState } from '../bridges';
import type { ScriptSandbox } from '../ports';

/** Entry for a script slot waiting for its resource to load. */
export interface PendingScriptEntry {
  readonly entityId: EntityId;
  readonly scriptId: string;
  readonly properties: PropertyValues;
}

/**
 * Aggregate root for a scripting session.
 *
 * Holds all mutable state managed by the scripting adapter:
 * active slots, pending initializations, event bus, time, and
 * references to the sandbox and bridge configuration.
 */
export interface ScriptingSessionState {
  /** Active script slots keyed by `slotKey(entityId, scriptId)`. */
  readonly slots: Map<string, ScriptSlotState>;
  /** Pending async slot initializations. */
  readonly pending: Map<string, Promise<void>>;
  /** Scripts waiting for resource-loaded (resolveSource returned null). */
  readonly pendingScripts: PendingScriptEntry[];
  /** In-frame event bus for script-to-script communication. */
  readonly eventBus: SceneEventBus;
  /** Scene ID for teardown (unregisterSceneBus). */
  readonly sceneId?: SceneId;
  /** Provider for unregistering bus on teardown. */
  readonly sceneEventBusProvider?: SceneEventBusProviderPort;
  /** Time state updated once per frame before hook execution. */
  readonly timeState: TimeState;
  /** The sandbox runtime (wasmoon or mock). */
  readonly sandbox: ScriptSandbox;
  /** Bridge declarations to install per slot. */
  readonly bridges: ReadonlyArray<BridgeDeclaration>;
  /** External ports for bridges that need infra (physics, input, gizmo). */
  readonly ports: BridgePorts;
  /** Resolves a scriptId to source code. */
  readonly resolveSource: (scriptId: string) => Promise<string | null>;
  /** Resolves a scriptId to its schema. */
  readonly resolveScriptSchema: (scriptId: string) => Promise<ScriptSchema | null>;
  /** Entity IDs queued for destruction (processed after frame hooks). */
  readonly pendingDestroys: EntityId[];
}
