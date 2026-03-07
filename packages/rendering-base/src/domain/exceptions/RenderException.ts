/**
 * Base exception for rendering system.
 *
 * All rendering-related errors should extend this.
 */
export class RenderException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RenderException';
  }
}

/**
 * Raised when rendering initialization fails.
 */
export class RenderInitializationException extends RenderException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RENDER_INIT_FAILED', details);
    this.name = 'RenderInitializationException';
  }
}

/**
 * Raised when renderer is not properly initialized before use.
 */
export class RendererNotInitializedException extends RenderException {
  constructor() {
    super('Renderer not initialized', 'RENDERER_NOT_READY');
    this.name = 'RendererNotInitializedException';
  }
}

/**
 * Raised when device capabilities are insufficient.
 */
export class InsufficientCapabilitiesException extends RenderException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INSUFFICIENT_CAPABILITIES', details);
    this.name = 'InsufficientCapabilitiesException';
  }
}

/**
 * Raised when a render feature encounters an error.
 */
export class FeatureException extends RenderException {
  constructor(
    public readonly featureName: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `[${featureName}] ${message}`,
      `FEATURE_ERROR_${featureName.toUpperCase()}`,
      details
    );
    this.name = 'FeatureException';
  }
}

/**
 * Raised when sync system encounters an error.
 */
export class SyncSystemException extends RenderException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SYNC_SYSTEM_ERROR', details);
    this.name = 'SyncSystemException';
  }
}
