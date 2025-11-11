import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import type { GameTick } from '@spaceducks/core';
import type Container from '../di/Container';

/**
 * ServerApp encapsula el setup y ciclo de vida del servidor HTTP + Socket.IO
 * - Se construye con un `Container` ya inicializado (dependencias listas).
 * - start() arranca el servidor y la simulación.
 */
export class ServerApp {
  private container: Container;
  private io?: IOServer;
  private server?: http.Server;
  private intervalId?: NodeJS.Timeout;

  constructor(container: Container) {
    this.container = container;
  }

  public async start(): Promise<void> {
    const config = this.container.getServerConfig();
    const galaxyManager = this.container.getGalaxyManager();

    const app = express();

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', time: Date.now() });
    });

    this.server = http.createServer(app);
    this.io = new IOServer(this.server, {
      cors: { origin: '*' }
    });

    this.io.on('connection', (socket) => {
      console.log(`[ServerApp] Client connected: ${socket.id}`);

      socket.on('disconnect', (reason) => {
        console.log(`[ServerApp] Client disconnected ${socket.id} (${reason})`);
      });
    });

    // Start simulation loop
    let tick = 0;
    const DT_MS = 1000 / config.tickRate;

    this.intervalId = setInterval(() => {
      tick += 1;
      const gameTick: GameTick = {
        tick,
        dt: DT_MS,
        time: Date.now()
      };

      galaxyManager.tick(DT_MS);
      this.io!.emit('tick', gameTick);
      this.io!.emit('galaxy', galaxyManager.galaxy);
    }, DT_MS);

    // Start server
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(config.port, () => {
        console.log(`[ServerApp] 🚀 SpaceDucks listening on http://localhost:${config.port}`);
        resolve();
      });
      this.server!.on('error', (err) => reject(err));
    });
  }

  public async stop(): Promise<void> {
    // Stop interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Close io and server
    if (this.io) {
      await this.io.close();
      this.io = undefined;
    }
    if (this.server) {
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
      this.server = undefined;
    }

    console.log('[ServerApp] Stopped');
  }
}

export default ServerApp;
