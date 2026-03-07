import type { Entity, ComponentType } from '@duckengine/core';
import { RenderContext } from '../types';

/**
 * A pluggable feature that handles rendering synchronization for a specific aspect of an entity.
 * Examples: MeshFeature, CameraFeature, LightFeature, etc.
 *
 * Implementers are Infrastructure adapters that translate domain operations to framework-specific code.
 */
export interface IRenderFeature {
  /**
   * Unique name of the feature (e.g. "MeshFeature").
   */
  readonly name: string;

  /**
   * Determines if this feature should handle the given entity.
   * Called when an entity is added or its components change.
   */
  isEligible(entity: Entity): boolean;

  /**
   * Called when an entity becomes eligible for this feature.
   * Should create necessary resources and attach them to the scene/registry.
   */
  onAttach(entity: Entity, context: RenderContext): void;

  /**
   * Called when a component changes on an eligible entity.
   * Should update the existing resources.
   */
  onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void;

  /**
   * Called when a component is explicitly removed from the entity.
   * @optional
   */
  onComponentRemoved?(entity: Entity, componentType: ComponentType, context: RenderContext): void;

  /**
   * Called when the entity's transform changes.
   * Should sync the transform to the underlying framework object.
   */
  onTransformChanged?(entity: Entity, context: RenderContext): void;

  /**
   * Called every frame update.
   * Useful for animations, uniforms, and frame-by-frame updates.
   */
  onFrame?(dt: number, context: RenderContext): void;

  /**
   * Called when the entity is removed or no longer eligible.
   * Should dispose of resources and remove them from the scene/registry.
   */
  onDetach(entity: Entity, context: RenderContext): void;

  /**
   * Optional cleanup for the feature itself (e.g. clearing caches).
   */
  dispose?(): void;
}
