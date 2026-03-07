import type { EngineSystemAdapter } from '../../domain/types/engineSystemAdapter';
import { defineEngineUseCase } from './engineUseCase';

/** Parameters for the registerEngineAdapter use case. */
export interface RegisterEngineAdapterParams {
  readonly adapter: EngineSystemAdapter;
}

/**
 * Registers an engine-level adapter (render, audio …).
 * Adapters are called in registration order during `updateEngine`.
 */
export const registerEngineAdapter = defineEngineUseCase<RegisterEngineAdapterParams, void>({
  name: 'registerEngineAdapter',
  execute(engine, { adapter }) {
    engine.engineAdapters.push(adapter);
  },
});
