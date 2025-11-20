import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export interface LensFlareElement {
  size: number;
  distance: number;
  opacity: number;
}

export class LensFlareComponent extends Component {
  readonly type = "lensFlare";
  readonly metadata: ComponentMetadata = {
    type: "lensFlare",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "intensity",
          label: "Intensity",
          get: (c: LensFlareComponent) => c.intensity,
          set: (c, v) => {
            c.intensity = Number(v);
          },
        },
        {
          key: "color",
          label: "Color",
          get: (c: LensFlareComponent) => c.color,
          set: (c, v) => {
            c.color = v as any;
          },
        },
        {
          key: "occlusionEnabled",
          label: "Occlusion",
          default: true,
          get: (c: LensFlareComponent) => c.occlusionEnabled,
          set: (c, v) => {
            c.occlusionEnabled = Boolean(v);
          },
        },
        {
          key: "flareElements",
          label: "Elements",
          get: (c: LensFlareComponent) => c.flareElements,
        },
      ],
    },
  };
  intensity: number;
  color: [number, number, number];
  flareElements: LensFlareElement[];
  occlusionEnabled: boolean;
  constructor(params: {
    intensity: number;
    color: [number, number, number];
    flareElements: LensFlareElement[];
    occlusionEnabled?: boolean;
  }) {
    super();
    this.intensity = params.intensity;
    this.color = params.color;
    this.flareElements = params.flareElements;
    this.occlusionEnabled = params.occlusionEnabled ?? true;
  }
}

export default LensFlareComponent;
