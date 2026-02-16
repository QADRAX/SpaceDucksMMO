import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class ConeGeometryComponent extends BaseGeometryComponent {
  readonly type = "coneGeometry";
  readonly metadata: ComponentMetadata = {
    type: "coneGeometry",
    label: "Cone Geometry",
    description: "Creates a conical shape. Maps to THREE.ConeGeometry.",
    category: "Rendering",
    icon: "Triangle",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "radius",
          label: "Radius",
          description: "The radius of the cone base.",
          type: "number",
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
          description: "The height of the cone along the Y-axis.",
          type: "number",
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
          description: "Number of segments around the base circumference. Higher values create smoother cones.",
          type: "number",
          default: 16,
          get: (c: ConeGeometryComponent) => c.radialSegments,
          set: (c, v) => {
            c.radialSegments = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "castShadow",
          label: "Cast Shadow",
          description: "Whether this mesh should cast shadows onto other meshes.",
          type: "boolean",
          default: false,
          get: (c: ConeGeometryComponent) => c.castShadow,
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
          get: (c: ConeGeometryComponent) => c.receiveShadow,
          set: (c, v) => {
            c.receiveShadow = Boolean(v);
            c.notifyChanged();
          },
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
    castShadow?: boolean;
    receiveShadow?: boolean;
  }) {
    super();
    this.radius = params?.radius ?? 0.5;
    this.height = params?.height ?? 1;
    this.radialSegments = params?.radialSegments ?? 16;

    this.castShadow = params?.castShadow ?? false;
    this.receiveShadow = params?.receiveShadow ?? true;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // use base radius and account for scale
    return this.radius * (worldScale?.x ?? 1);
  }
}

export default ConeGeometryComponent;
