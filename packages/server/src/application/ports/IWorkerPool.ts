/**
 * Puerto (interfaz) para abstraer la gestión de workers.
 * Permite ejecutar tareas en hilos paralelos sin acoplar a implementaciones específicas.
 * 
 * Patrón: Port (Hexagonal Architecture) - define contrato sin implementación.
 */
export interface IWorkerPool<TMessage = any, TResponse = any> {
  /**
   * Inicia el pool de workers.
   * @param workerScript - Ruta al script del worker
   * @param workerData - Datos de configuración para el worker
   */
  start(workerScript: string, workerData?: any): Promise<void>;

  /**
   * Envía un mensaje al worker.
   * @param message - Mensaje a enviar
   */
  postMessage(message: TMessage): void;

  /**
   * Registra un callback para mensajes del worker.
   * @param handler - Función que procesa mensajes recibidos
   */
  onMessage(handler: (message: TResponse) => void): void;

  /**
   * Registra un callback para errores del worker.
   * @param handler - Función que procesa errores
   */
  onError(handler: (error: Error) => void): void;

  /**
   * Detiene el pool de workers de forma limpia.
   */
  stop(): Promise<void>;

  /**
   * Indica si el pool está activo.
   */
  isRunning(): boolean;
}

export default IWorkerPool;
