import type { GameTick, Galaxy } from "@spaceducks/core";
import type { ServerConfig } from "@config/ServerConfig";
import type IWorkerPool from "../ports/IWorkerPool";
import { WorkerScriptResolver } from "@infra/workers/WorkerScriptResolver";

/**
 * Callback invocado en cada tick de simulación del worker.
 */
export type SimulationTickCallback = (tick: GameTick, galaxy: Galaxy) => void;

/**
 * Mensaje recibido del worker de simulación.
 */
type WorkerMessage = {
  type: "tick";
  payload: {
    tick: GameTick;
    galaxy: Galaxy;
  };
};

/**
 * SimulationService orquesta la simulación del juego usando workers.
 * - Coordina el ciclo de vida del worker pool.
 * - Notifica a listeners mediante callbacks cuando llegan ticks.
 * - NO conoce detalles de implementación de workers (usa IWorkerPool).
 *
 * Patrón: Servicio de Aplicación - coordina casos de uso sin conocer infraestructura.
 */
export class SimulationService {
  private config: ServerConfig;
  private workerPool: IWorkerPool<any, WorkerMessage>;
  private tickCallbacks: SimulationTickCallback[] = [];
  private running = false;

  constructor(
    config: ServerConfig,
    workerPool: IWorkerPool<any, WorkerMessage>
  ) {
    this.config = config;
    this.workerPool = workerPool;
  }

  /**
   * Registra un callback para ser notificado en cada tick.
   */
  public onTick(callback: SimulationTickCallback): void {
    this.tickCallbacks.push(callback);
  }

  /**
   * Inicia el servicio de simulación.
   */
  public async start(): Promise<void> {
    if (this.running) {
      console.warn("[SimulationService] Already running");
      return;
    }

    // Resolver ruta del worker script usando helper (abstrae lógica dev/prod)
    const workerScript = WorkerScriptResolver.resolve(
      __dirname,
      "../../workers/simulationWorker"
    );

    // Configuración del worker
    const workerData = {
      tickRate: this.config.tickRate,
      galaxyConfigPath: this.config.galaxyConfigPath,
    };

    // Registrar handlers del worker
    this.workerPool.onMessage((msg: WorkerMessage) => {
      if (msg.type === "tick") {
        // Notificar a todos los listeners
        this.tickCallbacks.forEach((cb) => {
          cb(msg.payload.tick, msg.payload.galaxy);
        });
      }
    });

    this.workerPool.onError((err: Error) => {
      console.error("[SimulationService] Worker error:", err);
    });

    // Iniciar worker pool
    await this.workerPool.start(workerScript, workerData);
    this.running = true;

    console.log(
      `[SimulationService] ✓ Started (${this.config.tickRate} ticks/s)`
    );
  }

  /**
   * Detiene el servicio de simulación.
   */
  public async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    await this.workerPool.stop();
    this.running = false;
    this.tickCallbacks = [];

    console.log("[SimulationService] ✓ Stopped");
  }

  /**
   * Indica si el servicio está activo.
   */
  public isRunning(): boolean {
    return this.running;
  }
}
