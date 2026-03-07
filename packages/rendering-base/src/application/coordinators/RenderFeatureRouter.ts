import type { Entity, ComponentType } from '@duckengine/core';
import { CoreLogger } from '@duckengine/core';
import type { IRenderFeature } from '../../domain/ports/IRenderFeature';
import type { RenderContext } from '../../domain/types/RenderContext';
import { FeatureException } from '../../domain/exceptions/RenderException';

/**
 * Application Coordinator: RenderFeatureRouter
 *
 * Orchestrates a collection of RenderFeatures and routes entity lifecycle events to them.
 * This is the main orchestrator for the feature system.
 *
 * Responsibilities:
 * - Manage feature registration
 * - Route entity lifecycle events to eligible features
 * - Track feature activation state per entity
 * - Handle feature errors gracefully
 */
export class RenderFeatureRouter {
  private readonly features: IRenderFeature[] = [];
  // Maps entityId -> Set of features currently handling this entity
  private readonly activeFeatures = new Map<string, Set<IRenderFeature>>();
  private readonly logPrefix = '[RenderFeatureRouter]';

  constructor(private readonly context: RenderContext) {}

  /**
   * Register a feature to be routed
   */
  addFeature(feature: IRenderFeature): void {
    this.features.push(feature);
    CoreLogger.info(this.logPrefix, `Registered feature: ${feature.name}`);
  }

  /**
   * Called when an entity is added to the scene
   */
  onEntityAdded(entity: Entity): void {
    this.checkEligibility(entity);
  }

  /**
   * Called when an entity is removed from the scene
   */
  onEntityRemoved(entity: Entity): void {
    const activeInfo = this.activeFeatures.get(entity.id);
    if (activeInfo) {
      for (const feature of activeInfo) {
        try {
          feature.onDetach(entity, this.context);
        } catch (e) {
          throw new FeatureException(
            feature.name,
            `Error detaching from entity ${entity.id}: ${e}`,
            { originalError: e }
          );
        }
      }
      this.activeFeatures.delete(entity.id);
    }
  }

  /**
   * Called when a component changes on an entity
   */
  onComponentChanged(entity: Entity, componentType: ComponentType): void {
    // 1. Re-evaluate eligibility for all features
    this.checkEligibility(entity);

    // 2. Notify active features of the update
    const activeInfo = this.activeFeatures.get(entity.id);
    if (activeInfo) {
      for (const feature of activeInfo) {
        try {
          feature.onUpdate(entity, componentType, this.context);
        } catch (e) {
          throw new FeatureException(
            feature.name,
            `Error updating entity ${entity.id}: ${e}`,
            { originalError: e }
          );
        }
      }
    }
  }

  /**
   * Called when a component is removed from an entity
   */
  onComponentRemoved(entity: Entity, componentType: ComponentType): void {
    // 1. Re-evaluate eligibility (removal might make entity ineligible)
    this.checkEligibility(entity);

    // 2. Notify active features of the removal
    const activeInfo = this.activeFeatures.get(entity.id);
    if (activeInfo) {
      for (const feature of activeInfo) {
        if (feature.onComponentRemoved) {
          try {
            feature.onComponentRemoved(entity, componentType, this.context);
          } catch (e) {
            throw new FeatureException(
              feature.name,
              `Error on component removal for entity ${entity.id}: ${e}`,
              { originalError: e }
            );
          }
        }
      }
    }
  }

  /**
   * Called when entity transform changes
   */
  onTransformChanged(entity: Entity): void {
    const activeInfo = this.activeFeatures.get(entity.id);
    if (activeInfo) {
      for (const feature of activeInfo) {
        if (feature.onTransformChanged) {
          try {
            feature.onTransformChanged(entity, this.context);
          } catch (e) {
            throw new FeatureException(
              feature.name,
              `Error syncing transform for entity ${entity.id}: ${e}`,
              { originalError: e }
            );
          }
        }
      }
    }
  }

  /**
   * Called every frame
   */
  onFrame(dt: number): void {
    for (const feature of this.features) {
      if (feature.onFrame) {
        try {
          feature.onFrame(dt, this.context);
        } catch (e) {
          throw new FeatureException(
            feature.name,
            `Error in onFrame: ${e}`,
            { originalError: e }
          );
        }
      }
    }
  }

  /**
   * Dispose all features
   */
  dispose(): void {
    for (const feature of this.features) {
      if (feature.dispose) {
        try {
          feature.dispose();
        } catch (e) {
          CoreLogger.warn(
            this.logPrefix,
            `Error disposing feature ${feature.name}: ${e}`
          );
        }
      }
    }
    this.activeFeatures.clear();
    this.features.length = 0;
  }

  /**
   * Private: Check eligibility and attach/detach features for an entity
   */
  private checkEligibility(entity: Entity): void {
    let activeSet = this.activeFeatures.get(entity.id);
    if (!activeSet) {
      activeSet = new Set();
      this.activeFeatures.set(entity.id, activeSet);
    }

    for (const feature of this.features) {
      const isEligible = feature.isEligible(entity);
      const isAttached = activeSet.has(feature);

      if (isEligible && !isAttached) {
        try {
          feature.onAttach(entity, this.context);
          activeSet.add(feature);
        } catch (e) {
          throw new FeatureException(
            feature.name,
            `Error attaching to entity ${entity.id}: ${e}`,
            { originalError: e }
          );
        }
      } else if (!isEligible && isAttached) {
        try {
          feature.onDetach(entity, this.context);
          activeSet.delete(feature);
        } catch (e) {
          throw new FeatureException(
            feature.name,
            `Error detaching from entity ${entity.id}: ${e}`,
            { originalError: e }
          );
        }
      }
    }

    if (activeSet.size === 0) {
      this.activeFeatures.delete(entity.id);
    }
  }
}
