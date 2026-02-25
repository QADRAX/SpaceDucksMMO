import type { z } from 'zod';

import {
    Entity,
    DefaultEcsComponentFactory,
    type Component,
} from '@duckengine/ecs';

import {
    type EcsTreeSnapshot,
    type EcsComponentSnapshot,
    parseEcsTreeSnapshot,
} from './schema';

import { applyComponentDataWithInspector } from './inspector';

/**
 * Result object returned by deserializeEcsTreeSnapshotToEntities.
 */
export type DeserializeEcsTreeResult = {
    /** Map of all created entities by their ID. */
    entitiesById: Map<string, Entity>;
    /** List of root entities found in the snapshot. */
    roots: Entity[];
    /** ID of the active camera, if specified in the snapshot. */
    activeCameraEntityId: string | null;
    /** List of errors encountered during deserialization. */
    errors: Array<{ entityId?: string; componentType?: string; message: string }>;
};

/**
 * Checks if a value is a plain JavaScript object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Coerces unknown input to a record object. Returns empty object if input is invalid.
 */
function coerceComponentDataToRecord(data: unknown): Record<string, unknown> {
    return isPlainObject(data) ? (data as Record<string, unknown>) : {};
}

/**
 * Internal helper to create a component from a snapshot and attach it to an entity.
 */
function createAndAttachComponent(
    entity: Entity,
    componentSnap: EcsComponentSnapshot,
    factory: DefaultEcsComponentFactory,
    errors: DeserializeEcsTreeResult['errors']
): void {
    const type = componentSnap.type;
    const data = coerceComponentDataToRecord(componentSnap.data);

    let comp: Component;
    try {
        // Factory is metadata-driven and covers the known component set.
        comp = factory.create(type as any, data);
    } catch {
        errors.push({
            entityId: entity.id,
            componentType: type,
            message: `Unknown or unsupported component type '${type}'`,
        });
        return;
    }

    try {
        applyComponentDataWithInspector(comp as any, data);
    } catch {
        // ignore (best-effort)
    }

    const res = entity.safeAddComponent(comp as any);
    if (!res.ok) {
        errors.push({
            entityId: entity.id,
            componentType: type,
            message: res.error.message,
        });
    }
}

/**
 * Deserializes an ECS Tree Snapshot into live Entity instances.
 * 
 * @param snapshotInput The raw snapshot object (will be validated).
 * @param opts Configuration options.
 * @returns {DeserializeEcsTreeResult} The result containing entities and any errors.
 */
export function deserializeEcsTreeSnapshotToEntities(
    snapshotInput: unknown,
    opts?: {
        /**
         * If true (default), throws when snapshot schema is invalid.
         * If false, returns errors in the result object instead of throwing.
         */
        strict?: boolean;
    }
): DeserializeEcsTreeResult {
    const strict = opts?.strict ?? true;

    let snapshot: EcsTreeSnapshot;
    try {
        snapshot = parseEcsTreeSnapshot(snapshotInput);
    } catch (e) {
        if (strict) throw e;
        const zerr = e as z.ZodError;
        return {
            entitiesById: new Map(),
            roots: [],
            activeCameraEntityId: null,
            errors: [{ message: zerr?.message ?? 'Invalid snapshot' }],
        };
    }

    const errors: DeserializeEcsTreeResult['errors'] = [];
    const entitiesById = new Map<string, Entity>();
    const factory = new DefaultEcsComponentFactory();

    // 1) Create entities and attach components.
    for (const node of snapshot.entities) {
        const e = new Entity(node.id);

        if (typeof (node as any).displayName === 'string') e.displayName = (node as any).displayName;
        if (typeof (node as any).gizmoIcon === 'string') e.gizmoIcon = (node as any).gizmoIcon;

        try {
            const p = node.transform.position;
            e.transform.setPosition(p[0], p[1], p[2]);
            const r = node.transform.rotation;
            e.transform.setRotation(r[0], r[1], r[2]);
            const s = node.transform.scale;
            e.transform.setScale(s[0], s[1], s[2]);
        } catch {
            errors.push({ entityId: node.id, message: 'Failed to apply transform' });
        }

        entitiesById.set(node.id, e);

        for (const compSnap of node.components ?? []) {
            if (compSnap.type === 'name') {
                if (!e.displayName) {
                    const v = isPlainObject(compSnap.data) ? (compSnap.data as any).value : '';
                    if (typeof v === 'string' && v.trim()) e.displayName = v;
                }
                continue;
            }

            // --- LEGACY COMPONENT MIGRATION ---
            const legacyMaps: Record<string, string> = {
                'firstPersonMove': 'builtin://first_person_move.lua',
                'firstPersonPhysicsMove': 'builtin://first_person_physics_move.lua',
                'mouseLook': 'builtin://mouse_look.lua',
                'orbit': 'builtin://orbit_camera.lua',
                'lookAtEntity': 'builtin://look_at_entity.lua',
                'lookAtPoint': 'builtin://look_at_point.lua'
            };

            if (legacyMaps[compSnap.type]) {
                const scriptId = legacyMaps[compSnap.type];

                // Ensure entity has a ScriptComponent to hold the converted slot
                let sc = e.getComponent('script') as any;
                if (!sc) {
                    sc = factory.create('script' as any, {});
                    e.addComponent(sc);
                }

                // Push new slot using the data from the legacy component as properties
                sc.addSlot({
                    slotId: crypto.randomUUID(), // Assume crypto is available or we generate a simple UUID
                    scriptId: scriptId,
                    enabled: true,
                    executionOrder: sc.scripts.length, // Append to end
                    properties: coerceComponentDataToRecord(compSnap.data)
                });
                continue;
            }
            // ----------------------------------

            createAndAttachComponent(e, compSnap, factory, errors);
        }
    }

    // 2) Apply hierarchy.
    for (const node of snapshot.entities) {
        if (!node.parentId) continue;
        const child = entitiesById.get(node.id);
        const parent = entitiesById.get(node.parentId);
        if (!child || !parent) continue;

        try {
            parent.addChild(child);
        } catch {
            errors.push({ entityId: node.id, message: `Failed to attach to parent '${node.parentId}'` });
        }
    }

    const roots = snapshot.rootIds
        .map((id) => entitiesById.get(id) ?? null)
        .filter((e): e is Entity => Boolean(e));

    const activeCameraEntityId = snapshot.activeCameraEntityId ?? null;

    return { entitiesById, roots, activeCameraEntityId, errors };
}
