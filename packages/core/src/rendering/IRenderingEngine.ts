import type { IScene } from '../scene/IScene';

export interface IRenderingEngine {
  init(container: HTMLElement): void;
  start(): void;
  stop(): void;

  setScene(scene: IScene): void;
  getActiveScene(): IScene | null;

  renderFrame(): void;
  onActiveCameraChanged(): void;

  setResolutionPolicy(policy: 'auto' | 'scale', scale?: number): void;
  setResolutionScale(scale: number): void;
  setAntialias(enabled: boolean): void;
  setShadows(enabled: boolean, type?: unknown): void;

  enablePostProcessing(): unknown;
  disablePostProcessing(): void;
  getComposer(): unknown | undefined;
}
