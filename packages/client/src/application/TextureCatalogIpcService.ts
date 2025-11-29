import type {
  TextureCatalog,
  TextureVariant,
  TextureQuality,
  TextureCatalogService,
} from './TextureCatalog';

type Fetcher = () => Promise<TextureCatalog>;

export class TextureCatalogIpcService implements TextureCatalogService {
  private fetcher: Fetcher;
  private cache?: TextureCatalog;
  private listeners: Array<(catalog: TextureCatalog) => void> = [];

  constructor(fetcher?: Fetcher) {
    this.fetcher =
      fetcher ??
      (async () => {
        const anywin = window as any;
        if (!anywin.spaceducks || !anywin.spaceducks.textures || !anywin.spaceducks.textures.list) {
          return { variants: [] };
        }
        return anywin.spaceducks.textures.list();
      });
  }

  async getCatalog(): Promise<TextureCatalog> {
    if (this.cache) return this.cache;
    this.cache = await this.fetcher();
    return this.cache;
  }

  async getVariantsById(id: string): Promise<TextureVariant[]> {
    const catalog = await this.getCatalog();
    return catalog.variants.filter(v => v.id === id);
  }

  async getBestVariant(
    id: string,
    preferred?: TextureQuality
  ): Promise<TextureVariant | undefined> {
    const catalog = await this.getCatalog();
    const candidates = catalog.variants.filter(v => v.id === id);
    if (!candidates.length) return undefined;

    const qualities: TextureQuality[] = ['ultra', 'high', 'medium', 'low'];
    const preferredQuality = preferred ?? 'high';

    const startIndex = qualities.indexOf(preferredQuality);
    const chain = startIndex === -1 ? qualities : qualities.slice(startIndex);

    for (const q of chain) {
      const v = candidates.find(vr => (vr.quality ?? 'low') === q);
      if (v) return v;
    }

    // Fallback: first variant
    return candidates[0];
  }

  subscribe(listener: (catalog: TextureCatalog) => void): () => void {
    this.listeners.push(listener);

    if (this.cache) {
      try {
        listener(this.cache);
      } catch {
        // noop
      }
    } else {
      (async () => {
        const cat = await this.getCatalog();
        try {
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

  /** Force refresh from source and notify listeners (useful for tests). */
  async refresh(): Promise<void> {
    this.cache = await this.fetcher();
    for (const l of this.listeners) {
      try {
        l(this.cache);
      } catch {
        // noop
      }
    }
  }
}

export default TextureCatalogIpcService;
