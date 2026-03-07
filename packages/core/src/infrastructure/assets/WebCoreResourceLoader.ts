import type { ResolvedResource, ResourceVersionSelector } from '../../domain/assets/ResourceTypes';
import type { IResourceLoader } from '../../domain/ports/IResourceLoader';

export interface WebCoreResourceLoaderOptions {
  /** Base URL for Duck Engine Web Core API, e.g. "http://localhost:3000" */
  baseUrl: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * Resource loader backed by Web Core runtime resolve endpoint.
 * Calls `/api/engine/resources/resolve?key=...&version=...`.
 */
export class WebCoreResourceLoader implements IResourceLoader {
  private readonly baseUrl: string;

  constructor(options: WebCoreResourceLoaderOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
  }

  async resolve(
    key: string,
    version?: ResourceVersionSelector
  ): Promise<ResolvedResource> {
    const url = new URL(`${this.baseUrl}/api/engine/resources/resolve`);
    url.searchParams.set('key', key);
    if (version !== undefined) {
      url.searchParams.set('version', String(version));
    }

    const response = await fetch(url.toString(), { method: 'GET' });
    const json = (await response.json().catch(() => null)) as
      | { error?: string }
      | ResolvedResource
      | null;

    if (!response.ok) {
      const message =
        json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
          ? json.error
          : `Failed to resolve resource (${response.status})`;
      throw new Error(message);
    }

    return json as ResolvedResource;
  }
}

export function createWebCoreResourceLoader(
  options: WebCoreResourceLoaderOptions
): IResourceLoader {
  return new WebCoreResourceLoader(options);
}
