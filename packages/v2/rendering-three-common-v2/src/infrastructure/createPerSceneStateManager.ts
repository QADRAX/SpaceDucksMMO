import * as THREE from 'three';
import type { EngineState, SceneId } from '@duckengine/core-v2';
import {
  ResourceCachePortDef,
  createSubsystemPortRegistry,
} from '@duckengine/core-v2';
import {
  createDefaultRenderFeatures,
  createRenderObjectRegistry,
  type PerSceneState,
  type RenderContextThree,
} from '../domain';
import { createResolversFromResourceCache } from './createResolversFromResourceCache';

/**
 * Creates per-scene state manager: resolvers, perScene map, and getOrCreateSceneState.
 * Shared by GL and WebGPU createRenderingState.
 */
export function createPerSceneStateManager(engine: EngineState) {
  const registry = createSubsystemPortRegistry(
    engine.subsystemRuntime.ports,
    engine.subsystemRuntime.portDefinitions,
  );
  const cache = registry.get(ResourceCachePortDef);
  const { getMeshData, getSkyboxTexture, getTexture } =
    createResolversFromResourceCache(cache);

  const perScene = new Map<string, PerSceneState>();

  function getOrCreateSceneState(
    engine: EngineState,
    sceneId: SceneId,
  ): PerSceneState | undefined {
    let state = perScene.get(sceneId);
    if (state) return state;

    const scene = engine.scenes.get(sceneId);
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

  return { perScene, getOrCreateSceneState };
}
