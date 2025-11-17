import type { DevWidgetController, FpsChange } from './DevWidgetController';

type FpsListener = (fps: number) => void;

/**
 * FpsController: standalone FPS update provider (no DOM). Keeps
 * compatibility with the previous controller API but computes FPS
 * internally so we can remove the legacy `FpsCounter` class.
 */
export class FpsController implements DevWidgetController<FpsChange> {
  private frames: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;
  private updateInterval: number = 500;
  private running: boolean = false;
  private visible: boolean = true;
  private changeListeners: Set<(c: FpsChange) => void> = new Set();

  start(): void {
    this.running = true;
    this.emitChange({ running: true });
  }
  stop(): void {
    this.running = false;
    this.emitChange({ running: false });
  }
  toggle(): void {
    this.running = !this.running;
    this.emitChange({ running: this.running });
  }
  isRunning(): boolean {
    return this.running;
  }

  show(): void {
    if (!this.visible) {
      this.visible = true;
      this.emitChange({ visible: true });
    }
  }
  hide(): void {
    if (this.visible) {
      this.visible = false;
      this.emitChange({ visible: false });
    }
  }
  isVisible(): boolean { return this.visible; }

  setPosition(_top: string, _left: string): void { /* no-op */ }
  setUpdateInterval(ms: number): void { this.updateInterval = ms; }

  getFps(): number { return this.fps; }

  private emitChange(change: FpsChange) {
    for (const l of this.changeListeners) l(change);
  }

  update(): void {
    if (!this.running) return;
    this.frames++;
    const now = performance.now();
    const elapsed = now - this.lastTime;
    if (elapsed >= this.updateInterval) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = now;
      this.emitChange({ fps: this.fps });
    }
  }

  onChange(listener: (c: FpsChange) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }
}

export default FpsController;
