import type { SceneState, EntityState, DiagnosticPort } from '@duckengine/core-v2';
import type { RigidBodyComponent, GravityComponent } from '@duckengine/core-v2';
import { getComponent, ensureClean } from '@duckengine/core-v2';
import type { World } from '@dimforge/rapier3d-compat';
import { getEntity, DEFAULT_FIXED_STEP, DEFAULT_MAX_SUBSTEPS } from '../domain';
import { getRapier } from './rapier';
import { createRapierBodies } from './rapierBodies';
import { createRapierColliders } from './rapierColliders';
import { createRapierCollisionEvents } from './rapierCollisionEvents';
import type { PhysicsWorldState } from './types';

export interface CreatePhysicsWorldStateOptions {
  /** Diagnostic port from engine; use for all logging (no console.*). */
  diagnostic?: DiagnosticPort;
  /** Scene id for log context. */
  sceneId?: string;
}

/**
 * Creates the physics world state for one scene (one Rapier World, one EventQueue).
 */
export function createPhysicsWorldState(options?: CreatePhysicsWorldStateOptions): PhysicsWorldState {
  const { diagnostic, sceneId } = options ?? {};
  const R = getRapier();
  const world = new R.World({ x: 0, y: 0, z: 0 });
  const eventQueue = new R.EventQueue(true);
  const bodies = createRapierBodies();
  const collisions = createRapierCollisionEvents();
  const colliders = createRapierColliders();

  diagnostic?.log('debug', 'Physics world created', { subsystem: 'physics-rapier', sceneId });

  let accumulator = 0;
  let fixedStepSeconds = DEFAULT_FIXED_STEP;
  let maxSubSteps = DEFAULT_MAX_SUBSTEPS;
  let disposed = false;

  function addEntity(scene: SceneState, entity: EntityState): void {
    if (disposed) return;
    ensureClean(entity.transform);
    const rb = getComponent(entity, 'rigidBody') as RigidBodyComponent | undefined;
    if (rb) {
      bodies.ensureRigidBody(R, world, entity, rb);
      colliders.removeCollidersInSubtree(
        world,
        scene,
        entity,
        bodies,
        collisions
      );
      colliders.ensureCollidersInSubtree(R, world, entity, bodies, collisions);
    }
    const col = colliders.getColliderComponent(entity);
    if (col) colliders.ensureCollider(R, world, entity, col, bodies, collisions);
    for (const child of entity.children) addEntity(scene, child);
  }

  function removeEntity(scene: SceneState, entityId: string): void {
    if (disposed) return;
    const entity = getEntity(scene, entityId);
    if (entity) {
      for (const ch of entity.children) removeEntity(scene, ch.id);
    }
    colliders.removeEntityCollider(world, entityId, collisions);
    bodies.removeEntityBody(world, entityId);
  }

  function step(scene: SceneState, dtMs: number): void {
    if (disposed) return;
    collisions.clearAccumulatedEvents();
    const dt = Math.max(0, dtMs) / 1000;
    accumulator += Math.min(dt, 0.25);

    let gx = 0,
      gy = 0,
      gz = 0;
    for (const entity of scene.entities.values()) {
      const g = getComponent(entity, 'gravity') as (GravityComponent & { enabled?: boolean }) | undefined;
      if (g && g.enabled !== false) {
        gx = g.x;
        gy = g.y;
        gz = g.z;
        break;
      }
    }
    world.gravity = { x: gx, y: gy, z: gz };

    const getEnt = (id: string) => getEntity(scene, id);
    let subSteps = 0;
    while (accumulator >= fixedStepSeconds && subSteps < maxSubSteps) {
      if ((world as World & { integrationParameters?: { dt: number } }).integrationParameters) {
        (world as World & { integrationParameters: { dt: number } }).integrationParameters.dt =
          fixedStepSeconds;
      }
      bodies.syncKinematicBodiesFromEcs(getEnt);
      world.step(eventQueue);
      collisions.drain(eventQueue as unknown as { drainCollisionEvents?(cb: (h1: number, h2: number, started: boolean) => void): void });
      bodies.writeBackDynamicBodiesToEcs(getEnt);
      accumulator -= fixedStepSeconds;
      subSteps += 1;
    }
  }

  function syncEntity(scene: SceneState, entityId: string): void {
    const entity = getEntity(scene, entityId);
    if (!entity || disposed) return;
    colliders.removeEntityCollider(world, entityId, collisions);
    const rb = getComponent(entity, 'rigidBody') as RigidBodyComponent | undefined;
    if (rb) {
      // Recreate body so rigidBody changes (bodyType, mass, gravityScale, etc.) are applied.
      colliders.removeCollidersInSubtree(
        world,
        scene,
        entity,
        bodies,
        collisions
      );
      bodies.removeEntityBody(world, entityId);
      bodies.ensureRigidBody(R, world, entity, rb);
      colliders.ensureCollidersInSubtree(R, world, entity, bodies, collisions);
    } else {
      bodies.removeEntityBody(world, entityId);
      const col = colliders.getColliderComponent(entity);
      if (col) colliders.ensureCollider(R, world, entity, col, bodies, collisions);
    }
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    diagnostic?.log('debug', 'Physics world disposed', { subsystem: 'physics-rapier', sceneId });
    bodies.dispose();
    colliders.dispose();
    collisions.dispose();
    if (typeof (world as World & { free?: () => void }).free === 'function') {
      (world as World & { free: () => void }).free();
    }
  }

  const state: PhysicsWorldState = {
    diagnostic,
    addEntity,
    removeEntity,
    step,
    syncEntity,
    dispose,
    world,
    collisions,
  };
  return state;
}
