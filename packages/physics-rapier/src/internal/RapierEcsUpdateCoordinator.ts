import type { Entity } from "@duckengine/ecs";
import {
  applyQuatToVec,
  isColliderComponentType,
  quatFromEulerYXZ,
  quatInvert,
  quatMul,
  quatNormalize,
  type QuatLike,
} from "@duckengine/ecs";
import type { AnyColliderComponent, RigidBodyComponent } from "@duckengine/ecs";
import type {
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
} from "@duckengine/ecs";
import type { RapierModule } from "../rapier/RapierInit";

// Minimal method surface we use from Rapier runtime objects.
export interface IRapierRigidBody {
  setLinearDamping?: (v: number) => void;
  setAngularDamping?: (v: number) => void;
  setGravityScale?: (v: number, wakeUp: boolean) => void;
  setAdditionalMass?: (v: number, wakeUp: boolean) => void;
  sleep?: () => void;
  wakeUp?: () => void;
  setTranslation?: (t: { x: number; y: number; z: number }, wakeUp: boolean) => void;
  setRotation?: (q: QuatLike, wakeUp: boolean) => void;
  setNextKinematicTranslation?: (t: { x: number; y: number; z: number }) => void;
  setNextKinematicRotation?: (q: QuatLike) => void;
}

export interface IRapierCollider {
  setFriction?: (v: number) => void;
  setRestitution?: (v: number) => void;
  setSensor?: (v: boolean) => void;
  setTranslation?: (t: { x: number; y: number; z: number }, wakeUp: boolean) => void;
  setRotation?: (q: QuatLike, wakeUp: boolean) => void;
}

export interface IRapierBodiesAdapter {
  bodyByEntity: Map<string, IRapierRigidBody>;
  ensureRigidBody: (R: RapierModule, world: unknown, entity: Entity, rb: RigidBodyComponent) => void;
  removeEntityBody: (world: unknown, entityId: string) => void;
}

export interface IRapierCollidersAdapter {
  colliderByEntity: Map<string, IRapierCollider>;
  getColliderComponent: (entity: Entity) => AnyColliderComponent | undefined;
  ensureCollider: (entity: Entity, col: AnyColliderComponent) => void;
  removeEntityCollider: (entityId: string) => void;
  removeCollidersInSubtree: (root: Entity) => void;
  ensureCollidersInSubtree: (root: Entity) => void;
  findNearestRigidBodyOwner: (entity: Entity) => Entity | null;
}

export type GetEntityFn = (id: string) => Entity | null;

export class RapierEcsUpdateCoordinator {
  // Pending updates are flushed in a safe point (before stepping).
  private readonly pendingRigidBodyUpdates = new Set<string>();
  private readonly pendingColliderUpdates = new Set<string>();
  private readonly pendingTransformUpdates = new Set<string>();

  // Last-applied snapshots to avoid destructive rebuilds when not needed.
  private readonly rigidBodySigByEntity = new Map<string, string>();
  private readonly rigidBodyTypeByEntity = new Map<string, string>();
  private readonly colliderShapeSigByEntity = new Map<string, string>();
  private readonly colliderMatSigByEntity = new Map<string, string>();
  private readonly colliderLocalPoseSigByEntity = new Map<string, string>();

  constructor(
    private readonly R: RapierModule,
    private readonly world: unknown,
    private readonly bodies: IRapierBodiesAdapter,
    private readonly colliders: IRapierCollidersAdapter,
    private readonly getEntity: GetEntityFn
  ) {}

  dispose(): void {
    this.pendingRigidBodyUpdates.clear();
    this.pendingColliderUpdates.clear();
    this.pendingTransformUpdates.clear();
    this.rigidBodySigByEntity.clear();
    this.rigidBodyTypeByEntity.clear();
    this.colliderShapeSigByEntity.clear();
    this.colliderMatSigByEntity.clear();
    this.colliderLocalPoseSigByEntity.clear();
  }

  removeEntity(id: string): void {
    this.pendingRigidBodyUpdates.delete(id);
    this.pendingColliderUpdates.delete(id);
    this.pendingTransformUpdates.delete(id);
    this.rigidBodySigByEntity.delete(id);
    this.rigidBodyTypeByEntity.delete(id);
    this.colliderShapeSigByEntity.delete(id);
    this.colliderMatSigByEntity.delete(id);
    this.colliderLocalPoseSigByEntity.delete(id);
  }

  onComponentChanged(entityId: string, componentType: string): void {
    const normalizedType = componentType.endsWith(":removed")
      ? componentType.slice(0, -":removed".length)
      : componentType;

    if (normalizedType === "rigidBody") {
      this.pendingRigidBodyUpdates.add(entityId);
      return;
    }

    if (isColliderComponentType(normalizedType)) {
      this.pendingColliderUpdates.add(entityId);
      return;
    }
  }

  onTransformChanged(entityId: string): void {
    this.pendingTransformUpdates.add(entityId);
  }

  flushPendingUpdates(): void {
    if (
      this.pendingRigidBodyUpdates.size === 0 &&
      this.pendingColliderUpdates.size === 0 &&
      this.pendingTransformUpdates.size === 0
    )
      return;

    // Rigid bodies first: collider ownership depends on nearest rigidBody.
    const rbIds = Array.from(this.pendingRigidBodyUpdates);
    this.pendingRigidBodyUpdates.clear();
    for (const id of rbIds) this.applyRigidBodyUpdate(id);

    const colliderIds = Array.from(this.pendingColliderUpdates);
    this.pendingColliderUpdates.clear();
    for (const id of colliderIds) this.applyColliderUpdate(id);

    const transformIds = Array.from(this.pendingTransformUpdates);
    this.pendingTransformUpdates.clear();
    for (const id of transformIds) this.applyTransformUpdate(id);
  }

  private applyRigidBodyUpdate(entityId: string): void {
    const ent = this.getEntity(entityId);
    if (!ent) return;

    const rb = ent.getComponent<RigidBodyComponent>("rigidBody");
    if (!rb) {
      this.bodies.removeEntityBody(this.world, entityId);
      this.rigidBodySigByEntity.delete(entityId);
      this.rigidBodyTypeByEntity.delete(entityId);
      return;
    }

    const body = this.bodies.bodyByEntity.get(entityId);
    const nextSig = this.computeRigidBodySig(rb);
    const prevBodyType = this.rigidBodyTypeByEntity.get(entityId);

    // If the body doesn't exist yet, or bodyType changed, do a rebuild.
    if (!body || (prevBodyType && prevBodyType !== rb.bodyType)) {
      this.rebuildRigidBody(ent);
      return;
    }

    // Update in-place.
    if (rb.linearDamping !== undefined) {
      this.callRequired(body, "setLinearDamping", "RigidBody.setLinearDamping", rb.linearDamping);
    }
    if (rb.angularDamping !== undefined) {
      this.callRequired(body, "setAngularDamping", "RigidBody.setAngularDamping", rb.angularDamping);
    }
    if (rb.gravityScale !== undefined) {
      this.callRequired(body, "setGravityScale", "RigidBody.setGravityScale", rb.gravityScale, true);
    }
    if (rb.mass !== undefined) {
      this.callRequired(body, "setAdditionalMass", "RigidBody.setAdditionalMass", rb.mass, true);
    }

    if (rb.startSleeping) {
      this.callRequired(body, "sleep", "RigidBody.sleep");
    } else {
      // optional: wakeUp may not exist on some builds; treat as required for our codebase.
      this.callRequired(body, "wakeUp", "RigidBody.wakeUp");
    }

    this.rigidBodySigByEntity.set(entityId, nextSig);
    this.rigidBodyTypeByEntity.set(entityId, rb.bodyType);
  }

  private applyColliderUpdate(entityId: string): void {
    const ent = this.getEntity(entityId);
    if (!ent) return;

    const col = this.colliders.getColliderComponent(ent);
    if (!col) {
      this.colliders.removeEntityCollider(entityId);
      this.colliderShapeSigByEntity.delete(entityId);
      this.colliderMatSigByEntity.delete(entityId);
      return;
    }

    const collider = this.colliders.colliderByEntity.get(entityId);
    const nextShape = this.computeColliderShapeSig(col);
    const nextMat = this.computeColliderMaterialSig(col);
    const prevShape = this.colliderShapeSigByEntity.get(entityId);
    const prevMat = this.colliderMatSigByEntity.get(entityId);

    if (!collider) {
      this.colliders.ensureCollider(ent, col);
      this.colliderShapeSigByEntity.set(entityId, nextShape);
      this.colliderMatSigByEntity.set(entityId, nextMat);
      return;
    }

    // If collider exists but we haven't seeded signatures yet (e.g. created via addEntityRecursive),
    // record the current state and avoid a pointless rebuild on the first edit.
    if (prevShape === undefined || prevMat === undefined) {
      this.colliderShapeSigByEntity.set(entityId, nextShape);
      this.colliderMatSigByEntity.set(entityId, nextMat);
      return;
    }

    // Rebuild only if geometry changed.
    if (prevShape !== nextShape) {
      this.rebuildCollider(ent);
      return;
    }

    // Update material properties in-place.
    if (prevMat !== nextMat) {
      if (col.friction !== undefined)
        this.callRequired(collider, "setFriction", "Collider.setFriction", col.friction);
      if (col.restitution !== undefined)
        this.callRequired(collider, "setRestitution", "Collider.setRestitution", col.restitution);
      this.callRequired(collider, "setSensor", "Collider.setSensor", !!col.isSensor);

      this.colliderMatSigByEntity.set(entityId, nextMat);
    }
  }

  private applyTransformUpdate(entityId: string): void {
    const ent = this.getEntity(entityId);
    if (!ent) return;

    const rb = ent.getComponent<RigidBodyComponent>("rigidBody");
    const body = this.bodies.bodyByEntity.get(entityId);

    // Update body pose for static bodies and standalone fixed bodies.
    // Kinematic bodies are synced via RapierBodies.syncKinematicBodiesFromEcs() inside the step.
    if (body && (rb?.bodyType === "static" || !rb)) {
      const wp = ent.transform.worldPosition;
      const wr = ent.transform.worldRotation;
      const q = quatNormalize(quatFromEulerYXZ(wr));

      this.callRequired(
        body,
        "setTranslation",
        "RigidBody.setTranslation",
        { x: wp.x, y: wp.y, z: wp.z },
        true
      );
      this.callRequired(body, "setRotation", "RigidBody.setRotation", q, true);
    }

    // If this entity is a collider attached to a rigidBody ancestor, update its local offset.
    const col = this.colliders.getColliderComponent(ent);
    if (!col) return;
    if (rb) return;

    // Important: child colliders become "dirty" whenever their parent moves.
    // We only want to update the collider's local offset when the collider entity's
    // *local* transform changes (e.g. designer edits), not when the rigid body moves.
    const localPoseSig = JSON.stringify({
      p: ent.transform.localPosition,
      r: ent.transform.localRotation,
    });
    const prevLocalPoseSig = this.colliderLocalPoseSigByEntity.get(entityId);
    if (prevLocalPoseSig === localPoseSig) return;
    // Seed without writing when first seen; ensureCollider already applied initial offset.
    if (prevLocalPoseSig === undefined) {
      this.colliderLocalPoseSigByEntity.set(entityId, localPoseSig);
      return;
    }

    const owner = this.colliders.findNearestRigidBodyOwner(ent);
    if (!owner) return;

    const collider = this.colliders.colliderByEntity.get(entityId);
    if (!collider) return;

    const local = this.getLocalPoseRelativeTo(owner, ent);
    const shift = this.getLocalCenterShift(col);

    this.callRequired(
      collider,
      "setTranslation",
      "Collider.setTranslation",
      {
        x: local.pos.x + shift.x,
        y: local.pos.y + shift.y,
        z: local.pos.z + shift.z,
      },
      true
    );
    this.callRequired(collider, "setRotation", "Collider.setRotation", local.rot, true);

    this.colliderLocalPoseSigByEntity.set(entityId, localPoseSig);
  }

  private rebuildRigidBody(entity: Entity): void {
    const rb = entity.getComponent<RigidBodyComponent>("rigidBody");
    if (!rb) return;

    this.colliders.removeCollidersInSubtree(entity);
    this.bodies.removeEntityBody(this.world, entity.id);
    this.bodies.ensureRigidBody(this.R, this.world, entity, rb);
    this.colliders.ensureCollidersInSubtree(entity);

    this.rigidBodySigByEntity.set(entity.id, this.computeRigidBodySig(rb));
    this.rigidBodyTypeByEntity.set(entity.id, rb.bodyType);
    this.refreshColliderSigsInSubtree(entity);
  }

  private rebuildCollider(entity: Entity): void {
    const col = this.colliders.getColliderComponent(entity);
    if (!col) return;

    this.colliders.removeEntityCollider(entity.id);

    // If this collider was hosted by a standalone fixed body, remove that too.
    const owner = this.colliders.findNearestRigidBodyOwner(entity);
    if (!owner) this.bodies.removeEntityBody(this.world, entity.id);

    this.colliders.ensureCollider(entity, col);
    this.colliderShapeSigByEntity.set(entity.id, this.computeColliderShapeSig(col));
    this.colliderMatSigByEntity.set(entity.id, this.computeColliderMaterialSig(col));
  }

  private refreshColliderSigsInSubtree(root: Entity): void {
    const visit = (e: Entity) => {
      const c = this.colliders.getColliderComponent(e);
      if (c) {
        this.colliderShapeSigByEntity.set(e.id, this.computeColliderShapeSig(c));
        this.colliderMatSigByEntity.set(e.id, this.computeColliderMaterialSig(c));
      }
      for (const child of e.getChildren()) visit(child);
    };
    visit(root);
  }

  private computeRigidBodySig(rb: RigidBodyComponent): string {
    return JSON.stringify({
      bodyType: rb.bodyType,
      mass: rb.mass ?? null,
      linearDamping: rb.linearDamping ?? null,
      angularDamping: rb.angularDamping ?? null,
      gravityScale: rb.gravityScale ?? null,
      startSleeping: !!rb.startSleeping,
    });
  }

  private computeColliderMaterialSig(col: AnyColliderComponent): string {
    return JSON.stringify({
      friction: col.friction ?? null,
      restitution: col.restitution ?? null,
      isSensor: !!col.isSensor,
    });
  }

  private computeColliderShapeSig(col: AnyColliderComponent): string {
    const t = col.type;
    switch (t) {
      case "sphereCollider":
        return JSON.stringify({ t, r: (col as SphereColliderComponent).radius });
      case "boxCollider": {
        const he = (col as BoxColliderComponent).halfExtents;
        return JSON.stringify({ t, x: he?.x, y: he?.y, z: he?.z });
      }
      case "capsuleCollider":
      case "cylinderCollider":
      case "coneCollider":
        return JSON.stringify({
          t,
          r: (col as CapsuleColliderComponent | CylinderColliderComponent | ConeColliderComponent)
            .radius,
          hh: (col as CapsuleColliderComponent | CylinderColliderComponent | ConeColliderComponent)
            .halfHeight,
        });
      case "terrainCollider": {
        const hf = (col as TerrainColliderComponent).heightfield;
        return JSON.stringify({
          t,
          rows: hf?.rows,
          columns: hf?.columns,
          sx: hf?.size?.x,
          sz: hf?.size?.z,
          len: hf?.heights?.length,
        });
      }
      default:
        return JSON.stringify({ t });
    }
  }

  private getLocalCenterShift(col: AnyColliderComponent): { x: number; y: number; z: number } {
    if (col.type !== "terrainCollider") return { x: 0, y: 0, z: 0 };
    const hf = (col as TerrainColliderComponent).heightfield;
    const sizeX = hf?.size?.x ?? 0;
    const sizeZ = hf?.size?.z ?? 0;
    return { x: -sizeX / 2, y: 0, z: -sizeZ / 2 };
  }

  private getLocalPoseRelativeTo(
    root: Entity,
    child: Entity
  ): { pos: { x: number; y: number; z: number }; rot: QuatLike } {
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
      return { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 } };
    }

    let pos = { x: 0, y: 0, z: 0 };
    let rot: QuatLike = { x: 0, y: 0, z: 0, w: 1 };

    // Apply transforms from root->child order.
    for (const node of path.reverse()) {
      const lp = node.transform.localPosition;
      const lq = quatNormalize(quatFromEulerYXZ(node.transform.localRotation));
      const rotated = applyQuatToVec(lp, rot);
      pos = { x: pos.x + rotated.x, y: pos.y + rotated.y, z: pos.z + rotated.z };
      rot = quatMul(rot, lq);
    }

    // Note: we intentionally do not include scaling here.
    return { pos, rot };
  }

  private callRequired(
    receiver: any,
    methodName: string,
    nameForError: string,
    ...args: any[]
  ): any {
    const fn = receiver?.[methodName];
    if (typeof fn !== "function") {
      throw new Error(`Rapier binding missing required method: ${nameForError}`);
    }
    return fn.call(receiver, ...args);
  }
}

export default RapierEcsUpdateCoordinator;
