import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class PlaneGeometryComponent extends BaseGeometryComponent {
  readonly type = "planeGeometry";
  readonly metadata: ComponentMetadata = {
    type: "planeGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        { key: "width", label: "Width" },
        { key: "height", label: "Height" },
        { key: "widthSegments", label: "Width Segments" },
        { key: "heightSegments", label: "Height Segments" },
      ],
    },
  };

  width: number;
  height: number;
  widthSegments?: number;
  heightSegments?: number;

  constructor(params?: { width?: number; height?: number; widthSegments?: number; heightSegments?: number }) {
    super();
    this.width = params?.width ?? 1;
    this.height = params?.height ?? 1;
    this.widthSegments = params?.widthSegments ?? 1;
    this.heightSegments = params?.heightSegments ?? 1;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // approximate as half the diagonal of the plane
    const diag = Math.sqrt(this.width * this.width + this.height * this.height) / 2;
    return diag * (worldScale?.x ?? 1);
  }
}

export default PlaneGeometryComponent;
