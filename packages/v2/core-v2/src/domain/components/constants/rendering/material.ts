import type { ComponentSpec } from '../../types/core';
import type {
  PlainMaterialComponentType,
  BasicMaterialComponent,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
} from '../../types/rendering/material';

const MATERIAL_CONFLICTS = [
  'standardMaterial',
  'basicMaterial',
  'phongMaterial',
  'lambertMaterial',
  'basicShaderMaterial',
  'standardShaderMaterial',
  'physicalShaderMaterial',
] as const;

const COMMON_FIELDS = [
  { key: 'material', label: 'Material Resource', type: 'resource' as const, nullable: true },
  { key: 'color', label: 'Color', type: 'color' as const },
  { key: 'transparent', label: 'Transparent', type: 'boolean' as const },
  { key: 'opacity', label: 'Opacity', type: 'number' as const, min: 0, max: 1, step: 0.01 },
  { key: 'albedo', label: 'Albedo Map', type: 'texture' as const, nullable: true },
];

const BASE_DEFAULTS = { material: undefined, color: '#ffffff', transparent: false, opacity: 1, albedo: undefined };

/** Standard material spec. */
export const STANDARD_MATERIAL_SPEC: ComponentSpec<StandardMaterialComponent> = {
  metadata: {
    type: 'standardMaterial',
    label: 'Standard Material',
    description: 'Physically based material with metalness and roughness workflow.',
    category: 'Rendering',
    icon: 'Gem',
    unique: true,
    requires: ['geometry'],
    conflicts: [...MATERIAL_CONFLICTS.filter((c) => c !== 'standardMaterial')],
    inspector: {
      fields: [
        ...COMMON_FIELDS,
        { key: 'metalness', label: 'Metalness', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'emissive', label: 'Emissive', type: 'color' },
        { key: 'emissiveIntensity', label: 'Emissive Intensity', type: 'number', min: 0, step: 0.01 },
        { key: 'normalMap', label: 'Normal Map', type: 'texture', nullable: true },
        { key: 'aoMap', label: 'AO Map', type: 'texture', nullable: true },
        { key: 'roughnessMap', label: 'Roughness Map', type: 'texture', nullable: true },
        { key: 'metallicMap', label: 'Metallic Map', type: 'texture', nullable: true },
        { key: 'envMap', label: 'Environment Map', type: 'texture', nullable: true },
      ],
    },
  },
  defaults: {
    ...BASE_DEFAULTS,
    metalness: 0,
    roughness: 1,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalMap: undefined,
    aoMap: undefined,
    roughnessMap: undefined,
    metallicMap: undefined,
    envMap: undefined,
  },
};

/** Basic material spec. */
export const BASIC_MATERIAL_SPEC: ComponentSpec<BasicMaterialComponent> = {
  metadata: {
    type: 'basicMaterial',
    label: 'Basic Material',
    description: 'Unlit material for stylized or UI-like rendering.',
    category: 'Rendering',
    icon: 'PaintBucket',
    unique: true,
    requires: ['geometry'],
    conflicts: [...MATERIAL_CONFLICTS.filter((c) => c !== 'basicMaterial')],
    inspector: {
      fields: [...COMMON_FIELDS, { key: 'wireframe', label: 'Wireframe', type: 'boolean' }],
    },
  },
  defaults: { ...BASE_DEFAULTS, wireframe: false },
};

/** Phong material spec. */
export const PHONG_MATERIAL_SPEC: ComponentSpec<PhongMaterialComponent> = {
  metadata: {
    type: 'phongMaterial',
    label: 'Phong Material',
    description: 'Specular/gloss workflow material based on Blinn-Phong lighting.',
    category: 'Rendering',
    icon: 'SunMedium',
    unique: true,
    requires: ['geometry'],
    conflicts: [...MATERIAL_CONFLICTS.filter((c) => c !== 'phongMaterial')],
    inspector: {
      fields: [
        ...COMMON_FIELDS,
        { key: 'specular', label: 'Specular', type: 'color' },
        { key: 'shininess', label: 'Shininess', type: 'number', min: 0, max: 200, step: 1 },
        { key: 'emissive', label: 'Emissive', type: 'color' },
      ],
    },
  },
  defaults: { ...BASE_DEFAULTS, specular: '#111111', shininess: 30, emissive: '#000000' },
};

/** Lambert material spec. */
export const LAMBERT_MATERIAL_SPEC: ComponentSpec<LambertMaterialComponent> = {
  metadata: {
    type: 'lambertMaterial',
    label: 'Lambert Material',
    description: 'Diffuse Lambert lighting material.',
    category: 'Rendering',
    icon: 'CircleDot',
    unique: true,
    requires: ['geometry'],
    conflicts: [...MATERIAL_CONFLICTS.filter((c) => c !== 'lambertMaterial')],
    inspector: {
      fields: [...COMMON_FIELDS, { key: 'emissive', label: 'Emissive', type: 'color' }],
    },
  },
  defaults: { ...BASE_DEFAULTS, emissive: '#000000' },
};

/** All material component specs keyed by type. */
export const MATERIAL_SPECS = {
  standardMaterial: STANDARD_MATERIAL_SPEC,
  basicMaterial: BASIC_MATERIAL_SPEC,
  phongMaterial: PHONG_MATERIAL_SPEC,
  lambertMaterial: LAMBERT_MATERIAL_SPEC,
};

/** Ordered list of plain (built-in) material component types (single source of truth). */
export const PLAIN_MATERIAL_COMPONENT_TYPES: PlainMaterialComponentType[] = [
  'standardMaterial',
  'basicMaterial',
  'phongMaterial',
  'lambertMaterial',
];

/** Type guard: true if `t` is a plain material component type. */
export function isPlainMaterialComponentType(t: string): t is PlainMaterialComponentType {
  return (PLAIN_MATERIAL_COMPONENT_TYPES as readonly string[]).includes(t);
}
