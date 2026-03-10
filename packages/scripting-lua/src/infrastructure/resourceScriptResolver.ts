import type { ResourceLoaderPort } from '@duckengine/core-v2';
import { createResourceKey } from '@duckengine/core-v2';
import { isBuiltInOrTestScript } from '../domain/scriptResolution';

export interface ScriptResolver {
    resolveSource(scriptId: string): Promise<string | null>;
}

/**
 * Creates a script resolver that delegates to:
 * 1. A built-in resolver for 'builtin://' and 'test://' scripts.
 * 2. The engine's ResourceLoaderPort for everything else.
 */
export function createResourceScriptResolver(
    resourceLoader: ResourceLoaderPort,
    builtInResolver: (scriptId: string) => Promise<string | null>
): ScriptResolver {
    return {
        async resolveSource(scriptId: string): Promise<string | null> {
            if (isBuiltInOrTestScript(scriptId)) {
                return builtInResolver(scriptId);
            }

            // Assume scriptId is a ResourceKey for a 'script' resource
            try {
                const key = createResourceKey(scriptId);
                const resourceResult = await resourceLoader.resolve({ key, kind: 'script' });

                if (resourceResult.ok === false) {
                    console.error(`[scripting-lua] Failed to resolve script resource '${scriptId}':`, resourceResult.error);
                    return null;
                }

                const resource = resourceResult.value;
                const sourceFile = resource.files.source;

                if (!sourceFile) {
                    console.error(`[scripting-lua] Script resource '${scriptId}' has no 'source' file slot.`);
                    return null;
                }

                const fetchResult = await resourceLoader.fetchFile(sourceFile.url, 'text');
                if (fetchResult.ok === false) {
                    console.error(`[scripting-lua] Failed to fetch script source from '${sourceFile.url}':`, fetchResult.error);
                    return null;
                }

                return fetchResult.value as string;
            } catch (err) {
                console.error(`[scripting-lua] Error resolving script '${scriptId}':`, err);
                return null;
            }
        }
    };
}
