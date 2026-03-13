import type { ComponentSpec } from '../../types/core';
import type {
  BasicShaderMaterialComponent,
  PhysicalShaderMaterialComponent,
  StandardShaderMaterialComponent,
  ShaderBlendingMode,
} from '../../types/rendering/shaderMaterial';

const PLAIN_CONFLICTS = [
  'standardMaterial',
  'basicMaterial',
  'phongMaterial',
  'lambertMaterial',
] as const;

const SHADER_FIELDS = [
  { key: 'shader', label: 'Shader', type: 'shader' as const },
  { key: 'uniforms', label: 'Uniforms', type: 'uniforms' as const },
  { key: 'transparent', label: 'Transparent', type: 'boolean' as const },
  { key: 'depthWrite', label: 'Depth Write', type: 'boolean' as const },
  {
    key: 'blending',
    label: 'Blending',
    type: 'enum' as const,
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'additive', label: 'Additive' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'subtractive', label: 'Subtractive' },
    ],
  },
];

const SHADER_BASE_DEFAULTS = {
  shader: undefined,
  uniforms: {},
  transparent: true,
  depthWrite: false,
  blending: 'normal' as ShaderBlendingMode,
};

/** Basic shader material spec. */
export const BASIC_SHADER_MATERIAL_SPEC: ComponentSpec<BasicShaderMaterialComponent> = {
  metadata: {
    type: 'basicShaderMaterial',
    label: 'Basic Shader Material',
    category: 'Rendering',
    icon: 'Code',
    unique: true,
    requires: ['geometry'],
    conflicts: [...PLAIN_CONFLICTS, 'standardShaderMaterial', 'physicalShaderMaterial'],
    inspector: { fields: SHADER_FIELDS },
  },
  defaults: { ...SHADER_BASE_DEFAULTS },
};

/** Standard shader material spec. */
export const STANDARD_SHADER_MATERIAL_SPEC: ComponentSpec<StandardShaderMaterialComponent> = {
  metadata: {
    type: 'standardShaderMaterial',
    label: 'Standard Shader Material',
    category: 'Rendering',
    icon: 'Code',
    unique: true,
    requires: ['geometry'],
    conflicts: [...PLAIN_CONFLICTS, 'basicShaderMaterial', 'physicalShaderMaterial'],
    inspector: {
      fields: [
        ...SHADER_FIELDS,
        { key: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'metalness', label: 'Metalness', type: 'number', min: 0, max: 1, step: 0.01 },
      ],
    },
  },
  defaults: { ...SHADER_BASE_DEFAULTS, roughness: 0.5, metalness: 0 },
};

/** Physical shader material spec. */
export const PHYSICAL_SHADER_MATERIAL_SPEC: ComponentSpec<PhysicalShaderMaterialComponent> = {
  metadata: {
    type: 'physicalShaderMaterial',
    label: 'Physical Shader Material',
    category: 'Rendering',
    icon: 'Code',
    unique: true,
    requires: ['geometry'],
    conflicts: [...PLAIN_CONFLICTS, 'basicShaderMaterial', 'standardShaderMaterial'],
    inspector: {
      fields: [
        ...SHADER_FIELDS,
        { key: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'metalness', label: 'Metalness', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'clearcoat', label: 'Clearcoat', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'transmission', label: 'Transmission', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'ior', label: 'IOR', type: 'number', min: 1, max: 3, step: 0.01 },
        { key: 'thickness', label: 'Thickness', type: 'number', min: 0, step: 0.01 },
      ],
    },
  },
  defaults: {
    ...SHADER_BASE_DEFAULTS,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0,
    transmission: 0,
    ior: 1.5,
    thickness: 0,
  },
};

/** All shader material specs keyed by type. */
export const SHADER_MATERIAL_SPECS = {
  basicShaderMaterial: BASIC_SHADER_MATERIAL_SPEC,
  standardShaderMaterial: STANDARD_SHADER_MATERIAL_SPEC,
  physicalShaderMaterial: PHYSICAL_SHADER_MATERIAL_SPEC,
};
