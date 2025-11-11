import { parentPort, workerData } from 'worker_threads';
import type { Galaxy, GameTick } from '@spaceducks/core';
import { advanceOrbit } from '@spaceducks/core';
import { YamlGalaxyLoader } from '@infra/galaxy/YamlGalaxyLoader';

/**
 * Worker genérico de simulación que:
 * - Recibe configuración vía workerData (tickRate, galaxyConfigPath)
 * - Carga galaxia directamente (sin DI Container completo)
 * - Ejecuta loop de simulación y postea resultados
 * 
 * Patrón: Worker Script - script autocontenido sin dependencias pesadas.
 */

// Message types
type MainToWorker = { type: 'stop' };
type WorkerToMain = {
  type: 'tick';
  payload: {
    tick: GameTick;
    galaxy: Galaxy;
  };
};

// Worker configuration from workerData
interface SimulationWorkerData {
  tickRate: number;
  galaxyConfigPath: string;
}

async function bootstrap() {
  if (!parentPort) {
    console.error('[simulationWorker] parentPort is undefined');
    return;
  }

  const config = workerData as SimulationWorkerData;
  if (!config.tickRate || !config.galaxyConfigPath) {
    throw new Error('[simulationWorker] Missing required workerData: tickRate, galaxyConfigPath');
  }

  // Load galaxy directly (no full DI container)
  const loader = new YamlGalaxyLoader();
  const galaxy = await loader.load(config.galaxyConfigPath);
  console.log(`[simulationWorker] ✓ Galaxy loaded: ${Object.keys(galaxy.systems).length} systems`);

  let tickCounter = 0;
  let intervalId: NodeJS.Timeout | undefined;

  const dtMs = 1000 / config.tickRate;

  // Start simulation loop
  intervalId = setInterval(() => {
    tickCounter += 1;

    // Advance galaxy simulation
    for (const sysId of Object.keys(galaxy.systems)) {
      const sys = galaxy.systems[sysId];
      for (const pId of Object.keys(sys.planets)) {
        const planet = sys.planets[pId];
        advanceOrbit(planet, dtMs / 1000);
      }
    }

    // Post tick to main thread
    const gameTick: GameTick = {
      tick: tickCounter,
      dt: dtMs,
      time: Date.now(),
    };

    const message: WorkerToMain = {
      type: 'tick',
      payload: {
        tick: gameTick,
        galaxy,
      },
    };
    parentPort!.postMessage(message);
  }, dtMs);

  console.log(`[simulationWorker] ✓ Simulation started (${config.tickRate} ticks/s)`);

  // Handle control messages
  parentPort.on('message', (msg: MainToWorker) => {
    if (msg && msg.type === 'stop') {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      console.log('[simulationWorker] Stopping...');
      // Give a tiny grace period for any pending posts, then exit
      setTimeout(() => process.exit(0), 50);
    }
  });
}

bootstrap().catch((err) => {
  console.error('[simulationWorker] Failed to start:', err);
  process.exit(1);
});
