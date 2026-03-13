/**
 * ILoadingOverlay — contract for a scene-loading overlay UI.
 *
 * Implement this interface to provide a custom loading screen
 * (e.g. a React component, Canvas 2D animation, branded spinner, etc.)
 * and pass an {@link ILoadingOverlayFactory} to the renderer constructor.
 *
 * @example
 * ```ts
 * class MyOverlay implements ILoadingOverlay {
 *   mount(container: HTMLElement) { ... }
 *   setProgress(p: number) { ... }
 *   setText(t: string) { ... }
 *   setVisible(v: boolean) { ... }
 *   dispose() { ... }
 * }
 *
 * const renderer = new ThreeRenderer(fpsController, {
 *   overlayFactory: { create: () => new MyOverlay() },
 * });
 * ```
 */
export interface ILoadingOverlay {
    /**
     * Mount the overlay DOM / canvas into the given container.
     * Called once per canvas when a scene starts loading.
     */
    mount(container: HTMLElement): void;

    /**
     * Update the progress indicator.
     * @param progress — value from 0 (nothing loaded) to 1 (fully loaded)
     */
    setProgress(progress: number): void;

    /**
     * Update the status text shown to the user (e.g. "Finalizing GPU textures…").
     */
    setText(text: string): void;

    /**
     * Show or hide the overlay without unmounting it.
     * Called when `setLoadingOverlayEnabled()` changes at runtime.
     */
    setVisible(visible: boolean): void;

    /**
     * Unmount the overlay and release any held resources.
     * Called when loading completes or the renderer is disposed.
     */
    dispose(): void;
}

/**
 * Factory that creates one {@link ILoadingOverlay} per canvas/view.
 * The renderer calls `create()` once per `mount` point.
 */
export interface ILoadingOverlayFactory {
    create(): ILoadingOverlay;
}
