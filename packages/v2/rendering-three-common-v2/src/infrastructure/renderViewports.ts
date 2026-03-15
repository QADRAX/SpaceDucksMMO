import type { EngineState } from '@duckengine/core-v2';
import type { PerSceneState } from '../domain/renderContextThree';
import type { RendererFactory } from '../domain/rendererLike';
import { findCamera } from '../domain/three/findCamera';
import { computeViewportScissor } from '../domain/viewportScissor';

/**
 * Renders all enabled viewports. Shared by GL and WebGPU.
 * Uses rendererFactory to get/create renderers (handles sync vs async init).
 */
export function renderViewports(
  engine: EngineState,
  perScene: Map<string, PerSceneState>,
  rendererFactory: RendererFactory,
): void {
  for (const viewport of engine.viewports.values()) {
    if (!viewport.enabled) continue;

    const canvas = engine.canvases.get(viewport.canvasId) as HTMLCanvasElement | undefined;
    if (!canvas) continue;

    const renderer = rendererFactory.getOrCreateRenderer(viewport.canvasId, canvas);
    if (!renderer) continue;

    const state = perScene.get(viewport.sceneId);
    if (!state) continue;

    const cameraObj = state.registry.get(viewport.cameraEntityId);
    const camera = findCamera(cameraObj);
    if (!camera) continue;

    renderer.setRenderTarget(null);
    const { x, y, w, h } = computeViewportScissor(
      canvas.width,
      canvas.height,
      viewport.rect,
    );
    renderer.setViewport(x, y, w, h);
    renderer.setScissor(x, y, w, h);
    renderer.setScissorTest(true);
    renderer.render(state.threeScene, camera);
  }

  for (const renderer of rendererFactory.getRenderers()) {
    renderer.setScissorTest(false);
  }
}
