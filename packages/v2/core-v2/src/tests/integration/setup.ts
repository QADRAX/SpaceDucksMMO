import { createEngine } from '../../domain/engine/createEngine';
import { createDuckEngineAPI } from '../../infrastructure/api/createDuckEngineAPI';
import type { DuckEngineAPI } from '../../infrastructure/api/createDuckEngineAPI';
import type { EngineState } from '../../domain/engine/types';
export * from '../../domain/ids';

/** Test context with engine state and api instance. */
export interface TestContext {
    engine: EngineState;
    api: DuckEngineAPI;
}

/** Initializes a fresh engine and api for testing. */
export function setupIntegrationTest(): TestContext {
    const engine = createEngine();
    const api = createDuckEngineAPI(engine);
    api.setup({});
    return { engine, api };
}
