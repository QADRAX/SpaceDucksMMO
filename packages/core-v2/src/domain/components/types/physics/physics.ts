import type { ComponentBase, ComponentType } from '../core';

/** Supported rigid body types. */
export type RigidBodyType = 'static' | 'dynamic' | 'kinematic';

/** Rigid body dynamics configuration. */
export interface RigidBodyComponent extends ComponentBase<'rigidBody', RigidBodyComponent> {
  bodyType: RigidBodyType;
  mass: number;
  linearDamping: number;
  angularDamping: number;
  gravityScale: number;
  startSleeping: boolean;
}

/** Per-entity gravity override. */
export interface GravityComponent extends ComponentBase<'gravity', GravityComponent> {
  x: number;
  y: number;
  z: number;
}

/** Shared collider configuration. */
export interface ColliderBaseComponent<
  TType extends ComponentType = ComponentType,
  TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
  friction: number;
  restitution: number;
  isSensor: boolean;
}

/** Box collider shape. */
export interface BoxColliderComponent extends ColliderBaseComponent<'boxCollider', BoxColliderComponent> {
  halfExtents: { x: number; y: number; z: number };
}

/** Sphere collider shape. */
export interface SphereColliderComponent extends ColliderBaseComponent<'sphereCollider', SphereColliderComponent> {
  radius: number;
}

/** Capsule collider shape. */
export interface CapsuleColliderComponent extends ColliderBaseComponent<'capsuleCollider', CapsuleColliderComponent> {
  radius: number;
  halfHeight: number;
}

/** Cylinder collider shape. */
export interface CylinderColliderComponent extends ColliderBaseComponent<'cylinderCollider', CylinderColliderComponent> {
  radius: number;
  halfHeight: number;
}

/** Cone collider shape. */
export interface ConeColliderComponent extends ColliderBaseComponent<'coneCollider', ConeColliderComponent> {
  radius: number;
  halfHeight: number;
}

/** Terrain heightfield description for terrain collider. */
export interface TerrainHeightfield {
  columns: number;
  rows: number;
  heights: number[];
  size: { x: number; z: number };
}

/** Terrain collider shape. */
export interface TerrainColliderComponent extends ColliderBaseComponent<'terrainCollider', TerrainColliderComponent> {
  heightfield: TerrainHeightfield;
}

/** Union of currently supported physics components. */
export type PhysicsComponent =
  | RigidBodyComponent
  | GravityComponent
  | BoxColliderComponent
  | SphereColliderComponent
  | CapsuleColliderComponent
  | CylinderColliderComponent
  | ConeColliderComponent
  | TerrainColliderComponent;
