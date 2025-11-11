import dotenv from 'dotenv';
import fs from 'fs';

// Cargar .env al inicio del módulo, sin require() en runtime
dotenv.config();

/**
 * Interfaz que define el contrato de configuración del servidor.
 */
export interface IServerConfig {
  port: number;
  tickRate: number;
  galaxyConfigPath: string;
}

/**
 * Configuración del servidor SpaceDucks.
 * Lee desde process.env (previamente cargado desde .env).
 * Inmutable y validada al construirse.
 */
export class ServerConfig implements IServerConfig {
  readonly port: number;
  readonly tickRate: number;
  readonly galaxyConfigPath: string;

  constructor() {
    this.port = parseInt(process.env.PORT ?? '3000', 10);
    this.tickRate = parseInt(process.env.TICK_RATE ?? '20', 10);
    this.galaxyConfigPath = process.env.GALAXY_CONFIG_PATH ?? '';

    this.validate();
  }

  /**
   * Valida que los valores sean válidos. Lanza Error si hay problemas.
   */
  private validate(): void {
    if (this.port <= 0 || this.port > 65535) {
      throw new Error(`[ServerConfig] Puerto inválido: ${this.port}. Debe estar entre 1 y 65535.`);
    }
    if (this.tickRate <= 0) {
      throw new Error(`[ServerConfig] TICK_RATE debe ser positivo, recibido: ${this.tickRate}`);
    }
    if (!fs.existsSync(this.galaxyConfigPath)) {
      console.warn(`[ServerConfig] Advertencia: galaxyConfigPath no existe: ${this.galaxyConfigPath}`);
    }
  }

  /**
   * Representación legible de la configuración.
   */
  toString(): string {
    return `ServerConfig { port: ${this.port}, tickRate: ${this.tickRate}, galaxyConfigPath: ${this.galaxyConfigPath} }`;
  }
}
