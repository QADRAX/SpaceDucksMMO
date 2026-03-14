import { createEngine, createDuckEngineAPI } from '@duckengine/core-v2';
import type { EngineState } from '@duckengine/core-v2';
import { initRapier } from '../rapier';
import { createPhysicsSubsystem } from '../physicsSubsystem';

/**
 * Bootstraps engine + physics subsystem for integration tests.
 * Initializes Rapier WASM, then creates engine and registers the physics scene subsystem.
 */
export async function setupPhysicsIntegrationTest(): Promise<{
  api: ReturnType<typeof createDuckEngineAPI>;
  engine: EngineState;
}> {
  await initRapier();
  const engine = createEngine();
  const api = createDuckEngineAPI(engine);

  api.setup({
    sceneSubsystems: [createPhysicsSubsystem()],
  });

  return { api, engine };
}
