import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class SphereGeometryComponent extends BaseGeometryComponent {
  readonly type = "sphereGeometry";
  readonly metadata: ComponentMetadata = {
    type: "sphereGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        { key: "radius", label: "Radius" },
        { key: "widthSegments", label: "Width Segments" },
        { key: "heightSegments", label: "Height Segments" },
      ],
    },
  };

  radius: number;
  widthSegments?: number;
  heightSegments?: number;

  constructor(params?: { radius?: number; widthSegments?: number; heightSegments?: number }) {
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
