import type { ComponentSpec } from '../../types/core';
import type { TextureTilingComponent } from '../../types/rendering/texture';

/** Texture tiling spec. */
export const TEXTURE_TILING_SPEC: ComponentSpec<TextureTilingComponent> = {
  metadata: {
    type: 'textureTiling',
    label: 'Texture Tiling',
    category: 'Rendering',
    icon: 'Grid3x3',
    unique: false,
    inspector: {
      fields: [
        { key: 'repeatU', label: 'Repeat U', type: 'number', step: 0.01 },
        { key: 'repeatV', label: 'Repeat V', type: 'number', step: 0.01 },
        { key: 'offsetU', label: 'Offset U', type: 'number', step: 0.01 },
        { key: 'offsetV', label: 'Offset V', type: 'number', step: 0.01 },
      ],
    },
  },
  defaults: { repeatU: 1, repeatV: 1, offsetU: 0, offsetV: 0 },
};

/** All texture specs keyed by type. */
export const TEXTURE_SPECS = {
  textureTiling: TEXTURE_TILING_SPEC,
};
