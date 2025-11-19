import type { Entity } from "@client/domain/ecs/core/Entity";
import { Component } from "@client/domain/ecs/core/Component";
import { BoxGeometryComponent } from "@client/domain/ecs/components/geometry/BoxGeometryComponent";
import { SphereGeometryComponent } from "@client/domain/ecs/components/geometry/SphereGeometryComponent";
import { PlaneGeometryComponent } from "@client/domain/ecs/components/geometry/PlaneGeometryComponent";
import { CylinderGeometryComponent } from "@client/domain/ecs/components/geometry/CylinderGeometryComponent";
import { ConeGeometryComponent } from "@client/domain/ecs/components/geometry/ConeGeometryComponent";
import { TorusGeometryComponent } from "@client/domain/ecs/components/geometry/TorusGeometryComponent";
import { CustomGeometryComponent } from "@client/domain/ecs/components/geometry/CustomGeometryComponent";
import { StandardMaterialComponent } from "@client/domain/ecs/components/StandardMaterialComponent";
import { BasicMaterialComponent } from "@client/domain/ecs/components/BasicMaterialComponent";
import { PhongMaterialComponent } from "@client/domain/ecs/components/PhongMaterialComponent";
import { LambertMaterialComponent } from "@client/domain/ecs/components/LambertMaterialComponent";
import { ShaderMaterialComponent } from "@client/domain/ecs/components/ShaderMaterialComponent";
import { OrbitComponent } from "@client/domain/ecs/components/OrbitComponent";
import { CameraViewComponent } from "@client/domain/ecs/components/CameraViewComponent";
import { LookAtEntityComponent } from '@client/domain/ecs/components/LookAtEntityComponent';
import { LookAtPointComponent } from '@client/domain/ecs/components/LookAtPointComponent';
import { LightComponent } from "@client/domain/ecs/components/LightComponent";

export type KnownComponentType =
  | "boxGeometry"
  | "sphereGeometry"
  | "planeGeometry"
  | "cylinderGeometry"
  | "coneGeometry"
  | "torusGeometry"
  | "customGeometry"
  | "standardMaterial"
  | "basicMaterial"
  | "phongMaterial"
  | "lambertMaterial"
  | "shaderMaterial"
  | "orbit"
  | "cameraView"
  
  | "lookAtEntity"
  | "lookAtPoint"
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
    const hasAnyMaterial = has("standardMaterial") || has("basicMaterial") || has("phongMaterial") || has("lambertMaterial");
    if (hasAnyGeometry && !hasAnyMaterial && !has("shaderMaterial")) {
      defs.push({ type: "standardMaterial", label: "Standard Material" });
      defs.push({ type: "basicMaterial", label: "Basic Material" });
      defs.push({ type: "phongMaterial", label: "Phong Material" });
      defs.push({ type: "lambertMaterial", label: "Lambert Material" });
    }

    // shaderMaterial requires any geometry and conflicts with any concrete material
    if (hasAnyGeometry && !hasAnyMaterial)
      defs.push({ type: "shaderMaterial", label: "Shader Material" });

    // orbit (unique)
    if (!has("orbit")) defs.push({ type: "orbit", label: "Orbit" });

    // camera view (unique)
    if (!has("cameraView")) defs.push({ type: "cameraView", label: "Camera View" });

    // look-at / follow options
    if (has("cameraView") && !has("lookAtEntity")) defs.push({ type: "lookAtEntity", label: "Look At Entity" });

    // look-at components
    if (!has('lookAtEntity')) defs.push({ type: 'lookAtEntity', label: 'Look At Entity' });
    if (!has('lookAtPoint')) defs.push({ type: 'lookAtPoint', label: 'Look At Point' });

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
      case "standardMaterial":
        return new StandardMaterialComponent({ color: 0xffffff });
      case "basicMaterial":
        return new BasicMaterialComponent({ color: 0xffffff });
      case "phongMaterial":
        return new PhongMaterialComponent({ color: 0xffffff });
      case "lambertMaterial":
        return new LambertMaterialComponent({ color: 0xffffff });
      case "shaderMaterial":
        return new ShaderMaterialComponent({ shaderType: "atmosphere", uniforms: {} });
      case "orbit":
        return new OrbitComponent({ targetEntityId: "", altitudeFromSurface: 10, speed: 1 });
      case "cameraView":
        return new CameraViewComponent({});
      case "lookAtEntity":
        return new LookAtEntityComponent({ targetEntityId: "", offset: [0, 0, 0] });
      case "lookAtPoint":
        return new LookAtPointComponent({ targetPoint: [0, 0, 0] });
      case "light":
        return new LightComponent({ type: "ambient", intensity: 1 });
      default:
        throw new Error(`Unknown component type '${type}'`);
    }
  }
}

export default DefaultEcsComponentFactory;
