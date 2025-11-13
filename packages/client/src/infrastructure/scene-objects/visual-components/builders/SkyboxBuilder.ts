import type { TextureResolverService } from '@client/application/TextureResolverService';
import { Skybox, SkyboxTexture } from '../Skybox';

/**
 * Configuration for creating a skybox using the builder
 */
export interface SkyboxBuilderConfig {
  /** Which texture to use (default: 'stars') */
  texture?: SkyboxTexture;
  /** Skybox radius (default: 1000) */
  radius?: number;
  /** Rotation speed in radians per second (default: 0.00002) */
  rotationSpeed?: number;
  /** Initial rotation offset in radians (default: 0) */
  initialRotation?: number;
  /** Brightness multiplier (default: 1.5) */
  brightness?: number;
  /** Enable depth write (default: false) */
  depthWrite?: boolean;
  /** Tint color (default: 0xffffff - white, no tint) */
  tint?: number;
  /** Tint intensity 0-1 (default: 0 - no tint) */
  tintIntensity?: number;
  /** Geometry detail level (default: 64) */
  segments?: number;
}

/**
 * Builder for creating skyboxes with sensible defaults.
 * 
 * @example
 * ```ts
 * // Basic starfield
 * const skybox = SkyboxBuilder.create('skybox', textureResolver);
 * 
 * // Milky Way with custom settings
 * const skybox = SkyboxBuilder.create('skybox', textureResolver, {
 *   texture: 'stars_milky_way',
 *   brightness: 2.0,
 *   rotationSpeed: 0.00005
 * });
 * 
 * // Tinted skybox
 * const skybox = SkyboxBuilder.create('skybox', textureResolver, {
 *   tint: 0xff8844,
 *   tintIntensity: 0.3
 * });
 * ```
 */
export class SkyboxBuilder {
  /**
   * Create a skybox with sensible defaults
   * 
   * @param id - Unique identifier for the skybox
   * @param textureResolver - Texture resolver service
   * @param config - Optional configuration overrides
   * @returns ComponentSkybox instance
   */
  static create(
    id: string,
    textureResolver: TextureResolverService,
    config: SkyboxBuilderConfig = {}
  ): Skybox {
    return new Skybox(id, textureResolver, {
      texture: config.texture ?? 'stars',
      radius: config.radius ?? 1000,
      rotationSpeed: config.rotationSpeed ?? 0.00002,
      initialRotation: config.initialRotation ?? 0,
      brightness: config.brightness ?? 1.5,
      depthWrite: config.depthWrite ?? false,
      tint: config.tint ?? 0xffffff,
      tintIntensity: config.tintIntensity ?? 0,
      segments: config.segments ?? 64,
    });
  }

  /**
   * Create a static skybox (no rotation)
   */
  static createStatic(
    id: string,
    textureResolver: TextureResolverService,
    config: Omit<SkyboxBuilderConfig, 'rotationSpeed'> = {}
  ): Skybox {
    return SkyboxBuilder.create(id, textureResolver, {
      ...config,
      rotationSpeed: 0,
    });
  }

  /**
   * Create a bright, rotating Milky Way skybox (common preset)
   */
  static createMilkyWay(
    id: string,
    textureResolver: TextureResolverService,
    config: Partial<SkyboxBuilderConfig> = {}
  ): Skybox {
    return SkyboxBuilder.create(id, textureResolver, {
      texture: 'stars_milky_way',
      brightness: 1.8,
      rotationSpeed: 0.00002,
      ...config,
    });
  }

  /**
   * Create a subtle starfield skybox (common preset)
   */
  static createStarfield(
    id: string,
    textureResolver: TextureResolverService,
    config: Partial<SkyboxBuilderConfig> = {}
  ): Skybox {
    return SkyboxBuilder.create(id, textureResolver, {
      texture: 'stars',
      brightness: 1.2,
      rotationSpeed: 0.00001,
      ...config,
    });
  }
}
