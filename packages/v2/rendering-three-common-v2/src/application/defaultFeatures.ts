import {
  createCameraFeature,
  createLightFeature,
  createGeometryFeature,
  createMaterialFeature,
} from '../domain';
import type { RenderFeature } from '@duckengine/rendering-base-v2';

/**
 * Default feature set for Three.js rendering (camera, light, geometry, material).
 */
export function createDefaultRenderFeatures(): RenderFeature[] {
  return [
    createCameraFeature(),
    createLightFeature(),
    createGeometryFeature(),
    createMaterialFeature(),
  ];
}
