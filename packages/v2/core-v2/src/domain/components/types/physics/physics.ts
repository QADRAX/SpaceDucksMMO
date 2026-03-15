import type { ResourceRef } from '../../../resources';
import type { ComponentBase, ComponentType } from '../core';

/** Supported rigid body types. */
export type RigidBodyType = 'static' | 'dynamic' | 'kinematic';

/**
 * Joint type linking this rigid body to its parent's rigid body in the hierarchy.
 * When null, the joint is fixed (no relative motion). Used for chains, ropes, suspension bridges.
 * In the inspector, "Fixed" is stored as null; 'fixed' is also treated as fixed when present.
 */
export type RigidBodyJointType = 'fixed' | 'revolute' | 'spherical';

/** Rigid body dynamics configuration. */
export interface RigidBodyComponent extends ComponentBase<'rigidBody', RigidBodyComponent> {
  bodyType: RigidBodyType;
  /** If set, type of joint to parent's rigid body; null = fixed (default). */
  jointToParent: RigidBodyJointType | null;
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

/** Trimesh collider from mesh resource (vertices + indices). */
export interface TrimeshColliderComponent extends ColliderBaseComponent<'trimeshCollider', TrimeshColliderComponent> {
  mesh: ResourceRef<'mesh'>;
}

/** Union of all collider component types (for APIs that accept any collider shape). */
export type ColliderComponent =
  | BoxColliderComponent
  | SphereColliderComponent
  | CapsuleColliderComponent
  | CylinderColliderComponent
  | ConeColliderComponent
  | TerrainColliderComponent
  | TrimeshColliderComponent;

/** Union of currently supported physics components. */
export type PhysicsComponent =
  | RigidBodyComponent
  | GravityComponent
  | ColliderComponent;
