import type Container from '../di/Container';
import { HttpServer } from '@infra/http/HttpServer';
import { SocketIOAdapter } from '@infra/websocket/SocketIOAdapter';
import { SimulationService } from '@app/simulation/SimulationService';
import { WorkerPoolAdapter } from '@infra/workers/WorkerPoolAdapter';

/**
 * ServerApp coordina los componentes principales del servidor.
 * - HttpServer: maneja HTTP/Express
 * - SocketIOAdapter: maneja WebSockets
 * - SimulationService: maneja el loop de simulación (usando workers internamente)
 * 
 * Patrón: Composition Root - ensambla y coordina adaptadores y servicios.
 */
export class ServerApp {
  private container: Container;
  private httpServer?: HttpServer;
  private socketAdapter?: SocketIOAdapter;
  private simulationService?: SimulationService;

  constructor(container: Container) {
    this.container = container;
  }

  public async start(): Promise<void> {
    const config = this.container.getServerConfig();

    // 1. Inicializar HTTP Server
    this.httpServer = new HttpServer(config.port);
    await this.httpServer.start();

    // 2. Inicializar Socket.IO sobre el HTTP Server
    this.socketAdapter = new SocketIOAdapter();
    this.socketAdapter.initialize(this.httpServer.getHttpServer());

    // 3. Crear e inicializar servicio de simulación (con worker pool inyectado)
    const workerPool = new WorkerPoolAdapter();
    this.simulationService = new SimulationService(config, workerPool);

    // 4. Conectar simulación con WebSocket para emitir eventos
    this.simulationService.onTick((gameTick, galaxy) => {
      this.socketAdapter!.emit('tick', gameTick);
      this.socketAdapter!.emit('galaxy', galaxy);
    });

    // 5. Arrancar simulación
    await this.simulationService.start();

    console.log('[ServerApp] 🚀 SpaceDucks completamente iniciado');
  }

  public async stop(): Promise<void> {
    // Detener en orden inverso
    if (this.simulationService) {
      await this.simulationService.stop();
      this.simulationService = undefined;
    }

    if (this.socketAdapter) {
      await this.socketAdapter.close();
      this.socketAdapter = undefined;
    }

    if (this.httpServer) {
      await this.httpServer.stop();
      this.httpServer = undefined;
    }

    console.log('[ServerApp] ✓ Detenido completamente');
  }
}

export default ServerApp;
