import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ITextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import type { IVisualComponent } from './components/IVisualComponent';
import { TextureComponent } from './components/TextureComponent';
import { TintComponent } from './components/TintComponent';
import { AtmosphereComponent } from './components/AtmosphereComponent';
import { CoronaComponent } from './components/CoronaComponent';
import { RotationComponent } from './components/RotationComponent';
import { AccretionDiskComponent } from './components/AccretionDiskComponent';
import { EventHorizonComponent } from './components/EventHorizonComponent';
import { JetStreamComponent } from './components/JetStreamComponent';
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
 * Implements IInspectable to expose component properties incrementally.
 * Properties are organized by component type for clear editing.
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
export class CelestialBody implements ISceneObject, ITextureReloadable, IInspectable {
  readonly id: string;
  
  private mainMesh!: THREE.Mesh;
  private config: Required<CelestialBodyBaseConfig>;
  private components: IVisualComponent[] = [];
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
  addComponent(component: IVisualComponent): this {
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
  getComponent<T extends IVisualComponent>(type: new (...args: any[]) => T): T | undefined {
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

  // ============================================
  // IInspectable Implementation
  // ============================================

  getTransform(): THREE.Object3D {
    return this.mainMesh;
  }

  getInspectableProperties(): InspectableProperty[] {
    const properties: InspectableProperty[] = [];

    // Base properties
    properties.push(
      {
        name: 'radius',
        label: 'Radius',
        type: 'number',
        value: this.config.radius,
        min: 0.1,
        max: 20,
        step: 0.1,
        description: 'Size of the celestial body'
      },
      {
        name: 'roughness',
        label: 'Roughness',
        type: 'number',
        value: this.config.roughness,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Surface roughness (0 = smooth, 1 = rough)'
      },
      {
        name: 'metalness',
        label: 'Metalness',
        type: 'number',
        value: this.config.metalness,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Metallic appearance'
      }
    );

    // Emissive properties (if has emissive)
    if (this.config.emissive !== 0x000000 || this.config.emissiveIntensity > 0) {
      properties.push(
        {
          name: 'emissiveIntensity',
          label: 'Emissive Intensity',
          type: 'number',
          value: this.config.emissiveIntensity,
          min: 0,
          max: 5,
          step: 0.1,
          description: 'Intensity of self-illumination'
        }
      );
    }

    // Delegate to components: each component provides its own properties
    // This follows the Open/Closed principle - new components don't require changes here
    this.components.forEach(component => {
      if ('getInspectableProperties' in component && typeof component.getInspectableProperties === 'function') {
        const componentProperties = component.getInspectableProperties();
        properties.push(...componentProperties);
      }
    });

    return properties;
  }

  setProperty(name: string, value: any): void {
    // Base properties
    if (name === 'radius') {
      this.config.radius = value;
      if (this.mainMesh) {
        const newGeometry = new THREE.SphereGeometry(value, this.config.segments, this.config.segments);
        this.mainMesh.geometry.dispose();
        this.mainMesh.geometry = newGeometry;
      }
      return;
    }

    if (name === 'roughness') {
      this.config.roughness = value;
      if (this.mainMesh) {
        (this.mainMesh.material as THREE.MeshStandardMaterial).roughness = value;
      }
      return;
    }

    if (name === 'metalness') {
      this.config.metalness = value;
      if (this.mainMesh) {
        (this.mainMesh.material as THREE.MeshStandardMaterial).metalness = value;
      }
      return;
    }

    if (name === 'emissiveIntensity') {
      this.config.emissiveIntensity = value;
      if (this.mainMesh) {
        (this.mainMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = value;
      }
      return;
    }

    // Component properties - delegate to components
    // Components handle their own property names with namespace (e.g., 'corona.color')
    for (const component of this.components) {
      if ('setProperty' in component && typeof component.setProperty === 'function') {
        // Check if this property belongs to this component by trying to get it
        if ('getProperty' in component && typeof component.getProperty === 'function') {
          const currentValue = component.getProperty(name);
          if (currentValue !== undefined) {
            component.setProperty(name, value);
            return;
          }
        }
      }
    }
  }

  getProperty(name: string): any {
    // Base properties
    if (name === 'radius') return this.config.radius;
    if (name === 'roughness') return this.config.roughness;
    if (name === 'metalness') return this.config.metalness;
    if (name === 'emissiveIntensity') return this.config.emissiveIntensity;

    // Component properties - delegate to components
    for (const component of this.components) {
      if ('getProperty' in component && typeof component.getProperty === 'function') {
        const value = component.getProperty(name);
        if (value !== undefined) {
          return value;
        }
      }
    }

    return undefined;
  }

  getTypeName(): string {
    // Detect type based on components
    if (this.getComponent(AccretionDiskComponent)) {
      return 'Black Hole';
    }
    if (this.getComponent(CoronaComponent)) {
      return 'Star';
    }
    return 'Planet';
  }
}
