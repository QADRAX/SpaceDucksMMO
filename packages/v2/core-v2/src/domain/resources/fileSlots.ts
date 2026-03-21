import type { ResourceKind } from './kinds';

/**
 * A resolved file asset from the API.
 * Represents a single downloadable file within a resource.
 */
export interface ResolvedFile {
    /** Download URL for the file content. */
    readonly url: string;
    /** Unique file asset identifier. */
    readonly id?: string;
    /** Original file name. */
    readonly fileName?: string;
    /** MIME content type. */
    readonly contentType?: string;
    /** File size in bytes. */
    readonly size?: number;
    /** SHA-256 hash of the content. */
    readonly sha256?: string;
}

// ── Material file slots ───────────────────────────────────────────────────────

/**
 * Texture slot keys used by material components (ResourceRef<'texture'>).
 * Single source of truth for albedo + PBR overrides. Used by both FileSlots
 * (resource data) and inspector fields (component overrides).
 */
export const TEXTURE_SLOT_KEYS = [
    'albedo',
    'normalMap',
    'aoMap',
    'roughnessMap',
    'metallicMap',
    /** Packed metallic (B) + roughness (G) in one texture (glTF metallicRoughness). */
    'metallicRoughnessMap',
    'emissiveMap',
    'envMap',
] as const;
export type TextureSlotKey = (typeof TEXTURE_SLOT_KEYS)[number];

/** Texture file slots shared by all plain material resources. */
export interface MaterialFileSlots {
    /** Primary albedo/diffuse texture (jpg, png, webp). */
    readonly albedo?: ResolvedFile;
}

/** File slots for a standardMaterial resource. */
export interface StandardMaterialFileSlots extends MaterialFileSlots {
    readonly normalMap?: ResolvedFile;
    readonly aoMap?: ResolvedFile;
    readonly roughnessMap?: ResolvedFile;
    readonly metallicMap?: ResolvedFile;
    readonly metallicRoughnessMap?: ResolvedFile;
    readonly emissiveMap?: ResolvedFile;
    readonly envMap?: ResolvedFile;
}

/** File slots for basicMaterial, phongMaterial, lambertMaterial resources. */
export type BasicMaterialFileSlots = MaterialFileSlots;
export type PhongMaterialFileSlots = MaterialFileSlots;
export type LambertMaterialFileSlots = MaterialFileSlots;

// ── Shader material file slots ────────────────────────────────────────────────

/** File slots for all shader material resources. */
export interface ShaderMaterialFileSlots {
    /** Vertex shader GLSL source. */
    readonly vertexSource: ResolvedFile;
    /** Fragment shader GLSL source. */
    readonly fragmentSource: ResolvedFile;
}

// ── Geometry file slots ───────────────────────────────────────────────────────

/**
 * File slots for a mesh resource.
 * Mesh resources hold geometry-only data (vertices, indices, optional normals/UVs),
 * not full scenes. Used by customGeometry (render) and trimeshCollider (physics).
 * The geometry file format is server-defined (e.g. custom binary, or extracted single-mesh).
 */
export interface MeshFileSlots {
    /** Mesh-only geometry file (JSON or engine-specific binary; decoded to MeshGeometryFileData). */
    readonly geometry: ResolvedFile;
    /** Optional thumbnail for editor UI. */
    readonly thumbnail?: ResolvedFile;
}

/** Animation clip: sampled key data (JSON or binary). */
export interface AnimationClipFileSlots {
    readonly clip: ResolvedFile;
}

// ── Environment file slots ────────────────────────────────────────────────────

/**
 * File slots for a skybox resource.
 * Cubemap with 5 faces (no bottom face 'pw').
 */
export interface SkyboxFileSlots {
    readonly px: ResolvedFile;
    readonly nx: ResolvedFile;
    readonly py: ResolvedFile;
    readonly ny: ResolvedFile;
    readonly pz: ResolvedFile;
}

// ── Script file slots ─────────────────────────────────────────────────────────

/** File slots for a script resource. */
export interface ScriptFileSlots {
    /** Script source file (e.g. Lua). */
    readonly source: ResolvedFile;
}

// ── Texture file slots ────────────────────────────────────────────────────────

/** File slots for a standalone texture resource. */
export interface TextureFileSlots {
    /** Primary texture image (jpg, png, webp). */
    readonly image: ResolvedFile;
}

// ── Conditional type mapping ──────────────────────────────────────────────────

/**
 * Maps a ResourceKind to its strongly-typed file slots.
 *
 * @template K The resource kind.
 */
export type FileSlotsFor<K extends ResourceKind> =
    K extends 'standardMaterial' ? StandardMaterialFileSlots :
    K extends 'basicMaterial' ? BasicMaterialFileSlots :
    K extends 'phongMaterial' ? PhongMaterialFileSlots :
    K extends 'lambertMaterial' ? LambertMaterialFileSlots :
    K extends 'basicShaderMaterial' ? ShaderMaterialFileSlots :
    K extends 'standardShaderMaterial' ? ShaderMaterialFileSlots :
    K extends 'physicalShaderMaterial' ? ShaderMaterialFileSlots :
    K extends 'mesh' ? MeshFileSlots :
    K extends 'animationClip' ? AnimationClipFileSlots :
    K extends 'skybox' ? SkyboxFileSlots :
    K extends 'script' ? ScriptFileSlots :
    K extends 'texture' ? TextureFileSlots :
    never;
