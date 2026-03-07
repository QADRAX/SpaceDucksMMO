/**
 * Value Object representing a rendering pass specification.
 *
 * Defines parameters for a single render pass (e.g., shadow pass, forward pass, etc).
 */
export interface RenderPassSpec {
  /**
   * Name of the pass for debugging.
   */
  readonly name: string;

  /**
   * Whether this pass is enabled.
   */
  readonly enabled: boolean;

  /**
   * Clear color before rendering.
   */
  readonly clearColor?: { r: number; g: number; b: number; a: number };

  /**
   * Clear depth buffer.
   */
  readonly clearDepth?: boolean;

  /**
   * Frame target for this pass (screen or texture).
   */
  readonly targetId?: string;

  /**
   * Additional options by implementation.
   */
  readonly options?: Record<string, unknown>;
}

/**
 * Factory for creating RenderPassSpec value objects.
 */
export function createRenderPassSpec(
  name: string,
  options: Partial<RenderPassSpec> = {}
): RenderPassSpec {
  return {
    name,
    enabled: true,
    clearDepth: true,
    ...options,
  };
}
