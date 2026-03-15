import {
  createPerSceneStateManager as createPerSceneStateManagerFromCore,
  ResourceCachePortDef,
  createSubsystemPortRegistry,
  DiagnosticPortDef,
  type EngineState,
} from '@duckengine/core-v2';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import {
  createDefaultRenderFeatures,
  createRenderObjectRegistry,
  type PerSceneState,
  type RenderContextThree,
} from '../domain';
import { createResolversFromResourceCache } from './createResolversFromResourceCache';
import type { SceneState } from '@duckengine/core-v2';

/**
 * Rendering-specific options. Uses core's generic createPerSceneStateManager
 * with a factory that creates Three.js per-scene state.
 */
export interface CreatePerSceneStateManagerOptions {
  /** THREE module from backend (three or three/webgpu). Required for object creation. */
  three: typeof import('three');
  /** Called when a new per-scene state is created. Use to register scene-scoped ports (e.g. GizmoPort). */
  onSceneStateCreated: (scene: SceneState, state: PerSceneState) => void;
  /** Optional: custom feature set. If not provided, uses createDefaultRenderFeatures. */
  createFeatures?: () => RenderFeature<RenderContextThree>[];
}

/**
 * Creates per-scene state manager for rendering (GL/WebGPU).
 * Delegates orchestration to core; implements Three.js-specific createSceneState.
 * The THREE module is injected by the backend so Scene, Light, Mesh, etc. use the correct namespace.
 */
export function createPerSceneStateManager(
  engine: EngineState,
  options: CreatePerSceneStateManagerOptions,
) {
  const { three, onSceneStateCreated, createFeatures } = options;
  const registry = createSubsystemPortRegistry(
    engine.subsystemRuntime.ports,
    engine.subsystemRuntime.portDefinitions,
  );
  const cache = registry.get(ResourceCachePortDef);
  const diagnostic = registry.get(DiagnosticPortDef);
  const { getMeshData, getSkyboxTexture, getTexture } =
    createResolversFromResourceCache(cache, three);

  return createPerSceneStateManagerFromCore<PerSceneState>(engine, {
    createSceneState: (_engine, scene) => {
      diagnostic?.log('debug', 'Rendering scene created', {
        subsystem: 'rendering-three',
        sceneId: scene.id,
      });
      const threeScene = new three.Scene();
      threeScene.background = new three.Color(0x1a1a2e);
      const sceneRegistry = createRenderObjectRegistry(three);
      const context: RenderContextThree = {
        three,
        sceneId: scene.id,
        scene,
        threeScene,
        registry: sceneRegistry,
        getMeshData,
        getSkyboxTexture,
        getTexture,
        diagnostic: diagnostic ?? undefined,
      };
      const features = (createFeatures ?? createDefaultRenderFeatures)();
      return { threeScene, registry: sceneRegistry, context, features };
    },
    onSceneStateCreated,
  });
}
