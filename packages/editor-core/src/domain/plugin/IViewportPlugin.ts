import { UIElementDescriptor } from './IEditorPlugin';
import { EditorViewport } from '../viewport/EditorViewport';
import { EditorEngine } from '../state/EditorEngine';

export interface ViewportPluginContext {
    viewport: EditorViewport;
    editorEngine: EditorEngine;
}

/**
 * Common Slot IDs for Viewport UI.
 * These are interpreted by the UI Renderer (e.g. React layer).
 */
export type ViewportUISlot =
    | 'viewport:overlay:top-left'
    | 'viewport:overlay:top-right'
    | 'viewport:overlay:bottom-left'
    | 'viewport:overlay:bottom-right'
    | 'viewport:toolbar:left'
    | 'viewport:toolbar:right'
    | 'viewport:context-menu';

export interface ViewportUIContribution {
    slot: ViewportUISlot | string;
    descriptor: UIElementDescriptor;
}

export interface IViewportPlugin {
    readonly id: string;

    /**
     * Metadata for the plugin, including its intended default slot.
     */
    readonly meta?: {
        displayName: string;
        description?: string;
        defaultSlot?: ViewportUISlot | string;
    };

    /**
     * Called when the plugin is attached to the viewport by the orchestrator.
     */
    onEnable?: (ctx: ViewportPluginContext) => void | (() => void);

    /**
     * Called every frame if the viewport is active.
     */
    onTick?: (dt: number, ctx: ViewportPluginContext) => void;

    /**
     * Returns the UI contribution for this plugin. 
     * In the new modular design, a plugin should ideally return ONE contribution for ONE slot.
     */
    getUI?: (ctx: ViewportPluginContext) => ViewportUIContribution | null;

    /**
     * Input Handling.
     */
    onPointerDown?: (event: PointerEvent, ctx: ViewportPluginContext) => boolean | void;
    onPointerMove?: (event: PointerEvent, ctx: ViewportPluginContext) => void;
    onPointerUp?: (event: PointerEvent, ctx: ViewportPluginContext) => void;
}

/**
 * A Viewport Script is responsible for the subscene logic, camera movements, etc.
 * Orchestrated externally.
 */
export interface IViewportScript {
    onEnable?: (ctx: ViewportPluginContext) => void;
    onTick?: (dt: number, ctx: ViewportPluginContext) => void;
    onDestroy?: (ctx: ViewportPluginContext) => void;
    onPropertyChanged?: (props: any, prevProps: any, ctx: ViewportPluginContext) => void;
}
