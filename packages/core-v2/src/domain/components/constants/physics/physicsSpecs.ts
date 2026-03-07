import type { ComponentSpec } from '../../types/core';
import type {
  RigidBodyComponent,
  GravityComponent,
  BoxColliderComponent,
  SphereColliderComponent,
  CapsuleColliderComponent,
  CylinderColliderComponent,
  ConeColliderComponent,
  TerrainColliderComponent,
} from '../../types/physics/physics';

const COLLIDER_TYPES = [
  'boxCollider',
  'sphereCollider',
  'capsuleCollider',
  'cylinderCollider',
  'coneCollider',
  'terrainCollider',
] as const;

const COLLIDER_COMMON_FIELDS = [
  { key: 'friction', label: 'Friction', type: 'number' as const, min: 0, step: 0.01 },
  { key: 'restitution', label: 'Restitution', type: 'number' as const, min: 0, step: 0.01 },
  { key: 'isSensor', label: 'Sensor', type: 'boolean' as const },
];

const COLLIDER_BASE_DEFAULTS = { friction: 0.5, restitution: 0, isSensor: false };
const COLLIDER_META_BASE = {
  category: 'Physics' as const,
  unique: true,
  requiresInHierarchy: ['rigidBody'] as const,
};
const RADIUS_HALF_HEIGHT_FIELDS = [
  { key: 'radius', label: 'Radius', type: 'number' as const, min: 0.001, step: 0.01 },
  { key: 'halfHeight', label: 'Half Height', type: 'number' as const, min: 0.001, step: 0.01 },
];

export const RIGID_BODY_SPEC: ComponentSpec<RigidBodyComponent> = {
  metadata: {
    type: 'rigidBody',
    label: 'Rigid Body',
    category: 'Physics',
    icon: 'Package',
    unique: true,
    inspector: {
      fields: [
        {
          key: 'bodyType',
          label: 'Body Type',
          type: 'enum',
          options: [
            { value: 'static', label: 'Static' },
            { value: 'dynamic', label: 'Dynamic' },
            { value: 'kinematic', label: 'Kinematic' },
          ],
        },
        { key: 'mass', label: 'Mass', type: 'number', min: 0, step: 0.01 },
        { key: 'linearDamping', label: 'Linear Damping', type: 'number', min: 0, step: 0.01 },
        { key: 'angularDamping', label: 'Angular Damping', type: 'number', min: 0, step: 0.01 },
        { key: 'gravityScale', label: 'Gravity Scale', type: 'number', step: 0.01 },
        { key: 'startSleeping', label: 'Start Sleeping', type: 'boolean' },
      ],
    },
  },
  defaults: {
    bodyType: 'dynamic',
    mass: 1,
    linearDamping: 0,
    angularDamping: 0,
    gravityScale: 1,
    startSleeping: false,
  },
};

export const GRAVITY_SPEC: ComponentSpec<GravityComponent> = {
  metadata: {
    type: 'gravity',
    label: 'Gravity',
    category: 'Physics',
    icon: 'MoveDown',
    unique: true,
    uniqueInScene: true,
    inspector: {
      fields: [
        { key: 'x', label: 'X', type: 'number', step: 0.1 },
        { key: 'y', label: 'Y', type: 'number', step: 0.1 },
        { key: 'z', label: 'Z', type: 'number', step: 0.1 },
      ],
    },
  },
  defaults: { x: 0, y: -9.81, z: 0 },
};

export const BOX_COLLIDER_SPEC: ComponentSpec<BoxColliderComponent> = {
  metadata: {
    ...COLLIDER_META_BASE,
    type: 'boxCollider',
    label: 'Box Collider',
    icon: 'Box',
    conflicts: COLLIDER_TYPES.filter(t => t !== 'boxCollider'),
    inspector: {
      fields: [
        { key: 'halfExtents.x', label: 'Half X', type: 'number', min: 0.001, step: 0.01 },
        { key: 'halfExtents.y', label: 'Half Y', type: 'number', min: 0.001, step: 0.01 },
        { key: 'halfExtents.z', label: 'Half Z', type: 'number', min: 0.001, step: 0.01 },
        ...COLLIDER_COMMON_FIELDS,
      ],
    },
  },
  defaults: { ...COLLIDER_BASE_DEFAULTS, halfExtents: { x: 0.5, y: 0.5, z: 0.5 } },
};
export const SPHERE_COLLIDER_SPEC: ComponentSpec<SphereColliderComponent> = {
  metadata: {
    ...COLLIDER_META_BASE,
    type: 'sphereCollider',
    label: 'Sphere Collider',
    icon: 'Circle',
    conflicts: COLLIDER_TYPES.filter(t => t !== 'sphereCollider'),
    inspector: {
      fields: [
        { key: 'radius', label: 'Radius', type: 'number', min: 0.001, step: 0.01 },
        ...COLLIDER_COMMON_FIELDS,
      ],
    },
  },
  defaults: { ...COLLIDER_BASE_DEFAULTS, radius: 0.5 },
};
export const CAPSULE_COLLIDER_SPEC: ComponentSpec<CapsuleColliderComponent> = {
  metadata: {
    ...COLLIDER_META_BASE,
    type: 'capsuleCollider',
    label: 'Capsule Collider',
    icon: 'Pill',
    conflicts: COLLIDER_TYPES.filter(t => t !== 'capsuleCollider'),
    inspector: { fields: [...RADIUS_HALF_HEIGHT_FIELDS, ...COLLIDER_COMMON_FIELDS] },
  },
  defaults: { ...COLLIDER_BASE_DEFAULTS, radius: 0.5, halfHeight: 0.5 },
};
export const CYLINDER_COLLIDER_SPEC: ComponentSpec<CylinderColliderComponent> = {
  metadata: {
    ...COLLIDER_META_BASE,
    type: 'cylinderCollider',
    label: 'Cylinder Collider',
    icon: 'Cylinder',
    conflicts: COLLIDER_TYPES.filter(t => t !== 'cylinderCollider'),
    inspector: { fields: [...RADIUS_HALF_HEIGHT_FIELDS, ...COLLIDER_COMMON_FIELDS] },
  },
  defaults: { ...COLLIDER_BASE_DEFAULTS, radius: 0.5, halfHeight: 0.5 },
};
export const CONE_COLLIDER_SPEC: ComponentSpec<ConeColliderComponent> = {
  metadata: {
    ...COLLIDER_META_BASE,
    type: 'coneCollider',
    label: 'Cone Collider',
    icon: 'Triangle',
    conflicts: COLLIDER_TYPES.filter(t => t !== 'coneCollider'),
    inspector: { fields: [...RADIUS_HALF_HEIGHT_FIELDS, ...COLLIDER_COMMON_FIELDS] },
  },
  defaults: { ...COLLIDER_BASE_DEFAULTS, radius: 0.5, halfHeight: 0.5 },
};
export const TERRAIN_COLLIDER_SPEC: ComponentSpec<TerrainColliderComponent> = {
  metadata: {
    ...COLLIDER_META_BASE,
    type: 'terrainCollider',
    label: 'Terrain Collider',
    icon: 'Grid3x3',
    conflicts: COLLIDER_TYPES.filter(t => t !== 'terrainCollider'),
    inspector: {
      fields: [
        { key: 'heightfield.columns', label: 'Columns', type: 'number', min: 2, step: 1 },
        { key: 'heightfield.rows', label: 'Rows', type: 'number', min: 2, step: 1 },
        { key: 'heightfield.size.x', label: 'Size X', type: 'number', min: 0.001, step: 0.1 },
        { key: 'heightfield.size.z', label: 'Size Z', type: 'number', min: 0.001, step: 0.1 },
        ...COLLIDER_COMMON_FIELDS,
      ],
    },
  },
  defaults: {
    ...COLLIDER_BASE_DEFAULTS,
    heightfield: { columns: 2, rows: 2, heights: [0, 0, 0, 0], size: { x: 10, z: 10 } },
  },
};

/** All physics specs keyed by type. */
export const PHYSICS_SPECS = {
  rigidBody: RIGID_BODY_SPEC,
  gravity: GRAVITY_SPEC,
  boxCollider: BOX_COLLIDER_SPEC,
  sphereCollider: SPHERE_COLLIDER_SPEC,
  capsuleCollider: CAPSULE_COLLIDER_SPEC,
  cylinderCollider: CYLINDER_COLLIDER_SPEC,
  coneCollider: CONE_COLLIDER_SPEC,
  terrainCollider: TERRAIN_COLLIDER_SPEC,
};
