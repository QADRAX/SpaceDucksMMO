import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class BoxGeometryComponent extends BaseGeometryComponent {
  readonly type = "boxGeometry";
  readonly metadata: ComponentMetadata = {
    type: "boxGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "width",
          label: "Width",
          type: "number",
          default: 1,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c: BoxGeometryComponent) => c.width,
          set: (c, v) => {
            c.width = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "height",
          label: "Height",
          type: "number",
          default: 1,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c: BoxGeometryComponent) => c.height,
          set: (c, v) => {
            c.height = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "depth",
          label: "Depth",
          type: "number",
          default: 1,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c: BoxGeometryComponent) => c.depth,
          set: (c, v) => {
            c.depth = Number(v);
            c.notifyChanged();
          }
        },
      ],
    },
  };

  width: number;
  height: number;
  depth: number;

  constructor(params?: { width?: number; height?: number; depth?: number }) {
    super();
    this.width = params?.width ?? 1;
    this.height = params?.height ?? 1;
    this.depth = params?.depth ?? 1;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // Diagonal / 2, scaled by X (legacy code used worldScale.x)
    const diag =
      Math.sqrt(
        this.width * this.width +
          this.height * this.height +
          this.depth * this.depth
      ) / 2;
    return diag * (worldScale?.x ?? 1);
  }
}

export default BoxGeometryComponent;
