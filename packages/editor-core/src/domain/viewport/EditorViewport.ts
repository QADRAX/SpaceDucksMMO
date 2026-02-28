import { Entity } from '@duckengine/core';
import { EditorEngine } from '../state/EditorEngine';
import { IViewportPlugin, IViewportScript, ViewportPluginContext, ViewportUIContribution } from '../plugin/IViewportPlugin';

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

    private _plugins = new Map<string, { plugin: IViewportPlugin, cleanup?: () => void }>();
    private _script: IViewportScript | null = null;
    private _scriptProps: Record<string, any> = {};
    private _managedEntities = new Map<string, string>(); // key -> entityId

    private _editorEngine: EditorEngine;

    constructor(options: EditorViewportOptions) {
        this.id = options.id;
        this.type = options.type;
        this._editorEngine = options.editorEngine;
    }

    public setProperty(key: string, value: any) {
        const prevProps = { ...this._scriptProps };
        this._scriptProps[key] = value;
        const ctx = this._createContext();
        if (this._script?.onPropertyChanged) {
            this._script.onPropertyChanged(this._scriptProps, prevProps, ctx);
        }
    }

    public get scriptProps(): Record<string, any> {
        return { ...this._scriptProps };
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
        const ctx = this._createContext();

        if (this._script?.onDestroy) {
            this._script.onDestroy(ctx);
        }
        this._script = null;

        for (const { cleanup } of this._plugins.values()) {
            cleanup?.();
        }
        this._plugins.clear();

        for (const entityId of this._trackedEditorEntities) {
            this._editorEngine.scene.removeEntity(entityId);
        }
        this._trackedEditorEntities.clear();
        this._cameraEntityId = null;
    }

    // --- Script & Plugin Management ---

    public setScript(script: IViewportScript) {
        this._script = script;
        const ctx = this._createContext();
        script.onEnable?.(ctx);
    }

    public registerPlugin(plugin: IViewportPlugin) {
        if (this._plugins.has(plugin.id)) return;

        const ctx = this._createContext();
        const cleanup = plugin.onEnable?.(ctx) || undefined;
        this._plugins.set(plugin.id, { plugin, cleanup });
    }

    public unregisterPlugin(id: string) {
        const entry = this._plugins.get(id);
        if (entry) {
            entry.cleanup?.();
            this._plugins.delete(id);
        }
    }

    public update(dt: number) {
        const ctx = this._createContext();

        // Update Script first
        if (this._script?.onTick) {
            this._script.onTick(dt, ctx);
        }

        // Update Plugins
        for (const { plugin } of this._plugins.values()) {
            plugin.onTick?.(dt, ctx);
        }
    }

    public getUIContributions(): ViewportUIContribution[] {
        const ctx = this._createContext();
        const contributions: ViewportUIContribution[] = [];
        for (const { plugin } of this._plugins.values()) {
            const ui = plugin.getUI?.(ctx);
            if (ui) contributions.push(...ui);
        }
        return contributions;
    }

    private _createContext(): ViewportPluginContext {
        return {
            viewport: this,
            editorEngine: this._editorEngine
        };
    }
}
