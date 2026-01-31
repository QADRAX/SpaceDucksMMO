import type { IRenderingEngine } from '../rendering/IRenderingEngine';

export interface IScene {
  readonly id: string;

  setup(engine: IRenderingEngine, renderScene: unknown): void;
  teardown(engine: IRenderingEngine, renderScene: unknown): void;

  update(dt: number): void;

  /** Returns an implementation-defined camera entity or null. */
  getActiveCamera(): unknown | null;
}
