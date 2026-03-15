import type { ViewportRectProviderPort } from '@duckengine/core-v2';
import { createRenderingSubsystem as createWebGPUSubsystem } from '@duckengine/rendering-three-webgpu-v2';
import { createRenderingSubsystem as createGLSubsystem } from '@duckengine/rendering-three-gl-v2';
import type { EngineSubsystem } from '@duckengine/core-v2';
import { isWebGPUAvailable } from './isWebGPUAvailable';

export type RenderingBackend = 'webgpu' | 'webgl' | 'auto';

/** Options for the rendering subsystem facade. */
export interface CreateRenderingSubsystemOptions {
  /** Viewport rect provider. Consumer implements based on layout (web, Electron, etc.). */
  readonly viewportRectProvider: ViewportRectProviderPort;
  /**
   * Backend preference. Default: 'auto' (WebGPU if available, else WebGL).
   * Use 'webgpu' or 'webgl' to force a backend (e.g. for testing).
   */
  readonly preferBackend?: RenderingBackend;
}

/**
 * Creates the rendering engine subsystem with automatic backend selection.
 * Tries WebGPU first when available (browser with WebGPU support), falls back to WebGL.
 * Agnostic of browser vs Node: in Node, WebGL is used (no-op if no canvas is registered).
 *
 * @example
 * ```ts
 * const subsystem = createRenderingSubsystem({
 *   viewportRectProvider: myLayoutProvider,
 *   preferBackend: 'auto', // or 'webgpu' | 'webgl'
 * });
 * api.setup({ engineSubsystems: [subsystem] });
 * ```
 */
export function createRenderingSubsystem(
  options: CreateRenderingSubsystemOptions,
): EngineSubsystem {
  const { viewportRectProvider, preferBackend = 'auto' } = options;

  const useWebGPU =
    preferBackend === 'webgpu' ||
    (preferBackend === 'auto' && isWebGPUAvailable());

  return useWebGPU
    ? createWebGPUSubsystem({ viewportRectProvider })
    : createGLSubsystem({ viewportRectProvider });
}
