import * as THREE from 'three/webgpu';
import type { EngineState } from '@duckengine/core-v2';
import { ResourceCachePortDef } from '@duckengine/core-v2';
import type { RenderEngineState } from '@duckengine/rendering-base-v2';
import {
  syncSceneToRenderTree,
  createDefaultRenderFeatures,
  createRenderObjectRegistry,
  type RenderContextThree,
  type MeshResolver,
  type SkyboxResolver,
  type TextureResolver,
} from '@duckengine/rendering-three-common-v2';

/** Resolves canvasId to the actual canvas element. Inject via options. */
export type CanvasResolver = (canvasId: string) => HTMLCanvasElement | null;

export interface CreateRenderingStateParams {
  getCanvas?: CanvasResolver;
  /** Override mesh resolver. When omitted and engine has ResourceCachePort, uses cache. */
  getMeshData?: MeshResolver;
  /** Override skybox resolver. When omitted and engine has ResourceCachePort, uses cache. */
  getSkyboxTexture?: SkyboxResolver;
}

interface PerSceneState {
  threeScene: THREE.Scene;
  registry: ReturnType<typeof createRenderObjectRegistry>;
  context: RenderContextThree;
  features: ReturnType<typeof createDefaultRenderFeatures>;
}

function findCamera(root: THREE.Object3D | undefined): THREE.PerspectiveCamera | undefined {
  if (!root) return undefined;
  if (root instanceof THREE.PerspectiveCamera) return root;
  for (const child of root.children) {
    const c = findCamera(child);
    if (c) return c;
  }
  return undefined;
}

/**
 * Creates the rendering engine state for WebGPU.
 *
 * - One Three.Scene per engine scene (sceneId); sync pushes ECS state into that scene.
 * - One WebGPURenderer per canvas (canvasId); each viewport renders its scene + camera
 *   into that viewport's canvas (and rect). Multiple viewports can share a canvas (split-screen)
 *   or use different canvases (editor + game view). WebGPU init is async per renderer.
 *
 * When engine is provided and ResourceCachePort is registered, getMeshData and getSkyboxTexture
 * are built from the cache unless overridden in params.
 */
export function createRenderingState(
  params: CreateRenderingStateParams & { engine?: EngineState } = {},
): RenderEngineState {
  const getCanvas = params.getCanvas ?? (() => null);

  const cache = params.engine
    ? (params.engine.subsystemRuntime.ports.get(ResourceCachePortDef.id) as
        | {
            getMeshData: MeshResolver;
            getSkyboxTexture?: SkyboxResolver;
            getTexture?: TextureResolver;
          }
        | undefined)
    : undefined;

  const getMeshData: MeshResolver =
    params.getMeshData ??
    (cache
      ? (ref) => cache.getMeshData(ref) ?? null
      : (() => null));

  const getSkyboxTexture: SkyboxResolver | undefined =
    params.getSkyboxTexture ??
    (cache?.getSkyboxTexture
      ? (ref) => (cache.getSkyboxTexture!(ref) as THREE.CubeTexture | null) ?? null
      : undefined);

  const getTexture: TextureResolver | undefined =
    cache?.getTexture
      ? (ref) => (cache.getTexture!(ref) as THREE.Texture | null) ?? null
      : undefined;

  /** One renderer per canvas so we can render to different canvases (e.g. multiple viewports). */
  const renderersByCanvasId = new Map<string, THREE.WebGPURenderer>();
  /** WebGPU init is async; we only draw in a viewport once its canvas's renderer has finished init. */
  const initCompleteByCanvasId = new Set<string>();
  const perScene = new Map<string, PerSceneState>();

  function getOrCreateSceneState(engine: EngineState, sceneId: string): PerSceneState | undefined {
    let state = perScene.get(sceneId);
    if (state) return state;

    const scene = engine.scenes.get(sceneId as import('@duckengine/core-v2').SceneId);
    if (!scene) return undefined;

    const threeScene = new THREE.Scene();
    const registry = createRenderObjectRegistry();
    const context: RenderContextThree = {
      sceneId,
      scene,
      threeScene,
      registry,
      getMeshData,
      getSkyboxTexture,
      getTexture,
    };
    const features = createDefaultRenderFeatures();
    state = { threeScene, registry, context, features };
    perScene.set(sceneId, state);
    return state;
  }

  return {
    sync(engine: EngineState, _dt: number) {
      for (const [sceneId, scene] of engine.scenes) {
        const state = getOrCreateSceneState(engine, sceneId);
        if (state) {
          syncSceneToRenderTree(scene, state.context, state.features);
        }
      }
    },

    render(engine: EngineState, _dt: number) {
      for (const viewport of engine.viewports.values()) {
        if (!viewport.enabled) continue;

        const canvas = getCanvas(viewport.canvasId);
        if (!canvas) continue;

        let renderer = renderersByCanvasId.get(viewport.canvasId);
        if (!renderer) {
          renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
          renderersByCanvasId.set(viewport.canvasId, renderer);
          renderer.init().then(() => {
            initCompleteByCanvasId.add(viewport.canvasId);
          });
          continue;
        }

        if (!initCompleteByCanvasId.has(viewport.canvasId)) continue;

        const state = perScene.get(viewport.sceneId);
        if (!state) continue;

        const cameraObj = state.registry.get(viewport.cameraEntityId);
        const camera = findCamera(cameraObj);
        if (!camera) continue;

        renderer.setRenderTarget(null);
        const w = canvas.width;
        const h = canvas.height;
        renderer.setViewport(
          Math.floor(viewport.rect.x * w),
          Math.floor(viewport.rect.y * h),
          Math.floor(viewport.rect.w * w),
          Math.floor(viewport.rect.h * h),
        );
        renderer.setScissor(
          Math.floor(viewport.rect.x * w),
          Math.floor(viewport.rect.y * h),
          Math.floor(viewport.rect.w * w),
          Math.floor(viewport.rect.h * h),
        );
        renderer.setScissorTest(true);
        renderer.render(state.threeScene, camera);
      }
      for (const renderer of renderersByCanvasId.values()) {
        renderer.setScissorTest(false);
      }
    },

    dispose() {
      for (const renderer of renderersByCanvasId.values()) {
        renderer.dispose();
      }
      renderersByCanvasId.clear();
      initCompleteByCanvasId.clear();
      perScene.clear();
    },
  };
}
