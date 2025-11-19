import { Component } from "../../core/Component";
import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";

export class CustomGeometryComponent extends BaseGeometryComponent {
  readonly type = "customGeometry";
  readonly metadata: ComponentMetadata = {
    type: "customGeometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        { key: "key", label: "Key" },
      ],
    },
  };

  key: string;

  constructor(params?: { key?: string }) {
    super();
    this.key = params?.key ?? "";
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    // unknown custom geometry -> fallback radius
    return 1 * (worldScale?.x ?? 1);
  }
}

export default CustomGeometryComponent;
