import type { Entity } from "@duckengine/ecs";
import {
  applyQuatToVec,
  quatFromEulerYXZ,
  quatInvert,
  quatMul,
  quatNormalize,
  type QuatLike,
} from "@duckengine/ecs";
import { BaseColliderComponent } from "@duckengine/ecs";
import type {
  AnyColliderComponent,
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  RigidBodyComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
} from "@duckengine/ecs";
import type RapierBodies from "./RapierBodies";
import type RapierCollisionEvents from "./RapierCollisionEvents";

/**
 * Responsible for mapping ECS collider components to Rapier colliders.
 *
 * Supports:
 * - colliders on the same entity as a rigidBody
 * - compound colliders: colliders on child entities attach to nearest rigidBody ancestor
 * - standalone colliders: entities with collider but without rigidBody get a fixed body host
 */
export class RapierColliders {
  readonly colliderByEntity = new Map<string, any>();

  constructor(
    private readonly R: any,
    private readonly world: any,
    private readonly bodies: RapierBodies,
    private readonly collisions: RapierCollisionEvents
  ) {}

  removeEntityCollider(entityId: string): void {
    const collider = this.colliderByEntity.get(entityId);
    if (!collider) return;
    try {
      const handle = typeof collider.handle === "number" ? (collider.handle as number) : undefined;
      if (handle !== undefined) this.collisions.unregisterColliderHandle(handle);
    } catch {}
    try {
      this.world.removeCollider(collider, true);
    } catch {}
    this.colliderByEntity.delete(entityId);
  }

  ensureCollider(entity: Entity, col: AnyColliderComponent): void {
    if (this.colliderByEntity.has(entity.id)) return;

    const { desc, localCenterShift } = this.createColliderDesc(entity, col);

    const bodyOwner = this.findNearestRigidBodyOwner(entity);
    if (bodyOwner) {
      const body = this.bodies.bodyByEntity.get(bodyOwner.id);
      if (body) {
        const local = this.getLocalPoseRelativeTo(bodyOwner, entity);
        try {
          desc.setTranslation(
            local.pos.x + localCenterShift.x,
            local.pos.y + localCenterShift.y,
            local.pos.z + localCenterShift.z
          );
        } catch {}
        try {
          desc.setRotation?.(local.rot);
        } catch {}

        const collider = this.world.createCollider(desc, body);
        this.colliderByEntity.set(entity.id, collider);
        try {
          const handle = collider.handle as number;
          this.collisions.registerColliderHandle(handle, entity.id, bodyOwner.id);
        } catch {}
        return;
      }
    }

    // No rigid body found: create as standalone collider by attaching to a fixed body.
    const fixedDesc = this.R.RigidBodyDesc.fixed();
    const wp = entity.transform.worldPosition;
    fixedDesc.setTranslation(wp.x, wp.y, wp.z);
    try {
      const wr = entity.transform.worldRotation;
      const q = quatNormalize(quatFromEulerYXZ(wr));
      fixedDesc.setRotation?.(q);
    } catch {}
    const fixed = this.world.createRigidBody(fixedDesc);
    this.bodies.bodyByEntity.set(entity.id, fixed);

    try {
      desc.setTranslation(localCenterShift.x, localCenterShift.y, localCenterShift.z);
    } catch {}

    const collider = this.world.createCollider(desc, fixed);
    this.colliderByEntity.set(entity.id, collider);
    try {
      const handle = collider.handle as number;
      this.collisions.registerColliderHandle(handle, entity.id, entity.id);
    } catch {}
  }

  ensureCollidersInSubtree(root: Entity): void {
    const visit = (e: Entity) => {
      const c = this.getColliderComponent(e);
      if (c) this.ensureCollider(e, c);
      for (const child of e.getChildren()) visit(child);
    };
    visit(root);
  }

  removeCollidersInSubtree(root: Entity): void {
    const visit = (e: Entity) => {
      this.removeEntityCollider(e.id);
      const hasRb = !!e.getComponent<RigidBodyComponent>("rigidBody");
      if (!hasRb) this.bodies.removeEntityBody(this.world, e.id);
      for (const child of e.getChildren()) visit(child);
    };
    visit(root);
  }

  getColliderComponent(entity: Entity): AnyColliderComponent | undefined {
    return (
      entity.getComponent<SphereColliderComponent>("sphereCollider") ||
      entity.getComponent<BoxColliderComponent>("boxCollider") ||
      entity.getComponent<CapsuleColliderComponent>("capsuleCollider") ||
      entity.getComponent<CylinderColliderComponent>("cylinderCollider") ||
      entity.getComponent<ConeColliderComponent>("coneCollider") ||
      entity.getComponent<TerrainColliderComponent>("terrainCollider")
    );
  }

  /**
   * Nearest rigidBody ancestor (including self). Creates the rapier body if missing.
   */
  findNearestRigidBodyOwner(entity: Entity): Entity | null {
    let cur: Entity | undefined = entity;
    while (cur) {
      const rb = cur.getComponent<RigidBodyComponent>("rigidBody");
      if (rb) {
        this.bodies.ensureRigidBody(this.R, this.world, cur, rb);
        return cur;
      }
      cur = cur.parent;
    }
    return null;
  }

  dispose(): void {
    this.colliderByEntity.clear();
  }

  // ---- internals ------------------------------------------------------

  private createColliderDesc(
    entity: Entity,
    col: AnyColliderComponent
  ): { desc: any; localCenterShift: { x: number; y: number; z: number } } {
    let desc: any;
    let localCenterShift = { x: 0, y: 0, z: 0 };

    switch (col.type) {
      case "sphereCollider":
        desc = this.R.ColliderDesc.ball(col.radius);
        break;
      case "boxCollider":
        desc = this.R.ColliderDesc.cuboid(col.halfExtents.x, col.halfExtents.y, col.halfExtents.z);
        break;
      case "capsuleCollider":
        desc = this.R.ColliderDesc.capsule(col.halfHeight, col.radius);
        break;
      case "cylinderCollider":
        desc = this.R.ColliderDesc.cylinder(col.halfHeight, col.radius);
        break;
      case "coneCollider":
        desc = this.R.ColliderDesc.cone(col.halfHeight, col.radius);
        break;
      case "terrainCollider": {
        const hf = col.heightfield;
        const sx = hf.size.x / Math.max(1, hf.columns - 1);
        const sz = hf.size.z / Math.max(1, hf.rows - 1);
        const scale = { x: sx, y: 1, z: sz };
        desc = this.R.ColliderDesc.heightfield(hf.rows, hf.columns, hf.heights, scale);
        localCenterShift = { x: -hf.size.x / 2, y: 0, z: -hf.size.z / 2 };
        break;
      }
      default:
        desc = this.R.ColliderDesc.ball(0.5);
        break;
    }

    if (col.friction !== undefined) desc.setFriction(col.friction);
    if (col.restitution !== undefined) desc.setRestitution(col.restitution);
    if (col.isSensor) desc.setSensor(true);

    try {
      desc.setActiveEvents(this.R.ActiveEvents.COLLISION_EVENTS);
    } catch {}

    try {
      desc.setActiveCollisionTypes(this.R.ActiveCollisionTypes.ALL);
    } catch {}

    try {
      desc.setUserData({ entityId: entity.id });
    } catch {}

    return { desc, localCenterShift };
  }

  private getLocalPoseRelativeTo(root: Entity, child: Entity): { pos: { x: number; y: number; z: number }; rot: QuatLike } {
    const rw = root.transform.worldPosition;
    const cw = child.transform.worldPosition;

    const rqr = quatNormalize(quatFromEulerYXZ(root.transform.worldRotation));
    const cqr = quatNormalize(quatFromEulerYXZ(child.transform.worldRotation));
    const invRoot = quatInvert(rqr);

    const dp = { x: cw.x - rw.x, y: cw.y - rw.y, z: cw.z - rw.z };
    const localPos = applyQuatToVec(dp, invRoot);
    const localRot = quatMul(invRoot, cqr);
    return { pos: localPos, rot: localRot };
  }
}

export default RapierColliders;
