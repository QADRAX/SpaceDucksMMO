export interface ResolvedAsset {
    kind: string; // The component type (e.g., "standardMaterial")
    data: any;    // The component properties (texture URLs, scalar values, etc.)
}

/**
 * Interface for resolving high-level catalog resources into core ECS component data.
 * This is implemented outside of 'core' (e.g., in 'web-core') and injected 
 * into the ScriptSystem to remain decoupled from catalog logic.
 */
export interface AssetResolver {
    resolve(key: string): Promise<ResolvedAsset | null>;
}
