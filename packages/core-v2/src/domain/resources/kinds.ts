/**
 * Supported resource kinds in the engine.
 * Maps to web-core resource kinds.
 */
export type ResourceKind = 'texture' | 'mesh' | 'skybox' | 'script' | 'shader';

/**
 * List of all supported resource kinds.
 * Useful for validation and iteration.
 */
export const RESOURCE_KINDS: readonly ResourceKind[] = [
    'texture',
    'mesh',
    'skybox',
    'script',
    'shader',
];
