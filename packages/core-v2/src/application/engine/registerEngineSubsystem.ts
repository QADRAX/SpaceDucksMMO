import type { EngineSubsystem } from '../../domain/subsystems';
import { defineEngineUseCase } from '../../domain/useCases';

/** Parameters for the registerEngineSubsystem use case. */
export interface RegisterEngineSubsystemParams {
  readonly subsystem: EngineSubsystem;
}

/**
 * Registers an engine-level subsystem (render, audio …).
 * Subsystems are called in registration order during `updateEngine`.
 */
export const registerEngineSubsystem = defineEngineUseCase<RegisterEngineSubsystemParams, void>({
  name: 'registerEngineSubsystem',
  execute(engine, { subsystem }) {
    engine.engineSubsystems.push(subsystem);
  },
});
