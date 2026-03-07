import type { ComponentBase } from '../core';

/** Shader blending mode for custom shader materials. */
export type ShaderBlendingMode = 'normal' | 'additive' | 'multiply' | 'subtractive';

/** Base fields shared by all custom shader material components. */
export interface ShaderMaterialBase<
    TType extends 'basicShaderMaterial' | 'standardShaderMaterial' | 'physicalShaderMaterial',
    TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
    shaderId: string;
    uniforms: Record<string, unknown>;
    transparent: boolean;
    depthWrite: boolean;
    blending: ShaderBlendingMode;
}

/** Basic custom shader material. */
export interface BasicShaderMaterialComponent extends ShaderMaterialBase<'basicShaderMaterial', BasicShaderMaterialComponent> { }

/** Standard custom shader material. */
export interface StandardShaderMaterialComponent extends ShaderMaterialBase<'standardShaderMaterial', StandardShaderMaterialComponent> {
    roughness: number;
    metalness: number;
}

/** Physical custom shader material. */
export interface PhysicalShaderMaterialComponent extends ShaderMaterialBase<'physicalShaderMaterial', PhysicalShaderMaterialComponent> {
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
