import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class SphereGeometryComponent extends BaseGeometryComponent {
  readonly type = "sphereGeometry";
  readonly metadata: ComponentMetadata = {
    type: "sphereGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "radius",
          label: "Radius",
          type: "number",
          nullable: false,
          default: 1,
          min: 0.01,
          max: 1000,
          step: 0.01,
        },
        {
          key: "widthSegments",
          label: "Width Segments",
          type: "number",
          nullable: false,
          default: 32,
          min: 3,
          max: 128,
          step: 1,
        },
        {
          key: "heightSegments",
          label: "Height Segments",
          type: "number",
          nullable: false,
          default: 16,
          min: 2,
          max: 128,
          step: 1,
        },
      ],
    },
  };

  radius: number;
  widthSegments?: number;
  heightSegments?: number;

  constructor(params?: {
    radius?: number;
    widthSegments?: number;
    heightSegments?: number;
  }) {
    super();
    this.radius = params?.radius ?? 1;
    this.widthSegments = params?.widthSegments ?? 32;
    this.heightSegments = params?.heightSegments ?? 16;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    return this.radius * (worldScale?.x ?? 1);
  }
}

export default SphereGeometryComponent;
