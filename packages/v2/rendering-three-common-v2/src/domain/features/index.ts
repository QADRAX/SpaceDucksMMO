/**
 * Render features (v2). Each syncs ECS components to Three.js objects.
 *
 * Implemented: Camera (cameraView → PerspectiveCamera), Light (ambient/directional/point/spot),
 * Geometry (primitives + customGeometry from MeshGeometryFileData), Material (standard/basic/phong/lambert).
 *
 * v1 had additionally: FullMesh (GLB), ShaderFeature, SkyboxFeature, DebugFeature (gizmos),
 * LensFlareFeature, AnimationFeature. These can be added as new features when needed.
 */
export { createCameraFeature } from './cameraFeature';
export { createLightFeature } from './lightFeature';
export { createGeometryFeature } from './geometryFeature';
export { createMaterialFeature } from './materialFeature';
