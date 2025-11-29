import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class TorusGeometryComponent extends BaseGeometryComponent {
  readonly type = "torusGeometry";
  readonly metadata: ComponentMetadata = {
    type: "torusGeometry",
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
          default: 1,
          get: (c: TorusGeometryComponent) => c.radius,
          set: (c, v) => {
            c.radius = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "tube",
          label: "Tube",
          min: 0.01,
          max: 1000,
          step: 0.01,
          default: 0.3,
          get: (c: TorusGeometryComponent) => c.tube,
          set: (c, v) => {
            c.tube = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "radialSegments",
          label: "Radial Segments",
          default: 16,
          get: (c: TorusGeometryComponent) => c.radialSegments,
          set: (c, v) => {
            c.radialSegments = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "tubularSegments",
          label: "Tubular Segments",
          default: 48,
          get: (c: TorusGeometryComponent) => c.tubularSegments,
          set: (c, v) => {
            c.tubularSegments = Number(v);
            c.notifyChanged();
          }
        },
      ],
    },
  };

  radius: number;
  tube: number;
  radialSegments?: number;
  tubularSegments?: number;

  constructor(params?: {
    radius?: number;
    tube?: number;
    radialSegments?: number;
    tubularSegments?: number;
  }) {
    super();
    this.radius = params?.radius ?? 1;
    this.tube = params?.tube ?? 0.3;
    this.radialSegments = params?.radialSegments ?? 16;
    this.tubularSegments = params?.tubularSegments ?? 48;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // torus outer radius
    return (this.radius + this.tube) * (worldScale?.x ?? 1);
  }
}

export default TorusGeometryComponent;
