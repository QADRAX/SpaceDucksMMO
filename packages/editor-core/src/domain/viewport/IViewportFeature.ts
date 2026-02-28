import { UIElementDescriptor } from '../extension/IEditorExtension';
import { Viewport } from './Viewport';
import { EditorSession } from '../session/EditorSession';

/**
 * Context passed to viewport controllers and features.
 */
export interface ViewportContext {
    /** The viewport instance this controller/feature belongs to. */
    viewport: Viewport;
    /** The root editor session. */
    session: EditorSession;
}

/**
 * Predefined UI slots for viewport-specific contributions.
 */
export type ViewportUISlot =
    | 'viewport:overlay:top-left'
    | 'viewport:overlay:top-right'
    | 'viewport:overlay:bottom-left'
    | 'viewport:overlay:bottom-right'
    | 'viewport:toolbar:left'
    | 'viewport:toolbar:right'
    | 'viewport:context-menu';

/**
 * A single UI contribution to a viewport slot.
 */
export interface ViewportUIContribution {
    /** Target slot ID. */
    slot: ViewportUISlot | string;
    /** UI Descriptor defining the element to render. */
    descriptor: UIElementDescriptor;
}

/**
 * A Viewport Feature is a modular, reusable "addon" for a viewport.
 * Features are strictly slot-based and typically handle a single UI atomic responsibility (e.g. Stats, Gizmos).
 */
export interface IViewportFeature {
    /** Unique identifier for the feature. */
    readonly id: string;

    /** Metadata and default configuration for the feature. */
    readonly meta?: {
        displayName: string;
        description?: string;
        defaultSlot?: ViewportUISlot | string;
    };

    /** Called when the feature is attached to the viewport by the orchestrator. */
    onEnable?: (ctx: ViewportContext) => void | (() => void);

    /** Called every frame if the viewport is active. */
    onTick?: (dt: number, ctx: ViewportContext) => void;

    /** Returns the UI contribution for this feature. */
    getUI?: (ctx: ViewportContext) => ViewportUIContribution | null;

    /** Input Handling. */
    onPointerDown?: (event: PointerEvent, ctx: ViewportContext) => boolean | void;
    onPointerMove?: (event: PointerEvent, ctx: ViewportContext) => void;
    onPointerUp?: (event: PointerEvent, ctx: ViewportContext) => void;
}

/**
 * A Viewport Controller is the "Pilot" of a viewport.
 * It is responsible for the subscene logic, camera movements, and core viewport state.
 * There is exactly ONE active controller per viewport.
 */
export interface IViewportController {
    /** Called when the controller becomes active. */
    onEnable?: (ctx: ViewportContext) => void;
    /** Called every frame. */
    onTick?: (dt: number, ctx: ViewportContext) => void;
    /** Called when the controller is removed or replaced. */
    onDestroy?: (ctx: ViewportContext) => void;
    /** Called when a configuration property is changed. */
    onPropertyChanged?: (props: any, prevProps: any, ctx: ViewportContext) => void;
}
