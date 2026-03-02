import type { Vec3Like } from "../ecs";

/** Fixed-timestep settings for a physics simulation. */
export interface PhysicsTimestepConfig {
  /** Fixed step in seconds. Default: 1/60. */
  fixedStepSeconds?: number;
  /** Max substeps per frame to avoid spiral-of-death. Default: 5. */
  maxSubSteps?: number;
}

export type PhysicsRay = {
  origin: Vec3Like;
  direction: Vec3Like;
  maxDistance?: number;
};

export type PhysicsRaycastHit = {
  entityId: string;
  point: Vec3Like;
  normal: Vec3Like;
  distance: number;
};

export type PhysicsCollisionEventKind = "enter" | "stay" | "exit";

export type PhysicsCollisionEvent = {
  kind: PhysicsCollisionEventKind;
  /** Entity id of the rigidbody owner (or collider entity if no rigidbody). */
  a: string;
  b: string;
  /** Optional collider entity ids if you want per-collider granularity. */
  colliderA?: string;
  colliderB?: string;
};

/** Real-time performance statistics from the physics simulation. */
export interface PhysicsPerformanceStats {
  /** Total number of rigid bodies in the simulation. */
  totalBodies: number;
  /** Number of active (awake) rigid bodies currently being simulated. */
  activeBodies: number;
  /** Total number of colliders in the simulation. */
  totalColliders: number;
  /** Current constraint solver iterations per frame. */
  solverIterations: number;
}
