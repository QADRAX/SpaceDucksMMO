/**
 * Texture quality levels mapping to resolution (logical, independent of exact pixels).
 * - low: 2k or similar
 * - medium: 4k or similar
 * - high: 8k or similar
 * - ultra: 8k+ or enhanced detail maps
 */
export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Logical identifier for a texture variant, derived from folder structure:
 * assets/textures/<collection>/<entity>/<quality?>/<variant>.<ext>
 *
 * Examples:
 * - "planets/jupiter/albedo"
 * - "planets/saturn/ring-alpha"
 * - "ui/main-menu/background"
 * - "tiles/space-station/floor-metal-01"
 */
export type TextureId = string;

/**
 * Request for a specific texture by logical id.
 */
export interface TextureRequest {
  /** Logical texture id, matching TextureVariant.id from the catalog. */
  id: TextureId;

  /**
   * Optional: preferred quality (uses settings if not provided).
   * The resolver will try this quality and fall back to lower ones.
   */
  quality?: TextureQuality;
}

/**
 * Result of texture resolution.
 */
export interface TextureResource {
  /** Logical texture id. */
  id: TextureId;

  /** Full path to the texture file. */
  path: string;

  /** Actual quality level used. */
  quality: TextureQuality;
}
