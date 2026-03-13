import { Entity, Component, ComponentType, IComponentObserver } from '../../domain/ecs';
import { CoreLogger } from '../../domain/logging/CoreLogger';
import SceneChangeEvent from '../../domain/scene/SceneChangeEvent';
import { SceneValidator } from './SceneValidator';

/**
 * Manages entity observers and listeners for a scene.
 * Extracted from BaseScene to delegate the complexity of change tracking.
 */
export class SceneObserverManager {
    private entitySubscriptions: Map<string, () => void> = new Map();

    constructor(
        private validator: SceneValidator,
        private emitChange: (ev: SceneChangeEvent) => void
    ) { }

    /**
     * Attaches observers and listeners to an entity to track changes (components, transform).
     */
    public attachEntityObservers(entity: Entity, currentSceneEntities: Map<string, Entity>): void {
        const componentObserver: IComponentObserver = {
            onComponentChanged: (_entityId: string, componentType: ComponentType) => {
                this.emitChange({
                    kind: "component-changed",
                    entityId: entity.id,
                    componentType,
                });
            },
            onComponentRemoved: (_entityId: string, componentType: ComponentType) => {
                this.emitChange({
                    kind: "component-changed",
                    entityId: entity.id,
                    componentType,
                });
            },
        };

        let isHandlingComponentEvent = false;
        const componentListener = (ev: any) => {
            if (isHandlingComponentEvent) return;
            if (!ev || ev.entity !== entity) return;
            const comp: Component | undefined = ev.component;
            const action: string | undefined = ev.action;
            if (!comp || (action !== 'added' && action !== 'removed')) return;

            isHandlingComponentEvent = true;
            try {
                if (action === 'added') {
                    this.handleComponentAdded(entity, comp, componentObserver, currentSceneEntities);
                } else if (action === 'removed') {
                    this.handleComponentRemoved(entity, comp);
                }
            } finally {
                isHandlingComponentEvent = false;
            }
        };

        const transformListener = () =>
            this.emitChange({ kind: "transform-changed", entityId: entity.id });

        // Initial attachment to existing components
        for (const comp of entity.getAllComponents()) {
            comp.addObserver(componentObserver);
        }

        try {
            entity.transform.onChange(transformListener);
        } catch (err) {
            console.warn(`[SceneObserverManager] Failed to attach transform listener to ${entity.id}`, err);
        }

        try {
            entity.addComponentListener(componentListener);
        } catch (err) {
            console.warn(`[SceneObserverManager] Failed to attach component listener to ${entity.id}`, err);
        }

        const cleanup = () => {
            for (const comp of entity.getAllComponents()) {
                try {
                    comp.removeObserver(componentObserver);
                } catch { }
            }
            try {
                entity.transform.removeOnChange(transformListener);
            } catch { }
            try {
                entity.removeComponentListener(componentListener);
            } catch { }
        };

        this.entitySubscriptions.set(entity.id, cleanup);
    }

    /**
     * Detaches all observers and listeners from an entity.
     */
    public detachEntityObservers(entityId: string): void {
        const cleanup = this.entitySubscriptions.get(entityId);
        if (cleanup) {
            try {
                cleanup();
            } catch (err) {
                CoreLogger.warn("SceneObserverManager", `Cleanup failed for ${entityId}`, err);
            }
            this.entitySubscriptions.delete(entityId);
        }
    }

    /**
     * Cleans up all subscriptions.
     */
    public clear(): void {
        for (const id of Array.from(this.entitySubscriptions.keys())) {
            this.detachEntityObservers(id);
        }
    }

    private handleComponentAdded(
        entity: Entity,
        comp: Component,
        observer: IComponentObserver,
        currentSceneEntities: Map<string, Entity>
    ): void {
        // 1. Observe changes in the new component
        try {
            comp.addObserver(observer);
        } catch { }

        // 2. Validate hierarchy requirements
        const hierarchyErrors = this.validator.validateHierarchyRequirements(entity);
        if (hierarchyErrors.length) {
            entity.safeRemoveComponent(comp.type);
            this.emitChange({ kind: 'error', message: hierarchyErrors.join('\n') } as any);
            return;
        }

        // 3. Enforce scene-wide uniqueness
        const uniqueInScene = (comp.metadata as any)?.uniqueInScene as boolean | undefined;
        if (uniqueInScene) {
            const existing = this.validator.findEntityWithComponent(comp.type, currentSceneEntities, entity.id);
            if (existing) {
                entity.safeRemoveComponent(comp.type);
                this.emitChange({
                    kind: 'error',
                    message: `Cannot add component '${comp.type}' to '${entity.id}': it is unique in scene and already exists on '${existing.id}'.`,
                } as any);
            }
        }
    }

    private handleComponentRemoved(entity: Entity, comp: Component): void {
        // Validate if removing this component breaks hierarchy for any descendant
        const subtreeErrors = this.validator.validateHierarchyRequirementsInSubtree(entity);
        if (subtreeErrors.length) {
            const restore = entity.safeAddComponent(comp as any);
            const msg = `Cannot remove component '${comp.type}' from '${entity.id}' because it breaks hierarchy requirements.\n` +
                subtreeErrors.map((e) => `  - ${e}`).join('\n');

            this.emitChange({ kind: 'error', message: msg } as any);

            if (!restore.ok) {
                CoreLogger.error("SceneObserverManager", `Hierarchy broken and recovery failed for ${entity.id}`, restore.error);
            }
        }
    }
}
