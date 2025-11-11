import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { GameTick } from '@spaceducks/core';
import Container from './di/Container';

/**
 * Punto de entrada del servidor SpaceDucks.
 * - Inicializa el contenedor de dependencias.
 * - Configura Express + Socket.IO.
 * - Inicia el loop de simulación.
 */
async function main() {
  try {
    // Inicializar contenedor de dependencias (async)
    const container = new Container();
    await container.initialize();

    // Obtener dependencias inyectadas
    const config = container.getServerConfig();
    const galaxyManager = container.getGalaxyManager();

    const app = express();

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', time: Date.now() });
    });

    const server = http.createServer(app);
    const io = new IOServer(server, {
      cors: {
        origin: '*'
      }
    });

    io.on('connection', (socket) => {
      console.log(`[Server] Client connected: ${socket.id}`);

      socket.on('disconnect', (reason) => {
        console.log(`[Server] Client disconnected ${socket.id} (${reason})`);
      });
    });

    // Iniciar loop de simulación
    let tick = 0;
    const DT_MS = 1000 / config.tickRate;

    setInterval(() => {
      tick += 1;
      const gameTick: GameTick = {
        tick,
        dt: DT_MS,
        time: Date.now()
      };
      // Avanzar simulación de la galaxia
      galaxyManager.tick(DT_MS);
      // Emitir tick y estado de la galaxia
      io.emit('tick', gameTick);
      io.emit('galaxy', galaxyManager.galaxy);
    }, DT_MS);

    // Iniciar servidor HTTP
    server.listen(config.port, () => {
      console.log(`[Server] 🚀 SpaceDucks listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('[Server] ❌ Error al inicializar:', error);
    process.exit(1);
  }
}

// Ejecutar main
main();
