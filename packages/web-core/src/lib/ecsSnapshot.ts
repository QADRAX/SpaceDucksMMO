import { z } from 'zod';

export const ECS_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export const Vec3TupleSchema = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3Tuple = z.infer<typeof Vec3TupleSchema>;

export const EcsTransformSnapshotSchema = z
  .object({
    position: Vec3TupleSchema.default([0, 0, 0]),
    rotation: Vec3TupleSchema.default([0, 0, 0]),
    scale: Vec3TupleSchema.default([1, 1, 1]),
  })
  .strict();

export type EcsTransformSnapshot = z.infer<typeof EcsTransformSnapshotSchema>;

export const EcsComponentSnapshotSchema = z
  .object({
    type: z.string().min(1),
    // Component-specific JSON payload. We intentionally keep it untyped here.
    data: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

export type EcsComponentSnapshot = z.infer<typeof EcsComponentSnapshotSchema>;

export const EcsEntityNodeSnapshotSchema = z
  .object({
    id: z.string().min(1),
    parentId: z.string().min(1).nullable(),
    transform: EcsTransformSnapshotSchema,
    components: z.array(EcsComponentSnapshotSchema).default([]),
  })
  .strict();

export type EcsEntityNodeSnapshot = z.infer<typeof EcsEntityNodeSnapshotSchema>;

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

export type EcsTreeSnapshot = z.infer<typeof EcsTreeSnapshotSchema>;

export function createEmptyEcsTreeSnapshot(): EcsTreeSnapshot {
  return {
    schemaVersion: ECS_SNAPSHOT_SCHEMA_VERSION,
    rootIds: [],
    entities: [],
  };
}

export function parseEcsTreeSnapshot(input: unknown): EcsTreeSnapshot {
  return EcsTreeSnapshotSchema.parse(input);
}

export function safeParseEcsTreeSnapshot(input: unknown):
  | { ok: true; data: EcsTreeSnapshot }
  | { ok: false; error: z.ZodError } {
  const parsed = EcsTreeSnapshotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error };
  return { ok: true, data: parsed.data };
}
