import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';
import { SunStar } from '@client/infrastructure/scene-objects';

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
    const star = new SunStar('menu-sun', {
      radius: 1.2,
      color: 0xffaa00,
      glowColor: 0xffdd44,
      rotationSpeed: 0.1,
      pulseIntensity: 0.015,
      lightIntensity: 6.0,
      brightness: 1.9
    });
    const particles = new AmbientParticles();
    
    this.objects.push(star, particles);
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
