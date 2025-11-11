import path from 'path';

/**
 * WorkerScriptResolver maneja la resolución de rutas de scripts de workers
 * en diferentes entornos (desarrollo TypeScript vs producción JavaScript).
 * 
 * Encapsula la lógica de detección de entorno para evitar repetición.
 */
export class WorkerScriptResolver {
  /**
   * Detecta si estamos en modo desarrollo (TypeScript) o producción (JavaScript).
   */
  private static isDevelopment(): boolean {
    // Detectar si estamos ejecutando TypeScript directamente
    return (
      __filename.endsWith('.ts') || 
      !!process.env.TS_NODE_DEV || 
      !!process.env.NODE_ENV?.includes('dev')
    );
  }

  /**
   * Resuelve la ruta completa de un script de worker según el entorno.
   * 
   * @param baseDir - Directorio base desde donde resolver (típicamente __dirname)
   * @param relativePath - Ruta relativa al script sin extensión (ej: '../../workers/simulationWorker')
   * @returns Ruta absoluta con extensión correcta (.ts o .js)
   * 
   * @example
   * // Desde SimulationService
   * const script = WorkerScriptResolver.resolve(__dirname, '../../workers/simulationWorker');
   * // Dev:  /path/to/workers/simulationWorker.ts
   * // Prod: /path/to/dist/workers/simulationWorker.js
   */
  public static resolve(baseDir: string, relativePath: string): string {
    const isDev = this.isDevelopment();
    const extension = isDev ? '.ts' : '.js';
    return path.resolve(baseDir, `${relativePath}${extension}`);
  }

  /**
   * Retorna los execArgv necesarios para ejecutar TypeScript en workers (solo en dev).
   * 
   * @returns Array de argumentos para Worker constructor, o undefined en producción
   * 
   * @example
   * new Worker(script, {
   *   execArgv: WorkerScriptResolver.getExecArgv(),
   *   workerData: { ... }
   * });
   */
  public static getExecArgv(): string[] | undefined {
    const isDev = this.isDevelopment();
    return isDev 
      ? ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register'] 
      : undefined;
  }

  /**
   * Verifica si estamos en desarrollo.
   * Útil para logging o comportamiento condicional.
   */
  public static isDevMode(): boolean {
    return this.isDevelopment();
  }
}
