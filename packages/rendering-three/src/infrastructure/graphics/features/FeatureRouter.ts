import type { Entity, ComponentType } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";

/**
 * Manages a collection of RenderFeatures and routes entity lifecycle events to them.
 */
export class FeatureRouter {
    private readonly features: RenderFeature[] = [];
    // Maps entityId -> Set of features currently handling this entity
    private readonly activeFeatures = new Map<string, Set<RenderFeature>>();

    constructor(private readonly context: RenderContext) { }

    addFeature(feature: RenderFeature): void {
        this.features.push(feature);
    }

    onEntityAdded(entity: Entity): void {
        this.checkEligibility(entity);
    }

    onEntityRemoved(entity: Entity): void {
        const activeInfo = this.activeFeatures.get(entity.id);
        if (activeInfo) {
            for (const feature of activeInfo) {
                try {
                    feature.onDetach(entity, this.context);
                } catch (e) {
                    console.error(`[FeatureRouter] Error detaching feature ${feature.name} from entity ${entity.id}:`, e);
                }
            }
            this.activeFeatures.delete(entity.id);
        }
    }

    onComponentChanged(entity: Entity, componentType: ComponentType): void {
        // 1. Re-evaluate eligibility for all features (some might need to attach/detach based on the change).
        this.checkEligibility(entity);

        // 2. Notify active features of the update.
        const activeInfo = this.activeFeatures.get(entity.id);
        if (activeInfo) {
            for (const feature of activeInfo) {
                try {
                    feature.onUpdate(entity, componentType, this.context);
                } catch (e) {
                    console.error(`[FeatureRouter] Error updating feature ${feature.name} for entity ${entity.id}:`, e);
                }
            }
        }
    }

    onComponentRemoved(entity: Entity, componentType: ComponentType): void {
        // 1. Re-evaluate eligibility (removal might make entity ineligible).
        this.checkEligibility(entity);

        // 2. Notify active features of the removal.
        const activeInfo = this.activeFeatures.get(entity.id);
        if (activeInfo) {
            for (const feature of activeInfo) {
                if (feature.onComponentRemoved) {
                    try {
                        feature.onComponentRemoved(entity, componentType, this.context);
                    } catch (e) {
                        console.error(`[FeatureRouter] Error notifying removal to feature ${feature.name} for entity ${entity.id}:`, e);
                    }
                }
            }
        }
    }

    onTransformChanged(entity: Entity): void {
        const activeInfo = this.activeFeatures.get(entity.id);
        if (activeInfo) {
            for (const feature of activeInfo) {
                if (feature.onTransformChanged) {
                    try {
                        feature.onTransformChanged(entity, this.context);
                    } catch (e) {
                        console.error(
                            `[FeatureRouter] Error syncing transform for feature ${feature.name} on entity ${entity.id}:`,
                            e
                        );
                    }
                }
            }
        }
    }

    onFrame(dt: number): void {
        for (const feature of this.features) {
            if (feature.onFrame) {
                try {
                    feature.onFrame(dt, this.context);
                } catch (e) {
                    console.error(`[FeatureRouter] Error in onFrame for feature ${feature.name}:`, e);
                }
            }
        }
    }

    dispose(): void {
        for (const feature of this.features) {
            if (feature.dispose) {
                feature.dispose();
            }
        }
        this.activeFeatures.clear();
        this.features.length = 0;
    }

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
                    console.error(`[FeatureRouter] Error attaching feature ${feature.name} to entity ${entity.id}:`, e);
                }
            } else if (!isEligible && isAttached) {
                try {
                    feature.onDetach(entity, this.context);
                    activeSet.delete(feature);
                } catch (e) {
                    console.error(`[FeatureRouter] Error detaching feature ${feature.name} from entity ${entity.id}:`, e);
                }
            }
        }

        if (activeSet.size === 0) {
            this.activeFeatures.delete(entity.id);
        }
    }
}
