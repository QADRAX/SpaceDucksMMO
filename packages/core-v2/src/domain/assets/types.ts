/** Version selector for asset resolution. */
export type ResourceVersionSelector = 'active' | 'latest' | number;

/** A resolved file within a resource, including its download URL. */
export interface ResolvedFile {
    id?: string;
    fileName?: string;
    contentType?: string;
    size?: number;
    sha256?: string;
    /** Download URL for the file content. */
    url: string;
}

/** A fully resolved resource with its component data and associated files. */
export interface ResolvedResource {
    key: string;
    resourceId: string;
    version: number;
    componentType: string;
    componentData: Record<string, unknown>;
    files: Record<string, ResolvedFile>;
}

/**
 * Texture quality levels mapping to resolution tiers.
 * low ~2k, medium ~4k, high ~8k, ultra ~8k+ with enhanced detail maps.
 */
export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

/** Logical identifier for a texture variant (e.g. "planets/jupiter/albedo"). */
export type TextureId = string;

/** Request for a specific texture by logical id. */
export interface TextureRequest {
    /** Logical texture id matching the asset catalog. */
    id: TextureId;
    /** Preferred quality tier. Falls back to lower quality if unavailable. */
    quality?: TextureQuality;
}

/** Result of texture resolution with the actual file path and quality used. */
export interface TextureResource {
    /** Logical texture id. */
    id: TextureId;
    /** Full path to the resolved texture file. */
    path: string;
    /** Actual quality tier that was resolved. */
    quality: TextureQuality;
}
