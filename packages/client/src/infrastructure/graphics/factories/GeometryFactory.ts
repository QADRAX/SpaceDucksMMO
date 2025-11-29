import * as THREE from "three";
import type { BoxGeometryComponent } from "../../../domain/ecs/components/geometry/BoxGeometryComponent";
import type { SphereGeometryComponent } from "../../../domain/ecs/components/geometry/SphereGeometryComponent";
import type { PlaneGeometryComponent } from "../../../domain/ecs/components/geometry/PlaneGeometryComponent";
import type { CylinderGeometryComponent } from "../../../domain/ecs/components/geometry/CylinderGeometryComponent";
import type { ConeGeometryComponent } from "../../../domain/ecs/components/geometry/ConeGeometryComponent";
import type { TorusGeometryComponent } from "../../../domain/ecs/components/geometry/TorusGeometryComponent";
import type { CustomGeometryComponent } from "../../../domain/ecs/components/geometry/CustomGeometryComponent";

export type AnyGeometryComponent =
  | BoxGeometryComponent
  | SphereGeometryComponent
  | PlaneGeometryComponent
  | CylinderGeometryComponent
  | ConeGeometryComponent
  | TorusGeometryComponent
  | CustomGeometryComponent;

export class GeometryFactory {
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
        console.warn(
          `[GeometryFactory] custom geometry key='${
            (comp as any).key
          }' not implemented; using unit box`
        );
        return new THREE.BoxGeometry(1, 1, 1);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }
}
