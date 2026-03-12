import type { LuaEngine } from 'wasmoon';
import type { SceneSubsystemFactoryContext } from '@duckengine/core-v2';
import { ResourceLoaderPortDef, DiagnosticPortDef } from '@duckengine/core-v2';
import { createScriptRuntimeFromContext } from '../domain/session';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import { createBuiltInScriptSchemaResolver } from './createBuiltInScriptSchemaResolver';
import { createResourceScriptResolver } from './resourceScriptResolver';
import type { ScriptingSessionState } from '../domain/session';
import type { ScriptSandbox } from '../domain/ports';

/**
 * Creates scripting session state from subsystem context.
 *
 * Resolves ResourceLoader and Diagnostic from ports, builds the script resolver,
 * binds diagnostic to sandbox, and delegates to domain.
 */
export function createScriptingSessionState(
  ctx: SceneSubsystemFactoryContext,
  sandbox: ScriptSandbox,
  engine: LuaEngine,
): ScriptingSessionState {
  const resourceLoader = ctx.ports.get(ResourceLoaderPortDef);
  const diagnostic = ctx.ports.get(DiagnosticPortDef);
  const resolver = resourceLoader
    ? createResourceScriptResolver(resourceLoader, createBuiltInScriptResolver(), diagnostic)
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
