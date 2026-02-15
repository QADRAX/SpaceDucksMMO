import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class SphereGeometryComponent extends BaseGeometryComponent {
  readonly type = "sphereGeometry";
  readonly metadata: ComponentMetadata = {
    type: "sphereGeometry",
    label: "Sphere Geometry",
    description: "Creates a spherical shape. Maps to THREE.SphereGeometry.",
    category: "Rendering",
    icon: "Circle",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "radius",
          label: "Radius",
          description: "The radius of the sphere.",
          type: "number",
          nullable: false,
          default: 1,
          min: 0.01,
          max: 100,
          step: 0.01,
          get: (c: SphereGeometryComponent) => c.radius,
          set: (c, v) => {
            c.radius = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "widthSegments",
          label: "Width Segments",
          description: "Number of horizontal segments. Higher values create smoother spheres.",
          type: "number",
          nullable: false,
          default: 32,
          min: 3,
          max: 128,
          step: 1,
          get: (c: SphereGeometryComponent) => c.widthSegments,
          set: (c, v) => {
            c.widthSegments = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "heightSegments",
          label: "Height Segments",
          description: "Number of vertical segments. Higher values create smoother spheres.",
          type: "number",
          nullable: false,
          default: 16,
          min: 2,
          max: 128,
          step: 1,
          get: (c: SphereGeometryComponent) => c.heightSegments,
          set: (c, v) => {
            c.heightSegments = Number(v);
            c.notifyChanged();
          }
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
