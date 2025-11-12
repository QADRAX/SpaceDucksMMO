/**
 * Interface for scene objects that support texture reloading.
 * Allows objects to respond to texture quality changes in settings.
 */
export interface ITextureReloadable {
  /**
   * Reload textures with current quality settings.
   * Called when user changes texture quality in settings.
   */
  reloadTexture(): Promise<void>;
}

/**
 * Type guard to check if an object implements ITextureReloadable
 */
export function isTextureReloadable(obj: any): obj is ITextureReloadable {
  return obj && typeof obj.reloadTexture === 'function';
}
