import type { EntityState } from '@duckengine/core-v2';
import type { RigidBodyComponent } from '@duckengine/core-v2';
import { getComponent, ensureClean, setPosition, setRotationFromQuaternion, quatFromEulerYXZ, quatNormalize } from '@duckengine/core-v2';
import type { World, RigidBody } from '@dimforge/rapier3d-compat';
import { getLocalPoseRelativeTo } from '../domain';
import type { RapierModule } from './rapier';

function callOpt(receiver: unknown, method: string, ...args: unknown[]): void {
  const fn = (receiver as Record<string, unknown>)?.[method];
  if (typeof fn === 'function') (fn as (...a: unknown[]) => void).call(receiver, ...args);
}

function callReq(receiver: unknown, method: string, name: string, ...args: unknown[]): void {
  const fn = (receiver as Record<string, unknown>)?.[method];
  if (typeof fn !== 'function') throw new Error(`Rapier missing: ${name}`);
  (fn as (...a: unknown[]) => void).call(receiver, ...args);
}

export interface RapierBodiesHandle {
  bodyByEntity: Map<string, RigidBody>;
  ensureRigidBody(
    R: RapierModule,
    world: World,
    entity: EntityState,
    rb: RigidBodyComponent
  ): void;
  removeEntityBody(world: World, entityId: string): void;
  syncKinematicBodiesFromEcs(getEntity: (id: string) => EntityState | null): void;
  writeBackDynamicBodiesToEcs(getEntity: (id: string) => EntityState | null): void;
  dispose(): void;
}

export function createRapierBodies(): RapierBodiesHandle {
  const bodyByEntity = new Map<string, RigidBody>();

  function ensureRigidBody(
    R: RapierModule,
    world: World,
    entity: EntityState,
    rb: RigidBodyComponent
  ): void {
    if (bodyByEntity.has(entity.id)) return;
    const parent = entity.parent;
    if (parent) {
      const parentRb = getComponent(parent, 'rigidBody') as RigidBodyComponent | undefined;
      if (parentRb) ensureRigidBody(R, world, parent, parentRb);
    }
    ensureClean(entity.transform);
    const desc =
      rb.bodyType === 'static'
        ? R.RigidBodyDesc.fixed()
        : rb.bodyType === 'kinematic'
          ? R.RigidBodyDesc.kinematicPositionBased()
          : R.RigidBodyDesc.dynamic();

    const wp = entity.transform.worldPosition;
    desc.setTranslation(wp.x, wp.y, wp.z);
    const wr = entity.transform.worldRotation;
    const q = quatNormalize(quatFromEulerYXZ(wr));
    callOpt(desc, 'setRotation', q);
    if (rb.linearDamping !== undefined) desc.setLinearDamping(rb.linearDamping);
    if (rb.angularDamping !== undefined) desc.setAngularDamping(rb.angularDamping);
    if (rb.gravityScale !== undefined) desc.setGravityScale(rb.gravityScale);
    if (rb.mass !== undefined) callOpt(desc, 'setAdditionalMass', rb.mass);
    if (rb.startSleeping) {
      callOpt(desc, 'setCanSleep', true);
      callOpt(desc, 'setSleeping', true);
    }
    const body = world.createRigidBody(desc);
    bodyByEntity.set(entity.id, body);
    if (rb.mass !== undefined) callOpt(body, 'setAdditionalMass', rb.mass, true);
    if (rb.startSleeping) callOpt(body, 'sleep');

    if (parent && bodyByEntity.has(parent.id)) {
      const parentBody = bodyByEntity.get(parent.id)!;
      const local = getLocalPoseRelativeTo(parent, entity);
      const j = rb.jointToParent;
      const jointType = j === 'revolute' || j === 'spherical' ? j : 'fixed';
      const JointData = R as {
        JointData?: {
          fixed(a1: unknown, f1: unknown, a2: unknown, f2: unknown): unknown;
          revolute?(a1: unknown, a2: unknown, axis: { x: number; y: number; z: number }): unknown;
          spherical?(a1: unknown, a2: unknown): unknown;
        };
      };
      let jointParams: unknown;
      if (jointType === 'spherical' && JointData.JointData?.spherical) {
        jointParams = JointData.JointData.spherical(
          { x: 0, y: 0, z: 0 },
          local.pos
        );
      } else if (jointType === 'revolute' && JointData.JointData?.revolute) {
        jointParams = JointData.JointData.revolute(
          { x: 0, y: 0, z: 0 },
          local.pos,
          { x: 0, y: 1, z: 0 }
        );
      } else {
        jointParams = JointData.JointData?.fixed?.(
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0, w: 1 },
          local.pos,
          local.rot
        );
      }
      const worldWithJoints = world as World & { createImpulseJoint?(p: unknown, b1: RigidBody, b2: RigidBody, wake?: boolean): void };
      if (jointParams && typeof worldWithJoints.createImpulseJoint === 'function') {
        worldWithJoints.createImpulseJoint(jointParams, parentBody, body, true);
      }
    }
  }

  function removeEntityBody(world: World, entityId: string): void {
    const body = bodyByEntity.get(entityId);
    if (!body) return;
    callReq(world, 'removeRigidBody', 'World.removeRigidBody', body);
    bodyByEntity.delete(entityId);
  }

  function syncKinematicBodiesFromEcs(getEntity: (id: string) => EntityState | null): void {
    for (const [entityId, body] of bodyByEntity.entries()) {
      const ent = getEntity(entityId);
      if (!ent) continue;
      const rb = getComponent(ent, 'rigidBody') as RigidBodyComponent | undefined;
      if (!rb || rb.bodyType !== 'kinematic') continue;
      ensureClean(ent.transform);
      const wp = ent.transform.worldPosition;
      const wr = ent.transform.worldRotation;
      callReq(body, 'setNextKinematicTranslation', 'setNextKinematicTranslation', {
        x: wp.x,
        y: wp.y,
        z: wp.z,
      });
      const q = quatNormalize(quatFromEulerYXZ(wr));
      callReq(body, 'setNextKinematicRotation', 'setNextKinematicRotation', q);
    }
  }

  function writeBackDynamicBodiesToEcs(getEntity: (id: string) => EntityState | null): void {
    for (const [entityId, body] of bodyByEntity.entries()) {
      const ent = getEntity(entityId);
      if (!ent) continue;
      const rb = getComponent(ent, 'rigidBody') as RigidBodyComponent | undefined;
      if (!rb || rb.bodyType !== 'dynamic') continue;
      callReq(body, 'translation', 'translation');
      const t = (body as { translation(): { x: number; y: number; z: number } }).translation();
      setPosition(ent.transform, t.x, t.y, t.z);
      const r =
        typeof (body as { rotation?: () => { x: number; y: number; z: number; w: number } })
          .rotation === 'function'
          ? (body as { rotation(): { x: number; y: number; z: number; w: number } }).rotation()
          : undefined;
      if (r) setRotationFromQuaternion(ent.transform, r);
    }
  }

  function dispose(): void {
    bodyByEntity.clear();
  }

  return {
    bodyByEntity,
    ensureRigidBody,
    removeEntityBody,
    syncKinematicBodiesFromEcs,
    writeBackDynamicBodiesToEcs,
    dispose,
  };
}
