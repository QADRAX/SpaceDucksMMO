import type { Entity } from "@client/domain/ecs/core/Entity";
import { Component } from "@client/domain/ecs/core/Component";
import { GeometryComponent } from "@client/domain/ecs/components/GeometryComponent";
import { MaterialComponent } from "@client/domain/ecs/components/MaterialComponent";
import { ShaderMaterialComponent } from "@client/domain/ecs/components/ShaderMaterialComponent";
import { OrbitComponent } from "@client/domain/ecs/components/OrbitComponent";
import { CameraViewComponent } from "@client/domain/ecs/components/CameraViewComponent";
import { CameraTargetComponent } from "@client/domain/ecs/components/CameraTargetComponent";
import { LightComponent } from "@client/domain/ecs/components/LightComponent";

export type KnownComponentType =
  | "geometry"
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

    // geometry is always creatable
    if (!has("geometry")) defs.push({ type: "geometry", label: "Geometry" });

    // material requires geometry and conflicts with shaderMaterial
    if (has("geometry") && !has("shaderMaterial"))
      defs.push({ type: "material", label: "Material" });

    // shaderMaterial requires geometry and conflicts with material
    if (has("geometry") && !has("material"))
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
      case "geometry":
        return new GeometryComponent({ type: "box", width: 1, height: 1, depth: 1 });
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
