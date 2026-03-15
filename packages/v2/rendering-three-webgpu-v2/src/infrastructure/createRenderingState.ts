import * as THREE from 'three/webgpu';
import type { EngineState, SceneId } from '@duckengine/core-v2';
import type { RenderEngineState } from '@duckengine/rendering-base-v2';
import type { RendererFactory } from '@duckengine/rendering-three-common-v2';
import {
  syncSceneToRenderTree,
  createPerSceneStateManager,
  renderViewports,
  createGizmoScenePortRegistration,
} from '@duckengine/rendering-three-common-v2';

/**
 * Creates the rendering engine state for WebGPU.
 *
 * - One Three.Scene per engine scene (sceneId); sync pushes ECS state into that scene.
 * - One WebGPURenderer per canvas (canvasId); each viewport renders its scene + camera
 *   into that viewport's canvas (and rect). Multiple viewports can share a canvas (split-screen)
 *   or use different canvases (editor + game view). WebGPU init is async per renderer.
 *
 * Canvas: resolved from engine.canvases.get(viewport.canvasId). Register via api.registerCanvas().
 * Resources: from ResourceCachePort when registered (resource coordinator).
 *
 * Registers GizmoPort on each scene's scenePorts when state is created (same pattern as physics).
 */
export function createRenderingState(params: { engine: EngineState }): RenderEngineState {
  const engine = params.engine;
  const { onSceneStateCreated, clearAll } = createGizmoScenePortRegistration();
  const { perScene, getOrCreateSceneState } = createPerSceneStateManager(engine, {
    onSceneStateCreated,
  });

  const renderersByCanvasId = new Map<string, THREE.WebGPURenderer>();
  const initCompleteByCanvasId = new Set<string>();

  const rendererFactory: RendererFactory = {
    getOrCreateRenderer(canvasId, canvas) {
      let r = renderersByCanvasId.get(canvasId);
      if (!r) {
        r = new THREE.WebGPURenderer({ canvas, antialias: true });
        renderersByCanvasId.set(canvasId, r);
        r.init().then(() => initCompleteByCanvasId.add(canvasId));
        return undefined;
      }
      if (!initCompleteByCanvasId.has(canvasId)) return undefined;
      return r;
    },
    getRenderers: () => renderersByCanvasId.values(),
    dispose() {
      for (const r of renderersByCanvasId.values()) r.dispose();
      renderersByCanvasId.clear();
      initCompleteByCanvasId.clear();
    },
  };

  return {
    ensureSceneReady(engine: EngineState, sceneId: SceneId) {
      getOrCreateSceneState(engine, sceneId);
    },
    sync(engine: EngineState, _dt: number) {
      clearAll();
      for (const [sceneId, scene] of engine.scenes) {
        const state = getOrCreateSceneState(engine, sceneId);
        if (state) {
          syncSceneToRenderTree(scene, state.context, state.features);
        }
      }
    },

    render(engine: EngineState, _dt: number) {
      renderViewports(engine, perScene, rendererFactory);
    },

    dispose() {
      rendererFactory.dispose();
      perScene.clear();
    },
  };
}
