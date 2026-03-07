import type { ComponentType } from './core';
import type {
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
} from './rendering/light';
import type {
  BasicMaterialComponent,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
} from './rendering/material';
import type {
  BasicShaderMaterialComponent,
  PhysicalShaderMaterialComponent,
  StandardShaderMaterialComponent,
} from './rendering/shaderMaterial';
import type { TextureTilingComponent } from './rendering/texture';
import type {
  CameraViewComponent,
  PostProcessComponent,
  PostProcessEffectDefinition,
} from './rendering/camera';
import type { LensFlareComponent } from './rendering/effects';
import type { SkyboxComponent } from './rendering/environment';
import type {
  BoxGeometryComponent,
  ConeGeometryComponent,
  CustomGeometryComponent,
  CylinderGeometryComponent,
  FullMeshComponent,
  PlaneGeometryComponent,
  SphereGeometryComponent,
  TorusGeometryComponent,
} from './rendering/geometry';
import type {
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  GravityComponent,
  RigidBodyComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
} from './physics/physics';
import type { NameComponent } from './gameplay/identity';
import type { ScriptComponent } from './gameplay/scripting';

/** Component types that can be created through the generic factory. */
export type CreatableComponentType = Exclude<ComponentType, 'metadata'>;

/** Strongly-typed component result by type discriminator. */
export interface ComponentByType {
  name: NameComponent;
  boxGeometry: BoxGeometryComponent;
  sphereGeometry: SphereGeometryComponent;
  planeGeometry: PlaneGeometryComponent;
  cylinderGeometry: CylinderGeometryComponent;
  coneGeometry: ConeGeometryComponent;
  torusGeometry: TorusGeometryComponent;
  customGeometry: CustomGeometryComponent;
  fullMesh: FullMeshComponent;
  standardMaterial: StandardMaterialComponent;
  basicMaterial: BasicMaterialComponent;
  phongMaterial: PhongMaterialComponent;
  lambertMaterial: LambertMaterialComponent;
  basicShaderMaterial: BasicShaderMaterialComponent;
  standardShaderMaterial: StandardShaderMaterialComponent;
  physicalShaderMaterial: PhysicalShaderMaterialComponent;
  cameraView: CameraViewComponent;
  textureTiling: TextureTilingComponent;
  ambientLight: AmbientLightComponent;
  directionalLight: DirectionalLightComponent;
  pointLight: PointLightComponent;
  spotLight: SpotLightComponent;
  skybox: SkyboxComponent;
  rigidBody: RigidBodyComponent;
  gravity: GravityComponent;
  sphereCollider: SphereColliderComponent;
  boxCollider: BoxColliderComponent;
  capsuleCollider: CapsuleColliderComponent;
  cylinderCollider: CylinderColliderComponent;
  coneCollider: ConeColliderComponent;
  terrainCollider: TerrainColliderComponent;
  lensFlare: LensFlareComponent;
  postProcess: PostProcessComponent;
  script: ScriptComponent;
}

/** Parameters accepted by the generic component factory per component type. */
type NonCreatableKeys = 'type' | 'metadata' | 'enabled';

/** Override payload accepted when creating a component of a specific type. */
export type ComponentCreateOverride<T extends CreatableComponentType> = Partial<
  Omit<ComponentByType[T], NonCreatableKeys>
>;

/** Override payload map accepted by the generic component factory. */
export type ComponentCreateParams = {
  [T in CreatableComponentType]: ComponentCreateOverride<T>;
};
