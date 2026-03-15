import * as THREE from 'three';
import {
  createPerSceneStateManager as createPerSceneStateManagerFromCore,
  ResourceCachePortDef,
  createSubsystemPortRegistry,
  DiagnosticPortDef,
  type EngineState,
} from '@duckengine/core-v2';
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
  /** Called when a new per-scene state is created. Use to register scene-scoped ports (e.g. GizmoPort). */
  onSceneStateCreated: (scene: SceneState, state: PerSceneState) => void;
}

/**
 * Creates per-scene state manager for rendering (GL/WebGPU).
 * Delegates orchestration to core; implements Three.js-specific createSceneState.
 */
export function createPerSceneStateManager(
  engine: EngineState,
  options: CreatePerSceneStateManagerOptions,
) {
  const registry = createSubsystemPortRegistry(
    engine.subsystemRuntime.ports,
    engine.subsystemRuntime.portDefinitions,
  );
  const cache = registry.get(ResourceCachePortDef);
  const diagnostic = registry.get(DiagnosticPortDef);
  const { getMeshData, getSkyboxTexture, getTexture } =
    createResolversFromResourceCache(cache);

  return createPerSceneStateManagerFromCore<PerSceneState>(engine, {
    createSceneState: (_engine, scene) => {
      diagnostic?.log('debug', 'Rendering scene created', {
        subsystem: 'rendering-three',
        sceneId: scene.id,
      });
      const threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color(0x1a1a2e);
      const sceneRegistry = createRenderObjectRegistry();
      const context: RenderContextThree = {
        sceneId: scene.id,
        scene,
        threeScene,
        registry: sceneRegistry,
        getMeshData,
        getSkyboxTexture,
        getTexture,
        diagnostic: diagnostic ?? undefined,
      };
      const features = createDefaultRenderFeatures();
      return { threeScene, registry: sceneRegistry, context, features };
    },
    onSceneStateCreated: options.onSceneStateCreated,
  });
}
