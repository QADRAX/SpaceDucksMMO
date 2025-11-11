import type { GameTick } from '@spaceducks/core';
import type { GalaxyManager } from '../galaxy/GalaxyManager';

/**
 * Callback invocado en cada tick de simulación.
 * Recibe el estado del tick y la galaxia actualizada.
 */
export type SimulationTickCallback = (tick: GameTick, galaxy: any) => void;

/**
 * GameSimulation orquesta el loop de simulación del juego.
 * - Coordina el avance de tiempo (tick counter, dt).
 * - Invoca managers necesarios (GalaxyManager, etc.).
 * - Notifica a listeners externos mediante callbacks.
 * 
 * Patrón: Servicio de aplicación que coordina casos de uso de simulación.
 */
export class GameSimulation {
  private galaxyManager: GalaxyManager;
  private tickRate: number;
  private intervalId?: NodeJS.Timeout;
  private tickCounter: number = 0;
  private onTickCallbacks: SimulationTickCallback[] = [];

  constructor(galaxyManager: GalaxyManager, tickRate: number) {
    this.galaxyManager = galaxyManager;
    this.tickRate = tickRate;
  }

  /**
   * Registra un callback para ser notificado en cada tick.
   */
  public onTick(callback: SimulationTickCallback): void {
    this.onTickCallbacks.push(callback);
  }

  /**
   * Inicia el loop de simulación.
   */
  public start(): void {
    if (this.intervalId) {
      console.warn('[GameSimulation] Ya está corriendo');
      return;
    }

    const dtMs = 1000 / this.tickRate;

    this.intervalId = setInterval(() => {
      this.tickCounter += 1;
      
      // Construir GameTick
      const gameTick: GameTick = {
        tick: this.tickCounter,
        dt: dtMs,
        time: Date.now()
      };

      // Avanzar simulación de galaxia
      this.galaxyManager.tick(dtMs);

      // Notificar a listeners
      this.onTickCallbacks.forEach(cb => {
        cb(gameTick, this.galaxyManager.galaxy);
      });
    }, dtMs);

    console.log(`[GameSimulation] ✓ Iniciada (${this.tickRate} ticks/s)`);
  }

  /**
   * Detiene el loop de simulación.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('[GameSimulation] Detenida');
    }
  }

  /**
   * @returns El número de tick actual
   */
  public getCurrentTick(): number {
    return this.tickCounter;
  }
}
