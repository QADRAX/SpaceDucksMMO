/**
 * Texture quality levels mapping to resolution
 * - low: 2k textures (2048x1024)
 * - medium: 4k textures (4096x2048)
 * - high: 8k textures (8192x4096)
 * - ultra: 8k textures with additional detail maps
 */
export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Types of textures used for celestial bodies
 */
export type TextureType = 
  | 'surface'      // Generic surface texture (used for most objects)
  | 'diffuse'      // Base color map
  | 'normal'       // Normal/bump map for surface detail
  | 'specular'     // Specular/roughness map
  | 'emissive'     // Glow/emission map (e.g., city lights)
  | 'atmosphere';  // Atmosphere/cloud layer

/**
 * Identifier for a celestial body texture set
 */
export type CelestialBodyId = 
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'mercury'
  | 'moon'
  | 'sun'
  | 'rocky-planet'
  | 'stars'
  | 'stars_milky_way';

/**
 * Request for a specific texture
 */
export interface TextureRequest {
  /** Which celestial body */
  bodyId: CelestialBodyId;
  /** Type of texture (diffuse, normal, etc.) */
  type: TextureType;
  /** Optional: override quality (uses settings if not provided) */
  quality?: TextureQuality;
}

/**
 * Result of texture resolution
 */
export interface TextureResource {
  /** Full path to the texture file */
  path: string;
  /** Actual quality level used */
  quality: TextureQuality;
  /** Texture type */
  type: TextureType;
}
