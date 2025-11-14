import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ITextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import type { IVisualComponent } from './components/IVisualComponent';
import { TextureComponent } from './components/TextureComponent';
import { TintComponent } from './components/TintComponent';
import { RotationComponent } from './components/RotationComponent';
import * as THREE from 'three';

/**
 * Skybox texture type
 */
export type SkyboxTexture = 'stars' | 'stars_milky_way';

/**
 * Configuration for component-based Skybox
 */
export interface SkyboxConfig {
  /** Which texture to use (default: 'stars') */
  texture?: SkyboxTexture;
  /** Skybox radius - should be large enough to encompass scene (default: 500) */
  radius?: number;
  /** Rotation speed in radians per second (default: 0.00001) */
  rotationSpeed?: number;
  /** Initial rotation offset in radians (default: 0) */
  initialRotation?: number;
  /** Brightness multiplier for the skybox (default: 1.5) */
  brightness?: number;
  /** Enable depth write (may affect rendering order, default: false) */
  depthWrite?: boolean;
  /** Tint color for the skybox (default: 0xffffff - white, no tint) */
  tint?: number;
  /** Tint intensity 0-1 (default: 0 - no tint) */
  tintIntensity?: number;
  /** Geometry detail level - higher = smoother sphere (default: 64) */
  segments?: number;
}

/**
 * Component-based Skybox for scenes.
 * Uses the modular component system for maximum flexibility.
 * 
 * Features:
 * - Modular components (Texture, Tint, Brightness, Rotation)
 * - Automatic texture reloading with quality fallback
 * - Configurable appearance and behavior
 * - Consistent API with other celestial bodies
 * 
 * @example
 * ```ts
 * const skybox = new ComponentSkybox('skybox', textureResolver, {
 *   texture: 'stars_milky_way',
 *   brightness: 1.5,
 *   rotationSpeed: 0.00002
 * });
 * ```
 */
export class Skybox implements ISceneObject, ITextureReloadable {
  readonly id: string;
  
  private mesh!: THREE.Mesh;
  private config: Required<SkyboxConfig>;
  private textureResolver: TextureResolverService;
  private components: IVisualComponent[] = [];
  private scene?: THREE.Scene;

  constructor(
    id: string,
    textureResolver: TextureResolverService,
    config: SkyboxConfig = {}
  ) {
    this.id = id;
    this.textureResolver = textureResolver;
    
    // Apply defaults
    this.config = {
      texture: config.texture ?? 'stars',
      radius: config.radius ?? 500,
      rotationSpeed: config.rotationSpeed ?? 0.00001,
      initialRotation: config.initialRotation ?? 0,
      brightness: config.brightness ?? 1.5,
      depthWrite: config.depthWrite ?? false,
      tint: config.tint ?? 0xffffff,
      tintIntensity: config.tintIntensity ?? 0,
      segments: config.segments ?? 64,
    };
  }

  /**
   * Add a component to the skybox
   */
  addComponent(component: IVisualComponent): this {
    this.components.push(component);
    
    // If already initialized, initialize the component immediately
    if (this.scene && this.mesh) {
      component.initialize(this.scene, this.mesh);
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
    
    const { radius, initialRotation, segments, depthWrite, tint, brightness } = this.config;

    // Create large sphere geometry (BackSide so visible from inside)
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Create basic material for skybox with brightness applied to color
    const materialColor = new THREE.Color(tint).multiplyScalar(brightness);
    const material = new THREE.MeshBasicMaterial({
      color: materialColor,
      side: THREE.BackSide,
      fog: false,
      depthWrite: depthWrite,
      depthTest: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.y = initialRotation;
    this.mesh.renderOrder = -1000; // Render first (behind everything)
    this.mesh.frustumCulled = false; // Always visible
    
    scene.add(this.mesh);

    // Setup components
    this.setupComponents();
  }

  private setupComponents(): void {
    const { texture, tint, tintIntensity, rotationSpeed } = this.config;

    // Add texture component
    this.addComponent(
      new TextureComponent(this.textureResolver, {
        textureId: texture as any,
        textureType: 'surface',
        applyAsEmissive: false,
      })
    );

    // Add tint component if intensity > 0
    if (tintIntensity > 0) {
      this.addComponent(
        new TintComponent({
          tintColor: tint,
          intensity: tintIntensity,
        })
      );
    }

    // Add rotation component if speed is set
    if (rotationSpeed !== 0) {
      this.addComponent(
        new RotationComponent({
          speed: rotationSpeed,
        })
      );
    }

    // Initialize all components
    if (this.scene && this.mesh) {
      this.components.forEach(component => {
        component.initialize(this.scene!, this.mesh);
      });
    }
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

  removeFrom(scene: THREE.Scene): void {
    // Dispose all components
    this.components.forEach(component => {
      component.dispose(scene);
    });

    // Remove main mesh
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }

  dispose(): void {
    // Cleanup handled in removeFrom
  }

  /**
   * Get the mesh for direct manipulation if needed
   */
  getObject3D(): THREE.Mesh | undefined {
    return this.mesh;
  }

  /**
   * Change the skybox texture at runtime
   */
  async setTexture(texture: SkyboxTexture): Promise<void> {
    if (this.config.texture === texture) return;
    
    this.config.texture = texture;
    await this.reloadTexture();
  }

  /**
   * Set rotation speed at runtime
   */
  setRotationSpeed(speed: number): void {
    this.config.rotationSpeed = speed;
    
    const rotationComp = this.getComponent(RotationComponent);
    if (rotationComp) {
      rotationComp.setSpeed(speed);
    }
  }

  /**
   * Set brightness at runtime
   */
  setBrightness(brightness: number): void {
    this.config.brightness = brightness;
    
    // Apply brightness directly to material color
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      const baseColor = new THREE.Color(this.config.tint);
      this.mesh.material.color.copy(baseColor).multiplyScalar(brightness);
      this.mesh.material.needsUpdate = true;
    }
  }

  /**
   * Set tint color at runtime
   */
  setTint(tint: number, intensity?: number): void {
    this.config.tint = tint;
    if (intensity !== undefined) {
      this.config.tintIntensity = intensity;
    }
    
    const tintComp = this.getComponent(TintComponent);
    if (tintComp) {
      tintComp.setTint(tint, this.config.tintIntensity);
    }
  }
}
