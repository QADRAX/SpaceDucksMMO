import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import * as THREE from 'three';

/**
 * Configuration options for a textured rocky planet
 */
export interface RockyTexturedPlanetConfig {
  /** Radius of the planet sphere (default: 1.0) */
  radius?: number;
  /** Surface roughness 0-1 (default: 0.9 - very rough) */
  roughness?: number;
  /** Metalness 0-1 (default: 0.1 - mostly non-metallic) */
  metalness?: number;
  /** Rotation speed in radians per second (default: 0.05) */
  rotationSpeed?: number;
  
  // Atmosphere settings
  /** Enable atmospheric glow (default: false) */
  hasAtmosphere?: boolean;
  /** Atmosphere color (default: 0x88ccff light blue) */
  atmosphereColor?: number;
  /** Atmosphere thickness multiplier (default: 1.05) */
  atmosphereThickness?: number;
  /** Atmosphere glow intensity (default: 2.0) */
  atmosphereIntensity?: number;
  
  // Lighting
  /** Receive shadows from other objects (default: true) */
  receiveShadows?: boolean;
  /** Cast shadows on other objects (default: true) */
  castShadows?: boolean;
}

/**
 * Rocky planet with texture loading support.
 * Uses TextureResolverService to load rocky-planet.jpg with quality fallback.
 * 
 * Features:
 * - Loads diffuse texture with quality fallback (8k -> 4k -> 2k)
 * - PBR material with customizable roughness/metalness
 * - Optional atmospheric glow effect
 * - Realistic lighting and shadows
 * - Smooth rotation animation
 * 
 * @example
 * ```ts
 * const planet = new RockyTexturedPlanet(
 *   'rocky-1',
 *   textureResolver,
 *   {
 *     radius: 1.0,
 *     hasAtmosphere: true,
 *     atmosphereColor: 0x88ccff
 *   }
 * );
 * ```
 */
export class RockyTexturedPlanet implements ISceneObject {
  readonly id: string;
  private planetMesh!: THREE.Mesh;
  private atmosphereMesh?: THREE.Mesh;
  private config: Required<RockyTexturedPlanetConfig>;
  private textureResolver: TextureResolverService;
  private textureLoader: THREE.TextureLoader;
  private time: number = 0;

  constructor(
    id: string,
    textureResolver: TextureResolverService,
    config: RockyTexturedPlanetConfig = {}
  ) {
    this.id = id;
    this.textureResolver = textureResolver;
    this.textureLoader = new THREE.TextureLoader();
    
    // Apply defaults
    this.config = {
      radius: config.radius ?? 1.0,
      roughness: config.roughness ?? 0.9,
      metalness: config.metalness ?? 0.1,
      rotationSpeed: config.rotationSpeed ?? 0.05,
      hasAtmosphere: config.hasAtmosphere ?? false,
      atmosphereColor: config.atmosphereColor ?? 0x88ccff,
      atmosphereThickness: config.atmosphereThickness ?? 1.05,
      atmosphereIntensity: config.atmosphereIntensity ?? 2.0,
      receiveShadows: config.receiveShadows ?? true,
      castShadows: config.castShadows ?? true,
    };
  }

  addTo(scene: THREE.Scene): void {
    const { 
      radius, roughness, metalness,
      hasAtmosphere, atmosphereColor, atmosphereThickness, atmosphereIntensity,
      receiveShadows, castShadows
    } = this.config;

    // Create planet geometry
    const planetGeometry = new THREE.SphereGeometry(radius, 128, 128);

    // Create material with placeholder color
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355, // Temporary brownish color while loading
      roughness,
      metalness,
      flatShading: false,
    });

    this.planetMesh = new THREE.Mesh(planetGeometry, surfaceMaterial);
    this.planetMesh.receiveShadow = receiveShadows;
    this.planetMesh.castShadow = castShadows;
    scene.add(this.planetMesh);

    // Load texture asynchronously (don't block addTo)
    this.loadTexture(surfaceMaterial);

    // Atmosphere layer (if enabled)
    if (hasAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(radius * atmosphereThickness, 64, 64);
      
      // Fresnel shader for atmospheric glow
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(atmosphereColor) },
          intensity: { value: atmosphereIntensity },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float intensity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vec3 viewDir = normalize(-vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
            
            gl_FragColor = vec4(glowColor, fresnel * intensity);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(this.atmosphereMesh);
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Rotate planet
    if (this.planetMesh) {
      this.planetMesh.rotation.y += this.config.rotationSpeed * (deltaTime / 1000);
    }

    // Rotate atmosphere slightly slower for depth effect
    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y += this.config.rotationSpeed * 0.7 * (deltaTime / 1000);
    }
  }

  /**
   * Load texture asynchronously with quality fallback.
   * Called after mesh is added to scene to avoid blocking.
   */
  private async loadTexture(material: THREE.MeshStandardMaterial): Promise<void> {
    const requestedQuality = this.textureResolver.getCurrentQuality() as any;
    const fallbackChain = this.getFallbackChain(requestedQuality);
    
    console.log(`[RockyTexturedPlanet] Trying quality chain:`, fallbackChain);
    
    for (const quality of fallbackChain) {
      try {
        // Resolve texture path for this quality
        const textureResource = this.textureResolver.resolve({
          bodyId: 'rocky-planet',
          type: 'diffuse',
          quality: quality as any
        });

        console.log(`[RockyTexturedPlanet] Attempting to load: ${textureResource.path} (${quality})`);

        // Try to load the texture
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(
            textureResource.path,
            (loadedTexture) => {
              console.log(`[RockyTexturedPlanet] ✓ Texture loaded successfully: ${textureResource.path}`);
              resolve(loadedTexture);
            },
            undefined,
            (error) => {
              reject(error);
            }
          );
        });

        // Success! Apply texture and exit
        material.map = texture;
        material.needsUpdate = true;
        return;

      } catch (error) {
        console.log(`[RockyTexturedPlanet] ✗ Failed to load quality ${quality}, trying next...`);
        // Continue to next quality in fallback chain
      }
    }
    
    console.error('[RockyTexturedPlanet] Failed to load texture in any quality, keeping placeholder color');
  }
  
  /**
   * Get fallback chain for a given quality
   */
  private getFallbackChain(quality: 'low' | 'medium' | 'high' | 'ultra'): ('low' | 'medium' | 'high' | 'ultra')[] {
    const allQualities: ('low' | 'medium' | 'high' | 'ultra')[] = ['ultra', 'high', 'medium', 'low'];
    const startIndex = allQualities.indexOf(quality);
    return allQualities.slice(startIndex);
  }

  removeFrom(scene: THREE.Scene): void {
    if (this.planetMesh) {
      scene.remove(this.planetMesh);
      this.planetMesh.geometry.dispose();
      (this.planetMesh.material as THREE.Material).dispose();
    }

    if (this.atmosphereMesh) {
      scene.remove(this.atmosphereMesh);
      this.atmosphereMesh.geometry.dispose();
      (this.atmosphereMesh.material as THREE.Material).dispose();
    }
  }

  dispose(): void {
    // Clean up is handled in removeFrom
  }

  /**
   * Get the main planet mesh for positioning
   */
  getObject3D(): THREE.Mesh | undefined {
    return this.planetMesh;
  }
}
