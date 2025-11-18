import type { Entity } from "@client/domain/ecs/core/Entity";
import { Component } from "@client/domain/ecs/core/Component";
import { BoxGeometryComponent } from "@client/domain/ecs/components/BoxGeometryComponent";
import { SphereGeometryComponent } from "@client/domain/ecs/components/SphereGeometryComponent";
import { PlaneGeometryComponent } from "@client/domain/ecs/components/PlaneGeometryComponent";
import { CylinderGeometryComponent } from "@client/domain/ecs/components/CylinderGeometryComponent";
import { ConeGeometryComponent } from "@client/domain/ecs/components/ConeGeometryComponent";
import { TorusGeometryComponent } from "@client/domain/ecs/components/TorusGeometryComponent";
import { CustomGeometryComponent } from "@client/domain/ecs/components/CustomGeometryComponent";
import { MaterialComponent } from "@client/domain/ecs/components/MaterialComponent";
import { ShaderMaterialComponent } from "@client/domain/ecs/components/ShaderMaterialComponent";
import { OrbitComponent } from "@client/domain/ecs/components/OrbitComponent";
import { CameraViewComponent } from "@client/domain/ecs/components/CameraViewComponent";
import { CameraTargetComponent } from "@client/domain/ecs/components/CameraTargetComponent";
import { LightComponent } from "@client/domain/ecs/components/LightComponent";

export type KnownComponentType =
  | "boxGeometry"
  | "sphereGeometry"
  | "planeGeometry"
  | "cylinderGeometry"
  | "coneGeometry"
  | "torusGeometry"
  | "customGeometry"
  | "material"
  | "shaderMaterial"
  | "orbit"
  | "cameraView"
  | "cameraTarget"
  | "light";

export interface CreatableComponentDef {
  type: KnownComponentType;
  label: string;
}

export interface IEcsComponentFactory {
  listCreatableComponents(entity: Entity): CreatableComponentDef[];
  create(type: KnownComponentType, params?: any): Component;
}

export class DefaultEcsComponentFactory implements IEcsComponentFactory {
  listCreatableComponents(entity: Entity) {
    const defs: CreatableComponentDef[] = [];
    const has = (t: string) => entity.hasComponent(t);

    const hasAnyGeometry =
      has("boxGeometry") ||
      has("sphereGeometry") ||
      has("planeGeometry") ||
      has("cylinderGeometry") ||
      has("coneGeometry") ||
      has("torusGeometry") ||
      has("customGeometry");

    if (!hasAnyGeometry) {
      defs.push({ type: "boxGeometry", label: "Box Geometry" });
      defs.push({ type: "sphereGeometry", label: "Sphere Geometry" });
      defs.push({ type: "planeGeometry", label: "Plane Geometry" });
      defs.push({ type: "cylinderGeometry", label: "Cylinder Geometry" });
      defs.push({ type: "coneGeometry", label: "Cone Geometry" });
      defs.push({ type: "torusGeometry", label: "Torus Geometry" });
      defs.push({ type: "customGeometry", label: "Custom Geometry" });
    }

    // material requires any geometry and conflicts with shaderMaterial
    if (hasAnyGeometry && !has("shaderMaterial"))
      defs.push({ type: "material", label: "Material" });

    // shaderMaterial requires any geometry and conflicts with material
    if (hasAnyGeometry && !has("material"))
      defs.push({ type: "shaderMaterial", label: "Shader Material" });

    // orbit (unique)
    if (!has("orbit")) defs.push({ type: "orbit", label: "Orbit" });

    // camera view (unique)
    if (!has("cameraView")) defs.push({ type: "cameraView", label: "Camera View" });

    // camera target requires cameraView
    if (has("cameraView") && !has("cameraTarget"))
      defs.push({ type: "cameraTarget", label: "Camera Target" });

    // light
    if (!has("light")) defs.push({ type: "light", label: "Light" });

    return defs;
  }

  create(type: KnownComponentType, params?: any): Component {
    switch (type) {
      case "boxGeometry":
        return new BoxGeometryComponent(params ?? { width: 1, height: 1, depth: 1 });
      case "sphereGeometry":
        return new SphereGeometryComponent(params ?? { radius: 1 });
      case "planeGeometry":
        return new PlaneGeometryComponent(params ?? { width: 1, height: 1 });
      case "cylinderGeometry":
        return new CylinderGeometryComponent(params ?? { radiusTop: 0.5, radiusBottom: 0.5, height: 1 });
      case "coneGeometry":
        return new ConeGeometryComponent(params ?? { radius: 0.5, height: 1 });
      case "torusGeometry":
        return new TorusGeometryComponent(params ?? { radius: 1, tube: 0.3 });
      case "customGeometry":
        return new CustomGeometryComponent(params ?? { key: "" });
      case "material":
        return new MaterialComponent({ type: "standard", color: 0xffffff });
      case "shaderMaterial":
        return new ShaderMaterialComponent({ shaderType: "atmosphere", uniforms: {} });
      case "orbit":
        return new OrbitComponent({ targetEntityId: "", altitudeFromSurface: 10, speed: 1 });
      case "cameraView":
        return new CameraViewComponent({});
      case "cameraTarget":
        return new CameraTargetComponent({ targetEntityId: "" });
      case "light":
        return new LightComponent({ type: "ambient", intensity: 1 });
      default:
        throw new Error(`Unknown component type '${type}'`);
    }
  }
}

export default DefaultEcsComponentFactory;
