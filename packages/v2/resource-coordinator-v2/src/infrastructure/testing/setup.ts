import {
  createEngine,
  createDuckEngineAPI,
  DiagnosticPortDef,
  createSceneId,
  createEntityId,
  createEntity,
  createComponent,
  createResourceRef,
  createResourceKey,
} from '@duckengine/core-v2';
import type { ResourceLoader } from '../../domain/resourceLoader';
import type { Result, ResolvedResource } from '@duckengine/core-v2';
import { createResourceCoordinatorSubsystem } from '../resourceCoordinatorSubsystem';

/** Creates a mock ResourceLoader for tests. Resolve and fetchFile are configurable. */
export function createMockResourceLoader(overrides?: {
  resolve?: ResourceLoader['resolve'];
  fetchFile?: ResourceLoader['fetchFile'];
}): ResourceLoader {
  const defaultResolve: ResourceLoader['resolve'] = async (ref) => {
    const url = `https://test.example/${ref.kind}/${ref.key}`;
    const files: Record<string, { url: string }> = {};
    if (ref.kind === 'mesh') {
      files.geometry = { url: url + '/geometry.json' };
    } else if (ref.kind === 'texture') {
      files.image = { url: url + '/image.png' };
    } else if (ref.kind === 'skybox') {
      ['px', 'nx', 'py', 'ny', 'pz'].forEach((f) => {
        files[f as keyof typeof files] = { url: url + `/${f}.png` };
      });
    } else if (ref.kind === 'script') {
      files.source = { url: url + '/source.lua' };
    }
    return {
      ok: true,
      value: {
        key: ref.key,
        resourceId: 'test-id',
        version: 1,
        componentType: ref.kind,
        componentData: {},
        files,
      },
    } as Result<ResolvedResource<typeof ref.kind>>;
  };

  const defaultFetchFile: ResourceLoader['fetchFile'] = async (url, format) => {
    const meshJson = JSON.stringify({ positions: [], indices: [] });
    if (format === 'text') {
      if (url.includes('geometry')) {
        return { ok: true, value: meshJson };
      }
      if (url.includes('source')) {
        return { ok: true, value: 'return {}' };
      }
    }
    if (format === 'blob') {
      if (url.includes('geometry')) {
        return { ok: true, value: new Blob([meshJson]) };
      }
      return { ok: true, value: new Blob(['']) };
    }
    return { ok: false, error: { code: 'not-found', message: 'Unknown url' } } as any;
  };

  return {
    resolve: overrides?.resolve ?? defaultResolve,
    fetchFile: overrides?.fetchFile ?? defaultFetchFile,
  };
}

/** Minimal DiagnosticPort for tests. */
const mockDiagnostic = {
  log: () => {},
};

/**
 * Bootstraps engine with ResourceCoordinator only.
 * No scripting, physics, rendering, or other subsystems.
 */
export function setupResourceCoordinatorIntegrationTest(params?: {
  resourceLoader?: ResourceLoader;
}) {
  const engine = createEngine();
  const api = createDuckEngineAPI(engine);

  const resourceLoader = params?.resourceLoader ?? createMockResourceLoader();

  const coordinator = createResourceCoordinatorSubsystem({ resourceLoader });

  api.setup({
    customPorts: [DiagnosticPortDef.bind(mockDiagnostic)],
    engineSubsystems: [coordinator],
    sceneSubsystems: [],
  });

  return {
    api,
    engine,
    resourceLoader,
  };
}

/** Adds a scene with an entity. */
export function addSceneWithEntity(
  api: ReturnType<typeof createDuckEngineAPI>,
  sceneId = createSceneId('main'),
  entityId = createEntityId('e1'),
) {
  api.addScene({ sceneId });
  api.scene(sceneId).addEntity({ entity: createEntity(entityId) });
  return api.scene(sceneId);
}

/** Adds customGeometry with mesh ref to entity. */
export function addCustomGeometry(
  api: ReturnType<typeof createDuckEngineAPI>,
  sceneId: ReturnType<typeof createSceneId>,
  entityId: ReturnType<typeof createEntityId>,
  meshKey: string,
) {
  const meshRef = createResourceRef(createResourceKey(meshKey), 'mesh');
  api.scene(sceneId).entity(entityId).addComponent({
    component: createComponent('customGeometry', { mesh: meshRef }),
  });
}

/** Adds script component with external script ref(s). */
export function addScriptComponent(
  api: ReturnType<typeof createDuckEngineAPI>,
  sceneId: ReturnType<typeof createSceneId>,
  entityId: ReturnType<typeof createEntityId>,
  scriptIdOrScripts: string | Array<{ scriptId: string; enabled?: boolean; properties?: Record<string, unknown> }>,
) {
  const scripts = typeof scriptIdOrScripts === 'string'
    ? [{ scriptId: scriptIdOrScripts, enabled: true, properties: {} }]
    : scriptIdOrScripts.map((s) => ({
        scriptId: s.scriptId,
        enabled: s.enabled ?? true,
        properties: s.properties ?? {},
      }));
  api.scene(sceneId).entity(entityId).addComponent({
    component: createComponent('script', { scripts }),
  });
}

/** Waits for async resource loads. */
export function waitForLoads(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
