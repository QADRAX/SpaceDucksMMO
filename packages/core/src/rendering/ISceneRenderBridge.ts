import type { Entity } from '@duckengine/ecs';

/**
 * Bridge that connects a scene's ECS entities to a concrete rendering backend.
 *
 * The goal is to keep @duckengine/core free of any renderer-specific deps
 * (e.g., three.js), while still allowing BaseScene to coordinate rendering.
 */
export interface ISceneRenderBridge {
  addEntity(entity: Entity): void;
  removeEntity(entityId: string): void;
  update(dt: number): void;

  /** Returns an engine-native camera handle (implementation-defined). */
  getCamera(entityId: string): unknown | undefined;

  setSceneDebugEnabled(enabled: boolean): void;
  setActiveCameraEntityId(id: string | null): void;
}
