/** Branded type for Entity identifiers. */
export type EntityId = string & { readonly __brand: 'EntityId' };

/** Branded type for Scene identifiers. */
export type SceneId = string & { readonly __brand: 'SceneId' };

/** Branded type for Viewport identifiers. */
export type ViewportId = string & { readonly __brand: 'ViewportId' };

/** Branded type for Script instance identifiers. */
export type InstanceId = string & { readonly __brand: 'InstanceId' };

/** Branded type for Canvas identifiers. */
export type CanvasId = string & { readonly __brand: 'CanvasId' };

/** Branded type for Resource identifiers. */
export type ResourceKey = string & { readonly __brand: 'ResourceKey' };

/** Factory to create a branded EntityId. */
export function createEntityId(id: string): EntityId {
    return id as EntityId;
}

/** Factory to create a branded SceneId. */
export function createSceneId(id: string): SceneId {
    return id as SceneId;
}

/** Factory to create a branded ViewportId. */
export function createViewportId(id: string): ViewportId {
    return id as ViewportId;
}

/** Factory to create a branded InstanceId. */
export function createInstanceId(id: string): InstanceId {
    return id as InstanceId;
}

/** Factory to create a branded CanvasId. */
export function createCanvasId(id: string): CanvasId {
    return id as CanvasId;
}

/** Factory to create a branded ResourceKey. */
export function createResourceKey(key: string): ResourceKey {
    return key as ResourceKey;
}
