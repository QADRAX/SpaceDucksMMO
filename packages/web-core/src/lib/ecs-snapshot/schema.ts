import { z } from 'zod';

/**
 * Current version of the ECS Snapshot Schema.
 * Incremented when breaking changes are introduced to the snapshot format.
 */
export const ECS_SNAPSHOT_SCHEMA_VERSION = 1 as const;

/**
 * Zod schema for a 3D vector tuple [x, y, z].
 */
export const Vec3TupleSchema = z.tuple([z.number(), z.number(), z.number()]);

/**
 * Type definition for a 3D vector tuple.
 */
export type Vec3Tuple = z.infer<typeof Vec3TupleSchema>;

/**
 * Zod schema for entity transform data (position, rotation, scale).
 */
export const EcsTransformSnapshotSchema = z
    .object({
        position: Vec3TupleSchema.default([0, 0, 0]),
        rotation: Vec3TupleSchema.default([0, 0, 0]),
        scale: Vec3TupleSchema.default([1, 1, 1]),
    })
    .strict();

/**
 * Type definition for entity transform snapshot.
 */
export type EcsTransformSnapshot = z.infer<typeof EcsTransformSnapshotSchema>;

/**
 * Zod schema for a generic component snapshot.
 * Stores the component type and a loosely typed data record.
 */
export const EcsComponentSnapshotSchema = z
    .object({
        type: z.string().min(1),
        // Component-specific JSON payload. We intentionally keep it untyped here.
        data: z.record(z.string(), z.unknown()).default({}),
    })
    .strict();

/**
 * Type definition for a component snapshot.
 */
export type EcsComponentSnapshot = z.infer<typeof EcsComponentSnapshotSchema>;

/**
 * Zod schema for a single entity node in the ECS tree.
 */
export const EcsEntityNodeSnapshotSchema = z
    .object({
        id: z.string().min(1),
        /** Optional human-friendly name for editors/debug gizmos. */
        displayName: z.string().optional(),
        /** Optional forced icon (emoji/text) for debug gizmos. */
        gizmoIcon: z.string().optional(),
        /** ID of the parent entity, or null if it's a root in this snapshot context. */
        parentId: z.string().min(1).nullable(),
        transform: EcsTransformSnapshotSchema,
        components: z.array(EcsComponentSnapshotSchema).default([]),
    })
    .strict();

/**
 * Type definition for an entity node snapshot.
 */
export type EcsEntityNodeSnapshot = z.infer<typeof EcsEntityNodeSnapshotSchema>;

/**
 * Zod schema for the entire ECS tree snapshot.
 * Includes versioning, root IDs, the flat list of entities, and optional metadata.
 */
export const EcsTreeSnapshotSchema = z
    .object({
        schemaVersion: z.literal(ECS_SNAPSHOT_SCHEMA_VERSION),

        /** Root entity ids for the snapshot (scene roots or prefab roots). */
        rootIds: z.array(z.string().min(1)).default([]),

        /** Flat list of nodes. Parent/child relationships are defined by parentId. */
        entities: z.array(EcsEntityNodeSnapshotSchema).default([]),

        /** Optional scene-only metadata. */
        activeCameraEntityId: z.string().min(1).nullable().optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
        const ids = new Set<string>();
        for (const [i, e] of value.entities.entries()) {
            if (ids.has(e.id)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Duplicate entity id: '${e.id}'`,
                    path: ['entities', i, 'id'],
                });
            }
            ids.add(e.id);
        }

        // Validate parent references exist.
        for (const [i, e] of value.entities.entries()) {
            if (e.parentId && !ids.has(e.parentId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Entity '${e.id}' has missing parentId '${e.parentId}'`,
                    path: ['entities', i, 'parentId'],
                });
            }
        }

        // Validate root ids exist.
        for (const [i, rootId] of value.rootIds.entries()) {
            if (!ids.has(rootId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `rootIds[${i}] references missing entity '${rootId}'`,
                    path: ['rootIds', i],
                });
            }
        }

        // Validate active camera entity exists if provided.
        if (value.activeCameraEntityId && !ids.has(value.activeCameraEntityId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `activeCameraEntityId references missing entity '${value.activeCameraEntityId}'`,
                path: ['activeCameraEntityId'],
            });
        }
    });

/**
 * Type definition for the full ECS tree snapshot.
 */
export type EcsTreeSnapshot = z.infer<typeof EcsTreeSnapshotSchema>;

/**
 * Creates a default empty ECS tree snapshot.
 * @returns {EcsTreeSnapshot} An empty snapshot with current schema version.
 */
export function createEmptyEcsTreeSnapshot(): EcsTreeSnapshot {
    return {
        schemaVersion: ECS_SNAPSHOT_SCHEMA_VERSION,
        rootIds: [],
        entities: [],
    };
}

/**
 * Parses and validates an input object against the ECS Tree Snapshot schema.
 * Throws if validation fails.
 * @param input The unknown input to parse.
 * @returns {EcsTreeSnapshot} The validated snapshot.
 */
export function parseEcsTreeSnapshot(input: unknown): EcsTreeSnapshot {
    return EcsTreeSnapshotSchema.parse(input);
}

/**
 * Safely parses an input object against the ECS Tree Snapshot schema.
 * @param input The unknown input to parse.
 * @returns {object} Result object with either data or error.
 */
export function safeParseEcsTreeSnapshot(input: unknown):
    | { ok: true; data: EcsTreeSnapshot }
    | { ok: false; error: z.ZodError } {
    const parsed = EcsTreeSnapshotSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error };
    return { ok: true, data: parsed.data };
}
