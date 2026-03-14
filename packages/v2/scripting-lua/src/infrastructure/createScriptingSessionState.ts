import type { LuaEngine } from 'wasmoon';
import type { SceneSubsystemFactoryContext } from '@duckengine/core-v2';
import { ResourceLoaderPortDef, ResourceCachePortDef, DiagnosticPortDef } from '@duckengine/core-v2';
import { createScriptRuntimeFromContext } from '../domain/session';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import { createBuiltInScriptSchemaResolver } from './createBuiltInScriptSchemaResolver';
import { createResourceScriptResolver } from './resourceScriptResolver';
import type { ScriptingSessionState } from '../domain/session';
import type { ScriptSandbox } from '../domain/ports';

/**
 * Creates scripting session state from subsystem context.
 *
 * Resolves ResourceLoader, ResourceCache (optional), and Diagnostic from ports.
 * Scripts are coordinated via ResourceCoordinator; resolver checks cache first,
 * then falls back to ResourceLoaderPort on-demand.
 */
export function createScriptingSessionState(
  ctx: SceneSubsystemFactoryContext,
  sandbox: ScriptSandbox,
  engine: LuaEngine,
): ScriptingSessionState {
  const resourceLoader = ctx.ports.get(ResourceLoaderPortDef);
  const resourceCache = ctx.ports.get(ResourceCachePortDef);
  const diagnostic = ctx.ports.get(DiagnosticPortDef);
  const resolver = resourceLoader
    ? createResourceScriptResolver(
        resourceLoader,
        createBuiltInScriptResolver(),
        diagnostic,
        resourceCache,
      )
    : { resolveSource: createBuiltInScriptResolver() };

  if (sandbox.bindDiagnostic) {
    sandbox.bindDiagnostic(diagnostic);
  }

  return createScriptRuntimeFromContext(ctx, {
    sandbox,
    engine,
    resolveSource: (id) => resolver.resolveSource(id),
    resolveScriptSchema: createBuiltInScriptSchemaResolver(),
  });
}
