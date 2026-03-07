/** Ordered lifecycle hook names. */
export type ScriptHook =
  | 'init'
  | 'onEnable'
  | 'earlyUpdate'
  | 'update'
  | 'lateUpdate'
  | 'onDrawGizmos'
  | 'onCollisionEnter'
  | 'onCollisionExit'
  | 'onPropertyChanged'
  | 'onDisable'
  | 'onDestroy';

/** Hooks called once per frame in this exact order. */
export const FRAME_HOOKS: ReadonlyArray<ScriptHook> = [
  'earlyUpdate',
  'update',
  'lateUpdate',
  'onDrawGizmos',
] as const;

/** Full lifecycle order (registration → per-frame → teardown). */
export const LIFECYCLE_ORDER: ReadonlyArray<ScriptHook> = [
  'init',
  'onEnable',
  'earlyUpdate',
  'update',
  'lateUpdate',
  'onDrawGizmos',
  'onDisable',
  'onDestroy',
] as const;

/** Runtime state of a single script instance bound to an entity. */
export interface ScriptSlotState {
  readonly entityId: string;
  readonly scriptId: string;
  enabled: boolean;
  /** Properties synced from ECS. Mutated during property sync phase. */
  properties: Record<string, unknown>;
  /** Keys changed since last sync (outbound: Lua → ECS). */
  readonly dirtyKeys: Set<string>;
  /** Hooks the script declared (sparse — only declared hooks are present). */
  readonly declaredHooks: Set<ScriptHook>;
  /** Opaque handle used by the sandbox implementation to locate this slot. */
  sandboxHandle: unknown;
}
