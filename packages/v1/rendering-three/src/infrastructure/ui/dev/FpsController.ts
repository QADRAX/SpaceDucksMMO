/**
 * Consumer-facing FPS overlay/controller contract.
 *
 * Rendering-three does not mandate a specific UI implementation.
 * Clients can provide their own (DOM overlay, stats.js, etc.).
 */
export interface IFpsController {
  start(): void;
  stop(): void;
  update(): void;
  getFps(): number;
  isRunning(): boolean;
  show(): void;
  hide(): void;
  dispose(): void;
}

/**
 * Default implementation that does nothing but keeps a simple running flag.
 * Useful as a safe default and for tests.
 */
export class NoopFpsController implements IFpsController {
  private running = false;

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  update(): void {}

  getFps(): number {
    return 0;
  }

  isRunning(): boolean {
    return this.running;
  }

  show(): void {}
  hide(): void {}

  dispose(): void {
    this.running = false;
  }
}
