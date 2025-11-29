import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type SceneManager from './SceneManager';
import { getInputServices } from '@client/domain/ecs/core/InputContext';

/**
 * Application service that orchestrates the render loop.
 * Delegates scene management to SceneManager.
 * Responsible only for: initialization, starting/stopping the loop, and per-frame rendering.
 */
export class SceneService {
  private engine: IRenderingEngine;
  private sceneManager: SceneManager;
  private running = false;
  private frameHandle: number | null = null;
  private lastTime = performance.now();

  constructor(engine: IRenderingEngine, sceneManager: SceneManager) {
    this.engine = engine;
    this.sceneManager = sceneManager;
  }

  init(container: HTMLElement): void {
    this.engine.init(container);
    // Scene setup is now delegated to SceneManager.switchTo()
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = now - this.lastTime;
      this.lastTime = now;
      
      this.sceneManager.update(dt);
      this.engine.renderFrame();
      try {
        const input = getInputServices();
        if (input && input.mouse && input.mouse.beginFrame) input.mouse.beginFrame();
      } catch (e) {
        // ignore: input services might not be set in tests
      }
      this.frameHandle = requestAnimationFrame(loop);
    };
    loop();
  }

  stop(): void {
    this.running = false;
    if (this.frameHandle) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }

  /**
   * Expose SceneManager for external scene switching (e.g., from UI navigation)
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }
}

export default SceneService;
