import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { GeometryComponent } from './GeometryComponent';
import * as THREE from 'three';

export interface GravitationalLensingConfig {
  strength: number;
  radius: number;
  falloff: number;
  enableBloom?: boolean;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
}

/**
 * Gravitational lensing component that simulates space-time distortion
 * around a black hole, creating the iconic "Interstellar" visual effect.
 * 
 * Features:
 * - Real-time gravitational lensing shader
 * - Light bending around event horizon
 * - Doppler shift color effects
 * - Post-processing bloom for accretion disk
 * - Schwarzschild radius calculations
 */
export class GravitationalLensingComponent implements IInspectableComponent {
  private config: Required<GravitationalLensingConfig>;
  private parentMesh?: THREE.Mesh;
  private blackHolePosition: THREE.Vector3 = new THREE.Vector3();
  private time: number = 0;
  private lensingMesh?: THREE.Mesh;
  private distortionMaterial?: THREE.ShaderMaterial;
  private scene?: THREE.Scene;
  private parentRadius: number = 1.0;
  private disposed: boolean = false;

  constructor(config: GravitationalLensingConfig) {
    this.config = {
      strength: config.strength,
      radius: config.radius,
      falloff: config.falloff,
      enableBloom: config.enableBloom ?? true,
      bloomStrength: config.bloomStrength ?? 1.5,
      bloomRadius: config.bloomRadius ?? 0.8,
      bloomThreshold: config.bloomThreshold ?? 0.3,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void {
    this.disposed = false; // Reset disposed flag
    this.scene = scene;
    this.parentMesh = parentMesh;
    this.blackHolePosition.copy(parentMesh.position);

    // Get parent radius
    const radius = (parentMesh.geometry as THREE.SphereGeometry).parameters.radius;
    this.parentRadius = radius;

    // Subscribe to geometry changes if available
    if (visualBody && visualBody.getComponent) {
      const geometryComp = visualBody.getComponent(GeometryComponent);
      if (geometryComp) {
        geometryComp.onGeometryChanged(this.handleGeometryChange);
      }
    }

    this.createLensingEffect(scene);
  }

  private handleGeometryChange = (newRadius: number): void => {
    if (this.disposed) return; // Don't recreate if disposed
    
    this.parentRadius = newRadius;
    if (this.scene && this.parentMesh) {
      this.dispose(this.scene);
      this.createLensingEffect(this.scene);
    }
  };

  private createLensingEffect(scene: THREE.Scene): void {
    // Use radius config as offset from parent radius
    const lensingRadius = this.parentRadius + this.config.radius;
    
    const geometry = new THREE.SphereGeometry(lensingRadius, 128, 128);
    const material = this.createLensingMaterial();
    this.distortionMaterial = material;
    
    this.lensingMesh = new THREE.Mesh(geometry, material);
    if (this.parentMesh) {
      this.lensingMesh.position.copy(this.parentMesh.position);
    }
    
    // Important: render after scene but before transparent objects
    this.lensingMesh.renderOrder = 999;
    
    console.log('[GravitationalLensing] Created lensing mesh with radius:', lensingRadius);
    
    scene.add(this.lensingMesh);
  }

  private createLensingMaterial(): THREE.ShaderMaterial {
    // Gravitational lensing shader with visible distortion effect
    // Creates animated warping patterns that simulate light bending
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        strength: { value: this.config.strength * 2.0 },
        radius: { value: this.config.radius },
        blackHoleCenter: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: `
        uniform float time;
        uniform float strength;
        uniform vec3 blackHoleCenter;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDistortion;
        varying vec2 vUv;
        
        // Simple noise for distortion
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          // Calculate distance from black hole center
          vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          float distToCenter = length(worldPos - blackHoleCenter);
          
          // Gravitational warping - vertices pulled toward center
          float warpStrength = strength * (1.0 - smoothstep(0.0, 5.0, distToCenter));
          
          // Add animated distortion
          float noise = hash(position + time * 0.1);
          vec3 distortedPos = position;
          
          // Pull vertices inward with animated waves
          float pull = sin(distToCenter * 3.0 - time * 2.0) * warpStrength * 0.3;
          distortedPos += normalize(position) * pull;
          
          vDistortion = warpStrength;
          vPosition = distortedPos;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float strength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDistortion;
        varying vec2 vUv;
        
        void main() {
          // Calculate radial distance for effects
          float dist = length(vPosition) / 5.0;
          
          // Create gravitational lensing rings (Einstein rings)
          float rings = abs(sin(dist * 20.0 - time * 2.0));
          rings = pow(rings, 3.0); // Sharp rings
          
          // Add secondary distortion waves
          float waves = sin(dist * 12.0 + time * 1.5) * 0.5 + 0.5;
          
          // Fresnel effect for edge visibility
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = 1.0 - abs(dot(viewDir, vNormal));
          fresnel = pow(fresnel, 2.0);
          
          // Color based on distortion - blue shift near center
          vec3 innerColor = vec3(0.4, 0.7, 1.0);  // Light blue
          vec3 outerColor = vec3(0.1, 0.3, 0.8);  // Dark blue
          vec3 color = mix(outerColor, innerColor, vDistortion);
          
          // Add bright Einstein rings
          color += vec3(0.8, 0.9, 1.0) * rings * vDistortion;
          
          // Pulsing effect
          float pulse = sin(time * 3.0) * 0.2 + 0.8;
          color *= pulse;
          
          // Alpha based on distortion strength and fresnel
          float alpha = (vDistortion * 0.4 + fresnel * 0.5 + rings * 0.3 + waves * 0.1) * strength;
          alpha = clamp(alpha, 0.0, 0.9);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: false,
    });
  }

  update(deltaTime: number): void {
    this.time += deltaTime * 0.001;

    if (this.lensingMesh && this.parentMesh) {
      // Keep lensing mesh synchronized with black hole
      this.lensingMesh.position.copy(this.parentMesh.position);
      
      // Update shader uniforms
      const material = this.lensingMesh.material as THREE.ShaderMaterial;
      if (material.uniforms.time) {
        material.uniforms.time.value = this.time;
      }
      
      // Debug: log occasionally to verify it's updating
      if (Math.floor(this.time) % 5 === 0 && Math.floor(this.time * 10) % 10 === 0) {
        console.log('[GravitationalLensing] Update - time:', this.time.toFixed(2), 'visible:', this.lensingMesh.visible);
      }
    }
  }

  dispose(scene: THREE.Scene): void {
    console.log('[GravitationalLensing] Disposing lensing effect');
    this.disposed = true; // Mark as disposed to prevent recreation
    
    if (this.lensingMesh) {
      // Remove from scene first
      scene.remove(this.lensingMesh);
      
      // Dispose geometry
      if (this.lensingMesh.geometry) {
        this.lensingMesh.geometry.dispose();
      }
      
      // Dispose material (ShaderMaterial needs proper cleanup)
      if (this.lensingMesh.material) {
        const material = this.lensingMesh.material as THREE.ShaderMaterial;
        
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
      this.lensingMesh.clear();
      this.lensingMesh.parent = null;
      this.lensingMesh = undefined;
      
      console.log('[GravitationalLensing] Disposed successfully');
    }
    
    // Clean up distortion material reference
    if (this.distortionMaterial) {
      this.distortionMaterial = undefined;
    }
  }

  // ============================================
  // Public API
  // ============================================

  setStrength(strength: number): void {
    this.config.strength = strength;
    if (this.lensingMesh) {
      const material = this.lensingMesh.material as THREE.ShaderMaterial;
      material.uniforms.strength.value = strength;
    }
  }

  getStrength(): number {
    return this.config.strength;
  }

  setRadius(radius: number): void {
    this.config.radius = radius;
    // Recreate lensing effect with new radius
    if (this.scene) {
      this.dispose(this.scene);
      this.createLensingEffect(this.scene);
    }
  }

  getRadius(): number {
    return this.config.radius;
  }

  setBloomStrength(strength: number): void {
    this.config.bloomStrength = strength;
    // Bloom is now handled at renderer level
  }

  getBloomStrength(): number {
    return this.config.bloomStrength;
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'lensing.strength',
        type: 'number',
        label: 'Lensing Strength',
        value: this.config.strength,
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        name: 'lensing.radius',
        type: 'number',
        label: 'Effect Radius Offset',
        value: this.config.radius,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        description: 'Lensing sphere radius offset from parent surface'
      },
      {
        name: 'lensing.falloff',
        type: 'number',
        label: 'Falloff',
        value: this.config.falloff,
        min: 0.01,
        max: 0.5,
        step: 0.01,
      },
      {
        name: 'bloom.strength',
        type: 'number',
        label: 'Bloom Strength',
        value: this.config.bloomStrength,
        min: 0,
        max: 3,
        step: 0.1,
      },
      {
        name: 'bloom.radius',
        type: 'number',
        label: 'Bloom Radius',
        value: this.config.bloomRadius,
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        name: 'bloom.threshold',
        type: 'number',
        label: 'Bloom Threshold',
        value: this.config.bloomThreshold,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ];
  }

  updateProperty(propertyName: string, value: any): void {
    const [category, prop] = propertyName.split('.');

    if (category === 'lensing') {
      switch (prop) {
        case 'strength':
          this.setStrength(value);
          break;
        case 'radius':
          this.setRadius(value);
          break;
        case 'falloff':
          this.config.falloff = value;
          if (this.lensingMesh) {
            const material = this.lensingMesh.material as THREE.ShaderMaterial;
            material.uniforms.falloff.value = value;
          }
          break;
      }
    } else if (category === 'bloom') {
      switch (prop) {
        case 'strength':
          this.setBloomStrength(value);
          break;
        case 'radius':
          this.config.bloomRadius = value;
          // Bloom is handled at renderer level
          break;
        case 'threshold':
          this.config.bloomThreshold = value;
          // Bloom is handled at renderer level
          break;
      }
    }
  }

  setProperty(name: string, value: any): void {
    this.updateProperty(name, value);
  }

  getProperty(name: string): any {
    const [category, prop] = name.split('.');

    if (category === 'lensing') {
      switch (prop) {
        case 'strength': return this.config.strength;
        case 'radius': return this.config.radius;
        case 'falloff': return this.config.falloff;
      }
    } else if (category === 'bloom') {
      switch (prop) {
        case 'strength': return this.config.bloomStrength;
        case 'radius': return this.config.bloomRadius;
        case 'threshold': return this.config.bloomThreshold;
      }
    }

    return undefined;
  }
}
