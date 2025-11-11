import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';

/**
 * Rotating duck placeholder (will be replaced with actual model later)
 */
class RotatingDuck implements ISceneObject {
  id = 'menu-duck';
  private mesh!: THREE.Mesh;
  
  addTo(scene: THREE.Scene): void {
    // Placeholder: simple capsule geometry representing a duck silhouette
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.8, 8, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffdd44, 
      roughness: 0.6,
      metalness: 0.2
    });
    this.mesh = new THREE.Mesh(bodyGeometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
  }

  update(dt: number): void {
    if (!this.mesh) return;
    const delta = dt / 1000;
    this.mesh.rotation.y += 0.5 * delta; // slow rotation
  }

  dispose(): void {
    this.mesh?.geometry.dispose();
    (this.mesh?.material as THREE.Material).dispose();
  }
}

/**
 * Floating particles for ambient atmosphere
 */
class AmbientParticles implements ISceneObject {
  id = 'menu-particles';
  private points!: THREE.Points;
  private positions!: Float32Array;
  
  addTo(scene: THREE.Scene): void {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    
    // Spread particles in a sphere around camera
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 8 + Math.random() * 12;
      this.positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 2;
      this.positions[i3 + 2] = r * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x5dd3ff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);
  }

  update(dt: number): void {
    if (!this.points) return;
    this.points.rotation.y += 0.0001 * dt;
  }

  dispose(): void {
    this.points?.geometry.dispose();
    (this.points?.material as THREE.Material).dispose();
  }
}

/**
 * Main menu background scene: ambient, non-interactive visual backdrop.
 * Features a rotating duck placeholder and floating particles.
 */
export class MainMenuScene implements IScene {
  readonly id = SceneId.MainMenu;
  private objects: ISceneObject[] = [];

  setup(engine: IRenderingEngine): void {
    // Configure camera position for menu view
    const camera = engine.getCamera();
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 1, 5);
      camera.lookAt(0, 0, 0);
    }

    // Setup lighting
    const scene = engine.getScene();
    
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0x404560, 0.6);
    scene.add(ambient);

    // Directional light for shadows and highlights
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    scene.add(dirLight);

    // Add accent rim light
    const rimLight = new THREE.DirectionalLight(0x5dd3ff, 0.5);
    rimLight.position.set(-5, 2, -5);
    scene.add(rimLight);

    // Add scene objects
    const duck = new RotatingDuck();
    const particles = new AmbientParticles();
    
    this.objects.push(duck, particles);
    this.objects.forEach(obj => engine.add(obj));
  }

  update(dt: number): void {
    // Update all scene objects
    this.objects.forEach(obj => obj.update(dt));
  }

  teardown(engine: IRenderingEngine): void {
    // Remove all objects
    this.objects.forEach(obj => engine.remove(obj.id));
    this.objects = [];
    
    // Clear lights (Three.js will keep references otherwise)
    const scene = engine.getScene();
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    lights.forEach(light => scene.remove(light));
  }
}

export default MainMenuScene;
