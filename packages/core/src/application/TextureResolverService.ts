import type { ITextureResolver } from '../domain/ports/ITextureResolver';
import type {
  TextureCatalog,
  TextureCatalogService,
  TextureVariant,
} from '../domain/assets/TextureCatalog';
import type {
  TextureQuality,
  TextureRequest,
  TextureResource,
} from '../domain/assets/TextureTypes';

export type TextureFallbackPathBuilder = (
  id: string,
  quality: TextureQuality
) => string;

export interface TextureResolverServiceOptions {
  /** Default quality used when request.quality is not provided. */
  defaultQuality?: TextureQuality;
  /** Optional path builder used when catalog is unavailable / missing id. */
  buildFallbackPath?: TextureFallbackPathBuilder;
}

/**
 * Application service for resolving texture paths with quality fallback strategy.
 *
 * Core owns the fallback algorithm; the app/client only needs to provide a
 * `TextureCatalogService` implementation.
 */
export class TextureResolverService implements ITextureResolver {
  private catalog?: TextureCatalog;
  private readonly unsubscribe?: () => void;
  private defaultQuality: TextureQuality;
  private readonly buildFallbackPath: TextureFallbackPathBuilder;

  constructor(
    private readonly textureCatalog: TextureCatalogService,
    options: TextureResolverServiceOptions = {}
  ) {
    this.defaultQuality = options.defaultQuality ?? 'high';
    this.buildFallbackPath =
      options.buildFallbackPath ??
      ((id, quality) => {
        const folder = this.qualityToFolder(quality);
        return `assets/textures/${id}/${folder}.jpg`;
      });

    // Keep a cached copy of the catalog for fast sync resolution.
    // Note: subscribe() returns an unsubscribe function.
    try {
      this.unsubscribe = this.textureCatalog.subscribe((c) => {
        this.catalog = c;
      });
    } catch {
      // ignore if subscribe isn't implemented by a given adapter
    }
  }

  dispose(): void {
    try {
      this.unsubscribe?.();
    } catch {
      // ignore
    }
  }

  setDefaultQuality(quality: TextureQuality): void {
    this.defaultQuality = quality;
  }

  getCurrentQuality(): TextureQuality {
    return this.defaultQuality;
  }

  resolve(request: TextureRequest): TextureResource {
    const preferred = request.quality ?? this.defaultQuality;

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

    const path = this.buildFallbackPath(request.id, preferred);

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

  resolveMany(requests: TextureRequest[]): TextureResource[] {
    return requests.map((r) => this.resolve(r));
  }

  /**
   * Async version that resolves against the latest catalog.
   * Not part of the ITextureResolver port, but kept for convenience.
   */
  async resolveAsync(request: TextureRequest): Promise<TextureResource> {
    const preferred = request.quality ?? this.defaultQuality;

    try {
      // Prefer the catalog service helper when available.
      const best = await this.textureCatalog.getBestVariant(request.id, preferred);
      if (best) {
        return {
          id: request.id,
          path: best.path,
          quality: best.quality ?? preferred,
        };
      }
    } catch {
      // ignore and fall back to fetching the catalog below
    }

    try {
      const catalog = await this.textureCatalog.getCatalog();
      const variant = this.pickBestVariantSync(request.id, preferred, catalog);
      if (variant) {
        return {
          id: request.id,
          path: variant.path,
          quality: variant.quality ?? preferred,
        };
      }
    } catch {
      // ignore
    }

    const path = this.buildFallbackPath(request.id, preferred);

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

  async resolveManyAsync(requests: TextureRequest[]): Promise<TextureResource[]> {
    return Promise.all(requests.map((r) => this.resolveAsync(r)));
  }

  private pickBestVariantSync(
    id: string,
    preferred: TextureQuality,
    catalog: TextureCatalog
  ): TextureVariant | undefined {
    const candidates = catalog.variants.filter((v) => v.id === id);
    if (!candidates.length) return undefined;

    const chain = this.getFallbackChain(preferred);

    for (const q of chain) {
      const v = candidates.find((c) => (c.quality ?? 'low') === q);
      if (v) return v;
    }

    return candidates[0];
  }

  private getFallbackChain(quality: TextureQuality): TextureQuality[] {
    const all: TextureQuality[] = ['ultra', 'high', 'medium', 'low'];
    const idx = all.indexOf(quality);
    if (idx === -1) return ['low'];
    return all.slice(idx);
  }

  private qualityToFolder(quality: TextureQuality): string {
    const mapping: Record<TextureQuality, string> = {
      low: '2k',
      medium: '4k',
      high: '8k',
      ultra: '8k',
    };
    return mapping[quality];
  }
}

export default TextureResolverService;
