import { createEngine, createDuckEngineAPI } from '@duckengine/core-v2';
import type { EngineState } from '@duckengine/core-v2';
import { createPhysicsSubsystem } from '../physicsSubsystem';

/**
 * Bootstraps engine + physics subsystem for integration tests.
 * createPhysicsSubsystem initializes Rapier WASM internally.
 */
export async function setupPhysicsIntegrationTest(): Promise<{
  api: ReturnType<typeof createDuckEngineAPI>;
  engine: EngineState;
}> {
  const engine = createEngine();
  const api = createDuckEngineAPI(engine);

  api.setup({
    sceneSubsystems: [await createPhysicsSubsystem()],
  });

  return { api, engine };
}
