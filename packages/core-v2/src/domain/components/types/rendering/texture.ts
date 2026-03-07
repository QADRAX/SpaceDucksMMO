import type { ComponentBase } from '../core';

/** UV tiling and offset controls for material textures. */
export interface TextureTilingComponent extends ComponentBase<'textureTiling'> {
  repeatU: number;
  repeatV: number;
  offsetU: number;
  offsetV: number;
}
