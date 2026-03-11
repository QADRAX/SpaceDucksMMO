import type {
  SubsystemPortKey,
  GizmoPort,
  InputPort,
  PhysicsQueryPort,
  SceneState,
  ScriptSchema,
  UISlotOperationsPort,
} from '@duckengine/core-v2';

/** Factory signature for a single bridge. */
export type BridgeFactory = (
  scene: SceneState,
  entityId: string,
  schema: ScriptSchema | null,
  ports: BridgePorts,
  session?: import('../session').ScriptingSessionState,
) => Record<string, unknown>;

/** Declaration of a bridge that can be installed into the sandbox. */
export interface BridgeDeclaration {
  /** Name used as the Lua global (e.g. 'Transform', 'Scene'). */
  readonly name: string;
  /** Whether the bridge is scoped per-entity (`true`) or global (`false`). */
  readonly perEntity: boolean;
  /** Factory that produces the bridge API object. */
  readonly factory: BridgeFactory;
}

/** External ports that bridges may optionally consume. */
export interface BridgePorts {
  readonly physicsQuery?: PhysicsQueryPort;
  readonly gizmo?: Pick<GizmoPort, 'drawLine' | 'drawSphere' | 'drawBox' | 'drawLabel' | 'clear'>;
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
export const SCRIPTING_BRIDGE_PORT_KEYS: Readonly<Record<keyof BridgePorts, SubsystemPortKey>> = {
  physicsQuery: 'io:physics-query',
  gizmo: 'io:gizmo',
  input: 'io:input',
  uiSlotOperations: 'uiSlotOperations',
};

/** Resolved bridge APIs keyed by bridge name. */
export type ScriptBridgeContext = Readonly<Record<string, Record<string, unknown>>>;

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
