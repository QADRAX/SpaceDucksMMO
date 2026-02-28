import { Entity } from '@duckengine/core';
import { EditorEngine } from '../state/EditorEngine';

export type ViewportType = 'game' | 'scene' | 'custom';

export interface EditorViewportOptions {
    id: string;
    type: ViewportType;
    editorEngine: EditorEngine;
}

export class EditorViewport {
    public readonly id: string;
    public readonly type: ViewportType;

    // The designated camera for this viewport, if any
    private _cameraEntityId: string | null = null;

    // Tracked Editor Entities injected by this viewport 
    // Usually these are non-serialized support entities like free-cameras or gizmos
    private _trackedEditorEntities = new Set<string>();

    private _editorEngine: EditorEngine;

    constructor(options: EditorViewportOptions) {
        this.id = options.id;
        this.type = options.type;
        this._editorEngine = options.editorEngine;
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
     * Spawns an Editor Entity. 
     * It adds a standard Entity to the main IScene but tracks it so it can be 
     * cleaned up automatically when this viewport closes, and ignored during serialization.
     */
    public spawnEditorEntity(baseName: string): Entity {
        const entity = new Entity(`${baseName}_${Math.random().toString(36).substr(2, 6)}`);

        // Add to main scene
        this._editorEngine.scene.addEntity(entity);

        // Track for cleanup
        this._trackedEditorEntities.add(entity.id);

        return entity;
    }

    /**
     * Cleans up all tracked editor entities from the main scene.
     */
    public dispose() {
        for (const entityId of this._trackedEditorEntities) {
            this._editorEngine.scene.removeEntity(entityId);
        }
        this._trackedEditorEntities.clear();
        this._cameraEntityId = null;
    }
}
