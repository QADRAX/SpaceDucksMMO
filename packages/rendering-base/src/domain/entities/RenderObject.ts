/**
 * Value Object representing a rendering object in the scene.
 *
 * Maps a render entity ID to its underlying framework object.
 */
export interface RenderObject {
  /**
   * Unique identifier for the entity.
   */
  readonly id: string;

  /**
   * The underlying framework object (THREE.Object3D, WebGL object, etc).
   * Type is kept as unknown to remain framework-agnostic.
   */
  readonly object3D: unknown;

  /**
   * Metadata for the render object.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Factory for creating RenderObject value objects.
 */
export function createRenderObject(
  id: string,
  object3D: unknown,
  metadata?: Record<string, unknown>
): RenderObject {
  return {
    id,
    object3D,
    metadata,
  };
}
