/**
 * ResourceLoader that delegates fetch + decode to a Web Worker.
 * Keeps main thread free during texture decode (createImageBitmap).
 */
import type { ResourceLoader } from '@duckengine/resource-coordinator-v2';
import type { ResourceRef, ResolvedResource, ResourceKind } from '@duckengine/core-v2';
import type { Result } from '@duckengine/core-v2';
import { ok, err } from '@duckengine/core-v2';
import { createLocalResourceLoader } from './createLocalResourceLoader';
import type { ResourceWorkerRequest, ResourceWorkerResponse } from './resourceWorker';

export interface CreateWorkerBackedResourceLoaderOptions {
  /** Base URL for assets (e.g. 'http://localhost:5173/'). */
  readonly baseUrl: string;
  /** Worker constructor. Default: new Worker(resourceWorkerUrl, { type: 'module' }). */
  readonly createWorker?: () => Worker;
}

let taskId = 0;

function createDefaultWorker(): Worker {
  return new Worker(new URL('./resourceWorker.ts', import.meta.url), { type: 'module' });
}

/**
 * Creates a ResourceLoader that uses a Web Worker for fetchFile and fetchTextureDecoded.
 * Resolve runs on main thread (lightweight); heavy fetch/decode runs in worker.
 */
export function createWorkerBackedResourceLoader(
  options: CreateWorkerBackedResourceLoaderOptions,
): ResourceLoader {
  const baseLoader = createLocalResourceLoader({ baseUrl: options.baseUrl });
  const worker = (options.createWorker ?? createDefaultWorker)();

  function postTask(request: ResourceWorkerRequest): Promise<ResourceWorkerResponse> {
    return new Promise((resolve) => {
      const id = ++taskId;
      const req = { ...request, id };
      const handler = (ev: MessageEvent<ResourceWorkerResponse>) => {
        if (ev.data.id !== id) return;
        worker.removeEventListener('message', handler);
        resolve(ev.data);
      };
      worker.addEventListener('message', handler);
      worker.postMessage(req);
    });
  }

  return {
    async resolve<K extends ResourceKind>(
      ref: ResourceRef<K>,
    ): Promise<Result<ResolvedResource<K>>> {
      return baseLoader.resolve(ref);
    },

    async fetchFile<F extends 'text' | 'blob'>(
      url: string,
      format: F,
    ): Promise<Result<F extends 'text' ? string : Blob>> {
      const base = options.baseUrl.replace(/\/$/, '');
      const absUrl = url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
      const req: ResourceWorkerRequest =
        format === 'text'
          ? { id: 0, type: 'fetch', url: absUrl, format: 'text' }
          : { id: 0, type: 'fetch', url: absUrl, format: 'blob' };
      const res = await postTask(req);
      if (!res.ok) return err('not-found', res.error);
      return ok(res.data as F extends 'text' ? string : Blob);
    },

    async fetchTextureDecoded(url: string): Promise<Result<ImageBitmap>> {
      const base = options.baseUrl.replace(/\/$/, '');
      const absUrl = url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
      const res = await postTask({
        id: 0,
        type: 'fetch',
        url: absUrl,
        format: 'blob',
        decode: 'imageBitmap',
      });
      if (!res.ok) return err('not-found', res.error);
      return ok(res.data as ImageBitmap);
    },
  };
}
