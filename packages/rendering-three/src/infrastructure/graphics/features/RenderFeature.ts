import type { Entity } from "@duckengine/ecs";
import type { RenderContext } from "./RenderContext";

/**
 * A pluggable feature that handles rendering synchronization for a specific aspect of an entity.
 * Examples: MeshFeature, CameraFeature, LightFeature, etc.
 */
export interface RenderFeature {
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
     * Should create necessary resources (Three.js objects) and attach them to the scene/registry.
     */
    onAttach(entity: Entity, context: RenderContext): void;

    /**
     * Called when a component component on the eligible entity changes.
     * Should update the existing resources.
     */
    onUpdate(entity: Entity, componentType: string, context: RenderContext): void;

    /**
     * Called when the entity's transform changes.
     * Should sync the transform to the underlying Three.js object.
     */
    onTransformChanged?(entity: Entity, context: RenderContext): void;

    /**
     * Called every frame.
     * Useful for updating animations, uniforms, etc.
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
