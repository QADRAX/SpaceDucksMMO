import type {
  SubsystemPortDeriver,
  EngineSubsystem,
  SceneSubsystemFactory,
} from '../../domain/subsystems';
import {
  attachSceneSubsystems,
  instantiateSceneSubsystems,
  runSubsystemPortDerivers,
} from '../../domain/subsystems';
import { defineEngineUseCase } from '../../domain/useCases';
import type { EnginePorts } from '../../domain/ports';
import type { PortBinding } from '../../domain/subsystems/types';

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
  /** Hooks that can derive ports from engine state or other ports. */
  readonly portDerivers?: ReadonlyArray<SubsystemPortDeriver>;
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

    if (params.portDerivers) {
      engine.subsystemRuntime.portDerivers.push(...params.portDerivers);
    }

    runSubsystemPortDerivers(engine);

    if (params.engineSubsystems) {
      engine.engineSubsystems.push(...params.engineSubsystems);
    }

    if (params.sceneSubsystems && params.sceneSubsystems.length > 0) {
      engine.subsystemRuntime.sceneSubsystemFactories.push(...params.sceneSubsystems);

      // Apply newly configured scene subsystems to already-existing scenes.
      for (const scene of engine.scenes.values()) {
        const subsystems = instantiateSceneSubsystems(engine, scene, params.sceneSubsystems);
        attachSceneSubsystems(scene, subsystems);
      }
    }
  },
});
