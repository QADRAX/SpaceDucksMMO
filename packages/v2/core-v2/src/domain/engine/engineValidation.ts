import type { EngineState } from './types';
import type { SceneState } from '../scene';
import type { EntityState } from '../entities';
import { hasComponent } from '../entities';
import type { SceneId, EntityId } from '../ids';

/** Returns the scene if it exists in the engine, or undefined. */
export function findScene(engine: EngineState, sceneId: SceneId): SceneState | undefined {
  return engine.scenes.get(sceneId);
}

/** Returns true if the scene exists in the engine. */
export function sceneExists(engine: EngineState, sceneId: SceneId): boolean {
  return engine.scenes.has(sceneId);
}

/**
 * Returns the entity if it exists in the scene and owns a perspective or orthographic
 * camera component, or undefined otherwise.
 */
export function findCameraEntity(scene: SceneState, entityId: EntityId): EntityState | undefined {
  const entity = scene.entities.get(entityId);
  if (!entity) return undefined;
  return hasComponent(entity, 'cameraPerspective') || hasComponent(entity, 'cameraOrthographic')
    ? entity
    : undefined;
}

/**
 * Returns true if the entity exists in the scene and owns a camera component.
 */
export function isCameraEntity(scene: SceneState, entityId: EntityId): boolean {
  return findCameraEntity(scene, entityId) !== undefined;
}
