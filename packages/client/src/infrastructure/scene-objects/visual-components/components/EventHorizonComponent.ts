import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { GeometryComponent } from './GeometryComponent';
import * as THREE from 'three';

export interface EventHorizonConfig {
  radiusMultiplier: number;
  color: number;
  distortionStrength?: number;
  pulseSpeed?: number;
  enablePulse?: boolean;
}

/**
 * Event horizon component for black holes.
 * Creates a dark, distorted sphere representing the point of no return.
 * 
 * Features:
 * - Dark sphere with subtle edge glow
 * - Optional pulsing effect
 * - Distortion shader for warping effect
 * - Additive blending for supernatural appearance
 */
export class EventHorizonComponent implements IInspectableComponent {
  private horizonMesh?: THREE.Mesh;
  private config: Required<EventHorizonConfig>;
  private time: number = 0;
  private parentMesh?: THREE.Mesh;
  private scene?: THREE.Scene;
  private parentRadius: number = 1.0;
  private disposed: boolean = false;

  constructor(config: EventHorizonConfig) {
    this.config = {
      radiusMultiplier: config.radiusMultiplier,
      color: config.color,
      distortionStrength: config.distortionStrength ?? 0.1,
      pulseSpeed: config.pulseSpeed ?? 0.5,
      enablePulse: config.enablePulse ?? true,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void {
    this.scene = scene;
    this.parentMesh = parentMesh;

    const radius = (parentMesh.geometry as THREE.SphereGeometry).parameters.radius;
    this.parentRadius = radius;

    // Subscribe to geometry changes if available
    if (visualBody && visualBody.getComponent) {
      const geometryComp = visualBody.getComponent(GeometryComponent);
      if (geometryComp) {
        geometryComp.onGeometryChanged(this.handleGeometryChange);
      }
    }

    this.createHorizon(scene);
  }

  private handleGeometryChange = (newRadius: number): void => {
    if (this.disposed) return; // Don't recreate if disposed
    
    this.parentRadius = newRadius;
    if (this.scene && this.parentMesh) {
      this.dispose(this.scene);
      this.createHorizon(this.scene);
    }
  };

  private createHorizon(scene: THREE.Scene): void {
    const horizonRadius = this.parentRadius * this.config.radiusMultiplier;

    const geometry = new THREE.SphereGeometry(horizonRadius, 64, 64);

    // Create shader material for event horizon effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(this.config.color) },
        distortionStrength: { value: this.config.distortionStrength },
      },
      vertexShader: `
        uniform float time;
        uniform float distortionStrength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Simple noise function
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        }
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          // Apply subtle distortion
          vec3 pos = position;
          float n = noise(position + time * 0.1) * distortionStrength;
          pos += normal * n;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Fresnel effect - glow on edges
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
          
          // Very dark center, slight glow on edges
          vec3 finalColor = color * (0.1 + fresnel * 0.5);
          float alpha = 0.95 + fresnel * 0.05;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
    });

    this.horizonMesh = new THREE.Mesh(geometry, material);
    if (this.parentMesh) {
      this.horizonMesh.position.copy(this.parentMesh.position);
    }
    
    scene.add(this.horizonMesh);
  }

  update(deltaTime: number): void {
    if (!this.horizonMesh) return;

    // Keep horizon synchronized with parent position
    if (this.parentMesh) {
      this.horizonMesh.position.copy(this.parentMesh.position);
    }

    // Update time for distortion animation
    this.time += deltaTime;
    const material = this.horizonMesh.material as THREE.ShaderMaterial;
    material.uniforms.time.value = this.time * 0.001;

    // Optional pulse effect
    if (this.config.enablePulse) {
      const pulse = Math.sin(this.time * this.config.pulseSpeed * 0.001) * 0.05;
      this.horizonMesh.scale.setScalar(1.0 + pulse);
    }
  }

  dispose(scene: THREE.Scene): void {
    console.log('[EventHorizon] Disposing event horizon');
    this.disposed = true; // Mark as disposed to prevent recreation
    
    if (this.horizonMesh) {
      // Remove from scene first
      scene.remove(this.horizonMesh);
      
      // Dispose geometry
      if (this.horizonMesh.geometry) {
        this.horizonMesh.geometry.dispose();
      }
      
      // Dispose material (ShaderMaterial needs proper cleanup)
      if (this.horizonMesh.material) {
        const material = this.horizonMesh.material as THREE.ShaderMaterial;
        
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
      this.horizonMesh.clear();
      this.horizonMesh.parent = null;
      this.horizonMesh = undefined;
      
      console.log('[EventHorizon] Disposed successfully');
    }
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      { name: 'horizon.color', label: 'Horizon Color', type: 'color', value: this.config.color },
      { name: 'horizon.distortion', label: 'Distortion Strength', type: 'number', value: this.config.distortionStrength, min: 0, max: 0.5, step: 0.01 },
      { name: 'horizon.pulseSpeed', label: 'Pulse Speed', type: 'number', value: this.config.pulseSpeed, min: 0, max: 2, step: 0.1 },
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'color') {
      this.config.color = value;
      if (this.horizonMesh) {
        const material = this.horizonMesh.material as THREE.ShaderMaterial;
        material.uniforms.color.value.setHex(value);
      }
    } else if (propName === 'distortion') {
      this.config.distortionStrength = value;
      if (this.horizonMesh) {
        const material = this.horizonMesh.material as THREE.ShaderMaterial;
        material.uniforms.distortionStrength.value = value;
      }
    } else if (propName === 'pulseSpeed') {
      this.config.pulseSpeed = value;
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'color') return this.config.color;
    if (propName === 'distortion') return this.config.distortionStrength;
    if (propName === 'pulseSpeed') return this.config.pulseSpeed;
    
    return undefined;
  }
}
