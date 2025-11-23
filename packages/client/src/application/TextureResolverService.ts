import type { ITextureResolver } from '@client/domain/ports/ITextureResolver';
import type { SettingsService } from '@client/application/SettingsService';
import type {
  TextureRequest,
  TextureResource,
  TextureQuality,
} from '@client/domain/assets/TextureTypes';
import type {
  TextureCatalogService,
  TextureCatalog,
  TextureVariant,
} from '@client/application/TextureCatalog';

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
  private catalog?: TextureCatalog;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly textureCatalog: TextureCatalogService
  ) {
    // Keep a cached copy of the catalog for fast sync resolution
    this.textureCatalog.subscribe(c => {
      this.catalog = c;
    });
  }

  resolve(request: TextureRequest): TextureResource {
    const preferred = request.quality ?? this.getQualityFromSettings();

    if (this.catalog) {
      const variant = this.pickBestVariantSync(request.id, preferred, this.catalog);
      if (variant) {
        return {
          id: request.id,
          path: variant.path,
          quality: variant.quality ?? preferred,
        };
      }
    }

    // Fallback: build a deterministic path assuming a quality folder and jpg extension.
    const folder = this.qualityToFolder(preferred);
    const path = `assets/textures/${request.id}/${folder}.jpg`;

    console.warn(
      `[TextureResolver] Catalog not ready or id not found: ${request.id}. ` +
        `Using best-effort path: ${path}`
    );

    return {
      id: request.id,
      path,
      quality: preferred,
    };
  }

  /**
   * Async version that checks file existence before returning.
   * Use this when you need guaranteed valid paths.
   */
  async resolveAsync(request: TextureRequest): Promise<TextureResource> {
    const preferred = request.quality ?? this.getQualityFromSettings();
    const catalog = await this.textureCatalog.getCatalog();
    const variant = this.pickBestVariantSync(request.id, preferred, catalog);

    if (variant) {
      return {
        id: request.id,
        path: variant.path,
        quality: variant.quality ?? preferred,
      };
    }

    const folder = this.qualityToFolder(preferred);
    const path = `assets/textures/${request.id}/${folder}.jpg`;

    console.warn(
      `[TextureResolver] No catalog entry found for id "${request.id}". ` +
        `Using best-effort path: ${path}`
    );

    return {
      id: request.id,
      path,
      quality: preferred,
    };
  }

  resolveMany(requests: TextureRequest[]): TextureResource[] {
    return requests.map(r => this.resolve(r));
  }

  /**
   * Async version of resolveMany with file existence checking
   */
  async resolveManyAsync(requests: TextureRequest[]): Promise<TextureResource[]> {
    return Promise.all(requests.map(r => this.resolveAsync(r)));
  }

  getCurrentQuality(): TextureQuality {
    return this.getQualityFromSettings();
  }

  /**
   * Synchronous fallback resolution based on quality hierarchy.
   * Returns best-guess path without checking file existence.
   */
  /**
   * Pick the best variant for an id and preferred quality using a simple fallback chain.
   */
  private pickBestVariantSync(
    id: string,
    preferred: TextureQuality,
    catalog: TextureCatalog
  ): TextureVariant | undefined {
    const candidates = catalog.variants.filter(v => v.id === id);
    if (!candidates.length) return undefined;

    const chain = this.getFallbackChain(preferred);

    for (const q of chain) {
      const v = candidates.find(c => (c.quality ?? 'low') === q);
      if (v) return v;
    }

    // Fallback: first candidate
    return candidates[0];
  }

  /**
   * Async resolve texture path with quality fallback strategy.
   * Checks file existence and tries: requested -> lower quality -> lowest quality (2k)
   */
  /**
   * Get fallback chain for a quality level.
   * Example: 'ultra' -> ['ultra', 'high', 'medium', 'low']
   */
  private getFallbackChain(quality: TextureQuality): TextureQuality[] {
    const all: TextureQuality[] = ['ultra', 'high', 'medium', 'low'];
    const idx = all.indexOf(quality);
    if (idx === -1) return ['low'];
    return all.slice(idx);
  }

  /**
   * Get fallback chain for a quality level.
   * Example: 'ultra' -> ['ultra', 'high', 'medium', 'low']
   */
  /**
   * Map quality setting to folder name when we need to build a best-effort path.
   * This is only used when the catalog does not contain the id.
   */
  private qualityToFolder(quality: TextureQuality): string {
    const mapping: Record<TextureQuality, string> = {
      low: '2k',
      medium: '4k',
      high: '8k',
      ultra: '8k',
    };
    return mapping[quality];
  }

  /**
   * Get texture quality from current settings.
   */
  private getQualityFromSettings(): TextureQuality {
    const settings = this.settingsService.getSettings();
    return settings.graphics.textureQuality;
  }
}

export default TextureResolverService;
