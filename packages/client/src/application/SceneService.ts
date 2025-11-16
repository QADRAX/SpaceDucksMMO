import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type SceneManager from './SceneManager';

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
      
      // Delegate scene update to SceneManager
      // (SceneManager calls update on current scene, which updates its objects)
      this.sceneManager.update(dt);
      // Previously we failed-fast when a scene did not provide a camera.
      // To support scenes that intentionally have no camera (editor modes,
      // background-only scenes, etc.) we no longer throw here. The engine's
      // `renderFrame()` should handle missing cameras gracefully and simply
      // skip rendering while keeping the app alive.
      this.engine.renderFrame();
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
