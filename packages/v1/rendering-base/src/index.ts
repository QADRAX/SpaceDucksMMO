/**
 * Main entrypoint for @duckengine/rendering-base
 *
 * Exports the public API: domain ports, exceptions, and application coordinators.
 * Infrastructure is internal and not exposed to consumers.
 */

// Domain layer - primary exports
export * from './domain/index';

// Application coordinators
export { RenderFeatureRouter, RenderObjectRegistry } from './application/coordinators/index';

// Application DTOs
export type { RenderInitRequest, RenderInitResult } from './application/dtos/RenderInitRequest';
export type { RenderFrameRequest, RenderFrameResult } from './application/dtos/RenderFrameRequest';

// Re-export core abstractions
export type { IRenderingEngine, IRenderSyncSystem } from '@duckengine/core';
export { CoreLogger, LoadingTracker } from '@duckengine/core';
