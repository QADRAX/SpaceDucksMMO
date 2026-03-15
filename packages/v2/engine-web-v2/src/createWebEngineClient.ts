import {
  createEngine,
  createDuckEngineAPI,
  DiagnosticPortDef,
  InputPortDef,
  createDefaultViewportRectProvider,
} from '@duckengine/core-v2';
import {
  createLogStackDiagnosticPort,
  createConsoleSink,
} from '@duckengine/diagnostic-v2';
import type { LogSink } from '@duckengine/diagnostic-v2';
import { createNoopInputPort } from '@duckengine/input-node-v2';
import type {
  InputPort,
  ViewportRectProviderPort,
  PortBinding,
} from '@duckengine/core-v2';
import type { ResourceLoader } from '@duckengine/resource-coordinator-v2';
import { createResourceCoordinatorSubsystem } from '@duckengine/resource-coordinator-v2';
import { createPhysicsSubsystem } from '@duckengine/physics-rapier-v2';
import { createRenderingSubsystem } from '@duckengine/rendering-three-v2';
import { createScriptingSubsystem } from '@duckengine/scripting-lua';
import type { EngineSubsystem, SceneSubsystemFactory } from '@duckengine/core-v2';
import type { DuckEngineWebClient } from './types';

/** Options for creating the web engine client. */
export interface CreateWebEngineClientOptions {
  /** Resource loader for mesh, texture, skybox, script resolution. Required for resource coordinator. */
  readonly resourceLoader: ResourceLoader;
  /** Viewport rect provider for rendering layout. Default: in-memory provider. */
  readonly viewportRectProvider?: ViewportRectProviderPort;
  /** Input port for scripting (keyboard, mouse). Default: no-op. */
  readonly input?: InputPort;
  /** Log sinks (e.g. console, file, UI). Default: [createConsoleSink()]. */
  readonly sinks?: LogSink[];
  /** Custom port bindings merged with defaults. */
  readonly customPorts?: PortBinding<unknown>[];
}

/**
 * Creates a ready-to-use DuckEngine client for web apps.
 * Setup is run internally — the returned client does not expose setup or registerSubsystem.
 * logStack is included for log inspection (export, UI console).
 *
 * @example
 * ```ts
 * const client = await createWebEngineClient({
 *   resourceLoader: myWebLoader,
 *   viewportRectProvider: myLayoutProvider,
 *   sinks: [(e) => console.log(`[${e.level}]`, e.message)],
 * });
 * client.addScene({ sceneId: createSceneId('main') });
 * client.scene(createSceneId('main')).setupScene({});
 * client.update({});
 * const entries = client.logStack.getEntries();
 * ```
 */
export async function createWebEngineClient(
  options: CreateWebEngineClientOptions,
): Promise<DuckEngineWebClient> {
  const {
    resourceLoader,
    viewportRectProvider = createDefaultViewportRectProvider(),
    input = createNoopInputPort(),
    sinks = [createConsoleSink()],
    customPorts = [],
  } = options;

  const { port: diagnostic, logStack } = createLogStackDiagnosticPort({ sinks });

  const engine = createEngine();
  const api = createDuckEngineAPI(engine);

  const defaultPorts: PortBinding<unknown>[] = [
    DiagnosticPortDef.bind(diagnostic),
    InputPortDef.bind(input),
  ];

  const engineSubsystems: EngineSubsystem[] = [
    createResourceCoordinatorSubsystem({ resourceLoader }),
    createRenderingSubsystem({ viewportRectProvider }),
  ];

  const sceneSubsystems: SceneSubsystemFactory[] = [
    createPhysicsSubsystem(),
    await createScriptingSubsystem(),
  ];

  api.setup({
    customPorts: [...defaultPorts, ...customPorts],
    engineSubsystems,
    sceneSubsystems,
  });

  const { setup, registerSubsystem, ...client } = api;
  void setup;
  void registerSubsystem;
  return { ...client, logStack } as DuckEngineWebClient;
}
