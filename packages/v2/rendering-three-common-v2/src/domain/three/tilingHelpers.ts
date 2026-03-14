import type { TextureTilingComponent } from '@duckengine/core-v2';

/** Cache key so we only apply tiling when the component actually changed. */
export function tilingKey(comp: TextureTilingComponent): string {
  return `${comp.repeatU}:${comp.repeatV}:${comp.offsetU}:${comp.offsetV}`;
}
