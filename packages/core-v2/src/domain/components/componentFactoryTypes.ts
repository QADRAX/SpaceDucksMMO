import type { ComponentType } from './types';
import type {
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
} from './domains/rendering/light';
import type {
  BasicMaterialComponent,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
} from './domains/rendering/material';
import type {
  BasicShaderMaterialComponent,
  PhysicalShaderMaterialComponent,
  StandardShaderMaterialComponent,
} from './domains/rendering/shaderMaterial';
import type { TextureTilingComponent } from './domains/rendering/texture';
import type {
  CameraViewComponent,
  PostProcessComponent,
  PostProcessEffectDefinition,
} from './domains/rendering/camera';
import type { LensFlareComponent } from './domains/rendering/effects';
import type { SkyboxComponent } from './domains/rendering/environment';
import type {
  BoxGeometryComponent,
  ConeGeometryComponent,
  CustomGeometryComponent,
  CylinderGeometryComponent,
  FullMeshComponent,
  PlaneGeometryComponent,
  SphereGeometryComponent,
  TorusGeometryComponent,
} from './domains/rendering/geometry';
import type {
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  GravityComponent,
  RigidBodyComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
} from './domains/physics/physics';
import type { NameComponent } from './domains/gameplay/identity';
import type { ScriptComponent } from './domains/gameplay/scripting';

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
