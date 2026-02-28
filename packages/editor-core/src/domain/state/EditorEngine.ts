import { Entity, IScene, SceneChangeEvent, DefaultEcsComponentFactory, IEcsComponentFactory } from '@duckengine/core';
import { IEditorPluginRegistry } from '../plugin/IEditorPlugin';
import { EditorViewport } from '../viewport/EditorViewport';
import { ViewportConfiguration } from '../viewport/ViewportConfiguration';

export type GameState = 'stopped' | 'playing' | 'paused';

export interface EditorEngineOptions {
    scene: IScene;
    registry: IEditorPluginRegistry;
    componentFactory?: IEcsComponentFactory;
}

export class EditorEngine {
    private _gameState: GameState = 'stopped';
    private _selectedEntityId: string | null = null;
    private _scene: IScene;
    private _registry: IEditorPluginRegistry;
    private _componentFactory: IEcsComponentFactory;

    // Viewport Management
    private _viewports = new Map<string, EditorViewport>();
    private _viewportProfiles = new Map<string, ViewportConfiguration>();
    private _activeViewportId: string | null = null;

    constructor(options: EditorEngineOptions) {
        this._scene = options.scene;
        this._registry = options.registry;
        this._componentFactory = options.componentFactory || new DefaultEcsComponentFactory();
    }

    get componentFactory(): IEcsComponentFactory {
        return this._componentFactory;
    }

    // --- Viewports API ---

    public createViewport(id: string, profileId?: string): EditorViewport {
        if (this._viewports.has(id)) {
            throw new Error(`Viewport with id ${id} already exists`);
        }

        const viewport = new EditorViewport({ id, editorEngine: this });
        this._viewports.set(id, viewport);

        if (profileId) {
            this.applyProfileToViewport(id, profileId);
        }

        if (!this._activeViewportId) {
            this._activeViewportId = id;
        }

        return viewport;
    }

    public registerViewportProfile(id: string, config: ViewportConfiguration) {
        this._viewportProfiles.set(id, config);
    }

    public applyProfileToViewport(viewportId: string, profileId: string) {
        const viewport = this.getViewport(viewportId);
        const config = this._viewportProfiles.get(profileId);
        if (viewport && config) {
            viewport.applyConfiguration(config);
        }
    }

    public getViewport(id: string): EditorViewport | undefined {
        return this._viewports.get(id);
    }

    public get activeViewport(): EditorViewport | undefined {
        if (!this._activeViewportId) return undefined;
        return this._viewports.get(this._activeViewportId);
    }

    public setActiveViewport(id: string | null) {
        if (id && !this._viewports.has(id)) return;
        this._activeViewportId = id;
    }

    public destroyViewport(id: string) {
        const viewport = this._viewports.get(id);
        if (viewport) {
            viewport.dispose();
            this._viewports.delete(id);
        }
        if (this._activeViewportId === id) {
            // fallback to first available or null
            this._activeViewportId = this._viewports.size > 0 ? (this._viewports.keys().next().value || null) : null;
        }
    }

    public getAllViewports(): ReadonlyArray<EditorViewport> {
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

    public setGameState(state: GameState, ctx: any) {
        if (this._gameState === state) return;
        this._gameState = state;

        // Notify plugins
        for (const plugin of this._registry.plugins) {
            if (plugin.enabled && plugin.onGameStateChanged) {
                plugin.onGameStateChanged(state, ctx);
            }
        }
    }

    public setSelectedEntity(id: string | null, ctx: any) {
        if (this._selectedEntityId === id) return;
        this._selectedEntityId = id;

        // Notify plugins
        const ids = id ? [id] : [];
        for (const plugin of this._registry.plugins) {
            if (plugin.enabled && plugin.onSelectionChanged) {
                plugin.onSelectionChanged(ids, ctx);
            }
        }
    }

    // --- Entity Actions ---

    public createEntity(parentId?: string | null): Entity {
        const entity = new Entity(`Entity_${Math.random().toString(36).substr(2, 6)}`);

        if (parentId) {
            // Note: IScene does not natively have an addEntityWithParent method right now, 
            // relying on reparenting logic after addition. 
            // In a real scenario, this delegates to scene operations.
            this._scene.addEntity(entity);
            if (this._scene.reparentEntity) {
                this._scene.reparentEntity(entity.id, parentId);
            }
        } else {
            this._scene.addEntity(entity);
        }

        return entity;
    }

    public deleteEntity(id: string) {
        if (this._selectedEntityId === id) {
            this._selectedEntityId = null; // deselect if deleting selected
        }
        this._scene.removeEntity(id);
    }

    public duplicateEntity(id: string) {
        console.warn('Duplicate entity logic requires deep cloning components. Delegated to specific scene copy logic.');
    }

    public reparentEntity(childId: string, newParentId: string | null) {
        if (this._scene.reparentEntity) {
            this._scene.reparentEntity(childId, newParentId);
        }
    }

    public setConfig(pluginId: string, key: string, value: any) {
        this._registry.setConfig(pluginId, key, value);
    }

    // --- Lifecycle ---

    public tick(dt: number, ctx: any) {
        for (const plugin of this._registry.plugins) {
            if (plugin.enabled && plugin.onTick) {
                plugin.onTick(dt, ctx);
            }
        }

        // Update viewports (and their internal plugins)
        for (const viewport of this._viewports.values()) {
            viewport.update(dt);
        }
    }
}
