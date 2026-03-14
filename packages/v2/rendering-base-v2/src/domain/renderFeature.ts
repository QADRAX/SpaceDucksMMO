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
 *
 * Sync contract: the orchestrator calls syncEntity(entity, context) once per entity per frame.
 * The feature resolves the component once and branches internally (attach / update transform / detach).
 * onDetachById is for entities that left the scene (no entity state). onUpdate is for incremental
 * component updates when the sync is driven by component change events.
 *
 * @template TContext - Render context type (default RenderContextBase). Use RenderContextThree for Three.js features.
 */
export interface RenderFeature<TContext extends RenderContextBase = RenderContextBase> {
  readonly name: string;

  /**
   * Sync this entity: resolve component once, then attach (create + register), update (sync transform/props), or detach (unregister + dispose).
   * The feature uses its own state (e.g. a map) to know if it had previously attached this entity.
   */
  syncEntity(entity: EntityState, context: TContext): void;

  /** Called when a component of this entity changed (optional; e.g. for incremental updates). */
  onUpdate?(entity: EntityState, componentType: ComponentType, context: TContext): void;

  /** Called when entity was removed from scene (no entity state). Optional. */
  onDetachById?(entityId: string, context: TContext): void;

  onFrame?(dt: number, context: TContext): void;

  dispose?(): void;
}
