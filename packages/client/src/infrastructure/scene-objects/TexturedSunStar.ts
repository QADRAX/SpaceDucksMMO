import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import * as THREE from 'three';

/**
 * Configuration options for a textured sun-like star
 */
export interface TexturedSunStarConfig {
  /** Radius of the main sun sphere (default: 1.2) */
  radius?: number;
  /** Corona/glow color (default: 0xffdd44 yellow) */
  glowColor?: number;
  /** Corona radius multiplier relative to main radius (default: 1.4) */
  glowRadiusMultiplier?: number;
  /** Corona intensity (default: 1.5) */
  glowIntensity?: number;
  /** Inner glow radius multiplier (default: 1.08 - very close to surface) */
  innerGlowRadius?: number;
  /** Inner glow intensity (default: 1.2) */
  innerGlowIntensity?: number;
  /** Rotation speed in radians per second (default: 0.1) */
  rotationSpeed?: number;
  /** Point light intensity (default: 6.0, set to 0 to disable light) */
  lightIntensity?: number;
  /** Point light range in units (default: 15) */
  lightRange?: number;
  /** Light color (default: 0xffaa44) */
  lightColor?: number;
  /** Emissive intensity for the sun surface (default: 2.0) */
  emissiveIntensity?: number;
  /** Enable pulsing effect on corona (default: true) */
  enablePulse?: boolean;
}

/**
 * Textured sun star with realistic solar texture.
 * Uses TextureResolverService to load sun textures with quality fallback.
 * 
 * Features:
 * - Loads real sun texture (diffuse map)
 * - Outer corona/glow effect with shader
 * - Optional point light emission
 * - Smooth rotation animation
 * 
 * @example
 * ```ts
 * const sun = new TexturedSunStar(
 *   'main-sun',
 *   textureResolver,
 *   {
 *     radius: 1.2,
 *     glowColor: 0xffdd44,
 *     lightIntensity: 6.0
 *   }
 * );
 * ```
 */
export class TexturedSunStar implements ISceneObject {
  readonly id: string;
  private sunMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private light?: THREE.PointLight;
  private config: Required<TexturedSunStarConfig>;
  private textureResolver: TextureResolverService;
  private textureLoader: THREE.TextureLoader;

  constructor(
    id: string,
    textureResolver: TextureResolverService,
    config: TexturedSunStarConfig = {}
  ) {
    this.id = id;
    this.textureResolver = textureResolver;
    this.textureLoader = new THREE.TextureLoader();
    
    // Apply defaults
    this.config = {
      radius: config.radius ?? 1.2,
      glowColor: config.glowColor ?? 0xffdd44,
      glowRadiusMultiplier: config.glowRadiusMultiplier ?? 1.4,
      glowIntensity: config.glowIntensity ?? 1.5,
      innerGlowRadius: config.innerGlowRadius ?? 1.08,
      innerGlowIntensity: config.innerGlowIntensity ?? 1.2,
      rotationSpeed: config.rotationSpeed ?? 0.1,
      lightIntensity: config.lightIntensity ?? 6.0,
      lightRange: config.lightRange ?? 15,
      lightColor: config.lightColor ?? 0xffaa44,
      emissiveIntensity: config.emissiveIntensity ?? 2.0,
      enablePulse: config.enablePulse ?? true,
    };
  }

  addTo(scene: THREE.Scene): void {
    const { 
      radius, glowColor, glowRadiusMultiplier, glowIntensity,
      innerGlowRadius, innerGlowIntensity,
      lightIntensity, lightRange, lightColor, emissiveIntensity
    } = this.config;

    // Main sun sphere with emissive material (placeholder until texture loads)
    const sunGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffaa00,
      emissiveIntensity: emissiveIntensity,
      roughness: 1.0,
      metalness: 0.0,
    });
    
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(this.sunMesh);

    // Load texture asynchronously
    this.loadTexture(sunMaterial);

    // Inner glow layer (bright atmosphere just above surface)
    const innerGlowGeometry = new THREE.SphereGeometry(radius * innerGlowRadius, 32, 32);
    const innerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(glowColor) },
        intensity: { value: innerGlowIntensity }
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
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
          
          gl_FragColor = vec4(glowColor, fresnel * intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    
    const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    scene.add(innerGlowMesh);
    (this.sunMesh as any).innerGlow = innerGlowMesh;

    // Outer corona/glow effect with softer, more diffused shader
    const glowRadius = radius * glowRadiusMultiplier;
    const glowGeometry = new THREE.SphereGeometry(glowRadius, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(glowColor) },
        intensity: { value: glowIntensity },
        time: { value: 0 }
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
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDir = normalize(-vPosition);
          
          // Fresnel effect invertido con exponente más alto para mayor suavidad
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 4.0);
          
          // Invertir: brillante en el centro, se desvanece hacia afuera
          float glow = 1.0 - fresnel;
          
          // Triple smoothstep para transición ultra suave
          glow = smoothstep(0.3, 1.0, glow);
          glow = smoothstep(0.0, 1.0, glow);
          glow = smoothstep(0.0, 1.0, glow);
          
          // Subtle animation pulse
          float pulse = sin(time * 0.5) * 0.1 + 1.0;
          
          // Color más brillante y saturado
          vec3 brightGlow = glowColor * 1.5;
          
          gl_FragColor = vec4(brightGlow, glow * intensity * pulse);
        }
      `,
      side: THREE.FrontSide, // Cambiado de BackSide a FrontSide
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(this.glowMesh);

    // Optional point light emanating from the star
    if (lightIntensity > 0) {
      this.light = new THREE.PointLight(lightColor, lightIntensity, lightRange);
      scene.add(this.light);
    }
  }

  update(deltaTime: number): void {
    if (!this.sunMesh) return;
    const delta = deltaTime / 1000;
    const { rotationSpeed, enablePulse } = this.config;

    // Rotation
    this.sunMesh.rotation.y += rotationSpeed * delta;
    
    // Rotate inner glow independently
    const innerGlow = (this.sunMesh as any).innerGlow as THREE.Mesh | undefined;
    if (innerGlow) {
      innerGlow.rotation.y += (rotationSpeed * 0.7) * delta;
      innerGlow.position.copy(this.sunMesh.position);
    }
    
    // Rotate corona slowly
    if (this.glowMesh) {
      this.glowMesh.rotation.y -= (rotationSpeed * 0.3) * delta;
      
      // Update time uniform for corona animation
      if (enablePulse) {
        const glowMaterial = this.glowMesh.material as THREE.ShaderMaterial;
        if (glowMaterial.uniforms?.time) {
          glowMaterial.uniforms.time.value += delta;
        }
      }
    }

    // Update light position to follow sun
    if (this.light) {
      this.light.position.copy(this.sunMesh.position);
    }
  }

  /**
   * Load texture asynchronously with quality fallback.
   */
  private async loadTexture(material: THREE.MeshStandardMaterial): Promise<void> {
    const requestedQuality = this.textureResolver.getCurrentQuality() as any;
    const fallbackChain = this.getFallbackChain(requestedQuality);
    
    console.log(`[TexturedSunStar] Trying quality chain:`, fallbackChain);
    
    for (const quality of fallbackChain) {
      try {
        // Resolve texture path for this quality
        const textureResource = this.textureResolver.resolve({
          bodyId: 'sun',
          type: 'diffuse',
          quality: quality as any
        });

        console.log(`[TexturedSunStar] Attempting to load: ${textureResource.path} (${quality})`);

        // Try to load the texture
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(
            textureResource.path,
            (loadedTexture) => {
              console.log(`[TexturedSunStar] ✓ Texture loaded successfully: ${textureResource.path}`);
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
        material.emissiveMap = texture; // Use same texture for emission
        material.needsUpdate = true;
        return;

      } catch (error) {
        console.log(`[TexturedSunStar] ✗ Failed to load quality ${quality}, trying next...`);
        // Continue to next quality in fallback chain
      }
    }
    
    console.error('[TexturedSunStar] Failed to load texture in any quality, keeping placeholder color');
  }
  
  /**
   * Get fallback chain for a given quality
   */
  private getFallbackChain(quality: 'low' | 'medium' | 'high' | 'ultra'): ('low' | 'medium' | 'high' | 'ultra')[] {
    const allQualities: ('low' | 'medium' | 'high' | 'ultra')[] = ['ultra', 'high', 'medium', 'low'];
    const startIndex = allQualities.indexOf(quality);
    return allQualities.slice(startIndex);
  }

  /**
   * Set position of the sun in 3D space
   */
  setPosition(x: number, y: number, z: number): void {
    if (this.sunMesh) this.sunMesh.position.set(x, y, z);
    if (this.glowMesh) this.glowMesh.position.set(x, y, z);
    if (this.light) this.light.position.set(x, y, z);
  }

  /**
   * Get the main sun mesh for positioning
   */
  getObject3D(): THREE.Mesh | undefined {
    return this.sunMesh;
  }

  removeFrom(scene: THREE.Scene): void {
    if (this.sunMesh) {
      scene.remove(this.sunMesh);
      this.sunMesh.geometry.dispose();
      (this.sunMesh.material as THREE.Material).dispose();
      
      // Clean up inner glow
      const innerGlow = (this.sunMesh as any).innerGlow as THREE.Mesh | undefined;
      if (innerGlow) {
        scene.remove(innerGlow);
        innerGlow.geometry.dispose();
        (innerGlow.material as THREE.Material).dispose();
      }
    }

    if (this.glowMesh) {
      scene.remove(this.glowMesh);
      this.glowMesh.geometry.dispose();
      (this.glowMesh.material as THREE.Material).dispose();
    }

    if (this.light) {
      scene.remove(this.light);
    }
  }

  dispose(): void {
    // Clean up is handled in removeFrom
  }
}

export default TexturedSunStar;
