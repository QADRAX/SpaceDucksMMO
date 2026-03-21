import type { ResourceKind } from './kinds';

export type { MeshGeometryFileData } from './meshGeometry';
export type { AnimationClipFileData } from './animationClip';

/** Shader blending mode — mirrored from ShaderMaterialComponent for data typing. */
export type ResourceBlendingMode = 'normal' | 'additive' | 'multiply' | 'subtractive';

/** glTF alpha modes — first-class in engine material data (importer maps glTF `alphaMode`). */
export type AlphaMode = 'opaque' | 'mask' | 'blend';

// ── Per-kind scalar attribute shapes ─────────────────────────────────────────

/**
 * Scalar data for a standardMaterial resource.
 * Includes glTF 2.0 core + common KHR_* PBR fields as first-class scalars;
 * textures that are purely packing/layout (e.g. metallic+roughness in one map) are handled via
 * {@link fileSlots} / import mapping, not duplicate scalar concepts.
 */
export interface StandardMaterialData {
    readonly color: string;
    readonly metalness: number;
    readonly roughness: number;
    readonly emissive: string;
    readonly emissiveIntensity: number;
    readonly transparent: boolean;
    readonly opacity: number;
    readonly alphaMode: AlphaMode;
    /** Used when alphaMode is `mask` (glTF default 0.5). */
    readonly alphaCutoff: number;
    readonly doubleSided: boolean;
    /** Tangent-space normal strength (glTF normalScale). */
    readonly normalScale: number;
    /** Index of refraction (transmission / glTF ior). */
    readonly ior: number;
    readonly transmission: number;
    /** For thin transmission volume (glTF). */
    readonly thickness: number;
    readonly attenuationColor: string;
    readonly attenuationDistance: number;
    readonly clearcoat: number;
    readonly clearcoatRoughness: number;
    readonly clearcoatNormalScale: number;
    readonly sheen: number;
    readonly sheenRoughness: number;
    readonly sheenColor: string;
    readonly iridescence: number;
    readonly iridescenceIOR: number;
    readonly iridescenceThicknessRange: readonly [number, number];
}

/** Scalar data for a basicMaterial resource. */
export interface BasicMaterialData {
    readonly color: string;
    readonly transparent: boolean;
    readonly opacity: number;
    readonly wireframe: boolean;
}

/** Scalar data for a phongMaterial resource. */
export interface PhongMaterialData {
    readonly color: string;
    readonly transparent: boolean;
    readonly opacity: number;
    readonly specular: string;
    readonly shininess: number;
    readonly emissive: string;
}

/** Scalar data for a lambertMaterial resource. */
export interface LambertMaterialData {
    readonly color: string;
    readonly transparent: boolean;
    readonly opacity: number;
    readonly emissive: string;
}

/** Scalar data shared by all shader material resources. */
interface ShaderMaterialDataBase {
    readonly uniforms: Record<string, unknown>;
    readonly transparent: boolean;
    readonly depthWrite: boolean;
    readonly blending: ResourceBlendingMode;
}

/** Scalar data for a basicShaderMaterial resource. */
export interface BasicShaderMaterialData extends ShaderMaterialDataBase { }

/** Scalar data for a standardShaderMaterial resource. */
export interface StandardShaderMaterialData extends ShaderMaterialDataBase {
    readonly roughness: number;
    readonly metalness: number;
}

/** Scalar data for a physicalShaderMaterial resource. */
export interface PhysicalShaderMaterialData extends ShaderMaterialDataBase {
    readonly roughness: number;
    readonly metalness: number;
    readonly clearcoat: number;
    readonly transmission: number;
    readonly ior: number;
    readonly thickness: number;
}

/** Scalar data for a mesh resource (geometry lives in the geometry file). */
export type MeshData = Record<string, never>;

/**
 * Scalar data for an animationClip resource (full samples live in the clip file).
 */
export interface AnimationClipData {
    readonly name?: string;
}

/** Scalar data for a skybox resource (no data — files only). */
export type SkyboxData = Record<string, never>;

/** Scalar data for a script resource (no data — file only). */
export type ScriptData = Record<string, never>;

/** Scalar data for a texture resource (no data — file only). */
export type TextureData = Record<string, never>;

// ── Conditional type mapping ──────────────────────────────────────────────────

/**
 * Maps a ResourceKind to its strongly-typed scalar component data.
 * These are the non-file attributes of a resource, matching the
 * `componentData` field returned by the web-core API.
 *
 * @template K The resource kind.
 */
export type ResourceData<K extends ResourceKind> =
    K extends 'standardMaterial' ? StandardMaterialData :
    K extends 'basicMaterial' ? BasicMaterialData :
    K extends 'phongMaterial' ? PhongMaterialData :
    K extends 'lambertMaterial' ? LambertMaterialData :
    K extends 'basicShaderMaterial' ? BasicShaderMaterialData :
    K extends 'standardShaderMaterial' ? StandardShaderMaterialData :
    K extends 'physicalShaderMaterial' ? PhysicalShaderMaterialData :
    K extends 'mesh' ? MeshData :
    K extends 'animationClip' ? AnimationClipData :
    K extends 'skybox' ? SkyboxData :
    K extends 'script' ? ScriptData :
    K extends 'texture' ? TextureData :
    never;
