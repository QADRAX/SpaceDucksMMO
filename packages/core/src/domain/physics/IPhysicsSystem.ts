import type { Entity, Vec3Like } from "../ecs";
import type {
  PhysicsCollisionEvent,
  PhysicsRay,
  PhysicsRaycastHit,
  PhysicsTimestepConfig
} from "./PhysicsTypes";

export interface IPhysicsSystem {
  /** Add an entity (and typically its children) to the physics simulation. */
  addEntity(entity: Entity): void;

  /** Remove an entity (and typically its children) from the physics simulation. */
  removeEntity(id: string): void;

  /** Per-frame update. The provided dt is in milliseconds (same convention as scenes/components). */
  update(dtMs: number): void;

  /** Dispose and release resources. */
  dispose(): void;

  /** Optional: configure fixed timestep behavior. */
  configureTimestep?(cfg: PhysicsTimestepConfig): void;

  /** Optional: apply an impulse (instant velocity change) to an entity rigid body. */
  applyImpulse?(entityId: string, impulse: Vec3Like): void;

  /** Optional: apply a continuous force to an entity rigid body (will be reset by backend each step). */
  applyForce?(entityId: string, force: Vec3Like): void;

  /** Optional: read an entity rigid body's linear velocity (world space). */
  getLinearVelocity?(entityId: string): Vec3Like | null;

  /** Optional: raycast into the physics world. */
  raycast?(ray: PhysicsRay): PhysicsRaycastHit | null;

  /** Optional: subscribe to collision events (enter/stay/exit). Returns unsubscribe. */
  subscribeCollisions?(listener: (ev: PhysicsCollisionEvent) => void): () => void;
}

export default IPhysicsSystem;
