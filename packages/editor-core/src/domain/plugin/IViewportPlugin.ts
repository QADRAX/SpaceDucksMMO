import { UIElementDescriptor } from './IEditorPlugin';
import { EditorViewport } from '../viewport/EditorViewport';
import { EditorEngine } from '../state/EditorEngine';

export interface ViewportPluginContext {
    viewport: EditorViewport;
    editorEngine: EditorEngine;
}

export type ViewportUISlot = 'toolbar' | 'overlay';

export interface ViewportUIContribution {
    slot: ViewportUISlot;
    descriptor: UIElementDescriptor | UIElementDescriptor[];
}

export interface IViewportPlugin {
    readonly id: string;

    /**
     * Called when the plugin is attached to the viewport.
     */
    onEnable?: (ctx: ViewportPluginContext) => void | (() => void);

    /**
     * Called every frame if the viewport is active.
     */
    onTick?: (dt: number, ctx: ViewportPluginContext) => void;

    /**
     * Returns UI elements to be rendered on top or in the toolbar of this viewport.
     */
    getUI?: (ctx: ViewportPluginContext) => ViewportUIContribution[] | null;

    /**
     * Input Handling.
     * Return true if the event was consumed and should not propagate to other plugins or the engine.
     */
    onPointerDown?: (event: PointerEvent, ctx: ViewportPluginContext) => boolean | void;
    onPointerMove?: (event: PointerEvent, ctx: ViewportPluginContext) => void;
    onPointerUp?: (event: PointerEvent, ctx: ViewportPluginContext) => void;

    /**
     * Called when a script property is changed.
     */
    onPropertyChanged?: (props: any, prevProps: any, ctx: ViewportPluginContext) => void;
}

/**
 * A Viewport Script is responsible for the subscene logic, camera movements, etc.
 * Unlike plugins, there is only ONE active script per viewport.
 */
export interface IViewportScript {
    onEnable?: (ctx: ViewportPluginContext) => void;
    onTick?: (dt: number, ctx: ViewportPluginContext) => void;
    onDestroy?: (ctx: ViewportPluginContext) => void;
    onPropertyChanged?: (props: any, prevProps: any, ctx: ViewportPluginContext) => void;
}
