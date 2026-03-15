import type { SceneId, EntityId } from '@duckengine/core-v2';
import {
  createEntity,
  createComponent,
  createSceneId,
  createEntityId,
  setPosition,
  setScale,
  ensureClean,
  addChild,
} from '@duckengine/core-v2';
import type { DuckEngineAPI } from '@duckengine/core-v2';
import type { PhysicsQueryPort, PhysicsCollisionEvent } from '@duckengine/core-v2';
import type { EngineState } from '@duckengine/core-v2';
import { PHYSICS_QUERY_PORT_ID } from '@duckengine/core-v2';

const DEFAULT_SCENE_ID = createSceneId('main');
const DEFAULT_ENTITY_ID = createEntityId('e1');

/** RigidBody options including joint to parent (for child entities). */
export type RigidBodyOptions = {
  bodyType?: 'static' | 'dynamic' | 'kinematic';
  withBoxCollider?: boolean;
  jointToParent?: 'fixed' | 'revolute' | 'spherical' | null;
};

/** Spec for one collider in a compound: entity id and collider type + optional params. */
export type CompoundColliderSpec = {
  entityId: EntityId;
  type: 'boxCollider' | 'sphereCollider' | 'capsuleCollider';
  halfExtents?: { x: number; y: number; z: number };
  radius?: number;
  halfHeight?: number;
};

/**
 * Creates a scene and adds one entity. Returns the scene API.
 */
export function addSceneWithEntity(
  api: DuckEngineAPI,
  sceneId: SceneId = DEFAULT_SCENE_ID,
  entityId: EntityId = DEFAULT_ENTITY_ID,
): ReturnType<DuckEngineAPI['scene']> {
  api.addScene({ sceneId });
  const scene: ReturnType<DuckEngineAPI['scene']> = api.scene(sceneId);
  scene.addEntity({ entity: createEntity(entityId) });
  return scene;
}

/**
 * Adds a rigidBody component (and optionally a boxCollider) to the entity.
 */
export function addEntityWithRigidBody(
  api: DuckEngineAPI,
  sceneId: SceneId,
  entityId: EntityId,
  options: RigidBodyOptions = {},
): void {
  addRigidBodyToEntity(api, sceneId, entityId, options);
}

/**
 * Adds a static rigidBody and boxCollider (e.g. for a floor).
 */
export function addEntityWithStaticFloor(
  api: DuckEngineAPI,
  sceneId: SceneId,
  entityId: EntityId,
  halfExtents = { x: 5, y: 0.5, z: 5 },
): void {
  const scene = api.scene(sceneId);
  scene.entity(entityId).addComponent({
    component: createComponent('rigidBody', { bodyType: 'static' }),
  });
  scene.entity(entityId).addComponent({
    component: createComponent('boxCollider', { halfExtents }),
  });
}

/**
 * Runs N engine update frames (each runs the physics phase).
 * @param dtSec - Delta time in seconds per frame (default 1/60 ≈ 0.0167)
 */
export function runFrames(
  api: DuckEngineAPI,
  count: number,
  dtSec = 1 / 60,
): void {
  for (let i = 0; i < count; i++) {
    api.update({ dt: dtSec });
  }
}

/**
 * Returns the physics query port for the scene (registered by the physics subsystem).
 */
export function getPhysicsPort(
  engine: EngineState,
  sceneId: SceneId,
): PhysicsQueryPort | undefined {
  const scene = engine.scenes.get(sceneId);
  if (!scene) return undefined;
  return scene.scenePorts.get(PHYSICS_QUERY_PORT_ID) as PhysicsQueryPort | undefined;
}

/**
 * Sets entity local position (for test setup). Mutates engine state directly.
 */
export function setEntityPosition(
  engine: EngineState,
  sceneId: SceneId,
  entityId: EntityId,
  x: number,
  y: number,
  z: number,
): void {
  const scene = engine.scenes.get(sceneId);
  const entity = scene?.entities.get(entityId);
  if (entity) setPosition(entity.transform, x, y, z);
}

/**
 * Sets entity local scale (for test setup). Mutates engine state directly.
 */
export function setEntityScale(
  engine: EngineState,
  sceneId: SceneId,
  entityId: EntityId,
  x: number,
  y: number,
  z: number,
): void {
  const scene = engine.scenes.get(sceneId);
  const entity = scene?.entities.get(entityId);
  if (entity) setScale(entity.transform, x, y, z);
}

/**
 * Returns entity world position after ensuring transform is clean.
 */
export function getEntityWorldPosition(
  engine: EngineState,
  sceneId: SceneId,
  entityId: EntityId,
): { x: number; y: number; z: number } | undefined {
  const scene = engine.scenes.get(sceneId);
  const entity = scene?.entities.get(entityId);
  if (!entity) return undefined;
  ensureClean(entity.transform);
  return { ...entity.transform.worldPosition };
}

/**
 * Adds a scene and a parent entity with a child entity (hierarchy). Both are in the scene.
 * Use this before adding rigidBody/joint or compound colliders so parent exists when child is synced.
 */
export function addSceneWithParentChild(
  api: DuckEngineAPI,
  sceneId: SceneId,
  parentId: EntityId,
  childId: EntityId,
): void {
  api.addScene({ sceneId });
  const parent = createEntity(parentId);
  const child = createEntity(childId);
  addChild(parent, child);
  api.scene(sceneId).addEntity({ entity: parent });
}

/**
 * Adds rigidBody (and optional boxCollider) to an existing entity. For joint tests, add parent then child rigidBody with jointToParent.
 */
export function addRigidBodyToEntity(
  api: DuckEngineAPI,
  sceneId: SceneId,
  entityId: EntityId,
  options: RigidBodyOptions = {},
): void {
  const scene = api.scene(sceneId);
  const rb = createComponent('rigidBody', {
    bodyType: options.bodyType ?? 'dynamic',
    jointToParent: options.jointToParent ?? null,
  });
  scene.entity(entityId).addComponent({ component: rb });
  if (options.withBoxCollider) {
    scene.entity(entityId).addComponent({
      component: createComponent('boxCollider', { halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }),
    });
  }
}

/**
 * Adds a root entity with multiple child entities; root has rigidBody, each child has one collider (compound collider).
 * Children are attached to the root's rigid body in physics.
 * If scene already exists, use addCompoundCollidersToScene instead to avoid adding the scene again.
 */
export function addEntityWithCompoundColliders(
  api: DuckEngineAPI,
  sceneId: SceneId,
  rootId: EntityId,
  children: CompoundColliderSpec[],
): void {
  api.addScene({ sceneId });
  addCompoundCollidersToScene(api, sceneId, rootId, children);
}

/**
 * Adds compound structure (root + children) to scene. Call setEntityPosition before addCompoundPhysicsToScene.
 */
export function addCompoundStructureToScene(
  api: DuckEngineAPI,
  sceneId: SceneId,
  rootId: EntityId,
  children: CompoundColliderSpec[],
): void {
  const root = createEntity(rootId);
  for (const spec of children) {
    const child = createEntity(spec.entityId);
    addChild(root, child);
  }
  api.scene(sceneId).addEntity({ entity: root });
}

/**
 * Adds rigidBody and colliders to an existing compound structure. Set positions first via setEntityPosition.
 */
export function addCompoundPhysicsToScene(
  api: DuckEngineAPI,
  sceneId: SceneId,
  rootId: EntityId,
  children: CompoundColliderSpec[],
): void {
  const scene = api.scene(sceneId);
  scene.entity(rootId).addComponent({
    component: createComponent('rigidBody', { bodyType: 'dynamic' }),
  });
  for (const spec of children) {
    if (spec.type === 'boxCollider') {
      scene.entity(spec.entityId).addComponent({
        component: createComponent('boxCollider', {
          halfExtents: spec.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 },
        }),
      });
    } else if (spec.type === 'sphereCollider') {
      scene.entity(spec.entityId).addComponent({
        component: createComponent('sphereCollider', { radius: spec.radius ?? 0.5 }),
      });
    } else if (spec.type === 'capsuleCollider') {
      scene.entity(spec.entityId).addComponent({
        component: createComponent('capsuleCollider', {
          radius: spec.radius ?? 0.5,
          halfHeight: spec.halfHeight ?? 0.5,
        }),
      });
    }
  }
}

/** Adds compound structure + physics in one call. Use addCompoundStructureToScene + setEntityPosition + addCompoundPhysicsToScene for position-before-physics. */
export function addCompoundCollidersToScene(
  api: DuckEngineAPI,
  sceneId: SceneId,
  rootId: EntityId,
  children: CompoundColliderSpec[],
): void {
  addCompoundStructureToScene(api, sceneId, rootId, children);
  addCompoundPhysicsToScene(api, sceneId, rootId, children);
}

/**
 * Returns accumulated collision events from the physics port for the scene.
 */
export function getCollisionEvents(
  engine: EngineState,
  sceneId: SceneId,
): PhysicsCollisionEvent[] {
  const port = getPhysicsPort(engine, sceneId);
  return port?.getCollisionEvents() ?? [];
}
