import type { ResourceLoaderPort, ResourceCachePort, DiagnosticPort } from '@duckengine/core-v2';
import { createResourceKey, createResourceRef } from '@duckengine/core-v2';
import { isBuiltInOrTestScript } from '../domain/scriptResolution';

export interface ScriptResolver {
    resolveSource(scriptId: string): Promise<string | null>;
}

/**
 * Creates a script resolver that delegates to:
 * 1. A built-in resolver for 'builtin://' and 'test://' scripts.
 * 2. ResourceCachePort (when provided) — always read from cache. If not present,
 *    preloadScript loads and adds to cache in the same frame, then read from cache.
 * 3. ResourceLoaderPort (only when no cache) — setups without ResourceCachePort.
 */
export function createResourceScriptResolver(
    resourceLoader: ResourceLoaderPort,
    builtInResolver: (scriptId: string) => Promise<string | null>,
    diagnostic?: DiagnosticPort,
    resourceCache?: ResourceCachePort | null
): ScriptResolver {
    return {
        async resolveSource(scriptId: string): Promise<string | null> {
            if (isBuiltInOrTestScript(scriptId)) {
                return builtInResolver(scriptId);
            }

            const ref = createResourceRef(createResourceKey(scriptId), 'script');

            // When cache exists: always go through cache. If not present, preload then read.
            if (resourceCache) {
                let cached = resourceCache.getScriptSource(ref);
                if (cached !== null) return cached;

                await resourceCache.preloadScript(ref);
                return resourceCache.getScriptSource(ref);
            }

            // No cache: direct load (e.g. scripting without rendering subsystem)
            try {
                const resourceResult = await resourceLoader.resolve(ref);

                if (resourceResult.ok === false) {
                    diagnostic?.log('error', `Failed to resolve script resource '${scriptId}'`, { error: resourceResult.error });
                    return null;
                }

                const resource = resourceResult.value;
                const sourceFile = resource.files.source;

                if (!sourceFile) {
                    diagnostic?.log('error', `Script resource '${scriptId}' has no 'source' file slot.`, { scriptId });
                    return null;
                }

                const fetchResult = await resourceLoader.fetchFile(sourceFile.url, 'text');
                if (fetchResult.ok === false) {
                    diagnostic?.log('error', `Failed to fetch script source from '${sourceFile.url}'`, { error: fetchResult.error });
                    return null;
                }

                return fetchResult.value as string;
            } catch (err) {
                diagnostic?.log('error', `Error resolving script '${scriptId}'`, { error: String(err) });
                return null;
            }
        }
    };
}
