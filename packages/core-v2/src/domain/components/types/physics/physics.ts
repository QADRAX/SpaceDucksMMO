import type { ComponentBase } from '../core';

/** Supported rigid body types. */
export type RigidBodyType = 'static' | 'dynamic' | 'kinematic';

/** Rigid body dynamics configuration. */
export interface RigidBodyComponent extends ComponentBase {
  type: 'rigidBody';
  bodyType: RigidBodyType;
  mass: number;
  linearDamping: number;
  angularDamping: number;
  gravityScale: number;
  startSleeping: boolean;
}

/** Per-entity gravity override. */
export interface GravityComponent extends ComponentBase {
  type: 'gravity';
  x: number;
  y: number;
  z: number;
}

/** Shared collider configuration. */
export interface ColliderBaseComponent extends ComponentBase {
  friction: number;
  restitution: number;
  isSensor: boolean;
}

/** Box collider shape. */
export interface BoxColliderComponent extends ColliderBaseComponent {
  type: 'boxCollider';
  halfExtents: { x: number; y: number; z: number };
}

/** Sphere collider shape. */
export interface SphereColliderComponent extends ColliderBaseComponent {
  type: 'sphereCollider';
  radius: number;
}

/** Capsule collider shape. */
export interface CapsuleColliderComponent extends ColliderBaseComponent {
  type: 'capsuleCollider';
  radius: number;
  halfHeight: number;
}

/** Cylinder collider shape. */
export interface CylinderColliderComponent extends ColliderBaseComponent {
  type: 'cylinderCollider';
  radius: number;
  halfHeight: number;
}

/** Cone collider shape. */
export interface ConeColliderComponent extends ColliderBaseComponent {
  type: 'coneCollider';
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
export interface TerrainColliderComponent extends ColliderBaseComponent {
  type: 'terrainCollider';
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
