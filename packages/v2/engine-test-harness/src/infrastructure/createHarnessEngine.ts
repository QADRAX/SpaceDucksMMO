/**
 * Composes the engine and all subsystems directly.
 * No engine-web-v2 dependency — full control over ports and subsystems.
 */
import {
  createEngine,
  createDuckEngineAPI,
  DiagnosticPortDef,
  InputPortDef,
  createDefaultViewportRectProvider,
  type InputPort,
  type ViewportRectProviderPort,
  type PortBinding,
  type EngineSubsystem,
  type SceneSubsystemFactory,
} from '@duckengine/core-v2';
import type { DuckEngineAPI } from '@duckengine/core-v2';
import {
  createLogStackDiagnosticPort,
  createConsoleSink,
} from '@duckengine/diagnostic-v2';
import type { LogSink } from '@duckengine/diagnostic-v2';
import type { LogStack } from '@duckengine/diagnostic-v2';
import { createNoopInputPort } from '@duckengine/input-node-v2';
import { createBrowserInputPort } from '@duckengine/input-browser-v2';
import type { ResourceLoader } from '@duckengine/resource-coordinator-v2';
import { createResourceCoordinatorSubsystem } from '@duckengine/resource-coordinator-v2';
import { createPhysicsSubsystem } from '@duckengine/physics-rapier-v2';
import { createRenderingSubsystem } from '@duckengine/rendering-three-v2';
import { createScriptingSubsystem } from '@duckengine/scripting-lua';

export type HarnessMode = 'playground' | 'test';

export interface CreateHarnessEngineOptions {
  readonly resourceLoader: ResourceLoader;
  readonly mode?: HarnessMode;
  /** For playground: canvas element for input target. Ignored in test mode. */
  readonly canvasElement?: HTMLElement | null;
  /** Viewport rect provider. Default: in-memory with setRect. */
  readonly viewportRectProvider?: ViewportRectProviderPort;
  /** Log sinks. Default: [createConsoleSink()]. */
  readonly sinks?: LogSink[];
  /** Custom port bindings merged with defaults. */
  readonly customPorts?: PortBinding<unknown>[];
}

export interface HarnessEngineResult {
  /** Full engine API — use directly with loadSceneFromYaml, no cast needed. */
  api: DuckEngineAPI;
  logStack: LogStack;
  viewportRectProvider: ViewportRectProviderPort;
  disposeInput?: () => void;
}

/**
 * Composes the engine with all subsystems. In playground mode, uses real input.
 */
export async function createHarnessEngine(
  options: CreateHarnessEngineOptions,
): Promise<HarnessEngineResult> {
  const {
    resourceLoader,
    mode = 'playground',
    canvasElement = null,
    viewportRectProvider = createDefaultViewportRectProvider(),
    sinks = [createConsoleSink()],
    customPorts = [],
  } = options;

  let disposeInput: (() => void) | undefined;

  const input: InputPort =
    mode === 'playground' && canvasElement
      ? (() => {
          const { port, dispose } = createBrowserInputPort({
            targetElement: canvasElement,
            ignoreEditableTargets: true,
          });
          disposeInput = dispose;
          return port;
        })()
      : createNoopInputPort();

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
    await createPhysicsSubsystem(),
    await createScriptingSubsystem(),
  ];

  api.setup({
    customPorts: [...defaultPorts, ...customPorts],
    engineSubsystems,
    sceneSubsystems,
  });

  return {
    api,
    logStack,
    viewportRectProvider,
    disposeInput,
  };
}
