import type { ICelestialComponent } from './ICelestialComponent';
import * as THREE from 'three';

/**
 * Configuration for atmospheric glow effect
 */
export interface AtmosphereComponentConfig {
  color: number;
  thickness: number;
  intensity: number;
}

/**
 * Component that adds an atmospheric glow layer using Fresnel shader.
 */
export class AtmosphereComponent implements ICelestialComponent {
  private config: AtmosphereComponentConfig;
  private atmosphereMesh?: THREE.Mesh;
  private parentRadius: number = 1.0;

  constructor(config: AtmosphereComponentConfig) {
    this.config = config;
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    // Calculate parent radius from geometry
    const geometry = parentMesh.geometry as THREE.SphereGeometry;
    const bbox = new THREE.Box3().setFromObject(parentMesh);
    this.parentRadius = (bbox.max.x - bbox.min.x) / 2;

    const atmosphereGeometry = new THREE.SphereGeometry(
      this.parentRadius * this.config.thickness,
      64,
      64
    );

    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(this.config.color) },
        intensity: { value: this.config.intensity },
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
    this.atmosphereMesh.position.copy(parentMesh.position);
    scene.add(this.atmosphereMesh);
  }

  update(deltaTime: number): void {
    // Atmosphere can slowly rotate if needed
    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y += 0.00003 * deltaTime;
    }
  }

  dispose(scene: THREE.Scene): void {
    if (this.atmosphereMesh) {
      scene.remove(this.atmosphereMesh);
      this.atmosphereMesh.geometry.dispose();
      (this.atmosphereMesh.material as THREE.Material).dispose();
    }
  }

  /**
   * Update atmosphere intensity at runtime
   */
  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
    if (this.atmosphereMesh) {
      const material = this.atmosphereMesh.material as THREE.ShaderMaterial;
      material.uniforms.intensity.value = intensity;
    }
  }
}
