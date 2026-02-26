import type { Entity } from "@duckengine/ecs";

export interface PrefabTemplate {
    rootIds: string[];
    entities: Map<string, Entity>;
}

/**
 * Registry for entity templates (prefabs) that can be instantiated at runtime.
 */
export interface IPrefabRegistry {
    /**
     * Registers a prefab template.
     */
    register(key: string, template: PrefabTemplate): void;

    /**
     * Creates new entity instances from a registered prefab.
     * Returns an array of new entities (root and all children).
     * The first element in rootIds will be the primary root.
     */
    instantiate(key: string, overrides?: {
        position?: [number, number, number],
        rotation?: [number, number, number],
        scale?: [number, number, number]
    }): Entity[];

    /**
     * Checks if a prefab ID is registered.
     */
    has(key: string): boolean;

    /**
     * Returns all registered prefab keys.
     */
    getKeys(): string[];
}
