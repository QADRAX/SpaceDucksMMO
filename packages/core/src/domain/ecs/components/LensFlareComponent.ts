import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export interface LensFlareElement {
  // Relative element size (multiplied by overall intensity). Typical values: 0.1 - 3.0
  size: number;
  // Distance along the flare axis in normalized screen-space units (-1..1).
  // 0 = at the light source, positive values move toward screen edge, negative move the other way.
  distance: number;
  // Element opacity (0..1).
  opacity: number;
}

export class LensFlareComponent extends Component {
  readonly type = "lensFlare";
  readonly metadata: ComponentMetadata = {
    type: "lensFlare",
    label: "Lens Flare",
    unique: true,
    requires: [],
    conflicts: [],
    description:
      "Lens flare visual effect. Elements are defined in relative units and rendered as sprites from the component's entity position.",
    category: "Rendering",
    icon: "Sun",
    inspector: {
      fields: [
        {
          key: "intensity",
          label: "Intensity",
          type: "number",
          default: 1,
          min: 0,
          max: 10,
          step: 0.1,
          description: "Global intensity multiplier for the flare (affects opacity).",
          get: (c: LensFlareComponent) => c.intensity,
          set: (c, v) => {
            c.intensity = Number(v);
          },
        },
        {
          key: "color",
          label: "Color",
          type: "color",
          default: "#ffffff",
          description: "Base color of the flare (hex #rrggbb).",
          get: (c: LensFlareComponent) => c.color,
          set: (c, v) => {
            c.color = String(v || "#ffffff");
          },
        },
        {
          key: "occlusionEnabled",
          label: "Occlusion",
          type: "boolean",
          default: true,
          description: "Enable simple occlusion test (raycast) between camera and source.",
          get: (c: LensFlareComponent) => c.occlusionEnabled,
          set: (c, v) => {
            c.occlusionEnabled = Boolean(v);
          },
        },
        // Camera reaction
        {
          key: "viewDotMin",
          label: "View Dot Min",
          type: "number",
          default: -0.2,
          min: -1,
          max: 1,
          step: 0.01,
          description: "Minimum camera–light alignment (dot) where the flare starts to appear.",
          get: (c: LensFlareComponent) => c.viewDotMin,
          set: (c, v) => {
            c.viewDotMin = Number(v);
          },
        },
        {
          key: "viewDotMax",
          label: "View Dot Max",
          type: "number",
          default: 0.9,
          min: -1,
          max: 1,
          step: 0.01,
          description: "Camera–light alignment (dot) at which the flare reaches full visibility.",
          get: (c: LensFlareComponent) => c.viewDotMax,
          set: (c, v) => {
            c.viewDotMax = Number(v);
          },
        },
        {
          key: "centerFadeStart",
          label: "Center Fade Start",
          type: "number",
          default: 0.0,
          min: 0,
          max: 2,
          step: 0.01,
          description: "NDC distance from center where center-based fading begins.",
          get: (c: LensFlareComponent) => c.centerFadeStart,
          set: (c, v) => {
            c.centerFadeStart = Number(v);
          },
        },
        {
          key: "centerFadeEnd",
          label: "Center Fade End",
          type: "number",
          default: 1.4,
          min: 0,
          max: 2,
          step: 0.01,
          description: "NDC distance from center where the flare is fully faded out.",
          get: (c: LensFlareComponent) => c.centerFadeEnd,
          set: (c, v) => {
            c.centerFadeEnd = Number(v);
          },
        },
        // Human-friendly controls
        {
          key: "elementCount",
          label: "Orb Count",
          type: "number",
          default: 3,
          min: 1,
          max: 8,
          step: 1,
          description: "Number of orbs (excluding the main glow).",
          get: (c: LensFlareComponent) => c.elementCount,
          set: (c, v) => {
            c.elementCount = Math.max(1, Math.min(8, Number(v) || 1));
            c.rebuildAutoElementsFromSettings();
          },
        },
        {
          key: "baseElementSize",
          label: "Base Element Size",
          type: "number",
          default: 0.6,
          min: 0.1,
          max: 3,
          step: 0.1,
          description: "Base size for each orb (sprite scale).",
          get: (c: LensFlareComponent) => c.baseElementSize,
          set: (c, v) => {
            c.baseElementSize = Math.max(0.1, Math.min(3, Number(v) || 0.6));
            c.rebuildAutoElementsFromSettings();
          },
        },
        {
          key: "distanceSpread",
          label: "Distance Spread",
          type: "number",
          default: 0.6,
          min: 0.1,
          max: 2.0,
          step: 0.05,
          description: "How far the orbs spread along the axis in NDC units.",
          get: (c: LensFlareComponent) => c.distanceSpread,
          set: (c, v) => {
            c.distanceSpread = Math.max(0.1, Math.min(2, Number(v) || 0.6));
            c.rebuildAutoElementsFromSettings();
          },
        },
        {
          key: "axisAngleDeg",
          label: "Axis Angle (deg)",
          type: "number",
          default: 0,
          min: -180,
          max: 180,
          step: 1,
          description: "Rotation of the flare axis in screen-space (degrees).",
          get: (c: LensFlareComponent) => c.axisAngleDeg,
          set: (c, v) => {
            c.axisAngleDeg = Number(v) || 0;
            c.rebuildAutoElementsFromSettings();
          },
        },
        {
          key: "screenOffsetX",
          label: "Screen Offset X",
          type: "number",
          default: 0,
          min: -1,
          max: 1,
          step: 0.01,
          description: "Desplazamiento horizontal en NDC (-1..1) aplicado a la proyección del origen del flare.",
          get: (c: LensFlareComponent) => c.screenOffsetX,
          set: (c, v) => {
            c.screenOffsetX = Number(v) || 0;
          },
        },
        {
          key: "screenOffsetY",
          label: "Screen Offset Y",
          type: "number",
          default: 0,
          min: -1,
          max: 1,
          step: 0.01,
          description: "Screen-space offset in NDC Y (-1..1) applied to the projected source.",
          get: (c: LensFlareComponent) => c.screenOffsetY,
          set: (c, v) => {
            c.screenOffsetY = Number(v) || 0;
          },
        },
        {
          key: "scaleByVisibility",
          label: "Scale By Visibility",
          type: "number",
          default: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
          description: "How much visibility affects sprite scale (0..1).",
          get: (c: LensFlareComponent) => c.scaleByVisibility,
          set: (c, v) => {
            c.scaleByVisibility = Number(v) ?? 0.5;
          },
        },
        {
          key: "flareElements",
          label: "Elements (advanced)",
          type: "object",
          default: [
            { size: 1.0, distance: 0.0, opacity: 1.0 },
          ],
          description:
            "(Advanced) Array of flare elements. Normally auto-generated from pattern controls.",
          get: (c: LensFlareComponent) => c.flareElements,
        },
      ],
    },
  };

  intensity: number;
  // color is stored as a CSS hex string '#rrggbb'
  color: string;
  flareElements: LensFlareElement[] = [];
  occlusionEnabled: boolean;
  // Human-friendly generator settings
  elementCount: number;
  baseElementSize: number;
  distanceSpread: number;
  axisAngleDeg: number;
  // Screen-space offset in NDC units (-1..1) applied to the projected source position
  screenOffsetX: number;
  screenOffsetY: number;
  // Camera reaction
  viewDotMin: number;
  viewDotMax: number;
  centerFadeStart: number;
  centerFadeEnd: number;
  scaleByVisibility: number;

  constructor(params: {
    intensity?: number;
    color?: string;
    flareElements?: LensFlareElement[];
    occlusionEnabled?: boolean;
    elementCount?: number;
    baseElementSize?: number;
    distanceSpread?: number;
    axisAngleDeg?: number;
    screenOffsetX?: number;
    screenOffsetY?: number;
    viewDotMin?: number;
    viewDotMax?: number;
    centerFadeStart?: number;
    centerFadeEnd?: number;
    scaleByVisibility?: number;
  } = {}) {
    super();
    this.intensity = params.intensity ?? 1;
    this.color = params.color ?? "#ffffff";
    this.elementCount = params.elementCount ?? 3;
    this.baseElementSize = params.baseElementSize ?? 0.6;
    this.distanceSpread = params.distanceSpread ?? 0.6;
    this.axisAngleDeg = params.axisAngleDeg ?? 0;
    this.screenOffsetX = params.screenOffsetX ?? 0;
    this.screenOffsetY = params.screenOffsetY ?? 0;
    this.viewDotMin = params.viewDotMin ?? -0.2;
    this.viewDotMax = params.viewDotMax ?? 0.9;
    this.centerFadeStart = params.centerFadeStart ?? 0.0;
    this.centerFadeEnd = params.centerFadeEnd ?? 1.4;
    this.scaleByVisibility = params.scaleByVisibility ?? 0.5;
    // If caller provided explicit flareElements, prefer it; otherwise generate from settings
    if (params.flareElements && params.flareElements.length > 0) {
      this.flareElements = params.flareElements;
    } else {
      this.rebuildAutoElementsFromSettings();
    }
    this.occlusionEnabled = params.occlusionEnabled ?? true;
  }

  // Generate a reasonable default set of flare elements from the human-friendly sliders.
  rebuildAutoElementsFromSettings() {
    const count = Math.max(1, Math.min(8, Math.floor(this.elementCount || 3)));
    const spread = this.distanceSpread ?? 0.6;
    const base = this.baseElementSize ?? 0.6;
    const elements: LensFlareElement[] = [];
    // Main glow at the source
    elements.push({ size: base * 1.6, distance: 0.0, opacity: 1.0 });
    // Generate additional orbs distributed along the axis. Alternate sides for visual variety.
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1); // 0..1
      const side = i % 2 === 0 ? 1 : -1;
      const distance = side * t * spread;
      const size = base * (1 - t * 0.5);
      const opacity = Math.max(0.15, 0.8 * (1 - t * 0.9));
      elements.push({ size, distance, opacity });
    }
    this.flareElements = elements;
  }
}

export default LensFlareComponent;
