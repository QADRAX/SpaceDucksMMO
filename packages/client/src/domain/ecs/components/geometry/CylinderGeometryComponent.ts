import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class CylinderGeometryComponent extends BaseGeometryComponent {
  readonly type = "cylinderGeometry";
  readonly metadata: ComponentMetadata = {
    type: "cylinderGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        { key: "radiusTop", label: "Radius Top", max: 1000, min: 0.01, step: 0.01, default: 0.5 },
        { key: "radiusBottom", label: "Radius Bottom", max: 1000, min: 0.01, step: 0.01, default: 0.5 },
        { key: "height", label: "Height", max: 1000, min: 0.01, step: 0.01, default: 1 },
        { key: "radialSegments", label: "Radial Segments", default: 16 },
      ],
    },
  };

  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments?: number;

  constructor(params?: { radiusTop?: number; radiusBottom?: number; height?: number; radialSegments?: number }) {
    super();
    this.radiusTop = params?.radiusTop ?? 0.5;
    this.radiusBottom = params?.radiusBottom ?? 0.5;
    this.height = params?.height ?? 1;
    this.radialSegments = params?.radialSegments ?? 16;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    const maxRadius = Math.max(this.radiusTop, this.radiusBottom);
    const diag = Math.sqrt(maxRadius * maxRadius + (this.height / 2) * (this.height / 2));
    return diag * (worldScale?.x ?? 1);
  }
}

export default CylinderGeometryComponent;
