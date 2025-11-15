import SceneId from '@client/domain/scene/SceneId';
import { SceneFactory, type SceneDefinition } from '../SceneFactory';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import { BlackHoleBuilder, SkyboxBuilder, StarBuilder } from '@client/infrastructure/scene-objects/visual-components';
import { OrbitCameraBuilder } from '@client/infrastructure/scene-objects/cameras';
import * as THREE from 'three';

/**
 * Sandbox scene - Testing and prototyping environment with black hole
 * Interstellar-style black hole with gravitational lensing effects
 */
export function createSandboxSceneDefinition(textureResolver: TextureResolverService): SceneDefinition {
  return SceneFactory.define(SceneId.Sandbox)
    .withCameraObject(OrbitCameraBuilder.create('sandbox-camera', {
      fov: 75,
      orbit: {
        distance: 8,
        height: 3,
        speed: 0.0002,
        autoRotate: true
      },
      target: new THREE.Vector3(0, 0, 0)
    }))
    .addObject(SkyboxBuilder.createStarfield('sandbox-skybox', textureResolver, {
      brightness: 1.5,
      rotationSpeed: 0.00002
    }))
    .build();
}
