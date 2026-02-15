import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class PlaneGeometryComponent extends BaseGeometryComponent {
  readonly type = "planeGeometry";
  readonly metadata: ComponentMetadata = {
    type: "planeGeometry",
    label: "Plane Geometry",
    description: "Creates a flat rectangular surface. Maps to THREE.PlaneGeometry.",
    category: "Rendering",
    icon: "Square",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "width",
          label: "Width",
          description: "The width of the plane along the X-axis.",
          type: "number",
          default: 1,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c: PlaneGeometryComponent) => c.width,
          set: (c, v) => {
            c.width = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "height",
          label: "Height",
          description: "The height of the plane along the Y-axis.",
          type: "number",
          default: 1,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c: PlaneGeometryComponent) => c.height,
          set: (c, v) => {
            c.height = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "widthSegments",
          label: "Width Segments",
          description: "Number of horizontal segments. Higher values allow for more detailed deformation.",
          type: "number",
          default: 1,
          min: 1,
          max: 128,
          step: 1,
          get: (c: PlaneGeometryComponent) => c.widthSegments,
          set: (c, v) => {
            c.widthSegments = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "heightSegments",
          label: "Height Segments",
          description: "Number of vertical segments. Higher values allow for more detailed deformation.",
          type: "number",
          default: 1,
          min: 1,
          max: 128,
          step: 1,  
          get: (c: PlaneGeometryComponent) => c.heightSegments,
          set: (c, v) => {
            c.heightSegments = Number(v);
            c.notifyChanged();
          }
        },
      ],
    },
  };

  width: number;
  height: number;
  widthSegments?: number;
  heightSegments?: number;

  constructor(params?: {
    width?: number;
    height?: number;
    widthSegments?: number;
    heightSegments?: number;
  }) {
    super();
    this.width = params?.width ?? 1;
    this.height = params?.height ?? 1;
    this.widthSegments = params?.widthSegments ?? 1;
    this.heightSegments = params?.heightSegments ?? 1;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // approximate as half the diagonal of the plane
    const diag =
      Math.sqrt(this.width * this.width + this.height * this.height) / 2;
    return diag * (worldScale?.x ?? 1);
  }
}

export default PlaneGeometryComponent;
