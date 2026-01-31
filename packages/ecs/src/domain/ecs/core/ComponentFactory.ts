import type { Entity } from "./Entity";
import { Component } from "./Component";
import { BoxGeometryComponent } from "../components/geometry/BoxGeometryComponent";
import { SphereGeometryComponent } from "../components/geometry/SphereGeometryComponent";
import { PlaneGeometryComponent } from "../components/geometry/PlaneGeometryComponent";
import { CylinderGeometryComponent } from "../components/geometry/CylinderGeometryComponent";
import { ConeGeometryComponent } from "../components/geometry/ConeGeometryComponent";
import { TorusGeometryComponent } from "../components/geometry/TorusGeometryComponent";
import { CustomGeometryComponent } from "../components/geometry/CustomGeometryComponent";
import { StandardMaterialComponent } from "../components/material/StandardMaterialComponent";
import { BasicMaterialComponent } from "../components/material/BasicMaterialComponent";
import { PhongMaterialComponent } from "../components/material/PhongMaterialComponent";
import { LambertMaterialComponent } from "../components/material/LambertMaterialComponent";
import { ShaderMaterialComponent } from "../components/material/ShaderMaterialComponent";
import { TextureTilingComponent } from "../components/material/TextureTilingComponent";
import { OrbitComponent } from "../components/OrbitComponent";
import { CameraViewComponent } from "../components/CameraViewComponent";
import { MouseLookComponent } from "../components/MouseLookComponent";
import { FirstPersonMoveComponent } from "../components/FirstPersonMoveComponent";
import { LookAtEntityComponent } from "../components/LookAtEntityComponent";
import { LookAtPointComponent } from "../components/LookAtPointComponent";

import AmbientLightComponent from "../components/light/AmbientLightComponent";
import DirectionalLightComponent from "../components/light/DirectionalLightComponent";
import PointLightComponent from "../components/light/PointLightComponent";
import SpotLightComponent from "../components/light/SpotLightComponent";

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
  | "mouseLook"
  | "firstPersonMove"
  | "textureTiling"
  | "lookAtEntity"
  | "lookAtPoint"
  | "ambientLight"
  | "directionalLight"
  | "pointLight"
  | "spotLight";

export interface CreatableComponentDef {
  type: KnownComponentType;
  label: string;
}

export interface IEcsComponentFactory {
  listCreatableComponents(entity: Entity): CreatableComponentDef[];
  create(type: KnownComponentType, params?: any): Component;
}

export class DefaultEcsComponentFactory implements IEcsComponentFactory {
  listCreatableComponents(entity: Entity): CreatableComponentDef[] {
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
    const hasAnyMaterial =
      has("standardMaterial") ||
      has("basicMaterial") ||
      has("phongMaterial") ||
      has("lambertMaterial");

    if (hasAnyGeometry && !hasAnyMaterial && !has("shaderMaterial")) {
      defs.push({ type: "standardMaterial", label: "Standard Material" });
      defs.push({ type: "basicMaterial", label: "Basic Material" });
      defs.push({ type: "phongMaterial", label: "Phong Material" });
      defs.push({ type: "lambertMaterial", label: "Lambert Material" });
    }

    // texture tiling: optional component when geometry present
    if (hasAnyGeometry && !has("textureTiling")) {
      defs.push({
        type: "textureTiling",
        label: "Texture Tiling",
      });
    }

    // shaderMaterial requires any geometry and conflicts with any concrete material
    if (hasAnyGeometry && !hasAnyMaterial) {
      defs.push({ type: "shaderMaterial", label: "Shader Material" });
    }

    // orbit (unique)
    if (!has("orbit")) defs.push({ type: "orbit", label: "Orbit" });

    // camera view (unique)
    if (!has("cameraView")) {
      defs.push({ type: "cameraView", label: "Camera View" });
    }

    // mouse / first-person movement (only when camera present)
    if (has("cameraView") && !has("mouseLook")) {
      defs.push({ type: "mouseLook", label: "Mouse Look" });
    }
    if (has("cameraView") && !has("firstPersonMove")) {
      defs.push({ type: "firstPersonMove", label: "First Person Move" });
    }

    // look-at components
    if (!has("lookAtEntity")) {
      defs.push({ type: "lookAtEntity", label: "Look At Entity" });
    }
    if (!has("lookAtPoint")) {
      defs.push({ type: "lookAtPoint", label: "Look At Point" });
    }

    // lights: only offer if entity has no light component yet
    const hasAnyLight =
      has("ambientLight") ||
      has("directionalLight") ||
      has("pointLight") ||
      has("spotLight");

    if (!hasAnyLight) {
      defs.push({ type: "ambientLight", label: "Ambient Light" });
      defs.push({ type: "directionalLight", label: "Directional Light" });
      defs.push({ type: "pointLight", label: "Point Light" });
      defs.push({ type: "spotLight", label: "Spot Light" });
    }

    return defs;
  }

  create(type: KnownComponentType, params?: any): Component {
    switch (type) {
      case "boxGeometry":
        return new BoxGeometryComponent(
          params ?? { width: 1, height: 1, depth: 1 }
        );
      case "sphereGeometry":
        return new SphereGeometryComponent(params ?? { radius: 1 });
      case "planeGeometry":
        return new PlaneGeometryComponent(params ?? { width: 1, height: 1 });
      case "cylinderGeometry":
        return new CylinderGeometryComponent(
          params ?? { radiusTop: 0.5, radiusBottom: 0.5, height: 1 }
        );
      case "coneGeometry":
        return new ConeGeometryComponent(params ?? { radius: 0.5, height: 1 });
      case "torusGeometry":
        return new TorusGeometryComponent(
          params ?? { radius: 1, tube: 0.3 }
        );
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
        return new ShaderMaterialComponent({
          shaderType: "atmosphere",
          uniforms: {},
        });
      case "textureTiling":
        return new TextureTilingComponent({
          repeatU: 1,
          repeatV: 1,
          offsetU: 0,
          offsetV: 0,
        });
      case "orbit":
        return new OrbitComponent({
          targetEntityId: "",
          altitudeFromSurface: 10,
          speed: 1,
        });
      case "cameraView":
        return new CameraViewComponent({});
      case "mouseLook":
        return new MouseLookComponent(params ?? {});
      case "firstPersonMove":
        return new FirstPersonMoveComponent(params ?? {});
      case "lookAtEntity":
        return new LookAtEntityComponent({
          targetEntityId: "",
          offset: [0, 0, 0],
        });
      case "lookAtPoint":
        return new LookAtPointComponent({ targetPoint: [0, 0, 0] });
      case "ambientLight":
        return new AmbientLightComponent(
          params ?? { color: "#ffffff", intensity: 1 }
        );
      case "directionalLight":
        return new DirectionalLightComponent(
          params ?? { color: "#ffffff", intensity: 1, castShadow: false }
        );
      case "pointLight":
        return new PointLightComponent(
          params ?? {
            color: "#ffffff",
            intensity: 1,
            distance: 0,
            decay: 1,
          }
        );
      case "spotLight":
        return new SpotLightComponent(
          params ?? {
            color: "#ffffff",
            intensity: 1,
            distance: 0,
            angle: 0.5,
            penumbra: 0,
            decay: 1,
          }
        );
      default:
        throw new Error(`Unknown component type '${type}'`);
    }
  }
}

export default DefaultEcsComponentFactory;
