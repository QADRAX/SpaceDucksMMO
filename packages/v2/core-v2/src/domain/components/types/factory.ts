import type { ComponentType } from '.';
import type {
  AmbientLightComponent,
  BasicMaterialComponent,
  BasicShaderMaterialComponent,
  BoxGeometryComponent,
  CameraPerspectiveComponent,
  CameraOrthographicComponent,
  SkinComponent,
  JointComponent,
  AnimatorComponent,
  ConeGeometryComponent,
  CustomGeometryComponent,
  CylinderGeometryComponent,
  DirectionalLightComponent,
  LambertMaterialComponent,
  LensFlareComponent,
  PhongMaterialComponent,
  PhysicalShaderMaterialComponent,
  PlaneGeometryComponent,
  PointLightComponent,
  PostProcessComponent,
  SkyboxComponent,
  SphereGeometryComponent,
  SpotLightComponent,
  StandardMaterialComponent,
  StandardShaderMaterialComponent,
  TextureTilingComponent,
  TorusGeometryComponent,
} from './rendering';
import type {
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  GravityComponent,
  RigidBodyComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
  TrimeshColliderComponent,
} from './physics';
import type { NameComponent, ScriptComponent } from './gameplay';
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
  standardMaterial: StandardMaterialComponent;
  basicMaterial: BasicMaterialComponent;
  phongMaterial: PhongMaterialComponent;
  lambertMaterial: LambertMaterialComponent;
  basicShaderMaterial: BasicShaderMaterialComponent;
  standardShaderMaterial: StandardShaderMaterialComponent;
  physicalShaderMaterial: PhysicalShaderMaterialComponent;
  cameraPerspective: CameraPerspectiveComponent;
  cameraOrthographic: CameraOrthographicComponent;
  skin: SkinComponent;
  joint: JointComponent;
  animator: AnimatorComponent;
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
  trimeshCollider: TrimeshColliderComponent;
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
