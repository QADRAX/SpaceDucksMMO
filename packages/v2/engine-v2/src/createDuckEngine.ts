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
import { createNoopInputPort } from '@duckengine/input-node-v2';
import type {
  DuckEngineAPI,
  InputPort,
  DiagnosticPort,
  ViewportRectProviderPort,
  PortBinding,
} from '@duckengine/core-v2';
import type { ResourceLoader } from '@duckengine/resource-coordinator-v2';
import { createResourceCoordinatorSubsystem } from '@duckengine/resource-coordinator-v2';
import { createPhysicsSubsystem } from '@duckengine/physics-rapier-v2';
import { createRenderingSubsystem } from '@duckengine/rendering-three-webgpu-v2';
import { createScriptingSubsystem } from '@duckengine/scripting-lua';
import type { EngineSubsystem, SceneSubsystemFactory } from '@duckengine/core-v2';

/** Options for creating the DuckEngine with all subsystems. */
export interface CreateDuckEngineOptions {
  /** Resource loader for mesh, texture, skybox, script resolution. Required for resource coordinator. */
  readonly resourceLoader: ResourceLoader;
  /** Viewport rect provider for rendering layout. Default: in-memory provider. */
  readonly viewportRectProvider?: ViewportRectProviderPort;
  /** Input port for scripting (keyboard, mouse). Default: no-op. */
  readonly input?: InputPort;
  /** Diagnostic port for logging. Default: log stack + console (see @duckengine/diagnostic-v2). */
  readonly diagnostic?: DiagnosticPort;
  /** Custom port bindings merged with defaults. */
  readonly customPorts?: PortBinding<unknown>[];
  /** Subsystems to include. Default: all. */
  readonly subsystems?: {
    resourceCoordinator?: boolean;
    physics?: boolean;
    rendering?: boolean;
    scripting?: boolean;
  };
}

/** Default diagnostic: log stack + console sink. Use logStack for file export, UI, etc. */
const defaultDiagnostic = createLogStackDiagnosticPort({
  sinks: [createConsoleSink()],
});


/**
 * Creates a fully configured DuckEngine with core + physics + rendering + scripting + resource coordinator.
 *
 * The consumer provides ResourceLoader and optionally ViewportRectProvider.
 * Other ports (Input, Gizmo) default to no-ops. Diagnostic defaults to log stack + console.
 *
 * For log stack access (file export, UI console), use createLogStackDiagnosticPort:
 * ```ts
 * const { port, logStack } = createLogStackDiagnosticPort({ sinks: [createConsoleSink()] });
 * const api = await createDuckEngine({ diagnostic: port, resourceLoader, ... });
 * // logStack.getEntries() for export/UI
 * ```
 *
 * @example
 * ```ts
 * const api = await createDuckEngine({
 *   resourceLoader: myWebCoreLoader,
 *   viewportRectProvider: myLayoutProvider,
 * });
 * api.setup({});
 * api.addScene({ sceneId: createSceneId('main') });
 * api.scene(createSceneId('main')).setupScene({});
 * ```
 */
export async function createDuckEngine(
  options: CreateDuckEngineOptions,
): Promise<DuckEngineAPI> {
  const {
    resourceLoader,
    viewportRectProvider = createDefaultViewportRectProvider(),
    input = createNoopInputPort(),
    diagnostic = defaultDiagnostic.port,
    customPorts = [],
    subsystems = {},
  } = options;

  const subs = {
    resourceCoordinator: subsystems.resourceCoordinator ?? true,
    physics: subsystems.physics ?? true,
    rendering: subsystems.rendering ?? true,
    scripting: subsystems.scripting ?? true,
  };

  const engine = createEngine();
  const api = createDuckEngineAPI(engine);

  const defaultPorts: PortBinding<unknown>[] = [
    DiagnosticPortDef.bind(diagnostic),
    InputPortDef.bind(input),
  ];

  const engineSubsystems: EngineSubsystem[] = [];
  if (subs.resourceCoordinator) {
    engineSubsystems.push(createResourceCoordinatorSubsystem({ resourceLoader }));
  }
  if (subs.rendering) {
    engineSubsystems.push(createRenderingSubsystem({ viewportRectProvider }));
  }

  const sceneSubsystems: SceneSubsystemFactory[] = [];
  if (subs.physics) {
    sceneSubsystems.push(createPhysicsSubsystem());
  }
  if (subs.scripting) {
    sceneSubsystems.push(await createScriptingSubsystem());
  }

  api.setup({
    customPorts: [...defaultPorts, ...customPorts],
    engineSubsystems,
    sceneSubsystems,
  });

  return api;
}
