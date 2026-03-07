import type { ComponentBase } from '../core';

/** A single lens flare visual element along the flare axis. */
export interface LensFlareElement {
  size: number;
  distance: number;
  color: string;
  opacity: number;
  texture: string | undefined;
}

/** Lens flare rendering component. */
export interface LensFlareComponent extends ComponentBase<'lensFlare'> {
  intensity: number;
  color: string;
  occlusionEnabled: boolean;
  flareElements: ReadonlyArray<LensFlareElement>;
  elementCount: number;
  baseElementSize: number;
  distanceSpread: number;
  axisAngleDeg: number;
  screenOffsetX: number;
  screenOffsetY: number;
  viewDotMin: number;
  viewDotMax: number;
  centerFadeStart: number;
  centerFadeEnd: number;
  scaleByVisibility: number;
}
