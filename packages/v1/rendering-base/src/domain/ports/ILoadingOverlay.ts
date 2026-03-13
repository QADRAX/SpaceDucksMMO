/**
 * Port: LoadingOverlay UI Port
 *
 * Abstracts the UI component shown during scene loading.
 * Implementations can provide HTML overlays, progress bars, custom UI, etc.
 */
export interface ILoadingOverlay {
  /**
   * Show the overlay with optional message.
   */
  show(message?: string): void;

  /**
   * Hide the overlay.
   */
  hide(): void;

  /**
   * Update progress (0-1).
   */
  setProgress(value: number): void;

  /**
   * Set status message displayed to user.
   */
  setMessage(message: string): void;

  /**
   * Dispose of resources.
   */
  dispose(): void;
}

/**
 * Factory for creating LoadingOverlay instances.
 */
export interface ILoadingOverlayFactory {
  createOverlay(container: HTMLElement): ILoadingOverlay;
}
