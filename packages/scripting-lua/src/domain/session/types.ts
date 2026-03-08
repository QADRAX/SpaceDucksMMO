import type { ScriptSchema } from '@duckengine/core-v2';
import type { ScriptSlotState } from '../slots';
import type { ScriptEventBus } from '../events';
import type { BridgeDeclaration, BridgePorts, TimeState } from '../bridges';
import type { ScriptSandbox } from '../ports';

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
  /** In-frame event bus for script-to-script communication. */
  readonly eventBus: ScriptEventBus;
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
}
