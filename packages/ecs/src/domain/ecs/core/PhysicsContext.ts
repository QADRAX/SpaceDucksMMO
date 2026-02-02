import type { Vec3Like } from "./MathTypes";

export type EcsPhysicsRay = {
  origin: Vec3Like;
  direction: Vec3Like;
  maxDistance?: number;
};

export type EcsPhysicsRaycastHit = {
  entityId: string;
  point: Vec3Like;
  normal: Vec3Like;
  distance: number;
};

export interface PhysicsApi {
  applyImpulse: (entityId: string, impulse: Vec3Like) => void;
  applyForce: (entityId: string, force: Vec3Like) => void;
  getLinearVelocity: (entityId: string) => Vec3Like | null;
  raycast: (ray: EcsPhysicsRay) => EcsPhysicsRaycastHit | null;
}

const noopPhysics: PhysicsApi = {
  applyImpulse: () => {},
  applyForce: () => {},
  getLinearVelocity: () => null,
  raycast: () => null,
};

const PHYSICS_KEY = Symbol.for("@duckengine/ecs.physicsServices");

function getGlobalStore(): any {
  return globalThis as any;
}

export function setPhysicsServices(s: Partial<PhysicsApi> | null): void {
  const base = { ...noopPhysics };
  getGlobalStore()[PHYSICS_KEY] = Object.assign(base, s || {});
}

export function getPhysicsServices(): PhysicsApi {
  const services = getGlobalStore()[PHYSICS_KEY] as PhysicsApi | null | undefined;
  if (!services) return noopPhysics;
  return services;
}
