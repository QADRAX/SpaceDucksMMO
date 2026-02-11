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
        {
          key: "key",
          label: "Mesh Key",
          type: "string",
          description:
            "Resource key for a custom mesh (web-core resource key). Expected format: single-mesh GLB profile.",
          default: "",
          get: (c: CustomGeometryComponent) => c.key,
          set: (c, v) => {
            c.key = String(v ?? "");
            c.notifyChanged();
          },
        },
        {
          key: "boundingRadius",
          label: "Bounding Radius",
          type: "number",
          nullable: true,
          description:
            "Optional override used by ECS-only features (e.g. Orbit). When omitted, a safe fallback is used until the mesh bounds are known.",
          min: 0.0001,
          step: 0.01,
          get: (c: CustomGeometryComponent) => c.boundingRadius,
          set: (c, v) => {
            const n = v === null || v === undefined || v === "" ? undefined : Number(v);
            c.boundingRadius = Number.isFinite(n as number) ? (n as number) : undefined;
            c.notifyChanged();
          },
        },
      ],
    },
  };

  key: string;
  /** Optional explicit bounding radius (in local units) for ECS-only consumers. */
  boundingRadius?: number;

  constructor(params?: { key?: string; boundingRadius?: number }) {
    super();
    this.key = params?.key ?? "";
    this.boundingRadius = params?.boundingRadius;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    const scale = worldScale?.x ?? 1;
    if (typeof this.boundingRadius === "number" && Number.isFinite(this.boundingRadius)) {
      return Math.max(0, this.boundingRadius) * scale;
    }

    // Unknown custom geometry -> fallback radius until the mesh bounds are known.
    return 1 * scale;
  }
}

export default CustomGeometryComponent;
