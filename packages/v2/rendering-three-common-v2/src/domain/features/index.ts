/**
 * Render features (v2). Each syncs ECS components to Three.js objects.
 *
 * Implemented:
 * - CameraFeature: cameraPerspective / cameraOrthographic → Three.js cameras
 * - LightFeature: ambientLight, directionalLight, pointLight, spotLight → Three.js lights
 * - GeometryFeature: box/sphere/plane/cylinder/cone/torus + customGeometry (mesh resource) → Mesh / SkinnedMesh (skin + IBMs + joint attrs); onFrame updates skeleton from ECS joints
 * - MaterialFeature: standardMaterial, basicMaterial, phongMaterial, lambertMaterial → Mesh*Material
 * - SkyboxFeature: skybox → scene.background (CubeTexture; requires getSkyboxTexture in context)
 * - TextureTilingFeature: textureTiling → UV repeat/offset on mesh materials
 *
 * Missing (core-v2 has the component; exclude debug visuals):
 * - ShaderMaterialFeature (or extend MaterialFeature): basicShaderMaterial, standardShaderMaterial, physicalShaderMaterial → ShaderMaterial from shader resource
 * - LensFlareFeature: lensFlare → lens flare effect
 * - PostProcessFeature: postProcess → post-process chain on camera
 *
 * Out of scope here: FullMesh/GLB, AnimationFeature, DebugFeature (gizmos).
 */
export { createCameraFeature } from './cameraFeature';
export { createLightFeature } from './lightFeature';
export { createGeometryFeature } from './geometryFeature';
export { createMaterialFeature } from './materialFeature';
export { createSkyboxFeature } from './skyboxFeature';
export { createTextureTilingFeature } from './textureTilingFeature';
