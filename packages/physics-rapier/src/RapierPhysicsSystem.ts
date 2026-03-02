import type { ComponentEvent, ComponentListener, Entity, Vec3Like, IComponentObserver, ComponentType } from "@duckengine/core";
import { BaseColliderComponent } from "@duckengine/core";
import type {
  AnyColliderComponent,
  GravityComponent,
  RigidBodyComponent,
} from "@duckengine/core";
import type {
  IPhysicsSystem,
  PhysicsTimestepConfig,
  PhysicsCollisionEvent,
  IPhysicsPerformanceProfile,
  PhysicsPerformanceStats,
} from "@duckengine/core";
import {
  PROFILE_STABLE,
  PROFILE_BALANCED,
  PROFILE_PERFORMANCE,
  PROFILE_STACKED,
  PROFILE_EXTREME,
  PROFILE_OPEN_WORLD,
} from "@duckengine/core";
import { getRapier } from "./rapier/RapierInit";
import type { RapierModule } from "./rapier/RapierInit";
import type { EventQueue, World } from "@dimforge/rapier3d-compat";
import { RapierBodies } from "./internal/RapierBodies";
import { RapierColliders } from "./internal/RapierColliders";
import { RapierCollisionEvents } from "./internal/RapierCollisionEvents";
import { RapierEcsUpdateCoordinator } from "./internal/RapierEcsUpdateCoordinator";

/**
 * Rapier-backed physics system.
 *
 * Responsibilities:
 * - Keep a Rapier world in sync with ECS entities/components.
 * - Create/remove rigid bodies and colliders as components appear/disappear.
 * - Support compound colliders (child collider entities attach to nearest rigidBody ancestor).
 * - Provide an engine-level collision event stream (enter/stay/exit).
 *
 * Coordinate & rotation conventions:
 * - World axes match Three.js (right-handed).
 * - ECS Transform rotations use Euler order YXZ (see TransformSync).
 * - Rapier uses quaternions; conversion is handled via shared Math3D utilities in @duckengine/core.
 */
export class RapierPhysicsSystem implements IPhysicsSystem {
  private readonly R: RapierModule = getRapier();
  private world: World;
  private eventQueue: EventQueue;
  private disposed = false;
  private accumulatorSeconds = 0;
  private fixedStepSeconds = 1 / 60;
  private maxSubSteps = 5;

  private entities = new Map<string, Entity>();
  private componentListeners = new Map<string, ComponentListener>();

  private entitySubscriptions = new Map<string, () => void>();
  private componentObserversByEntity = new Map<string, IComponentObserver>();

  private readonly bodies: RapierBodies;
  private readonly collisions: RapierCollisionEvents;
  private readonly colliders: RapierColliders;
  private readonly updates: RapierEcsUpdateCoordinator;

  private currentProfile: IPhysicsPerformanceProfile | null = null;

  constructor() {
    // Gravity is opt-in via GravityComponent. Default world gravity is zero.
    this.world = new this.R.World({ x: 0, y: 0, z: 0 });
    // Collect collision start/stop events.
    this.eventQueue = new this.R.EventQueue(true);

    this.bodies = new RapierBodies();
    this.collisions = new RapierCollisionEvents();
    this.colliders = new RapierColliders(this.R, this.world, this.bodies, this.collisions);
    this.updates = new RapierEcsUpdateCoordinator(
      this.R,
      this.world,
      this.bodies,
      this.colliders,
      (id) => this.getEntity(id)
    );
  }

  configureTimestep(cfg: PhysicsTimestepConfig): void {
    if (cfg.fixedStepSeconds !== undefined)
      this.fixedStepSeconds = Math.max(1 / 240, Math.min(1 / 15, cfg.fixedStepSeconds));
    if (cfg.maxSubSteps !== undefined)
      this.maxSubSteps = Math.max(1, Math.min(50, cfg.maxSubSteps));
  }

  addEntity(entity: Entity): void {
    this.addEntityRecursive(entity);
  }

  private addEntityRecursive(entity: Entity): void {
    this.entities.set(entity.id, entity);

    // Observe component + transform changes so inspector edits propagate to Rapier.
    this.attachEntityObservers(entity);

    // Listen to component add/remove so physics objects can be created/destroyed at runtime.
    if (!this.componentListeners.has(entity.id)) {
      const listener: ComponentListener = (ev: ComponentEvent) => {
        if (!this.entities.has(ev.entity.id)) return;
        if (ev.action === "added") {
          const obs = this.componentObserversByEntity.get(ev.entity.id);
          if (obs) ev.component.addObserver(obs);

          if (ev.component.type === "rigidBody") {
            const rb = ev.component as unknown as RigidBodyComponent;
            this.bodies.ensureRigidBody(this.R, this.world, ev.entity, rb);

            // If a rigid body is added later, colliders in the subtree should now attach to it.
            // Remove and recreate them so they re-bind to the new rigid body owner.
            this.colliders.removeCollidersInSubtree(ev.entity);
            this.colliders.ensureCollidersInSubtree(ev.entity);
          }
          if (ev.component instanceof BaseColliderComponent) {
            this.colliders.ensureCollider(ev.entity, ev.component as AnyColliderComponent);
          }
        }

        if (ev.action === "removed") {
          const obs = this.componentObserversByEntity.get(ev.entity.id);
          if (obs) ev.component.removeObserver(obs);

          if (ev.component instanceof BaseColliderComponent) {
            this.colliders.removeEntityCollider(ev.entity.id);
          }
          if (ev.component.type === "rigidBody") {
            // If a rigid body goes away, all colliders in its subtree were attached to it.
            // Remove those colliders explicitly first, then remove the body.
            this.colliders.removeCollidersInSubtree(ev.entity);
            this.bodies.removeEntityBody(this.world, ev.entity.id);
          }
          if (ev.component.type === "gravity") {
            // gravity is queried per step; no action required.
          }
        }
      };
      this.componentListeners.set(entity.id, listener);
      entity.addComponentListener(listener);
    }

    // create body if component exists
    const rb = entity.getComponent<RigidBodyComponent>("rigidBody");
    if (rb) this.bodies.ensureRigidBody(this.R, this.world, entity, rb);

    const col = this.colliders.getColliderComponent(entity);
    if (col) this.colliders.ensureCollider(entity, col);

    for (const child of entity.getChildren()) this.addEntityRecursive(child);
  }

  removeEntity(id: string): void {
    const ent = this.entities.get(id);
    if (ent) {
      for (const child of ent.getChildren()) this.removeEntity(child.id);
    }

    this.detachEntityObservers(id);

    const l = this.componentListeners.get(id);
    if (l && ent) {
      ent.removeComponentListener(l);
    }
    this.componentListeners.delete(id);

    // Remove collider first, then body.
    this.colliders.removeEntityCollider(id);
    this.bodies.removeEntityBody(this.world, id);

    this.updates.removeEntity(id);

    this.entities.delete(id);
  }

  update(dtMs: number): void {
    if (this.disposed) return;

    // Apply any queued ECS->Rapier updates outside of a simulation step.
    this.updates.flushPendingUpdates();

    const dt = Math.max(0, dtMs) / 1000;
    this.accumulatorSeconds += Math.min(dt, 0.25);

    // Update gravity from ECS if any gravity component exists.
    // Current simple heuristic: scan bodies map for an entity with gravity.
    // In a later iteration this should be scene/world-driven.
    const g = this.findGravity();
    if (g) this.world.gravity = { x: g[0], y: g[1], z: g[2] };
    else this.world.gravity = { x: 0, y: 0, z: 0 };

    let subSteps = 0;
    while (this.accumulatorSeconds >= this.fixedStepSeconds && subSteps < this.maxSubSteps) {
      this.stepOnce(this.fixedStepSeconds);
      this.accumulatorSeconds -= this.fixedStepSeconds;
      subSteps += 1;
    }
  }

  private stepOnce(dtSeconds: number): void {
    // Rapier world step uses internal timestep.
    // Some builds expose `integrationParameters.dt`; guard.
    if (this.world.integrationParameters) this.world.integrationParameters.dt = dtSeconds;

    this.bodies.syncKinematicBodiesFromEcs((id) => this.getEntity(id));

    // Our codebase expects EventQueue stepping support; if this throws, it's a bug we should see.
    this.world.step(this.eventQueue);

    this.collisions.drain(this.eventQueue);

    this.bodies.writeBackDynamicBodiesToEcs((id) => this.getEntity(id));
  }

  applyImpulse(entityId: string, impulse: Vec3Like): void {
    this.bodies.applyImpulse(entityId, impulse);
  }

  applyForce(entityId: string, force: Vec3Like): void {
    this.bodies.applyForce(entityId, force);
  }

  getLinearVelocity(entityId: string): Vec3Like | null {
    return this.bodies.getLinearVelocity(entityId);
  }

  subscribeCollisions(listener: (ev: PhysicsCollisionEvent) => void): () => void {
    return this.collisions.subscribe(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.world.free?.();

    for (const id of Array.from(this.entitySubscriptions.keys())) {
      this.detachEntityObservers(id);
    }
    this.updates.dispose();
    this.entities.clear();
    this.componentListeners.clear();
    this.colliders.dispose();
    this.bodies.dispose();
    this.collisions.dispose();
  }

  private getEntity(_id: string): Entity | null {
    return this.entities.get(_id) ?? null;
  }

  private attachEntityObservers(entity: Entity): void {
    if (this.entitySubscriptions.has(entity.id)) return;

    const componentObserver: IComponentObserver = {
      onComponentChanged: (entityId: string, componentType: ComponentType) => {
        this.updates.onComponentChanged(entityId, componentType);
      },
      onComponentRemoved: (entityId: string, componentType: ComponentType) => {
        // Component removal also triggers updates
        this.updates.onComponentChanged(entityId, componentType);
      },
    };

    const transformListener = () => {
      this.updates.onTransformChanged(entity.id);
    };

    this.componentObserversByEntity.set(entity.id, componentObserver);

    for (const comp of entity.getAllComponents()) {
      comp.addObserver(componentObserver);
    }

    entity.transform.onChange(transformListener);

    const cleanup = () => {
      for (const comp of entity.getAllComponents()) {
        comp.removeObserver(componentObserver);
      }
      entity.transform.removeOnChange(transformListener);
      this.componentObserversByEntity.delete(entity.id);
    };

    this.entitySubscriptions.set(entity.id, cleanup);
  }

  private detachEntityObservers(entityId: string): void {
    const cleanup = this.entitySubscriptions.get(entityId);
    if (!cleanup) return;
    cleanup();
    this.entitySubscriptions.delete(entityId);
    this.componentObserversByEntity.delete(entityId);
  }

  private findGravity(): [number, number, number] | null {
    for (const ent of this.entities.values()) {
      const g = ent.getComponent<GravityComponent>("gravity");
      if (!g) continue;
      if (g.enabled === false) continue;
      return [g.gravity[0], g.gravity[1], g.gravity[2]];
    }
    return null;
  }

  // ============================================================================
  // PERFORMANCE OPTIMIZATION METHODS
  // ============================================================================

  /**
   * Configure the constraint solver iterations
   * Higher = more stable but slower
   * Default: 4
   * 
   * Useful for tuning performance in high-load scenarios:
   * - 1: Extreme performance (very unstable)
   * - 2: High performance (reduced stability, for stacks)
   * - 3: Balanced
   * - 4: Very stable (default)
   */
  setSolverIterations(iterations: number): void {
    if (!this.world.integrationParameters) return;
    const clamped = Math.max(1, Math.min(20, iterations));
    this.world.integrationParameters.numSolverIterations = clamped;
  }

  /**
   * Get current solver iterations
   */
  getSolverIterations(): number {
    if (!this.world.integrationParameters) return 4;
    return this.world.integrationParameters.numSolverIterations || 4;
  }

  /**
   * Force a rigid body to sleep
   * Sleeping bodies cost 0 CPU until woken
   * Useful for optimizing scenes with many at-rest objects
   */
  forceSleepBody(entityId: string): void {
    const body = this.bodies.bodyByEntity.get(entityId);
    if (!body || !body.sleep) return;
    body.sleep();
  }

  /**
   * Force a rigid body to wake up
   * Waking a body enables its simulation
   */
  forceWakeBody(entityId: string): void {
    const body = this.bodies.bodyByEntity.get(entityId);
    if (!body || !body.wakeUp) return;
    body.wakeUp();
  }

  /**
   * Sleep all bodies that have negligible velocity
   * Useful for performance optimization before intensive frames
   * 
   * @param velocityThreshold - Velocity below which bodies are slept (m/s, default: 0.01)
   */
  sleepSlowBodies(velocityThreshold: number = 0.01): void {
    for (const [, body] of this.bodies.bodyByEntity) {
      if (!body.linvel || !body.sleep) continue;
      
      const vel = body.linvel();
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
      
      if (speed < velocityThreshold) {
        body.sleep();
      }
    }
  }

  /**
   * Wake all bodies
   * Useful for resetting simulation after culling
   */
  wakeAllBodies(): void {
    for (const [, body] of this.bodies.bodyByEntity) {
      if (body.wakeUp) {
        body.wakeUp();
      }
    }
  }

  /**
   * Cull bodies outside a distance from a reference point
   * Culled bodies are slept; others are awoken
   * 
   * This is a simple form of physics LOD
   * 
   * @param center - Reference point (usually camera position)
   * @param range - Distance at which bodies are simulated
   * 
   * @example
   * ```typescript
   * // Each frame, cull bodies far from camera
   * physics.cullBodiesByDistance(cameraPos, 100); // Simulate within 100m
   * ```
   */
  cullBodiesByDistance(
    center: { x: number; y: number; z: number },
    range: number
  ): { activeCount: number; culledCount: number } {
    let activeCount = 0;
    let culledCount = 0;

    for (const [entityId, body] of this.bodies.bodyByEntity) {
      if (!body.translation) continue;

      const pos = body.translation();
      const dist = Math.sqrt(
        Math.pow(pos.x - center.x, 2) +
        Math.pow(pos.y - center.y, 2) +
        Math.pow(pos.z - center.z, 2)
      );

      if (dist < range) {
        if (body.wakeUp) body.wakeUp();
        activeCount++;
      } else {
        if (body.sleep) body.sleep();
        culledCount++;
      }
    }

    return { activeCount, culledCount };
  }

  /**
   * Get performance stats about the current simulation
   * Useful for monitoring and optimization
   */
  getPerformanceStats(): {
    totalBodies: number;
    activeBodies: number;
    totalColliders: number;
    solverIterations: number;
  } {
    let activeBodies = 0;
    
    for (const [, body] of this.bodies.bodyByEntity) {
      // A body is active if it's not sleeping
      // (Rapier doesn't expose this directly, so we estimate)
      if (body.isSleeping && !body.isSleeping()) {
        activeBodies++;
      } else if (!body.isSleeping) {
        activeBodies++; // Fallback: assume awake
      }
    }

    return {
      totalBodies: this.bodies.bodyByEntity.size,
      activeBodies,
      totalColliders: this.colliders.colliderByEntity.size,
      solverIterations: this.getSolverIterations(),
    };
  }

  /**
   * Apply a complete performance profile atomically.
   * This configures solver iterations, damping, and LOD settings in one call.
   */
  applyPerformanceProfile(profile: IPhysicsPerformanceProfile): void {
    // Store the current profile for queries
    this.currentProfile = profile;

    // Apply solver configuration
    const solverCfg = profile.solver;
    this.setSolverIterations(solverCfg.iterations);

    // Apply damping to all existing bodies
    // Future bodies will use this config via the ECS system
    if (solverCfg.defaultLinearDamping > 0 || solverCfg.defaultAngularDamping > 0) {
      for (const [, body] of this.bodies.bodyByEntity) {
        if (body.setLinearDamping) body.setLinearDamping(solverCfg.defaultLinearDamping);
        if (body.setAngularDamping) body.setAngularDamping(solverCfg.defaultAngularDamping);
      }
    }

    // Apply sleeping configuration if specified
    if (solverCfg.autoSleep === true) {
      this.sleepSlowBodies();
    }

    // Apply LOD configuration if enabled
    if (profile.lod && profile.lod.enabled) {
      // LOD culling would be called per-frame with the configured distance
      // For now, we just store the config; actual culling happens in step()
      // Implementation: User calls cullBodiesByDistance(center, profile.lod.cullingDistance) each frame
    }
  }

  /**
   * Get the currently active performance profile, if any.
   */
  getCurrentProfile(): IPhysicsPerformanceProfile | null {
    return this.currentProfile;
  }

  /**
   * Get list of available predefined performance profiles.
   */
  getAvailableProfiles(): IPhysicsPerformanceProfile[] {
    return [
      PROFILE_STABLE,
      PROFILE_BALANCED,
      PROFILE_PERFORMANCE,
      PROFILE_STACKED,
      PROFILE_EXTREME,
      PROFILE_OPEN_WORLD,
    ];
  }
}

export default RapierPhysicsSystem;
