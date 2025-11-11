import type Container from '../di/Container';
import { HttpServer } from '@infra/http/HttpServer';
import { SocketIOAdapter } from '@infra/websocket/SocketIOAdapter';
import { GameSimulation } from '@app/simulation/GameSimulation';

/**
 * ServerApp coordina los componentes principales del servidor.
 * - HttpServer: maneja HTTP/Express
 * - SocketIOAdapter: maneja WebSockets
 * - GameSimulation: maneja el loop de simulación
 * 
 * Patrón: Composition Root - ensambla y coordina adaptadores y servicios.
 */
export class ServerApp {
  private container: Container;
  private httpServer?: HttpServer;
  private socketAdapter?: SocketIOAdapter;
  private gameSimulation?: GameSimulation;

  constructor(container: Container) {
    this.container = container;
  }

  public async start(): Promise<void> {
    const config = this.container.getServerConfig();
    const galaxyManager = this.container.getGalaxyManager();

    // 1. Inicializar HTTP Server
    this.httpServer = new HttpServer(config.port);
    await this.httpServer.start();

    // 2. Inicializar Socket.IO sobre el HTTP Server
    this.socketAdapter = new SocketIOAdapter();
    this.socketAdapter.initialize(this.httpServer.getHttpServer());

    // 3. Inicializar simulación
    this.gameSimulation = new GameSimulation(galaxyManager, config.tickRate);

    // 4. Conectar simulación con WebSocket para emitir eventos
    this.gameSimulation.onTick((gameTick, galaxy) => {
      this.socketAdapter!.emit('tick', gameTick);
      this.socketAdapter!.emit('galaxy', galaxy);
    });

    // 5. Arrancar simulación
    this.gameSimulation.start();

    console.log('[ServerApp] 🚀 SpaceDucks completamente iniciado');
  }

  public async stop(): Promise<void> {
    // Detener en orden inverso
    if (this.gameSimulation) {
      this.gameSimulation.stop();
      this.gameSimulation = undefined;
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
