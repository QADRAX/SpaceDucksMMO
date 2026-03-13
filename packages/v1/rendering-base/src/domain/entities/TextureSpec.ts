/**
 * Value Object representing texture specification.
 *
 * Defines metadata about a texture for rendering.
 */
export interface TextureSpec {
  readonly id: string;
  readonly name: string;
  readonly format?: string;
  readonly width?: number;
  readonly height?: number;
  readonly mipmaps?: boolean;
  readonly repeating?: boolean;
  readonly options?: Record<string, unknown>;
}

/**
 * Factory for creating TextureSpec value objects.
 */
export function createTextureSpec(
  id: string,
  name: string,
  options: Partial<TextureSpec> = {}
): TextureSpec {
  return {
    id,
    name,
    mipmaps: true,
    repeating: true,
    ...options,
  };
}
