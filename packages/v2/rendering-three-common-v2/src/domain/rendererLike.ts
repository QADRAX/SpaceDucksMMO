import type * as THREE from 'three';

/**
 * Minimal renderer interface shared by WebGLRenderer and WebGPURenderer.
 * Used by the common viewport render loop.
 * Uses unknown for setRenderTarget to avoid WebGL vs WebGPU RenderTarget type conflicts.
 */
export interface RendererLike {
  setRenderTarget(target: unknown): void;
  setViewport(x: number, y: number, width: number, height: number): void;
  setScissor(x: number, y: number, width: number, height: number): void;
  setScissorTest(enable: boolean): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}

/**
 * Factory for creating and managing renderers per canvas.
 * GL: creates synchronously, always ready.
 * WebGPU: creates async (init), returns undefined until init completes.
 */
export interface RendererFactory {
  /**
   * Returns the renderer for this viewport, or undefined to skip this frame
   * (e.g. WebGPU renderer not yet initialized).
   */
  getOrCreateRenderer(
    canvasId: string,
    canvas: HTMLCanvasElement,
  ): RendererLike | undefined;

  /** Returns all renderers for the post-loop scissor reset and dispose. */
  getRenderers(): Iterable<RendererLike>;

  /** Dispose all renderers and clear internal state. */
  dispose(): void;
}
