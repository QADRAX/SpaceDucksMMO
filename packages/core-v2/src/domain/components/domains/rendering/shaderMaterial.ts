import type {  ComponentBase  } from '../../../ecs';
import type {  ComponentSpec  } from '../../../types/../components';

/** Shader blending mode for custom shader materials. */
export type ShaderBlendingMode = 'normal' | 'additive' | 'multiply' | 'subtractive';

/** Base fields shared by all custom shader material components. */
export interface ShaderMaterialBase<
  TType extends 'basicShaderMaterial' | 'standardShaderMaterial' | 'physicalShaderMaterial',
> extends ComponentBase<TType> {
  shaderId: string;
  uniforms: Record<string, unknown>;
  transparent: boolean;
  depthWrite: boolean;
  blending: ShaderBlendingMode;
}

/** Basic custom shader material. */
export interface BasicShaderMaterialComponent extends ShaderMaterialBase<'basicShaderMaterial'> {}

/** Standard custom shader material. */
export interface StandardShaderMaterialComponent extends ShaderMaterialBase<'standardShaderMaterial'> {
  roughness: number;
  metalness: number;
}

/** Physical custom shader material. */
export interface PhysicalShaderMaterialComponent extends ShaderMaterialBase<'physicalShaderMaterial'> {
  roughness: number;
  metalness: number;
  clearcoat: number;
  transmission: number;
  ior: number;
  thickness: number;
}

/** Union of custom shader material components. */
export type ShaderMaterialComponent =
  | BasicShaderMaterialComponent
  | StandardShaderMaterialComponent
  | PhysicalShaderMaterialComponent;

const PLAIN_CONFLICTS = [
  'standardMaterial',
  'basicMaterial',
  'phongMaterial',
  'lambertMaterial',
] as const;

const SHADER_FIELDS = [
  { key: 'shaderId', label: 'Shader Id', type: 'string' as const },
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
  shaderId: '',
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
