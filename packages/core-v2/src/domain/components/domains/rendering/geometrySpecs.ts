import type { ComponentSpec } from '../../../types/componentSpec';
import type {
  BoxGeometryComponent,
  SphereGeometryComponent,
  PlaneGeometryComponent,
  CylinderGeometryComponent,
  ConeGeometryComponent,
  TorusGeometryComponent,
  FullMeshComponent,
  CustomGeometryComponent,
} from './geometry';

const SHADOW_DEFAULTS = { castShadow: true, receiveShadow: true };
const shadowFields = [
  { key: 'castShadow', label: 'Cast Shadow', type: 'boolean' as const },
  { key: 'receiveShadow', label: 'Receive Shadow', type: 'boolean' as const },
];
const GEO_BASE = {
  category: 'Rendering' as const,
  unique: true,
  conflicts: ['skybox'] as const,
};

export const BOX_GEOMETRY_SPEC: ComponentSpec<BoxGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'boxGeometry',
    label: 'Box Geometry',
    icon: 'Box',
    inspector: {
      fields: [
        { key: 'width', label: 'Width', type: 'number', min: 0.001, step: 0.1 },
        { key: 'height', label: 'Height', type: 'number', min: 0.001, step: 0.1 },
        { key: 'depth', label: 'Depth', type: 'number', min: 0.001, step: 0.1 },
        ...shadowFields,
      ],
    },
  },
  defaults: { ...SHADOW_DEFAULTS, width: 1, height: 1, depth: 1 },
};

export const SPHERE_GEOMETRY_SPEC: ComponentSpec<SphereGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'sphereGeometry',
    label: 'Sphere Geometry',
    icon: 'Circle',
    inspector: {
      fields: [
        { key: 'radius', label: 'Radius', type: 'number', min: 0.001, step: 0.1 },
        { key: 'widthSegments', label: 'Width Segments', type: 'number', min: 3, step: 1 },
        { key: 'heightSegments', label: 'Height Segments', type: 'number', min: 2, step: 1 },
        ...shadowFields,
      ],
    },
  },
  defaults: { ...SHADOW_DEFAULTS, radius: 0.5, widthSegments: 32, heightSegments: 16 },
};

export const PLANE_GEOMETRY_SPEC: ComponentSpec<PlaneGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'planeGeometry',
    label: 'Plane Geometry',
    icon: 'Square',
    inspector: {
      fields: [
        { key: 'width', label: 'Width', type: 'number', min: 0.001, step: 0.1 },
        { key: 'height', label: 'Height', type: 'number', min: 0.001, step: 0.1 },
        ...shadowFields,
      ],
    },
  },
  defaults: { castShadow: false, receiveShadow: true, width: 1, height: 1 },
};

export const CYLINDER_GEOMETRY_SPEC: ComponentSpec<CylinderGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'cylinderGeometry',
    label: 'Cylinder Geometry',
    icon: 'Cylinder',
    inspector: {
      fields: [
        { key: 'radiusTop', label: 'Top Radius', type: 'number', min: 0.001, step: 0.1 },
        { key: 'radiusBottom', label: 'Bottom Radius', type: 'number', min: 0.001, step: 0.1 },
        { key: 'height', label: 'Height', type: 'number', min: 0.001, step: 0.1 },
        { key: 'radialSegments', label: 'Radial Segments', type: 'number', min: 3, step: 1 },
        ...shadowFields,
      ],
    },
  },
  defaults: {
    ...SHADOW_DEFAULTS,
    radiusTop: 0.5,
    radiusBottom: 0.5,
    height: 1,
    radialSegments: 24,
  },
};

export const CONE_GEOMETRY_SPEC: ComponentSpec<ConeGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'coneGeometry',
    label: 'Cone Geometry',
    icon: 'Cone',
    inspector: {
      fields: [
        { key: 'radius', label: 'Radius', type: 'number', min: 0.001, step: 0.1 },
        { key: 'height', label: 'Height', type: 'number', min: 0.001, step: 0.1 },
        { key: 'radialSegments', label: 'Radial Segments', type: 'number', min: 3, step: 1 },
        ...shadowFields,
      ],
    },
  },
  defaults: { ...SHADOW_DEFAULTS, radius: 0.5, height: 1, radialSegments: 24 },
};

export const TORUS_GEOMETRY_SPEC: ComponentSpec<TorusGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'torusGeometry',
    label: 'Torus Geometry',
    icon: 'Circle',
    inspector: {
      fields: [
        { key: 'radius', label: 'Radius', type: 'number', min: 0.001, step: 0.1 },
        { key: 'tube', label: 'Tube', type: 'number', min: 0.001, step: 0.01 },
        { key: 'radialSegments', label: 'Radial Segments', type: 'number', min: 3, step: 1 },
        { key: 'tubularSegments', label: 'Tubular Segments', type: 'number', min: 3, step: 1 },
        ...shadowFields,
      ],
    },
  },
  defaults: {
    ...SHADOW_DEFAULTS,
    radius: 0.5,
    tube: 0.2,
    radialSegments: 16,
    tubularSegments: 100,
  },
};

export const FULL_MESH_SPEC: ComponentSpec<FullMeshComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'fullMesh',
    label: 'Full Mesh',
    icon: 'FileBox',
    inspector: {
      fields: [{ key: 'url', label: 'URL', type: 'string' }, ...shadowFields],
    },
  },
  defaults: { ...SHADOW_DEFAULTS, url: '' },
};

export const CUSTOM_GEOMETRY_SPEC: ComponentSpec<CustomGeometryComponent> = {
  metadata: {
    ...GEO_BASE,
    type: 'customGeometry',
    label: 'Custom Geometry',
    icon: 'Shapes',
    inspector: {
      fields: [{ key: 'url', label: 'URL', type: 'string' }, ...shadowFields],
    },
  },
  defaults: { ...SHADOW_DEFAULTS, url: '' },
};

/** All geometry specs keyed by type. */
export const GEOMETRY_SPECS = {
  boxGeometry: BOX_GEOMETRY_SPEC,
  sphereGeometry: SPHERE_GEOMETRY_SPEC,
  planeGeometry: PLANE_GEOMETRY_SPEC,
  cylinderGeometry: CYLINDER_GEOMETRY_SPEC,
  coneGeometry: CONE_GEOMETRY_SPEC,
  torusGeometry: TORUS_GEOMETRY_SPEC,
  fullMesh: FULL_MESH_SPEC,
  customGeometry: CUSTOM_GEOMETRY_SPEC,
};
