import * as THREE from 'three';
import type { IRenderingEngine } from '@duckengine/core';
import type { IScene } from '@duckengine/core';

/**
 * Scaffold ThreeRenderer.
 *
 * The real implementation will be migrated from packages/client.
 */
export class ThreeRenderer implements IRenderingEngine {
  init(_container: HTMLElement): void {
    void THREE;
    throw new Error('Not implemented');
  }
  start(): void {
    throw new Error('Not implemented');
  }
  stop(): void {
    throw new Error('Not implemented');
  }
  setScene(_scene: IScene): void {
    throw new Error('Not implemented');
  }
  getActiveScene(): IScene | null {
    return null;
  }
  renderFrame(): void {
    throw new Error('Not implemented');
  }
  onActiveCameraChanged(): void {
    // no-op in scaffold
  }
  setResolutionPolicy(_policy: 'auto' | 'scale', _scale?: number): void {
    throw new Error('Not implemented');
  }
  setResolutionScale(_scale: number): void {
    throw new Error('Not implemented');
  }
  setAntialias(_enabled: boolean): void {
    throw new Error('Not implemented');
  }
  setShadows(_enabled: boolean, _type?: unknown): void {
    throw new Error('Not implemented');
  }
  enablePostProcessing(): unknown {
    throw new Error('Not implemented');
  }
  disablePostProcessing(): void {
    throw new Error('Not implemented');
  }
  getComposer(): unknown | undefined {
    return undefined;
  }
}
