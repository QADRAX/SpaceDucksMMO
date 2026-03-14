import {
  createCameraFeature,
  createLightFeature,
  createGeometryFeature,
  createMaterialFeature,
  createSkyboxFeature,
  createTextureTilingFeature,
} from '../domain';
import type { RenderFeature } from '@duckengine/rendering-base-v2';
import type { RenderContextThree } from '../domain';

/**
 * Default feature set for Three.js rendering (camera, light, geometry, material, skybox, texture tiling).
 */
export function createDefaultRenderFeatures(): RenderFeature<RenderContextThree>[] {
  return [
    createCameraFeature(),
    createLightFeature(),
    createGeometryFeature(),
    createMaterialFeature(),
    createTextureTilingFeature(),
    createSkyboxFeature(),
  ];
}
