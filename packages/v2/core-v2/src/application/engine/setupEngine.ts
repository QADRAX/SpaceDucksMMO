import type {
  SubsystemPortProvider,
  EngineSubsystem,
  SceneSubsystemFactory,
} from '../../domain/subsystems';
import {
  attachSceneSubsystems,
  instantiateSceneSubsystems,
  runSubsystemPortProviders,
} from '../../domain/subsystems';
import { subscribeToEngineChanges } from '../../domain/engine/emitEngineChange';
import { defineEngineUseCase } from '../../domain/useCases';
import type { EnginePorts } from '../../domain/ports';
import type { PortBinding } from '../../domain/subsystems/types';
import { defaultPortProviders } from '../../infrastructure/portProviders';

/** Parameters for initial engine subsystem and port setup. */
export interface SetupEngineParams {
  /** Engine-level subsystems (render, audio, etc.) to register globally. */
  readonly engineSubsystems?: ReadonlyArray<EngineSubsystem>;
  /** Scene subsystem factories that should be applied to all scenes. */
  readonly sceneSubsystems?: ReadonlyArray<SceneSubsystemFactory>;
  /** Initial static ports (IO/capabilities) available to subsystems. */
  readonly ports?: EnginePorts;
  /** Custom engine ports to explicitly bind. */
  readonly customPorts?: ReadonlyArray<PortBinding<any>>;
  /** Hooks that can provide ports from engine state or other ports. */
  readonly portProviders?: ReadonlyArray<SubsystemPortProvider>;
}

/**
 * Configures subsystems and shared I/O ports at engine scope.
 *
 * This is the composition-root use case for subsystem topology:
 * - register engine subsystems,
 * - register scene subsystem factories,
 * - inject/derive shared ports.
 */
export const setupEngine = defineEngineUseCase<SetupEngineParams, void>({
  name: 'setupEngine',
  execute(engine, params) {
    if (params.ports) {
      for (const binding of Object.values(params.ports)) {
        if (binding) {
          engine.subsystemRuntime.portDefinitions.set(binding.definition.id, binding.definition);
          engine.subsystemRuntime.ports.set(binding.definition.id, binding.implementation);
        }
      }
    }

    if (params.customPorts) {
      for (const binding of params.customPorts) {
        engine.subsystemRuntime.portDefinitions.set(binding.definition.id, binding.definition);
        engine.subsystemRuntime.ports.set(binding.definition.id, binding.implementation);
      }
    }

    const subsystemProviders =
      params.engineSubsystems?.flatMap((s) => s.portProviders ?? []) ?? [];
    const allProviders = [
      ...defaultPortProviders,
      ...(params.portProviders ?? []),
      ...subsystemProviders,
    ];
    engine.subsystemRuntime.portProviders.push(...allProviders);

    runSubsystemPortProviders(engine);

    if (params.engineSubsystems) {
      for (const subsystem of params.engineSubsystems) {
        engine.engineSubsystems.push(subsystem);

        if (subsystem.engineEventHandlers) {
          const unsubscribes: Array<() => void> = [];
          for (const [kind, handler] of Object.entries(subsystem.engineEventHandlers)) {
            if (handler) {
              unsubscribes.push(
                subscribeToEngineChanges(engine, (eng, ev) => {
                  if (ev.kind === kind) handler(eng, ev);
                })
              );
            }
          }
          const originalDispose = subsystem.dispose;
          (subsystem as { dispose?: () => void }).dispose = () => {
            for (const unsub of unsubscribes) unsub();
            originalDispose?.();
          };
        }
      }
    }

    if (params.sceneSubsystems && params.sceneSubsystems.length > 0) {
      engine.subsystemRuntime.sceneSubsystemFactories.push(...params.sceneSubsystems);

      for (const scene of engine.scenes.values()) {
        for (const subsystem of engine.engineSubsystems) {
          if (subsystem.onSceneAdded) subsystem.onSceneAdded(engine, scene);
        }
        const subsystems = instantiateSceneSubsystems(engine, scene, params.sceneSubsystems);
        attachSceneSubsystems(engine, scene, subsystems);
      }
    }

    engine.setupComplete = true;
  },
});
