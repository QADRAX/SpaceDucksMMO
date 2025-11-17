import type { TextureCatalog, TextureVariant } from './TextureCatalog';

type Fetcher = () => Promise<TextureCatalog>;

export class TextureCatalogIpcService {
  private fetcher: Fetcher;
  private cache?: TextureCatalog;
  private listeners: Array<(catalog: TextureCatalog) => void> = [];

  constructor(fetcher?: Fetcher) {
    this.fetcher = fetcher ?? (async () => {
      // Use optional window bridge exposed by preload
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

  subscribe(listener: (catalog: TextureCatalog) => void): () => void {
    this.listeners.push(listener);
    // If we already have a cached catalog, call synchronously per API contract.
    if (this.cache) {
      try { listener(this.cache); } catch (e) { /* noop */ }
    } else {
      // Fire asynchronously with fetched catalog
      (async () => {
        const cat = await this.getCatalog();
        try { listener(cat); } catch (e) { /* noop */ }
      })();
    }

    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  /** Force refresh from source and notify listeners (useful for tests) */
  async refresh(): Promise<void> {
    this.cache = await this.fetcher();
    for (const l of this.listeners) {
      try { l(this.cache); } catch (e) { /* noop */ }
    }
  }
}

export default TextureCatalogIpcService;
