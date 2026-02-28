import { Entity, IScene, DefaultEcsComponentFactory, IEcsComponentFactory } from '@duckengine/core';
import { IEditorExtensionRegistry } from '../extension/IEditorExtension';
import { Viewport } from '../viewport/Viewport';
import { ViewportBlueprint } from '../viewport/ViewportBlueprint';

/**
 * Current status of the editor's live game simulation.
 */
export type GameState = 'stopped' | 'playing' | 'paused';

/**
 * Options for starting an editor session.
 */
export interface EditorSessionOptions {
    /** The main scene to be edited. */
    scene: IScene;
    /** The registry containing all available editor extensions. */
    registry: IEditorExtensionRegistry;
    /** Optional factory for creating ECS components. */
    componentFactory?: IEcsComponentFactory;
}

/**
 * The EditorSession is the root of the "Now".
 * It orchestrates the scene, selection, multiple viewports, and game state.
 */
export class EditorSession {
    private _gameState: GameState = 'stopped';
    private _selectedEntityId: string | null = null;
    private _scene: IScene;
    private _registry: IEditorExtensionRegistry;
    private _componentFactory: IEcsComponentFactory;

    /** Active viewports managed by this session. */
    private _viewports = new Map<string, Viewport>();

    /** Global repository of viewport blueprints. */
    private _blueprints = new Map<string, ViewportBlueprint>();

    private _activeViewportId: string | null = null;

    constructor(options: EditorSessionOptions) {
        this._scene = options.scene;
        this._registry = options.registry;
        this._componentFactory = options.componentFactory || new DefaultEcsComponentFactory();
    }

    get componentFactory(): IEcsComponentFactory {
        return this._componentFactory;
    }

    // --- Viewports API ---

    /**
     * Creates a new viewport within the session.
     * @param id Unique ID for the viewport.
     * @param blueprintId Optional blueprint to auto-apply on creation.
     */
    public createViewport(id: string, blueprintId?: string): Viewport {
        if (this._viewports.has(id)) {
            throw new Error(`Viewport with id ${id} already exists`);
        }

        const viewport = new Viewport({ id, session: this });
        this._viewports.set(id, viewport);

        if (blueprintId) {
            this.applyBlueprintToViewport(id, blueprintId);
        }

        if (!this._activeViewportId) {
            this._activeViewportId = id;
        }

        return viewport;
    }

    /**
     * Registers a reusable viewport blueprint.
     */
    public registerBlueprint(id: string, config: ViewportBlueprint) {
        this._blueprints.set(id, config);
    }

    /**
     * Applies a registered blueprint to an existing viewport.
     */
    public applyBlueprintToViewport(viewportId: string, blueprintId: string) {
        const viewport = this.getViewport(viewportId);
        const blueprint = this._blueprints.get(blueprintId);
        if (viewport && blueprint) {
            viewport.applyBlueprint(blueprint);
        }
    }

    public getViewport(id: string): Viewport | undefined {
        return this._viewports.get(id);
    }

    public get activeViewport(): Viewport | undefined {
        if (!this._activeViewportId) return undefined;
        return this._viewports.get(this._activeViewportId);
    }

    public setActiveViewport(id: string | null) {
        if (id && !this._viewports.has(id)) return;
        this._activeViewportId = id;
    }

    /**
     * Removes and disposes a viewport from the session.
     */
    public destroyViewport(id: string) {
        const viewport = this._viewports.get(id);
        if (viewport) {
            viewport.dispose();
            this._viewports.delete(id);
        }
        if (this._activeViewportId === id) {
            this._activeViewportId = Array.from(this._viewports.keys())[0] || null;
        }
    }

    public getAllViewports(): ReadonlyArray<Viewport> {
        return Array.from(this._viewports.values());
    }

    // --- State API ---

    get gameState(): GameState {
        return this._gameState;
    }

    get selectedEntityId(): string | null {
        return this._selectedEntityId;
    }

    get scene(): IScene {
        return this._scene;
    }

    /**
     * Retrieves an entity from the scene by its UUID.
     */
    public getEntity(id: string): Entity | undefined {
        return this._scene.getEntity(id);
    }

    /**
     * Finds the first entity in the scene matching the given name.
     */
    public findEntityByName(name: string): Entity | undefined {
        if (!this._scene.getEntities) return undefined;
        return Array.from(this._scene.getEntities()).find(e => e.displayName === name || e.id === name);
    }

    /**
     * Changes the current game state and notifies all extensions.
     */
    public setGameState(state: GameState, ctx: any) {
        if (this._gameState === state) return;
        this._gameState = state;

        for (const extension of this._registry.extensions) {
            if (extension.enabled && extension.onGameStateChanged) {
                extension.onGameStateChanged(state, ctx);
            }
        }
    }

    /**
     * Changes selection and notifies all extensions.
     */
    public setSelectedEntity(id: string | null, ctx: any) {
        if (this._selectedEntityId === id) return;
        this._selectedEntityId = id;

        const ids = id ? [id] : [];
        for (const extension of this._registry.extensions) {
            if (extension.enabled && extension.onSelectionChanged) {
                extension.onSelectionChanged(ids, ctx);
            }
        }
    }

    // --- Entity Actions ---

    public createEntity(parentId?: string | null): Entity {
        const entity = new Entity(`Entity_${Math.random().toString(36).substr(2, 6)}`);
        this._scene.addEntity(entity);
        if (parentId && this._scene.reparentEntity) {
            this._scene.reparentEntity(entity.id, parentId);
        }
        return entity;
    }

    /**
     * Duplicates the currently selected entity.
     */
    public duplicateSelectedEntity(): Entity | undefined {
        if (!this._selectedEntityId) return undefined;
        const source = this._scene.getEntity(this._selectedEntityId);
        if (!source) return undefined;

        // Note: Real duplication would require deep cloning of components.
        // For now, we spawn a new entity with the same name.
        const entity = new Entity(`${source.displayName}_Copy`);
        this._scene.addEntity(entity);

        // Copy transform
        entity.transform.copyFrom(source.transform);

        return entity;
    }

    public getEntityProperty(id: string, key: string): any {
        const entity = this.getEntity(id);
        if (!entity) return undefined;

        if (key === 'position' || key === 'getPosition') {
            const p = entity.transform.localPosition;
            return { x: p.x, y: p.y, z: p.z };
        }
        if (key === 'rotation' || key === 'getRotation') {
            const r = entity.transform.localRotation;
            return { x: r.x, y: r.y, z: r.z };
        }
        if (key === 'scale' || key === 'getScale') {
            const s = entity.transform.localScale;
            return { x: s.x, y: s.y, z: s.z };
        }
        if (key === 'displayName') return entity.displayName;

        return undefined;
    }

    public setEntityProperty(id: string, key: string, value: any) {
        const entity = this.getEntity(id);
        if (!entity) return;

        if (key === 'position' || key === 'setPosition') {
            entity.transform.setPosition(value.x, value.y, value.z);
        } else if (key === 'rotation' || key === 'setRotation') {
            entity.transform.setRotation(value.x, value.y, value.z);
        } else if (key === 'scale' || key === 'setScale') {
            entity.transform.setScale(value.x, value.y, value.z);
        } else if (key === 'displayName') {
            entity.displayName = String(value);
        }
    }

    public deleteEntity(id: string) {
        if (this._selectedEntityId === id) {
            this._selectedEntityId = null;
        }
        this._scene.removeEntity(id);
    }

    public reparentEntity(childId: string, newParentId: string | null) {
        if (this._scene.reparentEntity) {
            this._scene.reparentEntity(childId, newParentId);
        }
    }

    /**
     * System-wide per-frame update.
     */
    public tick(dt: number, ctx: any) {
        for (const extension of this._registry.extensions) {
            if (extension.enabled && extension.onTick) {
                extension.onTick(dt, ctx);
            }
        }

        for (const viewport of this._viewports.values()) {
            viewport.update(dt);
        }
    }
}
