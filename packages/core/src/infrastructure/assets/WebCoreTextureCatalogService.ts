import type {
  TextureCatalog,
  TextureCatalogService,
  TextureQuality,
  TextureVariant,
} from '../../domain/assets/TextureCatalog';

type Unsubscribe = () => void;

type WebCoreTextureCatalogOptions = {
  /** Base URL for Duck Engine Web Core API, e.g. "http://localhost:3000" */
  baseUrl: string;

  /** Cache catalog for this many ms. Default: 30s. */
  ttlMs?: number;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export class WebCoreTextureCatalogService implements TextureCatalogService {
  private readonly baseUrl: string;
  private readonly ttlMs: number;

  private cache?: { catalog: TextureCatalog; expiresAt: number };
  private listeners: Array<(catalog: TextureCatalog) => void> = [];

  constructor(options: WebCoreTextureCatalogOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.ttlMs = options.ttlMs ?? 30_000;
    // Note: deprecated 'category' and 'tag' parameters removed (were unused)
  }

  private async fetchCatalog(): Promise<TextureCatalog> {
    void this.baseUrl;
    const variants: TextureVariant[] = [];
    return { variants };
  }

  async getCatalog(): Promise<TextureCatalog> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.catalog;

    const catalog = await this.fetchCatalog();
    this.cache = { catalog, expiresAt: now + this.ttlMs };
    return catalog;
  }

  async getVariantsById(id: string): Promise<TextureVariant[]> {
    const catalog = await this.getCatalog();
    return catalog.variants.filter((v) => v.id === id);
  }

  async getBestVariant(
    id: string,
    preferred?: TextureQuality
  ): Promise<TextureVariant | undefined> {
    const catalog = await this.getCatalog();
    const candidates = catalog.variants.filter((v) => v.id === id);
    if (!candidates.length) return undefined;

    const qualities: TextureQuality[] = ['ultra', 'high', 'medium', 'low'];
    const preferredQuality = preferred ?? 'high';

    const startIndex = qualities.indexOf(preferredQuality);
    const chain = startIndex === -1 ? qualities : qualities.slice(startIndex);

    for (const q of chain) {
      const v = candidates.find((vr) => (vr.quality ?? 'low') === q);
      if (v) return v;
    }

    return candidates[0];
  }

  subscribe(listener: (catalog: TextureCatalog) => void): Unsubscribe {
    this.listeners.push(listener);

    if (this.cache) {
      try {
        listener(this.cache.catalog);
      } catch {
        // noop
      }
    } else {
      (async () => {
        try {
          const cat = await this.getCatalog();
          listener(cat);
        } catch {
          // noop
        }
      })();
    }

    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  /** Force refresh from the API and notify listeners. */
  async refresh(): Promise<void> {
    const catalog = await this.fetchCatalog();
    this.cache = { catalog, expiresAt: Date.now() + this.ttlMs };

    for (const l of this.listeners) {
      try {
        l(catalog);
      } catch {
        // noop
      }
    }
  }
}

export default WebCoreTextureCatalogService;
