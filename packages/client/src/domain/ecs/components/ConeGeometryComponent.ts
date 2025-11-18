import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class ConeGeometryComponent extends BaseGeometryComponent {
  readonly type = "coneGeometry";
  readonly metadata: ComponentMetadata = {
    type: "coneGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        { key: "radius", label: "Radius" },
        { key: "height", label: "Height" },
        { key: "radialSegments", label: "Radial Segments" },
      ],
    },
  };

  radius: number;
  height: number;
  radialSegments?: number;

  constructor(params?: { radius?: number; height?: number; radialSegments?: number }) {
    super();
    this.radius = params?.radius ?? 0.5;
    this.height = params?.height ?? 1;
    this.radialSegments = params?.radialSegments ?? 16;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // use base radius and account for scale
    return this.radius * (worldScale?.x ?? 1);
  }
}

export default ConeGeometryComponent;
