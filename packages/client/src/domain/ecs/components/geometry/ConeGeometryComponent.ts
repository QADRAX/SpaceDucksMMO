import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class ConeGeometryComponent extends BaseGeometryComponent {
  readonly type = "coneGeometry";
  readonly metadata: ComponentMetadata = {
    type: "coneGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "radius",
          label: "Radius",
          min: 0.01,
          max: 1000,
          step: 0.01,
          default: 0.5,
          get: (c: ConeGeometryComponent) => c.radius,
          set: (c, v) => {
            c.radius = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "height",
          label: "Height",
          min: 0.01,
          max: 1000,
          step: 0.01,
          default: 1,
          get: (c: ConeGeometryComponent) => c.height,
          set: (c, v) => {
            c.height = Number(v);
            c.notifyChanged();
          }
        },
        { 
          key: "radialSegments", 
          label: "Radial Segments",
          default: 16,
          get: (c: ConeGeometryComponent) => c.radialSegments,
          set: (c, v) => {
            c.radialSegments = Number(v);
            c.notifyChanged();
          }
        },
      ],
    },
  };

  radius: number;
  height: number;
  radialSegments?: number;

  constructor(params?: {
    radius?: number;
    height?: number;
    radialSegments?: number;
  }) {
    super();
    this.radius = params?.radius ?? 0.5;
    this.height = params?.height ?? 1;
    this.radialSegments = params?.radialSegments ?? 16;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // use base radius and account for scale
    return this.radius * (worldScale?.x ?? 1);
  }
}

export default ConeGeometryComponent;
