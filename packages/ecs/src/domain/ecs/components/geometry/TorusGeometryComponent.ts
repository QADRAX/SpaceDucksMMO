import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class TorusGeometryComponent extends BaseGeometryComponent {
  readonly type = "torusGeometry";
  readonly metadata: ComponentMetadata = {
    type: "torusGeometry",
    label: "Torus Geometry",
    description: "Creates a doughnut-shaped geometry. Maps to THREE.TorusGeometry.",
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
          description: "The radius from the center of the torus to the center of the tube.",
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
          description: "The radius of the tube itself.",
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
          description: "Number of segments along the radius of the torus.",
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
          description: "Number of segments around the circumference of the tube.",
          default: 48,
          get: (c: TorusGeometryComponent) => c.tubularSegments,
          set: (c, v) => {
            c.tubularSegments = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "castShadow",
          label: "Cast Shadow",
          description: "Whether this mesh should cast shadows onto other meshes.",
          type: "boolean",
          default: false,
          get: (c: TorusGeometryComponent) => c.castShadow,
          set: (c, v) => {
            c.castShadow = Boolean(v);
            c.notifyChanged();
          },
        },
        {
          key: "receiveShadow",
          label: "Receive Shadow",
          description: "Whether this mesh should receive shadows cast by other meshes.",
          type: "boolean",
          default: true,
          get: (c: TorusGeometryComponent) => c.receiveShadow,
          set: (c, v) => {
            c.receiveShadow = Boolean(v);
            c.notifyChanged();
          },
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
    castShadow?: boolean;
    receiveShadow?: boolean;
  }) {
    super();
    this.radius = params?.radius ?? 1;
    this.tube = params?.tube ?? 0.3;
    this.radialSegments = params?.radialSegments ?? 16;
    this.tubularSegments = params?.tubularSegments ?? 48;

    this.castShadow = params?.castShadow ?? false;
    this.receiveShadow = params?.receiveShadow ?? true;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // torus outer radius
    return (this.radius + this.tube) * (worldScale?.x ?? 1);
  }
}

export default TorusGeometryComponent;
