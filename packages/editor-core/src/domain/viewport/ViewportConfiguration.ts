export interface ViewportConfiguration {
    /** resource identifier for the main viewport script (e.g. 'builtin/viewport/free_cam.lua') */
    scriptId: string;

    /** Initial properties for the viewport script */
    properties: Record<string, any>;

    /** 
     * List of plugin resource identifiers to be active in this viewport. 
     * These plugins are managed by the orchestration layer, not by the viewport script itself.
     */
    plugins: string[];

    /** Optional metadata for the UI (e.g. 'scene', 'game', 'particle-editor') */
    category?: string;
}
