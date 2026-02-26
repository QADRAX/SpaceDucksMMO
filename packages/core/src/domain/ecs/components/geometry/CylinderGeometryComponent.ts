import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class CylinderGeometryComponent extends BaseGeometryComponent {
  readonly type = "cylinderGeometry";
  readonly metadata: ComponentMetadata = {
    type: "cylinderGeometry",
    label: "Cylinder Geometry",
    description: "Creates a cylindrical shape with optional tapered ends. Maps to THREE.CylinderGeometry.",
    category: "Rendering",
    icon: "Cylinder",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        {
          key: "radiusTop",
          label: "Radius Top",
          description: "The radius of the cylinder at the top.",
          type: "number",
          max: 1000,
          min: 0.01,
          step: 0.01,
          default: 0.5,
          get: (c: CylinderGeometryComponent) => c.radiusTop,
          set: (c, v) => {
            c.radiusTop = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "radiusBottom",
          label: "Radius Bottom",
          description: "The radius of the cylinder at the bottom.",
          type: "number",
          max: 1000,
          min: 0.01,
          step: 0.01,
          default: 0.5,
          get: (c: CylinderGeometryComponent) => c.radiusBottom,
          set: (c, v) => {
            c.radiusBottom = Number(v);
            c.notifyChanged();
          }
        },
        {
          key: "height",
          label: "Height",
          description: "The height of the cylinder along the Y-axis.",
          type: "number",
          max: 1000,
          min: 0.01,
          step: 0.01,
          default: 1,
          get: (c: CylinderGeometryComponent) => c.height,
          set: (c, v) => {
            c.height = Number(v);
            c.notifyChanged();
          }
        },
        { 
          key: "radialSegments", 
          label: "Radial Segments", 
          description: "Number of segments around the circumference. Higher values create smoother cylinders.",
          type: "number",
          default: 16,
          get: (c: CylinderGeometryComponent) => c.radialSegments,
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
          get: (c: CylinderGeometryComponent) => c.castShadow,
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
          get: (c: CylinderGeometryComponent) => c.receiveShadow,
          set: (c, v) => {
            c.receiveShadow = Boolean(v);
            c.notifyChanged();
          },
        },
      ],
    },
  };

  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments?: number;

  constructor(params?: {
    radiusTop?: number;
    radiusBottom?: number;
    height?: number;
    radialSegments?: number;
    castShadow?: boolean;
    receiveShadow?: boolean;
  }) {
    super();
    this.radiusTop = params?.radiusTop ?? 0.5;
    this.radiusBottom = params?.radiusBottom ?? 0.5;
    this.height = params?.height ?? 1;
    this.radialSegments = params?.radialSegments ?? 16;

    this.castShadow = params?.castShadow ?? false;
    this.receiveShadow = params?.receiveShadow ?? true;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    const maxRadius = Math.max(this.radiusTop, this.radiusBottom);
    const diag = Math.sqrt(
      maxRadius * maxRadius + (this.height / 2) * (this.height / 2)
    );
    return diag * (worldScale?.x ?? 1);
  }
}

export default CylinderGeometryComponent;
