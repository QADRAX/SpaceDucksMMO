import type { Entity, Vec3Like } from "@duckengine/ecs";
import { quatFromEulerYXZ, quatNormalize } from "@duckengine/ecs";
import type { RigidBodyComponent } from "@duckengine/ecs";

/**
 * Manages Rapier rigid bodies and ECS<->Rapier pose syncing.
 *
 * Coordinate convention:
 * - ECS uses right-handed coordinates (same as Three.js default).
 * - Euler rotations use YXZ order (see TransformSync).
 */
export class RapierBodies {
  readonly bodyByEntity = new Map<string, any>();

  ensureRigidBody(R: any, world: any, entity: Entity, rb: RigidBodyComponent): void {
    if (this.bodyByEntity.has(entity.id)) return;

    const desc =
      rb.bodyType === "static"
        ? R.RigidBodyDesc.fixed()
        : rb.bodyType === "kinematic"
          ? R.RigidBodyDesc.kinematicPositionBased()
          : R.RigidBodyDesc.dynamic();

    const wp = entity.transform.worldPosition;
    desc.setTranslation(wp.x, wp.y, wp.z);

    try {
      const wr = entity.transform.worldRotation;
      const q = quatNormalize(quatFromEulerYXZ(wr));
      desc.setRotation?.(q);
    } catch {}

    if (rb.linearDamping !== undefined) desc.setLinearDamping(rb.linearDamping);
    if (rb.angularDamping !== undefined) desc.setAngularDamping(rb.angularDamping);
    if (rb.gravityScale !== undefined) desc.setGravityScale(rb.gravityScale);

    const body = world.createRigidBody(desc);
    this.bodyByEntity.set(entity.id, body);
  }

  removeEntityBody(world: any, entityId: string): void {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return;
    try {
      world.removeRigidBody(body);
    } catch {}
    this.bodyByEntity.delete(entityId);
  }

  syncKinematicBodiesFromEcs(getEntity: (id: string) => Entity | null): void {
    for (const [entityId, body] of this.bodyByEntity.entries()) {
      const ent = getEntity(entityId);
      if (!ent) continue;
      const rb = ent.getComponent<RigidBodyComponent>("rigidBody");
      if (!rb) continue;
      if (rb.bodyType !== "kinematic") continue;
      try {
        const wp = ent.transform.worldPosition;
        const wr = ent.transform.worldRotation;
        body.setNextKinematicTranslation({ x: wp.x, y: wp.y, z: wp.z });
        const q = quatNormalize(quatFromEulerYXZ(wr));
        body.setNextKinematicRotation(q);
      } catch {}
    }
  }

  writeBackDynamicBodiesToEcs(getEntity: (id: string) => Entity | null): void {
    for (const [entityId, body] of this.bodyByEntity.entries()) {
      const ent = getEntity(entityId);
      if (!ent) continue;
      const rb = ent.getComponent<RigidBodyComponent>("rigidBody");
      if (!rb) continue;
      if (rb.bodyType !== "dynamic") continue;

      try {
        const t = body.translation();
        ent.transform.setPosition(t.x, t.y, t.z);
        const r = body.rotation?.();
        if (r) ent.transform.setRotationFromQuaternion({ x: r.x, y: r.y, z: r.z, w: r.w });
      } catch {}
    }
  }

  applyImpulse(entityId: string, impulse: Vec3Like): void {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return;
    try {
      body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
    } catch {}
  }

  applyForce(entityId: string, force: Vec3Like): void {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return;
    try {
      body.addForce({ x: force.x, y: force.y, z: force.z }, true);
    } catch {}
  }

  getLinearVelocity(entityId: string): Vec3Like | null {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return null;
    try {
      const v = body.linvel?.();
      if (!v) return null;
      return { x: v.x, y: v.y, z: v.z };
    } catch {
      return null;
    }
  }

  dispose(): void {
    this.bodyByEntity.clear();
  }
}

export default RapierBodies;
