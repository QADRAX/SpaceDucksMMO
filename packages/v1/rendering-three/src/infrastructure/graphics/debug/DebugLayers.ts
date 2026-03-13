export const DEBUG_LAYERS = {
  transforms: 1,
  colliders: 2,
  mesh: 3,
  cameras: 4,
} as const;

export type DebugLayerKind = keyof typeof DEBUG_LAYERS;
