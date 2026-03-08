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

/** File slots for a mesh resource. */
export interface MeshFileSlots {
    /** GLB/GLTF model file. */
    readonly model: ResolvedFile;
    /** Optional thumbnail for editor UI. */
    readonly thumbnail?: ResolvedFile;
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
    K extends 'skybox' ? SkyboxFileSlots :
    K extends 'script' ? ScriptFileSlots :
    K extends 'texture' ? TextureFileSlots :
    never;
