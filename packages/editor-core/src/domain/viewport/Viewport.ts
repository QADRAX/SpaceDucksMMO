import { Entity } from '@duckengine/core';
import { EditorSession } from '../session/EditorSession';
import { IViewportFeature, IViewportController, ViewportContext, ViewportUIContribution } from './IViewportFeature';
import { ViewportBlueprint } from './ViewportBlueprint';

/**
 * Options for Viewport creation.
 */
export interface ViewportOptions {
    /** Unique identifier for the viewport instance. */
    id: string;
    /** The parent editor session. */
    session: EditorSession;
}

/**
 * A Viewport is a "Physical" container for a scene view.
 * It is passive and entirely orchestrated by a Blueprint.
 */
export class Viewport {
    /** Unique identifier for the viewport. */
    public readonly id: string;

    /** Current designated camera for this viewport. */
    private _cameraEntityId: string | null = null;

    /** Managed Editor Entities (e.g. Free-cameras, Gizmos) that should be cleaned up with the viewport. */
    private _trackedEditorEntities = new Set<string>();

    /** Active features (Stats, Gizmos, etc). */
    private _features = new Map<string, { feature: IViewportFeature, cleanup?: () => void }>();

    /** The single active controller (the "Pilot") for the viewport. */
    private _controller: IViewportController | null = null;

    /** Controller-specific properties. */
    private _controllerProps: Record<string, any> = {};

    private _managedEntities = new Map<string, string>(); // key -> entityId
    private _session: EditorSession;

    constructor(options: ViewportOptions) {
        this.id = options.id;
        this._session = options.session;
    }

    /**
     * Updates an internal controller property.
     * @param key Property key.
     * @param value New value.
     */
    public setProperty(key: string, value: any) {
        const prevProps = { ...this._controllerProps };
        this._controllerProps[key] = value;
        const ctx = this._createContext();
        if (this._controller?.onPropertyChanged) {
            this._controller.onPropertyChanged(this._controllerProps, prevProps, ctx);
        }
    }

    /**
     * Returns a copy of the current controller properties.
     */
    public get controllerProps(): Record<string, any> {
        return { ...this._controllerProps };
    }

    public registerManagedEntity(key: string, entityId: string) {
        this._managedEntities.set(key, entityId);
    }

    public getManagedEntity(key: string): string | undefined {
        return this._managedEntities.get(key);
    }

    get cameraEntityId(): string | null {
        return this._cameraEntityId;
    }

    set cameraEntityId(id: string | null) {
        this._cameraEntityId = id;
    }

    get trackedEntities(): ReadonlyArray<string> {
        return Array.from(this._trackedEditorEntities);
    }

    /**
     * Spawns an Editor-only Entity (e.g. for a camera or gizmo).
     * These entities are tracked and removed when the viewport is disposed.
     */
    public spawnEditorEntity(baseName: string): Entity {
        const entity = new Entity(`${baseName}_${Math.random().toString(36).substr(2, 6)}`);
        this._session.scene.addEntity(entity);
        this._trackedEditorEntities.add(entity.id);
        return entity;
    }

    /**
     * Fully disposes the viewport, cleaning up its controller, features, and entities.
     */
    public dispose() {
        const ctx = this._createContext();

        if (this._controller?.onDestroy) {
            this._controller.onDestroy(ctx);
        }
        this._controller = null;

        for (const { cleanup } of this._features.values()) {
            cleanup?.();
        }
        this._features.clear();

        for (const entityId of this._trackedEditorEntities) {
            this._session.scene.removeEntity(entityId);
        }
        this._trackedEditorEntities.clear();
        this._cameraEntityId = null;
    }

    /**
     * Applies a Blueprint to this viewport.
     * This handles unloading the current setup and instantiating the new one.
     */
    public async applyBlueprint(blueprint: ViewportBlueprint) {
        this.dispose();

        this._controllerProps = { ...blueprint.properties };

        // Loader integration would go here (conceptual)
        console.log(`Applying blueprint: ${blueprint.controllerId}`);
    }

    /**
     * Per-frame update for the viewport.
     * @param dt Delta time in seconds.
     */
    public update(dt: number) {
        const ctx = this._createContext();

        if (this._controller?.onTick) {
            this._controller.onTick(dt, ctx);
        }

        for (const { feature } of this._features.values()) {
            feature.onTick?.(dt, ctx);
        }
    }

    /**
     * Collects UI contributions from all active viewport features.
     */
    public getUIContributions(): ViewportUIContribution[] {
        const ctx = this._createContext();
        const contributions: ViewportUIContribution[] = [];
        for (const { feature } of this._features.values()) {
            const ui = feature.getUI?.(ctx);
            if (ui) {
                contributions.push(ui);
            }
        }
        return contributions;
    }

    private _createContext(): ViewportContext {
        return {
            viewport: this,
            session: this._session
        };
    }
}
