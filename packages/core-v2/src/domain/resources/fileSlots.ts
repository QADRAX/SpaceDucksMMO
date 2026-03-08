import type { ResourceKind } from './kinds';

/**
 * A descriptor for a file asset within a resource.
 * Contiene la URL de descarga y metadatos opcionales.
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

/** File slots for a texture resource. */
export interface TextureFileSlots {
    /** Primary texture image (jpg, png, webp). */
    readonly image: ResolvedFile;
}

/** File slots for a mesh resource. */
export interface MeshFileSlots {
    /** GLB/GLTF model file. */
    readonly model: ResolvedFile;
    /** Optional thumbnail for editor UI. */
    readonly thumbnail?: ResolvedFile;
}

/**
 * File slots for a skybox resource.
 * Un cubemap de 5 caras (no hay fondo 'nz').
 */
export interface SkyboxFileSlots {
    readonly px: ResolvedFile;
    readonly nx: ResolvedFile;
    readonly py: ResolvedFile;
    readonly ny: ResolvedFile;
    readonly pz: ResolvedFile;
}

/** File slots for a script resource. */
export interface ScriptFileSlots {
    /** The script source code (lua). */
    readonly source: ResolvedFile;
}

/** File slots for a shader resource. */
export interface ShaderFileSlots {
    /** Vertex shader source code. */
    readonly vertexSource: ResolvedFile;
    /** Fragment shader source code. */
    readonly fragmentSource: ResolvedFile;
}

/**
 * Conditional type to get the correct file slots for a given resource kind.
 */
export type FileSlotsFor<K extends ResourceKind> =
    K extends 'texture' ? TextureFileSlots :
    K extends 'mesh' ? MeshFileSlots :
    K extends 'skybox' ? SkyboxFileSlots :
    K extends 'script' ? ScriptFileSlots :
    K extends 'shader' ? ShaderFileSlots :
    never;
