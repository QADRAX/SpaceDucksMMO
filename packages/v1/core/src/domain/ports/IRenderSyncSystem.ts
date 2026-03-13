import { Entity } from '../ecs';

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

  setSceneDebugEnabled(kind: string, enabled: boolean): void;
  setActiveCameraEntityId(id: string | null): void;
  update(dt: number): void;
}

/** Token to force module emission */
export const IRenderSyncSystem_TOKEN = 'IRenderSyncSystem';
