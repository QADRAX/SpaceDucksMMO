import type { IPhysicsSystem } from "@duckengine/core";
import { RapierPhysicsSystem, initRapier } from "@duckengine/physics-rapier";
import type { IFpsController } from "@duckengine/rendering-three";
import { ThreeRenderer } from "@duckengine/rendering-three";

/**
 * Composition root helper: wraps a renderer backend and injects a physics backend.
 *
 * Core remains decoupled: it only calls `engine.createPhysicsSystem?.()`.
 */
export class EngineWithPhysics extends ThreeRenderer {
  constructor(fpsController: IFpsController) {
    super(fpsController);
  }

  /** Initialize Rapier once during bootstrap (recommended). */
  static async initPhysicsBackend(): Promise<void> {
    await initRapier();
  }

  /** Physics injection point: creates a fresh physics system for each scene. */
  createPhysicsSystem(): IPhysicsSystem {
    return new RapierPhysicsSystem();
  }
}

export default EngineWithPhysics;
