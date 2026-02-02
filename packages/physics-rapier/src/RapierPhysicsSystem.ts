import type { ComponentEvent, ComponentListener, Entity, Vec3Like } from "@duckengine/ecs";
import { BaseColliderComponent } from "@duckengine/ecs";
import type {
  AnyColliderComponent,
  GravityComponent,
  RigidBodyComponent,
} from "@duckengine/ecs";
import type { IPhysicsSystem, PhysicsTimestepConfig, PhysicsCollisionEvent } from "@duckengine/core";
import { getRapier } from "./rapier/RapierInit";
import { RapierBodies } from "./internal/RapierBodies";
import { RapierColliders } from "./internal/RapierColliders";
import { RapierCollisionEvents } from "./internal/RapierCollisionEvents";

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
 * - Rapier uses quaternions; conversion is handled via shared Math3D utilities in @duckengine/ecs.
 */
export class RapierPhysicsSystem implements IPhysicsSystem {
  private readonly R = getRapier();
  private world: any;
  private eventQueue: any;
  private accumulatorSeconds = 0;
  private fixedStepSeconds = 1 / 60;
  private maxSubSteps = 5;

  private entities = new Map<string, Entity>();
  private componentListeners = new Map<string, ComponentListener>();

  private readonly bodies: RapierBodies;
  private readonly collisions: RapierCollisionEvents;
  private readonly colliders: RapierColliders;

  constructor() {
    // Gravity is opt-in via GravityComponent. Default world gravity is zero.
    this.world = new this.R.World({ x: 0, y: 0, z: 0 });
    // Collect collision start/stop events.
    this.eventQueue = new this.R.EventQueue(true);

    this.bodies = new RapierBodies();
    this.collisions = new RapierCollisionEvents();
    this.colliders = new RapierColliders(this.R, this.world, this.bodies, this.collisions);
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

    // Listen to component add/remove so physics objects can be created/destroyed at runtime.
    if (!this.componentListeners.has(entity.id)) {
      const listener: ComponentListener = (ev: ComponentEvent) => {
        if (!this.entities.has(ev.entity.id)) return;
        if (ev.action === "added") {
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
      try {
        entity.addComponentListener(listener);
      } catch {}
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

    const l = this.componentListeners.get(id);
    if (l && ent) {
      try {
        ent.removeComponentListener(l);
      } catch {}
    }
    this.componentListeners.delete(id);

    // Remove collider first, then body.
    this.colliders.removeEntityCollider(id);
    this.bodies.removeEntityBody(this.world, id);

    this.entities.delete(id);
  }

  update(dtMs: number): void {
    const dt = Math.max(0, dtMs) / 1000;
    this.accumulatorSeconds += Math.min(dt, 0.25);

    // Update gravity from ECS if any gravity component exists.
    // Current simple heuristic: scan bodies map for an entity with gravity.
    // In a later iteration this should be scene/world-driven.
    try {
      const g = this.findGravity();
      if (g) this.world.gravity = { x: g[0], y: g[1], z: g[2] };
      else this.world.gravity = { x: 0, y: 0, z: 0 };
    } catch {}

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
    try {
      if (this.world.integrationParameters)
        this.world.integrationParameters.dt = dtSeconds;
    } catch {}

    this.bodies.syncKinematicBodiesFromEcs((id) => this.getEntity(id));

    try {
      this.world.step(this.eventQueue);
    } catch {
      this.world.step();
    }

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
    try {
      this.world.free?.();
    } catch {}
    this.entities.clear();
    this.componentListeners.clear();
    this.colliders.dispose();
    this.bodies.dispose();
    this.collisions.dispose();
  }

  private getEntity(_id: string): Entity | null {
    return this.entities.get(_id) ?? null;
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
}

export default RapierPhysicsSystem;
