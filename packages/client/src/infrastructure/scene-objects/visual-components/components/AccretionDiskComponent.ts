import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { GeometryComponent } from './GeometryComponent';
import * as THREE from 'three';

export interface AccretionDiskConfig {
  innerRadius: number;
  outerRadius: number;
  innerColor: number;
  outerColor: number;
  rotationSpeed: number;
  segments?: number;
  opacity?: number;
  emissiveIntensity?: number;
  turbulence?: number;
  turbulenceScale?: number;
  dopplerEffect?: boolean;
  relativisticSpeed?: number;
}

/**
 * Accretion disk component for black holes.
 * Creates a rotating disk of hot matter spiraling into the black hole.
 * 
 * Features:
 * - Gradient from hot inner edge to cooler outer edge
 * - Rotation animation
 * - Additive blending for glow effect
 * - Semi-transparent with emissive properties
 */
export class AccretionDiskComponent implements IInspectableComponent {
  private diskMesh?: THREE.Mesh;
  private config: Required<AccretionDiskConfig>;
  private parentMesh?: THREE.Mesh;
  private time: number = 0;
  private scene?: THREE.Scene;
  private parentRadius: number = 1.0;
  private disposed: boolean = false;

  constructor(config: AccretionDiskConfig) {
    this.config = {
      innerRadius: config.innerRadius,
      outerRadius: config.outerRadius,
      innerColor: config.innerColor,
      outerColor: config.outerColor,
      rotationSpeed: config.rotationSpeed,
      segments: config.segments ?? 128,
      opacity: config.opacity ?? 0.8,
      emissiveIntensity: config.emissiveIntensity ?? 2.0,
      turbulence: config.turbulence ?? 0.5,
      turbulenceScale: config.turbulenceScale ?? 3.0,
      dopplerEffect: config.dopplerEffect ?? true,
      relativisticSpeed: config.relativisticSpeed ?? 0.3,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void {
    this.disposed = false; // Reset disposed flag
    this.scene = scene;
    this.parentMesh = parentMesh;

    // Get parent radius for future scaling
    const geometry = parentMesh.geometry as THREE.SphereGeometry;
    if (geometry.parameters) {
      this.parentRadius = geometry.parameters.radius;
    }

    // Subscribe to geometry changes if available
    if (visualBody && visualBody.getComponent) {
      const geometryComp = visualBody.getComponent(GeometryComponent);
      if (geometryComp) {
        geometryComp.onGeometryChanged(this.handleGeometryChange);
      }
    }

    this.createDisk(scene);
  }

  private handleGeometryChange = (newRadius: number): void => {
    if (this.disposed) return; // Don't recreate if disposed
    
    this.parentRadius = newRadius;
    if (this.scene && this.parentMesh) {
      this.dispose(this.scene);
      this.createDisk(this.scene);
    }
  };

  private createDisk(scene: THREE.Scene): void {

    // Scale radii based on parent radius (using offsets from surface)
    const scaledInnerRadius = this.parentRadius + this.config.innerRadius;
    const scaledOuterRadius = this.parentRadius + this.config.outerRadius;

    // Create ring geometry for accretion disk
    const geometry = new THREE.RingGeometry(
      scaledInnerRadius,
      scaledOuterRadius,
      this.config.segments,
      16
    );

    // Create custom shader material for gradient effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        innerColor: { value: new THREE.Color(this.config.innerColor) },
        outerColor: { value: new THREE.Color(this.config.outerColor) },
        innerRadius: { value: scaledInnerRadius },
        outerRadius: { value: scaledOuterRadius },
        emissiveIntensity: { value: this.config.emissiveIntensity },
        time: { value: 0.0 },
        turbulence: { value: this.config.turbulence },
        turbulenceScale: { value: this.config.turbulenceScale },
        relativisticSpeed: { value: this.config.relativisticSpeed },
        dopplerEffect: { value: this.config.dopplerEffect ? 1.0 : 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vDistFromCenter;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vDistFromCenter = length(position.xy);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 innerColor;
        uniform vec3 outerColor;
        uniform float innerRadius;
        uniform float outerRadius;
        uniform float emissiveIntensity;
        uniform float time;
        uniform float turbulence;
        uniform float turbulenceScale;
        uniform float relativisticSpeed;
        uniform float dopplerEffect;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vDistFromCenter;
        
        // 3D Simplex noise function for turbulence
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
        
        // Doppler shift calculation
        vec3 applyDopplerShift(vec3 color, float velocity) {
          // Blue shift for approaching matter, red shift for receding
          float shift = velocity * 0.5;
          return vec3(
            color.r * (1.0 - shift * 0.6),
            color.g * (1.0 - shift * 0.2),
            color.b * (1.0 + shift * 0.8)
          );
        }
        
        void main() {
          // Calculate distance from center
          float dist = vDistFromCenter;
          
          // Normalize to 0-1 range within ring
          float t = (dist - innerRadius) / (outerRadius - innerRadius);
          
          // Add turbulence using 3D noise
          float angle = atan(vPosition.y, vPosition.x);
          vec3 noisePos = vec3(
            vPosition.x * turbulenceScale,
            vPosition.y * turbulenceScale,
            time * 0.3
          );
          float noise = snoise(noisePos) * turbulence;
          
          // Add multiple octaves of noise for detail
          float detailNoise = snoise(noisePos * 2.0) * 0.5;
          float fineNoise = snoise(noisePos * 4.0) * 0.25;
          float combinedNoise = noise + detailNoise + fineNoise;
          
          // Apply turbulence to color gradient
          float turbulentT = clamp(t + combinedNoise * 0.4, 0.0, 1.0);
          
          // Color gradient from hot inner to cool outer
          vec3 color = mix(innerColor, outerColor, turbulentT);
          
          // Add brightness variation for turbulence
          float brightness = 1.0 + combinedNoise * 0.7;
          color *= brightness;
          
          // Calculate velocity for Doppler effect
          // Matter moves faster near the inner edge
          float orbitalVelocity = (1.0 - t) * relativisticSpeed;
          
          // Apply Doppler shift based on position and velocity
          if (dopplerEffect > 0.5) {
            // Matter approaching us (blue-shifted) vs receding (red-shifted)
            float approachFactor = sin(angle + time * 2.0) * orbitalVelocity;
            color = applyDopplerShift(color, approachFactor);
          }
          
          // Add multiple spiral patterns for enhanced detail
          float spiral1 = sin(angle * 5.0 - dist * 10.0 + time * 2.0) * 0.15;
          float spiral2 = sin(angle * 8.0 - dist * 15.0 - time * 1.5) * 0.1;
          color += (spiral1 + spiral2) * (1.0 - t);
          
          // Add bright streaks/filaments in inner regions
          float streaks = max(0.0, sin(angle * 20.0 + time * 3.0 + combinedNoise * 10.0));
          streaks = pow(streaks, 5.0) * (1.0 - t); // Sharp, bright streaks near center
          color += vec3(1.0, 0.9, 0.7) * streaks * 2.0;
          
          // Temperature-based brightness (hotter = brighter)
          float temperature = 1.0 - t;
          float tempBrightness = pow(temperature, 1.5);
          
          // Intense inner glow
          float innerGlow = smoothstep(0.3, 0.0, t) * 3.0;
          color += innerColor * innerGlow;
          
          // Fade near edges for smooth transitions
          float edgeFade = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.8, t);
          
          // Apply emissive glow with HDR values
          vec3 emissive = color * emissiveIntensity * tempBrightness;
          
          // Final color with HDR values for bloom
          vec3 finalColor = color + emissive;
          
          // Boost overall brightness
          finalColor *= 1.5;
          
          gl_FragColor = vec4(finalColor, edgeFade);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.diskMesh = new THREE.Mesh(geometry, material);
    
    // Position and orient disk
    if (this.parentMesh) {
      this.diskMesh.position.copy(this.parentMesh.position);
    }
    this.diskMesh.rotation.x = Math.PI / 2; // Lay flat
    
    scene.add(this.diskMesh);
  }

  update(deltaTime: number): void {
    if (!this.diskMesh) return;

    this.time += deltaTime * 0.001;

    // Update shader time uniform
    const material = this.diskMesh.material as THREE.ShaderMaterial;
    if (material.uniforms.time) {
      material.uniforms.time.value = this.time;
    }

    // Keep disk synchronized with parent position
    if (this.parentMesh) {
      this.diskMesh.position.copy(this.parentMesh.position);
    }

    // Rotate disk
    this.diskMesh.rotation.z += this.config.rotationSpeed * deltaTime * 0.001;
  }

  dispose(scene: THREE.Scene): void {
    console.log('[AccretionDisk] Disposing accretion disk');
    this.disposed = true; // Mark as disposed to prevent recreation
    
    if (this.diskMesh) {
      // Remove from scene first
      scene.remove(this.diskMesh);
      
      // Dispose geometry
      if (this.diskMesh.geometry) {
        this.diskMesh.geometry.dispose();
      }
      
      // Dispose material (ShaderMaterial needs proper cleanup)
      if (this.diskMesh.material) {
        const material = this.diskMesh.material as THREE.ShaderMaterial;
        
        // Dispose any textures in uniforms
        if (material.uniforms) {
          Object.values(material.uniforms).forEach((uniform: any) => {
            if (uniform.value && uniform.value.isTexture) {
              uniform.value.dispose();
            }
          });
        }
        
        material.dispose();
      }
      
      // Clear all references
      this.diskMesh.clear();
      this.diskMesh.parent = null;
      this.diskMesh = undefined;
      
      console.log('[AccretionDisk] Disposed successfully');
    }
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'disk.innerRadius',
        label: 'Inner Radius Offset',
        type: 'number',
        value: this.config.innerRadius,
        min: 0.1,
        max: 10.0,
        step: 0.1,
        description: 'Inner radius offset from parent surface'
      },
      {
        name: 'disk.outerRadius',
        label: 'Outer Radius Offset',
        type: 'number',
        value: this.config.outerRadius,
        min: 0.5,
        max: 20.0,
        step: 0.5,
        description: 'Outer radius offset from parent surface'
      },
      {
        name: 'disk.innerColor',
        label: 'Disk Inner Color',
        type: 'color',
        value: this.config.innerColor,
        description: 'Hot inner edge color of accretion disk'
      },
      {
        name: 'disk.outerColor',
        label: 'Disk Outer Color',
        type: 'color',
        value: this.config.outerColor,
        description: 'Cool outer edge color of accretion disk'
      },
      {
        name: 'disk.rotationSpeed',
        label: 'Disk Rotation Speed',
        type: 'number',
        value: this.config.rotationSpeed,
        min: 0,
        max: 2,
        step: 0.05,
        description: 'Speed of disk rotation'
      },
      {
        name: 'disk.opacity',
        label: 'Disk Opacity',
        type: 'number',
        value: this.config.opacity,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Transparency of accretion disk'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'innerRadius') {
      this.config.innerRadius = value;
      // Recreate disk with new radius
      if (this.scene) {
        this.dispose(this.scene);
        this.createDisk(this.scene);
      }
    } else if (propName === 'outerRadius') {
      this.config.outerRadius = value;
      // Recreate disk with new radius
      if (this.scene) {
        this.dispose(this.scene);
        this.createDisk(this.scene);
      }
    } else if (propName === 'innerColor') {
      this.config.innerColor = value;
      if (this.diskMesh) {
        const material = this.diskMesh.material as THREE.ShaderMaterial;
        material.uniforms.innerColor.value = new THREE.Color(value);
      }
    } else if (propName === 'outerColor') {
      this.config.outerColor = value;
      if (this.diskMesh) {
        const material = this.diskMesh.material as THREE.ShaderMaterial;
        material.uniforms.outerColor.value = new THREE.Color(value);
      }
    } else if (propName === 'rotationSpeed') {
      this.config.rotationSpeed = value;
    } else if (propName === 'opacity') {
      this.config.opacity = value;
      if (this.diskMesh) {
        (this.diskMesh.material as THREE.ShaderMaterial).opacity = value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'innerColor') return this.config.innerColor;
    if (propName === 'outerColor') return this.config.outerColor;
    if (propName === 'rotationSpeed') return this.config.rotationSpeed;
    if (propName === 'opacity') return this.config.opacity;
    
    return undefined;
  }
}
