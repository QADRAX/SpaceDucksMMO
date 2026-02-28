/**
 * A Viewport Blueprint is a reusable recipe or template for building a viewport.
 * It defines which controller and features are active, and their initial properties.
 */
export interface ViewportBlueprint {
    /** 
     * Resource identifier for the main viewport controller 
     * (e.g. 'builtin/viewport/free_cam.lua') 
     */
    controllerId: string;

    /** Initial properties for the viewport controller */
    properties: Record<string, any>;

    /** 
     * List of feature resource identifiers to be active in this viewport. 
     * Features represent modular addons (Stats, Gizmos, etc).
     */
    features: string[];

    /** Optional metadata for the UI (e.g. 'scene', 'game', 'particle-editor') */
    category?: string;
}
