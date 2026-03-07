import type { ComponentBase } from '../core';

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
export interface BasicShaderMaterialComponent extends ShaderMaterialBase<'basicShaderMaterial'> { }

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
