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
        { key: "radius", label: "Radius", min: 0.01, max: 1000, step: 0.01, default: 1 },
        { key: "tube", label: "Tube", min: 0.01, max: 1000, step: 0.01, default: 0.3 },
        { key: "radialSegments", label: "Radial Segments", default: 16 },
        { key: "tubularSegments", label: "Tubular Segments", default: 48 },
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
