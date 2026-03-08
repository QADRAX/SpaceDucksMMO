import type { SceneState, ScriptSchema } from '@duckengine/core-v2';

/** Factory signature for a single bridge. */
export type BridgeFactory = (
  scene: SceneState,
  entityId: string,
  schema: ScriptSchema | null,
  ports: BridgePorts,
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
  readonly physicsQuery?: PhysicsQueryLike;
  readonly gizmo?: GizmoLike;
  readonly input?: InputStateLike;
}

/** Minimal physics query surface (matches core-v2 PhysicsQueryPort). */
export interface PhysicsQueryLike {
  raycast(ray: {
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    maxDistance: number;
  }): { entityId: string; point: { x: number; y: number; z: number }; distance: number } | null;
}

/** Minimal gizmo surface (matches core-v2 GizmoPort). */
export interface GizmoLike {
  drawLine(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }, color?: string): void;
  drawSphere(center: { x: number; y: number; z: number }, radius: number, color?: string): void;
  drawBox(center: { x: number; y: number; z: number }, size: { x: number; y: number; z: number }, color?: string): void;
  drawLabel(text: string, position: { x: number; y: number; z: number }, color?: string): void;
  clear(): void;
}

/** Minimal input state surface for the input bridge. */
export interface InputStateLike {
  isKeyPressed(key: string): boolean;
  getMouseDelta(): { x: number; y: number };
  getMouseButtons(): { left: boolean; right: boolean; middle: boolean };
}

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
