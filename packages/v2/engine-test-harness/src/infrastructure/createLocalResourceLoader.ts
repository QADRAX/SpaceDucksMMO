/**
 * Local ResourceLoader for harness: resolves resources via HTTP from public/ (Vite).
 *
 * Convention: each resource lives at {baseUrl}{key}/ with a resource.json that
 * defines componentType, componentData (scalar props), and files (URLs).
 *
 * Example: key "textures/concrete-muddy" → /textures/concrete-muddy/resource.json
 * resource.json:
 *   { "componentType": "texture", "componentData": {}, "files": { "image": { "url": "basecolor.jpg" } } }
 * Relative URLs resolve to the resource folder.
 */
import type { ResourceLoader } from '@duckengine/resource-coordinator-v2';
import type { ResourceRef, ResolvedResource, ResourceKind } from '@duckengine/core-v2';
import type { Result } from '@duckengine/core-v2';
import { ok, err } from '@duckengine/core-v2';

export interface ResourceJson {
  componentType: string;
  componentData?: Record<string, unknown>;
  files: Record<string, { url: string }>;
}

export interface CreateLocalResourceLoaderOptions {
  /** Base URL for assets (e.g. '/' — Vite serves public/ at root). */
  readonly baseUrl: string;
}

function normalizeBaseUrl(base: string): string {
  const b = base.endsWith('/') ? base : base + '/';
  if (b.startsWith('/') || b.startsWith('http://') || b.startsWith('https://')) return b;
  return '/' + b;
}

function resourceJsonUrl(baseUrl: string, key: string): string {
  const path = key.startsWith('/') ? key.slice(1) : key;
  return `${baseUrl}${path}/resource.json`;
}

function resourceBaseUrl(baseUrl: string, key: string): string {
  const path = key.startsWith('/') ? key.slice(1) : key;
  const normalized = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  return `${normalized}${path}/`;
}

function resolveFileUrl(fileUrl: string, resourceBase: string): string {
  if (fileUrl.startsWith('/') || fileUrl.startsWith('http')) return fileUrl;
  const base = resourceBase.endsWith('/') ? resourceBase : resourceBase + '/';
  if (fileUrl.startsWith('./')) return base + fileUrl.slice(2);
  if (fileUrl.startsWith('../')) {
    const parts = base.replace(/\/$/, '').split('/');
    let up = 0;
    let rest = fileUrl;
    while (rest.startsWith('../')) {
      up++;
      rest = rest.slice(3);
    }
    const dir = parts.slice(0, -up).join('/');
    return (dir ? dir + '/' : '/') + rest;
  }
  return base + fileUrl;
}

function buildFilesWithAbsoluteUrls(
  files: Record<string, { url: string }>,
  resourceBase: string,
): Record<string, { url: string }> {
  const out: Record<string, { url: string }> = {};
  for (const [slot, file] of Object.entries(files)) {
    out[slot] = { url: resolveFileUrl(file.url, resourceBase) };
  }
  return out;
}

/** Fallback when resource.json is missing. Convention-based file resolution. */
function fallbackResolve<K extends ResourceKind>(
  ref: ResourceRef<K>,
  kind: K,
  baseUrl: string,
): ResolvedResource<K> {
  const key = typeof ref.key === 'string' ? ref.key : String(ref.key);
  const path = key.startsWith('/') ? key.slice(1) : key;
  const normalized = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  const files: Record<string, { url: string }> = {};
  if (kind === 'texture') {
    const last = path.split('/').pop() ?? 'basecolor';
    files.image = {
      url: `${normalized}${path}/${last}.png`,
    };
  } else if (kind === 'mesh') {
    files.geometry = { url: `${normalized}${path}/geometry.json` };
  } else if (kind === 'script') {
    files.source = { url: `${normalized}${path}/main.lua` };
  } else if (kind === 'skybox') {
    const base = `${normalized}${path}/`;
    files.px = { url: base + 'px.png' };
    files.nx = { url: base + 'nx.png' };
    files.py = { url: base + 'py.png' };
    files.ny = { url: base + 'ny.png' };
    files.pz = { url: base + 'pz.png' };
  }

  return {
    key: ref.key,
    resourceId: `local-${ref.key}`,
    version: 1,
    componentType: kind,
    componentData: ({} as any),
    files: files as any,
  };
}

export function createLocalResourceLoader(
  options: CreateLocalResourceLoaderOptions,
): ResourceLoader {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? '/');

  return {
    async resolve<K extends ResourceKind>(
      ref: ResourceRef<K>,
    ): Promise<Result<ResolvedResource<K>>> {
      const key = typeof ref.key === 'string' ? ref.key : String(ref.key);
      const kind = ref.kind as ResourceKind;

      const jsonUrl = resourceJsonUrl(baseUrl, key);
      const resourceBase = resourceBaseUrl(baseUrl, key);

      try {
        const res = await fetch(jsonUrl);
        if (!res.ok) {
          return ok(fallbackResolve(ref, kind, baseUrl) as ResolvedResource<K>);
        }
        const data = (await res.json()) as ResourceJson;

        if (data.componentType !== kind) {
          return err(
            'validation',
            `resource.json componentType "${data.componentType}" does not match ref kind "${kind}"`,
          );
        }

        const files = buildFilesWithAbsoluteUrls(data.files ?? {}, resourceBase);

        const resolved: ResolvedResource<K> = {
          key: ref.key,
          resourceId: `local-${ref.key}`,
          version: 1,
          componentType: kind as K,
          componentData: (data.componentData ?? {}) as any,
          files: files as any,
        };
        return ok(resolved);
      } catch {
        return ok(fallbackResolve(ref, kind, baseUrl) as ResolvedResource<K>);
      }
    },

    async fetchFile<F extends 'text' | 'blob'>(
      url: string,
      format: F,
    ): Promise<Result<F extends 'text' ? string : Blob>> {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          return err('not-found', `Fetch failed: ${res.status} ${res.statusText}`);
        }
        if (format === 'text') {
          const text = await res.text();
          return ok(text as F extends 'text' ? string : Blob);
        }
        const blob = await res.blob();
        return ok(blob as F extends 'text' ? string : Blob);
      } catch (e) {
        return err('not-found', `Fetch error: ${(e as Error).message}`);
      }
    },
  };
}
