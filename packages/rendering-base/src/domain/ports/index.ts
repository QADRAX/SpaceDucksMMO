/**
 * Re-export core rendering ports from @duckengine/core
 *
 * These ports define the main contracts that concrete renderers must implement.
 */

export type { IRenderingEngine } from '@duckengine/core';
export type { IRenderSyncSystem } from '@duckengine/core';
export type { ITextureResolver, TextureCatalogService } from '@duckengine/core';

/**
 * Export base feature interface
 */
export type { IRenderFeature } from './IRenderFeature';

/**
 * Export loading overlay ports
 */
export type { ILoadingOverlay, ILoadingOverlayFactory } from './ILoadingOverlay';
