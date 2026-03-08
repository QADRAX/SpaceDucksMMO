import type {
  AdapterPortDeriver,
  EngineSystemAdapter,
  SceneAdapterFactory,
} from '../../domain/adapters';
import {
  attachSceneAdapters,
  instantiateSceneAdapters,
  runAdapterPortDerivers,
} from '../../domain/adapters';
import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for initial engine adapter and port setup. */
export interface SetupEngineParams {
  /** Engine-level adapters (render, audio, etc.) to register globally. */
  readonly engineAdapters?: ReadonlyArray<EngineSystemAdapter>;
  /** Scene adapter factories that should be applied to all scenes. */
  readonly sceneAdapters?: ReadonlyArray<SceneAdapterFactory>;
  /** Initial static ports (IO/capabilities) available to adapters. */
  readonly ports?: Readonly<Record<string, unknown>>;
  /** Hooks that can derive ports from engine state or other ports. */
  readonly portDerivers?: ReadonlyArray<AdapterPortDeriver>;
}

/**
 * Configures adapters and shared I/O ports at engine scope.
 *
 * This is the composition-root use case for adapter topology:
 * - register engine adapters,
 * - register scene adapter factories,
 * - inject/derive shared ports.
 */
export const setupEngine = defineEngineUseCase<SetupEngineParams, void>({
  name: 'setupEngine',
  execute(engine, params) {
    if (params.ports) {
      for (const [key, value] of Object.entries(params.ports)) {
        engine.adapterRuntime.ports.set(key, value);
      }
    }

    if (params.portDerivers) {
      engine.adapterRuntime.portDerivers.push(...params.portDerivers);
    }

    runAdapterPortDerivers(engine);

    if (params.engineAdapters) {
      engine.engineAdapters.push(...params.engineAdapters);
    }

    if (params.sceneAdapters && params.sceneAdapters.length > 0) {
      engine.adapterRuntime.sceneAdapterFactories.push(...params.sceneAdapters);

      // Apply newly configured scene adapters to already-existing scenes.
      for (const scene of engine.scenes.values()) {
        const adapters = instantiateSceneAdapters(engine, scene, params.sceneAdapters);
        attachSceneAdapters(scene, adapters);
      }
    }
  },
});
