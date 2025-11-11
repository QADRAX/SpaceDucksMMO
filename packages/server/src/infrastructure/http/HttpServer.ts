import express, { type Express, type Request, type Response } from 'express';
import http from 'http';

/**
 * HttpServer encapsula el servidor HTTP con Express.
 * - Maneja el ciclo de vida del servidor HTTP.
 * - Registra rutas HTTP (health check, etc.).
 * - Expone el servidor HTTP para ser usado por Socket.IO.
 * 
 * Patrón: Adaptador secundario (driving adapter) para HTTP.
 */
export class HttpServer {
  private app: Express;
  private server?: http.Server;
  private port: number;

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        time: Date.now() 
      });
    });
  }

  /**
   * Inicia el servidor HTTP.
   */
  public async start(): Promise<void> {
    if (this.server) {
      console.warn('[HttpServer] Ya está corriendo');
      return;
    }

    this.server = http.createServer(this.app);

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, () => {
        console.log(`[HttpServer] ✓ Listening on http://localhost:${this.port}`);
        resolve();
      });
      this.server!.on('error', (err) => reject(err));
    });
  }

  /**
   * Detiene el servidor HTTP.
   */
  public async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          console.log('[HttpServer] Stopped');
          resolve();
        });
      });
      this.server = undefined;
    }
  }

  /**
   * Obtiene el servidor HTTP nativo para ser usado por Socket.IO.
   */
  public getHttpServer(): http.Server {
    if (!this.server) {
      throw new Error('[HttpServer] Servidor no iniciado. Llama a start() primero.');
    }
    return this.server;
  }

  /**
   * Obtiene la instancia de Express para registrar rutas adicionales.
   */
  public getExpressApp(): Express {
    return this.app;
  }
}
