import type { Entity, Vec3Like } from "../ecs";
import type {
  PhysicsCollisionEvent,
  PhysicsRay,
  PhysicsRaycastHit,
  PhysicsTimestepConfig,
  PhysicsPerformanceStats
} from "./PhysicsTypes";
import type { IPhysicsPerformanceProfile } from "./PhysicsPerformanceProfile";

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

  /** Apply an impulse (instant velocity change) to an entity rigid body. */
  applyImpulse(entityId: string, impulse: Vec3Like): void;

  /** Apply a continuous force to an entity rigid body (will be reset by backend each step). */
  applyForce(entityId: string, force: Vec3Like): void;

  /** Read an entity rigid body's linear velocity (world space). */
  getLinearVelocity(entityId: string): Vec3Like | null;

  /** Optional: raycast into the physics world. */
  raycast?(ray: PhysicsRay): PhysicsRaycastHit | null;

  /** Optional: subscribe to collision events (enter/stay/exit). Returns unsubscribe. */
  subscribeCollisions?(listener: (ev: PhysicsCollisionEvent) => void): () => void;

  // ============= Performance Optimization Methods =============

  /** Configure the number of constraint solver iterations per frame (1-20). Lower = faster but less stable. Default: 4. */
  setSolverIterations(iterations: number): void;

  /** Get the current number of constraint solver iterations. */
  getSolverIterations(): number;

  /** Automatically put bodies moving slower than the threshold to sleep (0 CPU cost). */
  sleepSlowBodies(velocityThreshold: number): void;

  /** Force a specific body to sleep immediately. */
  forceSleepBody(entityId: string): void;

  /** Force a specific body to wake up. */
  forceWakeBody(entityId: string): void;

  /** Wake all currently sleeping bodies. Typically called after culling operations. */
  wakeAllBodies(): void;

  /** 
   * Apply physics LOD culling: only simulate bodies within range of center.
   * Bodies outside range are put to sleep. Use for open-world optimization.
   * @param center - Center position for culling calculation
   * @param range - Radius in meters (bodies outside are culled)
   */
  cullBodiesByDistance(center: Vec3Like, range: number): void;

  /** Get real-time performance statistics about the physics simulation. */
  getPerformanceStats(): PhysicsPerformanceStats;

  // ============= Performance Profile Management =============

  /**
   * Apply a complete performance profile to the physics system.
   * Profiles are pre-configured sets of solver, damping, and LOD settings.
   * All settings are updated atomically.
   * @param profile - The performance profile to apply
   */
  applyPerformanceProfile(profile: IPhysicsPerformanceProfile): void;

  /**
   * Get the currently active performance profile.
   * Returns the profile that was last applied via applyPerformanceProfile().
   */
  getCurrentProfile(): IPhysicsPerformanceProfile | null;

  /**
   * List all available performance profiles (predefined or custom).
   * Useful for runtime selection UI or dynamic switching.
   */
  getAvailableProfiles(): IPhysicsPerformanceProfile[];
}

export default IPhysicsSystem;
