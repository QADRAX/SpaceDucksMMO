import * as THREE from "three";
import type {
  BoxGeometryComponent,
  SphereGeometryComponent,
  PlaneGeometryComponent,
  CylinderGeometryComponent,
  ConeGeometryComponent,
  TorusGeometryComponent,
  CustomGeometryComponent,
} from "@duckengine/ecs";

export type AnyGeometryComponent =
  | BoxGeometryComponent
  | SphereGeometryComponent
  | PlaneGeometryComponent
  | CylinderGeometryComponent
  | ConeGeometryComponent
  | TorusGeometryComponent
  | CustomGeometryComponent;

export class GeometryFactory {
  private static warnedCustomKeys = new Set<string>();

  // Accept either a concrete geometry component (classes used in ECS)
  // or a legacy parameter object (e.g. { type: 'sphere', radius: 1, ... }).
  static build(
    comp: AnyGeometryComponent | Record<string, any>
  ): THREE.BufferGeometry {
    // Support both legacy short names (e.g. 'sphere') and new concrete types
    const t = String(comp.type || "").toLowerCase();
    switch (t) {
      case "sphere":
      case "spheregeometry":
        return new THREE.SphereGeometry(
          (comp as any).radius,
          (comp as any).widthSegments ?? 32,
          (comp as any).heightSegments ?? 16
        );
      case "box":
      case "boxgeometry":
        return new THREE.BoxGeometry(
          (comp as any).width,
          (comp as any).height,
          (comp as any).depth
        );
      case "plane":
      case "planegeometry":
        return new THREE.PlaneGeometry(
          (comp as any).width,
          (comp as any).height,
          (comp as any).widthSegments ?? 1,
          (comp as any).heightSegments ?? 1
        );
      case "cylinder":
      case "cylindergeometry":
        return new THREE.CylinderGeometry(
          (comp as any).radiusTop,
          (comp as any).radiusBottom,
          (comp as any).height,
          (comp as any).radialSegments ?? 16
        );
      case "cone":
      case "conegeometry":
        return new THREE.ConeGeometry(
          (comp as any).radius,
          (comp as any).height,
          (comp as any).radialSegments ?? 16
        );
      case "torus":
      case "torusgeometry":
        return new THREE.TorusGeometry(
          (comp as any).radius,
          (comp as any).tube,
          (comp as any).radialSegments ?? 16,
          (comp as any).tubularSegments ?? 48
        );
      case "custom":
      case "customgeometry":
        {
          const key = String((comp as any).key ?? "");
          if (key && !GeometryFactory.warnedCustomKeys.has(key)) {
            GeometryFactory.warnedCustomKeys.add(key);
            console.warn(
              `[GeometryFactory] custom geometry key='${key}' uses placeholder unit box (real geometry loaded asynchronously)`
            );
          }
        }
        return new THREE.BoxGeometry(1, 1, 1);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }
}
