import { definePortUseCase } from '../../domain/useCases';
import type { ResourceLoaderPort } from '../../domain/ports';
import type { WebResourceLoaderState } from './webResourceLoaderState';
import { ok, err } from '../../domain/utils';

export const fetchFileUseCase = definePortUseCase<WebResourceLoaderState, ResourceLoaderPort, 'fetchFile'>({
    name: 'fetchFile',
    execute: async (state, [url, format]) => {
        const cacheKey = `${url}::${format}`;

        if (state.fileCache.has(cacheKey)) {
            return ok(state.fileCache.get(cacheKey)! as any);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                return err('network-error', `Failed to fetch file from ${url}: ${response.statusText}`);
            }

            let data: string | Blob;
            if (format === 'text') {
                data = await response.text();
            } else {
                data = await response.blob();
            }

            state.fileCache.set(cacheKey, data);
            return ok(data as any);
        } catch (error: any) {
            return err('network-error', `Failed to fetch file from ${url}: ${error?.message || String(error)}`);
        }
    }
});
