import type { Entity } from '@duckengine/ecs';

/**
 * Renderer-facing sync system interface.
 *
 * Implementations live in renderer backends (e.g. @duckengine/rendering-three).
 * Core scenes can call into it without depending on any renderer.
 */
export interface IRenderSyncSystem {
  addEntity(entity: Entity): void;
  removeEntity(id: string): void;

  /** Optional: used by BaseScene to validate camera entities */
  getCamera?(id: string): unknown | undefined;

  setSceneDebugEnabled(enabled: boolean): void;
  /** Optional: independent master switch for collider debug rendering. */
  setSceneColliderDebugEnabled?(enabled: boolean): void;
  setActiveCameraEntityId(id: string | null): void;
  update(dt: number): void;
}

export default IRenderSyncSystem;
