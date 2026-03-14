import type { SceneState } from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { ComponentType } from '@duckengine/core-v2';

/**
 * Minimal render context view for features (backend-agnostic).
 * Infrastructure (e.g. Three) extends this with framework-specific data (scene, camera, registry).
 */
export interface RenderContextBase {
  readonly sceneId: string;
  readonly scene: SceneState;
}

/**
 * A pluggable feature that handles rendering sync for a specific aspect of an entity.
 * Implementations live in rendering-three-common-v2 (Camera, Light, Geometry, Material).
 */
export interface RenderFeature {
  readonly name: string;

  isEligible(entity: EntityState, scene: SceneState): boolean;

  onAttach(entity: EntityState, context: RenderContextBase): void;

  onUpdate(entity: EntityState, componentType: ComponentType, context: RenderContextBase): void;

  onDetach(entity: EntityState, context: RenderContextBase): void;

  /** Called when entity is removed from scene (no entity state available). Optional. */
  onDetachById?(entityId: string, context: RenderContextBase): void;

  onTransformChanged?(entity: EntityState, context: RenderContextBase): void;

  onFrame?(dt: number, context: RenderContextBase): void;

  dispose?(): void;
}
