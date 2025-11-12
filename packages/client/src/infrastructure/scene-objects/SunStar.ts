import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import * as THREE from 'three';

/**
 * Configuration options for a sun-like star
 */
export interface SunStarConfig {
  /** Radius of the main sun sphere (default: 1.2) */
  radius?: number;
  /** Main color of the sun surface (default: 0xffaa00 orange) */
  color?: number;
  /** Corona/glow color (default: 0xffdd44 yellow) */
  glowColor?: number;
  /** Corona radius multiplier relative to main radius (default: 1.25) */
  glowRadiusMultiplier?: number;
  /** Corona opacity (default: 0.15) */
  glowOpacity?: number;
  /** Rotation speed in radians per second (default: 0.1) */
  rotationSpeed?: number;
  /** Enable pulsing effect (default: true) */
  enablePulse?: boolean;
  /** Pulse intensity 0-1 (default: 0.05) */
  pulseIntensity?: number;
  /** Point light intensity (default: 2.0, set to 0 to disable light) */
  lightIntensity?: number;
  /** Point light range in units (default: 15) */
  lightRange?: number;
  /** Light color (default: 0xffaa44) */
  lightColor?: number;
  /** Overall brightness multiplier for surface (default: 1.0, range: 0.5 - 3.0) */
  brightness?: number;
}

/**
 * Reusable sun-like star object with realistic appearance.
 * Can be configured with custom colors, size, and effects.
 * 
 * Features:
 * - Main sun sphere with custom color
 * - Outer corona/glow effect
 * - Optional point light emission
 * - Subtle pulsing animation
 * - Breathing glow effect
 * 
 * @example
 * ```ts
 * // Default yellow sun
 * const sun = new SunStar('main-sun');
 * 
 * // Custom red giant star
 * const redGiant = new SunStar('red-giant', {
 *   radius: 2.5,
 *   color: 0xff3300,
 *   glowColor: 0xff6600,
 *   lightColor: 0xff4400
 * });
 * 
 * // Blue dwarf star
 * const blueStar = new SunStar('blue-star', {
 *   radius: 0.8,
 *   color: 0x88ccff,
 *   glowColor: 0xaaddff,
 *   lightColor: 0x88ccff,
 *   rotationSpeed: 0.3
 * });
 * ```
 */
export class SunStar implements ISceneObject {
  readonly id: string;
  private sunMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private light?: THREE.PointLight;
  private config: Required<SunStarConfig>;

  constructor(id: string, config: SunStarConfig = {}) {
    this.id = id;
    // Apply defaults
    this.config = {
      radius: config.radius ?? 1.2,
      color: config.color ?? 0xffaa00,
      glowColor: config.glowColor ?? 0xffdd44,
      glowRadiusMultiplier: config.glowRadiusMultiplier ?? 1.25,
      glowOpacity: config.glowOpacity ?? 0.15,
      rotationSpeed: config.rotationSpeed ?? 0.1,
      enablePulse: config.enablePulse ?? true,
      pulseIntensity: config.pulseIntensity ?? 0.05,
      lightIntensity: config.lightIntensity ?? 2.0,
      lightRange: config.lightRange ?? 15,
      lightColor: config.lightColor ?? 0xffaa44,
      brightness: config.brightness ?? 1.0,
    };
  }

  addTo(scene: THREE.Scene): void {
    const { radius, color, glowColor, glowRadiusMultiplier, glowOpacity, lightIntensity, lightRange, lightColor, brightness } = this.config;

    // Main sun sphere with custom shader for animated surface
    const sunGeometry = new THREE.SphereGeometry(radius, 64, 64);
    
    // Custom shader material for sun surface with animated noise
    const sunMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(color) },
        glowIntensity: { value: 2.5 },
        brightness: { value: brightness } // Añadir brightness al shader
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform float glowIntensity;
        uniform float brightness;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Simplex noise function
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
          // Multi-octave noise for turbulent surface
          vec3 pos = vPosition * 2.0;
          float noise1 = snoise(pos + time * 0.1);
          float noise2 = snoise(pos * 2.0 + time * 0.15);
          float noise3 = snoise(pos * 4.0 + time * 0.2);
          float turbulence = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
          
          // Create bright spots and dark regions
          float spots = smoothstep(0.3, 0.7, turbulence);
          
          // Fresnel effect for edge glow
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
          
          // Combine base color with turbulence
          vec3 darkColor = baseColor * 0.8; // Más brillante (0.6 → 0.8)
          vec3 brightColor = baseColor * 1.6; // Más brillante (1.4 → 1.6)
          vec3 surfaceColor = mix(darkColor, brightColor, spots);
          
          // Add orange/red accent to hot spots
          vec3 hotColor = vec3(1.0, 0.6, 0.3); // Más brillante (0.5 → 0.6, 0.2 → 0.3)
          surfaceColor = mix(surfaceColor, hotColor, spots * 0.3);
          
          // Intensify at edges (limb brightening)
          surfaceColor += baseColor * fresnel * glowIntensity * 0.6; // Más brillante (0.5 → 0.6)
          
          // Apply brightness multiplier
          surfaceColor *= brightness;
          
          gl_FragColor = vec4(surfaceColor, 1.0);
        }
      `,
      side: THREE.FrontSide
    });
    
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(this.sunMesh);

    // Inner glow layer (atmosphere)
    const innerGlowGeometry = new THREE.SphereGeometry(radius * 1.05, 32, 32);
    const innerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(glowColor) },
        intensity: { value: 0.8 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
          float glow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 4.0);
          gl_FragColor = vec4(glowColor, glow * intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    scene.add(innerGlowMesh);
    (this.sunMesh as any).innerGlow = innerGlowMesh;

    // Outer corona/glow effect with custom shader
    const glowRadius = radius * glowRadiusMultiplier;
    const glowGeometry = new THREE.SphereGeometry(glowRadius, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(glowColor) },
        opacity: { value: glowOpacity }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        uniform float opacity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          // Animated corona with noise
          float noise = random(vPosition.xy + time * 0.1) * 0.3;
          
          // Gradiente más difuminado con exponente mayor y smoothstep
          float viewAngle = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float glow = pow(1.0 - viewAngle, 4.0); // Aumentado de 2.0 a 4.0 para más suavidad
          glow = smoothstep(0.0, 1.0, glow); // Suaviza la transición
          glow = glow * (1.0 + noise * 0.2); // Reducido ruido (0.3 → 0.2)
          
          vec3 color = glowColor * (1.0 + noise * 0.5);
          gl_FragColor = vec4(color, glow * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(this.glowMesh);

    // Optional point light emanating from the star
    if (lightIntensity > 0) {
      this.light = new THREE.PointLight(lightColor, lightIntensity, lightRange);
      scene.add(this.light);
    }
  }

  update(dt: number): void {
    if (!this.sunMesh) return;
    const delta = dt / 1000;
    const { rotationSpeed, enablePulse, pulseIntensity, glowOpacity } = this.config;

    // Update shader uniforms for animations
    const sunMaterial = this.sunMesh.material as THREE.ShaderMaterial;
    if (sunMaterial.uniforms) {
      sunMaterial.uniforms.time.value += delta * 0.5; // Animate surface turbulence
    }

    const glowMaterial = this.glowMesh.material as THREE.ShaderMaterial;
    if (glowMaterial.uniforms) {
      glowMaterial.uniforms.time.value += delta; // Animate corona
    }

    // Rotation
    this.sunMesh.rotation.y += rotationSpeed * delta;
    this.glowMesh.rotation.y -= (rotationSpeed * 0.5) * delta;

    // Rotate inner glow independently
    const innerGlow = (this.sunMesh as any).innerGlow as THREE.Mesh | undefined;
    if (innerGlow) {
      innerGlow.rotation.y += (rotationSpeed * 0.3) * delta;
      innerGlow.position.copy(this.sunMesh.position);
    }

    // Pulsing effect
    if (enablePulse) {
      const pulse = Math.sin(performance.now() * 0.0003) * pulseIntensity + 1.0; // Más lento (0.001 → 0.0003)
      this.sunMesh.scale.setScalar(pulse);
      if (innerGlow) {
        innerGlow.scale.setScalar(pulse);
      }
    }

    // Glow breathing effect
    const glowPulse = Math.sin(performance.now() * 0.0005) * (pulseIntensity * 0.5) + glowOpacity; // Más lento (0.0015 → 0.0005)
    if (glowMaterial.uniforms) {
      glowMaterial.uniforms.opacity.value = glowPulse;
    }

    // Update light position to follow sun
    if (this.light) {
      this.light.position.copy(this.sunMesh.position);
      // Subtle light intensity pulse
      const lightPulse = Math.sin(performance.now() * 0.0004) * 0.1 + 1.0; // Más lento y sutil (0.002 → 0.0004, 0.2 → 0.1)
      this.light.intensity = this.config.lightIntensity * lightPulse;
    }
  }

  /**
   * Set position of the sun in 3D space
   */
  setPosition(x: number, y: number, z: number): void {
    if (this.sunMesh) {
      this.sunMesh.position.set(x, y, z);
      const innerGlow = (this.sunMesh as any).innerGlow as THREE.Mesh | undefined;
      if (innerGlow) innerGlow.position.set(x, y, z);
    }
    if (this.glowMesh) this.glowMesh.position.set(x, y, z);
    if (this.light) this.light.position.set(x, y, z);
  }

  /**
   * Update sun color at runtime
   */
  setColor(color: number): void {
    if (this.sunMesh) {
      const material = this.sunMesh.material as THREE.ShaderMaterial;
      if (material.uniforms?.baseColor) {
        material.uniforms.baseColor.value.setHex(color);
      }
    }
  }

  /**
   * Update glow/corona color at runtime
   */
  setGlowColor(color: number): void {
    if (this.glowMesh) {
      const material = this.glowMesh.material as THREE.ShaderMaterial;
      if (material.uniforms?.glowColor) {
        material.uniforms.glowColor.value.setHex(color);
      }
    }
  }

  /**
   * Update brightness multiplier at runtime
   */
  setBrightness(brightness: number): void {
    this.config.brightness = Math.max(0.5, Math.min(3.0, brightness));
    if (this.sunMesh) {
      const material = this.sunMesh.material as THREE.ShaderMaterial;
      if (material.uniforms?.brightness) {
        material.uniforms.brightness.value = this.config.brightness;
      }
    }
  }

  dispose(): void {
    this.sunMesh?.geometry.dispose();
    (this.sunMesh?.material as THREE.Material).dispose();
    
    const innerGlow = (this.sunMesh as any)?.innerGlow as THREE.Mesh | undefined;
    if (innerGlow) {
      innerGlow.geometry.dispose();
      (innerGlow.material as THREE.Material).dispose();
    }
    
    this.glowMesh?.geometry.dispose();
    (this.glowMesh?.material as THREE.Material).dispose();
  }
}

export default SunStar;
