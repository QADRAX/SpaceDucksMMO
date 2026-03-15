import type {
  EntityId,
  SubsystemPortKey,
  GizmoPort,
  InputPort,
  PhysicsQueryPort,
  SceneState,
  ScriptSchema,
  UISlotOperationsPort,
} from '@duckengine/core-v2';

/** Bridge API object exposed to Lua. Keys are method names, values are callable. */
export type BridgeAPI = Record<string, unknown>;

/**
 * Session passed to bridge factories. Typed as unknown to avoid circular import.
 * Callers pass ScriptingSessionState; bridges that need it cast as needed.
 */
export type BridgeSession = unknown;

/** Factory signature for a single bridge. */
export type BridgeFactory = (
  scene: SceneState,
  entityId: EntityId,
  schema: ScriptSchema | null,
  ports: BridgePorts,
  session?: BridgeSession,
) => BridgeAPI;

/** Declaration of a bridge that can be installed into the sandbox. */
export interface BridgeDeclaration {
  /** Name used as the Lua global (e.g. 'Transform', 'Scene'). */
  readonly name: string;
  /** Whether the bridge is scoped per-entity (`true`) or global (`false`). */
  readonly perEntity: boolean;
  /** Factory that produces the bridge API object. */
  readonly factory: BridgeFactory;
}

/** Gizmo port shape used by the bridge. */
export type GizmoPortShape = Pick<GizmoPort, 'drawLine' | 'drawSphere' | 'drawBox' | 'drawLabel' | 'drawGrid' | 'clear'>;

/** External ports that bridges may optionally consume. */
export interface BridgePorts {
  readonly physicsQuery?: PhysicsQueryPort;
  /** Gizmo port. Available at createState time (rendering registers in onSceneAdded). */
  readonly getGizmo?: () => GizmoPortShape | undefined;
  /** @deprecated Use getGizmo() for dynamic resolution. Static fallback for tests. */
  readonly gizmo?: GizmoPortShape;
  readonly input?: InputPort;
  readonly uiSlotOperations?: UISlotOperationsPort;
}

/** Bridge names exposed as Engine.Input, Engine.Gizmo, etc. (not on self). */
export const ENGINE_SYSTEM_BRIDGES: ReadonlySet<string> = new Set([
  'Input',
  'Gizmo',
  'Physics',
  'Time',
]);

/** Default engine-level subsystem port keys consumed by scripting bridges. */
export const SCRIPTING_BRIDGE_PORT_KEYS: Readonly<Record<Exclude<keyof BridgePorts, 'getGizmo'>, SubsystemPortKey>> = {
  physicsQuery: 'io:physics-query',
  gizmo: 'io:gizmo',
  input: 'io:input',
  uiSlotOperations: 'uiSlotOperations',
};

/** Resolved bridge APIs keyed by bridge name. */
export type ScriptBridgeContext = Readonly<Record<string, BridgeAPI>>;

/**
 * Asserts string (from Lua) as EntityId for scene.entities lookup.
 * Use when receiving entity IDs from script calls.
 */
export function toEntityId(s: string): EntityId {
  return s as EntityId;
}

/**
 * Time bridge state, updated once per frame by the adapter
 * before any hook execution.
 */
export interface TimeState {
  delta: number;
  elapsed: number;
  frameCount: number;
  scale: number;
}
