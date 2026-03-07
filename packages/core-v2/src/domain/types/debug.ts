/**
 * Debug visualization category.
 * Built-in kinds are 'transform', 'mesh', 'collider', and 'camera'.
 * Custom string values are allowed for engine extensions.
 */
export type DebugKind = 'transform' | 'mesh' | 'collider' | 'camera' | (string & {});
