import type { EntityState, ResourceRef, MeshGeometryFileData } from '@duckengine/core-v2';
import type { ColliderComponent, RigidBodyComponent, TrimeshColliderComponent } from '@duckengine/core-v2';
import { getComponent, ensureClean, createComponent } from '@duckengine/core-v2';
import type { World, Collider, ColliderDesc } from '@dimforge/rapier3d-compat';
import { getColliderComponent, getLocalPoseRelativeTo } from '../domain';
import type { RapierModule } from './rapier';
import type { RapierBodiesHandle } from './rapierBodies';
import type { RapierCollisionEventsHandle } from './rapierCollisionEvents';

function callOpt(receiver: unknown, method: string, ...args: unknown[]): void {
  const fn = (receiver as Record<string, unknown>)?.[method];
  if (typeof fn === 'function') (fn as (...a: unknown[]) => void).call(receiver, ...args);
}

export interface RapierCollidersHandle {
  colliderByEntity: Map<string, Collider>;
  ensureCollider(
    R: RapierModule,
    world: World,
    entity: EntityState,
    col: ColliderComponent,
    bodies: RapierBodiesHandle,
    collisions: RapierCollisionEventsHandle
  ): void;
  removeEntityCollider(world: World, entityId: string, collisions: RapierCollisionEventsHandle): void;
  removeCollidersInSubtree(
    world: World,
    scene: { entities: Map<string, EntityState> },
    root: EntityState,
    bodies: RapierBodiesHandle,
    collisions: RapierCollisionEventsHandle
  ): void;
  ensureCollidersInSubtree(
    R: RapierModule,
    world: World,
    root: EntityState,
    bodies: RapierBodiesHandle,
    collisions: RapierCollisionEventsHandle
  ): void;
  getColliderComponent(entity: EntityState): ColliderComponent | undefined;
  findNearestRigidBodyOwner(
    entity: EntityState,
    R: RapierModule,
    world: World,
    bodies: RapierBodiesHandle
  ): EntityState | null;
  dispose(): void;
}

const EPS = 0.000001;

export interface CreateRapierCollidersOptions {
  getMeshData?: (ref: ResourceRef<'mesh'>) => MeshGeometryFileData | null;
}

function createColliderDesc(
  R: RapierModule,
  col: ColliderComponent,
  scale: { x: number; y: number; z: number },
  getMeshData?: (ref: ResourceRef<'mesh'>) => MeshGeometryFileData | null
): { desc: ColliderDesc; localCenterShift: { x: number; y: number; z: number } } {
  const absScale = { x: Math.abs(scale.x), y: Math.abs(scale.y), z: Math.abs(scale.z) };
  let desc: ColliderDesc;
  let localCenterShift = { x: 0, y: 0, z: 0 };

  switch (col.type) {
    case 'sphereCollider':
      const s = Math.max(absScale.x, absScale.y, absScale.z);
      desc = R.ColliderDesc.ball(col.radius * s);
      break;
    case 'boxCollider':
      desc = R.ColliderDesc.cuboid(
        Math.max(EPS, col.halfExtents.x * absScale.x),
        Math.max(EPS, col.halfExtents.y * absScale.y),
        Math.max(EPS, col.halfExtents.z * absScale.z)
      );
      break;
    case 'capsuleCollider': {
      const avgSide = (absScale.x + absScale.z) / 2;
      desc = R.ColliderDesc.capsule(col.halfHeight * absScale.y, col.radius * avgSide);
      break;
    }
    case 'cylinderCollider': {
      const avgSide = (absScale.x + absScale.z) / 2;
      desc = R.ColliderDesc.cylinder(col.halfHeight * absScale.y, col.radius * avgSide);
      break;
    }
    case 'coneCollider': {
      const avgSide = (absScale.x + absScale.z) / 2;
      desc = R.ColliderDesc.cone(col.halfHeight * absScale.y, col.radius * avgSide);
      break;
    }
    case 'terrainCollider': {
      const hf = col.heightfield;
      const sx = (hf.size.x * absScale.x) / Math.max(1, hf.columns - 1);
      const sz = (hf.size.z * absScale.z) / Math.max(1, hf.rows - 1);
      const scaleVec = { x: sx, y: absScale.y, z: sz };
      desc = R.ColliderDesc.heightfield(hf.rows, hf.columns, new Float32Array(hf.heights), scaleVec);
      localCenterShift = {
        x: (-hf.size.x * absScale.x) / 2,
        y: 0,
        z: (-hf.size.z * absScale.z) / 2,
      };
      break;
    }
    case 'trimeshCollider': {
      const tc = col as TrimeshColliderComponent;
      const meshData = tc.mesh && getMeshData ? getMeshData(tc.mesh) : null;
      if (meshData && meshData.positions.length >= 3 && meshData.indices.length >= 3) {
        const positions = meshData.positions;
        const indices = meshData.indices;
        const vertices = new Float32Array(positions.length);
        for (let i = 0; i < positions.length; i += 3) {
          vertices[i] = positions[i] * absScale.x;
          vertices[i + 1] = positions[i + 1] * absScale.y;
          vertices[i + 2] = positions[i + 2] * absScale.z;
        }
        const indices32 = new Uint32Array(indices);
        desc = R.ColliderDesc.trimesh(vertices, indices32);
      } else {
        desc = R.ColliderDesc.ball(0.5);
      }
      break;
    }
    default:
      desc = R.ColliderDesc.ball(0.5);
  }
  if (col.friction !== undefined) callOpt(desc, 'setFriction', col.friction);
  if (col.restitution !== undefined) callOpt(desc, 'setRestitution', col.restitution);
  if (col.isSensor) callOpt(desc, 'setSensor', true);
  callOpt(desc, 'setActiveEvents', R.ActiveEvents?.COLLISION_EVENTS ?? 0xffff);
  return { desc, localCenterShift };
}

export function createRapierColliders(options?: CreateRapierCollidersOptions): RapierCollidersHandle {
  const getMeshData = options?.getMeshData;
  const colliderByEntity = new Map<string, Collider>();

  function ensureCollider(
    R: RapierModule,
    world: World,
    entity: EntityState,
    col: ColliderComponent,
    bodies: RapierBodiesHandle,
    collisions: RapierCollisionEventsHandle
  ): void {
    if (colliderByEntity.has(entity.id)) return;
    let bodyOwner: EntityState | null = findNearestRigidBodyOwner(entity, R, world, bodies);
    let body = bodyOwner ? bodies.bodyByEntity.get(bodyOwner.id) : undefined;
    if (!body) {
      const rbComp = createComponent('rigidBody', { bodyType: 'static' });
      bodies.ensureRigidBody(R, world, entity, rbComp);
      body = bodies.bodyByEntity.get(entity.id);
      bodyOwner = entity;
    }
    if (!body || !bodyOwner) return;
    ensureClean(entity.transform);
    ensureClean(bodyOwner.transform);
    const local = getLocalPoseRelativeTo(bodyOwner, entity);
    const { desc, localCenterShift } = createColliderDesc(R, col, local.scale, getMeshData);
    callOpt(desc, 'setTranslation', local.pos.x + localCenterShift.x, local.pos.y + localCenterShift.y, local.pos.z + localCenterShift.z);
    callOpt(desc, 'setRotation', local.rot);
    const collider = world.createCollider(desc, body);
    colliderByEntity.set(entity.id, collider);
    const handle = (collider as { handle?: number }).handle as number | undefined;
    if (handle !== undefined) {
      collisions.registerColliderHandle(handle, entity.id, bodyOwner.id);
    }
  }

  function removeEntityCollider(
    world: World,
    entityId: string,
    collisions: RapierCollisionEventsHandle
  ): void {
    const collider = colliderByEntity.get(entityId);
    if (!collider) return;
    const handle = (collider as { handle?: number }).handle as number | undefined;
    if (handle !== undefined) collisions.unregisterColliderHandle(handle);
    callOpt(world, 'removeCollider', collider, true);
    colliderByEntity.delete(entityId);
  }

  function   findNearestRigidBodyOwner(
    entity: EntityState,
    R: RapierModule,
    world: World,
    bodies: RapierBodiesHandle
  ): EntityState | null {
    let cur: EntityState | undefined = entity;
    while (cur) {
      const rb = getComponent<RigidBodyComponent>(cur, 'rigidBody');
      if (rb) {
        bodies.ensureRigidBody(R, world, cur, rb);
        return cur;
      }
      cur = cur.parent;
    }
    return null;
  }

  function   removeCollidersInSubtree(
    world: World,
    _scene: { entities: Map<string, EntityState> },
    root: EntityState,
    bodies: RapierBodiesHandle,
    collisions: RapierCollisionEventsHandle
  ): void {
    function visit(e: EntityState): void {
      removeEntityCollider(world, e.id, collisions);
      if (!getComponent(e, 'rigidBody')) {
        bodies.removeEntityBody(world, e.id);
      }
      for (const ch of e.children) visit(ch);
    }
    visit(root);
  }

  function ensureCollidersInSubtree(
    R: RapierModule,
    world: World,
    root: EntityState,
    bodies: RapierBodiesHandle,
    collisions: RapierCollisionEventsHandle
  ): void {
    function visit(e: EntityState): void {
      const c = getColliderComponent(e);
      if (c) ensureCollider(R, world, e, c, bodies, collisions);
      for (const ch of e.children) visit(ch);
    }
    visit(root);
  }

  function dispose(): void {
    colliderByEntity.clear();
  }

  return {
    colliderByEntity,
    ensureCollider,
    removeEntityCollider,
    removeCollidersInSubtree,
    ensureCollidersInSubtree,
    getColliderComponent,
    findNearestRigidBodyOwner,
    dispose,
  };
}
