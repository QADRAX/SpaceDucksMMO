import { Entity, IScene, SceneChangeEvent } from '@duckengine/core';
import { IEditorPluginRegistry } from '../plugin/IEditorPlugin';

export type GameState = 'stopped' | 'playing' | 'paused';

export interface EditorEngineOptions {
    scene: IScene;
    registry: IEditorPluginRegistry;
}

export class EditorEngine {
    private _gameState: GameState = 'stopped';
    private _selectedEntityId: string | null = null;
    private _scene: IScene;
    private _registry: IEditorPluginRegistry;

    // History could be managed here, but skipping full complex undo/redo logic for this iteration 
    // to focus on the core extraction. It can be expanded in the state management layer.

    constructor(options: EditorEngineOptions) {
        this._scene = options.scene;
        this._registry = options.registry;
    }

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

    // --- Lifecycle ---

    public tick(dt: number, ctx: any) {
        for (const plugin of this._registry.plugins) {
            if (plugin.enabled && plugin.onTick) {
                plugin.onTick(dt, ctx);
            }
        }
    }
}
