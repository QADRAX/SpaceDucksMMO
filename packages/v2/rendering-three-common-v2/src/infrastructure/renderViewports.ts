import type { EngineState } from '@duckengine/core-v2';
import {
  ViewportRectProviderPortDef,
  DEFAULT_RECT,
  hasValidDimensions,
} from '@duckengine/core-v2';
import type { PerSceneState } from '../domain/renderContextThree';
import type { RendererFactory } from '../domain/rendererLike';
import { findCamera } from '../domain/three/findCamera';
import { computeViewportScissor } from '../domain/viewportScissor';

/**
 * Renders all enabled viewports. Shared by GL and WebGPU.
 * Uses rendererFactory to get/create renderers (handles sync vs async init).
 * Rect is resolved from ViewportRectProviderPort when registered.
 */
export function renderViewports(
  engine: EngineState,
  perScene: Map<string, PerSceneState>,
  rendererFactory: RendererFactory,
): void {
  const rectPort = engine.subsystemRuntime.ports.get(
    ViewportRectProviderPortDef.id,
  ) as { getRect: (id: string) => { x: number; y: number; w: number; h: number } } | undefined;
  const getRect = rectPort
    ? (id: string) => rectPort.getRect(id)
    : () => DEFAULT_RECT;

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
    const rect = getRect(viewport.id);
    if (!hasValidDimensions(rect)) continue;

    const { x, y, w, h } = computeViewportScissor(
      canvas.width,
      canvas.height,
      rect,
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
