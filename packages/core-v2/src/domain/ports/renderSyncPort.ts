import type { EntityState } from '../ecs/entity';

/**
 * Contract for renderer-facing scene synchronisation.
 * Implementations live in renderer backends (e.g. @duckengine/rendering-three).
 */
export interface RenderSyncPort {
  /** Register an entity for visual representation. */
  addEntity(entity: EntityState): void;
  /** Remove an entity's visual representation by id. */
  removeEntity(entityId: string): void;
  /** Set the active camera entity for this scene. */
  setActiveCameraEntityId(id: string | null): void;
  /** Toggle a scene-wide debug visualisation kind. */
  setSceneDebugEnabled(kind: string, enabled: boolean): void;
  /** Synchronise visual state for the current frame. */
  update(dt: number): void;
}
