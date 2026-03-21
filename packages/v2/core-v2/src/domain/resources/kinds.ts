/**
 * A resource kind maps 1:1 with a component type that can be persisted
 * as a resource in the API. Each kind has a defined set of scalar attributes
 * (ResourceData<K>) and named file slots (FileSlotsFor<K>).
 */
export type ResourceKind =
    // ── Materials ────────────────────────────────────────────────
    | 'standardMaterial'
    | 'basicMaterial'
    | 'phongMaterial'
    | 'lambertMaterial'
    // ── Custom Shader Materials ───────────────────────────────────
    | 'basicShaderMaterial'
    | 'standardShaderMaterial'
    | 'physicalShaderMaterial'
    // ── Geometry (mesh-only: vertices, indices; for customGeometry + trimeshCollider) ─
    | 'mesh'
    // ── Rigging / animation (resources consumed by skin + animator components) ─────
    | 'skeleton'
    | 'animationClip'
    // ── Environment ──────────────────────────────────────────────
    | 'skybox'       // Used by SkyboxComponent
    // ── Scripting ────────────────────────────────────────────────
    | 'script'       // Used by ScriptComponent
    // ── Standalone asset (referenced by materials per slot) ───────
    | 'texture';

/** All supported resource kinds as a constant array. */
export const RESOURCE_KINDS: readonly ResourceKind[] = [
    'standardMaterial',
    'basicMaterial',
    'phongMaterial',
    'lambertMaterial',
    'basicShaderMaterial',
    'standardShaderMaterial',
    'physicalShaderMaterial',
    'mesh',
    'skeleton',
    'animationClip',
    'skybox',
    'script',
    'texture',
];
