import { Server as IOServer, type Socket } from 'socket.io';
import type http from 'http';

/**
 * SocketIOAdapter encapsula Socket.IO para comunicación en tiempo real.
 * - Maneja el ciclo de vida de Socket.IO.
 * - Gestiona conexiones y desconexiones de clientes.
 * - Expone métodos para emitir eventos a todos los clientes.
 * 
 * Patrón: Adaptador secundario (driving adapter) para WebSockets.
 */
export class SocketIOAdapter {
  private io?: IOServer;

  constructor() {}

  /**
   * Inicializa Socket.IO con un servidor HTTP existente.
   */
  public initialize(httpServer: http.Server): void {
    if (this.io) {
      console.warn('[SocketIOAdapter] Ya está inicializado');
      return;
    }

    this.io = new IOServer(httpServer, {
      cors: { origin: '*' }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    console.log('[SocketIOAdapter] ✓ Inicializado');
  }

  private handleConnection(socket: Socket): void {
    console.log(`[SocketIOAdapter] Cliente conectado: ${socket.id}`);

    socket.on('disconnect', (reason: string) => {
      console.log(`[SocketIOAdapter] Cliente desconectado ${socket.id} (${reason})`);
    });

    // Aquí se pueden registrar más eventos personalizados
  }

  /**
   * Emite un evento a todos los clientes conectados.
   */
  public emit(event: string, data: any): void {
    if (!this.io) {
      console.warn('[SocketIOAdapter] No inicializado. Llama a initialize() primero.');
      return;
    }
    this.io.emit(event, data);
  }

  /**
   * Cierra todas las conexiones de Socket.IO.
   */
  public async close(): Promise<void> {
    if (this.io) {
      await this.io.close();
      this.io = undefined;
      console.log('[SocketIOAdapter] Cerrado');
    }
  }

  /**
   * Obtiene la instancia de Socket.IO para usos avanzados.
   */
  public getIO(): IOServer {
    if (!this.io) {
      throw new Error('[SocketIOAdapter] No inicializado. Llama a initialize() primero.');
    }
    return this.io;
  }
}
