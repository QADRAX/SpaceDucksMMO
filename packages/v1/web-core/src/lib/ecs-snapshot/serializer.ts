import {
    Entity,
    type InspectorFieldConfig,
    type MaterialResourceKind,
    MATERIAL_RESOURCE_REF_KEY,
    MATERIAL_RESOURCE_KINDS,
} from '@duckengine/core';

import {
    ECS_SNAPSHOT_SCHEMA_VERSION,
    type EcsTreeSnapshot,
    type EcsEntityNodeSnapshot,
} from './schema';

/**
 * Options for serializing an ECS tree.
 */
export type SerializeEcsTreeOptions = {
    /**
     * If true (default), forces all provided roots to have parentId = null.
     * This is the desired behavior when exporting a prefab from a sub-tree.
     */
    detachRoots?: boolean;
};

/**
 * Converts a vector object {x, y, z} to a tuple format [x, y, z].
 * @param v The vector object.
 * @returns Three-element number tuple.
 */
function vecToTuple(v: { x: number; y: number; z: number }): [number, number, number] {
    return [v.x, v.y, v.z];
}

/**
 * Checks if a value is a plain JavaScript object (not an array or null).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Recursively converts a value to a JSON-safe format, handling circular references and non-JSON types.
 * @param value value to sanitize
 * @param visited set of visited objects to detect cycles
 */
function toJsonSafeValue(value: unknown, visited: WeakSet<object>): unknown {
    if (value === null) return null;

    const t = typeof value;
    if (t === 'string' || t === 'boolean') return value;

    if (t === 'number') {
        if (!Number.isFinite(value)) return null;
        return value;
    }

    if (t === 'undefined') return undefined;
    if (t === 'function' || t === 'symbol' || t === 'bigint') return undefined;

    if (Array.isArray(value)) {
        const out: unknown[] = [];
        for (const item of value) {
            const next = toJsonSafeValue(item, visited);
            // In arrays, undefined becomes null when JSON stringifying; keep explicit null.
            out.push(next === undefined ? null : next);
        }
        return out;
    }

    if (isPlainObject(value)) {
        if (visited.has(value)) return '[Circular]';
        visited.add(value);

        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            const next = toJsonSafeValue(v, visited);
            if (next === undefined) continue;
            out[k] = next;
        }
        return out;
    }

    // Unknown non-plain object (Date, class instance, etc.).
    // Best-effort: stringify.
    try {
        return String(value);
    } catch {
        return undefined;
    }
}

/**
 * Extracts serializable data from a component based on its inspector metadata.
 * Special handling for resource-backed materials to store only the resource reference.
 * 
 * @param comp The component instance.
 * @returns A generic data object.
 */
function extractComponentData(comp: any): Record<string, unknown> {
    const visited = new WeakSet<object>();

    // Editor-only extension: allow resource-backed materials to be persisted as a reference.
    // This avoids storing expanded material params in the scene snapshot and enables resolving
    // the active resource version when the scene is loaded.
    try {
        const type = String(comp?.type ?? '') as MaterialResourceKind;
        const key = (comp as any)?.[MATERIAL_RESOURCE_REF_KEY];

        // We can use the array from ECS to check validity
        if (MATERIAL_RESOURCE_KINDS.includes(type) && typeof key === 'string' && key.trim().length > 0) {
            return { [MATERIAL_RESOURCE_REF_KEY]: key.trim() };
        }
    } catch {
        // ignore
    }

    const inspectorFields: InspectorFieldConfig<any, unknown>[] =
        comp?.metadata?.inspector?.fields ?? [];

    const data: Record<string, unknown> = {};

    if (Array.isArray(inspectorFields) && inspectorFields.length > 0) {
        for (const f of inspectorFields) {
            const key = String(f.key);
            let raw: unknown;
            try {
                raw = typeof f.get === 'function' ? f.get(comp) : (comp as any)[key];
            } catch {
                continue;
            }
            const safe = toJsonSafeValue(raw, visited);
            if (safe === undefined) continue;
            data[key] = safe;
        }
        return data;
    }

    // Fallback: serialize enumerable own props, skipping known internals.
    const skip = new Set(['type', 'metadata', 'observers', 'entityId']);

    for (const [k, v] of Object.entries(comp ?? {})) {
        if (skip.has(k)) continue;
        const safe = toJsonSafeValue(v, visited);
        if (safe === undefined) continue;
        data[k] = safe;
    }

    return data;
}

/**
 * Helper to collect all entities in a subtree (recursive).
 */
function collectSubtree(root: Entity, out: Entity[], visited: Set<string>): void {
    if (visited.has(root.id)) return;
    visited.add(root.id);
    out.push(root);
    for (const child of root.getChildren()) {
        collectSubtree(child, out, visited);
    }
}

/**
 * Serializes a list of root entities (and their descendants) into an ECS Tree Snapshot.
 * 
 * @param roots List of root entities to serialize.
 * @param options Serialization options.
 * @returns {EcsTreeSnapshot} The serialized tree.
 */
export function serializeEcsTreeFromRoots(
    roots: Entity[],
    options: SerializeEcsTreeOptions = {}
): EcsTreeSnapshot {
    const detachRoots = options.detachRoots ?? true;

    const ordered: Entity[] = [];
    const visited = new Set<string>();
    for (const r of roots) collectSubtree(r, ordered, visited);

    const rootIds = roots.map((r) => r.id);
    const rootSet = new Set(rootIds);

    const entities: EcsEntityNodeSnapshot[] = ordered.map((e) => {
        const parentId = detachRoots && rootSet.has(e.id) ? null : e.parent?.id ?? null;

        return {
            id: e.id,
            displayName: e.displayName ? e.displayName : undefined,
            gizmoIcon: e.gizmoIcon,
            parentId,
            transform: {
                position: vecToTuple(e.transform.localPosition),
                rotation: vecToTuple(e.transform.localRotation),
                scale: vecToTuple(e.transform.localScale),
            },
            components: e
                .getAllComponents()
                .filter((c) => c.type !== 'name')
                .map((c) => ({ type: c.type, data: extractComponentData(c) })),
        };
    });

    return {
        schemaVersion: ECS_SNAPSHOT_SCHEMA_VERSION,
        rootIds,
        entities,
    };
}
