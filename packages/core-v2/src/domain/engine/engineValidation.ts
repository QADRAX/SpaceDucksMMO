import type { EngineState } from './types';
import type {  SceneState  } from '../types/../scene';
import type { EntityState } from '../ecs';
import { hasComponent } from '../ecs';

/** Returns the scene if it exists in the engine, or undefined. */
export function findScene(engine: EngineState, sceneId: string): SceneState | undefined {
  return engine.scenes.get(sceneId);
}

/** Returns true if the scene exists in the engine. */
export function sceneExists(engine: EngineState, sceneId: string): boolean {
  return engine.scenes.has(sceneId);
}

/**
 * Returns the entity if it exists in the scene and owns a `cameraView`
 * component, or undefined otherwise.
 */
export function findCameraEntity(
  scene: SceneState,
  entityId: string,
): EntityState | undefined {
  const entity = scene.entities.get(entityId);
  if (!entity) return undefined;
  return hasComponent(entity, 'cameraView') ? entity : undefined;
}

/**
 * Returns true if the entity exists in the scene and owns a `cameraView`
 * component.
 */
export function isCameraEntity(scene: SceneState, entityId: string): boolean {
  return findCameraEntity(scene, entityId) !== undefined;
}
