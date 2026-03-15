import { createEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import type { ViewportRectProviderPort } from '@duckengine/core-v2';
import {
  syncRender,
  renderFrame,
  disposeRender,
  reconcilePendingRenderablesForKey,
  type RenderEngineState,
} from '@duckengine/rendering-base-v2';
import { provideRenderingPorts } from '@duckengine/rendering-three-common-v2';
import { createRenderingState } from './createRenderingState';

/** Options for the WebGL rendering subsystem. */
export interface CreateRenderingSubsystemOptions {
  /** Viewport rect provider. Consumer implements based on layout (web, Electron, etc.). */
  readonly viewportRectProvider: ViewportRectProviderPort;
}

/**
 * Creates the WebGL rendering engine subsystem. Register via
 * setupEngine({ engineSubsystems: [createRenderingSubsystem(options)] })
 * or api.registerSubsystem({ subsystem: createRenderingSubsystem(options) }).
 *
 * Registers:
 * - ViewportRectProviderPort (engine-level, from opts) via provideRenderingPorts
 * - GizmoPort (per-scene) when rendering creates per-scene state (createGizmoScenePortRegistration)
 */
export function createRenderingSubsystem(
  options: CreateRenderingSubsystemOptions,
): EngineSubsystem {
  const { viewportRectProvider } = options;

  return createEngineSubsystem<RenderEngineState>({
    id: 'rendering-three-gl',
    createState: ({ engine }) => createRenderingState({ engine }),
    engineEvents: {
      'resource-loaded': reconcilePendingRenderablesForKey,
    },
    phases: {
      preRender: syncRender,
      render: renderFrame,
    },
    portProviders: [provideRenderingPorts(viewportRectProvider)],
    dispose: disposeRender,
  });
}
