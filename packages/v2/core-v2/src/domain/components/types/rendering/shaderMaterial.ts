import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/** Shader blending mode for custom shader materials. */
export type ShaderBlendingMode = 'normal' | 'additive' | 'multiply' | 'subtractive';

/** Base fields shared by all custom shader material components. */
export interface ShaderMaterialBase<
    TType extends 'basicShaderMaterial' | 'standardShaderMaterial' | 'physicalShaderMaterial',
    TResourceKind extends 'basicShaderMaterial' | 'standardShaderMaterial' | 'physicalShaderMaterial',
    TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
    /** Dynamic uniform values for the shader. */
    uniforms: Record<string, unknown>;
    /** Whether the shader material supports transparency. */
    transparent: boolean;
    /** Whether to write to the depth buffer. */
    depthWrite: boolean;
    /** How colors are combined with the background. */
    blending: ShaderBlendingMode;
    /**
     * Reference to the shader resource (vertex/fragment GLSL source).
     * The resource kind matches this component's type for full type safety.
     */
    shader: ResourceRef<TResourceKind> | undefined;
}

/** Basic custom shader material. */
export interface BasicShaderMaterialComponent extends ShaderMaterialBase<'basicShaderMaterial', 'basicShaderMaterial', BasicShaderMaterialComponent> { }

/** Standard custom shader material. */
export interface StandardShaderMaterialComponent extends ShaderMaterialBase<'standardShaderMaterial', 'standardShaderMaterial', StandardShaderMaterialComponent> {
    roughness: number;
    metalness: number;
}

/** Physical custom shader material. */
export interface PhysicalShaderMaterialComponent extends ShaderMaterialBase<'physicalShaderMaterial', 'physicalShaderMaterial', PhysicalShaderMaterialComponent> {
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
