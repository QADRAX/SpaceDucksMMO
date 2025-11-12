import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ITextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import * as THREE from 'three';

/**
 * Skybox texture type
 */
export type SkyboxTexture = 'stars' | 'stars_milky_way';

/**
 * Configuration for skybox
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
  /** Geometry detail level - higher = smoother sphere (default: 64) */
  segments?: number;
}

/**
 * Skybox component for scenes - renders a spherical background with stars texture.
 * 
 * Features:
 * - Loads star textures with quality fallback (8k -> 4k -> 2k)
 * - Two texture options: 'stars' or 'stars_milky_way'
 * - Automatic texture reloading when quality changes
 * - Optional slow rotation for dynamic effect
 * - Renders on BackSide to be visible from inside
 * 
 * @example
 * ```ts
 * // Simple stars
 * const skybox = new Skybox('skybox', textureResolver, {
 *   texture: 'stars'
 * });
 * 
 * // Milky Way with slow rotation
 * const skybox = new Skybox('skybox', textureResolver, {
 *   texture: 'stars_milky_way',
 *   rotationSpeed: 0.00005
 * });
 * ```
 */
export class Skybox implements ISceneObject, ITextureReloadable {
  readonly id: string;
  private mesh!: THREE.Mesh;
  private config: Required<SkyboxConfig>;
  private textureResolver: TextureResolverService;
  private textureLoader: THREE.TextureLoader;

  constructor(
    id: string,
    textureResolver: TextureResolverService,
    config: SkyboxConfig = {}
  ) {
    this.id = id;
    this.textureResolver = textureResolver;
    this.textureLoader = new THREE.TextureLoader();
    
    // Apply defaults
    this.config = {
      texture: config.texture ?? 'stars',
      radius: config.radius ?? 500,
      rotationSpeed: config.rotationSpeed ?? 0.00001,
      initialRotation: config.initialRotation ?? 0,
      brightness: config.brightness ?? 1.5,
      depthWrite: config.depthWrite ?? false,
      tint: config.tint ?? 0xffffff,
      segments: config.segments ?? 64,
    };
  }

  addTo(scene: THREE.Scene): void {
    const { radius, initialRotation, segments, depthWrite, tint } = this.config;

    // Create large sphere geometry (BackSide so visible from inside)
    // Higher segment count = smoother sphere
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Create material with proper settings for skybox
    const material = new THREE.MeshBasicMaterial({
      color: tint, // Use tint color
      side: THREE.BackSide,
      fog: false, // Skybox should not be affected by fog
      depthWrite: depthWrite, // Usually false for skybox
      depthTest: true, // Still test depth to avoid rendering issues
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.y = initialRotation;
    
    // Skybox should render first (behind everything)
    this.mesh.renderOrder = -1000;
    
    // Frustum culling should be disabled (always visible)
    this.mesh.frustumCulled = false;
    
    scene.add(this.mesh);

    // Load texture asynchronously
    this.loadTexture(material);
  }

  /**
   * Load texture with quality fallback strategy
   */
  private async loadTexture(material: THREE.MeshBasicMaterial): Promise<void> {
    const { texture: textureType, brightness } = this.config;
    
    // Get current quality from settings
    const currentSettings = this.textureResolver.getCurrentQuality();
    const quality = currentSettings as 'low' | 'medium' | 'high' | 'ultra';
    
    // Build fallback chain: requested quality -> lower qualities
    const fallbackChain = this.getFallbackChain(quality);
    
    console.log(`[Skybox] Loading texture '${textureType}' with quality chain: ${fallbackChain.join(' -> ')}`);
    
    // Try each quality level until one succeeds
    for (const tryQuality of fallbackChain) {
      try {
        const textureResource = this.textureResolver.resolve({
          bodyId: textureType,
          type: 'surface',
          quality: tryQuality
        });
        
        console.log(`[Skybox] Trying to load: ${textureResource.path}`);
        
        // Load texture with THREE.TextureLoader
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(
            textureResource.path,
            (loadedTexture) => {
              console.log(`[Skybox] ✓ Texture loaded successfully: ${textureResource.path}`);
              resolve(loadedTexture);
            },
            undefined,
            (error) => {
              reject(error);
            }
          );
        });

        // Configure texture for optimal quality
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter; // Smooth when far away
        texture.magFilter = THREE.LinearFilter; // Smooth when close
        texture.generateMipmaps = false; // Skybox doesn't need mipmaps (always far)
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Apply texture first
        material.map = texture;
        
        // Apply brightness and tint
        const { tint } = this.config;
        const color = new THREE.Color(tint);
        
        // Scale color by brightness
        color.multiplyScalar(brightness);
        material.color.copy(color);
        
        // Success! Mark for update and exit
        material.needsUpdate = true;
        
        console.log(`[Skybox] ✓ Texture applied successfully, brightness: ${brightness}, tint: ${tint.toString(16)}`);
        return;

      } catch (error) {
        console.log(`[Skybox] ✗ Failed to load quality ${tryQuality}, trying next...`);
        // Continue to next quality in fallback chain
      }
    }
    
    console.error('[Skybox] Failed to load texture in any quality, keeping placeholder color');
  }

  /**
   * Reload texture with current quality settings.
   * Useful when user changes texture quality in settings.
   */
  async reloadTexture(): Promise<void> {
    if (!this.mesh) {
      console.warn('[Skybox] Cannot reload texture: mesh not initialized');
      return;
    }

    const material = this.mesh.material as THREE.MeshBasicMaterial;
    
    // Dispose old texture if it exists
    if (material.map) {
      material.map.dispose();
      material.map = null;
      material.needsUpdate = true;
    }

    // Load new texture with current quality settings
    await this.loadTexture(material);
    
    console.log('[Skybox] Texture reloaded with new quality settings');
  }

  /**
   * Get fallback chain for a given quality
   */
  private getFallbackChain(quality: 'low' | 'medium' | 'high' | 'ultra'): ('low' | 'medium' | 'high' | 'ultra')[] {
    const allQualities: ('low' | 'medium' | 'high' | 'ultra')[] = ['ultra', 'high', 'medium', 'low'];
    const startIndex = allQualities.indexOf(quality);
    return allQualities.slice(startIndex);
  }

  update(dt: number): void {
    if (!this.mesh) return;
    
    const { rotationSpeed } = this.config;
    
    // Slowly rotate skybox
    if (rotationSpeed !== 0) {
      this.mesh.rotation.y += rotationSpeed * dt;
    }
  }

  removeFrom(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      
      const material = this.mesh.material as THREE.MeshBasicMaterial;
      if (material.map) {
        material.map.dispose();
      }
      material.dispose();
    }
  }

  dispose(): void {
    // Clean up is handled in removeFrom
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
    if (this.config.texture === texture) {
      return; // Already using this texture
    }
    
    this.config.texture = texture;
    await this.reloadTexture();
  }

  /**
   * Set rotation speed at runtime
   */
  setRotationSpeed(speed: number): void {
    this.config.rotationSpeed = speed;
  }

  /**
   * Set brightness at runtime
   */
  setBrightness(brightness: number): void {
    this.config.brightness = brightness;
    
    if (this.mesh) {
      const material = this.mesh.material as THREE.MeshBasicMaterial;
      const { tint } = this.config;
      const color = new THREE.Color(tint);
      color.multiplyScalar(brightness);
      material.color.copy(color);
      material.needsUpdate = true;
    }
  }

  /**
   * Set tint color at runtime
   */
  setTint(tint: number): void {
    this.config.tint = tint;
    
    if (this.mesh) {
      const material = this.mesh.material as THREE.MeshBasicMaterial;
      const { brightness } = this.config;
      const color = new THREE.Color(tint);
      color.multiplyScalar(brightness);
      material.color.copy(color);
      material.needsUpdate = true;
    }
  }
}

export default Skybox;
