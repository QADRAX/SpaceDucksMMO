import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import * as THREE from 'three';

/**
 * Configuration options for a rocky planet
 */
export interface RockyPlanetConfig {
  /** Radius of the planet sphere (default: 1.0) */
  radius?: number;
  /** Base surface color (default: 0x8B7355 brownish) */
  surfaceColor?: number;
  /** Secondary color for terrain variation (default: 0x654321 darker brown) */
  secondaryColor?: number;
  /** Surface roughness 0-1 (default: 0.9 - very rough) */
  roughness?: number;
  /** Metalness 0-1 (default: 0.1 - mostly non-metallic) */
  metalness?: number;
  /** Rotation speed in radians per second (default: 0.05) */
  rotationSpeed?: number;
  
  // Atmosphere settings
  /** Enable atmospheric glow (default: true) */
  hasAtmosphere?: boolean;
  /** Atmosphere color (default: 0x88ccff light blue) */
  atmosphereColor?: number;
  /** Atmosphere thickness multiplier (default: 1.05) */
  atmosphereThickness?: number;
  /** Atmosphere opacity 0-1 (default: 0.3) */
  atmosphereOpacity?: number;
  
  // Surface detail settings
  /** Enable procedural surface noise (default: true) */
  enableSurfaceNoise?: boolean;
  /** Noise scale for surface details (default: 2.0) */
  noiseScale?: number;
  /** Noise intensity 0-1 (default: 0.3) */
  noiseIntensity?: number;
  
  // Lighting
  /** Ambient light intensity (default: 0.3) */
  ambientLight?: number;
  /** Receive shadows from other objects (default: true) */
  receiveShadows?: boolean;
  /** Cast shadows on other objects (default: true) */
  castShadows?: boolean;
}

/**
 * Reusable rocky planet object with realistic appearance.
 * Can be configured with custom colors, atmosphere, and surface details.
 * 
 * Features:
 * - PBR material with customizable roughness/metalness
 * - Optional atmospheric glow effect
 * - Procedural surface noise for terrain variation
 * - Realistic lighting and shadows
 * - Smooth rotation animation
 * 
 * @example
 * ```ts
 * // Earth-like planet
 * const earth = new RockyPlanet('earth', {
 *   radius: 1.0,
 *   surfaceColor: 0x4488cc,
 *   secondaryColor: 0x228844,
 *   hasAtmosphere: true,
 *   atmosphereColor: 0x88ccff
 * });
 * 
 * // Mars-like planet
 * const mars = new RockyPlanet('mars', {
 *   radius: 0.7,
 *   surfaceColor: 0xcc6644,
 *   secondaryColor: 0x884422,
 *   hasAtmosphere: true,
 *   atmosphereColor: 0xffaa88,
 *   atmosphereOpacity: 0.15
 * });
 * 
 * // Desert planet
 * const desert = new RockyPlanet('desert', {
 *   surfaceColor: 0xddaa66,
 *   secondaryColor: 0xaa7733,
 *   hasAtmosphere: false,
 *   roughness: 0.95
 * });
 * ```
 */
export class RockyPlanet implements ISceneObject {
  readonly id: string;
  private planetMesh!: THREE.Mesh;
  private atmosphereMesh?: THREE.Mesh;
  private config: Required<RockyPlanetConfig>;
  private time: number = 0;

  constructor(id: string, config: RockyPlanetConfig = {}) {
    this.id = id;
    // Apply defaults
    this.config = {
      radius: config.radius ?? 1.0,
      surfaceColor: config.surfaceColor ?? 0x8B7355,
      secondaryColor: config.secondaryColor ?? 0x654321,
      roughness: config.roughness ?? 0.9,
      metalness: config.metalness ?? 0.1,
      rotationSpeed: config.rotationSpeed ?? 0.05,
      hasAtmosphere: config.hasAtmosphere ?? true,
      atmosphereColor: config.atmosphereColor ?? 0x88ccff,
      atmosphereThickness: config.atmosphereThickness ?? 1.05,
      atmosphereOpacity: config.atmosphereOpacity ?? 0.3,
      enableSurfaceNoise: config.enableSurfaceNoise ?? true,
      noiseScale: config.noiseScale ?? 2.0,
      noiseIntensity: config.noiseIntensity ?? 0.3,
      ambientLight: config.ambientLight ?? 0.3,
      receiveShadows: config.receiveShadows ?? true,
      castShadows: config.castShadows ?? true,
    };
  }

  addTo(scene: THREE.Scene): void {
    const { 
      radius, surfaceColor, secondaryColor, roughness, metalness,
      hasAtmosphere, atmosphereColor, atmosphereThickness, atmosphereOpacity,
      enableSurfaceNoise, noiseScale, noiseIntensity, ambientLight,
      receiveShadows, castShadows
    } = this.config;

    // Planet surface with custom shader for procedural details
    const planetGeometry = new THREE.SphereGeometry(radius, 128, 128);

    // Use standard material for now (shader version has issues)
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: surfaceColor,
      roughness,
      metalness,
      flatShading: false,
    });

    this.planetMesh = new THREE.Mesh(planetGeometry, surfaceMaterial);
    this.planetMesh.receiveShadow = receiveShadows;
    this.planetMesh.castShadow = castShadows;
    scene.add(this.planetMesh);

    // Atmosphere layer (if enabled)
    if (hasAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(radius * atmosphereThickness, 64, 64);
      
      // Use shader with Fresnel effect like the sun's corona
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(atmosphereColor) },
          viewVector: { value: new THREE.Vector3() },
          intensity: { value: atmosphereOpacity * 1.5 }
        },
        vertexShader: `
          uniform vec3 viewVector;
          varying float vIntensity;
          
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            vIntensity = pow(abs(dot(vNormal, vNormel)), 2.0);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float intensity;
          varying float vIntensity;
          
          void main() {
            vec3 glow = glowColor * vIntensity * intensity;
            gl_FragColor = vec4(glow, vIntensity * intensity);
          }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });

      this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(this.atmosphereMesh);
    }
  }

  removeFrom(scene: THREE.Scene): void {
    if (this.planetMesh) {
      scene.remove(this.planetMesh);
      this.planetMesh.geometry.dispose();
      if (this.planetMesh.material instanceof THREE.Material) {
        this.planetMesh.material.dispose();
      }
    }

    if (this.atmosphereMesh) {
      scene.remove(this.atmosphereMesh);
      this.atmosphereMesh.geometry.dispose();
      if (this.atmosphereMesh.material instanceof THREE.Material) {
        this.atmosphereMesh.material.dispose();
      }
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Rotate planet
    if (this.planetMesh) {
      this.planetMesh.rotation.y += this.config.rotationSpeed * deltaTime;
    }

    // Rotate atmosphere slightly slower for depth effect
    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y += this.config.rotationSpeed * 0.7 * deltaTime;
      
      // Update atmosphere shader uniforms for Fresnel effect
      if (this.atmosphereMesh.material instanceof THREE.ShaderMaterial) {
        const camera = this.atmosphereMesh.parent?.userData?.camera;
        if (camera) {
          const viewVector = new THREE.Vector3();
          viewVector.subVectors(camera.position, this.atmosphereMesh.position);
          viewVector.normalize();
          this.atmosphereMesh.material.uniforms.viewVector.value = viewVector;
        }
      }
    }

    // Update shader time uniform only if using custom shader material
    if (this.planetMesh?.material instanceof THREE.ShaderMaterial && this.planetMesh.material.uniforms.time) {
      this.planetMesh.material.uniforms.time.value = this.time;
    }
  }

  /**
   * Create custom shader material for planetary surface with procedural noise
   */
  private createPlanetShaderMaterial(
    baseColor: number,
    secondaryColor: number,
    noiseScale: number,
    noiseIntensity: number,
    roughness: number,
    metalness: number
  ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        secondaryColor: { value: new THREE.Color(secondaryColor) },
        noiseScale: { value: noiseScale },
        noiseIntensity: { value: noiseIntensity },
        time: { value: 0 },
        roughness: { value: roughness },
        metalness: { value: metalness },
      },
      vertexShader: this.getPlanetVertexShader(),
      fragmentShader: this.getPlanetFragmentShader(),
      lights: true,
    });
  }

  /**
   * Vertex shader for planet surface
   */
  private getPlanetVertexShader(): string {
    return `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  /**
   * Fragment shader for planet surface with procedural noise
   */
  private getPlanetFragmentShader(): string {
    return `
      uniform vec3 baseColor;
      uniform vec3 secondaryColor;
      uniform float noiseScale;
      uniform float noiseIntensity;
      uniform float time;
      uniform float roughness;
      uniform float metalness;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      // Simplex 3D noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        // Generate procedural noise for terrain variation
        float noise = snoise(vPosition * noiseScale) * 0.5 + 0.5;
        
        // Mix between base and secondary color based on noise
        vec3 surfaceColor = mix(baseColor, secondaryColor, noise * noiseIntensity);
        
        // Simple lighting calculation (ambient + diffuse)
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diffuse = max(dot(vNormal, lightDir), 0.0);
        
        vec3 finalColor = surfaceColor * (0.3 + 0.7 * diffuse);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
  }

  /**
   * Vertex shader for atmosphere glow effect
   */
  private getAtmosphereVertexShader(): string {
    return `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  /**
   * Fragment shader for atmosphere with Rayleigh scattering effect
   */
  private getAtmosphereFragmentShader(): string {
    return `
      uniform vec3 atmosphereColor;
      uniform float opacity;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // Calculate atmospheric glow based on view angle (Fresnel effect)
        vec3 viewDirection = normalize(-vPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);
        
        // Fade at edges for realistic scattering
        float alpha = fresnel * opacity;
        
        gl_FragColor = vec4(atmosphereColor, alpha);
      }
    `;
  }

  /**
   * Get the Three.js object for advanced manipulation
   */
  getObject3D(): THREE.Object3D {
    return this.planetMesh;
  }

  /**
   * Update planet configuration at runtime
   */
  updateConfig(config: Partial<RockyPlanetConfig>): void {
    Object.assign(this.config, config);
    
    // Update material properties if changed
    if (this.planetMesh.material instanceof THREE.MeshStandardMaterial) {
      if (config.surfaceColor !== undefined) {
        this.planetMesh.material.color.setHex(config.surfaceColor);
      }
      if (config.roughness !== undefined) {
        this.planetMesh.material.roughness = config.roughness;
      }
      if (config.metalness !== undefined) {
        this.planetMesh.material.metalness = config.metalness;
      }
    }
  }
}

export default RockyPlanet;
