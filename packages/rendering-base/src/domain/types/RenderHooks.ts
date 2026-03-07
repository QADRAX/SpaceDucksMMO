import type { Entity, ComponentType } from '@duckengine/core';
import type { RenderContext } from './RenderContext';

/**
 * Hooks / lifecycle signatures for render features.
 *
 * Define the contract for feature behavior throughout the rendering lifecycle.
 */
export interface RenderHooks {
  onAttach: (entity: Entity, context: RenderContext) => void;
  onUpdate: (entity: Entity, componentType: ComponentType, context: RenderContext) => void;
  onComponentRemoved?: (entity: Entity, componentType: ComponentType, context: RenderContext) => void;
  onTransformChanged?: (entity: Entity, context: RenderContext) => void;
  onFrame?: (dt: number, context: RenderContext) => void;
  onDetach: (entity: Entity, context: RenderContext) => void;
  dispose?: () => void;
}

/**
 * Eligibility check for a feature on an entity.
 */
export type EligibilityCheck = (entity: Entity) => boolean;

/**
 * Feature state tracking.
 */
export interface FeatureState {
  readonly featureName: string;
  readonly entityId: string;
  readonly attached: boolean;
  readonly lastUpdate?: number;
}
