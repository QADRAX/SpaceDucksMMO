import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { BaseScene } from './BaseScene';

/**
 * Configuration for adding a scene object
 */
interface SceneObjectConfig {
  /** Position in 3D space [x, y, z] */
  position?: [number, number, number];
}

/**
 * Entry in the scene setup queue
 */
interface SceneSetupEntry {
  object: ISceneObject;
  config?: SceneObjectConfig;
}

/**
 * Fluent builder for setting up scene objects.
 * Provides a clean, chainable API for adding and configuring scene objects.
 * 
 * @example
 * ```ts
 * this.setupScene(engine)
 *   .add(skybox)
 *   .add(star, { position: [0, 0, 0] })
 *   .add(earthPlanet, { position: [3, 0, 0] })
 *   .add(marsPlanet, { position: [-2.5, 0.5, 1] })
 *   .build();
 * ```
 */
export class SceneBuilder {
  private entries: SceneSetupEntry[] = [];

  constructor(
    private engine: IRenderingEngine,
    private scene: BaseScene
  ) {}

  /**
   * Add a scene object with optional configuration
   * 
   * @param object - The scene object to add
   * @param config - Optional configuration (position, etc.)
   * @returns this for chaining
   */
  add(object: ISceneObject, config?: SceneObjectConfig): this {
    this.entries.push({ object, config });
    return this;
  }

  /**
   * Build and apply all scene objects.
   * This method should be called last in the chain.
   */
  build(): void {
    this.entries.forEach(({ object, config }) => {
      // Add object to scene (enables texture reloading)
      (this.scene as any).addObject(this.engine, object);

      // Apply position if specified
      if (config?.position) {
        const [x, y, z] = config.position;
        
        // Use setPosition if available (CelestialBody API)
        if ('setPosition' in object && typeof object.setPosition === 'function') {
          (object as any).setPosition(x, y, z);
        }
        // Fallback to getObject3D if available
        else if ('getObject3D' in object && typeof object.getObject3D === 'function') {
          const obj3d = (object as any).getObject3D();
          if (obj3d) {
            obj3d.position.set(x, y, z);
          }
        }
      }
    });

    // Clear entries after building
    this.entries = [];
  }
}
