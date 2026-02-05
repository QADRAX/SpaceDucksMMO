import type {
  TextureCatalog,
  TextureCatalogService,
  TextureQuality,
  TextureVariant,
} from '../../domain/assets/TextureCatalog';

import { AssetsService, OpenAPI } from '@duckengine/web-core-api-client';

type Unsubscribe = () => void;

type WebCoreTextureCatalogOptions = {
  /** Base URL for Duck Engine Web Core API, e.g. "http://localhost:3000" */
  baseUrl: string;

  /** Optional category prefix passed to manifest endpoint. */
  category?: string;

  /** Optional tag filter passed to manifest endpoint. */
  tag?: string;

  /** Cache catalog for this many ms. Default: 30s. */
  ttlMs?: number;
};

type ManifestFile = {
  fileName?: string;
  url?: string;
};

type ManifestItem = {
  assetKey?: string;
  key?: string;
  tags?: string[];
  version?: string;
  files?: ManifestFile[];
};

type ManifestResponse = {
  data?: ManifestItem[];
  assets?: ManifestItem[];
  count?: number;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function coerceManifestItems(resp: unknown): ManifestItem[] {
  if (!resp || typeof resp !== 'object') return [];
  const anyResp = resp as ManifestResponse;
  const items = anyResp.data ?? anyResp.assets;
  return Array.isArray(items) ? items : [];
}

function coerceTags(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((t) => typeof t === 'string')
    ? (value as string[])
    : undefined;
}

function buildFileUrl(baseUrl: string, assetKey: string, version: string | undefined, fileName: string) {
  const ver = version && version.length ? version : 'latest';
  // Keep assetKey as-is; backend supports slashes in [...path]
  return `${baseUrl}/api/assets/file/${assetKey}/${ver}/${fileName}`;
}

export class WebCoreTextureCatalogService implements TextureCatalogService {
  private readonly baseUrl: string;
  private readonly category?: string;
  private readonly tag?: string;
  private readonly ttlMs: number;

  private cache?: { catalog: TextureCatalog; expiresAt: number };
  private listeners: Array<(catalog: TextureCatalog) => void> = [];

  constructor(options: WebCoreTextureCatalogOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.category = options.category;
    this.tag = options.tag;
    this.ttlMs = options.ttlMs ?? 30_000;
  }

  private async fetchCatalog(): Promise<TextureCatalog> {
    OpenAPI.BASE = this.baseUrl;

    const resp = await AssetsService.getApiAssetsManifestByQuery(
      'texture',
      this.category,
      this.tag
    );

    const items = coerceManifestItems(resp);

    const variants: TextureVariant[] = [];

    for (const item of items) {
      const assetKey = (item.assetKey ?? item.key ?? '').trim();
      if (!assetKey) continue;

      const tags = coerceTags(item.tags);
      const files = Array.isArray(item.files) ? item.files : [];

      if (files.length <= 1) {
        const file = files[0];
        const fileName = (file?.fileName ?? '').trim();
        if (!fileName) continue;

        variants.push({
          id: assetKey,
          path: buildFileUrl(this.baseUrl, assetKey, item.version, fileName),
          tags,
        });
      } else {
        for (const file of files) {
          const fileName = (file?.fileName ?? '').trim();
          if (!fileName) continue;

          variants.push({
            id: `${assetKey}/${fileName}`,
            path: buildFileUrl(this.baseUrl, assetKey, item.version, fileName),
            tags,
          });
        }
      }
    }

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
