import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ITextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type { ICelestialComponent } from './components/ICelestialComponent';
import { TextureComponent } from './components/TextureComponent';
import * as THREE from 'three';

/**
 * Configuration for the base celestial body mesh
 */
export interface CelestialBodyBaseConfig {
  radius: number;
  segments?: number;
  color?: number;
  roughness?: number;
  metalness?: number;
  emissive?: number;
  emissiveIntensity?: number;
  receiveShadows?: boolean;
  castShadows?: boolean;
}

/**
 * Clean, component-based celestial body.
 * Uses composition over inheritance - components handle specific functionality.
 * 
 * @example
 * ```ts
 * const sun = new CelestialBody({
 *   radius: 1.2,
 *   emissive: 0xffaa00,
 *   emissiveIntensity: 2.0
 * });
 * 
 * sun.addComponent(new TextureComponent(resolver, { textureId: 'sun' }));
 * sun.addComponent(new CoronaComponent({ color: 0xffdd44, radiusMultiplier: 1.4 }));
 * sun.addComponent(new LightEmissionComponent({ intensity: 6.0 }));
 * ```
 */
export class CelestialBody implements ISceneObject, ITextureReloadable {
  readonly id: string;
  
  private mainMesh!: THREE.Mesh;
  private config: Required<CelestialBodyBaseConfig>;
  private components: ICelestialComponent[] = [];
  private scene?: THREE.Scene;

  constructor(id: string, config: CelestialBodyBaseConfig) {
    this.id = id;
    this.config = {
      radius: config.radius,
      segments: config.segments ?? 64,
      color: config.color ?? 0xffffff,
      roughness: config.roughness ?? 0.8,
      metalness: config.metalness ?? 0.1,
      emissive: config.emissive ?? 0x000000,
      emissiveIntensity: config.emissiveIntensity ?? 0,
      receiveShadows: config.receiveShadows ?? true,
      castShadows: config.castShadows ?? true,
    };
  }

  /**
   * Add a component to this celestial body
   */
  addComponent(component: ICelestialComponent): this {
    this.components.push(component);
    
    // If already initialized, initialize the component immediately
    if (this.scene && this.mainMesh) {
      component.initialize(this.scene, this.mainMesh);
    }
    
    return this;
  }

  /**
   * Get a component by type
   */
  getComponent<T extends ICelestialComponent>(type: new (...args: any[]) => T): T | undefined {
    return this.components.find(c => c instanceof type) as T | undefined;
  }

  addTo(scene: THREE.Scene): void {
    this.scene = scene;
    
    // Create main mesh
    const geometry = new THREE.SphereGeometry(
      this.config.radius,
      this.config.segments,
      this.config.segments
    );

    const material = new THREE.MeshStandardMaterial({
      color: this.config.color,
      roughness: this.config.roughness,
      metalness: this.config.metalness,
      emissive: this.config.emissive,
      emissiveIntensity: this.config.emissiveIntensity,
      flatShading: false,
    });

    this.mainMesh = new THREE.Mesh(geometry, material);
    this.mainMesh.receiveShadow = this.config.receiveShadows;
    this.mainMesh.castShadow = this.config.castShadows;
    scene.add(this.mainMesh);

    // Initialize all components
    this.components.forEach(component => {
      component.initialize(scene, this.mainMesh);
    });
  }

  update(deltaTime: number): void {
    // Update all components
    this.components.forEach(component => {
      component.update(deltaTime);
    });
  }

  async reloadTexture(): Promise<void> {
    // Find texture component and reload
    const textureComponent = this.getComponent(TextureComponent);
    if (textureComponent) {
      await (textureComponent as any).reloadTexture();
    }
  }

  /**
   * Get the main mesh for external manipulation
   */
  getObject3D(): THREE.Mesh {
    return this.mainMesh;
  }

  /**
   * Set position of the celestial body
   */
  setPosition(x: number, y: number, z: number): void {
    if (this.mainMesh) {
      this.mainMesh.position.set(x, y, z);
    }
  }

  removeFrom(scene: THREE.Scene): void {
    // Dispose all components
    this.components.forEach(component => {
      component.dispose(scene);
    });

    // Remove main mesh
    if (this.mainMesh) {
      scene.remove(this.mainMesh);
      this.mainMesh.geometry.dispose();
      (this.mainMesh.material as THREE.Material).dispose();
    }
  }

  dispose(): void {
    // Cleanup handled in removeFrom
  }
}
