import type { ICelestialComponent } from './ICelestialComponent';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import type { CelestialBodyId, TextureType } from '@client/domain/assets/TextureTypes';
import * as THREE from 'three';

/**
 * Configuration for texture loading
 */
export interface TextureComponentConfig {
  textureId: CelestialBodyId;
  textureType?: TextureType;
  applyAsEmissive?: boolean;
}

/**
 * Component that handles texture loading with quality fallback.
 * Implements ITextureReloadable pattern for runtime quality changes.
 */
export class TextureComponent implements ICelestialComponent {
  private textureResolver: TextureResolverService;
  private textureLoader: THREE.TextureLoader;
  private config: Required<TextureComponentConfig>;
  private material?: THREE.MeshStandardMaterial;
  private isDisposed = false; // Track if component was disposed

  constructor(
    textureResolver: TextureResolverService,
    config: TextureComponentConfig
  ) {
    this.textureResolver = textureResolver;
    this.textureLoader = new THREE.TextureLoader();
    this.config = {
      textureId: config.textureId,
      textureType: config.textureType ?? 'diffuse',
      applyAsEmissive: config.applyAsEmissive ?? false,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.material = parentMesh.material as THREE.MeshStandardMaterial;
    this.isDisposed = false; // Reset disposed flag
    this.loadTexture();
  }

  update(deltaTime: number): void {
    // Texture component is passive
  }

  dispose(scene: THREE.Scene): void {
    this.isDisposed = true; // Mark as disposed to cancel pending texture loads
    
    if (this.material?.map) {
      this.material.map.dispose();
      this.material.map = null;
    }
    if (this.material?.emissiveMap) {
      this.material.emissiveMap.dispose();
      this.material.emissiveMap = null;
    }
  }

  /**
   * Reload texture with current quality settings
   */
  async reloadTexture(): Promise<void> {
    if (!this.material || this.isDisposed) return;

    // Dispose old textures
    if (this.material.map) {
      this.material.map.dispose();
      this.material.map = null;
    }
    if (this.material.emissiveMap) {
      this.material.emissiveMap.dispose();
      this.material.emissiveMap = null;
    }

    await this.loadTexture();
  }

  private async loadTexture(): Promise<void> {
    if (!this.material || this.isDisposed) return;

    const quality = this.textureResolver.getCurrentQuality() as any;
    const fallbackChain = this.getFallbackChain(quality);

    for (const q of fallbackChain) {
      // Check if disposed during async operation
      if (this.isDisposed) {
        return; // Abort texture loading
      }
      
      try {
        const resource = this.textureResolver.resolve({
          bodyId: this.config.textureId,
          type: this.config.textureType,
          quality: q as any,
        });

        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(resource.path, resolve, undefined, reject);
        });

        // Check again after async load completes
        if (this.isDisposed) {
          texture.dispose(); // Clean up loaded texture
          return;
        }

        this.material.map = texture;
        if (this.config.applyAsEmissive) {
          this.material.emissiveMap = texture;
        }
        this.material.needsUpdate = true;
        return;
      } catch {
        // Try next quality
      }
    }

    if (!this.isDisposed) {
      console.error(`[TextureComponent] Failed to load texture: ${this.config.textureId}`);
    }
  }

  private getFallbackChain(quality: string): string[] {
    const all = ['ultra', 'high', 'medium', 'low'];
    const start = all.indexOf(quality);
    return all.slice(start >= 0 ? start : 0);
  }
}
