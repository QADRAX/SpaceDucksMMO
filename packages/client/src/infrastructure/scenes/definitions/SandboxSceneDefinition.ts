import SceneId from '@client/domain/scene/SceneId';
import { SceneFactory, type SceneDefinition } from '../SceneFactory';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import { CameraObject } from '@client/infrastructure/scene-objects/cameras';

/**
 * Sandbox scene - Empty testing and prototyping environment
 * Start with just a camera, add objects via Scene Editor UI
 */
export function createSandboxSceneDefinition(_textureResolver: TextureResolverService): SceneDefinition {
  return SceneFactory.define(SceneId.Sandbox)
    .withCameraObject(new CameraObject('sandbox-camera', {
      fov: 75,
      position: [0, 5, 10],
      lookAt: [0, 0, 0],
      orbitTarget: [0, 0, 0],
      orbitDistance: 10,
      orbitHeight: 5,
      orbitSpeed: 0.0005,
      autoRotate: true
    }))
    .build();
}
