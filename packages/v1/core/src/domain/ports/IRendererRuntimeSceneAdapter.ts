/**
 * Optional renderer-runtime hooks for scenes.
 *
 * This adapter allows renderers to communicate runtime state transitions
 * (like initial loading/freeze windows) without coupling to concrete scene
 * internals or private fields.
 */
export interface IRendererRuntimeSceneAdapter {
  /**
   * Notify scene runtime about initial-loading state.
   * Implementations may forward this to their render-sync runtime.
   */
  setInitialLoadingState(loading: boolean): void;
}

/** Token to force module emission */
export const IRendererRuntimeSceneAdapter_TOKEN = 'IRendererRuntimeSceneAdapter';
