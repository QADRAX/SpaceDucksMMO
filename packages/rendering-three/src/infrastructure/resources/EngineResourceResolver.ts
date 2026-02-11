export type EngineResourceVersionSelector = 'active' | 'latest' | number;

export type EngineResolvedFile = {
  id?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  sha256?: string;
  url: string;
};

export type EngineResolvedResource = {
  key: string;
  resourceId: string;
  version: number;
  componentType: string;
  componentData: unknown;
  files: Record<string, EngineResolvedFile>;
};

export interface EngineResourceResolver {
  resolve(
    key: string,
    version?: EngineResourceVersionSelector
  ): Promise<EngineResolvedResource>;
}

export type WebCoreEngineResourceResolverOptions = {
  /** Base URL for Duck Engine Web Core, e.g. "http://localhost:3000" */
  baseUrl: string;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * Minimal web-core resolver for runtime resources.
 * Calls `/api/engine/resources/resolve?key=...&version=...`.
 */
export function createWebCoreEngineResourceResolver(
  options: WebCoreEngineResourceResolverOptions
): EngineResourceResolver {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  return {
    async resolve(key: string, version?: EngineResourceVersionSelector) {
      const url = new URL(`${baseUrl}/api/engine/resources/resolve`);
      url.searchParams.set('key', key);
      if (version !== undefined) url.searchParams.set('version', String(version));

      const res = await fetch(url.toString(), { method: 'GET' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error as string)) || `Failed to resolve resource (${res.status})`;
        throw new Error(msg);
      }
      return json as EngineResolvedResource;
    },
  };
}
