import { EngineService } from '@duckengine/web-core-api-client';
import { definePortUseCase } from '../../domain/useCases';
import type { ResourceLoaderPort } from '../../domain/ports';
import type { WebResourceLoaderState } from './webResourceLoaderState';
import { ok, err } from '../../domain/utils';

export const resolveWebResourceUseCase = definePortUseCase<WebResourceLoaderState, ResourceLoaderPort, 'resolve'>({
    name: 'resolveResource',
    execute: async (state, [ref]) => {
        const cacheKey = `${ref.key}@${ref.version ?? 'active'}`;

        if (state.cache.has(cacheKey)) {
            return ok(state.cache.get(cacheKey)!);
        }

        try {
            const apiVersion = typeof ref.version === 'number' ? ref.version.toString() : ref.version;
            const response = await EngineService.getApiEngineResourcesResolve(ref.key, apiVersion);

            // Cast to match the core engine strict ResolvedResource format
            const resolved = response as unknown as any;

            state.cache.set(cacheKey, resolved);
            return ok(resolved);
        } catch (error: any) {
            return err('network-error', `Failed to resolve resource ${ref.key}: ${error?.message || String(error)}`);
        }
    }
});
