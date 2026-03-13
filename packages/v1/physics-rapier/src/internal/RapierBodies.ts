import type { Entity, Vec3Like } from "@duckengine/core";
import { quatFromEulerYXZ, quatNormalize } from "@duckengine/core";
import type { RigidBodyComponent } from "@duckengine/core";

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

    const wr = entity.transform.worldRotation;
    const q = quatNormalize(quatFromEulerYXZ(wr));
    callOptional(desc, "setRotation", q);

    if (rb.linearDamping !== undefined) desc.setLinearDamping(rb.linearDamping);
    if (rb.angularDamping !== undefined) desc.setAngularDamping(rb.angularDamping);
    if (rb.gravityScale !== undefined) desc.setGravityScale(rb.gravityScale);

    // Mass is usually derived from colliders, but we support an override via additional mass.
    if (rb.mass !== undefined) callOptional(desc, "setAdditionalMass", rb.mass);

    // If requested, start sleeping (backend permitting).
    if (rb.startSleeping) {
      callOptional(desc, "setCanSleep", true);
      callOptional(desc, "setSleeping", true);
    }

    const body = world.createRigidBody(desc);
    this.bodyByEntity.set(entity.id, body);

    // Some Rapier bindings apply certain settings post-creation; attempt as a best-effort.
    if (rb.mass !== undefined) callOptional(body, "setAdditionalMass", rb.mass, true);
    if (rb.startSleeping) callOptional(body, "sleep");
  }

  removeEntityBody(world: any, entityId: string): void {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return;
    callRequired(world, "removeRigidBody", "World.removeRigidBody", body);
    this.bodyByEntity.delete(entityId);
  }

  syncKinematicBodiesFromEcs(getEntity: (id: string) => Entity | null): void {
    for (const [entityId, body] of this.bodyByEntity.entries()) {
      const ent = getEntity(entityId);
      if (!ent) continue;
      const rb = ent.getComponent<RigidBodyComponent>("rigidBody");
      if (!rb) continue;
      if (rb.bodyType !== "kinematic") continue;

      const wp = ent.transform.worldPosition;
      const wr = ent.transform.worldRotation;
      callRequired(
        body,
        "setNextKinematicTranslation",
        "RigidBody.setNextKinematicTranslation",
        { x: wp.x, y: wp.y, z: wp.z }
      );
      const q = quatNormalize(quatFromEulerYXZ(wr));
      callRequired(body, "setNextKinematicRotation", "RigidBody.setNextKinematicRotation", q);
    }
  }

  writeBackDynamicBodiesToEcs(getEntity: (id: string) => Entity | null): void {
    for (const [entityId, body] of this.bodyByEntity.entries()) {
      const ent = getEntity(entityId);
      if (!ent) continue;
      const rb = ent.getComponent<RigidBodyComponent>("rigidBody");
      if (!rb) continue;
      if (rb.bodyType !== "dynamic") continue;

      callRequired(body, "translation", "RigidBody.translation");
      const t = body.translation();
      ent.transform.setPosition(t.x, t.y, t.z);

      const r = typeof body.rotation === "function" ? body.rotation() : undefined;
      if (r) ent.transform.setRotationFromQuaternion({ x: r.x, y: r.y, z: r.z, w: r.w });
    }
  }

  applyImpulse(entityId: string, impulse: Vec3Like): void {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return;
    callRequired(
      body,
      "applyImpulse",
      "RigidBody.applyImpulse",
      { x: impulse.x, y: impulse.y, z: impulse.z },
      true
    );
  }

  applyForce(entityId: string, force: Vec3Like): void {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return;
    callRequired(body, "addForce", "RigidBody.addForce", { x: force.x, y: force.y, z: force.z }, true);
  }

  getLinearVelocity(entityId: string): Vec3Like | null {
    const body = this.bodyByEntity.get(entityId);
    if (!body) return null;
    if (typeof body.linvel !== "function") return null;
    const v = body.linvel();
    if (!v) return null;
    return { x: v.x, y: v.y, z: v.z };
  }

  dispose(): void {
    this.bodyByEntity.clear();
  }
}

export default RapierBodies;
