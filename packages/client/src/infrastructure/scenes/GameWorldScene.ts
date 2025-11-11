import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';

/**
 * Game world scene: placeholder for actual gameplay.
 * This is where the MMO world, player character, NPCs, terrain, etc. will live.
 * 
 * For now, this is a minimal stub to demonstrate scene switching architecture.
 */
export class GameWorldScene implements IScene {
  readonly id = SceneId.GameWorld;

  setup(engine: IRenderingEngine): void {
    // Configure camera for gameplay view
    const camera = engine.getCamera();
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 3, 10);
      camera.lookAt(0, 0, 0);
    }

    // Basic lighting setup
    const scene = engine.getScene();
    
    const ambient = new THREE.AmbientLight(0x606060, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);

    // TODO: Add terrain, player, entities, skybox, etc.
    // For now, just an empty world ready to be populated
  }

  update(dt: number): void {
    // TODO: Game logic updates (player movement, NPC AI, physics, networking)
  }

  teardown(engine: IRenderingEngine): void {
    // TODO: Cleanup game objects when leaving world
    const scene = engine.getScene();
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    lights.forEach(light => scene.remove(light));
  }
}

export default GameWorldScene;
