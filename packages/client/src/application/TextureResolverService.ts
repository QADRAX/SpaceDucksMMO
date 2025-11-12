import type { ITextureResolver } from '@client/domain/ports/ITextureResolver';
import type { IFileExistenceChecker } from '@client/domain/ports/IFileExistenceChecker';
import type { SettingsService } from '@client/application/SettingsService';
import type { 
  TextureRequest, 
  TextureResource, 
  TextureQuality,
  CelestialBodyId,
  TextureType 
} from '@client/domain/assets/TextureTypes';

/**
 * Application service for resolving texture paths with quality fallback strategy.
 * 
 * Fallback strategy when requested quality doesn't exist:
 * 1. Try requested quality (e.g., 8k)
 * 2. Fall down one level (e.g., 4k)
 * 3. Fall down to base level (2k)
 * 4. If nothing exists, return path anyway (will show error in console)
 * 
 * Texture organization in assets:
 * - assets/textures/planets/2k/venus_surface.jpg
 * - assets/textures/planets/4k/venus_surface.jpg
 * - assets/textures/planets/8k/venus_surface.jpg
 */
export class TextureResolverService implements ITextureResolver {
  private readonly basePath = 'assets/textures/planets';
  
  constructor(
    private settingsService: SettingsService,
    private fileChecker: IFileExistenceChecker
  ) {}

  resolve(request: TextureRequest): TextureResource {
    const requestedQuality = request.quality ?? this.getQualityFromSettings();
    const filename = this.buildFilename(request.bodyId, request.type);
    
    // Synchronous version: use fallback chain without file checking
    // This is fast but may return non-existent files
    const { quality, path } = this.resolveWithFallbackSync(requestedQuality, filename);
    
    return {
      path,
      quality,
      type: request.type
    };
  }

  /**
   * Async version that checks file existence before returning.
   * Use this when you need guaranteed valid paths.
   */
  async resolveAsync(request: TextureRequest): Promise<TextureResource> {
    const requestedQuality = request.quality ?? this.getQualityFromSettings();
    const filename = this.buildFilename(request.bodyId, request.type);
    
    const { quality, path } = await this.resolveWithFallbackAsync(requestedQuality, filename);
    
    return {
      path,
      quality,
      type: request.type
    };
  }

  resolveMany(requests: TextureRequest[]): TextureResource[] {
    return requests.map(req => this.resolve(req));
  }

  /**
   * Async version of resolveMany with file existence checking
   */
  async resolveManyAsync(requests: TextureRequest[]): Promise<TextureResource[]> {
    return Promise.all(requests.map(req => this.resolveAsync(req)));
  }

  getCurrentQuality(): string {
    return this.getQualityFromSettings();
  }

  /**
   * Synchronous fallback resolution based on quality hierarchy.
   * Returns best-guess path without checking file existence.
   */
  private resolveWithFallbackSync(
    requestedQuality: TextureQuality,
    filename: string
  ): { quality: TextureQuality; path: string } {
    // For sync resolution, just return the requested quality path
    // Let Three.js handle the 404 if it doesn't exist
    const folder = this.qualityToFolder(requestedQuality);
    return {
      quality: requestedQuality,
      path: `${this.basePath}/${folder}/${filename}`
    };
  }

  /**
   * Async resolve texture path with quality fallback strategy.
   * Checks file existence and tries: requested -> lower quality -> lowest quality (2k)
   */
  private async resolveWithFallbackAsync(
    requestedQuality: TextureQuality,
    filename: string
  ): Promise<{ quality: TextureQuality; path: string }> {
    const fallbackChain = this.getFallbackChain(requestedQuality);
    
    console.log(`[TextureResolver] Fallback chain for ${filename}:`, fallbackChain);
    
    for (const quality of fallbackChain) {
      const folder = this.qualityToFolder(quality);
      const path = `${this.basePath}/${folder}/${filename}`;
      
      console.log(`[TextureResolver] Checking if exists: ${path}`);
      
      // Check if file exists
      const exists = await this.fileChecker.exists(path);
      
      console.log(`[TextureResolver] ${path} exists: ${exists}`);
      
      if (exists) {
        console.log(`[TextureResolver] Found texture at: ${path} (quality: ${quality})`);
        return { quality, path };
      }
    }
    
    console.warn(`[TextureResolver] No texture found in any quality for ${filename}`);
    
    // Nothing found, return the lowest quality path as last resort
    const folder = this.qualityToFolder('low');
    return {
      quality: 'low',
      path: `${this.basePath}/${folder}/${filename}`
    };
  }

  /**
   * Get fallback chain for a quality level.
   * Example: 'ultra' -> ['ultra', 'high', 'medium', 'low']
   */
  private getFallbackChain(quality: TextureQuality): TextureQuality[] {
    const allQualities: TextureQuality[] = ['ultra', 'high', 'medium', 'low'];
    const startIndex = allQualities.indexOf(quality);
    
    if (startIndex === -1) {
      return ['low']; // Safety fallback
    }
    
    return allQualities.slice(startIndex);
  }

  /**
   * Map quality setting to folder name
   */
  private qualityToFolder(quality: TextureQuality): string {
    const mapping: Record<TextureQuality, string> = {
      'low': '2k',
      'medium': '4k',
      'high': '8k',
      'ultra': '8k' // Ultra uses same 8k textures with enhanced settings
    };
    return mapping[quality];
  }

  /**
   * Build filename from body ID and texture type
   * Examples:
   * - venus + diffuse = venus_surface.jpg
   * - venus + surface = venus_surface.jpg
   * - venus + atmosphere = venus_atmosphere.jpg
   * - earth + normal = earth_normal.jpg
   * - stars + surface = stars.jpg
   * - stars_milky_way + surface = stars_milky_way.jpg
   */
  private buildFilename(bodyId: CelestialBodyId, type: TextureType): string {
    // Special case for skybox textures (stars)
    if (bodyId === 'stars' || bodyId === 'stars_milky_way') {
      return `${bodyId}.jpg`;
    }
    
    const typeMap: Record<TextureType, string> = {
      'surface': 'surface',
      'diffuse': 'surface',
      'normal': 'normal',
      'specular': 'specular',
      'emissive': 'emissive',
      'atmosphere': 'atmosphere'
    };
    
    return `${bodyId}_${typeMap[type]}.jpg`;
  }

  /**
   * Get texture quality from current settings
   */
  private getQualityFromSettings(): TextureQuality {
    const settings = this.settingsService.getSettings();
    return settings.graphics.textureQuality;
  }
}

export default TextureResolverService;
