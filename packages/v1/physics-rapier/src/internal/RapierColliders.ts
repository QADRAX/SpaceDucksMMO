import type { Entity } from "@duckengine/core";
import {
  applyQuatToVec,
  quatFromEulerYXZ,
  quatInvert,
  quatMul,
  quatNormalize,
  type QuatLike,
} from "@duckengine/core";
import { BaseColliderComponent } from "@duckengine/core";
import type {
  AnyColliderComponent,
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  RigidBodyComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
} from "@duckengine/core";
import type RapierBodies from "./RapierBodies";
import type RapierCollisionEvents from "./RapierCollisionEvents";

function callOptional(receiver: any, methodName: string, ...args: any[]): void {
  const fn = receiver?.[methodName];
  if (typeof fn !== "function") return;
  fn.call(receiver, ...args);
}

function callRequired(receiver: any, methodName: string, nameForError: string, ...args: any[]): void {
  const fn = receiver?.[methodName];
  if (typeof fn !== "function") {
    throw new Error(`Rapier binding missing required method: ${nameForError}`);
  }
  fn.call(receiver, ...args);
}

/**
 * Responsible for mapping ECS collider components to Rapier colliders.
 *
 * Supports:
 * - colliders on the same entity as a rigidBody
 * - compound colliders: colliders on child entities attach to nearest rigidBody ancestor
 * - colliders without any rigidBody owner are ignored by physics
 */
export class RapierColliders {
  readonly colliderByEntity = new Map<string, any>();

  constructor(
    private readonly R: any,
    private readonly world: any,
    private readonly bodies: RapierBodies,
    private readonly collisions: RapierCollisionEvents
  ) { }

  removeEntityCollider(entityId: string): void {
    const collider = this.colliderByEntity.get(entityId);
    if (!collider) return;

    const handle = typeof collider.handle === "number" ? (collider.handle as number) : undefined;
    if (handle !== undefined) callOptional(this.collisions, "unregisterColliderHandle", handle);

    if (typeof this.world.removeCollider === "function") {
      this.world.removeCollider(collider, true);
    } else {
      callRequired(this.world, "removeCollider", "World.removeCollider", collider, true);
    }

    // If this collider was on a standalone fixed body created by ensureCollider,
    // we should ideally clean up the body too if it was specifically for this.
    // For now we assume the coordinator handles body removal via removeEntityBody.

    this.colliderByEntity.delete(entityId);
  }

  ensureCollider(entity: Entity, col: AnyColliderComponent): void {
    if (this.colliderByEntity.has(entity.id)) return;

    // 1. Find or create a body to host this collider.
    let bodyOwner = this.findNearestRigidBodyOwner(entity);
    let body = bodyOwner ? this.bodies.bodyByEntity.get(bodyOwner.id) : undefined;

    // If no rigid body in hierarchy, create a static fixed body for this collider.
    if (!body) {
      bodyOwner = entity;
      // We use the RapierBodies adapter to manage the body.
      // This ensures it has the correct initial translation/rotation from the entity.
      const rbComp = {
        type: "rigidBody",
        bodyType: "static",
        enabled: true,
      } as any;
      this.bodies.ensureRigidBody((this as any).R, this.world, entity, rbComp);
      body = this.bodies.bodyByEntity.get(entity.id);
    }

    if (!body || !bodyOwner) return;

    // 2. Compute local pose relative to that body.
    const local = this.getLocalPoseRelativeTo(bodyOwner, entity);
    const { desc, localCenterShift } = this.createColliderDesc(entity, col, local.scale);

    callOptional(
      desc,
      "setTranslation",
      local.pos.x + localCenterShift.x,
      local.pos.y + localCenterShift.y,
      local.pos.z + localCenterShift.z
    );
    callOptional(desc, "setRotation", local.rot);

    const collider = this.world.createCollider(desc, body);
    this.colliderByEntity.set(entity.id, collider);

    const createdHandle = collider.handle as number;
    callOptional(this.collisions, "registerColliderHandle", createdHandle, entity.id, bodyOwner.id);
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
    col: AnyColliderComponent,
    scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 }
  ): { desc: any; localCenterShift: { x: number; y: number; z: number } } {
    let desc: any;
    let localCenterShift = { x: 0, y: 0, z: 0 };

    // Rapier (and most physics engines) require strictly positive shape dimensions.
    // We allow users to model "flat" colliders in the editor by using 0 on one axis,
    // but clamp to a tiny epsilon for the runtime shape.
    const EPS = 0.000001;
    const absScale = { x: Math.abs(scale.x), y: Math.abs(scale.y), z: Math.abs(scale.z) };

    switch (col.type) {
      case "sphereCollider":
        // Use max scale component for sphere to ensure it encases the intended volume if non-uniform.
        const s = Math.max(absScale.x, absScale.y, absScale.z);
        desc = this.R.ColliderDesc.ball(col.radius * s);
        break;
      case "boxCollider":
        desc = this.R.ColliderDesc.cuboid(
          Math.max(EPS, col.halfExtents.x * absScale.x),
          Math.max(EPS, col.halfExtents.y * absScale.y),
          Math.max(EPS, col.halfExtents.z * absScale.z)
        );
        break;
      case "capsuleCollider": {
        const avgSide = (absScale.x + absScale.z) / 2;
        desc = this.R.ColliderDesc.capsule(col.halfHeight * absScale.y, col.radius * avgSide);
        break;
      }
      case "cylinderCollider": {
        const avgSide = (absScale.x + absScale.z) / 2;
        desc = this.R.ColliderDesc.cylinder(col.halfHeight * absScale.y, col.radius * avgSide);
        break;
      }
      case "coneCollider": {
        const avgSide = (absScale.x + absScale.z) / 2;
        desc = this.R.ColliderDesc.cone(col.halfHeight * absScale.y, col.radius * avgSide);
        break;
      }
      case "terrainCollider": {
        const hf = col.heightfield;
        const sx = (hf.size.x * absScale.x) / Math.max(1, hf.columns - 1);
        const sz = (hf.size.z * absScale.z) / Math.max(1, hf.rows - 1);
        const s = { x: sx, y: absScale.y, z: sz };
        desc = this.R.ColliderDesc.heightfield(hf.rows, hf.columns, hf.heights, s);
        localCenterShift = { x: (-hf.size.x * absScale.x) / 2, y: 0, z: (-hf.size.z * absScale.z) / 2 };
        break;
      }
      default:
        desc = this.R.ColliderDesc.ball(0.5);
        break;
    }

    if (col.friction !== undefined) callOptional(desc, "setFriction", col.friction);
    if (col.restitution !== undefined) callOptional(desc, "setRestitution", col.restitution);
    if (col.isSensor) callOptional(desc, "setSensor", true);

    callOptional(desc, "setActiveEvents", this.R.ActiveEvents.COLLISION_EVENTS);
    callOptional(desc, "setActiveCollisionTypes", this.R.ActiveCollisionTypes.ALL);
    callOptional(desc, "setUserData", { entityId: entity.id });

    return { desc, localCenterShift };
  }

  private getLocalPoseRelativeTo(
    root: Entity,
    child: Entity
  ): { pos: { x: number; y: number; z: number }; rot: QuatLike; scale: { x: number; y: number; z: number } } {
    // Compute the relative pose using *local* transforms only.
    // This avoids Transform.world* getter side-effects (which trigger onChange) and
    // correctly supports deep hierarchies.
    const path: Entity[] = [];
    let cur: Entity | undefined = child;
    while (cur && cur !== root) {
      path.push(cur);
      cur = cur.parent;
    }
    if (cur !== root) {
      return { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } };
    }

    let pos = { x: 0, y: 0, z: 0 };
    let rot: QuatLike = { x: 0, y: 0, z: 0, w: 1 };
    let scale = { x: 1, y: 1, z: 1 };

    for (const node of path.reverse()) {
      const lp = node.transform.localPosition;
      const lq = quatNormalize(quatFromEulerYXZ(node.transform.localRotation));
      const ls = node.transform.localScale;

      const rotated = applyQuatToVec(lp, rot);
      // Position is affected by the inherited scale up to this point
      pos = {
        x: pos.x + rotated.x * scale.x,
        y: pos.y + rotated.y * scale.y,
        z: pos.z + rotated.z * scale.z,
      };

      rot = quatMul(rot, lq);
      scale = { x: scale.x * ls.x, y: scale.y * ls.y, z: scale.z * ls.z };
    }

    return { pos, rot, scale };
  }
}

export default RapierColliders;
