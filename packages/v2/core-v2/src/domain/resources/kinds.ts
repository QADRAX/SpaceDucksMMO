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
    // ── Rigging / animation ─────────────────────────────────────────────────────
    | 'animationClip'
    // ── Environment ──────────────────────────────────────────────
    | 'skybox'       // Used by SkyboxComponent
    // ── Scripting ────────────────────────────────────────────────
    | 'script'       // Used by ScriptComponent
    // ── Standalone asset (referenced by materials per slot) ───────
    | 'texture';

/** All supported resource kinds as a constant array. */
export const RESOURCE_KINDS = [
    'standardMaterial',
    'basicMaterial',
    'phongMaterial',
    'lambertMaterial',
    'basicShaderMaterial',
    'standardShaderMaterial',
    'physicalShaderMaterial',
    'mesh',
    'animationClip',
    'skybox',
    'script',
    'texture',
] as const satisfies readonly ResourceKind[];

/** Classic PBR material kinds (albedo + optional maps in file slots). */
export const MATERIAL_RESOURCE_KINDS = [
    'basicMaterial',
    'lambertMaterial',
    'phongMaterial',
    'standardMaterial',
] as const satisfies readonly ResourceKind[];

export type MaterialResourceKind = (typeof MATERIAL_RESOURCE_KINDS)[number];

/** Shader material kinds (vertex + fragment sources in file slots). */
export const CUSTOM_SHADER_RESOURCE_KINDS = [
    'basicShaderMaterial',
    'standardShaderMaterial',
    'physicalShaderMaterial',
] as const satisfies readonly ResourceKind[];

export type CustomShaderResourceKind = (typeof CUSTOM_SHADER_RESOURCE_KINDS)[number];
