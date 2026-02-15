import type { z } from 'zod';

import {
  Entity,
  DefaultEcsComponentFactory,
  type Component,
  type InspectorFieldConfig,
} from '@duckengine/ecs';

import {
  ECS_SNAPSHOT_SCHEMA_VERSION,
  type EcsTreeSnapshot,
  type EcsEntityNodeSnapshot,
  type EcsComponentSnapshot,
  parseEcsTreeSnapshot,
} from '@/lib/ecsSnapshot';

export type SerializeEcsTreeOptions = {
  /**
   * If true (default), forces all provided roots to have parentId = null.
   * This is the desired behavior when exporting a prefab from a sub-tree.
   */
  detachRoots?: boolean;
};

function vecToTuple(v: { x: number; y: number; z: number }): [number, number, number] {
  return [v.x, v.y, v.z];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

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

function extractComponentData(comp: any): Record<string, unknown> {
  const visited = new WeakSet<object>();

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

function collectSubtree(root: Entity, out: Entity[], visited: Set<string>): void {
  if (visited.has(root.id)) return;
  visited.add(root.id);
  out.push(root);
  for (const child of root.getChildren()) {
    collectSubtree(child, out, visited);
  }
}

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

export type DeserializeEcsTreeResult = {
  entitiesById: Map<string, Entity>;
  roots: Entity[];
  activeCameraEntityId: string | null;
  errors: Array<{ entityId?: string; componentType?: string; message: string }>;
};

function applyComponentDataWithInspector(comp: any, data: Record<string, unknown>): void {
  const fields: InspectorFieldConfig<any, unknown>[] = comp?.metadata?.inspector?.fields ?? [];
  const byKey = new Map<string, InspectorFieldConfig<any, unknown>>();
  for (const f of fields) byKey.set(String(f.key), f);

  for (const [key, raw] of Object.entries(data)) {
    const cfg = byKey.get(key);
    if (cfg?.set) {
      try {
        cfg.set(comp, raw);
        continue;
      } catch {
        // fallthrough to direct assignment
      }
    }

    try {
      (comp as any)[key] = raw;
    } catch {
      // ignore
    }
  }

  // Ensure change notification for UI systems.
  try {
    comp?.notifyChanged?.();
  } catch {
    // ignore
  }
}

function coerceComponentDataToRecord(data: unknown): Record<string, unknown> {
  return isPlainObject(data) ? (data as Record<string, unknown>) : {};
}

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

export function deserializeEcsTreeSnapshotToEntities(
  snapshotInput: unknown,
  opts?: {
    /**
     * If true (default), throws when snapshot schema is invalid.
     * If false, returns errors.
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
