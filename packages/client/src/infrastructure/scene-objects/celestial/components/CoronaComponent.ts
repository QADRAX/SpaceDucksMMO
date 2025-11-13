import type { ICelestialComponent } from './ICelestialComponent';
import * as THREE from 'three';

/**
 * Configuration for corona glow effect (for stars)
 */
export interface CoronaComponentConfig {
  color: number;
  radiusMultiplier: number;
  intensity: number;
  enablePulse?: boolean;
  pulseSpeed?: number;
}

/**
 * Component that adds a corona/glow effect around stars.
 * Uses Fresnel shader with optional pulsing animation.
 */
export class CoronaComponent implements ICelestialComponent {
  private config: Required<CoronaComponentConfig>;
  private coronaMesh?: THREE.Mesh;
  private parentRadius: number = 1.0;
  private time: number = 0;

  constructor(config: CoronaComponentConfig) {
    this.config = {
      color: config.color,
      radiusMultiplier: config.radiusMultiplier,
      intensity: config.intensity,
      enablePulse: config.enablePulse ?? false,
      pulseSpeed: config.pulseSpeed ?? 1.0,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    const bbox = new THREE.Box3().setFromObject(parentMesh);
    this.parentRadius = (bbox.max.x - bbox.min.x) / 2;

    const coronaGeometry = new THREE.SphereGeometry(
      this.parentRadius * this.config.radiusMultiplier,
      64,
      64
    );

    const coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(this.config.color) },
        intensity: { value: this.config.intensity },
        time: { value: 0 },
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
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
          
          gl_FragColor = vec4(glowColor, fresnel * intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
    this.coronaMesh.position.copy(parentMesh.position);
    scene.add(this.coronaMesh);
  }

  update(deltaTime: number): void {
    if (!this.coronaMesh || !this.config.enablePulse) return;

    this.time += deltaTime;
    const material = this.coronaMesh.material as THREE.ShaderMaterial;
    
    // Pulse between 0.8x and 1.2x intensity
    const pulse = Math.sin(this.time * this.config.pulseSpeed * 0.002) * 0.2;
    material.uniforms.intensity.value = this.config.intensity * (1.0 + pulse);
  }

  dispose(scene: THREE.Scene): void {
    if (this.coronaMesh) {
      scene.remove(this.coronaMesh);
      this.coronaMesh.geometry.dispose();
      (this.coronaMesh.material as THREE.Material).dispose();
    }
  }

  /**
   * Update corona intensity at runtime
   */
  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
  }
}
