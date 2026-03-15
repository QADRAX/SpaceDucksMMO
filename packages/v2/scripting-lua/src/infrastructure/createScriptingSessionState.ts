import type { LuaEngine } from 'wasmoon';
import type { SceneSubsystemFactoryContext } from '@duckengine/core-v2';
import { ResourceCachePortDef, DiagnosticPortDef } from '@duckengine/core-v2';
import { createScriptRuntimeFromContext } from '../domain/session';
import {
  createResourceScriptResolver,
  createBuiltInScriptSchemaResolver,
} from '../domain';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import type { ScriptingSessionState } from '../domain/session';
import type { ScriptSandbox } from '../domain/ports';

/**
 * Creates scripting session state from subsystem context.
 *
 * Resolves ResourceCachePort (optional) and DiagnosticPort from ports.
 * Scripts are coordinated via ResourceCoordinator; resolver reads from cache only.
 */
export function createScriptingSessionState(
  ctx: SceneSubsystemFactoryContext,
  sandbox: ScriptSandbox,
  engine: LuaEngine,
): ScriptingSessionState {
  const resourceCache = ctx.ports.get(ResourceCachePortDef);
  const diagnostic = ctx.ports.get(DiagnosticPortDef);
  const resolver = createResourceScriptResolver(
    createBuiltInScriptResolver(),
    resourceCache,
  );

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
