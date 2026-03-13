import type { ComponentSpec } from '../../types/core';
import type { LensFlareComponent, LensFlareElement } from '../../types/rendering/effects';
const DEFAULT_FLARE_ELEMENTS: ReadonlyArray<LensFlareElement> = [
  { size: 0.7, distance: 0, color: '#ffffff', opacity: 0.9, texture: undefined },
  { size: 0.5, distance: 0.35, color: '#ffd080', opacity: 0.6, texture: undefined },
  { size: 0.35, distance: 0.75, color: '#80c0ff', opacity: 0.5, texture: undefined },
];

/** Lens flare spec. */
export const LENS_FLARE_SPEC: ComponentSpec<LensFlareComponent> = {
  metadata: {
    type: 'lensFlare',
    label: 'Lens Flare',
    category: 'Rendering',
    icon: 'Sun',
    unique: true,
    inspector: {
      fields: [
        { key: 'intensity', type: 'number', min: 0, step: 0.01 },
        { key: 'color', type: 'color' },
        { key: 'occlusionEnabled', label: 'Occlusion', type: 'boolean' },
        { key: 'viewDotMin', type: 'number', min: -1, max: 1, step: 0.01 },
        { key: 'viewDotMax', type: 'number', min: -1, max: 1, step: 0.01 },
        { key: 'centerFadeStart', type: 'number', min: 0, step: 0.01 },
        { key: 'centerFadeEnd', type: 'number', min: 0, step: 0.01 },
        { key: 'elementCount', type: 'number', min: 1, step: 1 },
        { key: 'baseElementSize', type: 'number', min: 0.01, step: 0.01 },
        { key: 'distanceSpread', type: 'number', min: 0, step: 0.01 },
        { key: 'axisAngleDeg', type: 'number', step: 0.1 },
        { key: 'screenOffsetX', type: 'number', step: 0.01 },
        { key: 'screenOffsetY', type: 'number', step: 0.01 },
        { key: 'scaleByVisibility', type: 'number', min: 0, max: 1, step: 0.01 },
        {
          key: 'flareElements',
          type: 'object',
          description: 'Read-only generated flare elements.',
        },
      ],
    },
  },
  defaults: {
    intensity: 1,
    color: '#ffffff',
    occlusionEnabled: true,
    flareElements: DEFAULT_FLARE_ELEMENTS,
    elementCount: 3,
    baseElementSize: 0.6,
    distanceSpread: 0.6,
    axisAngleDeg: 0,
    screenOffsetX: 0,
    screenOffsetY: 0,
    viewDotMin: -0.2,
    viewDotMax: 0.9,
    centerFadeStart: 0,
    centerFadeEnd: 1.4,
    scaleByVisibility: 0.5,
  },
};

/** All effect specs keyed by type. */
export const EFFECT_SPECS = {
  lensFlare: LENS_FLARE_SPEC,
};
