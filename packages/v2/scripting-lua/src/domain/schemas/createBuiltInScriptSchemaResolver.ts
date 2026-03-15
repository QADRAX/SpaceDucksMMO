import type { ScriptSchema } from '@duckengine/core-v2';
import { getBuiltInSchema } from './builtInSchemas';

/**
 * Creates a script schema resolver for built-in scripts.
 * Returns schemas so that self.references.waypoints etc. resolve to entity wrappers.
 */
export function createBuiltInScriptSchemaResolver(): (
  scriptId: string,
) => Promise<ScriptSchema | null> {
  return async (scriptId: string): Promise<ScriptSchema | null> => {
    return getBuiltInSchema(scriptId);
  };
}
