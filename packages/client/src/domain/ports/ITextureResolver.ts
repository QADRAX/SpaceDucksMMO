import type { TextureRequest, TextureResource, TextureQuality } from '@client/domain/assets/TextureTypes';

/**
 * Port for resolving texture paths based on configuration.
 * Follows Clean Architecture: domain defines the contract, 
 * infrastructure provides implementation.
 */
export interface ITextureResolver {
  /**
   * Resolve the path to a texture file based on current settings
   * @param request - Details about which texture is needed
   * @returns Resolved texture resource with full path
   */
  resolve(request: TextureRequest): TextureResource;

  /**
   * Resolve multiple textures at once (batch operation)
   * @param requests - Array of texture requests
   * @returns Array of resolved texture resources
   */
  resolveMany(requests: TextureRequest[]): TextureResource[];

  /**
   * Get the current texture quality setting
   * @returns Current quality level
   */
  getCurrentQuality(): TextureQuality;
}
