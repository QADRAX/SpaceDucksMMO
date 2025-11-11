import { Worker } from 'worker_threads';
import type IWorkerPool from '@app/ports/IWorkerPool';
import { WorkerScriptResolver } from './WorkerScriptResolver';

/**
 * Implementación de IWorkerPool usando worker_threads de Node.js.
 * Adaptador secundario que encapsula los detalles de Node Worker Threads.
 * 
 * Patrón: Adapter - traduce la interfaz de Worker Threads al puerto IWorkerPool.
 */
export class WorkerPoolAdapter<TMessage = any, TResponse = any> implements IWorkerPool<TMessage, TResponse> {
  private worker?: Worker;
  private messageHandlers: Array<(message: TResponse) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];

  public async start(workerScript: string, workerData?: any): Promise<void> {
    if (this.worker) {
      throw new Error('[WorkerPoolAdapter] Worker already started');
    }

    this.worker = new Worker(workerScript, {
      workerData,
      execArgv: WorkerScriptResolver.getExecArgv(),
    });

    // Conectar handlers internos
    this.worker.on('message', (msg: TResponse) => {
      this.messageHandlers.forEach(handler => handler(msg));
    });

    this.worker.on('error', (err: Error) => {
      this.errorHandlers.forEach(handler => handler(err));
    });

    this.worker.on('exit', (code) => {
      console.log(`[WorkerPoolAdapter] Worker exited with code ${code}`);
    });

    console.log('[WorkerPoolAdapter] ✓ Worker started');
  }

  public postMessage(message: TMessage): void {
    if (!this.worker) {
      throw new Error('[WorkerPoolAdapter] Worker not started');
    }
    this.worker.postMessage(message);
  }

  public onMessage(handler: (message: TResponse) => void): void {
    this.messageHandlers.push(handler);
  }

  public onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  public async stop(): Promise<void> {
    if (!this.worker) {
      return;
    }

    // Enviar señal de parada
    this.worker.postMessage({ type: 'stop' });

    // Esperar a que el worker termine (con timeout)
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[WorkerPoolAdapter] Worker did not exit gracefully, terminating');
        this.worker?.terminate();
        resolve();
      }, 5000); // 5 segundos de timeout

      this.worker?.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.worker = undefined;
    this.messageHandlers = [];
    this.errorHandlers = [];

    console.log('[WorkerPoolAdapter] ✓ Worker stopped');
  }

  public isRunning(): boolean {
    return this.worker !== undefined;
  }
}
