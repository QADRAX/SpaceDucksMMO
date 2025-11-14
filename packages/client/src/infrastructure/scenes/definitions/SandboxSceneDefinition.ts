import SceneId from '@client/domain/scene/SceneId';
import { SceneFactory, type SceneDefinition } from '../SceneFactory';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import { OrbitCameraBuilder } from '@client/infrastructure/scene-objects/cameras';
import * as THREE from 'three';

/**
 * Sandbox scene - Empty testing and prototyping environment
 * Start with just a camera, add objects via Scene Editor UI
 */
export function createSandboxSceneDefinition(_textureResolver: TextureResolverService): SceneDefinition {
  return SceneFactory.define(SceneId.Sandbox)
    .withCameraObject(OrbitCameraBuilder.create('sandbox-camera', {
      fov: 75,
      orbit: {
        distance: 10,
        height: 5,
        speed: 0.0005,
        autoRotate: true
      },
      target: new THREE.Vector3(0, 0, 0)
    }))
    .build();
}
