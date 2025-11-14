import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ITextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import type { ICelestialComponent } from './components/ICelestialComponent';
import { TextureComponent } from './components/TextureComponent';
import { TintComponent } from './components/TintComponent';
import { AtmosphereComponent } from './components/AtmosphereComponent';
import { CoronaComponent } from './components/CoronaComponent';
import { RotationComponent } from './components/RotationComponent';
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

    // Tint Component properties
    const tintComp = this.getComponent(TintComponent);
    if (tintComp) {
      const config = (tintComp as any).config as { tintColor: number; intensity: number };
      properties.push(
        {
          name: 'tint.color',
          label: 'Tint Color',
          type: 'color',
          value: config.tintColor,
          description: 'Color overlay for the surface'
        },
        {
          name: 'tint.intensity',
          label: 'Tint Intensity',
          type: 'number',
          value: config.intensity,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Strength of color tint'
        }
      );
    }

    // Atmosphere Component properties
    const atmosphereComp = this.getComponent(AtmosphereComponent);
    if (atmosphereComp) {
      const config = (atmosphereComp as any).config as { color: number; thickness: number; intensity: number };
      properties.push(
        {
          name: 'atmosphere.color',
          label: 'Atmosphere Color',
          type: 'color',
          value: config.color,
          description: 'Color of atmospheric glow'
        },
        {
          name: 'atmosphere.thickness',
          label: 'Atmosphere Thickness',
          type: 'number',
          value: config.thickness,
          min: 1.0,
          max: 2.0,
          step: 0.05,
          description: 'Size multiplier for atmosphere layer'
        },
        {
          name: 'atmosphere.intensity',
          label: 'Atmosphere Intensity',
          type: 'number',
          value: config.intensity,
          min: 0,
          max: 2,
          step: 0.1,
          description: 'Brightness of atmospheric glow'
        }
      );
    }

    // Corona Component properties
    const coronaComp = this.getComponent(CoronaComponent);
    if (coronaComp) {
      const config = (coronaComp as any).config as { color: number; radiusMultiplier: number; intensity: number };
      properties.push(
        {
          name: 'corona.color',
          label: 'Corona Color',
          type: 'color',
          value: config.color,
          description: 'Color of star corona'
        },
        {
          name: 'corona.radius',
          label: 'Corona Radius',
          type: 'number',
          value: config.radiusMultiplier,
          min: 1.0,
          max: 3.0,
          step: 0.1,
          description: 'Size multiplier for corona effect'
        },
        {
          name: 'corona.intensity',
          label: 'Corona Intensity',
          type: 'number',
          value: config.intensity,
          min: 0,
          max: 3,
          step: 0.1,
          description: 'Brightness of corona glow'
        }
      );
    }

    // Rotation Component properties
    const rotationComp = this.getComponent(RotationComponent);
    if (rotationComp) {
      const config = (rotationComp as any).config as { axis: THREE.Vector3; speed: number };
      properties.push(
        {
          name: 'rotation.speed',
          label: 'Rotation Speed',
          type: 'number',
          value: config.speed,
          min: -0.01,
          max: 0.01,
          step: 0.0001,
          description: 'Speed of self-rotation'
        }
      );
    }

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

    // Component properties
    const [componentName, propName] = name.split('.');

    if (componentName === 'tint' && propName) {
      const tintComp = this.getComponent(TintComponent);
      if (tintComp) {
        if (propName === 'color') {
          (tintComp as any).config.tintColor = value;
          (tintComp as any).applyTint();
        } else if (propName === 'intensity') {
          (tintComp as any).config.intensity = value;
          (tintComp as any).applyTint();
        }
      }
      return;
    }

    if (componentName === 'atmosphere' && propName) {
      const atmosphereComp = this.getComponent(AtmosphereComponent);
      if (atmosphereComp) {
        const config = (atmosphereComp as any).config;
        if (propName === 'color') {
          config.color = value;
          if ((atmosphereComp as any).atmosphereMesh) {
            const material = (atmosphereComp as any).atmosphereMesh.material as THREE.ShaderMaterial;
            material.uniforms.glowColor.value = new THREE.Color(value);
          }
        } else if (propName === 'thickness') {
          config.thickness = value;
          // Recreate atmosphere mesh with new size
          if (this.scene && (atmosphereComp as any).atmosphereMesh) {
            this.scene.remove((atmosphereComp as any).atmosphereMesh);
            (atmosphereComp as any).atmosphereMesh = null;
            atmosphereComp.initialize(this.scene, this.mainMesh);
          }
        } else if (propName === 'intensity') {
          config.intensity = value;
          if ((atmosphereComp as any).atmosphereMesh) {
            const material = (atmosphereComp as any).atmosphereMesh.material as THREE.ShaderMaterial;
            material.uniforms.intensity.value = value;
          }
        }
      }
      return;
    }

    if (componentName === 'corona' && propName) {
      const coronaComp = this.getComponent(CoronaComponent);
      if (coronaComp) {
        const config = (coronaComp as any).config;
        if (propName === 'color') {
          config.color = value;
          if ((coronaComp as any).coronaMesh) {
            const material = (coronaComp as any).coronaMesh.material as THREE.ShaderMaterial;
            material.uniforms.glowColor.value = new THREE.Color(value);
          }
        } else if (propName === 'radius') {
          config.radiusMultiplier = value;
          if (this.scene && (coronaComp as any).coronaMesh) {
            this.scene.remove((coronaComp as any).coronaMesh);
            (coronaComp as any).coronaMesh = null;
            coronaComp.initialize(this.scene, this.mainMesh);
          }
        } else if (propName === 'intensity') {
          config.intensity = value;
          if ((coronaComp as any).coronaMesh) {
            const material = (coronaComp as any).coronaMesh.material as THREE.ShaderMaterial;
            material.uniforms.intensity.value = value;
          }
        }
      }
      return;
    }

    if (componentName === 'rotation' && propName === 'speed') {
      const rotationComp = this.getComponent(RotationComponent);
      if (rotationComp) {
        (rotationComp as any).config.speed = value;
      }
      return;
    }
  }

  getProperty(name: string): any {
    // Base properties
    if (name === 'radius') return this.config.radius;
    if (name === 'roughness') return this.config.roughness;
    if (name === 'metalness') return this.config.metalness;
    if (name === 'emissiveIntensity') return this.config.emissiveIntensity;

    // Component properties
    const [componentName, propName] = name.split('.');

    if (componentName === 'tint' && propName) {
      const tintComp = this.getComponent(TintComponent);
      if (tintComp) {
        const config = (tintComp as any).config;
        if (propName === 'color') return config.tintColor;
        if (propName === 'intensity') return config.intensity;
      }
    }

    if (componentName === 'atmosphere' && propName) {
      const atmosphereComp = this.getComponent(AtmosphereComponent);
      if (atmosphereComp) {
        const config = (atmosphereComp as any).config;
        if (propName === 'color') return config.color;
        if (propName === 'thickness') return config.thickness;
        if (propName === 'intensity') return config.intensity;
      }
    }

    if (componentName === 'corona' && propName) {
      const coronaComp = this.getComponent(CoronaComponent);
      if (coronaComp) {
        const config = (coronaComp as any).config;
        if (propName === 'color') return config.color;
        if (propName === 'radius') return config.radiusMultiplier;
        if (propName === 'intensity') return config.intensity;
      }
    }

    if (componentName === 'rotation' && propName === 'speed') {
      const rotationComp = this.getComponent(RotationComponent);
      if (rotationComp) {
        return (rotationComp as any).config.speed;
      }
    }

    return undefined;
  }

  getTypeName(): string {
    // Detect type based on components
    if (this.getComponent(CoronaComponent)) {
      return 'Star';
    }
    return 'Planet';
  }
}
